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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/workbench/common/editor/binaryEditorModel", "vs/platform/storage/common/storage", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/editorPlaceholder"], function (require, exports, nls_1, event_1, binaryEditorModel_1, storage_1, files_1, instantiation_1, editorPlaceholder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseBinaryResourceEditor = void 0;
    /*
     * This class is only intended to be subclassed and not instantiated.
     */
    let BaseBinaryResourceEditor = class BaseBinaryResourceEditor extends editorPlaceholder_1.EditorPlaceholder {
        constructor(id, callbacks, telemetryService, themeService, storageService, instantiationService) {
            super(id, telemetryService, themeService, storageService, instantiationService);
            this.callbacks = callbacks;
            this._onDidChangeMetadata = this._register(new event_1.Emitter());
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidOpenInPlace = this._register(new event_1.Emitter());
            this.onDidOpenInPlace = this._onDidOpenInPlace.event;
        }
        getTitle() {
            return this.input ? this.input.getName() : (0, nls_1.localize)('binaryEditor', "Binary Viewer");
        }
        async getContents(input, options) {
            const model = await input.resolve();
            // Assert Model instance
            if (!(model instanceof binaryEditorModel_1.BinaryEditorModel)) {
                throw new Error('Unable to open file as binary');
            }
            // Update metadata
            const size = model.getSize();
            this.handleMetadataChanged(typeof size === 'number' ? files_1.ByteSize.formatSize(size) : '');
            return {
                icon: '$(warning)',
                label: (0, nls_1.localize)('binaryError', "The file is not displayed in the editor because it is either binary or uses an unsupported text encoding."),
                actions: [
                    {
                        label: (0, nls_1.localize)('openAnyway', "Open Anyway"),
                        run: async () => {
                            // Open in place
                            await this.callbacks.openInternal(input, options);
                            // Signal to listeners that the binary editor has been opened in-place
                            this._onDidOpenInPlace.fire();
                        }
                    }
                ]
            };
        }
        handleMetadataChanged(meta) {
            this.metadata = meta;
            this._onDidChangeMetadata.fire();
        }
        getMetadata() {
            return this.metadata;
        }
    };
    BaseBinaryResourceEditor = __decorate([
        __param(4, storage_1.IStorageService),
        __param(5, instantiation_1.IInstantiationService)
    ], BaseBinaryResourceEditor);
    exports.BaseBinaryResourceEditor = BaseBinaryResourceEditor;
});
//# sourceMappingURL=binaryEditor.js.map