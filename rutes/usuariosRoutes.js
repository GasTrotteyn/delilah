const express = require('express');
const usuariosControllers = require('../controllers/usuariosControllers');
const usuariosMiddlewares = require('../middlewares/usuariosMiddlewares');
const api2 = express.Router();

api2.post('/usuario', usuariosMiddlewares.datosCompletosRegistro, usuariosControllers.postUsuario);
api2.post('/login', usuariosMiddlewares.datosCompletosLogin, usuariosControllers.login);
api2.patch('/desactivar', usuariosMiddlewares.estaLogueado, usuariosControllers.darDeBajaUsuario);
api2.get('/productos', usuariosMiddlewares.estaLogueado, usuariosControllers.getProductos);



module.exports = api2;
