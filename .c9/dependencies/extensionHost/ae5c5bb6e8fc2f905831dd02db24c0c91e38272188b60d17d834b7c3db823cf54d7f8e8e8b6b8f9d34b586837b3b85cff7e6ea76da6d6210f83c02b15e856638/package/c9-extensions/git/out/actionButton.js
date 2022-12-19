"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionButtonCommand = void 0;
const vscode_1 = require("vscode");
const nls = require("vscode-nls");
const util_1 = require("./util");
const localize = nls.loadMessageBundle();
class ActionButtonCommand {
    constructor(repository) {
        this.repository = repository;
        this._onDidChange = new vscode_1.EventEmitter();
        this.disposables = [];
        this._state = { HEAD: undefined, isSyncRunning: false, repositoryHasNoChanges: false };
        repository.onDidRunGitStatus(this.onDidRunGitStatus, this, this.disposables);
        repository.onDidChangeOperations(this.onDidChangeOperations, this, this.disposables);
    }
    get onDidChange() { return this._onDidChange.event; }
    get state() { return this._state; }
    set state(state) {
        if (JSON.stringify(this._state) !== JSON.stringify(state)) {
            this._state = state;
            this._onDidChange.fire();
        }
    }
    get button() {
        if (!this.state.HEAD || !this.state.HEAD.name || !this.state.HEAD.commit) {
            return undefined;
        }
        const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(this.repository.root));
        const showActionButton = config.get('showUnpublishedCommitsButton', 'whenEmpty');
        const postCommitCommand = config.get('postCommitCommand');
        const noPostCommitCommand = postCommitCommand !== 'sync' && postCommitCommand !== 'push';
        let actionButton;
        if (showActionButton === 'always' || (showActionButton === 'whenEmpty' && this.state.repositoryHasNoChanges && noPostCommitCommand)) {
            if (this.state.HEAD.upstream) {
                if (this.state.HEAD.ahead) {
                    const config = vscode_1.workspace.getConfiguration('git', vscode_1.Uri.file(this.repository.root));
                    const rebaseWhenSync = config.get('rebaseWhenSync');
                    const ahead = `${this.state.HEAD.ahead}$(arrow-up)`;
                    const behind = this.state.HEAD.behind ? `${this.state.HEAD.behind}$(arrow-down) ` : '';
                    const icon = this.state.isSyncRunning ? '$(sync~spin)' : '$(sync)';
                    actionButton = {
                        command: {
                            command: this.state.isSyncRunning ? '' : rebaseWhenSync ? 'git.syncRebase' : 'git.sync',
                            title: localize('scm button sync title', "{0} {1}{2}", icon, behind, ahead),
                            tooltip: this.state.isSyncRunning ?
                                localize('syncing changes', "Synchronizing Changes...")
                                : this.repository.syncTooltip,
                            arguments: [this.repository.sourceControl],
                        },
                        description: localize('scm button sync description', "{0} Sync Changes {1}{2}", icon, behind, ahead)
                    };
                }
            }
            else {
                actionButton = {
                    command: {
                        command: this.state.isSyncRunning ? '' : 'git.publish',
                        title: localize('scm button publish title', "$(cloud-upload) Publish Branch"),
                        tooltip: this.state.isSyncRunning ?
                            localize('scm button publish branch running', "Publishing Branch...") :
                            localize('scm button publish branch', "Publish Branch"),
                        arguments: [this.repository.sourceControl],
                    }
                };
            }
        }
        return actionButton;
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
            HEAD: this.repository.HEAD,
            repositoryHasNoChanges: this.repository.indexGroup.resourceStates.length === 0 &&
                this.repository.mergeGroup.resourceStates.length === 0 &&
                this.repository.untrackedGroup.resourceStates.length === 0 &&
                this.repository.workingTreeGroup.resourceStates.length === 0
        };
    }
    dispose() {
        this.disposables = (0, util_1.dispose)(this.disposables);
    }
}
exports.ActionButtonCommand = ActionButtonCommand;
//# sourceMappingURL=actionButton.js.map