"use strict";
const axios = require('axios');
const fs = require('fs');
module.exports = function () {
    return {
        name: ['fbvd'],
        admin: false,
        description: 'Facebook video download',
        function: async function (messageObj, query) {
            if (!query.startsWith('https://fb.watch/')) {
                throw new Error('Please provide a "https://fb.watch/*" url');
            }
            const saveName = Date.now();
            const path = `${__dirname}/../fbvd_tmp`;
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
            fs.readdirSync(path).forEach(file => {
                fs.unlink(`${path}/${file}`, err => {
                    if (err)
                        throw err;
                });
            });
            const videoURLRegex = /og:video:url" content="(.*?)"/gm;
            try {
                const response = await axios.get(query);
                const URL = videoURLRegex.exec(response.data)[1].replaceAll('&amp;', '&');
                const VideoBuffer = await axios.get(URL, {
                    responseType: 'arraybuffer'
                });
                await new Promise((resolve) => fs.appendFile(`${path}/${saveName}.mp4`, Buffer.from(VideoBuffer.data), (err) => {
                    if (err) {
                        throw (err);
                    }
                    else {
                        resolve();
                    }
                }));
                return {
                    type: 'image',
                    path: `${path}/${saveName}.mp4`
                };
            }
            catch (err) {
                throw (err);
            }
        }
    };
};
