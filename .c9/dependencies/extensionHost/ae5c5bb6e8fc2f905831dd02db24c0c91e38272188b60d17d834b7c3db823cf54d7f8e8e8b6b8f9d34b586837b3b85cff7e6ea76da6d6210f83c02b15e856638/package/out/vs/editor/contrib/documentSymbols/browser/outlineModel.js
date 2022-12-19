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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/iterator", "vs/base/common/map", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatureDebounce", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/editor/common/services/model", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures"], function (require, exports, arrays_1, cancellation_1, errors_1, iterator_1, map_1, strings_1, position_1, range_1, languageFeatureDebounce_1, instantiation_1, extensions_1, model_1, lifecycle_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineModelService = exports.IOutlineModelService = exports.OutlineModel = exports.OutlineGroup = exports.OutlineElement = exports.TreeElement = void 0;
    class TreeElement {
        remove() {
            if (this.parent) {
                this.parent.children.delete(this.id);
            }
        }
        static findId(candidate, container) {
            // complex id-computation which contains the origin/extension,
            // the parent path, and some dedupe logic when names collide
            let candidateId;
            if (typeof candidate === 'string') {
                candidateId = `${container.id}/${candidate}`;
            }
            else {
                candidateId = `${container.id}/${candidate.name}`;
                if (container.children.get(candidateId) !== undefined) {
                    candidateId = `${container.id}/${candidate.name}_${candidate.range.startLineNumber}_${candidate.range.startColumn}`;
                }
            }
            let id = candidateId;
            for (let i = 0; container.children.get(id) !== undefined; i++) {
                id = `${candidateId}_${i}`;
            }
            return id;
        }
        static getElementById(id, element) {
            if (!id) {
                return undefined;
            }
            let len = (0, strings_1.commonPrefixLength)(id, element.id);
            if (len === id.length) {
                return element;
            }
            if (len < element.id.length) {
                return undefined;
            }
            for (const [, child] of element.children) {
                let candidate = TreeElement.getElementById(id, child);
                if (candidate) {
                    return candidate;
                }
            }
            return undefined;
        }
        static size(element) {
            let res = 1;
            for (const [, child] of element.children) {
                res += TreeElement.size(child);
            }
            return res;
        }
        static empty(element) {
            return element.children.size === 0;
        }
    }
    exports.TreeElement = TreeElement;
    class OutlineElement extends TreeElement {
        constructor(id, parent, symbol) {
            super();
            this.id = id;
            this.parent = parent;
            this.symbol = symbol;
            this.children = new Map();
        }
    }
    exports.OutlineElement = OutlineElement;
    class OutlineGroup extends TreeElement {
        constructor(id, parent, label, order) {
            super();
            this.id = id;
            this.parent = parent;
            this.label = label;
            this.order = order;
            this.children = new Map();
        }
        getItemEnclosingPosition(position) {
            return position ? this._getItemEnclosingPosition(position, this.children) : undefined;
        }
        _getItemEnclosingPosition(position, children) {
            for (const [, item] of children) {
                if (!item.symbol.range || !range_1.Range.containsPosition(item.symbol.range, position)) {
                    continue;
                }
                return this._getItemEnclosingPosition(position, item.children) || item;
            }
            return undefined;
        }
        updateMarker(marker) {
            for (const [, child] of this.children) {
                this._updateMarker(marker, child);
            }
        }
        _updateMarker(markers, item) {
            item.marker = undefined;
            // find the proper start index to check for item/marker overlap.
            let idx = (0, arrays_1.binarySearch)(markers, item.symbol.range, range_1.Range.compareRangesUsingStarts);
            let start;
            if (idx < 0) {
                start = ~idx;
                if (start > 0 && range_1.Range.areIntersecting(markers[start - 1], item.symbol.range)) {
                    start -= 1;
                }
            }
            else {
                start = idx;
            }
            let myMarkers = [];
            let myTopSev;
            for (; start < markers.length && range_1.Range.areIntersecting(item.symbol.range, markers[start]); start++) {
                // remove markers intersecting with this outline element
                // and store them in a 'private' array.
                let marker = markers[start];
                myMarkers.push(marker);
                markers[start] = undefined;
                if (!myTopSev || marker.severity > myTopSev) {
                    myTopSev = marker.severity;
                }
            }
            // Recurse into children and let them match markers that have matched
            // this outline element. This might remove markers from this element and
            // therefore we remember that we have had markers. That allows us to render
            // the dot, saying 'this element has children with markers'
            for (const [, child] of item.children) {
                this._updateMarker(myMarkers, child);
            }
            if (myTopSev) {
                item.marker = {
                    count: myMarkers.length,
                    topSev: myTopSev
                };
            }
            (0, arrays_1.coalesceInPlace)(markers);
        }
    }
    exports.OutlineGroup = OutlineGroup;
    class OutlineModel extends TreeElement {
        constructor(uri) {
            super();
            this.uri = uri;
            this.id = 'root';
            this.parent = undefined;
            this._groups = new Map();
            this.children = new Map();
            this.id = 'root';
            this.parent = undefined;
        }
        static create(registry, textModel, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            const result = new OutlineModel(textModel.uri);
            const provider = registry.ordered(textModel);
            const promises = provider.map((provider, index) => {
                var _a;
                let id = TreeElement.findId(`provider_${index}`, result);
                let group = new OutlineGroup(id, result, (_a = provider.displayName) !== null && _a !== void 0 ? _a : 'Unknown Outline Provider', index);
                return Promise.resolve(provider.provideDocumentSymbols(textModel, cts.token)).then(result => {
                    for (const info of result || []) {
                        OutlineModel._makeOutlineElement(info, group);
                    }
                    return group;
                }, err => {
                    (0, errors_1.onUnexpectedExternalError)(err);
                    return group;
                }).then(group => {
                    if (!TreeElement.empty(group)) {
                        result._groups.set(id, group);
                    }
                    else {
                        group.remove();
                    }
                });
            });
            const listener = registry.onDidChange(() => {
                const newProvider = registry.ordered(textModel);
                if (!(0, arrays_1.equals)(newProvider, provider)) {
                    cts.cancel();
                }
            });
            return Promise.all(promises).then(() => {
                if (cts.token.isCancellationRequested && !token.isCancellationRequested) {
                    return OutlineModel.create(registry, textModel, token);
                }
                else {
                    return result._compact();
                }
            }).finally(() => {
                listener.dispose();
            });
        }
        static _makeOutlineElement(info, container) {
            let id = TreeElement.findId(info, container);
            let res = new OutlineElement(id, container, info);
            if (info.children) {
                for (const childInfo of info.children) {
                    OutlineModel._makeOutlineElement(childInfo, res);
                }
            }
            container.children.set(res.id, res);
        }
        static get(element) {
            while (element) {
                if (element instanceof OutlineModel) {
                    return element;
                }
                element = element.parent;
            }
            return undefined;
        }
        _compact() {
            let count = 0;
            for (const [key, group] of this._groups) {
                if (group.children.size === 0) { // empty
                    this._groups.delete(key);
                }
                else {
                    count += 1;
                }
            }
            if (count !== 1) {
                //
                this.children = this._groups;
            }
            else {
                // adopt all elements of the first group
                let group = iterator_1.Iterable.first(this._groups.values());
                for (let [, child] of group.children) {
                    child.parent = this;
                    this.children.set(child.id, child);
                }
            }
            return this;
        }
        merge(other) {
            if (this.uri.toString() !== other.uri.toString()) {
                return false;
            }
            if (this._groups.size !== other._groups.size) {
                return false;
            }
            this._groups = other._groups;
            this.children = other.children;
            return true;
        }
        getItemEnclosingPosition(position, context) {
            let preferredGroup;
            if (context) {
                let candidate = context.parent;
                while (candidate && !preferredGroup) {
                    if (candidate instanceof OutlineGroup) {
                        preferredGroup = candidate;
                    }
                    candidate = candidate.parent;
                }
            }
            let result = undefined;
            for (const [, group] of this._groups) {
                result = group.getItemEnclosingPosition(position);
                if (result && (!preferredGroup || preferredGroup === group)) {
                    break;
                }
            }
            return result;
        }
        getItemById(id) {
            return TreeElement.getElementById(id, this);
        }
        updateMarker(marker) {
            // sort markers by start range so that we can use
            // outline element starts for quicker look up
            marker.sort(range_1.Range.compareRangesUsingStarts);
            for (const [, group] of this._groups) {
                group.updateMarker(marker.slice(0));
            }
        }
        getTopLevelSymbols() {
            const roots = [];
            for (const child of this.children.values()) {
                if (child instanceof OutlineElement) {
                    roots.push(child.symbol);
                }
                else {
                    roots.push(...iterator_1.Iterable.map(child.children.values(), child => child.symbol));
                }
            }
            return roots.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
        }
        asListOfDocumentSymbols() {
            const roots = this.getTopLevelSymbols();
            const bucket = [];
            OutlineModel._flattenDocumentSymbols(bucket, roots, '');
            return bucket.sort((a, b) => position_1.Position.compare(range_1.Range.getStartPosition(a.range), range_1.Range.getStartPosition(b.range)) || position_1.Position.compare(range_1.Range.getEndPosition(b.range), range_1.Range.getEndPosition(a.range)));
        }
        static _flattenDocumentSymbols(bucket, entries, overrideContainerLabel) {
            for (const entry of entries) {
                bucket.push({
                    kind: entry.kind,
                    tags: entry.tags,
                    name: entry.name,
                    detail: entry.detail,
                    containerName: entry.containerName || overrideContainerLabel,
                    range: entry.range,
                    selectionRange: entry.selectionRange,
                    children: undefined, // we flatten it...
                });
                // Recurse over children
                if (entry.children) {
                    OutlineModel._flattenDocumentSymbols(bucket, entry.children, entry.name);
                }
            }
        }
    }
    exports.OutlineModel = OutlineModel;
    exports.IOutlineModelService = (0, instantiation_1.createDecorator)('IOutlineModelService');
    let OutlineModelService = class OutlineModelService {
        constructor(_languageFeaturesService, debounces, modelService) {
            this._languageFeaturesService = _languageFeaturesService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._cache = new map_1.LRUCache(10, 0.7);
            this._debounceInformation = debounces.for(_languageFeaturesService.documentSymbolProvider, 'DocumentSymbols', { min: 350 });
            // don't cache outline models longer than their text model
            this._disposables.add(modelService.onModelRemoved(textModel => {
                this._cache.delete(textModel.id);
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
        async getOrCreate(textModel, token) {
            const registry = this._languageFeaturesService.documentSymbolProvider;
            const provider = registry.ordered(textModel);
            let data = this._cache.get(textModel.id);
            if (!data || data.versionId !== textModel.getVersionId() || !(0, arrays_1.equals)(data.provider, provider)) {
                let source = new cancellation_1.CancellationTokenSource();
                data = {
                    versionId: textModel.getVersionId(),
                    provider,
                    promiseCnt: 0,
                    source,
                    promise: OutlineModel.create(registry, textModel, source.token),
                    model: undefined,
                };
                this._cache.set(textModel.id, data);
                const now = Date.now();
                data.promise.then(outlineModel => {
                    data.model = outlineModel;
                    this._debounceInformation.update(textModel, Date.now() - now);
                }).catch(_err => {
                    this._cache.delete(textModel.id);
                });
            }
            if (data.model) {
                // resolved -> return data
                return data.model;
            }
            // increase usage counter
            data.promiseCnt += 1;
            const listener = token.onCancellationRequested(() => {
                // last -> cancel provider request, remove cached promise
                if (--data.promiseCnt === 0) {
                    data.source.cancel();
                    this._cache.delete(textModel.id);
                }
            });
            try {
                return await data.promise;
            }
            finally {
                listener.dispose();
            }
        }
        getDebounceValue(textModel) {
            return this._debounceInformation.get(textModel);
        }
    };
    OutlineModelService = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(2, model_1.IModelService)
    ], OutlineModelService);
    exports.OutlineModelService = OutlineModelService;
    (0, extensions_1.registerSingleton)(exports.IOutlineModelService, OutlineModelService, true);
});
//# sourceMappingURL=outlineModel.js.map