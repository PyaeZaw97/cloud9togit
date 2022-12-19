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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/types", "vs/base/common/uri", "vs/editor/common/core/range", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testCoverage", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol"], function (require, exports, lifecycle_1, marshalling_1, types_1, uri_1, range_1, observableValue_1, testTypes_1, testCoverage_1, testProfileService_1, testResult_1, testResultService_1, testService_1, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTesting = void 0;
    let MainThreadTesting = class MainThreadTesting extends lifecycle_1.Disposable {
        constructor(extHostContext, testService, testProfiles, resultService) {
            super();
            this.testService = testService;
            this.testProfiles = testProfiles;
            this.resultService = resultService;
            this.diffListener = this._register(new lifecycle_1.MutableDisposable());
            this.testProviderRegistrations = new Map();
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTesting);
            const prevResults = resultService.results.map(r => r.toJSON()).filter(types_1.isDefined);
            if (prevResults.length) {
                this.proxy.$publishTestResults(prevResults);
            }
            this._register(this.testService.onDidCancelTestRun(({ runId }) => {
                this.proxy.$cancelExtensionTestRun(runId);
            }));
            this._register(resultService.onResultsChanged(evt => {
                const results = 'completed' in evt ? evt.completed : ('inserted' in evt ? evt.inserted : undefined);
                const serialized = results === null || results === void 0 ? void 0 : results.toJSON();
                if (serialized) {
                    this.proxy.$publishTestResults([serialized]);
                }
            }));
        }
        /**
         * @inheritdoc
         */
        $publishTestRunProfile(profile) {
            const controller = this.testProviderRegistrations.get(profile.controllerId);
            if (controller) {
                this.testProfiles.addProfile(controller.instance, profile);
            }
        }
        /**
         * @inheritdoc
         */
        $updateTestRunConfig(controllerId, profileId, update) {
            this.testProfiles.updateProfile(controllerId, profileId, update);
        }
        /**
         * @inheritdoc
         */
        $removeTestProfile(controllerId, profileId) {
            this.testProfiles.removeProfile(controllerId, profileId);
        }
        /**
         * @inheritdoc
         */
        $addTestsToRun(controllerId, runId, tests) {
            this.withLiveRun(runId, r => r.addTestChainToRun(controllerId, tests.map(testTypes_1.ITestItem.deserialize)));
        }
        /**
         * @inheritdoc
         */
        $signalCoverageAvailable(runId, taskId) {
            this.withLiveRun(runId, run => {
                const task = run.tasks.find(t => t.id === taskId);
                if (!task) {
                    return;
                }
                task.coverage.value = new testCoverage_1.TestCoverage({
                    provideFileCoverage: async (token) => (0, marshalling_1.revive)(await this.proxy.$provideFileCoverage(runId, taskId, token)),
                    resolveFileCoverage: (i, token) => this.proxy.$resolveFileCoverage(runId, taskId, i, token),
                });
            });
        }
        /**
         * @inheritdoc
         */
        $startedExtensionTestRun(req) {
            this.resultService.createLiveResult(req);
        }
        /**
         * @inheritdoc
         */
        $startedTestRunTask(runId, task) {
            this.withLiveRun(runId, r => r.addTask(task));
        }
        /**
         * @inheritdoc
         */
        $finishedTestRunTask(runId, taskId) {
            this.withLiveRun(runId, r => r.markTaskComplete(taskId));
        }
        /**
         * @inheritdoc
         */
        $finishedExtensionTestRun(runId) {
            this.withLiveRun(runId, r => r.markComplete());
        }
        /**
         * @inheritdoc
         */
        $updateTestStateInRun(runId, taskId, testId, state, duration) {
            this.withLiveRun(runId, r => r.updateState(testId, taskId, state, duration));
        }
        /**
         * @inheritdoc
         */
        $appendOutputToRun(runId, taskId, output, locationDto, testId) {
            const location = locationDto && {
                uri: uri_1.URI.revive(locationDto.uri),
                range: range_1.Range.lift(locationDto.range)
            };
            this.withLiveRun(runId, r => r.appendOutput(output, taskId, location, testId));
        }
        /**
         * @inheritdoc
         */
        $appendTestMessagesInRun(runId, taskId, testId, messages) {
            const r = this.resultService.getResult(runId);
            if (r && r instanceof testResult_1.LiveTestResult) {
                for (const message of messages) {
                    r.appendMessage(testId, taskId, testTypes_1.ITestMessage.deserialize(message));
                }
            }
        }
        /**
         * @inheritdoc
         */
        $registerTestController(controllerId, labelStr, canRefreshValue) {
            const disposable = new lifecycle_1.DisposableStore();
            const label = disposable.add(new observableValue_1.MutableObservableValue(labelStr));
            const canRefresh = disposable.add(new observableValue_1.MutableObservableValue(canRefreshValue));
            const controller = {
                id: controllerId,
                label,
                canRefresh,
                refreshTests: token => this.proxy.$refreshTests(controllerId, token),
                configureRunProfile: id => this.proxy.$configureRunProfile(controllerId, id),
                runTests: (req, token) => this.proxy.$runControllerTests(req, token),
                expandTest: (testId, levels) => this.proxy.$expandTest(testId, isFinite(levels) ? levels : -1),
            };
            disposable.add((0, lifecycle_1.toDisposable)(() => this.testProfiles.removeProfile(controllerId)));
            disposable.add(this.testService.registerTestController(controllerId, controller));
            this.testProviderRegistrations.set(controllerId, {
                instance: controller,
                label,
                canRefresh,
                disposable
            });
        }
        /**
         * @inheritdoc
         */
        $updateController(controllerId, patch) {
            const controller = this.testProviderRegistrations.get(controllerId);
            if (!controller) {
                return;
            }
            if (patch.label !== undefined) {
                controller.label.value = patch.label;
            }
            if (patch.canRefresh !== undefined) {
                controller.canRefresh.value = patch.canRefresh;
            }
        }
        /**
         * @inheritdoc
         */
        $unregisterTestController(controllerId) {
            var _a;
            (_a = this.testProviderRegistrations.get(controllerId)) === null || _a === void 0 ? void 0 : _a.disposable.dispose();
            this.testProviderRegistrations.delete(controllerId);
        }
        /**
         * @inheritdoc
         */
        $subscribeToDiffs() {
            this.proxy.$acceptDiff(this.testService.collection.getReviverDiff().map(testTypes_1.TestsDiffOp.serialize));
            this.diffListener.value = this.testService.onDidProcessDiff(this.proxy.$acceptDiff, this.proxy);
        }
        /**
         * @inheritdoc
         */
        $unsubscribeFromDiffs() {
            this.diffListener.clear();
        }
        /**
         * @inheritdoc
         */
        $publishDiff(controllerId, diff) {
            this.testService.publishDiff(controllerId, diff.map(testTypes_1.TestsDiffOp.deserialize));
        }
        async $runTests(req, token) {
            const result = await this.testService.runResolvedTests(req, token);
            return result.id;
        }
        dispose() {
            super.dispose();
            for (const subscription of this.testProviderRegistrations.values()) {
                subscription.disposable.dispose();
            }
            this.testProviderRegistrations.clear();
        }
        withLiveRun(runId, fn) {
            const r = this.resultService.getResult(runId);
            return r && r instanceof testResult_1.LiveTestResult ? fn(r) : undefined;
        }
    };
    MainThreadTesting = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTesting),
        __param(1, testService_1.ITestService),
        __param(2, testProfileService_1.ITestProfileService),
        __param(3, testResultService_1.ITestResultService)
    ], MainThreadTesting);
    exports.MainThreadTesting = MainThreadTesting;
});
//# sourceMappingURL=mainThreadTesting.js.map