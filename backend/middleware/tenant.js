// backend/middleware/tenant.js
const { Pool } = require('pg');
const config = require('../config/database');

const pool = new Pool(config.postgres);

async function tenantMiddleware(req, res, next) {
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
}

module.exports = tenantMiddleware;