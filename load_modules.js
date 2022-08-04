const path = require('path');
const fs = require('fs');

const _modules = [
    'help',
    'euro',
    'rng_range',
    'rng_choice',
    'lmgtfy',
    'permissions',
    'cointoss',
    'ping',
    'yorn',
    'beszartam'
  ]

module.exports = function (bot) {
    const commands = {}

    for (const module of _modules) {
      try {
        commands[module] = require(path.join(
          __dirname,
          'modules',
          module
        ))(bot)
      } catch (e) {
        console.error(`Could not load \`${module}.js\``)
        console.log(e)
      }
    }
    
    const commandMap = {}
    
    for (const commandStr in commands) {
        for (const name of commands[commandStr].name) {
            commandMap[name.toLowerCase()] = commands[commandStr]
        }
    }
    
    fs.readdirSync('./images').forEach(file => {
        const [name] = file.split('.')
        commandMap[name] = {
            ...(require(path.join(
            __dirname,
            'modules',
            'img'
            ))(bot)),
            name: [ name ],
        }
    });

    return {commands, commandMap}
}
