// plugins/menu.js  (CommonJS)
// Menú principal de Alastor Bot. Lista los comandos agrupados por categoría,
// leyéndolos dinámicamente de los plugins cargados.
const { runtime, systemInfo } = require('../lib/myfunc.js');

const ICONOS = {
    info: '📻',
    descargas: '📥',
    musica: '🎵',
    stickers: '🎨',
    grupo: '👥',
    owner: '👑',
    registro: '📝',
    subbot: '🤖',
    convertidor: '🔄',
    tools: '🛠️',
    otros: '✨'
};

const NOMBRES = {
    info: 'INFORMACIÓN',
    descargas: 'DESCARGAS',
    musica: 'MÚSICA / YOUTUBE',
    stickers: 'STICKERS',
    grupo: 'ADMINISTRACIÓN DE GRUPOS',
    owner: 'COMANDOS DEL DUEÑO',
    registro: 'REGISTRO',
    subbot: 'SUB-BOTS',
    convertidor: 'CONVERTIDORES',
    tools: 'HERRAMIENTAS',
    otros: 'OTROS'
};

// Deriva la categoría a partir del nombre del archivo cuando el plugin no la declara.
function derivarCategoria(file, plugin) {
    if (plugin.category) return plugin.category;
    const f = file.toLowerCase();
    if (f.startsWith('menu') || f.startsWith('info-')) return 'info';
    if (f.startsWith('descarga-')) return 'descargas';
    if (f.startsWith('grupo-')) return 'grupo';
    if (f.startsWith('owner-')) return 'owner';
    if (f.startsWith('rowner-') || f === 'exec.js' || f.startsWith('bots-restart')) return 'owner';
    if (f.startsWith('yta') || f.startsWith('ytv') || f === 'play.js' || f.startsWith('spotify')) return 'musica';
    if (f.startsWith('sticker') || f === 'setmeta.js') return 'stickers';
    if (f === 'reg.js') return 'registro';
    if (f.startsWith('bot-')) return 'subbot';
    if (['group.js', 'kick.js', 'promote.js', 'demote.js', 'autoadmin.js'].includes(f) || f.startsWith('grupo-')) return 'grupo';
    if (f.startsWith('convert') || f.startsWith('to')) return 'convertidor';
    if (f.startsWith('tool') || f.startsWith('calc') || f.startsWith('qr')) return 'tools';
    return 'otros';
}

module.exports = {
    command: ['menu', 'help', 'comandos', 'menú', 'ayuda', 'start'],
    category: 'info',
    execute: async (m, { conn, from, usedPrefix, senderNum, pushName, isOwner, isROwner }) => {
        const name = pushName || (global.db && global.db.data && global.db.data.users[senderNum] && global.db.data.users[senderNum].nombre) || 'pecador';
        const si = systemInfo();
        const uptime = runtime(si.uptime);
        const totalCmds = Object.values(global.plugins).reduce((acc, p) => acc + (Array.isArray(p.command) ? p.command.length : (p.command ? 1 : 0)), 0);
        const totalPlugins = Object.keys(global.plugins).length;
        const prefix = (usedPrefix || (global.prefix && global.prefix[0]) || '.');

        // Agrupar por categoría
        const grupos = {};
        for (const file in global.plugins) {
            const p = global.plugins[file];
            if (!p || !p.command) continue;
            const cat = derivarCategoria(file, p);
            if (!grupos[cat]) grupos[cat] = [];
            const cmds = Array.isArray(p.command) ? p.command : [p.command];
            let tag = '';
            if (p.rowner) tag = ' ⚡';
            else if (p.owner) tag = ' 🔒';
            else if (p.admin || p.botAdmin) tag = ' 👑';
            else if (p.register) tag = ' 📝';
            else if (p.group) tag = ' 👥';
            grupos[cat].push(cmds.map(c => `${prefix}${c}${tag}`).join(' · '));
        }

        const orden = ['info', 'registro', 'descargas', 'musica', 'stickers', 'convertidor', 'grupo', 'subbot', 'tools', 'owner', 'otros'];

        let body = '';
        body += '╭─ « 𝘼𝙇𝘼𝙎𝙏𝙊𝙍 𝙍𝘼𝘿𝙄𝙊 » ─╮\n';
        body += '│  🎙️ *Demonio de la Radio*  🎙️\n';
        body += `│  👤 *Oyente:* ${name}\n`;
        body += `│  ⏱️ *En el aire:* ${uptime}\n`;
        body += `│  📦 *Plugins:* ${totalPlugins}  •  *Comandos:* ${totalCmds}\n`;
        body += `│  🖥️ *RAM:* ${si.ramUsedGB}/${si.ramTotalGB} GB  •  *CPU:* ${si.cpuCores} núcleos\n`;
        body += `│  ⚙️ *CPU:* ${si.cpuModel.split('@')[0].trim()}\n`;
        body += '╰─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╯\n\n';
        body += '_"¡Es un placer conocerte, querido! Aquí está el menú del espectáculo."_\n\n';
        body += '📋 *LEYENDA:*  ⚡Dueño  🔒Owner  👑Admin  📝Registro  👥Grupo\n\n';

        for (const cat of orden) {
            if (!grupos[cat]) continue;
            const icon = ICONOS[cat] || '✨';
            const nom = NOMBRES[cat] || cat.toUpperCase();
            body += `┏━ ${icon} *${nom}* ━┓\n`;
            for (const linea of grupos[cat]) {
                body += `┃ ${linea}\n`;
            }
            body += '┗━━━━━━━━━━━━━━┛\n\n';
        }

        body += '━━━━━━━━━━━━━━━━\n';
        body += `💡 *Prefijo actual:* [ ${global.prefix.join(' ')} ]\n`;
        body += `📨 *¿Cómo usarlo?* ${prefix}comando <argumento>\n`;
        body += `_El entretenimiento nunca termina..._`;

        await conn.sendMessage(from, { react: { text: '🎙️', key: m.key } });
        await conn.sendMessage(from, { text: body }, { quoted: m });
    }
};
