const Mongoose = require('mongoose');
const Moment = require('moment');
const Underscore = require('underscore');
const Wreck = require('wreck');

const Config = require('../config');
const BoxscoreModel = require('../models/boxscore/schema');
const GameModel = require('../models/game/schema');

const options = {
    json: true
}

module.exports = [
    { 
        method: 'POST', 
        path: '/api/boxscore', 
        handler: function (request, reply) {
            const payload = request.payload;
            const boxscore = new BoxscoreModel(payload);
            boxscore.save(function (err, result) {
                if (err) {
                    console.error(err);
                    return reply(err);
                }
                return reply(true);
            });
        } 
    },
    { 
        method: 'GET', 
        path: '/api/boxscore', 
        handler: function (request, reply) {
            console.log(request.query);
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

            console.log(currentTime);

            GameModel.findOne({ gameId: gameId }, function(err, gameRecord) {
                BoxscoreModel.findOne({ gameId: gameId, currentTime: { '$lte': currentTime } }, function(err, boxscoreRecord) {
                    return reply(boxscoreRecord);
                });
            });
        } 
    }
];
