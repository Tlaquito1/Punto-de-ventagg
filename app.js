const express = require('express');
const cors = require('cors');
const db = require('./server'); 
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- PRODUCTOS ---
app.get('/api/productos', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM PRODUCTOS ORDER BY NOMBRE ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/productos', async (req, res) => {
    const { codigo, nombre, precio, stock } = req.body;
    const sql = `
        INSERT INTO PRODUCTOS (CODIGO, NOMBRE, PRECIO, STOCK) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (CODIGO) 
        DO UPDATE SET STOCK = PRODUCTOS.STOCK + EXCLUDED.STOCK, PRECIO = EXCLUDED.PRECIO`;
    try {
        await db.query(sql, [codigo, nombre, precio, stock]);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CLIENTES ---
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM CLIENTES");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PROVEEDORES ---
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM PROVEEDORES");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- VENTAS ---
app.post('/api/venta', async (req, res) => {
    const { clienteId, productos, total } = req.body;
    
    try {
        // Iniciar transacción
        await db.query('BEGIN');

        // 1. Insertar cabecera de venta
        const ventaRes = await db.query(
            "INSERT INTO VENTAS (COD_CLIENT, TOTAL) VALUES ($1, $2) RETURNING ID_VENTA",
            [clienteId, total]
        );
        const folio = ventaRes.rows[0].id_venta;

        // 2. Insertar detalles (El Trigger en DB se encarga del stock)
        for (const p of productos) {
            await db.query(
                "INSERT INTO DETALLE_VENTAS (ID_VENTA, CODIGO, CANTIDAD, PRECIO_UNIT, SUBTOTAL) VALUES ($1, $2, $3, $4, $5)",
                [folio, p.CODIGO || p.codigo, p.cant, p.PRECIO || p.precio, (p.cant * (p.PRECIO || p.precio))]
            );
        }

        await db.query('COMMIT');
        res.json({ success: true, folio: folio });

    } catch (err) {
        await db.query('ROLLBACK');
        res.status(500).json({ error: "Error en la venta", details: err.message });
    }
});

app.get('/api/historial', async (req, res) => {
    const sql = `
        SELECT V.*, C.NOMBRE, C.APELLIDO 
        FROM VENTAS V 
        JOIN CLIENTES C ON V.COD_CLIENT = C.COD_CLIENT 
        ORDER BY V.ID_VENTA DESC`;
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/venta/:id', async (req, res) => {
    try {
        const v = await db.query(
            "SELECT V.*, C.* FROM VENTAS V JOIN CLIENTES C ON V.COD_CLIENT = C.COD_CLIENT WHERE V.ID_VENTA = $1",
            [req.params.id]
        );
        const d = await db.query(
            "SELECT D.*, P.NOMBRE FROM DETALLE_VENTAS D JOIN PRODUCTOS P ON D.CODIGO = P.CODIGO WHERE D.ID_VENTA = $1",
            [req.params.id]
        );
        res.json({ venta: v.rows[0], detalles: d.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log("🚀 Servidor NEGRI TECHMX en http://localhost:3000"));
