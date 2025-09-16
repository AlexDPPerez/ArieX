import { obtenerCuadros } from "../models/cuadrosModel.js";


export const mostrarCatalogo = (req, res) => {

    const categoria = req.query.categoria;
    let cuadros = obtenerCuadros();

    //filtrar los cuadros por categoria si se proporciona
    if(categoria){
        cuadros = cuadros.filter(cuadro => cuadro.categoria === categoria);
    }

    res.render("catalogo", { titulo: "Catalogo", cuadros, categoria});
}
