"use strict";
const request = require('request');
const moment = require('moment-timezone');
const config = require('../.config');
let _life360_request_;
let _life360_ready = false;
if (config.life360_enable) {
    request({
        url: 'https://api.life360.com/v3/oauth2/token.json',
        method: 'POST',
        headers: {
            Authorization: 'Basic cFJFcXVnYWJSZXRyZTRFc3RldGhlcnVmcmVQdW1hbUV4dWNyRUh1YzptM2ZydXBSZXRSZXN3ZXJFQ2hBUHJFOTZxYWtFZHI0Vg=='
        },
        json: true,
        form: {
            grant_type: 'password',
            username: config.life360_username,
            password: config.life360_password
        }
    }, function (err, status, body) {
        const _life360_token_ = body.access_token;
        _life360_me_ = body.user.id;
        console.log('[Life360] Service ready');
        _life360_request_ = function (url, callback, data) {
            request({
                url: 'https://api.life360.com/v3/' + url,
                method: typeof data === 'undefined' ? 'GET' : 'POST',
                headers: {
                    Authorization: 'Bearer ' + _life360_token_
                },
                json: true,
                form: typeof data === 'undefined' ? {} : data
            }, callback);
        };
        _life360_request_('circles.json', function (err, status, body) {
            _life360_circles_ = body.circles;
        });
        _life360_ready = true;
    });
}
function arePointsNear(centre, point, radiusInMetres) {
    var ky = 40000000 / 360; // Circumference of earth split into 360 degrees
    var kx = Math.cos((Math.PI * centre[0]) / 180.0) * ky;
    var dx = Math.abs(centre[1] - point[1]) * kx;
    var dy = Math.abs(centre[0] - point[0]) * ky;
    return Math.sqrt(dx * dx + dy * dy) <= radiusInMetres;
}
module.exports = function (api) {
    return {
        name: ['locate'],
        admin: true,
        description: 'Locate Andrew!',
        function: async function (messageObj) {
            if (!config.life360_enable)
                throw Error('Life360 not enabled');
            if (!_life360_ready)
                throw Error('Life360 not ready');
            console.log('*NOTICE: Location requested by ' + messageObj.sender + '*');
            //   if (message) api.sendMessage("Locating...", event.threadID);
            return new Promise(function (resolve, reject) {
                _life360_request_('circles/' + _life360_circles_[0].id + '/members/' + _life360_me_, function (err, status, body) {
                    body = body.location;
                    data = {
                        lat: body.latitude,
                        long: body.longitude,
                        since: new Date(body.since * 1000),
                        last: new Date(body.timestamp * 1000),
                        name: body.name,
                        battery: body.battery
                    };
                    var asof = '\n_Position as of ' +
                        moment(data.last).tz("Australia/Sydney").format('h:mm a Do MMMM YYYY zz') +
                        '_';
                    for (const point of (config.life360_points || [])) {
                        if (arePointsNear(point[1], [data.lat, data.long], point[2])) {
                            return resolve(`Location: ${point[0]}${asof}`);
                        }
                    }
                    if (data.name) {
                        resolve('Location: ' + data.name + asof);
                    }
                    else {
                        request.get('http://maps.googleapis.com/maps/api/geocode/json?latlng=' +
                            data.lat +
                            ',' +
                            data.long +
                            '&sensor=false', function (err, status, body) {
                            var parsed = JSON.parse(body);
                            const stringBuilder = [];
                            if (parsed.status == 'OK') {
                                stringBuilder.push(`Location: ${parsed.results[0].formatted_address}`);
                            }
                            stringBuilder.push(`Coordinates: \`${data.lat}, ${data.long}${asof}\``);
                            stringBuilder.push('');
                            stringBuilder.push(`http://maps.google.com/maps?q=${data.lat},${data.long}`);
                            resolve(stringBuilder.join('\n'));
                        });
                    }
                });
            });
        }
    };
};
