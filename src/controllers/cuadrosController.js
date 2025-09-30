import path from "path";
import { cuadrosModel } from "../models/index.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Obtener todos los cuadros
export const todosLosCuadros = (req, res) => {
    const cuadros = cuadrosModel.obtenerCuadros();
    res.json(cuadros);
}

// Obtener cuadros por categoría
export const CuadrosPorCategoria = (req, res) => {
    const categoria = req.query.categoria; // viene de /api/cuadros?categoria=Anime
    const cuadros = cuadrosModel.obtenerCuadrosPorCategoria(categoria);
    res.json(cuadros);
}

// Subir un nuevo cuadro
export const subirCuadro = (req, res) => {
    const { titulo, descripcion, subcategoria } = req.body;
    // req.files es un array de archivos gracias a upload.array()
    const imagenes = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];


    const { id } = cuadrosModel.crearCuadro({ titulo, descripcion, subcategoria, imagenes });

    if (!id) {
        return res.status(500).json({ error: "Error al crear el cuadro" });
    } else {
        res.json({ message: "Cuadro creado con éxito", id });
    }
}

// Eliminar un cuadro
export const eliminarCuadro = (req, res) => {
    const { id } = req.params;
    const result = cuadrosModel.eliminarCuadro(id);

    if (result) {
        res.json({ message: "Cuadro eliminado correctamente" });
    } else {
        res.status(404).json({ error: "Cuadro no encontrado o ya eliminado" });
    }
};

// Actualizar un cuadro
export const actualizarCuadro = (req, res) => {
    const { id } = req.params;
    // `imagenesExistentes` es un string con las URLs de las imágenes que no se borraron en el frontend.
    const { titulo, descripcion, subcategoria, imagenesExistentes } = req.body;

    if (!subcategoria) {
        return res.status(400).json({ error: "Debes seleccionar una subcategoría" });
    }

    try {
        const cuadroExistente = cuadrosModel.obtenerCuadro(id);
        if (!cuadroExistente) {
            return res.status(404).json({ error: "Cuadro no encontrado" });
        }

        // Inicializamos los datos a actualizar con la información que viene del body
        const updateData = { titulo, descripcion, subcategoria };

        // Verificamos si se ha enviado información para modificar las imágenes.
        // `imagenesExistentes` puede ser undefined, null, una cadena vacía '' o un string JSON '[]'.
        // Solo actuamos si `imagenesExistentes` tiene un valor "real" o si se suben nuevos archivos.
        const hayNuevosArchivos = req.files && req.files.length > 0;
        // Se considera que hay cambios si el campo `imagenesExistentes` fue enviado.
        // Su presencia, incluso como '[]', indica una intención de modificar la lista de imágenes.
        const hayCambiosEnExistentes = imagenesExistentes !== undefined;
        
        if (hayNuevosArchivos || hayCambiosEnExistentes) {
            const nuevasImagenes = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
            let imagenesGuardadas = [];
            // Solo intentamos parsear si `imagenesExistentes` no es una cadena vacía.
            // Esto previene el error `JSON.parse('')`.
            if (imagenesExistentes && typeof imagenesExistentes === 'string') {
                try {
                    imagenesGuardadas = JSON.parse(imagenesExistentes);
                } catch (e) { /* Ignorar error de parseo si el string no es JSON válido */ }
            }
            // Solo si hay cambios, añadimos la propiedad 'imagenes' al objeto de actualización.
            const listaFinalImagenes = [...imagenesGuardadas, ...nuevasImagenes];

            // El modelo espera un string de imágenes. Si la lista está vacía, se convierte en ''.
            // La lógica del modelo (`if (imagenes !== undefined)`) se encarga del resto.
            updateData.imagenes = listaFinalImagenes.join(',');
        }

        const result = cuadrosModel.actualizarCuadro(id, updateData);

        if (!result) {
            // Esto podría ocurrir si hay un error en el modelo a pesar de haber encontrado el cuadro antes
            return res.status(500).json({ error: "No se pudo actualizar el cuadro" });
        }

        res.json({ message: "Cuadro actualizado correctamente" });
    } catch (error) {
        console.error(`Error al actualizar el cuadro ${id}:`, error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// Renderizar la página de detalle de un cuadro
export const verDetalleCuadro = (req, res) => {
    const { id } = req.params;
    try {
        const cuadro = cuadrosModel.obtenerCuadro(id);
        if (!cuadro) {
            // Si no se encuentra el cuadro, podrías renderizar una página de error 404
            return res.status(404).render('404', { titulo: 'Cuadro no encontrado' });
        }
        // El campo 'imagenes' ahora es un string separado por comas, lo convertimos a array
        if (cuadro.imagenes) {
            cuadro.imagenes = cuadro.imagenes.split(',');
        } else {
            cuadro.imagenes = [];
        }

        // Renderiza la nueva vista y le pasa los datos del cuadro
        res.render('cuadro-detalle', { titulo: cuadro.titulo, cuadro });
    } catch (error) {
        console.error("Error al obtener el detalle del cuadro:", error);
        res.status(500).send("Error interno del servidor");
    }
};
