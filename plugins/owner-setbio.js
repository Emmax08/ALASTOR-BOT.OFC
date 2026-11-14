// plugins/owner-setbio.js  (CommonJS)
// Cambia el estado/biografía (about) del bot (sólo rowner).
module.exports = {
    command: ['setbio', 'setstatus', 'estadobot', 'bio', 'about'],
    category: 'owner',
    rowner: true,
    execute: async (m, { conn, from, text, usedPrefix }) => {
        if (!text) {
            return conn.sendMessage(from, { text: `🪪 *Uso:* ${usedPrefix}setbio <nuevo estado del bot>` }, { quoted: m });
        }
        try {
            await conn.updateProfileStatus(text.slice(0, 139));
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            await conn.sendMessage(from, { text: `🪪 *Estado del bot actualizado:*\n${text.slice(0, 139)}` }, { quoted: m });
        } catch (error) {
            console.error('[setbio] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude cambiar el estado del bot.' }, { quoted: m });
        }
    }
};
