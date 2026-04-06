const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'brogxb0kkak6vedqd3wx-mysql.services.clever-cloud.com',
    user: 'ucgtkn8difo5dn8k',
    password: 'M1OPrcPFa8a0eENu10Bz',
    database: 'brogxb0kkak6vedqd3wx', // <-- ESTE NOMBRE ES VITAL
    port: 3306
});

db.connect(err => {
    if (err) console.error("Error:", err.message);
    else console.log("✅ Conexión lista");
});

module.exports = db;
