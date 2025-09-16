import express from "express";
import { renderAdminPanel } from "../controllers/adminController.js";

const router = express.Router();

//mostrar panel admin
router.get("/", renderAdminPanel);

export default router;