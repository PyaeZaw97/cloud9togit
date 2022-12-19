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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, async_1, event_1, lifecycle_1, nls_1, configuration_1, instantiation_1, progress_1, configuration_2, testingStates_1, testResultService_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingProgressUiService = exports.TestingProgressTrigger = exports.ITestingProgressUiService = void 0;
    exports.ITestingProgressUiService = (0, instantiation_1.createDecorator)('testingProgressUiService');
    /** Workbench contribution that triggers updates in the TestingProgressUi service */
    let TestingProgressTrigger = class TestingProgressTrigger extends lifecycle_1.Disposable {
        constructor(resultService, progressService, configurationService, paneCompositeService) {
            super();
            this.configurationService = configurationService;
            this.paneCompositeService = paneCompositeService;
            const scheduler = this._register(new async_1.RunOnceScheduler(() => progressService.update(), 200));
            this._register(resultService.onResultsChanged((e) => {
                if ('started' in e) {
                    this.attachAutoOpenForNewResults(e.started);
                }
                if (!scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            }));
            this._register(resultService.onTestChanged(() => {
                if (!scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            }));
        }
        attachAutoOpenForNewResults(result) {
            if (result.request.isUiTriggered === false) {
                return;
            }
            const cfg = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.openTesting" /* TestingConfigKeys.OpenTesting */);
            if (cfg === "neverOpen" /* AutoOpenTesting.NeverOpen */) {
                return;
            }
            if (cfg === "openOnTestStart" /* AutoOpenTesting.OpenOnTestStart */) {
                return this.openTestView();
            }
            // open on failure
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add(result.onComplete(() => disposable.dispose()));
            disposable.add(result.onChange(e => {
                if (e.reason === 1 /* TestResultItemChangeReason.OwnStateChange */ && (0, testingStates_1.isFailedState)(e.item.ownComputedState)) {
                    this.openTestView();
                    disposable.dispose();
                }
            }));
        }
        openTestView() {
            this.paneCompositeService.openPaneComposite("workbench.view.extension.test" /* Testing.ViewletId */, 0 /* ViewContainerLocation.Sidebar */);
        }
    };
    TestingProgressTrigger = __decorate([
        __param(0, testResultService_1.ITestResultService),
        __param(1, exports.ITestingProgressUiService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, panecomposite_1.IPaneCompositePartService)
    ], TestingProgressTrigger);
    exports.TestingProgressTrigger = TestingProgressTrigger;
    let TestingProgressUiService = class TestingProgressUiService extends lifecycle_1.Disposable {
        constructor(resultService, instantiaionService) {
            super();
            this.resultService = resultService;
            this.instantiaionService = instantiaionService;
            this.windowProg = this._register(new lifecycle_1.MutableDisposable());
            this.testViewProg = this._register(new lifecycle_1.MutableDisposable());
            this.updateCountsEmitter = new event_1.Emitter();
            this.updateTextEmitter = new event_1.Emitter();
            this.lastRunSoFar = 0;
            this.onCountChange = this.updateCountsEmitter.event;
            this.onTextChange = this.updateTextEmitter.event;
        }
        /** @inheritdoc */
        update() {
            const allResults = this.resultService.results;
            const running = allResults.filter(r => r.completedAt === undefined);
            if (!running.length) {
                if (allResults.length) {
                    const collected = collectTestStateCounts(false, allResults[0].counts);
                    this.updateCountsEmitter.fire(collected);
                    this.updateTextEmitter.fire(getTestProgressText(false, collected));
                }
                else {
                    this.updateTextEmitter.fire('');
                    this.updateCountsEmitter.fire(collectTestStateCounts(false));
                }
                this.windowProg.clear();
                this.testViewProg.clear();
                this.lastRunSoFar = 0;
                return;
            }
            if (!this.windowProg.value) {
                this.windowProg.value = this.instantiaionService.createInstance(progress_1.UnmanagedProgress, {
                    location: 10 /* ProgressLocation.Window */,
                });
                this.testViewProg.value = this.instantiaionService.createInstance(progress_1.UnmanagedProgress, {
                    location: "workbench.view.extension.test" /* Testing.ViewletId */,
                    total: 100,
                });
            }
            const collected = collectTestStateCounts(true, ...running.map(r => r.counts));
            this.updateCountsEmitter.fire(collected);
            const message = getTestProgressText(true, collected);
            this.updateTextEmitter.fire(message);
            this.windowProg.value.report({ message });
            this.testViewProg.value.report({ increment: collected.runSoFar - this.lastRunSoFar, total: collected.totalWillBeRun });
            this.lastRunSoFar = collected.runSoFar;
        }
    };
    TestingProgressUiService = __decorate([
        __param(0, testResultService_1.ITestResultService),
        __param(1, instantiation_1.IInstantiationService)
    ], TestingProgressUiService);
    exports.TestingProgressUiService = TestingProgressUiService;
    const collectTestStateCounts = (isRunning, ...counts) => {
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        let running = 0;
        let queued = 0;
        for (const count of counts) {
            failed += count[6 /* TestResultState.Errored */] + count[4 /* TestResultState.Failed */];
            passed += count[3 /* TestResultState.Passed */];
            skipped += count[5 /* TestResultState.Skipped */];
            running += count[2 /* TestResultState.Running */];
            queued += count[1 /* TestResultState.Queued */];
        }
        return {
            isRunning,
            passed,
            failed,
            runSoFar: passed + failed,
            totalWillBeRun: passed + failed + queued + running,
            skipped,
        };
    };
    const getTestProgressText = (running, { passed, runSoFar, totalWillBeRun, skipped, failed }) => {
        let percent = passed / runSoFar * 100;
        if (failed > 0) {
            // fix: prevent from rounding to 100 if there's any failed test
            percent = Math.min(percent, 99.9);
        }
        else if (runSoFar === 0) {
            percent = 0;
        }
        if (running) {
            if (runSoFar === 0) {
                return (0, nls_1.localize)('testProgress.runningInitial', 'Running tests...');
            }
            else if (skipped === 0) {
                return (0, nls_1.localize)('testProgress.running', 'Running tests, {0}/{1} passed ({2}%)', passed, totalWillBeRun, percent.toPrecision(3));
            }
            else {
                return (0, nls_1.localize)('testProgressWithSkip.running', 'Running tests, {0}/{1} tests passed ({2}%, {3} skipped)', passed, totalWillBeRun, percent.toPrecision(3), skipped);
            }
        }
        else {
            if (skipped === 0) {
                return (0, nls_1.localize)('testProgress.completed', '{0}/{1} tests passed ({2}%)', passed, runSoFar, percent.toPrecision(3));
            }
            else {
                return (0, nls_1.localize)('testProgressWithSkip.completed', '{0}/{1} tests passed ({2}%, {3} skipped)', passed, runSoFar, percent.toPrecision(3), skipped);
            }
        }
    };
});
//# sourceMappingURL=testingProgressUiService.js.map