// ══════════════════════════════════════════════════════
//  FRÍO CARS — cotizacion.js
//  Diagnóstico IA con análisis de imágenes + descripción
//  Usa Claude claude-sonnet-4-20250514 vía Anthropic API
// ══════════════════════════════════════════════════════

const API_BACKEND = "https://friocars-backend.onrender.com/api";

let tipoCotizacion = "AUTOMATICA";
let imagenesBase64  = []; // [{data, mediaType, nombre}]


// ══════════════════════════════════════════════════════
//  TIPO DE COTIZACIÓN
// ══════════════════════════════════════════════════════
function seleccionarTipo(tipo) {
  tipoCotizacion = tipo;
  document.getElementById("cardAutomatica")
    .classList.toggle("activo", tipo === "AUTOMATICA");
  document.getElementById("cardManual")
    .classList.toggle("activo", tipo === "MANUAL");
}


// ══════════════════════════════════════════════════════
//  PREVISUALIZAR IMÁGENES
// ══════════════════════════════════════════════════════
function previsualizarImagenes(input) {
  const grid    = document.getElementById("previewGrid");
  const archivos = Array.from(input.files).slice(0, 5);

  imagenesBase64 = [];
  grid.innerHTML = "";

  archivos.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Full = e.target.result;           // data:image/jpeg;base64,XXXX
      const base64Data = base64Full.split(",")[1];  // solo XXXX
      const mediaType  = file.type;                 // image/jpeg

      imagenesBase64.push({ data: base64Data, mediaType, nombre: file.name });

      // Preview visual
      const wrap = document.createElement("div");
      wrap.className = "img-preview-item";
      wrap.id = `img-prev-${i}`;
      wrap.innerHTML = `
        <img src="${base64Full}" alt="Imagen ${i+1}">
        <button onclick="eliminarImagen(${i})" title="Eliminar">✕</button>
      `;
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
  const nombre      = document.getElementById("nombre").value.trim();
  const telefono    = document.getElementById("telefono").value.trim();
  const vehiculo    = document.getElementById("vehiculo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

  // Validaciones
  if (!nombre)      { mostrarToast("Ingresa el nombre del cliente", "warn"); document.getElementById("nombre").focus(); return; }
  if (!vehiculo)    { mostrarToast("Ingresa el vehículo", "warn"); document.getElementById("vehiculo").focus(); return; }
  if (!descripcion) { mostrarToast("Describe el problema del vehículo", "warn"); document.getElementById("descripcion").focus(); return; }

  const btn = document.getElementById("btnGenerar");
  btn.disabled = true;
  btn.textContent = "⏳ Analizando...";

  // Mostrar contenedor resultado
  const resultadoEl  = document.getElementById("resultadoIA");
  const contenidoEl  = document.getElementById("contenidoIA");
  const tagsEl       = document.getElementById("ia-tags");
  const costoBox     = document.getElementById("costoBox");
  const clienteLabel = document.getElementById("ia-cliente-label");

  resultadoEl.classList.add("visible");
  contenidoEl.innerHTML = `<span style="color:var(--muted);font-size:.85rem">⏳ La IA está analizando la información...</span>`;
  tagsEl.innerHTML      = "";
  costoBox.style.display = "none";
  clienteLabel.textContent = `Cliente: ${nombre} · ${vehiculo}${telefono ? " · " + telefono : ""}`;

  // Construir el prompt
  const prompt = construirPrompt(nombre, vehiculo, descripcion, tipoCotizacion);

  // Construir el mensaje para Claude con imágenes opcionales
  const contenidoMensaje = [];

  // Agregar imágenes si las hay
  imagenesBase64.forEach((img, i) => {
    contenidoMensaje.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType,
        data: img.data
      }
    });
    contenidoMensaje.push({
      type: "text",
      text: `Imagen ${i + 1} del vehículo: ${img.nombre}`
    });
  });

  // Agregar el prompt de texto
  contenidoMensaje.push({ type: "text", text: prompt });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `Eres el asistente de diagnóstico automotriz de Frío Cars, especializado en sistemas de aire acondicionado vehicular.
Tu trabajo es analizar síntomas e imágenes del vehículo del cliente y generar un diagnóstico claro, profesional y honesto.

REGLAS:
- Sé directo y práctico. No uses lenguaje técnico innecesario.
- Siempre indica el costo estimado al final en pesos colombianos (COP).
- Estructura tu respuesta así:
  1. 🔍 DIAGNÓSTICO: Qué le puede estar pasando al vehículo
  2. 🛠️ SERVICIOS NECESARIOS: Lista los servicios recomendados
  3. 📦 REPUESTOS PROBABLES: Qué partes pueden necesitarse
  4. 💰 COSTO ESTIMADO: Rango en COP (ej: $180.000 - $350.000 COP)
  5. ⚠️ URGENCIA: Baja / Media / Alta
- Si hay imágenes, descríbelas brevemente y úsalas para el diagnóstico.
- Si el tipo es MANUAL, indica que un técnico hará contacto pronto y no des precio exacto.`,
        messages: [
          { role: "user", content: contenidoMensaje }
        ]
      })
    });

    const data = await response.json();
    const texto = data.content?.[0]?.text || "No se pudo obtener respuesta de la IA.";

    // Renderizar respuesta con efecto de escritura
    await renderStreamText(contenidoEl, texto);

    // Extraer costo estimado del texto
    const costoMatch = texto.match(/\$[\d.,\s]+-?\s*\$?[\d.,\s]*\s*COP/i)
                    || texto.match(/\$[\d.]+(?:\.\d{3})*(?:\s*COP)?/i);

    if (costoMatch) {
      document.getElementById("costoValor").textContent = costoMatch[0];
      costoBox.style.display = "flex";
    }

    // Tags de diagnóstico rápido
    const tags = extraerTags(texto);
    tagsEl.innerHTML = tags.map(t =>
      `<span class="ia-tag">${t}</span>`
    ).join("");

    // Guardar en backend si hay cliente
    await guardarCotizacion({ nombre, telefono, vehiculo, descripcion, diagnostico: texto, tipo: tipoCotizacion });

    mostrarToast("Diagnóstico generado correctamente ✓", "ok");

  } catch (err) {
    console.error("Error IA:", err);
    contenidoEl.innerHTML = `<span style="color:#dc2626">⚠️ Error al conectar con la IA. Verifica tu conexión e intenta de nuevo.</span>`;
    mostrarToast("Error al generar diagnóstico", "error");
  }

  btn.disabled = false;
  btn.textContent = "🤖 Generar Diagnóstico IA";
}


// ══════════════════════════════════════════════════════
//  CONSTRUIR PROMPT
// ══════════════════════════════════════════════════════
function construirPrompt(nombre, vehiculo, descripcion, tipo) {
  return `
Cliente: ${nombre}
Vehículo: ${vehiculo}
Tipo de cotización: ${tipo === "AUTOMATICA" ? "Cotización Inteligente (respuesta inmediata con precio estimado)" : "Cotización Técnica (sin precio exacto, técnico hará seguimiento)"}

Descripción del problema:
"${descripcion}"

${imagenesBase64.length > 0 ? `Se adjuntaron ${imagenesBase64.length} imagen(es) del vehículo para análisis visual.` : "No se adjuntaron imágenes."}

Por favor genera el diagnóstico completo siguiendo el formato indicado.
  `.trim();
}


// ══════════════════════════════════════════════════════
//  RENDER CON EFECTO ESCRITURA
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
    // Velocidad adaptativa: más rápido en medio del texto
    const delay = i < 20 ? 18 : i < 100 ? 8 : 3;
    if (i % 3 === 0) await sleep(delay);
  }

  cursor.remove();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }


// ══════════════════════════════════════════════════════
//  EXTRAER TAGS DEL TEXTO
// ══════════════════════════════════════════════════════
function extraerTags(texto) {
  const mapa = {
    "compresor":   "🔩 Compresor",
    "gas":         "💨 Gas refrigerante",
    "fuga":        "🔍 Fuga detectada",
    "filtro":      "🧹 Filtro",
    "ventilador":  "🌀 Ventilador",
    "eléctric":    "⚡ Sistema eléctrico",
    "termostato":  "🌡️ Termostato",
    "condensador": "❄️ Condensador",
    "evaporador":  "💧 Evaporador",
    "correa":      "⚙️ Correa",
    "urgencia alta":"🔴 Urgencia Alta",
    "urgencia media":"🟡 Urgencia Media",
    "urgencia baja": "🟢 Urgencia Baja",
  };
  const tags = [];
  const bajo = texto.toLowerCase();
  for (const [clave, etiqueta] of Object.entries(mapa)) {
    if (bajo.includes(clave)) tags.push(etiqueta);
  }
  return tags.slice(0, 6);
}


// ══════════════════════════════════════════════════════
//  GUARDAR COTIZACIÓN EN BACKEND
// ══════════════════════════════════════════════════════
async function guardarCotizacion({ nombre, telefono, vehiculo, descripcion, diagnostico, tipo }) {
  try {
    await fetch(`${API_BACKEND}/cotizaciones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, telefono, vehiculo, descripcion, diagnostico, tipo })
    });
  } catch (e) {
    // Silencioso — no bloquea el flujo si el endpoint aún no existe
    console.warn("Backend cotizaciones no disponible:", e.message);
  }
}


// ══════════════════════════════════════════════════════
//  ENVIAR SOLICITUD (tipo MANUAL o con formulario)
// ══════════════════════════════════════════════════════
async function enviarSolicitud() {
  const nombre      = document.getElementById("nombre").value.trim();
  const telefono    = document.getElementById("telefono").value.trim();
  const vehiculo    = document.getElementById("vehiculo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!nombre || !vehiculo || !descripcion) {
    mostrarToast("Completa los campos requeridos antes de enviar", "warn");
    return;
  }

  const btn = document.getElementById("btnEnviar");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    await guardarCotizacion({ nombre, telefono, vehiculo, descripcion, diagnostico: "", tipo: tipoCotizacion });
    mostrarToast("Solicitud enviada correctamente. Un técnico te contactará pronto.", "ok");
    if (tipoCotizacion === "MANUAL") {
      setTimeout(() => {
        document.getElementById("nombre").value      = "";
        document.getElementById("telefono").value    = "";
        document.getElementById("vehiculo").value    = "";
        document.getElementById("descripcion").value = "";
        document.getElementById("previewGrid").innerHTML = "";
        imagenesBase64 = [];
      }, 1500);
    }
  } catch (e) {
    mostrarToast("Error al enviar la solicitud", "error");
  }

  btn.disabled = false;
  btn.textContent = "📤 Enviar Solicitud";
}


// ══════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════
function mostrarToast(msg, tipo = "ok") {
  const colores = {
    ok:    { bg:"var(--green-lt)", border:"var(--green-border)", text:"var(--green)", icon:"✓" },
    warn:  { bg:"#fffbeb",         border:"#fde68a",             text:"#d97706",      icon:"⚠" },
    error: { bg:"#fff1f2",         border:"#fecdd3",             text:"#e11d48",      icon:"✕" },
  };
  const c = colores[tipo] || colores.ok;
  document.getElementById("fc-toast")?.remove();

  const toast = document.createElement("div");
  toast.id = "fc-toast";
  toast.style.cssText = `
    position:fixed;bottom:1.8rem;right:1.8rem;z-index:9999;
    background:${c.bg};border:1.5px solid ${c.border};color:${c.text};
    padding:.75rem 1.2rem;border-radius:14px;
    font-family:'Plus Jakarta Sans',sans-serif;font-size:.84rem;font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,.1);
    display:flex;align-items:center;gap:.6rem;
    animation:slideToast .25s ease;max-width:340px;
  `;
  toast.innerHTML = `<span style="font-size:1rem">${c.icon}</span>${msg}`;

  if (!document.getElementById("toast-style")) {
    const s = document.createElement("style");
    s.id = "toast-style";
    s.textContent = `@keyframes slideToast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
    document.head.appendChild(s);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}