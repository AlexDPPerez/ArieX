import express from 'express';
import { mostrarCatalogo } from '../controllers/catalogoController.js'; // Asumiendo que tienes este controlador
import { verDetalleCuadro } from '../controllers/cuadrosController.js';

const router = express.Router();

// Ruta para la página principal del catálogo
router.get('/', mostrarCatalogo);

// ¡NUEVA RUTA! Para ver el detalle de un cuadro específico
router.get('/:id', verDetalleCuadro);

export default router;
