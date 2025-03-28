// frontend/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, Paper, Box, Grid, TextField,
  Button, Divider, Switch, FormControlLabel, Select,
  MenuItem, InputLabel, FormControl, Alert, Snackbar,
  Card, CardContent
} from '@mui/material';
import { isAuthenticated, getUserProfile, updateUserProfile } from '../services/authService';

function Settings() {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: ''
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
  
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated()) {
      // Redirigir a login si no hay token
      window.location.href = '/login';
      return;
    }
    
    fetchUserPreferences();
  }, []);
  
  const fetchUserPreferences = async () => {
    try {
      setIsLoading(true);
      
      const userData = await getUserProfile();
      
      console.log('Datos de usuario recibidos:', userData);

      const { first_name, last_name, email, preferences: userPreferences } = userData;

      setUser({
        firstName: first_name || '',
        lastName: last_name || '',
        email: email || ''
      });

      if (userPreferences) {
        setPreferences(userPreferences);
      }

      setNotification({
        open: true,
        message: 'Datos del usuario cargados correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      
      setNotification({
        open: true,
        message: 'Error al cargar los datos del usuario',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUserUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await updateUserProfile({
        first_name: user.firstName,
        last_name: user.lastName,
        avatar: user.avatar // Si tienes un campo de avatar
      });
      
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
  
  const handlePreferencesChange = async (e) => {
    e.preventDefault();
    
    try {
      await updateUserProfile({
        preferences
      });
      
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
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (password.new !== password.confirm) {
      setNotification({
        open: true,
        message: 'Las contraseñas no coinciden',
        severity: 'error'
      });
      return;
    }

    try {
      // Simulación de cambio de contraseña exitoso
      console.log('Simulando cambio de contraseña...');
      console.log('Contraseña actual:', password.current);
      console.log('Nueva contraseña:', password.new);
      
      setNotification({
        open: true,
        message: 'Contraseña cambiada correctamente',
        severity: 'success'
      });

      setPassword({
        current: '',
        new: '',
        confirm: ''
      });
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Error al cambiar la contraseña',
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

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5">Cargando datos de usuario...</Typography>
      </Container>
    );
  }

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
                      value={preferences.currency || 'USD'}
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
                      value={preferences.language || 'es'}
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
                        checked={preferences.darkMode || false}
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
                        checked={preferences.notifications || false}
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