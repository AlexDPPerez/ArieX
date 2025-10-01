/**
 * Lógica para la página del catálogo.
 * 1. Paginación adaptable: ajusta el `limit` en móviles.
 * 2. Filtros interactivos: envía el formulario al cambiar un filtro.
 */

document.addEventListener("DOMContentLoaded", () => {
  const MOBILE_BREAKPOINT = 768; // Ancho en píxeles para considerar como móvil (ej: < 768px)
  const MOBILE_LIMIT = 6; // Número de productos por página en móvil
  const filterForm = document.getElementById("filterForm");

  const handleResponsivePagination = () => {
    const url = new URL(window.location.href);
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const currentLimit = url.searchParams.get("limit");

    // Solo redirigir si estamos en móvil y el límite no es el correcto.
    // Esto evita bucles de recarga.
    if (isMobile && (!currentLimit || currentLimit !== String(MOBILE_LIMIT))) {
      url.searchParams.set("limit", MOBILE_LIMIT);
      window.location.href = url.href;
    }
  };

  // Enviar formulario al cambiar cualquier filtro
  if (filterForm) {
    filterForm.addEventListener("change", () => {
      filterForm.submit();
    });
  }

  handleResponsivePagination();
  console.log("Catálogo JS con paginación adaptable y filtros interactivos cargado.");
});