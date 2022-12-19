/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingContextKeys = void 0;
    var TestingContextKeys;
    (function (TestingContextKeys) {
        TestingContextKeys.providerCount = new contextkey_1.RawContextKey('testing.providerCount', 0);
        TestingContextKeys.canRefreshTests = new contextkey_1.RawContextKey('testing.canRefresh', false, { type: 'boolean', description: (0, nls_1.localize)('testing.canRefresh', 'Indicates whether any test controller has an attached refresh handler.') });
        TestingContextKeys.isRefreshingTests = new contextkey_1.RawContextKey('testing.isRefreshing', false, { type: 'boolean', description: (0, nls_1.localize)('testing.isRefreshing', 'Indicates whether any test controller is currently refreshing tests.') });
        TestingContextKeys.hasDebuggableTests = new contextkey_1.RawContextKey('testing.hasDebuggableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasDebuggableTests', 'Indicates whether any test controller has registered a debug configuration') });
        TestingContextKeys.hasRunnableTests = new contextkey_1.RawContextKey('testing.hasRunnableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasRunnableTests', 'Indicates whether any test controller has registered a run configuration') });
        TestingContextKeys.hasCoverableTests = new contextkey_1.RawContextKey('testing.hasCoverableTests', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasCoverableTests', 'Indicates whether any test controller has registered a coverage configuration') });
        TestingContextKeys.hasNonDefaultProfile = new contextkey_1.RawContextKey('testing.hasNonDefaultProfile', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasNonDefaultConfig', 'Indicates whether any test controller has registered a non-default configuration') });
        TestingContextKeys.hasConfigurableProfile = new contextkey_1.RawContextKey('testing.hasConfigurableProfile', false, { type: 'boolean', description: (0, nls_1.localize)('testing.hasConfigurableConfig', 'Indicates whether any test configuration can be configured') });
        TestingContextKeys.capabilityToContextKey = {
            [2 /* TestRunProfileBitset.Run */]: TestingContextKeys.hasRunnableTests,
            [8 /* TestRunProfileBitset.Coverage */]: TestingContextKeys.hasCoverableTests,
            [4 /* TestRunProfileBitset.Debug */]: TestingContextKeys.hasDebuggableTests,
            [16 /* TestRunProfileBitset.HasNonDefaultProfile */]: TestingContextKeys.hasNonDefaultProfile,
            [32 /* TestRunProfileBitset.HasConfigurable */]: TestingContextKeys.hasConfigurableProfile,
        };
        TestingContextKeys.hasAnyResults = new contextkey_1.RawContextKey('testing.hasAnyResults', false);
        TestingContextKeys.viewMode = new contextkey_1.RawContextKey('testing.explorerViewMode', "list" /* TestExplorerViewMode.List */);
        TestingContextKeys.viewSorting = new contextkey_1.RawContextKey('testing.explorerViewSorting', "location" /* TestExplorerViewSorting.ByLocation */);
        TestingContextKeys.isRunning = new contextkey_1.RawContextKey('testing.isRunning', false);
        TestingContextKeys.isInPeek = new contextkey_1.RawContextKey('testing.isInPeek', true);
        TestingContextKeys.isPeekVisible = new contextkey_1.RawContextKey('testing.isPeekVisible', false);
        TestingContextKeys.autoRun = new contextkey_1.RawContextKey('testing.autoRun', false);
        TestingContextKeys.peekItemType = new contextkey_1.RawContextKey('peekItemType', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.peekItemType', 'Type of the item in the output peek view. Either a "test", "message", "task", or "result".'),
        });
        TestingContextKeys.controllerId = new contextkey_1.RawContextKey('controllerId', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.controllerId', 'Controller ID of the current test item')
        });
        TestingContextKeys.testItemExtId = new contextkey_1.RawContextKey('testId', undefined, {
            type: 'string',
            description: (0, nls_1.localize)('testing.testId', 'ID of the current test item, set when creating or opening menus on test items')
        });
        TestingContextKeys.testItemHasUri = new contextkey_1.RawContextKey('testing.testItemHasUri', false, {
            type: 'boolean',
            description: (0, nls_1.localize)('testing.testItemHasUri', 'Boolean indicating whether the test item has a URI defined')
        });
        TestingContextKeys.testItemIsHidden = new contextkey_1.RawContextKey('testing.testItemIsHidden', false, {
            type: 'boolean',
            description: (0, nls_1.localize)('testing.testItemIsHidden', 'Boolean indicating whether the test item is hidden')
        });
    })(TestingContextKeys = exports.TestingContextKeys || (exports.TestingContextKeys = {}));
});
//# sourceMappingURL=testingContextKeys.js.map