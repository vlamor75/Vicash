// backend/controllers/transactionController.js
const Transaction = require('../models/Transaction');

// Obtener todas las transacciones
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await req.db.query(
      `SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color
       FROM ${req.tenantSchema}.transactions t
       LEFT JOIN ${req.tenantSchema}.categories c ON t.category_id = c.id
       ORDER BY t.date DESC`
    );
    
    res.json(transactions.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// Crear una transacción
exports.createTransaction = async (req, res) => {
  const { amount, description, date, category_id } = req.body;
  
  if (!amount || !date || !category_id) {
    return res.status(400).json({ message: 'Amount, date and category are required' });
  }
  
  try {
    const result = await req.db.query(
      `INSERT INTO ${req.tenantSchema}.transactions (amount, description, date, category_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [amount, description, date, category_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
};