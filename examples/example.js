const options = {
	// user: "username",
	// pass: "password",
	// url: "ws://localhost:9090"
};

const {Client} = require("../src/index.js");
var Api = Client.get(options, true);
Api.initPromise.then(response => {
	console.log("Api ready:", response);

	Api.database_api().exec("get_dynamic_global_properties", []).then(response => {
		console.log("get_dynamic_global_properties", response);
	})
});
