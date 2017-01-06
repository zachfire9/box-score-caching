'use strict';

const Code = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const Mongoose = require('mongoose');
const Sinon = require('sinon');
const Url = require('url');

const Routes = require('../../routes');

const lab = exports.lab = Lab.script();

lab.describe('Boxscore tests', () => {

    const Boxscores = Mongoose.model('Boxscores');
    const mock = {
        server: null
    };

    lab.beforeEach(function (done) {
        
        mock.server = new Hapi.Server();
        mock.server.connection({port: 8080});
        mock.server.route(Routes);
        done();
    });

    lab.test('Create boxscore', (done) => {
        
        Sinon
        .stub(Boxscores.prototype, 'save')
        .yields(null, {});

        const req = { method: 'POST', url: '/api/boxscores', payload: {} };

        mock.server.inject(req, function (response) {

            Boxscores.prototype.save.restore();
            Code.expect(response.result).to.equal({});
            done();
        });
    });

    lab.test('Create boxscore error', (done) => {
        
        Sinon
        .stub(Boxscores.prototype, 'save')
        .yields(new Error('This is a test DB error'), null);

        const expectedError = {
            'error': 'Internal Server Error',
            'message': 'An internal server error occurred',
            'statusCode': 500
        };

        const req = { method: 'POST', url: '/api/boxscores', payload: {} };

        mock.server.inject(req, function (response) {

            Boxscores.prototype.save.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Get boxscores', (done) => {
        
        Sinon
        .stub(Boxscores, 'find')
        .yields(null, []);

        mock.server.inject('/api/boxscores', function (response) {

            Boxscores.find.restore();
            Code.expect(response.result).to.equal([]);
            done();
        });
    });

    lab.test('Get boxscores error', (done) => {

        Sinon
        .stub(Boxscores, 'find')
        .yields(new Error('This is a test DB error'), null);

        const expectedError = {
            'error': 'Internal Server Error',
            'message': 'An internal server error occurred',
            'statusCode': 500
        };

        mock.server.inject('/api/boxscores', function (response) {

            Boxscores.find.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });

    lab.test('Get boxscores - findClosestToTime - quarter 1', (done) => {
        
        const expectedQuery = {
            season: '2016-2017-regular',
            gameId: '20170101-ORL-IND',
            currentTime: { '$lte': 10.5 }
        };

        Sinon
        .stub(Boxscores, 'find')
        .withArgs(expectedQuery)
        .yields(null, []);

        const season = '2016-2017-regular';
        const gameId = '20170101-ORL-IND';
        const quarter = 1;
        const minutes = 10;
        const seconds = 30;

        const path = '/api/boxscores';
        const querystring = '?findClosestToTime=true&season=' + season + '&gameId=' + gameId + '&quarter=' + quarter + '&minutes=' + minutes + '&seconds=' + seconds;

        mock.server.inject(Url.resolve(path, querystring), function (response) {

            const expectedQuery = {};

            Boxscores.find.restore();
            Code.expect(response.result).to.equal([]);
            done();
        });
    });

    lab.test('Get boxscores - findClosestToTime - quarter 2', (done) => {
        
        const expectedQuery = {
            season: '2016-2017-regular',
            gameId: '20170101-ORL-IND',
            currentTime: { '$lte': 22.5 }
        };

        Sinon
        .stub(Boxscores, 'find')
        .withArgs(expectedQuery)
        .yields(null, []);

        const season = '2016-2017-regular';
        const gameId = '20170101-ORL-IND';
        const quarter = 2;
        const minutes = 10;
        const seconds = 30;

        const path = '/api/boxscores';
        const querystring = '?findClosestToTime=true&season=' + season + '&gameId=' + gameId + '&quarter=' + quarter + '&minutes=' + minutes + '&seconds=' + seconds;

        mock.server.inject(Url.resolve(path, querystring), function (response) {

            const expectedQuery = {};

            Boxscores.find.restore();
            Code.expect(response.result).to.equal([]);
            done();
        });
    });

    lab.test('Get boxscore', (done) => {
        
        Sinon
        .stub(Boxscores, 'find')
        .yields(null, []);

        mock.server.inject('/api/boxscores/1234', function (response) {

            Boxscores.find.restore();
            Code.expect(response.result).to.equal([]);
            done();
        });
    });

    lab.test('Get boxscore error', (done) => {
        
        Sinon
        .stub(Boxscores, 'find')
        .yields(new Error('This is a test DB error'), null);

        const expectedError = {
            'error': 'Internal Server Error',
            'message': 'An internal server error occurred',
            'statusCode': 500
        };

        mock.server.inject('/api/boxscores/1234', function (response) {

            Boxscores.find.restore();
            Code.expect(response.result).to.equal(expectedError);
            done();
        });
    });
});
