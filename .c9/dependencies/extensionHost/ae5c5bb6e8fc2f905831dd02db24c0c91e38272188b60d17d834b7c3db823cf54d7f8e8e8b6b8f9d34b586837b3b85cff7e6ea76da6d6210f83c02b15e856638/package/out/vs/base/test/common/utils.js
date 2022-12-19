/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, lifecycle_1, path_1, platform_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.throwIfDisposablesAreLeakedAsync = exports.throwIfDisposablesAreLeaked = exports.ensureNoDisposablesAreLeakedInTestSuite = exports.DisposableTracker = exports.assertThrowsAsync = exports.testRepeat = exports.suiteRepeat = exports.toResource = void 0;
    function toResource(path) {
        if (platform_1.isWindows) {
            return uri_1.URI.file((0, path_1.join)('C:\\', btoa(this.test.fullTitle()), path));
        }
        return uri_1.URI.file((0, path_1.join)('/', btoa(this.test.fullTitle()), path));
    }
    exports.toResource = toResource;
    function suiteRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            suite(`${description} (iteration ${i})`, callback);
        }
    }
    exports.suiteRepeat = suiteRepeat;
    function testRepeat(n, description, callback) {
        for (let i = 0; i < n; i++) {
            test(`${description} (iteration ${i})`, callback);
        }
    }
    exports.testRepeat = testRepeat;
    async function assertThrowsAsync(block, message = 'Missing expected exception') {
        try {
            await block();
        }
        catch (_a) {
            return;
        }
        const err = message instanceof Error ? message : new Error(message);
        throw err;
    }
    exports.assertThrowsAsync = assertThrowsAsync;
    class DisposableTracker {
        constructor() {
            this.livingDisposables = new Map();
        }
        getDisposableData(d) {
            let val = this.livingDisposables.get(d);
            if (!val) {
                val = { parent: null, source: null, isSingleton: false };
                this.livingDisposables.set(d, val);
            }
            return val;
        }
        trackDisposable(d) {
            const data = this.getDisposableData(d);
            if (!data.source) {
                data.source = new Error().stack;
            }
        }
        setParent(child, parent) {
            const data = this.getDisposableData(child);
            data.parent = parent;
        }
        markAsDisposed(x) {
            this.livingDisposables.delete(x);
        }
        markAsSingleton(disposable) {
            this.getDisposableData(disposable).isSingleton = true;
        }
        getRootParent(data, cache) {
            const cacheValue = cache.get(data);
            if (cacheValue) {
                return cacheValue;
            }
            const result = data.parent ? this.getRootParent(this.getDisposableData(data.parent), cache) : data;
            cache.set(data, result);
            return result;
        }
        getTrackedDisposables() {
            const rootParentCache = new Map();
            const leaking = [...this.livingDisposables.entries()]
                .filter(([, v]) => v.source !== null && !this.getRootParent(v, rootParentCache).isSingleton)
                .map(([k]) => k)
                .flat();
            return leaking;
        }
        ensureNoLeakingDisposables() {
            const rootParentCache = new Map();
            const leaking = [...this.livingDisposables.values()]
                .filter(v => v.source !== null && !this.getRootParent(v, rootParentCache).isSingleton);
            if (leaking.length > 0) {
                const count = 10;
                const firstLeaking = leaking.slice(0, count);
                const remainingCount = leaking.length - count;
                const separator = '--------------------\n\n';
                let s = firstLeaking.map(l => l.source).join(separator);
                if (remainingCount > 0) {
                    s += `${separator}+ ${remainingCount} more`;
                }
                throw new Error(`These disposables were not disposed:\n${s}`);
            }
        }
    }
    exports.DisposableTracker = DisposableTracker;
    /**
     * Use this function to ensure that all disposables are cleaned up at the end of each test in the current suite.
     *
     * Use `markAsSingleton` if disposable singletons are created lazily that are allowed to outlive the test.
     * Make sure that the singleton properly registers all child disposables so that they are excluded too.
    */
    function ensureNoDisposablesAreLeakedInTestSuite() {
        let tracker;
        setup(() => {
            tracker = new DisposableTracker();
            (0, lifecycle_1.setDisposableTracker)(tracker);
        });
        teardown(function () {
            var _a;
            (0, lifecycle_1.setDisposableTracker)(null);
            if (((_a = this.currentTest) === null || _a === void 0 ? void 0 : _a.state) !== 'failed') {
                tracker.ensureNoLeakingDisposables();
            }
        });
    }
    exports.ensureNoDisposablesAreLeakedInTestSuite = ensureNoDisposablesAreLeakedInTestSuite;
    function throwIfDisposablesAreLeaked(body) {
        const tracker = new DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(tracker);
        body();
        (0, lifecycle_1.setDisposableTracker)(null);
        tracker.ensureNoLeakingDisposables();
    }
    exports.throwIfDisposablesAreLeaked = throwIfDisposablesAreLeaked;
    async function throwIfDisposablesAreLeakedAsync(body) {
        const tracker = new DisposableTracker();
        (0, lifecycle_1.setDisposableTracker)(tracker);
        await body();
        (0, lifecycle_1.setDisposableTracker)(null);
        tracker.ensureNoLeakingDisposables();
    }
    exports.throwIfDisposablesAreLeakedAsync = throwIfDisposablesAreLeakedAsync;
});
//# sourceMappingURL=utils.js.map