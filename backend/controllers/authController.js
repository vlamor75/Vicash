// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createTenant = require('../utils/createTenant');

// Crear tenant y registrar usuario
exports.register = async (req, res) => {
  const { name, email, password, domain } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  
  try {
    // Crear tenant
    const { tenantId, schemaName } = await createTenant(name, domain, email);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario en el esquema del tenant
    const userResult = await req.db.query(
      `INSERT INTO ${schemaName}.users (email, password, first_name) 
       VALUES ($1, $2, $3) RETURNING id, email, first_name`,
      [email, hashedPassword, name]
    );
    
    const user = userResult.rows[0];
    
    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name
      },
      tenantId,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering new user' });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Buscar el tenant para el usuario
    const tenantResult = await req.db.query(
      `SELECT t.id, t.schema_name 
       FROM public.tenants t
       JOIN public.tenant_users tu ON t.id = tu.tenant_id
       WHERE tu.email = $1`,
      [email]
    );
    
    if (tenantResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const { id: tenantId, schema_name: schemaName } = tenantResult.rows[0];
    
    // Buscar el usuario en el esquema del tenant
    const userResult = await req.db.query(
      `SELECT id, email, password, first_name, last_name
       FROM ${schemaName}.users
       WHERE email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Verificar password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};