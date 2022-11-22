const execa = require('execa')

process.env.NODE_ENV = 'development'

async function runDev () {
  try {
    await execa('pnpm', ['run', 'dev', '--filter', './packages/vue3-example'])
  } catch (error) {
    console.log(error)
  }
}
runDev()
