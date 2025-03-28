// frontend/src/utils/axiosConfig.js
import axios from 'axios';
import { logout } from '../services/authService';

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log('Error de autenticación detectado, redirigiendo a login');
      logout(); // Usa la función de logout de authService
    }
    return Promise.reject(error);
  }
);

export default axios;