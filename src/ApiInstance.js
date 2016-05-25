const WsRpc = require("./WebSocketRpc");
const SteemApi = require("./SteemApi");

const defaultOptions = {
    url: "wss://steemit.com/ws",
    user: "",
    pass: "",
    debug: false
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
            this._db_api = new SteemApi(this.wsRpc, "database_api");
            
            var db_promise = this._db_api.init().then( ()=> {
                return "connected to db_api";
            });

            return Promise.all([
            	db_promise
            ]);
        });
	}

	dbApi () {
        return this._db_api;
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
}

module.exports = Instance;