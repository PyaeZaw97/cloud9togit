/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc"], function (require, exports, buffer_1, event_1, lifecycle_1, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PersistentProtocol = exports.BufferedEmitter = exports.Client = exports.Protocol = exports.ProtocolConstants = exports.ChunkStream = exports.SocketCloseEventType = exports.SocketDiagnostics = exports.SocketDiagnosticsEventType = void 0;
    var SocketDiagnosticsEventType;
    (function (SocketDiagnosticsEventType) {
        SocketDiagnosticsEventType["Created"] = "created";
        SocketDiagnosticsEventType["Read"] = "read";
        SocketDiagnosticsEventType["Write"] = "write";
        SocketDiagnosticsEventType["Open"] = "open";
        SocketDiagnosticsEventType["Error"] = "error";
        SocketDiagnosticsEventType["Close"] = "close";
        SocketDiagnosticsEventType["BrowserWebSocketBlobReceived"] = "browserWebSocketBlobReceived";
        SocketDiagnosticsEventType["NodeEndReceived"] = "nodeEndReceived";
        SocketDiagnosticsEventType["NodeEndSent"] = "nodeEndSent";
        SocketDiagnosticsEventType["NodeDrainBegin"] = "nodeDrainBegin";
        SocketDiagnosticsEventType["NodeDrainEnd"] = "nodeDrainEnd";
        SocketDiagnosticsEventType["zlibInflateError"] = "zlibInflateError";
        SocketDiagnosticsEventType["zlibInflateData"] = "zlibInflateData";
        SocketDiagnosticsEventType["zlibInflateInitialWrite"] = "zlibInflateInitialWrite";
        SocketDiagnosticsEventType["zlibInflateInitialFlushFired"] = "zlibInflateInitialFlushFired";
        SocketDiagnosticsEventType["zlibInflateWrite"] = "zlibInflateWrite";
        SocketDiagnosticsEventType["zlibInflateFlushFired"] = "zlibInflateFlushFired";
        SocketDiagnosticsEventType["zlibDeflateError"] = "zlibDeflateError";
        SocketDiagnosticsEventType["zlibDeflateData"] = "zlibDeflateData";
        SocketDiagnosticsEventType["zlibDeflateWrite"] = "zlibDeflateWrite";
        SocketDiagnosticsEventType["zlibDeflateFlushFired"] = "zlibDeflateFlushFired";
        SocketDiagnosticsEventType["WebSocketNodeSocketWrite"] = "webSocketNodeSocketWrite";
        SocketDiagnosticsEventType["WebSocketNodeSocketPeekedHeader"] = "webSocketNodeSocketPeekedHeader";
        SocketDiagnosticsEventType["WebSocketNodeSocketReadHeader"] = "webSocketNodeSocketReadHeader";
        SocketDiagnosticsEventType["WebSocketNodeSocketReadData"] = "webSocketNodeSocketReadData";
        SocketDiagnosticsEventType["WebSocketNodeSocketUnmaskedData"] = "webSocketNodeSocketUnmaskedData";
        SocketDiagnosticsEventType["WebSocketNodeSocketDrainBegin"] = "webSocketNodeSocketDrainBegin";
        SocketDiagnosticsEventType["WebSocketNodeSocketDrainEnd"] = "webSocketNodeSocketDrainEnd";
        SocketDiagnosticsEventType["ProtocolHeaderRead"] = "protocolHeaderRead";
        SocketDiagnosticsEventType["ProtocolMessageRead"] = "protocolMessageRead";
        SocketDiagnosticsEventType["ProtocolHeaderWrite"] = "protocolHeaderWrite";
        SocketDiagnosticsEventType["ProtocolMessageWrite"] = "protocolMessageWrite";
        SocketDiagnosticsEventType["ProtocolWrite"] = "protocolWrite";
    })(SocketDiagnosticsEventType = exports.SocketDiagnosticsEventType || (exports.SocketDiagnosticsEventType = {}));
    var SocketDiagnostics;
    (function (SocketDiagnostics) {
        SocketDiagnostics.enableDiagnostics = false;
        SocketDiagnostics.records = [];
        const socketIds = new WeakMap();
        let lastUsedSocketId = 0;
        function getSocketId(nativeObject, label) {
            if (!socketIds.has(nativeObject)) {
                const id = String(++lastUsedSocketId);
                socketIds.set(nativeObject, id);
            }
            return socketIds.get(nativeObject);
        }
        function traceSocketEvent(nativeObject, socketDebugLabel, type, data) {
            if (!SocketDiagnostics.enableDiagnostics) {
                return;
            }
            const id = getSocketId(nativeObject, socketDebugLabel);
            if (data instanceof buffer_1.VSBuffer || data instanceof Uint8Array || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
                const copiedData = buffer_1.VSBuffer.alloc(data.byteLength);
                copiedData.set(data);
                SocketDiagnostics.records.push({ timestamp: Date.now(), id, label: socketDebugLabel, type, buff: copiedData });
            }
            else {
                // data is a custom object
                SocketDiagnostics.records.push({ timestamp: Date.now(), id, label: socketDebugLabel, type, data: data });
            }
        }
        SocketDiagnostics.traceSocketEvent = traceSocketEvent;
    })(SocketDiagnostics = exports.SocketDiagnostics || (exports.SocketDiagnostics = {}));
    var SocketCloseEventType;
    (function (SocketCloseEventType) {
        SocketCloseEventType[SocketCloseEventType["NodeSocketCloseEvent"] = 0] = "NodeSocketCloseEvent";
        SocketCloseEventType[SocketCloseEventType["WebSocketCloseEvent"] = 1] = "WebSocketCloseEvent";
    })(SocketCloseEventType = exports.SocketCloseEventType || (exports.SocketCloseEventType = {}));
    let emptyBuffer = null;
    function getEmptyBuffer() {
        if (!emptyBuffer) {
            emptyBuffer = buffer_1.VSBuffer.alloc(0);
        }
        return emptyBuffer;
    }
    class ChunkStream {
        constructor() {
            this._chunks = [];
            this._totalLength = 0;
        }
        get byteLength() {
            return this._totalLength;
        }
        acceptChunk(buff) {
            this._chunks.push(buff);
            this._totalLength += buff.byteLength;
        }
        read(byteCount) {
            return this._read(byteCount, true);
        }
        peek(byteCount) {
            return this._read(byteCount, false);
        }
        _read(byteCount, advance) {
            if (byteCount === 0) {
                return getEmptyBuffer();
            }
            if (byteCount > this._totalLength) {
                throw new Error(`Cannot read so many bytes!`);
            }
            if (this._chunks[0].byteLength === byteCount) {
                // super fast path, precisely first chunk must be returned
                const result = this._chunks[0];
                if (advance) {
                    this._chunks.shift();
                    this._totalLength -= byteCount;
                }
                return result;
            }
            if (this._chunks[0].byteLength > byteCount) {
                // fast path, the reading is entirely within the first chunk
                const result = this._chunks[0].slice(0, byteCount);
                if (advance) {
                    this._chunks[0] = this._chunks[0].slice(byteCount);
                    this._totalLength -= byteCount;
                }
                return result;
            }
            let result = buffer_1.VSBuffer.alloc(byteCount);
            let resultOffset = 0;
            let chunkIndex = 0;
            while (byteCount > 0) {
                const chunk = this._chunks[chunkIndex];
                if (chunk.byteLength > byteCount) {
                    // this chunk will survive
                    const chunkPart = chunk.slice(0, byteCount);
                    result.set(chunkPart, resultOffset);
                    resultOffset += byteCount;
                    if (advance) {
                        this._chunks[chunkIndex] = chunk.slice(byteCount);
                        this._totalLength -= byteCount;
                    }
                    byteCount -= byteCount;
                }
                else {
                    // this chunk will be entirely read
                    result.set(chunk, resultOffset);
                    resultOffset += chunk.byteLength;
                    if (advance) {
                        this._chunks.shift();
                        this._totalLength -= chunk.byteLength;
                    }
                    else {
                        chunkIndex++;
                    }
                    byteCount -= chunk.byteLength;
                }
            }
            return result;
        }
    }
    exports.ChunkStream = ChunkStream;
    var ProtocolMessageType;
    (function (ProtocolMessageType) {
        ProtocolMessageType[ProtocolMessageType["None"] = 0] = "None";
        ProtocolMessageType[ProtocolMessageType["Regular"] = 1] = "Regular";
        ProtocolMessageType[ProtocolMessageType["Control"] = 2] = "Control";
        ProtocolMessageType[ProtocolMessageType["Ack"] = 3] = "Ack";
        ProtocolMessageType[ProtocolMessageType["Disconnect"] = 5] = "Disconnect";
        ProtocolMessageType[ProtocolMessageType["ReplayRequest"] = 6] = "ReplayRequest";
        ProtocolMessageType[ProtocolMessageType["Pause"] = 7] = "Pause";
        ProtocolMessageType[ProtocolMessageType["Resume"] = 8] = "Resume";
    })(ProtocolMessageType || (ProtocolMessageType = {}));
    function protocolMessageTypeToString(messageType) {
        switch (messageType) {
            case 0 /* ProtocolMessageType.None */: return 'None';
            case 1 /* ProtocolMessageType.Regular */: return 'Regular';
            case 2 /* ProtocolMessageType.Control */: return 'Control';
            case 3 /* ProtocolMessageType.Ack */: return 'Ack';
            case 5 /* ProtocolMessageType.Disconnect */: return 'Disconnect';
            case 6 /* ProtocolMessageType.ReplayRequest */: return 'ReplayRequest';
            case 7 /* ProtocolMessageType.Pause */: return 'PauseWriting';
            case 8 /* ProtocolMessageType.Resume */: return 'ResumeWriting';
        }
    }
    var ProtocolConstants;
    (function (ProtocolConstants) {
        ProtocolConstants[ProtocolConstants["HeaderLength"] = 13] = "HeaderLength";
        /**
         * Send an Acknowledge message at most 2 seconds later...
         */
        ProtocolConstants[ProtocolConstants["AcknowledgeTime"] = 2000] = "AcknowledgeTime";
        /**
         * If there is a sent message that has been unacknowledged for 20 seconds,
         * and we didn't see any incoming server data in the past 20 seconds,
         * then consider the connection has timed out.
         */
        ProtocolConstants[ProtocolConstants["TimeoutTime"] = 20000] = "TimeoutTime";
        /**
         * If there is no reconnection within this time-frame, consider the connection permanently closed...
         */
        ProtocolConstants[ProtocolConstants["ReconnectionGraceTime"] = 10800000] = "ReconnectionGraceTime";
        /**
         * Maximal grace time between the first and the last reconnection...
         */
        ProtocolConstants[ProtocolConstants["ReconnectionShortGraceTime"] = 300000] = "ReconnectionShortGraceTime";
    })(ProtocolConstants = exports.ProtocolConstants || (exports.ProtocolConstants = {}));
    class ProtocolMessage {
        constructor(type, id, ack, data) {
            this.type = type;
            this.id = id;
            this.ack = ack;
            this.data = data;
            this.writtenTime = 0;
        }
        get size() {
            return this.data.byteLength;
        }
    }
    class ProtocolReader extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._state = {
                readHead: true,
                readLen: 13 /* ProtocolConstants.HeaderLength */,
                messageType: 0 /* ProtocolMessageType.None */,
                id: 0,
                ack: 0
            };
            this._socket = socket;
            this._isDisposed = false;
            this._incomingData = new ChunkStream();
            this._register(this._socket.onData(data => this.acceptChunk(data)));
            this.lastReadTime = Date.now();
        }
        acceptChunk(data) {
            if (!data || data.byteLength === 0) {
                return;
            }
            this.lastReadTime = Date.now();
            this._incomingData.acceptChunk(data);
            while (this._incomingData.byteLength >= this._state.readLen) {
                const buff = this._incomingData.read(this._state.readLen);
                if (this._state.readHead) {
                    // buff is the header
                    // save new state => next time will read the body
                    this._state.readHead = false;
                    this._state.readLen = buff.readUInt32BE(9);
                    this._state.messageType = buff.readUInt8(0);
                    this._state.id = buff.readUInt32BE(1);
                    this._state.ack = buff.readUInt32BE(5);
                    this._socket.traceSocketEvent("protocolHeaderRead" /* SocketDiagnosticsEventType.ProtocolHeaderRead */, { messageType: protocolMessageTypeToString(this._state.messageType), id: this._state.id, ack: this._state.ack, messageSize: this._state.readLen });
                }
                else {
                    // buff is the body
                    const messageType = this._state.messageType;
                    const id = this._state.id;
                    const ack = this._state.ack;
                    // save new state => next time will read the header
                    this._state.readHead = true;
                    this._state.readLen = 13 /* ProtocolConstants.HeaderLength */;
                    this._state.messageType = 0 /* ProtocolMessageType.None */;
                    this._state.id = 0;
                    this._state.ack = 0;
                    this._socket.traceSocketEvent("protocolMessageRead" /* SocketDiagnosticsEventType.ProtocolMessageRead */, buff);
                    this._onMessage.fire(new ProtocolMessage(messageType, id, ack, buff));
                    if (this._isDisposed) {
                        // check if an event listener lead to our disposal
                        break;
                    }
                }
            }
        }
        readEntireBuffer() {
            return this._incomingData.read(this._incomingData.byteLength);
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
    }
    class ProtocolWriter {
        constructor(socket) {
            this._writeNowTimeout = null;
            this._isDisposed = false;
            this._isPaused = false;
            this._socket = socket;
            this._data = [];
            this._totalLength = 0;
            this.lastWriteTime = 0;
        }
        dispose() {
            try {
                this.flush();
            }
            catch (err) {
                // ignore error, since the socket could be already closed
            }
            this._isDisposed = true;
        }
        drain() {
            this.flush();
            return this._socket.drain();
        }
        flush() {
            // flush
            this._writeNow();
        }
        pause() {
            this._isPaused = true;
        }
        resume() {
            this._isPaused = false;
            this._scheduleWriting();
        }
        write(msg) {
            if (this._isDisposed) {
                // ignore: there could be left-over promises which complete and then
                // decide to write a response, etc...
                return;
            }
            msg.writtenTime = Date.now();
            this.lastWriteTime = Date.now();
            const header = buffer_1.VSBuffer.alloc(13 /* ProtocolConstants.HeaderLength */);
            header.writeUInt8(msg.type, 0);
            header.writeUInt32BE(msg.id, 1);
            header.writeUInt32BE(msg.ack, 5);
            header.writeUInt32BE(msg.data.byteLength, 9);
            this._socket.traceSocketEvent("protocolHeaderWrite" /* SocketDiagnosticsEventType.ProtocolHeaderWrite */, { messageType: protocolMessageTypeToString(msg.type), id: msg.id, ack: msg.ack, messageSize: msg.data.byteLength });
            this._socket.traceSocketEvent("protocolMessageWrite" /* SocketDiagnosticsEventType.ProtocolMessageWrite */, msg.data);
            this._writeSoon(header, msg.data);
        }
        _bufferAdd(head, body) {
            const wasEmpty = this._totalLength === 0;
            this._data.push(head, body);
            this._totalLength += head.byteLength + body.byteLength;
            return wasEmpty;
        }
        _bufferTake() {
            const ret = buffer_1.VSBuffer.concat(this._data, this._totalLength);
            this._data.length = 0;
            this._totalLength = 0;
            return ret;
        }
        _writeSoon(header, data) {
            if (this._bufferAdd(header, data)) {
                this._scheduleWriting();
            }
        }
        _scheduleWriting() {
            if (this._writeNowTimeout) {
                return;
            }
            this._writeNowTimeout = setTimeout(() => {
                this._writeNowTimeout = null;
                this._writeNow();
            });
        }
        _writeNow() {
            if (this._totalLength === 0) {
                return;
            }
            if (this._isPaused) {
                return;
            }
            const data = this._bufferTake();
            this._socket.traceSocketEvent("protocolWrite" /* SocketDiagnosticsEventType.ProtocolWrite */, { byteLength: data.byteLength });
            this._socket.write(data);
        }
    }
    /**
     * A message has the following format:
     * ```
     *     /-------------------------------|------\
     *     |             HEADER            |      |
     *     |-------------------------------| DATA |
     *     | TYPE | ID | ACK | DATA_LENGTH |      |
     *     \-------------------------------|------/
     * ```
     * The header is 9 bytes and consists of:
     *  - TYPE is 1 byte (ProtocolMessageType) - the message type
     *  - ID is 4 bytes (u32be) - the message id (can be 0 to indicate to be ignored)
     *  - ACK is 4 bytes (u32be) - the acknowledged message id (can be 0 to indicate to be ignored)
     *  - DATA_LENGTH is 4 bytes (u32be) - the length in bytes of DATA
     *
     * Only Regular messages are counted, other messages are not counted, nor acknowledged.
     */
    class Protocol extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onMessage = new event_1.Emitter();
            this.onMessage = this._onMessage.event;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this._socket = socket;
            this._socketWriter = this._register(new ProtocolWriter(this._socket));
            this._socketReader = this._register(new ProtocolReader(this._socket));
            this._register(this._socketReader.onMessage((msg) => {
                if (msg.type === 1 /* ProtocolMessageType.Regular */) {
                    this._onMessage.fire(msg.data);
                }
            }));
            this._register(this._socket.onClose(() => this._onDidDispose.fire()));
        }
        drain() {
            return this._socketWriter.drain();
        }
        getSocket() {
            return this._socket;
        }
        sendDisconnect() {
            // Nothing to do...
        }
        send(buffer) {
            this._socketWriter.write(new ProtocolMessage(1 /* ProtocolMessageType.Regular */, 0, 0, buffer));
        }
    }
    exports.Protocol = Protocol;
    class Client extends ipc_1.IPCClient {
        constructor(protocol, id, ipcLogger = null) {
            super(protocol, id, ipcLogger);
            this.protocol = protocol;
        }
        static fromSocket(socket, id) {
            return new Client(new Protocol(socket), id);
        }
        get onDidDispose() { return this.protocol.onDidDispose; }
        dispose() {
            super.dispose();
            const socket = this.protocol.getSocket();
            this.protocol.sendDisconnect();
            this.protocol.dispose();
            socket.end();
        }
    }
    exports.Client = Client;
    /**
     * Will ensure no messages are lost if there are no event listeners.
     */
    class BufferedEmitter {
        constructor() {
            this._hasListeners = false;
            this._isDeliveringMessages = false;
            this._bufferedMessages = [];
            this._emitter = new event_1.Emitter({
                onFirstListenerAdd: () => {
                    this._hasListeners = true;
                    // it is important to deliver these messages after this call, but before
                    // other messages have a chance to be received (to guarantee in order delivery)
                    // that's why we're using here queueMicrotask and not other types of timeouts
                    queueMicrotask(() => this._deliverMessages());
                },
                onLastListenerRemove: () => {
                    this._hasListeners = false;
                }
            });
            this.event = this._emitter.event;
        }
        _deliverMessages() {
            if (this._isDeliveringMessages) {
                return;
            }
            this._isDeliveringMessages = true;
            while (this._hasListeners && this._bufferedMessages.length > 0) {
                this._emitter.fire(this._bufferedMessages.shift());
            }
            this._isDeliveringMessages = false;
        }
        fire(event) {
            if (this._hasListeners) {
                if (this._bufferedMessages.length > 0) {
                    this._bufferedMessages.push(event);
                }
                else {
                    this._emitter.fire(event);
                }
            }
            else {
                this._bufferedMessages.push(event);
            }
        }
        flushBuffer() {
            this._bufferedMessages = [];
        }
    }
    exports.BufferedEmitter = BufferedEmitter;
    class QueueElement {
        constructor(data) {
            this.data = data;
            this.next = null;
        }
    }
    class Queue {
        constructor() {
            this._first = null;
            this._last = null;
        }
        peek() {
            if (!this._first) {
                return null;
            }
            return this._first.data;
        }
        toArray() {
            let result = [], resultLen = 0;
            let it = this._first;
            while (it) {
                result[resultLen++] = it.data;
                it = it.next;
            }
            return result;
        }
        pop() {
            if (!this._first) {
                return;
            }
            if (this._first === this._last) {
                this._first = null;
                this._last = null;
                return;
            }
            this._first = this._first.next;
        }
        push(item) {
            const element = new QueueElement(item);
            if (!this._first) {
                this._first = element;
                this._last = element;
                return;
            }
            this._last.next = element;
            this._last = element;
        }
    }
    class LoadEstimator {
        constructor() {
            this.lastRuns = [];
            const now = Date.now();
            for (let i = 0; i < LoadEstimator._HISTORY_LENGTH; i++) {
                this.lastRuns[i] = now - 1000 * i;
            }
            setInterval(() => {
                for (let i = LoadEstimator._HISTORY_LENGTH; i >= 1; i--) {
                    this.lastRuns[i] = this.lastRuns[i - 1];
                }
                this.lastRuns[0] = Date.now();
            }, 1000);
        }
        static getInstance() {
            if (!LoadEstimator._INSTANCE) {
                LoadEstimator._INSTANCE = new LoadEstimator();
            }
            return LoadEstimator._INSTANCE;
        }
        /**
         * returns an estimative number, from 0 (low load) to 1 (high load)
         */
        load() {
            const now = Date.now();
            const historyLimit = (1 + LoadEstimator._HISTORY_LENGTH) * 1000;
            let score = 0;
            for (let i = 0; i < LoadEstimator._HISTORY_LENGTH; i++) {
                if (now - this.lastRuns[i] <= historyLimit) {
                    score++;
                }
            }
            return 1 - score / LoadEstimator._HISTORY_LENGTH;
        }
        hasHighLoad() {
            return this.load() >= 0.5;
        }
    }
    LoadEstimator._HISTORY_LENGTH = 10;
    LoadEstimator._INSTANCE = null;
    /**
     * Same as Protocol, but will actually track messages and acks.
     * Moreover, it will ensure no messages are lost if there are no event listeners.
     */
    class PersistentProtocol {
        constructor(socket, initialChunk = null, loadEstimator = LoadEstimator.getInstance()) {
            this._onControlMessage = new BufferedEmitter();
            this.onControlMessage = this._onControlMessage.event;
            this._onMessage = new BufferedEmitter();
            this.onMessage = this._onMessage.event;
            this._onDidDispose = new BufferedEmitter();
            this.onDidDispose = this._onDidDispose.event;
            this._onSocketClose = new BufferedEmitter();
            this.onSocketClose = this._onSocketClose.event;
            this._onSocketTimeout = new BufferedEmitter();
            this.onSocketTimeout = this._onSocketTimeout.event;
            this._loadEstimator = loadEstimator;
            this._isReconnecting = false;
            this._outgoingUnackMsg = new Queue();
            this._outgoingMsgId = 0;
            this._outgoingAckId = 0;
            this._outgoingAckTimeout = null;
            this._incomingMsgId = 0;
            this._incomingAckId = 0;
            this._incomingMsgLastTime = 0;
            this._incomingAckTimeout = null;
            this._lastReplayRequestTime = 0;
            this._lastSocketTimeoutTime = Date.now();
            this._socketDisposables = [];
            this._socket = socket;
            this._socketWriter = new ProtocolWriter(this._socket);
            this._socketDisposables.push(this._socketWriter);
            this._socketReader = new ProtocolReader(this._socket);
            this._socketDisposables.push(this._socketReader);
            this._socketDisposables.push(this._socketReader.onMessage(msg => this._receiveMessage(msg)));
            this._socketDisposables.push(this._socket.onClose((e) => this._onSocketClose.fire(e)));
            if (initialChunk) {
                this._socketReader.acceptChunk(initialChunk);
            }
        }
        get unacknowledgedCount() {
            return this._outgoingMsgId - this._outgoingAckId;
        }
        dispose() {
            if (this._outgoingAckTimeout) {
                clearTimeout(this._outgoingAckTimeout);
                this._outgoingAckTimeout = null;
            }
            if (this._incomingAckTimeout) {
                clearTimeout(this._incomingAckTimeout);
                this._incomingAckTimeout = null;
            }
            this._socketDisposables = (0, lifecycle_1.dispose)(this._socketDisposables);
        }
        drain() {
            return this._socketWriter.drain();
        }
        sendDisconnect() {
            const msg = new ProtocolMessage(5 /* ProtocolMessageType.Disconnect */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
            this._socketWriter.flush();
        }
        sendPause() {
            const msg = new ProtocolMessage(7 /* ProtocolMessageType.Pause */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
        sendResume() {
            const msg = new ProtocolMessage(8 /* ProtocolMessageType.Resume */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
        pauseSocketWriting() {
            this._socketWriter.pause();
        }
        getSocket() {
            return this._socket;
        }
        getMillisSinceLastIncomingData() {
            return Date.now() - this._socketReader.lastReadTime;
        }
        beginAcceptReconnection(socket, initialDataChunk) {
            this._isReconnecting = true;
            this._socketDisposables = (0, lifecycle_1.dispose)(this._socketDisposables);
            this._onControlMessage.flushBuffer();
            this._onSocketClose.flushBuffer();
            this._onSocketTimeout.flushBuffer();
            this._socket.dispose();
            this._lastReplayRequestTime = 0;
            this._lastSocketTimeoutTime = Date.now();
            this._socket = socket;
            this._socketWriter = new ProtocolWriter(this._socket);
            this._socketDisposables.push(this._socketWriter);
            this._socketReader = new ProtocolReader(this._socket);
            this._socketDisposables.push(this._socketReader);
            this._socketDisposables.push(this._socketReader.onMessage(msg => this._receiveMessage(msg)));
            this._socketDisposables.push(this._socket.onClose((e) => this._onSocketClose.fire(e)));
            this._socketReader.acceptChunk(initialDataChunk);
        }
        endAcceptReconnection() {
            this._isReconnecting = false;
            // After a reconnection, let the other party know (again) which messages have been received.
            // (perhaps the other party didn't receive a previous ACK)
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(3 /* ProtocolMessageType.Ack */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
            // Send again all unacknowledged messages
            const toSend = this._outgoingUnackMsg.toArray();
            for (let i = 0, len = toSend.length; i < len; i++) {
                this._socketWriter.write(toSend[i]);
            }
            this._recvAckCheck();
        }
        acceptDisconnect() {
            this._onDidDispose.fire();
        }
        _receiveMessage(msg) {
            if (msg.ack > this._outgoingAckId) {
                this._outgoingAckId = msg.ack;
                do {
                    const first = this._outgoingUnackMsg.peek();
                    if (first && first.id <= msg.ack) {
                        // this message has been confirmed, remove it
                        this._outgoingUnackMsg.pop();
                    }
                    else {
                        break;
                    }
                } while (true);
            }
            switch (msg.type) {
                case 0 /* ProtocolMessageType.None */: {
                    // N/A
                    break;
                }
                case 1 /* ProtocolMessageType.Regular */: {
                    if (msg.id > this._incomingMsgId) {
                        if (msg.id !== this._incomingMsgId + 1) {
                            // in case we missed some messages we ask the other party to resend them
                            const now = Date.now();
                            if (now - this._lastReplayRequestTime > 10000) {
                                // send a replay request at most once every 10s
                                this._lastReplayRequestTime = now;
                                this._socketWriter.write(new ProtocolMessage(6 /* ProtocolMessageType.ReplayRequest */, 0, 0, getEmptyBuffer()));
                            }
                        }
                        else {
                            this._incomingMsgId = msg.id;
                            this._incomingMsgLastTime = Date.now();
                            this._sendAckCheck();
                            this._onMessage.fire(msg.data);
                        }
                    }
                    break;
                }
                case 2 /* ProtocolMessageType.Control */: {
                    this._onControlMessage.fire(msg.data);
                    break;
                }
                case 3 /* ProtocolMessageType.Ack */: {
                    // nothing to do
                    break;
                }
                case 5 /* ProtocolMessageType.Disconnect */: {
                    this._onDidDispose.fire();
                    break;
                }
                case 6 /* ProtocolMessageType.ReplayRequest */: {
                    // Send again all unacknowledged messages
                    const toSend = this._outgoingUnackMsg.toArray();
                    for (let i = 0, len = toSend.length; i < len; i++) {
                        this._socketWriter.write(toSend[i]);
                    }
                    this._recvAckCheck();
                    break;
                }
                case 7 /* ProtocolMessageType.Pause */: {
                    this._socketWriter.pause();
                    break;
                }
                case 8 /* ProtocolMessageType.Resume */: {
                    this._socketWriter.resume();
                    break;
                }
            }
        }
        readEntireBuffer() {
            return this._socketReader.readEntireBuffer();
        }
        flush() {
            this._socketWriter.flush();
        }
        send(buffer) {
            const myId = ++this._outgoingMsgId;
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(1 /* ProtocolMessageType.Regular */, myId, this._incomingAckId, buffer);
            this._outgoingUnackMsg.push(msg);
            if (!this._isReconnecting) {
                this._socketWriter.write(msg);
                this._recvAckCheck();
            }
        }
        /**
         * Send a message which will not be part of the regular acknowledge flow.
         * Use this for early control messages which are repeated in case of reconnection.
         */
        sendControl(buffer) {
            const msg = new ProtocolMessage(2 /* ProtocolMessageType.Control */, 0, 0, buffer);
            this._socketWriter.write(msg);
        }
        _sendAckCheck() {
            if (this._incomingMsgId <= this._incomingAckId) {
                // nothink to acknowledge
                return;
            }
            if (this._incomingAckTimeout) {
                // there will be a check in the near future
                return;
            }
            const timeSinceLastIncomingMsg = Date.now() - this._incomingMsgLastTime;
            if (timeSinceLastIncomingMsg >= 2000 /* ProtocolConstants.AcknowledgeTime */) {
                // sufficient time has passed since this message has been received,
                // and no message from our side needed to be sent in the meantime,
                // so we will send a message containing only an ack.
                this._sendAck();
                return;
            }
            this._incomingAckTimeout = setTimeout(() => {
                this._incomingAckTimeout = null;
                this._sendAckCheck();
            }, 2000 /* ProtocolConstants.AcknowledgeTime */ - timeSinceLastIncomingMsg + 5);
        }
        _recvAckCheck() {
            if (this._outgoingMsgId <= this._outgoingAckId) {
                // everything has been acknowledged
                return;
            }
            if (this._outgoingAckTimeout) {
                // there will be a check in the near future
                return;
            }
            if (this._isReconnecting) {
                // do not cause a timeout during reconnection,
                // because messages will not be actually written until `endAcceptReconnection`
                return;
            }
            const oldestUnacknowledgedMsg = this._outgoingUnackMsg.peek();
            const timeSinceOldestUnacknowledgedMsg = Date.now() - oldestUnacknowledgedMsg.writtenTime;
            const timeSinceLastReceivedSomeData = Date.now() - this._socketReader.lastReadTime;
            const timeSinceLastTimeout = Date.now() - this._lastSocketTimeoutTime;
            if (timeSinceOldestUnacknowledgedMsg >= 20000 /* ProtocolConstants.TimeoutTime */
                && timeSinceLastReceivedSomeData >= 20000 /* ProtocolConstants.TimeoutTime */
                && timeSinceLastTimeout >= 20000 /* ProtocolConstants.TimeoutTime */) {
                // It's been a long time since our sent message was acknowledged
                // and a long time since we received some data
                // But this might be caused by the event loop being busy and failing to read messages
                if (!this._loadEstimator.hasHighLoad()) {
                    // Trash the socket
                    this._lastSocketTimeoutTime = Date.now();
                    this._onSocketTimeout.fire(undefined);
                    return;
                }
            }
            const minimumTimeUntilTimeout = Math.max(20000 /* ProtocolConstants.TimeoutTime */ - timeSinceOldestUnacknowledgedMsg, 20000 /* ProtocolConstants.TimeoutTime */ - timeSinceLastReceivedSomeData, 20000 /* ProtocolConstants.TimeoutTime */ - timeSinceLastTimeout, 500);
            this._outgoingAckTimeout = setTimeout(() => {
                this._outgoingAckTimeout = null;
                this._recvAckCheck();
            }, minimumTimeUntilTimeout);
        }
        _sendAck() {
            if (this._incomingMsgId <= this._incomingAckId) {
                // nothink to acknowledge
                return;
            }
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(3 /* ProtocolMessageType.Ack */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
    }
    exports.PersistentProtocol = PersistentProtocol;
});
// (() => {
// 	if (!SocketDiagnostics.enableDiagnostics) {
// 		return;
// 	}
// 	if (typeof require.__$__nodeRequire !== 'function') {
// 		console.log(`Can only log socket diagnostics on native platforms.`);
// 		return;
// 	}
// 	const type = (
// 		process.argv.includes('--type=renderer')
// 			? 'renderer'
// 			: (process.argv.includes('--type=extensionHost')
// 				? 'extensionHost'
// 				: (process.argv.some(item => item.includes('server-main'))
// 					? 'server'
// 					: 'unknown'
// 				)
// 			)
// 	);
// 	setTimeout(() => {
// 		SocketDiagnostics.records.forEach(r => {
// 			if (r.buff) {
// 				r.data = Buffer.from(r.buff.buffer).toString('base64');
// 				r.buff = undefined;
// 			}
// 		});
// 		const fs = <typeof import('fs')>require.__$__nodeRequire('fs');
// 		const path = <typeof import('path')>require.__$__nodeRequire('path');
// 		const logPath = path.join(process.cwd(),`${type}-${process.pid}`);
// 		console.log(`dumping socket diagnostics at ${logPath}`);
// 		fs.writeFileSync(logPath, JSON.stringify(SocketDiagnostics.records));
// 	}, 20000);
// })();
//# sourceMappingURL=ipc.net.js.map