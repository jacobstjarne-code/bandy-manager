// Engångsskript (Pass 1, CODE_KORORDER_GENOMGANG_2026-09-12 §2): konverterar
// alla public/assets/illustrations/*.jpg till .webp (kvalitet 80, max bredd
// 1170px) och raderar JPG-originalen. Körs en gång, inte del av build-pipen.
//
// Körning: node scripts/convert-illustrations.mjs

import sharp from 'sharp'
import { readdir, unlink, stat } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'

const DIR = join(process.cwd(), 'public/assets/illustrations')
const MAX_WIDTH = 1170
const QUALITY = 80

async function main() {
  const files = (await readdir(DIR)).filter(f => extname(f).toLowerCase() === '.jpg')
  if (files.length === 0) {
    console.log('Inga .jpg-filer hittades i', DIR)
    return
  }

  let totalBefore = 0
  let totalAfter = 0

  for (const file of files) {
    const srcPath = join(DIR, file)
    const destPath = join(DIR, `${basename(file, extname(file))}.webp`)

    const before = (await stat(srcPath)).size
    await sharp(srcPath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(destPath)
    const after = (await stat(destPath)).size

    totalBefore += before
    totalAfter += after
    console.log(`${file} → ${basename(destPath)}: ${(before / 1024).toFixed(0)} kB → ${(after / 1024).toFixed(0)} kB`)

    await unlink(srcPath)
  }

  console.log(`\nKlart. ${files.length} filer. ${(totalBefore / 1024 / 1024).toFixed(2)} MB → ${(totalAfter / 1024 / 1024).toFixed(2)} MB`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
