// frontend/src/utils/tenantManager.js
export const updateTenantId = (newId) => {
  localStorage.setItem('tenantId', newId);
  console.log('Tenant ID actualizado a:', newId);
  return newId;
};

export const getCurrentTenantId = () => {
  const tenantId = localStorage.getItem('tenantId');
  return tenantId;
};

// Función para actualizar manualmente desde la consola del navegador
export const exposeUpdateTenant = () => {
  window.__updateTenantId = updateTenantId;
  console.log('Función para actualizar tenant expuesta como window.__updateTenantId(newId)');
};