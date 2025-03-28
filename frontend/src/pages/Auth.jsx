// frontend/src/pages/Auth.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container, Paper, Typography, TextField, Button, Box,
  Tabs, Tab, Grid, Link, Alert
} from '@mui/material';

function Auth() {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: 'vlamor@gmail.com', // Email predeterminado
    password: '123456', // Contraseña predeterminada
    confirmPassword: '',
    domain: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Simulando login exitoso para:', formData.email);
    
    try {
      // Simulación de autenticación exitosa
      const mockResponse = {
        user: {
          id: 1,
          email: formData.email,
          firstName: 'Vladimir',
          lastName: 'Moreno'
        },
        tenantId: '5', // Usa el tenant ID que sabemos que funciona
        token: 'token-de-prueba-123456'
      };
      
      // Guardar datos simulados en localStorage
      localStorage.setItem('token', mockResponse.token);
      localStorage.setItem('tenantId', mockResponse.tenantId);
      localStorage.setItem('user', JSON.stringify(mockResponse.user));
      
      console.log('Datos de autenticación simulados guardados:');
      console.log('Token:', mockResponse.token);
      console.log('TenantId:', mockResponse.tenantId);
      console.log('User:', JSON.stringify(mockResponse.user));
      
      // Redirigir al dashboard
      setTimeout(() => {
        console.log('Redirigiendo a dashboard...');
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Error en login simulado:', error);
      setError('Error al iniciar sesión. Verifique sus credenciales o la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    console.log('Simulando registro con:', formData.email);
    
    try {
      // Simulación de registro exitoso
      const mockResponse = {
        user: {
          id: 1,
          email: formData.email,
          firstName: formData.name,
          lastName: ''
        },
        tenantId: '5',
        token: 'token-de-registro-123456'
      };
      
      // Guardar datos simulados en localStorage
      localStorage.setItem('token', mockResponse.token);
      localStorage.setItem('tenantId', mockResponse.tenantId);
      localStorage.setItem('user', JSON.stringify(mockResponse.user));
      
      console.log('Datos de registro simulados guardados');
      console.log('Token:', mockResponse.token);
      console.log('TenantId:', mockResponse.tenantId);
      console.log('User:', JSON.stringify(mockResponse.user));
      
      // Redirigir al dashboard
      setTimeout(() => {
        console.log('Redirigiendo a dashboard después de registro...');
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Error en registro simulado:', error);
      setError('Error al registrarse. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ color: '#997a00' }}>
          Control de Presupuesto
        </Typography>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          centered
          sx={{ mb: 3 }}
        >
          <Tab label="Iniciar Sesión" />
          <Tab label="Registrarse" />
        </Tabs>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {tabValue === 0 ? (
          // Login Form
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, mb: 2,
                bgcolor: '#FFD700',
                color: 'black',
                '&:hover': { bgcolor: '#E6C300' }
              }}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Iniciar Sesión'}
            </Button>
            
            <Typography variant="caption" color="textSecondary" align="center" sx={{ display: 'block', mt: 1 }}>
              Tenant ID actual: {localStorage.getItem('tenantId') || 'No establecido'}
            </Typography>
          </Box>
        ) : (
          // Register Form
          <Box component="form" onSubmit={handleRegister}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nombre de Dominio (opcional)"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  helperText="Ej: miempresa.presupuesto-app.com"
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, mb: 2,
                bgcolor: '#FFD700',
                color: 'black',
                '&:hover': { bgcolor: '#E6C300' }
              }}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Crear Cuenta'}
            </Button>
          </Box>
        )}
        
        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
         Al utilizar esta aplicación, aceptas nuestros{' '}
         <Link href="/terms" sx={{ color: '#997a00' }}>
           Términos y Condiciones
         </Link>{' '}
         y{' '}
         <Link href="/privacy" sx={{ color: '#997a00' }}>
           Política de Privacidad
         </Link>
       </Typography>
     </Paper>
   </Container>
 );
}

export default Auth;