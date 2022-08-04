const path = require('path');
const fs = require('fs');
const config = require('./.config.js');

module.exports = async function (bot) {
    try {
        await bot.login(config.facebook_username, config.facebook_password)
      } catch (err) {
        console.error(`Error: ${err}`)
        process.exit(1)
      }

    fs.writeFileSync(
        path.join(__dirname, '.appstate.json'),
        JSON.stringify(await bot.getSession())
    )
}
