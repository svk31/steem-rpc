const Client = require("./src/ApiInstance");

module.exports = function(options) {
	return new Client(options || {});
};
