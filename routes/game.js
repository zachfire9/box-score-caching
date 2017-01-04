const Boom = require('boom');
const Later = require('later');
const Moment = require('moment');
const Mongoose = require('mongoose');
const Underscore = require('underscore');
const Wreck = require('wreck');

const Config = require('../config');
const GamesModel = require('../models/games/schema');

const options = {
    json: true
}

module.exports = [
    { 
        method: 'GET', 
        path: '/api/games', 
        handler: function (request, reply) {

            const query = request.query;
            if (request.query.searchType && request.query.searchType === 'betweenTime') {
                query.startTime = { $lte: request.query.searchTime };
                query.endTime = { $gte: request.query.searchTime };
                delete query.searchType;
                delete query.searchTime;
            }

            GamesModel.find(query, function(err, gameRecords) {

                if (err) {
                    request.log('error', err);
                    return reply(Boom.badImplementation());
                }

                return reply(gameRecords)

            });
        }
    },
    { 
        method: 'POST', 
        path: '/api/games', 
        handler: function (request, reply) {

            // @TODO break this up into pre's
            const season = request.payload.season;
            const date = request.payload.date;
            const team = request.payload.team;
            Wreck.get(Config.get('/feed') + season + '/daily_game_schedule.json?fordate=' + date, options, (err, res, payload) => {

                if (err) {
                    request.log('error', err);
                    return reply(Boom.badGateway('There was an error returned from the feed.'));
                }

                if (!payload) {
                    return reply(Boom.notFound('Nothing wass returned from the feed.'));
                }

                // @TODO check to make sure team is in the object, if not return an error
                Underscore.each(payload.dailygameschedule.gameentry, function (gameInfo) {

                    if (gameInfo.awayTeam.Name === team || gameInfo.homeTeam.Name === team) {
                        homeTeamAbv = gameInfo.homeTeam.Abbreviation;
                        awayTeamAbv = gameInfo.awayTeam.Abbreviation;
                        feedId = date + '-' + awayTeamAbv + '-' + homeTeamAbv;
                        startTime = Moment(gameInfo.date + ' ' + gameInfo.time, 'YYYY-MM-DD HH:mmA');
                        endTime = Moment(gameInfo.date + ' ' + gameInfo.time, 'YYYY-MM-DD HH:mmA').add(4, 'hours');

                        GamesModel.findOne({ feedId: feedId }, function(err, gameRecord) {

                            if (gameRecord) {
                                return reply(Boom.conflict('This game has already been scheduled.'));
                            } else {
                                const gameObject = {
                                    feedId: feedId,
                                    seasonId: season,
                                    date: date,
                                    startTime: startTime,
                                    endTime: endTime
                                };

                                const game = new GamesModel(gameObject);
                                game.save(function (err, result) {

                                    if (err) {
                                        console.error(err);
                                        return reply(err);
                                    }

                                    return reply(result);
                                });
                            }
                        });
                    }
                })
            });
        } 
    }
];
