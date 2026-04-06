const express = require('express');
const cors = require('cors');
const db = require('./server'); // Importa la conexión anterior
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- PRODUCTOS ---
app.get('/api/productos', (req, res) => {
    // Nota: Si en tu BD la tabla es minúscula, cámbialo a "productos"
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

// --- CLIENTES (Necesario para el select del POS) ---
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

app.post('/api/proveedores', (req, res) => {
    const { nombre, rfc, tel } = req.body;
    db.query("INSERT INTO PROVEEDORES (NOMBRE_EMPRESA, RFC, TELEFONO) VALUES (?, ?, ?)", [nombre, rfc, tel], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ ok: true });
    });
});

// --- VENTAS ---
app.post('/api/venta', (req, res) => {
    const { clienteId, productos, total } = req.body;
    db.query("INSERT INTO VENTAS (COD_CLIENT, TOTAL) VALUES (?, ?)", [clienteId, total], (err, result) => {
        if (err) return res.status(500).json(err);
        const folio = result.insertId;
        productos.forEach(p => {
            db.query("INSERT INTO DETALLE_VENTAS (ID_VENTA, CODIGO, CANTIDAD, PRECIO_UNIT) VALUES (?, ?, ?, ?)", [folio, p.CODIGO, p.cant, p.PRECIO]);
            db.query("UPDATE PRODUCTOS SET STOCK = STOCK - ? WHERE CODIGO = ?", [p.cant, p.CODIGO]);
        });
        res.json({ success: true, folio: folio });
    });
});

app.get('/api/historial', (req, res) => {
    const sql = "SELECT V.*, C.NOMBRE, C.APELLIDO FROM VENTAS V JOIN CLIENTES C ON V.COD_CLIENT = C.COD_CLIENT ORDER BY V.ID_VENTA DESC";
    db.query(sql, (err, r) => {
        if (err) return res.status(500).json(err);
        res.json(r);
    });
});

app.get('/api/venta/:id', (req, res) => {
    db.query("SELECT V.*, C.* FROM VENTAS V JOIN CLIENTES C ON V.COD_CLIENT = C.COD_CLIENT WHERE V.ID_VENTA = ?", [req.params.id], (err, v) => {
        db.query("SELECT D.*, P.NOMBRE FROM DETALLE_VENTAS D JOIN PRODUCTOS P ON D.CODIGO = P.CODIGO WHERE D.ID_VENTA = ?", [req.params.id], (err, d) => {
            res.json({ venta: v[0], detalles: d });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
