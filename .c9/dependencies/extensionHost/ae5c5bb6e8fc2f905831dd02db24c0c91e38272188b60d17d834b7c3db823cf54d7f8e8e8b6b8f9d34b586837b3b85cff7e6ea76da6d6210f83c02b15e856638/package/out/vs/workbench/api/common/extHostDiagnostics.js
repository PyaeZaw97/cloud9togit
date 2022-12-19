/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/nls", "vs/platform/markers/common/markers", "vs/base/common/uri", "./extHost.protocol", "./extHostTypes", "./extHostTypeConverters", "vs/base/common/event", "vs/platform/log/common/log", "vs/base/common/map", "vs/workbench/api/common/extHostFileSystemInfo"], function (require, exports, nls_1, markers_1, uri_1, extHost_protocol_1, extHostTypes_1, converter, event_1, log_1, map_1, extHostFileSystemInfo_1) {
    "use strict";
    var _DiagnosticCollection_proxy, _DiagnosticCollection_onDidChangeDiagnostics, _DiagnosticCollection_data;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDiagnostics = exports.DiagnosticCollection = void 0;
    class DiagnosticCollection {
        constructor(_name, _owner, _maxDiagnosticsPerFile, extUri, proxy, onDidChangeDiagnostics) {
            this._name = _name;
            this._owner = _owner;
            this._maxDiagnosticsPerFile = _maxDiagnosticsPerFile;
            _DiagnosticCollection_proxy.set(this, void 0);
            _DiagnosticCollection_onDidChangeDiagnostics.set(this, void 0);
            _DiagnosticCollection_data.set(this, void 0);
            this._isDisposed = false;
            __classPrivateFieldSet(this, _DiagnosticCollection_data, new map_1.ResourceMap(uri => extUri.getComparisonKey(uri)), "f");
            __classPrivateFieldSet(this, _DiagnosticCollection_proxy, proxy, "f");
            __classPrivateFieldSet(this, _DiagnosticCollection_onDidChangeDiagnostics, onDidChangeDiagnostics, "f");
        }
        dispose() {
            if (!this._isDisposed) {
                __classPrivateFieldGet(this, _DiagnosticCollection_onDidChangeDiagnostics, "f").fire([...__classPrivateFieldGet(this, _DiagnosticCollection_data, "f").keys()]);
                if (__classPrivateFieldGet(this, _DiagnosticCollection_proxy, "f")) {
                    __classPrivateFieldGet(this, _DiagnosticCollection_proxy, "f").$clear(this._owner);
                }
                __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").clear();
                this._isDisposed = true;
            }
        }
        get name() {
            this._checkDisposed();
            return this._name;
        }
        set(first, diagnostics) {
            if (!first) {
                // this set-call is a clear-call
                this.clear();
                return;
            }
            // the actual implementation for #set
            this._checkDisposed();
            let toSync = [];
            if (uri_1.URI.isUri(first)) {
                if (!diagnostics) {
                    // remove this entry
                    this.delete(first);
                    return;
                }
                // update single row
                __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").set(first, diagnostics.slice());
                toSync = [first];
            }
            else if (Array.isArray(first)) {
                // update many rows
                toSync = [];
                let lastUri;
                // ensure stable-sort
                first = [...first].sort(DiagnosticCollection._compareIndexedTuplesByUri);
                for (const tuple of first) {
                    const [uri, diagnostics] = tuple;
                    if (!lastUri || uri.toString() !== lastUri.toString()) {
                        if (lastUri && __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").get(lastUri).length === 0) {
                            __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").delete(lastUri);
                        }
                        lastUri = uri;
                        toSync.push(uri);
                        __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").set(uri, []);
                    }
                    if (!diagnostics) {
                        // [Uri, undefined] means clear this
                        const currentDiagnostics = __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").get(uri);
                        if (currentDiagnostics) {
                            currentDiagnostics.length = 0;
                        }
                    }
                    else {
                        const currentDiagnostics = __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").get(uri);
                        if (currentDiagnostics) {
                            currentDiagnostics.push(...diagnostics);
                        }
                    }
                }
            }
            // send event for extensions
            __classPrivateFieldGet(this, _DiagnosticCollection_onDidChangeDiagnostics, "f").fire(toSync);
            // compute change and send to main side
            if (!__classPrivateFieldGet(this, _DiagnosticCollection_proxy, "f")) {
                return;
            }
            const entries = [];
            for (let uri of toSync) {
                let marker = [];
                const diagnostics = __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").get(uri);
                if (diagnostics) {
                    // no more than N diagnostics per file
                    if (diagnostics.length > this._maxDiagnosticsPerFile) {
                        marker = [];
                        const order = [extHostTypes_1.DiagnosticSeverity.Error, extHostTypes_1.DiagnosticSeverity.Warning, extHostTypes_1.DiagnosticSeverity.Information, extHostTypes_1.DiagnosticSeverity.Hint];
                        orderLoop: for (let i = 0; i < 4; i++) {
                            for (let diagnostic of diagnostics) {
                                if (diagnostic.severity === order[i]) {
                                    const len = marker.push(converter.Diagnostic.from(diagnostic));
                                    if (len === this._maxDiagnosticsPerFile) {
                                        break orderLoop;
                                    }
                                }
                            }
                        }
                        // add 'signal' marker for showing omitted errors/warnings
                        marker.push({
                            severity: markers_1.MarkerSeverity.Info,
                            message: (0, nls_1.localize)({ key: 'limitHit', comment: ['amount of errors/warning skipped due to limits'] }, "Not showing {0} further errors and warnings.", diagnostics.length - this._maxDiagnosticsPerFile),
                            startLineNumber: marker[marker.length - 1].startLineNumber,
                            startColumn: marker[marker.length - 1].startColumn,
                            endLineNumber: marker[marker.length - 1].endLineNumber,
                            endColumn: marker[marker.length - 1].endColumn
                        });
                    }
                    else {
                        marker = diagnostics.map(diag => converter.Diagnostic.from(diag));
                    }
                }
                entries.push([uri, marker]);
            }
            __classPrivateFieldGet(this, _DiagnosticCollection_proxy, "f").$changeMany(this._owner, entries);
        }
        delete(uri) {
            this._checkDisposed();
            __classPrivateFieldGet(this, _DiagnosticCollection_onDidChangeDiagnostics, "f").fire([uri]);
            __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").delete(uri);
            if (__classPrivateFieldGet(this, _DiagnosticCollection_proxy, "f")) {
                __classPrivateFieldGet(this, _DiagnosticCollection_proxy, "f").$changeMany(this._owner, [[uri, undefined]]);
            }
        }
        clear() {
            this._checkDisposed();
            __classPrivateFieldGet(this, _DiagnosticCollection_onDidChangeDiagnostics, "f").fire([...__classPrivateFieldGet(this, _DiagnosticCollection_data, "f").keys()]);
            __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").clear();
            if (__classPrivateFieldGet(this, _DiagnosticCollection_proxy, "f")) {
                __classPrivateFieldGet(this, _DiagnosticCollection_proxy, "f").$clear(this._owner);
            }
        }
        forEach(callback, thisArg) {
            this._checkDisposed();
            for (let uri of __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").keys()) {
                callback.apply(thisArg, [uri, this.get(uri), this]);
            }
        }
        get(uri) {
            this._checkDisposed();
            const result = __classPrivateFieldGet(this, _DiagnosticCollection_data, "f").get(uri);
            if (Array.isArray(result)) {
                return Object.freeze(result.slice(0));
            }
            return [];
        }
        has(uri) {
            this._checkDisposed();
            return Array.isArray(__classPrivateFieldGet(this, _DiagnosticCollection_data, "f").get(uri));
        }
        _checkDisposed() {
            if (this._isDisposed) {
                throw new Error('illegal state - object is disposed');
            }
        }
        static _compareIndexedTuplesByUri(a, b) {
            if (a[0].toString() < b[0].toString()) {
                return -1;
            }
            else if (a[0].toString() > b[0].toString()) {
                return 1;
            }
            else {
                return 0;
            }
        }
    }
    exports.DiagnosticCollection = DiagnosticCollection;
    _DiagnosticCollection_proxy = new WeakMap(), _DiagnosticCollection_onDidChangeDiagnostics = new WeakMap(), _DiagnosticCollection_data = new WeakMap();
    let ExtHostDiagnostics = class ExtHostDiagnostics {
        constructor(mainContext, _logService, _fileSystemInfoService) {
            this._logService = _logService;
            this._fileSystemInfoService = _fileSystemInfoService;
            this._collections = new Map();
            this._onDidChangeDiagnostics = new event_1.DebounceEmitter({ merge: all => all.flat(), delay: 50 });
            this.onDidChangeDiagnostics = event_1.Event.map(this._onDidChangeDiagnostics.event, ExtHostDiagnostics._mapper);
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDiagnostics);
        }
        static _mapper(last) {
            const map = new map_1.ResourceMap();
            for (const uri of last) {
                map.set(uri, uri);
            }
            return { uris: Object.freeze(Array.from(map.values())) };
        }
        createDiagnosticCollection(extensionId, name) {
            const { _collections, _proxy, _onDidChangeDiagnostics, _logService, _fileSystemInfoService } = this;
            const loggingProxy = new class {
                $changeMany(owner, entries) {
                    _proxy.$changeMany(owner, entries);
                    _logService.trace('[DiagnosticCollection] change many (extension, owner, uris)', extensionId.value, owner, entries.length === 0 ? 'CLEARING' : entries);
                }
                $clear(owner) {
                    _proxy.$clear(owner);
                    _logService.trace('[DiagnosticCollection] remove all (extension, owner)', extensionId.value, owner);
                }
                dispose() {
                    _proxy.dispose();
                }
            };
            let owner;
            if (!name) {
                name = '_generated_diagnostic_collection_name_#' + ExtHostDiagnostics._idPool++;
                owner = name;
            }
            else if (!_collections.has(name)) {
                owner = name;
            }
            else {
                this._logService.warn(`DiagnosticCollection with name '${name}' does already exist.`);
                do {
                    owner = name + ExtHostDiagnostics._idPool++;
                } while (_collections.has(owner));
            }
            const result = new class extends DiagnosticCollection {
                constructor() {
                    super(name, owner, ExtHostDiagnostics._maxDiagnosticsPerFile, _fileSystemInfoService.extUri, loggingProxy, _onDidChangeDiagnostics);
                    _collections.set(owner, this);
                }
                dispose() {
                    super.dispose();
                    _collections.delete(owner);
                }
            };
            return result;
        }
        getDiagnostics(resource) {
            if (resource) {
                return this._getDiagnostics(resource);
            }
            else {
                const index = new Map();
                const res = [];
                for (const collection of this._collections.values()) {
                    collection.forEach((uri, diagnostics) => {
                        let idx = index.get(uri.toString());
                        if (typeof idx === 'undefined') {
                            idx = res.length;
                            index.set(uri.toString(), idx);
                            res.push([uri, []]);
                        }
                        res[idx][1] = res[idx][1].concat(...diagnostics);
                    });
                }
                return res;
            }
        }
        _getDiagnostics(resource) {
            let res = [];
            for (let collection of this._collections.values()) {
                if (collection.has(resource)) {
                    res = res.concat(collection.get(resource));
                }
            }
            return res;
        }
        $acceptMarkersChange(data) {
            if (!this._mirrorCollection) {
                const name = '_generated_mirror';
                const collection = new DiagnosticCollection(name, name, ExtHostDiagnostics._maxDiagnosticsPerFile, this._fileSystemInfoService.extUri, undefined, this._onDidChangeDiagnostics);
                this._collections.set(name, collection);
                this._mirrorCollection = collection;
            }
            for (const [uri, markers] of data) {
                this._mirrorCollection.set(uri_1.URI.revive(uri), markers.map(converter.Diagnostic.to));
            }
        }
    };
    ExtHostDiagnostics._idPool = 0;
    ExtHostDiagnostics._maxDiagnosticsPerFile = 1000;
    ExtHostDiagnostics = __decorate([
        __param(1, log_1.ILogService),
        __param(2, extHostFileSystemInfo_1.IExtHostFileSystemInfo)
    ], ExtHostDiagnostics);
    exports.ExtHostDiagnostics = ExtHostDiagnostics;
});
//# sourceMappingURL=extHostDiagnostics.js.map