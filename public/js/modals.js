import { $, $$ } from "./utils.js";

/* =========================================================
   🟢 MODALS - Gestión de ventanas modales (adaptado a HTML nuevo)
   ========================================================= */
export function Modals() {
    console.log("Modals JS cargado (adaptado)");

    /* =====================================================
       🔹 SELECTORES PRINCIPALES (coinciden con el HTML nuevo)
       ===================================================== */
    const modalContainer = $("#modals-root");           // wrapper global
    const overlay = $("#modalOverlay");                 // overlay global
    // selectores flexibles para botones que abren/cerran
    const openers = $$('[data-modal-target], [data-open-modal], [data-open]');
    const closeButtons = $$('[data-close-button], [data-close], .close-modal, [aria-label="Cerrar"]');

    /* =====================================================
       🔹 UTILIDADES INTERNAS
       ===================================================== */

    // Devuelve el panel interior (el que tiene las clases translate/opacity)
    const getPanel = (modal) => {
        if (!modal) return null;
        return modal.querySelector('.pointer-events-auto') || modal.querySelector(':scope > div') || modal;
    };

    // Devuelve todos los modales (wrapper role="dialog") dentro del root
    const allModals = () => Array.from(modalContainer ? modalContainer.querySelectorAll('[role="dialog"]') : []);

    // Devuelve modales actualmente abiertos (los wrappers que NO tienen pointer-events-none)
    const openModals = () => allModals().filter(m => !m.classList.contains('pointer-events-none') && !m.classList.contains('hidden'));

    /* =====================================================
       🔹 ABRIR / CERRAR MODAL
       ===================================================== */

    /**
     * openModal - Abre un modal específico
     * @param {HTMLElement} modal - wrapper que contiene el panel (.pointer-events-auto)
     */
    const openModal = (modal) => {
        if (!modal) return console.warn("openModal: no se encontró el modal");

        // mostrar contenedor global
        if (modalContainer) modalContainer.classList.remove('hidden');
        // mostrar overlay
        if (overlay) overlay.classList.remove('hidden');

        // permitir interacciones en el wrapper del modal
        modal.classList.remove('pointer-events-none', 'hidden');

        // animar overlay y panel interior
        setTimeout(() => {
            if (overlay) overlay.classList.remove('opacity-0');
            const panel = getPanel(modal);
            if (panel) {
                panel.classList.remove('translate-y-6', 'opacity-0');
                panel.classList.add('translate-y-0', 'opacity-100');
            }
        }, 30);

        // bloquear scroll del body
        document.body.style.overflow = 'hidden';

        // marcar como activo
        modal.classList.add('active');
    };

    /**
     * closeModal - Cierra un modal específico
     * @param {HTMLElement} modal - wrapper que contiene el panel (.pointer-events-auto)
     */
    const closeModal = (modal) => {
        if (!modal) return console.warn("closeModal: no se encontró el modal");

        const panel = getPanel(modal);
        // animación de salida: aplicar clases de "cerrado"
        if (panel) {
            panel.classList.add('translate-y-6', 'opacity-0');
            panel.classList.remove('translate-y-0', 'opacity-100');
        }
        if (overlay) overlay.classList.add('opacity-0');

        // esperar la transición antes de ocultar (coincide con duraciones en Tailwind)
        setTimeout(() => {
            // restaurar comportamientos del wrapper
            modal.classList.add('pointer-events-none', 'hidden');
            modal.classList.remove('active');

            // si ya no hay modales abiertos, ocultar overlay y el root y reactivar scroll
            const abiertos = openModals();
            if (abiertos.length === 0) {
                if (overlay) overlay.classList.add('hidden');
                if (modalContainer) modalContainer.classList.add('hidden');
                document.body.style.overflow = 'auto';
            } else {
                // si quedan modales abiertos, mostrar el overlay (y quitar hidden si estaba)
                if (overlay) overlay.classList.remove('hidden', 'opacity-0');
                if (modalContainer) modalContainer.classList.remove('hidden');
            }
        }, 180); // ligeramente mayor que las transiciones CSS para evitar parpadeos
    };

    /* =====================================================
       🔹 MODAL DE CONFIRMACIÓN (Promesa)
       ===================================================== */
    const confirmarAccion = (message = "¿Confirma la acción?") => {
        return new Promise((resolve, reject) => {
            const confirmModal = $("#confirmModal");
            if (!confirmModal) return reject(new Error("No se encontró el modal de confirmación"));

            // elementos dentro del confirm modal (IDs adaptados al HTML nuevo)
            const confirmTitle = $("#confirmTitle");
            const confirmDesc = $("#confirmDesc");
            const btnOk = $("#confirmOkBtn") || $("#confirmarBtn");           // soporte para IDs antiguos/nuevos
            const btnCancel = $("#confirmCancelBtn") || $("#confirmarCancelBtn") || $("#confirmCancel");

            // poner el mensaje en la descripción (mantener title fijo)
            if (confirmDesc) confirmDesc.textContent = message;

            // abrir
            openModal(confirmModal);

            // handlers
            const onConfirm = () => {
                cleanup();
                resolve();
            };
            const onCancel = () => {
                cleanup();
                reject();
            };
            const onKey = (e) => {
                if (e.key === "Enter") onConfirm();
                if (e.key === "Escape") onCancel();
            };

            const cleanup = () => {
                // remover listeners
                if (btnOk) btnOk.removeEventListener('click', onConfirm);
                if (btnCancel) btnCancel.removeEventListener('click', onCancel);
                document.removeEventListener('keydown', onKey);
                // cerrar modal
                closeModal(confirmModal);
            };

            // añadir listeners (con once para seguridad)
            if (btnOk) btnOk.addEventListener('click', onConfirm, { once: true });
            if (btnCancel) btnCancel.addEventListener('click', onCancel, { once: true });
            document.addEventListener('keydown', onKey);
        });
    };

    /* =====================================================
       🔹 INICIALIZACIÓN: eventos para abrir / cerrar modales
       ===================================================== */

    // abrir modales por botones con data-* (soporta varias formas)
    openers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = btn.dataset.modalTarget || btn.dataset.openModal || btn.dataset.open;
            if (!target) return console.warn('Botón open: falta el target (data-modal-target | data-open-modal | data-open).', btn);
            let modalEl = null;

            // si target es selector CSS (#id o .class) lo usamos tal cual, si es solo id, lo buscamos por id
            if (target.startsWith('#') || target.startsWith('.')) {
                modalEl = document.querySelector(target);
            } else {
                modalEl = $(`#${target}`);
                if (!modalEl) modalEl = document.querySelector(target); // intento fallback
            }

            if (!modalEl) return console.warn('No se encontró el modal objetivo:', target);
            openModal(modalEl);
        });
    });

    // cerrar modales por botones con data-close, data-close-button o por ser botón "Cerrar" dentro del modal
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // si tiene dataset.closeButton -> cierra modal por id
            const closeTarget = btn.dataset.closeButton || btn.dataset.close;
            if (closeTarget) {
                const modalTargetEl = $(`#${closeTarget}`) || document.querySelector(closeTarget);
                if (modalTargetEl) return closeModal(modalTargetEl);
            }

            // si no, intentamos cerrar el modal padre más cercano
            const parentModal = btn.closest('[role="dialog"]');
            if (parentModal) return closeModal(parentModal);

            // fallback: cerrar todos los modales abiertos
            openModals().forEach(m => closeModal(m));
        });
    });

    // click en overlay cierra todos los modales abiertos
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            // evitar que clicks dentro de panel se propaguen: solo responder si click real en overlay
            if (e.target !== overlay) return;
            openModals().forEach(m => closeModal(m));
        });
    }

    // ESC: cerrar el modal superior (o todos si quieres)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const abiertos = openModals();
            if (abiertos.length === 0) return;
            // cerrar el último (el más arriba en el DOM abierto)
            const ultimo = abiertos[abiertos.length - 1];
            closeModal(ultimo);
        }
    });

    /* =====================================================
       🔹 INICIALIZACIÓN ESTADO INICIAL
       ===================================================== */
    // Asegurarse de que todos los modales estén en su estado "oculto" esperado
    allModals().forEach(modal => {
        // wrapper debe tener pointer-events-none y hidden
        modal.classList.add('pointer-events-none', 'hidden');
        // panel interior debe tener translate-y-6 y opacity-0
        const panel = getPanel(modal);
        if (panel) {
            panel.classList.add('translate-y-6', 'opacity-0');
            panel.classList.remove('translate-y-0', 'opacity-100');
        }
    });

    // overlay en estado oculto inicial
    if (overlay) overlay.classList.add('opacity-0', 'hidden');

    // retornar API pública
    return { openModal, closeModal, confirmarAccion };
}
