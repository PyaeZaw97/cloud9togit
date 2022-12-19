/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWorkspaceTrustRequestService = exports.TestWorkspaceTrustManagementService = exports.TestWorkspaceTrustEnablementService = void 0;
    class TestWorkspaceTrustEnablementService {
        constructor(isEnabled = true) {
            this.isEnabled = isEnabled;
        }
        isWorkspaceTrustEnabled() {
            return this.isEnabled;
        }
    }
    exports.TestWorkspaceTrustEnablementService = TestWorkspaceTrustEnablementService;
    class TestWorkspaceTrustManagementService {
        constructor(trusted = true) {
            this.trusted = trusted;
            this._onDidChangeTrust = new event_1.Emitter();
            this.onDidChangeTrust = this._onDidChangeTrust.event;
            this._onDidChangeTrustedFolders = new event_1.Emitter();
            this.onDidChangeTrustedFolders = this._onDidChangeTrustedFolders.event;
            this._onDidInitiateWorkspaceTrustRequestOnStartup = new event_1.Emitter();
            this.onDidInitiateWorkspaceTrustRequestOnStartup = this._onDidInitiateWorkspaceTrustRequestOnStartup.event;
        }
        get acceptsOutOfWorkspaceFiles() {
            throw new Error('Method not implemented.');
        }
        set acceptsOutOfWorkspaceFiles(value) {
            throw new Error('Method not implemented.');
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            throw new Error('Method not implemented.');
        }
        getTrustedUris() {
            throw new Error('Method not implemented.');
        }
        setParentFolderTrust(trusted) {
            throw new Error('Method not implemented.');
        }
        getUriTrustInfo(uri) {
            throw new Error('Method not implemented.');
        }
        async setTrustedUris(folders) {
            throw new Error('Method not implemented.');
        }
        async setUrisTrust(uris, trusted) {
            throw new Error('Method not implemented.');
        }
        canSetParentFolderTrust() {
            throw new Error('Method not implemented.');
        }
        canSetWorkspaceTrust() {
            throw new Error('Method not implemented.');
        }
        isWorkspaceTrusted() {
            return this.trusted;
        }
        isWorkspaceTrustForced() {
            return false;
        }
        get workspaceTrustInitialized() {
            return Promise.resolve();
        }
        get workspaceResolved() {
            return Promise.resolve();
        }
        async setWorkspaceTrust(trusted) {
            if (this.trusted !== trusted) {
                this.trusted = trusted;
                this._onDidChangeTrust.fire(this.trusted);
            }
        }
    }
    exports.TestWorkspaceTrustManagementService = TestWorkspaceTrustManagementService;
    class TestWorkspaceTrustRequestService {
        constructor(_trusted) {
            this._trusted = _trusted;
            this._onDidInitiateOpenFilesTrustRequest = new event_1.Emitter();
            this.onDidInitiateOpenFilesTrustRequest = this._onDidInitiateOpenFilesTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequest = new event_1.Emitter();
            this.onDidInitiateWorkspaceTrustRequest = this._onDidInitiateWorkspaceTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequestOnStartup = new event_1.Emitter();
            this.onDidInitiateWorkspaceTrustRequestOnStartup = this._onDidInitiateWorkspaceTrustRequestOnStartup.event;
            this.requestOpenUrisHandler = async (uris) => {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            };
        }
        requestOpenFilesTrust(uris) {
            return this.requestOpenUrisHandler(uris);
        }
        async completeOpenFilesTrustRequest(result, saveResponse) {
            throw new Error('Method not implemented.');
        }
        cancelWorkspaceTrustRequest() {
            throw new Error('Method not implemented.');
        }
        async completeWorkspaceTrustRequest(trusted) {
            throw new Error('Method not implemented.');
        }
        async requestWorkspaceTrust(options) {
            return this._trusted;
        }
        requestWorkspaceTrustOnStartup() {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestWorkspaceTrustRequestService = TestWorkspaceTrustRequestService;
});
//# sourceMappingURL=testWorkspaceTrustService.js.map