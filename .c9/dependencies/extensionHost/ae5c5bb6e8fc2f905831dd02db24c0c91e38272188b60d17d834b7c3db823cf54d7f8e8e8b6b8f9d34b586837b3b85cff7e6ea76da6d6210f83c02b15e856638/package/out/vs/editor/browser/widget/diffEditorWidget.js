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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/ui/sash/sash", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/browser/widget/diffReview", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/core/stringBuilder", "vs/editor/common/editorCommon", "vs/editor/common/model/textModel", "vs/editor/common/services/editorWorker", "vs/editor/common/viewModel/overviewZoneManager", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/common/viewModel", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/notification/common/notification", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/editor/browser/widget/inlineDiffMargin", "vs/platform/clipboard/common/clipboardService", "vs/editor/browser/editorExtensions", "vs/base/common/errors", "vs/platform/progress/common/progress", "vs/editor/browser/config/elementSizeObserver", "vs/base/common/codicons", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/theme", "vs/css!./media/diffEditor"], function (require, exports, nls, dom, fastDomNode_1, sash_1, async_1, event_1, lifecycle_1, domFontInfo_1, stableEditorScroll_1, codeEditorService_1, codeEditorWidget_1, diffReview_1, editorOptions_1, range_1, stringBuilder_1, editorCommon, textModel_1, editorWorker_1, overviewZoneManager_1, lineDecorations_1, viewLineRenderer_1, viewModel_1, contextkey_1, instantiation_1, serviceCollection_1, notification_1, colorRegistry_1, themeService_1, contextView_1, inlineDiffMargin_1, clipboardService_1, editorExtensions_1, errors_1, progress_1, elementSizeObserver_1, codicons_1, mouseCursor_1, iconRegistry_1, theme_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorWidget = void 0;
    class VisualEditorState {
        constructor(_contextMenuService, _clipboardService) {
            this._contextMenuService = _contextMenuService;
            this._clipboardService = _clipboardService;
            this._zones = [];
            this._inlineDiffMargins = [];
            this._zonesMap = {};
            this._decorations = [];
        }
        getForeignViewZones(allViewZones) {
            return allViewZones.filter((z) => !this._zonesMap[String(z.id)]);
        }
        clean(editor) {
            // (1) View zones
            if (this._zones.length > 0) {
                editor.changeViewZones((viewChangeAccessor) => {
                    for (const zoneId of this._zones) {
                        viewChangeAccessor.removeZone(zoneId);
                    }
                });
            }
            this._zones = [];
            this._zonesMap = {};
            // (2) Model decorations
            this._decorations = editor.deltaDecorations(this._decorations, []);
        }
        apply(editor, overviewRuler, newDecorations, restoreScrollState) {
            const scrollState = restoreScrollState ? stableEditorScroll_1.StableEditorScrollState.capture(editor) : null;
            // view zones
            editor.changeViewZones((viewChangeAccessor) => {
                var _a;
                for (const zoneId of this._zones) {
                    viewChangeAccessor.removeZone(zoneId);
                }
                for (const inlineDiffMargin of this._inlineDiffMargins) {
                    inlineDiffMargin.dispose();
                }
                this._zones = [];
                this._zonesMap = {};
                this._inlineDiffMargins = [];
                for (let i = 0, length = newDecorations.zones.length; i < length; i++) {
                    const viewZone = newDecorations.zones[i];
                    viewZone.suppressMouseDown = true;
                    const zoneId = viewChangeAccessor.addZone(viewZone);
                    this._zones.push(zoneId);
                    this._zonesMap[String(zoneId)] = true;
                    if (newDecorations.zones[i].diff && viewZone.marginDomNode) {
                        viewZone.suppressMouseDown = false;
                        if (((_a = newDecorations.zones[i].diff) === null || _a === void 0 ? void 0 : _a.originalModel.getValueLength()) !== 0) {
                            // do not contribute diff margin actions for newly created files
                            this._inlineDiffMargins.push(new inlineDiffMargin_1.InlineDiffMargin(zoneId, viewZone.marginDomNode, editor, newDecorations.zones[i].diff, this._contextMenuService, this._clipboardService));
                        }
                    }
                }
            });
            if (scrollState) {
                scrollState.restore(editor);
            }
            // decorations
            this._decorations = editor.deltaDecorations(this._decorations, newDecorations.decorations);
            // overview ruler
            if (overviewRuler) {
                overviewRuler.setZones(newDecorations.overviewZones);
            }
        }
    }
    let DIFF_EDITOR_ID = 0;
    const diffInsertIcon = (0, iconRegistry_1.registerIcon)('diff-insert', codicons_1.Codicon.add, nls.localize('diffInsertIcon', 'Line decoration for inserts in the diff editor.'));
    const diffRemoveIcon = (0, iconRegistry_1.registerIcon)('diff-remove', codicons_1.Codicon.remove, nls.localize('diffRemoveIcon', 'Line decoration for removals in the diff editor.'));
    const ttPolicy = (_a = window.trustedTypes) === null || _a === void 0 ? void 0 : _a.createPolicy('diffEditorWidget', { createHTML: value => value });
    let DiffEditorWidget = class DiffEditorWidget extends lifecycle_1.Disposable {
        constructor(domElement, options, codeEditorWidgetOptions, clipboardService, editorWorkerService, contextKeyService, instantiationService, codeEditorService, themeService, notificationService, contextMenuService, _editorProgressService) {
            super();
            this._editorProgressService = _editorProgressService;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._onDidUpdateDiff = this._register(new event_1.Emitter());
            this.onDidUpdateDiff = this._onDidUpdateDiff.event;
            this._onDidContentSizeChange = this._register(new event_1.Emitter());
            this.onDidContentSizeChange = this._onDidContentSizeChange.event;
            this._lastOriginalWarning = null;
            this._lastModifiedWarning = null;
            this._editorWorkerService = editorWorkerService;
            this._codeEditorService = codeEditorService;
            this._contextKeyService = this._register(contextKeyService.createScoped(domElement));
            this._instantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this._contextKeyService]));
            this._contextKeyService.createKey('isInDiffEditor', true);
            this._themeService = themeService;
            this._notificationService = notificationService;
            this._id = (++DIFF_EDITOR_ID);
            this._state = 0 /* editorBrowser.DiffEditorState.Idle */;
            this._updatingDiffProgress = null;
            this._domElement = domElement;
            options = options || {};
            this._options = validateDiffEditorOptions(options, {
                enableSplitViewResizing: true,
                renderSideBySide: true,
                maxComputationTime: 5000,
                maxFileSize: 50,
                ignoreTrimWhitespace: true,
                renderIndicators: true,
                originalEditable: false,
                diffCodeLens: false,
                renderOverviewRuler: true,
                diffWordWrap: 'inherit'
            });
            if (typeof options.isInEmbeddedEditor !== 'undefined') {
                this._contextKeyService.createKey('isInEmbeddedDiffEditor', options.isInEmbeddedEditor);
            }
            else {
                this._contextKeyService.createKey('isInEmbeddedDiffEditor', false);
            }
            this._updateDecorationsRunner = this._register(new async_1.RunOnceScheduler(() => this._updateDecorations(), 0));
            this._containerDomElement = document.createElement('div');
            this._containerDomElement.className = DiffEditorWidget._getClassName(this._themeService.getColorTheme(), this._options.renderSideBySide);
            this._containerDomElement.style.position = 'relative';
            this._containerDomElement.style.height = '100%';
            this._domElement.appendChild(this._containerDomElement);
            this._overviewViewportDomElement = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._overviewViewportDomElement.setClassName('diffViewport');
            this._overviewViewportDomElement.setPosition('absolute');
            this._overviewDomElement = document.createElement('div');
            this._overviewDomElement.className = 'diffOverview';
            this._overviewDomElement.style.position = 'absolute';
            this._overviewDomElement.appendChild(this._overviewViewportDomElement.domNode);
            this._register(dom.addStandardDisposableListener(this._overviewDomElement, dom.EventType.POINTER_DOWN, (e) => {
                this._modifiedEditor.delegateVerticalScrollbarPointerDown(e);
            }));
            if (this._options.renderOverviewRuler) {
                this._containerDomElement.appendChild(this._overviewDomElement);
            }
            // Create left side
            this._originalDomNode = document.createElement('div');
            this._originalDomNode.className = 'editor original';
            this._originalDomNode.style.position = 'absolute';
            this._originalDomNode.style.height = '100%';
            this._containerDomElement.appendChild(this._originalDomNode);
            // Create right side
            this._modifiedDomNode = document.createElement('div');
            this._modifiedDomNode.className = 'editor modified';
            this._modifiedDomNode.style.position = 'absolute';
            this._modifiedDomNode.style.height = '100%';
            this._containerDomElement.appendChild(this._modifiedDomNode);
            this._beginUpdateDecorationsTimeout = -1;
            this._currentlyChangingViewZones = false;
            this._diffComputationToken = 0;
            this._originalEditorState = new VisualEditorState(contextMenuService, clipboardService);
            this._modifiedEditorState = new VisualEditorState(contextMenuService, clipboardService);
            this._isVisible = true;
            this._isHandlingScrollEvent = false;
            this._elementSizeObserver = this._register(new elementSizeObserver_1.ElementSizeObserver(this._containerDomElement, options.dimension));
            this._register(this._elementSizeObserver.onDidChange(() => this._onDidContainerSizeChanged()));
            if (options.automaticLayout) {
                this._elementSizeObserver.startObserving();
            }
            this._diffComputationResult = null;
            this._originalEditor = this._createLeftHandSideEditor(options, codeEditorWidgetOptions.originalEditor || {});
            this._modifiedEditor = this._createRightHandSideEditor(options, codeEditorWidgetOptions.modifiedEditor || {});
            this._originalOverviewRuler = null;
            this._modifiedOverviewRuler = null;
            this._reviewPane = instantiationService.createInstance(diffReview_1.DiffReview, this);
            this._containerDomElement.appendChild(this._reviewPane.domNode.domNode);
            this._containerDomElement.appendChild(this._reviewPane.shadow.domNode);
            this._containerDomElement.appendChild(this._reviewPane.actionBarContainer.domNode);
            if (this._options.renderSideBySide) {
                this._setStrategy(new DiffEditorWidgetSideBySide(this._createDataSource(), this._options.enableSplitViewResizing));
            }
            else {
                this._setStrategy(new DiffEditorWidgetInline(this._createDataSource(), this._options.enableSplitViewResizing));
            }
            this._register(themeService.onDidColorThemeChange(t => {
                if (this._strategy && this._strategy.applyColors(t)) {
                    this._updateDecorationsRunner.schedule();
                }
                this._containerDomElement.className = DiffEditorWidget._getClassName(this._themeService.getColorTheme(), this._options.renderSideBySide);
            }));
            const contributions = editorExtensions_1.EditorExtensionsRegistry.getDiffEditorContributions();
            for (const desc of contributions) {
                try {
                    this._register(instantiationService.createInstance(desc.ctor, this));
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
            }
            this._codeEditorService.addDiffEditor(this);
        }
        get ignoreTrimWhitespace() {
            return this._options.ignoreTrimWhitespace;
        }
        get maxComputationTime() {
            return this._options.maxComputationTime;
        }
        get renderSideBySide() {
            return this._options.renderSideBySide;
        }
        getContentHeight() {
            return this._modifiedEditor.getContentHeight();
        }
        getViewWidth() {
            return this._elementSizeObserver.getWidth();
        }
        _setState(newState) {
            if (this._state === newState) {
                return;
            }
            this._state = newState;
            if (this._updatingDiffProgress) {
                this._updatingDiffProgress.done();
                this._updatingDiffProgress = null;
            }
            if (this._state === 1 /* editorBrowser.DiffEditorState.ComputingDiff */) {
                this._updatingDiffProgress = this._editorProgressService.show(true, 1000);
            }
        }
        hasWidgetFocus() {
            return dom.isAncestor(document.activeElement, this._domElement);
        }
        diffReviewNext() {
            this._reviewPane.next();
        }
        diffReviewPrev() {
            this._reviewPane.prev();
        }
        static _getClassName(theme, renderSideBySide) {
            let result = 'monaco-diff-editor monaco-editor-background ';
            if (renderSideBySide) {
                result += 'side-by-side ';
            }
            result += (0, themeService_1.getThemeTypeSelector)(theme.type);
            return result;
        }
        _recreateOverviewRulers() {
            if (!this._options.renderOverviewRuler) {
                return;
            }
            if (this._originalOverviewRuler) {
                this._overviewDomElement.removeChild(this._originalOverviewRuler.getDomNode());
                this._originalOverviewRuler.dispose();
            }
            if (this._originalEditor.hasModel()) {
                this._originalOverviewRuler = this._originalEditor.createOverviewRuler('original diffOverviewRuler');
                this._overviewDomElement.appendChild(this._originalOverviewRuler.getDomNode());
            }
            if (this._modifiedOverviewRuler) {
                this._overviewDomElement.removeChild(this._modifiedOverviewRuler.getDomNode());
                this._modifiedOverviewRuler.dispose();
            }
            if (this._modifiedEditor.hasModel()) {
                this._modifiedOverviewRuler = this._modifiedEditor.createOverviewRuler('modified diffOverviewRuler');
                this._overviewDomElement.appendChild(this._modifiedOverviewRuler.getDomNode());
            }
            this._layoutOverviewRulers();
        }
        _createLeftHandSideEditor(options, codeEditorWidgetOptions) {
            const editor = this._createInnerEditor(this._instantiationService, this._originalDomNode, this._adjustOptionsForLeftHandSide(options), codeEditorWidgetOptions);
            this._register(editor.onDidScrollChange((e) => {
                if (this._isHandlingScrollEvent) {
                    return;
                }
                if (!e.scrollTopChanged && !e.scrollLeftChanged && !e.scrollHeightChanged) {
                    return;
                }
                this._isHandlingScrollEvent = true;
                this._modifiedEditor.setScrollPosition({
                    scrollLeft: e.scrollLeft,
                    scrollTop: e.scrollTop
                });
                this._isHandlingScrollEvent = false;
                this._layoutOverviewViewport();
            }));
            this._register(editor.onDidChangeViewZones(() => {
                this._onViewZonesChanged();
            }));
            this._register(editor.onDidChangeConfiguration((e) => {
                if (!editor.getModel()) {
                    return;
                }
                if (e.hasChanged(44 /* EditorOption.fontInfo */)) {
                    this._updateDecorationsRunner.schedule();
                }
                if (e.hasChanged(132 /* EditorOption.wrappingInfo */)) {
                    this._updateDecorationsRunner.cancel();
                    this._updateDecorations();
                }
            }));
            this._register(editor.onDidChangeHiddenAreas(() => {
                this._updateDecorationsRunner.cancel();
                this._updateDecorations();
            }));
            this._register(editor.onDidChangeModelContent(() => {
                if (this._isVisible) {
                    this._beginUpdateDecorationsSoon();
                }
            }));
            const isInDiffLeftEditorKey = this._contextKeyService.createKey('isInDiffLeftEditor', editor.hasWidgetFocus());
            this._register(editor.onDidFocusEditorWidget(() => isInDiffLeftEditorKey.set(true)));
            this._register(editor.onDidBlurEditorWidget(() => isInDiffLeftEditorKey.set(false)));
            this._register(editor.onDidContentSizeChange(e => {
                const width = this._originalEditor.getContentWidth() + this._modifiedEditor.getContentWidth() + DiffEditorWidget.ONE_OVERVIEW_WIDTH;
                const height = Math.max(this._modifiedEditor.getContentHeight(), this._originalEditor.getContentHeight());
                this._onDidContentSizeChange.fire({
                    contentHeight: height,
                    contentWidth: width,
                    contentHeightChanged: e.contentHeightChanged,
                    contentWidthChanged: e.contentWidthChanged
                });
            }));
            return editor;
        }
        _createRightHandSideEditor(options, codeEditorWidgetOptions) {
            const editor = this._createInnerEditor(this._instantiationService, this._modifiedDomNode, this._adjustOptionsForRightHandSide(options), codeEditorWidgetOptions);
            this._register(editor.onDidScrollChange((e) => {
                if (this._isHandlingScrollEvent) {
                    return;
                }
                if (!e.scrollTopChanged && !e.scrollLeftChanged && !e.scrollHeightChanged) {
                    return;
                }
                this._isHandlingScrollEvent = true;
                this._originalEditor.setScrollPosition({
                    scrollLeft: e.scrollLeft,
                    scrollTop: e.scrollTop
                });
                this._isHandlingScrollEvent = false;
                this._layoutOverviewViewport();
            }));
            this._register(editor.onDidChangeViewZones(() => {
                this._onViewZonesChanged();
            }));
            this._register(editor.onDidChangeConfiguration((e) => {
                if (!editor.getModel()) {
                    return;
                }
                if (e.hasChanged(44 /* EditorOption.fontInfo */)) {
                    this._updateDecorationsRunner.schedule();
                }
                if (e.hasChanged(132 /* EditorOption.wrappingInfo */)) {
                    this._updateDecorationsRunner.cancel();
                    this._updateDecorations();
                }
            }));
            this._register(editor.onDidChangeHiddenAreas(() => {
                this._updateDecorationsRunner.cancel();
                this._updateDecorations();
            }));
            this._register(editor.onDidChangeModelContent(() => {
                if (this._isVisible) {
                    this._beginUpdateDecorationsSoon();
                }
            }));
            this._register(editor.onDidChangeModelOptions((e) => {
                if (e.tabSize) {
                    this._updateDecorationsRunner.schedule();
                }
            }));
            const isInDiffRightEditorKey = this._contextKeyService.createKey('isInDiffRightEditor', editor.hasWidgetFocus());
            this._register(editor.onDidFocusEditorWidget(() => isInDiffRightEditorKey.set(true)));
            this._register(editor.onDidBlurEditorWidget(() => isInDiffRightEditorKey.set(false)));
            this._register(editor.onDidContentSizeChange(e => {
                const width = this._originalEditor.getContentWidth() + this._modifiedEditor.getContentWidth() + DiffEditorWidget.ONE_OVERVIEW_WIDTH;
                const height = Math.max(this._modifiedEditor.getContentHeight(), this._originalEditor.getContentHeight());
                this._onDidContentSizeChange.fire({
                    contentHeight: height,
                    contentWidth: width,
                    contentHeightChanged: e.contentHeightChanged,
                    contentWidthChanged: e.contentWidthChanged
                });
            }));
            return editor;
        }
        _createInnerEditor(instantiationService, container, options, editorWidgetOptions) {
            return instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, container, Object.assign({ enableDropIntoEditor: true }, options), editorWidgetOptions);
        }
        dispose() {
            this._codeEditorService.removeDiffEditor(this);
            if (this._beginUpdateDecorationsTimeout !== -1) {
                window.clearTimeout(this._beginUpdateDecorationsTimeout);
                this._beginUpdateDecorationsTimeout = -1;
            }
            this._cleanViewZonesAndDecorations();
            if (this._originalOverviewRuler) {
                this._overviewDomElement.removeChild(this._originalOverviewRuler.getDomNode());
                this._originalOverviewRuler.dispose();
            }
            if (this._modifiedOverviewRuler) {
                this._overviewDomElement.removeChild(this._modifiedOverviewRuler.getDomNode());
                this._modifiedOverviewRuler.dispose();
            }
            this._overviewDomElement.removeChild(this._overviewViewportDomElement.domNode);
            if (this._options.renderOverviewRuler) {
                this._containerDomElement.removeChild(this._overviewDomElement);
            }
            this._containerDomElement.removeChild(this._originalDomNode);
            this._originalEditor.dispose();
            this._containerDomElement.removeChild(this._modifiedDomNode);
            this._modifiedEditor.dispose();
            this._strategy.dispose();
            this._containerDomElement.removeChild(this._reviewPane.domNode.domNode);
            this._containerDomElement.removeChild(this._reviewPane.shadow.domNode);
            this._containerDomElement.removeChild(this._reviewPane.actionBarContainer.domNode);
            this._reviewPane.dispose();
            this._domElement.removeChild(this._containerDomElement);
            this._onDidDispose.fire();
            super.dispose();
        }
        //------------ begin IDiffEditor methods
        getId() {
            return this.getEditorType() + ':' + this._id;
        }
        getEditorType() {
            return editorCommon.EditorType.IDiffEditor;
        }
        getLineChanges() {
            if (!this._diffComputationResult) {
                return null;
            }
            return this._diffComputationResult.changes;
        }
        getDiffComputationResult() {
            return this._diffComputationResult;
        }
        getOriginalEditor() {
            return this._originalEditor;
        }
        getModifiedEditor() {
            return this._modifiedEditor;
        }
        updateOptions(_newOptions) {
            const newOptions = validateDiffEditorOptions(_newOptions, this._options);
            const changed = changedDiffEditorOptions(this._options, newOptions);
            this._options = newOptions;
            const beginUpdateDecorations = (changed.ignoreTrimWhitespace || changed.renderIndicators);
            const beginUpdateDecorationsSoon = (this._isVisible && (changed.maxComputationTime || changed.maxFileSize));
            if (beginUpdateDecorations) {
                this._beginUpdateDecorations();
            }
            else if (beginUpdateDecorationsSoon) {
                this._beginUpdateDecorationsSoon();
            }
            this._modifiedEditor.updateOptions(this._adjustOptionsForRightHandSide(_newOptions));
            this._originalEditor.updateOptions(this._adjustOptionsForLeftHandSide(_newOptions));
            // enableSplitViewResizing
            this._strategy.setEnableSplitViewResizing(this._options.enableSplitViewResizing);
            // renderSideBySide
            if (changed.renderSideBySide) {
                if (this._options.renderSideBySide) {
                    this._setStrategy(new DiffEditorWidgetSideBySide(this._createDataSource(), this._options.enableSplitViewResizing));
                }
                else {
                    this._setStrategy(new DiffEditorWidgetInline(this._createDataSource(), this._options.enableSplitViewResizing));
                }
                // Update class name
                this._containerDomElement.className = DiffEditorWidget._getClassName(this._themeService.getColorTheme(), this._options.renderSideBySide);
            }
            // renderOverviewRuler
            if (changed.renderOverviewRuler) {
                if (this._options.renderOverviewRuler) {
                    this._containerDomElement.appendChild(this._overviewDomElement);
                }
                else {
                    this._containerDomElement.removeChild(this._overviewDomElement);
                }
            }
        }
        getModel() {
            return {
                original: this._originalEditor.getModel(),
                modified: this._modifiedEditor.getModel()
            };
        }
        setModel(model) {
            // Guard us against partial null model
            if (model && (!model.original || !model.modified)) {
                throw new Error(!model.original ? 'DiffEditorWidget.setModel: Original model is null' : 'DiffEditorWidget.setModel: Modified model is null');
            }
            // Remove all view zones & decorations
            this._cleanViewZonesAndDecorations();
            // Update code editor models
            this._originalEditor.setModel(model ? model.original : null);
            this._modifiedEditor.setModel(model ? model.modified : null);
            this._updateDecorationsRunner.cancel();
            // this.originalEditor.onDidChangeModelOptions
            if (model) {
                this._originalEditor.setScrollTop(0);
                this._modifiedEditor.setScrollTop(0);
            }
            // Disable any diff computations that will come in
            this._diffComputationResult = null;
            this._diffComputationToken++;
            this._setState(0 /* editorBrowser.DiffEditorState.Idle */);
            if (model) {
                this._recreateOverviewRulers();
                // Begin comparing
                this._beginUpdateDecorations();
            }
            this._layoutOverviewViewport();
        }
        getContainerDomNode() {
            return this._domElement;
        }
        getVisibleColumnFromPosition(position) {
            return this._modifiedEditor.getVisibleColumnFromPosition(position);
        }
        getStatusbarColumn(position) {
            return this._modifiedEditor.getStatusbarColumn(position);
        }
        getPosition() {
            return this._modifiedEditor.getPosition();
        }
        setPosition(position, source = 'api') {
            this._modifiedEditor.setPosition(position, source);
        }
        revealLine(lineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealLine(lineNumber, scrollType);
        }
        revealLineInCenter(lineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealLineInCenter(lineNumber, scrollType);
        }
        revealLineInCenterIfOutsideViewport(lineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealLineInCenterIfOutsideViewport(lineNumber, scrollType);
        }
        revealLineNearTop(lineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealLineNearTop(lineNumber, scrollType);
        }
        revealPosition(position, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealPosition(position, scrollType);
        }
        revealPositionInCenter(position, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealPositionInCenter(position, scrollType);
        }
        revealPositionInCenterIfOutsideViewport(position, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealPositionInCenterIfOutsideViewport(position, scrollType);
        }
        revealPositionNearTop(position, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealPositionNearTop(position, scrollType);
        }
        getSelection() {
            return this._modifiedEditor.getSelection();
        }
        getSelections() {
            return this._modifiedEditor.getSelections();
        }
        setSelection(something, source = 'api') {
            this._modifiedEditor.setSelection(something, source);
        }
        setSelections(ranges, source = 'api') {
            this._modifiedEditor.setSelections(ranges, source);
        }
        revealLines(startLineNumber, endLineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealLines(startLineNumber, endLineNumber, scrollType);
        }
        revealLinesInCenter(startLineNumber, endLineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealLinesInCenter(startLineNumber, endLineNumber, scrollType);
        }
        revealLinesInCenterIfOutsideViewport(startLineNumber, endLineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealLinesInCenterIfOutsideViewport(startLineNumber, endLineNumber, scrollType);
        }
        revealLinesNearTop(startLineNumber, endLineNumber, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealLinesNearTop(startLineNumber, endLineNumber, scrollType);
        }
        revealRange(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */, revealVerticalInCenter = false, revealHorizontal = true) {
            this._modifiedEditor.revealRange(range, scrollType, revealVerticalInCenter, revealHorizontal);
        }
        revealRangeInCenter(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealRangeInCenter(range, scrollType);
        }
        revealRangeInCenterIfOutsideViewport(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealRangeInCenterIfOutsideViewport(range, scrollType);
        }
        revealRangeNearTop(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealRangeNearTop(range, scrollType);
        }
        revealRangeNearTopIfOutsideViewport(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealRangeNearTopIfOutsideViewport(range, scrollType);
        }
        revealRangeAtTop(range, scrollType = 0 /* editorCommon.ScrollType.Smooth */) {
            this._modifiedEditor.revealRangeAtTop(range, scrollType);
        }
        getSupportedActions() {
            return this._modifiedEditor.getSupportedActions();
        }
        saveViewState() {
            const originalViewState = this._originalEditor.saveViewState();
            const modifiedViewState = this._modifiedEditor.saveViewState();
            return {
                original: originalViewState,
                modified: modifiedViewState
            };
        }
        restoreViewState(s) {
            if (s && s.original && s.modified) {
                const diffEditorState = s;
                this._originalEditor.restoreViewState(diffEditorState.original);
                this._modifiedEditor.restoreViewState(diffEditorState.modified);
            }
        }
        layout(dimension) {
            this._elementSizeObserver.observe(dimension);
        }
        focus() {
            this._modifiedEditor.focus();
        }
        hasTextFocus() {
            return this._originalEditor.hasTextFocus() || this._modifiedEditor.hasTextFocus();
        }
        onVisible() {
            this._isVisible = true;
            this._originalEditor.onVisible();
            this._modifiedEditor.onVisible();
            // Begin comparing
            this._beginUpdateDecorations();
        }
        onHide() {
            this._isVisible = false;
            this._originalEditor.onHide();
            this._modifiedEditor.onHide();
            // Remove all view zones & decorations
            this._cleanViewZonesAndDecorations();
        }
        trigger(source, handlerId, payload) {
            this._modifiedEditor.trigger(source, handlerId, payload);
        }
        changeDecorations(callback) {
            return this._modifiedEditor.changeDecorations(callback);
        }
        //------------ end IDiffEditor methods
        //------------ begin layouting methods
        _onDidContainerSizeChanged() {
            this._doLayout();
        }
        _getReviewHeight() {
            return this._reviewPane.isVisible() ? this._elementSizeObserver.getHeight() : 0;
        }
        _layoutOverviewRulers() {
            if (!this._options.renderOverviewRuler) {
                return;
            }
            if (!this._originalOverviewRuler || !this._modifiedOverviewRuler) {
                return;
            }
            const height = this._elementSizeObserver.getHeight();
            const reviewHeight = this._getReviewHeight();
            const freeSpace = DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH - 2 * DiffEditorWidget.ONE_OVERVIEW_WIDTH;
            const layoutInfo = this._modifiedEditor.getLayoutInfo();
            if (layoutInfo) {
                this._originalOverviewRuler.setLayout({
                    top: 0,
                    width: DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                    right: freeSpace + DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                    height: (height - reviewHeight)
                });
                this._modifiedOverviewRuler.setLayout({
                    top: 0,
                    right: 0,
                    width: DiffEditorWidget.ONE_OVERVIEW_WIDTH,
                    height: (height - reviewHeight)
                });
            }
        }
        //------------ end layouting methods
        _onViewZonesChanged() {
            if (this._currentlyChangingViewZones) {
                return;
            }
            this._updateDecorationsRunner.schedule();
        }
        _beginUpdateDecorationsSoon() {
            // Clear previous timeout if necessary
            if (this._beginUpdateDecorationsTimeout !== -1) {
                window.clearTimeout(this._beginUpdateDecorationsTimeout);
                this._beginUpdateDecorationsTimeout = -1;
            }
            this._beginUpdateDecorationsTimeout = window.setTimeout(() => this._beginUpdateDecorations(), DiffEditorWidget.UPDATE_DIFF_DECORATIONS_DELAY);
        }
        static _equals(a, b) {
            if (!a && !b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return (a.toString() === b.toString());
        }
        _beginUpdateDecorations() {
            this._beginUpdateDecorationsTimeout = -1;
            const currentOriginalModel = this._originalEditor.getModel();
            const currentModifiedModel = this._modifiedEditor.getModel();
            if (!currentOriginalModel || !currentModifiedModel) {
                return;
            }
            // Prevent old diff requests to come if a new request has been initiated
            // The best method would be to call cancel on the Promise, but this is not
            // yet supported, so using tokens for now.
            this._diffComputationToken++;
            const currentToken = this._diffComputationToken;
            const diffLimit = this._options.maxFileSize * 1024 * 1024; // MB
            const canSyncModelForDiff = (model) => {
                const bufferTextLength = model.getValueLength();
                return (diffLimit === 0 || bufferTextLength <= diffLimit);
            };
            if (!canSyncModelForDiff(currentOriginalModel) || !canSyncModelForDiff(currentModifiedModel)) {
                if (!DiffEditorWidget._equals(currentOriginalModel.uri, this._lastOriginalWarning)
                    || !DiffEditorWidget._equals(currentModifiedModel.uri, this._lastModifiedWarning)) {
                    this._lastOriginalWarning = currentOriginalModel.uri;
                    this._lastModifiedWarning = currentModifiedModel.uri;
                    this._notificationService.warn(nls.localize("diff.tooLarge", "Cannot compare files because one file is too large."));
                }
                return;
            }
            this._setState(1 /* editorBrowser.DiffEditorState.ComputingDiff */);
            this._editorWorkerService.computeDiff(currentOriginalModel.uri, currentModifiedModel.uri, this._options.ignoreTrimWhitespace, this._options.maxComputationTime).then((result) => {
                if (currentToken === this._diffComputationToken
                    && currentOriginalModel === this._originalEditor.getModel()
                    && currentModifiedModel === this._modifiedEditor.getModel()) {
                    this._setState(2 /* editorBrowser.DiffEditorState.DiffComputed */);
                    this._diffComputationResult = result;
                    this._updateDecorationsRunner.schedule();
                    this._onDidUpdateDiff.fire();
                }
            }, (error) => {
                if (currentToken === this._diffComputationToken
                    && currentOriginalModel === this._originalEditor.getModel()
                    && currentModifiedModel === this._modifiedEditor.getModel()) {
                    this._setState(2 /* editorBrowser.DiffEditorState.DiffComputed */);
                    this._diffComputationResult = null;
                    this._updateDecorationsRunner.schedule();
                }
            });
        }
        _cleanViewZonesAndDecorations() {
            this._originalEditorState.clean(this._originalEditor);
            this._modifiedEditorState.clean(this._modifiedEditor);
        }
        _updateDecorations() {
            if (!this._originalEditor.getModel() || !this._modifiedEditor.getModel()) {
                return;
            }
            const lineChanges = (this._diffComputationResult ? this._diffComputationResult.changes : []);
            const foreignOriginal = this._originalEditorState.getForeignViewZones(this._originalEditor.getWhitespaces());
            const foreignModified = this._modifiedEditorState.getForeignViewZones(this._modifiedEditor.getWhitespaces());
            const diffDecorations = this._strategy.getEditorsDiffDecorations(lineChanges, this._options.ignoreTrimWhitespace, this._options.renderIndicators, foreignOriginal, foreignModified);
            try {
                this._currentlyChangingViewZones = true;
                this._originalEditorState.apply(this._originalEditor, this._originalOverviewRuler, diffDecorations.original, false);
                this._modifiedEditorState.apply(this._modifiedEditor, this._modifiedOverviewRuler, diffDecorations.modified, true);
            }
            finally {
                this._currentlyChangingViewZones = false;
            }
        }
        _adjustOptionsForSubEditor(options) {
            const clonedOptions = Object.assign({}, options);
            clonedOptions.inDiffEditor = true;
            clonedOptions.automaticLayout = false;
            // Clone scrollbar options before changing them
            clonedOptions.scrollbar = Object.assign({}, (clonedOptions.scrollbar || {}));
            clonedOptions.scrollbar.vertical = 'visible';
            clonedOptions.folding = false;
            clonedOptions.codeLens = this._options.diffCodeLens;
            clonedOptions.fixedOverflowWidgets = true;
            // clonedOptions.lineDecorationsWidth = '2ch';
            // Clone minimap options before changing them
            clonedOptions.minimap = Object.assign({}, (clonedOptions.minimap || {}));
            clonedOptions.minimap.enabled = false;
            return clonedOptions;
        }
        _adjustOptionsForLeftHandSide(options) {
            const result = this._adjustOptionsForSubEditor(options);
            if (!this._options.renderSideBySide) {
                // never wrap hidden editor
                result.wordWrapOverride1 = 'off';
                result.wordWrapOverride2 = 'off';
            }
            else {
                result.wordWrapOverride1 = this._options.diffWordWrap;
            }
            if (options.originalAriaLabel) {
                result.ariaLabel = options.originalAriaLabel;
            }
            result.readOnly = !this._options.originalEditable;
            result.extraEditorClassName = 'original-in-monaco-diff-editor';
            return Object.assign(Object.assign({}, result), { dimension: {
                    height: 0,
                    width: 0
                } });
        }
        _adjustOptionsForRightHandSide(options) {
            const result = this._adjustOptionsForSubEditor(options);
            if (options.modifiedAriaLabel) {
                result.ariaLabel = options.modifiedAriaLabel;
            }
            result.wordWrapOverride1 = this._options.diffWordWrap;
            result.revealHorizontalRightPadding = editorOptions_1.EditorOptions.revealHorizontalRightPadding.defaultValue + DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH;
            result.scrollbar.verticalHasArrows = false;
            result.extraEditorClassName = 'modified-in-monaco-diff-editor';
            return Object.assign(Object.assign({}, result), { dimension: {
                    height: 0,
                    width: 0
                } });
        }
        doLayout() {
            this._elementSizeObserver.observe();
            this._doLayout();
        }
        _doLayout() {
            const width = this._elementSizeObserver.getWidth();
            const height = this._elementSizeObserver.getHeight();
            const reviewHeight = this._getReviewHeight();
            const splitPoint = this._strategy.layout();
            this._originalDomNode.style.width = splitPoint + 'px';
            this._originalDomNode.style.left = '0px';
            this._modifiedDomNode.style.width = (width - splitPoint) + 'px';
            this._modifiedDomNode.style.left = splitPoint + 'px';
            this._overviewDomElement.style.top = '0px';
            this._overviewDomElement.style.height = (height - reviewHeight) + 'px';
            this._overviewDomElement.style.width = DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH + 'px';
            this._overviewDomElement.style.left = (width - DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH) + 'px';
            this._overviewViewportDomElement.setWidth(DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH);
            this._overviewViewportDomElement.setHeight(30);
            this._originalEditor.layout({ width: splitPoint, height: (height - reviewHeight) });
            this._modifiedEditor.layout({ width: width - splitPoint - (this._options.renderOverviewRuler ? DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0), height: (height - reviewHeight) });
            if (this._originalOverviewRuler || this._modifiedOverviewRuler) {
                this._layoutOverviewRulers();
            }
            this._reviewPane.layout(height - reviewHeight, width, reviewHeight);
            this._layoutOverviewViewport();
        }
        _layoutOverviewViewport() {
            const layout = this._computeOverviewViewport();
            if (!layout) {
                this._overviewViewportDomElement.setTop(0);
                this._overviewViewportDomElement.setHeight(0);
            }
            else {
                this._overviewViewportDomElement.setTop(layout.top);
                this._overviewViewportDomElement.setHeight(layout.height);
            }
        }
        _computeOverviewViewport() {
            const layoutInfo = this._modifiedEditor.getLayoutInfo();
            if (!layoutInfo) {
                return null;
            }
            const scrollTop = this._modifiedEditor.getScrollTop();
            const scrollHeight = this._modifiedEditor.getScrollHeight();
            const computedAvailableSize = Math.max(0, layoutInfo.height);
            const computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * 0);
            const computedRatio = scrollHeight > 0 ? (computedRepresentableSize / scrollHeight) : 0;
            const computedSliderSize = Math.max(0, Math.floor(layoutInfo.height * computedRatio));
            const computedSliderPosition = Math.floor(scrollTop * computedRatio);
            return {
                height: computedSliderSize,
                top: computedSliderPosition
            };
        }
        _createDataSource() {
            return {
                getWidth: () => {
                    return this._elementSizeObserver.getWidth();
                },
                getHeight: () => {
                    return (this._elementSizeObserver.getHeight() - this._getReviewHeight());
                },
                getOptions: () => {
                    return {
                        renderOverviewRuler: this._options.renderOverviewRuler
                    };
                },
                getContainerDomNode: () => {
                    return this._containerDomElement;
                },
                relayoutEditors: () => {
                    this._doLayout();
                },
                getOriginalEditor: () => {
                    return this._originalEditor;
                },
                getModifiedEditor: () => {
                    return this._modifiedEditor;
                }
            };
        }
        _setStrategy(newStrategy) {
            if (this._strategy) {
                this._strategy.dispose();
            }
            this._strategy = newStrategy;
            newStrategy.applyColors(this._themeService.getColorTheme());
            if (this._diffComputationResult) {
                this._updateDecorations();
            }
            // Just do a layout, the strategy might need it
            this._doLayout();
        }
        _getLineChangeAtOrBeforeLineNumber(lineNumber, startLineNumberExtractor) {
            const lineChanges = (this._diffComputationResult ? this._diffComputationResult.changes : []);
            if (lineChanges.length === 0 || lineNumber < startLineNumberExtractor(lineChanges[0])) {
                // There are no changes or `lineNumber` is before the first change
                return null;
            }
            let min = 0;
            let max = lineChanges.length - 1;
            while (min < max) {
                const mid = Math.floor((min + max) / 2);
                const midStart = startLineNumberExtractor(lineChanges[mid]);
                const midEnd = (mid + 1 <= max ? startLineNumberExtractor(lineChanges[mid + 1]) : 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
                if (lineNumber < midStart) {
                    max = mid - 1;
                }
                else if (lineNumber >= midEnd) {
                    min = mid + 1;
                }
                else {
                    // HIT!
                    min = mid;
                    max = mid;
                }
            }
            return lineChanges[min];
        }
        _getEquivalentLineForOriginalLineNumber(lineNumber) {
            const lineChange = this._getLineChangeAtOrBeforeLineNumber(lineNumber, (lineChange) => lineChange.originalStartLineNumber);
            if (!lineChange) {
                return lineNumber;
            }
            const originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
            const modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
            const lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? (lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1) : 0);
            const lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? (lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1) : 0);
            const delta = lineNumber - originalEquivalentLineNumber;
            if (delta <= lineChangeOriginalLength) {
                return modifiedEquivalentLineNumber + Math.min(delta, lineChangeModifiedLength);
            }
            return modifiedEquivalentLineNumber + lineChangeModifiedLength - lineChangeOriginalLength + delta;
        }
        _getEquivalentLineForModifiedLineNumber(lineNumber) {
            const lineChange = this._getLineChangeAtOrBeforeLineNumber(lineNumber, (lineChange) => lineChange.modifiedStartLineNumber);
            if (!lineChange) {
                return lineNumber;
            }
            const originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
            const modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
            const lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? (lineChange.originalEndLineNumber - lineChange.originalStartLineNumber + 1) : 0);
            const lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? (lineChange.modifiedEndLineNumber - lineChange.modifiedStartLineNumber + 1) : 0);
            const delta = lineNumber - modifiedEquivalentLineNumber;
            if (delta <= lineChangeModifiedLength) {
                return originalEquivalentLineNumber + Math.min(delta, lineChangeOriginalLength);
            }
            return originalEquivalentLineNumber + lineChangeOriginalLength - lineChangeModifiedLength + delta;
        }
        getDiffLineInformationForOriginal(lineNumber) {
            if (!this._diffComputationResult) {
                // Cannot answer that which I don't know
                return null;
            }
            return {
                equivalentLineNumber: this._getEquivalentLineForOriginalLineNumber(lineNumber)
            };
        }
        getDiffLineInformationForModified(lineNumber) {
            if (!this._diffComputationResult) {
                // Cannot answer that which I don't know
                return null;
            }
            return {
                equivalentLineNumber: this._getEquivalentLineForModifiedLineNumber(lineNumber)
            };
        }
    };
    DiffEditorWidget.ONE_OVERVIEW_WIDTH = 15;
    DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH = 30;
    DiffEditorWidget.UPDATE_DIFF_DECORATIONS_DELAY = 200; // ms
    DiffEditorWidget = __decorate([
        __param(3, clipboardService_1.IClipboardService),
        __param(4, editorWorker_1.IEditorWorkerService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, codeEditorService_1.ICodeEditorService),
        __param(8, themeService_1.IThemeService),
        __param(9, notification_1.INotificationService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, progress_1.IEditorProgressService)
    ], DiffEditorWidget);
    exports.DiffEditorWidget = DiffEditorWidget;
    class DiffEditorWidgetStyle extends lifecycle_1.Disposable {
        constructor(dataSource) {
            super();
            this._dataSource = dataSource;
            this._insertColor = null;
            this._removeColor = null;
        }
        applyColors(theme) {
            const newInsertColor = theme.getColor(colorRegistry_1.diffOverviewRulerInserted) || (theme.getColor(colorRegistry_1.diffInserted) || colorRegistry_1.defaultInsertColor).transparent(2);
            const newRemoveColor = theme.getColor(colorRegistry_1.diffOverviewRulerRemoved) || (theme.getColor(colorRegistry_1.diffRemoved) || colorRegistry_1.defaultRemoveColor).transparent(2);
            const hasChanges = !newInsertColor.equals(this._insertColor) || !newRemoveColor.equals(this._removeColor);
            this._insertColor = newInsertColor;
            this._removeColor = newRemoveColor;
            return hasChanges;
        }
        getEditorsDiffDecorations(lineChanges, ignoreTrimWhitespace, renderIndicators, originalWhitespaces, modifiedWhitespaces) {
            // Get view zones
            modifiedWhitespaces = modifiedWhitespaces.sort((a, b) => {
                return a.afterLineNumber - b.afterLineNumber;
            });
            originalWhitespaces = originalWhitespaces.sort((a, b) => {
                return a.afterLineNumber - b.afterLineNumber;
            });
            const zones = this._getViewZones(lineChanges, originalWhitespaces, modifiedWhitespaces, renderIndicators);
            // Get decorations & overview ruler zones
            const originalDecorations = this._getOriginalEditorDecorations(zones, lineChanges, ignoreTrimWhitespace, renderIndicators);
            const modifiedDecorations = this._getModifiedEditorDecorations(zones, lineChanges, ignoreTrimWhitespace, renderIndicators);
            return {
                original: {
                    decorations: originalDecorations.decorations,
                    overviewZones: originalDecorations.overviewZones,
                    zones: zones.original
                },
                modified: {
                    decorations: modifiedDecorations.decorations,
                    overviewZones: modifiedDecorations.overviewZones,
                    zones: zones.modified
                }
            };
        }
    }
    class ForeignViewZonesIterator {
        constructor(source) {
            this._source = source;
            this._index = -1;
            this.current = null;
            this.advance();
        }
        advance() {
            this._index++;
            if (this._index < this._source.length) {
                this.current = this._source[this._index];
            }
            else {
                this.current = null;
            }
        }
    }
    class ViewZonesComputer {
        constructor(_lineChanges, _originalForeignVZ, _modifiedForeignVZ, _originalEditor, _modifiedEditor) {
            this._lineChanges = _lineChanges;
            this._originalForeignVZ = _originalForeignVZ;
            this._modifiedForeignVZ = _modifiedForeignVZ;
            this._originalEditor = _originalEditor;
            this._modifiedEditor = _modifiedEditor;
        }
        static _getViewLineCount(editor, startLineNumber, endLineNumber) {
            const model = editor.getModel();
            const viewModel = editor._getViewModel();
            if (model && viewModel) {
                const viewRange = getViewRange(model, viewModel, startLineNumber, endLineNumber);
                return (viewRange.endLineNumber - viewRange.startLineNumber + 1);
            }
            return (endLineNumber - startLineNumber + 1);
        }
        getViewZones() {
            const originalLineHeight = this._originalEditor.getOption(59 /* EditorOption.lineHeight */);
            const modifiedLineHeight = this._modifiedEditor.getOption(59 /* EditorOption.lineHeight */);
            const originalHasWrapping = (this._originalEditor.getOption(132 /* EditorOption.wrappingInfo */).wrappingColumn !== -1);
            const modifiedHasWrapping = (this._modifiedEditor.getOption(132 /* EditorOption.wrappingInfo */).wrappingColumn !== -1);
            const hasWrapping = (originalHasWrapping || modifiedHasWrapping);
            const originalModel = this._originalEditor.getModel();
            const originalCoordinatesConverter = this._originalEditor._getViewModel().coordinatesConverter;
            const modifiedCoordinatesConverter = this._modifiedEditor._getViewModel().coordinatesConverter;
            const result = {
                original: [],
                modified: []
            };
            let lineChangeModifiedLength = 0;
            let lineChangeOriginalLength = 0;
            let originalEquivalentLineNumber = 0;
            let modifiedEquivalentLineNumber = 0;
            let originalEndEquivalentLineNumber = 0;
            let modifiedEndEquivalentLineNumber = 0;
            const sortMyViewZones = (a, b) => {
                return a.afterLineNumber - b.afterLineNumber;
            };
            const addAndCombineIfPossible = (destination, item) => {
                if (item.domNode === null && destination.length > 0) {
                    const lastItem = destination[destination.length - 1];
                    if (lastItem.afterLineNumber === item.afterLineNumber && lastItem.domNode === null) {
                        lastItem.heightInLines += item.heightInLines;
                        return;
                    }
                }
                destination.push(item);
            };
            const modifiedForeignVZ = new ForeignViewZonesIterator(this._modifiedForeignVZ);
            const originalForeignVZ = new ForeignViewZonesIterator(this._originalForeignVZ);
            let lastOriginalLineNumber = 1;
            let lastModifiedLineNumber = 1;
            // In order to include foreign view zones after the last line change, the for loop will iterate once more after the end of the `lineChanges` array
            for (let i = 0, length = this._lineChanges.length; i <= length; i++) {
                const lineChange = (i < length ? this._lineChanges[i] : null);
                if (lineChange !== null) {
                    originalEquivalentLineNumber = lineChange.originalStartLineNumber + (lineChange.originalEndLineNumber > 0 ? -1 : 0);
                    modifiedEquivalentLineNumber = lineChange.modifiedStartLineNumber + (lineChange.modifiedEndLineNumber > 0 ? -1 : 0);
                    lineChangeOriginalLength = (lineChange.originalEndLineNumber > 0 ? ViewZonesComputer._getViewLineCount(this._originalEditor, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber) : 0);
                    lineChangeModifiedLength = (lineChange.modifiedEndLineNumber > 0 ? ViewZonesComputer._getViewLineCount(this._modifiedEditor, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber) : 0);
                    originalEndEquivalentLineNumber = Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber);
                    modifiedEndEquivalentLineNumber = Math.max(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber);
                }
                else {
                    // Increase to very large value to get the producing tests of foreign view zones running
                    originalEquivalentLineNumber += 10000000 + lineChangeOriginalLength;
                    modifiedEquivalentLineNumber += 10000000 + lineChangeModifiedLength;
                    originalEndEquivalentLineNumber = originalEquivalentLineNumber;
                    modifiedEndEquivalentLineNumber = modifiedEquivalentLineNumber;
                }
                // Each step produces view zones, and after producing them, we try to cancel them out, to avoid empty-empty view zone cases
                let stepOriginal = [];
                let stepModified = [];
                // ---------------------------- PRODUCE VIEW ZONES
                // [PRODUCE] View zones due to line mapping differences (equal lines but wrapped differently)
                if (hasWrapping) {
                    let count;
                    if (lineChange) {
                        if (lineChange.originalEndLineNumber > 0) {
                            count = lineChange.originalStartLineNumber - lastOriginalLineNumber;
                        }
                        else {
                            count = lineChange.modifiedStartLineNumber - lastModifiedLineNumber;
                        }
                    }
                    else {
                        // `lastOriginalLineNumber` has not been looked at yet
                        count = originalModel.getLineCount() - lastOriginalLineNumber + 1;
                    }
                    for (let i = 0; i < count; i++) {
                        const originalLineNumber = lastOriginalLineNumber + i;
                        const modifiedLineNumber = lastModifiedLineNumber + i;
                        const originalViewLineCount = originalCoordinatesConverter.getModelLineViewLineCount(originalLineNumber);
                        const modifiedViewLineCount = modifiedCoordinatesConverter.getModelLineViewLineCount(modifiedLineNumber);
                        if (originalViewLineCount < modifiedViewLineCount) {
                            stepOriginal.push({
                                afterLineNumber: originalLineNumber,
                                heightInLines: modifiedViewLineCount - originalViewLineCount,
                                domNode: null,
                                marginDomNode: null
                            });
                        }
                        else if (originalViewLineCount > modifiedViewLineCount) {
                            stepModified.push({
                                afterLineNumber: modifiedLineNumber,
                                heightInLines: originalViewLineCount - modifiedViewLineCount,
                                domNode: null,
                                marginDomNode: null
                            });
                        }
                    }
                    if (lineChange) {
                        lastOriginalLineNumber = (lineChange.originalEndLineNumber > 0 ? lineChange.originalEndLineNumber : lineChange.originalStartLineNumber) + 1;
                        lastModifiedLineNumber = (lineChange.modifiedEndLineNumber > 0 ? lineChange.modifiedEndLineNumber : lineChange.modifiedStartLineNumber) + 1;
                    }
                }
                // [PRODUCE] View zone(s) in original-side due to foreign view zone(s) in modified-side
                while (modifiedForeignVZ.current && modifiedForeignVZ.current.afterLineNumber <= modifiedEndEquivalentLineNumber) {
                    let viewZoneLineNumber;
                    if (modifiedForeignVZ.current.afterLineNumber <= modifiedEquivalentLineNumber) {
                        viewZoneLineNumber = originalEquivalentLineNumber - modifiedEquivalentLineNumber + modifiedForeignVZ.current.afterLineNumber;
                    }
                    else {
                        viewZoneLineNumber = originalEndEquivalentLineNumber;
                    }
                    let marginDomNode = null;
                    if (lineChange && lineChange.modifiedStartLineNumber <= modifiedForeignVZ.current.afterLineNumber && modifiedForeignVZ.current.afterLineNumber <= lineChange.modifiedEndLineNumber) {
                        marginDomNode = this._createOriginalMarginDomNodeForModifiedForeignViewZoneInAddedRegion();
                    }
                    stepOriginal.push({
                        afterLineNumber: viewZoneLineNumber,
                        heightInLines: modifiedForeignVZ.current.height / modifiedLineHeight,
                        domNode: null,
                        marginDomNode: marginDomNode
                    });
                    modifiedForeignVZ.advance();
                }
                // [PRODUCE] View zone(s) in modified-side due to foreign view zone(s) in original-side
                while (originalForeignVZ.current && originalForeignVZ.current.afterLineNumber <= originalEndEquivalentLineNumber) {
                    let viewZoneLineNumber;
                    if (originalForeignVZ.current.afterLineNumber <= originalEquivalentLineNumber) {
                        viewZoneLineNumber = modifiedEquivalentLineNumber - originalEquivalentLineNumber + originalForeignVZ.current.afterLineNumber;
                    }
                    else {
                        viewZoneLineNumber = modifiedEndEquivalentLineNumber;
                    }
                    stepModified.push({
                        afterLineNumber: viewZoneLineNumber,
                        heightInLines: originalForeignVZ.current.height / originalLineHeight,
                        domNode: null
                    });
                    originalForeignVZ.advance();
                }
                if (lineChange !== null && isChangeOrInsert(lineChange)) {
                    const r = this._produceOriginalFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength);
                    if (r) {
                        stepOriginal.push(r);
                    }
                }
                if (lineChange !== null && isChangeOrDelete(lineChange)) {
                    const r = this._produceModifiedFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength);
                    if (r) {
                        stepModified.push(r);
                    }
                }
                // ---------------------------- END PRODUCE VIEW ZONES
                // ---------------------------- EMIT MINIMAL VIEW ZONES
                // [CANCEL & EMIT] Try to cancel view zones out
                let stepOriginalIndex = 0;
                let stepModifiedIndex = 0;
                stepOriginal = stepOriginal.sort(sortMyViewZones);
                stepModified = stepModified.sort(sortMyViewZones);
                while (stepOriginalIndex < stepOriginal.length && stepModifiedIndex < stepModified.length) {
                    const original = stepOriginal[stepOriginalIndex];
                    const modified = stepModified[stepModifiedIndex];
                    const originalDelta = original.afterLineNumber - originalEquivalentLineNumber;
                    const modifiedDelta = modified.afterLineNumber - modifiedEquivalentLineNumber;
                    if (originalDelta < modifiedDelta) {
                        addAndCombineIfPossible(result.original, original);
                        stepOriginalIndex++;
                    }
                    else if (modifiedDelta < originalDelta) {
                        addAndCombineIfPossible(result.modified, modified);
                        stepModifiedIndex++;
                    }
                    else if (original.shouldNotShrink) {
                        addAndCombineIfPossible(result.original, original);
                        stepOriginalIndex++;
                    }
                    else if (modified.shouldNotShrink) {
                        addAndCombineIfPossible(result.modified, modified);
                        stepModifiedIndex++;
                    }
                    else {
                        if (original.heightInLines >= modified.heightInLines) {
                            // modified view zone gets removed
                            original.heightInLines -= modified.heightInLines;
                            stepModifiedIndex++;
                        }
                        else {
                            // original view zone gets removed
                            modified.heightInLines -= original.heightInLines;
                            stepOriginalIndex++;
                        }
                    }
                }
                // [EMIT] Remaining original view zones
                while (stepOriginalIndex < stepOriginal.length) {
                    addAndCombineIfPossible(result.original, stepOriginal[stepOriginalIndex]);
                    stepOriginalIndex++;
                }
                // [EMIT] Remaining modified view zones
                while (stepModifiedIndex < stepModified.length) {
                    addAndCombineIfPossible(result.modified, stepModified[stepModifiedIndex]);
                    stepModifiedIndex++;
                }
                // ---------------------------- END EMIT MINIMAL VIEW ZONES
            }
            return {
                original: ViewZonesComputer._ensureDomNodes(result.original),
                modified: ViewZonesComputer._ensureDomNodes(result.modified),
            };
        }
        static _ensureDomNodes(zones) {
            return zones.map((z) => {
                if (!z.domNode) {
                    z.domNode = createFakeLinesDiv();
                }
                return z;
            });
        }
    }
    function createDecoration(startLineNumber, startColumn, endLineNumber, endColumn, options) {
        return {
            range: new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn),
            options: options
        };
    }
    const DECORATIONS = {
        charDelete: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-char-delete',
            className: 'char-delete'
        }),
        charDeleteWholeLine: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-char-delete-whole-line',
            className: 'char-delete',
            isWholeLine: true
        }),
        charInsert: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-char-insert',
            className: 'char-insert'
        }),
        charInsertWholeLine: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-char-insert-whole-line',
            className: 'char-insert',
            isWholeLine: true
        }),
        lineInsert: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-line-insert',
            className: 'line-insert',
            marginClassName: 'gutter-insert',
            isWholeLine: true
        }),
        lineInsertWithSign: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-line-insert-with-sign',
            className: 'line-insert',
            linesDecorationsClassName: 'insert-sign ' + themeService_1.ThemeIcon.asClassName(diffInsertIcon),
            marginClassName: 'gutter-insert',
            isWholeLine: true
        }),
        lineDelete: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-line-delete',
            className: 'line-delete',
            marginClassName: 'gutter-delete',
            isWholeLine: true
        }),
        lineDeleteWithSign: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-line-delete-with-sign',
            className: 'line-delete',
            linesDecorationsClassName: 'delete-sign ' + themeService_1.ThemeIcon.asClassName(diffRemoveIcon),
            marginClassName: 'gutter-delete',
            isWholeLine: true
        }),
        lineDeleteMargin: textModel_1.ModelDecorationOptions.register({
            description: 'diff-editor-line-delete-margin',
            marginClassName: 'gutter-delete',
        })
    };
    class DiffEditorWidgetSideBySide extends DiffEditorWidgetStyle {
        constructor(dataSource, enableSplitViewResizing) {
            super(dataSource);
            this._disableSash = (enableSplitViewResizing === false);
            this._sashRatio = null;
            this._sashPosition = null;
            this._startSashPosition = null;
            this._sash = this._register(new sash_1.Sash(this._dataSource.getContainerDomNode(), this, { orientation: 0 /* Orientation.VERTICAL */ }));
            if (this._disableSash) {
                this._sash.state = 0 /* SashState.Disabled */;
            }
            this._sash.onDidStart(() => this._onSashDragStart());
            this._sash.onDidChange((e) => this._onSashDrag(e));
            this._sash.onDidEnd(() => this._onSashDragEnd());
            this._sash.onDidReset(() => this._onSashReset());
        }
        setEnableSplitViewResizing(enableSplitViewResizing) {
            const newDisableSash = (enableSplitViewResizing === false);
            if (this._disableSash !== newDisableSash) {
                this._disableSash = newDisableSash;
                this._sash.state = this._disableSash ? 0 /* SashState.Disabled */ : 3 /* SashState.Enabled */;
            }
        }
        layout(sashRatio = this._sashRatio) {
            const w = this._dataSource.getWidth();
            const contentWidth = w - (this._dataSource.getOptions().renderOverviewRuler ? DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0);
            let sashPosition = Math.floor((sashRatio || 0.5) * contentWidth);
            const midPoint = Math.floor(0.5 * contentWidth);
            sashPosition = this._disableSash ? midPoint : sashPosition || midPoint;
            if (contentWidth > DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH * 2) {
                if (sashPosition < DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH) {
                    sashPosition = DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH;
                }
                if (sashPosition > contentWidth - DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH) {
                    sashPosition = contentWidth - DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH;
                }
            }
            else {
                sashPosition = midPoint;
            }
            if (this._sashPosition !== sashPosition) {
                this._sashPosition = sashPosition;
            }
            this._sash.layout();
            return this._sashPosition;
        }
        _onSashDragStart() {
            this._startSashPosition = this._sashPosition;
        }
        _onSashDrag(e) {
            const w = this._dataSource.getWidth();
            const contentWidth = w - (this._dataSource.getOptions().renderOverviewRuler ? DiffEditorWidget.ENTIRE_DIFF_OVERVIEW_WIDTH : 0);
            const sashPosition = this.layout((this._startSashPosition + (e.currentX - e.startX)) / contentWidth);
            this._sashRatio = sashPosition / contentWidth;
            this._dataSource.relayoutEditors();
        }
        _onSashDragEnd() {
            this._sash.layout();
        }
        _onSashReset() {
            this._sashRatio = 0.5;
            this._dataSource.relayoutEditors();
            this._sash.layout();
        }
        getVerticalSashTop(sash) {
            return 0;
        }
        getVerticalSashLeft(sash) {
            return this._sashPosition;
        }
        getVerticalSashHeight(sash) {
            return this._dataSource.getHeight();
        }
        _getViewZones(lineChanges, originalForeignVZ, modifiedForeignVZ) {
            const originalEditor = this._dataSource.getOriginalEditor();
            const modifiedEditor = this._dataSource.getModifiedEditor();
            const c = new SideBySideViewZonesComputer(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor);
            return c.getViewZones();
        }
        _getOriginalEditorDecorations(zones, lineChanges, ignoreTrimWhitespace, renderIndicators) {
            const originalEditor = this._dataSource.getOriginalEditor();
            const overviewZoneColor = String(this._removeColor);
            const result = {
                decorations: [],
                overviewZones: []
            };
            const originalModel = originalEditor.getModel();
            const originalViewModel = originalEditor._getViewModel();
            for (const lineChange of lineChanges) {
                if (isChangeOrDelete(lineChange)) {
                    result.decorations.push({
                        range: new range_1.Range(lineChange.originalStartLineNumber, 1, lineChange.originalEndLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                        options: (renderIndicators ? DECORATIONS.lineDeleteWithSign : DECORATIONS.lineDelete)
                    });
                    if (!isChangeOrInsert(lineChange) || !lineChange.charChanges) {
                        result.decorations.push(createDecoration(lineChange.originalStartLineNumber, 1, lineChange.originalEndLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, DECORATIONS.charDeleteWholeLine));
                    }
                    const viewRange = getViewRange(originalModel, originalViewModel, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber);
                    result.overviewZones.push(new overviewZoneManager_1.OverviewRulerZone(viewRange.startLineNumber, viewRange.endLineNumber, /*use endLineNumber*/ 0, overviewZoneColor));
                    if (lineChange.charChanges) {
                        for (const charChange of lineChange.charChanges) {
                            if (isChangeOrDelete(charChange)) {
                                if (ignoreTrimWhitespace) {
                                    for (let lineNumber = charChange.originalStartLineNumber; lineNumber <= charChange.originalEndLineNumber; lineNumber++) {
                                        let startColumn;
                                        let endColumn;
                                        if (lineNumber === charChange.originalStartLineNumber) {
                                            startColumn = charChange.originalStartColumn;
                                        }
                                        else {
                                            startColumn = originalModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                        }
                                        if (lineNumber === charChange.originalEndLineNumber) {
                                            endColumn = charChange.originalEndColumn;
                                        }
                                        else {
                                            endColumn = originalModel.getLineLastNonWhitespaceColumn(lineNumber);
                                        }
                                        result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, DECORATIONS.charDelete));
                                    }
                                }
                                else {
                                    result.decorations.push(createDecoration(charChange.originalStartLineNumber, charChange.originalStartColumn, charChange.originalEndLineNumber, charChange.originalEndColumn, DECORATIONS.charDelete));
                                }
                            }
                        }
                    }
                }
            }
            return result;
        }
        _getModifiedEditorDecorations(zones, lineChanges, ignoreTrimWhitespace, renderIndicators) {
            const modifiedEditor = this._dataSource.getModifiedEditor();
            const overviewZoneColor = String(this._insertColor);
            const result = {
                decorations: [],
                overviewZones: []
            };
            const modifiedModel = modifiedEditor.getModel();
            const modifiedViewModel = modifiedEditor._getViewModel();
            for (const lineChange of lineChanges) {
                if (isChangeOrInsert(lineChange)) {
                    result.decorations.push({
                        range: new range_1.Range(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                        options: (renderIndicators ? DECORATIONS.lineInsertWithSign : DECORATIONS.lineInsert)
                    });
                    if (!isChangeOrDelete(lineChange) || !lineChange.charChanges) {
                        result.decorations.push(createDecoration(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, DECORATIONS.charInsertWholeLine));
                    }
                    const viewRange = getViewRange(modifiedModel, modifiedViewModel, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber);
                    result.overviewZones.push(new overviewZoneManager_1.OverviewRulerZone(viewRange.startLineNumber, viewRange.endLineNumber, /*use endLineNumber*/ 0, overviewZoneColor));
                    if (lineChange.charChanges) {
                        for (const charChange of lineChange.charChanges) {
                            if (isChangeOrInsert(charChange)) {
                                if (ignoreTrimWhitespace) {
                                    for (let lineNumber = charChange.modifiedStartLineNumber; lineNumber <= charChange.modifiedEndLineNumber; lineNumber++) {
                                        let startColumn;
                                        let endColumn;
                                        if (lineNumber === charChange.modifiedStartLineNumber) {
                                            startColumn = charChange.modifiedStartColumn;
                                        }
                                        else {
                                            startColumn = modifiedModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                        }
                                        if (lineNumber === charChange.modifiedEndLineNumber) {
                                            endColumn = charChange.modifiedEndColumn;
                                        }
                                        else {
                                            endColumn = modifiedModel.getLineLastNonWhitespaceColumn(lineNumber);
                                        }
                                        result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, DECORATIONS.charInsert));
                                    }
                                }
                                else {
                                    result.decorations.push(createDecoration(charChange.modifiedStartLineNumber, charChange.modifiedStartColumn, charChange.modifiedEndLineNumber, charChange.modifiedEndColumn, DECORATIONS.charInsert));
                                }
                            }
                        }
                    }
                }
            }
            return result;
        }
    }
    DiffEditorWidgetSideBySide.MINIMUM_EDITOR_WIDTH = 100;
    class SideBySideViewZonesComputer extends ViewZonesComputer {
        constructor(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor) {
            super(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor);
        }
        _createOriginalMarginDomNodeForModifiedForeignViewZoneInAddedRegion() {
            return null;
        }
        _produceOriginalFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            if (lineChangeModifiedLength > lineChangeOriginalLength) {
                return {
                    afterLineNumber: Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber),
                    heightInLines: (lineChangeModifiedLength - lineChangeOriginalLength),
                    domNode: null
                };
            }
            return null;
        }
        _produceModifiedFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            if (lineChangeOriginalLength > lineChangeModifiedLength) {
                return {
                    afterLineNumber: Math.max(lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber),
                    heightInLines: (lineChangeOriginalLength - lineChangeModifiedLength),
                    domNode: null
                };
            }
            return null;
        }
    }
    class DiffEditorWidgetInline extends DiffEditorWidgetStyle {
        constructor(dataSource, enableSplitViewResizing) {
            super(dataSource);
            this._decorationsLeft = dataSource.getOriginalEditor().getLayoutInfo().decorationsLeft;
            this._register(dataSource.getOriginalEditor().onDidLayoutChange((layoutInfo) => {
                if (this._decorationsLeft !== layoutInfo.decorationsLeft) {
                    this._decorationsLeft = layoutInfo.decorationsLeft;
                    dataSource.relayoutEditors();
                }
            }));
        }
        setEnableSplitViewResizing(enableSplitViewResizing) {
            // Nothing to do..
        }
        _getViewZones(lineChanges, originalForeignVZ, modifiedForeignVZ, renderIndicators) {
            const originalEditor = this._dataSource.getOriginalEditor();
            const modifiedEditor = this._dataSource.getModifiedEditor();
            const computer = new InlineViewZonesComputer(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor, renderIndicators);
            return computer.getViewZones();
        }
        _getOriginalEditorDecorations(zones, lineChanges, ignoreTrimWhitespace, renderIndicators) {
            const overviewZoneColor = String(this._removeColor);
            const result = {
                decorations: [],
                overviewZones: []
            };
            const originalEditor = this._dataSource.getOriginalEditor();
            const originalModel = originalEditor.getModel();
            const originalViewModel = originalEditor._getViewModel();
            let zoneIndex = 0;
            for (const lineChange of lineChanges) {
                // Add overview zones in the overview ruler
                if (isChangeOrDelete(lineChange)) {
                    result.decorations.push({
                        range: new range_1.Range(lineChange.originalStartLineNumber, 1, lineChange.originalEndLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                        options: DECORATIONS.lineDeleteMargin
                    });
                    while (zoneIndex < zones.modified.length) {
                        const zone = zones.modified[zoneIndex];
                        if (zone.diff && zone.diff.originalStartLineNumber >= lineChange.originalStartLineNumber) {
                            break;
                        }
                        zoneIndex++;
                    }
                    let zoneHeightInLines = 0;
                    if (zoneIndex < zones.modified.length) {
                        const zone = zones.modified[zoneIndex];
                        if (zone.diff
                            && zone.diff.originalStartLineNumber === lineChange.originalStartLineNumber
                            && zone.diff.originalEndLineNumber === lineChange.originalEndLineNumber
                            && zone.diff.modifiedStartLineNumber === lineChange.modifiedStartLineNumber
                            && zone.diff.modifiedEndLineNumber === lineChange.modifiedEndLineNumber) {
                            zoneHeightInLines = zone.heightInLines;
                        }
                    }
                    const viewRange = getViewRange(originalModel, originalViewModel, lineChange.originalStartLineNumber, lineChange.originalEndLineNumber);
                    result.overviewZones.push(new overviewZoneManager_1.OverviewRulerZone(viewRange.startLineNumber, viewRange.endLineNumber, zoneHeightInLines, overviewZoneColor));
                }
            }
            return result;
        }
        _getModifiedEditorDecorations(zones, lineChanges, ignoreTrimWhitespace, renderIndicators) {
            const modifiedEditor = this._dataSource.getModifiedEditor();
            const overviewZoneColor = String(this._insertColor);
            const result = {
                decorations: [],
                overviewZones: []
            };
            const modifiedModel = modifiedEditor.getModel();
            const modifiedViewModel = modifiedEditor._getViewModel();
            for (const lineChange of lineChanges) {
                // Add decorations & overview zones
                if (isChangeOrInsert(lineChange)) {
                    result.decorations.push({
                        range: new range_1.Range(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
                        options: (renderIndicators ? DECORATIONS.lineInsertWithSign : DECORATIONS.lineInsert)
                    });
                    const viewRange = getViewRange(modifiedModel, modifiedViewModel, lineChange.modifiedStartLineNumber, lineChange.modifiedEndLineNumber);
                    result.overviewZones.push(new overviewZoneManager_1.OverviewRulerZone(viewRange.startLineNumber, viewRange.endLineNumber, /*use endLineNumber*/ 0, overviewZoneColor));
                    if (lineChange.charChanges) {
                        for (const charChange of lineChange.charChanges) {
                            if (isChangeOrInsert(charChange)) {
                                if (ignoreTrimWhitespace) {
                                    for (let lineNumber = charChange.modifiedStartLineNumber; lineNumber <= charChange.modifiedEndLineNumber; lineNumber++) {
                                        let startColumn;
                                        let endColumn;
                                        if (lineNumber === charChange.modifiedStartLineNumber) {
                                            startColumn = charChange.modifiedStartColumn;
                                        }
                                        else {
                                            startColumn = modifiedModel.getLineFirstNonWhitespaceColumn(lineNumber);
                                        }
                                        if (lineNumber === charChange.modifiedEndLineNumber) {
                                            endColumn = charChange.modifiedEndColumn;
                                        }
                                        else {
                                            endColumn = modifiedModel.getLineLastNonWhitespaceColumn(lineNumber);
                                        }
                                        result.decorations.push(createDecoration(lineNumber, startColumn, lineNumber, endColumn, DECORATIONS.charInsert));
                                    }
                                }
                                else {
                                    result.decorations.push(createDecoration(charChange.modifiedStartLineNumber, charChange.modifiedStartColumn, charChange.modifiedEndLineNumber, charChange.modifiedEndColumn, DECORATIONS.charInsert));
                                }
                            }
                        }
                    }
                    else {
                        result.decorations.push(createDecoration(lineChange.modifiedStartLineNumber, 1, lineChange.modifiedEndLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, DECORATIONS.charInsertWholeLine));
                    }
                }
            }
            return result;
        }
        layout() {
            // An editor should not be smaller than 5px
            return Math.max(5, this._decorationsLeft);
        }
    }
    class InlineViewZonesComputer extends ViewZonesComputer {
        constructor(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor, renderIndicators) {
            super(lineChanges, originalForeignVZ, modifiedForeignVZ, originalEditor, modifiedEditor);
            this._originalModel = originalEditor.getModel();
            this._renderIndicators = renderIndicators;
            this._pendingLineChange = [];
            this._pendingViewZones = [];
            this._lineBreaksComputer = this._modifiedEditor._getViewModel().createLineBreaksComputer();
        }
        getViewZones() {
            const result = super.getViewZones();
            this._finalize(result);
            return result;
        }
        _createOriginalMarginDomNodeForModifiedForeignViewZoneInAddedRegion() {
            const result = document.createElement('div');
            result.className = 'inline-added-margin-view-zone';
            return result;
        }
        _produceOriginalFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            const marginDomNode = document.createElement('div');
            marginDomNode.className = 'inline-added-margin-view-zone';
            return {
                afterLineNumber: Math.max(lineChange.originalStartLineNumber, lineChange.originalEndLineNumber),
                heightInLines: lineChangeModifiedLength,
                domNode: document.createElement('div'),
                marginDomNode: marginDomNode
            };
        }
        _produceModifiedFromDiff(lineChange, lineChangeOriginalLength, lineChangeModifiedLength) {
            const domNode = document.createElement('div');
            domNode.className = `view-lines line-delete ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`;
            const marginDomNode = document.createElement('div');
            marginDomNode.className = 'inline-deleted-margin-view-zone';
            const viewZone = {
                shouldNotShrink: true,
                afterLineNumber: (lineChange.modifiedEndLineNumber === 0 ? lineChange.modifiedStartLineNumber : lineChange.modifiedStartLineNumber - 1),
                heightInLines: lineChangeOriginalLength,
                minWidthInPx: 0,
                domNode: domNode,
                marginDomNode: marginDomNode,
                diff: {
                    originalStartLineNumber: lineChange.originalStartLineNumber,
                    originalEndLineNumber: lineChange.originalEndLineNumber,
                    modifiedStartLineNumber: lineChange.modifiedStartLineNumber,
                    modifiedEndLineNumber: lineChange.modifiedEndLineNumber,
                    originalModel: this._originalModel,
                    viewLineCounts: null,
                }
            };
            for (let lineNumber = lineChange.originalStartLineNumber; lineNumber <= lineChange.originalEndLineNumber; lineNumber++) {
                this._lineBreaksComputer.addRequest(this._originalModel.getLineContent(lineNumber), null, null);
            }
            this._pendingLineChange.push(lineChange);
            this._pendingViewZones.push(viewZone);
            return viewZone;
        }
        _finalize(result) {
            const modifiedEditorOptions = this._modifiedEditor.getOptions();
            const tabSize = this._modifiedEditor.getModel().getOptions().tabSize;
            const fontInfo = modifiedEditorOptions.get(44 /* EditorOption.fontInfo */);
            const disableMonospaceOptimizations = modifiedEditorOptions.get(29 /* EditorOption.disableMonospaceOptimizations */);
            const typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            const scrollBeyondLastColumn = modifiedEditorOptions.get(93 /* EditorOption.scrollBeyondLastColumn */);
            const mightContainNonBasicASCII = this._originalModel.mightContainNonBasicASCII();
            const mightContainRTL = this._originalModel.mightContainRTL();
            const lineHeight = modifiedEditorOptions.get(59 /* EditorOption.lineHeight */);
            const layoutInfo = modifiedEditorOptions.get(131 /* EditorOption.layoutInfo */);
            const lineDecorationsWidth = layoutInfo.decorationsWidth;
            const stopRenderingLineAfter = modifiedEditorOptions.get(105 /* EditorOption.stopRenderingLineAfter */);
            const renderWhitespace = modifiedEditorOptions.get(88 /* EditorOption.renderWhitespace */);
            const renderControlCharacters = modifiedEditorOptions.get(83 /* EditorOption.renderControlCharacters */);
            const fontLigatures = modifiedEditorOptions.get(45 /* EditorOption.fontLigatures */);
            const lineBreaks = this._lineBreaksComputer.finalize();
            let lineBreakIndex = 0;
            for (let i = 0; i < this._pendingLineChange.length; i++) {
                const lineChange = this._pendingLineChange[i];
                const viewZone = this._pendingViewZones[i];
                const domNode = viewZone.domNode;
                (0, domFontInfo_1.applyFontInfo)(domNode, fontInfo);
                const marginDomNode = viewZone.marginDomNode;
                (0, domFontInfo_1.applyFontInfo)(marginDomNode, fontInfo);
                const decorations = [];
                if (lineChange.charChanges) {
                    for (const charChange of lineChange.charChanges) {
                        if (isChangeOrDelete(charChange)) {
                            decorations.push(new viewModel_1.InlineDecoration(new range_1.Range(charChange.originalStartLineNumber, charChange.originalStartColumn, charChange.originalEndLineNumber, charChange.originalEndColumn), 'char-delete', 0 /* InlineDecorationType.Regular */));
                        }
                    }
                }
                const hasCharChanges = (decorations.length > 0);
                const sb = (0, stringBuilder_1.createStringBuilder)(10000);
                let maxCharsPerLine = 0;
                let renderedLineCount = 0;
                let viewLineCounts = null;
                for (let lineNumber = lineChange.originalStartLineNumber; lineNumber <= lineChange.originalEndLineNumber; lineNumber++) {
                    const lineIndex = lineNumber - lineChange.originalStartLineNumber;
                    const lineTokens = this._originalModel.tokenization.getLineTokens(lineNumber);
                    const lineContent = lineTokens.getLineContent();
                    const lineBreakData = lineBreaks[lineBreakIndex++];
                    const actualDecorations = lineDecorations_1.LineDecoration.filter(decorations, lineNumber, 1, lineContent.length + 1);
                    if (lineBreakData) {
                        let lastBreakOffset = 0;
                        for (const breakOffset of lineBreakData.breakOffsets) {
                            const viewLineTokens = lineTokens.sliceAndInflate(lastBreakOffset, breakOffset, 0);
                            const viewLineContent = lineContent.substring(lastBreakOffset, breakOffset);
                            maxCharsPerLine = Math.max(maxCharsPerLine, this._renderOriginalLine(renderedLineCount++, viewLineContent, viewLineTokens, lineDecorations_1.LineDecoration.extractWrapped(actualDecorations, lastBreakOffset, breakOffset), hasCharChanges, mightContainNonBasicASCII, mightContainRTL, fontInfo, disableMonospaceOptimizations, lineHeight, lineDecorationsWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures, tabSize, sb, marginDomNode));
                            lastBreakOffset = breakOffset;
                        }
                        if (!viewLineCounts) {
                            viewLineCounts = [];
                        }
                        // make sure all lines before this one have an entry in `viewLineCounts`
                        while (viewLineCounts.length < lineIndex) {
                            viewLineCounts[viewLineCounts.length] = 1;
                        }
                        viewLineCounts[lineIndex] = lineBreakData.breakOffsets.length;
                        viewZone.heightInLines += (lineBreakData.breakOffsets.length - 1);
                        const marginDomNode2 = document.createElement('div');
                        marginDomNode2.className = 'gutter-delete';
                        result.original.push({
                            afterLineNumber: lineNumber,
                            afterColumn: 0,
                            heightInLines: lineBreakData.breakOffsets.length - 1,
                            domNode: createFakeLinesDiv(),
                            marginDomNode: marginDomNode2
                        });
                    }
                    else {
                        maxCharsPerLine = Math.max(maxCharsPerLine, this._renderOriginalLine(renderedLineCount++, lineContent, lineTokens, actualDecorations, hasCharChanges, mightContainNonBasicASCII, mightContainRTL, fontInfo, disableMonospaceOptimizations, lineHeight, lineDecorationsWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures, tabSize, sb, marginDomNode));
                    }
                }
                maxCharsPerLine += scrollBeyondLastColumn;
                const html = sb.build();
                const trustedhtml = ttPolicy ? ttPolicy.createHTML(html) : html;
                domNode.innerHTML = trustedhtml;
                viewZone.minWidthInPx = (maxCharsPerLine * typicalHalfwidthCharacterWidth);
                if (viewLineCounts) {
                    // make sure all lines have an entry in `viewLineCounts`
                    const cnt = lineChange.originalEndLineNumber - lineChange.originalStartLineNumber;
                    while (viewLineCounts.length <= cnt) {
                        viewLineCounts[viewLineCounts.length] = 1;
                    }
                }
                viewZone.diff.viewLineCounts = viewLineCounts;
            }
            result.original.sort((a, b) => {
                return a.afterLineNumber - b.afterLineNumber;
            });
        }
        _renderOriginalLine(renderedLineCount, lineContent, lineTokens, decorations, hasCharChanges, mightContainNonBasicASCII, mightContainRTL, fontInfo, disableMonospaceOptimizations, lineHeight, lineDecorationsWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures, tabSize, sb, marginDomNode) {
            sb.appendASCIIString('<div class="view-line');
            if (!hasCharChanges) {
                // No char changes
                sb.appendASCIIString(' char-delete');
            }
            sb.appendASCIIString('" style="top:');
            sb.appendASCIIString(String(renderedLineCount * lineHeight));
            sb.appendASCIIString('px;width:1000000px;">');
            const isBasicASCII = viewModel_1.ViewLineRenderingData.isBasicASCII(lineContent, mightContainNonBasicASCII);
            const containsRTL = viewModel_1.ViewLineRenderingData.containsRTL(lineContent, isBasicASCII, mightContainRTL);
            const output = (0, viewLineRenderer_1.renderViewLine)(new viewLineRenderer_1.RenderLineInput((fontInfo.isMonospace && !disableMonospaceOptimizations), fontInfo.canUseHalfwidthRightwardsArrow, lineContent, false, isBasicASCII, containsRTL, 0, lineTokens, decorations, tabSize, 0, fontInfo.spaceWidth, fontInfo.middotWidth, fontInfo.wsmiddotWidth, stopRenderingLineAfter, renderWhitespace, renderControlCharacters, fontLigatures !== editorOptions_1.EditorFontLigatures.OFF, null // Send no selections, original line cannot be selected
            ), sb);
            sb.appendASCIIString('</div>');
            if (this._renderIndicators) {
                const marginElement = document.createElement('div');
                marginElement.className = `delete-sign ${themeService_1.ThemeIcon.asClassName(diffRemoveIcon)}`;
                marginElement.setAttribute('style', `position:absolute;top:${renderedLineCount * lineHeight}px;width:${lineDecorationsWidth}px;height:${lineHeight}px;right:0;`);
                marginDomNode.appendChild(marginElement);
            }
            return output.characterMapping.getAbsoluteOffset(output.characterMapping.length);
        }
    }
    function validateDiffWordWrap(value, defaultValue) {
        return (0, editorOptions_1.stringSet)(value, defaultValue, ['off', 'on', 'inherit']);
    }
    function isChangeOrInsert(lineChange) {
        return lineChange.modifiedEndLineNumber > 0;
    }
    function isChangeOrDelete(lineChange) {
        return lineChange.originalEndLineNumber > 0;
    }
    function createFakeLinesDiv() {
        const r = document.createElement('div');
        r.className = 'diagonal-fill';
        return r;
    }
    function getViewRange(model, viewModel, startLineNumber, endLineNumber) {
        const lineCount = model.getLineCount();
        startLineNumber = Math.min(lineCount, Math.max(1, startLineNumber));
        endLineNumber = Math.min(lineCount, Math.max(1, endLineNumber));
        return viewModel.coordinatesConverter.convertModelRangeToViewRange(new range_1.Range(startLineNumber, model.getLineMinColumn(startLineNumber), endLineNumber, model.getLineMaxColumn(endLineNumber)));
    }
    function validateDiffEditorOptions(options, defaults) {
        return {
            enableSplitViewResizing: (0, editorOptions_1.boolean)(options.enableSplitViewResizing, defaults.enableSplitViewResizing),
            renderSideBySide: (0, editorOptions_1.boolean)(options.renderSideBySide, defaults.renderSideBySide),
            maxComputationTime: (0, editorOptions_1.clampedInt)(options.maxComputationTime, defaults.maxComputationTime, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            maxFileSize: (0, editorOptions_1.clampedInt)(options.maxFileSize, defaults.maxFileSize, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */),
            ignoreTrimWhitespace: (0, editorOptions_1.boolean)(options.ignoreTrimWhitespace, defaults.ignoreTrimWhitespace),
            renderIndicators: (0, editorOptions_1.boolean)(options.renderIndicators, defaults.renderIndicators),
            originalEditable: (0, editorOptions_1.boolean)(options.originalEditable, defaults.originalEditable),
            diffCodeLens: (0, editorOptions_1.boolean)(options.diffCodeLens, defaults.diffCodeLens),
            renderOverviewRuler: (0, editorOptions_1.boolean)(options.renderOverviewRuler, defaults.renderOverviewRuler),
            diffWordWrap: validateDiffWordWrap(options.diffWordWrap, defaults.diffWordWrap),
        };
    }
    function changedDiffEditorOptions(a, b) {
        return {
            enableSplitViewResizing: (a.enableSplitViewResizing !== b.enableSplitViewResizing),
            renderSideBySide: (a.renderSideBySide !== b.renderSideBySide),
            maxComputationTime: (a.maxComputationTime !== b.maxComputationTime),
            maxFileSize: (a.maxFileSize !== b.maxFileSize),
            ignoreTrimWhitespace: (a.ignoreTrimWhitespace !== b.ignoreTrimWhitespace),
            renderIndicators: (a.renderIndicators !== b.renderIndicators),
            originalEditable: (a.originalEditable !== b.originalEditable),
            diffCodeLens: (a.diffCodeLens !== b.diffCodeLens),
            renderOverviewRuler: (a.renderOverviewRuler !== b.renderOverviewRuler),
            diffWordWrap: (a.diffWordWrap !== b.diffWordWrap),
        };
    }
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const added = theme.getColor(colorRegistry_1.diffInserted);
        if (added) {
            collector.addRule(`.monaco-editor .char-insert, .monaco-diff-editor .char-insert { background-color: ${added}; }`);
        }
        const lineAdded = theme.getColor(colorRegistry_1.diffInsertedLine) || added;
        if (lineAdded) {
            collector.addRule(`.monaco-editor .line-insert, .monaco-diff-editor .line-insert { background-color: ${lineAdded}; }`);
        }
        const gutterAdded = theme.getColor(colorRegistry_1.diffInsertedLineGutter) || lineAdded;
        if (gutterAdded) {
            collector.addRule(`.monaco-editor .inline-added-margin-view-zone { background-color: ${gutterAdded}; }`);
            collector.addRule(`.monaco-editor .gutter-insert, .monaco-diff-editor .gutter-insert { background-color: ${gutterAdded}; }`);
        }
        const removed = theme.getColor(colorRegistry_1.diffRemoved);
        if (removed) {
            collector.addRule(`.monaco-editor .char-delete, .monaco-diff-editor .char-delete { background-color: ${removed}; }`);
        }
        const lineRemoved = theme.getColor(colorRegistry_1.diffRemovedLine) || removed;
        if (lineRemoved) {
            collector.addRule(`.monaco-editor .line-delete, .monaco-diff-editor .line-delete { background-color: ${lineRemoved}; }`);
        }
        const gutterRemoved = theme.getColor(colorRegistry_1.diffRemovedLineGutter) || lineRemoved;
        if (gutterRemoved) {
            collector.addRule(`.monaco-editor .inline-deleted-margin-view-zone { background-color: ${gutterRemoved}; }`);
            collector.addRule(`.monaco-editor .gutter-delete, .monaco-diff-editor .gutter-delete { background-color: ${gutterRemoved}; }`);
        }
        const addedOutline = theme.getColor(colorRegistry_1.diffInsertedOutline);
        if (addedOutline) {
            collector.addRule(`.monaco-editor .line-insert, .monaco-editor .char-insert { border: 1px ${(0, theme_1.isHighContrast)(theme.type) ? 'dashed' : 'solid'} ${addedOutline}; }`);
        }
        const removedOutline = theme.getColor(colorRegistry_1.diffRemovedOutline);
        if (removedOutline) {
            collector.addRule(`.monaco-editor .line-delete, .monaco-editor .char-delete { border: 1px ${(0, theme_1.isHighContrast)(theme.type) ? 'dashed' : 'solid'} ${removedOutline}; }`);
        }
        const shadow = theme.getColor(colorRegistry_1.scrollbarShadow);
        if (shadow) {
            collector.addRule(`.monaco-diff-editor.side-by-side .editor.modified { box-shadow: -6px 0 5px -5px ${shadow}; }`);
        }
        const border = theme.getColor(colorRegistry_1.diffBorder);
        if (border) {
            collector.addRule(`.monaco-diff-editor.side-by-side .editor.modified { border-left: 1px solid ${border}; }`);
        }
        const scrollbarSliderBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderBackground);
        if (scrollbarSliderBackgroundColor) {
            collector.addRule(`
			.monaco-diff-editor .diffViewport {
				background: ${scrollbarSliderBackgroundColor};
			}
		`);
        }
        const scrollbarSliderHoverBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderHoverBackground);
        if (scrollbarSliderHoverBackgroundColor) {
            collector.addRule(`
			.monaco-diff-editor .diffViewport:hover {
				background: ${scrollbarSliderHoverBackgroundColor};
			}
		`);
        }
        const scrollbarSliderActiveBackgroundColor = theme.getColor(colorRegistry_1.scrollbarSliderActiveBackground);
        if (scrollbarSliderActiveBackgroundColor) {
            collector.addRule(`
			.monaco-diff-editor .diffViewport:active {
				background: ${scrollbarSliderActiveBackgroundColor};
			}
		`);
        }
        const diffDiagonalFillColor = theme.getColor(colorRegistry_1.diffDiagonalFill);
        collector.addRule(`
	.monaco-editor .diagonal-fill {
		background-image: linear-gradient(
			-45deg,
			${diffDiagonalFillColor} 12.5%,
			#0000 12.5%, #0000 50%,
			${diffDiagonalFillColor} 50%, ${diffDiagonalFillColor} 62.5%,
			#0000 62.5%, #0000 100%
		);
		background-size: 8px 8px;
	}
	`);
    });
});
//# sourceMappingURL=diffEditorWidget.js.map