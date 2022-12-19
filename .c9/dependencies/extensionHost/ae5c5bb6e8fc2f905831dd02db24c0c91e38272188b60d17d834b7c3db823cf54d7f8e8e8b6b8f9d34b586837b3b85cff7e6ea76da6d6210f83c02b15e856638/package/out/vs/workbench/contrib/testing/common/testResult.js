/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/range", "vs/nls", "vs/workbench/contrib/testing/common/getComputedState", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testingStates"], function (require, exports, buffer_1, event_1, lazy_1, lifecycle_1, uri_1, range_1, nls_1, getComputedState_1, observableValue_1, testTypes_1, testingStates_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HydratedTestResult = exports.LiveTestResult = exports.TestResultItemChangeReason = exports.LiveOutputController = exports.maxCountPriority = exports.sumCounts = exports.makeEmptyCounts = exports.resultItemParents = void 0;
    const resultItemParents = function* (results, item) {
        let i = item;
        while (i) {
            yield i;
            i = i.parent ? results.getStateById(i.parent) : undefined;
        }
    };
    exports.resultItemParents = resultItemParents;
    const makeEmptyCounts = () => {
        const o = {};
        for (const state of testingStates_1.statesInOrder) {
            o[state] = 0;
        }
        return o;
    };
    exports.makeEmptyCounts = makeEmptyCounts;
    const sumCounts = (counts) => {
        const total = (0, exports.makeEmptyCounts)();
        for (const count of counts) {
            for (const state of testingStates_1.statesInOrder) {
                total[state] += count[state];
            }
        }
        return total;
    };
    exports.sumCounts = sumCounts;
    const maxCountPriority = (counts) => {
        for (const state of testingStates_1.statesInOrder) {
            if (counts[state] > 0) {
                return state;
            }
        }
        return 0 /* TestResultState.Unset */;
    };
    exports.maxCountPriority = maxCountPriority;
    /**
     * Deals with output of a {@link LiveTestResult}. By default we pass-through
     * data into the underlying write stream, but if a client requests to read it
     * we splice in the written data and then continue streaming incoming data.
     */
    class LiveOutputController {
        constructor(writer, reader) {
            this.writer = writer;
            this.reader = reader;
            /** Data written so far. This is available until the file closes. */
            this.previouslyWritten = [];
            this.dataEmitter = new event_1.Emitter();
            this.endEmitter = new event_1.Emitter();
            this._offset = 0;
        }
        /**
         * Gets the number of written bytes.
         */
        get offset() {
            return this._offset;
        }
        /**
         * Appends data to the output.
         */
        append(data) {
            var _a;
            if (this.closed) {
                return this.closed;
            }
            (_a = this.previouslyWritten) === null || _a === void 0 ? void 0 : _a.push(data);
            this.dataEmitter.fire(data);
            this._offset += data.byteLength;
            return this.writer.getValue()[0].write(data);
        }
        /**
         * Reads the value of the stream.
         */
        read() {
            if (!this.previouslyWritten) {
                return this.reader();
            }
            const stream = (0, buffer_1.newWriteableBufferStream)();
            for (const chunk of this.previouslyWritten) {
                stream.write(chunk);
            }
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add(this.dataEmitter.event(d => stream.write(d)));
            disposable.add(this.endEmitter.event(() => stream.end()));
            stream.on('end', () => disposable.dispose());
            return Promise.resolve(stream);
        }
        /**
         * Closes the output, signalling no more writes will be made.
         * @returns a promise that resolves when the output is written
         */
        close() {
            if (this.closed) {
                return this.closed;
            }
            if (!this.writer.hasValue()) {
                this.closed = Promise.resolve();
            }
            else {
                const [stream, ended] = this.writer.getValue();
                stream.end();
                this.closed = ended;
            }
            this.endEmitter.fire();
            this.closed.then(() => {
                this.previouslyWritten = undefined;
                this.dataEmitter.dispose();
                this.endEmitter.dispose();
            });
            return this.closed;
        }
    }
    exports.LiveOutputController = LiveOutputController;
    const itemToNode = (controllerId, item, parent) => ({
        parent,
        controllerId,
        expand: 0 /* TestItemExpandState.NotExpandable */,
        item: Object.assign({}, item),
        children: [],
        tasks: [],
        ownComputedState: 0 /* TestResultState.Unset */,
        computedState: 0 /* TestResultState.Unset */,
    });
    var TestResultItemChangeReason;
    (function (TestResultItemChangeReason) {
        TestResultItemChangeReason[TestResultItemChangeReason["ComputedStateChange"] = 0] = "ComputedStateChange";
        TestResultItemChangeReason[TestResultItemChangeReason["OwnStateChange"] = 1] = "OwnStateChange";
    })(TestResultItemChangeReason = exports.TestResultItemChangeReason || (exports.TestResultItemChangeReason = {}));
    /**
     * Results of a test. These are created when the test initially started running
     * and marked as "complete" when the run finishes.
     */
    class LiveTestResult {
        constructor(id, output, persist, request) {
            this.id = id;
            this.output = output;
            this.persist = persist;
            this.request = request;
            this.completeEmitter = new event_1.Emitter();
            this.changeEmitter = new event_1.Emitter();
            this.testById = new Map();
            this.onChange = this.changeEmitter.event;
            this.onComplete = this.completeEmitter.event;
            this.tasks = [];
            this.name = (0, nls_1.localize)('runFinished', 'Test run at {0}', new Date().toLocaleString());
            /**
             * @inheritdoc
             */
            this.counts = (0, exports.makeEmptyCounts)();
            this.computedStateAccessor = {
                getOwnState: i => i.ownComputedState,
                getCurrentComputedState: i => i.computedState,
                setComputedState: (i, s) => i.computedState = s,
                getChildren: i => i.children,
                getParents: i => {
                    const { testById: testByExtId } = this;
                    return (function* () {
                        for (let parentId = i.parent; parentId;) {
                            const parent = testByExtId.get(parentId);
                            if (!parent) {
                                break;
                            }
                            yield parent;
                            parentId = parent.parent;
                        }
                    })();
                },
            };
            this.doSerialize = new lazy_1.Lazy(() => ({
                id: this.id,
                completedAt: this.completedAt,
                tasks: this.tasks.map(t => ({ id: t.id, name: t.name, messages: t.otherMessages })),
                name: this.name,
                request: this.request,
                items: [...this.testById.values()].map(e => testTypes_1.TestResultItem.serialize(e, [...e.children.map(c => c.item.extId)])),
            }));
        }
        /**
         * @inheritdoc
         */
        get completedAt() {
            return this._completedAt;
        }
        /**
         * @inheritdoc
         */
        get tests() {
            return this.testById.values();
        }
        /**
         * @inheritdoc
         */
        getStateById(extTestId) {
            return this.testById.get(extTestId);
        }
        /**
         * Appends output that occurred during the test run.
         */
        appendOutput(output, taskId, location, testId) {
            var _a;
            this.output.append(output);
            const message = {
                location,
                message: output.toString(),
                offset: this.output.offset,
                type: 1 /* TestMessageType.Info */,
            };
            const index = this.mustGetTaskIndex(taskId);
            if (testId) {
                (_a = this.testById.get(testId)) === null || _a === void 0 ? void 0 : _a.tasks[index].messages.push(message);
            }
            else {
                this.tasks[index].otherMessages.push(message);
            }
        }
        /**
         * Adds a new run task to the results.
         */
        addTask(task) {
            const index = this.tasks.length;
            this.tasks.push(Object.assign(Object.assign({}, task), { coverage: new observableValue_1.MutableObservableValue(undefined), otherMessages: [] }));
            for (const test of this.tests) {
                test.tasks.push({ duration: undefined, messages: [], state: 0 /* TestResultState.Unset */ });
                this.fireUpdateAndRefresh(test, index, 1 /* TestResultState.Queued */);
            }
        }
        /**
         * Add the chain of tests to the run. The first test in the chain should
         * be either a test root, or a previously-known test.
         */
        addTestChainToRun(controllerId, chain) {
            let parent = this.testById.get(chain[0].extId);
            if (!parent) { // must be a test root
                parent = this.addTestToRun(controllerId, chain[0], null);
            }
            for (let i = 1; i < chain.length; i++) {
                parent = this.addTestToRun(controllerId, chain[i], parent.item.extId);
            }
            for (let i = 0; i < this.tasks.length; i++) {
                this.fireUpdateAndRefresh(parent, i, 1 /* TestResultState.Queued */);
            }
            return undefined;
        }
        /**
         * Updates the state of the test by its internal ID.
         */
        updateState(testId, taskId, state, duration) {
            const entry = this.testById.get(testId);
            if (!entry) {
                return;
            }
            const index = this.mustGetTaskIndex(taskId);
            const oldTerminalStatePrio = testingStates_1.terminalStatePriorities[entry.tasks[index].state];
            const newTerminalStatePrio = testingStates_1.terminalStatePriorities[state];
            // Ignore requests to set the state from one terminal state back to a
            // "lower" one, e.g. from failed back to passed:
            if (oldTerminalStatePrio !== undefined &&
                (newTerminalStatePrio === undefined || newTerminalStatePrio < oldTerminalStatePrio)) {
                return;
            }
            this.fireUpdateAndRefresh(entry, index, state, duration);
        }
        /**
         * Appends a message for the test in the run.
         */
        appendMessage(testId, taskId, message) {
            const entry = this.testById.get(testId);
            if (!entry) {
                return;
            }
            entry.tasks[this.mustGetTaskIndex(taskId)].messages.push(message);
            this.changeEmitter.fire({
                item: entry,
                result: this,
                reason: 1 /* TestResultItemChangeReason.OwnStateChange */,
                previousState: entry.ownComputedState,
                previousOwnDuration: entry.ownDuration,
            });
        }
        /**
         * @inheritdoc
         */
        getOutput() {
            return this.output.read();
        }
        /**
         * Marks the task in the test run complete.
         */
        markTaskComplete(taskId) {
            this.tasks[this.mustGetTaskIndex(taskId)].running = false;
            this.setAllToState(0 /* TestResultState.Unset */, taskId, t => t.state === 1 /* TestResultState.Queued */ || t.state === 2 /* TestResultState.Running */);
        }
        /**
         * Notifies the service that all tests are complete.
         */
        markComplete() {
            if (this._completedAt !== undefined) {
                throw new Error('cannot complete a test result multiple times');
            }
            for (const task of this.tasks) {
                if (task.running) {
                    this.markTaskComplete(task.id);
                }
            }
            this._completedAt = Date.now();
            this.completeEmitter.fire();
        }
        /**
         * @inheritdoc
         */
        toJSON() {
            return this.completedAt && this.persist ? this.doSerialize.getValue() : undefined;
        }
        /**
         * Updates all tests in the collection to the given state.
         */
        setAllToState(state, taskId, when) {
            const index = this.mustGetTaskIndex(taskId);
            for (const test of this.testById.values()) {
                if (when(test.tasks[index], test)) {
                    this.fireUpdateAndRefresh(test, index, state);
                }
            }
        }
        fireUpdateAndRefresh(entry, taskIndex, newState, newOwnDuration) {
            const previousOwnComputed = entry.ownComputedState;
            const previousOwnDuration = entry.ownDuration;
            const changeEvent = {
                item: entry,
                result: this,
                reason: 1 /* TestResultItemChangeReason.OwnStateChange */,
                previousState: previousOwnComputed,
                previousOwnDuration: previousOwnDuration,
            };
            entry.tasks[taskIndex].state = newState;
            if (newOwnDuration !== undefined) {
                entry.tasks[taskIndex].duration = newOwnDuration;
                entry.ownDuration = Math.max(entry.ownDuration || 0, newOwnDuration);
            }
            const newOwnComputed = (0, testingStates_1.maxPriority)(...entry.tasks.map(t => t.state));
            if (newOwnComputed === previousOwnComputed) {
                if (newOwnDuration !== previousOwnDuration) {
                    this.changeEmitter.fire(changeEvent); // fire manually since state change won't do it
                }
                return;
            }
            entry.ownComputedState = newOwnComputed;
            this.counts[previousOwnComputed]--;
            this.counts[newOwnComputed]++;
            (0, getComputedState_1.refreshComputedState)(this.computedStateAccessor, entry).forEach(t => this.changeEmitter.fire(t === entry ? changeEvent : {
                item: t,
                result: this,
                reason: 0 /* TestResultItemChangeReason.ComputedStateChange */,
            }));
        }
        addTestToRun(controllerId, item, parent) {
            var _a;
            const node = itemToNode(controllerId, item, parent);
            this.testById.set(item.extId, node);
            this.counts[0 /* TestResultState.Unset */]++;
            if (parent) {
                (_a = this.testById.get(parent)) === null || _a === void 0 ? void 0 : _a.children.push(node);
            }
            if (this.tasks.length) {
                for (let i = 0; i < this.tasks.length; i++) {
                    node.tasks.push({ duration: undefined, messages: [], state: 1 /* TestResultState.Queued */ });
                }
            }
            return node;
        }
        mustGetTaskIndex(taskId) {
            const index = this.tasks.findIndex(t => t.id === taskId);
            if (index === -1) {
                throw new Error(`Unknown task ${taskId} in updateState`);
            }
            return index;
        }
    }
    exports.LiveTestResult = LiveTestResult;
    /**
     * Test results hydrated from a previously-serialized test run.
     */
    class HydratedTestResult {
        constructor(serialized, outputLoader, persist = true) {
            this.serialized = serialized;
            this.outputLoader = outputLoader;
            this.persist = persist;
            /**
             * @inheritdoc
             */
            this.counts = (0, exports.makeEmptyCounts)();
            this.testById = new Map();
            this.id = serialized.id;
            this.completedAt = serialized.completedAt;
            this.tasks = serialized.tasks.map((task, i) => ({
                id: task.id,
                name: task.name,
                running: false,
                coverage: (0, observableValue_1.staticObservableValue)(undefined),
                otherMessages: task.messages.map(m => ({
                    message: m.message,
                    type: m.type,
                    offset: m.offset,
                    location: m.location && {
                        uri: uri_1.URI.revive(m.location.uri),
                        range: range_1.Range.lift(m.location.range)
                    },
                }))
            }));
            this.name = serialized.name;
            this.request = serialized.request;
            for (const item of serialized.items) {
                const cast = Object.assign({}, item);
                cast.item.uri = uri_1.URI.revive(cast.item.uri);
                for (const task of cast.tasks) {
                    for (const message of task.messages) {
                        if (message.location) {
                            message.location.uri = uri_1.URI.revive(message.location.uri);
                            message.location.range = range_1.Range.lift(message.location.range);
                        }
                    }
                }
                this.counts[item.ownComputedState]++;
                this.testById.set(item.item.extId, cast);
            }
        }
        /**
         * @inheritdoc
         */
        get tests() {
            return this.testById.values();
        }
        /**
         * @inheritdoc
         */
        getStateById(extTestId) {
            return this.testById.get(extTestId);
        }
        /**
         * @inheritdoc
         */
        getOutput() {
            return this.outputLoader();
        }
        /**
         * @inheritdoc
         */
        toJSON() {
            return this.persist ? this.serialized : undefined;
        }
    }
    exports.HydratedTestResult = HydratedTestResult;
});
//# sourceMappingURL=testResult.js.map