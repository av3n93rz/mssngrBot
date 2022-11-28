"use strict";
const path = require('path');
const fs = require('fs');
const Client = require('./api');
module.exports = function () {
    return new Client({
        selfListen: true,
        session: fs.existsSync(path.join(__dirname, '.appstate.json'))
            ? JSON.parse(fs.readFileSync(path.join(__dirname, '.appstate.json'), 'utf8'))
            : null
    });
};
