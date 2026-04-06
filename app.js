const express = require('express');
const cors = require('cors');
const db = require('./server'); // Importa tu conexión a Clever Cloud
const app = express();

// Middlewares obligatorios
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para que cargue tu index.html, style y script

// --- RUTA: PRODUCTOS ---
app.get('/api/productos', (req, res) => {
    // Usamos minúsculas para máxima compatibilidad en Linux (Render/CleverCloud)
    db.query("SELECT * FROM productos", (err, r) => {
        if (err) {
            console.error("❌ Error en SELECT productos:", err.message);
            return res.json([]); // Enviamos array vacío para que el .map() no explote
        }
        res.json(r || []);
    });
});

app.post('/api/productos', (req, res) => {
    const { codigo, nombre, precio, stock } = req.body;
    const sql = `INSERT INTO productos (CODIGO, NOMBRE, PRECIO, STOCK) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE STOCK = STOCK + VALUES(STOCK), PRECIO = VALUES(PRECIO)`;
    db.query(sql, [codigo, nombre, precio, stock], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
    });
});

// --- RUTA: CLIENTES ---
app.get('/api/clientes', (req, res) => {
    db.query("SELECT * FROM clientes", (err, r) => {
        if (err) {
            console.error("❌ Error en SELECT clientes:", err.message);
            return res.json([]);
        }
        res.json(r || []);
    });
});

// --- RUTA: PROVEEDORES ---
app.get('/api/proveedores', (req, res) => {
    db.query("SELECT * FROM proveedores", (err, r) => {
        if (err) return res.json([]);
        res.json(r || []);
    });
});

app.post('/api/proveedores', (req, res) => {
    const { nombre, rfc, tel } = req.body;
    const sql = "INSERT INTO proveedores (NOMBRE_EMPRESA, RFC, TELEFONO) VALUES (?, ?, ?)";
    db.query(sql, [nombre, rfc, tel], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
    });
});

// --- RUTA: VENTAS (PROCESAR PAGO) ---
app.post('/api/venta', (req, res) => {
    const { clienteId, productos, total } = req.body;
    
    // 1. Insertar la venta principal
    db.query("INSERT INTO ventas (COD_CLIENT, TOTAL) VALUES (?, ?)", [clienteId, total], (err, result) => {
        if (err) {
            console.error("❌ Error al registrar venta:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        const folio = result.insertId;
        
        // 2. Registrar cada producto en el detalle y descontar stock
        productos.forEach(p => {
            db.query("INSERT INTO detalle_ventas (ID_VENTA, CODIGO, CANTIDAD, PRECIO_UNIT) VALUES (?, ?, ?, ?)", 
                [folio, p.CODIGO, p.cant, p.PRECIO]);
            
            db.query("UPDATE productos SET STOCK = STOCK - ? WHERE CODIGO = ?", 
                [p.cant, p.CODIGO]);
        });
        
        res.json({ success: true, folio: folio });
    });
});

// --- RUTA: HISTORIAL ---
app.get('/api/historial', (req, res) => {
    const sql = `SELECT v.*, c.NOMBRE, c.APELLIDO 
                 FROM ventas v 
                 JOIN clientes c ON v.COD_CLIENT = c.COD_CLIENT 
                 ORDER BY v.ID_VENTA DESC`;
    db.query(sql, (err, r) => {
        if (err) return res.json([]);
        res.json(r || []);
    });
});

// --- RUTA: DETALLE INDIVIDUAL PARA MODAL O SAT ---
app.get('/api/venta/:id', (req, res) => {
    const id = req.params.id;
    db.query("SELECT v.*, c.* FROM ventas v JOIN clientes c ON v.COD_CLIENT = c.COD_CLIENT WHERE v.ID_VENTA = ?", [id], (err, v) => {
        if (err || !v.length) return res.status(404).json({ error: "Venta no encontrada" });
        
        db.query("SELECT d.*, p.NOMBRE FROM detalle_ventas d JOIN productos p ON d.CODIGO = p.CODIGO WHERE d.ID_VENTA = ?", [id], (err, d) => {
            res.json({ 
                venta: v[0], 
                detalles: d || [] 
            });
        });
    });
});

// CONFIGURACIÓN DE PUERTO PARA RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor NEGRI TECH corriendo en puerto ${PORT}`);
});
