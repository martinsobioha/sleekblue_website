import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import process from 'node:process'

const serverEnv = {
  ...process.env,
  PORT: '3101',
  JWT_SECRET: 'test-secret-for-smoke-tests',
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'TestPass123!',
}

test('server exposes a health endpoint and responds successfully', async () => {
  const server = spawn(process.execPath, ['server.js'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let output = ''
  server.stdout.on('data', chunk => { output += chunk.toString() })
  server.stderr.on('data', chunk => { output += chunk.toString() })

  try {
    let started = false
    for (let i = 0; i < 50; i += 1) {
      const response = await fetch('http://127.0.0.1:3101/health').catch(() => null)
      if (response?.ok) {
        started = true
        break
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    assert.equal(started, true, `server did not start: ${output}`)
    const res = await fetch('http://127.0.0.1:3101/health')
    const body = await res.json()
    assert.equal(res.status, 200)
    assert.equal(body.status, 'ok')
  } finally {
    server.kill('SIGTERM')
    await once(server, 'exit').catch(() => {})
  }
})
