/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/iterator", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/testing/common/testId"], function (require, exports, cancellation_1, iterator_1, instantiation_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testsInFile = exports.getAllTestsInHierarchy = exports.expandAndGetTestById = exports.getContextForTestItem = exports.testCollectionIsEmpty = exports.getCollectionItemParents = exports.ITestService = void 0;
    exports.ITestService = (0, instantiation_1.createDecorator)('testService');
    /**
     * Iterates through the item and its parents to the root.
     */
    const getCollectionItemParents = function* (collection, item) {
        let i = item;
        while (i) {
            yield i;
            i = i.parent ? collection.getNodeById(i.parent) : undefined;
        }
    };
    exports.getCollectionItemParents = getCollectionItemParents;
    const testCollectionIsEmpty = (collection) => !iterator_1.Iterable.some(collection.rootItems, r => r.children.size > 0);
    exports.testCollectionIsEmpty = testCollectionIsEmpty;
    const getContextForTestItem = (collection, id) => {
        if (typeof id === 'string') {
            id = testId_1.TestId.fromString(id);
        }
        if (id.isRoot) {
            return { controller: id.toString() };
        }
        const context = { $mid: 13 /* MarshalledId.TestItemContext */, tests: [] };
        for (const i of id.idsFromRoot()) {
            if (!i.isRoot) {
                const test = collection.getNodeById(i.toString());
                if (test) {
                    context.tests.push(test);
                }
            }
        }
        return context;
    };
    exports.getContextForTestItem = getContextForTestItem;
    /**
     * Ensures the test with the given ID exists in the collection, if possible.
     * If cancellation is requested, or the test cannot be found, it will return
     * undefined.
     */
    const expandAndGetTestById = async (collection, id, ct = cancellation_1.CancellationToken.None) => {
        const idPath = [...testId_1.TestId.fromString(id).idsFromRoot()];
        let expandToLevel = 0;
        for (let i = idPath.length - 1; !ct.isCancellationRequested && i >= expandToLevel;) {
            const id = idPath[i].toString();
            const existing = collection.getNodeById(id);
            if (!existing) {
                i--;
                continue;
            }
            if (i === idPath.length - 1) {
                return existing;
            }
            // expand children only if it looks like it's necessary
            if (!existing.children.has(idPath[i + 1].toString())) {
                await collection.expand(id, 0);
            }
            expandToLevel = i + 1; // avoid an infinite loop if the test does not exist
            i = idPath.length - 1;
        }
        return undefined;
    };
    exports.expandAndGetTestById = expandAndGetTestById;
    /**
     * Waits for all test in the hierarchy to be fulfilled before returning.
     * If cancellation is requested, it will return early.
     */
    const getAllTestsInHierarchy = async (collection, ct = cancellation_1.CancellationToken.None) => {
        if (ct.isCancellationRequested) {
            return;
        }
        let l;
        await Promise.race([
            Promise.all([...collection.rootItems].map(r => collection.expand(r.item.extId, Infinity))),
            new Promise(r => { l = ct.onCancellationRequested(r); }),
        ]).finally(() => l === null || l === void 0 ? void 0 : l.dispose());
    };
    exports.getAllTestsInHierarchy = getAllTestsInHierarchy;
    /**
     * Iterator that expands to and iterates through tests in the file. Iterates
     * in strictly descending order.
     */
    const testsInFile = function (collection, ident, uri) {
        return __asyncGenerator(this, arguments, function* () {
            for (const test of collection.all) {
                if (!test.item.uri) {
                    continue;
                }
                if (ident.extUri.isEqual(uri, test.item.uri)) {
                    yield yield __await(test);
                }
                if (ident.extUri.isEqualOrParent(uri, test.item.uri) && test.expand === 1 /* TestItemExpandState.Expandable */) {
                    yield __await(collection.expand(test.item.extId, 1));
                }
            }
        });
    };
    exports.testsInFile = testsInFile;
});
//# sourceMappingURL=testService.js.map