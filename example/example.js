const client = require("../index");

const options = {
	// user: "username",
	// pass: "password",
	// url: "ws://localhost:9090"
};

var Api = new client(options);

Api.get().initPromise.then(response => {
	console.log("Api ready:", response);

	Api.get().dbApi().exec("get_dynamic_global_properties", []).then(response => {
		console.log("get_dynamic_global_properties", response);
	})
});
