const Confidence = require('confidence');

const criteria = {
    env: process.env.NODE_ENV
};

const config = {
    mongoUri: process.env.MONGOURI || 'mongodb://localhost:27017/box-score-caching',
    feed: process.env.FEED || 'https://mysportsfeeds.com/api/feed/pull/nba/'
};

const store = new Confidence.Store(config);

exports.get = function (key) {

    return store.get(key, criteria);
};
