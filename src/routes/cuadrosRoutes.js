import express from "express";
import multer  from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { mostrarCatalogo, mostrarSubirForm, procesarSubida } from "../controllers/cuadrosController";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPatch = path.join(__dirname, "../public/uploads");


const storage = multer.diskStorage({
    destination: uploadPatch,
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, unique);
    }
})

const upload = multer ({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // límite de 5MB

router.get("/catalogo", mostrarCatalogo);
router.get("/subir", mostrarSubirForm);
router.post("/subir", upload.single("imagen"), procesarSubida);

export default router; 