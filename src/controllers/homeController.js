import { obtenerCuadros } from "../models/cuadrosModel.js";

export const mostrarLandign = (req, res) => {
    //obtenemos los cuadros para mostrarlos en la pagina de inicio
    const cuadros = obtenerCuadros();

    //seleccionmos 5 cuadros aleatorios
    const cuadrosAleatorios = cuadros.sort(() => 0.8 - Math.random()).slice(0, 8);

    res.render("index", { titulo: "Inicio", cuadros: cuadrosAleatorios });
}