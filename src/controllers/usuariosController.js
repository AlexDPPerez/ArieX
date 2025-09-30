import { usuariosModel } from "../models/index.js";

// Obtener todos los usuarios
export const obtenerTodosUsuarios = (req, res) => {
    try {
        const usuarios = usuariosModel.obtenerUsuarios();
        res.json(usuarios);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener los usuarios." });
    }
};

// Crear un nuevo usuario
export const crearNuevoUsuario = (req, res) => {
    const { nombre, password, rol, estado } = req.body;
    const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : '/uploads/avatars/default.png';

    if (!nombre || !rol || !estado || !password) {
        return res.status(400).json({ message: "Nombre, contraseña, rol y estado son obligatorios." });
    }

    if (password.length < 4) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 4 caracteres." });
    }

    try {
        const nuevoUsuario = usuariosModel.crearUsuario({ nombre, password, rol, estado, avatar });
        res.status(201).json({ message: "Usuario creado con éxito", usuario: nuevoUsuario });
    } catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ message: "Error interno del servidor al crear el usuario." });
    }
};

// Actualizar un usuario existente
export const actualizarUsuarioExistente = (req, res) => {
    const { id } = req.params;
    const { nombre, rol, estado, password } = req.body;

    if (!nombre || !rol || !estado) {
        return res.status(400).json({ message: "Nombre, rol y estado son obligatorios." });
    }
    
    if (password && password.length < 4) {
        return res.status(400).json({ message: "La nueva contraseña debe tener al menos 4 caracteres." });
    }

    try {
        const usuarioExistente = usuariosModel.obtenerUsuario(id);
        if (!usuarioExistente) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // Manejar la imagen: si no se sube una nueva, se mantiene la anterior
        const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : usuarioExistente.avatar;

        // El objeto de actualización solo incluirá la contraseña si se proporcionó una nueva.
        const datosActualizados = { nombre, rol, estado, avatar };
        if (password) datosActualizados.password = password;
        const success = usuariosModel.actualizarUsuario(id, datosActualizados);

        if (success) {
            res.json({ message: "Usuario actualizado correctamente." });
        } else {
            res.status(500).json({ message: "No se pudo actualizar el usuario." });
        }
    } catch (error) {
        console.error(`Error al actualizar usuario ${id}:`, error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// Eliminar un usuario
export const eliminarUsuarioExistente = (req, res) => {
    const { id } = req.params;
    try {
        const success = usuariosModel.eliminarUsuario(id);
        if (success) {
            res.json({ message: "Usuario eliminado correctamente." });
        } else {
            res.status(404).json({ message: "Usuario no encontrado o ya eliminado." });
        }
    } catch (error) {
        console.error(`Error al eliminar usuario ${id}:`, error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};