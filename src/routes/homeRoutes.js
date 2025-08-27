import express from "express";
import { mostrarLandign } from "../controllers/homeController.js";
const router = express.Router();

router.get("/", mostrarLandign);

export default router;