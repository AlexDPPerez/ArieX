import express from "express";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";
import cuadrosRoutes from "./routes/cuadrosRoutes.js";
import categoriasRoutes from "./routes/categoriasRoutes.js";
import catalogoRoutes from "./routes/catalogoRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import usuariosRoutes from "./routes/usuariosRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { isAuthenticated, isAdmin } from "./controllers/authController.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Configuración de Sesión
app.use(session({
    secret: 'un_secreto_muy_fuerte_y_largo_para_produccion', // Cambia esto por una cadena aleatoria y segura
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // En producción, si usas HTTPS, pon esto en 'true'
}));

app.use(express.static("dist"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(expressLayouts);

// Middleware para pasar datos de sesión a todas las vistas
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// logging + instance header
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — pid:${process.pid}`);
    res.setHeader('X-Instance', process.pid);
    next();
  });

// Rutas
app.use("/", homeRoutes);
app.use("/", authRoutes); // Rutas de login/logout
app.use("/catalogo", catalogoRoutes);
app.use("/admin", isAuthenticated, adminRoutes); // <-- RUTA PROTEGIDA

app.use(cuadrosRoutes); // ? le quité el prefijo /api porque las rutas ya lo tienen
app.use(categoriasRoutes); // ? le quité el prefijo /api porque las rutas ya lo tienen
app.use(isAuthenticated, isAdmin, usuariosRoutes); // <-- APIs DE USUARIOS PROTEGIDAS SOLO PARA ADMIN


app.use((req, res, next) => {
    console.log(`Ruta solicitada: ${req.originalUrl}`);
    next();
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
