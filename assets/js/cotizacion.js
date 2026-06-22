// ══════════════════════════════════════════════════════
//  FRÍO CARS — cotizacion.js  (v5 — alineado con HTML)
// ══════════════════════════════════════════════════════

const API_BACKEND = "https://friocars-backend.onrender.com/api";

let tipoCotizacion = "AUTOMATICA";
let imagenesBase64 = [];
let ultimaCotizacion = null;
let clientesCache = [];

// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  cargarClientesCache();
  document.getElementById("veh-anio").value = new Date().getFullYear();
  // El año ya tiene valor, así que cargamos marcas de inmediato
  cargarMarcas();
});

// ══════════════════════════════════════════════════════
//  TIPO DE COTIZACIÓN
// ══════════════════════════════════════════════════════
function seleccionarTipo(tipo) {
  tipoCotizacion = tipo;
  document.getElementById("cardAutomatica").classList.toggle("activo", tipo === "AUTOMATICA");
  document.getElementById("cardManual").classList.toggle("activo", tipo === "MANUAL");
}

// ══════════════════════════════════════════════════════
//  AUTOCOMPLETE — CLIENTES
// ══════════════════════════════════════════════════════
async function cargarClientesCache() {
  try {
    const res = await fetch(`${API_BACKEND}/clientes`);
    clientesCache = await res.json();
  } catch (e) {
    console.warn("No se pudo cargar clientes:", e.message);
  }
}

function onNombreInput() {
  const val = document.getElementById("nombre").value.trim().toLowerCase();
  const lista = document.getElementById("sugerencias-cliente");
  lista.innerHTML = "";

  if (val.length < 2) { lista.style.display = "none"; return; }

  const matches = clientesCache
    .filter(c => `${c.nombre} ${c.apellido || ""}`.toLowerCase().includes(val))
    .slice(0, 8);

  if (!matches.length) { lista.style.display = "none"; return; }

  matches.forEach(c => {
    const li = document.createElement("li");
    li.className = "autocomplete-item";
    li.innerHTML = `<span class="ac-name">${c.nombre} ${c.apellido || ""}</span><span class="ac-phone">${c.telefono || ""}</span>`;
    li.addEventListener("mousedown", e => { e.preventDefault(); seleccionarCliente(c); });
    lista.appendChild(li);
  });
  lista.style.display = "block";
}

function seleccionarCliente(c) {
  document.getElementById("nombre").value = `${c.nombre} ${c.apellido || ""}`.trim();
  document.getElementById("telefono").value = c.telefono || "";
  document.getElementById("sugerencias-cliente").style.display = "none";

  if (c.vehiculos?.length > 0) {
    const v = c.vehiculos[0];
    if (v.anio) document.getElementById("veh-anio").value = v.anio;
    // Si el cliente tiene vehículo, poner el texto en el campo libre
    const modeloCustom = [v.marca, v.modelo].filter(Boolean).join(" ");
    if (modeloCustom) document.getElementById("veh-modelo-custom").value = modeloCustom;
    actualizarVehiculoTexto();
    mostrarToast(`Vehículo cargado: ${v.marca || ""} ${v.modelo || ""} ${v.anio || ""}`, "ok");
  }
}

document.addEventListener("click", e => {
  if (!e.target.closest("#wrapper-nombre"))
    document.getElementById("sugerencias-cliente").style.display = "none";
});

// ══════════════════════════════════════════════════════
//  MARCAS — carga desde BD
//  Llamado: al cargar la página y cuando cambia el año
// ══════════════════════════════════════════════════════
async function cargarMarcas() {
  const sel = document.getElementById("veh-marca");
  // Resetear modelo al recargar marcas
  const selModelo = document.getElementById("veh-modelo");
  selModelo.innerHTML = `<option value="">— primero elige marca —</option>`;
  selModelo.disabled = true;

  sel.innerHTML = `<option value="">Cargando...</option>`;
  sel.disabled = true;

  try {
    const res = await fetch(`${API_BACKEND}/catalogo/marcas`);
    const marcas = await res.json();
    sel.innerHTML = `<option value="">— Selecciona marca —</option>` +
      marcas.map(m => `<option value="${m.id_marca}">${m.nombre}</option>`).join("");
    sel.disabled = false; // ← habilitar después de cargar
  } catch (e) {
    sel.innerHTML = `<option value="">Error cargando marcas</option>`;
    sel.disabled = false;
    console.error("Error cargando marcas:", e);
  }
  actualizarVehiculoTexto();
}

// ══════════════════════════════════════════════════════
//  MODELOS — carga desde BD al cambiar marca
//  El HTML llama cargarModelos() en el onchange del select
// ══════════════════════════════════════════════════════
async function cargarModelos() {
  const selMarca = document.getElementById("veh-marca");
  const selModelo = document.getElementById("veh-modelo");
  const id = selMarca.value;

  selModelo.innerHTML = `<option value="">— primero elige marca —</option>`;
  selModelo.disabled = true;
  actualizarVehiculoTexto();

  if (!id) return;

  selModelo.innerHTML = `<option value="">Cargando modelos...</option>`;

  try {
    const res = await fetch(`${API_BACKEND}/catalogo/modelos/${id}`);
    const modelos = await res.json();
    selModelo.innerHTML = `<option value="">— Selecciona modelo —</option>` +
      modelos.map(m => `<option value="${m.id_modelo}">${m.nombre}</option>`).join("");
    selModelo.disabled = false; // ← habilitar después de cargar
  } catch (e) {
    selModelo.innerHTML = `<option value="">Error cargando modelos</option>`;
    selModelo.disabled = false;
    console.error("Error cargando modelos:", e);
  }
  actualizarVehiculoTexto();
}

// ══════════════════════════════════════════════════════
//  PREVIEW DEL VEHÍCULO
//  Combina año + marca (texto del select) + modelo (texto del select)
//  + campo libre si está lleno
// ══════════════════════════════════════════════════════
function actualizarVehiculoTexto() {
  const anio = document.getElementById("veh-anio")?.value || "";
  const selMarca = document.getElementById("veh-marca");
  const selModelo = document.getElementById("veh-modelo");
  const modeloCustom = document.getElementById("veh-modelo-custom")?.value.trim() || "";

  const marca = selMarca.options[selMarca.selectedIndex]?.text || "";
  const modelo = selModelo.options[selModelo.selectedIndex]?.text || "";

  // Si hay campo libre, tiene prioridad sobre el select de modelo
  const modeloFinal = modeloCustom || (modelo !== "— Selecciona modelo —" && modelo !== "— primero elige marca —" ? modelo : "");
  const marcaFinal = marca !== "— Selecciona marca —" && marca !== "Cargando..." && marca !== "Error cargando marcas" ? marca : "";

  const texto = [marcaFinal, modeloFinal, anio].filter(Boolean).join(" ");
  const preview = document.getElementById("veh-preview");
  if (preview) preview.textContent = texto || "—";
}

function getVehiculoTexto() {
  const anio = document.getElementById("veh-anio")?.value || "";
  const selMarca = document.getElementById("veh-marca");
  const selModelo = document.getElementById("veh-modelo");
  const modeloCustom = document.getElementById("veh-modelo-custom")?.value.trim() || "";

  const marca = selMarca.options[selMarca.selectedIndex]?.text || "";
  const modelo = selModelo.options[selModelo.selectedIndex]?.text || "";

  const modeloFinal = modeloCustom || (modelo !== "— Selecciona modelo —" && modelo !== "— primero elige marca —" ? modelo : "");
  const marcaFinal = marca !== "— Selecciona marca —" && marca !== "Cargando..." && marca !== "Error cargando marcas" ? marca : "";

  return [marcaFinal, modeloFinal, anio].filter(Boolean).join(" ");
}

// ══════════════════════════════════════════════════════
//  IMÁGENES
// ══════════════════════════════════════════════════════
function previsualizarImagenes(input) {
  const grid = document.getElementById("previewGrid");
  const archivos = Array.from(input.files).slice(0, 5);
  imagenesBase64 = [];
  grid.innerHTML = "";
  archivos.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      const b64 = e.target.result;
      imagenesBase64.push({ data: b64.split(",")[1], mediaType: file.type, nombre: file.name });
      const wrap = document.createElement("div");
      wrap.className = "img-preview-item";
      wrap.id = `img-prev-${i}`;
      wrap.innerHTML = `<img src="${b64}" alt="Imagen ${i + 1}"><button onclick="eliminarImagen(${i})" title="Eliminar">✕</button>`;
      grid.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });
}

function eliminarImagen(index) {
  imagenesBase64.splice(index, 1);
  document.getElementById(`img-prev-${index}`)?.remove();
}

// ══════════════════════════════════════════════════════
//  GENERAR DIAGNÓSTICO IA
// ══════════════════════════════════════════════════════
async function generarDiagnostico() {
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const vehiculo = getVehiculoTexto();
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!nombre) { mostrarToast("Ingresa el nombre del cliente", "warn"); return; }
  if (!vehiculo) { mostrarToast("Selecciona o escribe el vehículo", "warn"); return; }
  if (!descripcion) { mostrarToast("Describe el problema", "warn"); return; }

  const btn = document.getElementById("btnGenerar");
  btn.disabled = true;
  btn.textContent = "⏳ Analizando con IA...";

  const resultadoEl = document.getElementById("resultadoIA");
  const contenidoEl = document.getElementById("contenidoIA");
  const tagsEl = document.getElementById("ia-tags");
  const costoBox = document.getElementById("costoBox");
  const clienteLabel = document.getElementById("ia-cliente-label");
  const accionesEl = document.getElementById("ia-acciones");

  resultadoEl.classList.add("visible");
  contenidoEl.innerHTML = `<span style="color:var(--muted);font-size:.85rem">⏳ La IA está analizando la información...</span>`;
  tagsEl.innerHTML = "";
  costoBox.style.display = "none";
  if (accionesEl) accionesEl.style.display = "none";
  clienteLabel.textContent = `Cliente: ${nombre} · ${vehiculo}${telefono ? " · " + telefono : ""}`;

  try {
    const response = await fetch(`${API_BACKEND}/cotizaciones/diagnostico`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, telefono, vehiculo, descripcion, imagenes: [] })
    });
    const data = await response.json();
    const texto = data.diagnostico || "No se pudo obtener respuesta de la IA.";

    await renderStreamText(contenidoEl, texto);

    const costoMatch = texto.match(/\$[\d.,]+\s*-\s*\$[\d.,]+\s*COP/i)
      || texto.match(/\$[\d.]+(?:\.\d{3})*(?:\s*COP)?/i);
    const costoTexto = costoMatch ? costoMatch[0] : "A consultar";
    const costoNum = costoMatch ? (parseInt(costoMatch[0].replace(/[^0-9]/g, "")) || 0) : 0;

    document.getElementById("costoValor").textContent = costoTexto;
    costoBox.style.display = "flex";
    tagsEl.innerHTML = extraerTags(texto).map(t => `<span class="ia-tag">${t}</span>`).join("");

    ultimaCotizacion = { nombre_cliente: nombre, telefono, vehiculo_texto: vehiculo, descripcion, diagnostico_ia: texto, costo_estimado: costoNum, tipo: "AUTOMATICA", imagen_count: imagenesBase64.length, costoTexto };

    if (accionesEl) accionesEl.style.display = "flex";
    await guardarCotizacionBD(ultimaCotizacion);
    mostrarToast("Diagnóstico generado y guardado ✓", "ok");

  } catch (err) {
    console.error("Error IA:", err);
    contenidoEl.innerHTML = `<span style="color:#dc2626">❌ Error al conectar con la IA. Intenta de nuevo.</span>`;
    mostrarToast("Error al generar diagnóstico", "error");
  }

  btn.disabled = false;
  btn.textContent = "🤖 Generar Diagnóstico IA";
}

// ══════════════════════════════════════════════════════
//  RENDER STREAM
// ══════════════════════════════════════════════════════
async function renderStreamText(el, texto) {
  el.innerHTML = "";
  const cursor = document.createElement("span");
  cursor.className = "cursor-blink";
  el.appendChild(cursor);
  const chars = texto.split("");
  let acumulado = "";
  for (let i = 0; i < chars.length; i++) {
    acumulado += chars[i];
    el.childNodes[0].textContent = acumulado;
    if (i % 4 === 0) await sleep(i < 20 ? 12 : i < 100 ? 5 : 2);
  }
  cursor.remove();
  el.innerHTML = texto.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════════
//  TAGS
// ══════════════════════════════════════════════════════
function extraerTags(texto) {
  const mapa = {
    "compresor": "🔧 Compresor", "gas": "❄️ Gas refrigerante", "fuga": "💧 Fuga detectada",
    "filtro": "🔲 Filtro", "ventilador": "🌀 Ventilador", "eléctric": "⚡ Eléctrico",
    "termostato": "🌡️ Termostato", "condensador": "🔩 Condensador", "evaporador": "❄️ Evaporador",
    "correa": "⚙️ Correa", "urgencia alta": "🔴 Alta urgencia",
    "urgencia media": "🟡 Media urgencia", "urgencia baja": "🟢 Baja urgencia",
  };
  const tags = [], bajo = texto.toLowerCase();
  for (const [clave, etiqueta] of Object.entries(mapa))
    if (bajo.includes(clave)) tags.push(etiqueta);
  return tags.slice(0, 6);
}

// ══════════════════════════════════════════════════════
//  GUARDAR EN BD
// ══════════════════════════════════════════════════════
async function guardarCotizacionBD(datos) {
  try {
    const res = await fetch(`${API_BACKEND}/cotizaciones`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    if (res.ok) {
      const saved = await res.json();
      if (ultimaCotizacion) ultimaCotizacion.id = saved.id_cotizacion;
    }
  } catch (e) { console.warn("No se pudo guardar en BD:", e.message); }
}

// ══════════════════════════════════════════════════════
//  IMPRIMIR / PDF
// ══════════════════════════════════════════════════════
function imprimirCotizacion() {
  if (!ultimaCotizacion) { mostrarToast("Primero genera un diagnóstico", "warn"); return; }
  const { nombre_cliente, telefono, vehiculo_texto, descripcion, diagnostico_ia, costoTexto, imagen_count } = ultimaCotizacion;
  const fecha = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  const ventana = window.open("", "_blank");
  ventana.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Cotización — Frío Cars</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Plus Jakarta Sans',sans-serif;background:#fff;color:#0f172a;padding:2.5rem;font-size:14px}
.header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1d4ed8;padding-bottom:1.2rem;margin-bottom:1.5rem}
.brand{font-size:1.6rem;font-weight:800;color:#1d4ed8}.brand span{color:#0f172a}.brand-sub{font-size:.75rem;color:#64748b;font-weight:500}
.badge{background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;border-radius:12px;padding:.4rem 1rem;font-size:.78rem;font-weight:700}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;background:#f8fafc;border-radius:12px;padding:1.2rem;margin-bottom:1.5rem;border:1px solid #e2e8f0}
.info-item label{font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:.2rem}
.info-item span{font-size:.9rem;font-weight:600;color:#0f172a}
.diagnostico{background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:1.2rem;margin-bottom:1.2rem;line-height:1.8;white-space:pre-wrap;font-size:.88rem}
.costo-box{background:#f0fdf4;border:2px solid #bbf7d0;border-radius:14px;padding:1.2rem 1.6rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
.costo-label{font-size:.72rem;font-weight:700;color:#16a34a}.costo-val{font-size:1.8rem;font-weight:800;color:#16a34a}
.footer{border-top:1px solid #e2e8f0;padding-top:1rem;margin-top:1rem;text-align:center;color:#94a3b8;font-size:.72rem}
.validez{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:.6rem 1rem;font-size:.78rem;color:#92400e;font-weight:600;margin-bottom:1.2rem}
@media print{.no-print{display:none}}</style></head><body>
<div class="header"><div><div class="brand">Frío <span>Cars</span></div><div class="brand-sub">Sistema Automotriz · Diagnóstico IA</div></div>
<div><div class="badge">🤖 Cotización Inteligente</div><div style="font-size:.72rem;color:#64748b;text-align:right;margin-top:.3rem">${fecha}</div></div></div>
<div class="info-grid">
<div class="info-item"><label>Cliente</label><span>${nombre_cliente}</span></div>
<div class="info-item"><label>Teléfono</label><span>${telefono || "No indicado"}</span></div>
<div class="info-item" style="grid-column:1/-1"><label>Vehículo</label><span>${vehiculo_texto}</span></div>
<div class="info-item" style="grid-column:1/-1"><label>Problema reportado</label><span>${descripcion}</span></div>
${imagen_count > 0 ? `<div class="info-item"><label>Imágenes</label><span>${imagen_count} imagen(es)</span></div>` : ""}
</div>
<p style="font-size:.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.7rem">🤖 diagnóstico generado por IA</p>
<div class="diagnostico">${diagnostico_ia.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</div>
<div class="costo-box"><div><div class="costo-label">Costo estimado del servicio</div><div class="costo-val">${costoTexto}</div></div>
<div style="text-align:right;font-size:.7rem;color:#64748b">*Precio referencial<br>sujeto a revisión técnica</div></div>
<div class="validez">⏱ Validez: 72 horas desde la fecha de emisión</div>
<div class="footer"><p style="font-weight:700;color:#1d4ed8;margin-bottom:.3rem">Frío Cars — Sistema Automotriz</p>
<p>Diagnóstico generado automáticamente por Inteligencia Artificial · ${fecha}</p></div>
<div class="no-print" style="text-align:center;margin-top:2rem;display:flex;gap:1rem;justify-content:center">
<button onclick="window.print()" style="background:#1d4ed8;color:#fff;border:none;border-radius:12px;padding:.8rem 2rem;font-size:.9rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">🖨️ Imprimir / Guardar PDF</button>
<button onclick="window.close()" style="background:#f1f5f9;color:#64748b;border:1.5px solid #e2e8f0;border-radius:12px;padding:.8rem 2rem;font-size:.9rem;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif">✕ Cerrar</button>
</div></body></html>`);
  ventana.document.close();
  setTimeout(() => ventana.focus(), 300);
}

function descargarPDF() {
  if (!ultimaCotizacion) { mostrarToast("Primero genera un diagnóstico", "warn"); return; }
  imprimirCotizacion();
  mostrarToast("En la ventana de impresión selecciona 'Guardar como PDF'", "ok");
}

// ══════════════════════════════════════════════════════
//  ENVIAR SOLICITUD (MANUAL)
// ══════════════════════════════════════════════════════
async function enviarSolicitud() {
  const nombre = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const vehiculo = getVehiculoTexto();
  const descripcion = document.getElementById("descripcion").value.trim();
  if (!nombre || !vehiculo || !descripcion) { mostrarToast("Completa los campos requeridos", "warn"); return; }
  const btn = document.getElementById("btnEnviar");
  btn.disabled = true; btn.textContent = "Enviando...";
  await guardarCotizacionBD({ nombre_cliente: nombre, telefono, vehiculo_texto: vehiculo, descripcion, diagnostico_ia: "", costo_estimado: 0, tipo: "MANUAL", imagen_count: imagenesBase64.length });
  mostrarToast("Solicitud enviada. Un técnico te contactará pronto ✓", "ok");
  btn.disabled = false; btn.textContent = "📋 Enviar Solicitud";
}

// ══════════════════════════════════════════════════════
//  NUEVA COTIZACIÓN
// ══════════════════════════════════════════════════════
function nuevaCotizacion() {
  document.getElementById("nombre").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("veh-anio").value = new Date().getFullYear();
  document.getElementById("veh-modelo-custom").value = "";
  document.getElementById("veh-preview").textContent = "—";
  document.getElementById("descripcion").value = "";
  document.getElementById("previewGrid").innerHTML = "";
  document.getElementById("resultadoIA").classList.remove("visible");
  document.getElementById("ia-acciones").style.display = "none";
  imagenesBase64 = []; ultimaCotizacion = null;

  // Resetear selects
  const selModelo = document.getElementById("veh-modelo");
  selModelo.innerHTML = `<option value="">— primero elige marca —</option>`;
  selModelo.disabled = true;
  cargarMarcas(); // recarga marcas y deja el select habilitado

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ══════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════
function mostrarToast(msg, tipo = "ok") {
  const c = {
    ok: { bg: "var(--green-lt)", border: "var(--green-border)", text: "var(--green)", icon: "✓" },
    warn: { bg: "#fffbeb", border: "#fde68a", text: "#d97706", icon: "⚠" },
    error: { bg: "#fff1f2", border: "#fecdd3", text: "#e11d48", icon: "✕" },
  }[tipo];
  document.getElementById("fc-toast")?.remove();
  const t = document.createElement("div");
  t.id = "fc-toast";
  t.style.cssText = `position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;background:${c.bg};border:1.5px solid ${c.border};color:${c.text};padding:.75rem 1.2rem;border-radius:14px;font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.1);display:flex;align-items:center;gap:.6rem;animation:slideToast .25s ease;max-width:340px`;
  t.innerHTML = `<span>${c.icon}</span>${msg}`;
  if (!document.getElementById("toast-style")) {
    const s = document.createElement("style"); s.id = "toast-style";
    s.textContent = `@keyframes slideToast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(s);
  }
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}