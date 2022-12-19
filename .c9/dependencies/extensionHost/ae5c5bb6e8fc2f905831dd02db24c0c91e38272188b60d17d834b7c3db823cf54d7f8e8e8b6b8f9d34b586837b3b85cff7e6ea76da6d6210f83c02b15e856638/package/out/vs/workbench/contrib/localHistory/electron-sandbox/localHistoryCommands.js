/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/platform/actions/common/actions", "vs/workbench/contrib/localHistory/browser/localHistory", "vs/workbench/contrib/localHistory/browser/localHistoryCommands", "vs/base/common/platform", "vs/platform/native/electron-sandbox/native", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/workbench/common/contextkeys"], function (require, exports, nls_1, workingCopyHistory_1, actions_1, localHistory_1, localHistoryCommands_1, platform_1, native_1, contextkey_1, network_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Delete
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.revealInOS',
                title: {
                    value: platform_1.isWindows ? (0, nls_1.localize)('revealInWindows', "Reveal in File Explorer") : platform_1.isMacintosh ? (0, nls_1.localize)('revealInMac', "Reveal in Finder") : (0, nls_1.localize)('openContainer', "Open Containing Folder"),
                    original: platform_1.isWindows ? 'Reveal in File Explorer' : platform_1.isMacintosh ? 'Reveal in Finder' : 'Open Containing Folder'
                },
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '4_reveal',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY, contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file))
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const { entry } = await (0, localHistoryCommands_1.findLocalHistoryEntry)(workingCopyHistoryService, item);
            if (entry) {
                await nativeHostService.showItemInFolder(entry.location.fsPath);
            }
        }
    });
});
//#endregion
//# sourceMappingURL=localHistoryCommands.js.map