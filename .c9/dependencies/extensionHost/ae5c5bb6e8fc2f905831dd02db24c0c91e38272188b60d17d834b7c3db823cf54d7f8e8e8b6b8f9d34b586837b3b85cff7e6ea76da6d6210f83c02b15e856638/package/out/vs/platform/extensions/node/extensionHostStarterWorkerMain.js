"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function () {
    'use strict';
    const loader = require('../../../loader');
    const bootstrap = require('../../../../bootstrap');
    const path = require('path');
    const parentPort = require('worker_threads').parentPort;
    // Bootstrap: NLS
    const nlsConfig = bootstrap.setupNLS();
    // Bootstrap: Loader
    loader.config({
        baseUrl: bootstrap.fileUriFromPath(path.join(__dirname, '../../../../'), { isWindows: process.platform === 'win32' }),
        catchError: true,
        nodeRequire: require,
        nodeMain: __filename,
        'vs/nls': nlsConfig,
        amdModulesPattern: /^vs\//,
        recordStats: true
    });
    let isFirstMessage = true;
    let beforeReadyMessages = [];
    const initialMessageHandler = (data) => {
        if (!isFirstMessage) {
            beforeReadyMessages.push(data);
            return;
        }
        isFirstMessage = false;
        loadCode(data);
    };
    parentPort.on('message', initialMessageHandler);
    const loadCode = function (moduleId) {
        loader([moduleId], function (ws) {
            setTimeout(() => {
                const messageHandler = ws.create((msg, transfer) => {
                    parentPort.postMessage(msg, transfer);
                }, null);
                parentPort.off('message', initialMessageHandler);
                parentPort.on('message', (data) => {
                    messageHandler.onmessage(data);
                });
                while (beforeReadyMessages.length > 0) {
                    const msg = beforeReadyMessages.shift();
                    messageHandler.onmessage(msg);
                }
            });
        }, (err) => console.error(err));
    };
    parentPort.on('messageerror', (err) => {
        console.error(err);
    });
})();
//# sourceMappingURL=extensionHostStarterWorkerMain.js.map