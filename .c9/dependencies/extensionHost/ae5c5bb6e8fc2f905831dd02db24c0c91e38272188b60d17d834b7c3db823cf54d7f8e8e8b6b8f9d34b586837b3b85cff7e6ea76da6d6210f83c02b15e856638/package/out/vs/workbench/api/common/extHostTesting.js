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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/functional", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/uuid", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTestItem", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testItemCollection", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, arrays_1, buffer_1, cancellation_1, event_1, functional_1, hash_1, lifecycle_1, objects_1, types_1, uuid_1, extHost_protocol_1, extHostRpcService_1, extHostTestItem_1, Convert, extHostTypes_1, testId_1, testItemCollection_1, testTypes_1) {
    "use strict";
    var _TestRunProfileImpl_proxy, _TestRunProfileImpl_profiles;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestRunProfileImpl = exports.MirroredTestCollection = exports.TestRunDto = exports.TestRunCoordinator = exports.ExtHostTesting = void 0;
    let ExtHostTesting = class ExtHostTesting {
        constructor(rpc, commands) {
            this.resultsChangedEmitter = new event_1.Emitter();
            this.controllers = new Map();
            this.onResultsChanged = this.resultsChangedEmitter.event;
            this.results = [];
            this.proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadTesting);
            this.observer = new TestObservers(this.proxy);
            this.runTracker = new TestRunCoordinator(this.proxy);
            commands.registerArgumentProcessor({
                processArgument: arg => (arg === null || arg === void 0 ? void 0 : arg.$mid) === 13 /* MarshalledId.TestItemContext */ ? (0, extHostTestItem_1.toItemFromContext)(arg) : arg,
            });
        }
        /**
         * Implements vscode.test.registerTestProvider
         */
        createTestController(controllerId, label, refreshHandler) {
            if (this.controllers.has(controllerId)) {
                throw new Error(`Attempt to insert a duplicate controller with ID "${controllerId}"`);
            }
            const disposable = new lifecycle_1.DisposableStore();
            const collection = disposable.add(new extHostTestItem_1.ExtHostTestItemCollection(controllerId, label));
            collection.root.label = label;
            const profiles = new Map();
            const proxy = this.proxy;
            const controller = {
                items: collection.root.children,
                get label() {
                    return label;
                },
                set label(value) {
                    label = value;
                    collection.root.label = value;
                    proxy.$updateController(controllerId, { label });
                },
                get refreshHandler() {
                    return refreshHandler;
                },
                set refreshHandler(value) {
                    refreshHandler = value;
                    proxy.$updateController(controllerId, { canRefresh: !!value });
                },
                get id() {
                    return controllerId;
                },
                createRunProfile: (label, group, runHandler, isDefault, tag) => {
                    // Derive the profile ID from a hash so that the same profile will tend
                    // to have the same hashes, allowing re-run requests to work across reloads.
                    let profileId = (0, hash_1.hash)(label);
                    while (profiles.has(profileId)) {
                        profileId++;
                    }
                    return new TestRunProfileImpl(this.proxy, profiles, controllerId, profileId, label, group, runHandler, isDefault, tag);
                },
                createTestItem(id, label, uri) {
                    return new extHostTestItem_1.TestItemImpl(controllerId, id, label, uri);
                },
                createTestRun: (request, name, persist = true) => {
                    return this.runTracker.createTestRun(controllerId, collection, request, name, persist);
                },
                set resolveHandler(fn) {
                    collection.resolveHandler = fn;
                },
                get resolveHandler() {
                    return collection.resolveHandler;
                },
                dispose: () => {
                    disposable.dispose();
                },
            };
            proxy.$registerTestController(controllerId, label, !!refreshHandler);
            disposable.add((0, lifecycle_1.toDisposable)(() => proxy.$unregisterTestController(controllerId)));
            const info = { controller, collection, profiles: profiles };
            this.controllers.set(controllerId, info);
            disposable.add((0, lifecycle_1.toDisposable)(() => this.controllers.delete(controllerId)));
            disposable.add(collection.onDidGenerateDiff(diff => proxy.$publishDiff(controllerId, diff.map(testTypes_1.TestsDiffOp.serialize))));
            return controller;
        }
        /**
         * Implements vscode.test.createTestObserver
         */
        createTestObserver() {
            return this.observer.checkout();
        }
        /**
         * Implements vscode.test.runTests
         */
        async runTests(req, token = cancellation_1.CancellationToken.None) {
            var _a, _b, _c;
            const profile = tryGetProfileFromTestRunReq(req);
            if (!profile) {
                throw new Error('The request passed to `vscode.test.runTests` must include a profile');
            }
            const controller = this.controllers.get(profile.controllerId);
            if (!controller) {
                throw new Error('Controller not found');
            }
            await this.proxy.$runTests({
                isUiTriggered: false,
                targets: [{
                        testIds: (_b = (_a = req.include) === null || _a === void 0 ? void 0 : _a.map(t => testId_1.TestId.fromExtHostTestItem(t, controller.collection.root.id).toString())) !== null && _b !== void 0 ? _b : [controller.collection.root.id],
                        profileGroup: profileGroupToBitset[profile.kind],
                        profileId: profile.profileId,
                        controllerId: profile.controllerId,
                    }],
                exclude: (_c = req.exclude) === null || _c === void 0 ? void 0 : _c.map(t => t.id),
            }, token);
        }
        /**
         * @inheritdoc
         */
        $provideFileCoverage(runId, taskId, token) {
            var _a;
            const coverage = (0, arrays_1.mapFind)(this.runTracker.trackers, t => t.id === runId ? t.getCoverage(taskId) : undefined);
            return (_a = coverage === null || coverage === void 0 ? void 0 : coverage.provideFileCoverage(token)) !== null && _a !== void 0 ? _a : Promise.resolve([]);
        }
        /**
         * @inheritdoc
         */
        $resolveFileCoverage(runId, taskId, fileIndex, token) {
            var _a;
            const coverage = (0, arrays_1.mapFind)(this.runTracker.trackers, t => t.id === runId ? t.getCoverage(taskId) : undefined);
            return (_a = coverage === null || coverage === void 0 ? void 0 : coverage.resolveFileCoverage(fileIndex, token)) !== null && _a !== void 0 ? _a : Promise.resolve([]);
        }
        /** @inheritdoc */
        $configureRunProfile(controllerId, profileId) {
            var _a, _b, _c;
            (_c = (_b = (_a = this.controllers.get(controllerId)) === null || _a === void 0 ? void 0 : _a.profiles.get(profileId)) === null || _b === void 0 ? void 0 : _b.configureHandler) === null || _c === void 0 ? void 0 : _c.call(_b);
        }
        /** @inheritdoc */
        async $refreshTests(controllerId, token) {
            var _a, _b, _c;
            await ((_c = (_a = this.controllers.get(controllerId)) === null || _a === void 0 ? void 0 : (_b = _a.controller).refreshHandler) === null || _c === void 0 ? void 0 : _c.call(_b, token));
        }
        /**
         * Updates test results shown to extensions.
         * @override
         */
        $publishTestResults(results) {
            this.results = Object.freeze(results
                .map(r => (0, objects_1.deepFreeze)(Convert.TestResults.to(r)))
                .concat(this.results)
                .sort((a, b) => b.completedAt - a.completedAt)
                .slice(0, 32));
            this.resultsChangedEmitter.fire();
        }
        /**
         * Expands the nodes in the test tree. If levels is less than zero, it will
         * be treated as infinite.
         */
        async $expandTest(testId, levels) {
            var _a;
            const collection = (_a = this.controllers.get(testId_1.TestId.fromString(testId).controllerId)) === null || _a === void 0 ? void 0 : _a.collection;
            if (collection) {
                await collection.expand(testId, levels < 0 ? Infinity : levels);
                collection.flushDiff();
            }
        }
        /**
         * Receives a test update from the main thread. Called (eventually) whenever
         * tests change.
         */
        $acceptDiff(diff) {
            this.observer.applyDiff(diff.map(testTypes_1.TestsDiffOp.deserialize));
        }
        /**
         * Runs tests with the given set of IDs. Allows for test from multiple
         * providers to be run.
         * @override
         */
        async $runControllerTests(req, token) {
            const lookup = this.controllers.get(req.controllerId);
            if (!lookup) {
                return;
            }
            const { collection, profiles } = lookup;
            const profile = profiles.get(req.profileId);
            if (!profile) {
                return;
            }
            const includeTests = req.testIds
                .map((testId) => collection.tree.get(testId))
                .filter(types_1.isDefined);
            const excludeTests = req.excludeExtIds
                .map(id => lookup.collection.tree.get(id))
                .filter(types_1.isDefined)
                .filter(exclude => includeTests.some(include => include.fullId.compare(exclude.fullId) === 2 /* TestPosition.IsChild */));
            if (!includeTests.length) {
                return;
            }
            const publicReq = new extHostTypes_1.TestRunRequest(includeTests.some(i => i.actual instanceof extHostTestItem_1.TestItemRootImpl) ? undefined : includeTests.map(t => t.actual), excludeTests.map(t => t.actual), profile);
            const tracker = this.runTracker.prepareForMainThreadTestRun(publicReq, TestRunDto.fromInternal(req, lookup.collection), token);
            try {
                await profile.runHandler(publicReq, token);
            }
            finally {
                if (tracker.isRunning && !token.isCancellationRequested) {
                    await event_1.Event.toPromise(tracker.onEnd);
                }
                tracker.dispose();
            }
        }
        /**
         * Cancels an ongoing test run.
         */
        $cancelExtensionTestRun(runId) {
            if (runId === undefined) {
                this.runTracker.cancelAllRuns();
            }
            else {
                this.runTracker.cancelRunById(runId);
            }
        }
    };
    ExtHostTesting = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostTesting);
    exports.ExtHostTesting = ExtHostTesting;
    class TestRunTracker extends lifecycle_1.Disposable {
        constructor(dto, proxy, parentToken) {
            super();
            this.dto = dto;
            this.proxy = proxy;
            this.tasks = new Map();
            this.sharedTestIds = new Set();
            this.endEmitter = this._register(new event_1.Emitter());
            this.disposed = false;
            /**
             * Fires when a test ends, and no more tests are left running.
             */
            this.onEnd = this.endEmitter.event;
            this.cts = this._register(new cancellation_1.CancellationTokenSource(parentToken));
            this._register(this.cts.token.onCancellationRequested(() => {
                for (const { run } of this.tasks.values()) {
                    run.end();
                }
            }));
        }
        /**
         * Gets whether there are any tests running.
         */
        get isRunning() {
            return this.tasks.size > 0;
        }
        /**
         * Gets the run ID.
         */
        get id() {
            return this.dto.id;
        }
        getCoverage(taskId) {
            var _a;
            return (_a = this.tasks.get(taskId)) === null || _a === void 0 ? void 0 : _a.coverage;
        }
        createRun(name) {
            const runId = this.dto.id;
            const ctrlId = this.dto.controllerId;
            const taskId = (0, uuid_1.generateUuid)();
            const coverage = new TestRunCoverageBearer(this.proxy, runId, taskId);
            const guardTestMutation = (fn) => (test, ...args) => {
                if (ended) {
                    console.warn(`Setting the state of test "${test.id}" is a no-op after the run ends.`);
                    return;
                }
                if (!this.dto.isIncluded(test)) {
                    return;
                }
                this.ensureTestIsKnown(test);
                fn(test, ...args);
            };
            const appendMessages = (test, messages) => {
                const converted = messages instanceof Array
                    ? messages.map(Convert.TestMessage.from)
                    : [Convert.TestMessage.from(messages)];
                if (test.uri && test.range) {
                    const defaultLocation = { range: Convert.Range.from(test.range), uri: test.uri };
                    for (const message of converted) {
                        message.location = message.location || defaultLocation;
                    }
                }
                this.proxy.$appendTestMessagesInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), converted);
            };
            let ended = false;
            const run = {
                isPersisted: this.dto.isPersisted,
                token: this.cts.token,
                name,
                get coverageProvider() {
                    return coverage.coverageProvider;
                },
                set coverageProvider(provider) {
                    coverage.coverageProvider = provider;
                },
                //#region state mutation
                enqueued: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 1 /* TestResultState.Queued */);
                }),
                skipped: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 5 /* TestResultState.Skipped */);
                }),
                started: guardTestMutation(test => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 2 /* TestResultState.Running */);
                }),
                errored: guardTestMutation((test, messages, duration) => {
                    appendMessages(test, messages);
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 6 /* TestResultState.Errored */, duration);
                }),
                failed: guardTestMutation((test, messages, duration) => {
                    appendMessages(test, messages);
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString(), 4 /* TestResultState.Failed */, duration);
                }),
                passed: guardTestMutation((test, duration) => {
                    this.proxy.$updateTestStateInRun(runId, taskId, testId_1.TestId.fromExtHostTestItem(test, this.dto.controllerId).toString(), 3 /* TestResultState.Passed */, duration);
                }),
                //#endregion
                appendOutput: (output, location, test) => {
                    if (ended) {
                        return;
                    }
                    if (test) {
                        if (this.dto.isIncluded(test)) {
                            this.ensureTestIsKnown(test);
                        }
                        else {
                            test = undefined;
                        }
                    }
                    this.proxy.$appendOutputToRun(runId, taskId, buffer_1.VSBuffer.fromString(output), location && Convert.location.from(location), test && testId_1.TestId.fromExtHostTestItem(test, ctrlId).toString());
                },
                end: () => {
                    if (ended) {
                        return;
                    }
                    ended = true;
                    this.proxy.$finishedTestRunTask(runId, taskId);
                    this.tasks.delete(taskId);
                    if (!this.isRunning) {
                        this.dispose();
                    }
                }
            };
            this.tasks.set(taskId, { run, coverage });
            this.proxy.$startedTestRunTask(runId, { id: taskId, name, running: true });
            return run;
        }
        dispose() {
            if (!this.disposed) {
                this.disposed = true;
                this.endEmitter.fire();
                this.cts.cancel();
                super.dispose();
            }
        }
        ensureTestIsKnown(test) {
            if (!(test instanceof extHostTestItem_1.TestItemImpl)) {
                throw new testItemCollection_1.InvalidTestItemError(test.id);
            }
            if (this.sharedTestIds.has(testId_1.TestId.fromExtHostTestItem(test, this.dto.controllerId).toString())) {
                return;
            }
            const chain = [];
            const root = this.dto.colllection.root;
            while (true) {
                const converted = Convert.TestItem.from(test);
                chain.unshift(converted);
                if (this.sharedTestIds.has(converted.extId)) {
                    break;
                }
                this.sharedTestIds.add(converted.extId);
                if (test === root) {
                    break;
                }
                test = test.parent || root;
            }
            this.proxy.$addTestsToRun(this.dto.controllerId, this.dto.id, chain);
        }
    }
    /**
     * Queues runs for a single extension and provides the currently-executing
     * run so that `createTestRun` can be properly correlated.
     */
    class TestRunCoordinator {
        constructor(proxy) {
            this.proxy = proxy;
            this.tracked = new Map();
        }
        get trackers() {
            return this.tracked.values();
        }
        /**
         * Registers a request as being invoked by the main thread, so
         * `$startedExtensionTestRun` is not invoked. The run must eventually
         * be cancelled manually.
         */
        prepareForMainThreadTestRun(req, dto, token) {
            return this.getTracker(req, dto, token);
        }
        /**
         * Cancels an existing test run via its cancellation token.
         */
        cancelRunById(runId) {
            for (const tracker of this.tracked.values()) {
                if (tracker.id === runId) {
                    tracker.dispose();
                    return;
                }
            }
        }
        /**
         * Cancels an existing test run via its cancellation token.
         */
        cancelAllRuns() {
            for (const tracker of this.tracked.values()) {
                tracker.dispose();
            }
        }
        /**
         * Implements the public `createTestRun` API.
         */
        createTestRun(controllerId, collection, request, name, persist) {
            var _a, _b, _c, _d;
            const existing = this.tracked.get(request);
            if (existing) {
                return existing.createRun(name);
            }
            // If there is not an existing tracked extension for the request, start
            // a new, detached session.
            const dto = TestRunDto.fromPublic(controllerId, collection, request, persist);
            const profile = tryGetProfileFromTestRunReq(request);
            this.proxy.$startedExtensionTestRun({
                controllerId,
                profile: profile && { group: profileGroupToBitset[profile.kind], id: profile.profileId },
                exclude: (_b = (_a = request.exclude) === null || _a === void 0 ? void 0 : _a.map(t => testId_1.TestId.fromExtHostTestItem(t, collection.root.id).toString())) !== null && _b !== void 0 ? _b : [],
                id: dto.id,
                include: (_d = (_c = request.include) === null || _c === void 0 ? void 0 : _c.map(t => testId_1.TestId.fromExtHostTestItem(t, collection.root.id).toString())) !== null && _d !== void 0 ? _d : [collection.root.id],
                persist
            });
            const tracker = this.getTracker(request, dto);
            tracker.onEnd(() => this.proxy.$finishedExtensionTestRun(dto.id));
            return tracker.createRun(name);
        }
        getTracker(req, dto, token) {
            const tracker = new TestRunTracker(dto, this.proxy, token);
            this.tracked.set(req, tracker);
            tracker.onEnd(() => this.tracked.delete(req));
            return tracker;
        }
    }
    exports.TestRunCoordinator = TestRunCoordinator;
    const tryGetProfileFromTestRunReq = (request) => {
        if (!request.profile) {
            return undefined;
        }
        if (!(request.profile instanceof TestRunProfileImpl)) {
            throw new Error(`TestRunRequest.profile is not an instance created from TestController.createRunProfile`);
        }
        return request.profile;
    };
    class TestRunDto {
        constructor(controllerId, id, include, exclude, isPersisted, colllection) {
            this.controllerId = controllerId;
            this.id = id;
            this.isPersisted = isPersisted;
            this.colllection = colllection;
            this.includePrefix = include.map(id => id + "\0" /* TestIdPathParts.Delimiter */);
            this.excludePrefix = exclude.map(id => id + "\0" /* TestIdPathParts.Delimiter */);
        }
        static fromPublic(controllerId, collection, request, persist) {
            var _a, _b, _c, _d;
            return new TestRunDto(controllerId, (0, uuid_1.generateUuid)(), (_b = (_a = request.include) === null || _a === void 0 ? void 0 : _a.map(t => testId_1.TestId.fromExtHostTestItem(t, controllerId).toString())) !== null && _b !== void 0 ? _b : [controllerId], (_d = (_c = request.exclude) === null || _c === void 0 ? void 0 : _c.map(t => testId_1.TestId.fromExtHostTestItem(t, controllerId).toString())) !== null && _d !== void 0 ? _d : [], persist, collection);
        }
        static fromInternal(request, collection) {
            return new TestRunDto(request.controllerId, request.runId, request.testIds, request.excludeExtIds, true, collection);
        }
        isIncluded(test) {
            const id = testId_1.TestId.fromExtHostTestItem(test, this.controllerId).toString() + "\0" /* TestIdPathParts.Delimiter */;
            for (const prefix of this.excludePrefix) {
                if (id === prefix || id.startsWith(prefix)) {
                    return false;
                }
            }
            for (const prefix of this.includePrefix) {
                if (id === prefix || id.startsWith(prefix)) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.TestRunDto = TestRunDto;
    class TestRunCoverageBearer {
        constructor(proxy, runId, taskId) {
            this.proxy = proxy;
            this.runId = runId;
            this.taskId = taskId;
        }
        set coverageProvider(provider) {
            if (this._coverageProvider) {
                throw new Error('The TestCoverageProvider cannot be replaced after being provided');
            }
            if (!provider) {
                return;
            }
            this._coverageProvider = provider;
            this.proxy.$signalCoverageAvailable(this.runId, this.taskId);
        }
        get coverageProvider() {
            return this._coverageProvider;
        }
        async provideFileCoverage(token) {
            var _a;
            if (!this._coverageProvider) {
                return [];
            }
            if (!this.fileCoverage) {
                this.fileCoverage = (async () => this._coverageProvider.provideFileCoverage(token))();
            }
            try {
                const coverage = await this.fileCoverage;
                return (_a = coverage === null || coverage === void 0 ? void 0 : coverage.map(Convert.TestCoverage.fromFile)) !== null && _a !== void 0 ? _a : [];
            }
            catch (e) {
                this.fileCoverage = undefined;
                throw e;
            }
        }
        async resolveFileCoverage(index, token) {
            var _a, _b, _c, _d, _e;
            const fileCoverage = await this.fileCoverage;
            let file = fileCoverage === null || fileCoverage === void 0 ? void 0 : fileCoverage[index];
            if (!this._coverageProvider || !fileCoverage || !file) {
                return [];
            }
            if (!file.detailedCoverage) {
                file = fileCoverage[index] = (_c = await ((_b = (_a = this._coverageProvider).resolveFileCoverage) === null || _b === void 0 ? void 0 : _b.call(_a, file, token))) !== null && _c !== void 0 ? _c : file;
            }
            return (_e = (_d = file.detailedCoverage) === null || _d === void 0 ? void 0 : _d.map(Convert.TestCoverage.fromDetailed)) !== null && _e !== void 0 ? _e : [];
        }
    }
    class MirroredChangeCollector extends testTypes_1.IncrementalChangeCollector {
        constructor(emitter) {
            super();
            this.emitter = emitter;
            this.added = new Set();
            this.updated = new Set();
            this.removed = new Set();
            this.alreadyRemoved = new Set();
        }
        get isEmpty() {
            return this.added.size === 0 && this.removed.size === 0 && this.updated.size === 0;
        }
        /**
         * @override
         */
        add(node) {
            this.added.add(node);
        }
        /**
         * @override
         */
        update(node) {
            Object.assign(node.revived, Convert.TestItem.toPlain(node.item));
            if (!this.added.has(node)) {
                this.updated.add(node);
            }
        }
        /**
         * @override
         */
        remove(node) {
            if (this.added.has(node)) {
                this.added.delete(node);
                return;
            }
            this.updated.delete(node);
            if (node.parent && this.alreadyRemoved.has(node.parent)) {
                this.alreadyRemoved.add(node.item.extId);
                return;
            }
            this.removed.add(node);
        }
        /**
         * @override
         */
        getChangeEvent() {
            const { added, updated, removed } = this;
            return {
                get added() { return [...added].map(n => n.revived); },
                get updated() { return [...updated].map(n => n.revived); },
                get removed() { return [...removed].map(n => n.revived); },
            };
        }
        complete() {
            if (!this.isEmpty) {
                this.emitter.fire(this.getChangeEvent());
            }
        }
    }
    /**
     * Maintains tests in this extension host sent from the main thread.
     * @private
     */
    class MirroredTestCollection extends testTypes_1.AbstractIncrementalTestCollection {
        constructor() {
            super(...arguments);
            this.changeEmitter = new event_1.Emitter();
            /**
             * Change emitter that fires with the same sematics as `TestObserver.onDidChangeTests`.
             */
            this.onDidChangeTests = this.changeEmitter.event;
        }
        /**
         * Gets a list of root test items.
         */
        get rootTests() {
            return super.roots;
        }
        /**
         *
         * If the test ID exists, returns its underlying ID.
         */
        getMirroredTestDataById(itemId) {
            return this.items.get(itemId);
        }
        /**
         * If the test item is a mirrored test item, returns its underlying ID.
         */
        getMirroredTestDataByReference(item) {
            return this.items.get(item.id);
        }
        /**
         * @override
         */
        createItem(item, parent) {
            return Object.assign(Object.assign({}, item), { 
                // todo@connor4312: make this work well again with children
                revived: Convert.TestItem.toPlain(item.item), depth: parent ? parent.depth + 1 : 0, children: new Set() });
        }
        /**
         * @override
         */
        createChangeCollector() {
            return new MirroredChangeCollector(this.changeEmitter);
        }
    }
    exports.MirroredTestCollection = MirroredTestCollection;
    class TestObservers {
        constructor(proxy) {
            this.proxy = proxy;
        }
        checkout() {
            if (!this.current) {
                this.current = this.createObserverData();
            }
            const current = this.current;
            current.observers++;
            return {
                onDidChangeTest: current.tests.onDidChangeTests,
                get tests() { return [...current.tests.rootTests].map(t => t.revived); },
                dispose: (0, functional_1.once)(() => {
                    if (--current.observers === 0) {
                        this.proxy.$unsubscribeFromDiffs();
                        this.current = undefined;
                    }
                }),
            };
        }
        /**
         * Gets the internal test data by its reference.
         */
        getMirroredTestDataByReference(ref) {
            var _a;
            return (_a = this.current) === null || _a === void 0 ? void 0 : _a.tests.getMirroredTestDataByReference(ref);
        }
        /**
         * Applies test diffs to the current set of observed tests.
         */
        applyDiff(diff) {
            var _a;
            (_a = this.current) === null || _a === void 0 ? void 0 : _a.tests.apply(diff);
        }
        createObserverData() {
            const tests = new MirroredTestCollection();
            this.proxy.$subscribeToDiffs();
            return { observers: 0, tests, };
        }
    }
    class TestRunProfileImpl {
        constructor(proxy, profiles, controllerId, profileId, _label, kind, runHandler, _isDefault = false, _tag = undefined) {
            this.controllerId = controllerId;
            this.profileId = profileId;
            this._label = _label;
            this.kind = kind;
            this.runHandler = runHandler;
            this._isDefault = _isDefault;
            this._tag = _tag;
            _TestRunProfileImpl_proxy.set(this, void 0);
            _TestRunProfileImpl_profiles.set(this, void 0);
            __classPrivateFieldSet(this, _TestRunProfileImpl_proxy, proxy, "f");
            __classPrivateFieldSet(this, _TestRunProfileImpl_profiles, profiles, "f");
            profiles.set(profileId, this);
            const groupBitset = profileGroupToBitset[kind];
            if (typeof groupBitset !== 'number') {
                throw new Error(`Unknown TestRunProfile.group ${kind}`);
            }
            __classPrivateFieldGet(this, _TestRunProfileImpl_proxy, "f").$publishTestRunProfile({
                profileId: profileId,
                controllerId,
                tag: _tag ? Convert.TestTag.namespace(this.controllerId, _tag.id) : null,
                label: _label,
                group: groupBitset,
                isDefault: _isDefault,
                hasConfigurationHandler: false,
            });
        }
        get label() {
            return this._label;
        }
        set label(label) {
            if (label !== this._label) {
                this._label = label;
                __classPrivateFieldGet(this, _TestRunProfileImpl_proxy, "f").$updateTestRunConfig(this.controllerId, this.profileId, { label });
            }
        }
        get isDefault() {
            return this._isDefault;
        }
        set isDefault(isDefault) {
            if (isDefault !== this._isDefault) {
                this._isDefault = isDefault;
                __classPrivateFieldGet(this, _TestRunProfileImpl_proxy, "f").$updateTestRunConfig(this.controllerId, this.profileId, { isDefault });
            }
        }
        get tag() {
            return this._tag;
        }
        set tag(tag) {
            var _a;
            if ((tag === null || tag === void 0 ? void 0 : tag.id) !== ((_a = this._tag) === null || _a === void 0 ? void 0 : _a.id)) {
                this._tag = tag;
                __classPrivateFieldGet(this, _TestRunProfileImpl_proxy, "f").$updateTestRunConfig(this.controllerId, this.profileId, {
                    tag: tag ? Convert.TestTag.namespace(this.controllerId, tag.id) : null,
                });
            }
        }
        get configureHandler() {
            return this._configureHandler;
        }
        set configureHandler(handler) {
            if (handler !== this._configureHandler) {
                this._configureHandler = handler;
                __classPrivateFieldGet(this, _TestRunProfileImpl_proxy, "f").$updateTestRunConfig(this.controllerId, this.profileId, { hasConfigurationHandler: !!handler });
            }
        }
        dispose() {
            var _a;
            if ((_a = __classPrivateFieldGet(this, _TestRunProfileImpl_profiles, "f")) === null || _a === void 0 ? void 0 : _a.delete(this.profileId)) {
                __classPrivateFieldSet(this, _TestRunProfileImpl_profiles, undefined, "f");
                __classPrivateFieldGet(this, _TestRunProfileImpl_proxy, "f").$removeTestProfile(this.controllerId, this.profileId);
            }
        }
    }
    exports.TestRunProfileImpl = TestRunProfileImpl;
    _TestRunProfileImpl_proxy = new WeakMap(), _TestRunProfileImpl_profiles = new WeakMap();
    const profileGroupToBitset = {
        [extHostTypes_1.TestRunProfileKind.Coverage]: 8 /* TestRunProfileBitset.Coverage */,
        [extHostTypes_1.TestRunProfileKind.Debug]: 4 /* TestRunProfileBitset.Debug */,
        [extHostTypes_1.TestRunProfileKind.Run]: 2 /* TestRunProfileBitset.Run */,
    };
});
//# sourceMappingURL=extHostTesting.js.map