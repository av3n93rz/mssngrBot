"use strict";
let ignore = {};
module.exports = async function (message, bot) {
    const timerIgnore = () => setTimeout(() => {
        delete ignore[message.thread];
    }, 60 * 1000);
    // setTimeout returns an object in Node.js
    if (typeof ignore[message.thread] === 'object') {
        if (/nem/gi.test(message.body)) {
            clearTimeout(ignore[message.thread]);
            timerIgnore();
            ignore[message.thread] = true;
            await bot.sendMessage(message.thread, 'Ohh, oké :(');
            return true;
        }
        if (/igen/gi.test(message.body)) {
            clearTimeout(ignore[message.thread]);
            timerIgnore();
            ignore[message.thread] = true;
            await bot.sendMessage(message.thread, '😘');
            return true;
        }
    }
    if (/\s*F\s*e\s*r\s*i/gi.test(message.body)) {
        if (ignore[message.thread] !== true) {
            ignore[message.thread] = timerIgnore();
            await bot.sendMessage(message.thread, 'Ki, én?');
            return true;
        }
    }
};
