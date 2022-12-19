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
define(["require", "exports", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/abstractCodeEditorService", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/platform/instantiation/common/extensions", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor/editorOptions"], function (require, exports, editorBrowser_1, abstractCodeEditorService_1, themeService_1, editorService_1, codeEditorService_1, extensions_1, resources_1, configuration_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeEditorService = void 0;
    let CodeEditorService = class CodeEditorService extends abstractCodeEditorService_1.AbstractCodeEditorService {
        constructor(editorService, themeService, configurationService) {
            super(themeService);
            this.editorService = editorService;
            this.configurationService = configurationService;
        }
        getActiveCodeEditor() {
            var _a;
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                return activeTextEditorControl;
            }
            if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                return activeTextEditorControl.getModifiedEditor();
            }
            const activeControl = (_a = this.editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if ((0, editorBrowser_1.isCompositeEditor)(activeControl) && (0, editorBrowser_1.isCodeEditor)(activeControl.activeCodeEditor)) {
                return activeControl.activeCodeEditor;
            }
            return null;
        }
        async openCodeEditor(input, source, sideBySide) {
            var _a;
            // Special case: If the active editor is a diff editor and the request to open originates and
            // targets the modified side of it, we just apply the request there to prevent opening the modified
            // side as separate editor.
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            if (!sideBySide && // we need the current active group to be the target
                (0, editorBrowser_1.isDiffEditor)(activeTextEditorControl) && // we only support this for active text diff editors
                input.options && // we need options to apply
                input.resource && // we need a request resource to compare with
                source === activeTextEditorControl.getModifiedEditor() && // we need the source of this request to be the modified side of the diff editor
                activeTextEditorControl.getModel() && // we need a target model to compare with
                (0, resources_1.isEqual)(input.resource, (_a = activeTextEditorControl.getModel()) === null || _a === void 0 ? void 0 : _a.modified.uri) // we need the input resources to match with modified side
            ) {
                const targetEditor = activeTextEditorControl.getModifiedEditor();
                (0, editorOptions_1.applyTextEditorOptions)(input.options, targetEditor, 0 /* ScrollType.Smooth */);
                return targetEditor;
            }
            // Open using our normal editor service
            return this.doOpenCodeEditor(input, source, sideBySide);
        }
        async doOpenCodeEditor(input, source, sideBySide) {
            var _a, _b, _c, _d;
            // Special case: we want to detect the request to open an editor that
            // is different from the current one to decide whether the current editor
            // should be pinned or not. This ensures that the source of a navigation
            // is not being replaced by the target. An example is "Goto definition"
            // that otherwise would replace the editor everytime the user navigates.
            const enablePreviewFromCodeNavigation = (_b = (_a = this.configurationService.getValue().workbench) === null || _a === void 0 ? void 0 : _a.editor) === null || _b === void 0 ? void 0 : _b.enablePreviewFromCodeNavigation;
            if (!enablePreviewFromCodeNavigation && // we only need to do this if the configuration requires it
                source && // we need to know the origin of the navigation
                !((_c = input.options) === null || _c === void 0 ? void 0 : _c.pinned) && // we only need to look at preview editors that open
                !sideBySide && // we only need to care if editor opens in same group
                !(0, resources_1.isEqual)((_d = source.getModel()) === null || _d === void 0 ? void 0 : _d.uri, input.resource) // we only need to do this if the editor is about to change
            ) {
                for (const visiblePane of this.editorService.visibleEditorPanes) {
                    if ((0, editorBrowser_1.getCodeEditor)(visiblePane.getControl()) === source) {
                        visiblePane.group.pinEditor();
                        break;
                    }
                }
            }
            // Open as editor
            const control = await this.editorService.openEditor(input, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            if (control) {
                const widget = control.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(widget)) {
                    return widget;
                }
                if ((0, editorBrowser_1.isCompositeEditor)(widget) && (0, editorBrowser_1.isCodeEditor)(widget.activeCodeEditor)) {
                    return widget.activeCodeEditor;
                }
            }
            return null;
        }
    };
    CodeEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, themeService_1.IThemeService),
        __param(2, configuration_1.IConfigurationService)
    ], CodeEditorService);
    exports.CodeEditorService = CodeEditorService;
    (0, extensions_1.registerSingleton)(codeEditorService_1.ICodeEditorService, CodeEditorService, true);
});
//# sourceMappingURL=codeEditorService.js.map