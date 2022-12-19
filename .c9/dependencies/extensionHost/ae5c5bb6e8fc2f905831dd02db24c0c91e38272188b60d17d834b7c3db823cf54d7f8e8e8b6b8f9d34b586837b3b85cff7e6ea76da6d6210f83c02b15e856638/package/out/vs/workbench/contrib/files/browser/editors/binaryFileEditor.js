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
define(["require", "exports", "vs/nls", "vs/workbench/browser/parts/editor/binaryEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/contrib/files/common/files", "vs/platform/storage/common/storage", "vs/platform/editor/common/editor", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, nls_1, binaryEditor_1, telemetry_1, themeService_1, fileEditorInput_1, files_1, storage_1, editor_1, editorResolverService_1, editor_2, diffEditorInput_1, instantiation_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BinaryFileEditor = void 0;
    /**
     * An implementation of editor for binary files that cannot be displayed.
     */
    let BinaryFileEditor = class BinaryFileEditor extends binaryEditor_1.BaseBinaryResourceEditor {
        constructor(telemetryService, themeService, editorResolverService, storageService, instantiationService, editorGroupService) {
            super(BinaryFileEditor.ID, {
                openInternal: (input, options) => this.openInternal(input, options)
            }, telemetryService, themeService, storageService, instantiationService);
            this.editorResolverService = editorResolverService;
            this.editorGroupService = editorGroupService;
        }
        async openInternal(input, options) {
            var _a, _b, _c, _d;
            if (input instanceof fileEditorInput_1.FileEditorInput && ((_a = this.group) === null || _a === void 0 ? void 0 : _a.activeEditor)) {
                // We operate on the active editor here to support re-opening
                // diff editors where `input` may just be one side of the
                // diff editor.
                // Since `openInternal` can only ever be selected from the
                // active editor of the group, this is a safe assumption.
                // (https://github.com/microsoft/vscode/issues/124222)
                const activeEditor = this.group.activeEditor;
                const untypedActiveEditor = activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.toUntyped();
                if (!untypedActiveEditor) {
                    return; // we need untyped editor support
                }
                // Try to let the user pick an editor
                let resolvedEditor = await this.editorResolverService.resolveEditor(Object.assign(Object.assign({}, untypedActiveEditor), { options: Object.assign(Object.assign({}, options), { override: editor_1.EditorResolution.PICK }) }), this.group);
                if (resolvedEditor === 2 /* ResolvedStatus.NONE */) {
                    resolvedEditor = undefined;
                }
                else if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                    return;
                }
                // If the result if a file editor, the user indicated to open
                // the binary file as text. As such we adjust the input for that.
                if ((0, editor_2.isEditorInputWithOptions)(resolvedEditor)) {
                    for (const editor of resolvedEditor.editor instanceof diffEditorInput_1.DiffEditorInput ? [resolvedEditor.editor.original, resolvedEditor.editor.modified] : [resolvedEditor.editor]) {
                        if (editor instanceof fileEditorInput_1.FileEditorInput) {
                            editor.setForceOpenAsText();
                            editor.setPreferredLanguageId(files_1.BINARY_TEXT_FILE_MODE); // https://github.com/microsoft/vscode/issues/131076
                        }
                    }
                }
                // Replace the active editor with the picked one
                await ((_b = this.group) !== null && _b !== void 0 ? _b : this.editorGroupService.activeGroup).replaceEditors([{
                        editor: activeEditor,
                        replacement: (_c = resolvedEditor === null || resolvedEditor === void 0 ? void 0 : resolvedEditor.editor) !== null && _c !== void 0 ? _c : input,
                        options: Object.assign({}, (_d = resolvedEditor === null || resolvedEditor === void 0 ? void 0 : resolvedEditor.options) !== null && _d !== void 0 ? _d : options)
                    }]);
            }
        }
        getTitle() {
            return this.input ? this.input.getName() : (0, nls_1.localize)('binaryFileEditor', "Binary File Viewer");
        }
    };
    BinaryFileEditor.ID = files_1.BINARY_FILE_EDITOR_ID;
    BinaryFileEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, editorResolverService_1.IEditorResolverService),
        __param(3, storage_1.IStorageService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, editorGroupsService_1.IEditorGroupsService)
    ], BinaryFileEditor);
    exports.BinaryFileEditor = BinaryFileEditor;
});
//# sourceMappingURL=binaryFileEditor.js.map