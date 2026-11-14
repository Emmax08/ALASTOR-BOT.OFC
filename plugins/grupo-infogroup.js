// plugins/grupo-infogroup.js  (CommonJS)
// Muestra la información completa del grupo.
module.exports = {
    command: ['infogroup', 'infogrupo', 'infogc', 'grupoinfo'],
    category: 'grupo',
    group: true,
    execute: async (m, { conn, from, groupMetadata, participants }) => {
        try {
            const g = groupMetadata || await conn.groupMetadata(from).catch(() => ({}));
            if (!g || !g.id) return conn.sendMessage(from, { text: '⚠️ No pude obtener la información del grupo.' }, { quoted: m });

            const admins = (g.participants || participants || []).filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const txt =
                `📻 *INFORMACIÓN DEL GRUPO*\n\n` +
                `🆔 *ID:* ${g.id}\n` +
                `📛 *Nombre:* ${g.subject || '—'}\n` +
                `📝 *Descripción:* ${(g.desc || 'Sin descripción').slice(0, 300)}\n` +
                `👥 *Miembros:* ${(g.participants || participants || []).length}\n` +
                `👑 *Admins:* ${admins.length}\n` +
                `🕒 *Creado:* ${g.creation ? new Date(g.creation * 1000).toLocaleString('es-DO') : '—'}\n` +
                `👤 *Creador:* ${g.owner ? '@' + String(g.owner).split('@')[0] : '—'}`;
            await conn.sendMessage(from, { text: txt, mentions: g.owner ? [g.owner] : [] }, { quoted: m });
        } catch (error) {
            console.error('[infogroup] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude obtener la información del grupo.' }, { quoted: m });
        }
    }
};
