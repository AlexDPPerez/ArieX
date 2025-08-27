import path from "path";
import { crearCuadro, obtenerCuadros, obtenerCuadrosPorCategoria } from "../models/cuadrosModel";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const mostrarCatalogo = (req, res) => {
    const categoria = req.query.categoria;
    const cuadros = categoria ? obtenerCuadrosPorCategoria(categoria) : obtenerCuadros();
    res.render("catalogo", { titulo: "Catálogo", cuadros, categoria });
};

export const mostrarSubirForm = (req, res) => {
    res.render("subir", { titulo: "Subir Cuadro" });
};

export const procesarSubida = (req, res) => {
    try{
        const { titulo, descripcion, categoria } = req.body;

        const imagen = req.file ? req.file.filename : null;
        crearCuadro({ titulo, descripcion, imagen, categoria });
        res.redirect("/catalogo");

    }catch(error){
        console.error("Error al subir el cuadro:", error);
        res.status(500).send("Error al subir el cuadro.");
    }
};