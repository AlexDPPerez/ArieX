import express from "express";
import multer  from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { todosLosCuadros , CuadrosPorCategoria, subirCuadro, eliminarCuadro , actualizarCuadro} from "../controllers/cuadrosController.js";
import { isAuthenticated, isAdminOrEditor } from "../controllers/authController.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadPatch = path.join(__dirname, "../../public/uploads");


const storage = multer.diskStorage({
    destination: uploadPatch,
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, unique);
    }
})

const upload = multer ({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // límite de 5MB

//obtener todos los cuadros
router.get("/api/cuadros", isAuthenticated, todosLosCuadros);
//obtener cuadros por categoría
router.get("/api/cuadros/categoria", isAuthenticated, CuadrosPorCategoria);
//crear un nuevo cuadro
router.post("/api/cuadros/crear", isAuthenticated, isAdminOrEditor, upload.single("imagen") ,subirCuadro);
//eliminar un cuadro por su id
router.delete("/api/cuadros/:id", isAuthenticated, isAdminOrEditor, eliminarCuadro);
//actualizar un cuadro por su id
router.put("/api/cuadros/:id", isAuthenticated, isAdminOrEditor, upload.single("imagen"), actualizarCuadro)

export default router; 