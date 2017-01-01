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
        method: 'GET', 
        path: '/boxscore/season/{season}/game/{gameId}', 
        handler: function (request, reply) {
            Wreck.get(Config.get('/feed') + request.params.season + '/game_boxscore.json?gameid=' + request.params.gameId, options, (err, res, payload) => {
                const quarterInfo = Underscore.last(payload.gameboxscore.quarterSummary.quarter);
                const currentQuarter = quarterInfo['@number'];
                const lastScoringPlay = Underscore.last(quarterInfo.scoring.scoringPlay);
                const currentTime = Moment.duration('00:' + lastScoringPlay.time);
                const currentMinutesLeft = currentTime.minutes();
                const currentSecondsLeft = currentTime.seconds();
                payload.gameId = request.params.gameId;
                payload.gameTime = Moment(payload.gameboxscore.lastUpdatedOn);
                if (currentQuarter - 1 === 0) {
                    payload.currentTime = currentMinutesLeft + (currentSecondsLeft / 60);
                } else {
                    payload.currentTime = ((currentQuarter - 1) * 12) + currentMinutesLeft + (currentSecondsLeft / 60);
                }

                const boxscore = new BoxscoreModel(payload);
                boxscore.save(function (err, result) {
                    if (err) {
                        console.error(err);
                        return reply(err);
                    }
                    return reply(true);
                });
            });
        } 
    },
    { 
        method: 'GET', 
        path: '/boxscore/season/{season}/game/{gameId}/quarter/{quarter}/minutes/{minutesLeft}/seconds/{secondsLeft}', 
        handler: function (request, reply) {
            const season = request.params.season;
            const gameId = request.params.gameId;
            const quarter = request.params.quarter;
            const minutes = 11 - request.params.minutesLeft;
            const seconds = 60 - request.params.secondsLeft;

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
