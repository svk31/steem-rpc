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
            var _this = this;

            if (this.wsRpc) {
                return;
            }

            try {
                this.wsRpc = new WsRpc(this.options);
            } catch (err) {
                console.error("wsRpc open error:", err);
            }

            this.initPromise = this.wsRpc.login(this.options.user, this.options.pass).then(function () {
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
        key: "close",
        value: function close() {
            if (this.wsRpc) {
                this.wsRpc.close();
                this.wsRpc = null;
            }
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

var RWebSocket = require("./reconnecting-websocket");

var WebSocketRpc = function () {
	function WebSocketRpc(options) {
		var _this = this;

		var rcCallback = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

		_classCallCheck(this, WebSocketRpc);

		if (typeof WebSocket !== "undefined") {
			options.WebSocket = WebSocket;
			options.idleTreshold = "idleTreshold" in options ? options.idleTreshold : 60000; // Only use idle threshold in browsers
		} else {
				options.WebSocket = require("websocket").w3cwebsocket;
				options.idleTreshold = 0; // Always reconnect in node.js
			}
		options.reconnectInterval = 1000;
		options.reconnectDecay = 1.2;

		this.ws = new RWebSocket(options);

		this.ws.timeoutInterval = 15000;

		var initialConnect = true;
		this.rcCallback = rcCallback;
		this.connectPromise = new Promise(function (resolve, reject) {

			_this.ws.onopen = function () {
				if (initialConnect) {
					initialConnect = false;
					resolve();
				} else {
					if (_this.rcCallback) _this.rcCallback();
				}
			};

			_this.ws.onerror = function (err) {
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
		});

		this.cbId = 0;
		this.cbs = new Map();

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
				this.ws.close();
				this.ws = null;
			}
		}
	}]);

	return WebSocketRpc;
}();

module.exports = WebSocketRpc;
},{"./reconnecting-websocket":5,"websocket":6}],4:[function(require,module,exports){
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
                if (event.code !== 1000) console.log('WARNING! ws connection', surl, 'closed: ', event && event.reason ? event.reason : event);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvQXBpSW5zdGFuY2UuanMiLCJsaWIvU3RlZW1BcGkuanMiLCJsaWIvV2ViU29ja2V0UnBjLmpzIiwibGliL2luZGV4LmpzIiwibGliL3JlY29ubmVjdGluZy13ZWJzb2NrZXQuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9hQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0oKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxudmFyIFdzUnBjID0gcmVxdWlyZShcIi4vV2ViU29ja2V0UnBjXCIpO1xudmFyIFN0ZWVtQXBpID0gcmVxdWlyZShcIi4vU3RlZW1BcGlcIik7XG5cbnZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICB1cmw6IFwid3NzOi8vbm9kZS5zdGVlbS53c1wiLFxuICAgIHVzZXI6IFwiXCIsXG4gICAgcGFzczogXCJcIixcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgYXBpczogW1wiZGF0YWJhc2VfYXBpXCIsIFwibmV0d29ya19icm9hZGNhc3RfYXBpXCJdXG59O1xuXG52YXIgYXBpSW5zdGFuY2U7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG4gICAgICAgIGlmIChhcGlJbnN0YW5jZSkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGFwaUluc3RhbmNlID0gbmV3IEFwaUluc3RhbmNlKG9wdGlvbnMpO1xuICAgICAgICBhcGlJbnN0YW5jZS5jb25uZWN0KCk7XG5cbiAgICAgICAgcmV0dXJuIGFwaUluc3RhbmNlO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIGdldCgpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcbiAgICAgICAgdmFyIGNvbm5lY3QgPSBhcmd1bWVudHNbMV07XG5cbiAgICAgICAgaWYgKCFhcGlJbnN0YW5jZSkge1xuICAgICAgICAgICAgYXBpSW5zdGFuY2UgPSBuZXcgQXBpSW5zdGFuY2Uob3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29ubmVjdCkge1xuICAgICAgICAgICAgYXBpSW5zdGFuY2Uuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgICAgIGFwaUluc3RhbmNlLmNvbm5lY3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcGlJbnN0YW5jZTtcbiAgICB9LFxuXG5cbiAgICBjbG9zZTogZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgIGFwaUluc3RhbmNlLmNsb3NlKCk7YXBpSW5zdGFuY2UgPSBudWxsO1xuICAgIH1cbn07XG5cbnZhciBBcGlJbnN0YW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBcGlJbnN0YW5jZShvcHRpb25zKSB7XG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBBcGlJbnN0YW5jZSk7XG5cbiAgICAgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhBcGlJbnN0YW5jZSwgW3tcbiAgICAgICAga2V5OiBcInNldE9wdGlvbnNcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hcGlzLmluZGV4T2YoXCJkYXRhYmFzZV9hcGlcIikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmFwaXMudW5zaGlmdChcImRhdGFiYXNlX2FwaVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiBcImNvbm5lY3RcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNvbm5lY3QoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgICAgICBpZiAodGhpcy53c1JwYykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLndzUnBjID0gbmV3IFdzUnBjKHRoaXMub3B0aW9ucyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwid3NScGMgb3BlbiBlcnJvcjpcIiwgZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5pbml0UHJvbWlzZSA9IHRoaXMud3NScGMubG9naW4odGhpcy5vcHRpb25zLnVzZXIsIHRoaXMub3B0aW9ucy5wYXNzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXBpUHJvbWlzZXMgPSBbXTtcblxuICAgICAgICAgICAgICAgIF90aGlzLm9wdGlvbnMuYXBpcy5mb3JFYWNoKGZ1bmN0aW9uIChhcGkpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXNbXCJfXCIgKyBhcGldID0gbmV3IFN0ZWVtQXBpKF90aGlzLndzUnBjLCBhcGkpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpc1thcGldID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNbXCJfXCIgKyBhcGldO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBhcGlQcm9taXNlcy5wdXNoKF90aGlzW1wiX1wiICsgYXBpXS5pbml0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXBpID09PSBcImRhdGFiYXNlX2FwaVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzW2FwaV0oKS5leGVjKFwiZ2V0X2NvbmZpZ1wiLCBbXSkudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmNoYWluSWQgPSByZXMuU1RFRU1JVF9DSEFJTl9JRDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiY29ubmVjdGVkIHRvIFwiICsgYXBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJjb25uZWN0ZWQgdG8gXCIgKyBhcGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoYXBpUHJvbWlzZXMpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZXJyb3IoXCJVbmFibGUgdG8gY29ubmVjdCB0b1wiLCB0aGlzLm9wdGlvbnMudXJsKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmFibGUgdG8gY29ubmVjdCB0byBcIiArIF90aGlzLm9wdGlvbnMudXJsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6IFwiY2xvc2VcIixcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsb3NlKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMud3NScGMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndzUnBjLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy53c1JwYyA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBudWxsO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIEFwaUluc3RhbmNlO1xufSgpOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSgpO1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfVxuXG52YXIgU3RlZW1BcGkgPSBmdW5jdGlvbiAoKSB7XG5cdGZ1bmN0aW9uIFN0ZWVtQXBpKHdzUnBjLCBhcGlOYW1lKSB7XG5cdFx0X2NsYXNzQ2FsbENoZWNrKHRoaXMsIFN0ZWVtQXBpKTtcblxuXHRcdHRoaXMud3NScGMgPSB3c1JwYztcblx0XHR0aGlzLmFwaU5hbWUgPSBhcGlOYW1lO1xuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKFN0ZWVtQXBpLCBbe1xuXHRcdGtleTogXCJpbml0XCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGluaXQoKSB7XG5cdFx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0XHRyZXR1cm4gdGhpcy53c1JwYy5nZXRBcGlCeU5hbWUodGhpcy5hcGlOYW1lKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuXHRcdFx0XHRfdGhpcy5hcGlJZCA9IHJlc3BvbnNlO1xuXHRcdFx0XHRyZXR1cm4gX3RoaXM7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiZXhlY1wiLFxuXHRcdHZhbHVlOiBmdW5jdGlvbiBleGVjKG1ldGhvZCwgcGFyYW1zKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy53c1JwYy5jYWxsKFt0aGlzLmFwaUlkLCBtZXRob2QsIHBhcmFtc10pLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKFwiU3RlZW1BcGkgZXJyb3I6XCIsIG1ldGhvZCwgcGFyYW1zLCBKU09OLnN0cmluZ2lmeShlcnJvcikpO1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTdGVlbUFwaSBlcnJvcjpcIiArIG1ldGhvZCArIHBhcmFtcyArIEpTT04uc3RyaW5naWZ5KGVycm9yKSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1dKTtcblxuXHRyZXR1cm4gU3RlZW1BcGk7XG59KCk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RlZW1BcGk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KCk7XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9XG5cbnZhciBSV2ViU29ja2V0ID0gcmVxdWlyZShcIi4vcmVjb25uZWN0aW5nLXdlYnNvY2tldFwiKTtcblxudmFyIFdlYlNvY2tldFJwYyA9IGZ1bmN0aW9uICgpIHtcblx0ZnVuY3Rpb24gV2ViU29ja2V0UnBjKG9wdGlvbnMpIHtcblx0XHR2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdFx0dmFyIHJjQ2FsbGJhY2sgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyBudWxsIDogYXJndW1lbnRzWzFdO1xuXG5cdFx0X2NsYXNzQ2FsbENoZWNrKHRoaXMsIFdlYlNvY2tldFJwYyk7XG5cblx0XHRpZiAodHlwZW9mIFdlYlNvY2tldCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0b3B0aW9ucy5XZWJTb2NrZXQgPSBXZWJTb2NrZXQ7XG5cdFx0XHRvcHRpb25zLmlkbGVUcmVzaG9sZCA9IFwiaWRsZVRyZXNob2xkXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuaWRsZVRyZXNob2xkIDogNjAwMDA7IC8vIE9ubHkgdXNlIGlkbGUgdGhyZXNob2xkIGluIGJyb3dzZXJzXG5cdFx0fSBlbHNlIHtcblx0XHRcdFx0b3B0aW9ucy5XZWJTb2NrZXQgPSByZXF1aXJlKFwid2Vic29ja2V0XCIpLnczY3dlYnNvY2tldDtcblx0XHRcdFx0b3B0aW9ucy5pZGxlVHJlc2hvbGQgPSAwOyAvLyBBbHdheXMgcmVjb25uZWN0IGluIG5vZGUuanNcblx0XHRcdH1cblx0XHRvcHRpb25zLnJlY29ubmVjdEludGVydmFsID0gMTAwMDtcblx0XHRvcHRpb25zLnJlY29ubmVjdERlY2F5ID0gMS4yO1xuXG5cdFx0dGhpcy53cyA9IG5ldyBSV2ViU29ja2V0KG9wdGlvbnMpO1xuXG5cdFx0dGhpcy53cy50aW1lb3V0SW50ZXJ2YWwgPSAxNTAwMDtcblxuXHRcdHZhciBpbml0aWFsQ29ubmVjdCA9IHRydWU7XG5cdFx0dGhpcy5yY0NhbGxiYWNrID0gcmNDYWxsYmFjaztcblx0XHR0aGlzLmNvbm5lY3RQcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXG5cdFx0XHRfdGhpcy53cy5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdGlmIChpbml0aWFsQ29ubmVjdCkge1xuXHRcdFx0XHRcdGluaXRpYWxDb25uZWN0ID0gZmFsc2U7XG5cdFx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmIChfdGhpcy5yY0NhbGxiYWNrKSBfdGhpcy5yY0NhbGxiYWNrKCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdF90aGlzLndzLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRcdHJlamVjdChlcnIpO1xuXHRcdFx0fTtcblxuXHRcdFx0X3RoaXMud3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblx0XHRcdFx0dmFyIGRhdGEgPSB7fTtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRkYXRhID0gSlNPTi5wYXJzZShtZXNzYWdlLmRhdGEpO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJVbmFibGUgdG8gcGFyc2UgQVBJIHJlc3BvbnNlOlwiLCBlKTtcblx0XHRcdFx0XHRkYXRhLmVycm9yID0gXCJVbmFibGUgdG8gcGFyc2UgcmVzcG9uc2UgXCIgKyBKU09OLnN0cmluZ2lmeShtZXNzYWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRfdGhpcy5saXN0ZW5lcihkYXRhKTtcblx0XHRcdH07XG5cdFx0fSk7XG5cblx0XHR0aGlzLmNiSWQgPSAwO1xuXHRcdHRoaXMuY2JzID0gbmV3IE1hcCgpO1xuXG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdHdpbmRvdy5vbmJlZm9yZXVubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0X3RoaXMuY2xvc2UoKTtcblx0XHRcdH07XG5cdFx0fVxuXHR9XG5cblx0X2NyZWF0ZUNsYXNzKFdlYlNvY2tldFJwYywgW3tcblx0XHRrZXk6IFwibGlzdGVuZXJcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gbGlzdGVuZXIobWVzc2FnZSkge1xuXHRcdFx0dmFyIGNhbGxiYWNrID0gdGhpcy5jYnMuZ2V0KG1lc3NhZ2UuaWQpO1xuXHRcdFx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0XHRcdHRoaXMuY2JzLmRlbGV0ZShtZXNzYWdlLmlkKTtcblx0XHRcdFx0aWYgKFwiZXJyb3JcIiBpbiBtZXNzYWdlKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2sucmVqZWN0KG1lc3NhZ2UuZXJyb3IpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNhbGxiYWNrLnJlc29sdmUobWVzc2FnZS5yZXN1bHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImNhbGxcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gY2FsbChwYXJhbXMpIHtcblx0XHRcdHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdFx0XHR2YXIgcmVxdWVzdCA9IHtcblx0XHRcdFx0bWV0aG9kOiBcImNhbGxcIixcblx0XHRcdFx0cGFyYW1zOiBwYXJhbXMsXG5cdFx0XHRcdGlkOiB0aGlzLmNiSWQrK1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblxuXHRcdFx0XHRfdGhpczIuY2JzLnNldChyZXF1ZXN0LmlkLCB7XG5cdFx0XHRcdFx0dGltZTogbmV3IERhdGUoKSxcblx0XHRcdFx0XHRyZXNvbHZlOiByZXNvbHZlLFxuXHRcdFx0XHRcdHJlamVjdDogcmVqZWN0XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdF90aGlzMi53cy5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG5cdFx0XHRcdFx0cmVqZWN0KGVycm9yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRfdGhpczIud3Muc2VuZChKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiZ2V0QXBpQnlOYW1lXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGdldEFwaUJ5TmFtZShhcGkpIHtcblx0XHRcdHJldHVybiB0aGlzLmNhbGwoWzEsIFwiZ2V0X2FwaV9ieV9uYW1lXCIsIFthcGldXSk7XG5cdFx0fVxuXHR9LCB7XG5cdFx0a2V5OiBcImxvZ2luXCIsXG5cdFx0dmFsdWU6IGZ1bmN0aW9uIGxvZ2luKHVzZXIsIHBhc3N3b3JkKSB7XG5cdFx0XHR2YXIgX3RoaXMzID0gdGhpcztcblxuXHRcdFx0cmV0dXJuIHRoaXMuY29ubmVjdFByb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiBfdGhpczMuY2FsbChbMSwgXCJsb2dpblwiLCBbdXNlciwgcGFzc3dvcmRdXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sIHtcblx0XHRrZXk6IFwiY2xvc2VcIixcblx0XHR2YWx1ZTogZnVuY3Rpb24gY2xvc2UoKSB7XG5cdFx0XHRpZiAodGhpcy53cykge1xuXHRcdFx0XHR0aGlzLndzLmNsb3NlKCk7XG5cdFx0XHRcdHRoaXMud3MgPSBudWxsO1xuXHRcdFx0fVxuXHRcdH1cblx0fV0pO1xuXG5cdHJldHVybiBXZWJTb2NrZXRScGM7XG59KCk7XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViU29ja2V0UnBjOyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgQ2xpZW50ID0gcmVxdWlyZShcIi4vQXBpSW5zdGFuY2VcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRDbGllbnQ6IENsaWVudFxufTsiLCIndXNlIHN0cmljdCc7XG5cbi8vIE1JVCBMaWNlbnNlOlxuLy9cbi8vIENvcHlyaWdodCAoYykgMjAxMC0yMDEyLCBKb2UgV2FsbmVzXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuLyoqXG4gKiBUaGlzIGJlaGF2ZXMgbGlrZSBhIFdlYlNvY2tldCBpbiBldmVyeSB3YXksIGV4Y2VwdCBpZiBpdCBmYWlscyB0byBjb25uZWN0LFxuICogb3IgaXQgZ2V0cyBkaXNjb25uZWN0ZWQsIGl0IHdpbGwgcmVwZWF0ZWRseSBwb2xsIHVudGlsIGl0IHN1Y2Nlc3NmdWxseSBjb25uZWN0c1xuICogYWdhaW4uXG4gKlxuICogSXQgaXMgQVBJIGNvbXBhdGlibGUsIHNvIHdoZW4geW91IGhhdmU6XG4gKiAgIHdzID0gbmV3IFdlYlNvY2tldCgnd3M6Ly8uLi4uJyk7XG4gKiB5b3UgY2FuIHJlcGxhY2Ugd2l0aDpcbiAqICAgd3MgPSBuZXcgUmVjb25uZWN0aW5nV2ViU29ja2V0KCd3czovLy4uLi4nKTtcbiAqXG4gKiBUaGUgZXZlbnQgc3RyZWFtIHdpbGwgdHlwaWNhbGx5IGxvb2sgbGlrZTpcbiAqICBvbmNvbm5lY3RpbmdcbiAqICBvbm9wZW5cbiAqICBvbm1lc3NhZ2VcbiAqICBvbm1lc3NhZ2VcbiAqICBvbmNsb3NlIC8vIGxvc3QgY29ubmVjdGlvblxuICogIG9uY29ubmVjdGluZ1xuICogIG9ub3BlbiAgLy8gc29tZXRpbWUgbGF0ZXIuLi5cbiAqICBvbm1lc3NhZ2VcbiAqICBvbm1lc3NhZ2VcbiAqICBldGMuLi5cbiAqXG4gKiBJdCBpcyBBUEkgY29tcGF0aWJsZSB3aXRoIHRoZSBzdGFuZGFyZCBXZWJTb2NrZXQgQVBJLCBhcGFydCBmcm9tIHRoZSBmb2xsb3dpbmcgbWVtYmVyczpcbiAqXG4gKiAtIGBidWZmZXJlZEFtb3VudGBcbiAqIC0gYGV4dGVuc2lvbnNgXG4gKiAtIGBiaW5hcnlUeXBlYFxuICpcbiAqIExhdGVzdCB2ZXJzaW9uOiBodHRwczovL2dpdGh1Yi5jb20vam9ld2FsbmVzL3JlY29ubmVjdGluZy13ZWJzb2NrZXQvXG4gKiAtIEpvZSBXYWxuZXNcbiAqXG4gKiBTeW50YXhcbiAqID09PT09PVxuICogdmFyIHNvY2tldCA9IG5ldyBSZWNvbm5lY3RpbmdXZWJTb2NrZXQodXJsLCBwcm90b2NvbHMsIG9wdGlvbnMpO1xuICpcbiAqIFBhcmFtZXRlcnNcbiAqID09PT09PT09PT1cbiAqIHVybCAtIFRoZSB1cmwgeW91IGFyZSBjb25uZWN0aW5nIHRvLlxuICogcHJvdG9jb2xzIC0gT3B0aW9uYWwgc3RyaW5nIG9yIGFycmF5IG9mIHByb3RvY29scy5cbiAqIG9wdGlvbnMgLSBTZWUgYmVsb3dcbiAqXG4gKiBPcHRpb25zXG4gKiA9PT09PT09XG4gKiBPcHRpb25zIGNhbiBlaXRoZXIgYmUgcGFzc2VkIHVwb24gaW5zdGFudGlhdGlvbiBvciBzZXQgYWZ0ZXIgaW5zdGFudGlhdGlvbjpcbiAqXG4gKiB2YXIgc29ja2V0ID0gbmV3IFJlY29ubmVjdGluZ1dlYlNvY2tldCh1cmwsIG51bGwsIHsgZGVidWc6IHRydWUsIHJlY29ubmVjdEludGVydmFsOiA0MDAwIH0pO1xuICpcbiAqIG9yXG4gKlxuICogdmFyIHNvY2tldCA9IG5ldyBSZWNvbm5lY3RpbmdXZWJTb2NrZXQodXJsKTtcbiAqIHNvY2tldC5kZWJ1ZyA9IHRydWU7XG4gKiBzb2NrZXQucmVjb25uZWN0SW50ZXJ2YWwgPSA0MDAwO1xuICpcbiAqIGRlYnVnXG4gKiAtIFdoZXRoZXIgdGhpcyBpbnN0YW5jZSBzaG91bGQgbG9nIGRlYnVnIG1lc3NhZ2VzLiBBY2NlcHRzIHRydWUgb3IgZmFsc2UuIERlZmF1bHQ6IGZhbHNlLlxuICpcbiAqIGF1dG9tYXRpY09wZW5cbiAqIC0gV2hldGhlciBvciBub3QgdGhlIHdlYnNvY2tldCBzaG91bGQgYXR0ZW1wdCB0byBjb25uZWN0IGltbWVkaWF0ZWx5IHVwb24gaW5zdGFudGlhdGlvbi4gVGhlIHNvY2tldCBjYW4gYmUgbWFudWFsbHkgb3BlbmVkIG9yIGNsb3NlZCBhdCBhbnkgdGltZSB1c2luZyB3cy5vcGVuKCkgYW5kIHdzLmNsb3NlKCkuXG4gKlxuICogcmVjb25uZWN0SW50ZXJ2YWxcbiAqIC0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkgYmVmb3JlIGF0dGVtcHRpbmcgdG8gcmVjb25uZWN0LiBBY2NlcHRzIGludGVnZXIuIERlZmF1bHQ6IDEwMDAuXG4gKlxuICogbWF4UmVjb25uZWN0SW50ZXJ2YWxcbiAqIC0gVGhlIG1heGltdW0gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheSBhIHJlY29ubmVjdGlvbiBhdHRlbXB0LiBBY2NlcHRzIGludGVnZXIuIERlZmF1bHQ6IDMwMDAwLlxuICpcbiAqIHJlY29ubmVjdERlY2F5XG4gKiAtIFRoZSByYXRlIG9mIGluY3JlYXNlIG9mIHRoZSByZWNvbm5lY3QgZGVsYXkuIEFsbG93cyByZWNvbm5lY3QgYXR0ZW1wdHMgdG8gYmFjayBvZmYgd2hlbiBwcm9ibGVtcyBwZXJzaXN0LiBBY2NlcHRzIGludGVnZXIgb3IgZmxvYXQuIERlZmF1bHQ6IDEuNS5cbiAqXG4gKiB0aW1lb3V0SW50ZXJ2YWxcbiAqIC0gVGhlIG1heGltdW0gdGltZSBpbiBtaWxsaXNlY29uZHMgdG8gd2FpdCBmb3IgYSBjb25uZWN0aW9uIHRvIHN1Y2NlZWQgYmVmb3JlIGNsb3NpbmcgYW5kIHJldHJ5aW5nLiBBY2NlcHRzIGludGVnZXIuIERlZmF1bHQ6IDIwMDAuXG4gKlxuICovXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFtdLCBmYWN0b3J5KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGdsb2JhbC5SZWNvbm5lY3RpbmdXZWJTb2NrZXQgPSBmYWN0b3J5KCk7XG4gICAgfVxufSkodW5kZWZpbmVkLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAvL2lmICghKCdXZWJTb2NrZXQnIGluIHdpbmRvdykpIHtcbiAgICAvLyAgICByZXR1cm47XG4gICAgLy99XG5cbiAgICB2YXIgV2ViU29ja2V0O1xuXG4gICAgZnVuY3Rpb24gUmVjb25uZWN0aW5nV2ViU29ja2V0KG9wdGlvbnMpIHtcblxuICAgICAgICAvLyBEZWZhdWx0IHNldHRpbmdzXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHtcblxuICAgICAgICAgICAgLyoqIFdoZXRoZXIgdGhpcyBpbnN0YW5jZSBzaG91bGQgbG9nIGRlYnVnIG1lc3NhZ2VzLiAqL1xuICAgICAgICAgICAgZGVidWc6IGZhbHNlLFxuXG4gICAgICAgICAgICAvKiogV2hldGhlciBvciBub3QgdGhlIHdlYnNvY2tldCBzaG91bGQgYXR0ZW1wdCB0byBjb25uZWN0IGltbWVkaWF0ZWx5IHVwb24gaW5zdGFudGlhdGlvbi4gKi9cbiAgICAgICAgICAgIGF1dG9tYXRpY09wZW46IHRydWUsXG5cbiAgICAgICAgICAgIC8qKiBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byBkZWxheSBiZWZvcmUgYXR0ZW1wdGluZyB0byByZWNvbm5lY3QuICovXG4gICAgICAgICAgICByZWNvbm5lY3RJbnRlcnZhbDogMjAwMCxcbiAgICAgICAgICAgIC8qKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5IGEgcmVjb25uZWN0aW9uIGF0dGVtcHQuICovXG4gICAgICAgICAgICBtYXhSZWNvbm5lY3RJbnRlcnZhbDogMzAwMDAwLFxuICAgICAgICAgICAgLyoqIFRoZSByYXRlIG9mIGluY3JlYXNlIG9mIHRoZSByZWNvbm5lY3QgZGVsYXkuIEFsbG93cyByZWNvbm5lY3QgYXR0ZW1wdHMgdG8gYmFjayBvZmYgd2hlbiBwcm9ibGVtcyBwZXJzaXN0LiAqL1xuICAgICAgICAgICAgcmVjb25uZWN0RGVjYXk6IDEuNSxcblxuICAgICAgICAgICAgLyoqIFRoZSBtYXhpbXVtIHRpbWUgaW4gbWlsbGlzZWNvbmRzIHRvIHdhaXQgZm9yIGEgY29ubmVjdGlvbiB0byBzdWNjZWVkIGJlZm9yZSBjbG9zaW5nIGFuZCByZXRyeWluZy4gKi9cbiAgICAgICAgICAgIHRpbWVvdXRJbnRlcnZhbDogMjAwMCxcblxuICAgICAgICAgICAgLyoqIFRoZSBtYXhpbXVtIG51bWJlciBvZiByZWNvbm5lY3Rpb24gYXR0ZW1wdHMgdG8gbWFrZS4gVW5saW1pdGVkIGlmIG51bGwuICovXG4gICAgICAgICAgICBtYXhSZWNvbm5lY3RBdHRlbXB0czogMTAwLFxuXG4gICAgICAgICAgICAvKiogVGhlIGJpbmFyeSB0eXBlLCBwb3NzaWJsZSB2YWx1ZXMgJ2Jsb2InIG9yICdhcnJheWJ1ZmZlcicsIGRlZmF1bHQgJ2Jsb2InLiAqL1xuICAgICAgICAgICAgYmluYXJ5VHlwZTogJ2FycmF5YnVmZmVyJyxcblxuICAgICAgICAgICAgLyoqIERvbid0IHJlY29ubmVjdCBpZiBpZGxlIChubyB1c2VyIGFjdGl2aXR5IGFmdGVyIGlkbGVUcmVzaG9sZCksIHBhc3MgMCB0byBhbHdheXMgcmVjb25uZWN0ICoqL1xuICAgICAgICAgICAgaWRsZVRyZXNob2xkOiAwXG4gICAgICAgIH07XG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgV2ViU29ja2V0ID0gb3B0aW9ucy5XZWJTb2NrZXQ7XG4gICAgICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5DT05ORUNUSU5HID0gV2ViU29ja2V0LkNPTk5FQ1RJTkc7XG4gICAgICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5PUEVOID0gV2ViU29ja2V0Lk9QRU47XG4gICAgICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5DTE9TSU5HID0gV2ViU29ja2V0LkNMT1NJTkc7XG4gICAgICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5DTE9TRUQgPSBXZWJTb2NrZXQuQ0xPU0VEO1xuICAgICAgICBpZiAoIWNvbnNvbGUuZGVidWcpIGNvbnNvbGUuZGVidWcgPSBjb25zb2xlLmxvZztcblxuICAgICAgICAvLyBPdmVyd3JpdGUgYW5kIGRlZmluZSBzZXR0aW5ncyB3aXRoIG9wdGlvbnMgaWYgdGhleSBleGlzdC5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIHNldHRpbmdzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnNba2V5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzW2tleV0gPSBvcHRpb25zW2tleV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXNba2V5XSA9IHNldHRpbmdzW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGVzZSBzaG91bGQgYmUgdHJlYXRlZCBhcyByZWFkLW9ubHkgcHJvcGVydGllc1xuXG4gICAgICAgIC8qKiBUaGUgVVJMIGFzIHJlc29sdmVkIGJ5IHRoZSBjb25zdHJ1Y3Rvci4gVGhpcyBpcyBhbHdheXMgYW4gYWJzb2x1dGUgVVJMLiBSZWFkIG9ubHkuICovXG4gICAgICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmw7XG5cbiAgICAgICAgLyoqIFRoZSBudW1iZXIgb2YgYXR0ZW1wdGVkIHJlY29ubmVjdHMgc2luY2Ugc3RhcnRpbmcsIG9yIHRoZSBsYXN0IHN1Y2Nlc3NmdWwgY29ubmVjdGlvbi4gUmVhZCBvbmx5LiAqL1xuICAgICAgICB0aGlzLnJlY29ubmVjdEF0dGVtcHRzID0gMDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGNvbm5lY3Rpb24uXG4gICAgICAgICAqIENhbiBiZSBvbmUgb2Y6IFdlYlNvY2tldC5DT05ORUNUSU5HLCBXZWJTb2NrZXQuT1BFTiwgV2ViU29ja2V0LkNMT1NJTkcsIFdlYlNvY2tldC5DTE9TRURcbiAgICAgICAgICogUmVhZCBvbmx5LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gV2ViU29ja2V0LkNPTk5FQ1RJTkc7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEEgc3RyaW5nIGluZGljYXRpbmcgdGhlIG5hbWUgb2YgdGhlIHN1Yi1wcm90b2NvbCB0aGUgc2VydmVyIHNlbGVjdGVkOyB0aGlzIHdpbGwgYmUgb25lIG9mXG4gICAgICAgICAqIHRoZSBzdHJpbmdzIHNwZWNpZmllZCBpbiB0aGUgcHJvdG9jb2xzIHBhcmFtZXRlciB3aGVuIGNyZWF0aW5nIHRoZSBXZWJTb2NrZXQgb2JqZWN0LlxuICAgICAgICAgKiBSZWFkIG9ubHkuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnByb3RvY29sID0gbnVsbDtcblxuICAgICAgICAvLyBQcml2YXRlIHN0YXRlIHZhcmlhYmxlc1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHdzO1xuICAgICAgICB2YXIgZm9yY2VkQ2xvc2UgPSBmYWxzZTtcbiAgICAgICAgdmFyIHRpbWVkT3V0ID0gZmFsc2U7XG4gICAgICAgIHZhciBoYW5kbGVycyA9IHt9O1xuICAgICAgICB2YXIgZXZlbnRUYXJnZXQgPSB7XG4gICAgICAgICAgICBhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbiBhZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlcjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyOiBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGhhbmRsZXJzW2V2ZW50XTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkaXNwYXRjaEV2ZW50OiBmdW5jdGlvbiBkaXNwYXRjaEV2ZW50KGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBoYW5kbGVyc1tldmVudC5uYW1lXTtcbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcikgaGFuZGxlcihldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07IC8vZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAgICAgLy8gV2lyZSB1cCBcIm9uKlwiIHByb3BlcnRpZXMgYXMgZXZlbnQgaGFuZGxlcnNcblxuICAgICAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLm9ub3BlbihldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBldmVudFRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdjbG9zZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgc2VsZi5vbmNsb3NlKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2Nvbm5lY3RpbmcnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHNlbGYub25jb25uZWN0aW5nKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHNlbGYub25tZXNzYWdlKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLm9uZXJyb3IoZXZlbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBFeHBvc2UgdGhlIEFQSSByZXF1aXJlZCBieSBFdmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lciA9IGV2ZW50VGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIuYmluZChldmVudFRhcmdldCk7XG4gICAgICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGV2ZW50VGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIuYmluZChldmVudFRhcmdldCk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCA9IGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQuYmluZChldmVudFRhcmdldCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoaXMgZnVuY3Rpb24gZ2VuZXJhdGVzIGFuIGV2ZW50IHRoYXQgaXMgY29tcGF0aWJsZSB3aXRoIHN0YW5kYXJkXG4gICAgICAgICAqIGNvbXBsaWFudCBicm93c2VycyBhbmQgSUU5IC0gSUUxMVxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGlzIHdpbGwgcHJldmVudCB0aGUgZXJyb3I6XG4gICAgICAgICAqIE9iamVjdCBkb2Vzbid0IHN1cHBvcnQgdGhpcyBhY3Rpb25cbiAgICAgICAgICpcbiAgICAgICAgICogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTM0NTM5Mi93aHktYXJlbnQtbXktcGFyYW1ldGVycy1nZXR0aW5nLXBhc3NlZC10aHJvdWdoLXRvLWEtZGlzcGF0Y2hlZC1ldmVudC8xOTM0NTU2MyMxOTM0NTU2M1xuICAgICAgICAgKiBAcGFyYW0gcyBTdHJpbmcgVGhlIG5hbWUgdGhhdCB0aGUgZXZlbnQgc2hvdWxkIHVzZVxuICAgICAgICAgKiBAcGFyYW0gYXJncyBPYmplY3QgYW4gb3B0aW9uYWwgb2JqZWN0IHRoYXQgdGhlIGV2ZW50IHdpbGwgdXNlXG4gICAgICAgICAqL1xuICAgICAgICBmdW5jdGlvbiBnZW5lcmF0ZUV2ZW50KHMsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vdmFyIGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiQ3VzdG9tRXZlbnRcIik7XG4gICAgICAgICAgICAvL2V2dC5pbml0Q3VzdG9tRXZlbnQocywgZmFsc2UsIGZhbHNlLCBhcmdzKTtcbiAgICAgICAgICAgIC8vcmV0dXJuIGV2dDtcbiAgICAgICAgICAgIHJldHVybiB7IG5hbWU6IHMgfTtcbiAgICAgICAgfTtcblxuICAgICAgICBzZWxmLnBlbmRpbmdSZWNvbm5lY3QgPSBmYWxzZTtcbiAgICAgICAgc2VsZi5pZGxlU2luY2UgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLmlkbGVUcmVzaG9sZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5vbmtleXByZXNzID0gZG9jdW1lbnQub25tb3VzZW1vdmUgPSBkb2N1bWVudC5vbmNsaWNrID0gZG9jdW1lbnQub25zY3JvbGwgPSBkb2N1bWVudC50b3VjaHN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmlkbGVTaW5jZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLnBlbmRpbmdSZWNvbm5lY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucGVuZGluZ1JlY29ubmVjdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0aW1lb3V0ID0gc2VsZi5yZWNvbm5lY3RJbnRlcnZhbCAqIE1hdGgucG93KHNlbGYucmVjb25uZWN0RGVjYXksIHNlbGYucmVjb25uZWN0QXR0ZW1wdHMpO1xuICAgICAgICAgICAgdGltZW91dCA9IHRpbWVvdXQgPiBzZWxmLm1heFJlY29ubmVjdEludGVydmFsID8gc2VsZi5tYXhSZWNvbm5lY3RJbnRlcnZhbCA6IHRpbWVvdXQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnV2ViU29ja2V0OiB3aWxsIHRyeSB0byByZWNvbm5lY3QgaW4gJyArIHBhcnNlSW50KHRpbWVvdXQgLyAxMDAwKSArICcgc2VjLCBhdHRlbXB0ICMnICsgKHNlbGYucmVjb25uZWN0QXR0ZW1wdHMgKyAxKSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlY29ubmVjdEF0dGVtcHRzKys7XG4gICAgICAgICAgICAgICAgc2VsZi5vcGVuKHRydWUpO1xuICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5vcGVuID0gZnVuY3Rpb24gKHJlY29ubmVjdEF0dGVtcHQpIHtcbiAgICAgICAgICAgIGlmIChyZWNvbm5lY3RBdHRlbXB0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWF4UmVjb25uZWN0QXR0ZW1wdHMgJiYgdGhpcy5yZWNvbm5lY3RBdHRlbXB0cyA+IHRoaXMubWF4UmVjb25uZWN0QXR0ZW1wdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChnZW5lcmF0ZUV2ZW50KCdjb25uZWN0aW5nJykpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVjb25uZWN0QXR0ZW1wdHMgPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3VybCA9IHNlbGYudXJsO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZi51cmwpKSB7XG4gICAgICAgICAgICAgICAgc3VybCA9IHNlbGYudXJsW3RoaXMucmVjb25uZWN0QXR0ZW1wdHMgJSBzZWxmLnVybC5sZW5ndGhdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGluZyB0bycsIHN1cmwpO1xuICAgICAgICAgICAgd3MgPSBuZXcgV2ViU29ja2V0KHN1cmwpO1xuICAgICAgICAgICAgd3MuYmluYXJ5VHlwZSA9IHRoaXMuYmluYXJ5VHlwZTtcblxuICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVjb25uZWN0aW5nV2ViU29ja2V0JywgJ2F0dGVtcHQtY29ubmVjdCcsIHNlbGYudXJsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGxvY2FsV3MgPSB3cztcbiAgICAgICAgICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdjb25uZWN0aW9uLXRpbWVvdXQnLCBzZWxmLnVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRpbWVkT3V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBsb2NhbFdzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgdGltZWRPdXQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIHNlbGYudGltZW91dEludGVydmFsKTtcblxuICAgICAgICAgICAgd3Mub25vcGVuID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQqKicsICdvbm9wZW4nLCBzZWxmLnVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYucHJvdG9jb2wgPSB3cy5wcm90b2NvbDtcbiAgICAgICAgICAgICAgICBzZWxmLnJlYWR5U3RhdGUgPSBXZWJTb2NrZXQuT1BFTjtcbiAgICAgICAgICAgICAgICBzZWxmLnJlY29ubmVjdEF0dGVtcHRzID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGdlbmVyYXRlRXZlbnQoJ29wZW4nKTtcbiAgICAgICAgICAgICAgICBlLmlzUmVjb25uZWN0ID0gcmVjb25uZWN0QXR0ZW1wdDtcbiAgICAgICAgICAgICAgICByZWNvbm5lY3RBdHRlbXB0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChlKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHdzLm9uY2xvc2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQuY29kZSAhPT0gMTAwMCkgY29uc29sZS5sb2coJ1dBUk5JTkchIHdzIGNvbm5lY3Rpb24nLCBzdXJsLCAnY2xvc2VkOiAnLCBldmVudCAmJiBldmVudC5yZWFzb24gPyBldmVudC5yZWFzb24gOiBldmVudCk7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VkQ2xvc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWFkeVN0YXRlID0gV2ViU29ja2V0LkNMT1NFRDtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChnZW5lcmF0ZUV2ZW50KCdjbG9zZScpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlYWR5U3RhdGUgPSBXZWJTb2NrZXQuQ09OTkVDVElORztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGUgPSBnZW5lcmF0ZUV2ZW50KCdjb25uZWN0aW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIGUuY29kZSA9IGV2ZW50LmNvZGU7XG4gICAgICAgICAgICAgICAgICAgIGUucmVhc29uID0gZXZlbnQucmVhc29uO1xuICAgICAgICAgICAgICAgICAgICBlLndhc0NsZWFuID0gZXZlbnQud2FzQ2xlYW47XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50VGFyZ2V0LmRpc3BhdGNoRXZlbnQoZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVjb25uZWN0QXR0ZW1wdCAmJiAhdGltZWRPdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdvbmNsb3NlJywgc2VsZi51cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChnZW5lcmF0ZUV2ZW50KCdjbG9zZScpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5pZGxlVHJlc2hvbGQgfHwgbmV3IERhdGUoKSAtIHNlbGYuaWRsZVNpbmNlIDwgc2VsZi5pZGxlVHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdpZGxlIC0gd2lsbCByZWNvbm5lY3QgbGF0ZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucGVuZGluZ1JlY29ubmVjdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgd3Mub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdvbm1lc3NhZ2UnLCBzZWxmLnVybCwgZXZlbnQuZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBlID0gZ2VuZXJhdGVFdmVudCgnbWVzc2FnZScpO1xuICAgICAgICAgICAgICAgIGUuZGF0YSA9IGV2ZW50LmRhdGE7XG4gICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChlKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB3cy5vbmVycm9yID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZGVidWcgfHwgUmVjb25uZWN0aW5nV2ViU29ja2V0LmRlYnVnQWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1JlY29ubmVjdGluZ1dlYlNvY2tldCcsICdvbmVycm9yJywgc2VsZi51cmwsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXZlbnRUYXJnZXQuZGlzcGF0Y2hFdmVudChnZW5lcmF0ZUV2ZW50KGV2ZW50KSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIFdoZXRoZXIgb3Igbm90IHRvIGNyZWF0ZSBhIHdlYnNvY2tldCB1cG9uIGluc3RhbnRpYXRpb25cbiAgICAgICAgaWYgKHRoaXMuYXV0b21hdGljT3BlbiA9PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLm9wZW4oZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRyYW5zbWl0cyBkYXRhIHRvIHRoZSBzZXJ2ZXIgb3ZlciB0aGUgV2ViU29ja2V0IGNvbm5lY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBkYXRhIGEgdGV4dCBzdHJpbmcsIEFycmF5QnVmZmVyIG9yIEJsb2IgdG8gc2VuZCB0byB0aGUgc2VydmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZW5kID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmICh3cykge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmRlYnVnIHx8IFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZWNvbm5lY3RpbmdXZWJTb2NrZXQnLCAnc2VuZCcsIHNlbGYudXJsLCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdzLnNlbmQoZGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93ICdJTlZBTElEX1NUQVRFX0VSUiA6IFBhdXNpbmcgdG8gcmVjb25uZWN0IHdlYnNvY2tldCc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENsb3NlcyB0aGUgV2ViU29ja2V0IGNvbm5lY3Rpb24gb3IgY29ubmVjdGlvbiBhdHRlbXB0LCBpZiBhbnkuXG4gICAgICAgICAqIElmIHRoZSBjb25uZWN0aW9uIGlzIGFscmVhZHkgQ0xPU0VELCB0aGlzIG1ldGhvZCBkb2VzIG5vdGhpbmcuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24gKGNvZGUsIHJlYXNvbikge1xuICAgICAgICAgICAgLy8gRGVmYXVsdCBDTE9TRV9OT1JNQUwgY29kZVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb2RlID09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29kZSA9IDEwMDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3JjZWRDbG9zZSA9IHRydWU7XG4gICAgICAgICAgICBpZiAod3MpIHtcbiAgICAgICAgICAgICAgICB3cy5jbG9zZShjb2RlLCByZWFzb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRpdGlvbmFsIHB1YmxpYyBBUEkgbWV0aG9kIHRvIHJlZnJlc2ggdGhlIGNvbm5lY3Rpb24gaWYgc3RpbGwgb3BlbiAoY2xvc2UsIHJlLW9wZW4pLlxuICAgICAgICAgKiBGb3IgZXhhbXBsZSwgaWYgdGhlIGFwcCBzdXNwZWN0cyBiYWQgZGF0YSAvIG1pc3NlZCBoZWFydCBiZWF0cywgaXQgY2FuIHRyeSB0byByZWZyZXNoLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWZyZXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHdzKSB7XG4gICAgICAgICAgICAgICAgd3MuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbiBldmVudCBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiB0aGUgV2ViU29ja2V0IGNvbm5lY3Rpb24ncyByZWFkeVN0YXRlIGNoYW5nZXMgdG8gT1BFTjtcbiAgICAgKiB0aGlzIGluZGljYXRlcyB0aGF0IHRoZSBjb25uZWN0aW9uIGlzIHJlYWR5IHRvIHNlbmQgYW5kIHJlY2VpdmUgZGF0YS5cbiAgICAgKi9cbiAgICBSZWNvbm5lY3RpbmdXZWJTb2NrZXQucHJvdG90eXBlLm9ub3BlbiA9IGZ1bmN0aW9uIChldmVudCkge307XG4gICAgLyoqIEFuIGV2ZW50IGxpc3RlbmVyIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBXZWJTb2NrZXQgY29ubmVjdGlvbidzIHJlYWR5U3RhdGUgY2hhbmdlcyB0byBDTE9TRUQuICovXG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0LnByb3RvdHlwZS5vbmNsb3NlID0gZnVuY3Rpb24gKGV2ZW50KSB7fTtcbiAgICAvKiogQW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gYSBjb25uZWN0aW9uIGJlZ2lucyBiZWluZyBhdHRlbXB0ZWQuICovXG4gICAgUmVjb25uZWN0aW5nV2ViU29ja2V0LnByb3RvdHlwZS5vbmNvbm5lY3RpbmcgPSBmdW5jdGlvbiAoZXZlbnQpIHt9O1xuICAgIC8qKiBBbiBldmVudCBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiBhIG1lc3NhZ2UgaXMgcmVjZWl2ZWQgZnJvbSB0aGUgc2VydmVyLiAqL1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5wcm90b3R5cGUub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7fTtcbiAgICAvKiogQW4gZXZlbnQgbGlzdGVuZXIgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXJyb3Igb2NjdXJzLiAqL1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5wcm90b3R5cGUub25lcnJvciA9IGZ1bmN0aW9uIChldmVudCkge307XG5cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIGFsbCBpbnN0YW5jZXMgb2YgUmVjb25uZWN0aW5nV2ViU29ja2V0IHNob3VsZCBsb2cgZGVidWcgbWVzc2FnZXMuXG4gICAgICogU2V0dGluZyB0aGlzIHRvIHRydWUgaXMgdGhlIGVxdWl2YWxlbnQgb2Ygc2V0dGluZyBhbGwgaW5zdGFuY2VzIG9mIFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1ZyB0byB0cnVlLlxuICAgICAqL1xuICAgIFJlY29ubmVjdGluZ1dlYlNvY2tldC5kZWJ1Z0FsbCA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIFJlY29ubmVjdGluZ1dlYlNvY2tldDtcbn0pOyIsIiJdfQ==
