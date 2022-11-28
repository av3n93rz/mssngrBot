"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
require('dotenv').config();
module.exports = async function (bot) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await bot.login(process.env.FB_USERNAME, process.env.FB_PASSWORD);
    }
    catch (err) {
        console.error(`Error: ${err}`);
        process.exit(1);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    fs_1.default.writeFileSync(path_1.default.join(__dirname, '.appstate.json'), JSON.stringify(await bot.getSession()));
};
