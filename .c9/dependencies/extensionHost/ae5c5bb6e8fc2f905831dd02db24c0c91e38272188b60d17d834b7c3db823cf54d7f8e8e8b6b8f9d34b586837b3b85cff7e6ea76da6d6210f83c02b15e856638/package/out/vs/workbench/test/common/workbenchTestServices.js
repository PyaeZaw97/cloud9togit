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
define(["require", "exports", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/platform/workspace/test/common/testWorkspace", "vs/base/common/platform", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/product/common/product"], function (require, exports, path_1, resources_1, uri_1, event_1, configuration_1, testWorkspace_1, platform_1, storage_1, extensions_1, lifecycle_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestActivityService = exports.TestProductService = exports.TestExtensionService = exports.mock = exports.TestWorkingCopyFileService = exports.createFileStat = exports.TestWorkingCopy = exports.TestStorageService = exports.TestContextService = exports.TestTextResourcePropertiesService = void 0;
    let TestTextResourcePropertiesService = class TestTextResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n';
        }
    };
    TestTextResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TestTextResourcePropertiesService);
    exports.TestTextResourcePropertiesService = TestTextResourcePropertiesService;
    class TestContextService {
        constructor(workspace = testWorkspace_1.TestWorkspace, options = null) {
            this.workspace = workspace;
            this.options = options || Object.create(null);
            this._onDidChangeWorkspaceName = new event_1.Emitter();
            this._onWillChangeWorkspaceFolders = new event_1.Emitter();
            this._onDidChangeWorkspaceFolders = new event_1.Emitter();
            this._onDidChangeWorkbenchState = new event_1.Emitter();
        }
        get onDidChangeWorkspaceName() { return this._onDidChangeWorkspaceName.event; }
        get onWillChangeWorkspaceFolders() { return this._onWillChangeWorkspaceFolders.event; }
        get onDidChangeWorkspaceFolders() { return this._onDidChangeWorkspaceFolders.event; }
        get onDidChangeWorkbenchState() { return this._onDidChangeWorkbenchState.event; }
        getFolders() {
            return this.workspace ? this.workspace.folders : [];
        }
        getWorkbenchState() {
            if (this.workspace.configuration) {
                return 3 /* WorkbenchState.WORKSPACE */;
            }
            if (this.workspace.folders.length) {
                return 2 /* WorkbenchState.FOLDER */;
            }
            return 1 /* WorkbenchState.EMPTY */;
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        setWorkspace(workspace) {
            this.workspace = workspace;
        }
        getOptions() {
            return this.options;
        }
        updateOptions() { }
        isInsideWorkspace(resource) {
            if (resource && this.workspace) {
                return (0, resources_1.isEqualOrParent)(resource, this.workspace.folders[0].uri);
            }
            return false;
        }
        toResource(workspaceRelativePath) {
            return uri_1.URI.file((0, path_1.join)('C:\\', workspaceRelativePath));
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            return uri_1.URI.isUri(workspaceIdOrFolder) && (0, resources_1.isEqual)(this.workspace.folders[0].uri, workspaceIdOrFolder);
        }
    }
    exports.TestContextService = TestContextService;
    class TestStorageService extends storage_1.InMemoryStorageService {
        emitWillSaveState(reason) {
            super.emitWillSaveState(reason);
        }
    }
    exports.TestStorageService = TestStorageService;
    class TestWorkingCopy extends lifecycle_1.Disposable {
        constructor(resource, isDirty = false, typeId = 'testWorkingCopyType') {
            super();
            this.resource = resource;
            this.typeId = typeId;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this.capabilities = 0 /* WorkingCopyCapabilities.None */;
            this.name = (0, resources_1.basename)(this.resource);
            this.dirty = false;
            this.dirty = isDirty;
        }
        setDirty(dirty) {
            if (this.dirty !== dirty) {
                this.dirty = dirty;
                this._onDidChangeDirty.fire();
            }
        }
        setContent(content) {
            this._onDidChangeContent.fire();
        }
        isDirty() {
            return this.dirty;
        }
        async save(options, stat) {
            var _a;
            this._onDidSave.fire({ reason: (_a = options === null || options === void 0 ? void 0 : options.reason) !== null && _a !== void 0 ? _a : 1 /* SaveReason.EXPLICIT */, stat: stat !== null && stat !== void 0 ? stat : createFileStat(this.resource), source: options === null || options === void 0 ? void 0 : options.source });
            return true;
        }
        async revert(options) {
            this.setDirty(false);
        }
        async backup(token) {
            return {};
        }
    }
    exports.TestWorkingCopy = TestWorkingCopy;
    function createFileStat(resource, readonly = false) {
        return {
            resource,
            etag: Date.now().toString(),
            mtime: Date.now(),
            ctime: Date.now(),
            size: 42,
            isFile: true,
            isDirectory: false,
            isSymbolicLink: false,
            readonly,
            name: (0, resources_1.basename)(resource),
            children: undefined
        };
    }
    exports.createFileStat = createFileStat;
    class TestWorkingCopyFileService {
        constructor() {
            this.onWillRunWorkingCopyFileOperation = event_1.Event.None;
            this.onDidFailWorkingCopyFileOperation = event_1.Event.None;
            this.onDidRunWorkingCopyFileOperation = event_1.Event.None;
            this.hasSaveParticipants = false;
        }
        addFileOperationParticipant(participant) { return lifecycle_1.Disposable.None; }
        addSaveParticipant(participant) { return lifecycle_1.Disposable.None; }
        async runSaveParticipants(workingCopy, context, token) { }
        async delete(operations, token, undoInfo) { }
        registerWorkingCopyProvider(provider) { return lifecycle_1.Disposable.None; }
        getDirty(resource) { return []; }
        create(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        createFolder(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        move(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        copy(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
    }
    exports.TestWorkingCopyFileService = TestWorkingCopyFileService;
    function mock() {
        return function () { };
    }
    exports.mock = mock;
    class TestExtensionService extends extensions_1.NullExtensionService {
    }
    exports.TestExtensionService = TestExtensionService;
    exports.TestProductService = Object.assign({ _serviceBrand: undefined }, product_1.default);
    class TestActivityService {
        showViewContainerActivity(viewContainerId, badge) {
            return this;
        }
        showViewActivity(viewId, badge) {
            return this;
        }
        showAccountsActivity(activity) {
            return this;
        }
        showGlobalActivity(activity) {
            return this;
        }
        dispose() { }
    }
    exports.TestActivityService = TestActivityService;
});
//# sourceMappingURL=workbenchTestServices.js.map