"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarCommands = void 0;
const vscode_1 = require("vscode");
const util_1 = require("./util");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
class CheckoutStatusBar {
    constructor(repository) {
        this.repository = repository;
        this._onDidChange = new vscode_1.EventEmitter();
        this.disposables = [];
        repository.onDidRunGitStatus(this._onDidChange.fire, this._onDidChange, this.disposables);
    }
    get onDidChange() { return this._onDidChange.event; }
    get command() {
        const rebasing = !!this.repository.rebaseCommit;
        const title = `$(git-branch) ${this.repository.headLabel}${rebasing ? ` (${localize('rebasing', 'Rebasing')})` : ''}`;
        return {
            command: 'git.checkout',
            tooltip: localize('checkout', "Checkout branch/tag..."),
            title,
            arguments: [this.repository.sourceControl]
        };
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
class SyncStatusBar {
    constructor(repository, remoteSourcePublisherRegistry) {
        this.repository = repository;
        this.remoteSourcePublisherRegistry = remoteSourcePublisherRegistry;
        this._onDidChange = new vscode_1.EventEmitter();
        this.disposables = [];
        this._state = {
            enabled: true,
            isSyncRunning: false,
            hasRemotes: false,
            HEAD: undefined,
            remoteSourcePublishers: remoteSourcePublisherRegistry.getRemoteSourcePublishers()
        };
        repository.onDidRunGitStatus(this.onDidRunGitStatus, this, this.disposables);
        repository.onDidChangeOperations(this.onDidChangeOperations, this, this.disposables);
        (0, util_1.anyEvent)(remoteSourcePublisherRegistry.onDidAddRemoteSourcePublisher, remoteSourcePublisherRegistry.onDidRemoveRemoteSourcePublisher)(this.onDidChangeRemoteSourcePublishers, this, this.disposables);
        const onEnablementChange = (0, util_1.filterEvent)(vscode_1.workspace.onDidChangeConfiguration, e => e.affectsConfiguration('git.enableStatusBarSync'));
        onEnablementChange(this.updateEnablement, this, this.disposables);
        this.updateEnablement();
    }
    get onDidChange() { return this._onDidChange.event; }
    get state() { return this._state; }
    set state(state) {
        this._state = state;
        this._onDidChange.fire();
    }
    updateEnablement() {
        const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(this.repository.root));
        const enabled = config.get('enableStatusBarSync', true);
        this.state = { ...this.state, enabled };
    }
    onDidChangeOperations() {
        const isSyncRunning = this.repository.operations.isRunning("Sync" /* Operation.Sync */) ||
            this.repository.operations.isRunning("Push" /* Operation.Push */) ||
            this.repository.operations.isRunning("Pull" /* Operation.Pull */);
        this.state = { ...this.state, isSyncRunning };
    }
    onDidRunGitStatus() {
        this.state = {
            ...this.state,
            hasRemotes: this.repository.remotes.length > 0,
            HEAD: this.repository.HEAD
        };
    }
    onDidChangeRemoteSourcePublishers() {
        this.state = {
            ...this.state,
            remoteSourcePublishers: this.remoteSourcePublisherRegistry.getRemoteSourcePublishers()
        };
    }
    get command() {
        if (!this.state.enabled) {
            return;
        }
        if (!this.state.hasRemotes) {
            if (this.state.remoteSourcePublishers.length === 0) {
                return;
            }
            const tooltip = this.state.remoteSourcePublishers.length === 1
                ? localize('publish to', "Publish to {0}", this.state.remoteSourcePublishers[0].name)
                : localize('publish to...', "Publish to...");
            return {
                command: 'git.publish',
                title: `$(cloud-upload)`,
                tooltip,
                arguments: [this.repository.sourceControl]
            };
        }
        const HEAD = this.state.HEAD;
        let icon = '$(sync)';
        let text = '';
        let command = '';
        let tooltip = '';
        if (HEAD && HEAD.name && HEAD.commit) {
            if (HEAD.upstream) {
                if (HEAD.ahead || HEAD.behind) {
                    text += this.repository.syncLabel;
                }
                const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(this.repository.root));
                const rebaseWhenSync = config.get('rebaseWhenSync');
                command = rebaseWhenSync ? 'git.syncRebase' : 'git.sync';
                tooltip = this.repository.syncTooltip;
            }
            else {
                icon = '$(cloud-upload)';
                command = 'git.publish';
                tooltip = localize('publish branch', "Publish Branch");
            }
        }
        else {
            command = '';
            tooltip = '';
        }
        if (this.state.isSyncRunning) {
            icon = '$(sync~spin)';
            command = '';
            tooltip = localize('syncing changes', "Synchronizing Changes...");
        }
        return {
            command,
            title: [icon, text].join(' ').trim(),
            tooltip,
            arguments: [this.repository.sourceControl]
        };
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
class StatusBarCommands {
    constructor(repository, remoteSourcePublisherRegistry) {
        this.disposables = [];
        this.syncStatusBar = new SyncStatusBar(repository, remoteSourcePublisherRegistry);
        this.checkoutStatusBar = new CheckoutStatusBar(repository);
        this.onDidChange = (0, util_1.anyEvent)(this.syncStatusBar.onDidChange, this.checkoutStatusBar.onDidChange);
    }
    get commands() {
        return [this.checkoutStatusBar.command, this.syncStatusBar.command]
            .filter((c) => !!c);
    }
    dispose() {
        this.syncStatusBar.dispose();
        this.checkoutStatusBar.dispose();
        this.disposables = (0, util_1.dispose)(this.disposables);
    }
}
exports.StatusBarCommands = StatusBarCommands;
//# sourceMappingURL=statusbar.js.map