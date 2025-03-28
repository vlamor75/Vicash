const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const categoriasController = require('./controllers/categoryController');

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // ⚠️ Ignoramos la verificación del certificado
  },
});

// Verificar conexión a la base de datos
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
  } else {
    console.log('Conexión a la base de datos establecida');
  }
});

// Middleware para tenant
const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  
  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant ID is required' });
  }
  
  try {
    const tenantResult = await pool.query(
      'SELECT schema_name FROM public.tenants WHERE id = $1',
      [tenantId]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    const schemaName = tenantResult.rows[0].schema_name;
    req.tenantSchema = schemaName;
    
    // Set current schema for this connection
    await pool.query(`SET search_path TO ${schemaName}, public`);
    req.db = pool;
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ message: 'Server error in tenant resolution' });
  }
};

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Vicash' });
});

// Ruta de prueba
app.get('/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Rutas de categorías (usando el controlador actualizado)
app.get('/api/categorias/ingresos', categoriasController.getCategoriasIngresos);
app.post('/api/categorias/ingresos', categoriasController.createCategoriaIngreso);
app.put('/api/categorias/ingresos/:id', categoriasController.updateCategoriaIngreso);
app.delete('/api/categorias/ingresos/:id', categoriasController.deleteCategoriaIngreso);

app.get('/api/categorias/egresos', categoriasController.getCategoriasEgresos);
app.post('/api/categorias/egresos', categoriasController.createCategoriaEgreso);
app.put('/api/categorias/egresos/:id', categoriasController.updateCategoriaEgreso);
app.delete('/api/categorias/egresos/:id', categoriasController.deleteCategoriaEgreso);

// Rutas de autenticación
app.post('/auth/register', async (req, res) => {
  const { name, email, password, domain } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
  }
  
  try {
    // Generar un nombre de esquema seguro basado en el email
    const schemaName = `tenant_${email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Verificar si el email ya está registrado
    const existingUser = await pool.query(
      'SELECT * FROM public.tenant_users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }
    
    // Crear registro de tenant
    const tenantResult = await pool.query(
      'INSERT INTO public.tenants (name, schema_name, domain, plan) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, schemaName, domain || '', 'basic']
    );
    
    const tenantId = tenantResult.rows[0].id;
    
    // Crear esquema para el tenant
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    // Crear tablas en el esquema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        color VARCHAR(7) DEFAULT '#FFD700',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.transactions (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        category_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear las tablas de categorías
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.categorias_ingresos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        es_predeterminado BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schemaName}.categorias_egresos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        es_predeterminado BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar categorías predeterminadas de ingresos
    const categoriasIngresos = [
      'Sueldo', 'Negocio', 'Ingreso residual', 'Freelance', 
      'Comisiones', 'Inversiones', 'Subsidios', 'Donaciones'
    ];

    for (const nombre of categoriasIngresos) {
      await pool.query(`
        INSERT INTO ${schemaName}.categorias_ingresos (nombre, es_predeterminado) 
        VALUES ($1, true)
      `, [nombre]);
    }

    // Insertar categorías predeterminadas de egresos
    const categoriasEgresos = [
      'Ahorros', 'Caridad', 'Celular', 'Comida por fuera', 'Créditos', 
      'Cuidado personal', 'Deudas', 'Donaciones', 'Educación', 'Entretenimiento', 
      'Gasolina', 'Personales', 'Imprevistos', 'Inversiones', 'Gimnasio', 
      'Mantenimiento hogar', 'Mercado', 'Salud', 'Seguros', 'Servicios agua', 
      'Servicios gas', 'Servicios internet', 'Servicios luz', 'TV Streaming',
      'Tarjeta de crédito', 'Transporte público', 'Vestuario', 'Vicash Suscripción',
      'Vivienda alquiler', 'Vivienda hipoteca'
    ];

    for (const nombre of categoriasEgresos) {
      await pool.query(`
        INSERT INTO ${schemaName}.categorias_egresos (nombre, es_predeterminado) 
        VALUES ($1, true)
      `, [nombre]);
    }
    
    // Insertar categorías predeterminadas (para compatibilidad con el código existente)
    const defaultCategories = [
      { name: 'Salario', type: 'income', color: '#4CAF50', is_default: true },
      { name: 'Inversiones', type: 'income', color: '#2196F3', is_default: true },
      { name: 'Freelance', type: 'income', color: '#9C27B0', is_default: true },
      { name: 'Vivienda', type: 'expense', color: '#F44336', is_default: true },
      { name: 'Alimentación', type: 'expense', color: '#FF9800', is_default: true },
      { name: 'Transporte', type: 'expense', color: '#795548', is_default: true },
      { name: 'Servicios', type: 'expense', color: '#607D8B', is_default: true },
      { name: 'Ocio', type: 'expense', color: '#E91E63', is_default: true }
    ];
    
    for (const category of defaultCategories) {
      await pool.query(`
        INSERT INTO ${schemaName}.categories (name, type, color, is_default) 
        VALUES ($1, $2, $3, $4)
      `, [category.name, category.type, category.color, category.is_default]);
    }
    
    // Crear usuario en el esquema del tenant
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userResult = await pool.query(`
      INSERT INTO ${schemaName}.users (email, password, first_name) 
      VALUES ($1, $2, $3) RETURNING id, email, first_name
    `, [email, hashedPassword, name]);
    
    // Crear registro en tenant_users
    await pool.query(
      'INSERT INTO public.tenant_users (tenant_id, email, role) VALUES ($1, $2, $3)',
      [tenantId, email, 'admin']
    );
    
    // Generar token
    const token = jwt.sign(
      { userId: userResult.rows[0].id, email, tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: {
        id: userResult.rows[0].id,
        email,
        firstName: name
      },
      tenantId,
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al crear cuenta: ' + error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }
  
  try {
    // Buscar el tenant para el usuario
    const tenantResult = await pool.query(
      `SELECT t.id, t.schema_name 
       FROM public.tenants t
       JOIN public.tenant_users tu ON t.id = tu.tenant_id
       WHERE tu.email = $1`,
      [email]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const { id: tenantId, schema_name: schemaName } = tenantResult.rows[0];
    
    // Buscar el usuario en el esquema del tenant
    const userResult = await pool.query(
      `SELECT id, email, password, first_name, last_name
       FROM ${schemaName}.users
       WHERE email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const user = userResult.rows[0];
    
    // Verificar password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      tenantId,
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en inicio de sesión' });
  }
});

// Rutas protegidas por tenant
const apiRouter = express.Router();
apiRouter.use(tenantMiddleware);

// Categorías
apiRouter.get('/categories', async (req, res) => {
  try {
    const categories = await req.db.query(
      `SELECT * FROM ${req.tenantSchema}.categories ORDER BY name`
    );
    
    res.json(categories.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

apiRouter.post('/categories', async (req, res) => {
  const { name, type, color } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type are required' });
  }
  
  try {
    const result = await req.db.query(
      `INSERT INTO ${req.tenantSchema}.categories (name, type, color) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, type, color || '#FFD700']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Transacciones
apiRouter.get('/transactions', async (req, res) => {
  try {
    // Obtenemos primero todas las transacciones
    const transactionsResult = await req.db.query(
      `SELECT t.* FROM ${req.tenantSchema}.transactions t ORDER BY t.date DESC`
    );
    
    // Para cada transacción, determinamos si es un ingreso o egreso y obtenemos el nombre de la categoría
    const transactions = await Promise.all(transactionsResult.rows.map(async (transaction) => {
      // Intentamos primero buscar en categorías de ingresos
      let categoryResult = await req.db.query(
        `SELECT nombre FROM ${req.tenantSchema}.categorias_ingresos WHERE id = $1`,
        [transaction.category_id]
      );
      
      if (categoryResult.rows.length > 0) {
        return {
          ...transaction,
          category_name: categoryResult.rows[0].nombre,
          category_type: 'income',
          category_color: '#4CAF50' // Color predeterminado para ingresos
        };
      }
      
      // Si no está en ingresos, buscamos en egresos
      categoryResult = await req.db.query(
        `SELECT nombre FROM ${req.tenantSchema}.categorias_egresos WHERE id = $1`,
        [transaction.category_id]
      );
      
      if (categoryResult.rows.length > 0) {
        return {
          ...transaction,
          category_name: categoryResult.rows[0].nombre,
          category_type: 'expense',
          category_color: '#F44336' // Color predeterminado para egresos
        };
      }
      
      // Si no encontramos la categoría en ninguna tabla
      return {
        ...transaction,
        category_name: 'Desconocido',
        category_type: transaction.amount > 0 ? 'income' : 'expense',
        category_color: transaction.amount > 0 ? '#4CAF50' : '#F44336'
      };
    }));
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

apiRouter.post('/transactions', async (req, res) => {
  const { amount, description, date, category_id, type } = req.body;
  
  if (!amount || !date || !category_id || !type) {
    return res.status(400).json({ message: 'Amount, date, category and type are required' });
  }
  
  try {
    // Verificamos que la categoría exista en la tabla correspondiente
    const tableToCheck = type === 'income' ? 'categorias_ingresos' : 'categorias_egresos';
    
    const categoryExists = await req.db.query(
      `SELECT id FROM ${req.tenantSchema}.${tableToCheck} WHERE id = $1`,
      [category_id]
    );
    
    if (categoryExists.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Insertar la transacción
    const result = await req.db.query(
      `INSERT INTO ${req.tenantSchema}.transactions (amount, description, date, category_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [amount, description, date, category_id]
    );
    
    // Obtener el nombre de la categoría para la respuesta
    const categoryResult = await req.db.query(
      `SELECT nombre FROM ${req.tenantSchema}.${tableToCheck} WHERE id = $1`,
      [category_id]
    );
    
    const transaction = {
      ...result.rows[0],
      category_name: categoryResult.rows[0].nombre,
      category_type: type,
      category_color: type === 'income' ? '#4CAF50' : '#F44336'
    };
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
});

apiRouter.put('/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, description, date, category_id, type } = req.body;
  
  if (!amount || !date || !category_id || !type) {
    return res.status(400).json({ message: 'Amount, date, category and type are required' });
  }
  
  try {
    // Verificamos que la categoría exista en la tabla correspondiente
    const tableToCheck = type === 'income' ? 'categorias_ingresos' : 'categorias_egresos';
    
    const categoryExists = await req.db.query(
      `SELECT id FROM ${req.tenantSchema}.${tableToCheck} WHERE id = $1`,
      [category_id]
    );
    
    if (categoryExists.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Actualizar la transacción
    const result = await req.db.query(
      `UPDATE ${req.tenantSchema}.transactions 
       SET amount = $1, description = $2, date = $3, category_id = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [amount, description, date, category_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Obtener el nombre de la categoría para la respuesta
    const categoryResult = await req.db.query(
      `SELECT nombre FROM ${req.tenantSchema}.${tableToCheck} WHERE id = $1`,
      [category_id]
    );
    
    const transaction = {
      ...result.rows[0],
      category_name: categoryResult.rows[0].nombre,
      category_type: type,
      category_color: type === 'income' ? '#4CAF50' : '#F44336'
    };
    
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
});

apiRouter.delete('/transactions/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await req.db.query(
      `DELETE FROM ${req.tenantSchema}.transactions WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
});

// Montar rutas API
app.use('/api', apiRouter);

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});