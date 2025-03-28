// frontend/src/services/authService.js
import axios from 'axios';

// Funciones exportadas como exportaciones nombradas
export const authHeader = () => {
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'x-tenant-id': tenantId || ''
  };
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tenantId');
  window.location.href = '/login';
};

export const getUserProfile = async () => {
  try {
    // Usa rutas relativas gracias al proxy
    const response = await axios.get('/user', { 
      headers: authHeader() 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    if (error.response?.status === 401) {
      logout();
    }
    throw error;
  }
};

export const updateUserProfile = async (userData) => {
  try {
    // Usa rutas relativas gracias al proxy
    const response = await axios.put('/user', userData, { 
      headers: authHeader() 
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error.response?.status === 401) {
      logout();
    }
    throw error;
  }
};