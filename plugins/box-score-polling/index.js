'use strict';

const Later = require('later');
const Moment = require('moment');
const Underscore = require('underscore');
const Wreck = require('wreck');

const Config = require('../../config');

exports.register = function (server, options, next) {

    if (options.pollingEnabled) {
        Later.date.localTime();
        const schedule = Later.parse.recur().every(5).minute();
        const timer = Later.setInterval(getGames, schedule);

        function getGames() {

            server.inject('/api/games?searchType=betweenTime&searchTime=' + Moment().format('x'), function (response) {

                Underscore.each(response.result, function (gameRecord) {

                    const gameObject = gameRecord.toJSON();
                    const options = { json: true };

                    Wreck.get(Config.get('/feed') + gameObject.seasonId + '/game_boxscore.json?gameid=' + gameObject.feedId, options, (err, res, payload) => {

                        // @TODO check for empty payload object and move on
                        payload.gameId = gameObject.feedId;
                        const quarterInfo = Underscore.last(payload.gameboxscore.quarterSummary.quarter);
                        const currentQuarter = quarterInfo['@number'];
                        const lastScoringPlay = Underscore.last(quarterInfo.scoring.scoringPlay);
                        const currentTime = Moment.duration('00:' + lastScoringPlay.time);
                        const currentMinutesLeft = currentTime.minutes();
                        const currentSecondsLeft = currentTime.seconds();
                        
                        if (currentQuarter - 1 === 0) {
                            payload.currentTime = currentMinutesLeft + (currentSecondsLeft / 60);
                        } else {
                            payload.currentTime = ((currentQuarter - 1) * 12) + currentMinutesLeft + (currentSecondsLeft / 60);
                        }

                        const req = { method: 'POST', url: '/api/boxscores', payload: payload };
                        server.inject(req, function (response) {

                            console.log('POST /api/boxscores Response:');
                            console.log(response.result);
                        });
                    });
                });
            });
        };        
    }

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};