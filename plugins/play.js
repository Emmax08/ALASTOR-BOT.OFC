// plugins/play.js  (CommonJS)
// Busca en YouTube y envía audio (play) o video (video/ytvideo).
// Usa yt-search (local, sin API key) + ogmp3 (lib/youtobedl.js) para descargar.
const { ytSearch, ytDownload } = require('../lib/downloader.js');

module.exports = {
    command: ['play', 'ytplay', 'video', 'ytvideo'],
    execute: async (m, { conn, from, args, command }) => {
        const query = (args || []).join(' ').trim();
        const isVideo = ['video', 'ytvideo'].includes(command);

        if (!query) {
            return conn.sendMessage(from, {
                text: `🎙️ *¿Qué canción buscas, querido?*\n\n*Ejemplo:* .play ${isVideo ? 'Alastor theme' : 'despacito'}`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            // 1) buscar
            const results = await ytSearch(query, 1);
            const video = results[0];
            const title = video.title;
            const url = video.url;
            const duration = video.timestamp || video.duration?.seconds + 's' || '?';
            const author = video.author && video.author.name ? video.author.name : 'Desconocido';

            await conn.sendMessage(from, {
                text: `📻 *ENCONTRADO EN EL ETER*\n\n🎬 *Título:* ${title}\n👤 *Autor:* ${author}\n⏱️ *Duración:* ${duration}\n🔗 ${url}\n\n⌛ Descargando...`
            }, { quoted: m });

            // 2) descargar
            const type = isVideo ? 'video' : 'audio';
            const result = await ytDownload(url, type);
            const mediaUrl = result.download;

            if (isVideo) {
                await conn.sendMessage(from, {
                    video: { url: mediaUrl },
                    mimetype: 'video/mp4',
                    caption: `🎬 *${title}*`
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, {
                    audio: { url: mediaUrl },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    contextInfo: { externalAdReply: { title, body: 'Alastor Radio', sourceUrl: url } }
                }, { quoted: m });
            }

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[play] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, {
                text: `⚠️ *LA SEÑAL HA FALLADO:* ${error.message || 'No se pudo descargar.'}\n\nIntenta con un enlace directo: .yta <url> o .ytv <url>`
            }, { quoted: m });
        }
    }
};
