// ══════════════════════════════════════════════════════
//  FRÍO CARS — factura.js
//  Lee datos de localStorage y renderiza la factura
// ══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

  // ── Leer datos del localStorage ──────────────────
  const productos  = JSON.parse(localStorage.getItem("factura"))      || [];
  const cliente    = localStorage.getItem("cliente")                   || "Cliente General";
  const clienteId  = localStorage.getItem("clienteId")                || "—";
  const subtotal   = parseFloat(localStorage.getItem("subtotalFactura")) || 0;
  const iva        = parseFloat(localStorage.getItem("ivaFactura"))      || subtotal * 0.19;
  const total      = parseFloat(localStorage.getItem("totalFactura"))    || subtotal + iva;
  const ventaId    = localStorage.getItem("ventaId")                   || "0000";

  // ── Fecha ─────────────────────────────────────────
  const fecha = new Date().toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  // ── Rellenar campos ───────────────────────────────
  setText("ventaId",       ventaId);
  setText("ventaId2",      ventaId);
  setText("fechaFactura",  fecha);
  setText("fechaFactura2", fecha);
  setText("clienteNombre", cliente);
  setText("clienteId",     clienteId);
  setText("cantProductos", `${productos.length} ítem${productos.length !== 1 ? "s" : ""}`);

  // ── Tabla de productos ────────────────────────────
  const tbody = document.getElementById("tablaFactura");

  if (productos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:2rem;color:#64748b">
          No hay productos en esta factura
        </td>
      </tr>`;
  } else {
    productos.forEach((p, i) => {
      const sub = p.precio * p.cantidad;
      const tr  = document.createElement("tr");
      tr.innerHTML = `
        <td style="color:#64748b;font-weight:600">${i + 1}</td>
        <td style="font-weight:700">${p.nombre}</td>
        <td style="text-align:center">${p.cantidad}</td>
        <td>$${Number(p.precio).toLocaleString("es-CO")}</td>
        <td>$${Number(sub).toLocaleString("es-CO")}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ── Totales ───────────────────────────────────────
  const fmt = v => `$${Number(v).toLocaleString("es-CO", { minimumFractionDigits: 0 })}`;
  setText("subtotalVal", fmt(subtotal));
  setText("ivaVal",      fmt(iva));
  setText("totalVal",    fmt(total));

});


function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}