class Api {

	constructor(wsUrl) {

        var WebSocketClient = typeof(WebSocket) !== "undefined" ? require("ReconnectingWebSocket") : require("websocket").w3cwebsocket;

		try {
			this.ws = new WebSocketClient(wsUrl);
		} catch(err) {
			console.error("ws error:", err);
		}

        this.ws.timeoutInterval = 15000;

		this.connectPromise = new Promise((resolve, reject) => {

			this.ws.onopen = () => {
				resolve();
			}

			this.ws.onerror = (err) => {
				reject(err);
			}

			this.ws.onmessage = (message) => {
				this.listener(JSON.parse(message.data));
			}
		});

		this.currentCallbackId = 0;
		this.callbacks = new Map();
	}

	listener(message) {
		let callback = this.callbacks.get(message.id);
		if (callback) {
			if ("error" in message) {
				callback.reject(message.error);
			} else {
				callback.resolve(message.result);
			}
		}

	}

	call(params) {

		let request = {
            method: "call",
            params: params,
            id: this.currentCallbackId++
        };       

		return new Promise((resolve, reject) => {

            this.callbacks.set(request.id, {
                time: new Date(),
                resolve: resolve,
                reject: reject
            });

            this.ws.onerror = (error) => {
                console.error("!!! WebSocket Error ", error);
                reject(error);
            };

            this.ws.send(JSON.stringify(request));
        });
	}

	getApiByName(api) {
		return this.call([1, "get_api_by_name", [api]]);
	}

    login(user, password) {
        return this.connectPromise.then(() => {
            return this.call([1, "login", [user, password]]);
        });
    }

    close() {
        this.ws.close();
    }
}

module.exports = Api;