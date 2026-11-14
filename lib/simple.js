// lib/simple.js  (CommonJS)
// Serialización de mensajes y utilidades del socket (Baileys).
const path = require('path');
const { toAudio } = require('./converter.js');
const chalk = require('chalk');
const fetch = require('node-fetch');
const PhoneNumber = require('awesome-phonenumber');
const fs = require('fs');
const util = require('util');
const { format } = require('util');
const { fileTypeFromBuffer } = require('file-type');
const store = require('./store.js');
const jimp = require('jimp');
const pino = require('pino');

const baileys = require('@whiskeysockets/baileys');
// require() devuelve module.exports directamente, que tiene .default, .proto, etc.
const B = baileys;
const {
    default: _makeWaSocket,
    makeWALegacySocket,
    proto,
    downloadContentFromMessage,
    jidDecode,
    areJidsSameUser,
    generateWAMessage,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    WAMessageStubType,
    extractMessageContent,
    makeInMemoryStore,
    getAggregateVotesInPollMessage,
    prepareWAMessageMedia,
    WA_DEFAULT_EPHEMERAL
} = B;

function makeWASocket(connectionOptions, options = {}) {
    let conn = (global.opts && global.opts.legacy ? makeWALegacySocket : _makeWaSocket)(connectionOptions);

    let sock = Object.defineProperties(conn, {
        chats: {
            value: { ...(options.chats || {}) },
            writable: true
        },
        decodeJid: {
            value(jid) {
                if (!jid || typeof jid !== 'string') return (!nullish(jid) && jid) || null;
                return jid.decodeJid();
            }
        },
        logger: {
            get() {
                return {
                    info(...args) { console.log(chalk.bold.bgRgb(51, 204, 51)('INFO '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.cyan(format(...args))); },
                    error(...args) { console.log(chalk.bold.bgRgb(247, 38, 33)('ERROR '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.rgb(255, 38, 0)(format(...args))); },
                    warn(...args) { console.log(chalk.bold.bgRgb(255, 153, 0)('WARNING '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.redBright(format(...args))); },
                    trace(...args) { console.log(chalk.grey('TRACE '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.white(format(...args))); },
                    debug(...args) { console.log(chalk.bold.bgRgb(66, 167, 245)('DEBUG '), `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`, chalk.white(format(...args))); }
                };
            },
            enumerable: true
        },
        getFile: {
            async value(PATH, saveToFile = false) {
                let res, filename;
                const data = Buffer.isBuffer(PATH) ? PATH
                    : PATH instanceof ArrayBuffer ? Buffer.from(PATH)
                    : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64')
                    : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer()
                    : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH))
                    : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
                if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
                const type = await fileTypeFromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
                if (data && saveToFile && !filename) {
                    filename = path.join(global.tmpDir || './tmp', +new Date() + '.' + type.ext);
                    await fs.promises.writeFile(filename, data);
                }
                return {
                    res, filename, ...type, data,
                    deleteFile() { return filename && fs.promises.unlink(filename); }
                };
            },
            enumerable: true
        },
        waitEvent: {
            value(eventName, is = () => true, maxTries = 25) {
                return new Promise((resolve, reject) => {
                    let tries = 0;
                    let on = (...args) => {
                        if (++tries > maxTries) reject('Max tries reached');
                        else if (is()) { conn.ev.off(eventName, on); resolve(...args); }
                    };
                    conn.ev.on(eventName, on);
                });
            }
        },
        resize: {
            value(buffer, ukur1, ukur2) {
                return new Promise(async (resolve, reject) => {
                    try {
                        const baper = await jimp.read(buffer);
                        const ab = await baper.resize(ukur1, ukur2).getBufferAsync(jimp.MIME_JPEG);
                        resolve(ab);
                    } catch (e) { reject(e); }
                });
            }
        },
        sendFile: {
            async value(jid, pathArg, filename = '', caption = '', quoted, ptt = false, options = {}) {
                let type = await conn.getFile(pathArg, true);
                let { res, data: file, filename: pathFile } = type;
                if ((res && res.status !== 200) || file.length <= 65536) {
                    try { throw { json: JSON.parse(file.toString()) }; }
                    catch (e) { if (e.json) throw e.json; }
                }
                let opt = {};
                if (quoted) opt.quoted = quoted;
                if (!type) options.asDocument = true;
                let mtype = '', mimetype = options.mimetype || type.mime, convert;
                if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
                else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
                else if (/video/.test(type.mime)) mtype = 'video';
                else if (/audio/.test(type.mime)) {
                    convert = await toAudio(file, type.ext);
                    file = convert.data; pathFile = convert.filename; mtype = 'audio';
                    mimetype = options.mimetype || 'audio/ogg; codecs=opus';
                }
                else mtype = 'document';
                if (options.asDocument) mtype = 'document';

                delete options.asSticker; delete options.asLocation; delete options.asVideo; delete options.asDocument; delete options.asImage;

                let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype, fileName: filename || pathFile.split('/').pop() };
                let m;
                try { m = await conn.sendMessage(jid, message, { ...opt, ...options }); }
                catch (e) { console.error(e); m = null; }
                finally {
                    if (!m) m = await conn.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
                    file = null;
                    return m;
                }
            },
            enumerable: true
        },
        reply: {
            value(jid, text = '', quoted, options) {
                return Buffer.isBuffer(text) ? conn.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options, text }, { quoted, ...options });
            }
        },
        cMod: {
            value(jid, message, text = '', sender = conn.user.jid, options = {}) {
                if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions];
                let copy = message.toJSON();
                delete copy.message.messageContextInfo;
                delete copy.message.senderKeyDistributionMessage;
                let mtype = Object.keys(copy.message)[0];
                let msg = copy.message;
                let content = msg[mtype];
                if (typeof content === 'string') msg[mtype] = text || content;
                else if (content.caption) content.caption = text || content.caption;
                else if (content.text) content.text = text || content.text;
                if (typeof content !== 'string') {
                    msg[mtype] = { ...content, ...options };
                    msg[mtype].contextInfo = { ...(content.contextInfo || {}), mentionedJid: options.mentions || (content.contextInfo && content.contextInfo.mentionedJid) || [] };
                }
                if (copy.participant) sender = copy.participant = sender || copy.participant;
                else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
                if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
                else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
                copy.key.remoteJid = jid;
                copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false;
                return proto.WebMessageInfo.fromObject(copy);
            },
            enumerable: true
        },
        copyNForward: {
            async value(jid, message, forwardingScore = true, options = {}) {
                let vtype;
                if (options.readViewOnce && message.message.viewOnceMessage && message.message.viewOnceMessage.message) {
                    vtype = Object.keys(message.message.viewOnceMessage.message)[0];
                    delete message.message.viewOnceMessage.message[vtype].viewOnce;
                    message.message = proto.Message.fromObject(JSON.parse(JSON.stringify(message.message.viewOnceMessage.message)));
                    message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo;
                }
                let mtype = Object.keys(message.message)[0];
                let m = generateForwardMessageContent(message, !!forwardingScore);
                let ctype = Object.keys(m)[0];
                if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) m[ctype].contextInfo.forwardingScore += forwardingScore;
                m[ctype].contextInfo = { ...((message.message[mtype] && message.message[mtype].contextInfo) || {}), ...(m[ctype].contextInfo || {}) };
                m = generateWAMessageFromContent(jid, m, { ...options, userJid: conn.user.jid });
                await conn.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } });
                return m;
            },
            enumerable: true
        },
        fakeReply: {
            value(jid, text = '', fakeJid = this.user.jid, fakeText = '', fakeGroupJid, options) {
                return conn.reply(jid, text, { key: { fromMe: areJidsSameUser(fakeJid, conn.user.id), participant: fakeJid, ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}) }, message: { conversation: fakeText }, ...options });
            }
        },
        downloadM: {
            async value(m, type, saveToFile) {
                let filename;
                if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
                const stream = await downloadContentFromMessage(m, type);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                if (saveToFile) ({ filename } = await conn.getFile(buffer, true));
                return saveToFile && fs.existsSync(filename) ? filename : buffer;
            },
            enumerable: true
        },
        parseMention: {
            value(text = '') { return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net'); },
            enumerable: true
        },
        getName: {
            value(jid = '', withoutContact = false) {
                jid = conn.decodeJid(jid);
                withoutContact = conn.withoutContact || withoutContact;
                let v;
                if (jid.endsWith('@g.us')) return new Promise(async (resolve) => {
                    v = conn.chats[jid] || {};
                    if (!(v.name || v.subject)) v = await conn.groupMetadata(jid) || {};
                    resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'));
                });
                else v = jid === '0@s.whatsapp.net' ? { jid, vname: 'WhatsApp' }
                    : areJidsSameUser(jid, conn.user.id) ? conn.user : (conn.chats[jid] || {});
                let userName = (global.db && global.db.data && global.db.data.users[jid.replace('@s.whatsapp.net', '')] && global.db.data.users[jid.replace('@s.whatsapp.net', '')].nombre);
                if (!userName) userName = PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
                return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || userName;
            },
            enumerable: true
        },
        loadMessage: {
            value(messageID) {
                return Object.entries(conn.chats)
                    .filter(([_, { messages }]) => typeof messages === 'object')
                    .find(([_, { messages }]) => Object.entries(messages).find(([k, v]) => (k === messageID || (v.key && v.key.id === messageID))))
                    ?.[1].messages?.[messageID];
            }
        },
        processMessageStubType: {
            async value(m) {
                if (!m.messageStubType) return;
                const chat = conn.decodeJid(m.key.remoteJid || (m.message && m.message.senderKeyDistributionMessage && m.message.senderKeyDistributionMessage.groupId) || '');
                if (!chat || chat === 'status@broadcast') return;
                const emitGroupUpdate = (update) => conn.ev.emit('groups.update', [{ id: chat, ...update }]);
                switch (m.messageStubType) {
                    case WAMessageStubType.REVOKE:
                    case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
                        emitGroupUpdate({ revoke: m.messageStubParameters[0] });
                        break;
                    case WAMessageStubType.GROUP_CHANGE_ICON:
                        emitGroupUpdate({ icon: m.messageStubParameters[0] });
                        break;
                    default: break;
                }
                const isGroup = chat.endsWith('@g.us');
                if (!isGroup) return;
                let chats = conn.chats[chat];
                if (!chats) chats = conn.chats[chat] = { id: chat };
                chats.isChats = true;
                const metadata = await conn.groupMetadata(chat).catch(_ => null);
                if (!metadata) return;
                chats.subject = metadata.subject;
                chats.metadata = metadata;
            }
        },
        insertAllGroup: {
            async value() {
                const groups = await conn.groupFetchAllParticipating().catch(_ => null) || {};
                for (const group in groups) conn.chats[group] = { ...(conn.chats[group] || {}), id: group, subject: groups[group].subject, isChats: true, metadata: groups[group] };
                return conn.chats;
            }
        },
        pushMessage: {
            async value(m) {
                if (!m) return;
                if (!Array.isArray(m)) m = [m];
                for (const message of m) {
                    try {
                        if (!message) continue;
                        if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) conn.processMessageStubType(message).catch(console.error);
                        const _mtype = Object.keys(message.message || {});
                        const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
                            (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
                            _mtype[_mtype.length - 1];
                        const chat = conn.decodeJid(message.key.remoteJid || (message.message && message.message.senderKeyDistributionMessage && message.message.senderKeyDistributionMessage.groupId) || '');
                        if (message.message && message.message[mtype] && message.message[mtype].contextInfo && message.message[mtype].contextInfo.quotedMessage) {
                            let context = message.message[mtype].contextInfo;
                            let participant = conn.decodeJid(context.participant);
                            const remoteJid = conn.decodeJid(context.remoteJid || participant);
                            let quoted = message.message[mtype].contextInfo.quotedMessage;
                            if ((remoteJid && remoteJid !== 'status@broadcast') && quoted) {
                                let qMtype = Object.keys(quoted)[0];
                                if (qMtype == 'conversation') {
                                    quoted.extendedTextMessage = { text: quoted[qMtype] };
                                    delete quoted.conversation;
                                    qMtype = 'extendedTextMessage';
                                }
                                if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {};
                                quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || [];
                                const isGroup = remoteJid.endsWith('g.us');
                                if (isGroup && !participant) participant = remoteJid;
                                const qM = {
                                    key: { remoteJid, fromMe: areJidsSameUser(conn.user.jid, remoteJid), id: context.stanzaId, participant },
                                    message: JSON.parse(JSON.stringify(quoted)),
                                    ...(isGroup ? { participant } : {})
                                };
                                let qChats = conn.chats[participant];
                                if (!qChats) qChats = conn.chats[participant] = { id: participant, isChats: !isGroup };
                                if (!qChats.messages) qChats.messages = {};
                                if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM;
                            }
                        }
                        if (!chat || chat === 'status@broadcast') continue;
                        const isGroup = chat.endsWith('@g.us');
                        let chats = conn.chats[chat];
                        if (!chats) {
                            if (isGroup) await conn.insertAllGroup().catch(console.error);
                            chats = conn.chats[chat] = { id: chat, isChats: true, ...(conn.chats[chat] || {}) };
                        }
                        let metadata, sender;
                        if (isGroup) {
                            if (!chats.subject || !chats.metadata) {
                                metadata = await conn.groupMetadata(chat).catch(_ => ({})) || {};
                                if (!chats.subject) chats.subject = metadata.subject || '';
                                if (!chats.metadata) chats.metadata = metadata;
                            }
                            sender = conn.decodeJid((message.key && message.key.fromMe && conn.user.id) || message.participant || (message.key && message.key.participant) || chat || '');
                            if (sender !== chat) {
                                let sChats = conn.chats[sender];
                                if (!sChats) sChats = conn.chats[sender] = { id: sender };
                                if (!sChats.name) sChats.name = message.pushName || sChats.name || '';
                            }
                        } else if (!chats.name) chats.name = message.pushName || chats.name || '';
                        if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) continue;
                        chats.isChats = true;
                        if (!chats.messages) chats.messages = {};
                        const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id);
                        if (!['protocolMessage'].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
                            delete message.message.messageContextInfo;
                            delete message.message.senderKeyDistributionMessage;
                            chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2));
                        }
                    } catch (e) { console.error(e); }
                }
            }
        },
        serializeM: { value(m) { return smsg(conn, m); } },
        ...(typeof conn.chatRead !== 'function' ? {
            chatRead: {
                value(jid, participant = conn.user.jid, messageID) { return conn.sendReadReceipt(jid, participant, [messageID]); },
                enumerable: true
            }
        } : {}),
        ...(typeof conn.setStatus !== 'function' ? {
            setStatus: {
                value(status) {
                    return conn.query({
                        tag: 'iq', attrs: { to: 's.whatsapp.net', type: 'set', xmlns: 'status' },
                        content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }]
                    });
                },
                enumerable: true
            }
        } : {})
    });
    if (sock.user && sock.user.id) sock.user.jid = sock.decodeJid(sock.user.id);
    store.bind(sock);
    return sock;
}

function smsg(conn, m, hasParent) {
    if (!m) return m;
    const M = proto.WebMessageInfo;
    m = M.fromObject(m);
    m.conn = conn;
    let protocolMessageKey;
    if (m.message) {
        if (m.mtype == 'protocolMessage' && m.msg && m.msg.key) {
            protocolMessageKey = m.msg.key;
            if (protocolMessageKey == 'status@broadcast') protocolMessageKey.remoteJid = m.chat;
            if (!protocolMessageKey.participant || protocolMessageKey.participant == 'status_me') protocolMessageKey.participant = m.sender;
            protocolMessageKey.fromMe = conn.decodeJid(protocolMessageKey.participant) === conn.decodeJid(conn.user.id);
            if (!protocolMessageKey.fromMe && protocolMessageKey.remoteJid === conn.decodeJid(conn.user.id)) protocolMessageKey.remoteJid = m.sender;
        }
        if (m.quoted) if (!m.quoted.mediaMessage) delete m.quoted.download;
    }
    if (!m.mediaMessage) delete m.download;

    try {
        if (protocolMessageKey && m.mtype == 'protocolMessage') conn.ev.emit('message.delete', protocolMessageKey);
    } catch (e) { console.error(e); }
    return m;
}

function serialize() {
    const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
    Object.defineProperties(proto.WebMessageInfo.prototype, {
        conn: { value: undefined, enumerable: false, writable: true },
        id: { get() { return this.key && this.key.id; } },
        isBaileys: {
            get() {
                if (!this.conn || !this.conn.user) return false;
                return (this.fromMe || areJidsSameUser(this.conn.user.id, this.sender)) && this.id && this.id.startsWith('3EB0') && (this.id.length === 20 || this.id.length === 22 || this.id.length === 12) || false;
            }
        },
        chat: {
            get() {
                const senderKeyDistributionMessage = this.message && this.message.senderKeyDistributionMessage && this.message.senderKeyDistributionMessage.groupId;
                return (this.key && this.key.remoteJid) || (senderKeyDistributionMessage && senderKeyDistributionMessage !== 'status@broadcast') || '';
            }
        },
        isGroup: { get() { return this.chat.endsWith('@g.us'); }, enumerable: true },
        sender: {
            get() { return this.conn && this.conn.decodeJid((this.key && this.key.fromMe && this.conn.user.id) || this.participant || (this.key && this.key.participant) || this.chat || ''); },
            enumerable: true
        },
        fromMe: { get() { return (this.key && this.key.fromMe) || areJidsSameUser(this.conn && this.conn.user.id, this.sender) || false; } },
        mtype: {
            get() {
                if (!this.message) return '';
                const type = Object.keys(this.message);
                return (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) ||
                    (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) || type[type.length - 1];
            },
            enumerable: true
        },
        msg: { get() { if (!this.message) return null; return this.message[this.mtype]; } },
        mediaMessage: {
            get() {
                if (!this.message) return null;
                const Message = ((this.msg && (this.msg.url || this.msg.directPath)) ? { ...this.message } : extractMessageContent(this.message)) || null;
                if (!Message) return null;
                const mtype = Object.keys(Message)[0];
                return MediaType.includes(mtype) ? Message : null;
            },
            enumerable: true
        },
        mediaType: {
            get() { let message; if (!(message = this.mediaMessage)) return null; return Object.keys(message)[0]; },
            enumerable: true
        },
        quoted: {
            get() {
                const self = this;
                const msg = self.msg;
                const contextInfo = msg && msg.contextInfo;
                const quoted = contextInfo && contextInfo.quotedMessage;
                if (!msg || !contextInfo || !quoted) return null;
                const type = Object.keys(quoted)[0];
                const q = quoted[type];
                const text = typeof q === 'string' ? q : q.text;
                return Object.defineProperties(JSON.parse(JSON.stringify(typeof q === 'string' ? { text: q } : q)), {
                    mtype: { get() { return type; }, enumerable: true },
                    mediaMessage: {
                        get() {
                            const Message = ((q.url || q.directPath) ? { ...quoted } : extractMessageContent(quoted)) || null;
                            if (!Message) return null;
                            const mtype = Object.keys(Message)[0];
                            return MediaType.includes(mtype) ? Message : null;
                        },
                        enumerable: true
                    },
                    mediaType: { get() { let message; if (!(message = this.mediaMessage)) return null; return Object.keys(message)[0]; }, enumerable: true },
                    id: { get() { return contextInfo.stanzaId; }, enumerable: true },
                    chat: { get() { return contextInfo.remoteJid || self.chat; }, enumerable: true },
                    isBaileys: {
                        get() { if (!this.conn || !this.conn.user) return false; return (this.fromMe || areJidsSameUser(this.conn.user.id, this.sender)) && this.id && this.id.startsWith('3EB0') && (this.id.length === 20 || this.id.length === 22 || this.id.length === 12) || false; },
                        enumerable: true
                    },
                    sender: { get() { return (contextInfo.participant || this.chat || '').decodeJid(); }, enumerable: true },
                    fromMe: { get() { return areJidsSameUser(this.sender, self.conn && self.conn.user.jid); }, enumerable: true },
                    text: { get() { return text || this.caption || this.contentText || this.selectedDisplayText || ''; }, enumerable: true },
                    mentionedJid: { get() { return (q.contextInfo && q.contextInfo.mentionedJid) || (self.getQuotedObj && self.getQuotedObj().mentionedJid) || []; }, enumerable: true },
                    name: { get() { const sender = this.sender; return sender ? (self.conn && self.conn.getName(sender)) : null; }, enumerable: true },
                    vM: {
                        get() {
                            return proto.WebMessageInfo.fromObject({
                                key: { fromMe: this.fromMe, remoteJid: this.chat, id: this.id },
                                message: quoted,
                                ...(self.isGroup ? { participant: this.sender } : {})
                            });
                        }
                    },
                    fakeObj: { get() { return this.vM; } },
                    download: {
                        value(saveToFile = false) {
                            const mtype = this.mediaType;
                            return self.conn && self.conn.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile);
                        },
                        enumerable: true, configurable: true
                    },
                    reply: { value(text, chatId, options) { return self.conn && self.conn.reply(chatId ? chatId : this.chat, text, this.vM, options); }, enumerable: true },
                    copy: { value() { const M = proto.WebMessageInfo; return smsg(conn, M.fromObject(M.toObject(this.vM))); }, enumerable: true },
                    forward: { value(jid, force = false, options) { return self.conn && self.conn.sendMessage(jid, { forward: this.vM, force, ...options }, { ...options }); }, enumerable: true },
                    copyNForward: { value(jid, forceForward = false, options) { return self.conn && self.conn.copyNForward(jid, this.vM, forceForward, options); }, enumerable: true },
                    cMod: { value(jid, text = '', sender = this.sender, options = {}) { return self.conn && self.conn.cMod(jid, this.vM, text, sender, options); }, enumerable: true },
                    delete: { value() { return self.conn && self.conn.sendMessage(this.chat, { delete: this.vM.key }); }, enumerable: true },
                    react: { value(text) { return self.conn && self.conn.sendMessage(this.chat, { react: { text, key: this.vM.key } }); }, enumerable: true }
                });
            },
            enumerable: true
        },
        _text: { value: null, writable: true },
        text: {
            get() {
                const msg = this.msg;
                const text = (typeof msg === 'string' ? msg : (msg && msg.text)) || (msg && msg.caption) || (msg && msg.contentText) || '';
                return typeof this._text === 'string' ? this._text : ('' || (typeof text === 'string' ? text : (text && (text.selectedDisplayText || (text.hydratedTemplate && text.hydratedTemplate.hydratedContentText) || text))) || '');
            },
            set(str) { return this._text = str; },
            enumerable: true
        },
        mentionedJid: {
            get() { return (this.msg && this.msg.contextInfo && this.msg.contextInfo.mentionedJid && this.msg.contextInfo.mentionedJid.length && this.msg.contextInfo.mentionedJid) || []; },
            enumerable: true
        },
        name: { get() { return !nullish(this.pushName) && this.pushName || (this.conn && this.conn.getName(this.sender)); }, enumerable: true },
        download: {
            value(saveToFile = false) {
                const mtype = this.mediaType;
                return this.conn && this.conn.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile);
            },
            enumerable: true, configurable: true
        },
        reply: { value(text, chatId, options) { return this.conn && this.conn.reply(chatId ? chatId : this.chat, text, this, options); } },
        copy: { value() { const M = proto.WebMessageInfo; return smsg(this.conn, M.fromObject(M.toObject(this))); }, enumerable: true },
        forward: { value(jid, force = false, options = {}) { return this.conn && this.conn.sendMessage(jid, { forward: this, force, ...options }, { ...options }); }, enumerable: true },
        copyNForward: { value(jid, forceForward = false, options = {}) { return this.conn && this.conn.copyNForward(jid, this, forceForward, options); }, enumerable: true },
        cMod: { value(jid, text = '', sender = this.sender, options = {}) { return this.conn && this.conn.cMod(jid, this, text, sender, options); }, enumerable: true },
        getQuotedObj: {
            value() {
                if (!this.quoted || !this.quoted.id) return null;
                const q = proto.WebMessageInfo.fromObject((this.conn && this.conn.loadMessage(this.quoted.id)) || this.quoted.vM);
                return smsg(this.conn, q);
            },
            enumerable: true
        },
        getQuotedMessage: { get() { return this.getQuotedObj; } },
        delete: { value() { return this.conn && this.conn.sendMessage(this.chat, { delete: this.key }); }, enumerable: true },
        react: { value(text) { return this.conn && this.conn.sendMessage(this.chat, { react: { text, key: this.key } }); }, enumerable: true }
    });
}

function logic(check, inp, out) {
    if (inp.length !== out.length) throw new Error('Input and Output must have same length');
    for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i];
    return null;
}

function protoType() {
    Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
        const ab = new ArrayBuffer(this.length);
        const view = new Uint8Array(ab);
        for (let i = 0; i < this.length; ++i) view[i] = this[i];
        return ab;
    };
    Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() { return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength); };
    ArrayBuffer.prototype.toBuffer = function toBuffer() { return Buffer.from(new Uint8Array(this)); };
    Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() { return await fileTypeFromBuffer(this); };
    String.prototype.isNumber = Number.prototype.isNumber = isNumber;
    String.prototype.capitalize = function capitalize() { return this.charAt(0).toUpperCase() + this.slice(1, this.length); };
    String.prototype.capitalizeV2 = function capitalizeV2() { return this.split(' ').map(v => v.capitalize()).join(' '); };
    String.prototype.decodeJid = function decodeJid() {
        if (/:\\d+@/gi.test(this)) { const decode = jidDecode(this) || {}; return (decode.user && decode.server && decode.user + '@' + decode.server || this).trim(); }
        return this.trim();
    };
    Number.prototype.toTimeString = function toTimeString() {
        const seconds = Math.floor((this / 1000) % 60);
        const minutes = Math.floor((this / (60 * 1000)) % 60);
        const hours = Math.floor((this / (60 * 60 * 1000)) % 24);
        const days = Math.floor(this / (24 * 60 * 60 * 1000));
        return ((days ? `${days}d ` : '') + (hours ? `${hours}h ` : '') + (minutes ? `${minutes}m ` : '') + (seconds ? `${seconds}s` : '')).trim();
    };
    Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom;
}

function isNumber() {
    const int = parseInt(this);
    return typeof int === 'number' && !isNaN(int);
}

function getRandom() {
    if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)];
    return Math.floor(Math.random() * this);
}

function nullish(args) { return !(args !== null && args !== undefined); }

module.exports = { makeWASocket, smsg, serialize, logic, protoType };
