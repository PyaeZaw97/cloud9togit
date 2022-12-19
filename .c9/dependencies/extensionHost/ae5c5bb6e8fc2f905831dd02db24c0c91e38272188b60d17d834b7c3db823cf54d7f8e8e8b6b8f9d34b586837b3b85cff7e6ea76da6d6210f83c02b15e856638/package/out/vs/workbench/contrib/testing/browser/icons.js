/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/testing/browser/theme"], function (require, exports, codicons_1, nls_1, iconRegistry_1, themeService_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testingStatesToIcons = exports.testingCancelRefreshTests = exports.testingRefreshTests = exports.testingUpdateProfiles = exports.testingShowAsTree = exports.testingShowAsList = exports.testingHiddenIcon = exports.testingFilterIcon = exports.testingCancelIcon = exports.testingDebugIcon = exports.testingDebugAllIcon = exports.testingRunAllIcon = exports.testingRunIcon = exports.testingViewIcon = void 0;
    exports.testingViewIcon = (0, iconRegistry_1.registerIcon)('test-view-icon', codicons_1.Codicon.beaker, (0, nls_1.localize)('testViewIcon', 'View icon of the test view.'));
    exports.testingRunIcon = (0, iconRegistry_1.registerIcon)('testing-run-icon', codicons_1.Codicon.run, (0, nls_1.localize)('testingRunIcon', 'Icon of the "run test" action.'));
    exports.testingRunAllIcon = (0, iconRegistry_1.registerIcon)('testing-run-all-icon', codicons_1.Codicon.runAll, (0, nls_1.localize)('testingRunAllIcon', 'Icon of the "run all tests" action.'));
    // todo: https://github.com/microsoft/vscode-codicons/issues/72
    exports.testingDebugAllIcon = (0, iconRegistry_1.registerIcon)('testing-debug-all-icon', codicons_1.Codicon.debugAltSmall, (0, nls_1.localize)('testingDebugAllIcon', 'Icon of the "debug all tests" action.'));
    exports.testingDebugIcon = (0, iconRegistry_1.registerIcon)('testing-debug-icon', codicons_1.Codicon.debugAltSmall, (0, nls_1.localize)('testingDebugIcon', 'Icon of the "debug test" action.'));
    exports.testingCancelIcon = (0, iconRegistry_1.registerIcon)('testing-cancel-icon', codicons_1.Codicon.debugStop, (0, nls_1.localize)('testingCancelIcon', 'Icon to cancel ongoing test runs.'));
    exports.testingFilterIcon = (0, iconRegistry_1.registerIcon)('testing-filter', codicons_1.Codicon.filter, (0, nls_1.localize)('filterIcon', 'Icon for the \'Filter\' action in the testing view.'));
    exports.testingHiddenIcon = (0, iconRegistry_1.registerIcon)('testing-hidden', codicons_1.Codicon.eyeClosed, (0, nls_1.localize)('hiddenIcon', 'Icon shown beside hidden tests, when they\'ve been shown.'));
    exports.testingShowAsList = (0, iconRegistry_1.registerIcon)('testing-show-as-list-icon', codicons_1.Codicon.listTree, (0, nls_1.localize)('testingShowAsList', 'Icon shown when the test explorer is disabled as a tree.'));
    exports.testingShowAsTree = (0, iconRegistry_1.registerIcon)('testing-show-as-list-icon', codicons_1.Codicon.listFlat, (0, nls_1.localize)('testingShowAsTree', 'Icon shown when the test explorer is disabled as a list.'));
    exports.testingUpdateProfiles = (0, iconRegistry_1.registerIcon)('testing-update-profiles', codicons_1.Codicon.gear, (0, nls_1.localize)('testingUpdateProfiles', 'Icon shown to update test profiles.'));
    exports.testingRefreshTests = (0, iconRegistry_1.registerIcon)('testing-refresh-tests', codicons_1.Codicon.refresh, (0, nls_1.localize)('testingRefreshTests', 'Icon on the button to refresh tests.'));
    exports.testingCancelRefreshTests = (0, iconRegistry_1.registerIcon)('testing-cancel-refresh-tests', codicons_1.Codicon.stop, (0, nls_1.localize)('testingCancelRefreshTests', 'Icon on the button to cancel refreshing tests.'));
    exports.testingStatesToIcons = new Map([
        [6 /* TestResultState.Errored */, (0, iconRegistry_1.registerIcon)('testing-error-icon', codicons_1.Codicon.issues, (0, nls_1.localize)('testingErrorIcon', 'Icon shown for tests that have an error.'))],
        [4 /* TestResultState.Failed */, (0, iconRegistry_1.registerIcon)('testing-failed-icon', codicons_1.Codicon.error, (0, nls_1.localize)('testingFailedIcon', 'Icon shown for tests that failed.'))],
        [3 /* TestResultState.Passed */, (0, iconRegistry_1.registerIcon)('testing-passed-icon', codicons_1.Codicon.pass, (0, nls_1.localize)('testingPassedIcon', 'Icon shown for tests that passed.'))],
        [1 /* TestResultState.Queued */, (0, iconRegistry_1.registerIcon)('testing-queued-icon', codicons_1.Codicon.history, (0, nls_1.localize)('testingQueuedIcon', 'Icon shown for tests that are queued.'))],
        [2 /* TestResultState.Running */, iconRegistry_1.spinningLoading],
        [5 /* TestResultState.Skipped */, (0, iconRegistry_1.registerIcon)('testing-skipped-icon', codicons_1.Codicon.debugStepOver, (0, nls_1.localize)('testingSkippedIcon', 'Icon shown for tests that are skipped.'))],
        [0 /* TestResultState.Unset */, (0, iconRegistry_1.registerIcon)('testing-unset-icon', codicons_1.Codicon.circleOutline, (0, nls_1.localize)('testingUnsetIcon', 'Icon shown for tests that are in an unset state.'))],
    ]);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        for (const [state, icon] of exports.testingStatesToIcons.entries()) {
            const color = theme_1.testStatesToIconColors[state];
            if (!color) {
                continue;
            }
            collector.addRule(`.monaco-workbench ${themeService_1.ThemeIcon.asCSSSelector(icon)} {
			color: ${theme.getColor(color)} !important;
		}`);
        }
        collector.addRule(`
		.monaco-editor ${themeService_1.ThemeIcon.asCSSSelector(exports.testingRunIcon)},
		.monaco-editor ${themeService_1.ThemeIcon.asCSSSelector(exports.testingRunAllIcon)} {
			color: ${theme.getColor(theme_1.testingColorRunAction)};
		}
	`);
    });
});
//# sourceMappingURL=icons.js.map