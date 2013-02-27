var feedparser = require('../../node_modules/feedparser');

exports.getVergeArticles = function (callback) {
	feedparser.parseUrl('http://www.theverge.com/rss/index.xml').on('complete',callback);
}

exports.getEngadgetArticles = function (callback) {
	feedparser.parseUrl('http://www.engadget.com/rss.xml').on('complete',callback);
}

