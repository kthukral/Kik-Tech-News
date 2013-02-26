var feedparser = require('../../node_modules/feedparser');

exports.getArticles = function (callback) {
	feedparser.parseUrl('http://www.theverge.com/rss/index.xml').on('complete',callback);
}
