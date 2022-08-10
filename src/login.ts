import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
require('dotenv').config();

module.exports = async function (bot: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await bot.login(process.env.FB_USERNAME, process.env.FB_PASSWORD);
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  fs.writeFileSync(path.join(__dirname, '.appstate.json'), JSON.stringify(await bot.getSession()));
};
