'use strict';

const Hapi = require('hapi');
const Moment = require('moment');
const Mongoose = require('mongoose');
const Underscore = require('underscore');

const Config = require('./config');
const Routes = require('./routes');

const server = new Hapi.Server();

server.connection({ port: Config.get('/port') });

const mongoUri = Config.get('/mongoUri');

server.on('stop', function () { Mongoose.disconnect(); });

Mongoose.connection.on('error', function(err) {
    server.log(['plugin', 'error', 'mongoose'], "Mongoose error: " + (err.stack || err));
    throw err;
});

Mongoose.connection.on('open', function() {
    server.log(['plugin', 'info', 'mongoose'], "Mongoose connected to " + mongoUri);
});

Mongoose.connection.on('close', function(err) {
    server.log(['plugin', 'info', 'mongoose'], "Mongoose disconnected from " + mongoUri);
});

Mongoose.connection.on('reconnected', function(err) {
    server.log(['plugin', 'info', 'mongoose'], "Mongoose reconnected to " + mongoUri);
});

Mongoose.connection.on('timeout', function(err) {
    server.log(['plugin', 'info', 'mongoose'], "Mongoose timeout: " + (err.stack || err));
});

if (process.env.NODE_ENV !== 'production') {
    Mongoose.set('debug', true);
}

server.log(['plugin', 'info', 'mongoose'], "Mongoose connecting to " + mongoUri);
Mongoose.connect(mongoUri);

server.route(Routes);

const createGameFormHandler = function (request, reply) {

    reply.view('creategameform', {
        title: 'Create Game',
    });
};

const gameFormHandler = function (request, reply) {

    const payload = {
        season: request.payload.season,
        date: request.payload.date,
        team: request.payload.team
    };

    const req = { method: 'POST', url: '/api/games', payload: payload };

    request.server.inject(req, function (response) {

        const record = response.result.toJSON()
        const date = Moment(record.date).format("dddd, MMMM Do YYYY");
        const startTime = Moment(record.startTime).utcOffset("-05:00").format("h:mm:ss a");
        const endTime = Moment(record.endTime).utcOffset("-05:00").format("h:mm:ss a");
        reply.view('game', {
            title: 'Game',
            date: date,
            startTime: startTime,
            endTime: endTime
        });
    });
};

const boxscoreFormHandler = function (request, reply) {

    reply.view('boxscoreform', {
        title: 'Boxscore',
    });
};

const boxscoreHandler = function (request, reply) {

    const season = request.payload.season;
    const gameId = request.payload.gameId;
    const quarter = request.payload.quarter;

    const minutes = 11 - request.payload.minutes;
    const seconds = 60 - request.payload.seconds;

    request.server.inject('/api/boxscores?findClosestToTime=true&gameId=' + gameId + '&quarter=' + quarter + '&minutes=' + minutes + '&seconds=' + seconds, function (response) {

        let viewObject = {
            title: 'Boxscore',
            error: true
        };

        if (response.result && response.result.length > 0) {
            const record = response.result[0].toJSON();
            viewObject.message = record;
            viewObject.lastQuarter = Underscore.last(record.gameboxscore.quarterSummary.quarter);
            viewObject.lastScoringPlay = Underscore.last(viewObject.lastQuarter.scoring.scoringPlay);
        }

        reply.view('boxscore', viewObject);
    });
};

server.register(require('vision'), (err) => {

    if (err) {
        console.log("Failed to load vision.");
    }

    server.views({
        engines: { jade: require('jade') },
        path: __dirname + '/templates',
        compileOptions: {
            pretty: true
        }
    });

    server.route({ method: 'GET', path: '/boxscoreform', handler: boxscoreFormHandler });
    server.route({ method: 'POST', path: '/boxscore', handler: boxscoreHandler });
    server.route({ method: 'GET', path: '/creategameform', handler: createGameFormHandler });
    server.route({ method: 'POST', path: '/game', handler: gameFormHandler });
});

require('./methods')(server, {});

server.register({
    register: require('./plugins/box-score-polling'),
    options: {
        feed: Config.get('/feed'),
        pollingEnabled: Config.get('/pollingEnabled'),
        pollingSchedule: Config.get('/pollingSchedule')
    }
}, (err) => {

    if (err) {
        console.log("Failed to load box-score-polling.");
    }
});

server.register({
    register: require('good'),
    options: {
        reporters: {
            console: [{
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [{
                    response: '*',
                    log: '*'
                }]
            }, {
                module: 'good-console'
            }, 'stdout']
        }
    }
}, (err) => {

    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start((err) => {

        if (err) {
            throw err;
        }
        server.log(['server', 'info'], 'Server started on port: ' + server.info.port);
    });
});
