const Mongoose = require('mongoose');

module.exports = [
    { 
        method: 'POST', 
        path: '/game/{season}/{gameid}', 
        handler: function (request, reply) {
            const schema = Mongoose.Schema({}, { strict: false });
            const GameModel = Mongoose.model('Game', schema);
            const season = request.params.season;
            const gameid = request.params.gameid;
            const game = new GameModel({ season: season , gameid: gameid });
            game.save(function (err, result) {
                if (err) {
                    console.error(err);
                    return reply(err);
                }
                return reply(true);
            });
        } 
    }
];
