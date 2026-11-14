// plugins/owner-toggle.js  (CommonJS)
// Activa/desactiva funciones globales del bot (sólo rowner).
//   .autoread   -> lectura automática on/off
//   .autoadmin  -> auto-admin al dueño al entrar a un grupo on/off
//   .restrict   -> restricciones on/off
module.exports = {
    command: ['autoread', 'autoadmin', 'restrict', 'restriccion'],
    category: 'owner',
    rowner: true,
    execute: async (m, { conn, from, command }) => {
        let key, label;
        if (command === 'autoread') { key = 'autoread'; label = 'Lectura automática'; }
        else if (command === 'autoadmin') { key = 'autoadminToggle'; label = 'Auto-admin (dueño en grupos)'; }
        else { key = 'restrict'; label = 'Restricciones'; }

        global[key] = !global[key];
        await conn.sendMessage(from, {
            text: `⚙️ *${label}:* ${global[key] ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}`
        }, { quoted: m });
    }
};
