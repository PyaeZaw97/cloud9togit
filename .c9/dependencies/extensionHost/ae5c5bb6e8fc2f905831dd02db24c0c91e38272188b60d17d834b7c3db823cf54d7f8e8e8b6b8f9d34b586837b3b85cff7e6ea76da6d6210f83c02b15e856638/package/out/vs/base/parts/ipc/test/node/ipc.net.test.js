/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "events", "net", "os", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc.net", "vs/base/parts/ipc/node/ipc.net", "vs/base/test/common/testUtils", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, events_1, net_1, os_1, async_1, buffer_1, event_1, lifecycle_1, ipc_net_1, ipc_net_2, testUtils_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MessageStream extends lifecycle_1.Disposable {
        constructor(x) {
            super();
            this._currentComplete = null;
            this._messages = [];
            this._register(x.onMessage(data => {
                this._messages.push(data);
                this._trigger();
            }));
        }
        _trigger() {
            if (!this._currentComplete) {
                return;
            }
            if (this._messages.length === 0) {
                return;
            }
            const complete = this._currentComplete;
            const msg = this._messages.shift();
            this._currentComplete = null;
            complete(msg);
        }
        waitForOne() {
            return new Promise((complete) => {
                this._currentComplete = complete;
                this._trigger();
            });
        }
    }
    class EtherStream extends events_1.EventEmitter {
        constructor(_ether, _name) {
            super();
            this._ether = _ether;
            this._name = _name;
        }
        write(data, cb) {
            if (!Buffer.isBuffer(data)) {
                throw new Error(`Invalid data`);
            }
            this._ether.write(this._name, data);
            return true;
        }
        destroy() {
        }
    }
    class Ether {
        constructor(_wireLatency = 0) {
            this._wireLatency = _wireLatency;
            this._a = new EtherStream(this, 'a');
            this._b = new EtherStream(this, 'b');
            this._ab = [];
            this._ba = [];
        }
        get a() {
            return this._a;
        }
        get b() {
            return this._b;
        }
        write(from, data) {
            setTimeout(() => {
                if (from === 'a') {
                    this._ab.push(data);
                }
                else {
                    this._ba.push(data);
                }
                setTimeout(() => this._deliver(), 0);
            }, this._wireLatency);
        }
        _deliver() {
            if (this._ab.length > 0) {
                const data = Buffer.concat(this._ab);
                this._ab.length = 0;
                this._b.emit('data', data);
                setTimeout(() => this._deliver(), 0);
                return;
            }
            if (this._ba.length > 0) {
                const data = Buffer.concat(this._ba);
                this._ba.length = 0;
                this._a.emit('data', data);
                setTimeout(() => this._deliver(), 0);
                return;
            }
        }
    }
    suite('IPC, Socket Protocol', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let ether;
        setup(() => {
            ether = new Ether();
        });
        test('read/write', async () => {
            const a = new ipc_net_1.Protocol(new ipc_net_2.NodeSocket(ether.a));
            const b = new ipc_net_1.Protocol(new ipc_net_2.NodeSocket(ether.b));
            const bMessages = new MessageStream(b);
            a.send(buffer_1.VSBuffer.fromString('foobarfarboo'));
            const msg1 = await bMessages.waitForOne();
            assert.strictEqual(msg1.toString(), 'foobarfarboo');
            const buffer = buffer_1.VSBuffer.alloc(1);
            buffer.writeUInt8(123, 0);
            a.send(buffer);
            const msg2 = await bMessages.waitForOne();
            assert.strictEqual(msg2.readUInt8(0), 123);
            bMessages.dispose();
            a.dispose();
            b.dispose();
        });
        test('read/write, object data', async () => {
            const a = new ipc_net_1.Protocol(new ipc_net_2.NodeSocket(ether.a));
            const b = new ipc_net_1.Protocol(new ipc_net_2.NodeSocket(ether.b));
            const bMessages = new MessageStream(b);
            const data = {
                pi: Math.PI,
                foo: 'bar',
                more: true,
                data: 'Hello World'.split('')
            };
            a.send(buffer_1.VSBuffer.fromString(JSON.stringify(data)));
            const msg = await bMessages.waitForOne();
            assert.deepStrictEqual(JSON.parse(msg.toString()), data);
            bMessages.dispose();
            a.dispose();
            b.dispose();
        });
    });
    suite('PersistentProtocol reconnection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('acks get piggybacked with messages', async () => {
            const ether = new Ether();
            const a = new ipc_net_1.PersistentProtocol(new ipc_net_2.NodeSocket(ether.a));
            const aMessages = new MessageStream(a);
            const b = new ipc_net_1.PersistentProtocol(new ipc_net_2.NodeSocket(ether.b));
            const bMessages = new MessageStream(b);
            a.send(buffer_1.VSBuffer.fromString('a1'));
            assert.strictEqual(a.unacknowledgedCount, 1);
            assert.strictEqual(b.unacknowledgedCount, 0);
            a.send(buffer_1.VSBuffer.fromString('a2'));
            assert.strictEqual(a.unacknowledgedCount, 2);
            assert.strictEqual(b.unacknowledgedCount, 0);
            a.send(buffer_1.VSBuffer.fromString('a3'));
            assert.strictEqual(a.unacknowledgedCount, 3);
            assert.strictEqual(b.unacknowledgedCount, 0);
            const a1 = await bMessages.waitForOne();
            assert.strictEqual(a1.toString(), 'a1');
            assert.strictEqual(a.unacknowledgedCount, 3);
            assert.strictEqual(b.unacknowledgedCount, 0);
            const a2 = await bMessages.waitForOne();
            assert.strictEqual(a2.toString(), 'a2');
            assert.strictEqual(a.unacknowledgedCount, 3);
            assert.strictEqual(b.unacknowledgedCount, 0);
            const a3 = await bMessages.waitForOne();
            assert.strictEqual(a3.toString(), 'a3');
            assert.strictEqual(a.unacknowledgedCount, 3);
            assert.strictEqual(b.unacknowledgedCount, 0);
            b.send(buffer_1.VSBuffer.fromString('b1'));
            assert.strictEqual(a.unacknowledgedCount, 3);
            assert.strictEqual(b.unacknowledgedCount, 1);
            const b1 = await aMessages.waitForOne();
            assert.strictEqual(b1.toString(), 'b1');
            assert.strictEqual(a.unacknowledgedCount, 0);
            assert.strictEqual(b.unacknowledgedCount, 1);
            a.send(buffer_1.VSBuffer.fromString('a4'));
            assert.strictEqual(a.unacknowledgedCount, 1);
            assert.strictEqual(b.unacknowledgedCount, 1);
            const b2 = await bMessages.waitForOne();
            assert.strictEqual(b2.toString(), 'a4');
            assert.strictEqual(a.unacknowledgedCount, 1);
            assert.strictEqual(b.unacknowledgedCount, 0);
            aMessages.dispose();
            bMessages.dispose();
            a.dispose();
            b.dispose();
        });
        test('ack gets sent after a while', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true, maxTaskCount: 100 }, async () => {
                const loadEstimator = {
                    hasHighLoad: () => false
                };
                const ether = new Ether();
                const aSocket = new ipc_net_2.NodeSocket(ether.a);
                const a = new ipc_net_1.PersistentProtocol(aSocket, null, loadEstimator);
                const aMessages = new MessageStream(a);
                const bSocket = new ipc_net_2.NodeSocket(ether.b);
                const b = new ipc_net_1.PersistentProtocol(bSocket, null, loadEstimator);
                const bMessages = new MessageStream(b);
                // send one message A -> B
                a.send(buffer_1.VSBuffer.fromString('a1'));
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 0);
                const a1 = await bMessages.waitForOne();
                assert.strictEqual(a1.toString(), 'a1');
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 0);
                // wait for ack to arrive B -> A
                await (0, async_1.timeout)(2 * 2000 /* ProtocolConstants.AcknowledgeTime */);
                assert.strictEqual(a.unacknowledgedCount, 0);
                assert.strictEqual(b.unacknowledgedCount, 0);
                aMessages.dispose();
                bMessages.dispose();
                a.dispose();
                b.dispose();
            });
        });
        test('messages that are never written to a socket should not cause an ack timeout', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({
                useFakeTimers: true,
                useSetImmediate: true,
                maxTaskCount: 1000
            }, async () => {
                // Date.now() in fake timers starts at 0, which is very inconvenient
                // since we want to test exactly that a certain field is not initialized with Date.now()
                // As a workaround we wait such that Date.now() starts producing more realistic values
                await (0, async_1.timeout)(60 * 60 * 1000);
                const loadEstimator = {
                    hasHighLoad: () => false
                };
                const ether = new Ether();
                const aSocket = new ipc_net_2.NodeSocket(ether.a);
                const a = new ipc_net_1.PersistentProtocol(aSocket, null, loadEstimator);
                const aMessages = new MessageStream(a);
                const bSocket = new ipc_net_2.NodeSocket(ether.b);
                const b = new ipc_net_1.PersistentProtocol(bSocket, null, loadEstimator);
                const bMessages = new MessageStream(b);
                // send message a1 before reconnection to get _recvAckCheck() scheduled
                a.send(buffer_1.VSBuffer.fromString('a1'));
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 0);
                // read message a1 at B
                const a1 = await bMessages.waitForOne();
                assert.strictEqual(a1.toString(), 'a1');
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 0);
                // send message b1 to send the ack for a1
                b.send(buffer_1.VSBuffer.fromString('b1'));
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 1);
                // read message b1 at A to receive the ack for a1
                const b1 = await aMessages.waitForOne();
                assert.strictEqual(b1.toString(), 'b1');
                assert.strictEqual(a.unacknowledgedCount, 0);
                assert.strictEqual(b.unacknowledgedCount, 1);
                // begin reconnection
                aSocket.dispose();
                const aSocket2 = new ipc_net_2.NodeSocket(ether.a);
                a.beginAcceptReconnection(aSocket2, null);
                let timeoutListenerCalled = false;
                const socketTimeoutListener = a.onSocketTimeout(() => {
                    timeoutListenerCalled = true;
                });
                // send message 2 during reconnection
                a.send(buffer_1.VSBuffer.fromString('a2'));
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 1);
                // wait for scheduled _recvAckCheck() to execute
                await (0, async_1.timeout)(2 * 20000 /* ProtocolConstants.TimeoutTime */);
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 1);
                assert.strictEqual(timeoutListenerCalled, false);
                a.endAcceptReconnection();
                assert.strictEqual(timeoutListenerCalled, false);
                await (0, async_1.timeout)(2 * 20000 /* ProtocolConstants.TimeoutTime */);
                assert.strictEqual(a.unacknowledgedCount, 0);
                assert.strictEqual(b.unacknowledgedCount, 0);
                assert.strictEqual(timeoutListenerCalled, false);
                socketTimeoutListener.dispose();
                aMessages.dispose();
                bMessages.dispose();
                a.dispose();
                b.dispose();
            });
        });
        test('acks are always sent after a reconnection', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({
                useFakeTimers: true,
                useSetImmediate: true,
                maxTaskCount: 1000
            }, async () => {
                const loadEstimator = {
                    hasHighLoad: () => false
                };
                const wireLatency = 1000;
                const ether = new Ether(wireLatency);
                const aSocket = new ipc_net_2.NodeSocket(ether.a);
                const a = new ipc_net_1.PersistentProtocol(aSocket, null, loadEstimator);
                const aMessages = new MessageStream(a);
                const bSocket = new ipc_net_2.NodeSocket(ether.b);
                const b = new ipc_net_1.PersistentProtocol(bSocket, null, loadEstimator);
                const bMessages = new MessageStream(b);
                // send message a1 to have something unacknowledged
                a.send(buffer_1.VSBuffer.fromString('a1'));
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 0);
                // read message a1 at B
                const a1 = await bMessages.waitForOne();
                assert.strictEqual(a1.toString(), 'a1');
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 0);
                // wait for B to send an ACK message,
                // but resume before A receives it
                await (0, async_1.timeout)(2000 /* ProtocolConstants.AcknowledgeTime */ + wireLatency / 2);
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 0);
                // simulate complete reconnection
                aSocket.dispose();
                bSocket.dispose();
                const ether2 = new Ether(wireLatency);
                const aSocket2 = new ipc_net_2.NodeSocket(ether2.a);
                const bSocket2 = new ipc_net_2.NodeSocket(ether2.b);
                b.beginAcceptReconnection(bSocket2, null);
                b.endAcceptReconnection();
                a.beginAcceptReconnection(aSocket2, null);
                a.endAcceptReconnection();
                // wait for quite some time
                await (0, async_1.timeout)(2 * 2000 /* ProtocolConstants.AcknowledgeTime */ + wireLatency);
                assert.strictEqual(a.unacknowledgedCount, 0);
                assert.strictEqual(b.unacknowledgedCount, 0);
                aMessages.dispose();
                bMessages.dispose();
                a.dispose();
                b.dispose();
            });
        });
        test('onSocketTimeout is emitted at most once every 20s', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({
                useFakeTimers: true,
                useSetImmediate: true,
                maxTaskCount: 1000
            }, async () => {
                const loadEstimator = {
                    hasHighLoad: () => false
                };
                const ether = new Ether();
                const aSocket = new ipc_net_2.NodeSocket(ether.a);
                const a = new ipc_net_1.PersistentProtocol(aSocket, null, loadEstimator);
                const aMessages = new MessageStream(a);
                const bSocket = new ipc_net_2.NodeSocket(ether.b);
                const b = new ipc_net_1.PersistentProtocol(bSocket, null, loadEstimator);
                const bMessages = new MessageStream(b);
                // never receive acks
                b.pauseSocketWriting();
                // send message a1 to have something unacknowledged
                a.send(buffer_1.VSBuffer.fromString('a1'));
                // wait for the first timeout to fire
                await event_1.Event.toPromise(a.onSocketTimeout);
                let timeoutFiredAgain = false;
                const timeoutListener = a.onSocketTimeout(() => {
                    timeoutFiredAgain = true;
                });
                // send more messages
                a.send(buffer_1.VSBuffer.fromString('a2'));
                a.send(buffer_1.VSBuffer.fromString('a3'));
                // wait for 10s
                await (0, async_1.timeout)(20000 /* ProtocolConstants.TimeoutTime */ / 2);
                assert.strictEqual(timeoutFiredAgain, false);
                timeoutListener.dispose();
                aMessages.dispose();
                bMessages.dispose();
                a.dispose();
                b.dispose();
            });
        });
        test('writing can be paused', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true, maxTaskCount: 100 }, async () => {
                const loadEstimator = {
                    hasHighLoad: () => false
                };
                const ether = new Ether();
                const aSocket = new ipc_net_2.NodeSocket(ether.a);
                const a = new ipc_net_1.PersistentProtocol(aSocket, null, loadEstimator);
                const aMessages = new MessageStream(a);
                const bSocket = new ipc_net_2.NodeSocket(ether.b);
                const b = new ipc_net_1.PersistentProtocol(bSocket, null, loadEstimator);
                const bMessages = new MessageStream(b);
                // send one message A -> B
                a.send(buffer_1.VSBuffer.fromString('a1'));
                const a1 = await bMessages.waitForOne();
                assert.strictEqual(a1.toString(), 'a1');
                // ask A to pause writing
                b.sendPause();
                // send a message B -> A
                b.send(buffer_1.VSBuffer.fromString('b1'));
                const b1 = await aMessages.waitForOne();
                assert.strictEqual(b1.toString(), 'b1');
                // send a message A -> B (this should be blocked at A)
                a.send(buffer_1.VSBuffer.fromString('a2'));
                // wait a long time and check that not even acks are written
                await (0, async_1.timeout)(2 * 2000 /* ProtocolConstants.AcknowledgeTime */);
                assert.strictEqual(a.unacknowledgedCount, 1);
                assert.strictEqual(b.unacknowledgedCount, 1);
                // ask A to resume writing
                b.sendResume();
                // check that B receives message
                const a2 = await bMessages.waitForOne();
                assert.strictEqual(a2.toString(), 'a2');
                // wait a long time and check that acks are written
                await (0, async_1.timeout)(2 * 2000 /* ProtocolConstants.AcknowledgeTime */);
                assert.strictEqual(a.unacknowledgedCount, 0);
                assert.strictEqual(b.unacknowledgedCount, 0);
                aMessages.dispose();
                bMessages.dispose();
                a.dispose();
                b.dispose();
            });
        });
    });
    (0, testUtils_1.flakySuite)('IPC, create handle', () => {
        test('createRandomIPCHandle', async () => {
            return testIPCHandle((0, ipc_net_2.createRandomIPCHandle)());
        });
        test('createStaticIPCHandle', async () => {
            return testIPCHandle((0, ipc_net_2.createStaticIPCHandle)((0, os_1.tmpdir)(), 'test', '1.64.0'));
        });
        function testIPCHandle(handle) {
            return new Promise((resolve, reject) => {
                const pipeName = (0, ipc_net_2.createRandomIPCHandle)();
                const server = (0, net_1.createServer)();
                server.on('error', () => {
                    return new Promise(() => server.close(() => reject()));
                });
                server.listen(pipeName, () => {
                    server.removeListener('error', reject);
                    return new Promise(() => {
                        server.close(() => resolve());
                    });
                });
            });
        }
    });
    suite('WebSocketNodeSocket', () => {
        function toUint8Array(data) {
            const result = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                result[i] = data[i];
            }
            return result;
        }
        function fromUint8Array(data) {
            const result = [];
            for (let i = 0; i < data.length; i++) {
                result[i] = data[i];
            }
            return result;
        }
        function fromCharCodeArray(data) {
            let result = '';
            for (let i = 0; i < data.length; i++) {
                result += String.fromCharCode(data[i]);
            }
            return result;
        }
        class FakeNodeSocket extends lifecycle_1.Disposable {
            constructor() {
                super();
                this._onData = new event_1.Emitter();
                this.onData = this._onData.event;
                this._onClose = new event_1.Emitter();
                this.onClose = this._onClose.event;
            }
            traceSocketEvent(type, data) {
            }
            fireData(data) {
                this._onData.fire(buffer_1.VSBuffer.wrap(toUint8Array(data)));
            }
        }
        async function testReading(frames, permessageDeflate) {
            const disposables = new lifecycle_1.DisposableStore();
            const socket = new FakeNodeSocket();
            const webSocket = disposables.add(new ipc_net_2.WebSocketNodeSocket(socket, permessageDeflate, null, false));
            const barrier = new async_1.Barrier();
            let remainingFrameCount = frames.length;
            let receivedData = '';
            disposables.add(webSocket.onData((buff) => {
                receivedData += fromCharCodeArray(fromUint8Array(buff.buffer));
                remainingFrameCount--;
                if (remainingFrameCount === 0) {
                    barrier.open();
                }
            }));
            for (let i = 0; i < frames.length; i++) {
                socket.fireData(frames[i]);
            }
            await barrier.wait();
            disposables.dispose();
            return receivedData;
        }
        test('A single-frame unmasked text message', async () => {
            const frames = [
                [0x81, 0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f] // contains "Hello"
            ];
            const actual = await testReading(frames, false);
            assert.deepStrictEqual(actual, 'Hello');
        });
        test('A single-frame masked text message', async () => {
            const frames = [
                [0x81, 0x85, 0x37, 0xfa, 0x21, 0x3d, 0x7f, 0x9f, 0x4d, 0x51, 0x58] // contains "Hello"
            ];
            const actual = await testReading(frames, false);
            assert.deepStrictEqual(actual, 'Hello');
        });
        test('A fragmented unmasked text message', async () => {
            // contains "Hello"
            const frames = [
                [0x01, 0x03, 0x48, 0x65, 0x6c],
                [0x80, 0x02, 0x6c, 0x6f], // contains "lo"
            ];
            const actual = await testReading(frames, false);
            assert.deepStrictEqual(actual, 'Hello');
        });
        suite('compression', () => {
            test('A single-frame compressed text message', async () => {
                // contains "Hello"
                const frames = [
                    [0xc1, 0x07, 0xf2, 0x48, 0xcd, 0xc9, 0xc9, 0x07, 0x00], // contains "Hello"
                ];
                const actual = await testReading(frames, true);
                assert.deepStrictEqual(actual, 'Hello');
            });
            test('A fragmented compressed text message', async () => {
                // contains "Hello"
                const frames = [
                    [0x41, 0x03, 0xf2, 0x48, 0xcd],
                    [0x80, 0x04, 0xc9, 0xc9, 0x07, 0x00]
                ];
                const actual = await testReading(frames, true);
                assert.deepStrictEqual(actual, 'Hello');
            });
            test('A single-frame non-compressed text message', async () => {
                const frames = [
                    [0x81, 0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f] // contains "Hello"
                ];
                const actual = await testReading(frames, true);
                assert.deepStrictEqual(actual, 'Hello');
            });
            test('A single-frame compressed text message followed by a single-frame non-compressed text message', async () => {
                const frames = [
                    [0xc1, 0x07, 0xf2, 0x48, 0xcd, 0xc9, 0xc9, 0x07, 0x00],
                    [0x81, 0x05, 0x77, 0x6f, 0x72, 0x6c, 0x64] // contains "world"
                ];
                const actual = await testReading(frames, true);
                assert.deepStrictEqual(actual, 'Helloworld');
            });
        });
    });
});
//# sourceMappingURL=ipc.net.test.js.map