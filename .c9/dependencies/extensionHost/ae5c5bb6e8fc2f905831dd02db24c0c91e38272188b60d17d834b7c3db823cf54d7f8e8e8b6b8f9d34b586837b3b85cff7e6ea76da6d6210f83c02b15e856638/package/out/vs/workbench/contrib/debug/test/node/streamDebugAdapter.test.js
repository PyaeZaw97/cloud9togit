/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "crypto", "net", "vs/base/common/platform", "os", "vs/base/common/path", "vs/base/node/ports", "vs/workbench/contrib/debug/node/debugAdapter"], function (require, exports, assert, crypto, net, platform, os_1, path_1, ports, debugAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function sendInitializeRequest(debugAdapter) {
        return new Promise((resolve, reject) => {
            debugAdapter.sendRequest('initialize', { adapterID: 'test' }, (result) => {
                resolve(result);
            });
        });
    }
    function serverConnection(socket) {
        socket.on('data', (data) => {
            const str = data.toString().split('\r\n')[2];
            const request = JSON.parse(str);
            const response = {
                seq: request.seq,
                request_seq: request.seq,
                type: 'response',
                command: request.command
            };
            if (request.arguments.adapterID === 'test') {
                response.success = true;
            }
            else {
                response.success = false;
                response.message = 'failed';
            }
            const responsePayload = JSON.stringify(response);
            socket.write(`Content-Length: ${responsePayload.length}\r\n\r\n${responsePayload}`);
        });
    }
    suite('Debug - StreamDebugAdapter', () => {
        test(`StreamDebugAdapter (NamedPipeDebugAdapter) can initialize a connection`, async () => {
            const pipeName = crypto.randomBytes(10).toString('hex');
            const pipePath = platform.isWindows ? (0, path_1.join)('\\\\.\\pipe\\', pipeName) : (0, path_1.join)((0, os_1.tmpdir)(), pipeName);
            const server = net.createServer(serverConnection).listen(pipePath);
            const debugAdapter = new debugAdapter_1.NamedPipeDebugAdapter({
                type: 'pipeServer',
                path: pipePath
            });
            try {
                await debugAdapter.startSession();
                const response = await sendInitializeRequest(debugAdapter);
                assert.strictEqual(response.command, 'initialize');
                assert.strictEqual(response.request_seq, 1);
                assert.strictEqual(response.success, true, response.message);
            }
            finally {
                await debugAdapter.stopSession();
                server.close();
                debugAdapter.dispose();
            }
        });
        test(`StreamDebugAdapter (SocketDebugAdapter) can initialize a connection`, async () => {
            const rndPort = Math.floor(Math.random() * 1000 + 8000);
            const port = await ports.findFreePort(rndPort, 10 /* try 10 ports */, 3000 /* try up to 3 seconds */, 87 /* skip 87 ports between attempts */);
            const server = net.createServer(serverConnection).listen(port);
            const debugAdapter = new debugAdapter_1.SocketDebugAdapter({
                type: 'server',
                port
            });
            try {
                await debugAdapter.startSession();
                const response = await sendInitializeRequest(debugAdapter);
                assert.strictEqual(response.command, 'initialize');
                assert.strictEqual(response.request_seq, 1);
                assert.strictEqual(response.success, true, response.message);
            }
            finally {
                await debugAdapter.stopSession();
                server.close();
                debugAdapter.dispose();
            }
        });
    });
});
//# sourceMappingURL=streamDebugAdapter.test.js.map