/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTestingConfiguration = exports.testingConfiguation = exports.DefaultGutterClickAction = exports.AutoRunMode = exports.AutoOpenPeekViewWhen = exports.AutoOpenTesting = exports.TestingConfigKeys = void 0;
    var TestingConfigKeys;
    (function (TestingConfigKeys) {
        TestingConfigKeys["AutoRunDelay"] = "testing.autoRun.delay";
        TestingConfigKeys["AutoRunMode"] = "testing.autoRun.mode";
        TestingConfigKeys["AutoOpenPeekView"] = "testing.automaticallyOpenPeekView";
        TestingConfigKeys["AutoOpenPeekViewDuringAutoRun"] = "testing.automaticallyOpenPeekViewDuringAutoRun";
        TestingConfigKeys["OpenTesting"] = "testing.openTesting";
        TestingConfigKeys["FollowRunningTest"] = "testing.followRunningTest";
        TestingConfigKeys["DefaultGutterClickAction"] = "testing.defaultGutterClickAction";
        TestingConfigKeys["GutterEnabled"] = "testing.gutterEnabled";
        TestingConfigKeys["SaveBeforeTest"] = "testing.saveBeforeTest";
    })(TestingConfigKeys = exports.TestingConfigKeys || (exports.TestingConfigKeys = {}));
    var AutoOpenTesting;
    (function (AutoOpenTesting) {
        AutoOpenTesting["NeverOpen"] = "neverOpen";
        AutoOpenTesting["OpenOnTestStart"] = "openOnTestStart";
        AutoOpenTesting["OpenOnTestFailure"] = "openOnTestFailure";
    })(AutoOpenTesting = exports.AutoOpenTesting || (exports.AutoOpenTesting = {}));
    var AutoOpenPeekViewWhen;
    (function (AutoOpenPeekViewWhen) {
        AutoOpenPeekViewWhen["FailureVisible"] = "failureInVisibleDocument";
        AutoOpenPeekViewWhen["FailureAnywhere"] = "failureAnywhere";
        AutoOpenPeekViewWhen["Never"] = "never";
    })(AutoOpenPeekViewWhen = exports.AutoOpenPeekViewWhen || (exports.AutoOpenPeekViewWhen = {}));
    var AutoRunMode;
    (function (AutoRunMode) {
        AutoRunMode["AllInWorkspace"] = "all";
        AutoRunMode["OnlyPreviouslyRun"] = "rerun";
    })(AutoRunMode = exports.AutoRunMode || (exports.AutoRunMode = {}));
    var DefaultGutterClickAction;
    (function (DefaultGutterClickAction) {
        DefaultGutterClickAction["Run"] = "run";
        DefaultGutterClickAction["Debug"] = "debug";
        DefaultGutterClickAction["ContextMenu"] = "contextMenu";
    })(DefaultGutterClickAction = exports.DefaultGutterClickAction || (exports.DefaultGutterClickAction = {}));
    exports.testingConfiguation = {
        id: 'testing',
        order: 21,
        title: (0, nls_1.localize)('testConfigurationTitle', "Testing"),
        type: 'object',
        properties: {
            ["testing.autoRun.mode" /* TestingConfigKeys.AutoRunMode */]: {
                description: (0, nls_1.localize)('testing.autoRun.mode', "Controls which tests are automatically run."),
                enum: [
                    "all" /* AutoRunMode.AllInWorkspace */,
                    "rerun" /* AutoRunMode.OnlyPreviouslyRun */,
                ],
                default: "all" /* AutoRunMode.AllInWorkspace */,
                enumDescriptions: [
                    (0, nls_1.localize)('testing.autoRun.mode.allInWorkspace', "Automatically runs all discovered test when auto-run is toggled. Reruns individual tests when they are changed."),
                    (0, nls_1.localize)('testing.autoRun.mode.onlyPreviouslyRun', "Reruns individual tests when they are changed. Will not automatically run any tests that have not been already executed.")
                ],
            },
            ["testing.autoRun.delay" /* TestingConfigKeys.AutoRunDelay */]: {
                type: 'integer',
                minimum: 0,
                description: (0, nls_1.localize)('testing.autoRun.delay', "How long to wait, in milliseconds, after a test is marked as outdated and starting a new run."),
                default: 1000,
            },
            ["testing.automaticallyOpenPeekView" /* TestingConfigKeys.AutoOpenPeekView */]: {
                description: (0, nls_1.localize)('testing.automaticallyOpenPeekView', "Configures when the error peek view is automatically opened."),
                enum: [
                    "failureAnywhere" /* AutoOpenPeekViewWhen.FailureAnywhere */,
                    "failureInVisibleDocument" /* AutoOpenPeekViewWhen.FailureVisible */,
                    "never" /* AutoOpenPeekViewWhen.Never */,
                ],
                default: "failureInVisibleDocument" /* AutoOpenPeekViewWhen.FailureVisible */,
                enumDescriptions: [
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.failureAnywhere', "Open automatically no matter where the failure is."),
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.failureInVisibleDocument', "Open automatically when a test fails in a visible document."),
                    (0, nls_1.localize)('testing.automaticallyOpenPeekView.never', "Never automatically open."),
                ],
            },
            ["testing.automaticallyOpenPeekViewDuringAutoRun" /* TestingConfigKeys.AutoOpenPeekViewDuringAutoRun */]: {
                description: (0, nls_1.localize)('testing.automaticallyOpenPeekViewDuringAutoRun', "Controls whether to automatically open the peek view during auto-run mode."),
                type: 'boolean',
                default: false,
            },
            ["testing.followRunningTest" /* TestingConfigKeys.FollowRunningTest */]: {
                description: (0, nls_1.localize)('testing.followRunningTest', 'Controls whether the running test should be followed in the test explorer view'),
                type: 'boolean',
                default: true,
            },
            ["testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */]: {
                description: (0, nls_1.localize)('testing.defaultGutterClickAction', 'Controls the action to take when left-clicking on a test decoration in the gutter.'),
                enum: [
                    "run" /* DefaultGutterClickAction.Run */,
                    "debug" /* DefaultGutterClickAction.Debug */,
                    "contextMenu" /* DefaultGutterClickAction.ContextMenu */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.defaultGutterClickAction.run', 'Run the test.'),
                    (0, nls_1.localize)('testing.defaultGutterClickAction.debug', 'Debug the test.'),
                    (0, nls_1.localize)('testing.defaultGutterClickAction.contextMenu', 'Open the context menu for more options.'),
                ],
                default: "run" /* DefaultGutterClickAction.Run */,
            },
            ["testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */]: {
                description: (0, nls_1.localize)('testing.gutterEnabled', 'Controls whether test decorations are shown in the editor gutter.'),
                type: 'boolean',
                default: true,
            },
            ["testing.saveBeforeTest" /* TestingConfigKeys.SaveBeforeTest */]: {
                description: (0, nls_1.localize)('testing.saveBeforeTest', 'Control whether save all dirty editors before running a test.'),
                type: 'boolean',
                default: true,
            },
            ["testing.openTesting" /* TestingConfigKeys.OpenTesting */]: {
                enum: [
                    "neverOpen" /* AutoOpenTesting.NeverOpen */,
                    "openOnTestStart" /* AutoOpenTesting.OpenOnTestStart */,
                    "openOnTestFailure" /* AutoOpenTesting.OpenOnTestFailure */,
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('testing.openTesting.neverOpen', 'Never automatically open the testing view'),
                    (0, nls_1.localize)('testing.openTesting.openOnTestStart', 'Open the testing view when tests start'),
                    (0, nls_1.localize)('testing.openTesting.openOnTestFailure', 'Open the testing view on any test failure'),
                ],
                default: 'openOnTestStart',
                description: (0, nls_1.localize)('testing.openTesting', "Controls when the testing view should open.")
            },
        }
    };
    const getTestingConfiguration = (config, key) => config.getValue(key);
    exports.getTestingConfiguration = getTestingConfiguration;
});
//# sourceMappingURL=configuration.js.map