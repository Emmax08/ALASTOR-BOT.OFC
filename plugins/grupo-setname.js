// plugins/grupo-setname.js  (CommonJS)
// Cambia el nombre (asunto) del grupo.
module.exports = {
    command: ['setname', 'setsubject', 'nuevonombre', 'namegc'],
    category: 'grupo',
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, text, usedPrefix }) => {
        if (!text) {
            return conn.sendMessage(from, { text: `✏️ *Uso:* ${usedPrefix}setname <nuevo nombre del grupo>` }, { quoted: m });
        }
        try {
            await conn.groupUpdateSubject(from, text.slice(0, 100));
            await conn.sendMessage(from, { react: { text: '✏️', key: m.key } });
            await conn.sendMessage(from, { text: `✏️ *Nombre actualizado:*\n${text}` }, { quoted: m });
        } catch (error) {
            console.error('[setname] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude cambiar el nombre. ¿Soy administrador?' }, { quoted: m });
        }
    }
};
