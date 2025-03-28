// backend/routes/categoriasRoutes.js
const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rutas para categorías de ingresos
router.get('/categorias/ingresos', categoriasController.getCategoriasIngresos);
router.post('/categorias/ingresos', categoriasController.createCategoriaIngreso);
router.put('/categorias/ingresos/:id', categoriasController.updateCategoriaIngreso);
router.delete('/categorias/ingresos/:id', categoriasController.deleteCategoriaIngreso);

// Rutas para categorías de egresos
router.get('/categorias/egresos', categoriasController.getCategoriasEgresos);
router.post('/categorias/egresos', categoriasController.createCategoriaEgreso);
router.put('/categorias/egresos/:id', categoriasController.updateCategoriaEgreso);
router.delete('/categorias/egresos/:id', categoriasController.deleteCategoriaEgreso);

// Mantener también las rutas originales para compatibilidad si es necesario
router.get('/ingresos', categoriasController.getCategoriasIngresos);
router.post('/ingresos', categoriasController.createCategoriaIngreso);
router.put('/ingresos/:id', categoriasController.updateCategoriaIngreso);
router.delete('/ingresos/:id', categoriasController.deleteCategoriaIngreso);

router.get('/egresos', categoriasController.getCategoriasEgresos);
router.post('/egresos', categoriasController.createCategoriaEgreso);
router.put('/egresos/:id', categoriasController.updateCategoriaEgreso);
router.delete('/egresos/:id', categoriasController.deleteCategoriaEgreso);

module.exports = router;