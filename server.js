const { Pool } = require('pg');

// Configuración para Supabase (PostgreSQL)
const db = new Pool({
    connectionString: 'postgresql://postgres:[YOUR-PASSWORD]@db.groizonuuihvnmsxttjk.supabase.co:5432/postgres',
    ssl: {
        rejectUnauthorized: false // Requerido para conexiones seguras en la nube
    }
});

db.connect((err) => {
    if (err) {
        console.error("❌ Error al conectar a Supabase:", err.message);
    } else {
        console.log("✅ Conexión exitosa a PostgreSQL (Supabase)");
    }
});

module.exports = db;
