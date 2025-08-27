import express from "express";
import { mostrarCatalogo } from "../controllers/catalogoController.js";
const router = express.Router();

router.get("/", mostrarCatalogo);

export default router;