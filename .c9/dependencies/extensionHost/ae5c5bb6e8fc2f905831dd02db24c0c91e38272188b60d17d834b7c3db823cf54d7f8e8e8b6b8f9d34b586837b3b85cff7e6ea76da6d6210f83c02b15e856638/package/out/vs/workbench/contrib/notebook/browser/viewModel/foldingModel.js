/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/contrib/folding/browser/foldingRanges", "vs/editor/contrib/folding/browser/syntaxRangeProvider", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, event_1, lifecycle_1, foldingRanges_1, syntaxRangeProvider_1, notebookCommon_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updateFoldingStateAtIndex = exports.FoldingModel = void 0;
    class FoldingModel {
        constructor() {
            this._viewModel = null;
            this._viewModelStore = new lifecycle_1.DisposableStore();
            this._onDidFoldingRegionChanges = new event_1.Emitter();
            this.onDidFoldingRegionChanged = this._onDidFoldingRegionChanges.event;
            this._foldingRangeDecorationIds = [];
            this._regions = new foldingRanges_1.FoldingRegions(new Uint32Array(0), new Uint32Array(0));
        }
        get regions() {
            return this._regions;
        }
        dispose() {
            this._onDidFoldingRegionChanges.dispose();
            this._viewModelStore.dispose();
        }
        detachViewModel() {
            this._viewModelStore.clear();
            this._viewModel = null;
        }
        attachViewModel(model) {
            this._viewModel = model;
            this._viewModelStore.add(this._viewModel.onDidChangeViewCells(() => {
                this.recompute();
            }));
            this._viewModelStore.add(this._viewModel.onDidChangeSelection(() => {
                if (!this._viewModel) {
                    return;
                }
                const indexes = (0, notebookRange_1.cellRangesToIndexes)(this._viewModel.getSelections());
                let changed = false;
                indexes.forEach(index => {
                    let regionIndex = this.regions.findRange(index + 1);
                    while (regionIndex !== -1) {
                        if (this._regions.isCollapsed(regionIndex) && index > this._regions.getStartLineNumber(regionIndex) - 1) {
                            this._regions.setCollapsed(regionIndex, false);
                            changed = true;
                        }
                        regionIndex = this._regions.getParentIndex(regionIndex);
                    }
                });
                if (changed) {
                    this._onDidFoldingRegionChanges.fire();
                }
            }));
            this.recompute();
        }
        getRegionAtLine(lineNumber) {
            if (this._regions) {
                const index = this._regions.findRange(lineNumber);
                if (index >= 0) {
                    return this._regions.toRegion(index);
                }
            }
            return null;
        }
        getRegionsInside(region, filter) {
            const result = [];
            const index = region ? region.regionIndex + 1 : 0;
            const endLineNumber = region ? region.endLineNumber : Number.MAX_VALUE;
            if (filter && filter.length === 2) {
                const levelStack = [];
                for (let i = index, len = this._regions.length; i < len; i++) {
                    const current = this._regions.toRegion(i);
                    if (this._regions.getStartLineNumber(i) < endLineNumber) {
                        while (levelStack.length > 0 && !current.containedBy(levelStack[levelStack.length - 1])) {
                            levelStack.pop();
                        }
                        levelStack.push(current);
                        if (filter(current, levelStack.length)) {
                            result.push(current);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            else {
                for (let i = index, len = this._regions.length; i < len; i++) {
                    const current = this._regions.toRegion(i);
                    if (this._regions.getStartLineNumber(i) < endLineNumber) {
                        if (!filter || filter(current)) {
                            result.push(current);
                        }
                    }
                    else {
                        break;
                    }
                }
            }
            return result;
        }
        getAllRegionsAtLine(lineNumber, filter) {
            const result = [];
            if (this._regions) {
                let index = this._regions.findRange(lineNumber);
                let level = 1;
                while (index >= 0) {
                    const current = this._regions.toRegion(index);
                    if (!filter || filter(current, level)) {
                        result.push(current);
                    }
                    level++;
                    index = current.parentIndex;
                }
            }
            return result;
        }
        setCollapsed(index, newState) {
            this._regions.setCollapsed(index, newState);
        }
        recompute() {
            if (!this._viewModel) {
                return;
            }
            const viewModel = this._viewModel;
            const cells = viewModel.viewCells;
            const stack = [];
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (cell.cellKind === notebookCommon_1.CellKind.Code) {
                    continue;
                }
                const content = cell.getText();
                const matches = content.match(/^[ \t]*(\#+) /gm);
                let min = 7;
                if (matches && matches.length) {
                    for (let j = 0; j < matches.length; j++) {
                        min = Math.min(min, matches[j].length);
                    }
                }
                if (min < 7) {
                    // header 1 to 6
                    stack.push({ index: i, level: min, endIndex: 0 });
                }
            }
            // calcualte folding ranges
            const rawFoldingRanges = stack.map((entry, startIndex) => {
                let end = undefined;
                for (let i = startIndex + 1; i < stack.length; ++i) {
                    if (stack[i].level <= entry.level) {
                        end = stack[i].index - 1;
                        break;
                    }
                }
                const endIndex = end !== undefined ? end : cells.length - 1;
                // one based
                return {
                    start: entry.index + 1,
                    end: endIndex + 1,
                    rank: 1
                };
            }).filter(range => range.start !== range.end);
            const newRegions = (0, syntaxRangeProvider_1.sanitizeRanges)(rawFoldingRanges, 5000);
            // restore collased state
            let i = 0;
            const nextCollapsed = () => {
                while (i < this._regions.length) {
                    const isCollapsed = this._regions.isCollapsed(i);
                    i++;
                    if (isCollapsed) {
                        return i - 1;
                    }
                }
                return -1;
            };
            let k = 0;
            let collapsedIndex = nextCollapsed();
            while (collapsedIndex !== -1 && k < newRegions.length) {
                // get the latest range
                const decRange = viewModel.getTrackedRange(this._foldingRangeDecorationIds[collapsedIndex]);
                if (decRange) {
                    const collasedStartIndex = decRange.start;
                    while (k < newRegions.length) {
                        const startIndex = newRegions.getStartLineNumber(k) - 1;
                        if (collasedStartIndex >= startIndex) {
                            newRegions.setCollapsed(k, collasedStartIndex === startIndex);
                            k++;
                        }
                        else {
                            break;
                        }
                    }
                }
                collapsedIndex = nextCollapsed();
            }
            while (k < newRegions.length) {
                newRegions.setCollapsed(k, false);
                k++;
            }
            const cellRanges = [];
            for (let i = 0; i < newRegions.length; i++) {
                const region = newRegions.toRegion(i);
                cellRanges.push({ start: region.startLineNumber - 1, end: region.endLineNumber - 1 });
            }
            // remove old tracked ranges and add new ones
            // TODO@rebornix, implement delta
            this._foldingRangeDecorationIds.forEach(id => viewModel.setTrackedRange(id, null, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */));
            this._foldingRangeDecorationIds = cellRanges.map(region => viewModel.setTrackedRange(null, region, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */)).filter(str => str !== null);
            this._regions = newRegions;
            this._onDidFoldingRegionChanges.fire();
        }
        getMemento() {
            const collapsedRanges = [];
            let i = 0;
            while (i < this._regions.length) {
                const isCollapsed = this._regions.isCollapsed(i);
                if (isCollapsed) {
                    const region = this._regions.toRegion(i);
                    collapsedRanges.push({ start: region.startLineNumber - 1, end: region.endLineNumber - 1 });
                }
                i++;
            }
            return collapsedRanges;
        }
        applyMemento(state) {
            if (!this._viewModel) {
                return false;
            }
            let i = 0;
            let k = 0;
            while (k < state.length && i < this._regions.length) {
                // get the latest range
                const decRange = this._viewModel.getTrackedRange(this._foldingRangeDecorationIds[i]);
                if (decRange) {
                    const collasedStartIndex = state[k].start;
                    while (i < this._regions.length) {
                        const startIndex = this._regions.getStartLineNumber(i) - 1;
                        if (collasedStartIndex >= startIndex) {
                            this._regions.setCollapsed(i, collasedStartIndex === startIndex);
                            i++;
                        }
                        else {
                            break;
                        }
                    }
                }
                k++;
            }
            while (i < this._regions.length) {
                this._regions.setCollapsed(i, false);
                i++;
            }
            return true;
        }
    }
    exports.FoldingModel = FoldingModel;
    function updateFoldingStateAtIndex(foldingModel, index, collapsed) {
        const range = foldingModel.regions.findRange(index + 1);
        foldingModel.setCollapsed(range, collapsed);
    }
    exports.updateFoldingStateAtIndex = updateFoldingStateAtIndex;
});
//# sourceMappingURL=foldingModel.js.map