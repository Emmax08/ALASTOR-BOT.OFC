// plugins/reg.js  (CommonJS)
// Registro de usuarios en el Hotel (Alastor). Usa global.db.
const { loadDatabase } = require('../lib/database.js');

module.exports = {
    command: ['reg', 'registrar', 'contrato', 'unreg'],
    execute: async (m, { conn, from, args, command, sender, senderNum }) => {
        if (!global.db || !global.db.data) loadDatabase();
        const users = global.db.data.users;

        // --- UNREG: borrar registro ---
        if (command === 'unreg') {
            if (!users[senderNum] || !users[senderNum].registrado) {
                return conn.sendMessage(from, { text: "⚠️ No tienes ningún contrato firmado con el Hotel." }, { quoted: m });
            }
            delete users[senderNum];
            global.db.write();
            return conn.sendMessage(from, { text: "🎭 Tu contrato con el Hotel ha sido anulado. Tu alma vuelve a ser tuya... por ahora." }, { quoted: m });
        }

        // --- REG ---
        if (users[senderNum] && users[senderNum].registrado) {
            return conn.sendMessage(from, { text: "⚠️ ¡Ya has firmado tu contrato con el Hotel, pecador!" }, { quoted: m });
        }
        if (args.length < 2) {
            return conn.sendMessage(from, {
                text: "⚠️ Uso: .reg [nombre] [edad]\n\n*Ejemplo:* .reg Alastor 100"
            }, { quoted: m });
        }

        const nombre = args[0];
        const edad = parseInt(args[1]);
        if (isNaN(edad) || edad <= 0) {
            return conn.sendMessage(from, { text: "⚠️ La edad debe ser un número válido." }, { quoted: m });
        }

        users[senderNum] = {
            nombre,
            edad,
            registrado: true,
            exp: 0,
            nivel: 0,
            limit: 25,
            premium: false,
            banned: false,
            registradoEn: Date.now(),
            recursos: { monedas: 100, gemas: 10, almas: 1, contratos: 0 },
            inventario: { waifus: [], pokemons: [], objetos: ['Radio Antigua'] },
            meta: { packname: 'Alastor Radio', author: 'Alastor' }
        };
        global.db.write();

        await conn.sendMessage(from, { react: { text: '🎭', key: m.key } });
        await conn.sendMessage(from, {
            text: `🎭 *¡Bienvenido al Hotel Alastor!* 🎭\n\nTu contrato ha sido sellado, *${nombre}*.\n\nTu alma ahora es parte de nuestra colección. Disfruta tus recursos iniciales:\n💰 Monedas: 100\n💎 Gemas: 10\n💀 Almas: 1\n📜 Contratos: 0\n\nYa puedes usar todos los comandos del bot. ¡Que comience el espectáculo!`
        }, { quoted: m });
    }
};
