import { obtenerUsuarioPorNombre } from "../models/usuariosModel.js";
import bcrypt from "bcryptjs";

// Renderiza la página de login
export const renderLoginPage = (req, res) => {
    res.render('login', {
        layout: false, // No usar el layout principal para la página de login
        titulo: "Iniciar Sesión"
    });
};

// Maneja el envío del formulario de login
export const handleLogin = (req, res) => {
    const { nombre, password } = req.body;

    const handleError = (status, message) => {
        // Si la petición AJAX espera JSON, devolvemos JSON. Si no, renderizamos la página.
        if (req.accepts('json')) {
            return res.status(status).json({ message });
        }
        return res.status(status).render('login', { layout: false, titulo: "Iniciar Sesión", error: message });
    };

    if (!nombre || !password) {
        return handleError(400, "Nombre y contraseña son obligatorios.");
    }

    const usuario = obtenerUsuarioPorNombre(nombre);

    // Verificar si el usuario existe y la contraseña es correcta
    if (!usuario || !bcrypt.compareSync(password, usuario.password)) {
        return handleError(401, "Credenciales incorrectas.");
    }

    // Guardar usuario en la sesión (sin la contraseña)
    req.session.user = {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol, // Asegúrate que la propiedad es 'rol'
        avatar: usuario.avatar
    };

    // Para peticiones AJAX, enviamos una respuesta de éxito para que el cliente redirija.
    if (req.accepts('json')) {
        return res.status(200).json({ redirectTo: '/admin' });
    }

    // Para envíos de formulario tradicionales, redirigimos directamente.
    res.redirect('/admin');
};

// Maneja el logout
export const handleLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/admin'); // Si hay error, que se quede ahí
        }
        res.clearCookie('connect.sid'); // Limpia la cookie de sesión
        res.redirect('/login');
    });
};

// Middleware para proteger rutas
export const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next(); // Si el usuario está en la sesión, continuar
    }

    // Si la petición es AJAX (espera JSON), enviamos un error 401 en lugar de redirigir.
    // Esto evita que el frontend intente parsear una página HTML como si fuera JSON.
    if (req.accepts('json') && !req.accepts('html')) {
        return res.status(401).json({ message: 'Sesión expirada. Por favor, inicie sesión de nuevo.' });
    }

    // Para peticiones de navegador normales, redirigimos a la página de login.
    res.redirect('/login');
};

// Middleware para verificar si el usuario es Administrador
export const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'admin') {
        return next();
    }
    // Para peticiones AJAX, devolvemos un error 403.
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador.' });
};

// Middleware para verificar si es Administrador O Editor
export const isAdminOrEditor = (req, res, next) => {
    if (req.session.user && (req.session.user.rol === 'admin' || req.session.user.rol === 'editor')) {
        return next();
    }
    // Para peticiones AJAX, devolvemos un error 403.
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador o Editor.' });
};
