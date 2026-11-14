// src/handler.js  (CommonJS)
// Núcleo del bot: serializa mensajes, hace cumplir las restricciones de cada plugin
// (rowner / owner / admin / botAdmin / group / private / unreg / restrict / premium / mods)
// y entrega a los plugins un contexto rico (sender, isOwner, isROwner, isAdmin, who, ...).
const { smsg, serialize, protoType } = require('../lib/simple.js');
const { format } = require('util');
const { watchFile, unwatchFile, appendFileSync } = require('fs');
const path = require('path');
const chalk = require('chalk');
const { loadDatabase, isRegistered } = require('../lib/database.js');
const failureHandler = require('../lib/respuesta.js');

const { proto } = require('@whiskeysockets/baileys');
const isNumber = x => typeof x === 'number' && !isNaN(x);
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this);
    resolve();
}, ms));

// --- Inicialización única: prototype extensions + db ---
// serialize() define los getters de m.chat, m.sender, m.reply, m.react, m.quoted, etc.
// Sin esta llamada, NINGÚN plugin podría usar m.reply o m.chat (bug original).
try { serialize(); } catch (e) { console.error('[handler] serialize() falló:', e); }
try { protoType(); } catch (e) { console.error('[handler] protoType() falló:', e); }

// global.loadDatabase: lo usan los plugins y el propio handler
global.loadDatabase = function loadDb() {
    try {
        loadDatabase();
        return Promise.resolve(global.db);
    } catch (e) {
        console.error('[handler] loadDatabase error:', e);
        return Promise.reject(e);
    }
};

// Carga la DB al arranque del handler
try { loadDatabase(); } catch (e) { console.error('[handler] init db:', e); }

// dfail: dispara el mensaje de error de permiso centralizado (lib/respuesta.js)
global.dfail = (type, m, conn) => {
    try {
        failureHandler(type, conn || (m && m.conn), m, global.comando);
    } catch (e) {
        console.error('[handler] dfail error:', e);
    }
};

function dbg(...args) {
    try {
        const line = `[${new Date().toISOString()}] ` + args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') + '\n';
        appendFileSync('./debug.log', line);
    } catch (e) {}
}

// Normaliza un JID: acepta número suelto o JID completo
function normalizeJid(input) {
    if (!input || typeof input !== 'string') return null;
    let s = input.trim();
    if (s.includes('@')) return s.replace(/:[0-9]+/, '');
    const num = s.replace(/[^0-9]/g, '');
    if (!num) return null;
    return num + '@s.whatsapp.net';
}

// Obtiene (con caché por mensaje) los datos de admin del grupo
async function getGroupAdminData(conn, m, from) {
    if (m.__adminData) return m.__adminData;
    let groupMetadata = null, participants = [], isAdmin = false, isBotAdmin = false;
    try {
        groupMetadata = await conn.groupMetadata(from);
        participants = (groupMetadata && groupMetadata.participants) || [];
        const botNumber = (conn.user && conn.user.id ? conn.user.id.split(':')[0] : '') + '@s.whatsapp.net';
        const sender = m.sender;
        for (const p of participants) {
            const pid = (p.id || '').replace(/:[0-9]+/, '');
            const senderJid = sender.split('@')[0] + '@s.whatsapp.net';
            if (pid === senderJid || p.id === sender) {
                if (p.admin === 'admin' || p.admin === 'superadmin') isAdmin = true;
            }
            if (pid === botNumber || p.id === botNumber) {
                if (p.admin === 'admin' || p.admin === 'superadmin') isBotAdmin = true;
            }
        }
    } catch (e) {
        dbg('groupMetadata error:', e && e.message ? e.message : e);
    }
    m.__adminData = { groupMetadata, participants, isAdmin, isBotAdmin };
    return m.__adminData;
}

async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || [];
    this.uptime = this.uptime || Date.now();

    if (!chatUpdate) return;
    if (typeof this.pushMessage === 'function') this.pushMessage(chatUpdate.messages).catch(console.error);
    if (!chatUpdate.messages) return;

    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;

    if (!global.db || !global.db.data) {
        try { loadDatabase(); } catch (e) { console.error('[handler] db load:', e); }
    }

    try {
        m = smsg(this, m) || m;
        if (!m) return;

        const conn = this;
        const from = m.chat || m.key.remoteJid;
        const isGroup = !!(from && from.endsWith('@g.us'));
        const sender = isGroup ? (m.key.participant || m.sender || from) : (m.sender || from);
        const senderNum = sender ? sender.split('@')[0] : '';
        const botNumber = ((conn.user && conn.user.id ? conn.user.id.split(':')[0] : '')) + '@s.whatsapp.net';
        const pushName = m.pushName || 'Alma en pena';

        // --- Identidad / permisos del emisor ---
        const isROwner = global.rowner.includes(senderNum);
        const isOwner = isROwner || global.owner.includes(senderNum);
        const isMod = isOwner || global.mods.includes(senderNum);
        const isPremium = isOwner || global.prems.includes(senderNum) ||
            (global.db && global.db.data && global.db.data.users && global.db.data.users[senderNum] && global.db.data.users[senderNum].premium);

        // Baneos globales
        const bannedUsers = (global.db && global.db.data && global.db.data.banned && global.db.data.banned.users) || [];
        const bannedChats = (global.db && global.db.data && global.db.data.banned && global.db.data.banned.chats) || [];
        const isBanned = bannedUsers.includes(senderNum);
        const isChatBanned = bannedChats.includes(from);

        // `who`: objetivo típico para kick/promote/demote/etc.
        let who = (m.mentionedJid && m.mentionedJid[0])
            ? m.mentionedJid[0]
            : (m.quoted && m.quoted.sender)
                ? m.quoted.sender
                : (m.text && /\d{5,16}/.test(m.text))
                    ? normalizeJid(m.text.match(/(\d{5,16})/)[1])
                    : null;

        dbg('m.text:', m.text, '| isGroup:', isGroup, '| sender:', senderNum, '| isROwner:', isROwner);

        let anyPrefixMatch = false;

        for (let name in global.plugins) {
            let plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;
            if (typeof plugin.execute !== 'function') continue;

            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
            let _prefix = plugin.customPrefix ? plugin.customPrefix : (this.prefix || global.prefix);
            let match = (_prefix instanceof RegExp
                ? [[_prefix.exec(m.text), _prefix]]
                : Array.isArray(_prefix)
                    ? _prefix.map(p => { let re = p instanceof RegExp ? p : new RegExp(str2Regex(p)); return [re.exec(m.text), re]; })
                    : typeof _prefix === 'string'
                        ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
                        : [[[], new RegExp]]).find(p => p[0]);

            if (!match) continue;
            anyPrefixMatch = true;

            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, { match, conn: this, isGroup, sender, senderNum, isOwner, isROwner })) continue;
            }

            let usedPrefix = (match[0] || '')[0];
            if (!usedPrefix) continue;

            let noPrefix = m.text.replace(usedPrefix, '');
            let [command, ...args] = noPrefix.trim().split(/\s+/).filter(v => v);
            command = (command || '').toLowerCase();

            let isAccept = plugin.command instanceof RegExp
                ? plugin.command.test(command)
                : Array.isArray(plugin.command)
                    ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command)
                    : typeof plugin.command === 'string'
                        ? plugin.command === command
                        : false;

            dbg('plugin:', name, '| usedPrefix:', usedPrefix, '| command:', command, '| isAccept:', isAccept);

            if (!isAccept) continue;

            global.comando = command;
            m.plugin = name;

            // ===== APLICACIÓN DE RESTRICCIONES (conectadas al Handler) =====
            try {
                if (isBanned && !isROwner) { global.dfail('owner', m, conn); break; }
                if (isChatBanned && !isROwner) { global.dfail('owner', m, conn); break; }

                if (plugin.group && !isGroup) { global.dfail('group', m, conn); break; }
                if (plugin.private && isGroup) { global.dfail('private', m, conn); break; }

                // Registro obligatorio
                if (plugin.register && !isRegistered(sender) && !isOwner) { global.dfail('unreg', m, conn); break; }

                // Permisos de grupo (sólo se calculan si el plugin los pide)
                if ((plugin.admin || plugin.botAdmin) && isGroup) {
                    const ad = await getGroupAdminData(conn, m, from);
                    if (plugin.admin && !ad.isAdmin && !isOwner) { global.dfail('admin', m, conn); break; }
                    if (plugin.botAdmin && !ad.isBotAdmin) { global.dfail('botAdmin', m, conn); break; }
                }

                if (plugin.restrict && !global.restrict && !isROwner) { global.dfail('restrict', m, conn); break; }
                if (plugin.premium && !isPremium) { global.dfail('premium', m, conn); break; }
                if (plugin.mods && !isMod) { global.dfail('mods', m, conn); break; }
                if (plugin.owner && !isOwner) { global.dfail('owner', m, conn); break; }
                if (plugin.rowner && !isROwner) { global.dfail('rowner', m, conn); break; }

                // Datos de admin ya cacheados (por si los usa el plugin)
                let adminData = null;
                if (isGroup) {
                    adminData = m.__adminData || await getGroupAdminData(conn, m, from);
                }

                const ctx = {
                    match, usedPrefix, noPrefix, args, command,
                    text: args.join(' '),
                    sock: this, conn: this,
                    from, isGroup,
                    sender, senderNum,
                    botNumber,
                    pushName,
                    isOwner, isROwner, isMod, isPremium,
                    who,
                    participants: (adminData && adminData.participants) || [],
                    groupMetadata: (adminData && adminData.groupMetadata) || null,
                    isAdmin: (adminData && adminData.isAdmin) || false,
                    isBotAdmin: (adminData && adminData.isBotAdmin) || false,
                    mentionedJid: m.mentionedJid || [],
                    quoted: m.quoted || null,
                    db: global.db
                };

                await plugin.execute.call(this, m, ctx);
            } catch (e) {
                dbg('ERROR ejecutando plugin:', name, e && e.message ? e.message : e);
                console.error(e);
                try { m.reply(format(e)); } catch (_) {}
            }
            break;
        }

        if (!anyPrefixMatch) dbg('NINGUN plugin hizo match de prefijo.');
    } catch (e) {
        dbg('ERROR en handler:', e && e.message ? e.message : e);
        console.error(e);
    }
}

// Recarga en vivo cuando el archivo cambia
const file = global.__filename ? global.__filename(__filename, true) : __filename;
watchFile(file, async () => {
    unwatchFile(file);
    console.log(chalk.green('✨ Handler actualizado correctamente ✨'));
});

module.exports = { handler };
