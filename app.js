const express = require('express');
const cors = require('cors');
const db = require('./db'); 
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- PRODUCTOS ---
app.get('/api/productos', (req, res) => {
    db.query("SELECT * FROM PRODUCTOS", (err, r) => {
        if (err) return res.status(500).json(err);
        res.json(r);
    });
});

app.post('/api/productos', (req, res) => {
    const { codigo, nombre, precio, stock } = req.body;
    const sql = "INSERT INTO PRODUCTOS (CODIGO, NOMBRE, PRECIO, STOCK) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE STOCK = STOCK + VALUES(STOCK), PRECIO = VALUES(PRECIO)";
    db.query(sql, [codigo, nombre, precio, stock], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ ok: true });
    });
});

// --- CLIENTES ---
app.get('/api/clientes', (req, res) => {
    db.query("SELECT * FROM CLIENTES", (err, r) => {
        if (err) return res.status(500).json(err);
        res.json(r);
    });
});

// --- PROVEEDORES ---
app.get('/api/proveedores', (req, res) => {
    db.query("SELECT * FROM PROVEEDORES", (err, r) => {
        if (err) return res.status(500).json(err);
        res.json(r);
    });
});

// --- VENTAS (Sincronizado con Triggers de MySQL) ---
app.post('/api/venta', (req, res) => {
    const { clienteId, productos, total } = req.body;
    
    // 1. Crear la cabecera de la venta
    db.query("INSERT INTO VENTAS (COD_CLIENT, TOTAL) VALUES (?, ?)", [clienteId, total], (err, result) => {
        if (err) return res.status(500).json({ error: "Error al crear venta" });

        const folio = result.insertId;

        // 2. Insertar los detalles
        // Nota: Los triggers 'tg_actualizar_stock' y 'tg_evitar_stock_negativo' se encargan del inventario
        const promesas = productos.map(p => {
            return new Promise((resolve, reject) => {
                const subtotal = p.cant * (p.PRECIO || p.precio);
                db.query(
                    "INSERT INTO DETALLE_VENTAS (ID_VENTA, CODIGO, CANTIDAD, PRECIO_UNIT, SUBTOTAL) VALUES (?, ?, ?, ?, ?)", 
                    [folio, p.CODIGO || p.codigo, p.cant, p.PRECIO || p.precio, subtotal], 
                    (errDet) => {
                        if (errDet) reject(errDet);
                        else resolve();
                    }
                );
            });
        });

        Promise.all(promesas)
            .then(() => res.json({ success: true, folio: folio }))
            .catch(error => res.status(500).json({ error: "Error en detalles", details: error }));
    });
});

app.get('/api/historial', (req, res) => {
    const sql = "SELECT V.*, C.NOMBRE, C.APELLIDO FROM VENTAS V JOIN CLIENTES C ON V.COD_CLIENT = C.COD_CLIENT ORDER BY V.ID_VENTA DESC";
    db.query(sql, (err, r) => {
        if (err) return res.status(500).json(err);
        res.json(r);
    });
});

app.listen(3000, () => console.log("🚀 Servidor MySQL corriendo en http://localhost:3000"));
