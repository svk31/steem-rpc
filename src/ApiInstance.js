const WsRpc = require("./WebSocketRpc");
const SteemApi = require("./SteemApi");

const defaultOptions = {
    url: "wss://steemit.com/ws",
    user: "",
    pass: "",
    debug: false,
    apis: ["database_api"]
};

var apiInstance;

class ApiInstance {

	constructor(options) {
        this.options = Object.assign({}, defaultOptions, options);
	}

	connect() {
		if (this.wsRpc) {
			return;
		}

        if (this.options.debug) {
            console.log("connect options:", this.options);
        }

        this.wsRpc = new WsRpc(this.options.url);
        this.initPromise = this.wsRpc.login(this.options.user, this.options.pass).then(() => {
            // this._db_api = new SteemApi(this.wsRpc, "database_api");

            var apiPromises = [];
            // apiPromises.push(this._db_api.init().then( ()=> {
            //     return "connected to db_api";
            // }));

            this.options.apis.forEach(api => {
                this["_" + api] = new SteemApi(this.wsRpc, api);
                this[api] = function() {return this["_" + api];}
                apiPromises.push(this["_" + api].init().then( ()=> {
                    return "connected to " + api;
                }));
            })

            return Promise.all(apiPromises);
        });
	}
}

class Instance {

    constructor(options) {
        this.options = options;
    }

	get() {
		if (!apiInstance) {
			apiInstance = new ApiInstance(this.options);
			apiInstance.connect();
		}

		return apiInstance;
	}

    close() {
        if (apiInstance) {
            apiInstance.wsRpc.close();
            apiInstance = null;
        }
    }
}

module.exports = Instance;
