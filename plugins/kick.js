// plugins/kick.js  (CommonJS)
// Expulsar a un miembro del grupo (admin + bot admin + grupo).
module.exports = {
    command: ['kick', 'echar', 'hechar', 'sacar', 'expulsar'],
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, who, senderNum, botNumber }) => {
        let user = who;
        if (!user) {
            return conn.sendMessage(from, {
                text: '📻 *REPORTE DE LA RADIO*\n\nNo detecto a ningún pecador. Responde a su mensaje, etiquétalo o escribe su número para expulsarlo.'
            }, { quoted: m });
        }
        // limpiar el JID
        user = String(user).replace(/:[0-9]+/, '');
        if (!user.includes('@')) user += '@s.whatsapp.net';

        if (user === botNumber) {
            return conn.sendMessage(from, { text: '🦌 No puedo expulsarme a mí mismo, querido.' }, { quoted: m });
        }
        if (user === senderNum + '@s.whatsapp.net') {
            return conn.sendMessage(from, { text: '🦌 ¿Expulsarte a ti mismo? Qué idea tan entretenida... pero no.' }, { quoted: m });
        }

        try {
            await conn.sendMessage(from, { react: { text: '👢', key: m.key } });
            await conn.groupParticipantsUpdate(from, [user], 'remove');
            await conn.sendMessage(from, {
                text: `👢 *Expulsado del estudio*\n\n@${user.split('@')[0]} ha sido retirado de la transmisión.`,
                mentions: [user]
            }, { quoted: m });
        } catch (error) {
            console.error('[kick] error:', error);
            await conn.sendMessage(from, {
                text: '⚠️ *INTERFERENCIA:* No pude expulsar a este usuario. Revisa mis permisos.'
            }, { quoted: m });
        }
    }
};
