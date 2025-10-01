import { $, $$ } from "./utils.js";

/* =========================================================
   🖼️ CUADROS CRUD - Gestión de cuadros en la interfaz
   ========================================================= */
export async function CuadrosCRUD(notyf, modals) {
  console.log("cuadrosCrud.js cargado");

  /* =====================================================
       🔹 SELECTORES
       ===================================================== */
  const tabla = $("#tablaCuadros"); // Tabla donde se muestran los cuadros
  const crearBtn = $("#crearCuadroBtn"); // Botón para abrir modal de creación
  const crearModal = $("#modalCrearCuadro"); // Modal de creación de cuadro
  const tituloModal = $("#crearCuadroTitle"); // Título del modal
  const registrarCuadroBtn = $("#submitCrearCuadro"); // Botón para registrar cuadro
  const categoriaSelect = $("#cuadroCategoria"); // Select de categorías
  const subcategoriaSelect = $("#cuadroSubcategoria"); // Select de subcategorías
  const formCrear = $("#formCrearCuadro"); // Formulario para crear cuadro

  // Selectores para el cropper de imágenes
  const cropperModal = $("#modalCropper");
  const cropperImage = $("#cropperImage");
  const cropConfirmBtn = $("#cropConfirmBtn");
  // Selectores para los nuevos botones de acción del cropper
  const zoomInBtn = $("#zoomInBtn");
  const zoomOutBtn = $("#zoomOutBtn");
  const rotateLeftBtn = $("#rotateLeftBtn");
  const rotateRightBtn = $("#rotateRightBtn");

  // Selectores para la vista previa estilo catálogo (del modal)
  const previewCardImage = $("#previewCardImg");
  const previewCardTitle = $("#previewCardTitulo");
  const previewCardDescription = $("#previewCardDescripcion");

  const imagePreviewContainer = $("#imagePreviewContainer");
  let cropper = null;
  let croppedImageBlob = null;

  /* =====================================================
      🔹 FUNCIONES PRINCIPALES
      ===================================================== */

  /**
   * getCuadros - Obtiene todos los cuadros desde la API
   * @returns {Promise<Array>} Array de cuadros
   */
  const getCuadros = async () => {
    try {
      const res = await fetch("/api/cuadros", {
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error("Error al obtener los cuadros");
      return await res.json();
    } catch (err) {
      console.error(err);
      notyf.error("No se pudieron cargar los cuadros.");
      return []; // Devuelve un array vacío en caso de error para no romper la tabla
    }
  };

  /**
   *  @description - Obtiene todas las categorias
   *  Deshabilita el select si no hay categorias activas.
   */
  const getCategorias = async () => {
    categoriaSelect.innerHTML =
      '<option value="">Seleccione una categoría</option>';
    categoriaSelect.disabled = false;
    try {
      const res = await fetch("/api/categorias");
      if (!res.ok) throw new Error("Error al obtener las categorías");
      const data = await res.json();

      if (!data || data.length === 0) {
        console.warn("No hay categorías disponibles.");
        categoriaSelect.innerHTML =
          '<option value="">No hay categorías creadas</option>';
        categoriaSelect.disabled = true;
        return;
      }

      data.forEach((categoria) => {
        const option = document.createElement("option");
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        categoriaSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Error al obtener las categorías:", err);
      categoriaSelect.innerHTML = '<option value="">Error al cargar</option>';
      categoriaSelect.disabled = true;
    }
  };

  /**
   * getSubcategorias - Obtiene las subcategorías de una categoría específica
   * Deshabilita el select si no hay un ID de categoría.
   * @param {string} categoriaId - ID de la categoría seleccionada
   */
  const getSubcategorias = async (categoriaId) => {
    subcategoriaSelect.innerHTML =
      '<option value="">Seleccione una subcategoría</option>';
    if (!categoriaId) {
      subcategoriaSelect.setAttribute("disabled", "true");
      return;
    }

    try {
      const res = await fetch(
        `/api/subcategorias/categoria?categoria_id=${encodeURIComponent(
          categoriaId
        )}`
      );
      if (!res.ok) throw new Error("Respuesta de red no fue ok.");

      const data = await res.json();
      // Si no hay datos o la respuesta está vacía, no hacer nada más.
      if (!data || data.length === 0) return;

      subcategoriaSelect.removeAttribute("disabled");
      data.forEach((sc) => {
        const option = document.createElement("option");
        option.value = sc.id;
        option.textContent = sc.nombre;
        subcategoriaSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Error al obtener las subcategorias:", err);
    }
  };

  /**
   * @description Actualiza la vista previa estilo catálogo con los datos de texto del formulario.
   */
  const updateCatalogPreview = () => {
    const titulo = formCrear.titulo.value.trim();
    const descripcion = formCrear.descripcion.value.trim();

    if (previewCardTitle) {
      previewCardTitle.textContent = titulo || "Título del Cuadro";
    }
    if (previewCardDescription) {
      previewCardDescription.textContent =
        descripcion || "Descripción del cuadro...";
    }
  };

  /**
   * @description Muestra una vista previa de la imagen seleccionada en la tarjeta de catálogo.
   * @param {Event} e - El evento de cambio del input de archivo.
   */
  const handleFilesSelected = (e) => {
    const files = e.target.files;
    if (!files.length) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        createImagePreview(file, event.target.result);
      };
      reader.readAsDataURL(file);
    }
    // Limpiar el input para poder seleccionar los mismos archivos de nuevo si se borran
    e.target.value = "";
  };

  /**
   * Crea una tarjeta de previsualización para una imagen.
   * @param {File} file - El objeto File original.
   * @param {string} src - La URL de datos (base64) para la vista previa.
   */
  const createImagePreview = (file, src) => {
    const id = `preview-${Date.now()}-${String(Math.random()).replace(
      ".",
      ""
    )}`;
    const previewWrapper = document.createElement("div");
    previewWrapper.className =
      "relative w-24 h-24 rounded-lg overflow-hidden border-2 border-zinc-700 group";
    previewWrapper.id = id;
    previewWrapper.dataset.fileName = file.name; // Guardamos el nombre del archivo

    const img = document.createElement("img");
    img.src = src;
    img.className = "w-full h-full object-cover";

    // Guardamos el archivo/blob en el elemento para recuperarlo al enviar
    previewWrapper.fileData = file;

    const overlay = document.createElement("div");
    overlay.className =
      "absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity";

    const cropBtn = document.createElement("button");
    cropBtn.type = "button";
    cropBtn.innerHTML = "✏️";
    cropBtn.title = "Recortar";
    cropBtn.className = "p-1 rounded-full bg-black/50 hover:bg-emerald-600";
    cropBtn.onclick = () => openCropper(previewWrapper);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Eliminar";
    deleteBtn.className = "p-1 rounded-full bg-black/50 hover:bg-rose-600";
    deleteBtn.onclick = () => previewWrapper.remove();

    overlay.append(cropBtn, deleteBtn);
    previewWrapper.append(img, overlay);
    imagePreviewContainer.appendChild(previewWrapper);
    return previewWrapper; // Asegurarse de que el wrapper se devuelve
  };

  /**
   * Abre el modal de recorte para una imagen específica.
   * @param {HTMLElement} previewWrapper - El div que contiene la imagen a recortar.
   */
  const openCropper = (previewWrapper) => {
    if (!previewWrapper || !cropperImage || !cropperModal) return;

    const imageSrc = previewWrapper.querySelector("img").src;

    if (cropper) cropper.destroy();

    cropperImage.src = imageSrc;
    modals.openModal(cropperModal);

    // Guardamos una referencia al elemento que estamos editando
    cropperModal.dataset.editingElementId = previewWrapper.id;

    setTimeout(() => {
      cropper = new Cropper(cropperImage, {
        viewMode: 1,
        autoCropArea: 0.9,
        responsive: true,
        movable: true,
        zoomable: true,
        dragMode: "move",
      });
    }, 200);
  };

  /**
   * @description Configura y resetea el modal para la creación de un nuevo cuadro.
   */
  const setupCreateModal = () => {
    tituloModal.textContent = "Crear Cuadro";
    registrarCuadroBtn.textContent = "Crear";
    formCrear.reset();
    croppedImageBlob = null;
    formCrear.id.value = ""; // Asegurarse de que el campo ID esté vacío
    imagePreviewContainer.innerHTML = ""; // Limpiar previsualizaciones

    // Resetear la vista previa del catálogo a su estado por defecto
    if (previewCardImage) previewCardImage.src = "/uploads/default.png";
    updateCatalogPreview();

    getCategorias();
    getSubcategorias("");
  };

  /**
   * @description Configura el modal con los datos de un cuadro existente para su edición.
   * @param {object} data - Los datos de la fila del cuadro a editar.
   */
  const setupEditModal = async (data) => {
    tituloModal.textContent = "Editar Cuadro";
    registrarCuadroBtn.textContent = "Guardar Cambios";
    formCrear.reset();
    croppedImageBlob = null;
    imagePreviewContainer.innerHTML = ""; // Limpiar previsualizaciones

    // Inyectar datos en el formulario
    formCrear.id.value = data.id;
    formCrear.titulo.value = data.titulo;
    formCrear.descripcion.value = data.descripcion;

    // Crear previsualizaciones para las imágenes existentes
    const initialImagesArray = []; // Array para almacenar las URLs de las imágenes iniciales
    if (data.imagenes) {
      const imagenesExistentes = data.imagenes.split(",");
      imagenesExistentes.forEach((url) => {
        if (!url) return;
        const previewWrapper = createImagePreview({ name: url }, url); // createImagePreview ahora devuelve el wrapper
        if (previewWrapper) {
          // Asegurarse de que el wrapper se creó correctamente
          previewWrapper.dataset.isExisting = "true"; // Marcar como existente
          previewWrapper.fileData = url; // Guardar la URL
          initialImagesArray.push(url); // Añadir al array para el estado inicial
        }
      });
    }
    // Siempre guardamos el estado inicial de las imágenes, incluso si está vacío.
    formCrear.dataset.initialImages = JSON.stringify(
      initialImagesArray.filter(Boolean)
    );

    // Actualizar la vista previa del catálogo con los datos existentes
    if (previewCardImage)
      previewCardImage.src = data.imagen || "/uploads/default.png";
    updateCatalogPreview();

    // Cargar y seleccionar categorías y subcategorías
    await getCategorias();
    await getSubcategorias(data.categoria_id);
    categoriaSelect.value = String(data.categoria_id);
    subcategoriaSelect.value = String(data.subcategoria_id);
  };

  /**
   * @description Recarga los datos de la tabla de cuadros desde la API.
   */
  const reloadTableData = async () => {
    try {
      const cuadros = await getCuadros();
      await tablaCuadros.setData(cuadros);
      console.log("Tabla de cuadros recargada.");
    } catch (err) {
      console.error("Error al recargar la tabla:", err);
      notyf.error("No se pudo actualizar la lista de cuadros.");
    }
  };

  /* =====================================================
       🔹 MANEJADORES DE EVENTOS
       ===================================================== */

  /**
   * @description Maneja el envío del formulario para crear o actualizar un cuadro.
   * @param {Event} e - El evento de submit del formulario.
   */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log("📤 handleFormSubmit: Enviando formulario...");

    const formData = new FormData(formCrear);

    // Limpiar el campo 'imagenes' para no enviar el FileList original
    formData.delete("imagenes");

    const previews = $$("#imagePreviewContainer > div");
    const imagenesExistentes = [];
    let imageInteraction = false; // Flag para detectar si se interactuó con las imágenes

    previews.forEach((p, index) => {
      if (p.dataset.isExisting === "true") {
        // Si es una imagen existente que no se borró, añadimos su URL
        imagenesExistentes.push(p.fileData);
      } else {
        // Si es una imagen nueva (File o Blob), la añadimos al FormData
        imageInteraction = true;
        formData.append("imagenes", p.fileData, p.dataset.fileName);
      }
    });

    // Si se subieron nuevas imágenes o si la lista de existentes cambió, enviamos el campo.
    if (
      imageInteraction ||
      JSON.stringify(imagenesExistentes) !== formCrear.dataset.initialImages
    ) {
      formData.append("imagenesExistentes", JSON.stringify(imagenesExistentes));
    }

    const isEditing = !!formCrear.id.value;

    const url = isEditing
      ? `/api/cuadros/${formCrear.id.value}`
      : "/api/cuadros/crear";
    const method = isEditing ? "PUT" : "POST";
    const actionTexts = isEditing
      ? { verb: "actualizar", past: "actualizado" }
      : { verb: "crear", past: "creado" };

    try {
      const res = await fetch(url, { method, body: formData });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || `Error al ${actionTexts.verb} el cuadro.`
        );
      }

      notyf.success(`Cuadro ${actionTexts.past} correctamente!`);
      modals.closeModal(crearModal);

      // TODO: Para una mejor performance, la API podría devolver el objeto creado/actualizado
      // y podríamos usar tablaCuadros.addData() o tablaCuadros.updateData() en lugar de una recarga completa.
      await reloadTableData();
    } catch (err) {
      console.error(`Error al ${actionTexts.verb} el cuadro:`, err);
      notyf.error(
        err.message || `Error desconocido al ${actionTexts.verb} el cuadro.`
      );
    }
  };

  /**
   * @description Maneja el clic en el botón de eliminar un cuadro.
   * @param {string} id - El ID del cuadro a eliminar.
   */
  const handleDeleteClick = async (id) => {
    const row = tablaCuadros.getRow(id);
    if (!row) return;

    const titulo = row.getData().titulo;

    try {
      await modals.confirmarAccion(
        `¿Estás seguro de que quieres eliminar el cuadro "${titulo}"?`
      );

      const res = await fetch(`/api/cuadros/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || "Error en el servidor al eliminar."
        );
      }

      await row.delete(); // Elimina la fila de la tabla de Tabulator
      notyf.success("Cuadro eliminado correctamente.");
    } catch (err) {
      if (err) {
        // Si 'err' existe, es un error real.
        console.error("Error al eliminar:", err);
        notyf.error(err.message || "No se pudo eliminar el cuadro.");
      } else {
        // Si 'err' es null/undefined, el usuario canceló la acción.
        console.log("Eliminación cancelada por el usuario.");
      }
    }
  };

  /**
   * @description Maneja el clic en el botón de editar un cuadro.
   * @param {string} id - El ID del cuadro a editar.
   */
  const handleEditClick = async (id) => {
    const row = tablaCuadros.getRow(id);
    if (!row) return;

    await setupEditModal(row.getData());
    modals.openModal(crearModal);
  };

  /* =====================================================
       🔹 EVENTOS / INICIADORES
       ===================================================== */

  crearBtn.addEventListener("click", setupCreateModal);
  formCrear.addEventListener("submit", handleFormSubmit);

  // Eventos para la vista previa en tiempo real del catálogo
  if (formCrear.titulo) {
    formCrear.titulo.addEventListener("input", updateCatalogPreview);
  }
  if (formCrear.descripcion) {
    formCrear.descripcion.addEventListener("input", updateCatalogPreview);
  }
  if (formCrear.imagenes) {
    // El input ahora se llama 'imagenes'
    formCrear.imagenes.addEventListener("change", handleFilesSelected);
  }

  // Cambiar subcategorías al seleccionar una categoría
  categoriaSelect.addEventListener("change", (e) =>
    getSubcategorias(e.target.value)
  );

  // Eventos para los botones de acción del cropper (zoom, rotar)
  if (zoomInBtn)
    zoomInBtn.addEventListener("click", () => cropper && cropper.zoom(0.1));
  if (zoomOutBtn)
    zoomOutBtn.addEventListener("click", () => cropper && cropper.zoom(-0.1));
  if (rotateLeftBtn)
    rotateLeftBtn.addEventListener(
      "click",
      () => cropper && cropper.rotate(-45)
    );
  if (rotateRightBtn)
    rotateRightBtn.addEventListener(
      "click",
      () => cropper && cropper.rotate(45)
    );

  // Evento para confirmar el recorte de la imagen
  if (cropConfirmBtn) {
    cropConfirmBtn.addEventListener("click", () => {
      if (!cropper) return;

      const editingId = cropperModal.dataset.editingElementId;
      const previewWrapper = $(`#${editingId}`);
      if (!previewWrapper) return;

      cropper
        .getCroppedCanvas({
          width: 500, // Define el tamaño de la imagen final
          height: 500,
          imageSmoothingQuality: "high",
        })
        .toBlob((blob) => {
          // Actualizar la imagen de la previsualización
          const imgElement = previewWrapper.querySelector("img");
          const objectURL = URL.createObjectURL(blob);
          imgElement.src = objectURL;

          // Reemplazar el File original con el nuevo Blob
          previewWrapper.fileData = blob;
          previewWrapper.dataset.isExisting = "false"; // Ya no es una imagen existente

          modals.closeModal(cropperModal);
        }, "image/png");
    });
  }

  /* =====================================================
       🔹 INICIALIZACIÓN DE TABLA CON TABULATOR
       ===================================================== */

  // Obtener datos iniciales y crear la instancia de Tabulator
  const cuadrosData = await getCuadros();
  let tablaCuadros;

  tablaCuadros = new Tabulator(tabla, {
    data: cuadrosData,
    layout: "fitColumns",
    responsiveLayout: "hide",
    movableColumns: false,
    resizableColumns: false,
    resizableRows: false,
    addRowPos: "bottom",
    history: true,
    pagination: "local",
    paginationSize: 12,
    columns: [
      {
        title: "ID",
        field: "id",
        width: 60,
      },
      {
        title: "",
        field: "imagen", // La URL de la imagen
        formatter: (cell) =>
          `<img src="${
            cell.getValue() || "/uploads/default.png"
          }" class="rounded-md w-10 h-10 object-cover" />`,
        width: 60,
      },
      {
        title: "Título",
        field: "titulo",
        headerFilter: "input",
      },
      {
        title: "Subcategoría",
        field: "subcategoria",
        headerFilter: "select",
        headerFilterParams: { values: true },
      },
      {
        title: "Categoría",
        field: "categoria",
        headerFilter: "select",
        headerFilterParams: { values: true },
      },
      {
        title: "Acciones",
        field: "acciones",
        hozAlign: "center",
        formatter: (cell) => {
          // Solo admins y editores pueden ver los botones de acción
          if (
            window.currentUser &&
            (window.currentUser.rol === "admin" ||
              window.currentUser.rol === "editor")
          ) {
            const id = cell.getRow().getData().id;
            return `
                            <button data-id="${id}" class="btn-editar px-2 py-1 bg-zinc-800 rounded text-sm hover:bg-zinc-900 transition-colors duration-200">Editar</button>
                            <button data-id="${id}" class="btn-eliminar px-2 py-1 bg-rose-600 rounded text-sm hover:bg-rose-700 transition-colors duration-200">Eliminar</button>
                        `;
          }
          return ""; // Retorna vacío para 'lectores'
        },
        width: 180,
        headerSort: false,
      },
    ],
    rowFormatter: (row) => {
      const el = row.getElement();
      el.style.height = "60px";
    },
  });

  // Event listener para los botones de la tabla (Editar/Eliminar)
  // Se usa delegación de eventos en el contenedor de la tabla.
  tabla.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".btn-editar");
    if (editBtn) {
      await handleEditClick(editBtn.dataset.id);
    }

    const deleteBtn = e.target.closest(".btn-eliminar");
    if (deleteBtn) {
      await handleDeleteClick(deleteBtn.dataset.id);
    }
  });
}
