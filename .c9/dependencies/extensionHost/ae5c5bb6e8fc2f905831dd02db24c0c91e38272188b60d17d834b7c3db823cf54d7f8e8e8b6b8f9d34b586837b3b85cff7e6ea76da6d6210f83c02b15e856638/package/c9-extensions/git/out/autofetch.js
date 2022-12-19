"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoFetcher = void 0;
// Modifications Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
const vscode_1 = require("vscode");
const util_1 = require("./util");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
function isRemoteOperation(operation) {
    return operation === "Pull" /* Operation.Pull */ || operation === "Push" /* Operation.Push */ || operation === "Sync" /* Operation.Sync */ || operation === "Fetch" /* Operation.Fetch */;
}
class AutoFetcher {
    constructor(repository, globalState) {
        this.repository = repository;
        this.globalState = globalState;
        this._onDidChange = new vscode_1.EventEmitter();
        this.onDidChange = this._onDidChange.event;
        this._enabled = false;
        this._fetchAll = false;
        this.disposables = [];
        vscode_1.workspace.onDidChangeConfiguration(this.onConfiguration, this, this.disposables);
        this.onConfiguration();
        const onGoodRemoteOperation = (0, util_1.filterEvent)(repository.onDidRunOperation, ({ operation, error }) => !error && isRemoteOperation(operation));
        const onFirstGoodRemoteOperation = (0, util_1.onceEvent)(onGoodRemoteOperation);
        onFirstGoodRemoteOperation(this.onFirstGoodRemoteOperation, this, this.disposables);
    }
    get enabled() { return this._enabled; }
    set enabled(enabled) { this._enabled = enabled; this._onDidChange.fire(enabled); }
    async onFirstGoodRemoteOperation() {
        const didInformUser = !this.globalState.get(AutoFetcher.DidInformUser);
        if (this.enabled && !didInformUser) {
            this.globalState.update(AutoFetcher.DidInformUser, true);
        }
        const shouldInformUser = !this.enabled && didInformUser;
        if (!shouldInformUser) {
            return;
        }
        const yes = { title: localize('yes', "Yes") };
        const no = { isCloseAffordance: true, title: localize('no', "No") };
        const askLater = { title: localize('not now', "Ask Me Later") };
        const result = await vscode_1.window.showInformationMessage(localize('suggest auto fetch', "Would you like Cloud9 to periodically run 'git fetch'?"), yes, no, askLater);
        if (result === askLater) {
            return;
        }
        if (result === yes) {
            const gitConfig = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(this.repository.root));
            gitConfig.update('autofetch', true, vscode_1.ConfigurationTarget.Global);
        }
        this.globalState.update(AutoFetcher.DidInformUser, true);
    }
    onConfiguration(e) {
        if (e !== undefined && !e.affectsConfiguration('git.autofetch')) {
            return;
        }
        const gitConfig = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(this.repository.root));
        switch (gitConfig.get('autofetch')) {
            case true:
                this._fetchAll = false;
                this.enable();
                break;
            case 'all':
                this._fetchAll = true;
                this.enable();
                break;
            case false:
            default:
                this._fetchAll = false;
                this.disable();
                break;
        }
    }
    enable() {
        if (this.enabled) {
            return;
        }
        this.enabled = true;
        this.run();
    }
    disable() {
        this.enabled = false;
    }
    async run() {
        while (this.enabled) {
            await this.repository.whenIdleAndFocused();
            if (!this.enabled) {
                return;
            }
            try {
                if (this._fetchAll) {
                    await this.repository.fetchAll();
                }
                else {
                    await this.repository.fetchDefault({ silent: true });
                }
            }
            catch (err) {
                if (err.gitErrorCode === "AuthenticationFailed" /* GitErrorCodes.AuthenticationFailed */) {
                    this.disable();
                }
            }
            if (!this.enabled) {
                return;
            }
            const period = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(this.repository.root)).get('autofetchPeriod', 180) * 1000;
            const timeout = new Promise(c => setTimeout(c, period));
            const whenDisabled = (0, util_1.eventToPromise)((0, util_1.filterEvent)(this.onDidChange, enabled => !enabled));
            await Promise.race([timeout, whenDisabled]);
        }
    }
    dispose() {
        this.disable();
        this.disposables.forEach(d => d.dispose());
    }
}
exports.AutoFetcher = AutoFetcher;
AutoFetcher.DidInformUser = 'autofetch.didInformUser';
//# sourceMappingURL=autofetch.js.map