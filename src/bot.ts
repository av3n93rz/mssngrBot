import * as dotenv from 'dotenv';
import get_client from './get_client.js';
import login from './login.js';
import load_modules from './load_modules.js';
import bear from './bear.js';
import save_template from './save_template.js';

dotenv.config();

void (async () => {
  const bot = get_client();
  await login(bot);
  bot.id = bot.uid;
  bot.admins = JSON.parse(process.env.ADMINS);
  bot.command_prefix = process.env.BOT_COMMAND_PREFIX;

  const { commands, commandMap } = load_modules(bot);

  bot.commands = commands;
  bot.commandMap = commandMap;

  bot.commandRequiresAdmin = function (commandStr) {
    return bot.commandMap[commandStr].admin;
  };

  bot.listen(async (message) => {
    //TODO: download attachments
    if (bear(message, bot) === true) {
      return;
    }

    // Check if the message starts with the command prefix
    if (!message.body.startsWith(bot.command_prefix) && message.attachments.length === 0) {
      return;
    }

    // Break down
    const tokens = message.body.split(' ');
    const commandStr = tokens[0].toLowerCase().replace(bot.command_prefix.toLowerCase(), '');

    const template = await save_template(message, tokens.slice(1).join(' '), bot, commandStr);
    if (template) {
      return;
    }

    // Check of the command exists
    if (commandStr in bot.commandMap) {
      // Check if the user has permission to run the command
      if (bot.commandRequiresAdmin(commandStr) && bot.admins.indexOf(message.sender) === -1) {
        bot.sendMessage(message.thread, 'Error: You do not have permission to execute this command!');
        console.info(`${message.sender} tried to execute \`${commandStr}\``);
        return;
      }

      // Try run the command
      try {
        const response = await bot.commandMap[commandStr].function(message, tokens.slice(1).join(' '));
        if (response) {
          if (typeof response === 'object') {
            if (response.type === 'message') {
              bot.sendMessage(message.thread, response.message);
              return;
            }
            if (response.type === 'image') {
              bot.sendImage(message.thread, response.path);
              return;
            }
          }

          bot.sendMessage(message.thread, response);
        }
      } catch (err) {
        console.log(err);
        bot.sendMessage(message.thread, `${err}`);
      }
    } else {
      // Command not found!!
    }
  });

  for (const commandStr in commands) {
    if (commands[commandStr].onPreLoad) {
      commands[commandStr].onPreLoad();
    }
  }
  for (const commandStr in commands) {
    if (commands[commandStr].onFinishLoad) {
      commands[commandStr].onFinishLoad();
    }
  }
  console.info('Loading complete');

  let _restartTime = new Date().setHours(23, 59, 0, 0) - new Date();
  if (_restartTime < 0) {
    _restartTime += 1000 * 60 * 60 * 24;
  }
  setTimeout(function () {
    console.log(`Restarting bot... Time is ${new Date()}`);
    process.exit(137);
  }, _restartTime);
})();
