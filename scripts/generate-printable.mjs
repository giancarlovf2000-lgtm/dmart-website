/**
 * generate-printable.mjs
 *
 * Generates a printable PDF for each public page of the D'Mart website.
 * Usage:
 *   node scripts/generate-printable.mjs [BASE_URL]
 *
 * Example:
 *   node scripts/generate-printable.mjs https://dmart.edu.pr
 *   node scripts/generate-printable.mjs http://localhost:3000
 *
 * Output: printable/ folder with one PDF per page.
 *
 * First run: npm install puppeteer --no-save
 */

import puppeteer from 'puppeteer'
import { mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.argv[2] || 'http://localhost:3000'
const OUT_DIR = join(__dirname, '..', 'printable')

const PAGES = [
  { path: '/',                       name: '01_inicio' },
  { path: '/programas',              name: '02_programas' },
  { path: '/recintos',               name: '03_recintos' },
  { path: '/admisiones',             name: '04_admisiones' },
  { path: '/servicios-estudiantiles',name: '05_servicios_estudiantiles' },
  { path: '/preguntas-frecuentes',   name: '06_preguntas_frecuentes' },
  { path: '/privados-sabatinos',     name: '07_privados_sabatinos' },
  { path: '/sobre-nosotros',         name: '08_sobre_nosotros' },
  { path: '/contactanos',            name: '09_contactanos' },
  { path: '/catalogo',               name: '10_catalogo' },
  { path: '/egresados',              name: '11_egresados' },
]

async function run() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  console.log(`\n📄 Generating PDFs from ${BASE_URL}`)
  console.log(`📁 Output folder: ${OUT_DIR}\n`)

  for (const { path, name } of PAGES) {
    const url = BASE_URL + path
    const outFile = join(OUT_DIR, `${name}.pdf`)
    process.stdout.write(`  • ${path.padEnd(28)} `)

    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1280, height: 900 })
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

      // Wait a bit for any animations/lazy loads
      await new Promise((r) => setTimeout(r, 1500))

      await page.pdf({
        path: outFile,
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
      })

      await page.close()
      console.log('✅')
    } catch (err) {
      console.log(`❌  ${err.message}`)
    }
  }

  await browser.close()
  console.log(`\n✅ Done! Open the printable/ folder to find your PDFs.\n`)
}

run().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
