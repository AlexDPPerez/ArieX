import { obtenerCuadros } from "../models/cuadrosModel.js";

export const mostrarCatalogo = (req, res) => {
    const cuadros = obtenerCuadros();
    res.render("catalogo", { titulo: "Catalogo", cuadros });
}