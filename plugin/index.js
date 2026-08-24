/**
 * dsh-background-nakfaai — a self-contained DeepSeek Harness background skin.
 * Paints the left bar, main chat, and right workbench panel with per-zone
 * images, with a small picker (per-zone image + strength slider).
 *
 * Bundled images in ./assets are always available. Users may add their own
 * images via SIDEBAR_BG_DIR (a folder of .png/.jpg/.webp/.avif) — optional.
 */
import { readFile, readdir } from 'node:fs/promises'
import { resolve, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'sidebar-bg'
export const inject = ['webServer']

const ROUTE = '/sidebar-bg'
const ASSET_ROOT = resolve(fileURLToPath(new URL('./assets/', import.meta.url)))
// Optional extra image folder the user provides. Works without it (bundled assets only).
const BG_DIR = process.env.SIDEBAR_BG_DIR || null

const MIME = Object.freeze({
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.avif': 'image/avif', '.gif': 'image/gif',
})
const IMG_EXT = new Set(['.webp', '.png', '.jpg', '.jpeg', '.avif', '.gif'])

function safe(pathname) {
  const rel = pathname.replace(/^\/+/, '')
  if (!rel || !/^[a-zA-Z0-9_.-]+$/.test(rel)) return null
  return rel
}

async function serveAsset(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }); res.end(); return }
  const rel = safe(new URL(req.url ?? ROUTE, 'http://dsh.local').pathname.slice(ROUTE.length))
  if (!rel) { res.writeHead(404); res.end(); return }
  const full = resolve(ASSET_ROOT, rel)
  if (!full.startsWith(ASSET_ROOT)) { res.writeHead(403); res.end(); return }
  try {
    const buf = await readFile(full)
    const type = MIME[extname(rel).toLowerCase()] ?? 'application/octet-stream'
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' })
    res.end(req.method === 'HEAD' ? undefined : buf)
  } catch { res.writeHead(404); res.end() }
}

async function serveUserFile(req, res) {
  if (!BG_DIR) { res.writeHead(404); res.end(); return }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }); res.end(); return }
  const rel = safe(new URL(req.url ?? ROUTE, 'http://dsh.local').pathname.replace('/file/', '').slice(0))
  if (!rel) { res.writeHead(404); res.end(); return }
  const full = resolve(BG_DIR, rel)
  if (!full.startsWith(BG_DIR)) { res.writeHead(403); res.end(); return }
  try {
    const buf = await readFile(full)
    const type = MIME[extname(rel).toLowerCase()] ?? 'application/octet-stream'
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff' })
    res.end(req.method === 'HEAD' ? undefined : buf)
  } catch { res.writeHead(404); res.end() }
}

const extOf = (f) => extname(f).toLowerCase()

async function serveListing(req, res) {
  if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return }
  const bundled = (await readdir(ASSET_ROOT).catch(() => []))
    .filter((f) => IMG_EXT.has(extOf(f)))
    .map((f) => ({ name: f, url: '/sidebar-bg/' + encodeURIComponent(f) }))
  let user = []
  if (BG_DIR) {
    user = (await readdir(BG_DIR).catch(() => []))
      .filter((f) => IMG_EXT.has(extOf(f)))
      .map((f) => ({ name: f, url: '/sidebar-bg/file/' + encodeURIComponent(f) }))
  }
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' })
  res.end(JSON.stringify({ images: bundled.concat(user) }))
}

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/sidebar-bg/file', handler: serveUserFile }), 'sidebar-bg: user image files')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/sidebar-bg/list.json', handler: serveListing }), 'sidebar-bg: listing')
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: ROUTE, handler: serveAsset }), 'sidebar-bg: bundled asset')
}
