import path from "path";
import { crearCuadro, obtenerCuadros, obtenerCuadro, obtenerCuadrosPorCategoria, eliminarCuadro as eliminarCuadroModel, actualizarCuadro as actualizarCuadroModel } from "../models/cuadrosModel.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Obtener todos los cuadros
export const todosLosCuadros = (req, res) => {
    const cuadros = obtenerCuadros();
    res.json(cuadros);
}

// Obtener cuadros por categoría
export const CuadrosPorCategoria = (req, res) => {
    const categoria = req.query.categoria; // viene de /api/cuadros?categoria=Anime
    const cuadros = obtenerCuadrosPorCategoria(categoria);
    res.json(cuadros);
}

// Subir un nuevo cuadro
export const subirCuadro = (req, res) => {
    const { titulo, descripcion, subcategoria } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;


    const id = crearCuadro({ titulo, descripcion, imagen, subcategoria });

    if (!id) {
        return res.status(500).json({ error: "Error al crear el cuadro" });
    } else {
        res.json({ message: "Cuadro creado con éxito", id });
    }
}

// Eliminar un cuadro
export const eliminarCuadro = (req, res) => {
    const { id } = req.params;
    const result = eliminarCuadroModel(id);

    if (result) {
        res.json({ message: "Cuadro eliminado correctamente" });
    } else {
        res.status(404).json({ error: "Cuadro no encontrado o ya eliminado" });
    }
};

// Actualizar un cuadro
export const actualizarCuadro = (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, subcategoria } = req.body;

    if (!subcategoria) {
        return res.status(400).json({ error: "Debes seleccionar una subcategoría" });
    }

    // Manejar la imagen: si no se sube, usar la anterior de la DB
    let imagen;
    if (req.file) {
        imagen = `/uploads/${req.file.filename}`;
    } else {
        // Aquí deberías consultar la DB para obtener la imagen existente
        const cuadroExistente = obtenerCuadro(id); // función que retorna el cuadro
        imagen = cuadroExistente?.imagen || null;
    }

    const result = actualizarCuadroModel(id, { titulo, descripcion, imagen, subcategoria });

    if (!result) {
        return res.status(404).json({ error: "Cuadro no encontrado" });
    }

    res.json({ message: "Cuadro actualizado correctamente" });
};

