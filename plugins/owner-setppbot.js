// plugins/owner-setppbot.js  (CommonJS)
// Cambia la foto de perfil del bot (sólo rowner). Responde a una imagen.
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    command: ['setppbot', 'setpicbot', 'fotobot', 'setpp'],
    category: 'owner',
    rowner: true,
    execute: async (m, { conn, from, quoted, botNumber }) => {
        const q = quoted ? quoted : m;
        const qmsg = q.message || {};
        const img = qmsg.imageMessage || (qmsg.extendedTextMessage && qmsg.extendedTextMessage.contextInfo && qmsg.extendedTextMessage.contextInfo.quotedMessage && qmsg.extendedTextMessage.contextInfo.quotedMessage.imageMessage);
        if (!img) {
            return conn.sendMessage(from, { text: '🖼️ *Responde a una imagen* para ponerla como foto del bot.' }, { quoted: m });
        }
        try {
            const stream = await downloadContentFromMessage(img, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            const target = conn.user.jid || botNumber;
            await conn.updateProfilePicture(target, buffer);
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            await conn.sendMessage(from, { text: '🖼️ *Foto del bot actualizada.*' }, { quoted: m });
        } catch (error) {
            console.error('[setppbot] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude cambiar la foto del bot.' }, { quoted: m });
        }
    }
};
