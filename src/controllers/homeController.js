import { cuadrosModel, categoriasModel } from "../models/index.js";

export const renderHomePage = (req, res) => {
  try {
    // Obtenemos todos los cuadros para la sección de catálogo
    const todosLosCuadros = cuadrosModel.obtenerCuadros();

    // Seleccionamos hasta 8 cuadros aleatorios para la sección de catálogo
    const cuadrosAleatorios = todosLosCuadros
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);

    // Obtenemos las categorías destacadas para la sección de categorías
    const categoriasDestacadas = categoriasModel.obtenerCategoriasDestacadas();

    res.render("index", {
      titulo: "Inicio",
      user: req.user, // Pasar el usuario para el header
      cuadros: cuadrosAleatorios,
      categoriasDestacadas,
    });
  } catch (error) {
    console.error("Error al renderizar la página de inicio:", error);
    res.status(500).render("error", {
      titulo: "Error",
      message: "Lo sentimos, ha ocurrido un error inesperado.",
      user: req.user,
    });
  }
};

