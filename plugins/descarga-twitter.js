// plugins/descarga-twitter.js  (CommonJS)
// Descarga videos/imágenes de Twitter / X.
const { twitter } = require('../lib/downloader.js');

module.exports = {
    command: ['tw', 'twitter', 'xdl', 'twdl', 'x'],
    category: 'descargas',
    execute: async (m, { conn, from, args, usedPrefix, command }) => {
        const url = (args || [])[0];
        if (!url || !/^https?:\/\//i.test(url) || !/twitter|x\.com|twttr/i.test(url)) {
            return conn.sendMessage(from, {
                text: `🐦 *Necesito un enlace de X (Twitter) válido.*\n*Ejemplo:* ${usedPrefix}${command} https://x.com/usuario/status/123`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        try {
            const d = await twitter(url);
            if (d.video) {
                await conn.sendMessage(from, {
                    video: { url: d.video },
                    mimetype: 'video/mp4',
                    caption: `🐦 *${d.title}*\n👤 ${d.author}\n\n_Alastor Radio_`
                }, { quoted: m });
            } else if (d.image) {
                await conn.sendMessage(from, { image: { url: d.image }, caption: `🐦 *${d.title}*` }, { quoted: m });
            } else {
                throw new Error('El post no contiene media descargable.');
            }
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[twitter] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message || 'No se pudo descargar.'}` }, { quoted: m });
        }
    }
};
