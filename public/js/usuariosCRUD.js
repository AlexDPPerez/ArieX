import { $, $$ } from "./utils.js";

/* =========================================================
   👤 USUARIOS CRUD - Gestión de usuarios en la interfaz
   ========================================================= */
export async function UsuariosCRUD(notyf, modals) {
   console.log("usuariosCRUD.js cargado");

   /* =====================================================
      🔹 SELECTORES
      ===================================================== */
   const tabla = $("#tablaUsuarios");
   const crearBtn = $("#crearUsuarioBtn");
   const crearModal = $("#modalCrearUsuario");
   const tituloModal = $("#crearUsuarioTitle");
   const submitBtn = $("#submitCrearUsuario");
   const form = $("#formCrearUsuario");
   const avatarPreview = $("#avatarPreview");
   const tablaBody = tabla ? tabla.querySelector('tbody') : null;

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
      return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
   }


   /* =====================================================
     🔹 FUNCIONES API
     ===================================================== */

   /**
    * @description Obtiene todos los usuarios desde la API.
    * @returns {Promise<Array>} Array de usuarios.
    */
   const getUsuarios = async () => {
      try {
         const res = await fetch("/api/usuarios", {
            headers: {
               'Accept': 'application/json'
            }
         });
         if (!res.ok) throw new Error("Error al obtener los usuarios");
         return await res.json();
      } catch (err) {
         console.error(err);
         notyf.error("No se pudieron cargar los usuarios.");
         return [];
      }
   };

   /**
    * @description Recarga los datos de la tabla de usuarios.
    */
   const reloadTableData = async () => {
      try {
         if (tabla) {
            const usuarios = await getUsuarios();
            renderUsuariosTable(usuarios);
            console.log("Tabla de usuarios recargada.");
         }
      } catch (err) {
         console.error("Error al recargar la tabla:", err);
         notyf.error("No se pudo actualizar la lista de usuarios.");
      }
   };

   /**
    * @description Renderiza las filas de la tabla de usuarios.
    * @param {Array} usuariosData - Array de objetos de usuario.
    */
   const renderUsuariosTable = (usuariosData) => {
      if (!tablaBody) return;
      tablaBody.innerHTML = ''; // Limpiar
      if (usuariosData.length === 0) {
         tablaBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-zinc-500">No hay usuarios para mostrar.</td></tr>';
         return;
      }
      usuariosData.forEach(user => {
         const tr = document.createElement('tr');
         tr.className = 'transition-all duration-300';
         const estadoColor = user.estado === 'activo' ? 'bg-emerald-600' : 'bg-rose-600';
         const estadoHtml = `<span class="px-2 py-1 ${estadoColor} text-white rounded-md text-xs font-medium">${escapeHtml(user.estado)}</span>`;
         const avatarHtml = `<img src="${user.avatar || "/uploads/avatars/default.png"}" class="rounded-full w-10 h-10 object-cover" alt="Avatar de ${escapeHtml(user.nombre)}">`;
         const fechaCreado = new Date(user.creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

         // Solo los administradores pueden editar/eliminar usuarios.
         const accionesHtml = (window.currentUser && window.currentUser.rol === 'admin')
             ? `<button data-id="${user.id}" class="btn-editar px-2 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-900">Editar</button>
                <button data-id="${user.id}" class="btn-eliminar px-2 py-1 bg-rose-600 rounded text-sm hover:bg-rose-700">Eliminar</button>`
             : '';

         tr.innerHTML = `
                <td class="px-4 py-2 align-middle">${avatarHtml}</td>
                <td class="px-4 py-3 align-middle text-sm font-medium">${escapeHtml(user.nombre)}</td>
                <td class="px-4 py-3 align-middle text-sm">${escapeHtml(user.rol)}</td>
                <td class="px-4 py-3 align-middle text-center">${estadoHtml}</td>
                <td class="px-4 py-3 align-middle text-sm">${fechaCreado}</td>
                <td class="px-4 py-2 text-right align-middle">${accionesHtml}</td>`;
         tablaBody.appendChild(tr)
      }
      )
   }


   /* =====================================================
     🔹 FUNCIONES DE MODAL Y FORMULARIO
     ===================================================== */

   /**
    * @description Muestra una vista previa de la imagen seleccionada.
    * @param {Event} e - El evento de cambio del input de archivo.
    */
   const handleImagePreview = (e) => {
      const file = e.target.files[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (event) => {
            avatarPreview.src = event.target.result;
         };
         reader.readAsDataURL(file);
      }
   };

   /**
    * @description Configura y resetea el modal para la creación de un nuevo usuario.
    */
   const setupCreateModal = () => {
      tituloModal.textContent = "Crear Usuario";
      submitBtn.textContent = "Crear";
      form.reset();
      form.id.value = '';
      avatarPreview.src = '/uploads/avatars/default.png';
   };

   /**
    * @description Configura el modal con los datos de un usuario para su edición.
    * @param {object} data - Los datos de la fila del usuario a editar.
    */
   const setupEditModal = (data) => {
      tituloModal.textContent = "Editar Usuario";
      submitBtn.textContent = "Guardar Cambios";
      form.reset();

      form.id.value = data.id;
      form.nombre.value = data.nombre;
      form.rol.value = data.rol;
      form.estado.value = data.estado;
      avatarPreview.src = data.avatar || '/uploads/avatars/default.png';
   };

   /* =====================================================
      🔹 MANEJADORES DE EVENTOS
      ===================================================== */

   /**
    * @description Maneja el envío del formulario para crear o actualizar un usuario.
    */
   const handleFormSubmit = async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const isEditing = !!form.id.value;

      const url = isEditing ? `/api/usuarios/${form.id.value}` : "/api/usuarios";
      const method = isEditing ? "PUT" : "POST";
      const actionTexts = isEditing ?
         { verb: "actualizar", past: "actualizado" } :
         { verb: "crear", past: "creado" };

      try {
         const res = await fetch(url, { method, body: formData });

         if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            throw new Error(errorData?.message || `Error al ${actionTexts.verb} el usuario.`);
         }

         notyf.success(`Usuario ${actionTexts.past} correctamente!`);
         modals.closeModal(crearModal);
         if (tabla) {
            await reloadTableData();
         }

      } catch (err) {
         console.error(`Error al ${actionTexts.verb} el usuario:`, err);
         notyf.error(err.message || `Error desconocido al ${actionTexts.verb} el usuario.`);
      }
   };

   /**
    * @description Maneja el clic en el botón de eliminar un usuario.
    */
   const handleDeleteClick = async (id, targetButton) => {
      const row = targetButton.closest('tr');
      if (!row) return;

      const nombre = row.cells[1].textContent.trim();

      try {
         await modals.confirmarAccion(`¿Estás seguro de que quieres eliminar al usuario "${escapeHtml(nombre)}"?`);

         const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
         if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            throw new Error(errorData?.message || 'Error en el servidor al eliminar.');
         }

         row.classList.add('opacity-0', 'scale-95');
         setTimeout(() => {
            row.remove();
         }, 300);
         notyf.success("Usuario eliminado correctamente.");

      } catch (err) {
         if (err) {
            console.error("Error al eliminar:", err);
            notyf.error(err.message || "No se pudo eliminar el usuario.");
         } else {
            console.log("Eliminación cancelada por el usuario.");
         }
      }
   };

   /**
    * @description Maneja el clic en el botón de editar un usuario.
    */
   const handleEditClick = (id, targetButton) => {
      const row = targetButton.closest('tr');
      if (!row) return;

      const data = {
         id: id,
         avatar: row.querySelector('img').src,
         nombre: row.cells[1].textContent.trim(),
         rol: row.cells[2].textContent.trim(),
         estado: row.cells[3].querySelector('span').textContent.trim(),
      };

      setupEditModal(data);
      modals.openModal(crearModal);
   };

   /* =====================================================
      🔹 EVENTOS / INICIADORES
      ===================================================== */

   if (crearBtn) {
      crearBtn.addEventListener("click", setupCreateModal);
   }
   form.addEventListener("submit", handleFormSubmit);
   form.avatar.addEventListener('change', handleImagePreview);

   // El resto del código solo se ejecuta si la tabla de usuarios existe en la página.
   /* =====================================================
      🔹 INICIALIZACIÓN DE TABLA
      ===================================================== */
   if (tabla) {
      tabla.addEventListener("click", async (e) => {
         const editBtn = e.target.closest(".btn-editar");
         if (editBtn) {
            handleEditClick(editBtn.dataset.id, editBtn);
         }

         const deleteBtn = e.target.closest(".btn-eliminar");
         if (deleteBtn) {
            await handleDeleteClick(deleteBtn.dataset.id, deleteBtn);
         }
      });

      // Carga inicial de datos
      reloadTableData();
   }

}