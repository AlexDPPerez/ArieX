/* =========================================================
   PUBLIC SCRIPT - Lógica para el sitio web público
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("public.js cargado");

  // 1. Lógica para el menú de hamburguesa
  const btn = document.getElementById("hamburgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const iconOpen = document.getElementById("iconOpen");
  const iconClose = document.getElementById("iconClose");

  if (btn && mobileMenu && iconOpen && iconClose) {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      mobileMenu.classList.toggle("hidden");
      iconOpen.classList.toggle("hidden");
      iconClose.classList.toggle("hidden");
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) {
        mobileMenu.classList.add("hidden");
        btn.setAttribute("aria-expanded", "false");
        iconOpen.classList.remove("hidden");
        iconClose.classList.add("hidden");
      }
    });
  }

  // 2. Lógica para el año dinámico en el footer
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // 3. Lógica para la galería de imágenes en la página de detalle
  const mainImage = document.getElementById("mainImage");
  const thumbnails = document.querySelectorAll(".thumbnail-img");

  if (mainImage && thumbnails.length > 0) {
    thumbnails.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.dataset.fullSrc;
      });
    });
  }

  // 4. Lógica para el Lightbox de la imagen principal
  const lightbox = document.getElementById("imageLightbox");
  if (!lightbox) return; // Si no hay lightbox, no hacer nada

  const lightboxImage = document.getElementById("lightboxImage");
  const closeLightboxBtn = document.getElementById("closeLightbox");
  const prevBtn = document.getElementById("prevImage");
  const nextBtn = document.getElementById("nextImage");
  const counter = document.getElementById("lightboxCounter");

  let allImages = [];
  let currentIndex = 0;

  // Recopilar todas las imágenes de la galería
  if (thumbnails.length > 0) {
    allImages = Array.from(thumbnails).map((t) => t.dataset.fullSrc);
  } else if (mainImage) {
    allImages = [mainImage.src];
  }

  const showImage = (index) => {
    if (index < 0 || index >= allImages.length) return;
    currentIndex = index;
    lightboxImage.src = allImages[currentIndex];
    counter.textContent = `${currentIndex + 1} / ${allImages.length}`;

    // Ocultar/mostrar botones de navegación
    prevBtn.style.display = currentIndex === 0 ? "none" : "block";
    nextBtn.style.display =
      currentIndex === allImages.length - 1 ? "none" : "block";
  };

  if (mainImage) {
    // Abrir lightbox al hacer clic en la imagen principal
    mainImage.addEventListener("click", () => {
      const currentImageSrc = mainImage.src;
      const startIndex = allImages.findIndex((src) =>
        src.endsWith(new URL(currentImageSrc).pathname)
      );

      lightbox.classList.remove("hidden");
      document.body.style.overflow = "hidden"; // Evitar scroll del fondo

      // Mostrar/ocultar contador y botones si hay más de una imagen
      if (allImages.length > 1) {
        counter.style.display = "block";
        showImage(startIndex >= 0 ? startIndex : 0);
      } else {
        lightboxImage.src = allImages[0] || "";
        counter.style.display = "none";
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
      }
    });
  }

  const closeLightbox = () => {
    lightbox.classList.add("hidden");
    document.body.style.overflow = "auto";
  };

  closeLightboxBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", () => showImage(currentIndex - 1));
  nextBtn.addEventListener("click", () => showImage(currentIndex + 1));

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Navegación con teclado
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("hidden")) {
      if (e.key === "ArrowRight") nextBtn.click();
      if (e.key === "ArrowLeft") prevBtn.click();
      if (e.key === "Escape") closeLightbox();
    }
  });

  // 5. Lógica para deslizar (swipe) en el lightbox
  let touchStartX = 0;
  let touchEndX = 0;
  const swipeThreshold = 50; // Mínimo de píxeles para considerar un swipe

  lightbox.addEventListener(
    "touchstart",
    (e) => {
      // Solo registrar si el toque es sobre la imagen
      if (e.target === lightboxImage) {
        touchStartX = e.changedTouches[0].screenX;
      }
    },
    { passive: true }
  );

  lightbox.addEventListener("touchend", (e) => {
    if (e.target === lightboxImage) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }
  });

  function handleSwipe() {
    if (touchStartX === 0) return; // No se inició el swipe en la imagen

    const swipeDistance = touchEndX - touchStartX;

    if (swipeDistance > swipeThreshold) {
      // Swipe a la derecha (anterior)
      prevBtn.click();
    } else if (swipeDistance < -swipeThreshold) {
      // Swipe a la izquierda (siguiente)
      nextBtn.click();
    }
    touchStartX = 0; // Resetear
  }

  // 6. Lógica para "Ver más" en la descripción del producto
  const description = document.getElementById("product-description");
  const readMoreBtn = document.getElementById("read-more-btn");

  if (description && readMoreBtn) {
    // Usamos un pequeño delay para asegurar que el DOM ha renderizado completamente
    setTimeout(() => {
      // Comprobar si el texto está realmente truncado (si su altura de scroll es mayor que su altura visible)
      const isTruncated = description.scrollHeight > description.clientHeight;

      if (isTruncated) {
        readMoreBtn.classList.remove("hidden"); // Mostrar el botón solo si es necesario

        readMoreBtn.addEventListener("click", () => {
          const isClamped = description.classList.contains("line-clamp-5");
          description.classList.toggle("line-clamp-5");
          readMoreBtn.textContent = isClamped ? "Ver menos" : "Ver más";
        });
      }
    }, 100);
  }
});
