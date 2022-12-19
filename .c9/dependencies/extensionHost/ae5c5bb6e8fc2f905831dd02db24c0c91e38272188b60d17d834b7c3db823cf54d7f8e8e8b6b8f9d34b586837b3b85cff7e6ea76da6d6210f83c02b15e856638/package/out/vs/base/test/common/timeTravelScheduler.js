/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    var _a, _b, _c, _d;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.originalGlobalValues = exports.runWithFakedTimers = exports.AsyncSchedulerProcessor = exports.TimeTravelScheduler = void 0;
    class SimplePriorityQueue {
        constructor(items, compare) {
            this.compare = compare;
            this.isSorted = false;
            this.items = items;
        }
        get length() {
            return this.items.length;
        }
        add(value) {
            this.items.push(value);
            this.isSorted = false;
        }
        remove(value) {
            this.items.splice(this.items.indexOf(value), 1);
            this.isSorted = false;
        }
        removeMin() {
            this.ensureSorted();
            return this.items.shift();
        }
        getMin() {
            this.ensureSorted();
            return this.items[0];
        }
        toSortedArray() {
            this.ensureSorted();
            return [...this.items];
        }
        ensureSorted() {
            if (!this.isSorted) {
                this.items.sort(this.compare);
                this.isSorted = true;
            }
        }
    }
    function compareScheduledTasks(a, b) {
        if (a.time !== b.time) {
            // Prefer lower time
            return a.time - b.time;
        }
        if (a.id !== b.id) {
            // Prefer lower id
            return a.id - b.id;
        }
        return 0;
    }
    class TimeTravelScheduler {
        constructor() {
            this.taskCounter = 0;
            this._now = 0;
            this.queue = new SimplePriorityQueue([], compareScheduledTasks);
            this.taskScheduledEmitter = new event_1.Emitter();
            this.onTaskScheduled = this.taskScheduledEmitter.event;
        }
        schedule(task) {
            if (task.time < this._now) {
                throw new Error(`Scheduled time (${task.time}) must be equal to or greater than the current time (${this._now}).`);
            }
            const extendedTask = Object.assign(Object.assign({}, task), { id: this.taskCounter++ });
            this.queue.add(extendedTask);
            this.taskScheduledEmitter.fire({ task });
            return { dispose: () => this.queue.remove(extendedTask) };
        }
        get now() {
            return this._now;
        }
        get hasScheduledTasks() {
            return this.queue.length > 0;
        }
        getScheduledTasks() {
            return this.queue.toSortedArray();
        }
        runNext() {
            const task = this.queue.removeMin();
            if (task) {
                this._now = task.time;
                task.run();
            }
            return task;
        }
        installGlobally() {
            return overwriteGlobals(this);
        }
    }
    exports.TimeTravelScheduler = TimeTravelScheduler;
    class AsyncSchedulerProcessor extends lifecycle_1.Disposable {
        constructor(scheduler, options) {
            super();
            this.scheduler = scheduler;
            this.isProcessing = false;
            this._history = new Array();
            this.queueEmptyEmitter = new event_1.Emitter();
            this.onTaskQueueEmpty = this.queueEmptyEmitter.event;
            this.maxTaskCount = options && options.maxTaskCount ? options.maxTaskCount : 100;
            this.useSetImmediate = options && options.useSetImmediate ? options.useSetImmediate : false;
            this._register(scheduler.onTaskScheduled(() => {
                if (this.isProcessing) {
                    return;
                }
                else {
                    this.isProcessing = true;
                    this.schedule();
                }
            }));
        }
        get history() { return this._history; }
        schedule() {
            // This allows promises created by a previous task to settle and schedule tasks before the next task is run.
            // Tasks scheduled in those promises might have to run before the current next task.
            Promise.resolve().then(() => {
                if (this.useSetImmediate) {
                    exports.originalGlobalValues.setImmediate(() => this.process());
                }
                else {
                    exports.originalGlobalValues.setTimeout(() => this.process());
                }
            });
        }
        process() {
            const executedTask = this.scheduler.runNext();
            if (executedTask) {
                this._history.push(executedTask);
                if (this.history.length >= this.maxTaskCount && this.scheduler.hasScheduledTasks) {
                    const lastTasks = this._history.slice(Math.max(0, this.history.length - 10)).map(h => `${h.source.toString()}: ${h.source.stackTrace}`);
                    let e = new Error(`Queue did not get empty after processing ${this.history.length} items. These are the last ${lastTasks.length} scheduled tasks:\n${lastTasks.join('\n\n\n')}`);
                    this.lastError = e;
                    throw e;
                }
            }
            if (this.scheduler.hasScheduledTasks) {
                this.schedule();
            }
            else {
                this.isProcessing = false;
                this.queueEmptyEmitter.fire();
            }
        }
        waitForEmptyQueue() {
            if (this.lastError) {
                const error = this.lastError;
                this.lastError = undefined;
                throw error;
            }
            if (!this.isProcessing) {
                return Promise.resolve();
            }
            else {
                return event_1.Event.toPromise(this.onTaskQueueEmpty).then(() => {
                    if (this.lastError) {
                        throw this.lastError;
                    }
                });
            }
        }
    }
    exports.AsyncSchedulerProcessor = AsyncSchedulerProcessor;
    async function runWithFakedTimers(options, fn) {
        const useFakeTimers = options.useFakeTimers === undefined ? true : options.useFakeTimers;
        if (!useFakeTimers) {
            return fn();
        }
        const scheduler = new TimeTravelScheduler();
        const schedulerProcessor = new AsyncSchedulerProcessor(scheduler, { useSetImmediate: options.useSetImmediate, maxTaskCount: options.maxTaskCount });
        const globalInstallDisposable = scheduler.installGlobally();
        let result;
        try {
            result = await fn();
        }
        finally {
            globalInstallDisposable.dispose();
            try {
                // We process the remaining scheduled tasks.
                // The global override is no longer active, so during this, no more tasks will be scheduled.
                await schedulerProcessor.waitForEmptyQueue();
            }
            finally {
                schedulerProcessor.dispose();
            }
        }
        return result;
    }
    exports.runWithFakedTimers = runWithFakedTimers;
    exports.originalGlobalValues = {
        setTimeout: globalThis.setTimeout.bind(globalThis),
        clearTimeout: globalThis.clearTimeout.bind(globalThis),
        setInterval: globalThis.setInterval.bind(globalThis),
        clearInterval: globalThis.clearInterval.bind(globalThis),
        setImmediate: (_a = globalThis.setImmediate) === null || _a === void 0 ? void 0 : _a.bind(globalThis),
        clearImmediate: (_b = globalThis.clearImmediate) === null || _b === void 0 ? void 0 : _b.bind(globalThis),
        requestAnimationFrame: (_c = globalThis.requestAnimationFrame) === null || _c === void 0 ? void 0 : _c.bind(globalThis),
        cancelAnimationFrame: (_d = globalThis.cancelAnimationFrame) === null || _d === void 0 ? void 0 : _d.bind(globalThis),
        Date: globalThis.Date,
    };
    function setTimeout(scheduler, handler, timeout = 0) {
        if (typeof handler === 'string') {
            throw new Error('String handler args should not be used and are not supported');
        }
        return scheduler.schedule({
            time: scheduler.now + timeout,
            run: () => {
                handler();
            },
            source: {
                toString() { return 'setTimeout'; },
                stackTrace: new Error().stack,
            }
        });
    }
    function setInterval(scheduler, handler, interval) {
        if (typeof handler === 'string') {
            throw new Error('String handler args should not be used and are not supported');
        }
        const validatedHandler = handler;
        let iterCount = 0;
        const stackTrace = new Error().stack;
        let disposed = false;
        let lastDisposable;
        function schedule() {
            iterCount++;
            const curIter = iterCount;
            lastDisposable = scheduler.schedule({
                time: scheduler.now + interval,
                run() {
                    if (!disposed) {
                        schedule();
                        validatedHandler();
                    }
                },
                source: {
                    toString() { return `setInterval (iteration ${curIter})`; },
                    stackTrace,
                }
            });
        }
        schedule();
        return {
            dispose: () => {
                if (disposed) {
                    return;
                }
                disposed = true;
                lastDisposable.dispose();
            }
        };
    }
    function overwriteGlobals(scheduler) {
        globalThis.setTimeout = ((handler, timeout) => setTimeout(scheduler, handler, timeout));
        globalThis.clearTimeout = (timeoutId) => {
            if (typeof timeoutId === 'object' && timeoutId && 'dispose' in timeoutId) {
                timeoutId.dispose();
            }
            else {
                exports.originalGlobalValues.clearTimeout(timeoutId);
            }
        };
        globalThis.setInterval = ((handler, timeout) => setInterval(scheduler, handler, timeout));
        globalThis.clearInterval = (timeoutId) => {
            if (typeof timeoutId === 'object' && timeoutId && 'dispose' in timeoutId) {
                timeoutId.dispose();
            }
            else {
                exports.originalGlobalValues.clearInterval(timeoutId);
            }
        };
        globalThis.Date = createDateClass(scheduler);
        return {
            dispose: () => {
                Object.assign(globalThis, exports.originalGlobalValues);
            }
        };
    }
    function createDateClass(scheduler) {
        const OriginalDate = exports.originalGlobalValues.Date;
        function SchedulerDate(...args) {
            // the Date constructor called as a function, ref Ecma-262 Edition 5.1, section 15.9.2.
            // This remains so in the 10th edition of 2019 as well.
            if (!(this instanceof SchedulerDate)) {
                return new OriginalDate(scheduler.now).toString();
            }
            // if Date is called as a constructor with 'new' keyword
            if (args.length === 0) {
                return new OriginalDate(scheduler.now);
            }
            return new OriginalDate(...args);
        }
        for (let prop in OriginalDate) {
            if (OriginalDate.hasOwnProperty(prop)) {
                SchedulerDate[prop] = OriginalDate[prop];
            }
        }
        SchedulerDate.now = function now() {
            return scheduler.now;
        };
        SchedulerDate.toString = function toString() {
            return OriginalDate.toString();
        };
        SchedulerDate.prototype = OriginalDate.prototype;
        SchedulerDate.parse = OriginalDate.parse;
        SchedulerDate.UTC = OriginalDate.UTC;
        SchedulerDate.prototype.toUTCString = OriginalDate.prototype.toUTCString;
        return SchedulerDate;
    }
});
//# sourceMappingURL=timeTravelScheduler.js.map