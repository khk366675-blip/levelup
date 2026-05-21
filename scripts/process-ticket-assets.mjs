/**
 * process-ticket-assets.mjs
 *
 * Removes baked-in white / light checkerboard backgrounds from shop ticket PNGs.
 *
 * Input:  src/assets/tickets/*.png  (includes *.png.png double-ext)
 * Backup: src/assets/tickets_backup/ (originals preserved here)
 * Output: same path as input, same dimensions and filenames
 *
 * Usage:
 *   npm run process-tickets
 *   npm run process-tickets-dry
 *   node scripts/process-ticket-assets.mjs
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'src', 'assets', 'tickets')
const BCK_DIR = path.join(ROOT, 'src', 'assets', 'tickets_backup')

const DRY_RUN = process.argv.includes('--dry-run')
const CHANNELS = 4
const LIGHTNESS_FLOOR = 155
const NEUTRALITY_THRESHOLD = 48
const FEATHER_RADIUS = 1

const TARGET_NAMES = new Set([
  'ticket-shadow-normal.png',
  'ticket-shadow-premium.png',
  'ticket-equipment-weapon.png',
  'ticket-equipment-armor.png',
  'ticket-equipment-accessory.png',
  'ticket-equipment-relic.png',
  'ticket-equipment-rare.png',
  'ticket-equipment-choice-bundle.png',
  'pack-shadow-essence-small.png',
  'pack-shadow-premium-shards.png',
  'pack-shadow-shards.png',
  'exchange-essence-gold-to-shard.png',
])

function canonicalName(fileName) {
  return fileName.toLowerCase().replace(/\.png\.png$/, '.png')
}

function isTargetTicket(fileName) {
  return TARGET_NAMES.has(canonicalName(fileName))
}

function isBackground(r, g, b, a) {
  if (a < 128) return true
  if (r < LIGHTNESS_FLOOR || g < LIGHTNESS_FLOOR || b < LIGHTNESS_FLOOR) return false
  return Math.max(r, g, b) - Math.min(r, g, b) <= NEUTRALITY_THRESHOLD
}

function floodFillBackground(buf, w, h) {
  const visited = new Uint8Array(w * h)
  const queue = []

  const trySeed = (x, y) => {
    const idx = y * w + x
    if (visited[idx]) return
    const p = idx * CHANNELS
    if (!isBackground(buf[p], buf[p + 1], buf[p + 2], buf[p + 3])) return
    visited[idx] = 1
    queue.push(idx)
  }

  for (let x = 0; x < w; x++) {
    trySeed(x, 0)
    trySeed(x, h - 1)
  }
  for (let y = 1; y < h - 1; y++) {
    trySeed(0, y)
    trySeed(w - 1, y)
  }

  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    const p = idx * CHANNELS
    buf[p + 3] = 0

    const x = idx % w
    const y = Math.floor(idx / w)
    const neighbours = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]

    for (const [nx, ny] of neighbours) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const nidx = ny * w + nx
      if (visited[nidx]) continue
      const np = nidx * CHANNELS
      if (!isBackground(buf[np], buf[np + 1], buf[np + 2], buf[np + 3])) continue
      visited[nidx] = 1
      queue.push(nidx)
    }
  }

  return queue.length
}

function featherEdges(buf, w, h, radius = FEATHER_RADIUS) {
  const alpha = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) alpha[i] = buf[i * CHANNELS + 3]

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      if (alpha[idx] === 0) continue

      let transparent = 0
      let total = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          total++
          if (alpha[ny * w + nx] === 0) transparent++
        }
      }

      if (transparent === 0) continue
      const p = idx * CHANNELS
      const neutralLight = isBackground(buf[p], buf[p + 1], buf[p + 2], 255)
      const ratio = neutralLight ? 0.35 : 0.78
      buf[p + 3] = Math.round(buf[p + 3] * ratio)
    }
  }
}

function backupFile(srcPath) {
  const rel = path.relative(SRC_DIR, srcPath)
  const dstPath = path.join(BCK_DIR, rel)
  fs.mkdirSync(path.dirname(dstPath), { recursive: true })
  if (fs.existsSync(dstPath)) return false
  fs.copyFileSync(srcPath, dstPath)
  return true
}

function collectTicketPNGs(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.png') && isTargetTicket(entry.name))
    .map(entry => path.join(dir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
}

async function processImage(filePath) {
  const { data: buf, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width: w, height: h } = info
  const removedPx = floodFillBackground(buf, w, h)
  featherEdges(buf, w, h)

  const processed = await sharp(Buffer.from(buf), {
    raw: { width: w, height: h, channels: CHANNELS },
  })
    .png({ compressionLevel: 8 })
    .toBuffer()

  return { processed, removedPx, origW: w, origH: h }
}

async function main() {
  console.log('\n=== Ticket Asset Processor ===')
  console.log(`Input dir : ${SRC_DIR}`)
  console.log(`Backup dir: ${BCK_DIR}`)
  console.log('Output    : in-place PNG, dimensions and filenames preserved')
  if (DRY_RUN) console.log('DRY RUN   : no files will be written\n')
  else console.log()

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`ERROR: Source directory not found: ${SRC_DIR}`)
    process.exit(1)
  }

  const files = collectTicketPNGs(SRC_DIR)
  console.log(`Found ${files.length} target PNG file(s)\n`)

  let ok = 0
  let skipped = 0
  let failed = 0

  for (const file of files) {
    const name = path.relative(SRC_DIR, file)
    try {
      if (DRY_RUN) {
        const { removedPx, origW, origH } = await processImage(file)
        console.log(`[DRY] ${name} (${origW}x${origH}, would remove ${removedPx.toLocaleString()} bg px)`)
        ok++
        continue
      }

      backupFile(file)
      const { processed, removedPx, origW, origH } = await processImage(file)
      if (removedPx === 0) {
        console.log(`[SKIP] No connected bright background detected: ${name} (${origW}x${origH})`)
        skipped++
        continue
      }

      fs.writeFileSync(file, processed)
      console.log(`[OK]   ${name} (${origW}x${origH}, removed ${removedPx.toLocaleString()} bg px)`)
      ok++
    } catch (err) {
      console.error(`[ERR]  ${name}: ${err.message}`)
      failed++
    }
  }

  console.log('\n--------------------------------')
  console.log(`Done - OK: ${ok}  skipped: ${skipped}  failed: ${failed}`)
  if (!DRY_RUN) {
    console.log(`Originals backed up to: ${BCK_DIR}`)
    console.log("Run 'npm run build' to bundle the processed ticket images.")
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
