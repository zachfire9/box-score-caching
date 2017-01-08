'use strict';

const Confidence = require('confidence');

const criteria = {
    env: process.env.NODE_ENV
};

// $lab:coverage:off$
const config = {
    port: process.env.PORT || 8080,
    pollingEnabled: process.env.PROFILEENABLED || false,
    pollingSchedule: process.env.POLLINGSCHEDULE || 'every 5 mins',
    mongoUri: process.env.MONGOURI || 'mongodb://localhost:27017/box-score-caching',
    feed: process.env.FEED || 'https://mysportsfeeds.com/api/feed/pull/nba/'
};
// $lab:coverage:on$

const store = new Confidence.Store(config);

exports.get = function (key) {

    return store.get(key, criteria);
};
