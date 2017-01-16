'use strict';

const Hapi = require('hapi');
const Mongoose = require('mongoose');

const Config = require('./config');

const server = new Hapi.Server();

server.connection({ port: Config.get('/port') });

const mongoUri = Config.get('/mongoUri');

server.on('stop', () => {

    Mongoose.disconnect();
});

Mongoose.connection.on('error', (err) => {

    server.log(['plugin', 'error', 'mongoose'], 'Mongoose error: ' + (err.stack || err));
    throw err;
});

Mongoose.connection.on('open', () => {

    server.log(['plugin', 'info', 'mongoose'], 'Mongoose connected to ' + mongoUri);
});

Mongoose.connection.on('close', (err) => {

    if (err) {
        server.log(['plugin', 'error', 'mongoose'], 'Mongoose error: ' + (err.stack || err));
        throw err;
    }

    server.log(['plugin', 'info', 'mongoose'], 'Mongoose disconnected from ' + mongoUri);
});

Mongoose.connection.on('reconnected', (err) => {

    if (err) {
        server.log(['plugin', 'error', 'mongoose'], 'Mongoose error: ' + (err.stack || err));
        throw err;
    }

    server.log(['plugin', 'info', 'mongoose'], 'Mongoose reconnected to ' + mongoUri);
});

Mongoose.connection.on('timeout', (err) => {

    server.log(['plugin', 'info', 'mongoose'], 'Mongoose timeout: ' + (err.stack || err));
});

if (process.env.NODE_ENV !== 'production') {
    Mongoose.set('debug', true);
}

server.log(['plugin', 'info', 'mongoose'], 'Mongoose connecting to ' + mongoUri);
Mongoose.connect(mongoUri);

server.register(
    require('vision'),
    (err) => {

        if (err) {
            console.log('Failed to load vision.');
        }

        server.views({
            engines: { jade: require('jade') },
            path: __dirname + '/templates',
            compileOptions: {
                pretty: true
            }
        });
    });

server.register(
    require('inert'),
    (err) => {

        if (err) {
            console.log('Failed to load inert.');
        }

        server.route({
            method: 'GET',
            path: '/assets/js/main.js',
            handler: function (request, reply) {

                reply.file('./assets/js/main.js');
            }
        });

        server.route({
            method: 'GET',
            path: '/assets/css/main.css',
            handler: function (request, reply) {

                reply.file('./assets/css/main.css');
            }
        });
    });

server.route(require('./routes'));
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
        console.log('Failed to load box-score-polling.');
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
