/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.terminalStatePriorities = exports.isRunningState = exports.statesInOrder = exports.maxPriority = exports.cmpPriority = exports.stateNodes = exports.isStateWithResult = exports.isFailedState = exports.statePriority = void 0;
    /**
     * List of display priorities for different run states. When tests update,
     * the highest-priority state from any of their children will be the state
     * reflected in the parent node.
     */
    exports.statePriority = {
        [2 /* TestResultState.Running */]: 6,
        [6 /* TestResultState.Errored */]: 5,
        [4 /* TestResultState.Failed */]: 4,
        [1 /* TestResultState.Queued */]: 3,
        [3 /* TestResultState.Passed */]: 2,
        [0 /* TestResultState.Unset */]: 1,
        [5 /* TestResultState.Skipped */]: 0,
    };
    const isFailedState = (s) => s === 6 /* TestResultState.Errored */ || s === 4 /* TestResultState.Failed */;
    exports.isFailedState = isFailedState;
    const isStateWithResult = (s) => s === 6 /* TestResultState.Errored */ || s === 4 /* TestResultState.Failed */ || s === 3 /* TestResultState.Passed */;
    exports.isStateWithResult = isStateWithResult;
    exports.stateNodes = Object.entries(exports.statePriority).reduce((acc, [stateStr, priority]) => {
        const state = Number(stateStr);
        acc[state] = { statusNode: true, state, priority };
        return acc;
    }, {});
    const cmpPriority = (a, b) => exports.statePriority[b] - exports.statePriority[a];
    exports.cmpPriority = cmpPriority;
    const maxPriority = (...states) => {
        switch (states.length) {
            case 0:
                return 0 /* TestResultState.Unset */;
            case 1:
                return states[0];
            case 2:
                return exports.statePriority[states[0]] > exports.statePriority[states[1]] ? states[0] : states[1];
            default: {
                let max = states[0];
                for (let i = 1; i < states.length; i++) {
                    if (exports.statePriority[max] < exports.statePriority[states[i]]) {
                        max = states[i];
                    }
                }
                return max;
            }
        }
    };
    exports.maxPriority = maxPriority;
    exports.statesInOrder = Object.keys(exports.statePriority).map(s => Number(s)).sort(exports.cmpPriority);
    const isRunningState = (s) => s === 1 /* TestResultState.Queued */ || s === 2 /* TestResultState.Running */;
    exports.isRunningState = isRunningState;
    /**
     * Some states are considered terminal; once these are set for a given test run, they
     * are not reset back to a non-terminal state, or to a terminal state with lower
     * priority.
     */
    exports.terminalStatePriorities = {
        [3 /* TestResultState.Passed */]: 0,
        [5 /* TestResultState.Skipped */]: 1,
        [4 /* TestResultState.Failed */]: 2,
        [6 /* TestResultState.Errored */]: 3,
    };
});
//# sourceMappingURL=testingStates.js.map