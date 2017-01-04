const Mongoose = require('mongoose');
const Moment = require('moment');
const Underscore = require('underscore');

const BoxscoreModel = require('../models/boxscore/schema');
const GameModel = require('../models/game/schema');

const options = {
    json: true
}

module.exports = [
    { 
        method: 'POST', 
        path: '/api/boxscores', 
        handler: function (request, reply) {

            const payload = request.payload;
            const boxscore = new BoxscoreModel(payload);
            boxscore.save(function (err, result) {

                if (err) {
                    console.log('POST /api/boxscores Error:');
                    console.error(err);
                    return reply(err);
                }

                return reply(true);
            });
        } 
    },
    { 
        method: 'GET', 
        path: '/api/boxscores', 
        handler: function (request, reply) {

            const season = request.query.season;
            const gameId = request.query.gameId;
            const quarter = request.query.quarter;
            const minutes = 11 - request.query.minutes;
            const seconds = 60 - request.query.seconds;

            if (quarter === 1) {
                currentTime = minutes + (seconds / 60);
            } else {
                currentTime = ((quarter - 1) * 12) + minutes + (seconds / 60);
            }

            GameModel.findOne({ gameId: gameId }, function(err, gameRecord) {

                BoxscoreModel.findOne({ gameId: gameId, currentTime: { '$lte': currentTime } }, function(err, boxscoreRecord) {

                    return reply(boxscoreRecord);
                });
            });
        } 
    }
];
