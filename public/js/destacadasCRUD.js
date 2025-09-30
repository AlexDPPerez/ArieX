import { $, $$ } from "./utils.js";

export async function DestacadasCRUD(notyf) {
    console.log("DestacadasCRUD.js cargado");

    const container = $("#destacadas-checkbox-container");
    const saveBtn = $("#guardarDestacadasBtn");

    async function loadCategories() {
        try {
            const res = await fetch('/api/categorias');
            if (!res.ok) throw new Error('No se pudieron cargar las categorías');
            const categorias = await res.json();
            renderCheckboxes(categorias);
        } catch (error) {
            console.error(error);
            container.innerHTML = `<p class="col-span-full text-rose-400">${error.message}</p>`;
        }
    }

    function renderCheckboxes(categorias) {
        container.innerHTML = '';
        if (categorias.length === 0) {
            container.innerHTML = `<p class="col-span-full text-zinc-500">No hay categorías creadas.</p>`;
            return;
        }

        categorias.forEach(cat => {
            const label = document.createElement('label');
            label.className = 'flex items-center gap-2 p-3 rounded-md bg-zinc-900 border border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors';
            label.innerHTML = `
                <input type="checkbox" name="destacada" value="${cat.id}" ${cat.is_featured ? 'checked' : ''} class="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-emerald-500 focus:ring-emerald-600">
                <img src="${cat.imagen_url || '/uploads/default.png'}" class="w-8 h-8 object-cover rounded-md">
                <span class="text-sm">${cat.nombre}</span>
            `;
            container.appendChild(label);
        });
    }

    container.addEventListener('change', (e) => {
        if (e.target.name === 'destacada') {
            const checked = $$('input[name="destacada"]:checked');
            if (checked.length > 4) {
                notyf.error('Solo puedes seleccionar hasta 4 categorías.');
                e.target.checked = false;
            }
        }
    });

    saveBtn.addEventListener('click', async () => {
        const checkedIds = $$('input[name="destacada"]:checked').map(cb => parseInt(cb.value, 10));
        
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';

        try {
            const res = await fetch('/api/categorias/destacadas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: checkedIds })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Error al guardar');
            }

            notyf.success('Categorías destacadas actualizadas.');
        } catch (error) {
            console.error(error);
            notyf.error(error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar Cambios';
        }
    });

    loadCategories();
}
