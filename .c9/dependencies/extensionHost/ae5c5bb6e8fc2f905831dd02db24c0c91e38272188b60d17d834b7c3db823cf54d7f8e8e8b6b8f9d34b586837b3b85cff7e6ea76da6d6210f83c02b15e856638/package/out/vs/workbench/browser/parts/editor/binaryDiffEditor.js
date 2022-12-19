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
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/binaryEditor", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls_1, editor_1, telemetry_1, themeService_1, sideBySideEditor_1, instantiation_1, binaryEditor_1, storage_1, configuration_1, textResourceConfiguration_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BinaryResourceDiffEditor = void 0;
    /**
     * An implementation of editor for diffing binary files like images or videos.
     */
    let BinaryResourceDiffEditor = class BinaryResourceDiffEditor extends sideBySideEditor_1.SideBySideEditor {
        constructor(telemetryService, instantiationService, themeService, storageService, configurationService, textResourceConfigurationService, editorService, editorGroupService) {
            super(telemetryService, instantiationService, themeService, storageService, configurationService, textResourceConfigurationService, editorService, editorGroupService);
        }
        getMetadata() {
            const primary = this.getPrimaryEditorPane();
            const secondary = this.getSecondaryEditorPane();
            if (primary instanceof binaryEditor_1.BaseBinaryResourceEditor && secondary instanceof binaryEditor_1.BaseBinaryResourceEditor) {
                return (0, nls_1.localize)('metadataDiff', "{0} ↔ {1}", secondary.getMetadata(), primary.getMetadata());
            }
            return undefined;
        }
    };
    BinaryResourceDiffEditor.ID = editor_1.BINARY_DIFF_EDITOR_ID;
    BinaryResourceDiffEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService)
    ], BinaryResourceDiffEditor);
    exports.BinaryResourceDiffEditor = BinaryResourceDiffEditor;
});
//# sourceMappingURL=binaryDiffEditor.js.map