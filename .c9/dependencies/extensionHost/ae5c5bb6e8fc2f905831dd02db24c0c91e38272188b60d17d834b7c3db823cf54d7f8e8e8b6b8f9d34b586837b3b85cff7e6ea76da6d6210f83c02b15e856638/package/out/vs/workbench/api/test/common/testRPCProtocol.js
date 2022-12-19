/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/base/common/async", "vs/workbench/services/extensions/common/rpcProtocol"], function (require, exports, proxyIdentifier_1, async_1, rpcProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestRPCProtocol = exports.SingleProxyRPCProtocol = void 0;
    function SingleProxyRPCProtocol(thing) {
        return {
            _serviceBrand: undefined,
            remoteAuthority: null,
            getProxy() {
                return thing;
            },
            set(identifier, value) {
                return value;
            },
            dispose: undefined,
            assertRegistered: undefined,
            drain: undefined,
            extensionHostKind: 1 /* ExtensionHostKind.LocalProcess */
        };
    }
    exports.SingleProxyRPCProtocol = SingleProxyRPCProtocol;
    class TestRPCProtocol {
        constructor() {
            this.remoteAuthority = null;
            this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
            this._callCountValue = 0;
            this._locals = Object.create(null);
            this._proxies = Object.create(null);
        }
        drain() {
            return Promise.resolve();
        }
        get _callCount() {
            return this._callCountValue;
        }
        set _callCount(value) {
            this._callCountValue = value;
            if (this._callCountValue === 0) {
                if (this._completeIdle) {
                    this._completeIdle();
                }
                this._idle = undefined;
            }
        }
        sync() {
            return new Promise((c) => {
                setTimeout(c, 0);
            }).then(() => {
                if (this._callCount === 0) {
                    return undefined;
                }
                if (!this._idle) {
                    this._idle = new Promise((c, e) => {
                        this._completeIdle = c;
                    });
                }
                return this._idle;
            });
        }
        getProxy(identifier) {
            if (!this._proxies[identifier.sid]) {
                this._proxies[identifier.sid] = this._createProxy(identifier.sid);
            }
            return this._proxies[identifier.sid];
        }
        _createProxy(proxyId) {
            let handler = {
                get: (target, name) => {
                    if (typeof name === 'string' && !target[name] && name.charCodeAt(0) === 36 /* CharCode.DollarSign */) {
                        target[name] = (...myArgs) => {
                            return this._remoteCall(proxyId, name, myArgs);
                        };
                    }
                    return target[name];
                }
            };
            return new Proxy(Object.create(null), handler);
        }
        set(identifier, value) {
            this._locals[identifier.sid] = value;
            return value;
        }
        _remoteCall(proxyId, path, args) {
            this._callCount++;
            return new Promise((c) => {
                setTimeout(c, 0);
            }).then(() => {
                const instance = this._locals[proxyId];
                // pretend the args went over the wire... (invoke .toJSON on objects...)
                const wireArgs = simulateWireTransfer(args);
                let p;
                try {
                    let result = instance[path].apply(instance, wireArgs);
                    p = (0, async_1.isThenable)(result) ? result : Promise.resolve(result);
                }
                catch (err) {
                    p = Promise.reject(err);
                }
                return p.then(result => {
                    this._callCount--;
                    // pretend the result went over the wire... (invoke .toJSON on objects...)
                    const wireResult = simulateWireTransfer(result);
                    return wireResult;
                }, err => {
                    this._callCount--;
                    return Promise.reject(err);
                });
            });
        }
        dispose() {
            throw new Error('Not implemented!');
        }
        assertRegistered(identifiers) {
            throw new Error('Not implemented!');
        }
    }
    exports.TestRPCProtocol = TestRPCProtocol;
    function simulateWireTransfer(obj) {
        if (!obj) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(simulateWireTransfer);
        }
        if (obj instanceof proxyIdentifier_1.SerializableObjectWithBuffers) {
            const { jsonString, referencedBuffers } = (0, rpcProtocol_1.stringifyJsonWithBufferRefs)(obj);
            return (0, rpcProtocol_1.parseJsonAndRestoreBufferRefs)(jsonString, referencedBuffers, null);
        }
        else {
            return JSON.parse(JSON.stringify(obj));
        }
    }
});
//# sourceMappingURL=testRPCProtocol.js.map