'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Moment = require('moment');
const Mongoose = require('mongoose');
const Sinon = require('sinon');
const Url = require('url');
const Wreck = require('wreck');

const BoxScorePollingPlugin = require('../../../plugins/box-score-polling');
const Routes = require('../../../routes');

const lab = exports.lab = Lab.script();

lab.describe('Boxs Score Polling tests', () => {

    const Boxscores = Mongoose.model('Boxscores');
    const Games = Mongoose.model('Games');
    const mock = {
        server: null
    };

    lab.beforeEach(function (done) {
        
        mock.server = new Hapi.Server({ debug: { request: ['error', 'info'] } });
        mock.server.connection({port: 8081});
        require('../../../methods')(mock.server, {});
        mock.server.register({
            register: BoxScorePollingPlugin,
            options: {
                feed: 'test.com',
                pollingEnabled: true,
                pollingSchedule: 'every 1 secs'
            }
        }, (err) => {

            if (err) {
                console.log("Failed to load box-score-polling.");
            }
        });

        mock.server.route(Routes);
        done();
    });

    lab.test('Find games error', { timeout: 5000 }, (done) => {

        Sinon
        .stub(Games, 'find')
        .yields(new Error('This is a test DB error'), null);

        mock.server.methods.getGames(mock.server, Moment().utc().format('x'), function (err, result) {

            Games.find.restore();
            Code.expect(err).to.equal('Internal Server Error');
            done();
        });
    });

    lab.test('Find games nothing returned', { timeout: 5000 }, (done) => {

        Sinon
        .stub(Games, 'find')
        .yields(null, {});

        mock.server.methods.getGames(mock.server, Moment().utc().format('x'), function (err, result) {

            Games.find.restore();
            Code.expect(err).to.equal('No games were found to be polled at this time.');
            done();
        });
    });

    lab.test('Find game boxscore error', { timeout: 5000 }, (done) => {

        let gameRecord = {

            toJSON: function () {

                const gameObject = {
                    feedId: '20170101-ORL-CHA',
                    seasonId: '2016-2017-regular',
                    date: '20170101',
                    startTime: 1483315200000,
                    endTime: 1483329600000
                };

                return gameObject;
            }
        };

        Sinon
        .stub(Games, 'find')
        .yields(null, [gameRecord]);

        Sinon
        .stub(Wreck, 'get')
        .yields(new Error('This is a test Wreck error'), null, null);

        mock.server.methods.getGames(mock.server, Moment().utc().format('x'), function (err, result) {

            Games.find.restore();
            Wreck.get.restore();
            Code.expect(result).to.equal([gameRecord]);
            done();
        });
    });

    lab.test('Create boxscore from gameInfo', (done) => {

        Sinon
        .stub(Boxscores.prototype, 'save')
        .yields(null, {});

        const mockQuarter = [{
            '@number': 1,
            scoring: {
                scoringPlay: [{
                   time: '10:01' 
                }]
            }
        }];

        mock.server.methods.createBoxscore(mock.server, '20170101-ORL-CHA', mockQuarter, function (response) {

            const expectedResponse = {
                "currentTime": 10.016666666666667,
                "gameId": "20170101-ORL-CHA"
            }


            Boxscores.prototype.save.restore();
            Code.expect(response).to.equal(expectedResponse);
            done();
        });
    });
});