const Client = require("./ApiInstance");

module.exports = function(options) {
	return new Client(options || {});
};
