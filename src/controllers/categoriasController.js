import {
    obtenerCategorias,
    obtenerSubcategorias,
    subcategoriasPorCategoria,
    crearCategoriaConSubcategorias,
    obtenerCategoriasConSubcategorias,
    eliminarCategoria as eliminarCategoriaModel,
    actualizarCategoriaConSubcategorias
} from "../models/categoriasModel.js";

// Obtener todas las categorías
export const obtenerTodasCategorias = (req, res) => {
    try {
        const categorias = obtenerCategorias();
        res.json(categorias);
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener las categorías." });
    }
}

// Obtener todas las subcategorías
export const obtenerTodasSubcategorias = (req, res) => {
    try {
        const subcategorias = obtenerSubcategorias();
        res.json(subcategorias);
    } catch (error) {
        console.error("Error al obtener subcategorías:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener las subcategorías." });
    }
}

// Obtener subcategorías por ID de categoría
export const obtenerSubcategoriasPorCategoria = (req, res) => {
    const { categoria_id } = req.query;
    if (!categoria_id) {
        return res.status(400).json({ message: "El parámetro 'categoria_id' es requerido." });
    }
    try {
        const subcategorias = subcategoriasPorCategoria(categoria_id);
        res.json(subcategorias);
    } catch (error) {
        console.error(`Error al obtener subcategorías para la categoría ${categoria_id}:`, error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// Crear una nueva categoría con sus subcategorías
export const crearNuevaCategoria = (req, res) => {
    const { nombre, subcategorias } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
    }
    if (!subcategorias || !Array.isArray(subcategorias) || subcategorias.length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar al menos una subcategoría.' });
    }

    try {
        const nuevoId = crearCategoriaConSubcategorias({ nombre: nombre.trim(), subcategorias });
        res.status(201).json({ message: 'Categoría creada exitosamente', id: nuevoId });
    } catch (error) {
        console.error('Error en el controlador al crear categoría:', error);
        res.status(500).json({ message: error.message || 'Error interno del servidor al crear la categoría.' });
    }
};

// Actualizar una categoría existente
export const actualizarCategoria = (req, res) => {
    const { id } = req.params;
    const { nombre, subcategorias } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
    }
    if (!subcategorias || !Array.isArray(subcategorias) || subcategorias.length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar al menos una subcategoría.' });
    }

    try {
        actualizarCategoriaConSubcategorias(id, { nombre: nombre.trim(), subcategorias });
        res.status(200).json({ message: 'Categoría actualizada exitosamente', id: id });
    } catch (error) {
        console.error(`Error en el controlador al actualizar categoría ${id}:`, error);
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Error interno del servidor al actualizar la categoría.' });
    }
};

// Obtener categorías con sus subcategorías para la tabla del CRUD
export const obtenerCategoriasParaTabla = (req, res) => {
    try {
        const categorias = obtenerCategoriasConSubcategorias();
        res.json(categorias);
    } catch (error) {
        console.error("Error al obtener categorías para la tabla:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// Eliminar una categoría
export const eliminarCategoria = (req, res) => {
    const { id } = req.params;
    try {
        const success = eliminarCategoriaModel(id);
        if (success) {
            res.json({ message: "Categoría eliminada correctamente." });
        } else {
            res.status(404).json({ message: "Categoría no encontrada o no se pudo eliminar." });
        }
    } catch (error) {
        console.error(`Error al eliminar categoría ${id}:`, error);
        // Comprobar si el error es por una restricción de clave externa
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).json({ message: 'No se puede eliminar. La categoría está en uso por uno o más cuadros.' });
        }
        res.status(500).json({ message: "Error interno del servidor." });
    }
};