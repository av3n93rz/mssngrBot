"use strict";
const wol = require('node-wol');
const config = require('../.config');
module.exports = function (api) {
    return {
        name: ['wol'],
        admin: true,
        description: 'Send a Wake-On-LAN Magic Packet',
        function: async function () {
            return new Promise(function (resolve, reject) {
                wol.wake(config.wol_mac, {
                    address: config.wol_address,
                    port: config.wol_port
                }, err => (err ? reject(err) : resolve('Sent WOL Magic Packet')));
            });
        }
    };
};
