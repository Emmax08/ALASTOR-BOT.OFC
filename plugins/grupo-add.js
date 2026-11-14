// plugins/grupo-add.js  (CommonJS)
// Añade un participante al grupo (admin + bot admin + grupo).
module.exports = {
    command: ['add', 'agregar', 'invitar'],
    category: 'grupo',
    group: true,
    admin: true,
    botAdmin: true,
    execute: async (m, { conn, from, who, text }) => {
        let user = who || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!user) {
            return conn.sendMessage(from, { text: '⚠️ Menciona a alguien o escribe su número para añadirlo.\n*Ejemplo:* .add 18255699594' }, { quoted: m });
        }
        user = String(user).replace(/:[0-9]+/, '');
        if (!user.includes('@')) user += '@s.whatsapp.net';

        try {
            const res = await conn.groupParticipantsUpdate(from, [user], 'add');
            const status = (res && res[0] && res[0].status) || 'unknown';
            const msg = {
                '200': `✅ @${user.split('@')[0]} añadido al grupo.`,
                '408': `⏳ @${user.split('@')[0]} salió recientemente. No puede volver aún.`,
                '409': `✅ @${user.split('@')[0]} ya es miembro.`,
                '500': `🚫 @${user.split('@')[0]} tiene el privacidad de grupos bloqueada.`,
                'unknown': `⚠️ No pude añadir a @${user.split('@')[0]}.`
            }[status];
            await conn.sendMessage(from, { text: msg, mentions: [user] }, { quoted: m });
        } catch (error) {
            console.error('[add] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude añadir al usuario.' }, { quoted: m });
        }
    }
};
