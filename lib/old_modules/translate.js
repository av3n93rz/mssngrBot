"use strict";
const translate = require('@k3rn31p4nic/google-translate-api');
const messageHistory = new (class {
    constructor() { this.history = []; }
    push(d) { if (this.history.length == 30)
        this.history = this.history.slice(1); this.history.push(d); }
})();
module.exports = function (api) {
    return {
        name: ['translate', 'nani', 'what'],
        admin: false,
        description: 'Sorry I only speak English',
        function: async function (messageObj, inputStr) {
            if (!inputStr.trim()) {
                inputStr = messageHistory.history.filter(msg => !msg.startsWith(api.command_prefix) && msg.replace(/[\x00-\x7E]/g, '').length).pop();
                if (!inputStr)
                    throw Error('No input provided to translate!');
            }
            const res = await translate(inputStr, { to: 'en' });
            // There's nothing interesting in the getThreadInfo function
            return '`(' + res.from.language.iso + ')` ' + inputStr.replace('\n', ' ').trim() + '\n' +
                '`(en)` ' + res.text.replace('\n', ' ').trim();
        },
        onFinishLoad: function () {
            api.listen(function (message) {
                if (api.id == message.sender)
                    return;
                if (message.message)
                    messageHistory.push(message.message);
            });
        }
    };
};
