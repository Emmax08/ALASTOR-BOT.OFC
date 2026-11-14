// plugins/promote.js  (CommonJS)
// Dar admin a un miembro (admin + bot admin + grupo).
module.exports = {
    command: ['promote', 'daradmin', 'haceradmin'],
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, who, botNumber }) => {
        if (!who) {
            return conn.sendMessage(from, {
                text: '📻 *REPORTE DE LA RADIO*\n\nNo detecto a ningún pecador. Responde a su mensaje, etiquétalo o escribe su número para darle poder.'
            }, { quoted: m });
        }
        let user = String(who).replace(/:[0-9]+/, '');
        if (!user.includes('@')) user += '@s.whatsapp.net';

        if (user === botNumber) {
            return conn.sendMessage(from, { text: '⚡ Ya soy administrador del estudio, querido.' }, { quoted: m });
        }

        try {
            await conn.sendMessage(from, { react: { text: '👑', key: m.key } });
            await conn.groupParticipantsUpdate(from, [user], 'promote');
            await conn.sendMessage(from, {
                text: `👑 *NUEVO MANDO EN LA RADIO*\n\n@${user.split('@')[0]} ahora tiene privilegios de administrador.`,
                mentions: [user]
            }, { quoted: m });
        } catch (error) {
            console.error('[promote] error:', error);
            await conn.sendMessage(from, {
                text: '⚠️ *INTERFERENCIA:* No pude ascender a este usuario. Revisa si ya es admin o mis permisos.'
            }, { quoted: m });
        }
    }
};
