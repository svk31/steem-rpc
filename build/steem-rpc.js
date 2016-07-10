(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.steemWS = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WsRpc = require("./WebSocketRpc");
var SteemApi = require("./SteemApi");

var defaultOptions = {
    url: "wss://this.piston.rocks",
    user: "",
    pass: "",
    debug: false,
    apis: ["database_api"]
};

var apiInstance;

module.exports = {

    setRpcConnectionStatusCallback: function setRpcConnectionStatusCallback(callback) {
        this.statusCb = callback;
        if (apiInstance) apiInstance.setRpcConnectionStatusCallback(callback);
    },

    reset: function reset(options) {
        if (apiInstance) {
            apiInstance.close();
        }
        apiInstance = new ApiInstance(options);
        apiInstance.connect();

        return apiInstance;
    },

    get: function get(options) {

        if (!apiInstance) {
            apiInstance = new ApiInstance(options);
            apiInstance.connect();
        }

        return apiInstance;
    },


    close: function close() {
        apiInstance.close();apiInstance = null;
    }
};

var ApiInstance = function () {
    function ApiInstance(options) {
        _classCallCheck(this, ApiInstance);

        this.options = Object.assign({}, defaultOptions, options);
        if (this.options.apis.indexOf("database_api") === -1) {
            this.options.apis.unshift("database_api");
        }

        console.log("instance options:", this.options);
    }

    _createClass(ApiInstance, [{
        key: "connect",
        value: function connect() {
            var _this = this;

            if (this.wsRpc) {
                return;
            }

            this.wsRpc = new WsRpc(this.options.url);
            this.initPromise = this.wsRpc.login(this.options.user, this.options.pass).then(function () {
                // this._db_api = new SteemApi(this.wsRpc, "database_api");

                var apiPromises = [];
                // apiPromises.push(this._db_api.init().then( ()=> {
                //     return "connected to db_api";
                // }));

                _this.options.apis.forEach(function (api) {
                    _this["_" + api] = new SteemApi(_this.wsRpc, api);
                    _this[api] = function () {
                        return this["_" + api];
                    };
                    apiPromises.push(_this["_" + api].init().then(function () {
                        if (api === "database_api") {
                            return _this[api]().exec("get_config", []).then(function (res) {
                                _this.chainId = res.STEEMIT_CHAIN_ID;
                                return "connected to " + api;
                            });
                        } else {
                            return "connected to " + api;
                        }
                    }));
                });

                return Promise.all(apiPromises);
            });
        }
    }, {
        key: "close",
        value: function close() {
            this.wsRpc.close();
            this.wsRpc = null;
            this.options = null;
        }
    }]);

    return ApiInstance;
}();
},{"./SteemApi":2,"./WebSocketRpc":3}],2:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SteemApi = function () {
	function SteemApi(wsRpc, apiName) {
		_classCallCheck(this, SteemApi);

		this.wsRpc = wsRpc;
		this.apiName = apiName;
	}

	_createClass(SteemApi, [{
		key: "init",
		value: function init() {
			var _this = this;

			return this.wsRpc.getApiByName(this.apiName).then(function (response) {
				_this.apiId = response;
				return _this;
			});
		}
	}, {
		key: "exec",
		value: function exec(method, params) {
			return this.wsRpc.call([this.apiId, method, params]).catch(function (error) {
				console.error("SteemApi error:", method, params, JSON.stringify(error));
				throw new Error("SteemApi error:" + method + params + JSON.stringify(error));
			});
		}
	}]);

	return SteemApi;
}();

module.exports = SteemApi;
},{}],3:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Api = function () {
	function Api(wsUrl) {
		var _this = this;

		_classCallCheck(this, Api);

		var WebSocketClient = typeof WebSocket !== "undefined" ? require("ReconnectingWebSocket") : require("websocket").w3cwebsocket;

		try {
			this.ws = new WebSocketClient(wsUrl);
		} catch (err) {
			console.error("ws error:", err);
		}

		this.ws.timeoutInterval = 15000;

		this.connectPromise = new Promise(function (resolve, reject) {

			_this.ws.onopen = function () {
				resolve();
			};

			_this.ws.onerror = function (err) {
				reject(err);
			};

			_this.ws.onmessage = function (message) {
				_this.listener(JSON.parse(message.data));
			};
		});

		this.cbId = 0;
		this.cbs = new Map();
	}

	_createClass(Api, [{
		key: "listener",
		value: function listener(message) {
			var callback = this.cbs.get(message.id);
			if (callback) {
				if ("error" in message) {
					callback.reject(message.error);
				} else {
					callback.resolve(message.result);
				}
			}
		}
	}, {
		key: "call",
		value: function call(params) {
			var _this2 = this;

			var request = {
				method: "call",
				params: params,
				id: this.cbId++
			};

			return new Promise(function (resolve, reject) {

				_this2.cbs.set(request.id, {
					time: new Date(),
					resolve: resolve,
					reject: reject
				});

				_this2.ws.onerror = function (error) {
					console.error("!!! WebSocket Error ", error);
					reject(error);
				};

				_this2.ws.send(JSON.stringify(request));
			});
		}
	}, {
		key: "getApiByName",
		value: function getApiByName(api) {
			return this.call([1, "get_api_by_name", [api]]);
		}
	}, {
		key: "login",
		value: function login(user, password) {
			var _this3 = this;

			return this.connectPromise.then(function () {
				return _this3.call([1, "login", [user, password]]);
			});
		}
	}, {
		key: "close",
		value: function close() {
			this.ws.close();
		}
	}]);

	return Api;
}();

module.exports = Api;
},{"ReconnectingWebSocket":5,"websocket":6}],4:[function(require,module,exports){
"use strict";

var Client = require("./ApiInstance");

module.exports = {
	Client: Client
};
},{"./ApiInstance":1}],5:[function(require,module,exports){
// MIT License:
//
// Copyright (c) 2010-2012, Joe Walnes
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * This behaves like a WebSocket in every way, except if it fails to connect,
 * or it gets disconnected, it will repeatedly poll until it successfully connects
 * again.
 *
 * It is API compatible, so when you have:
 *   ws = new WebSocket('ws://....');
 * you can replace with:
 *   ws = new ReconnectingWebSocket('ws://....');
 *
 * The event stream will typically look like:
 *  onconnecting
 *  onopen
 *  onmessage
 *  onmessage
 *  onclose // lost connection
 *  onconnecting
 *  onopen  // sometime later...
 *  onmessage
 *  onmessage
 *  etc...
 *
 * It is API compatible with the standard WebSocket API, apart from the following members:
 *
 * - `bufferedAmount`
 * - `extensions`
 * - `binaryType`
 *
 * Latest version: https://github.com/joewalnes/reconnecting-websocket/
 * - Joe Walnes
 *
 * Syntax
 * ======
 * var socket = new ReconnectingWebSocket(url, protocols, options);
 *
 * Parameters
 * ==========
 * url - The url you are connecting to.
 * protocols - Optional string or array of protocols.
 * options - See below
 *
 * Options
 * =======
 * Options can either be passed upon instantiation or set after instantiation:
 *
 * var socket = new ReconnectingWebSocket(url, null, { debug: true, reconnectInterval: 4000 });
 *
 * or
 *
 * var socket = new ReconnectingWebSocket(url);
 * socket.debug = true;
 * socket.reconnectInterval = 4000;
 *
 * debug
 * - Whether this instance should log debug messages. Accepts true or false. Default: false.
 *
 * automaticOpen
 * - Whether or not the websocket should attempt to connect immediately upon instantiation. The socket can be manually opened or closed at any time using ws.open() and ws.close().
 *
 * reconnectInterval
 * - The number of milliseconds to delay before attempting to reconnect. Accepts integer. Default: 1000.
 *
 * maxReconnectInterval
 * - The maximum number of milliseconds to delay a reconnection attempt. Accepts integer. Default: 30000.
 *
 * reconnectDecay
 * - The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. Accepts integer or float. Default: 1.5.
 *
 * timeoutInterval
 * - The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. Accepts integer. Default: 2000.
 *
 */
(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module !== 'undefined' && module.exports){
        module.exports = factory();
    } else {
        global.ReconnectingWebSocket = factory();
    }
})(this, function () {

    if (!('WebSocket' in window)) {
        return;
    }

    function ReconnectingWebSocket(url, protocols, options) {

        // Default settings
        var settings = {

            /** Whether this instance should log debug messages. */
            debug: false,

            /** Whether or not the websocket should attempt to connect immediately upon instantiation. */
            automaticOpen: true,

            /** The number of milliseconds to delay before attempting to reconnect. */
            reconnectInterval: 1000,
            /** The maximum number of milliseconds to delay a reconnection attempt. */
            maxReconnectInterval: 30000,
            /** The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. */
            reconnectDecay: 1.5,

            /** The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. */
            timeoutInterval: 2000,

            /** The maximum number of reconnection attempts to make. Unlimited if null. */
            maxReconnectAttempts: null,

            /** The binary type, possible values 'blob' or 'arraybuffer', default 'blob'. */
            binaryType: 'blob'
        }
        if (!options) { options = {}; }

        // Overwrite and define settings with options if they exist.
        for (var key in settings) {
            if (typeof options[key] !== 'undefined') {
                this[key] = options[key];
            } else {
                this[key] = settings[key];
            }
        }

        // These should be treated as read-only properties

        /** The URL as resolved by the constructor. This is always an absolute URL. Read only. */
        this.url = url;

        /** The number of attempted reconnects since starting, or the last successful connection. Read only. */
        this.reconnectAttempts = 0;

        /**
         * The current state of the connection.
         * Can be one of: WebSocket.CONNECTING, WebSocket.OPEN, WebSocket.CLOSING, WebSocket.CLOSED
         * Read only.
         */
        this.readyState = WebSocket.CONNECTING;

        /**
         * A string indicating the name of the sub-protocol the server selected; this will be one of
         * the strings specified in the protocols parameter when creating the WebSocket object.
         * Read only.
         */
        this.protocol = null;

        // Private state variables

        var self = this;
        var ws;
        var forcedClose = false;
        var timedOut = false;
        var eventTarget = document.createElement('div');

        // Wire up "on*" properties as event handlers

        eventTarget.addEventListener('open',       function(event) { self.onopen(event); });
        eventTarget.addEventListener('close',      function(event) { self.onclose(event); });
        eventTarget.addEventListener('connecting', function(event) { self.onconnecting(event); });
        eventTarget.addEventListener('message',    function(event) { self.onmessage(event); });
        eventTarget.addEventListener('error',      function(event) { self.onerror(event); });

        // Expose the API required by EventTarget

        this.addEventListener = eventTarget.addEventListener.bind(eventTarget);
        this.removeEventListener = eventTarget.removeEventListener.bind(eventTarget);
        this.dispatchEvent = eventTarget.dispatchEvent.bind(eventTarget);

        /**
         * This function generates an event that is compatible with standard
         * compliant browsers and IE9 - IE11
         *
         * This will prevent the error:
         * Object doesn't support this action
         *
         * http://stackoverflow.com/questions/19345392/why-arent-my-parameters-getting-passed-through-to-a-dispatched-event/19345563#19345563
         * @param s String The name that the event should use
         * @param args Object an optional object that the event will use
         */
        function generateEvent(s, args) {
        	var evt = document.createEvent("CustomEvent");
        	evt.initCustomEvent(s, false, false, args);
        	return evt;
        };

        this.open = function (reconnectAttempt) {
            ws = new WebSocket(self.url, protocols || []);
            ws.binaryType = this.binaryType;

            if (reconnectAttempt) {
                if (this.maxReconnectAttempts && this.reconnectAttempts > this.maxReconnectAttempts) {
                    return;
                }
            } else {
                eventTarget.dispatchEvent(generateEvent('connecting'));
                this.reconnectAttempts = 0;
            }

            if (self.debug || ReconnectingWebSocket.debugAll) {
                console.debug('ReconnectingWebSocket', 'attempt-connect', self.url);
            }

            var localWs = ws;
            var timeout = setTimeout(function() {
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket', 'connection-timeout', self.url);
                }
                timedOut = true;
                localWs.close();
                timedOut = false;
            }, self.timeoutInterval);

            ws.onopen = function(event) {
                clearTimeout(timeout);
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket', 'onopen', self.url);
                }
                self.protocol = ws.protocol;
                self.readyState = WebSocket.OPEN;
                self.reconnectAttempts = 0;
                var e = generateEvent('open');
                e.isReconnect = reconnectAttempt;
                reconnectAttempt = false;
                eventTarget.dispatchEvent(e);
            };

            ws.onclose = function(event) {
                clearTimeout(timeout);
                ws = null;
                if (forcedClose) {
                    self.readyState = WebSocket.CLOSED;
                    eventTarget.dispatchEvent(generateEvent('close'));
                } else {
                    self.readyState = WebSocket.CONNECTING;
                    var e = generateEvent('connecting');
                    e.code = event.code;
                    e.reason = event.reason;
                    e.wasClean = event.wasClean;
                    eventTarget.dispatchEvent(e);
                    if (!reconnectAttempt && !timedOut) {
                        if (self.debug || ReconnectingWebSocket.debugAll) {
                            console.debug('ReconnectingWebSocket', 'onclose', self.url);
                        }
                        eventTarget.dispatchEvent(generateEvent('close'));
                    }

                    var timeout = self.reconnectInterval * Math.pow(self.reconnectDecay, self.reconnectAttempts);
                    setTimeout(function() {
                        self.reconnectAttempts++;
                        self.open(true);
                    }, timeout > self.maxReconnectInterval ? self.maxReconnectInterval : timeout);
                }
            };
            ws.onmessage = function(event) {
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket', 'onmessage', self.url, event.data);
                }
                var e = generateEvent('message');
                e.data = event.data;
                eventTarget.dispatchEvent(e);
            };
            ws.onerror = function(event) {
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket', 'onerror', self.url, event);
                }
                eventTarget.dispatchEvent(generateEvent('error'));
            };
        }

        // Whether or not to create a websocket upon instantiation
        if (this.automaticOpen == true) {
            this.open(false);
        }

        /**
         * Transmits data to the server over the WebSocket connection.
         *
         * @param data a text string, ArrayBuffer or Blob to send to the server.
         */
        this.send = function(data) {
            if (ws) {
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket', 'send', self.url, data);
                }
                return ws.send(data);
            } else {
                throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
            }
        };

        /**
         * Closes the WebSocket connection or connection attempt, if any.
         * If the connection is already CLOSED, this method does nothing.
         */
        this.close = function(code, reason) {
            // Default CLOSE_NORMAL code
            if (typeof code == 'undefined') {
                code = 1000;
            }
            forcedClose = true;
            if (ws) {
                ws.close(code, reason);
            }
        };

        /**
         * Additional public API method to refresh the connection if still open (close, re-open).
         * For example, if the app suspects bad data / missed heart beats, it can try to refresh.
         */
        this.refresh = function() {
            if (ws) {
                ws.close();
            }
        };
    }

    /**
     * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
     * this indicates that the connection is ready to send and receive data.
     */
    ReconnectingWebSocket.prototype.onopen = function(event) {};
    /** An event listener to be called when the WebSocket connection's readyState changes to CLOSED. */
    ReconnectingWebSocket.prototype.onclose = function(event) {};
    /** An event listener to be called when a connection begins being attempted. */
    ReconnectingWebSocket.prototype.onconnecting = function(event) {};
    /** An event listener to be called when a message is received from the server. */
    ReconnectingWebSocket.prototype.onmessage = function(event) {};
    /** An event listener to be called when an error occurs. */
    ReconnectingWebSocket.prototype.onerror = function(event) {};

    /**
     * Whether all instances of ReconnectingWebSocket should log debug messages.
     * Setting this to true is the equivalent of setting all instances of ReconnectingWebSocket.debug to true.
     */
    ReconnectingWebSocket.debugAll = false;

    ReconnectingWebSocket.CONNECTING = WebSocket.CONNECTING;
    ReconnectingWebSocket.OPEN = WebSocket.OPEN;
    ReconnectingWebSocket.CLOSING = WebSocket.CLOSING;
    ReconnectingWebSocket.CLOSED = WebSocket.CLOSED;

    return ReconnectingWebSocket;
});

},{}],6:[function(require,module,exports){

},{}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvQXBpSW5zdGFuY2UuanMiLCJsaWIvU3RlZW1BcGkuanMiLCJsaWIvV2ViU29ja2V0UnBjLmpzIiwibGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL1JlY29ubmVjdGluZ1dlYlNvY2tldC9yZWNvbm5lY3Rpbmctd2Vic29ja2V0LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9lbXB0eS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdXQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIFdzUnBjID0gcmVxdWlyZShcIi4vV2ViU29ja2V0UnBjXCIpO1xudmFyIFN0ZWVtQXBpID0gcmVxdWlyZShcIi4vU3RlZW1BcGlcIik7XG5cbnZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICB1cmw6IFwid3NzOi8vdGhpcy5waXN0b24ucm9ja3NcIixcbiAgICB1c2VyOiBcIlwiLFxuICAgIHBhc3M6IFwiXCIsXG4gICAgZGVidWc6IGZhbHNlLFxuICAgIGFwaXM6IFtcImRhdGFiYXNlX2FwaVwiXVxufTtcblxudmFyIGFwaUluc3RhbmNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIHNldFJwY0Nvbm5lY3Rpb25TdGF0dXNDYWxsYmFjazogZnVuY3Rpb24gc2V0UnBjQ29ubmVjdGlvblN0YXR1c0NhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQ2IgPSBjYWxsYmFjaztcbiAgICAgICAgaWYgKGFwaUluc3RhbmNlKSBhcGlJbnN0YW5jZS5zZXRScGNDb25uZWN0aW9uU3RhdHVzQ2FsbGJhY2soY2FsbGJhY2spO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gcmVzZXQob3B0aW9ucykge1xuICAgICAgICBpZiAoYXBpSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIGFwaUluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgYXBpSW5zdGFuY2UgPSBuZXcgQXBpSW5zdGFuY2Uob3B0aW9ucyk7XG4gICAgICAgIGFwaUluc3RhbmNlLmNvbm5lY3QoKTtcblxuICAgICAgICByZXR1cm4gYXBpSW5zdGFuY2U7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24gZ2V0KG9wdGlvbnMpIHtcblxuICAgICAgICBpZiAoIWFwaUluc3RhbmNlKSB7XG4gICAgICAgICAgICBhcGlJbnN0YW5jZSA9IG5ldyBBcGlJbnN0YW5jZShvcHRpb25zKTtcbiAgICAgICAgICAgIGFwaUluc3RhbmNlLmNvbm5lY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcGlJbnN0YW5jZTtcbiAgICB9LFxuXG5cbiAgICBjbG9zZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgIGFwaUluc3RhbmNlLmNsb3NlKCk7YXBpSW5zdGFuY2UgPSBudWxsO1xuICAgIH1cbn07XG5cbnZhciBBcGlJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBcGlJbnN0YW5jZShvcHRpb25zKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBcGlJbnN0YW5jZSk7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFwaXMuaW5kZXhPZihcImRhdGFiYXNlX2FwaVwiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5hcGlzLnVuc2hpZnQoXCJkYXRhYmFzZV9hcGlcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhcImluc3RhbmNlIG9wdGlvbnM6XCIsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKEFwaUluc3RhbmNlLCBbe1xuICAgICAgICBrZXk6IFwiY29ubmVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY29ubmVjdCgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLndzUnBjKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLndzUnBjID0gbmV3IFdzUnBjKHRoaXMub3B0aW9ucy51cmwpO1xuICAgICAgICAgICAgdGhpcy5pbml0UHJvbWlzZSA9IHRoaXMud3NScGMubG9naW4odGhpcy5vcHRpb25zLnVzZXIsIHRoaXMub3B0aW9ucy5wYXNzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLl9kYl9hcGkgPSBuZXcgU3RlZW1BcGkodGhpcy53c1JwYywgXCJkYXRhYmFzZV9hcGlcIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXBpUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAvLyBhcGlQcm9taXNlcy5wdXNoKHRoaXMuX2RiX2FwaS5pbml0KCkudGhlbiggKCk9PiB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBcImNvbm5lY3RlZCB0byBkYl9hcGlcIjtcbiAgICAgICAgICAgICAgICAvLyB9KSk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5vcHRpb25zLmFwaXMuZm9yRWFjaChmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzW1wiX1wiICsgYXBpXSA9IG5ldyBTdGVlbUFwaShfdGhpcy53c1JwYywgYXBpKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXNbYXBpXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW1wiX1wiICsgYXBpXTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYXBpUHJvbWlzZXMucHVzaChfdGhpc1tcIl9cIiArIGFwaV0uaW5pdCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFwaSA9PT0gXCJkYXRhYmFzZV9hcGlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpc1thcGldKCkuZXhlYyhcImdldF9jb25maWdcIiwgW10pLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5jaGFpbklkID0gcmVzLlNURUVNSVRfQ0hBSU5fSUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImNvbm5lY3RlZCB0byBcIiArIGFwaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiY29ubmVjdGVkIHRvIFwiICsgYXBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoYXBpUHJvbWlzZXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjbG9zZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgICAgICB0aGlzLndzUnBjLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLndzUnBjID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gQXBpSW5zdGFuY2U7XG59KCk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBTdGVlbUFwaSA9IGZ1bmN0aW9uICgpIHtcblx0ZnVuY3Rpb24gU3RlZW1BcGkod3NScGMsIGFwaU5hbWUpIHtcblx0XHRfY2xhc3NDYWxsQ2hlY2sodGhpcywgU3RlZW1BcGkpO1xuXG5cdFx0dGhpcy53c1JwYyA9IHdzUnBjO1xuXHRcdHRoaXMuYXBpTmFtZSA9IGFwaU5hbWU7XG5cdH1cblxuXHRfY3JlYXRlQ2xhc3MoU3RlZW1BcGksIFt7XG5cdFx0a2V5OiBcImluaXRcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRcdHJldHVybiB0aGlzLndzUnBjLmdldEFwaUJ5TmFtZSh0aGlzLmFwaU5hbWUpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdF90aGlzLmFwaUlkID0gcmVzcG9uc2U7XG5cdFx0XHRcdHJldHVybiBfdGhpcztcblx0XHRcdH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJleGVjXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGV4ZWMobWV0aG9kLCBwYXJhbXMpIHtcblx0XHRcdHJldHVybiB0aGlzLndzUnBjLmNhbGwoW3RoaXMuYXBpSWQsIG1ldGhvZCwgcGFyYW1zXSkuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJTdGVlbUFwaSBlcnJvcjpcIiwgbWV0aG9kLCBwYXJhbXMsIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIlN0ZWVtQXBpIGVycm9yOlwiICsgbWV0aG9kICsgcGFyYW1zICsgSlNPTi5zdHJpbmdpZnkoZXJyb3IpKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fV0pO1xuXG5cdHJldHVybiBTdGVlbUFwaTtcbn0oKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGVlbUFwaTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIEFwaSA9IGZ1bmN0aW9uICgpIHtcblx0ZnVuY3Rpb24gQXBpKHdzVXJsKSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBcGkpO1xuXG5cdFx0dmFyIFdlYlNvY2tldENsaWVudCA9IHR5cGVvZiBXZWJTb2NrZXQgIT09IFwidW5kZWZpbmVkXCIgPyByZXF1aXJlKFwiUmVjb25uZWN0aW5nV2ViU29ja2V0XCIpIDogcmVxdWlyZShcIndlYnNvY2tldFwiKS53M2N3ZWJzb2NrZXQ7XG5cblx0XHR0cnkge1xuXHRcdFx0dGhpcy53cyA9IG5ldyBXZWJTb2NrZXRDbGllbnQod3NVcmwpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIndzIGVycm9yOlwiLCBlcnIpO1xuXHRcdH1cblxuXHRcdHRoaXMud3MudGltZW91dEludGVydmFsID0gMTUwMDA7XG5cblx0XHR0aGlzLmNvbm5lY3RQcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG5cdFx0XHRfdGhpcy53cy5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH07XG5cblx0XHRcdF90aGlzLndzLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0fTtcblxuXHRcdFx0X3RoaXMud3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblx0XHRcdFx0X3RoaXMubGlzdGVuZXIoSlNPTi5wYXJzZShtZXNzYWdlLmRhdGEpKTtcblx0XHRcdH07XG5cdFx0fSk7XG5cblx0XHR0aGlzLmNiSWQgPSAwO1xuXHRcdHRoaXMuY2JzID0gbmV3IE1hcCgpO1xuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKEFwaSwgW3tcblx0XHRrZXk6IFwibGlzdGVuZXJcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gbGlzdGVuZXIobWVzc2FnZSkge1xuXHRcdFx0dmFyIGNhbGxiYWNrID0gdGhpcy5jYnMuZ2V0KG1lc3NhZ2UuaWQpO1xuXHRcdFx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0XHRcdGlmIChcImVycm9yXCIgaW4gbWVzc2FnZSkge1xuXHRcdFx0XHRcdGNhbGxiYWNrLnJlamVjdChtZXNzYWdlLmVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjYWxsYmFjay5yZXNvbHZlKG1lc3NhZ2UucmVzdWx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJjYWxsXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGNhbGwocGFyYW1zKSB7XG5cdFx0XHR2YXIgX3RoaXMyID0gdGhpcztcblxuXHRcdFx0dmFyIHJlcXVlc3QgPSB7XG5cdFx0XHRcdG1ldGhvZDogXCJjYWxsXCIsXG5cdFx0XHRcdHBhcmFtczogcGFyYW1zLFxuXHRcdFx0XHRpZDogdGhpcy5jYklkKytcblx0XHRcdH07XG5cblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblx0XHRcdFx0X3RoaXMyLmNicy5zZXQocmVxdWVzdC5pZCwge1xuXHRcdFx0XHRcdHRpbWU6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0cmVzb2x2ZTogcmVzb2x2ZSxcblx0XHRcdFx0XHRyZWplY3Q6IHJlamVjdFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfdGhpczIud3Mub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCIhISEgV2ViU29ja2V0IEVycm9yIFwiLCBlcnJvcik7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRfdGhpczIud3Muc2VuZChKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiZ2V0QXBpQnlOYW1lXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGdldEFwaUJ5TmFtZShhcGkpIHtcblx0XHRcdHJldHVybiB0aGlzLmNhbGwoWzEsIFwiZ2V0X2FwaV9ieV9uYW1lXCIsIFthcGldXSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImxvZ2luXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGxvZ2luKHVzZXIsIHBhc3N3b3JkKSB7XG5cdFx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdFx0cmV0dXJuIHRoaXMuY29ubmVjdFByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiBfdGhpczMuY2FsbChbMSwgXCJsb2dpblwiLCBbdXNlciwgcGFzc3dvcmRdXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiY2xvc2VcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gY2xvc2UoKSB7XG5cdFx0XHR0aGlzLndzLmNsb3NlKCk7XG5cdFx0fVxuXHR9XSk7XG5cblx0cmV0dXJuIEFwaTtcbn0oKTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcGk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBDbGllbnQgPSByZXF1aXJlKFwiLi9BcGlJbnN0YW5jZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdENsaWVudDogQ2xpZW50XG59OyIsIi8vIE1JVCBMaWNlbnNlOlxuLy9cbi8vIENvcHlyaWdodCAoYykgMjAxMC0yMDEyLCBKb2UgV2FsbmVzXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuLyoqXG4gKiBUaGlzIGJlaGF2ZXMgbGlrZSBhIFdlYlNvY2tldCBpbiBldmVyeSB3YXksIGV4Y2VwdCBpZiBpdCBmYWlscyB0byBjb25uZWN0LFxuICogb3IgaXQgZ2V0cyBkaXNjb25uZWN0ZWQsIGl0IHdpbGwgcmVwZWF0ZWRseSBwb2xsIHVudGlsIGl0IHN1Y2Nlc3NmdWxseSBjb25uZWN0c1xuICogYWdhaW4uXG4gKlxuICogSXQgaXMgQVBJIGNvbXBhdGlibGUsIHNvIHdoZW4geW91IGhhdmU6XG4gKiAgIHdzID0gbmV3IFdlYlNvY2tldCgnd3M6Ly8uLi4uJyk7XG4gKiB5b3UgY2FuIHJlcGxhY2Ugd2l0aDpcbiAqICAgd3MgPSBuZXcgUmVjb25uZWN0aW5nV2ViU29ja2V0KCd3czovLy4uLi4nKTtcbiAqXG4gKiBUaGUgZXZlbnQgc3RyZWFtIHdpbGwgdHlwaWNhbGx5IGxvb2sgbGlrZTpcbiAqICBvbmNvbm5lY3RpbmdcbiAqICBvbm9wZW5cbiAqICBvbm1lc3NhZ2VcbiAqICBvbm1lc3NhZ2VcbiAqICBvbmNsb3NlIC8vIGxvc3QgY29ubmVjdGlvblxuICogIG9uY29ubmVjdGluZ1xuICogIG9ub3BlbiAgLy8gc29tZXRpbWUgbGF0ZXIuLi5cbiAqICBvbm1lc3NhZ2VcbiAqICBvbm1lc3NhZ2VcbiAqICBldGMuLi5cbiAqXG4gKiBJdCBpcyBBUEkgY29tcGF0aWJsZSB3aXRoIHRoZSBzdGFuZGFyZCBXZWJTb2NrZXQgQVBJLCBhcGFydCBmcm9tIHRoZSBmb2xsb3dpbmcgbWVtYmVyczpcbiAqXG4gKiAtIGBidWZmZXJlZEFtb3VudGBcbiAqIC0gYGV4dGVuc2lvbnNgXG4gKiAtIGBiaW5hcnlUeXBlYFxuICpcbiAqIExhdGVzdCB2ZXJzaW9uOiBodHRwczovL2dpdGh1Yi5jb20vam9ld2FsbmVzL3JlY29ubmVjdGluZy13ZWJzb2NrZXQvXG4gKiAtIEpvZSBXYWxuZXNcbiAqXG4gKiBTeW50YXhcbiAqID09PT09PVxuICogdmFyIHNvY2tldCA9IG5ldyBSZWNvbm5lY3RpbmdXZWJTb2NrZXQodXJsLCBwcm90b2NvbHMsIG9wdGlvbnMpO1xuICpcbiAqIFBhcmFtZXRlcnNcbiAqID09PT09PT09PT1cbiAqIHVybCAtIFRoZSB1cmwgeW91IGFyZSBjb25uZWN0aW5nIHRvLlxuICogcHJvdG9jb2xzIC0gT3B0aW9uYWwgc3RyaW5nIG9yIGFycmF5IG9mIHByb3RvY29scy5cbiAqIG9wdGlvbnMgLSBTZWUgYmVsb3dcbiAqXG4gKiBPcHRpb25zXG4gKiA9PT09PT09XG4gKiBPcHRpb25zIGNhbiBlaXRoZXIgYmUgcGFzc2VkIHVwb24gaW5zdGFudGlhdGlvbiBvciBzZXQgYWZ0ZXIgaW5zdGFudGlhdGlvbjpcbiAqXG4gKiB2YXIgc29ja2V0ID0gbmV3IFJlY29ubmVjdGluZ1dlYlNvY2tldCh1cmwsIG51bGwsIHsgZGVidWc6IHRydWUsIHJlY29ubmVjdEludGVydmFsOiA0MDAwIH0pO1xuICpcbiAqIG9yXG4gKlxuICogdmFyIHNvY2tldCA9IG5ldyBSZWNvbm5lY3RpbmdXZWJTb2NrZXQodXJsKTtcbiAqIHNvY2tldC5kZWJ1ZyA9IHRydWU7XG4gKiBzb2NrZXQucmVjb25uZWN0SW50ZXJ2YWwgPSA0MDAwO1xuICpcbiAqIGRlYnVnXG4gKiAtIFdoZXRoZXIgdGhpcyBpbnN0YW5jZSBzaG91bGQgbG9nIGRlYnVnIG1lc3NhZ2VzLiBBY2NlcHRzIHRydWUgb3IgZmFsc2UuIERlZmF1bHQ6IGZhbHNlLlxuICpcbiAqIGF1dG9tYXRpY09wZW5cbiAqIC0gV2hldGhlciBvciBub3QgdGhlIHdlYnNvY2tldCBzaG91bGQgYXR0ZW1wdCB0byBjb25uZWN0IGltbWVkaWF0ZWx5IHVwb24gaW5zdGFudGlhdGlvbi4gVGhlIHNvY2tldCBjYW4gYmUgbWFudWFsbHkgb3BlbmVkIG9yIGNsb3NlZCBhdCBhbnkgdGltZSB1c2luZyB3cy5vcGVuKCkgYW5kIHdzLmNsb3NlKCkuXG4gKlxuICogcmVjb25uZWN0SW50ZXJ2YWxcbiAqIC0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkgYmVmb3JlIGF0dGVtcHRpbmcgdG8gcmVjb25uZWN0LiBBY2NlcHRzIGludGVnZXIuIERlZmF1bHQ6IDEwMDAuXG4gKlxuICogbWF4UmVjb25uZWN0SW50ZXJ2YWxcbiAqIC0gVGhlIG1heGltdW0gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheSBhIHJlY29ubmVjdGlvbiBhdHRlbXB0LiBBY2NlcHRzIGludGVnZXIuIERlZmF1bHQ6IDMwMDAwLlxuICpcbiAqIHJlY29ubmVjdERlY2F5XG4gKiAtIFRoZSByYXRlIG9mIGluY3JlYXNlIG9mIHRoZSByZWNvbm5lY3QgZGVsYXkuIEFsbG93cyByZWNvbm5lY3QgYXR0ZW1wdHMgdG8gYmFjayBvZmYgd2hlbiBwcm9ibGVtcyBwZXJzaXN0LiBBY2NlcHRzIGludGVnZXIgb3IgZmxvYXQuIERlZmF1bHQ6IDEuNS5cbiAqXG4gKiB0aW1lb3V0SW50ZXJ2YWxcbiAqIC0gVGhlIG1heGltdW0gdGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBmb3IgYSBjb25uZWN0aW9uIHRvIHN1Y2NlZWQgYmVmb3JlIGNsb3NpbmcgYW5kIHJldHJ5aW5nLiBBY2NlcHRzIGludGVnZXIuIERlZmF1bHQ6IDIwMDAuXG4gKlxuICovXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKXtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZ2xvYmFsLlJlY29ubmVjdGluZ1dlYlNvY2tldCA9IGZhY3RvcnkoKTtcbiAgICB9XG59KSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbiAgICBpZiAoISgnV2ViU29ja2V0JyBpbiB3aW5kb3cpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBSZWNvbm5lY3RpbmdXZWJTb2NrZXQodXJsLCBwcm90b2NvbHMsIG9wdGlvbnMpIHtcblxuICAgICAgICAvLyBEZWZhdWx0IHNldHRpbmdzXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcblxuICAgICAgICAgICAgLyoqIFdoZXRoZXIgdGhpcyBpbnN0YW5jZSBzaG91bGQgbG9nIGRlYnVnIG1lc3NhZ2VzLiAqL1xuICAgICAgICAgICAgZGVidWc6IGZhbHNlLFxuXG4gICAgICAgICAgICAvKiogV2hldGhlciBvciBub3QgdGhlIHdlYnNvY2tldCBzaG91bGQgYXR0ZW1wdCB0byBjb25uZWN0IGltbWVkaWF0ZWx5IHVwb24gaW5zdGFudGlhdGlvbi4gKi9cbiAgICAgICAgICAgIGF1dG9tYXRpY09wZW46IHRydWUsXG5cbiAgICAgICAgICAgIC8qKiBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheSBiZWZvcmUgYXR0ZW1wdGluZyB0byByZWNvbm5lY3QuICovXG4gICAgICAgICAgICByZWNvbm5lY3RJbnRlcnZhbDogMTAwMCxcbiAgICAgICAgICAgIC8qKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5IGEgcmVjb25uZWN0aW9uIGF0dGVtcHQuICovXG4gICAgICAgICAgICBtYXhSZWNvbm5lY3RJbnRlcnZhbDogMzAwMDAsXG4gICAgICAgICAgICAvKiogVGhlIHJhdGUgb2YgaW5jcmVhc2Ugb2YgdGhlIHJlY29ubmVjdCBkZWxheS4gQWxsb3dzIHJlY29ubmVjdCBhdHRlbXB0cyB0byBiYWNrIG9mZiB3aGVuIHByb2JsZW1zIHBlcnNpc3QuICovXG4gICAgICAgICAgICByZWNvbm5lY3REZWNheTogMS41LFxuXG4gICAgICAgICAgICAvKiogVGhlIG1heGltdW0gdGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBmb3IgYSBjb25uZWN0aW9uIHRvIHN1Y2NlZWQgYmVmb3JlIGNsb3NpbmcgYW5kIHJldHJ5aW5nLiAqL1xuICAgICAgICAgICAgdGltZW91dEludGVydmFsOiAyMDAwLFxuXG4gICAgICAgICAgICAvKiogVGhlIG1heGltdW0gbnVtYmVyIG9mIHJlY29ubmVjdGlvbiBhdHRlbXB0cyB0byBtYWtlLiBVbmxpbWl0ZWQgaWYgbnVsbC4gKi9cbiAgICAgICAgICAgIG1heFJlY29ubmVjdEF0dGVtcHRzOiBudWxsLFxuXG4gICAgICAgICAgICAvKiogVGhlIGJpbmFyeSB0eXBlLCBwb3NzaWJsZSB2YWx1ZXMgJ2Jsb2InIG9yICdhcnJheWJ1ZmZlcicsIGRlZmF1bHQgJ2Jsb2InLiAqL1xuICAgICAgICAgICAgYmluYXJ5VHlwZTogJ2Jsb2InXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zKSB7IG9wdGlvbnMgPSB7fTsgfVxuXG4gICAgICAgIC8vIE92ZXJ3cml0ZSBhbmQgZGVmaW5lIHNldHRpbmdzIHdpdGggb3B0aW9ucyBpZiB0aGV5IGV4aXN0LlxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gc2V0dGluZ3MpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uc1trZXldICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpc1trZXldID0gc2V0dGluZ3Nba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZXNlIHNob3VsZCBiZSB0cmVhdGVkIGFzIHJlYWQtb25seSBwcm9wZXJ0aWVzXG5cbiAgICAgICAgLyoqIFRoZSBVUkwgYXMgcmVzb2x2ZWQgYnkgdGhlIGNvbnN0cnVjdG9yLiBUaGlzIGlzIGFsd2F5cyBhbiBhYnNvbHV0ZSBVUkwuIFJlYWQgb25seS4gKi9cbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG5cbiAgICAgICAgLyoqIFRoZSBudW1iZXIgb2YgYXR0ZW1wdGVkIHJlY29ubmVjdHMgc2luY2Ugc3RhcnRpbmcsIG9yIHRoZSBsYXN0IHN1Y2Nlc3NmdWwgY29ubmVjdGlvbi4gUmVhZCBvbmx5LiAqL1xuICAgICAgICB0aGlzLnJlY29ubmVjdEF0dGVtcHRzID0gMDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGNvbm5lY3Rpb24uXG4gICAgICAgICAqIENhbiBiZSBvbmUgb2Y6IFdlYlNvY2tldC5DT05ORUNUSU5HLCBXZWJTb2NrZXQuT1BFTiwgV2ViU29ja2V0LkNMT1NJTkcsIFdlYlNvY2tldC5DTE9TRURcbiAgICAgICAgICogUmVhZCBvbmx5LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gV2ViU29ja2V0LkNPTk5FQ1RJTkc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgc3RyaW5nIGluZGljYXRpbmcgdGhlIG5hbWUgb2YgdGhlIHN1Yi1wcm90b2NvbCB0aGUgc2VydmVyIHNlbGVjdGVkOyB0aGlzIHdpbGwgYmUgb25lIG9mXG4gICAgICAgICAqIHRoZSBzdHJpbmdzIHNwZWNpZmllZCBpbiB0aGUgcHJvdG9jb2xzIHBhcmFtZXRlciB3aGVuIGNyZWF0aW5nIHRoZSBXZWJTb2NrZXQgb2JqZWN0LlxuICAgICAgICAgKiBSZWFkIG9ubHkuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnByb3RvY29sID0gbnVsbDtcblxuICAgICAgICAvLyBQcml2YXRlIHN0YXRlIHZhcmlhYmxlc1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHdzO1xuICAgICAgICB2YXIgZm9yY2VkQ2xvc2UgPSBmYWxzZTtcbiAgICAgICAgdmFyIHRpbWVkT3V0ID0gZmFsc2U7XG4gICAgICAgIHZhciBldmVudFRhcmdldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIC8vIFdpcmUgdXAgXCJvbipcIiBwcm9wZXJ0aWVzIGFzIGV2ZW50IGhhbmRsZXJzXG5cbiAgICAgICAgZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsICAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7IHNlbGYub25vcGVuKGV2ZW50KTsgfSk7XG4gICAgICAgIGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2Nsb3NlJywgICAgICBmdW5jdGlvbihldmVudCkgeyBzZWxmLm9uY2xvc2UoZXZlbnQpOyB9KTtcbiAgICAgICAgZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignY29ubmVjdGluZycsIGZ1bmN0aW9uKGV2ZW50KSB7IHNlbGYub25jb25uZWN0aW5nKGV2ZW50KTsgfSk7XG4gICAgICAgIGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCAgICBmdW5jdGlvbihldmVudCkgeyBzZWxmLm9ubWVzc2FnZShldmVudCk7IH0pO1xuICAgICAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICAgICAgZnVuY3Rpb24oZXZlbnQpIHsgc2VsZi5vbmVycm9yKGV2ZW50KTsgfSk7XG5cbiAgICAgICAgLy8gRXhwb3NlIHRoZSBBUEkgcmVxdWlyZWQgYnkgRXZlbnRUYXJnZXRcblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIgPSBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyLmJpbmQoZXZlbnRUYXJnZXQpO1xuICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBldmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyLmJpbmQoZXZlbnRUYXJnZXQpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQgPSBldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50LmJpbmQoZXZlbnRUYXJnZXQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIGdlbmVyYXRlcyBhbiBldmVudCB0aGF0IGlzIGNvbXBhdGlibGUgd2l0aCBzdGFuZGFyZFxuICAgICAgICAgKiBjb21wbGlhbnQgYnJvd3NlcnMgYW5kIElFOSAtIElFMTFcbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyB3aWxsIHByZXZlbnQgdGhlIGVycm9yOlxuICAgICAgICAgKiBPYmplY3QgZG9lc24ndCBzdXBwb3J0IHRoaXMgYWN0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTkzNDUzOTIvd2h5LWFyZW50LW15LXBhcmFtZXRlcnMtZ2V0dGluZy1wYXNzZWQtdGhyb3VnaC10by1hLWRpc3BhdGNoZWQtZXZlbnQvMTkzNDU1NjMjMTkzNDU1NjNcbiAgICAgICAgICogQHBhcmFtIHMgU3RyaW5nIFRoZSBuYW1lIHRoYXQgdGhlIGV2ZW50IHNob3VsZCB1c2VcbiAgICAgICAgICogQHBhcmFtIGFyZ3MgT2JqZWN0IGFuIG9wdGlvbmFsIG9iamVjdCB0aGF0IHRoZSBldmVudCB3aWxsIHVzZVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVFdmVudChzLCBhcmdzKSB7XG4gICAgICAgIFx0dmFyIGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiQ3VzdG9tRXZlbnRcIik7XG4gICAgICAgIFx0ZXZ0LmluaXRDdXN0b21FdmVudChzLCBmYWxzZSwgZmFsc2UsIGFyZ3MpO1xuICAgICAgICBcdHJldHVybiBldnQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5vcGVuID0gZnVuY3Rpb24gKHJlY29ubmVjdEF0dGVtcHQpIHtcbiAgICAgICAgICAgIHdzID0gbmV3IFdlYlNvY2tldChzZWxmLnVybCwgcHJvdG9jb2xzIHx8IFtdKTtcbiAgICAgICAgICAgIHdzLmJpbmFyeVR5cGUgPSB0aGlzLmJpbmFyeVR5cGU7XG5cbiAgICAgICAgICAgIGlmIChyZWNvbm5lY3RBdHRlbXB0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWF4UmVjb25uZWN0QXR0ZW1wdHMgJiYgdGhpcy5yZWNvbm5lY3RBdHRlbXB0cyA+IHRoaXMubWF4UmVjb25uZWN0QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChnZW5lcmF0ZUV2ZW50KCdjb25uZWN0aW5nJykpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVjb25uZWN0QXR0ZW1wdHMgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VsZi5kZWJ1ZyB8fCBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWdBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnYXR0ZW1wdC1jb25uZWN0Jywgc2VsZi51cmwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbG9jYWxXcyA9IHdzO1xuICAgICAgICAgICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnY29ubmVjdGlvbi10aW1lb3V0Jywgc2VsZi51cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aW1lZE91dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbG9jYWxXcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIHRpbWVkT3V0ID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBzZWxmLnRpbWVvdXRJbnRlcnZhbCk7XG5cbiAgICAgICAgICAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnb25vcGVuJywgc2VsZi51cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnByb3RvY29sID0gd3MucHJvdG9jb2w7XG4gICAgICAgICAgICAgICAgc2VsZi5yZWFkeVN0YXRlID0gV2ViU29ja2V0Lk9QRU47XG4gICAgICAgICAgICAgICAgc2VsZi5yZWNvbm5lY3RBdHRlbXB0cyA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSBnZW5lcmF0ZUV2ZW50KCdvcGVuJyk7XG4gICAgICAgICAgICAgICAgZS5pc1JlY29ubmVjdCA9IHJlY29ubmVjdEF0dGVtcHQ7XG4gICAgICAgICAgICAgICAgcmVjb25uZWN0QXR0ZW1wdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB3cy5vbmNsb3NlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICAgICAgd3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlmIChmb3JjZWRDbG9zZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlYWR5U3RhdGUgPSBXZWJTb2NrZXQuQ0xPU0VEO1xuICAgICAgICAgICAgICAgICAgICBldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50KGdlbmVyYXRlRXZlbnQoJ2Nsb3NlJykpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmVhZHlTdGF0ZSA9IFdlYlNvY2tldC5DT05ORUNUSU5HO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZSA9IGdlbmVyYXRlRXZlbnQoJ2Nvbm5lY3RpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgZS5jb2RlID0gZXZlbnQuY29kZTtcbiAgICAgICAgICAgICAgICAgICAgZS5yZWFzb24gPSBldmVudC5yZWFzb247XG4gICAgICAgICAgICAgICAgICAgIGUud2FzQ2xlYW4gPSBldmVudC53YXNDbGVhbjtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZWNvbm5lY3RBdHRlbXB0ICYmICF0aW1lZE91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVjb25uZWN0aW5nV2ViU29ja2V0JywgJ29uY2xvc2UnLCBzZWxmLnVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50KGdlbmVyYXRlRXZlbnQoJ2Nsb3NlJykpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRpbWVvdXQgPSBzZWxmLnJlY29ubmVjdEludGVydmFsICogTWF0aC5wb3coc2VsZi5yZWNvbm5lY3REZWNheSwgc2VsZi5yZWNvbm5lY3RBdHRlbXB0cyk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlY29ubmVjdEF0dGVtcHRzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9wZW4odHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRpbWVvdXQgPiBzZWxmLm1heFJlY29ubmVjdEludGVydmFsID8gc2VsZi5tYXhSZWNvbm5lY3RJbnRlcnZhbCA6IHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB3cy5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnb25tZXNzYWdlJywgc2VsZi51cmwsIGV2ZW50LmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZSA9IGdlbmVyYXRlRXZlbnQoJ21lc3NhZ2UnKTtcbiAgICAgICAgICAgICAgICBlLmRhdGEgPSBldmVudC5kYXRhO1xuICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgd3Mub25lcnJvciA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdvbmVycm9yJywgc2VsZi51cmwsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChnZW5lcmF0ZUV2ZW50KCdlcnJvcicpKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXaGV0aGVyIG9yIG5vdCB0byBjcmVhdGUgYSB3ZWJzb2NrZXQgdXBvbiBpbnN0YW50aWF0aW9uXG4gICAgICAgIGlmICh0aGlzLmF1dG9tYXRpY09wZW4gPT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5vcGVuKGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmFuc21pdHMgZGF0YSB0byB0aGUgc2VydmVyIG92ZXIgdGhlIFdlYlNvY2tldCBjb25uZWN0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gZGF0YSBhIHRleHQgc3RyaW5nLCBBcnJheUJ1ZmZlciBvciBCbG9iIHRvIHNlbmQgdG8gdGhlIHNlcnZlci5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmICh3cykge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnc2VuZCcsIHNlbGYudXJsLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdzLnNlbmQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdJTlZBTElEX1NUQVRFX0VSUiA6IFBhdXNpbmcgdG8gcmVjb25uZWN0IHdlYnNvY2tldCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsb3NlcyB0aGUgV2ViU29ja2V0IGNvbm5lY3Rpb24gb3IgY29ubmVjdGlvbiBhdHRlbXB0LCBpZiBhbnkuXG4gICAgICAgICAqIElmIHRoZSBjb25uZWN0aW9uIGlzIGFscmVhZHkgQ0xPU0VELCB0aGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24oY29kZSwgcmVhc29uKSB7XG4gICAgICAgICAgICAvLyBEZWZhdWx0IENMT1NFX05PUk1BTCBjb2RlXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvZGUgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb2RlID0gMTAwMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvcmNlZENsb3NlID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh3cykge1xuICAgICAgICAgICAgICAgIHdzLmNsb3NlKGNvZGUsIHJlYXNvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZGl0aW9uYWwgcHVibGljIEFQSSBtZXRob2QgdG8gcmVmcmVzaCB0aGUgY29ubmVjdGlvbiBpZiBzdGlsbCBvcGVuIChjbG9zZSwgcmUtb3BlbikuXG4gICAgICAgICAqIEZvciBleGFtcGxlLCBpZiB0aGUgYXBwIHN1c3BlY3RzIGJhZCBkYXRhIC8gbWlzc2VkIGhlYXJ0IGJlYXRzLCBpdCBjYW4gdHJ5IHRvIHJlZnJlc2guXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlZnJlc2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh3cykge1xuICAgICAgICAgICAgICAgIHdzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFdlYlNvY2tldCBjb25uZWN0aW9uJ3MgcmVhZHlTdGF0ZSBjaGFuZ2VzIHRvIE9QRU47XG4gICAgICogdGhpcyBpbmRpY2F0ZXMgdGhhdCB0aGUgY29ubmVjdGlvbiBpcyByZWFkeSB0byBzZW5kIGFuZCByZWNlaXZlIGRhdGEuXG4gICAgICovXG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0LnByb3RvdHlwZS5vbm9wZW4gPSBmdW5jdGlvbihldmVudCkge307XG4gICAgLyoqIEFuIGV2ZW50IGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBXZWJTb2NrZXQgY29ubmVjdGlvbidzIHJlYWR5U3RhdGUgY2hhbmdlcyB0byBDTE9TRUQuICovXG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0LnByb3RvdHlwZS5vbmNsb3NlID0gZnVuY3Rpb24oZXZlbnQpIHt9O1xuICAgIC8qKiBBbiBldmVudCBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiBhIGNvbm5lY3Rpb24gYmVnaW5zIGJlaW5nIGF0dGVtcHRlZC4gKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQucHJvdG90eXBlLm9uY29ubmVjdGluZyA9IGZ1bmN0aW9uKGV2ZW50KSB7fTtcbiAgICAvKiogQW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gYSBtZXNzYWdlIGlzIHJlY2VpdmVkIGZyb20gdGhlIHNlcnZlci4gKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQucHJvdG90eXBlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7fTtcbiAgICAvKiogQW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXJyb3Igb2NjdXJzLiAqL1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5wcm90b3R5cGUub25lcnJvciA9IGZ1bmN0aW9uKGV2ZW50KSB7fTtcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgYWxsIGluc3RhbmNlcyBvZiBSZWNvbm5lY3RpbmdXZWJTb2NrZXQgc2hvdWxkIGxvZyBkZWJ1ZyBtZXNzYWdlcy5cbiAgICAgKiBTZXR0aW5nIHRoaXMgdG8gdHJ1ZSBpcyB0aGUgZXF1aXZhbGVudCBvZiBzZXR0aW5nIGFsbCBpbnN0YW5jZXMgb2YgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnIHRvIHRydWUuXG4gICAgICovXG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsID0gZmFsc2U7XG5cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuQ09OTkVDVElORyA9IFdlYlNvY2tldC5DT05ORUNUSU5HO1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5PUEVOID0gV2ViU29ja2V0Lk9QRU47XG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0LkNMT1NJTkcgPSBXZWJTb2NrZXQuQ0xPU0lORztcbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuQ0xPU0VEID0gV2ViU29ja2V0LkNMT1NFRDtcblxuICAgIHJldHVybiBSZWNvbm5lY3RpbmdXZWJTb2NrZXQ7XG59KTtcbiIsIiJdfQ==
