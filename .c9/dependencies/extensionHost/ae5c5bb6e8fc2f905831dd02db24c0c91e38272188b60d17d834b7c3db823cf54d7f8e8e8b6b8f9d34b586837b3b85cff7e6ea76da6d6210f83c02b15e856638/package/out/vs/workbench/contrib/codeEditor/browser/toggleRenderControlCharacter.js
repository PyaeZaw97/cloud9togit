/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/actions"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleRenderControlCharacterAction = void 0;
    class ToggleRenderControlCharacterAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleRenderControlCharacterAction.ID,
                title: {
                    value: (0, nls_1.localize)('toggleRenderControlCharacters', "Toggle Control Characters"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleRenderControlCharacters', comment: ['&& denotes a mnemonic'] }, "Render &&Control Characters"),
                    original: 'Toggle Control Characters'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.editor.renderControlCharacters', true),
                menu: {
                    id: actions_1.MenuId.MenubarViewMenu,
                    group: '5_editor',
                    order: 5
                }
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newRenderControlCharacters = !configurationService.getValue('editor.renderControlCharacters');
            return configurationService.updateValue('editor.renderControlCharacters', newRenderControlCharacters);
        }
    }
    exports.ToggleRenderControlCharacterAction = ToggleRenderControlCharacterAction;
    ToggleRenderControlCharacterAction.ID = 'editor.action.toggleRenderControlCharacter';
    (0, actions_1.registerAction2)(ToggleRenderControlCharacterAction);
});
//# sourceMappingURL=toggleRenderControlCharacter.js.map