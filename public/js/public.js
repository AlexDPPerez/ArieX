/* =========================================================
   PUBLIC SCRIPT - Lógica para el sitio web público
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    console.log("public.js cargado");

    // 1. Lógica para el menú de hamburguesa
    const btn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const iconOpen = document.getElementById('iconOpen');
    const iconClose = document.getElementById('iconClose');

    if (btn && mobileMenu && iconOpen && iconClose) {
        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!expanded));
            mobileMenu.classList.toggle('hidden');
            iconOpen.classList.toggle('hidden');
            iconClose.classList.toggle('hidden');
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                mobileMenu.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
                iconOpen.classList.remove('hidden');
                iconClose.classList.add('hidden');
            }
        });
    }

    // 2. Lógica para el año dinámico en el footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
