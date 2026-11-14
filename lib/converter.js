// lib/converter.js  (CommonJS)
const { promises: fsp } = require('fs');
const { join } = require('path');
const { spawn } = require('child_process');

const TMP_DIR = () => global.tmpDir || './tmp';

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      let tmp = join(TMP_DIR(), +new Date() + '.' + ext);
      let out = tmp + '.' + ext2;
      await fsp.writeFile(tmp, buffer);
      spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
        .on('error', reject)
        .on('close', async (code) => {
          try {
            await fsp.unlink(tmp).catch(() => {});
            if (code !== 0) return reject(code);
            resolve({
              data: await fsp.readFile(out),
              filename: out,
              delete() { return fsp.unlink(out).catch(() => {}); }
            });
          } catch (e) { reject(e); }
        });
    } catch (e) { reject(e); }
  });
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on'], ext, 'ogg');
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'], ext, 'opus');
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'], ext, 'mp4');
}

module.exports = { ffmpeg, toAudio, toPTT, toVideo };
