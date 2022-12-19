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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/common/contributions"], function (require, exports, nls_1, platform_1, actions_1, configuration_1, contextkey_1, platform_2, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMultiCursorModifierAction = void 0;
    class ToggleMultiCursorModifierAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleMultiCursorModifierAction.ID,
                title: { value: (0, nls_1.localize)('toggleLocation', "Toggle Multi-Cursor Modifier"), original: 'Toggle Multi-Cursor Modifier' },
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const editorConf = configurationService.getValue('editor');
            const newValue = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'alt' : 'ctrlCmd');
            return configurationService.updateValue(ToggleMultiCursorModifierAction.multiCursorModifierConfigurationKey, newValue);
        }
    }
    exports.ToggleMultiCursorModifierAction = ToggleMultiCursorModifierAction;
    ToggleMultiCursorModifierAction.ID = 'workbench.action.toggleMultiCursorModifier';
    ToggleMultiCursorModifierAction.multiCursorModifierConfigurationKey = 'editor.multiCursorModifier';
    const multiCursorModifier = new contextkey_1.RawContextKey('multiCursorModifier', 'altKey');
    let MultiCursorModifierContextKeyController = class MultiCursorModifierContextKeyController {
        constructor(configurationService, contextKeyService) {
            this.configurationService = configurationService;
            this._multiCursorModifier = multiCursorModifier.bindTo(contextKeyService);
            this._update();
            configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('editor.multiCursorModifier')) {
                    this._update();
                }
            });
        }
        _update() {
            const editorConf = this.configurationService.getValue('editor');
            const value = (editorConf.multiCursorModifier === 'ctrlCmd' ? 'ctrlCmd' : 'altKey');
            this._multiCursorModifier.set(value);
        }
    };
    MultiCursorModifierContextKeyController = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, contextkey_1.IContextKeyService)
    ], MultiCursorModifierContextKeyController);
    platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(MultiCursorModifierContextKeyController, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(ToggleMultiCursorModifierAction);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleMultiCursorModifierAction.ID,
            title: (0, nls_1.localize)('miMultiCursorAlt', "Switch to Alt+Click for Multi-Cursor")
        },
        when: multiCursorModifier.isEqualTo('ctrlCmd'),
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSelectionMenu, {
        group: '4_config',
        command: {
            id: ToggleMultiCursorModifierAction.ID,
            title: (platform_1.isMacintosh
                ? (0, nls_1.localize)('miMultiCursorCmd', "Switch to Cmd+Click for Multi-Cursor")
                : (0, nls_1.localize)('miMultiCursorCtrl', "Switch to Ctrl+Click for Multi-Cursor"))
        },
        when: multiCursorModifier.isEqualTo('altKey'),
        order: 1
    });
});
//# sourceMappingURL=toggleMultiCursorModifier.js.map