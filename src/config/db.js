import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbpath = path.join(__dirname, "../../data/db.sqlite");

const db = new Database(dbpath);

// crear tabla si no existe
db.prepare(`
    CREATE TABLE IF NOT EXISTS cuadros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      imagen TEXT,
      categoria TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  export default db;