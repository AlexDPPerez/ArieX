import db from "../config/db.js";
import bcrypt from "bcryptjs";

// Crear un nuevo usuario
export function crearUsuario({ nombre, password, rol, estado, avatar }) {
    // Hashear la contraseña antes de guardarla
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`INSERT INTO usuarios (nombre, password, rol, estado, avatar) VALUES (?, ?, ?, ?, ?)`);
    const info = stmt.run(nombre, hashedPassword, rol, estado, avatar);
    return { id: info.lastInsertRowid, nombre, rol, estado, avatar };
}

// Obtener todos los usuarios
export function obtenerUsuarios() {
    const stmt = db.prepare(`
        SELECT id, nombre, rol, estado, avatar, creado_en
        FROM usuarios
        WHERE is_deleted = 0
        ORDER BY id DESC
    `);
    return stmt.all();
}

// Obtener un usuario por su ID
export function obtenerUsuario(id) {
    const stmt = db.prepare(`SELECT * FROM usuarios WHERE id = ? AND is_deleted = 0`);
    return stmt.get(id);
}

// Obtener un usuario por su nombre (para el login)
export function obtenerUsuarioPorNombre(nombre) {
    const stmt = db.prepare(`SELECT * FROM usuarios WHERE nombre = ? AND is_deleted = 0`);
    return stmt.get(nombre);
}

// Eliminar un usuario por su ID (soft delete)
export function eliminarUsuario(id) {
    const stmt = db.prepare(`UPDATE usuarios SET is_deleted = 1 WHERE id = ?`);
    const info = stmt.run(id);
    return info.changes > 0;
}

// Actualizar un usuario por su ID
export function actualizarUsuario(id, { nombre, rol, estado, avatar, password }) {
    // Si se proporciona una nueva contraseña, hashearla. Si no, mantener la existente.
    if (password) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const stmt = db.prepare(`UPDATE usuarios SET nombre = ?, rol = ?, estado = ?, avatar = ?, password = ? WHERE id = ? AND is_deleted = 0`);
        const info = stmt.run(nombre, rol, estado, avatar, hashedPassword, id);
        return info.changes > 0;
    }
    const stmt = db.prepare(`
        UPDATE usuarios 
        SET nombre = ?, rol = ?, estado = ?, avatar = ? 
        WHERE id = ? AND is_deleted = 0
    `);
    const info = stmt.run(nombre, rol, estado, avatar, id);
    return info.changes > 0;
}

// Contar usuarios activos
export function contarUsuariosActivos() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE is_deleted = 0');
    const result = stmt.get();
    return result ? result.count : 0;
}
