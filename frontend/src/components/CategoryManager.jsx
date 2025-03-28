// frontend/src/components/CategoryManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Button, Box, TextField, Select, MenuItem, 
  FormControl, InputLabel, Grid, Typography, 
  Card, CardContent, IconButton, Tabs, Tab
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL;
const API_CATEGORIES_URL = 'https://hg4r1p0fbj.execute-api.us-east-1.amazonaws.com/dev';
const TENANT_ID = localStorage.getItem('tenantId');

function CategoryManager() {
  const [categoriasIngresos, setCategoriasIngresos] = useState([]);
  const [categoriasEgresos, setCategoriasEgresos] = useState([]);
  const [tabValue, setTabValue] = useState(0); // 0 para ingresos, 1 para egresos
  const [newCategory, setNewCategory] = useState({
    nombre: '',
    descripcion: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    console.log('Iniciando fetch de categorías...');
    console.log('API_URL:', API_URL);
    console.log('TENANT_ID:', TENANT_ID);
    fetchCategoriasIngresos();
    fetchCategoriasEgresos();
  }, []);
  
  const fetchCategoriasIngresos = async () => {
    try {
      const response = await axios.get(`${API_CATEGORIES_URL}/income-categories`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      setCategoriasIngresos(response.data);
    } catch (error) {
      console.error('Error fetching categorias de ingresos:', error);
    }
  };


   const fetchCategoriasEgresos = async () => {
    try {
      const response = await axios.get(`${API_CATEGORIES_URL}/expense-categories`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      setCategoriasEgresos(response.data);
    } catch (error) {
      console.error('Error fetching categorias de egresos:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    resetForm();
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = tabValue === 0 ? 'income-categories' : 'expense-categories';
      
      if (editMode) {
        await axios.put(`${API_CATEGORIES_URL}/${endpoint}/${editId}`, newCategory, {
          headers: { 'x-tenant-id': TENANT_ID }
        });
      } else {
        await axios.post(`${API_CATEGORIES_URL}/${endpoint}`, newCategory, {
          headers: { 'x-tenant-id': TENANT_ID }
        });
      }
      
      resetForm();
      if (tabValue === 0) {
        fetchCategoriasIngresos();
      } else {
        fetchCategoriasEgresos();
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const startEdit = (category) => {
    setEditMode(true);
    setEditId(category.id);
    setNewCategory({
      nombre: category.nombre,
      descripcion: category.descripcion || ''
    });
  };

  const resetForm = () => {
    setNewCategory({
      nombre: '',
      descripcion: ''
    });
    setEditMode(false);
    setEditId(null);
  };

  const handleDelete = async (id) => {
    try {
      const endpoint = tabValue === 0 ? 'income-categories' : 'expense-categories';
      await axios.delete(`${API_CATEGORIES_URL}/${endpoint}/${id}`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      
      if (tabValue === 0) {
        fetchCategoriasIngresos();
      } else {
        fetchCategoriasEgresos();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      // Si el error es porque es una categoría predeterminada, mostrar mensaje
      if (error.response && error.response.status === 404) {
        alert('No se puede eliminar una categoría predeterminada');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Categorías
      </Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Categorías de Ingresos" />
        <Tab label="Categorías de Egresos" />
      </Tabs>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Nombre de categoría"
              value={newCategory.nombre}
              onChange={(e) => setNewCategory({...newCategory, nombre: e.target.value})}
              required
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={newCategory.descripcion}
              onChange={(e) => setNewCategory({...newCategory, descripcion: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button 
              variant="contained" 
              type="submit" 
              fullWidth
              sx={{ bgcolor: '#FFD700', color: 'black', '&:hover': { bgcolor: '#E6C300' } }}
            >
              {editMode ? 'Actualizar' : 'Crear'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Grid container spacing={2}>
        {(tabValue === 0 ? categoriasIngresos : categoriasEgresos).map(categoria => (
          <Grid item xs={12} sm={6} md={4} key={categoria.id}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6">
                      {categoria.nombre}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => startEdit(categoria)}>
                      <Edit />
                    </IconButton>
                    {!categoria.es_predeterminado && (
                      <IconButton size="small" onClick={() => handleDelete(categoria.id)}>
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                {categoria.descripcion && (
                  <Typography color="textSecondary">
                    {categoria.descripcion}
                  </Typography>
                )}
                {categoria.es_predeterminado && (
                  <Typography variant="caption" color="textSecondary">
                    Categoría predeterminada
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default CategoryManager;