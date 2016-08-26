(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.steemWS = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WsRpc = require("./WebSocketRpc");
var SteemApi = require("./SteemApi");

var defaultOptions = {
    url: "wss://node.steem.ws",
    user: "",
    pass: "",
    debug: false,
    apis: ["database_api", "network_broadcast_api"]
};

var apiInstance;

module.exports = {

    reset: function reset() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        if (apiInstance) {
            this.close();
        }
        apiInstance = new ApiInstance(options);
        apiInstance.connect();

        return apiInstance;
    },

    get: function get() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        var connect = arguments[1];

        if (!apiInstance) {
            apiInstance = new ApiInstance(options);
        }

        if (connect) {
            apiInstance.setOptions(options);
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

        this.setOptions(options);
        this.statusCallback = options.statusCallback;
    }

    _createClass(ApiInstance, [{
        key: "setOptions",
        value: function setOptions(options) {
            this.options = Object.assign({}, defaultOptions, options);
            if (this.options.apis.indexOf("database_api") === -1) {
                this.options.apis.unshift("database_api");
            }
        }
    }, {
        key: "connect",
        value: function connect() {
            if (this.wsRpc) {
                return;
            }

            try {
                this.wsRpc = new WsRpc(this.options, this.onReconnect.bind(this), this.onStatusChange.bind(this));
                return this.login();
            } catch (err) {
                console.error("wsRpc open error:", err);
            }
        }
    }, {
        key: "login",
        value: function login() {
            var _this = this;

            return this.initPromise = this.wsRpc.login(this.options.user, this.options.pass).then(function () {
                var apiPromises = [];

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
            }).catch(function (err) {
                // console.error("Unable to connect to", this.options.url);
                throw new Error("Unable to connect to " + _this.options.url);
            });
        }
    }, {
        key: "onReconnect",
        value: function onReconnect() {
            this.login();
        }
    }, {
        key: "onStatusChange",
        value: function onStatusChange(e) {
            if (this.statusCallback) {
                this.statusCallback(e);
            }
        }
    }, {
        key: "close",
        value: function close() {
            if (this.wsRpc) {
                this.wsRpc.close();
                this.wsRpc = null;
            }
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

var RWebSocket = require("./reconnecting-websocket");

var WebSocketRpc = function () {
	function WebSocketRpc(options) {
		var _this = this;

		var rcCallback = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
		var statusCallback = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

		_classCallCheck(this, WebSocketRpc);

		this.rcCallback = rcCallback;
		this.statusCallback = statusCallback;

		if (typeof WebSocket !== "undefined") {
			options.WebSocket = WebSocket;
			options.idleTreshold = "idleTreshold" in options ? options.idleTreshold : 60000; // Only use idle threshold in browsers
		} else {
			options.WebSocket = require("ws");
			options.idleTreshold = 0; // Always reconnect in node.js
		}
		options.reconnectInterval = 1000;
		options.reconnectDecay = 1.2;

		this.ws = new RWebSocket(options);
		this.ws.timeoutInterval = 15000;

		var initialConnect = true;

		this.connectPromise = new Promise(function (resolve, reject) {

			_this.ws.onopen = function () {
				if (_this.statusCallback) _this.statusCallback("open");
				if (initialConnect) {
					initialConnect = false;
					resolve();
				} else {
					if (_this.rcCallback) _this.rcCallback();
				}
			};

			_this.ws.onerror = function (err) {
				if (_this.statusCallback) _this.statusCallback("error");
				reject(err);
			};

			_this.ws.onmessage = function (message) {
				var data = {};
				try {
					data = JSON.parse(message.data);
				} catch (e) {
					console.log("Unable to parse API response:", e);
					data.error = "Unable to parse response " + JSON.stringify(message);
				}
				_this.listener(data);
			};

			_this.ws.onclose = function () {
				// web socket may re-connect
				_this.cbs.forEach(function (value) {
					value.reject('connection closed');
				});

				_this.methodCbs.forEach(function (value) {
					value.reject('connection closed');
				});

				_this.cbs.clear();
				_this.methodCbs.clear();
				_this.cbId = 0;

				if (_this.statusCallback) _this.statusCallback("closed");
			};
		});

		this.cbId = 0;
		this.cbs = new Map();
		this.methodCbs = new Map();

		if (typeof window !== "undefined") {
			window.onbeforeunload = function () {
				_this.close();
			};
		}
	}

	_createClass(WebSocketRpc, [{
		key: "listener",
		value: function listener(message) {
			var callback = this.cbs.get(message.id);
			var methodCallback = this.methodCbs.get(message.id);

			if (methodCallback) {
				this.methodCbs.delete(message.id);
				if ("error" in message && "reject" in methodCallback) {
					methodCallback.reject(message.error);
				} else if ("resolve" in methodCallback) {
					methodCallback.resolve();
				}
			}

			if (callback) {
				this.cbs.delete(message.id);
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

				if (request.params[1] === "broadcast_transaction_with_callback" && request.params[2][0]) {
					_this2.methodCbs.set(request.id, request.params[2][0]);
					request.params[2][0] = request.params[2][0].resolve;
				}

				_this2.ws.onerror = function (error) {
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
			if (this.ws) {
				this.ws.onclose();
				this.ws.close();
				this.ws = null;
			}
		}
	}]);

	return WebSocketRpc;
}();

module.exports = WebSocketRpc;
},{"./reconnecting-websocket":5,"ws":6}],4:[function(require,module,exports){
"use strict";

var Client = require("./ApiInstance");

module.exports = {
	Client: Client
};
},{"./ApiInstance":1}],5:[function(require,module,exports){
'use strict';

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
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        global.ReconnectingWebSocket = factory();
    }
})(undefined, function () {

    //if (!('WebSocket' in window)) {
    //    return;
    //}

    var WebSocket;

    function ReconnectingWebSocket(options) {

        // Default settings
        var settings = {

            /** Whether this instance should log debug messages. */
            debug: false,

            /** Whether or not the websocket should attempt to connect immediately upon instantiation. */
            automaticOpen: true,

            /** The number of milliseconds to delay before attempting to reconnect. */
            reconnectInterval: 2000,
            /** The maximum number of milliseconds to delay a reconnection attempt. */
            maxReconnectInterval: 300000,
            /** The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. */
            reconnectDecay: 1.5,

            /** The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. */
            timeoutInterval: 2000,

            /** The maximum number of reconnection attempts to make. Unlimited if null. */
            maxReconnectAttempts: 100,

            /** The binary type, possible values 'blob' or 'arraybuffer', default 'blob'. */
            binaryType: 'arraybuffer',

            /** Don't reconnect if idle (no user activity after idleTreshold), pass 0 to always reconnect **/
            idleTreshold: 0
        };
        if (!options) {
            options = {};
        }

        WebSocket = options.WebSocket;
        ReconnectingWebSocket.CONNECTING = WebSocket.CONNECTING;
        ReconnectingWebSocket.OPEN = WebSocket.OPEN;
        ReconnectingWebSocket.CLOSING = WebSocket.CLOSING;
        ReconnectingWebSocket.CLOSED = WebSocket.CLOSED;
        if (!console.debug) console.debug = console.log;

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
        this.url = options.url;

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
        var handlers = {};
        var eventTarget = {
            addEventListener: function addEventListener(event, handler) {
                handlers[event] = handler;
            },
            removeEventListener: function removeEventListener(event) {
                delete handlers[event];
            },
            dispatchEvent: function dispatchEvent(event) {
                var handler = handlers[event.name];
                if (handler) handler(event);
            }
        }; //document.createElement('div');

        // Wire up "on*" properties as event handlers

        eventTarget.addEventListener('open', function (event) {
            self.onopen(event);
        });
        eventTarget.addEventListener('close', function (event) {
            self.onclose(event);
        });
        eventTarget.addEventListener('connecting', function (event) {
            self.onconnecting(event);
        });
        eventTarget.addEventListener('message', function (event) {
            self.onmessage(event);
        });
        eventTarget.addEventListener('error', function (event) {
            self.onerror(event);
        });

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
            //var evt = document.createEvent("CustomEvent");
            //evt.initCustomEvent(s, false, false, args);
            //return evt;
            return { name: s };
        };

        self.pendingReconnect = false;
        self.idleSince = new Date();

        if (this.idleTreshold) {
            if (typeof document !== 'undefined') {
                document.onkeypress = document.onmousemove = document.onclick = document.onscroll = document.touchstart = function () {
                    self.idleSince = new Date();
                    if (self.pendingReconnect) {
                        self.pendingReconnect = false;
                        self.reconnect();
                    }
                };
            }
        }

        this.reconnect = function () {
            var timeout = self.reconnectInterval * Math.pow(self.reconnectDecay, self.reconnectAttempts);
            timeout = timeout > self.maxReconnectInterval ? self.maxReconnectInterval : timeout;
            console.log('WebSocket: will try to reconnect in ' + parseInt(timeout / 1000) + ' sec, attempt #' + (self.reconnectAttempts + 1));
            setTimeout(function () {
                self.reconnectAttempts++;
                self.open(true);
            }, timeout);
        };

        this.open = function (reconnectAttempt) {
            if (reconnectAttempt) {
                if (this.maxReconnectAttempts && this.reconnectAttempts > this.maxReconnectAttempts) {
                    return;
                }
            } else {
                eventTarget.dispatchEvent(generateEvent('connecting'));
                this.reconnectAttempts = 0;
            }

            var surl = self.url;
            if (Array.isArray(self.url)) {
                surl = self.url[this.reconnectAttempts % self.url.length];
            }

            console.log('connecting to', surl);
            ws = new WebSocket(surl);
            ws.binaryType = this.binaryType;

            if (self.debug || ReconnectingWebSocket.debugAll) {
                console.debug('ReconnectingWebSocket', 'attempt-connect', self.url);
            }

            var localWs = ws;
            var timeout = setTimeout(function () {
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket', 'connection-timeout', self.url);
                }
                timedOut = true;
                localWs.close();
                timedOut = false;
            }, self.timeoutInterval);

            ws.onopen = function (event) {
                clearTimeout(timeout);
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket**', 'onopen', self.url);
                }
                self.protocol = ws.protocol;
                self.readyState = WebSocket.OPEN;
                self.reconnectAttempts = 0;
                var e = generateEvent('open');
                e.isReconnect = reconnectAttempt;
                reconnectAttempt = false;
                eventTarget.dispatchEvent(e);
            };

            ws.onclose = function (event) {
                if (event.code !== 1000) console.log('WARNING! ws connection', surl, 'closed');
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

                    if (!self.idleTreshold || new Date() - self.idleSince < self.idleTreshold) {
                        self.reconnect();
                    } else {
                        console.debug('idle - will reconnect later');
                        self.pendingReconnect = true;
                    }
                }
            };
            ws.onmessage = function (event) {
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket', 'onmessage', self.url, event.data);
                }
                var e = generateEvent('message');
                e.data = event.data;
                eventTarget.dispatchEvent(e);
            };
            ws.onerror = function (event) {
                if (self.debug || ReconnectingWebSocket.debugAll) {
                    console.debug('ReconnectingWebSocket', 'onerror', self.url, event);
                }
                eventTarget.dispatchEvent(generateEvent(event));
            };
        };

        // Whether or not to create a websocket upon instantiation
        if (this.automaticOpen == true) {
            this.open(false);
        }

        /**
         * Transmits data to the server over the WebSocket connection.
         *
         * @param data a text string, ArrayBuffer or Blob to send to the server.
         */
        this.send = function (data) {
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
        this.close = function (code, reason) {
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
        this.refresh = function () {
            if (ws) {
                ws.close();
            }
        };
    }

    /**
     * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
     * this indicates that the connection is ready to send and receive data.
     */
    ReconnectingWebSocket.prototype.onopen = function (event) {};
    /** An event listener to be called when the WebSocket connection's readyState changes to CLOSED. */
    ReconnectingWebSocket.prototype.onclose = function (event) {};
    /** An event listener to be called when a connection begins being attempted. */
    ReconnectingWebSocket.prototype.onconnecting = function (event) {};
    /** An event listener to be called when a message is received from the server. */
    ReconnectingWebSocket.prototype.onmessage = function (event) {};
    /** An event listener to be called when an error occurs. */
    ReconnectingWebSocket.prototype.onerror = function (event) {};

    /**
     * Whether all instances of ReconnectingWebSocket should log debug messages.
     * Setting this to true is the equivalent of setting all instances of ReconnectingWebSocket.debug to true.
     */
    ReconnectingWebSocket.debugAll = false;

    return ReconnectingWebSocket;
});
},{}],6:[function(require,module,exports){

},{}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvQXBpSW5zdGFuY2UuanMiLCJsaWIvU3RlZW1BcGkuanMiLCJsaWIvV2ViU29ja2V0UnBjLmpzIiwibGliL2luZGV4LmpzIiwibGliL3JlY29ubmVjdGluZy13ZWJzb2NrZXQuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvYUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBXc1JwYyA9IHJlcXVpcmUoXCIuL1dlYlNvY2tldFJwY1wiKTtcbnZhciBTdGVlbUFwaSA9IHJlcXVpcmUoXCIuL1N0ZWVtQXBpXCIpO1xuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgdXJsOiBcIndzczovL25vZGUuc3RlZW0ud3NcIixcbiAgICB1c2VyOiBcIlwiLFxuICAgIHBhc3M6IFwiXCIsXG4gICAgZGVidWc6IGZhbHNlLFxuICAgIGFwaXM6IFtcImRhdGFiYXNlX2FwaVwiLCBcIm5ldHdvcmtfYnJvYWRjYXN0X2FwaVwiXVxufTtcblxudmFyIGFwaUluc3RhbmNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIHJlc2V0OiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgICBpZiAoYXBpSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBhcGlJbnN0YW5jZSA9IG5ldyBBcGlJbnN0YW5jZShvcHRpb25zKTtcbiAgICAgICAgYXBpSW5zdGFuY2UuY29ubmVjdCgpO1xuXG4gICAgICAgIHJldHVybiBhcGlJbnN0YW5jZTtcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbiBnZXQoKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG4gICAgICAgIHZhciBjb25uZWN0ID0gYXJndW1lbnRzWzFdO1xuXG4gICAgICAgIGlmICghYXBpSW5zdGFuY2UpIHtcbiAgICAgICAgICAgIGFwaUluc3RhbmNlID0gbmV3IEFwaUluc3RhbmNlKG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbm5lY3QpIHtcbiAgICAgICAgICAgIGFwaUluc3RhbmNlLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgICAgICBhcGlJbnN0YW5jZS5jb25uZWN0KCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXBpSW5zdGFuY2U7XG4gICAgfSxcblxuXG4gICAgY2xvc2U6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgICBhcGlJbnN0YW5jZS5jbG9zZSgpO2FwaUluc3RhbmNlID0gbnVsbDtcbiAgICB9XG59O1xuXG52YXIgQXBpSW5zdGFuY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQXBpSW5zdGFuY2Uob3B0aW9ucykge1xuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgQXBpSW5zdGFuY2UpO1xuXG4gICAgICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy5zdGF0dXNDYWxsYmFjayA9IG9wdGlvbnMuc3RhdHVzQ2FsbGJhY2s7XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKEFwaUluc3RhbmNlLCBbe1xuICAgICAgICBrZXk6IFwic2V0T3B0aW9uc1wiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFwaXMuaW5kZXhPZihcImRhdGFiYXNlX2FwaVwiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuYXBpcy51bnNoaWZ0KFwiZGF0YWJhc2VfYXBpXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY29ubmVjdFwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY29ubmVjdCgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLndzUnBjKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMud3NScGMgPSBuZXcgV3NScGModGhpcy5vcHRpb25zLCB0aGlzLm9uUmVjb25uZWN0LmJpbmQodGhpcyksIHRoaXMub25TdGF0dXNDaGFuZ2UuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9naW4oKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJ3c1JwYyBvcGVuIGVycm9yOlwiLCBlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwibG9naW5cIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGxvZ2luKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5pdFByb21pc2UgPSB0aGlzLndzUnBjLmxvZ2luKHRoaXMub3B0aW9ucy51c2VyLCB0aGlzLm9wdGlvbnMucGFzcykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFwaVByb21pc2VzID0gW107XG5cbiAgICAgICAgICAgICAgICBfdGhpcy5vcHRpb25zLmFwaXMuZm9yRWFjaChmdW5jdGlvbiAoYXBpKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzW1wiX1wiICsgYXBpXSA9IG5ldyBTdGVlbUFwaShfdGhpcy53c1JwYywgYXBpKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXNbYXBpXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzW1wiX1wiICsgYXBpXTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYXBpUHJvbWlzZXMucHVzaChfdGhpc1tcIl9cIiArIGFwaV0uaW5pdCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFwaSA9PT0gXCJkYXRhYmFzZV9hcGlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpc1thcGldKCkuZXhlYyhcImdldF9jb25maWdcIiwgW10pLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5jaGFpbklkID0gcmVzLlNURUVNSVRfQ0hBSU5fSUQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImNvbm5lY3RlZCB0byBcIiArIGFwaTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiY29ubmVjdGVkIHRvIFwiICsgYXBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGFwaVByb21pc2VzKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmVycm9yKFwiVW5hYmxlIHRvIGNvbm5lY3QgdG9cIiwgdGhpcy5vcHRpb25zLnVybCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGNvbm5lY3QgdG8gXCIgKyBfdGhpcy5vcHRpb25zLnVybCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIm9uUmVjb25uZWN0XCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvblJlY29ubmVjdCgpIHtcbiAgICAgICAgICAgIHRoaXMubG9naW4oKTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcIm9uU3RhdHVzQ2hhbmdlXCIsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBvblN0YXR1c0NoYW5nZShlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0dXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzQ2FsbGJhY2soZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogXCJjbG9zZVwiLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy53c1JwYykge1xuICAgICAgICAgICAgICAgIHRoaXMud3NScGMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLndzUnBjID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBBcGlJbnN0YW5jZTtcbn0oKTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIFN0ZWVtQXBpID0gZnVuY3Rpb24gKCkge1xuXHRmdW5jdGlvbiBTdGVlbUFwaSh3c1JwYywgYXBpTmFtZSkge1xuXHRcdF9jbGFzc0NhbGxDaGVjayh0aGlzLCBTdGVlbUFwaSk7XG5cblx0XHR0aGlzLndzUnBjID0gd3NScGM7XG5cdFx0dGhpcy5hcGlOYW1lID0gYXBpTmFtZTtcblx0fVxuXG5cdF9jcmVhdGVDbGFzcyhTdGVlbUFwaSwgW3tcblx0XHRrZXk6IFwiaW5pdFwiLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiBpbml0KCkge1xuXHRcdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdFx0cmV0dXJuIHRoaXMud3NScGMuZ2V0QXBpQnlOYW1lKHRoaXMuYXBpTmFtZSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdFx0X3RoaXMuYXBpSWQgPSByZXNwb25zZTtcblx0XHRcdFx0cmV0dXJuIF90aGlzO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImV4ZWNcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gZXhlYyhtZXRob2QsIHBhcmFtcykge1xuXHRcdFx0cmV0dXJuIHRoaXMud3NScGMuY2FsbChbdGhpcy5hcGlJZCwgbWV0aG9kLCBwYXJhbXNdKS5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihcIlN0ZWVtQXBpIGVycm9yOlwiLCBtZXRob2QsIHBhcmFtcywgSlNPTi5zdHJpbmdpZnkoZXJyb3IpKTtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiU3RlZW1BcGkgZXJyb3I6XCIgKyBtZXRob2QgKyBwYXJhbXMgKyBKU09OLnN0cmluZ2lmeShlcnJvcikpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XSk7XG5cblx0cmV0dXJuIFN0ZWVtQXBpO1xufSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0ZWVtQXBpOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgUldlYlNvY2tldCA9IHJlcXVpcmUoXCIuL3JlY29ubmVjdGluZy13ZWJzb2NrZXRcIik7XG5cbnZhciBXZWJTb2NrZXRScGMgPSBmdW5jdGlvbiAoKSB7XG5cdGZ1bmN0aW9uIFdlYlNvY2tldFJwYyhvcHRpb25zKSB7XG5cdFx0dmFyIF90aGlzID0gdGhpcztcblxuXHRcdHZhciByY0NhbGxiYWNrID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGFyZ3VtZW50c1sxXTtcblx0XHR2YXIgc3RhdHVzQ2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDIgfHwgYXJndW1lbnRzWzJdID09PSB1bmRlZmluZWQgPyBudWxsIDogYXJndW1lbnRzWzJdO1xuXG5cdFx0X2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYlNvY2tldFJwYyk7XG5cblx0XHR0aGlzLnJjQ2FsbGJhY2sgPSByY0NhbGxiYWNrO1xuXHRcdHRoaXMuc3RhdHVzQ2FsbGJhY2sgPSBzdGF0dXNDYWxsYmFjaztcblxuXHRcdGlmICh0eXBlb2YgV2ViU29ja2V0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRvcHRpb25zLldlYlNvY2tldCA9IFdlYlNvY2tldDtcblx0XHRcdG9wdGlvbnMuaWRsZVRyZXNob2xkID0gXCJpZGxlVHJlc2hvbGRcIiBpbiBvcHRpb25zID8gb3B0aW9ucy5pZGxlVHJlc2hvbGQgOiA2MDAwMDsgLy8gT25seSB1c2UgaWRsZSB0aHJlc2hvbGQgaW4gYnJvd3NlcnNcblx0XHR9IGVsc2Uge1xuXHRcdFx0b3B0aW9ucy5XZWJTb2NrZXQgPSByZXF1aXJlKFwid3NcIik7XG5cdFx0XHRvcHRpb25zLmlkbGVUcmVzaG9sZCA9IDA7IC8vIEFsd2F5cyByZWNvbm5lY3QgaW4gbm9kZS5qc1xuXHRcdH1cblx0XHRvcHRpb25zLnJlY29ubmVjdEludGVydmFsID0gMTAwMDtcblx0XHRvcHRpb25zLnJlY29ubmVjdERlY2F5ID0gMS4yO1xuXG5cdFx0dGhpcy53cyA9IG5ldyBSV2ViU29ja2V0KG9wdGlvbnMpO1xuXHRcdHRoaXMud3MudGltZW91dEludGVydmFsID0gMTUwMDA7XG5cblx0XHR2YXIgaW5pdGlhbENvbm5lY3QgPSB0cnVlO1xuXG5cdFx0dGhpcy5jb25uZWN0UHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0X3RoaXMud3Mub25vcGVuID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAoX3RoaXMuc3RhdHVzQ2FsbGJhY2spIF90aGlzLnN0YXR1c0NhbGxiYWNrKFwib3BlblwiKTtcblx0XHRcdFx0aWYgKGluaXRpYWxDb25uZWN0KSB7XG5cdFx0XHRcdFx0aW5pdGlhbENvbm5lY3QgPSBmYWxzZTtcblx0XHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWYgKF90aGlzLnJjQ2FsbGJhY2spIF90aGlzLnJjQ2FsbGJhY2soKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0X3RoaXMud3Mub25lcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdFx0aWYgKF90aGlzLnN0YXR1c0NhbGxiYWNrKSBfdGhpcy5zdGF0dXNDYWxsYmFjayhcImVycm9yXCIpO1xuXHRcdFx0XHRyZWplY3QoZXJyKTtcblx0XHRcdH07XG5cblx0XHRcdF90aGlzLndzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHRcdHZhciBkYXRhID0ge307XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0ZGF0YSA9IEpTT04ucGFyc2UobWVzc2FnZS5kYXRhKTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiVW5hYmxlIHRvIHBhcnNlIEFQSSByZXNwb25zZTpcIiwgZSk7XG5cdFx0XHRcdFx0ZGF0YS5lcnJvciA9IFwiVW5hYmxlIHRvIHBhcnNlIHJlc3BvbnNlIFwiICsgSlNPTi5zdHJpbmdpZnkobWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0X3RoaXMubGlzdGVuZXIoZGF0YSk7XG5cdFx0XHR9O1xuXG5cdFx0XHRfdGhpcy53cy5vbmNsb3NlID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHQvLyB3ZWIgc29ja2V0IG1heSByZS1jb25uZWN0XG5cdFx0XHRcdF90aGlzLmNicy5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0XHRcdHZhbHVlLnJlamVjdCgnY29ubmVjdGlvbiBjbG9zZWQnKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X3RoaXMubWV0aG9kQ2JzLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0XHRcdFx0dmFsdWUucmVqZWN0KCdjb25uZWN0aW9uIGNsb3NlZCcpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfdGhpcy5jYnMuY2xlYXIoKTtcblx0XHRcdFx0X3RoaXMubWV0aG9kQ2JzLmNsZWFyKCk7XG5cdFx0XHRcdF90aGlzLmNiSWQgPSAwO1xuXG5cdFx0XHRcdGlmIChfdGhpcy5zdGF0dXNDYWxsYmFjaykgX3RoaXMuc3RhdHVzQ2FsbGJhY2soXCJjbG9zZWRcIik7XG5cdFx0XHR9O1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5jYklkID0gMDtcblx0XHR0aGlzLmNicyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLm1ldGhvZENicyA9IG5ldyBNYXAoKTtcblxuXHRcdGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHR3aW5kb3cub25iZWZvcmV1bmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdF90aGlzLmNsb3NlKCk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXG5cdF9jcmVhdGVDbGFzcyhXZWJTb2NrZXRScGMsIFt7XG5cdFx0a2V5OiBcImxpc3RlbmVyXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGxpc3RlbmVyKG1lc3NhZ2UpIHtcblx0XHRcdHZhciBjYWxsYmFjayA9IHRoaXMuY2JzLmdldChtZXNzYWdlLmlkKTtcblx0XHRcdHZhciBtZXRob2RDYWxsYmFjayA9IHRoaXMubWV0aG9kQ2JzLmdldChtZXNzYWdlLmlkKTtcblxuXHRcdFx0aWYgKG1ldGhvZENhbGxiYWNrKSB7XG5cdFx0XHRcdHRoaXMubWV0aG9kQ2JzLmRlbGV0ZShtZXNzYWdlLmlkKTtcblx0XHRcdFx0aWYgKFwiZXJyb3JcIiBpbiBtZXNzYWdlICYmIFwicmVqZWN0XCIgaW4gbWV0aG9kQ2FsbGJhY2spIHtcblx0XHRcdFx0XHRtZXRob2RDYWxsYmFjay5yZWplY3QobWVzc2FnZS5lcnJvcik7XG5cdFx0XHRcdH0gZWxzZSBpZiAoXCJyZXNvbHZlXCIgaW4gbWV0aG9kQ2FsbGJhY2spIHtcblx0XHRcdFx0XHRtZXRob2RDYWxsYmFjay5yZXNvbHZlKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0XHRcdHRoaXMuY2JzLmRlbGV0ZShtZXNzYWdlLmlkKTtcblx0XHRcdFx0aWYgKFwiZXJyb3JcIiBpbiBtZXNzYWdlKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2sucmVqZWN0KG1lc3NhZ2UuZXJyb3IpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNhbGxiYWNrLnJlc29sdmUobWVzc2FnZS5yZXN1bHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImNhbGxcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gY2FsbChwYXJhbXMpIHtcblx0XHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0XHR2YXIgcmVxdWVzdCA9IHtcblx0XHRcdFx0bWV0aG9kOiBcImNhbGxcIixcblx0XHRcdFx0cGFyYW1zOiBwYXJhbXMsXG5cdFx0XHRcdGlkOiB0aGlzLmNiSWQrK1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0XHRfdGhpczIuY2JzLnNldChyZXF1ZXN0LmlkLCB7XG5cdFx0XHRcdFx0dGltZTogbmV3IERhdGUoKSxcblx0XHRcdFx0XHRyZXNvbHZlOiByZXNvbHZlLFxuXHRcdFx0XHRcdHJlamVjdDogcmVqZWN0XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmIChyZXF1ZXN0LnBhcmFtc1sxXSA9PT0gXCJicm9hZGNhc3RfdHJhbnNhY3Rpb25fd2l0aF9jYWxsYmFja1wiICYmIHJlcXVlc3QucGFyYW1zWzJdWzBdKSB7XG5cdFx0XHRcdFx0X3RoaXMyLm1ldGhvZENicy5zZXQocmVxdWVzdC5pZCwgcmVxdWVzdC5wYXJhbXNbMl1bMF0pO1xuXHRcdFx0XHRcdHJlcXVlc3QucGFyYW1zWzJdWzBdID0gcmVxdWVzdC5wYXJhbXNbMl1bMF0ucmVzb2x2ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF90aGlzMi53cy5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRfdGhpczIud3Muc2VuZChKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiZ2V0QXBpQnlOYW1lXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGdldEFwaUJ5TmFtZShhcGkpIHtcblx0XHRcdHJldHVybiB0aGlzLmNhbGwoWzEsIFwiZ2V0X2FwaV9ieV9uYW1lXCIsIFthcGldXSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImxvZ2luXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGxvZ2luKHVzZXIsIHBhc3N3b3JkKSB7XG5cdFx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdFx0cmV0dXJuIHRoaXMuY29ubmVjdFByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiBfdGhpczMuY2FsbChbMSwgXCJsb2dpblwiLCBbdXNlciwgcGFzc3dvcmRdXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiY2xvc2VcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gY2xvc2UoKSB7XG5cdFx0XHRpZiAodGhpcy53cykge1xuXHRcdFx0XHR0aGlzLndzLm9uY2xvc2UoKTtcblx0XHRcdFx0dGhpcy53cy5jbG9zZSgpO1xuXHRcdFx0XHR0aGlzLndzID0gbnVsbDtcblx0XHRcdH1cblx0XHR9XG5cdH1dKTtcblxuXHRyZXR1cm4gV2ViU29ja2V0UnBjO1xufSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYlNvY2tldFJwYzsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIENsaWVudCA9IHJlcXVpcmUoXCIuL0FwaUluc3RhbmNlXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Q2xpZW50OiBDbGllbnRcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBNSVQgTGljZW5zZTpcbi8vXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMiwgSm9lIFdhbG5lc1xuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbi8qKlxuICogVGhpcyBiZWhhdmVzIGxpa2UgYSBXZWJTb2NrZXQgaW4gZXZlcnkgd2F5LCBleGNlcHQgaWYgaXQgZmFpbHMgdG8gY29ubmVjdCxcbiAqIG9yIGl0IGdldHMgZGlzY29ubmVjdGVkLCBpdCB3aWxsIHJlcGVhdGVkbHkgcG9sbCB1bnRpbCBpdCBzdWNjZXNzZnVsbHkgY29ubmVjdHNcbiAqIGFnYWluLlxuICpcbiAqIEl0IGlzIEFQSSBjb21wYXRpYmxlLCBzbyB3aGVuIHlvdSBoYXZlOlxuICogICB3cyA9IG5ldyBXZWJTb2NrZXQoJ3dzOi8vLi4uLicpO1xuICogeW91IGNhbiByZXBsYWNlIHdpdGg6XG4gKiAgIHdzID0gbmV3IFJlY29ubmVjdGluZ1dlYlNvY2tldCgnd3M6Ly8uLi4uJyk7XG4gKlxuICogVGhlIGV2ZW50IHN0cmVhbSB3aWxsIHR5cGljYWxseSBsb29rIGxpa2U6XG4gKiAgb25jb25uZWN0aW5nXG4gKiAgb25vcGVuXG4gKiAgb25tZXNzYWdlXG4gKiAgb25tZXNzYWdlXG4gKiAgb25jbG9zZSAvLyBsb3N0IGNvbm5lY3Rpb25cbiAqICBvbmNvbm5lY3RpbmdcbiAqICBvbm9wZW4gIC8vIHNvbWV0aW1lIGxhdGVyLi4uXG4gKiAgb25tZXNzYWdlXG4gKiAgb25tZXNzYWdlXG4gKiAgZXRjLi4uXG4gKlxuICogSXQgaXMgQVBJIGNvbXBhdGlibGUgd2l0aCB0aGUgc3RhbmRhcmQgV2ViU29ja2V0IEFQSSwgYXBhcnQgZnJvbSB0aGUgZm9sbG93aW5nIG1lbWJlcnM6XG4gKlxuICogLSBgYnVmZmVyZWRBbW91bnRgXG4gKiAtIGBleHRlbnNpb25zYFxuICogLSBgYmluYXJ5VHlwZWBcbiAqXG4gKiBMYXRlc3QgdmVyc2lvbjogaHR0cHM6Ly9naXRodWIuY29tL2pvZXdhbG5lcy9yZWNvbm5lY3Rpbmctd2Vic29ja2V0L1xuICogLSBKb2UgV2FsbmVzXG4gKlxuICogU3ludGF4XG4gKiA9PT09PT1cbiAqIHZhciBzb2NrZXQgPSBuZXcgUmVjb25uZWN0aW5nV2ViU29ja2V0KHVybCwgcHJvdG9jb2xzLCBvcHRpb25zKTtcbiAqXG4gKiBQYXJhbWV0ZXJzXG4gKiA9PT09PT09PT09XG4gKiB1cmwgLSBUaGUgdXJsIHlvdSBhcmUgY29ubmVjdGluZyB0by5cbiAqIHByb3RvY29scyAtIE9wdGlvbmFsIHN0cmluZyBvciBhcnJheSBvZiBwcm90b2NvbHMuXG4gKiBvcHRpb25zIC0gU2VlIGJlbG93XG4gKlxuICogT3B0aW9uc1xuICogPT09PT09PVxuICogT3B0aW9ucyBjYW4gZWl0aGVyIGJlIHBhc3NlZCB1cG9uIGluc3RhbnRpYXRpb24gb3Igc2V0IGFmdGVyIGluc3RhbnRpYXRpb246XG4gKlxuICogdmFyIHNvY2tldCA9IG5ldyBSZWNvbm5lY3RpbmdXZWJTb2NrZXQodXJsLCBudWxsLCB7IGRlYnVnOiB0cnVlLCByZWNvbm5lY3RJbnRlcnZhbDogNDAwMCB9KTtcbiAqXG4gKiBvclxuICpcbiAqIHZhciBzb2NrZXQgPSBuZXcgUmVjb25uZWN0aW5nV2ViU29ja2V0KHVybCk7XG4gKiBzb2NrZXQuZGVidWcgPSB0cnVlO1xuICogc29ja2V0LnJlY29ubmVjdEludGVydmFsID0gNDAwMDtcbiAqXG4gKiBkZWJ1Z1xuICogLSBXaGV0aGVyIHRoaXMgaW5zdGFuY2Ugc2hvdWxkIGxvZyBkZWJ1ZyBtZXNzYWdlcy4gQWNjZXB0cyB0cnVlIG9yIGZhbHNlLiBEZWZhdWx0OiBmYWxzZS5cbiAqXG4gKiBhdXRvbWF0aWNPcGVuXG4gKiAtIFdoZXRoZXIgb3Igbm90IHRoZSB3ZWJzb2NrZXQgc2hvdWxkIGF0dGVtcHQgdG8gY29ubmVjdCBpbW1lZGlhdGVseSB1cG9uIGluc3RhbnRpYXRpb24uIFRoZSBzb2NrZXQgY2FuIGJlIG1hbnVhbGx5IG9wZW5lZCBvciBjbG9zZWQgYXQgYW55IHRpbWUgdXNpbmcgd3Mub3BlbigpIGFuZCB3cy5jbG9zZSgpLlxuICpcbiAqIHJlY29ubmVjdEludGVydmFsXG4gKiAtIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5IGJlZm9yZSBhdHRlbXB0aW5nIHRvIHJlY29ubmVjdC4gQWNjZXB0cyBpbnRlZ2VyLiBEZWZhdWx0OiAxMDAwLlxuICpcbiAqIG1heFJlY29ubmVjdEludGVydmFsXG4gKiAtIFRoZSBtYXhpbXVtIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkgYSByZWNvbm5lY3Rpb24gYXR0ZW1wdC4gQWNjZXB0cyBpbnRlZ2VyLiBEZWZhdWx0OiAzMDAwMC5cbiAqXG4gKiByZWNvbm5lY3REZWNheVxuICogLSBUaGUgcmF0ZSBvZiBpbmNyZWFzZSBvZiB0aGUgcmVjb25uZWN0IGRlbGF5LiBBbGxvd3MgcmVjb25uZWN0IGF0dGVtcHRzIHRvIGJhY2sgb2ZmIHdoZW4gcHJvYmxlbXMgcGVyc2lzdC4gQWNjZXB0cyBpbnRlZ2VyIG9yIGZsb2F0LiBEZWZhdWx0OiAxLjUuXG4gKlxuICogdGltZW91dEludGVydmFsXG4gKiAtIFRoZSBtYXhpbXVtIHRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHdhaXQgZm9yIGEgY29ubmVjdGlvbiB0byBzdWNjZWVkIGJlZm9yZSBjbG9zaW5nIGFuZCByZXRyeWluZy4gQWNjZXB0cyBpbnRlZ2VyLiBEZWZhdWx0OiAyMDAwLlxuICpcbiAqL1xuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZmFjdG9yeSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBnbG9iYWwuUmVjb25uZWN0aW5nV2ViU29ja2V0ID0gZmFjdG9yeSgpO1xuICAgIH1cbn0pKHVuZGVmaW5lZCwgZnVuY3Rpb24gKCkge1xuXG4gICAgLy9pZiAoISgnV2ViU29ja2V0JyBpbiB3aW5kb3cpKSB7XG4gICAgLy8gICAgcmV0dXJuO1xuICAgIC8vfVxuXG4gICAgdmFyIFdlYlNvY2tldDtcblxuICAgIGZ1bmN0aW9uIFJlY29ubmVjdGluZ1dlYlNvY2tldChvcHRpb25zKSB7XG5cbiAgICAgICAgLy8gRGVmYXVsdCBzZXR0aW5nc1xuICAgICAgICB2YXIgc2V0dGluZ3MgPSB7XG5cbiAgICAgICAgICAgIC8qKiBXaGV0aGVyIHRoaXMgaW5zdGFuY2Ugc2hvdWxkIGxvZyBkZWJ1ZyBtZXNzYWdlcy4gKi9cbiAgICAgICAgICAgIGRlYnVnOiBmYWxzZSxcblxuICAgICAgICAgICAgLyoqIFdoZXRoZXIgb3Igbm90IHRoZSB3ZWJzb2NrZXQgc2hvdWxkIGF0dGVtcHQgdG8gY29ubmVjdCBpbW1lZGlhdGVseSB1cG9uIGluc3RhbnRpYXRpb24uICovXG4gICAgICAgICAgICBhdXRvbWF0aWNPcGVuOiB0cnVlLFxuXG4gICAgICAgICAgICAvKiogVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkgYmVmb3JlIGF0dGVtcHRpbmcgdG8gcmVjb25uZWN0LiAqL1xuICAgICAgICAgICAgcmVjb25uZWN0SW50ZXJ2YWw6IDIwMDAsXG4gICAgICAgICAgICAvKiogVGhlIG1heGltdW0gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheSBhIHJlY29ubmVjdGlvbiBhdHRlbXB0LiAqL1xuICAgICAgICAgICAgbWF4UmVjb25uZWN0SW50ZXJ2YWw6IDMwMDAwMCxcbiAgICAgICAgICAgIC8qKiBUaGUgcmF0ZSBvZiBpbmNyZWFzZSBvZiB0aGUgcmVjb25uZWN0IGRlbGF5LiBBbGxvd3MgcmVjb25uZWN0IGF0dGVtcHRzIHRvIGJhY2sgb2ZmIHdoZW4gcHJvYmxlbXMgcGVyc2lzdC4gKi9cbiAgICAgICAgICAgIHJlY29ubmVjdERlY2F5OiAxLjUsXG5cbiAgICAgICAgICAgIC8qKiBUaGUgbWF4aW11bSB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byB3YWl0IGZvciBhIGNvbm5lY3Rpb24gdG8gc3VjY2VlZCBiZWZvcmUgY2xvc2luZyBhbmQgcmV0cnlpbmcuICovXG4gICAgICAgICAgICB0aW1lb3V0SW50ZXJ2YWw6IDIwMDAsXG5cbiAgICAgICAgICAgIC8qKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgcmVjb25uZWN0aW9uIGF0dGVtcHRzIHRvIG1ha2UuIFVubGltaXRlZCBpZiBudWxsLiAqL1xuICAgICAgICAgICAgbWF4UmVjb25uZWN0QXR0ZW1wdHM6IDEwMCxcblxuICAgICAgICAgICAgLyoqIFRoZSBiaW5hcnkgdHlwZSwgcG9zc2libGUgdmFsdWVzICdibG9iJyBvciAnYXJyYXlidWZmZXInLCBkZWZhdWx0ICdibG9iJy4gKi9cbiAgICAgICAgICAgIGJpbmFyeVR5cGU6ICdhcnJheWJ1ZmZlcicsXG5cbiAgICAgICAgICAgIC8qKiBEb24ndCByZWNvbm5lY3QgaWYgaWRsZSAobm8gdXNlciBhY3Rpdml0eSBhZnRlciBpZGxlVHJlc2hvbGQpLCBwYXNzIDAgdG8gYWx3YXlzIHJlY29ubmVjdCAqKi9cbiAgICAgICAgICAgIGlkbGVUcmVzaG9sZDogMFxuICAgICAgICB9O1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIFdlYlNvY2tldCA9IG9wdGlvbnMuV2ViU29ja2V0O1xuICAgICAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuQ09OTkVDVElORyA9IFdlYlNvY2tldC5DT05ORUNUSU5HO1xuICAgICAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuT1BFTiA9IFdlYlNvY2tldC5PUEVOO1xuICAgICAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuQ0xPU0lORyA9IFdlYlNvY2tldC5DTE9TSU5HO1xuICAgICAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuQ0xPU0VEID0gV2ViU29ja2V0LkNMT1NFRDtcbiAgICAgICAgaWYgKCFjb25zb2xlLmRlYnVnKSBjb25zb2xlLmRlYnVnID0gY29uc29sZS5sb2c7XG5cbiAgICAgICAgLy8gT3ZlcndyaXRlIGFuZCBkZWZpbmUgc2V0dGluZ3Mgd2l0aCBvcHRpb25zIGlmIHRoZXkgZXhpc3QuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBzZXR0aW5ncykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zW2tleV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBzZXR0aW5nc1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlc2Ugc2hvdWxkIGJlIHRyZWF0ZWQgYXMgcmVhZC1vbmx5IHByb3BlcnRpZXNcblxuICAgICAgICAvKiogVGhlIFVSTCBhcyByZXNvbHZlZCBieSB0aGUgY29uc3RydWN0b3IuIFRoaXMgaXMgYWx3YXlzIGFuIGFic29sdXRlIFVSTC4gUmVhZCBvbmx5LiAqL1xuICAgICAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsO1xuXG4gICAgICAgIC8qKiBUaGUgbnVtYmVyIG9mIGF0dGVtcHRlZCByZWNvbm5lY3RzIHNpbmNlIHN0YXJ0aW5nLCBvciB0aGUgbGFzdCBzdWNjZXNzZnVsIGNvbm5lY3Rpb24uIFJlYWQgb25seS4gKi9cbiAgICAgICAgdGhpcy5yZWNvbm5lY3RBdHRlbXB0cyA9IDA7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBjb25uZWN0aW9uLlxuICAgICAgICAgKiBDYW4gYmUgb25lIG9mOiBXZWJTb2NrZXQuQ09OTkVDVElORywgV2ViU29ja2V0Lk9QRU4sIFdlYlNvY2tldC5DTE9TSU5HLCBXZWJTb2NrZXQuQ0xPU0VEXG4gICAgICAgICAqIFJlYWQgb25seS5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFdlYlNvY2tldC5DT05ORUNUSU5HO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIHN0cmluZyBpbmRpY2F0aW5nIHRoZSBuYW1lIG9mIHRoZSBzdWItcHJvdG9jb2wgdGhlIHNlcnZlciBzZWxlY3RlZDsgdGhpcyB3aWxsIGJlIG9uZSBvZlxuICAgICAgICAgKiB0aGUgc3RyaW5ncyBzcGVjaWZpZWQgaW4gdGhlIHByb3RvY29scyBwYXJhbWV0ZXIgd2hlbiBjcmVhdGluZyB0aGUgV2ViU29ja2V0IG9iamVjdC5cbiAgICAgICAgICogUmVhZCBvbmx5LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG5cbiAgICAgICAgLy8gUHJpdmF0ZSBzdGF0ZSB2YXJpYWJsZXNcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB3cztcbiAgICAgICAgdmFyIGZvcmNlZENsb3NlID0gZmFsc2U7XG4gICAgICAgIHZhciB0aW1lZE91dCA9IGZhbHNlO1xuICAgICAgICB2YXIgaGFuZGxlcnMgPSB7fTtcbiAgICAgICAgdmFyIGV2ZW50VGFyZ2V0ID0ge1xuICAgICAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlcikge1xuICAgICAgICAgICAgICAgIGhhbmRsZXJzW2V2ZW50XSA9IGhhbmRsZXI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBoYW5kbGVyc1tldmVudF07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGlzcGF0Y2hFdmVudDogZnVuY3Rpb24gZGlzcGF0Y2hFdmVudChldmVudCkge1xuICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gaGFuZGxlcnNbZXZlbnQubmFtZV07XG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIpIGhhbmRsZXIoZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9OyAvL2RvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIC8vIFdpcmUgdXAgXCJvbipcIiBwcm9wZXJ0aWVzIGFzIGV2ZW50IGhhbmRsZXJzXG5cbiAgICAgICAgZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignb3BlbicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgc2VsZi5vbm9wZW4oZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgZXZlbnRUYXJnZXQuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHNlbGYub25jbG9zZShldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdjb25uZWN0aW5nJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLm9uY29ubmVjdGluZyhldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLm9ubWVzc2FnZShldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgc2VsZi5vbmVycm9yKGV2ZW50KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gRXhwb3NlIHRoZSBBUEkgcmVxdWlyZWQgYnkgRXZlbnRUYXJnZXRcblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIgPSBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyLmJpbmQoZXZlbnRUYXJnZXQpO1xuICAgICAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBldmVudFRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyLmJpbmQoZXZlbnRUYXJnZXQpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQgPSBldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50LmJpbmQoZXZlbnRUYXJnZXQpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIGdlbmVyYXRlcyBhbiBldmVudCB0aGF0IGlzIGNvbXBhdGlibGUgd2l0aCBzdGFuZGFyZFxuICAgICAgICAgKiBjb21wbGlhbnQgYnJvd3NlcnMgYW5kIElFOSAtIElFMTFcbiAgICAgICAgICpcbiAgICAgICAgICogVGhpcyB3aWxsIHByZXZlbnQgdGhlIGVycm9yOlxuICAgICAgICAgKiBPYmplY3QgZG9lc24ndCBzdXBwb3J0IHRoaXMgYWN0aW9uXG4gICAgICAgICAqXG4gICAgICAgICAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTkzNDUzOTIvd2h5LWFyZW50LW15LXBhcmFtZXRlcnMtZ2V0dGluZy1wYXNzZWQtdGhyb3VnaC10by1hLWRpc3BhdGNoZWQtZXZlbnQvMTkzNDU1NjMjMTkzNDU1NjNcbiAgICAgICAgICogQHBhcmFtIHMgU3RyaW5nIFRoZSBuYW1lIHRoYXQgdGhlIGV2ZW50IHNob3VsZCB1c2VcbiAgICAgICAgICogQHBhcmFtIGFyZ3MgT2JqZWN0IGFuIG9wdGlvbmFsIG9iamVjdCB0aGF0IHRoZSBldmVudCB3aWxsIHVzZVxuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVFdmVudChzLCBhcmdzKSB7XG4gICAgICAgICAgICAvL3ZhciBldnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkN1c3RvbUV2ZW50XCIpO1xuICAgICAgICAgICAgLy9ldnQuaW5pdEN1c3RvbUV2ZW50KHMsIGZhbHNlLCBmYWxzZSwgYXJncyk7XG4gICAgICAgICAgICAvL3JldHVybiBldnQ7XG4gICAgICAgICAgICByZXR1cm4geyBuYW1lOiBzIH07XG4gICAgICAgIH07XG5cbiAgICAgICAgc2VsZi5wZW5kaW5nUmVjb25uZWN0ID0gZmFsc2U7XG4gICAgICAgIHNlbGYuaWRsZVNpbmNlID0gbmV3IERhdGUoKTtcblxuICAgICAgICBpZiAodGhpcy5pZGxlVHJlc2hvbGQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQub25rZXlwcmVzcyA9IGRvY3VtZW50Lm9ubW91c2Vtb3ZlID0gZG9jdW1lbnQub25jbGljayA9IGRvY3VtZW50Lm9uc2Nyb2xsID0gZG9jdW1lbnQudG91Y2hzdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pZGxlU2luY2UgPSBuZXcgRGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5wZW5kaW5nUmVjb25uZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnBlbmRpbmdSZWNvbm5lY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdGltZW91dCA9IHNlbGYucmVjb25uZWN0SW50ZXJ2YWwgKiBNYXRoLnBvdyhzZWxmLnJlY29ubmVjdERlY2F5LCBzZWxmLnJlY29ubmVjdEF0dGVtcHRzKTtcbiAgICAgICAgICAgIHRpbWVvdXQgPSB0aW1lb3V0ID4gc2VsZi5tYXhSZWNvbm5lY3RJbnRlcnZhbCA/IHNlbGYubWF4UmVjb25uZWN0SW50ZXJ2YWwgOiB0aW1lb3V0O1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1dlYlNvY2tldDogd2lsbCB0cnkgdG8gcmVjb25uZWN0IGluICcgKyBwYXJzZUludCh0aW1lb3V0IC8gMTAwMCkgKyAnIHNlYywgYXR0ZW1wdCAjJyArIChzZWxmLnJlY29ubmVjdEF0dGVtcHRzICsgMSkpO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5yZWNvbm5lY3RBdHRlbXB0cysrO1xuICAgICAgICAgICAgICAgIHNlbGYub3Blbih0cnVlKTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub3BlbiA9IGZ1bmN0aW9uIChyZWNvbm5lY3RBdHRlbXB0KSB7XG4gICAgICAgICAgICBpZiAocmVjb25uZWN0QXR0ZW1wdCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1heFJlY29ubmVjdEF0dGVtcHRzICYmIHRoaXMucmVjb25uZWN0QXR0ZW1wdHMgPiB0aGlzLm1heFJlY29ubmVjdEF0dGVtcHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VuZXJhdGVFdmVudCgnY29ubmVjdGluZycpKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlY29ubmVjdEF0dGVtcHRzID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHN1cmwgPSBzZWxmLnVybDtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGYudXJsKSkge1xuICAgICAgICAgICAgICAgIHN1cmwgPSBzZWxmLnVybFt0aGlzLnJlY29ubmVjdEF0dGVtcHRzICUgc2VsZi51cmwubGVuZ3RoXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3RpbmcgdG8nLCBzdXJsKTtcbiAgICAgICAgICAgIHdzID0gbmV3IFdlYlNvY2tldChzdXJsKTtcbiAgICAgICAgICAgIHdzLmJpbmFyeVR5cGUgPSB0aGlzLmJpbmFyeVR5cGU7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdhdHRlbXB0LWNvbm5lY3QnLCBzZWxmLnVybCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBsb2NhbFdzID0gd3M7XG4gICAgICAgICAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnY29ubmVjdGlvbi10aW1lb3V0Jywgc2VsZi51cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aW1lZE91dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgbG9jYWxXcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIHRpbWVkT3V0ID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBzZWxmLnRpbWVvdXRJbnRlcnZhbCk7XG5cbiAgICAgICAgICAgIHdzLm9ub3BlbiA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kZWJ1ZyB8fCBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWdBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVjb25uZWN0aW5nV2ViU29ja2V0KionLCAnb25vcGVuJywgc2VsZi51cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnByb3RvY29sID0gd3MucHJvdG9jb2w7XG4gICAgICAgICAgICAgICAgc2VsZi5yZWFkeVN0YXRlID0gV2ViU29ja2V0Lk9QRU47XG4gICAgICAgICAgICAgICAgc2VsZi5yZWNvbm5lY3RBdHRlbXB0cyA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGUgPSBnZW5lcmF0ZUV2ZW50KCdvcGVuJyk7XG4gICAgICAgICAgICAgICAgZS5pc1JlY29ubmVjdCA9IHJlY29ubmVjdEF0dGVtcHQ7XG4gICAgICAgICAgICAgICAgcmVjb25uZWN0QXR0ZW1wdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB3cy5vbmNsb3NlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LmNvZGUgIT09IDEwMDApIGNvbnNvbGUubG9nKCdXQVJOSU5HISB3cyBjb25uZWN0aW9uJywgc3VybCwgJ2Nsb3NlZCcpO1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB3cyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlZENsb3NlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYucmVhZHlTdGF0ZSA9IFdlYlNvY2tldC5DTE9TRUQ7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VuZXJhdGVFdmVudCgnY2xvc2UnKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWFkeVN0YXRlID0gV2ViU29ja2V0LkNPTk5FQ1RJTkc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlID0gZ2VuZXJhdGVFdmVudCgnY29ubmVjdGluZycpO1xuICAgICAgICAgICAgICAgICAgICBlLmNvZGUgPSBldmVudC5jb2RlO1xuICAgICAgICAgICAgICAgICAgICBlLnJlYXNvbiA9IGV2ZW50LnJlYXNvbjtcbiAgICAgICAgICAgICAgICAgICAgZS53YXNDbGVhbiA9IGV2ZW50Lndhc0NsZWFuO1xuICAgICAgICAgICAgICAgICAgICBldmVudFRhcmdldC5kaXNwYXRjaEV2ZW50KGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlY29ubmVjdEF0dGVtcHQgJiYgIXRpbWVkT3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5kZWJ1ZyB8fCBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWdBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnb25jbG9zZScsIHNlbGYudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VuZXJhdGVFdmVudCgnY2xvc2UnKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNlbGYuaWRsZVRyZXNob2xkIHx8IG5ldyBEYXRlKCkgLSBzZWxmLmlkbGVTaW5jZSA8IHNlbGYuaWRsZVRyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnaWRsZSAtIHdpbGwgcmVjb25uZWN0IGxhdGVyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnBlbmRpbmdSZWNvbm5lY3QgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHdzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnb25tZXNzYWdlJywgc2VsZi51cmwsIGV2ZW50LmRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZSA9IGdlbmVyYXRlRXZlbnQoJ21lc3NhZ2UnKTtcbiAgICAgICAgICAgICAgICBlLmRhdGEgPSBldmVudC5kYXRhO1xuICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgd3Mub25lcnJvciA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnb25lcnJvcicsIHNlbGYudXJsLCBldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VuZXJhdGVFdmVudChldmVudCkpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBXaGV0aGVyIG9yIG5vdCB0byBjcmVhdGUgYSB3ZWJzb2NrZXQgdXBvbiBpbnN0YW50aWF0aW9uXG4gICAgICAgIGlmICh0aGlzLmF1dG9tYXRpY09wZW4gPT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5vcGVuKGZhbHNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUcmFuc21pdHMgZGF0YSB0byB0aGUgc2VydmVyIG92ZXIgdGhlIFdlYlNvY2tldCBjb25uZWN0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gZGF0YSBhIHRleHQgc3RyaW5nLCBBcnJheUJ1ZmZlciBvciBCbG9iIHRvIHNlbmQgdG8gdGhlIHNlcnZlci5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAod3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5kZWJ1ZyB8fCBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWdBbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVjb25uZWN0aW5nV2ViU29ja2V0JywgJ3NlbmQnLCBzZWxmLnVybCwgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB3cy5zZW5kKGRhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSU5WQUxJRF9TVEFURV9FUlIgOiBQYXVzaW5nIHRvIHJlY29ubmVjdCB3ZWJzb2NrZXQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbG9zZXMgdGhlIFdlYlNvY2tldCBjb25uZWN0aW9uIG9yIGNvbm5lY3Rpb24gYXR0ZW1wdCwgaWYgYW55LlxuICAgICAgICAgKiBJZiB0aGUgY29ubmVjdGlvbiBpcyBhbHJlYWR5IENMT1NFRCwgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jbG9zZSA9IGZ1bmN0aW9uIChjb2RlLCByZWFzb24pIHtcbiAgICAgICAgICAgIC8vIERlZmF1bHQgQ0xPU0VfTk9STUFMIGNvZGVcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29kZSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvZGUgPSAxMDAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yY2VkQ2xvc2UgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHdzKSB7XG4gICAgICAgICAgICAgICAgd3MuY2xvc2UoY29kZSwgcmVhc29uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkaXRpb25hbCBwdWJsaWMgQVBJIG1ldGhvZCB0byByZWZyZXNoIHRoZSBjb25uZWN0aW9uIGlmIHN0aWxsIG9wZW4gKGNsb3NlLCByZS1vcGVuKS5cbiAgICAgICAgICogRm9yIGV4YW1wbGUsIGlmIHRoZSBhcHAgc3VzcGVjdHMgYmFkIGRhdGEgLyBtaXNzZWQgaGVhcnQgYmVhdHMsIGl0IGNhbiB0cnkgdG8gcmVmcmVzaC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVmcmVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh3cykge1xuICAgICAgICAgICAgICAgIHdzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIFdlYlNvY2tldCBjb25uZWN0aW9uJ3MgcmVhZHlTdGF0ZSBjaGFuZ2VzIHRvIE9QRU47XG4gICAgICogdGhpcyBpbmRpY2F0ZXMgdGhhdCB0aGUgY29ubmVjdGlvbiBpcyByZWFkeSB0byBzZW5kIGFuZCByZWNlaXZlIGRhdGEuXG4gICAgICovXG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0LnByb3RvdHlwZS5vbm9wZW4gPSBmdW5jdGlvbiAoZXZlbnQpIHt9O1xuICAgIC8qKiBBbiBldmVudCBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiB0aGUgV2ViU29ja2V0IGNvbm5lY3Rpb24ncyByZWFkeVN0YXRlIGNoYW5nZXMgdG8gQ0xPU0VELiAqL1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5wcm90b3R5cGUub25jbG9zZSA9IGZ1bmN0aW9uIChldmVudCkge307XG4gICAgLyoqIEFuIGV2ZW50IGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIGEgY29ubmVjdGlvbiBiZWdpbnMgYmVpbmcgYXR0ZW1wdGVkLiAqL1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5wcm90b3R5cGUub25jb25uZWN0aW5nID0gZnVuY3Rpb24gKGV2ZW50KSB7fTtcbiAgICAvKiogQW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gYSBtZXNzYWdlIGlzIHJlY2VpdmVkIGZyb20gdGhlIHNlcnZlci4gKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQucHJvdG90eXBlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge307XG4gICAgLyoqIEFuIGV2ZW50IGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGVycm9yIG9jY3Vycy4gKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQucHJvdG90eXBlLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXZlbnQpIHt9O1xuXG4gICAgLyoqXG4gICAgICogV2hldGhlciBhbGwgaW5zdGFuY2VzIG9mIFJlY29ubmVjdGluZ1dlYlNvY2tldCBzaG91bGQgbG9nIGRlYnVnIG1lc3NhZ2VzLlxuICAgICAqIFNldHRpbmcgdGhpcyB0byB0cnVlIGlzIHRoZSBlcXVpdmFsZW50IG9mIHNldHRpbmcgYWxsIGluc3RhbmNlcyBvZiBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWcgdG8gdHJ1ZS5cbiAgICAgKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQuZGVidWdBbGwgPSBmYWxzZTtcblxuICAgIHJldHVybiBSZWNvbm5lY3RpbmdXZWJTb2NrZXQ7XG59KTsiLCIiXX0=
