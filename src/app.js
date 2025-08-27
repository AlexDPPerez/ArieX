import express from "express";
import expressLayouts from "express-ejs-layouts";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(expressLayouts);

// Simulación de DB en memoria
let productos = [];

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../public/uploads"),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Rutas
app.get("/", (req, res) => res.render("index", { titulo: "Inicio" }));

app.get("/catalogo", (req, res) => {
  res.render("catalogo", { titulo: "Catálogo", productos });
});

app.get("/subir", (req, res) => {
  res.render("subir", { titulo: "Subir Cuadro" });
});

app.post("/subir", upload.single("imagen"), (req, res) => {
  const { titulo, descripcion } = req.body;
  const imagen = req.file.filename;
  productos.push({ titulo, descripcion, imagen });
  res.redirect("/catalogo");
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
