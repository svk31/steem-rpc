## steem-rpc

A simple websocket wrapper enabling RPC communication with the steem client `steemd` for node.js and browsers.

## Installation
An npm library might be made available once the library matures. For now, clone the repo, do npm install, then require/import the library.

```
git clone https://github.com/svk31/steem-rpc
cd steem-rpc
npm install
```

## Usage
By default the library will connect to Steemit's public websocket api at wss://steemit.com/ws. If you'd like to use another server, simply pass it in the options object:

```
const options = {
	url: "ws://localhost:9090"
}
```

The library needs to initialize a connection and retrieve some api references before it is ready to be used. A simple init and use case can be seen in example/example.js and can be launched with `npm run example`

```
const client = require("../index");

const options = {
	// user: "username",
	// pass: "password",
	// url: "ws://localhost:9090",
	// debug: false
};

var Api = new client(options);

Api.get().initPromise.then(response => {
	console.log("Api ready:", response);

	Api.get().dbApi().exec("get_dynamic_global_properties", []).then(response => {
		console.log("get_dynamic_global_properties", response);
	})
});


```

This library borrows heavily from [James Calfee](https://github.com/jcalfee)'s websocket RPC implementation for the [Bitshares GUI](https://github.com/cryptonomex/graphene-ui/) which can be found here: https://github.com/cryptonomex/graphene-ui/tree/master/dl/src/rpc_api

