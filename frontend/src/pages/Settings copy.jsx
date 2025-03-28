import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, Paper, Box, Grid, TextField,
  Button, Divider, Switch, FormControlLabel, Select,
  MenuItem, InputLabel, FormControl, Alert, Snackbar,
  Card, CardContent
} from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL;
const TENANT_ID = localStorage.getItem('tenantId');

function Settings() {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    darkMode: false,
    notifications: true,
    language: 'es'
  });
  
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    // Cargar datos del usuario
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || ''
    });
    
    // Cargar preferencias (podrían venir de la API en una implementación real)
    fetchUserPreferences();
  }, []);
  
  const fetchUserPreferences = async () => {
    try {
      // En una implementación real, obtendríamos esto de la API
      // const response = await axios.get(`${API_URL}/users/preferences`, {
      //   headers: { 
      //     'x-tenant-id': TENANT_ID,
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
      // setPreferences(response.data);
      
      // Por ahora, usamos valores predeterminados
      setPreferences({
        currency: 'USD',
        darkMode: false,
        notifications: true,
        language: 'es'
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };
  
  const handleUserUpdate = async (e) => {
    e.preventDefault();
    
    try {
      // En una implementación real, enviaríamos los datos a la API
      // await axios.put(`${API_URL}/users/profile`, user, {
      //   headers: { 
      //     'x-tenant-id': TENANT_ID,
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
      
      // Actualizar datos en localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...userData,
        firstName: user.firstName,
        lastName: user.lastName
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setNotification({
        open: true,
        message: 'Perfil actualizado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        open: true,
        message: 'Error al actualizar el perfil',
        severity: 'error'
      });
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (password.new !== password.confirm) {
      setNotification({
        open: true,
        message: 'Las contraseñas no coinciden',
        severity: 'error'
      });
      return;
    }
    
    try {
      // En una implementación real, enviaríamos esto a la API
      // await axios.put(`${API_URL}/users/password`, {
      //   currentPassword: password.current,
      //   newPassword: password.new
      // }, {
      //   headers: { 
      //     'x-tenant-id': TENANT_ID,
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
      
      setPassword({
        current: '',
        new: '',
        confirm: ''
      });
      
      setNotification({
        open: true,
        message: 'Contraseña actualizada correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setNotification({
        open: true,
        message: 'Error al cambiar la contraseña',
        severity: 'error'
      });
    }
  };
  
  const handlePreferencesChange = async (e) => {
    e.preventDefault();
    
    try {
      // En una implementación real, enviaríamos esto a la API
      // await axios.put(`${API_URL}/users/preferences`, preferences, {
      //   headers: { 
      //     'x-tenant-id': TENANT_ID,
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });
      
      setNotification({
        open: true,
        message: 'Preferencias guardadas correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setNotification({
        open: true,
        message: 'Error al guardar preferencias',
        severity: 'error'
      });
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Configuración
      </Typography>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Perfil de Usuario
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleUserUpdate}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    value={user.firstName}
                    onChange={(e) => setUser({...user, firstName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Apellido"
                    value={user.lastName}
                    onChange={(e) => setUser({...user, lastName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={user.email}
                    disabled
                    helperText="El email no puede ser modificado"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    type="submit" 
                    variant="contained"
                    sx={{ 
                      bgcolor: '#FFD700', 
                      color: 'black',
                      '&:hover': { bgcolor: '#E6C300' }
                    }}
                  >
                    Guardar Perfil
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cambiar Contraseña
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handlePasswordChange}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Contraseña Actual"
                    value={password.current}
                    onChange={(e) => setPassword({...password, current: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Nueva Contraseña"
                    value={password.new}
                    onChange={(e) => setPassword({...password, new: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Confirmar Contraseña"
                    value={password.confirm}
                    onChange={(e) => setPassword({...password, confirm: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    type="submit" 
                    variant="contained"
                    sx={{ 
                      bgcolor: '#FFD700', 
                      color: 'black',
                      '&:hover': { bgcolor: '#E6C300' }
                    }}
                  >
                    Cambiar Contraseña
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preferencias de la Aplicación
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handlePreferencesChange}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="currency-label">Moneda</InputLabel>
                    <Select
                      labelId="currency-label"
                      value={preferences.currency}
                      label="Moneda"
                      onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
                    >
                      <MenuItem value="USD">USD - Dólar Estadounidense</MenuItem>
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                      <MenuItem value="MXN">MXN - Peso Mexicano</MenuItem>
                      <MenuItem value="COP">COP - Peso Colombiano</MenuItem>
                      <MenuItem value="ARS">ARS - Peso Argentino</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="language-label">Idioma</InputLabel>
                    <Select
                      labelId="language-label"
                      value={preferences.language}
                      label="Idioma"
                      onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                    >
                      <MenuItem value="es">Español</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.darkMode}
                        onChange={(e) => setPreferences({...preferences, darkMode: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Modo Oscuro"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notifications}
                        onChange={(e) => setPreferences({...preferences, notifications: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Recibir Notificaciones"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    type="submit" 
                    variant="contained"
                    sx={{ 
                      bgcolor: '#FFD700', 
                      color: 'black',
                      '&:hover': { bgcolor: '#E6C300' }
                    }}
                  >
                    Guardar Preferencias
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ mt: 2, bgcolor: '#f9f9f9' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Plan Actual
              </Typography>
              <Typography variant="body1">
                Estás en el plan <strong>Básico</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Para acceder a características avanzadas, considera actualizar a un plan Premium.
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ 
                  mt: 2,
                  color: '#997a00',
                  borderColor: '#997a00',
                  '&:hover': { borderColor: '#FFD700', bgcolor: 'rgba(255, 215, 0, 0.1)' }
                }}
                onClick={() => window.location.href = '/subscription'}
              >
                Ver Planes
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Settings;