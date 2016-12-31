const Confidence = require('confidence');

const criteria = {
    env: process.env.NODE_ENV
};

const config = {
    feed: process.env.FEED || 'https://mysportsfeeds.com/api/feed/pull/nba/'
};

const store = new Confidence.Store(config);

exports.get = function (key) {

    return store.get(key, criteria);
};
