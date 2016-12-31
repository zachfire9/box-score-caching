const Wreck = require('wreck');

const Config = require('../config');

const options = {
    json: true
}

module.exports = [
    { 
        method: 'GET', 
        path: '/boxscore/{gameid}', 
        handler: function (request, reply) {
            Wreck.get(Config.get('/feed') + '?gameid=' + request.params.gameid, options, (err, res, payload) => {
                reply(payload);
            });
        } 
    }
];
