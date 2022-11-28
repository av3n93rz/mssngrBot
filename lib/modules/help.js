"use strict";
module.exports = function (api) {
    return {
        name: ['help'],
        admin: false,
        description: 'Provides help',
        function: function (messageObj) {
            const builder = ['Commands', '-------------'];
            for (const commandStr of Object.keys(api.commandMap).sort()) {
                if (api.commandRequiresAdmin(commandStr) && api.admins.indexOf(messageObj.authorId) == -1)
                    continue;
                builder.push(`\`${api.command_prefix}${commandStr}\` - ${api.commandMap[commandStr].description}`);
            }
            const msg = builder.join('\u000a');
            return {
                type: 'message',
                message: msg
            };
        }
    };
};
