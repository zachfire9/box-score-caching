const Good = require('good');
const Hapi = require('hapi');
const Mongoose = require('mongoose');

const server = new Hapi.Server();

server.connection({ port: 8080 });

mongoUri = 'mongodb://localhost:27017';

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

Mongoose.set('debug', true);

server.log(['plugin', 'info', 'mongoose'], "Mongoose connecting to " + mongoUri);
Mongoose.connect(mongoUri);

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});

server.register({
    register: Good,
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
