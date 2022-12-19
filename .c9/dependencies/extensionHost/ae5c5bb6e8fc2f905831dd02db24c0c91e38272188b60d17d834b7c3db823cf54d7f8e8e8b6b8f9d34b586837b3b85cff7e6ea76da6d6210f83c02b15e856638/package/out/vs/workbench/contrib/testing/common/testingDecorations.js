/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation"], function (require, exports, arrays_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITestingDecorationsService = exports.TestDecorations = void 0;
    class TestDecorations {
        constructor() {
            this.value = [];
        }
        /**
         * Looks up a decoration by ID.
         */
        get(decorationId) {
            if (this._idMap) {
                return this._idMap.get(decorationId);
            }
            else if (this.value.length > 16) {
                this._idMap = new Map();
                for (const value of this.value) {
                    this._idMap.set(value.id, value);
                }
                return this._idMap.get(decorationId);
            }
            else {
                return this.value.find(v => v.id === decorationId);
            }
        }
        /**
         * Adds a new value to the decorations.
         */
        push(value) {
            const searchIndex = (0, arrays_1.binarySearch)(this.value, value, (a, b) => a.line - b.line);
            this.value.splice(searchIndex < 0 ? ~searchIndex : searchIndex, 0, value);
            this._idMap = undefined;
        }
        /**
         * Finds the value that exists on the given line, if any.
         */
        findOnLine(line, predicate) {
            const lineStart = (0, arrays_1.binarySearch)(this.value, { line }, (a, b) => a.line - b.line);
            if (lineStart < 0) {
                return undefined;
            }
            for (let i = lineStart; i < this.value.length && this.value[i].line === line; i++) {
                if (predicate(this.value[i])) {
                    return this.value[i];
                }
            }
            return undefined;
        }
        /**
         * Gets decorations on each line.
         */
        *lines() {
            if (!this.value.length) {
                return;
            }
            let startIndex = 0;
            let startLine = this.value[0].line;
            for (let i = 1; i < this.value.length; i++) {
                const v = this.value[i];
                if (v.line !== startLine) {
                    yield [startLine, this.value.slice(startIndex, i)];
                    startLine = v.line;
                    startIndex = i;
                }
            }
            yield [startLine, this.value.slice(startIndex)];
        }
    }
    exports.TestDecorations = TestDecorations;
    exports.ITestingDecorationsService = (0, instantiation_1.createDecorator)('testingDecorationService');
});
//# sourceMappingURL=testingDecorations.js.map