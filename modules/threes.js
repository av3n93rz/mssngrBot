const { spawn } = require('child_process')
const config = require('../.config')

let entryPoint = config.threes_path
let singleton = null;

module.exports = function (api) {
  return {
    name: ['threes'],
    admin: true,
    description: '[Andrew Only] Update Instagram grid spacer',
    function: async function (messageObj, str) {
      return new Promise((resolve, reject) => {
        let chunks = []

        if (singleton) {
            singleton.kill()
            singleton = null
        }

        singleton = spawn(entryPoint)

        singleton.stdout.on('data', data => chunks.push(data))

        singleton.on('close', code => {
          console.log(`child process close all stdio with code ${code}`)
          resolve(Buffer.concat(chunks).toString())
        })
      })
    }
  }
}
