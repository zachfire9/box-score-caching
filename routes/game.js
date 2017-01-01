const Later = require('later');
const Moment = require('moment');
const Mongoose = require('mongoose');
const Underscore = require('underscore');
const Wreck = require('wreck');

const Config = require('../config');

const schema = Mongoose.Schema({}, { strict: false });
const GameModel = Mongoose.model('Game', schema);

const options = {
    json: true
}

module.exports = [
    { 
        method: 'POST', 
        path: '/game/{season}/{date}/{team}', 
        handler: function (request, reply) {
            // @TODO break this up into pre's
            const season = request.params.season;
            const date = request.params.date;
            const team = request.params.team;
            Wreck.get(Config.get('/feed') + request.params.season + '/daily_game_schedule.json?fordate=' + request.params.date, options, (err, res, payload) => {
                // @TODO check to make sure an object is returned if not return an error
                Underscore.each(payload.dailygameschedule.gameentry, function (gameInfo) {
                    if (gameInfo.awayTeam.Name === team || gameInfo.homeTeam.Name === team) {
                        homeTeamAbv = gameInfo.homeTeam.Abbreviation;
                        awayTeamAbv = gameInfo.awayTeam.Abbreviation;
                        gameId = date + '-' + awayTeamAbv + '-' + homeTeamAbv;
                        startTime = Moment(gameInfo.date + ' ' + gameInfo.time, "YYYY-MM-DD HH:mmA");
                        endTime = Moment(gameInfo.date + ' ' + gameInfo.time, "YYYY-MM-DD HH:mmA").add(4, 'hours');
                        console.log(endTime.format("HH:mm"))
                        const game = new GameModel({ season: season , gameid: gameId });
                        game.save(function (err, result) {
                            if (err) {
                                console.error(err);
                                return reply(err);
                            }
                            Later.date.localTime();
                            const schedule = Later.parse.recur().every(5).minute()
                                .after(startTime.format("HH:mm")).time()
                                .before(endTime.format("HH:mm")).time();
                            const timer = Later.setInterval(pollBoxscore, schedule);

                            function pollBoxscore() {
                                request.server.inject('/boxscore/' + season + '/' + gameId, function (response) {
                                    console.log(response.result);
                                });
                            }

                            return reply(true);
                        });
                    }
                })
            });
        } 
    }
];
