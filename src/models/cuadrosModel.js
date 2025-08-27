import db from "../config/db.js";

export function crearCuadro({titulo, descripcion, imagen, categoria}) {
    const stmt = db.prepare(`INSERT INTO cuadros (titulo, descripcion, imagen, categoria) VALUES (?, ?, ?, ?)`);
    const info = stmt.run(titulo, descripcion, imagen, categoria);
    return { id: info.lastInsertRowid, titulo, descripcion, imagen, categoria  };
}

export function obtenerCuadros() {
    const stmt = db.prepare(`SELECT * FROM cuadros ORDER BY creado_en DESC`);
    return stmt.all();
}

export function obtenerCuadrosPorCategoria(categoria) {
    const stmt = db.prepare(`SELECT * FROM cuadros WHERE categoria = ? ORDER BY creado_en DESC`);
    return stmt.all(categoria);
}

export function obtenerCuadro(id) {
    const stmt = db.prepare(`SELECT * FROM cuadros WHERE id = ?`);
    return stmt.get(id);
}

export function eliminarCuadro(id) {
    const stmt = db.prepare(`DELETE FROM cuadros WHERE id = ?`);
}

export function actualizarCuadro(id, {titulo, descripcion, imagen, categoria}) {
    const stmt = db.prepare(`UPDATE cuadros SET titulo = ?, descripcion = ?, imagen = ?, categoria = ? WHERE id = ?`);
    const info = stmt.run(titulo, descripcion, imagen, categoria, id);
    return info.changes > 0;
}
