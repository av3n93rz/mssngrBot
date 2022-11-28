"use strict";
module.exports = function () {
    return {
        name: ['beszartam'],
        admin: false,
        description: '😏',
        function: function () {
            const options = [
                'el mentem a gatyo ba',
                '🍆💦👖',
                'bele mentem a gatyába',
                'beélveztem a nadrágba',
                'https://www.youtube.com/watch?v=RL9gWCiphVc',
            ];
            const i = (new Date()).getMinutes() % options.length;
            return {
                type: 'message',
                message: options[i]
            };
        }
    };
};
