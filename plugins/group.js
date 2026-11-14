// plugins/group.js  (CommonJS)
// Abrir / cerrar el grupo (sólo grupos, admin y bot admin).
module.exports = {
    command: ['open', 'abrir', 'close', 'cerrar'],
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, command }) => {
        try {
            if (command === 'open' || command === 'abrir') {
                await conn.groupSettingUpdate(from, 'not_announcement');
                await conn.sendMessage(from, { react: { text: '🔓', key: m.key } });
                return conn.sendMessage(from, {
                    text: '📻 *RADIO ALASTOR: CANAL ABIERTO*\n\nEl micrófono está encendido para todos. ¡Que empiece la charla!'
                }, { quoted: m });
            }
            if (command === 'close' || command === 'cerrar') {
                await conn.groupSettingUpdate(from, 'announcement');
                await conn.sendMessage(from, { react: { text: '🔒', key: m.key } });
                return conn.sendMessage(from, {
                    text: '📻 *RADIO ALASTOR: CANAL CERRADO*\n\nSilencio en el estudio. Sólo los administradores tienen la palabra.'
                }, { quoted: m });
            }
        } catch (error) {
            console.error('[group] error:', error);
            return conn.sendMessage(from, {
                text: '⚠️ *INTERFERENCIA:* No tengo el poder suficiente. Asegúrate de que soy administrador.'
            }, { quoted: m });
        }
    }
};
