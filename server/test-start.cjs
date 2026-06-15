const { execSync } = require('child_process')
const fs = require('fs')

try {
  console.log('Probando servidor...')
  const output = execSync('node index.js', { 
    cwd: __dirname, 
    timeout: 3000,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  })
  console.log(output)
} catch (err) {
  console.log('STDOUT:', err.stdout)
  console.log('STDERR:', err.stderr)
  console.log('Exit code:', err.status)
  console.log('Signal:', err.signal)
}