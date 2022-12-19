/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/core/range"], function (require, exports, uri_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractIncrementalTestCollection = exports.IncrementalChangeCollector = exports.TestsDiffOp = exports.TestDiffOpType = exports.DetailType = exports.TestResultItem = exports.applyTestItemUpdate = exports.ITestItemUpdate = exports.InternalTestItem = exports.TestItemExpandState = exports.ITestItem = exports.denamespaceTestTag = exports.namespaceTestTag = exports.ITestTaskState = exports.ITestMessage = exports.ITestOutputMessage = exports.ITestErrorMessage = exports.TestMessageType = exports.IRichLocation = exports.testRunProfileBitsetList = exports.TestRunProfileBitset = exports.TestResultState = void 0;
    var TestResultState;
    (function (TestResultState) {
        TestResultState[TestResultState["Unset"] = 0] = "Unset";
        TestResultState[TestResultState["Queued"] = 1] = "Queued";
        TestResultState[TestResultState["Running"] = 2] = "Running";
        TestResultState[TestResultState["Passed"] = 3] = "Passed";
        TestResultState[TestResultState["Failed"] = 4] = "Failed";
        TestResultState[TestResultState["Skipped"] = 5] = "Skipped";
        TestResultState[TestResultState["Errored"] = 6] = "Errored";
    })(TestResultState = exports.TestResultState || (exports.TestResultState = {}));
    var TestRunProfileBitset;
    (function (TestRunProfileBitset) {
        TestRunProfileBitset[TestRunProfileBitset["Run"] = 2] = "Run";
        TestRunProfileBitset[TestRunProfileBitset["Debug"] = 4] = "Debug";
        TestRunProfileBitset[TestRunProfileBitset["Coverage"] = 8] = "Coverage";
        TestRunProfileBitset[TestRunProfileBitset["HasNonDefaultProfile"] = 16] = "HasNonDefaultProfile";
        TestRunProfileBitset[TestRunProfileBitset["HasConfigurable"] = 32] = "HasConfigurable";
    })(TestRunProfileBitset = exports.TestRunProfileBitset || (exports.TestRunProfileBitset = {}));
    /**
     * List of all test run profile bitset values.
     */
    exports.testRunProfileBitsetList = [
        2 /* TestRunProfileBitset.Run */,
        4 /* TestRunProfileBitset.Debug */,
        8 /* TestRunProfileBitset.Coverage */,
        16 /* TestRunProfileBitset.HasNonDefaultProfile */,
    ];
    var IRichLocation;
    (function (IRichLocation) {
        IRichLocation.serialize = (location) => ({
            range: location.range.toJSON(),
            uri: location.uri.toJSON(),
        });
        IRichLocation.deserialize = (location) => ({
            range: range_1.Range.lift(location.range),
            uri: uri_1.URI.revive(location.uri),
        });
    })(IRichLocation = exports.IRichLocation || (exports.IRichLocation = {}));
    var TestMessageType;
    (function (TestMessageType) {
        TestMessageType[TestMessageType["Error"] = 0] = "Error";
        TestMessageType[TestMessageType["Info"] = 1] = "Info";
    })(TestMessageType = exports.TestMessageType || (exports.TestMessageType = {}));
    var ITestErrorMessage;
    (function (ITestErrorMessage) {
        ITestErrorMessage.serialize = (message) => ({
            message: message.message,
            type: 0 /* TestMessageType.Error */,
            expected: message.expected,
            actual: message.actual,
            location: message.location && IRichLocation.serialize(message.location),
        });
        ITestErrorMessage.deserialize = (message) => ({
            message: message.message,
            type: 0 /* TestMessageType.Error */,
            expected: message.expected,
            actual: message.actual,
            location: message.location && IRichLocation.deserialize(message.location),
        });
    })(ITestErrorMessage = exports.ITestErrorMessage || (exports.ITestErrorMessage = {}));
    var ITestOutputMessage;
    (function (ITestOutputMessage) {
        ITestOutputMessage.serialize = (message) => ({
            message: message.message,
            type: 1 /* TestMessageType.Info */,
            offset: message.offset,
            location: message.location && IRichLocation.serialize(message.location),
        });
        ITestOutputMessage.deserialize = (message) => ({
            message: message.message,
            type: 1 /* TestMessageType.Info */,
            offset: message.offset,
            location: message.location && IRichLocation.deserialize(message.location),
        });
    })(ITestOutputMessage = exports.ITestOutputMessage || (exports.ITestOutputMessage = {}));
    var ITestMessage;
    (function (ITestMessage) {
        ITestMessage.serialize = (message) => message.type === 0 /* TestMessageType.Error */ ? ITestErrorMessage.serialize(message) : ITestOutputMessage.serialize(message);
        ITestMessage.deserialize = (message) => message.type === 0 /* TestMessageType.Error */ ? ITestErrorMessage.deserialize(message) : ITestOutputMessage.deserialize(message);
    })(ITestMessage = exports.ITestMessage || (exports.ITestMessage = {}));
    var ITestTaskState;
    (function (ITestTaskState) {
        ITestTaskState.serialize = (state) => ({
            state: state.state,
            duration: state.duration,
            messages: state.messages.map(ITestMessage.serialize),
        });
        ITestTaskState.deserialize = (state) => ({
            state: state.state,
            duration: state.duration,
            messages: state.messages.map(ITestMessage.deserialize),
        });
    })(ITestTaskState = exports.ITestTaskState || (exports.ITestTaskState = {}));
    const testTagDelimiter = '\0';
    const namespaceTestTag = (ctrlId, tagId) => ctrlId + testTagDelimiter + tagId;
    exports.namespaceTestTag = namespaceTestTag;
    const denamespaceTestTag = (namespaced) => {
        const index = namespaced.indexOf(testTagDelimiter);
        return { ctrlId: namespaced.slice(0, index), tagId: namespaced.slice(index + 1) };
    };
    exports.denamespaceTestTag = denamespaceTestTag;
    var ITestItem;
    (function (ITestItem) {
        ITestItem.serialize = (item) => {
            var _a, _b;
            return ({
                extId: item.extId,
                label: item.label,
                tags: item.tags,
                busy: item.busy,
                children: undefined,
                uri: (_a = item.uri) === null || _a === void 0 ? void 0 : _a.toJSON(),
                range: ((_b = item.range) === null || _b === void 0 ? void 0 : _b.toJSON()) || null,
                description: item.description,
                error: item.error,
                sortText: item.sortText
            });
        };
        ITestItem.deserialize = (serialized) => ({
            extId: serialized.extId,
            label: serialized.label,
            tags: serialized.tags,
            busy: serialized.busy,
            children: undefined,
            uri: serialized.uri ? uri_1.URI.revive(serialized.uri) : undefined,
            range: serialized.range ? range_1.Range.lift(serialized.range) : null,
            description: serialized.description,
            error: serialized.error,
            sortText: serialized.sortText
        });
    })(ITestItem = exports.ITestItem || (exports.ITestItem = {}));
    var TestItemExpandState;
    (function (TestItemExpandState) {
        TestItemExpandState[TestItemExpandState["NotExpandable"] = 0] = "NotExpandable";
        TestItemExpandState[TestItemExpandState["Expandable"] = 1] = "Expandable";
        TestItemExpandState[TestItemExpandState["BusyExpanding"] = 2] = "BusyExpanding";
        TestItemExpandState[TestItemExpandState["Expanded"] = 3] = "Expanded";
    })(TestItemExpandState = exports.TestItemExpandState || (exports.TestItemExpandState = {}));
    var InternalTestItem;
    (function (InternalTestItem) {
        InternalTestItem.serialize = (item) => ({
            controllerId: item.controllerId,
            expand: item.expand,
            parent: item.parent,
            item: ITestItem.serialize(item.item)
        });
        InternalTestItem.deserialize = (serialized) => ({
            controllerId: serialized.controllerId,
            expand: serialized.expand,
            parent: serialized.parent,
            item: ITestItem.deserialize(serialized.item)
        });
    })(InternalTestItem = exports.InternalTestItem || (exports.InternalTestItem = {}));
    var ITestItemUpdate;
    (function (ITestItemUpdate) {
        ITestItemUpdate.serialize = (u) => {
            var _a, _b;
            let item;
            if (u.item) {
                item = {};
                if (u.item.label !== undefined) {
                    item.label = u.item.label;
                }
                if (u.item.tags !== undefined) {
                    item.tags = u.item.tags;
                }
                if (u.item.busy !== undefined) {
                    item.busy = u.item.busy;
                }
                if (u.item.uri !== undefined) {
                    item.uri = (_a = u.item.uri) === null || _a === void 0 ? void 0 : _a.toJSON();
                }
                if (u.item.range !== undefined) {
                    item.range = (_b = u.item.range) === null || _b === void 0 ? void 0 : _b.toJSON();
                }
                if (u.item.description !== undefined) {
                    item.description = u.item.description;
                }
                if (u.item.error !== undefined) {
                    item.error = u.item.error;
                }
                if (u.item.sortText !== undefined) {
                    item.sortText = u.item.sortText;
                }
            }
            return { extId: u.extId, expand: u.expand, item };
        };
        ITestItemUpdate.deserialize = (u) => {
            let item;
            if (u.item) {
                item = {};
                if (u.item.label !== undefined) {
                    item.label = u.item.label;
                }
                if (u.item.tags !== undefined) {
                    item.tags = u.item.tags;
                }
                if (u.item.busy !== undefined) {
                    item.busy = u.item.busy;
                }
                if (u.item.range !== undefined) {
                    item.range = u.item.range ? range_1.Range.lift(u.item.range) : null;
                }
                if (u.item.description !== undefined) {
                    item.description = u.item.description;
                }
                if (u.item.error !== undefined) {
                    item.error = u.item.error;
                }
                if (u.item.sortText !== undefined) {
                    item.sortText = u.item.sortText;
                }
            }
            return { extId: u.extId, expand: u.expand, item };
        };
    })(ITestItemUpdate = exports.ITestItemUpdate || (exports.ITestItemUpdate = {}));
    const applyTestItemUpdate = (internal, patch) => {
        if (patch.expand !== undefined) {
            internal.expand = patch.expand;
        }
        if (patch.item !== undefined) {
            internal.item = internal.item ? Object.assign(internal.item, patch.item) : patch.item;
        }
    };
    exports.applyTestItemUpdate = applyTestItemUpdate;
    var TestResultItem;
    (function (TestResultItem) {
        TestResultItem.serialize = (original, children) => (Object.assign(Object.assign({}, InternalTestItem.serialize(original)), { children, ownComputedState: original.ownComputedState, computedState: original.computedState, tasks: original.tasks.map(ITestTaskState.serialize) }));
    })(TestResultItem = exports.TestResultItem || (exports.TestResultItem = {}));
    var DetailType;
    (function (DetailType) {
        DetailType[DetailType["Function"] = 0] = "Function";
        DetailType[DetailType["Statement"] = 1] = "Statement";
    })(DetailType = exports.DetailType || (exports.DetailType = {}));
    var TestDiffOpType;
    (function (TestDiffOpType) {
        /** Adds a new test (with children) */
        TestDiffOpType[TestDiffOpType["Add"] = 0] = "Add";
        /** Shallow-updates an existing test */
        TestDiffOpType[TestDiffOpType["Update"] = 1] = "Update";
        /** Removes a test (and all its children) */
        TestDiffOpType[TestDiffOpType["Remove"] = 2] = "Remove";
        /** Changes the number of controllers who are yet to publish their collection roots. */
        TestDiffOpType[TestDiffOpType["IncrementPendingExtHosts"] = 3] = "IncrementPendingExtHosts";
        /** Retires a test/result */
        TestDiffOpType[TestDiffOpType["Retire"] = 4] = "Retire";
        /** Add a new test tag */
        TestDiffOpType[TestDiffOpType["AddTag"] = 5] = "AddTag";
        /** Remove a test tag */
        TestDiffOpType[TestDiffOpType["RemoveTag"] = 6] = "RemoveTag";
    })(TestDiffOpType = exports.TestDiffOpType || (exports.TestDiffOpType = {}));
    var TestsDiffOp;
    (function (TestsDiffOp) {
        TestsDiffOp.deserialize = (u) => {
            if (u.op === 0 /* TestDiffOpType.Add */) {
                return { op: u.op, item: InternalTestItem.deserialize(u.item) };
            }
            else if (u.op === 1 /* TestDiffOpType.Update */) {
                return { op: u.op, item: ITestItemUpdate.deserialize(u.item) };
            }
            else {
                return u;
            }
        };
        TestsDiffOp.serialize = (u) => {
            if (u.op === 0 /* TestDiffOpType.Add */) {
                return { op: u.op, item: InternalTestItem.serialize(u.item) };
            }
            else if (u.op === 1 /* TestDiffOpType.Update */) {
                return { op: u.op, item: ITestItemUpdate.serialize(u.item) };
            }
            else {
                return u;
            }
        };
    })(TestsDiffOp = exports.TestsDiffOp || (exports.TestsDiffOp = {}));
    /**
     * The IncrementalChangeCollector is used in the IncrementalTestCollection
     * and called with diff changes as they're applied. This is used in the
     * ext host to create a cohesive change event from a diff.
     */
    class IncrementalChangeCollector {
        /**
         * A node was added.
         */
        add(node) { }
        /**
         * A node in the collection was updated.
         */
        update(node) { }
        /**
         * A node was removed.
         */
        remove(node, isNestedOperation) { }
        /**
         * Called when the diff has been applied.
         */
        complete() { }
    }
    exports.IncrementalChangeCollector = IncrementalChangeCollector;
    /**
     * Maintains tests in this extension host sent from the main thread.
     */
    class AbstractIncrementalTestCollection {
        constructor() {
            this._tags = new Map();
            /**
             * Map of item IDs to test item objects.
             */
            this.items = new Map();
            /**
             * ID of test root items.
             */
            this.roots = new Set();
            /**
             * Number of 'busy' controllers.
             */
            this.busyControllerCount = 0;
            /**
             * Number of pending roots.
             */
            this.pendingRootCount = 0;
            /**
             * Known test tags.
             */
            this.tags = this._tags;
        }
        /**
         * Applies the diff to the collection.
         */
        apply(diff) {
            const changes = this.createChangeCollector();
            for (const op of diff) {
                switch (op.op) {
                    case 0 /* TestDiffOpType.Add */: {
                        const internalTest = InternalTestItem.deserialize(op.item);
                        if (!internalTest.parent) {
                            const created = this.createItem(internalTest);
                            this.roots.add(created);
                            this.items.set(internalTest.item.extId, created);
                            changes.add(created);
                        }
                        else if (this.items.has(internalTest.parent)) {
                            const parent = this.items.get(internalTest.parent);
                            parent.children.add(internalTest.item.extId);
                            const created = this.createItem(internalTest, parent);
                            this.items.set(internalTest.item.extId, created);
                            changes.add(created);
                        }
                        if (internalTest.expand === 2 /* TestItemExpandState.BusyExpanding */) {
                            this.busyControllerCount++;
                        }
                        break;
                    }
                    case 1 /* TestDiffOpType.Update */: {
                        const patch = ITestItemUpdate.deserialize(op.item);
                        const existing = this.items.get(patch.extId);
                        if (!existing) {
                            break;
                        }
                        if (patch.expand !== undefined) {
                            if (existing.expand === 2 /* TestItemExpandState.BusyExpanding */) {
                                this.busyControllerCount--;
                            }
                            if (patch.expand === 2 /* TestItemExpandState.BusyExpanding */) {
                                this.busyControllerCount++;
                            }
                        }
                        (0, exports.applyTestItemUpdate)(existing, patch);
                        changes.update(existing);
                        break;
                    }
                    case 2 /* TestDiffOpType.Remove */: {
                        const toRemove = this.items.get(op.itemId);
                        if (!toRemove) {
                            break;
                        }
                        if (toRemove.parent) {
                            const parent = this.items.get(toRemove.parent);
                            parent.children.delete(toRemove.item.extId);
                        }
                        else {
                            this.roots.delete(toRemove);
                        }
                        const queue = [[op.itemId]];
                        while (queue.length) {
                            for (const itemId of queue.pop()) {
                                const existing = this.items.get(itemId);
                                if (existing) {
                                    queue.push(existing.children);
                                    this.items.delete(itemId);
                                    changes.remove(existing, existing !== toRemove);
                                    if (existing.expand === 2 /* TestItemExpandState.BusyExpanding */) {
                                        this.busyControllerCount--;
                                    }
                                }
                            }
                        }
                        break;
                    }
                    case 4 /* TestDiffOpType.Retire */:
                        this.retireTest(op.itemId);
                        break;
                    case 3 /* TestDiffOpType.IncrementPendingExtHosts */:
                        this.updatePendingRoots(op.amount);
                        break;
                    case 5 /* TestDiffOpType.AddTag */:
                        this._tags.set(op.tag.id, op.tag);
                        break;
                    case 6 /* TestDiffOpType.RemoveTag */:
                        this._tags.delete(op.id);
                        break;
                }
            }
            changes.complete();
        }
        /**
         * Called when the extension signals a test result should be retired.
         */
        retireTest(testId) {
            // no-op
        }
        /**
         * Updates the number of test root sources who are yet to report. When
         * the total pending test roots reaches 0, the roots for all controllers
         * will exist in the collection.
         */
        updatePendingRoots(delta) {
            this.pendingRootCount += delta;
        }
        /**
         * Called before a diff is applied to create a new change collector.
         */
        createChangeCollector() {
            return new IncrementalChangeCollector();
        }
    }
    exports.AbstractIncrementalTestCollection = AbstractIncrementalTestCollection;
});
//# sourceMappingURL=testTypes.js.map