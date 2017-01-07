'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Moment = require('moment');
const Mongoose = require('mongoose');
const Sinon = require('sinon');
const Url = require('url');
const Wreck = require('wreck');

const Routes = require('../../routes');

const lab = exports.lab = Lab.script();

lab.describe('Game Tests', () => {

    const Games = Mongoose.model('Games');
    const mock = {
        server: null
    };

    lab.beforeEach(function (done) {
        
        mock.server = new Hapi.Server();
        mock.server.connection({port: 8081});
        mock.server.route(Routes);
        done();
    });

    lab.test('Get games', (done) => {

        Sinon
        .stub(Games, 'find')
        .yields(null, []);

        mock.server.inject('/api/games', function (response) {

            Games.find.restore();
            Code.expect(response.result).to.equal([]);
            done();
        });
    });

    lab.test('Get games error', (done) => {

        Sinon
        .stub(Games, 'find')
        .yields(new Error('This is a test DB error'), null);

        const expectedError = {
            'error': 'Internal Server Error',
            'message': 'An internal server error occurred',
            'statusCode': 500
        };

        mock.server.inject('/api/games', function (response) {

            Games.find.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Get games - searchType', (done) => {

        const expectedQuery = { 
            startTime: { '$lte': '1483563730000' },
            endTime: { '$gte': '1483563730000' } 
        };

        Sinon
        .stub(Games, 'find')
        .withArgs(expectedQuery)
        .yields(null, []);

        const searchTime = 1483563730000; 

        const path = '/api/games';
        const querystring = '?searchType=betweenTime&searchTime=' + searchTime;

        mock.server.inject(Url.resolve(path, querystring), function (response) {

            Games.find.restore();
            Code.expect(response.result).to.equal([]);
            done();
        });
    });

    lab.test('Create game - validation error - no season', (done) => {

        Sinon
        .stub(Wreck, 'get')
        .yields(new Error('This is a test Wreck error'), null, null);

        const expectedError = {
            'error': 'Bad Request',
            'message': 'The parameter "season" must be included in the request.',
            'statusCode': 400
        };

        const payload = {
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - validation error - no date', (done) => {

        Sinon
        .stub(Wreck, 'get')
        .yields(new Error('This is a test Wreck error'), null, null);

        const expectedError = {
            'error': 'Bad Request',
            'message': 'The parameter "date" must be included in the request.',
            'statusCode': 400
        };

        const payload = {
            season: '2016-2017-regular',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - validation error - no team', (done) => {

        Sinon
        .stub(Wreck, 'get')
        .yields(new Error('This is a test Wreck error'), null, null);

        const expectedError = {
            'error': 'Bad Request',
            'message': 'The parameter "team" must be included in the request.',
            'statusCode': 400
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - feed error', (done) => {

        Sinon
        .stub(Wreck, 'get')
        .yields(new Error('This is a test Wreck error'), null, null);

        const expectedError = {
            'error': 'Bad Gateway',
            'message': 'There was an error returned from the feed.',
            'statusCode': 502
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - feed buffer error', (done) => {

        const bufferError = new Buffer('This is an error.');

        Sinon
        .stub(Wreck, 'get')
        .yields(null, null, bufferError);

        const expectedError = {
            'error': 'Bad Gateway',
            'message': 'There was an error returned from the feed.',
            'statusCode': 502
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - feed no payload', (done) => {

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {});

        const expectedError = {
            'error': 'Not Found',
            'message': 'Nothing was returned from the feed.',
            'statusCode': 404
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - feed empty payload', (done) => {

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {}, {});

        const expectedError = {
            'error': 'Not Found',
            'message': 'Nothing was returned from the feed.',
            'statusCode': 404
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - feed no dailygameschedule', (done) => {

        const feedResponse = {
            test: 'test'
        }

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {}, feedResponse);

        const expectedError = {
            'error': 'Not Found',
            'message': 'No games were returned from the feed.',
            'statusCode': 404
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - feed no dailygameschedule.gameentry', (done) => {

        const feedResponse = {
            dailygameschedule: {}
        }

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {}, feedResponse);

        const expectedError = {
            'error': 'Not Found',
            'message': 'No games were returned from the feed.',
            'statusCode': 404
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - team not in dailygameschedule.gameentry', (done) => {

        const feedResponse = {
            dailygameschedule: {
                gameentry: [{
                    id: '34469',
                    date: '2017-01-01',
                    time: '7:00PM',
                    awayTeam: {
                        ID: '96',
                        City: 'Oklahoma City',
                        Name: 'Thunder',
                        Abbreviation: 'OKL'
                    },
                    homeTeam: {
                        ID: '93',
                        City: 'Charlotte',
                        Name: 'Hornets',
                        Abbreviation: 'CHA'
                    },
                    location: 'Time Warner Cable Arena'
                }]
            }
        }

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {}, feedResponse);

        const expectedError = {
            'error': 'Not Found',
            'message': 'The team requested is not playing this day.',
            'statusCode': 404
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - existing game record', (done) => {

        const feedResponse = {
            dailygameschedule: {
                gameentry: [{
                    id: '34469',
                    date: '2017-01-01',
                    time: '7:00PM',
                    awayTeam: {
                        ID: '96',
                        City: 'Orlando',
                        Name: 'Magic',
                        Abbreviation: 'ORL'
                    },
                    homeTeam: {
                        ID: '93',
                        City: 'Charlotte',
                        Name: 'Hornets',
                        Abbreviation: 'CHA'
                    },
                    location: 'Time Warner Cable Arena'
                }]
            }
        }

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {}, feedResponse);

        const mockGameRecord = {
            feedId: '20170101-ORL-CHA',
            seasonId: '2016-2017-regular',
            date: '20170104',
            startTime: 1483315200000,
            endTime: 1483329600000
        };

        Sinon
        .stub(Games, 'find')
        .yields(null, [mockGameRecord]);

        const expectedError = {
            'error': 'Conflict',
            'message': 'This game has already been scheduled.',
            'statusCode': 409
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Games.find.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - existing game record error', (done) => {

        const feedResponse = {
            dailygameschedule: {
                gameentry: [{
                    id: '34469',
                    date: '2017-01-01',
                    time: '7:00PM',
                    awayTeam: {
                        ID: '96',
                        City: 'Orlando',
                        Name: 'Magic',
                        Abbreviation: 'ORL'
                    },
                    homeTeam: {
                        ID: '93',
                        City: 'Charlotte',
                        Name: 'Hornets',
                        Abbreviation: 'CHA'
                    },
                    location: 'Time Warner Cable Arena'
                }]
            }
        }

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {}, feedResponse);

        Sinon
        .stub(Games, 'find')
        .yields(new Error('This is a test DB error'), null);

        const expectedError = {
            'error': 'Internal Server Error',
            'message': 'An internal server error occurred',
            'statusCode': 500
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Games.find.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - error creating new record', (done) => {

        const feedResponse = {
            dailygameschedule: {
                gameentry: [{
                    id: '34469',
                    date: '2017-01-01',
                    time: '7:00PM',
                    awayTeam: {
                        ID: '96',
                        City: 'Orlando',
                        Name: 'Magic',
                        Abbreviation: 'ORL'
                    },
                    homeTeam: {
                        ID: '93',
                        City: 'Charlotte',
                        Name: 'Hornets',
                        Abbreviation: 'CHA'
                    },
                    location: 'Time Warner Cable Arena'
                }]
            }
        }

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {}, feedResponse);

        Sinon.stub(Games, 'find')
        .yields(null, []);

        Sinon.stub(Games.prototype, 'save')
        .yields(new Error('This is a test DB error'), null);

        const expectedError = {
            'error': 'Internal Server Error',
            'message': 'An internal server error occurred',
            'statusCode': 500
        };

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Games.find.restore();
            Games.prototype.save.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Create game - success', (done) => {

        const feedResponse = {
            dailygameschedule: {
                gameentry: [{
                    id: '34469',
                    date: '2017-01-01',
                    time: '7:00PM',
                    awayTeam: {
                        ID: '96',
                        City: 'Orlando',
                        Name: 'Magic',
                        Abbreviation: 'ORL'
                    },
                    homeTeam: {
                        ID: '93',
                        City: 'Charlotte',
                        Name: 'Hornets',
                        Abbreviation: 'CHA'
                    },
                    location: 'Time Warner Cable Arena'
                }]
            }
        };

        const mockGameRecord = {
            feedId: '20170101-ORL-CHA',
            seasonId: '2016-2017-regular',
            date: '20170101',
            startTime: 1483315200000,
            endTime: 1483329600000
        };

        Sinon
        .stub(Wreck, 'get')
        .yields(null, {}, feedResponse);

        Sinon.stub(Games, 'find')
        .yields(null, []);

        Sinon.stub(Games.prototype, 'save')
        .yields(null, mockGameRecord);

        const payload = {
            season: '2016-2017-regular',
            date: '20170101',
            team: 'Magic'
        };

        const req = { method: 'POST', url: '/api/games', payload: payload };

        mock.server.inject(req, function (response) {

            Wreck.get.restore();
            Games.find.restore();
            Games.prototype.save.restore();
            Code.expect(response.result).to.equal(mockGameRecord);
            done();
        });
    });
});
