/**
 * process-shadow-portraits.mjs
 *
 * Removes checkerboard backgrounds from AI-generated shadow portrait PNGs,
 * trims empty space, adds padding, and normalises size to 512×768.
 *
 * Input:  src/assets/shadows/**\/*.png  (includes *.png.png double-ext)
 * Backup: src/assets/shadows_backup/   (originals preserved here)
 * Output: same path as input (in-place overwrite after backup)
 *
 * Usage:
 *   npm run process-portraits
 *   node scripts/process-shadow-portraits.mjs
 *   node scripts/process-shadow-portraits.mjs --dry-run   (preview only)
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')
const SRC_DIR   = path.join(ROOT, 'src', 'assets', 'shadows')
const BCK_DIR   = path.join(ROOT, 'src', 'assets', 'shadows_backup')

const DRY_RUN   = process.argv.includes('--dry-run')
const TARGET_W  = 512
const TARGET_H  = 768
const PAD_RATIO = 0.07   // 7% padding on each side after trim
const CHANNELS  = 4      // RGBA

// ──────────────────────────────────────────────────────────────────────────────
// Background-colour detection
// A pixel is considered "background" if it is light-grey or white and neutral.
// Threshold is intentionally generous (covers common AI checkerboard variants).
// ──────────────────────────────────────────────────────────────────────────────
function isBackground(r, g, b, a, lightnessFloor = 165, neutralityThresh = 40) {
  if (a < 128) return true           // already transparent → skip
  if (r < lightnessFloor || g < lightnessFloor || b < lightnessFloor) return false
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return (max - min) < neutralityThresh  // neutral gray / white
}

// ──────────────────────────────────────────────────────────────────────────────
// BFS flood-fill from image edges — marks connected background pixels α=0
// ──────────────────────────────────────────────────────────────────────────────
function floodFillBackground(buf, w, h) {
  const visited = new Uint8Array(w * h)
  const queue   = []

  // Seed from the 4 edges (not just corners) for robustness
  for (let x = 0; x < w; x++) {
    for (const y of [0, h - 1]) {
      const idx = y * w + x
      const p   = idx * CHANNELS
      if (!visited[idx] && isBackground(buf[p], buf[p+1], buf[p+2], buf[p+3])) {
        visited[idx] = 1
        queue.push(idx)
      }
    }
  }
  for (let y = 1; y < h - 1; y++) {
    for (const x of [0, w - 1]) {
      const idx = y * w + x
      const p   = idx * CHANNELS
      if (!visited[idx] && isBackground(buf[p], buf[p+1], buf[p+2], buf[p+3])) {
        visited[idx] = 1
        queue.push(idx)
      }
    }
  }

  // BFS
  let head = 0
  while (head < queue.length) {
    const idx = queue[head++]
    const p   = idx * CHANNELS
    buf[p+3]  = 0  // alpha → fully transparent

    const x = idx % w
    const y = Math.floor(idx / w)

    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const nidx = ny * w + nx
      if (visited[nidx]) continue
      const np = nidx * CHANNELS
      if (isBackground(buf[np], buf[np+1], buf[np+2], buf[np+3])) {
        visited[nidx] = 1
        queue.push(nidx)
      }
    }
  }

  return queue.length  // number of pixels removed
}

// ──────────────────────────────────────────────────────────────────────────────
// Soft-edge feathering — reduces harsh pixel edges at character boundary
// ──────────────────────────────────────────────────────────────────────────────
function featherEdges(buf, w, h, radius = 2) {
  const alphaOrig = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) alphaOrig[i] = buf[i * CHANNELS + 3]

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      if (alphaOrig[idx] === 0) continue   // skip already-transparent pixels

      // Count transparent neighbours within radius
      let transparentNeighbours = 0
      let totalNeighbours = 0
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          totalNeighbours++
          if (alphaOrig[ny * w + nx] === 0) transparentNeighbours++
        }
      }

      // Feather: reduce alpha proportionally near the edge
      if (transparentNeighbours > 0) {
        const ratio = 1 - (transparentNeighbours / totalNeighbours) * 0.5
        buf[idx * CHANNELS + 3] = Math.round(buf[idx * CHANNELS + 3] * ratio)
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Copy file to backup location
// ──────────────────────────────────────────────────────────────────────────────
function backupFile(srcPath) {
  const rel     = path.relative(SRC_DIR, srcPath)
  const dstPath = path.join(BCK_DIR, rel)
  fs.mkdirSync(path.dirname(dstPath), { recursive: true })
  if (!fs.existsSync(dstPath)) {
    fs.copyFileSync(srcPath, dstPath)
    return true
  }
  return false   // backup already exists
}

// ──────────────────────────────────────────────────────────────────────────────
// Collect all PNG files (including *.png.png)
// ──────────────────────────────────────────────────────────────────────────────
function collectPNGs(dir) {
  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectPNGs(full))
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      results.push(full)
    }
  }
  return results
}

// ──────────────────────────────────────────────────────────────────────────────
// Process a single image
// ──────────────────────────────────────────────────────────────────────────────
async function processImage(filePath) {
  const rel = path.relative(ROOT, filePath)

  // 1. Load as RGBA raw buffer
  const img      = sharp(filePath)
  const meta     = await img.metadata()
  const { data: buf, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width: w, height: h } = info

  // 2. Flood-fill background removal
  const removedPx = floodFillBackground(buf, w, h)

  // 3. Light feathering on character edges
  featherEdges(buf, w, h, 2)

  // 4. Rebuild image with sharp → trim → pad → resize
  const padPx = Math.round(Math.min(w, h) * PAD_RATIO)

  const processed = await sharp(Buffer.from(buf), {
    raw: { width: w, height: h, channels: CHANNELS },
  })
    .trim({ threshold: 12 })
    .extend({
      top:    padPx,
      bottom: padPx,
      left:   padPx,
      right:  padPx,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(TARGET_W, TARGET_H, {
      fit:        'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 8 })
    .toBuffer()

  return { processed, removedPx, origW: w, origH: h }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n=== Shadow Portrait Processor ===`)
  console.log(`Input dir : ${SRC_DIR}`)
  console.log(`Backup dir: ${BCK_DIR}`)
  console.log(`Output    : in-place (${TARGET_W}×${TARGET_H} PNG)`)
  if (DRY_RUN) console.log(`DRY RUN   : no files will be written\n`)
  else          console.log()

  if (!fs.existsSync(SRC_DIR)) {
    console.error(`ERROR: Source directory not found: ${SRC_DIR}`)
    process.exit(1)
  }

  const files = collectPNGs(SRC_DIR)
  console.log(`Found ${files.length} PNG file(s)\n`)

  let ok = 0, skipped = 0, failed = 0

  for (const file of files) {
    const name = path.relative(SRC_DIR, file)
    try {
      if (!DRY_RUN) {
        const backed = backupFile(file)
        if (!backed) {
          // Backup already exists — safe to overwrite output
        }
      }

      if (DRY_RUN) {
        console.log(`[DRY] Would process: ${name}`)
        ok++
        continue
      }

      const { processed, removedPx, origW, origH } = await processImage(file)

      if (removedPx === 0) {
        console.log(`[SKIP] No background detected: ${name} (${origW}×${origH})`)
        skipped++
        continue
      }

      fs.writeFileSync(file, processed)
      console.log(`[OK]   ${name}  (${origW}×${origH} → ${TARGET_W}×${TARGET_H}, removed ${removedPx.toLocaleString()} bg px)`)
      ok++
    } catch (err) {
      console.error(`[ERR]  ${name}: ${err.message}`)
      failed++
    }
  }

  console.log(`\n─────────────────────────────────`)
  console.log(`Done — OK: ${ok}  skipped: ${skipped}  failed: ${failed}`)
  if (!DRY_RUN && ok > 0) {
    console.log(`Originals backed up to: ${BCK_DIR}`)
    console.log(`Run 'npm run build' to bundle the processed images.`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
