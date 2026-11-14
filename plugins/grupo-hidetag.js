// plugins/grupo-hidetag.js  (CommonJS)
// Menciona a todos los miembros de forma oculta (la mención no se ve en el mensaje).
module.exports = {
    command: ['hidetag', 'h', 'oculto', 'ht'],
    category: 'grupo',
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, text, participants }) => {
        try {
            const ps = (participants || []).map(p => p.id).filter(Boolean);
            if (!ps.length) return conn.sendMessage(from, { text: '⚠️ No hay miembros.' }, { quoted: m });
            const msg = text || '🎙️ ¡Atención a todos los pecadores!';
            await conn.sendMessage(from, { text: msg, mentions: ps }, { quoted: m });
        } catch (error) {
            console.error('[hidetag] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude hacer el hidetag.' }, { quoted: m });
        }
    }
};
