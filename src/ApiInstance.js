const WsRpc = require("./WebSocketRpc");
const SteemApi = require("./SteemApi");

const defaultOptions = {
    url: "wss://this.piston.rocks",
    user: "",
    pass: "",
    debug: false,
    apis: ["database_api", "network_broadcast_api"]
};

var apiInstance;

module.exports = {

    setRpcConnectionStatusCallback: function(callback) {
        this.statusCb = callback;
        if(apiInstance) apiInstance.setRpcConnectionStatusCallback(callback);
    },

    reset: function ( options ) {
        if ( apiInstance ) {
            this.close();
        }
        apiInstance = new ApiInstance(options);
        apiInstance.connect();

        return apiInstance;
    },

	get(options, connect) {

		if (!apiInstance) {
			apiInstance = new ApiInstance(options);
		}

        if (connect) {
            apiInstance.setOptions(options);
            apiInstance.connect();
        }

		return apiInstance;
	},

    close: () => {apiInstance.close(); apiInstance = null;}
}

class ApiInstance {

	constructor(options) {
        this.setOptions(options);
	}

    setOptions(options) {
        this.options = Object.assign({}, defaultOptions, options);
        if (this.options.apis.indexOf("database_api") === -1) {
            this.options.apis.unshift("database_api");
        }
        console.log("instance options:", this.options);
    }

	connect() {
		if (this.wsRpc) {
			return;
		}

        try {
            this.wsRpc = new WsRpc(this.options.url);
        } catch(err) {
            console.err("wsRpc open error:", err);
        }

        this.initPromise = this.wsRpc.login(this.options.user, this.options.pass)
        .then(() => {
            var apiPromises = [];

            this.options.apis.forEach(api => {
                this["_" + api] = new SteemApi(this.wsRpc, api);
                this[api] = function() {return this["_" + api];}
                apiPromises.push(this["_" + api].init().then( ()=> {
                    if (api === "database_api") {
                        return this[api]().exec("get_config", []).then((res) => {
                            this.chainId = res.STEEMIT_CHAIN_ID;
                            return "connected to " + api;
                        })
                    } else {
                        return "connected to " + api;
                    }
                }));
            })
            return Promise.all(apiPromises);
        }).catch(err => {
            // console.error("Unable to connect to", this.options.url);
            throw new Error("Unable to connect to " + this.options.url);
        });
	}

    close() {
        if (this.wsRpc) {
            this.wsRpc.close();
            this.wsRpc = null
        }
        this.options = null;
    }
}
