/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/workbench/contrib/testing/common/testingStates"], function (require, exports, iterator_1, testingStates_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.refreshComputedState = exports.getComputedDuration = exports.getComputedState = exports.isDurationAccessor = void 0;
    const isDurationAccessor = (accessor) => 'getOwnDuration' in accessor;
    exports.isDurationAccessor = isDurationAccessor;
    /**
     * Gets the computed state for the node.
     * @param force whether to refresh the computed state for this node, even
     * if it was previously set.
     */
    const getComputedState = (accessor, node, force = false) => {
        var _a;
        let computed = accessor.getCurrentComputedState(node);
        if (computed === undefined || force) {
            computed = (_a = accessor.getOwnState(node)) !== null && _a !== void 0 ? _a : 0 /* TestResultState.Unset */;
            for (const child of accessor.getChildren(node)) {
                const childComputed = (0, exports.getComputedState)(accessor, child);
                // If all children are skipped, make the current state skipped too if unset (#131537)
                computed = childComputed === 5 /* TestResultState.Skipped */ && computed === 0 /* TestResultState.Unset */
                    ? 5 /* TestResultState.Skipped */ : (0, testingStates_1.maxPriority)(computed, childComputed);
            }
            accessor.setComputedState(node, computed);
        }
        return computed;
    };
    exports.getComputedState = getComputedState;
    const getComputedDuration = (accessor, node, force = false) => {
        let computed = accessor.getCurrentComputedDuration(node);
        if (computed === undefined || force) {
            const own = accessor.getOwnDuration(node);
            if (own !== undefined) {
                computed = own;
            }
            else {
                computed = undefined;
                for (const child of accessor.getChildren(node)) {
                    const d = (0, exports.getComputedDuration)(accessor, child);
                    if (d !== undefined) {
                        computed = (computed || 0) + d;
                    }
                }
            }
            accessor.setComputedDuration(node, computed);
        }
        return computed;
    };
    exports.getComputedDuration = getComputedDuration;
    /**
     * Refreshes the computed state for the node and its parents. Any changes
     * elements cause `addUpdated` to be called.
     */
    const refreshComputedState = (accessor, node, explicitNewComputedState, refreshDuration = true) => {
        const oldState = accessor.getCurrentComputedState(node);
        const oldPriority = testingStates_1.statePriority[oldState];
        const newState = explicitNewComputedState !== null && explicitNewComputedState !== void 0 ? explicitNewComputedState : (0, exports.getComputedState)(accessor, node, true);
        const newPriority = testingStates_1.statePriority[newState];
        const toUpdate = new Set();
        if (newPriority !== oldPriority) {
            accessor.setComputedState(node, newState);
            toUpdate.add(node);
            if (newPriority > oldPriority) {
                // Update all parents to ensure they're at least this priority.
                for (const parent of accessor.getParents(node)) {
                    const prev = accessor.getCurrentComputedState(parent);
                    if (prev !== undefined && testingStates_1.statePriority[prev] >= newPriority) {
                        break;
                    }
                    accessor.setComputedState(parent, newState);
                    toUpdate.add(parent);
                }
            }
            else if (newPriority < oldPriority) {
                // Re-render all parents of this node whose computed priority might have come from this node
                for (const parent of accessor.getParents(node)) {
                    const prev = accessor.getCurrentComputedState(parent);
                    if (prev === undefined || testingStates_1.statePriority[prev] > oldPriority) {
                        break;
                    }
                    accessor.setComputedState(parent, (0, exports.getComputedState)(accessor, parent, true));
                    toUpdate.add(parent);
                }
            }
        }
        if ((0, exports.isDurationAccessor)(accessor) && refreshDuration) {
            for (const parent of iterator_1.Iterable.concat(iterator_1.Iterable.single(node), accessor.getParents(node))) {
                const oldDuration = accessor.getCurrentComputedDuration(parent);
                const newDuration = (0, exports.getComputedDuration)(accessor, parent, true);
                if (oldDuration === newDuration) {
                    break;
                }
                accessor.setComputedDuration(parent, newDuration);
                toUpdate.add(parent);
            }
        }
        return toUpdate;
    };
    exports.refreshComputedState = refreshComputedState;
});
//# sourceMappingURL=getComputedState.js.map