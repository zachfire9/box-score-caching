const Boom = require('boom');
const Later = require('later');
const Moment = require('moment');
const Mongoose = require('mongoose');
const Underscore = require('underscore');
const Wreck = require('wreck');

const Config = require('../config');
const GameModel = require('../models/game/schema');

const options = {
    json: true
}

module.exports = [
    { 
        method: 'POST', 
        path: '/api/game', 
        handler: function (request, reply) {
            // @TODO break this up into pre's
            const season = request.payload.season;
            const date = request.payload.date;
            const team = request.payload.team;
            Wreck.get(Config.get('/feed') + season + '/daily_game_schedule.json?fordate=' + date, options, (err, res, payload) => {
                // @TODO check to make sure an object is returned if not return an error
                Underscore.each(payload.dailygameschedule.gameentry, function (gameInfo) {
                    if (gameInfo.awayTeam.Name === team || gameInfo.homeTeam.Name === team) {
                        homeTeamAbv = gameInfo.homeTeam.Abbreviation;
                        awayTeamAbv = gameInfo.awayTeam.Abbreviation;
                        gameId = date + '-' + awayTeamAbv + '-' + homeTeamAbv;
                        startTime = Moment(gameInfo.date + ' ' + gameInfo.time, 'YYYY-MM-DD HH:mmA');
                        endTime = Moment(gameInfo.date + ' ' + gameInfo.time, 'YYYY-MM-DD HH:mmA').add(4, 'hours');
                        GameModel.findOne({ gameId: gameId }, function(err, gameRecord) {
                            if (gameRecord) {
                                return reply(Boom.conflict('This game has already been scheduled.'));
                            } else {
                                const game = new GameModel({ season: season , gameId: gameId, gameDate: date });
                                game.save(function (err, result) {
                                    if (err) {
                                        console.error(err);
                                        return reply(err);
                                    }
                                    Later.date.localTime();
                                    const schedule = Later.parse.recur().every(5).minute()
                                        .after(startTime.format('HH:mm')).time()
                                        .before(endTime.format('HH:mm')).time();

                                    function pollBoxscore() {
                                        Wreck.get(Config.get('/feed') + season + '/game_boxscore.json?gameid=' + gameId, options, (err, res, payload) => {
                                            const quarterInfo = Underscore.last(payload.gameboxscore.quarterSummary.quarter);
                                            const currentQuarter = quarterInfo['@number'];
                                            const lastScoringPlay = Underscore.last(quarterInfo.scoring.scoringPlay);
                                            const currentTime = Moment.duration('00:' + lastScoringPlay.time);
                                            const currentMinutesLeft = currentTime.minutes();
                                            const currentSecondsLeft = currentTime.seconds();
                                            payload.gameId = request.params.gameId;
                                            if (currentQuarter - 1 === 0) {
                                                payload.currentTime = currentMinutesLeft + (currentSecondsLeft / 60);
                                            } else {
                                                payload.currentTime = ((currentQuarter - 1) * 12) + currentMinutesLeft + (currentSecondsLeft / 60);
                                            }

                                            const req = { method: 'POST', url: '/api/boxscore', payload: payload };
                                            request.server.inject(req, function (response) {
                                                console.log(response.result);
                                            });
                                        });
                                    }

                                    return reply(true);
                                });
                            }
                        });
                    }
                })
            });
        } 
    }
];
