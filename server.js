const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'brogxb0kkak6vedqd3wx-mysql.services.clever-cloud.com',
    user: 'ucgtkn8difo5dn8k',
    password: 'M1OPrcPFa8a0eENu10Bz',
    database: 'brogxb0kkak6vedqd3wx',
    port: 3306,
    connectTimeout: 10000 // 10 segundos de espera
});

db.connect(err => {
    if (err) {
        console.error("❌ Error de conexión:", err.message);
    } else {
        console.log("✅ Conexión exitosa a Clever Cloud");
    }
});

module.exports = db;
