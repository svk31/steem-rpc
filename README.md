[![npm version](https://badge.fury.io/js/steem-rpc.svg)](https://www.npmjs.com/package/steem-rpc)
[![npm downloads](https://img.shields.io/npm/dm/steem-rpc.svg)](https://www.npmjs.com/package/steem-rpc)
## steem-rpc

A simple websocket wrapper enabling RPC communication with the steem client `steemd` for node.js and browsers.

## Installation
This library is available as an NPM module:

```
npm install steem-rpc
```

If you would like to use it in a browser, browser builds are available in /build. An example is provided in [examples/index.html](examples/index.html)

## Node/Webpack/Browserify usage

The library needs to initialize a connection and retrieve some api references before it is ready to be used. By default steem-rpc will attempt to connect to a public API node provided by [xeroc](https://github.com/xeroc) at `wss://this.piston.rocks`. 

A simple init and use case can be seen in examples/example.js and can be launched with `npm run example`:

```
const options = {
	// user: "username",
	// pass: "password",
	// url: "ws://localhost:9090",
	// debug: false
};
var {Client} = require("steem-rpc");
var Api = Client.get({}, true);

Api.initPromise.then(response => {
	console.log("Api ready:", response);

	Api.database_api().exec("get_dynamic_global_properties", []).then(response => {
		console.log("get_dynamic_global_properties", response);
	})
});

```

If you'd like to use another server, simply pass the new websocket url in the options object:

```
const options = {
	url: "ws://localhost:9090"
}
```

This library borrows heavily from [James Calfee](https://github.com/jcalfee)'s websocket RPC implementation for the [Bitshares GUI](https://github.com/cryptonomex/graphene-ui/) which can be found here: https://github.com/cryptonomex/graphene-ui/tree/master/dl/src/rpc_api


### Example api commands

There's a handy "shortcut" api call that will get you a global state object:

```
get_state(string route)
```

You can call this with an empty string, or with a category like `trending`.

```
Api.database_api().exec("get_state", ["trending"]).then(response => {
	console.log("get_state", response);
})
```

There is no api call to fetch all possible calls, but one can look through the STEEM source code in order to find the available commands with their expected inputs:

[Database api](https://github.com/steemit/steem/blob/dfc550f75e5a2ca40f0d2365739e0597332a78a3/libraries/app/database_api.cpp#L27)
[Market history api](https://github.com/steemit/steem/blob/dfc550f75e5a2ca40f0d2365739e0597332a78a3/libraries/plugins/market_history/include/steemit/market_history/market_history_api.hpp#L59)
[Network broadcast api ++](https://github.com/steemit/steem/blob/dfc550f75e5a2ca40f0d2365739e0597332a78a3/libraries/app/api.cpp#L40)
