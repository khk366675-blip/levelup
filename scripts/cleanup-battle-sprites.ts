import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

// BFS Flood Fill로 배경 투명화 처리
async function cleanupImage(inputPath: string, outputPath: string) {
  try {
    const image = sharp(inputPath)
    const metadata = await image.metadata()
    const width = metadata.width
    const height = metadata.height

    if (!width || !height) {
      throw new Error(`Invalid image dimensions for ${inputPath}`)
    }

    // Ensure image has 4 channels (RGBA)
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const channels = info.channels // Should be 4
    const visited = new Uint8Array(width * height)
    const queue: [number, number][] = []

    // Helper: checks if the pixel is part of the white/checkerboard background
    // Since backgrounds are near-white or light gray checker grids
    function isBackground(r: number, g: number, b: number) {
      const isGrayish = Math.abs(r - g) <= 12 && Math.abs(g - b) <= 12 && Math.abs(r - b) <= 12
      const isBright = r > 175 && g > 175 && b > 175
      return isGrayish && isBright
    }

    // Inject all border pixels as starting points for BFS
    for (let x = 0; x < width; x++) {
      // Top border
      if (visited[x] === 0) {
        visited[x] = 1
        queue.push([x, 0])
      }
      // Bottom border
      const bIdx = (height - 1) * width + x
      if (visited[bIdx] === 0) {
        visited[bIdx] = 1
        queue.push([x, height - 1])
      }
    }
    for (let y = 0; y < height; y++) {
      // Left border
      const lIdx = y * width
      if (visited[lIdx] === 0) {
        visited[lIdx] = 1
        queue.push([0, y])
      }
      // Right border
      const rIdx = y * width + (width - 1)
      if (visited[rIdx] === 0) {
        visited[rIdx] = 1
        queue.push([width - 1, y])
      }
    }

    // BFS Queue execution
    let head = 0
    while (head < queue.length) {
      const [cx, cy] = queue[head++]
      const idx = (cy * width + cx) * channels
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      if (isBackground(r, g, b)) {
        // Set alpha channel to 0 (fully transparent)
        data[idx + 3] = 0

        // Push 4-way neighbors
        const dirs = [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0]
        ]
        for (const [dx, dy] of dirs) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx
            if (visited[nIdx] === 0) {
              visited[nIdx] = 1
              queue.push([nx, ny])
            }
          }
        }
      }
    }

    // Write back to clean PNG image file
    await sharp(data, {
      raw: {
        width,
        height,
        channels: 4
      }
    })
      .png()
      .toFile(outputPath)

    console.log(`[SUCCESS] Cleaned image generated: ${outputPath}`)
  } catch (err) {
    console.error(`[ERROR] Failed to clean image ${inputPath}:`, err)
  }
}

async function runCleanup() {
  console.log('Starting battle sprites background transparency cleanup...')

  const hunterDir = 'src/assets/battle/hunters'
  const monsterDir = 'src/assets/battle/monsters'

  // 1. Process Hunters (10 items)
  const hunterFiles = [
    'hunter-base.png.png',
    'hunter-swordsman.png.png',
    'hunter-warrior.png.png',
    'hunter-mage.png.png',
    'hunter-guardian.png.png',
    'hunter-tracker.png.png',
    'hunter-tactician.png.png',
    'hunter-hidden-shadow.png.png',
    'hunter-hidden-curse.png.png',
    'hunter-hidden-rift.png.png'
  ]

  for (const file of hunterFiles) {
    const inputPath = path.join(hunterDir, file)
    // We create hunter-*-clean.png
    const cleanFileName = file.replace('.png.png', '-clean.png')
    const outputPath = path.join(hunterDir, cleanFileName)
    await cleanupImage(inputPath, outputPath)
  }

  // 2. Process Monsters (10 items)
  const monsterFiles = [
    'monster-rift-minion.png',
    'monster-rift-bruiser.png',
    'monster-rift-tank.png',
    'monster-rift-caster.png',
    'monster-beast-assault.png',
    'monster-undead-warrior.png',
    'monster-rift-mender.png',
    'monster-memory-disruptor.png',
    'boss-riftlord.png',
    'boss-warden.png'
  ]

  for (const file of monsterFiles) {
    const inputPath = path.join(monsterDir, file)
    const cleanFileName = file.replace('.png', '-clean.png')
    const outputPath = path.join(monsterDir, cleanFileName)
    await cleanupImage(inputPath, outputPath)
  }

  console.log('Background transparency cleanup finished successfully!')
}

runCleanup()
