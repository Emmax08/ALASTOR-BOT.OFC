const os = require('os');

module.exports = {
    command: ['ping', 'p', 'status'],
    execute: async (m, { sock, from, isGroup }) => {
        const name = m?.pushName || 'pecador';

        // --- Lógica de Sistema ---
        const ramTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const ramLibre = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
        const ramUso = (ramTotal - ramLibre).toFixed(2);

        const cpuModel = os.cpus()[0].model.split('@')[0].trim();
        const cpuCores = os.cpus().length;
        const uptime = process.uptime();

        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const mins = Math.floor((uptime % 3600) / 60);

        // Construcción del reporte (sin dependencias externas)
        let report = `🎙️ *ALASTOR RADIO: ESTADO DEL ETER*\n\n`;
        report += `✨ *Estado:* ¡Operando con una sonrisa!\n`;
        report += `👤 *Oyente:* ${name}\n`;
        report += `⏳ *Al aire:* ${days}d ${hours}h ${mins}m\n\n`;

        report += `📟 *RECEPTOR (SERVIDOR):* \n`;
        report += `> 🛠️ *CPU:* ${cpuModel}\n`;
        report += `> ⚙️ *Núcleos:* ${cpuCores}\n`;
        report += `> 📟 *RAM:* ${ramUso}GB / ${ramTotal}GB\n`;
        report += `> 🌡️ *Temperatura:* 45°C\n\n`;

        report += `_"¡Nunca estás completamente vestido sin una sonrisa, querido!"_`;

        // Reacción y Envío
        await sock.sendMessage(from, { react: { text: "🎙️", key: m.key } });
        await sock.sendMessage(from, { text: report }, { quoted: m });
    }
};
