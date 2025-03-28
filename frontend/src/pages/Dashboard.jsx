import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentTenantId } from '../utils/tenantManager';
import { 
  Box, Grid, Typography, Paper, Container, MenuItem, Select, FormControl, InputLabel 
} from '@mui/material';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const API_TRANSACTIONS_URL = 'https://30j537tc1c.execute-api.us-east-1.amazonaws.com/dev/transaction';

const COLORS = ['#FFD700', '#FF6B6B', '#4ecdc4', '#1a535c', '#ff9f1c', '#2ec4b6'];

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const truncateText = (text, maxLength) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: '12px', fontWeight: 'bold' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomLegend = ({ data }) => {
  return (
    <Box sx={{ mt: 2 }}>
      {data.map((entry, index) => (
        <Box
          key={`legend-${index}`}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                backgroundColor: COLORS[index % COLORS.length],
                borderRadius: '50%',
                mr: 1,
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {entry.name}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            ${formatNumber(entry.value)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0
  });
  const [categoryDataIncome, setCategoryDataIncome] = useState([]);
  const [categoryDataExpense, setCategoryDataExpense] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      const tenantId = getCurrentTenantId();
      const response = await axios.get(API_TRANSACTIONS_URL, {
        headers: { 'x-tenant-id': tenantId }
      });

      const data = filterTransactions(response.data);
      setTransactions(data);

      // Calcular resumen
      const incomes = data.filter(t => t.category_type === 'income')
                         .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const expenses = data.filter(t => t.category_type === 'expense')
                          .reduce((sum, t) => sum + parseFloat(Math.abs(t.amount)), 0);

      setSummary({
        totalIncome: Math.round(incomes),
        totalExpense: Math.round(expenses),
        balance: Math.round(incomes - expenses)
      });

      // Preparar datos para gráficos
      prepareCategoryData(data);
      prepareMonthlyData(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const filterTransactions = (data) => {
    const now = new Date();
    if (filter === 'thisMonth') {
      return data.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
    } else if (filter === 'lastMonth') {
      return data.filter(t => {
        const date = new Date(t.date);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      });
    }
    return data; // 'all'
  };

  const prepareCategoryData = (data) => {
    const incomeData = {};
    const expenseData = {};

    data.forEach(t => {
      if (t.category_type === 'income') {
        if (!incomeData[t.category_name]) {
          incomeData[t.category_name] = 0;
        }
        incomeData[t.category_name] += parseFloat(t.amount);
      } else if (t.category_type === 'expense') {
        if (!expenseData[t.category_name]) {
          expenseData[t.category_name] = 0;
        }
        expenseData[t.category_name] += parseFloat(Math.abs(t.amount));
      }
    });

    setCategoryDataIncome(Object.keys(incomeData).map(name => ({
      name,
      value: Math.round(incomeData[name])
    })));

    setCategoryDataExpense(Object.keys(expenseData).map(name => ({
      name,
      value: Math.round(expenseData[name])
    })));
  };

  const prepareMonthlyData = (data) => {
    const months = {};
    const currentYear = new Date().getFullYear();

    data.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (date.getFullYear() === currentYear) {
        if (!months[monthKey]) {
          months[monthKey] = {
            month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('es', { month: 'short' }),
            Ingresos: 0,
            Egresos: 0
          };
        }

        if (t.category_type === 'income') {
          months[monthKey].Ingresos += parseFloat(t.amount);
        } else {
          months[monthKey].Egresos += parseFloat(Math.abs(t.amount));
        }
      }
    });

    const monthlyDataForChart = Object.values(months).sort((a, b) => {
      const monthA = new Date(a.month + ' 1, ' + currentYear).getMonth();
      const monthB = new Date(b.month + ' 1, ' + currentYear).getMonth();
      return monthA - monthB;
    });

    monthlyDataForChart.forEach(item => {
      item.Ingresos = Math.round(item.Ingresos);
      item.Egresos = Math.round(item.Egresos);
    });

    setMonthlyData(monthlyDataForChart);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Filtro */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Filtro</InputLabel>
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            label="Filtro"
          >
            <MenuItem value="all">Todo</MenuItem>
            <MenuItem value="thisMonth">Este mes</MenuItem>
            <MenuItem value="lastMonth">Mes anterior</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards - Made smaller */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Ingresos Totales */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, backgroundColor: '#4CAF50', color: 'white', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6">Ingresos Totales</Typography>
            <Typography variant="h4">${formatNumber(summary.totalIncome)}</Typography>
          </Paper>
        </Grid>

        {/* Egresos Totales */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, backgroundColor: '#F44336', color: 'white', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6">Egresos Totales</Typography>
            <Typography variant="h4">${formatNumber(summary.totalExpense)}</Typography>
          </Paper>
        </Grid>

        {/* Balance */}
        <Grid item xs={12} sm={12} md={4}>
          <Paper sx={{ p: 2, backgroundColor: '#FFD700', color: 'black', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6">Balance</Typography>
            <Typography variant="h4">${formatNumber(summary.balance)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts section */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Income Pie Chart */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Distribución de Ingresos</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryDataIncome}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDataIncome.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `$${formatNumber(value)}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <CustomLegend data={categoryDataIncome} />
          </Paper>
        </Grid>

        {/* Expense Pie Chart */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Distribución de Egresos</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryDataExpense}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDataExpense.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `$${formatNumber(value)}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <CustomLegend data={categoryDataExpense} />
          </Paper>
        </Grid>

        {/* Bar Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Tendencia Mensual</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${formatNumber(value)}`} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ paddingTop: "10px" }}
                />
                <Bar dataKey="Ingresos" fill="#4CAF50" />
                <Bar dataKey="Egresos" fill="#F44336" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Transacciones recientes - Moved below charts */}
                  {/* Transacciones recientes - Más detalladas */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Transacciones recientes
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        {transactions.slice(0, 15).map((transaction) => (
                          <Grid item xs={12} key={transaction.id}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #e0e0e0',
                                pb: 1,
                                mb: 1,
                              }}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
                                    {new Date(transaction.date).toLocaleDateString('es')}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      backgroundColor: transaction.category_type === 'income' ? '#E8F5E9' : '#FFEBEE',
                                      color: transaction.category_type === 'income' ? '#2E7D32' : '#C62828',
                                      px: 1,
                                      py: 0.3,
                                      borderRadius: 1,
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {transaction.category_type === 'income' ? 'Ingreso' : 'Egreso'}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {transaction.category_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {transaction.description}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: transaction.category_type === 'income' ? '#4CAF50' : '#F44336',
                                  fontWeight: 'bold',
                                }}
                              >
                                {transaction.category_type === 'income' ? '+' : '-'}$
                                {formatNumber(Math.abs(Math.round(transaction.amount)))}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  </Box>
    </Container>
    );
  }

export default Dashboard;
