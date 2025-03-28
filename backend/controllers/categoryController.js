// backend/controllers/categoriasController.js
const axios = require('axios');

// URL base de tu nueva API
const API_URL = 'https://hg4r1p0fbj.execute-api.us-east-1.amazonaws.com/dev';

// Obtener todas las categorías de ingresos
exports.getCategoriasIngresos = async (req, res) => {
  try {
    // Obtener el tenant ID del usuario actual
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    
    // Llamar a la nueva API
    const response = await axios.get(`${API_URL}/income-categories`, {
      headers: { 'x-tenant-id': tenantId }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching income categories:', error);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error obteniendo categorías de ingresos' 
    });
  }
};

// Obtener todas las categorías de egresos
exports.getCategoriasEgresos = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    
    // Si ya implementaste la API para categorías de egresos, usa esa ruta
    const response = await axios.get(`${API_URL}/expense-categories`, {
      headers: { 'x-tenant-id': tenantId }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error obteniendo categorías de egresos' 
    });
  }
};

// Crear una categoría de ingreso
exports.createCategoriaIngreso = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    
    const response = await axios.post(`${API_URL}/income-categories`, req.body, {
      headers: { 
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating income category:', error);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error creando categoría de ingreso' 
    });
  }
};

// Crear una categoría de egreso
exports.createCategoriaEgreso = async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    
    const response = await axios.post(`${API_URL}/expense-categories`, req.body, {
      headers: { 
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      }
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating expense category:', error);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error creando categoría de egreso' 
    });
  }
};

// Actualizar una categoría de ingreso
exports.updateCategoriaIngreso = async (req, res) => {
  const { id } = req.params;
  
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    
    const response = await axios.put(`${API_URL}/income-categories/${id}`, req.body, {
      headers: { 
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error updating income category:', error);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error actualizando categoría de ingreso' 
    });
  }
};

// Actualizar una categoría de egreso
exports.updateCategoriaEgreso = async (req, res) => {
  const { id } = req.params;
  
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    
    const response = await axios.put(`${API_URL}/expense-categories/${id}`, req.body, {
      headers: { 
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error updating expense category:', error);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error actualizando categoría de egreso' 
    });
  }
};

// Eliminar una categoría de ingreso
exports.deleteCategoriaIngreso = async (req, res) => {
  const { id } = req.params;
  
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    
    const response = await axios.delete(`${API_URL}/income-categories/${id}`, {
      headers: { 'x-tenant-id': tenantId }
    });
    
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting income category:', error);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error eliminando categoría de ingreso' 
    });
  }
};

// Eliminar una categoría de egreso
exports.deleteCategoriaEgreso = async (req, res) => {
  const { id } = req.params;
  
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    
    const response = await axios.delete(`${API_URL}/expense-categories/${id}`, {
      headers: { 'x-tenant-id': tenantId }
    });
    
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    res.status(error.response?.status || 500).json({ 
      message: error.response?.data?.message || 'Error eliminando categoría de egreso' 
    });
  }
};