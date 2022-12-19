/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/editor/common/core/range"], function (require, exports, assert, event_1, lifecycle_1, objects, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffNavigator = void 0;
    const defaultOptions = {
        followsCaret: true,
        ignoreCharChanges: true,
        alwaysRevealFirst: true
    };
    /**
     * Create a new diff navigator for the provided diff editor.
     */
    class DiffNavigator extends lifecycle_1.Disposable {
        constructor(editor, options = {}) {
            super();
            this._onDidUpdate = this._register(new event_1.Emitter());
            this.onDidUpdate = this._onDidUpdate.event;
            this._editor = editor;
            this._options = objects.mixin(options, defaultOptions, false);
            this.disposed = false;
            this.nextIdx = -1;
            this.ranges = [];
            this.ignoreSelectionChange = false;
            this.revealFirst = Boolean(this._options.alwaysRevealFirst);
            // hook up to diff editor for diff, disposal, and caret move
            this._register(this._editor.onDidDispose(() => this.dispose()));
            this._register(this._editor.onDidUpdateDiff(() => this._onDiffUpdated()));
            if (this._options.followsCaret) {
                this._register(this._editor.getModifiedEditor().onDidChangeCursorPosition((e) => {
                    if (this.ignoreSelectionChange) {
                        return;
                    }
                    this.nextIdx = -1;
                }));
            }
            if (this._options.alwaysRevealFirst) {
                this._register(this._editor.getModifiedEditor().onDidChangeModel((e) => {
                    this.revealFirst = true;
                }));
            }
            // init things
            this._init();
        }
        _init() {
            const changes = this._editor.getLineChanges();
            if (!changes) {
                return;
            }
        }
        _onDiffUpdated() {
            this._init();
            this._compute(this._editor.getLineChanges());
            if (this.revealFirst) {
                // Only reveal first on first non-null changes
                if (this._editor.getLineChanges() !== null) {
                    this.revealFirst = false;
                    this.nextIdx = -1;
                    this.next(1 /* ScrollType.Immediate */);
                }
            }
        }
        _compute(lineChanges) {
            // new ranges
            this.ranges = [];
            if (lineChanges) {
                // create ranges from changes
                lineChanges.forEach((lineChange) => {
                    if (!this._options.ignoreCharChanges && lineChange.charChanges) {
                        lineChange.charChanges.forEach((charChange) => {
                            this.ranges.push({
                                rhs: true,
                                range: new range_1.Range(charChange.modifiedStartLineNumber, charChange.modifiedStartColumn, charChange.modifiedEndLineNumber, charChange.modifiedEndColumn)
                            });
                        });
                    }
                    else {
                        if (lineChange.modifiedEndLineNumber === 0) {
                            // a deletion
                            this.ranges.push({
                                rhs: true,
                                range: new range_1.Range(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedStartLineNumber + 1, 1)
                            });
                        }
                        else {
                            // an insertion or modification
                            this.ranges.push({
                                rhs: true,
                                range: new range_1.Range(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber + 1, 1)
                            });
                        }
                    }
                });
            }
            // sort
            this.ranges.sort((left, right) => range_1.Range.compareRangesUsingStarts(left.range, right.range));
            this._onDidUpdate.fire(this);
        }
        _initIdx(fwd) {
            let found = false;
            const position = this._editor.getPosition();
            if (!position) {
                this.nextIdx = 0;
                return;
            }
            for (let i = 0, len = this.ranges.length; i < len && !found; i++) {
                const range = this.ranges[i].range;
                if (position.isBeforeOrEqual(range.getStartPosition())) {
                    this.nextIdx = i + (fwd ? 0 : -1);
                    found = true;
                }
            }
            if (!found) {
                // after the last change
                this.nextIdx = fwd ? 0 : this.ranges.length - 1;
            }
            if (this.nextIdx < 0) {
                this.nextIdx = this.ranges.length - 1;
            }
        }
        _move(fwd, scrollType) {
            assert.ok(!this.disposed, 'Illegal State - diff navigator has been disposed');
            if (!this.canNavigate()) {
                return;
            }
            if (this.nextIdx === -1) {
                this._initIdx(fwd);
            }
            else if (fwd) {
                this.nextIdx += 1;
                if (this.nextIdx >= this.ranges.length) {
                    this.nextIdx = 0;
                }
            }
            else {
                this.nextIdx -= 1;
                if (this.nextIdx < 0) {
                    this.nextIdx = this.ranges.length - 1;
                }
            }
            const info = this.ranges[this.nextIdx];
            this.ignoreSelectionChange = true;
            try {
                const pos = info.range.getStartPosition();
                this._editor.setPosition(pos);
                this._editor.revealRangeInCenter(info.range, scrollType);
            }
            finally {
                this.ignoreSelectionChange = false;
            }
        }
        canNavigate() {
            return this.ranges && this.ranges.length > 0;
        }
        next(scrollType = 0 /* ScrollType.Smooth */) {
            this._move(true, scrollType);
        }
        previous(scrollType = 0 /* ScrollType.Smooth */) {
            this._move(false, scrollType);
        }
        dispose() {
            super.dispose();
            this.ranges = [];
            this.disposed = true;
        }
    }
    exports.DiffNavigator = DiffNavigator;
});
//# sourceMappingURL=diffNavigator.js.map