const config = require('./.config.js');
const get_client = require('./get_client.js');
const login = require('./login.js');
const load_modules = require('./load_modules.js');
const bear = require('./bear.js');

(async () => {
  const bot = get_client()
  await login(bot)
  
  bot.id = bot.uid
  bot.admins = config.bot_admins
  bot.command_prefix = config.bot_command_prefix
  
  const { commands, commandMap} = load_modules(bot)

  bot.commands = commands
  bot.commandMap = {
    all: commandMap
  }
  
  bot.commandRequiresAdmin = function (commandStr) {
    return bot.commandMap.all[commandStr].admin
  }

  bot.listen(async message => {
    console.log('MESSAGE', message)
    //TODO: download attachments
    //console.log(JSON.stringify(message.attachments[0].mercury.blob_attachment.large_preview.uri))
    
    if (bear(message, bot) === true) return;
    if (!message.body.startsWith(config.bot_command_prefix)) return

    // Break down
    const tokens = message.body.split(' ')
    const commandStr = tokens[0]
      .toLowerCase()
      .replace(config.bot_command_prefix.toLowerCase(), '')

    /* if(commandStr === 'bin') {
      bot.sendBinary()
    } */

    // Check of the command exists
    if (commandStr in bot.commandMap.all) {
      // Check if the user has permission to run the command
      if (
        bot.commandRequiresAdmin(commandStr) &&
        bot.admins.indexOf(message.sender) === -1
      ) {
        bot.sendMessage(
          message.thread,
          'Error: You do not have permission to execute this command!'
        )
        console.info(`${message.sender} tried to execute \`${commandStr}\``)
        return
      }

      // Try run the command
      try {
        const response = await bot.commandMap.all[commandStr].function(
          message,
          tokens.slice(1).join(' ')
        )
        if (response) {
          if (typeof response === 'object') {
            if(response.type === 'message') {
              bot.sendMessage(message.thread, response.message)
              return
            }
            if(response.type === 'image') {
              bot.sendImage(message.thread, response.path)
              return
            }
          }

          bot.sendMessage(message.thread, response)
        }
      } catch (err) {
        console.log(err)
        bot.sendMessage(message.thread, `${err}`)
      }
    } else {
      // Command not found!!
    }
  })

  for (const commandStr in commands) {
    if (commands[commandStr].onPreLoad) {
      commands[commandStr].onPreLoad()
    }
  }
  for (const commandStr in commands) {
    if (commands[commandStr].onFinishLoad) {
      commands[commandStr].onFinishLoad()
    }
  }
  console.info('Loading complete')

  let _restartTime = (new Date().setHours(23, 59, 0, 0) - new Date())
  if (_restartTime < 0) _restartTime += 1000 * 60 * 60 * 24
  setTimeout(function () {
    console.log('Restarting bot... Time is ' + new Date())
    process.exit(137)
  }, _restartTime)
})()
