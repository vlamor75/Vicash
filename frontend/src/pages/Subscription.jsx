// frontend/src/pages/Subscription.jsx
import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import {
  Container, Paper, Typography, Button, Box, Radio,
  RadioGroup, FormControlLabel, FormControl, Grid,
  Card, CardContent, Divider, Alert
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const API_URL = process.env.REACT_APP_API_URL;
const TENANT_ID = localStorage.getItem('tenantId');

function Subscription() {
  const [plan, setPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/subscriptions/status`, {
        headers: {
          'x-tenant-id': TENANT_ID,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Crear método de pago con Stripe
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Crear suscripción con nuestro backend
      const response = await axios.post(
        `${API_URL}/subscriptions`,
        { paymentMethodId: paymentMethod.id, plan },
        {
          headers: {
            'x-tenant-id': TENANT_ID,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Confirmar el pago si es necesario
      const { clientSecret } = response.data;
      
      if (clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
        
        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }
      
      // Actualizar el estado de la suscripción
      fetchSubscriptionStatus();
    } catch (error) {
      setError(error.message || 'Error al procesar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('¿Estás seguro de que deseas cancelar tu suscripción?')) {
      setLoading(true);
      
      try {
        await axios.post(
          `${API_URL}/subscriptions/cancel`,
          {},
          {
            headers: {
              'x-tenant-id': TENANT_ID,
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        // Actualizar el estado de la suscripción
        fetchSubscriptionStatus();
      } catch (error) {
        setError(error.response?.data?.message || 'Error al cancelar la suscripción');
      } finally {
        setLoading(false);
      }
    }
  };

  const renderSubscriptionDetails = () => {
    if (!subscription) return null;
    
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    
    return (
      <Paper sx={{ p: 3, mb: 4, bgcolor: isActive ? '#f9f9f9' : '#fff' }}>
        <Typography variant="h6" gutterBottom>
          Estado de Suscripción
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">
            Plan: <strong>{subscription.plan === 'monthly' ? 'Mensual' : subscription.plan === 'annual' ? 'Anual' : 'Gratuito'}</strong>
          </Typography>
          {isActive && (
            <>
              <Typography variant="subtitle1">
                Estado: <strong style={{ color: 'green' }}>Activo</strong>
              </Typography>
              <Typography variant="subtitle1">
                Próxima facturación: <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>
              </Typography>
              {subscription.cancelAtPeriodEnd && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Tu suscripción será cancelada al final del período actual.
                </Alert>
              )}
            </>
          )}
          {subscription.status === 'canceled' && (
            <Typography variant="subtitle1" sx={{ color: 'red' }}>
              Tu suscripción ha sido cancelada.
            </Typography>
          )}
        </Box>
        
        {isActive && !subscription.cancelAtPeriodEnd && (
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleCancelSubscription}
            disabled={loading}
          >
            Cancelar suscripción
          </Button>
        )}
      </Paper>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Suscripción
      </Typography>
      
      {renderSubscriptionDetails()}
      
      {(!subscription || subscription.status !== 'active') && (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ 
                height: '100%',
                borderColor: plan === 'monthly' ? '#FFD700' : 'inherit',
                boxShadow: plan === 'monthly' ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
              }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Plan Mensual
                  </Typography>
                  <Typography variant="h3" color="primary" gutterBottom>
                    $9<Typography variant="body1" component="span">/mes</Typography>
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography>Todas las funcionalidades</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography>Reportes avanzados</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography>Transacciones ilimitadas</Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography>Soporte preferencial</Typography>
                    </Box>
                  </Box>
                  <FormControlLabel 
                    control={
                      <Radio 
                        checked={plan === 'monthly'}
                        onChange={() => setPlan('monthly')}
                        sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
                      />
                    } 
                    label="Seleccionar plan mensual" 
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ 
                height: '100%',
                borderColor: plan === 'annual' ? '#FFD700' : 'inherit',
                boxShadow: plan === 'annual' ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
              }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Plan Anual
                  </Typography>
                  <Typography variant="h3" color="primary" gutterBottom>
                    $90<Typography variant="body1" component="span">/año</Typography>
                    <Typography variant="caption" color="success" display="block">
                      ¡Ahorra 2 meses!
                    </Typography>
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography>Todas las funcionalidades</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography>Reportes avanzados</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography>Transacciones ilimitadas</Typography>
                    </Box>
                    <Box display="flex" alignItems="center">
                      <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} />
                      <Typography>Soporte preferencial</Typography>
                    </Box>
                  </Box>
                  <FormControlLabel 
                    control={
                      <Radio 
                        checked={plan === 'annual'}
                        onChange={() => setPlan('annual')}
                        sx={{ color: '#FFD700', '&.Mui-checked': { color: '#FFD700' } }}
                      />
                    } 
                    label="Seleccionar plan anual" 
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información de pago
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <CardElement options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }} />
              </Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!stripe || loading}
                sx={{ 
                  bgcolor: '#FFD700', 
                  color: 'black',
                  '&:hover': { bgcolor: '#E6C300' }
                }}
              >
                {loading ? 'Procesando...' : `Suscribirse por $${plan === 'monthly' ? '9/mes' : '90/año'}`}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
}

export default Subscription;