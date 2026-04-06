const { jsPDF } = window.jspdf;
let carrito = [], productos = [];
const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// AUTH
function iniciarSesion() {
    const u = document.getElementById('login-user').value, p = document.getElementById('login-pass').value;
    if (u === 'admin' && p === 'admin123') entrar('admin');
    else if (u === 'cajero' && p === 'caja123') entrar('worker');
    else alert("Usuario o contraseña incorrectos");
}
function entrar(rol) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    document.getElementById('btn-sat').style.display = (rol === 'admin') ? 'block' : 'none';
    actualizar(); cargarClientes();
}
function cerrarSesion() { location.reload(); }

// DATA LOADING
async function actualizar() {
    const r = await fetch('/api/productos');
    productos = await r.json();
    renderProd();
    document.getElementById('tabla-prod').innerHTML = productos.map(p => `<tr><td>${p.CODIGO}</td><td>${p.NOMBRE}</td><td>${mxn.format(p.PRECIO)}</td><td>${p.STOCK}</td></tr>`).join('');
}
async function cargarClientes() {
    const r = await fetch('/api/clientes');
    const d = await r.json();
    document.getElementById('sel-cliente').innerHTML = d.map(c => `<option value="${c.COD_CLIENT}">${c.NOMBRE} ${c.APELLIDO}</option>`).join('');
}

// PRODUCTOS E INVENTARIO
function renderProd() {
    document.getElementById('grid-productos').innerHTML = productos.map(p => `
        <div class="card" onclick="addCar(${p.CODIGO})">
            <small style="color:${p.STOCK < 5 ? 'red' : '#64748b'}">Stock: ${p.STOCK}</small>
            <h4>${p.NOMBRE}</h4>
            <b>${mxn.format(p.PRECIO)}</b>
        </div>
    `).join('');
}
async function guardarProducto() {
    const d = { codigo: document.getElementById('p-cod').value, nombre: document.getElementById('p-nom').value, precio: document.getElementById('p-pre').value, stock: document.getElementById('p-stock').value };
    if(!d.codigo || !d.nombre) return alert("Llena los campos");
    await fetch('/api/productos', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(d) });
    actualizar();
}

// PROVEEDORES
async function cargarProveedores() {
    const r = await fetch('/api/proveedores');
    const data = await r.json();
    document.getElementById('tabla-prov').innerHTML = data.map(p => `<tr><td>${p.ID_PROV}</td><td>${p.NOMBRE_EMPRESA}</td><td>${p.RFC}</td><td>${p.TELEFONO}</td></tr>`).join('');
}
async function guardarProveedor() {
    const d = { nombre: document.getElementById('pr-nom').value, rfc: document.getElementById('pr-rfc').value, tel: document.getElementById('pr-tel').value };
    await fetch('/api/proveedores', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(d) });
    cargarProveedores();
}

// CARRITO
function addCar(cod) {
    const p = productos.find(x => x.CODIGO == cod);
    if (p.STOCK <= 0) return alert("Sin existencias");
    const item = carrito.find(x => x.CODIGO == cod);
    if (item) item.cant++; else carrito.push({ ...p, cant: 1 });
    p.STOCK--; renderProd(); renderCar();
}
function eliminarUno(cod) {
    const idx = carrito.findIndex(x => x.CODIGO == cod);
    if (idx > -1) {
        carrito[idx].cant--;
        productos.find(x => x.CODIGO == cod).STOCK++;
        if (carrito[idx].cant <= 0) carrito.splice(idx, 1);
    }
    renderProd(); renderCar();
}
function vaciarCarrito() {
    carrito.forEach(i => productos.find(x => x.CODIGO == i.CODIGO).STOCK += i.cant);
    carrito = []; renderProd(); renderCar();
}
function renderCar() {
    let t = 0;
    document.getElementById('lista-carrito').innerHTML = carrito.map(c => {
        t += (c.PRECIO * c.cant);
        return `<div class="cart-item">
            <span><b>${c.cant}x</b> ${c.NOMBRE}</span>
            <span>${mxn.format(c.PRECIO * c.cant)} <button class="btn-del" onclick="eliminarUno(${c.CODIGO})">✕</button></span>
        </div>`;
    }).join('');
    document.getElementById('total-txt').innerText = mxn.format(t);
}

// VENTAS Y PDF
async function procesarPago() {
    if (!carrito.length) return alert("Carrito vacío");
    const total = parseFloat(document.getElementById('total-txt').innerText.replace(/[^0-9.-]+/g, ""));
    const cliId = document.getElementById('sel-cliente').value;
    const res = await fetch('/api/venta', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ clienteId: cliId, productos: carrito, total: total }) });
    const data = await res.json();
    if (res.ok) {
        generarTicket(data.folio, total);
        carrito = []; actualizar(); renderCar();
        alert("¡Venta Exitosa! Ticket generado.");
    }
}
function generarTicket(folio, total) {
    const doc = new jsPDF({ format: [80, 150], unit: 'mm' });
    doc.setFontSize(10); doc.text("SAMUEL POS STORE", 40, 10, {align: "center"});
    doc.text(`Folio: #${folio}`, 5, 20);
    let y = 30;
    carrito.forEach(i => {
        doc.text(`${i.cant}x ${i.NOMBRE.substring(0,15)}`, 5, y);
        doc.text(`${mxn.format(i.PRECIO * i.cant)}`, 75, y, {align: "right"});
        y += 5;
    });
    doc.text(`TOTAL: ${mxn.format(total)}`, 75, y + 10, {align: "right"});
    doc.save(`Ticket_${folio}.pdf`);
}

async function cargarHistorial() {
    const r = await fetch('/api/historial');
    const data = await r.json();
    document.getElementById('tabla-his').innerHTML = data.map(v => `<tr><td>#${v.ID_VENTA}</td><td>${v.NOMBRE} ${v.APELLIDO}</td><td>${mxn.format(v.TOTAL)}</td><td>${new Date(v.FECHA).toLocaleDateString()}</td><td><button onclick="verDetalles(${v.ID_VENTA})" style="cursor:pointer; background:none; border:1px solid #ddd; border-radius:4px;">🔍 Ver</button></td></tr>`).join('');
}
async function verDetalles(id) {
    const r = await fetch(`/api/venta/${id}`);
    const data = await r.json();
    document.getElementById('det-folio').innerText = `Venta #${id}`;
    document.getElementById('det-cliente').innerText = `Cliente: ${data.venta.NOMBRE} ${data.venta.APELLIDO}`;
    document.getElementById('det-items').innerHTML = data.detalles.map(d => `<div style="display:flex; justify-content:space-between;"><span>${d.CANTIDAD}x ${d.NOMBRE}</span><span>${mxn.format(d.CANTIDAD * d.PRECIO_UNIT)}</span></div>`).join('');
    document.getElementById('det-total').innerText = `TOTAL: ${mxn.format(data.venta.TOTAL)}`;
    document.getElementById('modal-detalle').style.display = 'block';
}

async function generarFacturaSAT() {
    const f = document.getElementById('sat-folio').value;
    const r = await fetch(`/api/venta/${f}`);
    if (!r.ok) return alert("Folio no encontrado");
    const data = await r.json();
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("COMPROBANTE FISCAL SAT (CFDI 4.0)", 105, 20, {align: "center"});
    doc.setFontSize(10); doc.text(`RFC Receptor: ${data.venta.RFC}`, 20, 40);
    doc.text(`Cliente: ${data.venta.NOMBRE} ${data.venta.APELLIDO}`, 20, 45);
    doc.text(`Folio: ${f}`, 20, 50);
    doc.line(20, 55, 190, 55);
    doc.text(`Total Facturado: ${mxn.format(data.venta.TOTAL)}`, 20, 65);
    doc.text("Sello Digital: UUID-" + Math.random().toString(36).substr(2, 9).toUpperCase(), 20, 80);
    doc.save(`Factura_SAT_${f}.pdf`);
}

function showTab(id) { document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('active')); document.getElementById('tab-' + id).classList.add('active'); }
function cerrarModal() { document.getElementById('modal-detalle').style.display = 'none'; }