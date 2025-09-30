import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbpath = path.join(__dirname, "../../data/db.sqlite");

const db = new Database(dbpath);

// Habilitar claves foráneas
db.pragma("foreign_keys = ON");

// --- Definición Unificada del Esquema de la Base de Datos ---

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'viewer',
    estado TEXT NOT NULL DEFAULT 'activo',
    avatar TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    color TEXT,
    is_deleted INTEGER DEFAULT 0
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS subcategorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS cuadros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    imagen TEXT,
    subcategoria_id INTEGER NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0,
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id)
  )
`
).run();

db.prepare(
  `
CREATE TABLE IF NOT EXISTS cuadro_imagenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cuadro_id INTEGER NOT NULL,
    imagen_url TEXT NOT NULL,
    orden INTEGER DEFAULT 0,
    FOREIGN KEY (cuadro_id) REFERENCES cuadros(id) ON DELETE CASCADE
)
`
).run();

// --- Sembrado de la base de datos (Seed) ---
// Crea un usuario administrador por defecto si la tabla de usuarios está vacía.
const userCount = db
  .prepare("SELECT COUNT(*) as count FROM usuarios")
  .get().count;

if (userCount === 0) {
  console.log(
    "No se encontraron usuarios. Creando administrador por defecto..."
  );

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync("admin123", salt); // Contraseña por defecto: admin123

  const stmt = db.prepare(`
    INSERT INTO usuarios (nombre, password, rol, estado, avatar) 
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    "admin",
    hashedPassword,
    "admin",
    "activo",
    "/uploads/avatars/default.png"
  );

  console.log('✅ Usuario "admin" creado con contraseña "admin123".');
}

export default db;
