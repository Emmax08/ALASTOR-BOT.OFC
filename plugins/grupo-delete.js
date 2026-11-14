// plugins/grupo-delete.js  (CommonJS)
// Elimina un mensaje (responde al mensaje a borrar).
module.exports = {
    command: ['delete', 'del', 'eliminar', 'borrar'],
    category: 'grupo',
    execute: async (m, { conn, from, quoted, isGroup, isAdmin, isOwner, isBotAdmin, botNumber }) => {
        if (!quoted) {
            return conn.sendMessage(from, { text: '⚠️ Responde al mensaje que quieres eliminar.' }, { quoted: m });
        }
        // En grupo, el borrado de mensajes ajenos requiere admin
        if (isGroup && !isAdmin && !isOwner) {
            return conn.sendMessage(from, { text: '👑 Sólo los administradores pueden borrar mensajes ajenos.' }, { quoted: m });
        }
        try {
            const key = quoted.key || (quoted.vM && quoted.vM.key) || quoted.fakeObj?.key;
            if (!key) return conn.sendMessage(from, { text: '⚠️ No pude identificar el mensaje.' }, { quoted: m });
            await conn.sendMessage(from, { delete: key });
        } catch (error) {
            console.error('[delete] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude eliminar el mensaje.' }, { quoted: m });
        }
    }
};
