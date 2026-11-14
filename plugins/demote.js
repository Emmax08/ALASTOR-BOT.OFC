// plugins/demote.js  (CommonJS)
// Quitar admin a un miembro (admin + bot admin + grupo).
module.exports = {
    command: ['demote', 'quitaradmin', 'degradar'],
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, who, participants, botNumber }) => {
        if (!who) {
            return conn.sendMessage(from, {
                text: '⚠️ Responde al mensaje de un admin, etiquétalo con @ o escribe su número.'
            }, { quoted: m });
        }
        let user = String(who).replace(/:[0-9]+/, '');
        if (!user.includes('@')) user += '@s.whatsapp.net';

        if (user === botNumber) {
            return conn.sendMessage(from, { text: '😎 Interesante intento, pero no puedo quitarme el admin a mí mismo.' }, { quoted: m });
        }

        // verificar que el objetivo sea admin
        const target = participants.find(p => (p.id || '').replace(/:[0-9]+/, '') === user || p.id === user);
        if (!target || !(target.admin === 'admin' || target.admin === 'superadmin')) {
            return conn.sendMessage(from, { text: '💡 Ese usuario ya es un miembro normal, no es administrador.' }, { quoted: m });
        }
        if (target.admin === 'superadmin') {
            return conn.sendMessage(from, { text: '👑 Ese usuario es el creador del grupo. ¡Ni yo puedo contra eso!' }, { quoted: m });
        }

        try {
            await conn.sendMessage(from, { react: { text: '📉', key: m.key } });
            await conn.groupParticipantsUpdate(from, [user], 'demote');
            await conn.sendMessage(from, {
                text: `📉 *Rango Removido*\n\n@${user.split('@')[0]} ha regresado al nivel de espectador.`,
                mentions: [user]
            }, { quoted: m });
        } catch (error) {
            console.error('[demote] error:', error);
            await conn.sendMessage(from, { text: '❌ Hubo un error al degradar al usuario.' }, { quoted: m });
        }
    }
};
