// plugins/owner-mode.js  (CommonJS)
// Modo público / privado (self). En self, sólo el dueño puede usar el bot (sólo rowner).
module.exports = {
    command: ['mode', 'self', 'public', 'privado', 'publico'],
    category: 'owner',
    rowner: true,
    execute: async (m, { conn, from, command }) => {
        if (command === 'self' || command === 'privado') global.selfMode = true;
        else if (command === 'public' || command === 'publico') global.selfMode = false;
        else global.selfMode = !global.selfMode; // toggle con .mode

        await conn.sendMessage(from, {
            text: `⚙️ *MODO:* ${global.selfMode ? 'PRIVADO (self) 🔒 — sólo el dueño usa el bot' : 'PÚBLICO 🌍 — todos pueden usar el bot'}`
        }, { quoted: m });
    }
};
