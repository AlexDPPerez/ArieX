import express from "express";
import { mostrarLandign } from "../controllers/homeController";
const router = express.Router();

router.get("/", mostrarLandign);

export default router;