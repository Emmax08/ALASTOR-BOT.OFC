// plugins/grupo-setppgc.js  (CommonJS)
// Cambia la foto de perfil del grupo (responde a una imagen).
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['setppgc', 'setppgroup', 'fotogrupo', 'setpicgc'],
    category: 'grupo',
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, quoted }) => {
        const q = quoted ? quoted : m;
        const qmsg = q.message || {};
        const img = qmsg.imageMessage || (qmsg.extendedTextMessage && qmsg.extendedTextMessage.contextInfo && qmsg.extendedTextMessage.contextInfo.quotedMessage && qmsg.extendedTextMessage.contextInfo.quotedMessage.imageMessage);
        if (!img) {
            return conn.sendMessage(from, { text: '🖼️ *Responde a una imagen* para ponerla como foto del grupo.' }, { quoted: m });
        }
        try {
            const stream = await downloadContentFromMessage(img, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await conn.updateProfilePicture(from, buffer);
            await conn.sendMessage(from, { react: { text: '🖼️', key: m.key } });
            await conn.sendMessage(from, { text: '🖼️ *Foto del grupo actualizada.*' }, { quoted: m });
        } catch (error) {
            console.error('[setppgc] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude cambiar la foto. ¿Soy administrador?' }, { quoted: m });
        }
    }
};
