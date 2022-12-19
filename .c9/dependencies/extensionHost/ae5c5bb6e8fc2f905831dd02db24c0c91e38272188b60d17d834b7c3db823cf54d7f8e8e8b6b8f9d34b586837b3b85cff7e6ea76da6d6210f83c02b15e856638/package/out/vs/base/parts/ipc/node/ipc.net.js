/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "net", "os", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uuid", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/common/ipc.net", "zlib"], function (require, exports, crypto_1, net_1, os_1, buffer_1, errors_1, event_1, lifecycle_1, path_1, platform_1, uuid_1, ipc_1, ipc_net_1, zlib) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connect = exports.serve = exports.Server = exports.createStaticIPCHandle = exports.createRandomIPCHandle = exports.XDG_RUNTIME_DIR = exports.WebSocketNodeSocket = exports.NodeSocket = void 0;
    class NodeSocket {
        constructor(socket, debugLabel = '') {
            this.debugLabel = debugLabel;
            this.socket = socket;
            this.traceSocketEvent("created" /* SocketDiagnosticsEventType.Created */, { type: 'NodeSocket' });
            this._errorListener = (err) => {
                this.traceSocketEvent("error" /* SocketDiagnosticsEventType.Error */, { code: err === null || err === void 0 ? void 0 : err.code, message: err === null || err === void 0 ? void 0 : err.message });
                if (err) {
                    if (err.code === 'EPIPE') {
                        // An EPIPE exception at the wrong time can lead to a renderer process crash
                        // so ignore the error since the socket will fire the close event soon anyways:
                        // > https://nodejs.org/api/errors.html#errors_common_system_errors
                        // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                        // > process to read the data. Commonly encountered at the net and http layers,
                        // > indicative that the remote side of the stream being written to has been closed.
                        return;
                    }
                    (0, errors_1.onUnexpectedError)(err);
                }
            };
            this.socket.on('error', this._errorListener);
        }
        traceSocketEvent(type, data) {
            ipc_net_1.SocketDiagnostics.traceSocketEvent(this.socket, this.debugLabel, type, data);
        }
        dispose() {
            this.socket.off('error', this._errorListener);
            this.socket.destroy();
        }
        onData(_listener) {
            const listener = (buff) => {
                this.traceSocketEvent("read" /* SocketDiagnosticsEventType.Read */, buff);
                _listener(buffer_1.VSBuffer.wrap(buff));
            };
            this.socket.on('data', listener);
            return {
                dispose: () => this.socket.off('data', listener)
            };
        }
        onClose(listener) {
            const adapter = (hadError) => {
                this.traceSocketEvent("close" /* SocketDiagnosticsEventType.Close */, { hadError });
                listener({
                    type: 0 /* SocketCloseEventType.NodeSocketCloseEvent */,
                    hadError: hadError,
                    error: undefined
                });
            };
            this.socket.on('close', adapter);
            return {
                dispose: () => this.socket.off('close', adapter)
            };
        }
        onEnd(listener) {
            const adapter = () => {
                this.traceSocketEvent("nodeEndReceived" /* SocketDiagnosticsEventType.NodeEndReceived */);
                listener();
            };
            this.socket.on('end', adapter);
            return {
                dispose: () => this.socket.off('end', adapter)
            };
        }
        write(buffer) {
            // return early if socket has been destroyed in the meantime
            if (this.socket.destroyed) {
                return;
            }
            // we ignore the returned value from `write` because we would have to cached the data
            // anyways and nodejs is already doing that for us:
            // > https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback
            // > However, the false return value is only advisory and the writable stream will unconditionally
            // > accept and buffer chunk even if it has not been allowed to drain.
            try {
                this.traceSocketEvent("write" /* SocketDiagnosticsEventType.Write */, buffer);
                this.socket.write(buffer.buffer, (err) => {
                    if (err) {
                        if (err.code === 'EPIPE') {
                            // An EPIPE exception at the wrong time can lead to a renderer process crash
                            // so ignore the error since the socket will fire the close event soon anyways:
                            // > https://nodejs.org/api/errors.html#errors_common_system_errors
                            // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                            // > process to read the data. Commonly encountered at the net and http layers,
                            // > indicative that the remote side of the stream being written to has been closed.
                            return;
                        }
                        (0, errors_1.onUnexpectedError)(err);
                    }
                });
            }
            catch (err) {
                if (err.code === 'EPIPE') {
                    // An EPIPE exception at the wrong time can lead to a renderer process crash
                    // so ignore the error since the socket will fire the close event soon anyways:
                    // > https://nodejs.org/api/errors.html#errors_common_system_errors
                    // > EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no
                    // > process to read the data. Commonly encountered at the net and http layers,
                    // > indicative that the remote side of the stream being written to has been closed.
                    return;
                }
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        end() {
            this.traceSocketEvent("nodeEndSent" /* SocketDiagnosticsEventType.NodeEndSent */);
            this.socket.end();
        }
        drain() {
            this.traceSocketEvent("nodeDrainBegin" /* SocketDiagnosticsEventType.NodeDrainBegin */);
            return new Promise((resolve, reject) => {
                if (this.socket.bufferSize === 0) {
                    this.traceSocketEvent("nodeDrainEnd" /* SocketDiagnosticsEventType.NodeDrainEnd */);
                    resolve();
                    return;
                }
                const finished = () => {
                    this.socket.off('close', finished);
                    this.socket.off('end', finished);
                    this.socket.off('error', finished);
                    this.socket.off('timeout', finished);
                    this.socket.off('drain', finished);
                    this.traceSocketEvent("nodeDrainEnd" /* SocketDiagnosticsEventType.NodeDrainEnd */);
                    resolve();
                };
                this.socket.on('close', finished);
                this.socket.on('end', finished);
                this.socket.on('error', finished);
                this.socket.on('timeout', finished);
                this.socket.on('drain', finished);
            });
        }
    }
    exports.NodeSocket = NodeSocket;
    var Constants;
    (function (Constants) {
        Constants[Constants["MinHeaderByteSize"] = 2] = "MinHeaderByteSize";
    })(Constants || (Constants = {}));
    var ReadState;
    (function (ReadState) {
        ReadState[ReadState["PeekHeader"] = 1] = "PeekHeader";
        ReadState[ReadState["ReadHeader"] = 2] = "ReadHeader";
        ReadState[ReadState["ReadBody"] = 3] = "ReadBody";
        ReadState[ReadState["Fin"] = 4] = "Fin";
    })(ReadState || (ReadState = {}));
    /**
     * See https://tools.ietf.org/html/rfc6455#section-5.2
     */
    class WebSocketNodeSocket extends lifecycle_1.Disposable {
        /**
         * Create a socket which can communicate using WebSocket frames.
         *
         * **NOTE**: When using the permessage-deflate WebSocket extension, if parts of inflating was done
         *  in a different zlib instance, we need to pass all those bytes into zlib, otherwise the inflate
         *  might hit an inflated portion referencing a distance too far back.
         *
         * @param socket The underlying socket
         * @param permessageDeflate Use the permessage-deflate WebSocket extension
         * @param inflateBytes "Seed" zlib inflate with these bytes.
         * @param recordInflateBytes Record all bytes sent to inflate
         */
        constructor(socket, permessageDeflate, inflateBytes, recordInflateBytes) {
            super();
            this._onData = this._register(new event_1.Emitter());
            this._onClose = this._register(new event_1.Emitter());
            this._isEnded = false;
            this._state = {
                state: 1 /* ReadState.PeekHeader */,
                readLen: 2 /* Constants.MinHeaderByteSize */,
                fin: 0,
                compressed: false,
                firstFrameOfMessage: true,
                mask: 0
            };
            this.socket = socket;
            this.traceSocketEvent("created" /* SocketDiagnosticsEventType.Created */, { type: 'WebSocketNodeSocket', permessageDeflate, inflateBytesLength: (inflateBytes === null || inflateBytes === void 0 ? void 0 : inflateBytes.byteLength) || 0, recordInflateBytes });
            this._flowManager = this._register(new WebSocketFlowManager(this, permessageDeflate, inflateBytes, recordInflateBytes, this._onData, (data, compressed) => this._write(data, compressed)));
            this._register(this._flowManager.onError((err) => {
                // zlib errors are fatal, since we have no idea how to recover
                console.error(err);
                (0, errors_1.onUnexpectedError)(err);
                this._onClose.fire({
                    type: 0 /* SocketCloseEventType.NodeSocketCloseEvent */,
                    hadError: true,
                    error: err
                });
            }));
            this._incomingData = new ipc_net_1.ChunkStream();
            this._register(this.socket.onData(data => this._acceptChunk(data)));
            this._register(this.socket.onClose((e) => this._onClose.fire(e)));
        }
        get permessageDeflate() {
            return this._flowManager.permessageDeflate;
        }
        get recordedInflateBytes() {
            return this._flowManager.recordedInflateBytes;
        }
        traceSocketEvent(type, data) {
            this.socket.traceSocketEvent(type, data);
        }
        dispose() {
            if (this._flowManager.isProcessingWriteQueue()) {
                // Wait for any outstanding writes to finish before disposing
                this._register(this._flowManager.onDidFinishProcessingWriteQueue(() => {
                    this.dispose();
                }));
            }
            else {
                this.socket.dispose();
                super.dispose();
            }
        }
        onData(listener) {
            return this._onData.event(listener);
        }
        onClose(listener) {
            return this._onClose.event(listener);
        }
        onEnd(listener) {
            return this.socket.onEnd(listener);
        }
        write(buffer) {
            this._flowManager.writeMessage(buffer);
        }
        _write(buffer, compressed) {
            if (this._isEnded) {
                // Avoid ERR_STREAM_WRITE_AFTER_END
                return;
            }
            this.traceSocketEvent("webSocketNodeSocketWrite" /* SocketDiagnosticsEventType.WebSocketNodeSocketWrite */, buffer);
            let headerLen = 2 /* Constants.MinHeaderByteSize */;
            if (buffer.byteLength < 126) {
                headerLen += 0;
            }
            else if (buffer.byteLength < 2 ** 16) {
                headerLen += 2;
            }
            else {
                headerLen += 8;
            }
            const header = buffer_1.VSBuffer.alloc(headerLen);
            if (compressed) {
                // The RSV1 bit indicates a compressed frame
                header.writeUInt8(0b11000010, 0);
            }
            else {
                header.writeUInt8(0b10000010, 0);
            }
            if (buffer.byteLength < 126) {
                header.writeUInt8(buffer.byteLength, 1);
            }
            else if (buffer.byteLength < 2 ** 16) {
                header.writeUInt8(126, 1);
                let offset = 1;
                header.writeUInt8((buffer.byteLength >>> 8) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 0) & 0b11111111, ++offset);
            }
            else {
                header.writeUInt8(127, 1);
                let offset = 1;
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8(0, ++offset);
                header.writeUInt8((buffer.byteLength >>> 24) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 16) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 8) & 0b11111111, ++offset);
                header.writeUInt8((buffer.byteLength >>> 0) & 0b11111111, ++offset);
            }
            this.socket.write(buffer_1.VSBuffer.concat([header, buffer]));
        }
        end() {
            this._isEnded = true;
            this.socket.end();
        }
        _acceptChunk(data) {
            if (data.byteLength === 0) {
                return;
            }
            this._incomingData.acceptChunk(data);
            while (this._incomingData.byteLength >= this._state.readLen) {
                if (this._state.state === 1 /* ReadState.PeekHeader */) {
                    // peek to see if we can read the entire header
                    const peekHeader = this._incomingData.peek(this._state.readLen);
                    const firstByte = peekHeader.readUInt8(0);
                    const finBit = (firstByte & 0b10000000) >>> 7;
                    const rsv1Bit = (firstByte & 0b01000000) >>> 6;
                    const secondByte = peekHeader.readUInt8(1);
                    const hasMask = (secondByte & 0b10000000) >>> 7;
                    const len = (secondByte & 0b01111111);
                    this._state.state = 2 /* ReadState.ReadHeader */;
                    this._state.readLen = 2 /* Constants.MinHeaderByteSize */ + (hasMask ? 4 : 0) + (len === 126 ? 2 : 0) + (len === 127 ? 8 : 0);
                    this._state.fin = finBit;
                    if (this._state.firstFrameOfMessage) {
                        // if the frame is compressed, the RSV1 bit is set only for the first frame of the message
                        this._state.compressed = Boolean(rsv1Bit);
                    }
                    this._state.firstFrameOfMessage = Boolean(finBit);
                    this._state.mask = 0;
                    this.traceSocketEvent("webSocketNodeSocketPeekedHeader" /* SocketDiagnosticsEventType.WebSocketNodeSocketPeekedHeader */, { headerSize: this._state.readLen, compressed: this._state.compressed, fin: this._state.fin });
                }
                else if (this._state.state === 2 /* ReadState.ReadHeader */) {
                    // read entire header
                    const header = this._incomingData.read(this._state.readLen);
                    const secondByte = header.readUInt8(1);
                    const hasMask = (secondByte & 0b10000000) >>> 7;
                    let len = (secondByte & 0b01111111);
                    let offset = 1;
                    if (len === 126) {
                        len = (header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    else if (len === 127) {
                        len = (header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 0
                            + header.readUInt8(++offset) * 2 ** 24
                            + header.readUInt8(++offset) * 2 ** 16
                            + header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    let mask = 0;
                    if (hasMask) {
                        mask = (header.readUInt8(++offset) * 2 ** 24
                            + header.readUInt8(++offset) * 2 ** 16
                            + header.readUInt8(++offset) * 2 ** 8
                            + header.readUInt8(++offset));
                    }
                    this._state.state = 3 /* ReadState.ReadBody */;
                    this._state.readLen = len;
                    this._state.mask = mask;
                    this.traceSocketEvent("webSocketNodeSocketPeekedHeader" /* SocketDiagnosticsEventType.WebSocketNodeSocketPeekedHeader */, { bodySize: this._state.readLen, compressed: this._state.compressed, fin: this._state.fin, mask: this._state.mask });
                }
                else if (this._state.state === 3 /* ReadState.ReadBody */) {
                    // read body
                    const body = this._incomingData.read(this._state.readLen);
                    this.traceSocketEvent("webSocketNodeSocketReadData" /* SocketDiagnosticsEventType.WebSocketNodeSocketReadData */, body);
                    unmask(body, this._state.mask);
                    this.traceSocketEvent("webSocketNodeSocketUnmaskedData" /* SocketDiagnosticsEventType.WebSocketNodeSocketUnmaskedData */, body);
                    this._state.state = 1 /* ReadState.PeekHeader */;
                    this._state.readLen = 2 /* Constants.MinHeaderByteSize */;
                    this._state.mask = 0;
                    this._flowManager.acceptFrame(body, this._state.compressed, !!this._state.fin);
                }
            }
        }
        async drain() {
            this.traceSocketEvent("webSocketNodeSocketDrainBegin" /* SocketDiagnosticsEventType.WebSocketNodeSocketDrainBegin */);
            if (this._flowManager.isProcessingWriteQueue()) {
                await event_1.Event.toPromise(this._flowManager.onDidFinishProcessingWriteQueue);
            }
            await this.socket.drain();
            this.traceSocketEvent("webSocketNodeSocketDrainEnd" /* SocketDiagnosticsEventType.WebSocketNodeSocketDrainEnd */);
        }
    }
    exports.WebSocketNodeSocket = WebSocketNodeSocket;
    class WebSocketFlowManager extends lifecycle_1.Disposable {
        constructor(_tracer, permessageDeflate, inflateBytes, recordInflateBytes, _onData, _writeFn) {
            super();
            this._tracer = _tracer;
            this._onData = _onData;
            this._writeFn = _writeFn;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._writeQueue = [];
            this._readQueue = [];
            this._onDidFinishProcessingWriteQueue = this._register(new event_1.Emitter());
            this.onDidFinishProcessingWriteQueue = this._onDidFinishProcessingWriteQueue.event;
            this._isProcessingWriteQueue = false;
            this._isProcessingReadQueue = false;
            if (permessageDeflate) {
                // See https://tools.ietf.org/html/rfc7692#page-16
                // To simplify our logic, we don't negotiate the window size
                // and simply dedicate (2^15) / 32kb per web socket
                this._zlibInflateStream = this._register(new ZlibInflateStream(this._tracer, recordInflateBytes, inflateBytes, { windowBits: 15 }));
                this._zlibDeflateStream = this._register(new ZlibDeflateStream(this._tracer, { windowBits: 15 }));
                this._register(this._zlibInflateStream.onError((err) => this._onError.fire(err)));
                this._register(this._zlibDeflateStream.onError((err) => this._onError.fire(err)));
            }
            else {
                this._zlibInflateStream = null;
                this._zlibDeflateStream = null;
            }
        }
        get permessageDeflate() {
            return Boolean(this._zlibInflateStream && this._zlibDeflateStream);
        }
        get recordedInflateBytes() {
            if (this._zlibInflateStream) {
                return this._zlibInflateStream.recordedInflateBytes;
            }
            return buffer_1.VSBuffer.alloc(0);
        }
        writeMessage(message) {
            this._writeQueue.push(message);
            this._processWriteQueue();
        }
        async _processWriteQueue() {
            if (this._isProcessingWriteQueue) {
                return;
            }
            this._isProcessingWriteQueue = true;
            while (this._writeQueue.length > 0) {
                const message = this._writeQueue.shift();
                if (this._zlibDeflateStream) {
                    const data = await this._deflateMessage(this._zlibDeflateStream, message);
                    this._writeFn(data, true);
                }
                else {
                    this._writeFn(message, false);
                }
            }
            this._isProcessingWriteQueue = false;
            this._onDidFinishProcessingWriteQueue.fire();
        }
        isProcessingWriteQueue() {
            return (this._isProcessingWriteQueue);
        }
        /**
         * Subsequent calls should wait for the previous `_deflateBuffer` call to complete.
         */
        _deflateMessage(zlibDeflateStream, buffer) {
            return new Promise((resolve, reject) => {
                zlibDeflateStream.write(buffer);
                zlibDeflateStream.flush(data => resolve(data));
            });
        }
        acceptFrame(data, isCompressed, isLastFrameOfMessage) {
            this._readQueue.push({ data, isCompressed, isLastFrameOfMessage });
            this._processReadQueue();
        }
        async _processReadQueue() {
            if (this._isProcessingReadQueue) {
                return;
            }
            this._isProcessingReadQueue = true;
            while (this._readQueue.length > 0) {
                const frameInfo = this._readQueue.shift();
                if (this._zlibInflateStream && frameInfo.isCompressed) {
                    // See https://datatracker.ietf.org/doc/html/rfc7692#section-9.2
                    // Even if permessageDeflate is negotiated, it is possible
                    // that the other side might decide to send uncompressed messages
                    // So only decompress messages that have the RSV 1 bit set
                    const data = await this._inflateFrame(this._zlibInflateStream, frameInfo.data, frameInfo.isLastFrameOfMessage);
                    this._onData.fire(data);
                }
                else {
                    this._onData.fire(frameInfo.data);
                }
            }
            this._isProcessingReadQueue = false;
        }
        /**
         * Subsequent calls should wait for the previous `transformRead` call to complete.
         */
        _inflateFrame(zlibInflateStream, buffer, isLastFrameOfMessage) {
            return new Promise((resolve, reject) => {
                // See https://tools.ietf.org/html/rfc7692#section-7.2.2
                zlibInflateStream.write(buffer);
                if (isLastFrameOfMessage) {
                    zlibInflateStream.write(buffer_1.VSBuffer.fromByteArray([0x00, 0x00, 0xff, 0xff]));
                }
                zlibInflateStream.flush(data => resolve(data));
            });
        }
    }
    class ZlibInflateStream extends lifecycle_1.Disposable {
        constructor(_tracer, _recordInflateBytes, inflateBytes, options) {
            super();
            this._tracer = _tracer;
            this._recordInflateBytes = _recordInflateBytes;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._recordedInflateBytes = [];
            this._pendingInflateData = [];
            this._zlibInflate = zlib.createInflateRaw(options);
            this._zlibInflate.on('error', (err) => {
                this._tracer.traceSocketEvent("zlibInflateError" /* SocketDiagnosticsEventType.zlibInflateError */, { message: err === null || err === void 0 ? void 0 : err.message, code: err === null || err === void 0 ? void 0 : err.code });
                this._onError.fire(err);
            });
            this._zlibInflate.on('data', (data) => {
                this._tracer.traceSocketEvent("zlibInflateData" /* SocketDiagnosticsEventType.zlibInflateData */, data);
                this._pendingInflateData.push(buffer_1.VSBuffer.wrap(data));
            });
            if (inflateBytes) {
                this._tracer.traceSocketEvent("zlibInflateInitialWrite" /* SocketDiagnosticsEventType.zlibInflateInitialWrite */, inflateBytes.buffer);
                this._zlibInflate.write(inflateBytes.buffer);
                this._zlibInflate.flush(() => {
                    this._tracer.traceSocketEvent("zlibInflateInitialFlushFired" /* SocketDiagnosticsEventType.zlibInflateInitialFlushFired */);
                    this._pendingInflateData.length = 0;
                });
            }
        }
        get recordedInflateBytes() {
            if (this._recordInflateBytes) {
                return buffer_1.VSBuffer.concat(this._recordedInflateBytes);
            }
            return buffer_1.VSBuffer.alloc(0);
        }
        write(buffer) {
            if (this._recordInflateBytes) {
                this._recordedInflateBytes.push(buffer.clone());
            }
            this._tracer.traceSocketEvent("zlibInflateWrite" /* SocketDiagnosticsEventType.zlibInflateWrite */, buffer);
            this._zlibInflate.write(buffer.buffer);
        }
        flush(callback) {
            this._zlibInflate.flush(() => {
                this._tracer.traceSocketEvent("zlibInflateFlushFired" /* SocketDiagnosticsEventType.zlibInflateFlushFired */);
                const data = buffer_1.VSBuffer.concat(this._pendingInflateData);
                this._pendingInflateData.length = 0;
                callback(data);
            });
        }
    }
    class ZlibDeflateStream extends lifecycle_1.Disposable {
        constructor(_tracer, options) {
            super();
            this._tracer = _tracer;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._pendingDeflateData = [];
            this._zlibDeflate = zlib.createDeflateRaw({
                windowBits: 15
            });
            this._zlibDeflate.on('error', (err) => {
                this._tracer.traceSocketEvent("zlibDeflateError" /* SocketDiagnosticsEventType.zlibDeflateError */, { message: err === null || err === void 0 ? void 0 : err.message, code: err === null || err === void 0 ? void 0 : err.code });
                this._onError.fire(err);
            });
            this._zlibDeflate.on('data', (data) => {
                this._tracer.traceSocketEvent("zlibDeflateData" /* SocketDiagnosticsEventType.zlibDeflateData */, data);
                this._pendingDeflateData.push(buffer_1.VSBuffer.wrap(data));
            });
        }
        write(buffer) {
            this._tracer.traceSocketEvent("zlibDeflateWrite" /* SocketDiagnosticsEventType.zlibDeflateWrite */, buffer.buffer);
            this._zlibDeflate.write(buffer.buffer);
        }
        flush(callback) {
            // See https://zlib.net/manual.html#Constants
            this._zlibDeflate.flush(/*Z_SYNC_FLUSH*/ 2, () => {
                this._tracer.traceSocketEvent("zlibDeflateFlushFired" /* SocketDiagnosticsEventType.zlibDeflateFlushFired */);
                let data = buffer_1.VSBuffer.concat(this._pendingDeflateData);
                this._pendingDeflateData.length = 0;
                // See https://tools.ietf.org/html/rfc7692#section-7.2.1
                data = data.slice(0, data.byteLength - 4);
                callback(data);
            });
        }
    }
    function unmask(buffer, mask) {
        if (mask === 0) {
            return;
        }
        let cnt = buffer.byteLength >>> 2;
        for (let i = 0; i < cnt; i++) {
            const v = buffer.readUInt32BE(i * 4);
            buffer.writeUInt32BE(v ^ mask, i * 4);
        }
        let offset = cnt * 4;
        let bytesLeft = buffer.byteLength - offset;
        const m3 = (mask >>> 24) & 0b11111111;
        const m2 = (mask >>> 16) & 0b11111111;
        const m1 = (mask >>> 8) & 0b11111111;
        if (bytesLeft >= 1) {
            buffer.writeUInt8(buffer.readUInt8(offset) ^ m3, offset);
        }
        if (bytesLeft >= 2) {
            buffer.writeUInt8(buffer.readUInt8(offset + 1) ^ m2, offset + 1);
        }
        if (bytesLeft >= 3) {
            buffer.writeUInt8(buffer.readUInt8(offset + 2) ^ m1, offset + 2);
        }
    }
    // Read this before there's any chance it is overwritten
    // Related to https://github.com/microsoft/vscode/issues/30624
    exports.XDG_RUNTIME_DIR = process.env['XDG_RUNTIME_DIR'];
    const safeIpcPathLengths = {
        [2 /* Platform.Linux */]: 107,
        [1 /* Platform.Mac */]: 103
    };
    function createRandomIPCHandle() {
        const randomSuffix = (0, uuid_1.generateUuid)();
        // Windows: use named pipe
        if (process.platform === 'win32') {
            return `\\\\.\\pipe\\vscode-ipc-${randomSuffix}-sock`;
        }
        // Mac/Unix: use socket file and prefer
        // XDG_RUNTIME_DIR over tmpDir
        let result;
        if (exports.XDG_RUNTIME_DIR) {
            result = (0, path_1.join)(exports.XDG_RUNTIME_DIR, `vscode-ipc-${randomSuffix}.sock`);
        }
        else {
            result = (0, path_1.join)((0, os_1.tmpdir)(), `vscode-ipc-${randomSuffix}.sock`);
        }
        // Validate length
        validateIPCHandleLength(result);
        return result;
    }
    exports.createRandomIPCHandle = createRandomIPCHandle;
    function createStaticIPCHandle(directoryPath, type, version) {
        const scope = (0, crypto_1.createHash)('md5').update(directoryPath).digest('hex');
        // Windows: use named pipe
        if (process.platform === 'win32') {
            return `\\\\.\\pipe\\${scope}-${version}-${type}-sock`;
        }
        // Mac/Unix: use socket file and prefer
        // XDG_RUNTIME_DIR over user data path
        // unless portable
        let result;
        if (exports.XDG_RUNTIME_DIR && !process.env['VSCODE_PORTABLE']) {
            result = (0, path_1.join)(exports.XDG_RUNTIME_DIR, `vscode-${scope.substr(0, 8)}-${version}-${type}.sock`);
        }
        else {
            result = (0, path_1.join)(directoryPath, `${version}-${type}.sock`);
        }
        // Validate length
        validateIPCHandleLength(result);
        return result;
    }
    exports.createStaticIPCHandle = createStaticIPCHandle;
    function validateIPCHandleLength(handle) {
        const limit = safeIpcPathLengths[platform_1.platform];
        if (typeof limit === 'number' && handle.length >= limit) {
            // https://nodejs.org/api/net.html#net_identifying_paths_for_ipc_connections
            console.warn(`WARNING: IPC handle "${handle}" is longer than ${limit} chars, try a shorter --user-data-dir`);
        }
    }
    class Server extends ipc_1.IPCServer {
        constructor(server) {
            super(Server.toClientConnectionEvent(server));
            this.server = server;
        }
        static toClientConnectionEvent(server) {
            const onConnection = event_1.Event.fromNodeEventEmitter(server, 'connection');
            return event_1.Event.map(onConnection, socket => ({
                protocol: new ipc_net_1.Protocol(new NodeSocket(socket, 'ipc-server-connection')),
                onDidClientDisconnect: event_1.Event.once(event_1.Event.fromNodeEventEmitter(socket, 'close'))
            }));
        }
        dispose() {
            super.dispose();
            if (this.server) {
                this.server.close();
                this.server = null;
            }
        }
    }
    exports.Server = Server;
    function serve(hook) {
        return new Promise((c, e) => {
            const server = (0, net_1.createServer)();
            server.on('error', e);
            server.listen(hook, () => {
                server.removeListener('error', e);
                c(new Server(server));
            });
        });
    }
    exports.serve = serve;
    function connect(hook, clientId) {
        return new Promise((c, e) => {
            const socket = (0, net_1.createConnection)(hook, () => {
                socket.removeListener('error', e);
                c(ipc_net_1.Client.fromSocket(new NodeSocket(socket, `ipc-client${clientId}`), clientId));
            });
            socket.once('error', e);
        });
    }
    exports.connect = connect;
});
//# sourceMappingURL=ipc.net.js.map