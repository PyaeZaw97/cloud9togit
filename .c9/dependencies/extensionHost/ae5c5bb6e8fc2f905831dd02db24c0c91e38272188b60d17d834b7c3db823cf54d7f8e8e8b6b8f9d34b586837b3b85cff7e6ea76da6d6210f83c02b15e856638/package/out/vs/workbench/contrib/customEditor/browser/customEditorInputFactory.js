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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInputSerializer", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/common/workingCopyEditorService"], function (require, exports, lifecycle_1, network_1, resources_1, uri_1, instantiation_1, customEditorInput_1, customEditor_1, notebookEditorInput_1, webview_1, webviewEditorInputSerializer_1, webviewWorkbenchService_1, editorResolverService_1, workingCopyBackup_1, workingCopyEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ComplexCustomWorkingCopyEditorHandler = exports.CustomEditorInputSerializer = void 0;
    let CustomEditorInputSerializer = class CustomEditorInputSerializer extends webviewEditorInputSerializer_1.WebviewEditorInputSerializer {
        constructor(webviewWorkbenchService, _instantiationService, _webviewService, _editorResolverService) {
            super(webviewWorkbenchService);
            this._instantiationService = _instantiationService;
            this._webviewService = _webviewService;
            this._editorResolverService = _editorResolverService;
        }
        serialize(input) {
            const dirty = input.isDirty();
            const data = Object.assign(Object.assign({}, this.toJson(input)), { editorResource: input.resource.toJSON(), dirty, backupId: dirty ? input.backupId : undefined });
            try {
                return JSON.stringify(data);
            }
            catch (_a) {
                return undefined;
            }
        }
        fromJson(data) {
            return Object.assign(Object.assign({}, super.fromJson(data)), { editorResource: uri_1.URI.from(data.editorResource), dirty: data.dirty });
        }
        deserialize(_instantiationService, serializedEditorInput) {
            const data = this.fromJson(JSON.parse(serializedEditorInput));
            if (data.viewType === 'jupyter.notebook.ipynb') {
                const editorAssociation = this._editorResolverService.getAssociationsForResource(data.editorResource);
                if (!editorAssociation.find(association => association.viewType === 'jupyter.notebook.ipynb')) {
                    return notebookEditorInput_1.NotebookEditorInput.create(this._instantiationService, data.editorResource, 'jupyter-notebook', { _backupId: data.backupId, startDirty: data.dirty });
                }
            }
            const webview = reviveWebview(this._webviewService, data);
            const customInput = this._instantiationService.createInstance(customEditorInput_1.CustomEditorInput, data.editorResource, data.viewType, data.id, webview, { startsDirty: data.dirty, backupId: data.backupId });
            if (typeof data.group === 'number') {
                customInput.updateGroup(data.group);
            }
            return customInput;
        }
    };
    CustomEditorInputSerializer.ID = customEditorInput_1.CustomEditorInput.typeId;
    CustomEditorInputSerializer = __decorate([
        __param(0, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, webview_1.IWebviewService),
        __param(3, editorResolverService_1.IEditorResolverService)
    ], CustomEditorInputSerializer);
    exports.CustomEditorInputSerializer = CustomEditorInputSerializer;
    function reviveWebview(webviewService, data) {
        const webview = webviewService.createWebviewOverlay(data.id, {
            purpose: "customEditor" /* WebviewContentPurpose.CustomEditor */,
            enableFindWidget: data.webviewOptions.enableFindWidget,
            retainContextWhenHidden: data.webviewOptions.retainContextWhenHidden
        }, data.contentOptions, data.extension);
        webview.state = data.state;
        return webview;
    }
    let ComplexCustomWorkingCopyEditorHandler = class ComplexCustomWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        constructor(_instantiationService, _workingCopyEditorService, _workingCopyBackupService, _editorResolverService, _webviewService, _customEditorService // DO NOT REMOVE (needed on startup to register overrides properly)
        ) {
            super();
            this._instantiationService = _instantiationService;
            this._workingCopyEditorService = _workingCopyEditorService;
            this._workingCopyBackupService = _workingCopyBackupService;
            this._editorResolverService = _editorResolverService;
            this._webviewService = _webviewService;
            this._installHandler();
        }
        _installHandler() {
            this._register(this._workingCopyEditorService.registerHandler({
                handles: workingCopy => workingCopy.resource.scheme === network_1.Schemas.vscodeCustomEditor,
                isOpen: (workingCopy, editor) => {
                    if (workingCopy.resource.authority === 'jupyter-notebook-ipynb' && editor instanceof notebookEditorInput_1.NotebookEditorInput) {
                        try {
                            const data = JSON.parse(workingCopy.resource.query);
                            const workingCopyResource = uri_1.URI.from(data);
                            return (0, resources_1.isEqual)(workingCopyResource, editor.resource);
                        }
                        catch (_a) {
                            return false;
                        }
                    }
                    if (!(editor instanceof customEditorInput_1.CustomEditorInput)) {
                        return false;
                    }
                    if (workingCopy.resource.authority !== editor.viewType.replace(/[^a-z0-9\-_]/gi, '-').toLowerCase()) {
                        return false;
                    }
                    // The working copy stores the uri of the original resource as its query param
                    try {
                        const data = JSON.parse(workingCopy.resource.query);
                        const workingCopyResource = uri_1.URI.from(data);
                        return (0, resources_1.isEqual)(workingCopyResource, editor.resource);
                    }
                    catch (_b) {
                        return false;
                    }
                },
                createEditor: async (workingCopy) => {
                    var _a, _b;
                    const backup = await this._workingCopyBackupService.resolve(workingCopy);
                    if (!(backup === null || backup === void 0 ? void 0 : backup.meta)) {
                        throw new Error(`No backup found for custom editor: ${workingCopy.resource}`);
                    }
                    const backupData = backup.meta;
                    if (backupData.viewType === 'jupyter.notebook.ipynb') {
                        const editorAssociation = this._editorResolverService.getAssociationsForResource(uri_1.URI.revive(backupData.editorResource));
                        if (!editorAssociation.find(association => association.viewType === 'jupyter.notebook.ipynb')) {
                            return notebookEditorInput_1.NotebookEditorInput.create(this._instantiationService, uri_1.URI.revive(backupData.editorResource), 'jupyter-notebook', { startDirty: !!backupData.backupId, _backupId: backupData.backupId, _workingCopy: workingCopy });
                        }
                    }
                    const id = backupData.webview.id;
                    const extension = (0, webviewEditorInputSerializer_1.reviveWebviewExtensionDescription)((_a = backupData.extension) === null || _a === void 0 ? void 0 : _a.id, (_b = backupData.extension) === null || _b === void 0 ? void 0 : _b.location);
                    const webview = reviveWebview(this._webviewService, {
                        id,
                        webviewOptions: (0, webviewEditorInputSerializer_1.restoreWebviewOptions)(backupData.webview.options),
                        contentOptions: (0, webviewEditorInputSerializer_1.restoreWebviewContentOptions)(backupData.webview.options),
                        state: backupData.webview.state,
                        extension,
                    });
                    const editor = this._instantiationService.createInstance(customEditorInput_1.CustomEditorInput, uri_1.URI.revive(backupData.editorResource), backupData.viewType, id, webview, { backupId: backupData.backupId });
                    editor.updateGroup(0);
                    return editor;
                }
            }));
        }
    };
    ComplexCustomWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(2, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(3, editorResolverService_1.IEditorResolverService),
        __param(4, webview_1.IWebviewService),
        __param(5, customEditor_1.ICustomEditorService)
    ], ComplexCustomWorkingCopyEditorHandler);
    exports.ComplexCustomWorkingCopyEditorHandler = ComplexCustomWorkingCopyEditorHandler;
});
//# sourceMappingURL=customEditorInputFactory.js.map