// plugins/spotify.js  (CommonJS)
// Busca y descarga canciones de Spotify.
//   .spotify <nombre>   -> busca y descarga el primer resultado
//   .spotifys <nombre>  -> sólo lista resultados
const { spotifySearch, spotifyDownload } = require('../lib/downloader.js');

module.exports = {
    command: ['spotify', 'spotifys', 'spt', 'spoti'],
    category: 'musica',
    execute: async (m, { conn, from, args, command, usedPrefix }) => {
        const query = (args || []).join(' ').trim();
        if (!query) {
            return conn.sendMessage(from, {
                text: `🎵 *¿Qué tema de Spotify buscas, querido?*\n*Ejemplo:* ${usedPrefix}spotify Bad Bunny Tití me preguntó`
            }, { quoted: m });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        try {
            const results = await spotifySearch(query, 5);
            if (command === 'spotifys') {
                let txt = `🎵 *Resultados en Spotify para: "${query}"*\n\n`;
                results.forEach((r, i) => {
                    txt += `${i + 1}. *${r.title || r.name}*\n   👤 ${r.artist || r.artista || '?'}\n   🔗 ${r.url || r.link || ''}\n`;
                });
                txt += `\n_Descarga con:_ ${usedPrefix}spotify <título>`;
                return conn.sendMessage(from, { text: txt }, { quoted: m });
            }

            const first = results[0];
            const url = first.url || first.link;
            if (!url) throw new Error('No se obtuvo enlace de Spotify.');

            await conn.sendMessage(from, { text: `📥 Descargando: *${first.title || first.name}*...` }, { quoted: m });
            const dl = await spotifyDownload(url);

            await conn.sendMessage(from, {
                audio: { url: dl.url },
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: { externalAdReply: { title: dl.title || first.title, body: dl.artist || 'Alastor Radio', sourceUrl: url } }
            }, { quoted: m });

            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        } catch (error) {
            console.error('[spotify] error:', error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await conn.sendMessage(from, { text: `⚠️ *ERROR:* ${error.message || 'No se pudo descargar de Spotify.'}` }, { quoted: m });
        }
    }
};
