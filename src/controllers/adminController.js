// En tu controlador que renderiza el panel de administración
import { cuadrosModel, categoriasModel, usuariosModel } from '../models/index.js';

export const renderAdminPanel = (req, res) => {
    // Si no hay usuario en la sesión, redirigir al login
    if (!req.session.user) {
        return res.redirect('/login');
    }
    // ... obtener los cuadros y otras cosas que ya haces
    const totalCuadros = cuadrosModel.contarCuadrosActivos();
    const totalCategorias = categoriasModel.contarCategoriasActivas();
    const totalUsuarios = usuariosModel.contarUsuariosActivos();
    const cuadros = cuadrosModel.obtenerCuadros(); // This might be for a different part of the admin panel

    res.render('admin', {
        // ... otros datos
        user: req.session.user,
        titulo: 'Panel de Administración',
        cuadros: cuadros,
        totalCuadros: totalCuadros,
        totalCategorias: totalCategorias,
        totalUsuarios: totalUsuarios
    });
};
