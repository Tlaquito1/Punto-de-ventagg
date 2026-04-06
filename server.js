const mysql = require('mysql2');

// Configuración para XAMPP / WampServer (Local)
const db = mysql.createConnection({
    host: 'brogxb0kkak6vedqd3wx-mysql.services.clever-cloud.com',
    user: 'ucgtkn8difo5dn8k',
    password: '', // Por defecto en XAMPP es vacío
    database: 'PuntoVentaBD', // Asegúrate de que este nombre coincida con tu DB en PHPMyAdmin
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error("❌ Error al conectar localmente:", err.message);
        console.log("Asegúrate de que XAMPP (MySQL) esté encendido.");
    } else {
        console.log("✅ Conexión exitosa a la base de datos local: PuntoVentaBD");
    }
});

module.exports = db;