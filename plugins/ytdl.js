// plugins/ytdl.js  (CommonJS)
// Descarga audio o video de YouTube desde un ENLACE directo.
//   .yta <url>   -> audio mp3
//   .ytv <url>   -> video mp4
const { ytDownload } = require('../lib/downloader.js');

module.exports = {
    command: ['yta', 'ytmp3', 'ytaudio', 'ytv', 'ytmp4', 'ytvideo2', 'ytvid'],
    category: 'musica',
    execute: async (m, { conn, from, args, command, usedPrefix }) => {
        const url = (args || [])[0];
        const isVideo = ['ytv', 'ytmp4', 'ytvideo2', 'ytvid'].includes(command);

        if (!url || !/^https?:\/\//i.test(url) || !/youtu\.?be/i.test(url)) {
            return conn.sendMessage(from, {
                text: `🎙️ *Necesito un enlace de YouTube válido.*\n*Ejemplo:* ${usedPrefix}${command} https://youtu.be/xxxxx`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            const type = isVideo ? 'video' : 'audio';
            const result = await ytDownload(url, type);
            const title = result.title || 'YouTube';

            if (isVideo) {
                await conn.sendMessage(from, {
                    video: { url: result.download },
                    mimetype: 'video/mp4',
                    caption: `🎬 *${title}*`
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, {
                    audio: { url: result.download },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    contextInfo: { externalAdReply: { title, body: 'Alastor Radio', sourceUrl: url } }
                }, { quoted: m });
            }

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[ytdl] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message || 'No se pudo descargar.'}` }, { quoted: m });
        }
    }
};
