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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/testing/common/mainThreadTestCollection", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testExclusions", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/testing/common/configuration"], function (require, exports, arrays_1, cancellation_1, event_1, iterator_1, lifecycle_1, nls_1, contextkey_1, instantiation_1, notification_1, storage_1, workspaceTrust_1, mainThreadTestCollection_1, observableValue_1, storedValue_1, testExclusions_1, testId_1, testingContextKeys_1, testProfileService_1, testResultService_1, editorService_1, configuration_1, configuration_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestService = void 0;
    let TestService = class TestService extends lifecycle_1.Disposable {
        constructor(contextKeyService, instantiationService, storage, editorService, testProfiles, notificationService, configurationService, testResults, workspaceTrustRequestService) {
            super();
            this.storage = storage;
            this.editorService = editorService;
            this.testProfiles = testProfiles;
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.testResults = testResults;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.testControllers = new Map();
            this.cancelExtensionTestRunEmitter = new event_1.Emitter();
            this.willProcessDiffEmitter = new event_1.Emitter();
            this.didProcessDiffEmitter = new event_1.Emitter();
            this.testRefreshCancellations = new Set();
            /**
             * Cancellation for runs requested by the user being managed by the UI.
             * Test runs initiated by extensions are not included here.
             */
            this.uiRunningTests = new Map();
            /**
             * @inheritdoc
             */
            this.onWillProcessDiff = this.willProcessDiffEmitter.event;
            /**
             * @inheritdoc
             */
            this.onDidProcessDiff = this.didProcessDiffEmitter.event;
            /**
             * @inheritdoc
             */
            this.onDidCancelTestRun = this.cancelExtensionTestRunEmitter.event;
            /**
             * @inheritdoc
             */
            this.collection = new mainThreadTestCollection_1.MainThreadTestCollection(this.expandTest.bind(this));
            /**
             * @inheritdoc
             */
            this.showInlineOutput = observableValue_1.MutableObservableValue.stored(new storedValue_1.StoredValue({
                key: 'inlineTestOutputVisible',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 0 /* StorageTarget.USER */
            }, this.storage), true);
            this.excluded = instantiationService.createInstance(testExclusions_1.TestExclusions);
            this.providerCount = testingContextKeys_1.TestingContextKeys.providerCount.bindTo(contextKeyService);
            this.canRefreshTests = testingContextKeys_1.TestingContextKeys.canRefreshTests.bindTo(contextKeyService);
            this.isRefreshingTests = testingContextKeys_1.TestingContextKeys.isRefreshingTests.bindTo(contextKeyService);
        }
        /**
         * @inheritdoc
         */
        async expandTest(id, levels) {
            var _a;
            await ((_a = this.testControllers.get(testId_1.TestId.fromString(id).controllerId)) === null || _a === void 0 ? void 0 : _a.expandTest(id, levels));
        }
        /**
         * @inheritdoc
         */
        cancelTestRun(runId) {
            var _a;
            this.cancelExtensionTestRunEmitter.fire({ runId });
            if (runId === undefined) {
                for (const runCts of this.uiRunningTests.values()) {
                    runCts.cancel();
                }
            }
            else {
                (_a = this.uiRunningTests.get(runId)) === null || _a === void 0 ? void 0 : _a.cancel();
            }
        }
        /**
         * @inheritdoc
         */
        async runTests(req, token = cancellation_1.CancellationToken.None) {
            var _a;
            const resolved = {
                targets: [],
                exclude: (_a = req.exclude) === null || _a === void 0 ? void 0 : _a.map(t => t.item.extId),
                isAutoRun: req.isAutoRun,
            };
            // First, try to run the tests using the default run profiles...
            for (const profile of this.testProfiles.getGroupDefaultProfiles(req.group)) {
                const testIds = req.tests.filter(t => (0, testProfileService_1.canUseProfileWithTest)(profile, t)).map(t => t.item.extId);
                if (testIds.length) {
                    resolved.targets.push({
                        testIds: testIds,
                        profileGroup: profile.group,
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                    });
                }
            }
            // If no tests are covered by the defaults, just use whatever the defaults
            // for their controller are. This can happen if the user chose specific
            // profiles for the run button, but then asked to run a single test from the
            // explorer or decoration. We shouldn't no-op.
            if (resolved.targets.length === 0) {
                for (const byController of (0, arrays_1.groupBy)(req.tests, (a, b) => a.controllerId === b.controllerId ? 0 : 1)) {
                    const profiles = this.testProfiles.getControllerProfiles(byController[0].controllerId);
                    const withControllers = byController.map(test => ({
                        profile: profiles.find(p => p.group === req.group && (0, testProfileService_1.canUseProfileWithTest)(p, test)),
                        test,
                    }));
                    for (const byProfile of (0, arrays_1.groupBy)(withControllers, (a, b) => a.profile === b.profile ? 0 : 1)) {
                        const profile = byProfile[0].profile;
                        if (profile) {
                            resolved.targets.push({
                                testIds: byProfile.map(t => t.test.item.extId),
                                profileGroup: req.group,
                                profileId: profile.profileId,
                                controllerId: profile.controllerId,
                            });
                        }
                    }
                }
            }
            return this.runResolvedTests(resolved, token);
        }
        /**
         * @inheritdoc
         */
        async runResolvedTests(req, token = cancellation_1.CancellationToken.None) {
            if (!req.exclude) {
                req.exclude = [...this.excluded.all];
            }
            const result = this.testResults.createLiveResult(req);
            const trust = await this.workspaceTrustRequestService.requestWorkspaceTrust({
                message: (0, nls_1.localize)('testTrust', "Running tests may execute code in your workspace."),
            });
            if (!trust) {
                result.markComplete();
                return result;
            }
            try {
                const cancelSource = new cancellation_1.CancellationTokenSource(token);
                this.uiRunningTests.set(result.id, cancelSource);
                const requests = req.targets.map(group => {
                    var _a;
                    return (_a = this.testControllers.get(group.controllerId)) === null || _a === void 0 ? void 0 : _a.runTests({
                        runId: result.id,
                        excludeExtIds: req.exclude.filter(t => !group.testIds.includes(t)),
                        profileId: group.profileId,
                        controllerId: group.controllerId,
                        testIds: group.testIds,
                    }, cancelSource.token).catch(err => {
                        this.notificationService.error((0, nls_1.localize)('testError', 'An error occurred attempting to run tests: {0}', err.message));
                    });
                });
                await this.saveAllBeforeTest(req);
                await Promise.all(requests);
                return result;
            }
            finally {
                this.uiRunningTests.delete(result.id);
                result.markComplete();
            }
        }
        /**
         * @inheritdoc
         */
        publishDiff(_controllerId, diff) {
            this.willProcessDiffEmitter.fire(diff);
            this.collection.apply(diff);
            this.didProcessDiffEmitter.fire(diff);
        }
        /**
         * @inheritdoc
         */
        getTestController(id) {
            return this.testControllers.get(id);
        }
        /**
         * @inheritdoc
         */
        async refreshTests(controllerId) {
            var _a;
            const cts = new cancellation_1.CancellationTokenSource();
            this.testRefreshCancellations.add(cts);
            this.isRefreshingTests.set(true);
            try {
                if (controllerId) {
                    await ((_a = this.testControllers.get(controllerId)) === null || _a === void 0 ? void 0 : _a.refreshTests(cts.token));
                }
                else {
                    await Promise.all([...this.testControllers.values()].map(c => c.refreshTests(cts.token)));
                }
            }
            finally {
                this.testRefreshCancellations.delete(cts);
                this.isRefreshingTests.set(this.testRefreshCancellations.size > 0);
                cts.dispose();
            }
        }
        /**
         * @inheritdoc
         */
        cancelRefreshTests() {
            for (const cts of this.testRefreshCancellations) {
                cts.cancel();
            }
            this.testRefreshCancellations.clear();
            this.isRefreshingTests.set(false);
        }
        /**
         * @inheritdoc
         */
        registerTestController(id, controller) {
            this.testControllers.set(id, controller);
            this.providerCount.set(this.testControllers.size);
            this.updateCanRefresh();
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add((0, lifecycle_1.toDisposable)(() => {
                const diff = [];
                for (const root of this.collection.rootItems) {
                    if (root.controllerId === id) {
                        diff.push({ op: 2 /* TestDiffOpType.Remove */, itemId: root.item.extId });
                    }
                }
                this.publishDiff(id, diff);
                if (this.testControllers.delete(id)) {
                    this.providerCount.set(this.testControllers.size);
                    this.updateCanRefresh();
                }
            }));
            disposable.add(controller.canRefresh.onDidChange(this.updateCanRefresh, this));
            return disposable;
        }
        async saveAllBeforeTest(req, configurationService = this.configurationService, editorService = this.editorService) {
            if (req.isUiTriggered === false) {
                return;
            }
            const saveBeforeTest = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.saveBeforeTest" /* TestingConfigKeys.SaveBeforeTest */);
            if (saveBeforeTest) {
                await editorService.saveAll();
            }
            return;
        }
        updateCanRefresh() {
            this.canRefreshTests.set(iterator_1.Iterable.some(this.testControllers.values(), t => t.canRefresh.value));
        }
    };
    TestService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, editorService_1.IEditorService),
        __param(4, testProfileService_1.ITestProfileService),
        __param(5, notification_1.INotificationService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, testResultService_1.ITestResultService),
        __param(8, workspaceTrust_1.IWorkspaceTrustRequestService)
    ], TestService);
    exports.TestService = TestService;
});
//# sourceMappingURL=testServiceImpl.js.map