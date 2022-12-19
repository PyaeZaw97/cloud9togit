/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/iterator", "vs/base/common/keyCodes", "vs/base/common/types", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/actions", "vs/workbench/common/contextkeys", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testingOutputTerminalService", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, arrays_1, codicons_1, iterator_1, keyCodes_1, types_1, position_1, range_1, editorContextKeys_1, nls_1, actions_1, commands_1, contextkey_1, notification_1, progress_1, uriIdentity_1, viewPane_1, actions_2, contextkeys_1, extensions_1, index_1, icons, testingOutputTerminalService_1, testingContextKeys_1, testingPeekOpener_1, testingStates_1, testProfileService_1, testResultService_1, testService_1, editorService_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.allTestActions = exports.CancelTestRefreshAction = exports.RefreshTestsAction = exports.ToggleInlineTestOutput = exports.OpenOutputPeek = exports.SearchForTestExtension = exports.DebugLastRun = exports.ReRunLastRun = exports.DebugFailedTests = exports.ReRunFailedTests = exports.discoverAndRunTests = exports.DebugCurrentFile = exports.RunCurrentFile = exports.DebugAtCursor = exports.RunAtCursor = exports.GoToTest = exports.ClearTestResultsAction = exports.CollapseAllAction = exports.ShowMostRecentOutputAction = exports.TestingSortByDurationAction = exports.TestingSortByLocationAction = exports.TestingSortByStatusAction = exports.TestingViewAsTreeAction = exports.TestingViewAsListAction = exports.CancelTestRunAction = exports.DebugAllAction = exports.RunAllAction = exports.DebugSelectedAction = exports.RunSelectedAction = exports.ConfigureTestProfilesAction = exports.SelectDefaultTestProfiles = exports.RunAction = exports.RunUsingProfileAction = exports.DebugAction = exports.UnhideAllTestsAction = exports.UnhideTestAction = exports.HideTestAction = void 0;
    const category = actions_2.CATEGORIES.Test;
    var ActionOrder;
    (function (ActionOrder) {
        // Navigation:
        ActionOrder[ActionOrder["Refresh"] = 10] = "Refresh";
        ActionOrder[ActionOrder["Run"] = 11] = "Run";
        ActionOrder[ActionOrder["Debug"] = 12] = "Debug";
        ActionOrder[ActionOrder["Coverage"] = 13] = "Coverage";
        ActionOrder[ActionOrder["RunUsing"] = 14] = "RunUsing";
        ActionOrder[ActionOrder["AutoRun"] = 15] = "AutoRun";
        // Submenu:
        ActionOrder[ActionOrder["Collapse"] = 16] = "Collapse";
        ActionOrder[ActionOrder["ClearResults"] = 17] = "ClearResults";
        ActionOrder[ActionOrder["DisplayMode"] = 18] = "DisplayMode";
        ActionOrder[ActionOrder["Sort"] = 19] = "Sort";
        ActionOrder[ActionOrder["GoToTest"] = 20] = "GoToTest";
        ActionOrder[ActionOrder["HideTest"] = 21] = "HideTest";
    })(ActionOrder || (ActionOrder = {}));
    const hasAnyTestProvider = contextkey_1.ContextKeyGreaterExpr.create(testingContextKeys_1.TestingContextKeys.providerCount.key, 0);
    class HideTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.hideTest" /* TestCommandId.HideTestAction */,
                title: (0, nls_1.localize)('hideTest', 'Hide Test'),
                menu: {
                    id: actions_1.MenuId.TestItem,
                    group: 'builtin@2',
                    when: testingContextKeys_1.TestingContextKeys.testItemIsHidden.isEqualTo(false)
                },
            });
        }
        run(accessor, ...elements) {
            const service = accessor.get(testService_1.ITestService);
            for (const element of elements) {
                if (element instanceof index_1.TestItemTreeElement) {
                    service.excluded.toggle(element.test, true);
                }
            }
            return Promise.resolve();
        }
    }
    exports.HideTestAction = HideTestAction;
    class UnhideTestAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.unhideTest" /* TestCommandId.UnhideTestAction */,
                title: (0, nls_1.localize)('unhideTest', 'Unhide Test'),
                menu: {
                    id: actions_1.MenuId.TestItem,
                    order: 21 /* ActionOrder.HideTest */,
                    when: testingContextKeys_1.TestingContextKeys.testItemIsHidden.isEqualTo(true)
                },
            });
        }
        run(accessor, ...elements) {
            const service = accessor.get(testService_1.ITestService);
            for (const element of elements) {
                if (element instanceof index_1.TestItemTreeElement) {
                    service.excluded.toggle(element.test, false);
                }
            }
            return Promise.resolve();
        }
    }
    exports.UnhideTestAction = UnhideTestAction;
    class UnhideAllTestsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.unhideAllTests" /* TestCommandId.UnhideAllTestsAction */,
                title: (0, nls_1.localize)('unhideAllTests', 'Unhide All Tests'),
            });
        }
        run(accessor) {
            const service = accessor.get(testService_1.ITestService);
            service.excluded.clear();
            return Promise.resolve();
        }
    }
    exports.UnhideAllTestsAction = UnhideAllTestsAction;
    const testItemInlineAndInContext = (order, when) => [
        {
            id: actions_1.MenuId.TestItem,
            group: 'inline',
            order,
            when,
        }, {
            id: actions_1.MenuId.TestItem,
            group: 'builtin@1',
            order,
            when,
        }
    ];
    class DebugAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.debug" /* TestCommandId.DebugAction */,
                title: (0, nls_1.localize)('debug test', 'Debug Test'),
                icon: icons.testingDebugIcon,
                menu: testItemInlineAndInContext(12 /* ActionOrder.Debug */, testingContextKeys_1.TestingContextKeys.hasDebuggableTests.isEqualTo(true)),
            });
        }
        run(acessor, ...elements) {
            return acessor.get(testService_1.ITestService).runTests({
                tests: [...iterator_1.Iterable.concatNested(elements.map(e => e.tests))],
                group: 4 /* TestRunProfileBitset.Debug */,
            });
        }
    }
    exports.DebugAction = DebugAction;
    class RunUsingProfileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.runUsing" /* TestCommandId.RunUsingProfileAction */,
                title: (0, nls_1.localize)('testing.runUsing', 'Execute Using Profile...'),
                icon: icons.testingDebugIcon,
                menu: {
                    id: actions_1.MenuId.TestItem,
                    order: 14 /* ActionOrder.RunUsing */,
                    group: 'builtin@2',
                    when: testingContextKeys_1.TestingContextKeys.hasNonDefaultProfile.isEqualTo(true),
                },
            });
        }
        async run(acessor, ...elements) {
            const testElements = elements.filter((e) => e instanceof index_1.TestItemTreeElement);
            if (testElements.length === 0) {
                return;
            }
            const commandService = acessor.get(commands_1.ICommandService);
            const testService = acessor.get(testService_1.ITestService);
            const profile = await commandService.executeCommand('vscode.pickTestProfile', {
                onlyForTest: testElements[0].test,
            });
            if (!profile) {
                return;
            }
            testService.runResolvedTests({
                targets: [{
                        profileGroup: profile.group,
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                        testIds: testElements.filter(t => (0, testProfileService_1.canUseProfileWithTest)(profile, t.test)).map(t => t.test.item.extId)
                    }]
            });
        }
    }
    exports.RunUsingProfileAction = RunUsingProfileAction;
    class RunAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.run" /* TestCommandId.RunAction */,
                title: (0, nls_1.localize)('run test', 'Run Test'),
                icon: icons.testingRunIcon,
                menu: testItemInlineAndInContext(11 /* ActionOrder.Run */, testingContextKeys_1.TestingContextKeys.hasRunnableTests.isEqualTo(true)),
            });
        }
        /**
         * @override
         */
        run(acessor, ...elements) {
            return acessor.get(testService_1.ITestService).runTests({
                tests: [...iterator_1.Iterable.concatNested(elements.map(e => e.tests))],
                group: 2 /* TestRunProfileBitset.Run */,
            });
        }
    }
    exports.RunAction = RunAction;
    class SelectDefaultTestProfiles extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.selectDefaultTestProfiles" /* TestCommandId.SelectDefaultTestProfiles */,
                title: (0, nls_1.localize)('testing.selectDefaultTestProfiles', 'Select Default Profile'),
                icon: icons.testingUpdateProfiles,
                category,
            });
        }
        async run(acessor, onlyGroup) {
            const commands = acessor.get(commands_1.ICommandService);
            const testProfileService = acessor.get(testProfileService_1.ITestProfileService);
            const profiles = await commands.executeCommand('vscode.pickMultipleTestProfiles', {
                showConfigureButtons: false,
                selected: testProfileService.getGroupDefaultProfiles(onlyGroup),
                onlyGroup,
            });
            if (profiles === null || profiles === void 0 ? void 0 : profiles.length) {
                testProfileService.setGroupDefaultProfiles(onlyGroup, profiles);
            }
        }
    }
    exports.SelectDefaultTestProfiles = SelectDefaultTestProfiles;
    class ConfigureTestProfilesAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.configureProfile" /* TestCommandId.ConfigureTestProfilesAction */,
                title: (0, nls_1.localize)('testing.configureProfile', 'Configure Test Profiles'),
                icon: icons.testingUpdateProfiles,
                f1: true,
                category,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasConfigurableProfile.isEqualTo(true),
                },
            });
        }
        async run(acessor, onlyGroup) {
            const commands = acessor.get(commands_1.ICommandService);
            const testProfileService = acessor.get(testProfileService_1.ITestProfileService);
            const profile = await commands.executeCommand('vscode.pickTestProfile', {
                placeholder: (0, nls_1.localize)('configureProfile', 'Select a profile to update'),
                showConfigureButtons: false,
                onlyConfigurable: true,
                onlyGroup,
            });
            if (profile) {
                testProfileService.configure(profile.controllerId, profile.profileId);
            }
        }
    }
    exports.ConfigureTestProfilesAction = ConfigureTestProfilesAction;
    class ExecuteSelectedAction extends viewPane_1.ViewAction {
        constructor(options, group) {
            super(Object.assign(Object.assign({}, options), { menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        order: group === 2 /* TestRunProfileBitset.Run */
                            ? 11 /* ActionOrder.Run */
                            : group === 4 /* TestRunProfileBitset.Debug */
                                ? 12 /* ActionOrder.Debug */
                                : 13 /* ActionOrder.Coverage */,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), testingContextKeys_1.TestingContextKeys.isRunning.isEqualTo(false), testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true))
                    }], category, viewId: "workbench.view.testing" /* Testing.ExplorerViewId */ }));
            this.group = group;
        }
        /**
         * @override
         */
        runInView(accessor, view) {
            const { include, exclude } = view.getSelectedOrVisibleItems();
            return accessor.get(testService_1.ITestService).runTests({ tests: include, exclude, group: this.group });
        }
    }
    class RunSelectedAction extends ExecuteSelectedAction {
        constructor() {
            super({
                id: "testing.runSelected" /* TestCommandId.RunSelectedAction */,
                title: (0, nls_1.localize)('runSelectedTests', 'Run Tests'),
                icon: icons.testingRunAllIcon,
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunSelectedAction = RunSelectedAction;
    class DebugSelectedAction extends ExecuteSelectedAction {
        constructor() {
            super({
                id: "testing.debugSelected" /* TestCommandId.DebugSelectedAction */,
                title: (0, nls_1.localize)('debugSelectedTests', 'Debug Tests'),
                icon: icons.testingDebugAllIcon,
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugSelectedAction = DebugSelectedAction;
    const showDiscoveringWhile = (progress, task) => {
        return progress.withProgress({
            location: 10 /* ProgressLocation.Window */,
            title: (0, nls_1.localize)('discoveringTests', 'Discovering Tests'),
        }, () => task);
    };
    class RunOrDebugAllTestsAction extends actions_1.Action2 {
        constructor(options, group, noTestsFoundError) {
            super(Object.assign(Object.assign({}, options), { category, menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true),
                    }] }));
            this.group = group;
            this.noTestsFoundError = noTestsFoundError;
        }
        async run(accessor) {
            const testService = accessor.get(testService_1.ITestService);
            const notifications = accessor.get(notification_1.INotificationService);
            const roots = [...testService.collection.rootItems];
            if (!roots.length) {
                notifications.info(this.noTestsFoundError);
                return;
            }
            await testService.runTests({ tests: roots, group: this.group });
        }
    }
    class RunAllAction extends RunOrDebugAllTestsAction {
        constructor() {
            super({
                id: "testing.runAll" /* TestCommandId.RunAllAction */,
                title: (0, nls_1.localize)('runAllTests', 'Run All Tests'),
                icon: icons.testingRunAllIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 31 /* KeyCode.KeyA */),
                },
            }, 2 /* TestRunProfileBitset.Run */, (0, nls_1.localize)('noTestProvider', 'No tests found in this workspace. You may need to install a test provider extension'));
        }
    }
    exports.RunAllAction = RunAllAction;
    class DebugAllAction extends RunOrDebugAllTestsAction {
        constructor() {
            super({
                id: "testing.debugAll" /* TestCommandId.DebugAllAction */,
                title: (0, nls_1.localize)('debugAllTests', 'Debug All Tests'),
                icon: icons.testingDebugIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */),
                },
            }, 4 /* TestRunProfileBitset.Debug */, (0, nls_1.localize)('noDebugTestProvider', 'No debuggable tests found in this workspace. You may need to install a test provider extension'));
        }
    }
    exports.DebugAllAction = DebugAllAction;
    class CancelTestRunAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.cancelRun" /* TestCommandId.CancelTestRunAction */,
                title: (0, nls_1.localize)('testing.cancelRun', "Cancel Test Run"),
                icon: icons.testingCancelIcon,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */),
                },
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 11 /* ActionOrder.Run */,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), contextkey_1.ContextKeyExpr.equals(testingContextKeys_1.TestingContextKeys.isRunning.serialize(), true))
                }
            });
        }
        /**
         * @override
         */
        async run(accessor) {
            const resultService = accessor.get(testResultService_1.ITestResultService);
            const testService = accessor.get(testService_1.ITestService);
            for (const run of resultService.results) {
                if (!run.completedAt) {
                    testService.cancelTestRun(run.id);
                }
            }
        }
    }
    exports.CancelTestRunAction = CancelTestRunAction;
    class TestingViewAsListAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.viewAsList" /* TestCommandId.TestingViewAsListAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize)('testing.viewAsList', "View as List"),
                toggled: testingContextKeys_1.TestingContextKeys.viewMode.isEqualTo("list" /* TestExplorerViewMode.List */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 18 /* ActionOrder.DisplayMode */,
                    group: 'viewAs',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewMode = "list" /* TestExplorerViewMode.List */;
        }
    }
    exports.TestingViewAsListAction = TestingViewAsListAction;
    class TestingViewAsTreeAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.viewAsTree" /* TestCommandId.TestingViewAsTreeAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize)('testing.viewAsTree', "View as Tree"),
                toggled: testingContextKeys_1.TestingContextKeys.viewMode.isEqualTo("true" /* TestExplorerViewMode.Tree */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 18 /* ActionOrder.DisplayMode */,
                    group: 'viewAs',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewMode = "true" /* TestExplorerViewMode.Tree */;
        }
    }
    exports.TestingViewAsTreeAction = TestingViewAsTreeAction;
    class TestingSortByStatusAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByStatus" /* TestCommandId.TestingSortByStatusAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize)('testing.sortByStatus', "Sort by Status"),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("status" /* TestExplorerViewSorting.ByStatus */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "status" /* TestExplorerViewSorting.ByStatus */;
        }
    }
    exports.TestingSortByStatusAction = TestingSortByStatusAction;
    class TestingSortByLocationAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByLocation" /* TestCommandId.TestingSortByLocationAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize)('testing.sortByLocation', "Sort by Location"),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("location" /* TestExplorerViewSorting.ByLocation */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "location" /* TestExplorerViewSorting.ByLocation */;
        }
    }
    exports.TestingSortByLocationAction = TestingSortByLocationAction;
    class TestingSortByDurationAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.sortByDuration" /* TestCommandId.TestingSortByDurationAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize)('testing.sortByDuration', "Sort by Duration"),
                toggled: testingContextKeys_1.TestingContextKeys.viewSorting.isEqualTo("duration" /* TestExplorerViewSorting.ByDuration */),
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 19 /* ActionOrder.Sort */,
                    group: 'sortBy',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.viewSorting = "duration" /* TestExplorerViewSorting.ByDuration */;
        }
    }
    exports.TestingSortByDurationAction = TestingSortByDurationAction;
    class ShowMostRecentOutputAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.showMostRecentOutput" /* TestCommandId.ShowMostRecentOutputAction */,
                title: (0, nls_1.localize)('testing.showMostRecentOutput', "Show Output"),
                category,
                icon: codicons_1.Codicon.terminal,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */),
                },
                precondition: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        order: 16 /* ActionOrder.Collapse */,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */),
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true)
                    }]
            });
        }
        run(accessor) {
            const result = accessor.get(testResultService_1.ITestResultService).results[0];
            accessor.get(testingOutputTerminalService_1.ITestingOutputTerminalService).open(result);
        }
    }
    exports.ShowMostRecentOutputAction = ShowMostRecentOutputAction;
    class CollapseAllAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: "testing.collapseAll" /* TestCommandId.CollapseAllAction */,
                viewId: "workbench.view.testing" /* Testing.ExplorerViewId */,
                title: (0, nls_1.localize)('testing.collapseAll', "Collapse All Tests"),
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 16 /* ActionOrder.Collapse */,
                    group: 'displayAction',
                    when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                }
            });
        }
        /**
         * @override
         */
        runInView(_accessor, view) {
            view.viewModel.collapseAll();
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
    class ClearTestResultsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.clearTestResults" /* TestCommandId.ClearTestResultsAction */,
                title: (0, nls_1.localize)('testing.clearResults', "Clear All Results"),
                category,
                icon: codicons_1.Codicon.trash,
                menu: [{
                        id: actions_1.MenuId.TestPeekTitle,
                    }, {
                        id: actions_1.MenuId.CommandPalette,
                        when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                    }, {
                        id: actions_1.MenuId.ViewTitle,
                        order: 17 /* ActionOrder.ClearResults */,
                        group: 'displayAction',
                        when: contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */)
                    }],
            });
        }
        /**
         * @override
         */
        run(accessor) {
            accessor.get(testResultService_1.ITestResultService).clear();
        }
    }
    exports.ClearTestResultsAction = ClearTestResultsAction;
    class GoToTest extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.editFocusedTest" /* TestCommandId.GoToTest */,
                title: (0, nls_1.localize)('testing.editFocusedTest', "Go to Test"),
                icon: codicons_1.Codicon.goToFile,
                menu: testItemInlineAndInContext(20 /* ActionOrder.GoToTest */, testingContextKeys_1.TestingContextKeys.testItemHasUri.isEqualTo(true)),
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 10,
                    when: contextkeys_1.FocusedViewContext.isEqualTo("workbench.view.testing" /* Testing.ExplorerViewId */),
                    primary: 3 /* KeyCode.Enter */ | 512 /* KeyMod.Alt */,
                },
            });
        }
        async run(accessor, element, preserveFocus) {
            if (element && element instanceof index_1.TestItemTreeElement) {
                accessor.get(commands_1.ICommandService).executeCommand('vscode.revealTest', element.test.item.extId, preserveFocus);
            }
        }
    }
    exports.GoToTest = GoToTest;
    class ExecuteTestAtCursor extends actions_1.Action2 {
        constructor(options, group) {
            super(Object.assign(Object.assign({}, options), { menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: hasAnyTestProvider,
                } }));
            this.group = group;
        }
        /**
         * @override
         */
        async run(accessor) {
            const control = accessor.get(editorService_1.IEditorService).activeTextEditorControl;
            const position = control === null || control === void 0 ? void 0 : control.getPosition();
            const model = control === null || control === void 0 ? void 0 : control.getModel();
            if (!position || !model || !('uri' in model)) {
                return;
            }
            const testService = accessor.get(testService_1.ITestService);
            const profileService = accessor.get(testProfileService_1.ITestProfileService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            let bestNodes = [];
            let bestRange;
            let bestNodesBefore = [];
            let bestRangeBefore;
            // testsInFile will descend in the test tree. We assume that as we go
            // deeper, ranges get more specific. We'll want to run all tests whose
            // range is equal to the most specific range we find (see #133519)
            //
            // If we don't find any test whose range contains the position, we pick
            // the closest one before the position. Again, if we find several tests
            // whose range is equal to the closest one, we run them all.
            await showDiscoveringWhile(accessor.get(progress_1.IProgressService), (async () => {
                var e_1, _a;
                try {
                    for (var _b = __asyncValues((0, testService_1.testsInFile)(testService.collection, uriIdentityService, model.uri)), _c; _c = await _b.next(), !_c.done;) {
                        const test = _c.value;
                        if (!test.item.range || !(profileService.capabilitiesForTest(test) & this.group)) {
                            continue;
                        }
                        const irange = range_1.Range.lift(test.item.range);
                        if (irange.containsPosition(position)) {
                            if (bestRange && range_1.Range.equalsRange(test.item.range, bestRange)) {
                                bestNodes.push(test);
                            }
                            else {
                                bestRange = irange;
                                bestNodes = [test];
                            }
                        }
                        else if (position_1.Position.isBefore(irange.getStartPosition(), position)) {
                            if (!bestRangeBefore || bestRangeBefore.getStartPosition().isBefore(irange.getStartPosition())) {
                                bestRangeBefore = irange;
                                bestNodesBefore = [test];
                            }
                            else if (irange.equalsRange(bestRangeBefore)) {
                                bestNodesBefore.push(test);
                            }
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            })());
            const testsToRun = bestNodes.length ? bestNodes : bestNodesBefore;
            if (testsToRun.length) {
                await testService.runTests({
                    group: this.group,
                    tests: bestNodes.length ? bestNodes : bestNodesBefore,
                });
            }
        }
    }
    class RunAtCursor extends ExecuteTestAtCursor {
        constructor() {
            super({
                id: "testing.runAtCursor" /* TestCommandId.RunAtCursor */,
                title: (0, nls_1.localize)('testing.runAtCursor', "Run Test at Cursor"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 33 /* KeyCode.KeyC */),
                },
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunAtCursor = RunAtCursor;
    class DebugAtCursor extends ExecuteTestAtCursor {
        constructor() {
            super({
                id: "testing.debugAtCursor" /* TestCommandId.DebugAtCursor */,
                title: (0, nls_1.localize)('testing.debugAtCursor', "Debug Test at Cursor"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */),
                },
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugAtCursor = DebugAtCursor;
    class ExecuteTestsInCurrentFile extends actions_1.Action2 {
        constructor(options, group) {
            super(Object.assign(Object.assign({}, options), { menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.capabilityToContextKey[group].isEqualTo(true),
                } }));
            this.group = group;
        }
        /**
         * @override
         */
        run(accessor) {
            var _a;
            const control = accessor.get(editorService_1.IEditorService).activeTextEditorControl;
            const position = control === null || control === void 0 ? void 0 : control.getPosition();
            const model = control === null || control === void 0 ? void 0 : control.getModel();
            if (!position || !model || !('uri' in model)) {
                return;
            }
            const testService = accessor.get(testService_1.ITestService);
            const demandedUri = model.uri.toString();
            // Iterate through the entire collection and run any tests that are in the
            // uri. See #138007.
            const queue = [testService.collection.rootIds];
            const discovered = [];
            while (queue.length) {
                for (const id of queue.pop()) {
                    const node = testService.collection.getNodeById(id);
                    if (((_a = node.item.uri) === null || _a === void 0 ? void 0 : _a.toString()) === demandedUri) {
                        discovered.push(node);
                    }
                    else {
                        queue.push(node.children);
                    }
                }
            }
            if (discovered.length) {
                return testService.runTests({
                    tests: discovered,
                    group: this.group,
                });
            }
            return undefined;
        }
    }
    class RunCurrentFile extends ExecuteTestsInCurrentFile {
        constructor() {
            super({
                id: "testing.runCurrentFile" /* TestCommandId.RunCurrentFile */,
                title: (0, nls_1.localize)('testing.runCurrentFile', "Run Tests in Current File"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 36 /* KeyCode.KeyF */),
                },
            }, 2 /* TestRunProfileBitset.Run */);
        }
    }
    exports.RunCurrentFile = RunCurrentFile;
    class DebugCurrentFile extends ExecuteTestsInCurrentFile {
        constructor() {
            super({
                id: "testing.debugCurrentFile" /* TestCommandId.DebugCurrentFile */,
                title: (0, nls_1.localize)('testing.debugCurrentFile', "Debug Tests in Current File"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */),
                },
            }, 4 /* TestRunProfileBitset.Debug */);
        }
    }
    exports.DebugCurrentFile = DebugCurrentFile;
    const discoverAndRunTests = async (collection, progress, ids, runTests) => {
        const todo = Promise.all(ids.map(p => (0, testService_1.expandAndGetTestById)(collection, p)));
        const tests = (await showDiscoveringWhile(progress, todo)).filter(types_1.isDefined);
        return tests.length ? await runTests(tests) : undefined;
    };
    exports.discoverAndRunTests = discoverAndRunTests;
    class RunOrDebugExtsByPath extends actions_1.Action2 {
        /**
         * @override
         */
        async run(accessor, ...args) {
            const testService = accessor.get(testService_1.ITestService);
            await (0, exports.discoverAndRunTests)(accessor.get(testService_1.ITestService).collection, accessor.get(progress_1.IProgressService), [...this.getTestExtIdsToRun(accessor, ...args)], tests => this.runTest(testService, tests));
        }
    }
    class RunOrDebugFailedTests extends RunOrDebugExtsByPath {
        constructor(options) {
            super(Object.assign(Object.assign({}, options), { menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: hasAnyTestProvider,
                } }));
        }
        /**
         * @inheritdoc
         */
        getTestExtIdsToRun(accessor) {
            const { results } = accessor.get(testResultService_1.ITestResultService);
            const ids = new Set();
            for (let i = results.length - 1; i >= 0; i--) {
                const resultSet = results[i];
                for (const test of resultSet.tests) {
                    if ((0, testingStates_1.isFailedState)(test.ownComputedState)) {
                        ids.add(test.item.extId);
                    }
                    else {
                        ids.delete(test.item.extId);
                    }
                }
            }
            return ids;
        }
    }
    class RunOrDebugLastRun extends RunOrDebugExtsByPath {
        constructor(options) {
            super(Object.assign(Object.assign({}, options), { menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(hasAnyTestProvider, testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true)),
                } }));
        }
        /**
         * @inheritdoc
         */
        *getTestExtIdsToRun(accessor, runId) {
            const resultService = accessor.get(testResultService_1.ITestResultService);
            const lastResult = runId ? resultService.results.find(r => r.id === runId) : resultService.results[0];
            if (!lastResult) {
                return;
            }
            for (const test of lastResult.request.targets) {
                for (const testId of test.testIds) {
                    yield testId;
                }
            }
        }
    }
    class ReRunFailedTests extends RunOrDebugFailedTests {
        constructor() {
            super({
                id: "testing.reRunFailTests" /* TestCommandId.ReRunFailedTests */,
                title: (0, nls_1.localize)('testing.reRunFailTests', "Rerun Failed Tests"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 35 /* KeyCode.KeyE */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 2 /* TestRunProfileBitset.Run */,
                tests: internalTests,
            });
        }
    }
    exports.ReRunFailedTests = ReRunFailedTests;
    class DebugFailedTests extends RunOrDebugFailedTests {
        constructor() {
            super({
                id: "testing.debugFailTests" /* TestCommandId.DebugFailedTests */,
                title: (0, nls_1.localize)('testing.debugFailTests', "Debug Failed Tests"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 35 /* KeyCode.KeyE */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 4 /* TestRunProfileBitset.Debug */,
                tests: internalTests,
            });
        }
    }
    exports.DebugFailedTests = DebugFailedTests;
    class ReRunLastRun extends RunOrDebugLastRun {
        constructor() {
            super({
                id: "testing.reRunLastRun" /* TestCommandId.ReRunLastRun */,
                title: (0, nls_1.localize)('testing.reRunLastRun', "Rerun Last Run"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 42 /* KeyCode.KeyL */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 2 /* TestRunProfileBitset.Run */,
                tests: internalTests,
            });
        }
    }
    exports.ReRunLastRun = ReRunLastRun;
    class DebugLastRun extends RunOrDebugLastRun {
        constructor() {
            super({
                id: "testing.debugLastRun" /* TestCommandId.DebugLastRun */,
                title: (0, nls_1.localize)('testing.debugLastRun', "Debug Last Run"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */),
                },
            });
        }
        runTest(service, internalTests) {
            return service.runTests({
                group: 4 /* TestRunProfileBitset.Debug */,
                tests: internalTests,
            });
        }
    }
    exports.DebugLastRun = DebugLastRun;
    class SearchForTestExtension extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.searchForTestExtension" /* TestCommandId.SearchForTestExtension */,
                title: (0, nls_1.localize)('testing.searchForTestExtension', "Search for Test Extension"),
            });
        }
        async run(accessor) {
            var _a;
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = (_a = (await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true))) === null || _a === void 0 ? void 0 : _a.getViewPaneContainer();
            viewlet.search('@category:"testing"');
            viewlet.focus();
        }
    }
    exports.SearchForTestExtension = SearchForTestExtension;
    class OpenOutputPeek extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.openOutputPeek" /* TestCommandId.OpenOutputPeek */,
                title: (0, nls_1.localize)('testing.openOutputPeek', "Peek Output"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 43 /* KeyCode.KeyM */),
                },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                },
            });
        }
        async run(accessor) {
            accessor.get(testingPeekOpener_1.ITestingPeekOpener).open();
        }
    }
    exports.OpenOutputPeek = OpenOutputPeek;
    class ToggleInlineTestOutput extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.toggleInlineTestOutput" /* TestCommandId.ToggleInlineTestOutput */,
                title: (0, nls_1.localize)('testing.toggleInlineTestOutput', "Toggle Inline Test Output"),
                category,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: testingContextKeys_1.TestingContextKeys.hasAnyResults.isEqualTo(true),
                },
            });
        }
        async run(accessor) {
            const testService = accessor.get(testService_1.ITestService);
            testService.showInlineOutput.value = !testService.showInlineOutput.value;
        }
    }
    exports.ToggleInlineTestOutput = ToggleInlineTestOutput;
    const refreshMenus = (whenIsRefreshing) => [
        {
            id: actions_1.MenuId.TestItem,
            group: 'inline',
            order: 10 /* ActionOrder.Refresh */,
            when: contextkey_1.ContextKeyExpr.and(testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isRefreshingTests.isEqualTo(whenIsRefreshing)),
        },
        {
            id: actions_1.MenuId.ViewTitle,
            group: 'navigation',
            order: 10 /* ActionOrder.Refresh */,
            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', "workbench.view.testing" /* Testing.ExplorerViewId */), testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true), testingContextKeys_1.TestingContextKeys.isRefreshingTests.isEqualTo(whenIsRefreshing)),
        },
        {
            id: actions_1.MenuId.CommandPalette,
            when: testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true),
        },
    ];
    class RefreshTestsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.refreshTests" /* TestCommandId.RefreshTestsAction */,
                title: (0, nls_1.localize)('testing.refreshTests', "Refresh Tests"),
                category,
                icon: icons.testingRefreshTests,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 80 /* KeyCode.Semicolon */, 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */),
                    when: testingContextKeys_1.TestingContextKeys.canRefreshTests.isEqualTo(true),
                },
                menu: refreshMenus(false),
            });
        }
        async run(accessor, ...elements) {
            const testService = accessor.get(testService_1.ITestService);
            const progressService = accessor.get(progress_1.IProgressService);
            const controllerIds = (0, arrays_1.distinct)(elements
                .filter((e) => e instanceof index_1.TestItemTreeElement)
                .map(e => e.test.controllerId));
            return progressService.withProgress({ location: "workbench.view.extension.test" /* Testing.ViewletId */ }, async () => {
                if (controllerIds.length) {
                    await Promise.all(controllerIds.map(id => testService.refreshTests(id)));
                }
                else {
                    await testService.refreshTests();
                }
            });
        }
    }
    exports.RefreshTestsAction = RefreshTestsAction;
    class CancelTestRefreshAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "testing.cancelTestRefresh" /* TestCommandId.CancelTestRefreshAction */,
                title: (0, nls_1.localize)('testing.cancelTestRefresh', "Cancel Test Refresh"),
                category,
                icon: icons.testingCancelRefreshTests,
                menu: refreshMenus(true),
            });
        }
        async run(accessor) {
            accessor.get(testService_1.ITestService).cancelRefreshTests();
        }
    }
    exports.CancelTestRefreshAction = CancelTestRefreshAction;
    exports.allTestActions = [
        // todo: these are disabled until we figure out how we want autorun to work
        // AutoRunOffAction,
        // AutoRunOnAction,
        CancelTestRefreshAction,
        CancelTestRunAction,
        ClearTestResultsAction,
        CollapseAllAction,
        ConfigureTestProfilesAction,
        DebugAction,
        DebugAllAction,
        DebugAtCursor,
        DebugCurrentFile,
        DebugFailedTests,
        DebugLastRun,
        DebugSelectedAction,
        GoToTest,
        HideTestAction,
        OpenOutputPeek,
        RefreshTestsAction,
        ReRunFailedTests,
        ReRunLastRun,
        RunAction,
        RunAllAction,
        RunAtCursor,
        RunCurrentFile,
        RunSelectedAction,
        RunUsingProfileAction,
        SearchForTestExtension,
        SelectDefaultTestProfiles,
        ShowMostRecentOutputAction,
        TestingSortByDurationAction,
        TestingSortByLocationAction,
        TestingSortByStatusAction,
        TestingViewAsListAction,
        TestingViewAsTreeAction,
        ToggleInlineTestOutput,
        UnhideTestAction,
        UnhideAllTestsAction,
    ];
});
//# sourceMappingURL=testExplorerActions.js.map