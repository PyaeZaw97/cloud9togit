/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UrlFinder = void 0;
    class UrlFinder extends lifecycle_1.Disposable {
        constructor(terminalService, debugService) {
            super();
            this._onDidMatchLocalUrl = new event_1.Emitter();
            this.onDidMatchLocalUrl = this._onDidMatchLocalUrl.event;
            this.listeners = new Map();
            this.replPositions = new Map();
            // Terminal
            terminalService.instances.forEach(instance => {
                this.registerTerminalInstance(instance);
            });
            this._register(terminalService.onDidCreateInstance(instance => {
                this.registerTerminalInstance(instance);
            }));
            this._register(terminalService.onDidDisposeInstance(instance => {
                var _a;
                (_a = this.listeners.get(instance)) === null || _a === void 0 ? void 0 : _a.dispose();
                this.listeners.delete(instance);
            }));
            // Debug
            this._register(debugService.onDidNewSession(session => {
                if (!session.parentSession || (session.parentSession && session.hasSeparateRepl())) {
                    this.listeners.set(session.getId(), session.onDidChangeReplElements(() => {
                        this.processNewReplElements(session);
                    }));
                }
            }));
            this._register(debugService.onDidEndSession(session => {
                var _a;
                if (this.listeners.has(session.getId())) {
                    (_a = this.listeners.get(session.getId())) === null || _a === void 0 ? void 0 : _a.dispose();
                    this.listeners.delete(session.getId());
                }
            }));
        }
        registerTerminalInstance(instance) {
            if (!UrlFinder.excludeTerminals.includes(instance.title)) {
                this.listeners.set(instance, instance.onData(data => {
                    this.processData(data);
                }));
            }
        }
        processNewReplElements(session) {
            const oldReplPosition = this.replPositions.get(session.getId());
            const replElements = session.getReplElements();
            this.replPositions.set(session.getId(), { position: replElements.length - 1, tail: replElements[replElements.length - 1] });
            if (!oldReplPosition && replElements.length > 0) {
                replElements.forEach(element => this.processData(element.toString()));
            }
            else if (oldReplPosition && (replElements.length - 1 !== oldReplPosition.position)) {
                // Process lines until we reach the old "tail"
                for (let i = replElements.length - 1; i >= 0; i--) {
                    const element = replElements[i];
                    if (element === oldReplPosition.tail) {
                        break;
                    }
                    else {
                        this.processData(element.toString());
                    }
                }
            }
        }
        dispose() {
            super.dispose();
            const listeners = this.listeners.values();
            for (const listener of listeners) {
                listener.dispose();
            }
        }
        processData(data) {
            // strip ANSI terminal codes
            data = data.replace(UrlFinder.terminalCodesRegex, '');
            const urlMatches = data.match(UrlFinder.localUrlRegex) || [];
            if (urlMatches && urlMatches.length > 0) {
                urlMatches.forEach((match) => {
                    // check if valid url
                    let serverUrl;
                    try {
                        serverUrl = new URL(match);
                    }
                    catch (e) {
                        // Not a valid URL
                    }
                    if (serverUrl) {
                        // check if the port is a valid integer value
                        const portMatch = match.match(UrlFinder.extractPortRegex);
                        const port = parseFloat(serverUrl.port ? serverUrl.port : (portMatch ? portMatch[2] : 'NaN'));
                        if (!isNaN(port) && Number.isInteger(port) && port > 0 && port <= 65535) {
                            // normalize the host name
                            let host = serverUrl.hostname;
                            if (host !== '0.0.0.0' && host !== '127.0.0.1') {
                                host = 'localhost';
                            }
                            // Exclude node inspect, except when using default port
                            if (port !== 9229 && data.startsWith('Debugger listening on')) {
                                return;
                            }
                            this._onDidMatchLocalUrl.fire({ port, host });
                        }
                    }
                });
            }
            else {
                // Try special python case
                const pythonMatch = data.match(UrlFinder.localPythonServerRegex);
                if (pythonMatch && pythonMatch.length === 3) {
                    this._onDidMatchLocalUrl.fire({ host: pythonMatch[1], port: Number(pythonMatch[2]) });
                }
            }
        }
    }
    exports.UrlFinder = UrlFinder;
    UrlFinder.terminalCodesRegex = /(?:\u001B|\u009B)[\[\]()#;?]*(?:(?:(?:[a-zA-Z0-9]*(?:;[a-zA-Z0-9]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[0-9A-PR-TZcf-ntqry=><~]))/g;
    /**
     * Local server url pattern matching following urls:
     * http://localhost:3000/ - commonly used across multiple frameworks
     * https://127.0.0.1:5001/ - ASP.NET
     * http://:8080 - Beego Golang
     * http://0.0.0.0:4000 - Elixir Phoenix
     */
    UrlFinder.localUrlRegex = /\b\w{2,20}:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|:\d{2,5})[\w\-\.\~:\/\?\#[\]\@!\$&\(\)\*\+\,\;\=]*/gim;
    UrlFinder.extractPortRegex = /(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{1,5})/;
    /**
     * https://github.com/microsoft/vscode-remote-release/issues/3949
     */
    UrlFinder.localPythonServerRegex = /HTTP\son\s(127\.0\.0\.1|0\.0\.0\.0)\sport\s(\d+)/;
    UrlFinder.excludeTerminals = ['Dev Containers'];
});
//# sourceMappingURL=urlFinder.js.map