'use strict';

const Moment = require('moment');
const Underscore = require('underscore');
const Wreck = require('wreck');

const Config = require('../config');

const getGames = function (server, searchTime, reply) {

    server.inject('/api/games?searchType=betweenTime&searchTime=' + searchTime, (responseGames) => {

        if (responseGames.result.error) {
            return reply(responseGames.result.error);
        }

        if (Underscore.isEmpty(responseGames.result)) {
            return reply(null, 'No games were found to be polled at this time.');
        }

        Underscore.each(responseGames.result, (gameRecord) => {

            if (Underscore.isEmpty(gameRecord)) {
                server.log('info', 'Empty gameRecord returned.');
            }
            else {
                const gameObject = gameRecord.toJSON();
                const endpoint = Config.get('/feed') + gameObject.seasonId + '/game_boxscore.json?gameid=' + gameObject.feedId;

                Wreck.get(endpoint, { json: true }, (err, res, payload) => {

                    if (err) {
                        server.log('error', err);
                    }
                    else if (Underscore.isEmpty(payload)) {
                        server.log('error', 'Empty payload returned from feed when looking up box score.');
                    }
                    else if (!payload.gameboxscore || !payload.gameboxscore.quarterSummary || !payload.gameboxscore.quarterSummary.quarter) {
                        server.log('info', 'No quarter info currently in the box score.');
                    }
                    else {
                        const quarterInfo = payload.gameboxscore.quarterSummary.quarter;
                        createBoxscore(server, gameObject.feedId, quarterInfo, (boxscoreObject) => {

                            Underscore.extend(boxscoreObject, payload);
                            const req = { method: 'POST', url: '/api/boxscores', payload: boxscoreObject };
                            server.inject(req, (responseBoxscores) => {

                                server.log('info', 'Box score posted for game: ' + gameObject.feedId);
                            });
                        });
                    }
                });
            }
        });

        reply(null, responseGames.result);
    });
};

const createBoxscore = function (server, gameId, quarter, reply) {

    const boxscoreObject = {
        gameId
    };

    const quarterInfo = Underscore.last(quarter);
    const currentQuarter = quarterInfo['@number'];
    const lastScoringPlay = Underscore.last(quarterInfo.scoring.scoringPlay);
    const currentTime = Moment.duration('00:' + lastScoringPlay.time);
    const currentMinutesLeft = currentTime.minutes();
    const currentSecondsLeft = currentTime.seconds();

    if (currentQuarter - 1 === 0) {
        boxscoreObject.currentTime = currentMinutesLeft + (currentSecondsLeft / 60);
    }
    else {
        boxscoreObject.currentTime = ((currentQuarter - 1) * 12) + currentMinutesLeft + (currentSecondsLeft / 60);
    }

    reply(boxscoreObject);
};

module.exports = function (server, options) {

    server.method({
        name: 'getGames',
        method: getGames
    });

    server.method({
        name: 'createBoxscore',
        method: createBoxscore
    });
};