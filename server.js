const mysql = require('mysql2');

const db = mysql.createConnection({
    // 1. Usa el host de Clever Cloud
    host: 'brogxb0kkak6vedqd3wx-mysql.services.clever-cloud.com',
    user: 'ucgtkn8difo5dn8k',
    // 2. AQUÍ DEBES PONER TU CONTRASEÑA (la que viste en el panel)
    password: 'M1OPrcPFa8a0eENu10Bz', 
    // 3. El nombre de la base de datos es el que te dio Clever Cloud, NO "PuntoVentaBD"
    database: 'brogxb0kkak6vedqd3wx', 
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error("❌ Error al conectar a la DB:", err.message);
    } else {
        console.log("✅ Conexión exitosa a Clever Cloud");
    }
});

module.exports = db;
