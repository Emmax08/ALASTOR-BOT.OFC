// plugins/owner-setbotname.js  (CommonJS)
// Cambia el nombre de presentación del bot (sólo rowner).
module.exports = {
    command: ['setbotname', 'setnamebot', 'cambiarnombrebot', 'nombrebot'],
    category: 'owner',
    rowner: true,
    execute: async (m, { conn, from, text, usedPrefix }) => {
        if (!text) {
            return conn.sendMessage(from, { text: `🎙️ *Uso:* ${usedPrefix}setbotname <nuevo nombre del bot>` }, { quoted: m });
        }
        try {
            await conn.updateProfileName(text.slice(0, 25));
            global.botname = text.slice(0, 25);
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            await conn.sendMessage(from, { text: `🎙️ *Nuevo nombre del bot:* ${global.botname}` }, { quoted: m });
        } catch (error) {
            console.error('[setbotname] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude cambiar el nombre del bot.' }, { quoted: m });
        }
    }
};
