// plugins/grupo-setdesc.js  (CommonJS)
// Cambia la descripción del grupo.
module.exports = {
    command: ['setdesc', 'setdescription', 'nuevadesc', 'descgc'],
    category: 'grupo',
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, text, usedPrefix }) => {
        if (!text) {
            return conn.sendMessage(from, { text: `📝 *Uso:* ${usedPrefix}setdesc <nueva descripción>` }, { quoted: m });
        }
        try {
            await conn.groupUpdateDescription(from, text);
            await conn.sendMessage(from, { react: { text: '📝', key: m.key } });
            await conn.sendMessage(from, { text: '📝 *Descripción actualizada.*' }, { quoted: m });
        } catch (error) {
            console.error('[setdesc] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude cambiar la descripción. ¿Soy administrador?' }, { quoted: m });
        }
    }
};
