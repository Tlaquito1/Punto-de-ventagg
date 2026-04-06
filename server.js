const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'brogxb0kkak6vedqd3wx-mysql.services.clever-cloud.com',
    user: 'ucgtkn8difo5dn8k',
    password: 'M1OPrcPFa8a0eENu10Bz', // <--- Asegúrate que esté completa
    database: 'brogxb0kkak6vedqd3wx',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error("❌ Error de conexión:", err.message);
    } else {
        console.log("✅ Conectado a Clever Cloud desde Render");
    }
});

module.exports = db;
