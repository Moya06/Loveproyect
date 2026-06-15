import { spawn } from 'child_process'
import http from 'http'

const server = spawn('node', ['index.js'], { cwd: process.cwd() })

let serverOutput = ''
server.stdout.on('data', (data) => {
  serverOutput += data.toString()
  console.log('[SERVER]', data.toString().trim())
})

server.stderr.on('data', (data) => {
  serverOutput += data.toString()
  console.error('[SERVER ERROR]', data.toString().trim())
})

const makeRequest = () => {
  const data = JSON.stringify({
    email: 'test' + Date.now() + '@test.com',
    password: '123456',
    name: 'Test User'
  })

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }

  const req = http.request(options, (res) => {
    let body = ''
    res.on('data', (chunk) => body += chunk)
    res.on('end', () => {
      console.log('\n[TEST] Status:', res.statusCode)
      console.log('[TEST] Response:', body)
      server.kill()
      process.exit(0)
    })
  })

  req.on('error', (err) => {
    console.error('[TEST] Request error:', err.message)
    server.kill()
    process.exit(1)
  })

  req.write(data)
  req.end()
}

setTimeout(makeRequest, 4000)

setTimeout(() => {
  console.error('[TEST] Timeout')
  server.kill()
  process.exit(1)
}, 10000)