// plugins/descarga-tiktok.js  (CommonJS)
// Descarga videos de TikTok (video + info).
const { tiktok } = require('../lib/downloader.js');

module.exports = {
    command: ['tiktok', 'tt', 'ttdl', 'tiktokdl'],
    execute: async (m, { conn, from, args, usedPrefix, command }) => {
        const url = (args || [])[0];
        if (!url || !/^https?:\/\//i.test(url)) {
            return conn.sendMessage(from, {
                text: `🎙️ *¡SEÑAL DE TIKTOK NO DETECTADA!*\n\nNecesito un enlace para sintonizar.\n*Ejemplo:* ${usedPrefix}${command} https://vm.tiktok.com/xxx`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '🎙️', key: m.key } });

        try {
            const d = await tiktok(url);

            const caption =
                `🎙️ *ALASTOR RADIO: TRANSMISIÓN TIKTOK*\n\n` +
                `✨ *Título:* ${d.title}\n` +
                `👤 *Autor:* ${d.author}\n\n` +
                `📊 *Estadísticas del Eter:*\n` +
                `> ❤️ *Likes:* ${d.likes}\n` +
                `> 👀 *Vistas:* ${d.plays}\n\n` +
                `_¡Nunca estás completamente vestido sin una sonrisa, querido!_`;

            await conn.sendMessage(from, {
                video: { url: d.video },
                caption: caption.trim(),
                mimetype: 'video/mp4'
            }, { quoted: m });

            // audio si la API lo trae
            if (d.audio) {
                await conn.sendMessage(from, {
                    audio: { url: d.audio },
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: m }).catch(() => {});
            }

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (e) {
            console.error('[tiktok] error:', e);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, {
                text: `⚠️ *LA SEÑAL HA FALLADO:* ${e.message || 'Error al procesar el video.'}`
            }, { quoted: m });
        }
    }
};
