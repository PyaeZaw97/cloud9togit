/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/terminal/electron-sandbox/terminal", "vs/base/common/uri"], function (require, exports, event_1, lifecycle_1, terminal_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalPty = void 0;
    /**
     * Responsible for establishing and maintaining a connection with an existing terminal process
     * created on the local pty host.
     */
    let LocalPty = class LocalPty extends lifecycle_1.Disposable {
        constructor(id, shouldPersist, _localPtyService) {
            super();
            this.id = id;
            this.shouldPersist = shouldPersist;
            this._localPtyService = _localPtyService;
            this._inReplay = false;
            this._properties = {
                cwd: '',
                initialCwd: '',
                fixedDimensions: { cols: undefined, rows: undefined },
                title: '',
                shellType: undefined,
                hasChildProcesses: true,
                resolvedShellLaunchConfig: {},
                overrideDimensions: undefined
            };
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._onProcessReplay.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            this._onRestoreCommands = this._register(new event_1.Emitter());
            this.onRestoreCommands = this._onRestoreCommands.event;
        }
        start() {
            return this._localPtyService.start(this.id);
        }
        detach() {
            return this._localPtyService.detachFromProcess(this.id);
        }
        shutdown(immediate) {
            this._localPtyService.shutdown(this.id, immediate);
        }
        async processBinary(data) {
            if (this._inReplay) {
                return;
            }
            return this._localPtyService.processBinary(this.id, data);
        }
        input(data) {
            if (this._inReplay) {
                return;
            }
            this._localPtyService.input(this.id, data);
        }
        resize(cols, rows) {
            if (this._inReplay) {
                return;
            }
            this._localPtyService.resize(this.id, cols, rows);
        }
        async getInitialCwd() {
            return this._properties.initialCwd;
        }
        async getCwd() {
            return this._properties.cwd || this._properties.initialCwd;
        }
        async refreshProperty(type) {
            return this._localPtyService.refreshProperty(this.id, type);
        }
        async updateProperty(type, value) {
            return this._localPtyService.updateProperty(this.id, type, value);
        }
        getLatency() {
            // TODO: The idea here was to add the result plus the time it took to get the latency
            return this._localPtyService.getLatency(this.id);
        }
        acknowledgeDataEvent(charCount) {
            if (this._inReplay) {
                return;
            }
            this._localPtyService.acknowledgeDataEvent(this.id, charCount);
        }
        setUnicodeVersion(version) {
            return this._localPtyService.setUnicodeVersion(this.id, version);
        }
        handleData(e) {
            this._onProcessData.fire(e);
        }
        handleExit(e) {
            this._onProcessExit.fire(e);
        }
        handleReady(e) {
            this._onProcessReady.fire(e);
        }
        handleDidChangeProperty({ type, value }) {
            switch (type) {
                case "cwd" /* ProcessPropertyType.Cwd */:
                    this._properties.cwd = value;
                    break;
                case "initialCwd" /* ProcessPropertyType.InitialCwd */:
                    this._properties.initialCwd = value;
                    break;
                case "resolvedShellLaunchConfig" /* ProcessPropertyType.ResolvedShellLaunchConfig */:
                    if (value.cwd && typeof value.cwd !== 'string') {
                        value.cwd = uri_1.URI.revive(value.cwd);
                    }
            }
            this._onDidChangeProperty.fire({ type, value });
        }
        async handleReplay(e) {
            try {
                this._inReplay = true;
                for (const innerEvent of e.events) {
                    if (innerEvent.cols !== 0 || innerEvent.rows !== 0) {
                        // never override with 0x0 as that is a marker for an unknown initial size
                        this._onDidChangeProperty.fire({ type: "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */, value: { cols: innerEvent.cols, rows: innerEvent.rows, forceExactSize: true } });
                    }
                    const e = { data: innerEvent.data, trackCommit: true };
                    this._onProcessData.fire(e);
                    await e.writePromise;
                }
            }
            finally {
                this._inReplay = false;
            }
            if (e.commands) {
                this._onRestoreCommands.fire(e.commands);
            }
            // remove size override
            this._onDidChangeProperty.fire({ type: "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */, value: undefined });
        }
        handleOrphanQuestion() {
            this._localPtyService.orphanQuestionReply(this.id);
        }
    };
    LocalPty = __decorate([
        __param(2, terminal_1.ILocalPtyService)
    ], LocalPty);
    exports.LocalPty = LocalPty;
});
//# sourceMappingURL=localPty.js.map