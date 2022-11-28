"use strict";
module.exports = function (api) {
    return {
        name: ['choice'],
        admin: false,
        description: 'Consult the mystical RNG!11oneone',
        function: function (messageObj, str) {
            if (!(str = str.trim()))
                throw Error('No input');
            let elems;
            if (str.includes(',')) {
                elems = str.split(',');
            }
            else {
                elems = str.split(' ');
            }
            const chosen = decodeURIComponent(escape(elems[Math.floor(Math.random() * elems.length)]));
            return {
                type: 'message',
                message: 'RNG has chosen ' + chosen + '!'
            };
        }
    };
};
