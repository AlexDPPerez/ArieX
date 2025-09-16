import db from "../config/db.js";

/**
 * Crea una nueva categoría y sus subcategorías asociadas en una transacción.
 * Esto asegura que si la creación de una subcategoría falla, la categoría principal tampoco se crea.
 *
 * @param {object} data - Objeto con los datos a insertar.
 * @param {string} data.nombre - El nombre de la nueva categoría.
 * @param {string[]} data.subcategorias - Un array con los nombres de las subcategorías.
 * @returns {number} El ID de la categoría recién creada.
 * @throws {Error} Si ocurre un error durante la transacción en la base de datos.
 */
export const crearCategoriaConSubcategorias = ({ nombre, subcategorias }) => {
    // Prepara una transacción para asegurar la integridad de los datos.
    const transaction = db.transaction((data) => {
        // 1. Insertar la categoría principal y obtener su ID.
        const categoriaStmt = db.prepare('INSERT INTO categorias (nombre) VALUES (?)');
        const infoCategoria = categoriaStmt.run(data.nombre);
        const categoriaId = infoCategoria.lastInsertRowid;

        if (!categoriaId) {
            throw new Error('No se pudo crear la categoría principal.');
        }

        // 2. Preparar la consulta para insertar las subcategorías.
        const subcategoriaStmt = db.prepare('INSERT INTO subcategorias (nombre, categoria_id) VALUES (?, ?)');

        // 3. Iterar y ejecutar la inserción para cada subcategoría.
        for (const subcatNombre of data.subcategorias) {
            subcategoriaStmt.run(subcatNombre, categoriaId);
        }

        return categoriaId; // Devolver el ID si todo fue exitoso.
    });

    // Ejecutar la transacción y devolver el resultado.
    return transaction({ nombre, subcategorias });
};

/**
 * Actualiza una categoría y sus subcategorías en una transacción.
 *
 * @param {number|string} id - El ID de la categoría a actualizar.
 * @param {object} data - Objeto con los nuevos datos.
 * @param {string} data.nombre - El nuevo nombre de la categoría.
 * @param {string[]} data.subcategorias - El array final de nombres de subcategorías.
 * @returns {void}
 * @throws {Error} Si la categoría no existe o si una subcategoría a eliminar está en uso.
 */
export const actualizarCategoriaConSubcategorias = (id, { nombre, subcategorias }) => {
    const transaction = db.transaction((data) => {
        // 1. Verificar que la categoría existe
        const catExists = db.prepare('SELECT id FROM categorias WHERE id = ? AND is_deleted = 0').get(data.id);
        if (!catExists) {
            throw new Error('La categoría que intentas actualizar no existe.');
        }

        // 2. Actualizar el nombre de la categoría
        db.prepare('UPDATE categorias SET nombre = ? WHERE id = ?').run(data.nombre, data.id);

        // 3. Obtener las subcategorías existentes
        const existingSubcats = db.prepare('SELECT id, nombre FROM subcategorias WHERE categoria_id = ? AND is_deleted = 0').all(data.id);
        const existingSubcatNames = new Set(existingSubcats.map(sc => sc.nombre));
        const newSubcatNames = new Set(data.subcategorias);

        // 4. Determinar qué subcategorías eliminar y cuáles añadir
        const subcatsToDelete = existingSubcats.filter(sc => !newSubcatNames.has(sc.nombre));
        const subcatsToAdd = data.subcategorias.filter(scName => !existingSubcatNames.has(scName));

        // 5. Eliminar (marcar como eliminadas) las subcategorías que ya no están
        if (subcatsToDelete.length > 0) {
            const checkStmt = db.prepare('SELECT 1 FROM cuadros WHERE subcategoria_id = ? AND is_deleted = 0 LIMIT 1');
            const deleteStmt = db.prepare('UPDATE subcategorias SET is_deleted = 1 WHERE id = ?');
            
            for (const subcat of subcatsToDelete) {
                if (checkStmt.get(subcat.id)) {
                    const error = new Error(`No se puede eliminar la subcategoría "${subcat.nombre}" porque está en uso.`);
                    error.code = 'SQLITE_CONSTRAINT_FOREIGNKEY';
                    throw error;
                }
                deleteStmt.run(subcat.id);
            }
        }

        // 6. Añadir nuevas subcategorías
        const addStmt = db.prepare('INSERT INTO subcategorias (nombre, categoria_id) VALUES (?, ?)');
        for (const subcatName of subcatsToAdd) {
            addStmt.run(subcatName, data.id);
        }
    });

    transaction({ id, nombre, subcategorias });
};

/** @description Crea una nueva categoría. */
export function crearCategoria(nombre) {
    const stmt = db.prepare(`INSERT INTO categorias (nombre) VALUES (?)`);
    const info = stmt.run(nombre);
    return {id: info.lastInsertRowid, nombre};
}

/** @description Crea una nueva subcategoría. */
export function crearSubcategoria(nombre, categoria_id) {
    const stmt = db.prepare(`INSERT INTO subcategorias (nombre, categoria_id) VALUES (?, ?)`);
    const info = stmt.run(nombre, categoria_id);
    return {id: info.lastInsertRowid, nombre, categoria_id};
}

/** @description Obtiene todas las categorías de la base de datos. */
export function obtenerCategorias() {
    const stmt = db.prepare(`SELECT * FROM categorias WHERE is_deleted = 0 ORDER BY id DESC `);
    return stmt.all();
}

/** @description Obtiene todas las subcategorías de la base de datos. */
export function obtenerSubcategorias() {
    const stmt = db.prepare(`SELECT * FROM subcategorias WHERE is_deleted = 0`);
    return stmt.all();
}

/** @description Obtiene todas las subcategorías para un ID de categoría específico. */
export function subcategoriasPorCategoria(categoria_id) {
    const stmt = db.prepare(`SELECT * FROM subcategorias WHERE categoria_id = ? AND is_deleted = 0`);
    return stmt.all(categoria_id)
}

/** @description Obtiene todas las categorías con sus subcategorías concatenadas. */
export function obtenerCategoriasConSubcategorias() {
    const stmt = db.prepare(`
        SELECT
            c.id,
            c.nombre,
            GROUP_CONCAT(s.nombre, ', ') AS subcategorias
        FROM categorias c
        LEFT JOIN subcategorias s ON c.id = s.categoria_id AND s.is_deleted = 0
        WHERE c.is_deleted = 0
        GROUP BY c.id, c.nombre
        ORDER BY c.id DESC
    `);
    return stmt.all();
}

/** @description Elimina una categoría y sus subcategorías asociadas. */
export function eliminarCategoria(id) {
    // Usa una transacción para asegurar que ambas eliminaciones (subcategorías y categoría) tengan éxito o fallen juntas.
    const transaction = db.transaction((catId) => {
        // 1. Verificar que ninguna subcategoría de esta categoría esté en uso por un cuadro ACTIVO.
        const checkStmt = db.prepare(`
            SELECT 1 FROM cuadros c
            JOIN subcategorias s ON c.subcategoria_id = s.id
            WHERE s.categoria_id = ? AND c.is_deleted = 0
            LIMIT 1
        `);
        const inUse = checkStmt.get(catId);

        if (inUse) {
            // Si está en uso por un cuadro activo, lanzamos un error que será capturado por el controlador.
            const error = new Error('FOREIGN KEY constraint failed');
            error.code = 'SQLITE_CONSTRAINT_FOREIGNKEY';
            throw error;
        }

        // 2. Marcar como eliminadas las subcategorías asociadas.
        db.prepare('UPDATE subcategorias SET is_deleted = 1 WHERE categoria_id = ?').run(catId);
        // 3. Marcar como eliminada la categoría principal.
        const info = db.prepare('UPDATE categorias SET is_deleted = 1 WHERE id = ?').run(catId);
        return info.changes > 0;
    });

    return transaction(id);
}

/** @description Cuenta las categorias activas */
export function contarCategoriasActivas() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM categorias WHERE is_deleted = 0');
    return stmt.get().count;
}
