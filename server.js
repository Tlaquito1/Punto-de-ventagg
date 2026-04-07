const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'brogxb0kkak6vedqd3wx-mysql.services.clever-cloud.com', // Cambia si usas localhost
    user: 'ucgtkn8difo5dn8k',
    password: 'M1OPrcPFa8a0eENu10Bz',
    database: 'brogxb0kkak6vedqd3wx', // Nombre de la DB asignada
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.error("❌ Error conectando a MySQL:", err.message);
    } else {
        console.log("✅ Conectado a la base de datos MySQL");
    }
});

module.exports = db;
