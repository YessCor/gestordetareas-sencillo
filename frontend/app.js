/* ─────────────────────────────────────────────────────────────────────────
   app.js — Gestor de Tareas · Docker Multicapa
   API base: /api  (nginx reenvía a backend:5000)
───────────────────────────────────────────────────────────────────────── */

const API = '/api';

// DOM refs
const formTarea    = document.getElementById('formTarea');
const inputTitulo  = document.getElementById('inputTitulo');
const listaTareas  = document.getElementById('listaTareas');
const emptyState   = document.getElementById('emptyState');
const statusBadge  = document.getElementById('statusBadge');
const statTotal    = document.getElementById('statTotal');
const statPend     = document.getElementById('statPendientes');
const statComp     = document.getElementById('statCompletadas');
const toast        = document.getElementById('toast');

let toastTimer = null;

// ── Toast notification ─────────────────────────────────────────────────────
function mostrarToast(msg, tipo = 'info') {
  toast.textContent = msg;
  toast.className   = 'toast toast--show';
  if (tipo === 'error') toast.style.color = '#f87171';
  else if (tipo === 'ok') toast.style.color = '#4ade80';
  else toast.style.color = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2800);
}

// ── Fetch wrapper ──────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ── Render statistics ──────────────────────────────────────────────────────
function actualizarStats(tareas) {
  const total      = tareas.length;
  const completadas = tareas.filter(t => t.completada).length;
  const pendientes  = total - completadas;
  statTotal.textContent    = `${total} tarea${total !== 1 ? 's' : ''}`;
  statPend.textContent     = `${pendientes} pendiente${pendientes !== 1 ? 's' : ''}`;
  statComp.textContent     = `${completadas} completada${completadas !== 1 ? 's' : ''}`;
}

// ── Format date ────────────────────────────────────────────────────────────
function formatFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Render task list ───────────────────────────────────────────────────────
function renderizarTareas(tareas) {
  // Remove old items (keep emptyState node)
  [...listaTareas.querySelectorAll('.task-item')].forEach(el => el.remove());

  emptyState.style.display = tareas.length === 0 ? 'flex' : 'none';

  tareas.forEach(tarea => {
    const item = document.createElement('div');
    item.className = `task-item${tarea.completada ? ' task-item--done' : ''}`;
    item.dataset.id = tarea.id;

    item.innerHTML = `
      <input
        type="checkbox"
        class="task-item__check"
        id="check-${tarea.id}"
        aria-label="Marcar tarea como ${tarea.completada ? 'pendiente' : 'completada'}"
        ${tarea.completada ? 'checked' : ''}
      />
      <span class="task-item__text">${escapeHtml(tarea.titulo)}</span>
      <span class="task-item__date">${formatFecha(tarea.creada_en)}</span>
      <button
        class="btn btn--danger"
        aria-label="Eliminar tarea ${escapeHtml(tarea.titulo)}"
        data-id="${tarea.id}"
      >Eliminar</button>
    `;

    // Toggle completada
    item.querySelector('.task-item__check').addEventListener('change', (e) => {
      toggleTarea(tarea.id, e.target.checked);
    });

    // Eliminar
    item.querySelector('.btn--danger').addEventListener('click', () => {
      eliminarTarea(tarea.id, item);
    });

    listaTareas.appendChild(item);
  });

  actualizarStats(tareas);
}

// ── XSS prevention ─────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Load tasks from API ────────────────────────────────────────────────────
async function cargarTareas() {
  try {
    const tareas = await api('/tareas');
    renderizarTareas(tareas);
    statusBadge.textContent = '● API conectada';
    statusBadge.className   = 'badge badge--ok';
  } catch (err) {
    statusBadge.textContent = '● Sin conexión';
    statusBadge.className   = 'badge badge--error';
    mostrarToast('No se pudo conectar con la API.', 'error');
  }
}

// ── Create task ────────────────────────────────────────────────────────────
formTarea.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = inputTitulo.value.trim();
  if (!titulo) return;
  try {
    await api('/tareas', {
      method: 'POST',
      body: JSON.stringify({ titulo }),
    });
    inputTitulo.value = '';
    mostrarToast('Tarea agregada ✓', 'ok');
    await cargarTareas();
  } catch (err) {
    mostrarToast(err.message, 'error');
  }
});

// ── Toggle completada ──────────────────────────────────────────────────────
async function toggleTarea(id, completada) {
  try {
    await api(`/tareas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completada }),
    });
    await cargarTareas();
  } catch (err) {
    mostrarToast(err.message, 'error');
  }
}

// ── Delete task ────────────────────────────────────────────────────────────
async function eliminarTarea(id, itemEl) {
  // Brief fade-out animation
  itemEl.style.opacity    = '0';
  itemEl.style.transform  = 'translateX(20px)';
  itemEl.style.transition = 'opacity 0.2s, transform 0.2s';
  await new Promise(r => setTimeout(r, 200));
  try {
    await api(`/tareas/${id}`, { method: 'DELETE' });
    mostrarToast('Tarea eliminada', 'info');
    await cargarTareas();
  } catch (err) {
    itemEl.style.opacity   = '1';
    itemEl.style.transform = '';
    mostrarToast(err.message, 'error');
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
cargarTareas();
