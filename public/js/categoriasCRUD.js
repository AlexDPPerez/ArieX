import { $, $$ } from "./utils.js";

/* =========================================================
    CATEGORIAS CRUD - Gestión de categorías en la interfaz
   ========================================================= */

/**
 * CategoriasCRUD - Inicializa la gestión de categorías y subcategorías en la UI
 * @param {object} notyf - Instancia de Notyf para mostrar notificaciones
 * @param {object} modals - Módulo de gestión de modales (openModal, closeModal, etc.)
 */
export async function CategoriasCRUD(notyf, modals) {
    console.log("CategoriasCRUD.js cargado");

    /* =====================================================
       🔹 SELECTORES - Elementos del DOM que vamos a usar
       ===================================================== */
    const tituloModal = $('#crearCategoriaTitle');
    const submitBtn = $('#submitCrearCategoria');

    const form = $('#formCrearCategoria');         // formulario principal
    const categoriaIdInput = $('#categoriaId');    // hidden input para el ID
    const categoriaNombre = $('#categoriaNombre'); // input del nombre de categoría
    const categoriaError = $('#categoriaNombreHelp');   // mensaje de error para categoría
    const tablaCategorias = $('#tablaCategorias');           // tabla principal
    const tablaCategoriasBody = tablaCategorias.querySelector('tbody'); // Cuerpo de la tabla

    const subcatInput = $('#subcategoriaInput');   // input subcategoría
    const agregarBtn = $('#btnAgregarSubcat');  // botón "Agregar subcategoría"
    const subcatTableBody = $('#subcatTableBody'); // tbody donde se renderizan subcategorías
    const sinSubcat = $('#sinSubcat');             // mensaje "no hay subcategorías"
    const subcatError = $('#subcatHelp');         // error subcategoría
    const crearModal = $('#modalCrearCategoria');       // El modal de creación

    let subcategorias = []; // Array que almacena strings de subcategorías

    /* =====================================================
       🔹 UTILIDADES
       ===================================================== */

    /**
     * escapeHtml - Escapa caracteres HTML para prevenir ataques XSS.
     * @param {string} unsafe - El string a escapar.
     * @returns {string} El string escapado.
     */
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =====================================================
       🔹 FUNCIONES PRINCIPALES
       ===================================================== */

    /**
     * getCategorias - Obtiene todas las categorías con sus subcategorías desde la API.
     * @returns {Promise<Array>} Array de categorías para la tabla.
     */
    const getCategorias = async () => {
        try {
            const res = await fetch("/api/categorias/tabla", {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) throw new Error("Error al obtener las categorías");
            return await res.json();
        } catch (err) {
            console.error(err);
            notyf.error("No se pudieron cargar las categorías.");
            return [];
        }
    };

    /**
     * clearForm - Limpia todos los campos del formulario y reinicia subcategorías
     */
    function clearForm() {
        // Limpia el valor del input del nombre de la categoría.
        categoriaNombre.value = '';
        // Limpia el valor del input de la nueva subcategoría.
        subcatInput.value = '';
        // Vacía el array que contiene las subcategorías.
        subcategorias = [];
        // Vuelve a renderizar la tabla de subcategorías (que ahora estará vacía).
        renderSubcats();
        // Oculta los mensajes de error que pudieran estar visibles.
        categoriaError.classList.add('hidden');
        subcatError.classList.add('hidden');
    }

    /**
     * renderSubcats - Renderiza la lista de subcategorías en la tabla
     * Además actualiza los inputs hidden para envío del formulario
     */
    function renderSubcats() {
        // Vacía el contenido actual de la tabla para no duplicar filas.
        subcatTableBody.innerHTML = '';

        // Si no hay subcategorías en el array...
        if (subcategorias.length === 0) {
            // Muestra el mensaje "No hay subcategorías añadidas".
            sinSubcat.classList.remove('hidden');
            // Termina la ejecución de la función.
            return;
        }
        // Si hay subcategorías, oculta el mensaje de "no hay".
        sinSubcat.classList.add('hidden');

        // Itera sobre cada subcategoría en el array.
        subcategorias.forEach((sc, i) => {
            // Crea una nueva fila (<tr>) para la tabla.
            const tr = document.createElement('tr');
            tr.className = 'align-middle';
            // Define el HTML interno de la fila, incluyendo el nombre y el botón de eliminar.
            // Se usa un `data-index` para saber qué elemento eliminar después.
            tr.innerHTML = `
                <td class="px-4 py-3 text-sm">${escapeHtml(sc)}</td>
                <td class="px-4 py-2">
                    <div class="flex justify-end gap-2">
                        <button type="button" data-index="${i}" class="remove-subcat inline-flex items-center rounded-md px-2 py-1 text-xs font-medium hover:bg-zinc-800 focus:outline-none">
                            Eliminar
                        </button>
                    </div>
                </td>
            `;
            // Añade la nueva fila al cuerpo de la tabla.
            subcatTableBody.appendChild(tr);
        });

        // Llama a la función que crea los inputs hidden para el envío del formulario.
        syncHiddenInputs();
    }

    /**
     * syncHiddenInputs - Sincroniza los inputs hidden dentro del form para enviar subcategorías al backend
     */
    function syncHiddenInputs() {
        // Busca y elimina todos los inputs hidden que se crearon previamente.
        // Esto evita enviar subcategorías que ya fueron eliminadas de la lista.
        const prev = form.querySelectorAll('input[name="subcategorias[]"]');
        prev.forEach(n => n.remove());

        // Itera sobre el array actual de subcategorías.
        subcategorias.forEach(sc => {
            // Por cada subcategoría, crea un nuevo elemento <input>.
            const input = document.createElement('input');
            // Lo configura como tipo 'hidden' para que no sea visible.
            input.type = 'hidden';
            // Le asigna el nombre 'subcategorias[]', que el backend recibirá como un array.
            input.name = 'subcategorias[]';
            // Asigna el valor de la subcategoría al input.
            input.value = sc;
            // Añade el input al formulario para que se envíe con los demás datos.
            form.appendChild(input);
        });
    }

    /**
     * addSubcategoria - Añade una subcategoría a la lista
     * Valida que no esté vacía ni sea duplicada (case-insensitive)
     */
    function addSubcategoria() {
        // Obtiene el valor del input y elimina espacios en blanco al inicio y final.
        const val = subcatInput.value.trim();
        // Oculta cualquier mensaje de error previo.
        subcatError.textContent = "Presiona Enter o 'Agregar' para añadir a la lista."

        // Si el valor está vacío después de quitar espacios...
        if (!val) {
            // Muestra un mensaje de error.
            subcatError.textContent = 'La subcategoría no puede estar vacía.';
            subcatError.classList.remove('hidden');
            // Detiene la ejecución de la función.
            return;
        }

        // Comprueba si ya existe una subcategoría con el mismo nombre (ignorando mayúsculas/minúsculas).
        const exists = subcategorias.some(s => s.toLowerCase() === val.toLowerCase());
        if (exists) {
            // Si ya existe, muestra un mensaje de error.
            subcatError.textContent = 'La subcategoría ya existe.';
            subcatError.classList.remove('hidden');
            // Detiene la ejecución de la función.
            return;
        }

        // Si pasa las validaciones, añade la nueva subcategoría al array.
        subcategorias.push(val);
        // Limpia el input para que el usuario pueda añadir otra.
        subcatInput.value = '';
        // Vuelve a renderizar la tabla para mostrar la nueva subcategoría.
        renderSubcats();
        // Pone el foco de nuevo en el input para mejorar la experiencia de usuario.
        subcatInput.focus();
    }

    /* =====================================================
       🔹 EVENTOS / INICIADORES
       ===================================================== */

    // Evento delegado para eliminar subcategorías desde la tabla
    subcatTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-subcat');
        if (!btn) return;
        const idx = Number(btn.getAttribute('data-index'));
        if (!Number.isNaN(idx)) {
            subcategorias.splice(idx, 1);
            renderSubcats();
        }
    });

    // Evento botón "Agregar"
    agregarBtn.addEventListener('click', addSubcategoria);

    // Añadir subcategoría al presionar Enter
    subcatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSubcategoria();
        }
    });

    /* =====================================================
       🔹 MANEJADORES DE EVENTOS
       ===================================================== */

    /**
     * Valida el formulario antes de enviarlo.
     * @returns {boolean} - True si el formulario es válido, false en caso contrario.
     */
    function validateForm() {
        let isValid = true;
        categoriaError.classList.add('hidden');
        // Restablece el mensaje de ayuda para la subcategoría
        subcatError.textContent = "Presiona Enter o 'Agregar' para añadir a la lista.";

        // Validación del nombre de la categoría
        if (!categoriaNombre.value.trim()) {
            categoriaError.classList.remove('hidden');
            categoriaNombre.focus();
            isValid = false;
        }

        // Validación de subcategorías: debe haber al menos una.
        if (subcategorias.length === 0) {
            subcatError.textContent = 'Debes añadir al menos una subcategoría.';
            subcatError.classList.remove('hidden');
            // Pone el foco en el input de subcategoría si el nombre de categoría ya es válido.
            if (isValid) subcatInput.focus();
            isValid = false;
        }

        return isValid;
    }

    /**
     * @description Configura el modal para la creación de una nueva categoría.
     */
    const setupCreateModal = () => {
        tituloModal.textContent = "Nueva categoría";
        submitBtn.textContent = "Guardar categoría";
        clearForm();
        if (categoriaIdInput) categoriaIdInput.value = '';
    };

    /**
     * @description Configura el modal con los datos de una categoría existente para su edición.
     * @param {object} data - Los datos de la categoría a editar.
     */
    const setupEditModal = (data) => {
        tituloModal.textContent = "Editar Categoría";
        submitBtn.textContent = "Guardar Cambios";
        clearForm();

        // Inyectar datos en el formulario
        if (categoriaIdInput) categoriaIdInput.value = data.id;
        categoriaNombre.value = data.nombre;
        subcategorias = data.subcategorias;
        
        renderSubcats();
    };

    /**
   * @description Maneja el clic en el botón de editar una categoría.
   * @param {string} id - El ID de la categoría a editar.
   */
    const handleEditClick = (id, targetButton) => {
        const row = targetButton.closest('tr');
        if (!row) return;

        const data = {
            id: row.cells[0].textContent.trim(),
            nombre: row.cells[1].textContent.trim(),
            subcategorias: row.cells[2].textContent.trim() === 'Sin subcategorías' ? [] : row.cells[2].textContent.trim().split(',').map(s => s.trim())
        };
        setupEditModal(data);
        modals.openModal(crearModal);
    };

    /**
   * @description Maneja el clic en el botón de eliminar una categoría.
   * @param {string} id - El ID de la categoría a eliminar.
   * @param {HTMLElement} targetButton - El botón que fue presionado.
   */
    const handleDeleteClick = async (id, targetButton) => {
        const row = targetButton.closest('tr');
        if (!row) {
            console.error("No se pudo encontrar la fila a eliminar.");
            return;
        }

        const nombreCategoria = row.cells[1].textContent;

        try {
            await modals.confirmarAccion(`¿Estás seguro de que quieres eliminar la categoría "${nombreCategoria}"? Esto también eliminará sus subcategorías.`);

            const res = await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || 'Error en el servidor al eliminar.');
            }

            // Animación de salida y eliminación del DOM
            row.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                row.remove();
            }, 300); // Coincide con la duración de la transición

            notyf.success("Categoría eliminada correctamente.");

        } catch (err) {
            if (err) { // Si 'err' existe, es un error real.
                console.error("Error al eliminar:", err);
                notyf.error(err.message || "No se pudo eliminar la categoría.");
            } else { // Si 'err' es null/undefined, el usuario canceló la acción.
                console.log("Eliminación cancelada por el usuario.");
            }
        }
    };

    // Event listener para los botones de la tabla (Editar/Eliminar)
    tablaCategorias.addEventListener("click", async (e) => {
        const editBtn = e.target.closest(".btn-editar-categoria");
        if (editBtn) {
            handleEditClick(editBtn.dataset.id, editBtn);
        }

        const deleteBtn = e.target.closest(".btn-eliminar-categoria");
        if (deleteBtn) {
            await handleDeleteClick(deleteBtn.dataset.id, deleteBtn);
        }
    });

    /* =====================================================
       🔹 ENVÍO DEL FORMULARIO (SUBMIT)
       ===================================================== */
    form.addEventListener('submit', async (e) => {
        // 1. Prevenir el envío tradicional del formulario en todos los casos.
        e.preventDefault();

        // 2. Validar los campos del formulario. Si no es válido, detener la ejecución.
        if (!validateForm()) return;

        // 3. Determinar si es creación o edición y preparar los datos.
        const isEditing = !!(categoriaIdInput && categoriaIdInput.value);
        const id = isEditing ? categoriaIdInput.value : null;
        const url = isEditing ? `/api/categorias/${id}` : '/api/categorias';
        const method = isEditing ? 'PUT' : 'POST';
        const actionText = isEditing ? 'actualizada' : 'creada';

        const data = {
            nombre: categoriaNombre.value.trim(),
            subcategorias: subcategorias
        };

        // 4. Enviar los datos a la API y manejar la respuesta.
        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || `Error al ${isEditing ? 'actualizar' : 'crear'} la categoría`);
            }

            notyf.success(`Categoría ${actionText} exitosamente!`);
            modals.closeModal(crearModal);
            clearForm();
            await reloadTableData();
        } catch (error) {
            console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} categoría:`, error);
            notyf.error(error.message || `Error al ${isEditing ? 'actualizar' : 'crear'} la categoría.`);
        }

    });

    /* =====================================================
       🔹 RENDERIZADO Y RECARGA DE TABLA
       ===================================================== */

    /**
     * @description Renderiza las filas de la tabla de categorías.
     * @param {Array} categoriasData - Array de objetos de categoría.
     */
    function renderCategoriasTable(categoriasData) {
        tablaCategoriasBody.innerHTML = ''; // Limpiar el cuerpo de la tabla
        if (categoriasData.length === 0) {
            tablaCategoriasBody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-zinc-500">No hay categorías para mostrar.</td></tr>';
            return;
        }
        categoriasData.forEach(cat => {
            const tr = document.createElement('tr');
            tr.className = 'transition-all duration-300';
            // Solo admins y editores pueden ver los botones de acción
            const accionesHtml = (window.currentUser && (window.currentUser.rol === 'admin' || window.currentUser.rol === 'editor'))
                ? `<button data-id="${cat.id}" class="btn-editar-categoria px-2 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-800 transition-colors duration-200">Editar</button>
                   <button data-id="${cat.id}" class="btn-eliminar-categoria px-2 py-1 bg-rose-600 rounded text-sm hover:bg-rose-700 transition-colors duration-200">Eliminar</button>`
                : '';
            tr.innerHTML = `
                <td class="px-4 py-3 text-sm">${escapeHtml(String(cat.id))}</td>
                <td class="px-4 py-3 text-sm font-medium">${escapeHtml(cat.nombre)}</td>
                <td class="px-4 py-3 text-sm text-zinc-400">${escapeHtml(cat.subcategorias || 'Sin subcategorías')}</td>
                <td class="px-4 py-2 text-right">${accionesHtml}</td>
            `;
            tablaCategoriasBody.appendChild(tr);
        });
    }

    /** @description Obtiene los datos y renderiza la tabla. */
    async function reloadTableData() {
        const categoriasData = await getCategorias();
        renderCategoriasTable(categoriasData);
    }

    // Carga inicial de datos
    reloadTableData();

    // Listener para el botón de crear categoría para resetear el modal.
    // Asegúrate de que tu botón para abrir el modal tenga el id "crearCategoriaBtn".
    const crearCategoriaBtn = $('#crearCategoriaBtn');
    if (crearCategoriaBtn) {
        crearCategoriaBtn.addEventListener('click', setupCreateModal);
    }
}
