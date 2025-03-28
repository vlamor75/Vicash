// frontend/src/components/TenantInfo.jsx
import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { getCurrentTenantId, updateTenantId } from '../utils/tenantManager';

function TenantInfo() {
  const tenantId = getCurrentTenantId();
  
  const handleUpdateTenant = () => {
    const newId = prompt('Introduce el nuevo ID de tenant:', tenantId);
    if (newId && newId !== tenantId) {
      updateTenantId(newId);
      window.location.reload(); // Recargamos para aplicar el cambio
    }
  };
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, px: 2 }}>
      <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
        Tenant:
      </Typography>
      <Chip 
        label={`ID: ${tenantId || 'No disponible'}`} 
        size="small" 
        color={tenantId ? "primary" : "error"}
        variant="outlined"
        onClick={handleUpdateTenant}
        sx={{ mr: 1 }}
      />
      {process.env.NODE_ENV === 'development' && (
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleUpdateTenant}
          sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
        >
          Cambiar
        </Button>
      )}
    </Box>
  );
}

export default TenantInfo;