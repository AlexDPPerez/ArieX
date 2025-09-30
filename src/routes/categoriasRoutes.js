import express from "express";
import {
    obtenerTodasCategorias,
    obtenerTodasSubcategorias,
    obtenerSubcategoriasPorCategoria,
    crearNuevaCategoria,
    obtenerCategoriasParaTabla,
    eliminarCategoria,
    actualizarCategoria,
    uploadCategoriaImage,
    actualizarDestacadas
} from "../controllers/categoriasController.js";
import { isAuthenticated, isAdminOrEditor } from "../controllers/authController.js";

const router = express.Router();

// --- Rutas para Categorías ---
router.route("/api/categorias")
    .get(isAuthenticated, obtenerTodasCategorias) // GET /api/categorias
    .post(isAuthenticated, isAdminOrEditor, uploadCategoriaImage, crearNuevaCategoria);  // POST /api/categorias

router.post("/api/categorias/destacadas", isAuthenticated, isAdminOrEditor, actualizarDestacadas); // POST /api/categorias/destacadas

router.get("/api/categorias/tabla", isAuthenticated, obtenerCategoriasParaTabla); // GET /api/categorias/tabla

router.put("/api/categorias/:id", isAuthenticated, isAdminOrEditor, uploadCategoriaImage, actualizarCategoria); // PUT /api/categorias/:id
router.delete("/api/categorias/:id", isAuthenticated, isAdminOrEditor, eliminarCategoria); // DELETE /api/categorias/:id

// --- Rutas para Subcategorías ---
router.get("/api/subcategorias", isAuthenticated, obtenerTodasSubcategorias); // GET /api/subcategorias
router.get("/api/subcategorias/categoria", isAuthenticated, obtenerSubcategoriasPorCategoria); // GET /api/subcategorias/categoria

export default router; 