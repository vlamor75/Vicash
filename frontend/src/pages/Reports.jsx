// frontend/src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Grid, Typography, Paper, Container, 
  FormControl, InputLabel, Select, MenuItem,
  Button, Tab, Tabs
} from '@mui/material';
import { 
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const API_URL = process.env.REACT_APP_API_URL;
const API_CATEGORIES_URL = 'https://hg4r1p0fbj.execute-api.us-east-1.amazonaws.com/dev';
// Actualizar URL de la API de transacciones
const API_TRANSACTIONS_URL = 'https://30j537tc1c.execute-api.us-east-1.amazonaws.com/dev/transaction';
const TENANT_ID = localStorage.getItem('tenantId');

const COLORS = [
  '#FFD700', '#FF6B6B', '#4ecdc4', '#1a535c', '#ff9f1c', 
  '#2ec4b6', '#e71d36', '#ff9f1c', '#6b717e', '#3d5a80'
];

function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [categoriasIngresos, setCategoriasIngresos] = useState([]);
  const [categoriasEgresos, setCategoriasEgresos] = useState([]);
  const [dateRange, setDateRange] = useState('month');
  const [chartType, setChartType] = useState(0);
  const [reportData, setReportData] = useState({
    categoryData: [],
    timeSeriesData: [],
    summary: { income: 0, expense: 0, balance: 0 }
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategorias();
  }, []);

  useEffect(() => {
    processData();
  }, [transactions, dateRange, categoriasIngresos, categoriasEgresos]);

  const fetchTransactions = async () => {
    try {
      // Usar la nueva API de transacciones
      const response = await axios.get(API_TRANSACTIONS_URL, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const ingresosResponse = await axios.get(`${API_CATEGORIES_URL}/income-categories`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      
      const egresosResponse = await axios.get(`${API_CATEGORIES_URL}/expense-categories`, {
        headers: { 'x-tenant-id': TENANT_ID }
      });
      
      setCategoriasIngresos(ingresosResponse.data);
      setCategoriasEgresos(egresosResponse.data);
    } catch (error) {
      console.error('Error fetching categorias:', error);
    }
  };

  const getCategoryName = (id, type) => {
    const categorias = type === 'income' ? categoriasIngresos : categoriasEgresos;
    const categoria = categorias.find(cat => cat.id === id);
    return categoria ? categoria.nombre : 'Desconocido';
  };

  const processData = () => {
    // Filter transactions by date range
    const now = new Date();
    const filtered = transactions.filter(t => {
      const date = new Date(t.date);
      if (dateRange === 'month') {
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear();
      } else if (dateRange === 'quarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        const itemQuarter = Math.floor(date.getMonth() / 3);
        return itemQuarter === quarter && date.getFullYear() === now.getFullYear();
      } else if (dateRange === 'year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true; // 'all'
    });

    // Calculate summary
    const income = filtered
      .filter(t => t.category_type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const expense = filtered
      .filter(t => t.category_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(Math.abs(t.amount)), 0);
    
    // Prepare category data
    const categorySums = {};
    filtered.forEach(t => {
      const categoryName = t.category_name || getCategoryName(t.category_id, t.category_type);
      const key = `${categoryName} (${t.category_type === 'income' ? 'Ingreso' : 'Egreso'})`;
      
      if (!categorySums[key]) {
        categorySums[key] = {
          amount: 0,
          type: t.category_type,
          color: t.category_type === 'income' ? '#4CAF50' : '#F44336'
        };
      }
      categorySums[key].amount += parseFloat(Math.abs(t.amount));
    });
    
    const categoryChartData = Object.keys(categorySums).map(name => ({
      name,
      value: categorySums[name].amount,
      type: categorySums[name].type,
      color: categorySums[name].color
    }));
    
    // Prepare time series data
    const timeData = {};
    filtered.forEach(t => {
      const date = new Date(t.date);
      let timeKey;
      
      if (dateRange === 'month' || dateRange === 'quarter') {
        timeKey = date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
      } else {
        timeKey = date.toLocaleDateString(undefined, { month: '2-digit', year: '2-digit' });
      }
      
      if (!timeData[timeKey]) {
        timeData[timeKey] = { date: timeKey, income: 0, expense: 0 };
      }
      
      if (t.category_type === 'income') {
        timeData[timeKey].income += parseFloat(t.amount);
      } else {
        timeData[timeKey].expense += parseFloat(Math.abs(t.amount));
      }
    });
    
    // Convert to array and sort by date
    const timeSeriesData = Object.values(timeData).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    setReportData({
      categoryData: categoryChartData,
      timeSeriesData,
      summary: { income, expense, balance: income - expense }
    });
  };

  const handleChangeChartType = (event, newValue) => {
    setChartType(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Reportes Financieros
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={dateRange}
                label="Período"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="month">Mes actual</MenuItem>
                <MenuItem value="quarter">Trimestre actual</MenuItem>
                <MenuItem value="year">Año actual</MenuItem>
                <MenuItem value="all">Todo el historial</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              Resumen del período: 
              <Box component="span" sx={{ fontWeight: 'bold', ml: 1, color: 'green' }}>
                Ingresos: ${reportData.summary.income.toFixed(2)}
              </Box>
              <Box component="span" sx={{ fontWeight: 'bold', mx: 1, color: 'red' }}>
                Egresos: ${reportData.summary.expense.toFixed(2)}
              </Box>
              <Box component="span" sx={{ fontWeight: 'bold', ml: 1, color: reportData.summary.balance >= 0 ? 'green' : 'red' }}>
                Balance: ${reportData.summary.balance.toFixed(2)}
              </Box>
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={chartType}
          onChange={handleChangeChartType}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Distribución por Categoría" />
          <Tab label="Evolución en el Tiempo" />
          <Tab label="Comparativa Ingresos vs Egresos" />
        </Tabs>
        
        <Box sx={{ p: 3, height: 400 }}>
          {chartType === 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${value.toFixed(2)}`}
                  labelFormatter={(name) => `Categoría: ${name}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 1 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={reportData.timeSeriesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Ingresos"
                  stroke="#4CAF50" 
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  name="Egresos"
                  stroke="#F44336" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 2 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reportData.timeSeriesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="income" name="Ingresos" fill="#4CAF50" />
                <Bar dataKey="expense" name="Egresos" fill="#F44336" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Principales Gastos
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.categoryData.filter(cat => cat.type === 'expense')}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {reportData.categoryData.filter(cat => cat.type === 'expense').map((entry, index) => (
                      <Cell key={`cell-expense-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fuentes de Ingreso
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.categoryData.filter(cat => cat.type === 'income')}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {reportData.categoryData.filter(cat => cat.type === 'income').map((entry, index) => (
                      <Cell key={`cell-income-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Reports;