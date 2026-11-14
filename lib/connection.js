require('../settings');
const { default: makeWASocket, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, getContentType, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const chalk = require('chalk');
const { useSQLiteAuthState } = require('../src/database/db');

async function connectBot(options = {}) {
    const handlerModule = require('../src/handler.js');
    const handler = handlerModule.handler || handlerModule;

    const { basePath, jid, isSub = false, pairingNumber = null, qrCallback = null, onCode = null, onConnected = null } = options;
    const { state, saveCreds, clearDb } = await useSQLiteAuthState(basePath, jid);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"], 
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 5000,
        connectTimeoutMs: 60000,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        }
    });

    if (!sock.authState.creds.registered && pairingNumber) {
        setTimeout(async () => {
            try {
                let numero = pairingNumber.replace(/[^0-9]/g, '');
                if (numero.startsWith('52') && !numero.startsWith('521')) {
                    numero = '521' + numero.slice(2);
                }
                let code = await sock.requestPairingCode(numero);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                if (onCode) onCode(code);
            } catch (e) { console.error("Error al solicitar código:", e) }
        }, 7000); 
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && qrCallback) qrCallback(qr);

        if (connection === 'open') {
            console.log(chalk.bgRed.black.bold(` 📻 TRANSMISIÓN EN VIVO: ${sock.user.id.split(':')[0]} `));
            if (onConnected) onConnected(sock);
        }

        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

            if (reason === DisconnectReason.badSession) {
                console.log(chalk.bold.cyanBright(`\n⚠️ SESIÓN CORRUPTA. ${!isSub ? 'BORRANDO DB PRINCIPAL...' : 'SUB-BOT DETENIDO.'}`));
                if (!isSub) await clearDb();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log(chalk.bold.magentaBright(`\n╭┄┄┄┄ • • • ┄┄┄┄\n┆ ⚠️ CONEXIÓN CERRADA, RECONECTANDO....\n╰┄┄┄┄ • • • ┄┄┄┄`));
                setTimeout(() => connectBot(options), 5000);
            } else if (reason === DisconnectReason.connectionLost) {
                console.log(chalk.bold.blueBright(`\n╭┄┄┄┄ • • • ┄┄┄┄\n┆ ⚠️ CONEXIÓN PERDIDA, RECONECTANDO....\n╰┄┄┄┄ • • • ┄┄┄┄`));
                setTimeout(() => connectBot(options), 5000);
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log(chalk.bold.yellowBright(`\n⚠️ CONEXIÓN REEMPLAZADA, CIERRE LA OTRA SESIÓN PRIMERO.`));
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.bold.redBright(`\n⚠️ DISPOSITIVO DESCONECTADO. ${!isSub ? 'LIMPIANDO DB PRINCIPAL...' : 'ELIMINANDO SESIÓN DE SUB-BOT.'}`));
                if (!isSub) await clearDb();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log(chalk.bold.cyanBright(`\n🔄 REINICIO REQUERIDO, CONECTANDO...`));
                connectBot(options);
            } else if (reason === DisconnectReason.timedOut) {
                console.log(chalk.bold.yellowBright(`\n⌛ TIEMPO AGOTADO, RECONECTANDO....`));
                setTimeout(() => connectBot(options), 5000);
            } else {
                console.log(chalk.bold.redBright(`\n⚠️ RAZÓN DESCONOCIDA (${reason}), REINTENTANDO...`));
                setTimeout(() => connectBot(options), 5000);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const m = chatUpdate.messages && chatUpdate.messages[0];
        if (!m || !m.message) return;
        if (m.key.fromMe && !m.key.participant) {
            // mensajes propios del bot en privado: ignorar para no ejecutar comandos sobre sí mismo
            // (los grupos sí pueden tener respuestas del bot, pero no los auto-ejecutamos)
        }

        // Auto-leer mensajes
        if (global.autoread) {
            try { await sock.sendReadReceipt(m.key.remoteJid, (m.key.participant || m.key.remoteJid), [m.key.id]); } catch (e) {}
        }

        const from = m.key.remoteJid;
        const isGroup = from && from.endsWith('@g.us');
        const type = getContentType(m.message);
        const pushName = m.pushName || 'Alma en pena';
        const hora = new Date().toLocaleTimeString('es-DO', { hour12: false });
        const color = isSub ? '#8A2BE2' : '#FF0000';
        let body = String(m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || '');
        const sender = isGroup ? (m.key.participant || from) : from;
        const senderNum = sender ? sender.split('@')[0] : '0';

        // Modo self: si está activado, sólo el dueño puede usar comandos
        if (global.selfMode && !global.owner.includes(senderNum)) {
            return;
        }

        console.log(chalk.hex(color)(`📻-------------------------------------------📻`));
        console.log(chalk.hex(color)(`🎙️ `) + chalk.bold.white(` BOT: `) + chalk.red(`${global.botname || 'Alastor'} ${isSub ? '(SUB)' : '(MAIN)'}`));
        console.log(chalk.hex(color)(`🎙️ `) + chalk.bold.white(` HORA: `) + chalk.cyan(hora));
        console.log(chalk.hex(color)(`🎙️ `) + chalk.bold.white(` OYENTE: `) + chalk.green(`${pushName} (${senderNum})`));
        console.log(chalk.hex(color)(`🎙️ `) + chalk.bold.white(` CANAL: `) + chalk.magenta(isGroup ? 'Grupo' : 'Privado'));
        console.log(chalk.hex(color)(`🎙️ `) + chalk.bold.white(` FRECUENCIA: `) + chalk.white(type || 'Unknown'));
        console.log(chalk.hex(color)(`+-------------------------------------------+`));
        console.log(chalk.hex(color)(`🎙️ `) + chalk.italic.gray(` Msg: ${body.substring(0, 35).replace(/\n/g, ' ')}...`));
        console.log(chalk.hex(color)(`📻-------------------------------------------📻`));

        // --- FIX CRÍTICO: el handler espera (chatUpdate) y usa `this` como sock ---
        // Antes se llamaba handler.call(sock, sock, chatUpdate) y el primer `sock`
        // se interpretaba como chatUpdate, rompiendo todo. Ahora pasamos chatUpdate.
        if (typeof handler === 'function') {
            try {
                await handler.call(sock, chatUpdate);
            } catch (e) {
                console.error('[connection] error en handler:', e);
            }
        }
    });
}

module.exports = { connectBot };
