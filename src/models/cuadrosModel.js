import db from "../config/db.js";

// Crear un nuevo cuadro
export function crearCuadro({ titulo, descripcion, imagen, subcategoria }) {
    const stmt = db.prepare(`INSERT INTO cuadros (titulo, descripcion, imagen, subcategoria_id) VALUES (?, ?, ?, ?)`);
    const info = stmt.run(titulo, descripcion, imagen, subcategoria);
    return { id: info.lastInsertRowid, titulo, descripcion, imagen, subcategoria };
}

// Obtener todos los cuadros con sus categorías y subcategorías
export function obtenerCuadros() {
    const stmt = db.prepare(`
        SELECT 
            c.id, 
            c.titulo, 
            c.descripcion, 
            c.imagen, 
            s.id AS subcategoria_id,
            s.nombre AS subcategoria, 
            cat.id AS categoria_id,
            cat.nombre AS categoria
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
    const stmt = db.prepare(`SELECT * FROM cuadros WHERE id = ? AND is_deleted = 0`);
    return stmt.get(id);
}

// Eliminar un cuadro por su ID
export function eliminarCuadro(id) {
    const stmt = db.prepare(`UPDATE cuadros SET is_deleted = 1 WHERE id = ?`);
    const info = stmt.run(id);
    return info.changes > 0; // Devuelve true si se eliminó una fila, false si no.
}

// Actualizar un cuadro por su ID
export function actualizarCuadro(id, { titulo, descripcion, imagen, subcategoria }) {
    const stmt = db.prepare(`UPDATE cuadros SET titulo = ?, descripcion = ?, imagen = ?, subcategoria_id = ? WHERE id = ? AND is_deleted = 0`);
    const info = stmt.run(titulo, descripcion, imagen, subcategoria, id);
    return info.changes > 0;
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
        SELECT c.id, c.titulo, c.descripcion, c.imagen,
               s.nombre AS subcategoria, cat.nombre AS categoria, c.creado_en
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