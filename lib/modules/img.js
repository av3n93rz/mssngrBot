"use strict";
const fs = require('fs');
module.exports = function () {
    return {
        name: ['image'],
        admin: false,
        description: 'Sends an image',
        function: function (messageObj, query) {
            const imgName = messageObj.body.replace('/', '');
            const files = fs.readdirSync('./images');
            for (const file of files) {
                const [name] = file.split('.');
                if (name === imgName) {
                    return {
                        type: 'image',
                        path: `./images/${file}`
                    };
                }
            }
            return {
                type: 'message',
                message: 'Image not found!'
            };
        }
    };
};
