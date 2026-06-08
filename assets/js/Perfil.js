// ══════════════════════════════════════════════════════
//  FRÍO CARS — perfil.js
//  Tabla usuario: id_usuario, username, password,
//                 nombre, apellido, correo, estado, fecha_creacion
// ══════════════════════════════════════════════════════

const API = "https://friocars-backend.onrender.com/api";
let usuarioActual = null;

document.addEventListener("DOMContentLoaded", () => {
  cargarPerfil();
  cargarFotoGuardada();
});


// ══════════════════════════════════════════════════════
//  CARGAR PERFIL desde localStorage (guardado en auth)
// ══════════════════════════════════════════════════════
async function cargarPerfil() {
  // El auth.js guarda el usuario en localStorage al hacer login
  const usuarioGuardado = localStorage.getItem("usuario");

  if (!usuarioGuardado) {
    window.location.href = "../pages/login.html";
    return;
  }

  usuarioActual = JSON.parse(usuarioGuardado);

  // Si solo tenemos id, traemos el resto del backend
  if (!usuarioActual.nombre) {
    try {
      const res = await fetch(`${API}/usuarios/${usuarioActual.id_usuario}`);
      if (res.ok) usuarioActual = await res.json();
    } catch { /* usa lo que hay */ }
  }

  renderPerfil(usuarioActual);
  cargarActividad(usuarioActual.id_usuario);
}


// ══════════════════════════════════════════════════════
//  RENDER PERFIL
// ══════════════════════════════════════════════════════
function renderPerfil(u) {
  const nombreCompleto = `${u.nombre || ""} ${u.apellido || ""}`.trim() || u.username;
  const fecha = u.fecha_creacion
    ? new Date(u.fecha_creacion).toLocaleDateString("es-CO", { year:"numeric", month:"long", day:"numeric" })
    : "—";

  // Hero
  setText("heroNombre",   nombreCompleto);
  setText("heroCorreo",   u.correo || "Sin correo");
  setText("heroEstado",   u.estado || "ACTIVO");
  setText("heroFecha",    fecha);
  setText("heroUsername", u.username || "—");

  // Avatar placeholder con iniciales
  const iniciales = `${(u.nombre||u.username||"?")[0]}${(u.apellido||"")[0]||""}`.toUpperCase();
  const ph = document.getElementById("avatarPlaceholder");
  const fp = document.getElementById("fotoPreview");
  if (ph) ph.textContent = iniciales;
  if (fp) fp.textContent = iniciales;

  // Info panel
  setText("infoId",       u.id_usuario);
  setText("infoUsername", u.username || "—");
  setText("infoNombre",   u.nombre   || "—");
  setText("infoApellido", u.apellido || "—");
  setText("infoCorreo",   u.correo   || "—");
  setText("infoEstado",   u.estado   || "ACTIVO");
  setText("infoFecha",    fecha);

  // Pre-llenar formulario
  setVal("editNombre",   u.nombre   || "");
  setVal("editApellido", u.apellido || "");
  setVal("editCorreo",   u.correo   || "");
  setVal("editUsername", u.username || "");
}


// ══════════════════════════════════════════════════════
//  CARGAR ACTIVIDAD (últimas ventas del usuario)
// ══════════════════════════════════════════════════════
async function cargarActividad(id_usuario) {
  const lista = document.getElementById("actividadLista");
  try {
    const res = await fetch(`${API}/ventas`);
    const ventas = res.ok ? await res.json() : [];

    // Filtrar ventas del usuario actual
    const misVentas = ventas
      .filter(v => v.id_usuario == id_usuario)
      .slice(0, 6);

    if (misVentas.length === 0) {
      lista.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--muted);font-size:.84rem">Sin actividad reciente</div>`;
      return;
    }

    lista.innerHTML = misVentas.map(v => {
      const fecha = v.fec
        ? new Date(v.fec).toLocaleDateString("es-CO", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
        : "—";
      return `
        <div class="actividad-item">
          <div class="actividad-icon" style="background:var(--green-lt);color:var(--green)">💰</div>
          <div style="flex:1">
            <p style="font-size:.84rem;font-weight:700;color:var(--text)">Venta #${v.id_venta}</p>
            <p style="font-size:.72rem;color:var(--muted)">${fecha}</p>
          </div>
          <span style="font-weight:800;color:var(--green);font-size:.88rem">
            $${Number(v.total||0).toLocaleString("es-CO")}
          </span>
        </div>`;
    }).join("");

  } catch {
    lista.innerHTML = `<div style="text-align:center;padding:1rem;color:var(--muted);font-size:.82rem">No se pudo cargar la actividad</div>`;
  }
}


// ══════════════════════════════════════════════════════
//  GUARDAR PERFIL
// ══════════════════════════════════════════════════════
async function guardarPerfil() {
  const nombre   = document.getElementById("editNombre").value.trim();
  const apellido = document.getElementById("editApellido").value.trim();
  const correo   = document.getElementById("editCorreo").value.trim();
  const username = document.getElementById("editUsername").value.trim();
  const pass     = document.getElementById("editPass").value;
  const passConf = document.getElementById("editPassConfirm").value;

  if (!nombre)   { mostrarToast("El nombre es obligatorio", "warn"); return; }
  if (!username) { mostrarToast("El username es obligatorio", "warn"); return; }

  if (pass && pass !== passConf) {
    mostrarToast("Las contraseñas no coinciden", "warn");
    return;
  }

  const btn = document.getElementById("btnGuardar");
  btn.disabled    = true;
  btn.textContent = "Guardando...";

  const body = { nombre, apellido, correo, username };
  if (pass) body.password = pass;

  try {
    const res = await fetch(`${API}/usuarios/${usuarioActual.id_usuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error();

    const actualizado = await res.json();
    usuarioActual = { ...usuarioActual, ...actualizado };
    localStorage.setItem("usuario", JSON.stringify(usuarioActual));

    renderPerfil(usuarioActual);
    mostrarToast("Perfil actualizado correctamente ✓", "ok");

    // Limpiar campos de contraseña
    document.getElementById("editPass").value        = "";
    document.getElementById("editPassConfirm").value = "";

  } catch {
    mostrarToast("Error al guardar el perfil", "error");
  }

  btn.disabled    = false;
  btn.textContent = "✓ Guardar cambios";
}


// ══════════════════════════════════════════════════════
//  FOTO DE PERFIL (localStorage — base64)
// ══════════════════════════════════════════════════════
function cambiarFoto(input) {
  const file = input.files[0];
  if (!file) return;

  // Validar tamaño (máx 2MB)
  if (file.size > 2 * 1024 * 1024) {
    mostrarToast("La imagen no puede superar 2MB", "warn");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    localStorage.setItem("perfil_foto", base64);
    aplicarFoto(base64);
    mostrarToast("Foto actualizada ✓", "ok");
  };
  reader.readAsDataURL(file);
}

function cargarFotoGuardada() {
  const foto = localStorage.getItem("perfil_foto");
  if (foto) aplicarFoto(foto);
}

function aplicarFoto(src) {
  // Hero
  const ph  = document.getElementById("avatarPlaceholder");
  const img = document.getElementById("avatarImg");
  if (ph)  ph.style.display  = "none";
  if (img) { img.src = src; img.style.display = "block"; }

  // Preview en card
  const fp = document.getElementById("fotoPreview");
  if (fp) {
    fp.style.background = "transparent";
    fp.innerHTML = `<img src="${src}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--border)">`;
  }
}


// ══════════════════════════════════════════════════════
//  CERRAR SESIÓN
// ══════════════════════════════════════════════════════
function cerrarSesion() {
  localStorage.clear();
  window.location.href = "../pages/login.html";
}


// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setVal(id, val)  { const el = document.getElementById(id); if (el) el.value = val; }

function mostrarToast(msg, tipo = "ok") {
  const c = {
    ok:    { bg:"var(--green-lt)", border:"var(--green-border)", text:"var(--green)", icon:"✓" },
    warn:  { bg:"#fffbeb",         border:"#fde68a",             text:"#d97706",      icon:"⚠" },
    error: { bg:"#fff1f2",         border:"#fecdd3",             text:"#e11d48",      icon:"✕" },
  }[tipo];
  document.getElementById("fc-toast")?.remove();
  const t = document.createElement("div");
  t.id = "fc-toast";
  t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;animation:slideToast .25s ease;max-width:320px`;
  t.innerHTML = `<span>${c.icon}</span>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}