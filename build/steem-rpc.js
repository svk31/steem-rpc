(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.steemWS = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WsRpc = require("./WebSocketRpc");
var SteemApi = require("./SteemApi");

var defaultOptions = {
    url: "wss://steemit.com/ws",
    user: "",
    pass: "",
    debug: false,
    apis: ["database_api"]
};

var apiInstance;

var ApiInstance = function () {
    function ApiInstance(options) {
        _classCallCheck(this, ApiInstance);

        this.options = Object.assign({}, defaultOptions, options);
    }

    _createClass(ApiInstance, [{
        key: "connect",
        value: function connect() {
            var _this = this;

            if (this.wsRpc) {
                return;
            }

            if (this.options.debug) {
                console.log("connect options:", this.options);
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
                        return "connected to " + api;
                    }));
                });

                return Promise.all(apiPromises);
            });
        }
    }]);

    return ApiInstance;
}();

var Instance = function () {
    function Instance(options) {
        _classCallCheck(this, Instance);

        this.options = options;
    }

    _createClass(Instance, [{
        key: "get",
        value: function get() {
            if (!apiInstance) {
                apiInstance = new ApiInstance(this.options);
                apiInstance.connect();
            }

            return apiInstance;
        }
    }, {
        key: "close",
        value: function close() {
            if (apiInstance) {
                apiInstance.wsRpc.close();
                apiInstance = null;
            }
        }
    }]);

    return Instance;
}();

module.exports = Instance;
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

function client(options) {
	return new Client(options || {});
};

module.exports = exports = client;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvQXBpSW5zdGFuY2UuanMiLCJsaWIvU3RlZW1BcGkuanMiLCJsaWIvV2ViU29ja2V0UnBjLmpzIiwibGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL1JlY29ubmVjdGluZ1dlYlNvY2tldC9yZWNvbm5lY3Rpbmctd2Vic29ja2V0LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXItcmVzb2x2ZS9lbXB0eS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1dBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgV3NScGMgPSByZXF1aXJlKFwiLi9XZWJTb2NrZXRScGNcIik7XG52YXIgU3RlZW1BcGkgPSByZXF1aXJlKFwiLi9TdGVlbUFwaVwiKTtcblxudmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIHVybDogXCJ3c3M6Ly9zdGVlbWl0LmNvbS93c1wiLFxuICAgIHVzZXI6IFwiXCIsXG4gICAgcGFzczogXCJcIixcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgYXBpczogW1wiZGF0YWJhc2VfYXBpXCJdXG59O1xuXG52YXIgYXBpSW5zdGFuY2U7XG5cbnZhciBBcGlJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBcGlJbnN0YW5jZShvcHRpb25zKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBcGlJbnN0YW5jZSk7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhBcGlJbnN0YW5jZSwgW3tcbiAgICAgICAga2V5OiBcImNvbm5lY3RcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvbm5lY3QoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgICAgICBpZiAodGhpcy53c1JwYykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kZWJ1Zykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29ubmVjdCBvcHRpb25zOlwiLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLndzUnBjID0gbmV3IFdzUnBjKHRoaXMub3B0aW9ucy51cmwpO1xuICAgICAgICAgICAgdGhpcy5pbml0UHJvbWlzZSA9IHRoaXMud3NScGMubG9naW4odGhpcy5vcHRpb25zLnVzZXIsIHRoaXMub3B0aW9ucy5wYXNzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLl9kYl9hcGkgPSBuZXcgU3RlZW1BcGkodGhpcy53c1JwYywgXCJkYXRhYmFzZV9hcGlcIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXBpUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAvLyBhcGlQcm9taXNlcy5wdXNoKHRoaXMuX2RiX2FwaS5pbml0KCkudGhlbiggKCk9PiB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBcImNvbm5lY3RlZCB0byBkYl9hcGlcIjtcbiAgICAgICAgICAgICAgICAvLyB9KSk7XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5vcHRpb25zLmFwaXMuZm9yRWFjaChmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzW1wiX1wiICsgYXBpXSA9IG5ldyBTdGVlbUFwaShfdGhpcy53c1JwYywgYXBpKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXNbYXBpXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW1wiX1wiICsgYXBpXTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYXBpUHJvbWlzZXMucHVzaChfdGhpc1tcIl9cIiArIGFwaV0uaW5pdCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiY29ubmVjdGVkIHRvIFwiICsgYXBpO1xuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoYXBpUHJvbWlzZXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gQXBpSW5zdGFuY2U7XG59KCk7XG5cbnZhciBJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbnN0YW5jZShvcHRpb25zKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbnN0YW5jZSk7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoSW5zdGFuY2UsIFt7XG4gICAgICAgIGtleTogXCJnZXRcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgICAgIGlmICghYXBpSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBhcGlJbnN0YW5jZSA9IG5ldyBBcGlJbnN0YW5jZSh0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGFwaUluc3RhbmNlLmNvbm5lY3QoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGFwaUluc3RhbmNlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2xvc2VcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgICAgICAgaWYgKGFwaUluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgYXBpSW5zdGFuY2Uud3NScGMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBhcGlJbnN0YW5jZSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gSW5zdGFuY2U7XG59KCk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5zdGFuY2U7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBTdGVlbUFwaSA9IGZ1bmN0aW9uICgpIHtcblx0ZnVuY3Rpb24gU3RlZW1BcGkod3NScGMsIGFwaU5hbWUpIHtcblx0XHRfY2xhc3NDYWxsQ2hlY2sodGhpcywgU3RlZW1BcGkpO1xuXG5cdFx0dGhpcy53c1JwYyA9IHdzUnBjO1xuXHRcdHRoaXMuYXBpTmFtZSA9IGFwaU5hbWU7XG5cdH1cblxuXHRfY3JlYXRlQ2xhc3MoU3RlZW1BcGksIFt7XG5cdFx0a2V5OiBcImluaXRcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRcdHZhciBfdGhpcyA9IHRoaXM7XG5cblx0XHRcdHJldHVybiB0aGlzLndzUnBjLmdldEFwaUJ5TmFtZSh0aGlzLmFwaU5hbWUpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cdFx0XHRcdF90aGlzLmFwaUlkID0gcmVzcG9uc2U7XG5cdFx0XHRcdHJldHVybiBfdGhpcztcblx0XHRcdH0pO1xuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJleGVjXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGV4ZWMobWV0aG9kLCBwYXJhbXMpIHtcblx0XHRcdHJldHVybiB0aGlzLndzUnBjLmNhbGwoW3RoaXMuYXBpSWQsIG1ldGhvZCwgcGFyYW1zXSkuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJTdGVlbUFwaSBlcnJvcjpcIiwgbWV0aG9kLCBwYXJhbXMsIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIlN0ZWVtQXBpIGVycm9yOlwiICsgbWV0aG9kICsgcGFyYW1zICsgSlNPTi5zdHJpbmdpZnkoZXJyb3IpKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fV0pO1xuXG5cdHJldHVybiBTdGVlbUFwaTtcbn0oKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdGVlbUFwaTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIEFwaSA9IGZ1bmN0aW9uICgpIHtcblx0ZnVuY3Rpb24gQXBpKHdzVXJsKSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBcGkpO1xuXG5cdFx0dmFyIFdlYlNvY2tldENsaWVudCA9IHR5cGVvZiBXZWJTb2NrZXQgIT09IFwidW5kZWZpbmVkXCIgPyByZXF1aXJlKFwiUmVjb25uZWN0aW5nV2ViU29ja2V0XCIpIDogcmVxdWlyZShcIndlYnNvY2tldFwiKS53M2N3ZWJzb2NrZXQ7XG5cblx0XHR0cnkge1xuXHRcdFx0dGhpcy53cyA9IG5ldyBXZWJTb2NrZXRDbGllbnQod3NVcmwpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIndzIGVycm9yOlwiLCBlcnIpO1xuXHRcdH1cblxuXHRcdHRoaXMud3MudGltZW91dEludGVydmFsID0gMTUwMDA7XG5cblx0XHR0aGlzLmNvbm5lY3RQcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG5cdFx0XHRfdGhpcy53cy5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH07XG5cblx0XHRcdF90aGlzLndzLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0fTtcblxuXHRcdFx0X3RoaXMud3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblx0XHRcdFx0X3RoaXMubGlzdGVuZXIoSlNPTi5wYXJzZShtZXNzYWdlLmRhdGEpKTtcblx0XHRcdH07XG5cdFx0fSk7XG5cblx0XHR0aGlzLmNiSWQgPSAwO1xuXHRcdHRoaXMuY2JzID0gbmV3IE1hcCgpO1xuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKEFwaSwgW3tcblx0XHRrZXk6IFwibGlzdGVuZXJcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gbGlzdGVuZXIobWVzc2FnZSkge1xuXHRcdFx0dmFyIGNhbGxiYWNrID0gdGhpcy5jYnMuZ2V0KG1lc3NhZ2UuaWQpO1xuXHRcdFx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0XHRcdGlmIChcImVycm9yXCIgaW4gbWVzc2FnZSkge1xuXHRcdFx0XHRcdGNhbGxiYWNrLnJlamVjdChtZXNzYWdlLmVycm9yKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjYWxsYmFjay5yZXNvbHZlKG1lc3NhZ2UucmVzdWx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSwge1xuXHRcdGtleTogXCJjYWxsXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGNhbGwocGFyYW1zKSB7XG5cdFx0XHR2YXIgX3RoaXMyID0gdGhpcztcblxuXHRcdFx0dmFyIHJlcXVlc3QgPSB7XG5cdFx0XHRcdG1ldGhvZDogXCJjYWxsXCIsXG5cdFx0XHRcdHBhcmFtczogcGFyYW1zLFxuXHRcdFx0XHRpZDogdGhpcy5jYklkKytcblx0XHRcdH07XG5cblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cblx0XHRcdFx0X3RoaXMyLmNicy5zZXQocmVxdWVzdC5pZCwge1xuXHRcdFx0XHRcdHRpbWU6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0cmVzb2x2ZTogcmVzb2x2ZSxcblx0XHRcdFx0XHRyZWplY3Q6IHJlamVjdFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfdGhpczIud3Mub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCIhISEgV2ViU29ja2V0IEVycm9yIFwiLCBlcnJvcik7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRfdGhpczIud3Muc2VuZChKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiZ2V0QXBpQnlOYW1lXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGdldEFwaUJ5TmFtZShhcGkpIHtcblx0XHRcdHJldHVybiB0aGlzLmNhbGwoWzEsIFwiZ2V0X2FwaV9ieV9uYW1lXCIsIFthcGldXSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImxvZ2luXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGxvZ2luKHVzZXIsIHBhc3N3b3JkKSB7XG5cdFx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdFx0cmV0dXJuIHRoaXMuY29ubmVjdFByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiBfdGhpczMuY2FsbChbMSwgXCJsb2dpblwiLCBbdXNlciwgcGFzc3dvcmRdXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiY2xvc2VcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gY2xvc2UoKSB7XG5cdFx0XHR0aGlzLndzLmNsb3NlKCk7XG5cdFx0fVxuXHR9XSk7XG5cblx0cmV0dXJuIEFwaTtcbn0oKTtcblxubW9kdWxlLmV4cG9ydHMgPSBBcGk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBDbGllbnQgPSByZXF1aXJlKFwiLi9BcGlJbnN0YW5jZVwiKTtcblxuZnVuY3Rpb24gY2xpZW50KG9wdGlvbnMpIHtcblx0cmV0dXJuIG5ldyBDbGllbnQob3B0aW9ucyB8fCB7fSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBjbGllbnQ7IiwiLy8gTUlUIExpY2Vuc2U6XG4vL1xuLy8gQ29weXJpZ2h0IChjKSAyMDEwLTIwMTIsIEpvZSBXYWxuZXNcbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG4vKipcbiAqIFRoaXMgYmVoYXZlcyBsaWtlIGEgV2ViU29ja2V0IGluIGV2ZXJ5IHdheSwgZXhjZXB0IGlmIGl0IGZhaWxzIHRvIGNvbm5lY3QsXG4gKiBvciBpdCBnZXRzIGRpc2Nvbm5lY3RlZCwgaXQgd2lsbCByZXBlYXRlZGx5IHBvbGwgdW50aWwgaXQgc3VjY2Vzc2Z1bGx5IGNvbm5lY3RzXG4gKiBhZ2Fpbi5cbiAqXG4gKiBJdCBpcyBBUEkgY29tcGF0aWJsZSwgc28gd2hlbiB5b3UgaGF2ZTpcbiAqICAgd3MgPSBuZXcgV2ViU29ja2V0KCd3czovLy4uLi4nKTtcbiAqIHlvdSBjYW4gcmVwbGFjZSB3aXRoOlxuICogICB3cyA9IG5ldyBSZWNvbm5lY3RpbmdXZWJTb2NrZXQoJ3dzOi8vLi4uLicpO1xuICpcbiAqIFRoZSBldmVudCBzdHJlYW0gd2lsbCB0eXBpY2FsbHkgbG9vayBsaWtlOlxuICogIG9uY29ubmVjdGluZ1xuICogIG9ub3BlblxuICogIG9ubWVzc2FnZVxuICogIG9ubWVzc2FnZVxuICogIG9uY2xvc2UgLy8gbG9zdCBjb25uZWN0aW9uXG4gKiAgb25jb25uZWN0aW5nXG4gKiAgb25vcGVuICAvLyBzb21ldGltZSBsYXRlci4uLlxuICogIG9ubWVzc2FnZVxuICogIG9ubWVzc2FnZVxuICogIGV0Yy4uLlxuICpcbiAqIEl0IGlzIEFQSSBjb21wYXRpYmxlIHdpdGggdGhlIHN0YW5kYXJkIFdlYlNvY2tldCBBUEksIGFwYXJ0IGZyb20gdGhlIGZvbGxvd2luZyBtZW1iZXJzOlxuICpcbiAqIC0gYGJ1ZmZlcmVkQW1vdW50YFxuICogLSBgZXh0ZW5zaW9uc2BcbiAqIC0gYGJpbmFyeVR5cGVgXG4gKlxuICogTGF0ZXN0IHZlcnNpb246IGh0dHBzOi8vZ2l0aHViLmNvbS9qb2V3YWxuZXMvcmVjb25uZWN0aW5nLXdlYnNvY2tldC9cbiAqIC0gSm9lIFdhbG5lc1xuICpcbiAqIFN5bnRheFxuICogPT09PT09XG4gKiB2YXIgc29ja2V0ID0gbmV3IFJlY29ubmVjdGluZ1dlYlNvY2tldCh1cmwsIHByb3RvY29scywgb3B0aW9ucyk7XG4gKlxuICogUGFyYW1ldGVyc1xuICogPT09PT09PT09PVxuICogdXJsIC0gVGhlIHVybCB5b3UgYXJlIGNvbm5lY3RpbmcgdG8uXG4gKiBwcm90b2NvbHMgLSBPcHRpb25hbCBzdHJpbmcgb3IgYXJyYXkgb2YgcHJvdG9jb2xzLlxuICogb3B0aW9ucyAtIFNlZSBiZWxvd1xuICpcbiAqIE9wdGlvbnNcbiAqID09PT09PT1cbiAqIE9wdGlvbnMgY2FuIGVpdGhlciBiZSBwYXNzZWQgdXBvbiBpbnN0YW50aWF0aW9uIG9yIHNldCBhZnRlciBpbnN0YW50aWF0aW9uOlxuICpcbiAqIHZhciBzb2NrZXQgPSBuZXcgUmVjb25uZWN0aW5nV2ViU29ja2V0KHVybCwgbnVsbCwgeyBkZWJ1ZzogdHJ1ZSwgcmVjb25uZWN0SW50ZXJ2YWw6IDQwMDAgfSk7XG4gKlxuICogb3JcbiAqXG4gKiB2YXIgc29ja2V0ID0gbmV3IFJlY29ubmVjdGluZ1dlYlNvY2tldCh1cmwpO1xuICogc29ja2V0LmRlYnVnID0gdHJ1ZTtcbiAqIHNvY2tldC5yZWNvbm5lY3RJbnRlcnZhbCA9IDQwMDA7XG4gKlxuICogZGVidWdcbiAqIC0gV2hldGhlciB0aGlzIGluc3RhbmNlIHNob3VsZCBsb2cgZGVidWcgbWVzc2FnZXMuIEFjY2VwdHMgdHJ1ZSBvciBmYWxzZS4gRGVmYXVsdDogZmFsc2UuXG4gKlxuICogYXV0b21hdGljT3BlblxuICogLSBXaGV0aGVyIG9yIG5vdCB0aGUgd2Vic29ja2V0IHNob3VsZCBhdHRlbXB0IHRvIGNvbm5lY3QgaW1tZWRpYXRlbHkgdXBvbiBpbnN0YW50aWF0aW9uLiBUaGUgc29ja2V0IGNhbiBiZSBtYW51YWxseSBvcGVuZWQgb3IgY2xvc2VkIGF0IGFueSB0aW1lIHVzaW5nIHdzLm9wZW4oKSBhbmQgd3MuY2xvc2UoKS5cbiAqXG4gKiByZWNvbm5lY3RJbnRlcnZhbFxuICogLSBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheSBiZWZvcmUgYXR0ZW1wdGluZyB0byByZWNvbm5lY3QuIEFjY2VwdHMgaW50ZWdlci4gRGVmYXVsdDogMTAwMC5cbiAqXG4gKiBtYXhSZWNvbm5lY3RJbnRlcnZhbFxuICogLSBUaGUgbWF4aW11bSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5IGEgcmVjb25uZWN0aW9uIGF0dGVtcHQuIEFjY2VwdHMgaW50ZWdlci4gRGVmYXVsdDogMzAwMDAuXG4gKlxuICogcmVjb25uZWN0RGVjYXlcbiAqIC0gVGhlIHJhdGUgb2YgaW5jcmVhc2Ugb2YgdGhlIHJlY29ubmVjdCBkZWxheS4gQWxsb3dzIHJlY29ubmVjdCBhdHRlbXB0cyB0byBiYWNrIG9mZiB3aGVuIHByb2JsZW1zIHBlcnNpc3QuIEFjY2VwdHMgaW50ZWdlciBvciBmbG9hdC4gRGVmYXVsdDogMS41LlxuICpcbiAqIHRpbWVvdXRJbnRlcnZhbFxuICogLSBUaGUgbWF4aW11bSB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGZvciBhIGNvbm5lY3Rpb24gdG8gc3VjY2VlZCBiZWZvcmUgY2xvc2luZyBhbmQgcmV0cnlpbmcuIEFjY2VwdHMgaW50ZWdlci4gRGVmYXVsdDogMjAwMC5cbiAqXG4gKi9cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZhY3RvcnkpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBnbG9iYWwuUmVjb25uZWN0aW5nV2ViU29ja2V0ID0gZmFjdG9yeSgpO1xuICAgIH1cbn0pKHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuICAgIGlmICghKCdXZWJTb2NrZXQnIGluIHdpbmRvdykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIFJlY29ubmVjdGluZ1dlYlNvY2tldCh1cmwsIHByb3RvY29scywgb3B0aW9ucykge1xuXG4gICAgICAgIC8vIERlZmF1bHQgc2V0dGluZ3NcbiAgICAgICAgdmFyIHNldHRpbmdzID0ge1xuXG4gICAgICAgICAgICAvKiogV2hldGhlciB0aGlzIGluc3RhbmNlIHNob3VsZCBsb2cgZGVidWcgbWVzc2FnZXMuICovXG4gICAgICAgICAgICBkZWJ1ZzogZmFsc2UsXG5cbiAgICAgICAgICAgIC8qKiBXaGV0aGVyIG9yIG5vdCB0aGUgd2Vic29ja2V0IHNob3VsZCBhdHRlbXB0IHRvIGNvbm5lY3QgaW1tZWRpYXRlbHkgdXBvbiBpbnN0YW50aWF0aW9uLiAqL1xuICAgICAgICAgICAgYXV0b21hdGljT3BlbjogdHJ1ZSxcblxuICAgICAgICAgICAgLyoqIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5IGJlZm9yZSBhdHRlbXB0aW5nIHRvIHJlY29ubmVjdC4gKi9cbiAgICAgICAgICAgIHJlY29ubmVjdEludGVydmFsOiAxMDAwLFxuICAgICAgICAgICAgLyoqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkgYSByZWNvbm5lY3Rpb24gYXR0ZW1wdC4gKi9cbiAgICAgICAgICAgIG1heFJlY29ubmVjdEludGVydmFsOiAzMDAwMCxcbiAgICAgICAgICAgIC8qKiBUaGUgcmF0ZSBvZiBpbmNyZWFzZSBvZiB0aGUgcmVjb25uZWN0IGRlbGF5LiBBbGxvd3MgcmVjb25uZWN0IGF0dGVtcHRzIHRvIGJhY2sgb2ZmIHdoZW4gcHJvYmxlbXMgcGVyc2lzdC4gKi9cbiAgICAgICAgICAgIHJlY29ubmVjdERlY2F5OiAxLjUsXG5cbiAgICAgICAgICAgIC8qKiBUaGUgbWF4aW11bSB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGZvciBhIGNvbm5lY3Rpb24gdG8gc3VjY2VlZCBiZWZvcmUgY2xvc2luZyBhbmQgcmV0cnlpbmcuICovXG4gICAgICAgICAgICB0aW1lb3V0SW50ZXJ2YWw6IDIwMDAsXG5cbiAgICAgICAgICAgIC8qKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgcmVjb25uZWN0aW9uIGF0dGVtcHRzIHRvIG1ha2UuIFVubGltaXRlZCBpZiBudWxsLiAqL1xuICAgICAgICAgICAgbWF4UmVjb25uZWN0QXR0ZW1wdHM6IG51bGwsXG5cbiAgICAgICAgICAgIC8qKiBUaGUgYmluYXJ5IHR5cGUsIHBvc3NpYmxlIHZhbHVlcyAnYmxvYicgb3IgJ2FycmF5YnVmZmVyJywgZGVmYXVsdCAnYmxvYicuICovXG4gICAgICAgICAgICBiaW5hcnlUeXBlOiAnYmxvYidcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMpIHsgb3B0aW9ucyA9IHt9OyB9XG5cbiAgICAgICAgLy8gT3ZlcndyaXRlIGFuZCBkZWZpbmUgc2V0dGluZ3Mgd2l0aCBvcHRpb25zIGlmIHRoZXkgZXhpc3QuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzZXR0aW5ncykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zW2tleV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBzZXR0aW5nc1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlc2Ugc2hvdWxkIGJlIHRyZWF0ZWQgYXMgcmVhZC1vbmx5IHByb3BlcnRpZXNcblxuICAgICAgICAvKiogVGhlIFVSTCBhcyByZXNvbHZlZCBieSB0aGUgY29uc3RydWN0b3IuIFRoaXMgaXMgYWx3YXlzIGFuIGFic29sdXRlIFVSTC4gUmVhZCBvbmx5LiAqL1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcblxuICAgICAgICAvKiogVGhlIG51bWJlciBvZiBhdHRlbXB0ZWQgcmVjb25uZWN0cyBzaW5jZSBzdGFydGluZywgb3IgdGhlIGxhc3Qgc3VjY2Vzc2Z1bCBjb25uZWN0aW9uLiBSZWFkIG9ubHkuICovXG4gICAgICAgIHRoaXMucmVjb25uZWN0QXR0ZW1wdHMgPSAwO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgY29ubmVjdGlvbi5cbiAgICAgICAgICogQ2FuIGJlIG9uZSBvZjogV2ViU29ja2V0LkNPTk5FQ1RJTkcsIFdlYlNvY2tldC5PUEVOLCBXZWJTb2NrZXQuQ0xPU0lORywgV2ViU29ja2V0LkNMT1NFRFxuICAgICAgICAgKiBSZWFkIG9ubHkuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBXZWJTb2NrZXQuQ09OTkVDVElORztcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSBzdHJpbmcgaW5kaWNhdGluZyB0aGUgbmFtZSBvZiB0aGUgc3ViLXByb3RvY29sIHRoZSBzZXJ2ZXIgc2VsZWN0ZWQ7IHRoaXMgd2lsbCBiZSBvbmUgb2ZcbiAgICAgICAgICogdGhlIHN0cmluZ3Mgc3BlY2lmaWVkIGluIHRoZSBwcm90b2NvbHMgcGFyYW1ldGVyIHdoZW4gY3JlYXRpbmcgdGhlIFdlYlNvY2tldCBvYmplY3QuXG4gICAgICAgICAqIFJlYWQgb25seS5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucHJvdG9jb2wgPSBudWxsO1xuXG4gICAgICAgIC8vIFByaXZhdGUgc3RhdGUgdmFyaWFibGVzXG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgd3M7XG4gICAgICAgIHZhciBmb3JjZWRDbG9zZSA9IGZhbHNlO1xuICAgICAgICB2YXIgdGltZWRPdXQgPSBmYWxzZTtcbiAgICAgICAgdmFyIGV2ZW50VGFyZ2V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAgICAgLy8gV2lyZSB1cCBcIm9uKlwiIHByb3BlcnRpZXMgYXMgZXZlbnQgaGFuZGxlcnNcblxuICAgICAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgICAgICAgZnVuY3Rpb24oZXZlbnQpIHsgc2VsZi5vbm9wZW4oZXZlbnQpOyB9KTtcbiAgICAgICAgZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCAgICAgIGZ1bmN0aW9uKGV2ZW50KSB7IHNlbGYub25jbG9zZShldmVudCk7IH0pO1xuICAgICAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdjb25uZWN0aW5nJywgZnVuY3Rpb24oZXZlbnQpIHsgc2VsZi5vbmNvbm5lY3RpbmcoZXZlbnQpOyB9KTtcbiAgICAgICAgZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsICAgIGZ1bmN0aW9uKGV2ZW50KSB7IHNlbGYub25tZXNzYWdlKGV2ZW50KTsgfSk7XG4gICAgICAgIGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgICAgICBmdW5jdGlvbihldmVudCkgeyBzZWxmLm9uZXJyb3IoZXZlbnQpOyB9KTtcblxuICAgICAgICAvLyBFeHBvc2UgdGhlIEFQSSByZXF1aXJlZCBieSBFdmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciA9IGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIuYmluZChldmVudFRhcmdldCk7XG4gICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGV2ZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIuYmluZChldmVudFRhcmdldCk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCA9IGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQuYmluZChldmVudFRhcmdldCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoaXMgZnVuY3Rpb24gZ2VuZXJhdGVzIGFuIGV2ZW50IHRoYXQgaXMgY29tcGF0aWJsZSB3aXRoIHN0YW5kYXJkXG4gICAgICAgICAqIGNvbXBsaWFudCBicm93c2VycyBhbmQgSUU5IC0gSUUxMVxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIHdpbGwgcHJldmVudCB0aGUgZXJyb3I6XG4gICAgICAgICAqIE9iamVjdCBkb2Vzbid0IHN1cHBvcnQgdGhpcyBhY3Rpb25cbiAgICAgICAgICpcbiAgICAgICAgICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTM0NTM5Mi93aHktYXJlbnQtbXktcGFyYW1ldGVycy1nZXR0aW5nLXBhc3NlZC10aHJvdWdoLXRvLWEtZGlzcGF0Y2hlZC1ldmVudC8xOTM0NTU2MyMxOTM0NTU2M1xuICAgICAgICAgKiBAcGFyYW0gcyBTdHJpbmcgVGhlIG5hbWUgdGhhdCB0aGUgZXZlbnQgc2hvdWxkIHVzZVxuICAgICAgICAgKiBAcGFyYW0gYXJncyBPYmplY3QgYW4gb3B0aW9uYWwgb2JqZWN0IHRoYXQgdGhlIGV2ZW50IHdpbGwgdXNlXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZW5lcmF0ZUV2ZW50KHMsIGFyZ3MpIHtcbiAgICAgICAgXHR2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJDdXN0b21FdmVudFwiKTtcbiAgICAgICAgXHRldnQuaW5pdEN1c3RvbUV2ZW50KHMsIGZhbHNlLCBmYWxzZSwgYXJncyk7XG4gICAgICAgIFx0cmV0dXJuIGV2dDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9wZW4gPSBmdW5jdGlvbiAocmVjb25uZWN0QXR0ZW1wdCkge1xuICAgICAgICAgICAgd3MgPSBuZXcgV2ViU29ja2V0KHNlbGYudXJsLCBwcm90b2NvbHMgfHwgW10pO1xuICAgICAgICAgICAgd3MuYmluYXJ5VHlwZSA9IHRoaXMuYmluYXJ5VHlwZTtcblxuICAgICAgICAgICAgaWYgKHJlY29ubmVjdEF0dGVtcHQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXhSZWNvbm5lY3RBdHRlbXB0cyAmJiB0aGlzLnJlY29ubmVjdEF0dGVtcHRzID4gdGhpcy5tYXhSZWNvbm5lY3RBdHRlbXB0cykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50KGdlbmVyYXRlRXZlbnQoJ2Nvbm5lY3RpbmcnKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWNvbm5lY3RBdHRlbXB0cyA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdhdHRlbXB0LWNvbm5lY3QnLCBzZWxmLnVybCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBsb2NhbFdzID0gd3M7XG4gICAgICAgICAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdjb25uZWN0aW9uLXRpbWVvdXQnLCBzZWxmLnVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRpbWVkT3V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBsb2NhbFdzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgdGltZWRPdXQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIHNlbGYudGltZW91dEludGVydmFsKTtcblxuICAgICAgICAgICAgd3Mub25vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdvbm9wZW4nLCBzZWxmLnVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYucHJvdG9jb2wgPSB3cy5wcm90b2NvbDtcbiAgICAgICAgICAgICAgICBzZWxmLnJlYWR5U3RhdGUgPSBXZWJTb2NrZXQuT1BFTjtcbiAgICAgICAgICAgICAgICBzZWxmLnJlY29ubmVjdEF0dGVtcHRzID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGdlbmVyYXRlRXZlbnQoJ29wZW4nKTtcbiAgICAgICAgICAgICAgICBlLmlzUmVjb25uZWN0ID0gcmVjb25uZWN0QXR0ZW1wdDtcbiAgICAgICAgICAgICAgICByZWNvbm5lY3RBdHRlbXB0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChlKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHdzLm9uY2xvc2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB3cyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlZENsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmVhZHlTdGF0ZSA9IFdlYlNvY2tldC5DTE9TRUQ7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VuZXJhdGVFdmVudCgnY2xvc2UnKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWFkeVN0YXRlID0gV2ViU29ja2V0LkNPTk5FQ1RJTkc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlID0gZ2VuZXJhdGVFdmVudCgnY29ubmVjdGluZycpO1xuICAgICAgICAgICAgICAgICAgICBlLmNvZGUgPSBldmVudC5jb2RlO1xuICAgICAgICAgICAgICAgICAgICBlLnJlYXNvbiA9IGV2ZW50LnJlYXNvbjtcbiAgICAgICAgICAgICAgICAgICAgZS53YXNDbGVhbiA9IGV2ZW50Lndhc0NsZWFuO1xuICAgICAgICAgICAgICAgICAgICBldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50KGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlY29ubmVjdEF0dGVtcHQgJiYgIXRpbWVkT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5kZWJ1ZyB8fCBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWdBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnb25jbG9zZScsIHNlbGYudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VuZXJhdGVFdmVudCgnY2xvc2UnKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgdGltZW91dCA9IHNlbGYucmVjb25uZWN0SW50ZXJ2YWwgKiBNYXRoLnBvdyhzZWxmLnJlY29ubmVjdERlY2F5LCBzZWxmLnJlY29ubmVjdEF0dGVtcHRzKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVjb25uZWN0QXR0ZW1wdHMrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub3Blbih0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdGltZW91dCA+IHNlbGYubWF4UmVjb25uZWN0SW50ZXJ2YWwgPyBzZWxmLm1heFJlY29ubmVjdEludGVydmFsIDogdGltZW91dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHdzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdvbm1lc3NhZ2UnLCBzZWxmLnVybCwgZXZlbnQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBlID0gZ2VuZXJhdGVFdmVudCgnbWVzc2FnZScpO1xuICAgICAgICAgICAgICAgIGUuZGF0YSA9IGV2ZW50LmRhdGE7XG4gICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB3cy5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kZWJ1ZyB8fCBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWdBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVjb25uZWN0aW5nV2ViU29ja2V0JywgJ29uZXJyb3InLCBzZWxmLnVybCwgZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50KGdlbmVyYXRlRXZlbnQoJ2Vycm9yJykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdoZXRoZXIgb3Igbm90IHRvIGNyZWF0ZSBhIHdlYnNvY2tldCB1cG9uIGluc3RhbnRpYXRpb25cbiAgICAgICAgaWYgKHRoaXMuYXV0b21hdGljT3BlbiA9PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLm9wZW4oZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyYW5zbWl0cyBkYXRhIHRvIHRoZSBzZXJ2ZXIgb3ZlciB0aGUgV2ViU29ja2V0IGNvbm5lY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBkYXRhIGEgdGV4dCBzdHJpbmcsIEFycmF5QnVmZmVyIG9yIEJsb2IgdG8gc2VuZCB0byB0aGUgc2VydmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZW5kID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKHdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdzZW5kJywgc2VsZi51cmwsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gd3Muc2VuZChkYXRhKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0lOVkFMSURfU1RBVEVfRVJSIDogUGF1c2luZyB0byByZWNvbm5lY3Qgd2Vic29ja2V0JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2xvc2VzIHRoZSBXZWJTb2NrZXQgY29ubmVjdGlvbiBvciBjb25uZWN0aW9uIGF0dGVtcHQsIGlmIGFueS5cbiAgICAgICAgICogSWYgdGhlIGNvbm5lY3Rpb24gaXMgYWxyZWFkeSBDTE9TRUQsIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuY2xvc2UgPSBmdW5jdGlvbihjb2RlLCByZWFzb24pIHtcbiAgICAgICAgICAgIC8vIERlZmF1bHQgQ0xPU0VfTk9STUFMIGNvZGVcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29kZSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvZGUgPSAxMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yY2VkQ2xvc2UgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHdzKSB7XG4gICAgICAgICAgICAgICAgd3MuY2xvc2UoY29kZSwgcmVhc29uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkaXRpb25hbCBwdWJsaWMgQVBJIG1ldGhvZCB0byByZWZyZXNoIHRoZSBjb25uZWN0aW9uIGlmIHN0aWxsIG9wZW4gKGNsb3NlLCByZS1vcGVuKS5cbiAgICAgICAgICogRm9yIGV4YW1wbGUsIGlmIHRoZSBhcHAgc3VzcGVjdHMgYmFkIGRhdGEgLyBtaXNzZWQgaGVhcnQgYmVhdHMsIGl0IGNhbiB0cnkgdG8gcmVmcmVzaC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHdzKSB7XG4gICAgICAgICAgICAgICAgd3MuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbiBldmVudCBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiB0aGUgV2ViU29ja2V0IGNvbm5lY3Rpb24ncyByZWFkeVN0YXRlIGNoYW5nZXMgdG8gT1BFTjtcbiAgICAgKiB0aGlzIGluZGljYXRlcyB0aGF0IHRoZSBjb25uZWN0aW9uIGlzIHJlYWR5IHRvIHNlbmQgYW5kIHJlY2VpdmUgZGF0YS5cbiAgICAgKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQucHJvdG90eXBlLm9ub3BlbiA9IGZ1bmN0aW9uKGV2ZW50KSB7fTtcbiAgICAvKiogQW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFdlYlNvY2tldCBjb25uZWN0aW9uJ3MgcmVhZHlTdGF0ZSBjaGFuZ2VzIHRvIENMT1NFRC4gKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQucHJvdG90eXBlLm9uY2xvc2UgPSBmdW5jdGlvbihldmVudCkge307XG4gICAgLyoqIEFuIGV2ZW50IGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIGEgY29ubmVjdGlvbiBiZWdpbnMgYmVpbmcgYXR0ZW1wdGVkLiAqL1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5wcm90b3R5cGUub25jb25uZWN0aW5nID0gZnVuY3Rpb24oZXZlbnQpIHt9O1xuICAgIC8qKiBBbiBldmVudCBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiBhIG1lc3NhZ2UgaXMgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyLiAqL1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5wcm90b3R5cGUub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHt9O1xuICAgIC8qKiBBbiBldmVudCBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiBhbiBlcnJvciBvY2N1cnMuICovXG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0LnByb3RvdHlwZS5vbmVycm9yID0gZnVuY3Rpb24oZXZlbnQpIHt9O1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBhbGwgaW5zdGFuY2VzIG9mIFJlY29ubmVjdGluZ1dlYlNvY2tldCBzaG91bGQgbG9nIGRlYnVnIG1lc3NhZ2VzLlxuICAgICAqIFNldHRpbmcgdGhpcyB0byB0cnVlIGlzIHRoZSBlcXVpdmFsZW50IG9mIHNldHRpbmcgYWxsIGluc3RhbmNlcyBvZiBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWcgdG8gdHJ1ZS5cbiAgICAgKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWdBbGwgPSBmYWxzZTtcblxuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5DT05ORUNUSU5HID0gV2ViU29ja2V0LkNPTk5FQ1RJTkc7XG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0Lk9QRU4gPSBXZWJTb2NrZXQuT1BFTjtcbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuQ0xPU0lORyA9IFdlYlNvY2tldC5DTE9TSU5HO1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5DTE9TRUQgPSBXZWJTb2NrZXQuQ0xPU0VEO1xuXG4gICAgcmV0dXJuIFJlY29ubmVjdGluZ1dlYlNvY2tldDtcbn0pO1xuIiwiIl19
