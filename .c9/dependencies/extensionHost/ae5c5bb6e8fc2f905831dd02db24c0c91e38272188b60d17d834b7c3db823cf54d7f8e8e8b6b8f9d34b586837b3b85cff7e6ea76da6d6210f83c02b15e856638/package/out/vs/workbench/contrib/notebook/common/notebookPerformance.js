/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAndClearMarks = exports.clearMarks = exports.mark = void 0;
    const perfMarks = new Map();
    function mark(resource, name) {
        const key = resource.toString();
        if (!perfMarks.has(key)) {
            const perfMark = {};
            perfMark[name] = Date.now();
            perfMarks.set(key, perfMark);
        }
        else {
            if (perfMarks.get(key)[name]) {
                console.error(`Skipping overwrite of notebook perf value: ${name}`);
                return;
            }
            perfMarks.get(key)[name] = Date.now();
        }
    }
    exports.mark = mark;
    function clearMarks(resource) {
        const key = resource.toString();
        perfMarks.delete(key);
    }
    exports.clearMarks = clearMarks;
    function getAndClearMarks(resource) {
        const key = resource.toString();
        const perfMark = perfMarks.get(key) || null;
        perfMarks.delete(key);
        return perfMark;
    }
    exports.getAndClearMarks = getAndClearMarks;
});
//# sourceMappingURL=notebookPerformance.js.map