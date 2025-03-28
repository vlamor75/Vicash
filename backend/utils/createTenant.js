// backend/utils/createTenant.js
const { Pool } = require('pg');
const config = require('../config/database');

const pool = new Pool(config.postgres);

async function createTenant(name, domain, email) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Generate a safe schema name from the tenant name
    const schemaName = `tenant_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Create tenant record
    const tenantResult = await client.query(
      'INSERT INTO public.tenants (name, schema_name, domain) VALUES ($1, $2, $3) RETURNING id',
      [name, schemaName, domain]
    );
    
    const tenantId = tenantResult.rows[0].id;
    
    // Create tenant_user record
    await client.query(
      'INSERT INTO public.tenant_users (tenant_id, email, role) VALUES ($1, $2, $3)',
      [tenantId, email, 'admin']
    );
    
    // Create schema for tenant
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    // Clone base tables from template to new schema
    const tables = ['users', 'transactions'];
    
    for (const table of tables) {
      await client.query(`
        CREATE TABLE ${schemaName}.${table} (LIKE tenant_template.${table} INCLUDING ALL);
      `);
    }
    
    // Crear las nuevas tablas de categorías
    await client.query(`
      CREATE TABLE ${schemaName}.categorias_ingresos (LIKE tenant_template.categorias_ingresos INCLUDING ALL);
    `);
    
    await client.query(`
      CREATE TABLE ${schemaName}.categorias_egresos (LIKE tenant_template.categorias_egresos INCLUDING ALL);
    `);
    
    // Copiar las categorías predefinidas desde el template
    await client.query(`
      INSERT INTO ${schemaName}.categorias_ingresos
      SELECT * FROM tenant_template.categorias_ingresos;
    `);
    
    await client.query(`
      INSERT INTO ${schemaName}.categorias_egresos
      SELECT * FROM tenant_template.categorias_egresos;
    `);
    
    await client.query('COMMIT');
    
    return { tenantId, schemaName };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tenant:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = createTenant;