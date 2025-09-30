import { cuadrosModel } from "../models/index.js";


export const mostrarCatalogo = (req, res) => {
    try {
        const { page, limit, ...filtros } = req.query;
        const data = cuadrosModel.mostrarCatalogoPaginado(page, limit, filtros);

        res.render("catalogo", { titulo: "Catalogo", ...data });
    } catch (error) {
        console.error("Error al mostrar el catálogo:", error);
        res.status(500).render('error', { titulo: "Error", mensaje: "No se pudo cargar el catálogo." });
    }
}
