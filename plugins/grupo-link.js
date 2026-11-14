// plugins/grupo-link.js  (CommonJS)
// Obtiene o revoca el enlace de invitación del grupo.
module.exports = {
    command: ['link', 'linkgroup', 'linkgc', 'revokelink', 'resetlink', 'revocar'],
    category: 'grupo',
    group: true,
    botAdmin: true,
    execute: async (m, { conn, from, command, usedPrefix, isAdmin, isOwner }) => {
        try {
            if (command === 'revokelink' || command === 'resetlink' || command === 'revocar') {
                if (!isAdmin && !isOwner) {
                    return conn.sendMessage(from, { text: '👑 Sólo los administradores pueden revocar el enlace.' }, { quoted: m });
                }
                await conn.groupRevokeInvite(from);
                return conn.sendMessage(from, { text: '🔗 *Enlace revocado.* Se generó uno nuevo. Pídelo con .link' }, { quoted: m });
            }
            const code = await conn.groupInviteCode(from);
            await conn.sendMessage(from, {
                text: `🔗 *ENLACE DEL GRUPO*\n\nhttps://chat.whatsapp.com/${code}\n\n_Comparte con cuidado, querido._`
            }, { quoted: m });
        } catch (error) {
            console.error('[grupo-link] error:', error);
            await conn.sendMessage(from, { text: '⚠️ No pude obtener/revocar el enlace. ¿Soy administrador?' }, { quoted: m });
        }
    }
};
