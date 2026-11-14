// plugins/sticker2.js  (CommonJS)
// Comando principal de stickers: imagen / video / gif / sticker → sticker con pack/author.
// Soporta: responder a media, enviar media con caption, custom pack|author por args.
//   .s                      (responde a una imagen/video/sticker)
//   .s Mi Pack | Alastor    (personaliza pack y autor)
//   .s2  o  .scro           (recorta en cuadrado 1:1, StickerTypes.CROP)
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const execFileAsync = promisify(execFile);
const TMP = () => global.tmpDir || os.tmpdir();

// Lee pack/author del usuario desde global.db (registrado) o usa los por defecto.
function getMeta(senderNum) {
    const def = { pack: 'Alastor Radio', author: 'Alastor' };
    try {
        const u = global.db && global.db.data && global.db.data.users && global.db.data.users[senderNum];
        if (u) {
            return {
                pack: (u.meta && (u.meta.packname || u.meta.text1)) || def.pack,
                author: (u.meta && (u.meta.author || u.meta.text2)) || def.author
            };
        }
    } catch (e) {}
    return def;
}

module.exports = {
    command: ['s', 'sticker', 'stiker', 'st', 's2', 'scro'],
    register: false, // cualquiera puede usar stickers
    execute: async (m, { conn, from, args, command, senderNum }) => {
        // Personalización por args: "Pack | Autor"
        let meta = getMeta(senderNum);
        const texto = (args || []).join(' ').trim();
        if (texto) {
            const parts = texto.split('|').map(s => s.trim());
            if (parts.length >= 2) { meta.pack = parts[0] || meta.pack; meta.author = parts[1] || meta.author; }
            else { meta.pack = parts[0] || meta.pack; }
        }

        const isCrop = ['s2', 'scro'].includes(command);
        const stickerType = isCrop ? StickerTypes.CROP : StickerTypes.FULL;

        const q = m.quoted ? m.quoted : m;
        const qmsg = q.message || {};
        const mediaMessage =
            qmsg.imageMessage || qmsg.videoMessage || qmsg.stickerMessage ||
            (qmsg.extendedTextMessage && qmsg.extendedTextMessage.contextInfo && qmsg.extendedTextMessage.contextInfo.quotedMessage &&
                (qmsg.extendedTextMessage.contextInfo.quotedMessage.imageMessage ||
                 qmsg.extendedTextMessage.contextInfo.quotedMessage.videoMessage ||
                 qmsg.extendedTextMessage.contextInfo.quotedMessage.stickerMessage));

        if (!mediaMessage) {
            return conn.sendMessage(from, {
                text: '⚠️ *Uso:* responde a una imagen, video o sticker, o envíalo con el comando.\n\n*Ejemplos:*\n• .s\n• .s Mi Pack | Autor\n• .s2 (recorta en cuadrado)'
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '🎙️', key: m.key } });

        try {
            let type = 'image';
            if (mediaMessage.videoMessage) type = 'video';
            else if (mediaMessage.stickerMessage) type = 'sticker';

            const stream = await downloadContentFromMessage(mediaMessage, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            let stickerBuffer;

            if (type === 'sticker') {
                // reempaquetar con nuevo pack/author
                stickerBuffer = await new Sticker(buffer, {
                    pack: meta.pack, author: meta.author,
                    type: stickerType, categories: ['🍂']
                }).toBuffer();
            } else if (type === 'video') {
                // convertir video/gif a webp 512x512 con ffmpeg
                const id = `stk_${Date.now()}`;
                const input = path.join(TMP(), `${id}.bin`);
                const output = path.join(TMP(), `${id}.webp`);
                fs.writeFileSync(input, buffer);
                await execFileAsync('ffmpeg', [
                    '-y', '-i', input,
                    '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0.0,fps=15',
                    '-c:v', 'libwebp', '-preset', 'default', '-an', '-f', 'webp', output
                ]);
                const webp = fs.readFileSync(output);
                stickerBuffer = await new Sticker(webp, {
                    pack: meta.pack, author: meta.author,
                    type: stickerType, categories: ['🍂']
                }).toBuffer();
                try { fs.unlinkSync(input); fs.unlinkSync(output); } catch (e) {}
            } else {
                stickerBuffer = await new Sticker(buffer, {
                    pack: meta.pack, author: meta.author,
                    type: stickerType, categories: ['🍂']
                }).toBuffer();
            }

            await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: m });
        } catch (error) {
            console.error('[sticker] error:', error);
            await conn.sendMessage(from, {
                text: `❌ ¡Ups! Algo salió mal creando el sticker: ${error.message || error}`
            }, { quoted: m });
        }
    }
};
