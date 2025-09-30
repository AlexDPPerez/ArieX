import { Modals } from './modals.js';
import { CuadrosCRUD } from './cuadrosCrud.js';
import { CategoriasCRUD } from './categoriasCRUD.js';
import { UsuariosCRUD } from './usuariosCRUD.js';
import { DestacadasCRUD } from './destacadasCRUD.js';

/* =========================================================
   🚀 MAIN - Inicialización de la aplicación
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    console.log("main.js cargado");

    /* =====================================================
       🔹 MODALES
       ===================================================== */
    // Inicializar funcionalidad de modales
    const modals = Modals();

    /* =====================================================
       🔹 NOTIFICACIONES
       ===================================================== */
    // Inicializar Notyf (opcional)
    const notyf = new Notyf({
        duration: 2000,                    // Duración de la notificación en ms
        position: { x: "right", y: "bottom" }, // Posición en pantalla
        dismissible: true                   // Permite cerrar manualmente
    });

    /* =====================================================
       🔹 CUADROS CRUD
       ===================================================== */
    // Inicializar gestión de cuadros con Notyf para notificaciones
    CuadrosCRUD(notyf, modals);
    CategoriasCRUD(notyf, modals);
    UsuariosCRUD(notyf, modals);
    DestacadasCRUD(notyf)
});
