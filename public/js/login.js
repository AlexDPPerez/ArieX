document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#loginForm');
    const errorContainer = document.querySelector('#errorContainer');
    const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitar el envío tradicional del formulario

        // Limpiar errores previos y mostrar estado de carga
        if (errorContainer) errorContainer.textContent = '';
        if (errorContainer) errorContainer.classList.add('hidden');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
        `;

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' // Importante para que el backend sepa que es AJAX
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                // Si la respuesta no es OK (4xx, 5xx), lanzamos un error con el mensaje del backend
                throw new Error(result.message || 'Error desconocido.');
            }

            // Si el login es exitoso, el backend nos da la URL a la que redirigir
            if (result.redirectTo) {
                window.location.href = result.redirectTo;
            }

        } catch (error) {
            // Mostrar el error en la UI
            if (errorContainer) {
                errorContainer.textContent = error.message;
                errorContainer.classList.remove('hidden');
            }
            // Restaurar el botón
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
});
