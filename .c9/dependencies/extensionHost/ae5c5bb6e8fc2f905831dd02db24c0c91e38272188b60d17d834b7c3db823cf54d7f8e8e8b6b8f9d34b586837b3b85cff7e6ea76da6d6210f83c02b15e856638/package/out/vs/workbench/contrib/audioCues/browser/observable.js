/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wasEventTriggeredRecently = exports.debouncedObservable = exports.observableFromEvent = exports.observableFromPromise = exports.LazyDerived = exports.derivedObservable = exports.autorunDelta = exports.AutorunObserver = exports.autorunWithStore = exports.autorun = exports.constObservable = exports.ObservableValue = exports.transaction = exports.BaseObservable = exports.ConvenientObservable = void 0;
    // === Base ===
    class ConvenientObservable {
        read(reader) {
            reader.handleBeforeReadObservable(this);
            return this.get();
        }
        map(fn) {
            return new LazyDerived((reader) => fn(this.read(reader)), '(mapped)');
        }
    }
    exports.ConvenientObservable = ConvenientObservable;
    class BaseObservable extends ConvenientObservable {
        constructor() {
            super(...arguments);
            this.observers = new Set();
        }
        subscribe(observer) {
            const len = this.observers.size;
            this.observers.add(observer);
            if (len === 0) {
                this.onFirstObserverSubscribed();
            }
        }
        unsubscribe(observer) {
            const deleted = this.observers.delete(observer);
            if (deleted && this.observers.size === 0) {
                this.onLastObserverUnsubscribed();
            }
        }
        onFirstObserverSubscribed() { }
        onLastObserverUnsubscribed() { }
    }
    exports.BaseObservable = BaseObservable;
    function transaction(fn) {
        const tx = new TransactionImpl();
        try {
            fn(tx);
        }
        finally {
            tx.finish();
        }
    }
    exports.transaction = transaction;
    class TransactionImpl {
        constructor() {
            this.finishActions = new Array();
        }
        updateObserver(observer, observable) {
            this.finishActions.push(function () {
                observer.endUpdate(observable);
            });
            observer.beginUpdate(observable);
        }
        finish() {
            for (const action of this.finishActions) {
                action();
            }
        }
    }
    class ObservableValue extends BaseObservable {
        constructor(initialValue, name) {
            super();
            this.name = name;
            this.value = initialValue;
        }
        get() {
            return this.value;
        }
        set(value, tx) {
            if (this.value === value) {
                return;
            }
            if (!tx) {
                transaction((tx) => {
                    this.set(value, tx);
                });
                return;
            }
            this.value = value;
            for (const observer of this.observers) {
                tx.updateObserver(observer, this);
                observer.handleChange(this);
            }
        }
    }
    exports.ObservableValue = ObservableValue;
    function constObservable(value) {
        return new ConstObservable(value);
    }
    exports.constObservable = constObservable;
    class ConstObservable extends ConvenientObservable {
        constructor(value) {
            super();
            this.value = value;
        }
        get() {
            return this.value;
        }
        subscribe(observer) {
            // NO OP
        }
        unsubscribe(observer) {
            // NO OP
        }
    }
    // == autorun ==
    function autorun(fn, name) {
        return new AutorunObserver(fn, name);
    }
    exports.autorun = autorun;
    function autorunWithStore(fn, name) {
        let store = new lifecycle_1.DisposableStore();
        const disposable = autorun(reader => {
            store.clear();
            fn(reader, store);
        }, name);
        return (0, lifecycle_1.toDisposable)(() => {
            disposable.dispose();
            store.dispose();
        });
    }
    exports.autorunWithStore = autorunWithStore;
    class AutorunObserver {
        constructor(runFn, name) {
            this.runFn = runFn;
            this.name = name;
            this.needsToRun = true;
            this.updateCount = 0;
            /**
             * The actual dependencies.
            */
            this._dependencies = new Set();
            /**
             * Dependencies that have to be removed when {@link runFn} ran through.
            */
            this.staleDependencies = new Set();
            this.runIfNeeded();
        }
        get dependencies() {
            return this._dependencies;
        }
        handleBeforeReadObservable(observable) {
            this._dependencies.add(observable);
            if (!this.staleDependencies.delete(observable)) {
                observable.subscribe(this);
            }
        }
        handleChange() {
            this.needsToRun = true;
            if (this.updateCount === 0) {
                this.runIfNeeded();
            }
        }
        beginUpdate() {
            this.updateCount++;
        }
        endUpdate() {
            this.updateCount--;
            if (this.updateCount === 0) {
                this.runIfNeeded();
            }
        }
        runIfNeeded() {
            if (!this.needsToRun) {
                return;
            }
            // Assert: this.staleDependencies is an empty set.
            const emptySet = this.staleDependencies;
            this.staleDependencies = this._dependencies;
            this._dependencies = emptySet;
            this.needsToRun = false;
            try {
                this.runFn(this);
            }
            finally {
                // We don't want our observed observables to think that they are (not even temporarily) not being observed.
                // Thus, we only unsubscribe from observables that are definitely not read anymore.
                for (const o of this.staleDependencies) {
                    o.unsubscribe(this);
                }
                this.staleDependencies.clear();
            }
        }
        dispose() {
            for (const o of this._dependencies) {
                o.unsubscribe(this);
            }
            this._dependencies.clear();
        }
    }
    exports.AutorunObserver = AutorunObserver;
    (function (autorun) {
        autorun.Observer = AutorunObserver;
    })(autorun = exports.autorun || (exports.autorun = {}));
    function autorunDelta(name, observable, handler) {
        let _lastValue;
        return autorun((reader) => {
            const newValue = observable.read(reader);
            const lastValue = _lastValue;
            _lastValue = newValue;
            handler({ lastValue, newValue });
        }, name);
    }
    exports.autorunDelta = autorunDelta;
    // == Lazy Derived ==
    function derivedObservable(name, computeFn) {
        return new LazyDerived(computeFn, name);
    }
    exports.derivedObservable = derivedObservable;
    class LazyDerived extends ConvenientObservable {
        constructor(computeFn, name) {
            super();
            this.observer = new LazyDerivedObserver(computeFn, name);
        }
        subscribe(observer) {
            this.observer.subscribe(observer);
        }
        unsubscribe(observer) {
            this.observer.unsubscribe(observer);
        }
        read(reader) {
            return this.observer.read(reader);
        }
        get() {
            return this.observer.get();
        }
    }
    exports.LazyDerived = LazyDerived;
    /**
     * @internal
     */
    class LazyDerivedObserver extends BaseObservable {
        constructor(computeFn, name) {
            super();
            this.computeFn = computeFn;
            this.name = name;
            this.hadValue = false;
            this.hasValue = false;
            this.value = undefined;
            this.updateCount = 0;
            this._dependencies = new Set();
            /**
             * Dependencies that have to be removed when {@link runFn} ran through.
            */
            this.staleDependencies = new Set();
        }
        get dependencies() {
            return this._dependencies;
        }
        onLastObserverUnsubscribed() {
            /**
             * We are not tracking changes anymore, thus we have to assume
             * that our cache is invalid.
            */
            this.hasValue = false;
            this.hadValue = false;
            this.value = undefined;
            for (const d of this._dependencies) {
                d.unsubscribe(this);
            }
            this._dependencies.clear();
        }
        handleBeforeReadObservable(observable) {
            this._dependencies.add(observable);
            if (!this.staleDependencies.delete(observable)) {
                observable.subscribe(this);
            }
        }
        handleChange() {
            if (this.hasValue) {
                this.hadValue = true;
                this.hasValue = false;
            }
            // Not in transaction: Recompute & inform observers immediately
            if (this.updateCount === 0 && this.observers.size > 0) {
                this.get();
            }
            // Otherwise, recompute in `endUpdate` or on demand.
        }
        beginUpdate() {
            if (this.updateCount === 0) {
                for (const r of this.observers) {
                    r.beginUpdate(this);
                }
            }
            this.updateCount++;
        }
        endUpdate() {
            this.updateCount--;
            if (this.updateCount === 0) {
                if (this.observers.size > 0) {
                    // Propagate invalidation
                    this.get();
                }
                for (const r of this.observers) {
                    r.endUpdate(this);
                }
            }
        }
        get() {
            if (this.observers.size === 0) {
                // Cache is not valid and don't refresh the cache.
                // Observables should not be read in non-reactive contexts.
                return this.computeFn(this);
            }
            if (this.updateCount > 0 && this.hasValue) {
                // Refresh dependencies
                for (const d of this._dependencies) {
                    // Maybe `.get()` triggers `handleChange`?
                    d.get();
                    if (!this.hasValue) {
                        // The other dependencies will refresh on demand
                        break;
                    }
                }
            }
            if (!this.hasValue) {
                const emptySet = this.staleDependencies;
                this.staleDependencies = this._dependencies;
                this._dependencies = emptySet;
                const oldValue = this.value;
                try {
                    this.value = this.computeFn(this);
                }
                finally {
                    // We don't want our observed observables to think that they are (not even temporarily) not being observed.
                    // Thus, we only unsubscribe from observables that are definitely not read anymore.
                    for (const o of this.staleDependencies) {
                        o.unsubscribe(this);
                    }
                    this.staleDependencies.clear();
                }
                this.hasValue = true;
                if (this.hadValue && oldValue !== this.value) {
                    //
                    for (const r of this.observers) {
                        r.handleChange(this);
                    }
                }
            }
            return this.value;
        }
    }
    (function (LazyDerived) {
        LazyDerived.Observer = LazyDerivedObserver;
    })(LazyDerived = exports.LazyDerived || (exports.LazyDerived = {}));
    function observableFromPromise(promise) {
        const observable = new ObservableValue({}, 'promiseValue');
        promise.then((value) => {
            observable.set({ value }, undefined);
        });
        return observable;
    }
    exports.observableFromPromise = observableFromPromise;
    function observableFromEvent(event, getValue) {
        return new FromEventObservable(event, getValue);
    }
    exports.observableFromEvent = observableFromEvent;
    class FromEventObservable extends BaseObservable {
        constructor(event, getValue) {
            super();
            this.event = event;
            this.getValue = getValue;
            this.hasValue = false;
            this.handleEvent = (args) => {
                const newValue = this.getValue(args);
                if (this.value !== newValue) {
                    this.value = newValue;
                    if (this.hasValue) {
                        transaction(tx => {
                            for (const o of this.observers) {
                                tx.updateObserver(o, this);
                                o.handleChange(this);
                            }
                        });
                    }
                    this.hasValue = true;
                }
            };
        }
        onFirstObserverSubscribed() {
            this.subscription = this.event(this.handleEvent);
        }
        onLastObserverUnsubscribed() {
            this.subscription.dispose();
            this.subscription = undefined;
            this.hasValue = false;
            this.value = undefined;
        }
        get() {
            if (this.subscription) {
                if (!this.hasValue) {
                    this.handleEvent(undefined);
                }
                return this.value;
            }
            else {
                // no cache, as there are no subscribers to clean it up
                return this.getValue(undefined);
            }
        }
    }
    (function (observableFromEvent) {
        observableFromEvent.Observer = FromEventObservable;
    })(observableFromEvent = exports.observableFromEvent || (exports.observableFromEvent = {}));
    function debouncedObservable(observable, debounceMs, disposableStore) {
        const debouncedObservable = new ObservableValue(undefined, 'debounced');
        let timeout = undefined;
        disposableStore.add(autorun(reader => {
            const value = observable.read(reader);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                transaction(tx => {
                    debouncedObservable.set(value, tx);
                });
            }, debounceMs);
        }, 'debounce'));
        return debouncedObservable;
    }
    exports.debouncedObservable = debouncedObservable;
    function wasEventTriggeredRecently(event, timeoutMs, disposableStore) {
        const observable = new ObservableValue(false, 'triggeredRecently');
        let timeout = undefined;
        disposableStore.add(event(() => {
            observable.set(true, undefined);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                observable.set(false, undefined);
            }, timeoutMs);
        }));
        return observable;
    }
    exports.wasEventTriggeredRecently = wasEventTriggeredRecently;
});
//# sourceMappingURL=observable.js.map