// lib/downloader.js  (CommonJS)
// Helper unificado de descargas. Centraliza las llamadas a APIs para que los
// plugins sean simples. Si una API cambia, sólo se edita este archivo.
const axios = require('axios');
const ytsearch = require('yt-search');
const { ogmp3 } = require('./youtobedl.js');

const ALYA = () => global.APIs.alyacore;
const ALYA_KEY = () => global.APIKeys.alyacore;

// ---------- YOUTUBE ----------
// Busca en YouTube con yt-search (sin API key, local).
async function ytSearch(query, limit = 1) {
  const r = await ytsearch(query);
  const videos = (r && r.videos) || [];
  if (!videos.length) throw new Error('No se encontraron resultados en YouTube para: ' + query);
  return videos.slice(0, limit);
}

// Descarga audio/video de YouTube con ogmp3 (sin API key).
// type: 'audio' | 'video', format: calidad ('320','128' para audio, '720','1080' para video)
async function ytDownload(url, type = 'audio', format = null) {
  const fmt = format || (type === 'video' ? '720' : '320');
  const res = await ogmp3.download(url, fmt, type);
  if (!res.status) throw new Error(res.error || 'No se pudo descargar de YouTube');
  return res.result; // { title, download }
}

// ---------- TIKTOK ----------
async function tiktok(url) {
  const { data } = await axios.get(`${ALYA()}/dl/tiktok`, {
    params: { url, key: ALYA_KEY() }, timeout: 20000
  });
  if (!data || (!data.status && !data.result)) throw new Error('La API no devolvió resultado para TikTok.');
  const d = data.data || data.result || data;
  return {
    title: d.title || d.desc || 'Sin título',
    author: (d.author && (d.author.nickname || d.author.unique_id)) || d.author || 'Desconocido',
    likes: (d.stats && d.stats.likes) || d.likes || 0,
    plays: (d.stats && d.stats.plays) || d.play || 0,
    video: d.dl || d.play || (d.videos && d.videos[0]) || d.url,
    audio: d.audio || (d.music && d.music.url) || null
  };
}

// ---------- FACEBOOK ----------
async function facebook(url) {
  const { data } = await axios.get(`${ALYA()}/dl/facebook`, {
    params: { url, key: ALYA_KEY() }, timeout: 30000
  });
  const d = data.result || data.data || data;
  if (!d) throw new Error('No se obtuvo resultado de Facebook.');
  const urls = (d.urls || d.links || (Array.isArray(d) ? d : [d])).filter(x => x && x.url || x && x.hd || x && x.download);
  const best = (d.hd || d.download || (urls.find(x => x.hd) || {}).hd || (urls[0] && (urls[0].url || urls[0].hd || urls[0].download)));
  return {
    title: d.title || 'Video de Facebook',
    url: best,
    thumbnail: d.thumbnail || null
  };
}

// ---------- INSTAGRAM ----------
async function instagram(url) {
  const { data } = await axios.get(`${ALYA()}/dl/instagram`, {
    params: { url, key: ALYA_KEY() }, timeout: 30000
  });
  const d = data.result || data.data || data;
  if (!d) throw new Error('No se obtuvo resultado de Instagram.');
  const arr = Array.isArray(d) ? d : (d.url ? [d] : (d.urls || [d]));
  return arr.map(item => ({
    type: item.type || (/video/i.test(item.type || '') ? 'video' : 'image'),
    url: item.url || item.download || item
  }));
}

// ---------- TWITTER / X ----------
async function twitter(url) {
  const { data } = await axios.get(`${ALYA()}/dl/twitter`, {
    params: { url, key: ALYA_KEY() }, timeout: 30000
  });
  const d = data.result || data.data || data;
  if (!d) throw new Error('No se obtuvo resultado de Twitter/X.');
  return {
    title: d.title || d.text || 'Post de X',
    author: (d.author && (d.author.name || d.author.username)) || d.author || 'Desconocido',
    video: d.videos && d.videos[0] ? (d.videos[0].url || d.videos[0].hd) : (d.url || d.download),
    image: d.images && d.images[0] ? d.images[0] : (d.thumbnail || null)
  };
}

// ---------- MEDIAFIRE ----------
async function mediafire(url) {
  const { data } = await axios.get(`${ALYA()}/dl/mediafire`, {
    params: { url, key: ALYA_KEY() }, timeout: 30000
  });
  const d = data.result || data.data || data;
  if (!d || !(d.url || d.download || d.link)) throw new Error('No se obtuvo resultado de MediaFire.');
  return {
    title: d.title || d.filename || d.name || 'Archivo MediaFire',
    filename: d.filename || d.name || 'mediafire_file',
    size: d.size || d.filesize || '?',
    mime: d.mime || d.type || 'application/octet-stream',
    url: d.url || d.download || d.link
  };
}

// ---------- PINTEREST (búsqueda de imágenes) ----------
async function pinterest(query, limit = 8) {
  const { data } = await axios.get(`${ALYA()}/search/pinterest`, {
    params: { query, key: ALYA_KEY() }, timeout: 20000
  });
  const items = data.result || data.data || [];
  if (!items.length) throw new Error('No se encontraron imágenes en Pinterest para: ' + query);
  return items.map(item => (item.hd || item.original || item.url || item.image || item))
    .filter(u => typeof u === 'string' && u.startsWith('http'))
    .slice(0, limit);
}

// ---------- SPOTIFY ----------
async function spotifySearch(query, limit = 1) {
  const { data } = await axios.get(`${ALYA()}/search/spotify`, {
    params: { q: query, key: ALYA_KEY() }, timeout: 20000
  });
  const items = data.result || data.data || [];
  if (!items.length) throw new Error('No se encontraron resultados en Spotify.');
  return items.slice(0, limit);
}
async function spotifyDownload(url) {
  const { data } = await axios.get(`${ALYA()}/dl/spotify`, {
    params: { url, key: ALYA_KEY() }, timeout: 30000
  });
  const d = data.result || data.data || data;
  if (!d || !(d.url || d.download || d.audio)) throw new Error('No se pudo descargar de Spotify.');
  return { title: d.title || 'Canción de Spotify', artist: d.artist || '', url: d.url || d.download || d.audio };
}

// ---------- GIT CLONE ----------
async function gitClone(url) {
  // url: https://github.com/usuario/repo  o  usuario/repo
  let m = url.match(/(?:github\.com[:/])([^/]+\/[^/]+?)(?:\.git)?(?:$|[/?#])/i);
  if (!m) m = url.match(/^([^/\s]+\/[^/\s]+)$/);
  if (!m) throw new Error('URL de repositorio inválida. Ejemplo: https://github.com/usuario/repo');
  const repo = m[1].replace(/\.git$/, '');
  const zipUrl = `https://github.com/${repo}/archive/refs/heads/main.zip`;
  return { repo, zipUrl, name: repo.split('/')[1] };
}

// ---------- GOOGLE DRIVE ----------
async function gdrive(url) {
  const { data } = await axios.get(`${ALYA()}/dl/gdrive`, {
    params: { url, key: ALYA_KEY() }, timeout: 30000
  });
  const d = data.result || data.data || data;
  if (!d || !(d.url || d.download)) throw new Error('No se pudo descargar de Google Drive.');
  return {
    title: d.title || d.filename || 'Archivo Drive',
    filename: d.filename || 'gdrive_file',
    size: d.size || '?',
    mime: d.mime || 'application/octet-stream',
    url: d.url || d.download
  };
}

// ---------- APOK (APK) ----------
async function apkpure(query) {
  const { data } = await axios.get(`${ALYA()}/dl/apk`, {
    params: { q: query, key: ALYA_KEY() }, timeout: 30000
  });
  const d = data.result || data.data || data;
  if (!d || !(d.url || d.link || d.download)) throw new Error('No se encontró el APK.');
  return {
    title: d.title || d.name || query,
    name: d.name || d.title || query,
    url: d.url || d.link || d.download
  };
}

module.exports = {
  ytSearch, ytDownload,
  tiktok, facebook, instagram, twitter, mediafire,
  pinterest, spotifySearch, spotifyDownload,
  gitClone, gdrive, apkpure
};
