exports.ping = function (str, callback) {
	console.log(str);
	callback('ping from server');
};
