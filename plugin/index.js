/**
 * dsh-background-nakfaai — a self-contained DeepSeek Harness background skin.
 * Paints the left bar, main chat, and right workbench panel with per-zone
 * images, with a small picker (per-zone image + strength slider).
 *
 * Bundled images in ./assets are always available. Any images dropped into
 * ~/.dsh/background are picked up automatically. More folders can be added
 * read-only through the `sidebar-bg.json` config file (see CONFIG_FILE below),
 * so the picker can browse images that already live in Pictures/Downloads/... .
 */
import { readFile, readdir } from 'node:fs/promises'
import { resolve, extname, join, sep, delimiter } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

export const name = 'sidebar-bg'
export const inject = ['webServer']

const ROUTE = '/sidebar-bg'
const ASSET_ROOT = resolve(fileURLToPath(new URL('./assets/', import.meta.url)))
// User images: default to ~/.dsh/background (a folder DSH users already have);
// SIDEBAR_BG_DIR overrides it. A missing folder is fine — bundled assets only.
const BG_DIR = process.env.SIDEBAR_BG_DIR || join(homedir(), '.dsh', 'background')
// Extra read-only roots, so the picker can browse images that already live in
// Pictures/Downloads/anywhere. Deliberately NOT an env var: a bundle patch
// cannot set process env for the host, so an env-only switch would be
// unreachable in practice. Read from a small JSON file instead, and accepted
// from SIDEBAR_BG_DIRS as an override for scripted use.
const CONFIG_FILE = join(homedir(), '.dsh', 'sidebar-bg.json')

/** Split a directory list on the OS path delimiter (`:` on POSIX). */
function splitDirs(value) {
  return String(value || '')
    .split(delimiter)
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => (d.startsWith('~') ? join(homedir(), d.slice(1)) : d))
    .map((d) => resolve(d))
}

/** Extra roots from the config file, plus any SIDEBAR_BG_DIRS override. */
async function readExtraDirs() {
  let fromFile = []
  try {
    const raw = JSON.parse(await readFile(CONFIG_FILE, 'utf8'))
    // Accept a bare array or { "dirs": [...] }.
    fromFile = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.dirs) ? raw.dirs : [])
  } catch { /* missing or malformed config is fine: bundled + default only */ }
  const fromEnv = splitDirs(process.env.SIDEBAR_BG_DIRS)
  // Deduplicate, and never let an extra root shadow the writable default.
  const seen = new Set([BG_DIR])
  const out = []
  for (const dir of fromFile.concat(fromEnv)) {
    const abs = String(dir || '').trim()
    if (!abs || seen.has(abs)) continue
    seen.add(abs)
    out.push(abs)
  }
  return out
}

/** Every directory the picker may list from: the writable default, then extras. */
async function roots() {
  return [BG_DIR, ...(await readExtraDirs())]
}

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
  if (!rel || !IMG_EXT.has(extname(rel).toLowerCase())) { res.writeHead(404); res.end(); return }
  const full = resolve(ASSET_ROOT, rel)
  if (!full.startsWith(ASSET_ROOT + sep)) { res.writeHead(403); res.end(); return }
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
  // URL form: a bare file name (the writable default dir) or "rootIndex/file".
  const raw = new URL(req.url ?? ROUTE, 'http://dsh.local').pathname.slice('/sidebar-bg/file/'.length)
  const cut = raw.indexOf('/')
  const rootIndex = cut === -1 ? 0 : Number(raw.slice(0, cut))
  const rel = safe(cut === -1 ? raw : raw.slice(cut + 1))
  const all = await roots()
  // Images only. Without this the route serves ANY file in the roots — a .env, a
  // key, notes.txt — to any local client that asks for it.
  if (!rel || !Number.isInteger(rootIndex) || rootIndex < 0 || rootIndex >= all.length) { res.writeHead(404); res.end(); return }
  if (!IMG_EXT.has(extname(rel).toLowerCase())) { res.writeHead(404); res.end(); return }
  const root = all[rootIndex]
  const full = resolve(root, rel)
  if (!full.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
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
  // One group per root, so the picker can show ~/.dsh/background, Pictures,
  // Downloads, ... side by side instead of a single flat list.
  const groups = await Promise.all((await roots()).map(async (root, index) => ({
    index,
    dir: root,
    images: (await readdir(root).catch(() => []))
      .filter((f) => IMG_EXT.has(extOf(f)) && !f.startsWith('.'))
      .map((f) => ({ name: f, url: '/sidebar-bg/file/' + index + '/' + encodeURIComponent(f) })),
  })))
  const user = groups.flatMap((g) => g.images)
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-cache' })
  res.end(JSON.stringify({ dir: BG_DIR || null, roots: groups, images: bundled.concat(user) }))
}

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/sidebar-bg/file', handler: serveUserFile }), 'sidebar-bg: user image files')
  ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/sidebar-bg/list.json', handler: serveListing }), 'sidebar-bg: listing')
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: ROUTE, handler: serveAsset }), 'sidebar-bg: bundled asset')
}
