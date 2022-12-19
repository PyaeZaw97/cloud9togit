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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/outline/browser/outline", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/contrib/codeEditor/browser/outline/documentSymbolsTree", "vs/editor/browser/editorBrowser", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/base/common/cancellation", "vs/base/common/async", "vs/base/common/errors", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/editor/common/core/range", "vs/editor/browser/services/codeEditorService", "vs/platform/configuration/common/configuration", "vs/nls", "vs/editor/common/services/markerDecorations", "vs/platform/markers/common/markers", "vs/base/common/resources", "vs/editor/common/services/languageFeatures"], function (require, exports, event_1, lifecycle_1, outline_1, contributions_1, platform_1, documentSymbolsTree_1, editorBrowser_1, outlineModel_1, cancellation_1, async_1, errors_1, textResourceConfiguration_1, instantiation_1, range_1, codeEditorService_1, configuration_1, nls_1, markerDecorations_1, markers_1, resources_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DocumentSymbolBreadcrumbsSource = class DocumentSymbolBreadcrumbsSource {
        constructor(_editor, _textResourceConfigurationService) {
            this._editor = _editor;
            this._textResourceConfigurationService = _textResourceConfigurationService;
            this._breadcrumbs = [];
        }
        getBreadcrumbElements() {
            return this._breadcrumbs;
        }
        clear() {
            this._breadcrumbs = [];
        }
        update(model, position) {
            const newElements = this._computeBreadcrumbs(model, position);
            this._breadcrumbs = newElements;
        }
        _computeBreadcrumbs(model, position) {
            let item = model.getItemEnclosingPosition(position);
            if (!item) {
                return [];
            }
            let chain = [];
            while (item) {
                chain.push(item);
                let parent = item.parent;
                if (parent instanceof outlineModel_1.OutlineModel) {
                    break;
                }
                if (parent instanceof outlineModel_1.OutlineGroup && parent.parent && parent.parent.children.size === 1) {
                    break;
                }
                item = parent;
            }
            let result = [];
            for (let i = chain.length - 1; i >= 0; i--) {
                let element = chain[i];
                if (this._isFiltered(element)) {
                    break;
                }
                result.push(element);
            }
            if (result.length === 0) {
                return [];
            }
            return result;
        }
        _isFiltered(element) {
            if (!(element instanceof outlineModel_1.OutlineElement)) {
                return false;
            }
            const key = `breadcrumbs.${documentSymbolsTree_1.DocumentSymbolFilter.kindToConfigName[element.symbol.kind]}`;
            let uri;
            if (this._editor && this._editor.getModel()) {
                const model = this._editor.getModel();
                uri = model.uri;
            }
            return !this._textResourceConfigurationService.getValue(uri, key);
        }
    };
    DocumentSymbolBreadcrumbsSource = __decorate([
        __param(1, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], DocumentSymbolBreadcrumbsSource);
    let DocumentSymbolsOutline = class DocumentSymbolsOutline {
        constructor(_editor, target, firstLoadBarrier, _languageFeaturesService, _codeEditorService, _outlineModelService, _configurationService, _markerDecorationsService, textResourceConfigurationService, instantiationService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._codeEditorService = _codeEditorService;
            this._outlineModelService = _outlineModelService;
            this._configurationService = _configurationService;
            this._markerDecorationsService = _markerDecorationsService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._outlineDisposables = new lifecycle_1.DisposableStore();
            this.outlineKind = 'documentSymbols';
            this._breadcrumbsDataSource = new DocumentSymbolBreadcrumbsSource(_editor, textResourceConfigurationService);
            const delegate = new documentSymbolsTree_1.DocumentSymbolVirtualDelegate();
            const renderers = [new documentSymbolsTree_1.DocumentSymbolGroupRenderer(), instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolRenderer, true)];
            const treeDataSource = {
                getChildren: (parent) => {
                    if (parent instanceof outlineModel_1.OutlineElement || parent instanceof outlineModel_1.OutlineGroup) {
                        return parent.children.values();
                    }
                    if (parent === this && this._outlineModel) {
                        return this._outlineModel.children.values();
                    }
                    return [];
                }
            };
            const comparator = new documentSymbolsTree_1.DocumentSymbolComparator();
            const options = {
                collapseByDefault: target === 2 /* OutlineTarget.Breadcrumbs */,
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                identityProvider: new documentSymbolsTree_1.DocumentSymbolIdentityProvider(),
                keyboardNavigationLabelProvider: new documentSymbolsTree_1.DocumentSymbolNavigationLabelProvider(),
                accessibilityProvider: new documentSymbolsTree_1.DocumentSymbolAccessibilityProvider((0, nls_1.localize)('document', "Document Symbols")),
                filter: target === 1 /* OutlineTarget.OutlinePane */
                    ? instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolFilter, 'outline')
                    : target === 2 /* OutlineTarget.Breadcrumbs */
                        ? instantiationService.createInstance(documentSymbolsTree_1.DocumentSymbolFilter, 'breadcrumbs')
                        : undefined
            };
            this.config = {
                breadcrumbsDataSource: this._breadcrumbsDataSource,
                delegate,
                renderers,
                treeDataSource,
                comparator,
                options,
                quickPickDataSource: { getQuickPickElements: () => { throw new Error('not implemented'); } }
            };
            // update as language, model, providers changes
            this._disposables.add(_languageFeaturesService.documentSymbolProvider.onDidChange(_ => this._createOutline()));
            this._disposables.add(this._editor.onDidChangeModel(_ => this._createOutline()));
            this._disposables.add(this._editor.onDidChangeModelLanguage(_ => this._createOutline()));
            // update soon'ish as model content change
            const updateSoon = new async_1.TimeoutTimer();
            this._disposables.add(updateSoon);
            this._disposables.add(this._editor.onDidChangeModelContent(event => {
                const model = this._editor.getModel();
                if (model) {
                    const timeout = _outlineModelService.getDebounceValue(model);
                    updateSoon.cancelAndSet(() => this._createOutline(event), timeout);
                }
            }));
            // stop when editor dies
            this._disposables.add(this._editor.onDidDispose(() => this._outlineDisposables.clear()));
            // initial load
            this._createOutline().finally(() => firstLoadBarrier.open());
        }
        get activeElement() {
            const posistion = this._editor.getPosition();
            if (!posistion || !this._outlineModel) {
                return undefined;
            }
            else {
                return this._outlineModel.getItemEnclosingPosition(posistion);
            }
        }
        dispose() {
            this._disposables.dispose();
            this._outlineDisposables.dispose();
        }
        get isEmpty() {
            return !this._outlineModel || outlineModel_1.TreeElement.empty(this._outlineModel);
        }
        get uri() {
            var _a;
            return (_a = this._outlineModel) === null || _a === void 0 ? void 0 : _a.uri;
        }
        async reveal(entry, options, sideBySide) {
            const model = outlineModel_1.OutlineModel.get(entry);
            if (!model || !(entry instanceof outlineModel_1.OutlineElement)) {
                return;
            }
            await this._codeEditorService.openCodeEditor({
                resource: model.uri,
                options: Object.assign(Object.assign({}, options), { selection: range_1.Range.collapseToStart(entry.symbol.selectionRange), selectionRevealType: 3 /* TextEditorSelectionRevealType.NearTopIfOutsideViewport */ })
            }, this._editor, sideBySide);
        }
        preview(entry) {
            if (!(entry instanceof outlineModel_1.OutlineElement)) {
                return lifecycle_1.Disposable.None;
            }
            const { symbol } = entry;
            this._editor.revealRangeInCenterIfOutsideViewport(symbol.range, 0 /* ScrollType.Smooth */);
            const ids = this._editor.deltaDecorations([], [{
                    range: symbol.range,
                    options: {
                        description: 'document-symbols-outline-range-highlight',
                        className: 'rangeHighlight',
                        isWholeLine: true
                    }
                }]);
            return (0, lifecycle_1.toDisposable)(() => this._editor.deltaDecorations(ids, []));
        }
        captureViewState() {
            const viewState = this._editor.saveViewState();
            return (0, lifecycle_1.toDisposable)(() => {
                if (viewState) {
                    this._editor.restoreViewState(viewState);
                }
            });
        }
        async _createOutline(contentChangeEvent) {
            this._outlineDisposables.clear();
            if (!contentChangeEvent) {
                this._setOutlineModel(undefined);
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const buffer = this._editor.getModel();
            if (!this._languageFeaturesService.documentSymbolProvider.has(buffer)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const versionIdThen = buffer.getVersionId();
            const timeoutTimer = new async_1.TimeoutTimer();
            this._outlineDisposables.add(timeoutTimer);
            this._outlineDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            try {
                let model = await this._outlineModelService.getOrCreate(buffer, cts.token);
                if (cts.token.isCancellationRequested) {
                    // cancelled -> do nothing
                    return;
                }
                if (outlineModel_1.TreeElement.empty(model) || !this._editor.hasModel()) {
                    // empty -> no outline elements
                    this._setOutlineModel(model);
                    return;
                }
                // heuristic: when the symbols-to-lines ratio changes by 50% between edits
                // wait a little (and hope that the next change isn't as drastic).
                if (contentChangeEvent && this._outlineModel && buffer.getLineCount() >= 25) {
                    const newSize = outlineModel_1.TreeElement.size(model);
                    const newLength = buffer.getValueLength();
                    const newRatio = newSize / newLength;
                    const oldSize = outlineModel_1.TreeElement.size(this._outlineModel);
                    const oldLength = newLength - contentChangeEvent.changes.reduce((prev, value) => prev + value.rangeLength, 0);
                    const oldRatio = oldSize / oldLength;
                    if (newRatio <= oldRatio * 0.5 || newRatio >= oldRatio * 1.5) {
                        // wait for a better state and ignore current model when more
                        // typing has happened
                        const value = await (0, async_1.raceCancellation)((0, async_1.timeout)(2000).then(() => true), cts.token, false);
                        if (!value) {
                            return;
                        }
                    }
                }
                // feature: show markers with outline element
                this._applyMarkersToOutline(model);
                this._outlineDisposables.add(this._markerDecorationsService.onDidChangeMarker(textModel => {
                    if ((0, resources_1.isEqual)(model.uri, textModel.uri)) {
                        this._applyMarkersToOutline(model);
                        this._onDidChange.fire({});
                    }
                }));
                this._outlineDisposables.add(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */)) {
                        if (this._configurationService.getValue("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */)) {
                            this._applyMarkersToOutline(model);
                        }
                        else {
                            model.updateMarker([]);
                        }
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('outline')) {
                        // outline filtering, problems on/off
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('breadcrumbs') && this._editor.hasModel()) {
                        // breadcrumbs filtering
                        this._breadcrumbsDataSource.update(model, this._editor.getPosition());
                        this._onDidChange.fire({});
                    }
                }));
                // feature: toggle icons
                this._outlineDisposables.add(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration("outline.icons" /* OutlineConfigKeys.icons */)) {
                        this._onDidChange.fire({});
                    }
                    if (e.affectsConfiguration('outline')) {
                        this._onDidChange.fire({});
                    }
                }));
                // feature: update active when cursor changes
                this._outlineDisposables.add(this._editor.onDidChangeCursorPosition(_ => {
                    timeoutTimer.cancelAndSet(() => {
                        if (!buffer.isDisposed() && versionIdThen === buffer.getVersionId() && this._editor.hasModel()) {
                            this._breadcrumbsDataSource.update(model, this._editor.getPosition());
                            this._onDidChange.fire({ affectOnlyActiveElement: true });
                        }
                    }, 150);
                }));
                // update properties, send event
                this._setOutlineModel(model);
            }
            catch (err) {
                this._setOutlineModel(undefined);
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        _applyMarkersToOutline(model) {
            if (!model || !this._configurationService.getValue("outline.problems.enabled" /* OutlineConfigKeys.problemsEnabled */)) {
                return;
            }
            const markers = [];
            for (const [range, marker] of this._markerDecorationsService.getLiveMarkers(model.uri)) {
                if (marker.severity === markers_1.MarkerSeverity.Error || marker.severity === markers_1.MarkerSeverity.Warning) {
                    markers.push(Object.assign(Object.assign({}, range), { severity: marker.severity }));
                }
            }
            model.updateMarker(markers);
        }
        _setOutlineModel(model) {
            var _a;
            const position = this._editor.getPosition();
            if (!position || !model) {
                this._outlineModel = undefined;
                this._breadcrumbsDataSource.clear();
            }
            else {
                if (!((_a = this._outlineModel) === null || _a === void 0 ? void 0 : _a.merge(model))) {
                    this._outlineModel = model;
                }
                this._breadcrumbsDataSource.update(model, position);
            }
            this._onDidChange.fire({});
        }
    };
    DocumentSymbolsOutline = __decorate([
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, outlineModel_1.IOutlineModelService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, markerDecorations_1.IMarkerDecorationsService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, instantiation_1.IInstantiationService)
    ], DocumentSymbolsOutline);
    let DocumentSymbolsOutlineCreator = class DocumentSymbolsOutlineCreator {
        constructor(outlineService, _instantiationService) {
            this._instantiationService = _instantiationService;
            const reg = outlineService.registerOutlineCreator(this);
            this.dispose = () => reg.dispose();
        }
        matches(candidate) {
            const ctrl = candidate.getControl();
            return (0, editorBrowser_1.isCodeEditor)(ctrl) || (0, editorBrowser_1.isDiffEditor)(ctrl);
        }
        async createOutline(pane, target, _token) {
            const control = pane.getControl();
            let editor;
            if ((0, editorBrowser_1.isCodeEditor)(control)) {
                editor = control;
            }
            else if ((0, editorBrowser_1.isDiffEditor)(control)) {
                editor = control.getModifiedEditor();
            }
            if (!editor) {
                return undefined;
            }
            const firstLoadBarrier = new async_1.Barrier();
            const result = this._instantiationService.createInstance(DocumentSymbolsOutline, editor, target, firstLoadBarrier);
            await firstLoadBarrier.wait();
            return result;
        }
    };
    DocumentSymbolsOutlineCreator = __decorate([
        __param(0, outline_1.IOutlineService),
        __param(1, instantiation_1.IInstantiationService)
    ], DocumentSymbolsOutlineCreator);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DocumentSymbolsOutlineCreator, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=documentSymbolsOutline.js.map