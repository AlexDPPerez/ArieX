import { categoriasModel } from "../models/index.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Asegurarse de que el directorio de subida existe
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, '../../public/uploads/categoryImages');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Configuración de Multer para las imágenes de categorías
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath); // Usar la ruta absoluta segura
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
});

export const uploadCategoriaImage = multer({ storage: storage }).single('imagen');

// Obtener todas las categorías
export const obtenerTodasCategorias = (req, res) => {
    try {
        const categorias = categoriasModel.obtenerCategorias();
        res.json(categorias);
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener las categorías." });
    }
}


// Obtener todas las subcategorías
export const obtenerTodasSubcategorias = (req, res) => {
    try {
        const subcategorias = categoriasModel.obtenerSubcategorias();
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
        const subcategorias = categoriasModel.subcategoriasPorCategoria(categoria_id);
        res.json(subcategorias);
    } catch (error) {
        console.error(`Error al obtener subcategorías para la categoría ${categoria_id}:`, error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// Actualizar las categorías destacadas
export const actualizarDestacadas = (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length > 4) {
        return res.status(400).json({ message: "Se requiere un array con un máximo de 4 IDs." });
    }

    try {
        categoriasModel.actualizarCategoriasDestacadas(ids);
        res.status(200).json({ message: "Categorías destacadas actualizadas correctamente." });
    } catch (error) {
        console.error("Error al actualizar categorías destacadas:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};


// Crear una nueva categoría con sus subcategorías
export const crearNuevaCategoria = (req, res) => {
    let { nombre, subcategorias, color } = req.body;
    const imagen_url = req.file ? `/uploads/categoryImages/${req.file.filename}` : null;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
    }
    if (!subcategorias || !Array.isArray(subcategorias) || subcategorias.length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar al menos una subcategoría.' });
    }
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    try {
        const nuevoId = categoriasModel.crearCategoriaConSubcategorias({ nombre: nombre.trim(), subcategorias, color, imagen_url });
        res.status(201).json({ message: 'Categoría creada exitosamente', id: nuevoId });
    } catch (error) {
        console.error('Error en el controlador al crear categoría:', error);
        res.status(500).json({ message: error.message || 'Error interno del servidor al crear la categoría.' });
    }
};

// Actualizar una categoría existente
export const actualizarCategoria = (req, res) => {
    let { nombre, subcategorias, color } = req.body;
    const { id } = req.params;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
    }
    if (!subcategorias || !Array.isArray(subcategorias) || subcategorias.length === 0) {
        return res.status(400).json({ message: 'Debe proporcionar al menos una subcategoría.' });
    }
    nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

    try {
        // Obtener la categoría existente para saber su imagen actual
        const categoriaExistente = categoriasModel.obtenerCategorias().find(c => c.id == id);
        if (!categoriaExistente) {
            return res.status(404).json({ message: "Categoría no encontrada." });
        }

        // Si se sube un nuevo archivo, se usa. Si no, se mantiene el anterior.
        const imagen_url = req.file ? `/uploads/categoryImages/${req.file.filename}` : categoriaExistente.imagen_url;
        
        categoriasModel.actualizarCategoriaConSubcategorias(id, { nombre: nombre.trim(), subcategorias, color, imagen_url });
        res.status(200).json({ message: 'Categoría actualizada exitosamente', id: id });
    } catch (error) {
        console.error(`Error en el controlador al actualizar categoría ${id}:`, error);
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Error interno del servidor al actualizar la categoría.' });
    }
}

// Obtener categorías con sus subcategorías para la tabla del CRUD
export const obtenerCategoriasParaTabla = (req, res) => {
    try {
        const categorias = categoriasModel.obtenerCategoriasConSubcategorias();
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
        const success = categoriasModel.eliminarCategoria(id);
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