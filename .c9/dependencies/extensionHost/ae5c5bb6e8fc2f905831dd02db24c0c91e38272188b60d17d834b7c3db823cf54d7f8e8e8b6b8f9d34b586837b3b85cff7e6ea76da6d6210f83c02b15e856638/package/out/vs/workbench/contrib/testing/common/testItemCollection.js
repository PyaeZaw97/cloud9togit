/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testId"], function (require, exports, async_1, event_1, lifecycle_1, types_1, testTypes_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTestItemChildren = exports.MixedTestItemController = exports.InvalidTestItemError = exports.DuplicateTestItemError = exports.TestItemCollection = exports.TestItemEventOp = void 0;
    var TestItemEventOp;
    (function (TestItemEventOp) {
        TestItemEventOp[TestItemEventOp["Upsert"] = 0] = "Upsert";
        TestItemEventOp[TestItemEventOp["SetTags"] = 1] = "SetTags";
        TestItemEventOp[TestItemEventOp["UpdateCanResolveChildren"] = 2] = "UpdateCanResolveChildren";
        TestItemEventOp[TestItemEventOp["RemoveChild"] = 3] = "RemoveChild";
        TestItemEventOp[TestItemEventOp["SetProp"] = 4] = "SetProp";
        TestItemEventOp[TestItemEventOp["Bulk"] = 5] = "Bulk";
    })(TestItemEventOp = exports.TestItemEventOp || (exports.TestItemEventOp = {}));
    const strictEqualComparator = (a, b) => a === b;
    const diffableProps = {
        range: (a, b) => {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.equalsRange(b);
        },
        busy: strictEqualComparator,
        label: strictEqualComparator,
        description: strictEqualComparator,
        error: strictEqualComparator,
        tags: (a, b) => {
            if (a.length !== b.length) {
                return false;
            }
            if (a.some(t1 => !b.includes(t1))) {
                return false;
            }
            return true;
        },
    };
    const diffTestItems = (a, b) => {
        let output;
        for (const [key, cmp] of Object.entries(diffableProps)) {
            if (!cmp(a[key], b[key])) {
                if (output) {
                    output[key] = b[key];
                }
                else {
                    output = { [key]: b[key] };
                }
            }
        }
        return output;
    };
    /**
     * Maintains a collection of test items for a single controller.
     */
    class TestItemCollection extends lifecycle_1.Disposable {
        constructor(options) {
            super();
            this.options = options;
            this.debounceSendDiff = this._register(new async_1.RunOnceScheduler(() => this.flushDiff(), 200));
            this.diffOpEmitter = this._register(new event_1.Emitter());
            this.tree = new Map();
            this.tags = new Map();
            this.diff = [];
            /**
             * Fires when an operation happens that should result in a diff.
             */
            this.onDidGenerateDiff = this.diffOpEmitter.event;
            this.root.canResolveChildren = true;
            this.upsertItem(this.root, undefined);
        }
        get root() {
            return this.options.root;
        }
        /**
         * Handler used for expanding test items.
         */
        set resolveHandler(handler) {
            this._resolveHandler = handler;
            for (const test of this.tree.values()) {
                this.updateExpandability(test);
            }
        }
        /**
         * Gets a diff of all changes that have been made, and clears the diff queue.
         */
        collectDiff() {
            const diff = this.diff;
            this.diff = [];
            return diff;
        }
        /**
         * Pushes a new diff entry onto the collected diff list.
         */
        pushDiff(diff) {
            // Try to merge updates, since they're invoked per-property
            const last = this.diff[this.diff.length - 1];
            if (last && diff.op === 1 /* TestDiffOpType.Update */) {
                if (last.op === 1 /* TestDiffOpType.Update */ && last.item.extId === diff.item.extId) {
                    (0, testTypes_1.applyTestItemUpdate)(last.item, diff.item);
                    return;
                }
                if (last.op === 0 /* TestDiffOpType.Add */ && last.item.item.extId === diff.item.extId) {
                    (0, testTypes_1.applyTestItemUpdate)(last.item, diff.item);
                    return;
                }
            }
            this.diff.push(diff);
            if (!this.debounceSendDiff.isScheduled()) {
                this.debounceSendDiff.schedule();
            }
        }
        /**
         * Expands the test and the given number of `levels` of children. If levels
         * is < 0, then all children will be expanded. If it's 0, then only this
         * item will be expanded.
         */
        expand(testId, levels) {
            var _a;
            const internal = this.tree.get(testId);
            if (!internal) {
                return;
            }
            if (internal.expandLevels === undefined || levels > internal.expandLevels) {
                internal.expandLevels = levels;
            }
            // try to avoid awaiting things if the provider returns synchronously in
            // order to keep everything in a single diff and DOM update.
            if (internal.expand === 1 /* TestItemExpandState.Expandable */) {
                const r = this.resolveChildren(internal);
                return !r.isOpen()
                    ? r.wait().then(() => this.expandChildren(internal, levels - 1))
                    : this.expandChildren(internal, levels - 1);
            }
            else if (internal.expand === 3 /* TestItemExpandState.Expanded */) {
                return ((_a = internal.resolveBarrier) === null || _a === void 0 ? void 0 : _a.isOpen()) === false
                    ? internal.resolveBarrier.wait().then(() => this.expandChildren(internal, levels - 1))
                    : this.expandChildren(internal, levels - 1);
            }
        }
        dispose() {
            for (const item of this.tree.values()) {
                this.options.getApiFor(item.actual).listener = undefined;
            }
            this.tree.clear();
            this.diff = [];
            super.dispose();
        }
        onTestItemEvent(internal, evt) {
            switch (evt.op) {
                case 3 /* TestItemEventOp.RemoveChild */:
                    this.removeItem(testId_1.TestId.joinToString(internal.fullId, evt.id));
                    break;
                case 0 /* TestItemEventOp.Upsert */:
                    this.upsertItem(evt.item, internal);
                    break;
                case 5 /* TestItemEventOp.Bulk */:
                    for (const op of evt.ops) {
                        this.onTestItemEvent(internal, op);
                    }
                    break;
                case 1 /* TestItemEventOp.SetTags */:
                    this.diffTagRefs(evt.new, evt.old, internal.fullId.toString());
                    break;
                case 2 /* TestItemEventOp.UpdateCanResolveChildren */:
                    this.updateExpandability(internal);
                    break;
                case 4 /* TestItemEventOp.SetProp */:
                    this.pushDiff({
                        op: 1 /* TestDiffOpType.Update */,
                        item: { extId: internal.fullId.toString(), item: evt.update }
                    });
                    break;
                default:
                    (0, types_1.assertNever)(evt);
            }
        }
        upsertItem(actual, parent) {
            const fullId = testId_1.TestId.fromExtHostTestItem(actual, this.root.id, parent === null || parent === void 0 ? void 0 : parent.actual);
            // If this test item exists elsewhere in the tree already (exists at an
            // old ID with an existing parent), remove that old item.
            const privateApi = this.options.getApiFor(actual);
            if (privateApi.parent && privateApi.parent !== (parent === null || parent === void 0 ? void 0 : parent.actual)) {
                this.options.getChildren(privateApi.parent).delete(actual.id);
            }
            let internal = this.tree.get(fullId.toString());
            // Case 1: a brand new item
            if (!internal) {
                internal = {
                    fullId,
                    actual,
                    parent: parent ? fullId.parentId : null,
                    expandLevels: (parent === null || parent === void 0 ? void 0 : parent.expandLevels /* intentionally undefined or 0 */) ? parent.expandLevels - 1 : undefined,
                    expand: 0 /* TestItemExpandState.NotExpandable */, // updated by `connectItemAndChildren`
                };
                actual.tags.forEach(this.incrementTagRefs, this);
                this.tree.set(internal.fullId.toString(), internal);
                this.setItemParent(actual, parent);
                this.pushDiff({
                    op: 0 /* TestDiffOpType.Add */,
                    item: {
                        parent: internal.parent && internal.parent.toString(),
                        controllerId: this.options.controllerId,
                        expand: internal.expand,
                        item: this.options.toITestItem(actual),
                    },
                });
                this.connectItemAndChildren(actual, internal, parent);
                return;
            }
            // Case 2: re-insertion of an existing item, no-op
            if (internal.actual === actual) {
                this.connectItem(actual, internal, parent); // re-connect in case the parent changed
                return; // no-op
            }
            // Case 3: upsert of an existing item by ID, with a new instance
            const oldChildren = this.options.getChildren(internal.actual);
            const oldActual = internal.actual;
            const update = diffTestItems(this.options.toITestItem(oldActual), this.options.toITestItem(actual));
            this.options.getApiFor(oldActual).listener = undefined;
            internal.actual = actual;
            internal.expand = 0 /* TestItemExpandState.NotExpandable */; // updated by `connectItemAndChildren`
            if (update) {
                // tags are handled in a special way
                if (update.hasOwnProperty('tags')) {
                    this.diffTagRefs(actual.tags, oldActual.tags, fullId.toString());
                    delete update.tags;
                }
                this.onTestItemEvent(internal, { op: 4 /* TestItemEventOp.SetProp */, update });
            }
            this.connectItemAndChildren(actual, internal, parent);
            // Remove any orphaned children.
            for (const child of oldChildren) {
                if (!this.options.getChildren(actual).get(child.id)) {
                    this.removeItem(testId_1.TestId.joinToString(fullId, child.id));
                }
            }
        }
        diffTagRefs(newTags, oldTags, extId) {
            const toDelete = new Set(oldTags.map(t => t.id));
            for (const tag of newTags) {
                if (!toDelete.delete(tag.id)) {
                    this.incrementTagRefs(tag);
                }
            }
            this.pushDiff({
                op: 1 /* TestDiffOpType.Update */,
                item: { extId, item: { tags: newTags.map(v => (0, testTypes_1.namespaceTestTag)(this.options.controllerId, v.id)) } }
            });
            toDelete.forEach(this.decrementTagRefs, this);
        }
        incrementTagRefs(tag) {
            const existing = this.tags.get(tag.id);
            if (existing) {
                existing.refCount++;
            }
            else {
                this.tags.set(tag.id, { refCount: 1 });
                this.pushDiff({
                    op: 5 /* TestDiffOpType.AddTag */, tag: {
                        id: (0, testTypes_1.namespaceTestTag)(this.options.controllerId, tag.id),
                    }
                });
            }
        }
        decrementTagRefs(tagId) {
            const existing = this.tags.get(tagId);
            if (existing && !--existing.refCount) {
                this.tags.delete(tagId);
                this.pushDiff({ op: 6 /* TestDiffOpType.RemoveTag */, id: (0, testTypes_1.namespaceTestTag)(this.options.controllerId, tagId) });
            }
        }
        setItemParent(actual, parent) {
            this.options.getApiFor(actual).parent = parent && parent.actual !== this.root ? parent.actual : undefined;
        }
        connectItem(actual, internal, parent) {
            this.setItemParent(actual, parent);
            const api = this.options.getApiFor(actual);
            api.parent = parent === null || parent === void 0 ? void 0 : parent.actual;
            api.listener = evt => this.onTestItemEvent(internal, evt);
            this.updateExpandability(internal);
        }
        connectItemAndChildren(actual, internal, parent) {
            this.connectItem(actual, internal, parent);
            // Discover any existing children that might have already been added
            for (const child of this.options.getChildren(actual)) {
                this.upsertItem(child, internal);
            }
        }
        /**
         * Updates the `expand` state of the item. Should be called whenever the
         * resolved state of the item changes. Can automatically expand the item
         * if requested by a consumer.
         */
        updateExpandability(internal) {
            let newState;
            if (!this._resolveHandler) {
                newState = 0 /* TestItemExpandState.NotExpandable */;
            }
            else if (internal.resolveBarrier) {
                newState = internal.resolveBarrier.isOpen()
                    ? 3 /* TestItemExpandState.Expanded */
                    : 2 /* TestItemExpandState.BusyExpanding */;
            }
            else {
                newState = internal.actual.canResolveChildren
                    ? 1 /* TestItemExpandState.Expandable */
                    : 0 /* TestItemExpandState.NotExpandable */;
            }
            if (newState === internal.expand) {
                return;
            }
            internal.expand = newState;
            this.pushDiff({ op: 1 /* TestDiffOpType.Update */, item: { extId: internal.fullId.toString(), expand: newState } });
            if (newState === 1 /* TestItemExpandState.Expandable */ && internal.expandLevels !== undefined) {
                this.resolveChildren(internal);
            }
        }
        /**
         * Expands all children of the item, "levels" deep. If levels is 0, only
         * the children will be expanded. If it's 1, the children and their children
         * will be expanded. If it's <0, it's a no-op.
         */
        expandChildren(internal, levels) {
            if (levels < 0) {
                return;
            }
            const expandRequests = [];
            for (const child of this.options.getChildren(internal.actual)) {
                const promise = this.expand(testId_1.TestId.joinToString(internal.fullId, child.id), levels);
                if ((0, async_1.isThenable)(promise)) {
                    expandRequests.push(promise);
                }
            }
            if (expandRequests.length) {
                return Promise.all(expandRequests).then(() => { });
            }
        }
        /**
         * Calls `discoverChildren` on the item, refreshing all its tests.
         */
        resolveChildren(internal) {
            if (internal.resolveBarrier) {
                return internal.resolveBarrier;
            }
            if (!this._resolveHandler) {
                const b = new async_1.Barrier();
                b.open();
                return b;
            }
            internal.expand = 2 /* TestItemExpandState.BusyExpanding */;
            this.pushExpandStateUpdate(internal);
            const barrier = internal.resolveBarrier = new async_1.Barrier();
            const applyError = (err) => {
                console.error(`Unhandled error in resolveHandler of test controller "${this.options.controllerId}"`, err);
            };
            let r;
            try {
                r = this._resolveHandler(internal.actual === this.root ? undefined : internal.actual);
            }
            catch (err) {
                applyError(err);
            }
            if ((0, async_1.isThenable)(r)) {
                r.catch(applyError).then(() => {
                    barrier.open();
                    this.updateExpandability(internal);
                });
            }
            else {
                barrier.open();
                this.updateExpandability(internal);
            }
            return internal.resolveBarrier;
        }
        pushExpandStateUpdate(internal) {
            this.pushDiff({ op: 1 /* TestDiffOpType.Update */, item: { extId: internal.fullId.toString(), expand: internal.expand } });
        }
        removeItem(childId) {
            const childItem = this.tree.get(childId);
            if (!childItem) {
                throw new Error('attempting to remove non-existent child');
            }
            this.pushDiff({ op: 2 /* TestDiffOpType.Remove */, itemId: childId });
            const queue = [childItem];
            while (queue.length) {
                const item = queue.pop();
                if (!item) {
                    continue;
                }
                this.options.getApiFor(item.actual).listener = undefined;
                for (const tag of item.actual.tags) {
                    this.decrementTagRefs(tag.id);
                }
                this.tree.delete(item.fullId.toString());
                for (const child of this.options.getChildren(item.actual)) {
                    queue.push(this.tree.get(testId_1.TestId.joinToString(item.fullId, child.id)));
                }
            }
        }
        /**
         * Immediately emits any pending diffs on the collection.
         */
        flushDiff() {
            const diff = this.collectDiff();
            if (diff.length) {
                this.diffOpEmitter.fire(diff);
            }
        }
    }
    exports.TestItemCollection = TestItemCollection;
    class DuplicateTestItemError extends Error {
        constructor(id) {
            super(`Attempted to insert a duplicate test item ID ${id}`);
        }
    }
    exports.DuplicateTestItemError = DuplicateTestItemError;
    class InvalidTestItemError extends Error {
        constructor(id) {
            super(`TestItem with ID "${id}" is invalid. Make sure to create it from the createTestItem method.`);
        }
    }
    exports.InvalidTestItemError = InvalidTestItemError;
    class MixedTestItemController extends Error {
        constructor(id, ctrlA, ctrlB) {
            super(`TestItem with ID "${id}" is from controller "${ctrlA}" and cannot be added as a child of an item from controller "${ctrlB}".`);
        }
    }
    exports.MixedTestItemController = MixedTestItemController;
    const createTestItemChildren = (api, getApi, checkCtor) => {
        let mapped = new Map();
        return {
            /** @inheritdoc */
            get size() {
                return mapped.size;
            },
            /** @inheritdoc */
            forEach(callback, thisArg) {
                for (const item of mapped.values()) {
                    callback.call(thisArg, item, this);
                }
            },
            /** @inheritdoc */
            replace(items) {
                var _a;
                const newMapped = new Map();
                const toDelete = new Set(mapped.keys());
                const bulk = { op: 5 /* TestItemEventOp.Bulk */, ops: [] };
                for (const item of items) {
                    if (!(item instanceof checkCtor)) {
                        throw new InvalidTestItemError(item.id);
                    }
                    const itemController = getApi(item).controllerId;
                    if (itemController !== api.controllerId) {
                        throw new MixedTestItemController(item.id, itemController, api.controllerId);
                    }
                    if (newMapped.has(item.id)) {
                        throw new DuplicateTestItemError(item.id);
                    }
                    newMapped.set(item.id, item);
                    toDelete.delete(item.id);
                    bulk.ops.push({ op: 0 /* TestItemEventOp.Upsert */, item });
                }
                for (const id of toDelete.keys()) {
                    bulk.ops.push({ op: 3 /* TestItemEventOp.RemoveChild */, id });
                }
                (_a = api.listener) === null || _a === void 0 ? void 0 : _a.call(api, bulk);
                // important mutations come after firing, so if an error happens no
                // changes will be "saved":
                mapped = newMapped;
            },
            /** @inheritdoc */
            add(item) {
                var _a;
                if (!(item instanceof checkCtor)) {
                    throw new InvalidTestItemError(item.id);
                }
                mapped.set(item.id, item);
                (_a = api.listener) === null || _a === void 0 ? void 0 : _a.call(api, { op: 0 /* TestItemEventOp.Upsert */, item });
            },
            /** @inheritdoc */
            delete(id) {
                var _a;
                if (mapped.delete(id)) {
                    (_a = api.listener) === null || _a === void 0 ? void 0 : _a.call(api, { op: 3 /* TestItemEventOp.RemoveChild */, id });
                }
            },
            /** @inheritdoc */
            get(itemId) {
                return mapped.get(itemId);
            },
            /** JSON serialization function. */
            toJSON() {
                return Array.from(mapped.values());
            },
            /** @inheritdoc */
            [Symbol.iterator]() {
                return mapped.values();
            },
        };
    };
    exports.createTestItemChildren = createTestItemChildren;
});
//# sourceMappingURL=testItemCollection.js.map