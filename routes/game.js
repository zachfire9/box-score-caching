'use strict';

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
};

const createGamesValidation = function (request, reply) {

    if (!request.payload.season) {
        return reply(Boom.badRequest('The parameter "season" must be included in the request.'));
    }

    if (!request.payload.date) {
        return reply(Boom.badRequest('The parameter "date" must be included in the request.'));
    }

    if (!request.payload.team) {
        return reply(Boom.badRequest('The parameter "team" must be included in the request.'));
    }

    return reply(true);
};

const getGamesDateFromFeed = function (request, reply) {

    const endpoint = Config.get('/feed') + request.payload.season + '/daily_game_schedule.json?fordate=' + request.payload.date
    Wreck.get(endpoint, options, (err, res, payload) => {

        if (err || payload instanceof Buffer) {
            request.log('error', err);
            return reply(Boom.badGateway('There was an error returned from the feed.'));
        }

        if (!payload || Underscore.isEmpty(payload)) {
            return reply(Boom.notFound('Nothing was returned from the feed.'));
        }

        if (!payload.dailygameschedule || !payload.dailygameschedule.gameentry) {
            return reply(Boom.notFound('No games were returned from the feed.'));
        }

        return reply(payload.dailygameschedule.gameentry);
    });
};

const findTeamInGameFeed = function (request, reply) {

    const feedGames = request.pre.feedGames;
    let gameInfo = null;

    for (let count = 0; count < feedGames.length; count++) {
        if (feedGames[count].awayTeam.Name === request.payload.team || feedGames[count].homeTeam.Name === request.payload.team) {
            const homeTeamAbv = feedGames[count].homeTeam.Abbreviation;
            const awayTeamAbv = feedGames[count].awayTeam.Abbreviation;
            const feedId = request.payload.date + '-' + awayTeamAbv + '-' + homeTeamAbv;
            const startTime = Moment(feedGames[count].date + ' ' + feedGames[count].time, 'YYYY-MM-DD HH:mmA');
            const endTime = Moment(feedGames[count].date + ' ' + feedGames[count].time, 'YYYY-MM-DD HH:mmA').add(4, 'hours');

            gameInfo = {
                feedId: feedId,
                seasonId: request.payload.season,
                date: request.payload.date,
                startTime: startTime,
                endTime: endTime
            };
        }
    }

    if (!gameInfo) {
        return reply(Boom.notFound('The team requested is not playing this day.'));
    }

    return reply(gameInfo);
};

const checkForExistingGame = function (request, reply) {

    GamesModel.find({ feedId: request.pre.gameInfo.feedId }, function(err, gameRecords) {

        if (err) {
            request.log('error', err);
            return reply(Boom.badImplementation());
        }

        if (!Underscore.isEmpty(gameRecords)) {
            return reply(Boom.conflict('This game has already been scheduled.'));
        } 

        return reply(null);
    });
};

const createGameRecord = function (request, reply) {

    const game = new GamesModel(request.pre.gameInfo);
    game.save(function (err, result) {

        if (err) {
            request.log('error', err);
            return reply(Boom.badImplementation());
        }

        return reply(result);
    });
};

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

            GamesModel.find(query, function(err, gameRecord) {

                if (err) {
                    request.log('error', err);
                    return reply(Boom.badImplementation());
                }

                return reply(gameRecord)

            });
        }
    },
    { 
        method: 'POST', 
        path: '/api/games', 
        config: {
            pre: [
                { method: createGamesValidation, assign: 'validation' },
                { method: getGamesDateFromFeed, assign: 'feedGames' },
                { method: findTeamInGameFeed, assign: 'gameInfo' },
                { method: checkForExistingGame, assign: 'existingGame' },
                { method: createGameRecord, assign: 'gameRecord' }
            ]
        },
        handler: function (request, reply) {

            return reply(request.pre.gameRecord);
        } 
    }
];
