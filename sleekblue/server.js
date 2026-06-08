import express from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const LOG_FILE = join(__dirname, 'acceptance-log.json')

const app = express()
app.use(express.json())

function readLog() {
  if (!existsSync(LOG_FILE)) return []
  try { return JSON.parse(readFileSync(LOG_FILE, 'utf-8')) } catch { return [] }
}

function generateId() {
  return 'SBM-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase()
}

app.post('/api/accept-terms', (req, res) => {
  const records = readLog()
  const record = {
    acceptanceId: generateId(),
    timestamp: new Date().toISOString(),
    termsVersion: req.body.termsVersion || 'June 2026',
    customerName: req.body.customerName || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    ipAddress: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim(),
    userAgent: req.headers['user-agent'] || '',
  }
  records.push(record)
  writeFileSync(LOG_FILE, JSON.stringify(records, null, 2))
  console.log('[Terms] Acceptance recorded:', record.acceptanceId, '|', record.customerName, '|', record.timestamp)
  res.json({ ok: true, acceptanceId: record.acceptanceId })
})

app.get('/api/acceptance-log', (req, res) => {
  res.json(readLog())
})

const PORT = process.env.TERMS_PORT || 3001
app.listen(PORT, () => console.log(`Terms acceptance server running on port ${PORT}`))
