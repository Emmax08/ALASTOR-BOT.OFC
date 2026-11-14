const Database = require('better-sqlite3');
const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');

if (!fs.existsSync(global.alastorsessions)) {
    fs.mkdirSync(global.alastorsessions, { recursive: true });
}


const dbMain = new Database(path.join(global.alastorsessions, 'system.db'));
dbMain.pragma('journal_mode = WAL');
dbMain.exec(`CREATE TABLE IF NOT EXISTS subbots (jid TEXT PRIMARY KEY, status TEXT)`);

async function useSQLiteAuthState(basePath, jid = 'session') {
    const sessionPath = path.join(basePath, jid);
    
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });
    
    const authDb = new Database(path.join(sessionPath, 'alastor_auth.db'));
    authDb.pragma('journal_mode = WAL');
    authDb.exec(`CREATE TABLE IF NOT EXISTS auth (id TEXT PRIMARY KEY, data TEXT)`);

    const readData = (id) => {
        const row = authDb.prepare('SELECT data FROM auth WHERE id = ?').get(id);
        return row ? JSON.parse(row.data, BufferJSON.reviver) : null;
    };

    const writeData = (data, id) => {
        authDb.prepare('INSERT OR REPLACE INTO auth (id, data) VALUES (?, ?)').run(id, JSON.stringify(data, BufferJSON.replacer));
    };

    const removeData = (id) => authDb.prepare('DELETE FROM auth WHERE id = ?').run(id);

    let creds = readData('creds') || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    ids.forEach(id => {
                        let value = readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        data[id] = value;
                    });
                    return data;
                },
                set: async (data) => {
                    for (const cat in data) {
                        for (const id in data[cat]) {
                            const val = data[cat][id];
                            val ? writeData(val, `${cat}-${id}`) : removeData(`${cat}-${id}`);
                        }
                    }
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds'),
        clearDb: () => authDb.prepare('DELETE FROM auth').run()
    };
}

module.exports = { useSQLiteAuthState, db: dbMain };
