/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/event", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/workbench/services/extensions/common/rpcProtocol", "vs/base/common/buffer"], function (require, exports, assert, cancellation_1, event_1, proxyIdentifier_1, rpcProtocol_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RPCProtocol', () => {
        class MessagePassingProtocol {
            constructor() {
                this._onMessage = new event_1.Emitter();
                this.onMessage = this._onMessage.event;
            }
            setPair(other) {
                this._pair = other;
            }
            send(buffer) {
                Promise.resolve().then(() => {
                    this._pair._onMessage.fire(buffer);
                });
            }
        }
        let delegate;
        let bProxy;
        class BClass {
            $m(a1, a2) {
                return Promise.resolve(delegate.call(null, a1, a2));
            }
        }
        setup(() => {
            let a_protocol = new MessagePassingProtocol();
            let b_protocol = new MessagePassingProtocol();
            a_protocol.setPair(b_protocol);
            b_protocol.setPair(a_protocol);
            let A = new rpcProtocol_1.RPCProtocol(a_protocol);
            let B = new rpcProtocol_1.RPCProtocol(b_protocol);
            const bIdentifier = new proxyIdentifier_1.ProxyIdentifier('bb');
            const bInstance = new BClass();
            B.set(bIdentifier, bInstance);
            bProxy = A.getProxy(bIdentifier);
        });
        test('simple call', function (done) {
            delegate = (a1, a2) => a1 + a2;
            bProxy.$m(4, 1).then((res) => {
                assert.strictEqual(res, 5);
                done(null);
            }, done);
        });
        test('simple call without result', function (done) {
            delegate = (a1, a2) => { };
            bProxy.$m(4, 1).then((res) => {
                assert.strictEqual(res, undefined);
                done(null);
            }, done);
        });
        test('passing buffer as argument', function (done) {
            delegate = (a1, a2) => {
                assert.ok(a1 instanceof buffer_1.VSBuffer);
                return a1.buffer[a2];
            };
            let b = buffer_1.VSBuffer.alloc(4);
            b.buffer[0] = 1;
            b.buffer[1] = 2;
            b.buffer[2] = 3;
            b.buffer[3] = 4;
            bProxy.$m(b, 2).then((res) => {
                assert.strictEqual(res, 3);
                done(null);
            }, done);
        });
        test('returning a buffer', function (done) {
            delegate = (a1, a2) => {
                let b = buffer_1.VSBuffer.alloc(4);
                b.buffer[0] = 1;
                b.buffer[1] = 2;
                b.buffer[2] = 3;
                b.buffer[3] = 4;
                return b;
            };
            bProxy.$m(4, 1).then((res) => {
                assert.ok(res instanceof buffer_1.VSBuffer);
                assert.strictEqual(res.buffer[0], 1);
                assert.strictEqual(res.buffer[1], 2);
                assert.strictEqual(res.buffer[2], 3);
                assert.strictEqual(res.buffer[3], 4);
                done(null);
            }, done);
        });
        test('cancelling a call via CancellationToken before', function (done) {
            delegate = (a1, a2) => a1 + a2;
            let p = bProxy.$m(4, cancellation_1.CancellationToken.Cancelled);
            p.then((res) => {
                assert.fail('should not receive result');
            }, (err) => {
                assert.ok(true);
                done(null);
            });
        });
        test('passing CancellationToken.None', function (done) {
            delegate = (a1, token) => {
                assert.ok(!!token);
                return a1 + 1;
            };
            bProxy.$m(4, cancellation_1.CancellationToken.None).then((res) => {
                assert.strictEqual(res, 5);
                done(null);
            }, done);
        });
        test('cancelling a call via CancellationToken quickly', function (done) {
            // this is an implementation which, when cancellation is triggered, will return 7
            delegate = (a1, token) => {
                return new Promise((resolve, reject) => {
                    token.onCancellationRequested((e) => {
                        resolve(7);
                    });
                });
            };
            let tokenSource = new cancellation_1.CancellationTokenSource();
            let p = bProxy.$m(4, tokenSource.token);
            p.then((res) => {
                assert.strictEqual(res, 7);
            }, (err) => {
                assert.fail('should not receive error');
            }).finally(done);
            tokenSource.cancel();
        });
        test('throwing an error', function (done) {
            delegate = (a1, a2) => {
                throw new Error(`nope`);
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
            }, (err) => {
                assert.strictEqual(err.message, 'nope');
            }).finally(done);
        });
        test('error promise', function (done) {
            delegate = (a1, a2) => {
                return Promise.reject(undefined);
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
            }, (err) => {
                assert.strictEqual(err, undefined);
            }).finally(done);
        });
        test('issue #60450: Converting circular structure to JSON', function (done) {
            delegate = (a1, a2) => {
                let circular = {};
                circular.self = circular;
                return circular;
            };
            bProxy.$m(4, 1).then((res) => {
                assert.strictEqual(res, null);
            }, (err) => {
                assert.fail('unexpected');
            }).finally(done);
        });
        test('issue #72798: null errors are hard to digest', function (done) {
            delegate = (a1, a2) => {
                // eslint-disable-next-line no-throw-literal
                throw { 'what': 'what' };
            };
            bProxy.$m(4, 1).then((res) => {
                assert.fail('unexpected');
            }, (err) => {
                assert.strictEqual(err.what, 'what');
            }).finally(done);
        });
        test('undefined arguments arrive as null', function () {
            delegate = (a1, a2) => {
                assert.strictEqual(typeof a1, 'undefined');
                assert.strictEqual(a2, null);
                return 7;
            };
            return bProxy.$m(undefined, null).then((res) => {
                assert.strictEqual(res, 7);
            });
        });
        test('issue #81424: SerializeRequest should throw if an argument can not be serialized', () => {
            let badObject = {};
            badObject.loop = badObject;
            assert.throws(() => {
                bProxy.$m(badObject, '2');
            });
        });
        test('SerializableObjectWithBuffers is correctly transfered', function (done) {
            delegate = (a1, a2) => {
                return new proxyIdentifier_1.SerializableObjectWithBuffers({ string: a1.value.string + ' world', buff: a1.value.buff });
            };
            const b = buffer_1.VSBuffer.alloc(4);
            b.buffer[0] = 1;
            b.buffer[1] = 2;
            b.buffer[2] = 3;
            b.buffer[3] = 4;
            bProxy.$m(new proxyIdentifier_1.SerializableObjectWithBuffers({ string: 'hello', buff: b }), undefined).then((res) => {
                assert.ok(res instanceof proxyIdentifier_1.SerializableObjectWithBuffers);
                assert.strictEqual(res.value.string, 'hello world');
                assert.ok(res.value.buff instanceof buffer_1.VSBuffer);
                const bufferValues = Array.from(res.value.buff.buffer);
                assert.strictEqual(bufferValues[0], 1);
                assert.strictEqual(bufferValues[1], 2);
                assert.strictEqual(bufferValues[2], 3);
                assert.strictEqual(bufferValues[3], 4);
                done(null);
            }, done);
        });
    });
});
//# sourceMappingURL=rpcProtocol.test.js.map