import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
    crearNuevoUsuario,
    obtenerTodosUsuarios,
    actualizarUsuarioExistente,
    eliminarUsuarioExistente
} from "../controllers/usuariosController.js";

const router = express.Router();

// Configuración de Multer para subida de avatares
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPath = path.join(__dirname, "../../public/uploads/avatars");

// Asegurarse de que el directorio de subida existe
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadPath,
    filename: (req, file, cb) => {
        const unique = `avatar-${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, unique);
    }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // Límite de 5MB

// --- Rutas para Usuarios ---
router.route("/api/usuarios")
    .get(obtenerTodosUsuarios)
    .post(upload.single("avatar"), crearNuevoUsuario);

router.route("/api/usuarios/:id")
    .put(upload.single("avatar"), actualizarUsuarioExistente)
    .delete(eliminarUsuarioExistente);

export default router;