const Client = require("./ApiInstance");

function client(options) {
	return new Client(options || {});
};

module.exports = exports = client;
