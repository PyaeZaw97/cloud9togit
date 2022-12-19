/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/contrib/files/browser/fileConstants", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testingDecorations", "vs/workbench/contrib/testing/browser/testingExplorerView", "vs/workbench/contrib/testing/browser/testingOutputPeek", "vs/workbench/contrib/testing/browser/testingOutputTerminalService", "vs/workbench/contrib/testing/browser/testingProgressUiService", "vs/workbench/contrib/testing/browser/testingViewPaneContainer", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingContentProvider", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingDecorations", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testResultStorage", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testServiceImpl", "./testExplorerActions", "./testingConfigurationUi"], function (require, exports, editorExtensions_1, nls_1, actions_1, commands_1, configurationRegistry_1, contextkey_1, files_1, descriptors_1, extensions_1, opener_1, progress_1, platform_1, contributions_1, views_1, fileConstants_1, icons_1, testingDecorations_1, testingExplorerView_1, testingOutputPeek_1, testingOutputTerminalService_1, testingProgressUiService_1, testingViewPaneContainer_1, configuration_1, testExplorerFilterState_1, testId_1, testingContentProvider_1, testingContextKeys_1, testingDecorations_2, testingPeekOpener_1, testProfileService_1, testResultService_1, testResultStorage_1, testService_1, testServiceImpl_1, testExplorerActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(testService_1.ITestService, testServiceImpl_1.TestService, true);
    (0, extensions_1.registerSingleton)(testResultStorage_1.ITestResultStorage, testResultStorage_1.TestResultStorage, true);
    (0, extensions_1.registerSingleton)(testProfileService_1.ITestProfileService, testProfileService_1.TestProfileService, true);
    (0, extensions_1.registerSingleton)(testResultService_1.ITestResultService, testResultService_1.TestResultService, true);
    (0, extensions_1.registerSingleton)(testExplorerFilterState_1.ITestExplorerFilterState, testExplorerFilterState_1.TestExplorerFilterState, true);
    (0, extensions_1.registerSingleton)(testingOutputTerminalService_1.ITestingOutputTerminalService, testingOutputTerminalService_1.TestingOutputTerminalService, true);
    (0, extensions_1.registerSingleton)(testingPeekOpener_1.ITestingPeekOpener, testingOutputPeek_1.TestingPeekOpener, true);
    (0, extensions_1.registerSingleton)(testingProgressUiService_1.ITestingProgressUiService, testingProgressUiService_1.TestingProgressUiService, true);
    (0, extensions_1.registerSingleton)(testingDecorations_2.ITestingDecorationsService, testingDecorations_1.TestingDecorationService, true);
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: "workbench.view.extension.test" /* Testing.ViewletId */,
        title: (0, nls_1.localize)('test', "Testing"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(testingViewPaneContainer_1.TestingViewPaneContainer),
        icon: icons_1.testingViewIcon,
        alwaysUseContainerInfo: true,
        order: 6,
        openCommandActionDescriptor: {
            id: "workbench.view.extension.test" /* Testing.ViewletId */,
            mnemonicTitle: (0, nls_1.localize)({ key: 'miViewTesting', comment: ['&& denotes a mnemonic'] }, "T&&esting"),
            // todo: coordinate with joh whether this is available
            // keybindings: { primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.US_SEMICOLON },
            order: 4,
        },
        hideIfEmpty: true,
    }, 0 /* ViewContainerLocation.Sidebar */);
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViewWelcomeContent("workbench.view.testing" /* Testing.ExplorerViewId */, {
        content: (0, nls_1.localize)('noTestProvidersRegistered', "No tests have been found in this workspace yet."),
    });
    viewsRegistry.registerViewWelcomeContent("workbench.view.testing" /* Testing.ExplorerViewId */, {
        content: '[' + (0, nls_1.localize)('searchForAdditionalTestExtensions', "Install Additional Test Extensions...") + `](command:${"testing.searchForTestExtension" /* TestCommandId.SearchForTestExtension */})`,
        order: 10
    });
    viewsRegistry.registerViews([{
            id: "workbench.view.testing" /* Testing.ExplorerViewId */,
            name: (0, nls_1.localize)('testExplorer', "Test Explorer"),
            ctorDescriptor: new descriptors_1.SyncDescriptor(testingExplorerView_1.TestingExplorerView),
            canToggleVisibility: true,
            workspace: true,
            canMoveView: true,
            weight: 80,
            order: -999,
            containerIcon: icons_1.testingViewIcon,
            // temporary until release, at which point we can show the welcome view:
            when: contextkey_1.ContextKeyExpr.greater(testingContextKeys_1.TestingContextKeys.providerCount.key, 0),
        }], viewContainer);
    testExplorerActions_1.allTestActions.forEach(actions_1.registerAction2);
    (0, actions_1.registerAction2)(testingOutputPeek_1.OpenMessageInEditorAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.GoToPreviousMessageAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.GoToNextMessageAction);
    (0, actions_1.registerAction2)(testingOutputPeek_1.CloseTestPeek);
    (0, actions_1.registerAction2)(testingOutputPeek_1.ToggleTestingPeekHistory);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingContentProvider_1.TestingContentProvider, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingOutputPeek_1.TestingPeekOpener, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(testingProgressUiService_1.TestingProgressTrigger, 4 /* LifecyclePhase.Eventually */);
    (0, editorExtensions_1.registerEditorContribution)("editor.contrib.testingOutputPeek" /* Testing.OutputPeekContributionId */, testingOutputPeek_1.TestingOutputPeekController);
    (0, editorExtensions_1.registerEditorContribution)("editor.contrib.testingDecorations" /* Testing.DecorationsContributionId */, testingDecorations_1.TestingDecorations);
    commands_1.CommandsRegistry.registerCommand({
        id: '_revealTestInExplorer',
        handler: async (accessor, testId, focus) => {
            accessor.get(testExplorerFilterState_1.ITestExplorerFilterState).reveal.value = typeof testId === 'string' ? testId : testId.extId;
            accessor.get(views_1.IViewsService).openView("workbench.view.testing" /* Testing.ExplorerViewId */, focus);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.peekTestError',
        handler: async (accessor, extId) => {
            const lookup = accessor.get(testResultService_1.ITestResultService).getStateById(extId);
            if (!lookup) {
                return false;
            }
            const [result, ownState] = lookup;
            const opener = accessor.get(testingPeekOpener_1.ITestingPeekOpener);
            if (opener.tryPeekFirstError(result, ownState)) { // fast path
                return true;
            }
            for (const test of result.tests) {
                if (testId_1.TestId.compare(ownState.item.extId, test.item.extId) === 2 /* TestPosition.IsChild */ && opener.tryPeekFirstError(result, test)) {
                    return true;
                }
            }
            return false;
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.revealTest',
        handler: async (accessor, extId) => {
            const test = accessor.get(testService_1.ITestService).collection.getNodeById(extId);
            if (!test) {
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const fileService = accessor.get(files_1.IFileService);
            const openerService = accessor.get(opener_1.IOpenerService);
            let { range, uri } = test.item;
            if (!uri) {
                return;
            }
            // If an editor has the file open, there are decorations. Try to adjust the
            // revealed range to those decorations (#133441).
            range = accessor.get(testingDecorations_2.ITestingDecorationsService).getDecoratedRangeForTest(uri, extId) || range;
            accessor.get(testExplorerFilterState_1.ITestExplorerFilterState).reveal.value = extId;
            accessor.get(testingPeekOpener_1.ITestingPeekOpener).closeAllPeeks();
            let isFile = true;
            try {
                if (!(await fileService.stat(uri)).isFile) {
                    isFile = false;
                }
            }
            catch (_a) {
                // ignored
            }
            if (!isFile) {
                await commandService.executeCommand(fileConstants_1.REVEAL_IN_EXPLORER_COMMAND_ID, uri);
                return;
            }
            await openerService.open(range
                ? uri.with({ fragment: `L${range.startLineNumber}:${range.startColumn}` })
                : uri);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.runTestsById',
        handler: async (accessor, group, ...testIds) => {
            const testService = accessor.get(testService_1.ITestService);
            await (0, testExplorerActions_1.discoverAndRunTests)(accessor.get(testService_1.ITestService).collection, accessor.get(progress_1.IProgressService), testIds, tests => testService.runTests({ group, tests }));
        }
    });
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(configuration_1.testingConfiguation);
});
//# sourceMappingURL=testing.contribution.js.map