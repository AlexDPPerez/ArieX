import express from "express";
import { renderLoginPage, handleLogin, handleLogout } from "../controllers/authController.js";

const router = express.Router();

router.get("/login", renderLoginPage);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);

export default router;
