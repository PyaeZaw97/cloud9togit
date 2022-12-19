/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/workbench/common/actions", "vs/workbench/contrib/logs/common/logConstants", "vs/workbench/services/output/common/output"], function (require, exports, nls, actions_1, keybinding_1, actions_2, logConstants_1, output_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ToggleKeybindingsLogAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleKeybindingsLog',
                title: { value: nls.localize('toggleKeybindingsLog', "Toggle Keyboard Shortcuts Troubleshooting"), original: 'Toggle Keyboard Shortcuts Troubleshooting' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor) {
            const logging = accessor.get(keybinding_1.IKeybindingService).toggleLogging();
            if (logging) {
                const outputService = accessor.get(output_1.IOutputService);
                outputService.showChannel(logConstants_1.rendererLogChannelId);
            }
        }
    }
    (0, actions_1.registerAction2)(ToggleKeybindingsLogAction);
});
//# sourceMappingURL=keybindings.contribution.js.map