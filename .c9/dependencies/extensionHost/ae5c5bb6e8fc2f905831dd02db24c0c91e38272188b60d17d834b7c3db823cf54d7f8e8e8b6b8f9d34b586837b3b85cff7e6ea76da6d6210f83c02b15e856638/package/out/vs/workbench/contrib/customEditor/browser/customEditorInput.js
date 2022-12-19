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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uuid", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/untitled/common/untitledTextEditorService"], function (require, exports, buffer_1, network_1, path_1, resources_1, types_1, uuid_1, dialogs_1, files_1, instantiation_1, label_1, undoRedo_1, customEditor_1, webview_1, webviewWorkbenchService_1, untitledTextEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorInput = void 0;
    let CustomEditorInput = class CustomEditorInput extends webviewWorkbenchService_1.LazilyResolvedWebviewEditorInput {
        constructor(resource, viewType, id, webview, options, webviewWorkbenchService, instantiationService, labelService, customEditorService, fileDialogService, undoRedoService, fileService) {
            super(id, viewType, '', webview, webviewWorkbenchService);
            this.instantiationService = instantiationService;
            this.labelService = labelService;
            this.customEditorService = customEditorService;
            this.fileDialogService = fileDialogService;
            this.undoRedoService = undoRedoService;
            this.fileService = fileService;
            this._shortDescription = undefined;
            this._mediumDescription = undefined;
            this._longDescription = undefined;
            this._shortTitle = undefined;
            this._mediumTitle = undefined;
            this._longTitle = undefined;
            this._editorResource = resource;
            this.oldResource = options.oldResource;
            this._defaultDirtyState = options.startsDirty;
            this._backupId = options.backupId;
            this._untitledDocumentData = options.untitledDocumentData;
            this.registerListeners();
        }
        static create(instantiationService, resource, viewType, group, options) {
            return instantiationService.invokeFunction(accessor => {
                // If it's an untitled file we must populate the untitledDocumentData
                const untitledString = accessor.get(untitledTextEditorService_1.IUntitledTextEditorService).getValue(resource);
                let untitledDocumentData = untitledString ? buffer_1.VSBuffer.fromString(untitledString) : undefined;
                const id = (0, uuid_1.generateUuid)();
                const webview = accessor.get(webview_1.IWebviewService).createWebviewOverlay(id, { customClasses: options === null || options === void 0 ? void 0 : options.customClasses }, {}, undefined);
                const input = instantiationService.createInstance(CustomEditorInput, resource, viewType, id, webview, { untitledDocumentData: untitledDocumentData, oldResource: options === null || options === void 0 ? void 0 : options.oldResource });
                if (typeof group !== 'undefined') {
                    input.updateGroup(group);
                }
                return input;
            });
        }
        get resource() { return this._editorResource; }
        registerListeners() {
            // Clear our labels on certain label related events
            this._register(this.labelService.onDidChangeFormatters(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onLabelEvent(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onLabelEvent(e.scheme)));
        }
        onLabelEvent(scheme) {
            if (scheme === this.resource.scheme) {
                this.updateLabel();
            }
        }
        updateLabel() {
            // Clear any cached labels from before
            this._shortDescription = undefined;
            this._mediumDescription = undefined;
            this._longDescription = undefined;
            this._shortTitle = undefined;
            this._mediumTitle = undefined;
            this._longTitle = undefined;
            // Trigger recompute of label
            this._onDidChangeLabel.fire();
        }
        get typeId() {
            return CustomEditorInput.typeId;
        }
        get editorId() {
            return this.viewType;
        }
        get capabilities() {
            var _a;
            let capabilities = 0 /* EditorInputCapabilities.None */;
            capabilities |= 128 /* EditorInputCapabilities.CanDropIntoEditor */;
            if (!((_a = this.customEditorService.getCustomEditorCapabilities(this.viewType)) === null || _a === void 0 ? void 0 : _a.supportsMultipleEditorsPerDocument)) {
                capabilities |= 8 /* EditorInputCapabilities.Singleton */;
            }
            if (this._modelRef) {
                if (this._modelRef.object.isReadonly()) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            else {
                if (this.fileService.hasCapability(this.resource, 2048 /* FileSystemProviderCapabilities.Readonly */)) {
                    capabilities |= 2 /* EditorInputCapabilities.Readonly */;
                }
            }
            if (this.resource.scheme === network_1.Schemas.untitled) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            return capabilities;
        }
        getName() {
            return (0, path_1.basename)(this.labelService.getUriLabel(this.resource));
        }
        getDescription(verbosity = 1 /* Verbosity.MEDIUM */) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.shortDescription;
                case 2 /* Verbosity.LONG */:
                    return this.longDescription;
                case 1 /* Verbosity.MEDIUM */:
                default:
                    return this.mediumDescription;
            }
        }
        get shortDescription() {
            if (typeof this._shortDescription !== 'string') {
                this._shortDescription = this.labelService.getUriBasenameLabel((0, resources_1.dirname)(this.resource));
            }
            return this._shortDescription;
        }
        get mediumDescription() {
            if (typeof this._mediumDescription !== 'string') {
                this._mediumDescription = this.labelService.getUriLabel((0, resources_1.dirname)(this.resource), { relative: true });
            }
            return this._mediumDescription;
        }
        get longDescription() {
            if (typeof this._longDescription !== 'string') {
                this._longDescription = this.labelService.getUriLabel((0, resources_1.dirname)(this.resource));
            }
            return this._longDescription;
        }
        get shortTitle() {
            if (typeof this._shortTitle !== 'string') {
                this._shortTitle = this.getName();
            }
            return this._shortTitle;
        }
        get mediumTitle() {
            if (typeof this._mediumTitle !== 'string') {
                this._mediumTitle = this.labelService.getUriLabel(this.resource, { relative: true });
            }
            return this._mediumTitle;
        }
        get longTitle() {
            if (typeof this._longTitle !== 'string') {
                this._longTitle = this.labelService.getUriLabel(this.resource);
            }
            return this._longTitle;
        }
        getTitle(verbosity) {
            switch (verbosity) {
                case 0 /* Verbosity.SHORT */:
                    return this.shortTitle;
                case 2 /* Verbosity.LONG */:
                    return this.longTitle;
                default:
                case 1 /* Verbosity.MEDIUM */:
                    return this.mediumTitle;
            }
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            return this === other || (other instanceof CustomEditorInput
                && this.viewType === other.viewType
                && (0, resources_1.isEqual)(this.resource, other.resource));
        }
        copy() {
            return CustomEditorInput.create(this.instantiationService, this.resource, this.viewType, this.group, this.webview.options);
        }
        isDirty() {
            if (!this._modelRef) {
                return !!this._defaultDirtyState;
            }
            return this._modelRef.object.isDirty();
        }
        async save(groupId, options) {
            if (!this._modelRef) {
                return undefined;
            }
            const target = await this._modelRef.object.saveCustomEditor(options);
            if (!target) {
                return undefined; // save cancelled
            }
            // Different URIs == untyped input returned to allow resolver to possibly resolve to a different editor type
            if (!(0, resources_1.isEqual)(target, this.resource)) {
                return { resource: target };
            }
            return this;
        }
        async saveAs(groupId, options) {
            var _a;
            if (!this._modelRef) {
                return undefined;
            }
            const dialogPath = this._editorResource;
            const target = await this.fileDialogService.pickFileToSave(dialogPath, options === null || options === void 0 ? void 0 : options.availableFileSystems);
            if (!target) {
                return undefined; // save cancelled
            }
            if (!await this._modelRef.object.saveCustomEditorAs(this._editorResource, target, options)) {
                return undefined;
            }
            return (_a = (await this.rename(groupId, target))) === null || _a === void 0 ? void 0 : _a.editor;
        }
        async revert(group, options) {
            if (this._modelRef) {
                return this._modelRef.object.revert(options);
            }
            this._defaultDirtyState = false;
            this._onDidChangeDirty.fire();
        }
        async resolve() {
            await super.resolve();
            if (this.isDisposed()) {
                return null;
            }
            if (!this._modelRef) {
                const oldCapabilities = this.capabilities;
                this._modelRef = this._register((0, types_1.assertIsDefined)(await this.customEditorService.models.tryRetain(this.resource, this.viewType)));
                this._register(this._modelRef.object.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
                this._register(this._modelRef.object.onDidChangeReadonly(() => this._onDidChangeCapabilities.fire()));
                // If we're loading untitled file data we should ensure it's dirty
                if (this._untitledDocumentData) {
                    this._defaultDirtyState = true;
                }
                if (this.isDirty()) {
                    this._onDidChangeDirty.fire();
                }
                if (this.capabilities !== oldCapabilities) {
                    this._onDidChangeCapabilities.fire();
                }
            }
            return null;
        }
        async rename(group, newResource) {
            // We return an untyped editor input which can then be resolved in the editor service
            return { editor: { resource: newResource } };
        }
        undo() {
            (0, types_1.assertIsDefined)(this._modelRef);
            return this.undoRedoService.undo(this.resource);
        }
        redo() {
            (0, types_1.assertIsDefined)(this._modelRef);
            return this.undoRedoService.redo(this.resource);
        }
        onMove(handler) {
            // TODO: Move this to the service
            this._moveHandler = handler;
        }
        transfer(other) {
            if (!super.transfer(other)) {
                return;
            }
            other._moveHandler = this._moveHandler;
            this._moveHandler = undefined;
            return other;
        }
        get backupId() {
            if (this._modelRef) {
                return this._modelRef.object.backupId;
            }
            return this._backupId;
        }
        get untitledDocumentData() {
            return this._untitledDocumentData;
        }
        toUntyped() {
            return {
                resource: this.resource,
                options: {
                    override: this.viewType
                }
            };
        }
    };
    CustomEditorInput.typeId = 'workbench.editors.webviewEditor';
    CustomEditorInput = __decorate([
        __param(5, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, label_1.ILabelService),
        __param(8, customEditor_1.ICustomEditorService),
        __param(9, dialogs_1.IFileDialogService),
        __param(10, undoRedo_1.IUndoRedoService),
        __param(11, files_1.IFileService)
    ], CustomEditorInput);
    exports.CustomEditorInput = CustomEditorInput;
});
//# sourceMappingURL=customEditorInput.js.map