const path = require('path');
const fs = require('fs');
require('dotenv').config()

module.exports = async function (bot) {
    try {
        await bot.login(process.env.FB_USERNAME, process.env.FB_PASSWORD)
      } catch (err) {
        console.error(`Error: ${err}`)
        process.exit(1)
      }

    fs.writeFileSync(
        path.join(__dirname, '.appstate.json'),
        JSON.stringify(await bot.getSession())
    )
}
