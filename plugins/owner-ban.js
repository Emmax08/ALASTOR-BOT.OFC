// plugins/owner-ban.js  (CommonJS)
// Banea/desbanea usuarios y chats (sólo rowner).
//   .ban @usuario        -> banea a un usuario (no puede usar el bot)
//   .unban @usuario      -> desbanea
//   .banchat             -> banea este chat
//   .unbanchat           -> desbanea este chat
const { loadDatabase } = require('../lib/database.js');

module.exports = {
    command: ['ban', 'unban', 'banchat', 'unbanchat', 'banuser'],
    category: 'owner',
    rowner: true,
    execute: async (m, { conn, from, command, who, text, senderNum }) => {
        if (!global.db || !global.db.data) loadDatabase();
        if (!global.db.data.banned) global.db.data.banned = { users: [], chats: [] };
        const banned = global.db.data.banned;

        if (command === 'banchat' || command === 'unbanchat') {
            if (banned.chats.includes(from)) {
                if (command === 'unbanchat') {
                    banned.chats = banned.chats.filter(c => c !== from);
                    global.db.write();
                    return conn.sendMessage(from, { text: '✅ *Chat desbaneado.* Vuelvo a funcionar aquí.' }, { quoted: m });
                }
                return conn.sendMessage(from, { text: '⚠️ Este chat ya está baneado.' }, { quoted: m });
            }
            if (command === 'banchat') {
                banned.chats.push(from);
                global.db.write();
                return conn.sendMessage(from, { text: '🚫 *Chat baneado.* Ya no responderé a comandos aquí (salvo el dueño).' }, { quoted: m });
            }
        }

        // ban / unban / banuser
        let target = who || (text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);
        if (!target) {
            return conn.sendMessage(from, { text: '⚠️ Menciona a alguien o escribe su número para banear/desbanear.' }, { quoted: m });
        }
        const num = String(target).split('@')[0];

        if (command === 'unban') {
            if (!banned.users.includes(num)) return conn.sendMessage(from, { text: '⚠️ Ese usuario no está baneado.' }, { quoted: m });
            banned.users = banned.users.filter(u => u !== num);
            global.db.write();
            return conn.sendMessage(from, { text: `✅ @${num} desbaneado.`, mentions: [target] }, { quoted: m });
        }

        // ban / banuser
        if (banned.users.includes(num)) return conn.sendMessage(from, { text: '⚠️ Ese usuario ya está baneado.' }, { quoted: m });
        banned.users.push(num);
        global.db.write();
        await conn.sendMessage(from, { text: `🚫 @${num} *baneado.* Ya no podrá usar el bot.`, mentions: [target] }, { quoted: m });
    }
};
