const Wreck = require('wreck');

const Config = require('../config');

const options = {
    json: true
}

module.exports = [
    { 
        method: 'GET', 
        path: '/boxscore/{season}/{gameid}', 
        handler: function (request, reply) {
            Wreck.get(Config.get('/feed') + request.params.season + '/game_boxscore.json?gameid=' + request.params.gameid, options, (err, res, payload) => {
                reply(payload);
            });
        } 
    }
];
