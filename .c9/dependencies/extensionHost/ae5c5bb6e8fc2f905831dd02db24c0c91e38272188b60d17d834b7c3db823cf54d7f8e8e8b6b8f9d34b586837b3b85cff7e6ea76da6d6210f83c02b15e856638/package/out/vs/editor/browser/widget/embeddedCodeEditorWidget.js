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
define(["require", "exports", "vs/base/common/objects", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/browser/widget/diffEditorWidget", "vs/editor/common/services/editorWorker", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/theme/common/themeService", "vs/platform/accessibility/common/accessibility", "vs/platform/contextview/browser/contextView", "vs/platform/clipboard/common/clipboardService", "vs/platform/progress/common/progress", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures"], function (require, exports, objects, codeEditorService_1, codeEditorWidget_1, diffEditorWidget_1, editorWorker_1, commands_1, contextkey_1, instantiation_1, notification_1, themeService_1, accessibility_1, contextView_1, clipboardService_1, progress_1, languageConfigurationRegistry_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmbeddedDiffEditorWidget = exports.EmbeddedCodeEditorWidget = void 0;
    let EmbeddedCodeEditorWidget = class EmbeddedCodeEditorWidget extends codeEditorWidget_1.CodeEditorWidget {
        constructor(domElement, options, parentEditor, instantiationService, codeEditorService, commandService, contextKeyService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService) {
            super(domElement, Object.assign(Object.assign({}, parentEditor.getRawOptions()), { overflowWidgetsDomNode: parentEditor.getOverflowWidgetsDomNode() }), {}, instantiationService, codeEditorService, commandService, contextKeyService, themeService, notificationService, accessibilityService, languageConfigurationService, languageFeaturesService);
            this._parentEditor = parentEditor;
            this._overwriteOptions = options;
            // Overwrite parent's options
            super.updateOptions(this._overwriteOptions);
            this._register(parentEditor.onDidChangeConfiguration((e) => this._onParentConfigurationChanged(e)));
        }
        getParentEditor() {
            return this._parentEditor;
        }
        _onParentConfigurationChanged(e) {
            super.updateOptions(this._parentEditor.getRawOptions());
            super.updateOptions(this._overwriteOptions);
        }
        updateOptions(newOptions) {
            objects.mixin(this._overwriteOptions, newOptions, true);
            super.updateOptions(this._overwriteOptions);
        }
    };
    EmbeddedCodeEditorWidget = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, commands_1.ICommandService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, themeService_1.IThemeService),
        __param(8, notification_1.INotificationService),
        __param(9, accessibility_1.IAccessibilityService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(11, languageFeatures_1.ILanguageFeaturesService)
    ], EmbeddedCodeEditorWidget);
    exports.EmbeddedCodeEditorWidget = EmbeddedCodeEditorWidget;
    let EmbeddedDiffEditorWidget = class EmbeddedDiffEditorWidget extends diffEditorWidget_1.DiffEditorWidget {
        constructor(domElement, options, parentEditor, editorWorkerService, contextKeyService, instantiationService, codeEditorService, themeService, notificationService, contextMenuService, clipboardService, editorProgressService) {
            super(domElement, parentEditor.getRawOptions(), {}, clipboardService, editorWorkerService, contextKeyService, instantiationService, codeEditorService, themeService, notificationService, contextMenuService, editorProgressService);
            this._parentEditor = parentEditor;
            this._overwriteOptions = options;
            // Overwrite parent's options
            super.updateOptions(this._overwriteOptions);
            this._register(parentEditor.onDidChangeConfiguration(e => this._onParentConfigurationChanged(e)));
        }
        getParentEditor() {
            return this._parentEditor;
        }
        _onParentConfigurationChanged(e) {
            super.updateOptions(this._parentEditor.getRawOptions());
            super.updateOptions(this._overwriteOptions);
        }
        updateOptions(newOptions) {
            objects.mixin(this._overwriteOptions, newOptions, true);
            super.updateOptions(this._overwriteOptions);
        }
    };
    EmbeddedDiffEditorWidget = __decorate([
        __param(3, editorWorker_1.IEditorWorkerService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, codeEditorService_1.ICodeEditorService),
        __param(7, themeService_1.IThemeService),
        __param(8, notification_1.INotificationService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, clipboardService_1.IClipboardService),
        __param(11, progress_1.IEditorProgressService)
    ], EmbeddedDiffEditorWidget);
    exports.EmbeddedDiffEditorWidget = EmbeddedDiffEditorWidget;
});
//# sourceMappingURL=embeddedCodeEditorWidget.js.map