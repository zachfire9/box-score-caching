'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Moment = require('moment');
const Mongoose = require('mongoose');
const Sinon = require('sinon');
const Url = require('url');

const Routes = require('../../routes');

const lab = exports.lab = Lab.script();

lab.describe('Game Tests', () => {

    const Games = Mongoose.model('Games');
    const mock = {
        server: null
    };

    lab.beforeEach(function (done) {
        
        mock.server = new Hapi.Server();
        mock.server.connection({port: 8080});
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
});