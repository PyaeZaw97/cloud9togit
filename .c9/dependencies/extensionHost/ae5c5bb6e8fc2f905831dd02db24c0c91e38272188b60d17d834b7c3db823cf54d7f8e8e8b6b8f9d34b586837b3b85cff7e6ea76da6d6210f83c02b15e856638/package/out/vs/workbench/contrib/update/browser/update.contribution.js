/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/update/browser/update", "vs/platform/product/common/product", "vs/platform/update/common/update", "vs/platform/update/common/update.config.contribution"], function (require, exports, nls_1, platform_1, contributions_1, actions_1, actions_2, update_1, product_1, update_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbench = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbench.registerWorkbenchContribution(update_1.ProductContribution, 3 /* LifecyclePhase.Restored */);
    workbench.registerWorkbenchContribution(update_1.UpdateContribution, 3 /* LifecyclePhase.Restored */);
    workbench.registerWorkbenchContribution(update_1.SwitchProductQualityContribution, 3 /* LifecyclePhase.Restored */);
    const actionRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    // Editor
    actionRegistry
        .registerWorkbenchAction(actions_2.SyncActionDescriptor.from(update_1.ShowCurrentReleaseNotesAction), `${product_1.default.nameShort}: Show Release Notes`, product_1.default.nameShort);
    actionRegistry
        .registerWorkbenchAction(actions_2.SyncActionDescriptor.from(update_1.CheckForVSCodeUpdateAction), `${product_1.default.nameShort}: Check for Update`, product_1.default.nameShort, update_1.CONTEXT_UPDATE_STATE.isEqualTo("idle" /* StateType.Idle */));
    class DownloadUpdateAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'update.downloadUpdate',
                title: (0, nls_1.localize)('downloadUpdate', "Download Update"),
                category: product_1.default.nameShort,
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("available for download" /* StateType.AvailableForDownload */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).downloadUpdate();
        }
    }
    class InstallUpdateAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'update.installUpdate',
                title: (0, nls_1.localize)('installUpdate', "Install Update"),
                category: product_1.default.nameShort,
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("downloaded" /* StateType.Downloaded */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).applyUpdate();
        }
    }
    class RestartToUpdateAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'update.restartToUpdate',
                title: (0, nls_1.localize)('restartToUpdate', "Restart to Update"),
                category: product_1.default.nameShort,
                f1: true,
                precondition: update_1.CONTEXT_UPDATE_STATE.isEqualTo("ready" /* StateType.Ready */)
            });
        }
        async run(accessor) {
            await accessor.get(update_2.IUpdateService).quitAndInstall();
        }
    }
    (0, actions_2.registerAction2)(DownloadUpdateAction);
    (0, actions_2.registerAction2)(InstallUpdateAction);
    (0, actions_2.registerAction2)(RestartToUpdateAction);
    // Menu
    if (update_1.ShowCurrentReleaseNotesAction.AVAILABE) {
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarHelpMenu, {
            group: '1_welcome',
            command: {
                id: update_1.ShowCurrentReleaseNotesAction.ID,
                title: (0, nls_1.localize)({ key: 'miReleaseNotes', comment: ['&& denotes a mnemonic'] }, "&&Release Notes")
            },
            order: 5
        });
    }
});
//# sourceMappingURL=update.contribution.js.map