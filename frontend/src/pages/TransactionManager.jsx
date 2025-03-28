// frontend/src/pages/TransactionManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentTenantId } from '../utils/tenantManager';
import { 
  Button, Box, TextField, Select, MenuItem, 
  FormControl, InputLabel, Grid, Typography, 
  IconButton, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, Tab, Tabs,
  Alert, Snackbar
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const API_CATEGORIES_URL = 'https://hg4r1p0fbj.execute-api.us-east-1.amazonaws.com/dev';
const API_TRANSACTIONS_URL = 'https://30j537tc1c.execute-api.us-east-1.amazonaws.com/dev/transaction';

function TransactionManager() {
  const [transactions, setTransactions] = useState([]);
  const [categoriasIngresos, setCategoriasIngresos] = useState([]);
  const [categoriasEgresos, setCategoriasEgresos] = useState([]);
  const [tabValue, setTabValue] = useState(0); // 0 para ingresos, 1 para egresos
  const [openDialog, setOpenDialog] = useState(false);
  const [transaction, setTransaction] = useState({
    amount: '',
    description: '',
    date: formatDate(new Date()),
    category_id: '',
    type: 'income'
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [loading, setLoading] = useState(false);

  // Función para formatear las fechas correctamente
  function formatDate(date) {
    if (!date) return '';
    
    if (typeof date === 'string') {
      // Si es una cadena ISO, convertirla a objeto Date
      if (date.includes('T')) {
        date = new Date(date);
      } else {
        // Si ya es un formato YYYY-MM-DD, devolverlo
        return date;
      }
    }
    
    // Asegurarse de que es un objeto Date
    if (!(date instanceof Date)) {
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    fetchTransactions();
    fetchCategoriasIngresos();
    fetchCategoriasEgresos();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const tenantId = getCurrentTenantId();
      console.log('Fetching transactions with tenant ID:', tenantId);
      
      const response = await fetch(API_TRANSACTIONS_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Error al cargar las transacciones');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriasIngresos = async () => {
    try {
      const tenantId = getCurrentTenantId();
      console.log('Fetching income categories with tenant ID:', tenantId);
      
      const response = await axios.get(`${API_CATEGORIES_URL}/income-categories`, {
        headers: { 'x-tenant-id': tenantId }
      });
      setCategoriasIngresos(response.data);
    } catch (error) {
      console.error('Error fetching categorias de ingresos:', error);
      setError('Error al cargar las categorías de ingresos');
      setOpenSnackbar(true);
    }
  };
  
  const fetchCategoriasEgresos = async () => {
    try {
      const tenantId = getCurrentTenantId();
      console.log('Fetching expense categories with tenant ID:', tenantId);
      
      const response = await axios.get(`${API_CATEGORIES_URL}/expense-categories`, {
        headers: { 'x-tenant-id': tenantId }
      });
      setCategoriasEgresos(response.data);
    } catch (error) {
      console.error('Error fetching categorias de egresos:', error);
      setError('Error al cargar las categorías de egresos');
      setOpenSnackbar(true);
    }
  };

  const handleOpenDialog = (type = 'income') => {
    setTabValue(type === 'income' ? 0 : 1);
    setTransaction({
      amount: '',
      description: '',
      date: formatDate(new Date()),
      category_id: '',
      type: type
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setTransaction({
      ...transaction,
      category_id: '',
      type: newValue === 0 ? 'income' : 'expense'
    });
  };
  
  // Función para validar que la categoría corresponda al tipo de transacción
  const validateCategoryType = (categoryId, type) => {
    if (!categoryId) return true;
    
    const categoryList = type === 'income' ? categoriasIngresos : categoriasEgresos;
    return categoryList.some(cat => parseInt(cat.id) === parseInt(categoryId));
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (!transaction.amount || !transaction.date || !transaction.category_id) {
        setError('Todos los campos marcados son obligatorios');
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }
      
      // Validar que el monto sea un número entero positivo
      const amount = parseInt(transaction.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('El monto debe ser un número entero positivo');
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }
      
      // Verificar que la categoría corresponda al tipo de transacción
      if (!validateCategoryType(transaction.category_id, transaction.type)) {
        setError(`La categoría seleccionada no corresponde al tipo de transacción ${transaction.type === 'income' ? 'ingreso' : 'egreso'}`);
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }
      
      // Encontrar la categoría exacta que queremos usar
      let categoryDetails = null;
      if (transaction.type === 'income') {
        categoryDetails = categoriasIngresos.find(cat => parseInt(cat.id) === parseInt(transaction.category_id));
      } else {
        categoryDetails = categoriasEgresos.find(cat => parseInt(cat.id) === parseInt(transaction.category_id));
      }
      
      if (!categoryDetails) {
        setError(`No se encontró la categoría seleccionada`);
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }
      
      console.log('Categoría seleccionada:', categoryDetails);
      
      // Crear el monto como negativo si es un egreso
      const finalAmount = transaction.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
      
      // Preparar los datos para que coincidan exactamente con lo que espera la API
      const data = {
        amount: finalAmount,
        description: transaction.description || '',
        date: formatDate(transaction.date),
        category_id: parseInt(transaction.category_id),
        // Incluir explícitamente info adicional para asegurar coherencia
        type: transaction.type // Asegurar que type coincida con category_type
      };
      
      console.log("Enviando datos a la API:", JSON.stringify(data));
      
      let url = API_TRANSACTIONS_URL;
      let method = 'POST';
      
      if (editMode) {
        url = `${API_TRANSACTIONS_URL}/${editId}`;
        method = 'PUT';
      }
      
      const tenantId = getCurrentTenantId();
      console.log('Sending transaction with tenant ID:', tenantId);
      
      // Usar fetch para la solicitud
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(data)
      });
      
      // Leer la respuesta como texto primero
      const responseText = await response.text();
      console.log("Respuesta completa:", responseText);
      
      let responseData;
      try {
        if (responseText) {
          responseData = JSON.parse(responseText);
          console.log("Respuesta parseada:", responseData);
        }
      } catch (e) {
        console.error("Error al parsear la respuesta:", e);
      }
      
      if (!response.ok) {
        throw new Error(responseData?.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      handleCloseDialog();
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError(`Error: ${error.message}`);
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };
   
  const resetForm = () => {
    setTransaction({
      amount: '',
      description: '',
      date: formatDate(new Date()),
      category_id: '',
      type: 'income'
    });
    setEditMode(false);
    setEditId(null);
    setError('');
  };
   
  const startEdit = async (item) => {
    try {
      setLoading(true);
      const tenantId = getCurrentTenantId();
      
      // Obtener los detalles actualizados de la transacción
      const response = await fetch(`${API_TRANSACTIONS_URL}/${item.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const transactionDetails = await response.json();
      
      setEditMode(true);
      setEditId(transactionDetails.id);
      
      // Determinar si es ingreso o egreso basado en el tipo de categoría
      const isIncome = transactionDetails.category_type === 'income';
      setTabValue(isIncome ? 0 : 1);
      
      // Establecer los valores para el formulario
      setTransaction({
        amount: Math.round(Math.abs(parseFloat(transactionDetails.amount))), // Convertir a entero positivo absoluto
        description: transactionDetails.description || '',
        date: formatDate(transactionDetails.date),
        category_id: transactionDetails.category_id,
        type: isIncome ? 'income' : 'expense'
      });
      
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      setError('Error al cargar los detalles de la transacción');
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };
   
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      try {
        setLoading(true);
        const tenantId = getCurrentTenantId();
        
        const response = await fetch(`${API_TRANSACTIONS_URL}/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': tenantId
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
        }
        
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setError('Error al eliminar la transacción');
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
   
  return (
    <Box sx={{ p: 3 }}>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Transacciones
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => handleOpenDialog('income')}
            sx={{ 
              bgcolor: '#4CAF50', 
              color: 'white', 
              '&:hover': { bgcolor: '#388E3C' },
              mr: 2
            }}
            disabled={loading}
          >
            Nuevo Ingreso
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => handleOpenDialog('expense')}
            sx={{ 
              bgcolor: '#F44336', 
              color: 'white', 
              '&:hover': { bgcolor: '#D32F2F' } 
            }}
            disabled={loading}
          >
            Nuevo Egreso
          </Button>
        </Box>
      </Box>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell>Fecha</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Cargando...</TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No hay transacciones registradas</TableCell>
              </TableRow>
            ) : (
              transactions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: item.category_type === 'income' ? '#4CAF50' : '#F44336',
                          display: 'inline-block',
                          mr: 1
                        }}
                      />
                      {item.category_name}
                    </Box>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: item.category_type === 'income' ? 'green' : 'red',
                      fontWeight: 'bold'
                    }}
                  >
                    {item.category_type === 'income' ? '+' : '-'}
                    ${Math.round(Math.abs(item.amount))}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => startEdit(item)} disabled={loading}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(item.id)} disabled={loading}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Dialog for adding/editing transactions */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editMode ? 'Editar Transacción' : 'Nueva Transacción'}</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab 
              label="Ingreso" 
              sx={{ 
                color: tabValue === 0 ? '#4CAF50' : 'inherit',
                '&.Mui-selected': { color: '#4CAF50' }
              }}
            />
            <Tab 
              label="Egreso" 
              sx={{ 
                color: tabValue === 1 ? '#F44336' : 'inherit',
                '&.Mui-selected': { color: '#F44336' }
              }}
            />
          </Tabs>
          
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Categoría *</InputLabel>
                  <Select
                    value={transaction.category_id}
                    label="Categoría *"
                    onChange={(e) => setTransaction({...transaction, category_id: e.target.value})}
                    required
                    disabled={loading}
                  >
                    {(tabValue === 0 ? categoriasIngresos : categoriasEgresos).map(categoria => (
                      <MenuItem key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Monto *"
                  type="number"
                  value={transaction.amount}
                  onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
                  required
                  inputProps={{ min: "1", step: "1" }}
                  helperText="Ingrese un valor entero positivo"
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha *"
                  value={transaction.date}
                  onChange={(e) => setTransaction({...transaction, date: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={transaction.description}
                  onChange={(e) => setTransaction({...transaction, description: e.target.value})}
                  multiline
                  rows={2}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>Cancelar</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{ 
              bgcolor: tabValue === 0 ? '#4CAF50' : '#F44336', 
              color: 'white', 
              '&:hover': { 
                bgcolor: tabValue === 0 ? '#388E3C' : '#D32F2F' 
              } 
            }}
            disabled={loading}
          >
            {loading ? 'Procesando...' : (editMode ? 'Actualizar' : 'Guardar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TransactionManager;