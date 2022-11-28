"use strict";
const axios = require("axios");
const moment = require("moment-timezone");
module.exports = function () {
    return {
        name: ['otd'],
        admin: false,
        description: 'Sends a historical event happened on the current day.',
        function: async function () {
            const [month, day] = moment.tz(moment(), 'Europe/Budapest').format('M/D').split('/');
            const options = {
                method: 'GET',
                url: `https://numbersapi.p.rapidapi.com/${month}/${day}/date`,
                params: { json: 'true' },
                headers: {
                    'X-RapidAPI-Key': 'fd46def047msh0a93e8a87537b61p1713e3jsn91e6e16f47c6',
                    'X-RapidAPI-Host': 'numbersapi.p.rapidapi.com'
                }
            };
            try {
                const response = await axios.request(options);
                return {
                    type: 'message',
                    message: JSON.stringify(response.data.text).slice(1, -1)
                };
            }
            catch (err) {
                throw (err);
            }
        }
    };
};
