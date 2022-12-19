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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/editor/contrib/quickAccess/browser/gotoLineQuickAccess", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/platform/configuration/common/configuration", "vs/platform/actions/common/actions", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, nls_1, quickInput_1, editorService_1, gotoLineQuickAccess_1, platform_1, quickAccess_1, configuration_1, actions_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoLineQuickAccessProvider = void 0;
    let GotoLineQuickAccessProvider = class GotoLineQuickAccessProvider extends gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider {
        constructor(editorService, editorGroupService, configurationService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.onDidActiveTextEditorControlChange = this.editorService.onDidActiveEditorChange;
        }
        get configuration() {
            var _a;
            const editorConfig = (_a = this.configurationService.getValue().workbench) === null || _a === void 0 ? void 0 : _a.editor;
            return {
                openEditorPinned: !(editorConfig === null || editorConfig === void 0 ? void 0 : editorConfig.enablePreviewFromQuickOpen) || !(editorConfig === null || editorConfig === void 0 ? void 0 : editorConfig.enablePreview)
            };
        }
        get activeTextEditorControl() {
            return this.editorService.activeTextEditorControl;
        }
        gotoLocation(context, options) {
            var _a;
            // Check for sideBySide use
            if ((options.keyMods.alt || (this.configuration.openEditorPinned && options.keyMods.ctrlCmd) || options.forceSideBySide) && this.editorService.activeEditor) {
                (_a = context.restoreViewState) === null || _a === void 0 ? void 0 : _a.call(context); // since we open to the side, restore view state in this editor
                const editorOptions = {
                    selection: options.range,
                    pinned: options.keyMods.ctrlCmd || this.configuration.openEditorPinned,
                    preserveFocus: options.preserveFocus
                };
                this.editorGroupService.sideGroup.openEditor(this.editorService.activeEditor, editorOptions);
            }
            // Otherwise let parent handle it
            else {
                super.gotoLocation(context, options);
            }
        }
    };
    GotoLineQuickAccessProvider = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, configuration_1.IConfigurationService)
    ], GotoLineQuickAccessProvider);
    exports.GotoLineQuickAccessProvider = GotoLineQuickAccessProvider;
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: GotoLineQuickAccessProvider,
        prefix: gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider.PREFIX,
        placeholder: (0, nls_1.localize)('gotoLineQuickAccessPlaceholder', "Type the line number and optional column to go to (e.g. 42:5 for line 42 and column 5)."),
        helpEntries: [{ description: (0, nls_1.localize)('gotoLineQuickAccess', "Go to Line/Column"), needsEditor: true }]
    });
    class GotoLineAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.gotoLine',
                title: { value: (0, nls_1.localize)('gotoLine', "Go to Line/Column..."), original: 'Go to Line/Column...' },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: null,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 37 /* KeyCode.KeyG */ }
                }
            });
        }
        async run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(GotoLineQuickAccessProvider.PREFIX);
        }
    }
    (0, actions_1.registerAction2)(GotoLineAction);
});
//# sourceMappingURL=gotoLineQuickAccess.js.map