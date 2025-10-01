import { cuadrosModel, categoriasModel } from "../models/index.js";

export const mostrarCatalogo = (req, res) => {
  try {
    const { page, limit, ...filtros } = req.query;
    const categoria = filtros.categoria || undefined;
    const subcategoria = filtros.subcategoria || undefined;
    const search = filtros.search || undefined;

    const data = cuadrosModel.mostrarCatalogoPaginado(page, limit, filtros);
    const categoriasParaFiltro = categoriasModel.obtenerCategoriasConSubcategoriasAnidadas();

    res.render("catalogo", {
      titulo: "Catalogo",
      categoria: categoria,
      subcategoria: subcategoria,
      search: search,
      categoriasParaFiltro: categoriasParaFiltro,
      ...data,
    });
  } catch (error) {
    console.error("Error al mostrar el catálogo:", error);
    res
      .status(500)
      .render("error", {
        message: "No se pudo cargar el catálogo.",
        error: error
      });
  }
};
