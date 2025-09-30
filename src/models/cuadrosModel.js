import db from "../config/db.js";

// Crear un nuevo cuadro
export function crearCuadro({ titulo, descripcion, subcategoria, imagenes }) {
    const transaction = db.transaction(({ titulo, descripcion, subcategoria, imagenes }) => {
        // 1. Insertar el cuadro principal
        const cuadroStmt = db.prepare(`INSERT INTO cuadros (titulo, descripcion, subcategoria_id) VALUES (?, ?, ?)`);
        const info = cuadroStmt.run(titulo, descripcion, subcategoria);
        const cuadroId = info.lastInsertRowid;

        // 2. Insertar las imágenes asociadas
        if (cuadroId && imagenes && imagenes.length > 0) {
            const imgStmt = db.prepare(`INSERT INTO cuadro_imagenes (cuadro_id, imagen_url, orden) VALUES (?, ?, ?)`);
            imagenes.forEach((imgUrl, index) => {
                imgStmt.run(cuadroId, imgUrl, index);
            });
        }
        return { id: cuadroId };
    });
    return transaction({ titulo, descripcion, subcategoria, imagenes });
} 

// Obtener todos los cuadros con sus categorías y subcategorías
export function obtenerCuadros() {
    const stmt = db.prepare(`
        SELECT 
            c.id, 
            c.titulo, 
            c.descripcion, 
            (
                SELECT imagen_url FROM cuadro_imagenes 
                WHERE cuadro_id = c.id ORDER BY orden ASC LIMIT 1
            ) as imagen,
            (
                SELECT GROUP_CONCAT(imagen_url) FROM cuadro_imagenes 
                WHERE cuadro_id = c.id ORDER BY orden ASC
            ) as imagenes,
            s.id AS subcategoria_id,
            s.nombre AS subcategoria, 
            cat.id AS categoria_id,
            cat.nombre AS categoria,
            cat.color AS categoria_color
        FROM cuadros c
        JOIN subcategorias s ON c.subcategoria_id = s.id
        JOIN categorias cat ON s.categoria_id = cat.id
        WHERE c.is_deleted = 0
        ORDER BY c.id DESC
    `);
    return stmt.all();
}


// Obtener cuadros por categoría
export function obtenerCuadrosPorCategoria(categoria) {
    const stmt = db.prepare(`SELECT c.titulo, c.descripcion, s.nombre AS subcategoria, cat.nombre AS categoria
FROM cuadros c
JOIN subcategorias s ON c.subcategoria_id = s.id
JOIN categorias cat ON s.categoria_id = cat.id
WHERE cat.nombre = ? AND c.is_deleted = 0
ORDER BY creado_en DESC;`);
    return stmt.all(categoria);
}

// Obtener un cuadro por su ID
export function obtenerCuadro(id) {
    const stmt = db.prepare(`
        SELECT 
            c.id, 
            c.titulo, 
            c.descripcion, 
            s.nombre AS subcategoria, 
            cat.nombre AS categoria,
            cat.color AS categoria_color,
            (
                SELECT GROUP_CONCAT(imagen_url) 
                FROM cuadro_imagenes WHERE cuadro_id = c.id ORDER BY orden ASC
            ) as imagenes
        FROM cuadros c
        JOIN subcategorias s ON c.subcategoria_id = s.id
        JOIN categorias cat ON s.categoria_id = cat.id
        WHERE c.id = ? AND c.is_deleted = 0`);
    return stmt.get(id); // Devuelve el cuadro con los nombres de categoría/subcategoría
}

// Eliminar un cuadro por su ID
export function eliminarCuadro(id) {
    const stmt = db.prepare(`UPDATE cuadros SET is_deleted = 1 WHERE id = ?`);
    const info = stmt.run(id);
    return info.changes > 0; // Devuelve true si se eliminó una fila, false si no.
}

// Actualizar un cuadro por su ID
export function actualizarCuadro(id, { titulo, descripcion, subcategoria, imagenes }) {
    const transaction = db.transaction((data) => {
        // 1. Actualizar los datos del cuadro
        const cuadroStmt = db.prepare(`UPDATE cuadros SET titulo = ?, descripcion = ?, subcategoria_id = ? WHERE id = ? AND is_deleted = 0`);
        const info = cuadroStmt.run(data.titulo, data.descripcion, data.subcategoria, data.id);

        if (info.changes === 0) {
            return false; // El cuadro no existía
        }

        // 2. Actualizar imágenes: Borrar las antiguas e insertar las nuevas.
        // (Una estrategia más avanzada podría comparar y solo borrar/añadir las diferencias)
        // Solo modificar si se provee el array de imágenes (incluso si está vacío, para borrarlas todas).
        if (data.imagenes !== undefined) {
            const deleteStmt = db.prepare(`DELETE FROM cuadro_imagenes WHERE cuadro_id = ?`);
            deleteStmt.run(data.id);

            // El controlador puede pasar un string de URLs separadas por comas.
            // Lo convertimos a un array, filtrando valores vacíos que pueden resultar de .join(',') en un array vacío.
            // Si `imagenes` es `''`, `split` da `['']`, y `filter(Boolean)` lo limpia a `[]`.
            // Si `imagenes` es un string con datos, lo convierte en array.
            const listaImagenes = (typeof data.imagenes === 'string' && data.imagenes) ? data.imagenes.split(',') : [];

            if (listaImagenes.length > 0) {
                const imgStmt = db.prepare(`INSERT INTO cuadro_imagenes (cuadro_id, imagen_url, orden) VALUES (?, ?, ?)`);
                listaImagenes.forEach((imgUrl, index) => {
                    imgStmt.run(data.id, imgUrl, index);
                });
            }
        }
        return true;
    });
    return transaction({ id, titulo, descripcion, subcategoria, imagenes });
}

// Mostrar catálogo paginado con filtros
export function mostrarCatalogoPaginado(pagina, limite, filtros = {}) {
    const page = Math.max(1, parseInt(pagina || '1', 10));
    const limit = Math.max(1, parseInt(limite || '12', 10)); // Mostrar por defecto 12
    const offset = (page - 1) * limit;

    const { categoria, subcategoria, search } = filtros;

    // Construir WHERE dinámico y params
    let where = ' WHERE c.is_deleted = 0 ';
    const params = [];

    if (categoria) {
        where += ' AND cat.nombre = ? ';
        params.push(categoria);
    }
    if (subcategoria) {
        where += ' AND s.nombre = ? ';
        params.push(subcategoria);
    }
    if (search) {
        where += ' AND (c.titulo LIKE ? OR c.descripcion LIKE ?) ';
        params.push(`%${search}%`, `%${search}%`);
    }

    // Consulta principal con joins
    const dataQuery = `
        SELECT c.id, c.titulo, c.descripcion, 
               (
                   SELECT imagen_url FROM cuadro_imagenes 
                   WHERE cuadro_id = c.id ORDER BY orden ASC LIMIT 1
               ) as imagen,
               s.nombre AS subcategoria, cat.nombre AS categoria, cat.color as categoria_color, c.creado_en
        FROM cuadros c
        JOIN subcategorias s ON c.subcategoria_id = s.id
        JOIN categorias cat ON s.categoria_id = cat.id
        ${where}
        ORDER BY c.creado_en DESC
        LIMIT ? OFFSET ?
    `;
    const dataParams = params.concat([limit, offset]);
    const cuadros = db.prepare(dataQuery).all(...dataParams);

    // Consulta count para total
    const countQuery = `
        SELECT COUNT(*) AS total
        FROM cuadros c
        JOIN subcategorias s ON c.subcategoria_id = s.id
        JOIN categorias cat ON s.categoria_id = cat.id
        ${where}
    `;
    const totalRow = db.prepare(countQuery).get(...params);
    const total = totalRow ? totalRow.total : 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // Retornar los datos
    return {
        cuadros,
        total,
        totalPages,
        currentPage: page,
    };
}

/** @description Cuenta los cuadros activos */
export function contarCuadrosActivos() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM cuadros WHERE is_deleted = 0');
    return stmt.get().count;
}