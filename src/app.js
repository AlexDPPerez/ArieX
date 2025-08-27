import express from "express";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";
import cuadrosRoutes from "./routes/cuadrosRoutes.js";
import catalogoRoutes from "./routes/catalogoRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(expressLayouts);

// logging + instance header
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} — pid:${process.pid}`);
    res.setHeader('X-Instance', process.pid);
    next();
  });

// Rutas
app.use("/", homeRoutes);
app.use("/catalogo", catalogoRoutes);

app.use((req, res, next) => {
    console.log(`Ruta solicitada: ${req.originalUrl}`);
    next();
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
