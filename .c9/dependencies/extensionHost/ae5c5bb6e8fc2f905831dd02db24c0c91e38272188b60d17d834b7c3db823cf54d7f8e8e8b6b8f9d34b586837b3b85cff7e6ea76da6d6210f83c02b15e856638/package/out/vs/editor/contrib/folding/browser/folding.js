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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/folding/browser/foldingModel", "vs/editor/contrib/folding/browser/hiddenRangeModel", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/contrib/folding/browser/intializingRangeProvider", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "./foldingDecorations", "./syntaxRangeProvider", "vs/platform/notification/common/notification", "vs/base/common/severity", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures", "vs/css!./folding"], function (require, exports, async_1, errors_1, keyCodes_1, lifecycle_1, strings_1, types, stableEditorScroll_1, editorExtensions_1, editorContextKeys_1, languages_1, languageConfigurationRegistry_1, foldingModel_1, hiddenRangeModel_1, indentRangeProvider_1, intializingRangeProvider_1, nls, contextkey_1, colorRegistry_1, themeService_1, foldingDecorations_1, syntaxRangeProvider_1, notification_1, severity_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editorFoldForeground = exports.foldBackgroundBackground = exports.FoldingController = void 0;
    const CONTEXT_FOLDING_ENABLED = new contextkey_1.RawContextKey('foldingEnabled', false);
    let FoldingController = class FoldingController extends lifecycle_1.Disposable {
        constructor(editor, contextKeyService, languageConfigurationService, notificationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this.contextKeyService = contextKeyService;
            this.languageConfigurationService = languageConfigurationService;
            this.languageFeaturesService = languageFeaturesService;
            this._tooManyRegionsNotified = false;
            this.localToDispose = this._register(new lifecycle_1.DisposableStore());
            this.editor = editor;
            const options = this.editor.getOptions();
            this._isEnabled = options.get(37 /* EditorOption.folding */);
            this._useFoldingProviders = options.get(38 /* EditorOption.foldingStrategy */) !== 'indentation';
            this._unfoldOnClickAfterEndOfLine = options.get(42 /* EditorOption.unfoldOnClickAfterEndOfLine */);
            this._restoringViewState = false;
            this._currentModelHasFoldedImports = false;
            this._foldingImportsByDefault = options.get(40 /* EditorOption.foldingImportsByDefault */);
            this._maxFoldingRegions = options.get(41 /* EditorOption.foldingMaximumRegions */);
            this.updateDebounceInfo = languageFeatureDebounceService.for(languageFeaturesService.foldingRangeProvider, 'Folding', { min: 200 });
            this.foldingModel = null;
            this.hiddenRangeModel = null;
            this.rangeProvider = null;
            this.foldingRegionPromise = null;
            this.foldingStateMemento = null;
            this.foldingModelPromise = null;
            this.updateScheduler = null;
            this.cursorChangedScheduler = null;
            this.mouseDownInfo = null;
            this.foldingDecorationProvider = new foldingDecorations_1.FoldingDecorationProvider(editor);
            this.foldingDecorationProvider.autoHideFoldingControls = options.get(99 /* EditorOption.showFoldingControls */) === 'mouseover';
            this.foldingDecorationProvider.showFoldingHighlights = options.get(39 /* EditorOption.foldingHighlight */);
            this.foldingEnabled = CONTEXT_FOLDING_ENABLED.bindTo(this.contextKeyService);
            this.foldingEnabled.set(this._isEnabled);
            this._notifyTooManyRegions = (maxFoldingRegions) => {
                // Message will display once per time vscode runs. Once per file would be tricky.
                if (!this._tooManyRegionsNotified) {
                    notificationService.notify({
                        severity: severity_1.default.Warning,
                        sticky: true,
                        message: nls.localize('maximum fold ranges', "The number of foldable regions is limited to a maximum of {0}. Increase configuration option ['Folding Maximum Regions'](command:workbench.action.openSettings?[\"editor.foldingMaximumRegions\"]) to enable more.", maxFoldingRegions)
                    });
                    this._tooManyRegionsNotified = true;
                }
            };
            this._register(this.editor.onDidChangeModel(() => this.onModelChanged()));
            this._register(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(37 /* EditorOption.folding */)) {
                    this._isEnabled = this.editor.getOptions().get(37 /* EditorOption.folding */);
                    this.foldingEnabled.set(this._isEnabled);
                    this.onModelChanged();
                }
                if (e.hasChanged(41 /* EditorOption.foldingMaximumRegions */)) {
                    this._maxFoldingRegions = this.editor.getOptions().get(41 /* EditorOption.foldingMaximumRegions */);
                    this._tooManyRegionsNotified = false;
                    this.onModelChanged();
                }
                if (e.hasChanged(99 /* EditorOption.showFoldingControls */) || e.hasChanged(39 /* EditorOption.foldingHighlight */)) {
                    const options = this.editor.getOptions();
                    this.foldingDecorationProvider.autoHideFoldingControls = options.get(99 /* EditorOption.showFoldingControls */) === 'mouseover';
                    this.foldingDecorationProvider.showFoldingHighlights = options.get(39 /* EditorOption.foldingHighlight */);
                    this.triggerFoldingModelChanged();
                }
                if (e.hasChanged(38 /* EditorOption.foldingStrategy */)) {
                    this._useFoldingProviders = this.editor.getOptions().get(38 /* EditorOption.foldingStrategy */) !== 'indentation';
                    this.onFoldingStrategyChanged();
                }
                if (e.hasChanged(42 /* EditorOption.unfoldOnClickAfterEndOfLine */)) {
                    this._unfoldOnClickAfterEndOfLine = this.editor.getOptions().get(42 /* EditorOption.unfoldOnClickAfterEndOfLine */);
                }
                if (e.hasChanged(40 /* EditorOption.foldingImportsByDefault */)) {
                    this._foldingImportsByDefault = this.editor.getOptions().get(40 /* EditorOption.foldingImportsByDefault */);
                }
            }));
            this.onModelChanged();
        }
        static get(editor) {
            return editor.getContribution(FoldingController.ID);
        }
        /**
         * Store view state.
         */
        saveViewState() {
            let model = this.editor.getModel();
            if (!model || !this._isEnabled || model.isTooLargeForTokenization()) {
                return {};
            }
            if (this.foldingModel) { // disposed ?
                let collapsedRegions = this.foldingModel.isInitialized ? this.foldingModel.getMemento() : this.hiddenRangeModel.getMemento();
                let provider = this.rangeProvider ? this.rangeProvider.id : undefined;
                return { collapsedRegions, lineCount: model.getLineCount(), provider, foldedImports: this._currentModelHasFoldedImports };
            }
            return undefined;
        }
        /**
         * Restore view state.
         */
        restoreViewState(state) {
            let model = this.editor.getModel();
            if (!model || !this._isEnabled || model.isTooLargeForTokenization() || !this.hiddenRangeModel) {
                return;
            }
            if (!state || state.lineCount !== model.getLineCount()) {
                return;
            }
            this._currentModelHasFoldedImports = !!state.foldedImports;
            if (!state.collapsedRegions) {
                return;
            }
            if (state.provider === syntaxRangeProvider_1.ID_SYNTAX_PROVIDER || state.provider === intializingRangeProvider_1.ID_INIT_PROVIDER) {
                this.foldingStateMemento = state;
            }
            const collapsedRegions = state.collapsedRegions;
            // set the hidden ranges right away, before waiting for the folding model.
            if (this.hiddenRangeModel.applyMemento(collapsedRegions)) {
                const foldingModel = this.getFoldingModel();
                if (foldingModel) {
                    foldingModel.then(foldingModel => {
                        if (foldingModel) {
                            this._restoringViewState = true;
                            try {
                                foldingModel.applyMemento(collapsedRegions);
                            }
                            finally {
                                this._restoringViewState = false;
                            }
                        }
                    }).then(undefined, errors_1.onUnexpectedError);
                }
            }
        }
        onModelChanged() {
            this.localToDispose.clear();
            let model = this.editor.getModel();
            if (!this._isEnabled || !model || model.isTooLargeForTokenization()) {
                // huge files get no view model, so they cannot support hidden areas
                return;
            }
            this._currentModelHasFoldedImports = false;
            this.foldingModel = new foldingModel_1.FoldingModel(model, this.foldingDecorationProvider);
            this.localToDispose.add(this.foldingModel);
            this.hiddenRangeModel = new hiddenRangeModel_1.HiddenRangeModel(this.foldingModel);
            this.localToDispose.add(this.hiddenRangeModel);
            this.localToDispose.add(this.hiddenRangeModel.onDidChange(hr => this.onHiddenRangesChanges(hr)));
            this.updateScheduler = new async_1.Delayer(this.updateDebounceInfo.get(model));
            this.cursorChangedScheduler = new async_1.RunOnceScheduler(() => this.revealCursor(), 200);
            this.localToDispose.add(this.cursorChangedScheduler);
            this.localToDispose.add(this.languageFeaturesService.foldingRangeProvider.onDidChange(() => this.onFoldingStrategyChanged()));
            this.localToDispose.add(this.editor.onDidChangeModelLanguageConfiguration(() => this.onFoldingStrategyChanged())); // covers model language changes as well
            this.localToDispose.add(this.editor.onDidChangeModelContent(e => this.onDidChangeModelContent(e)));
            this.localToDispose.add(this.editor.onDidChangeCursorPosition(() => this.onCursorPositionChanged()));
            this.localToDispose.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this.localToDispose.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            this.localToDispose.add({
                dispose: () => {
                    if (this.foldingRegionPromise) {
                        this.foldingRegionPromise.cancel();
                        this.foldingRegionPromise = null;
                    }
                    if (this.updateScheduler) {
                        this.updateScheduler.cancel();
                    }
                    this.updateScheduler = null;
                    this.foldingModel = null;
                    this.foldingModelPromise = null;
                    this.hiddenRangeModel = null;
                    this.cursorChangedScheduler = null;
                    this.foldingStateMemento = null;
                    if (this.rangeProvider) {
                        this.rangeProvider.dispose();
                    }
                    this.rangeProvider = null;
                }
            });
            this.triggerFoldingModelChanged();
        }
        onFoldingStrategyChanged() {
            if (this.rangeProvider) {
                this.rangeProvider.dispose();
            }
            this.rangeProvider = null;
            this.triggerFoldingModelChanged();
        }
        getRangeProvider(editorModel) {
            if (this.rangeProvider) {
                return this.rangeProvider;
            }
            this.rangeProvider = new indentRangeProvider_1.IndentRangeProvider(editorModel, this.languageConfigurationService, this._maxFoldingRegions); // fallback
            if (this._useFoldingProviders && this.foldingModel) {
                let foldingProviders = this.languageFeaturesService.foldingRangeProvider.ordered(this.foldingModel.textModel);
                if (foldingProviders.length === 0 && this.foldingStateMemento && this.foldingStateMemento.collapsedRegions) {
                    const rangeProvider = this.rangeProvider = new intializingRangeProvider_1.InitializingRangeProvider(editorModel, this.foldingStateMemento.collapsedRegions, () => {
                        // if after 30 the InitializingRangeProvider is still not replaced, force a refresh
                        this.foldingStateMemento = null;
                        this.onFoldingStrategyChanged();
                    }, 30000);
                    return rangeProvider; // keep memento in case there are still no foldingProviders on the next request.
                }
                else if (foldingProviders.length > 0) {
                    this.rangeProvider = new syntaxRangeProvider_1.SyntaxRangeProvider(editorModel, foldingProviders, () => this.triggerFoldingModelChanged(), this._maxFoldingRegions);
                }
            }
            this.foldingStateMemento = null;
            return this.rangeProvider;
        }
        getFoldingModel() {
            return this.foldingModelPromise;
        }
        onDidChangeModelContent(e) {
            var _a;
            (_a = this.hiddenRangeModel) === null || _a === void 0 ? void 0 : _a.notifyChangeModelContent(e);
            this.triggerFoldingModelChanged();
        }
        triggerFoldingModelChanged() {
            if (this.updateScheduler) {
                if (this.foldingRegionPromise) {
                    this.foldingRegionPromise.cancel();
                    this.foldingRegionPromise = null;
                }
                this.foldingModelPromise = this.updateScheduler.trigger(() => {
                    const foldingModel = this.foldingModel;
                    if (!foldingModel) { // null if editor has been disposed, or folding turned off
                        return null;
                    }
                    const sw = new stopwatch_1.StopWatch(true);
                    const provider = this.getRangeProvider(foldingModel.textModel);
                    let foldingRegionPromise = this.foldingRegionPromise = (0, async_1.createCancelablePromise)(token => provider.compute(token, this._notifyTooManyRegions));
                    return foldingRegionPromise.then(foldingRanges => {
                        if (foldingRanges && foldingRegionPromise === this.foldingRegionPromise) { // new request or cancelled in the meantime?
                            let scrollState;
                            if (this._foldingImportsByDefault && !this._currentModelHasFoldedImports) {
                                const hasChanges = foldingRanges.setCollapsedAllOfType(languages_1.FoldingRangeKind.Imports.value, true);
                                if (hasChanges) {
                                    scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this.editor);
                                    this._currentModelHasFoldedImports = hasChanges;
                                }
                            }
                            // some cursors might have moved into hidden regions, make sure they are in expanded regions
                            let selections = this.editor.getSelections();
                            let selectionLineNumbers = selections ? selections.map(s => s.startLineNumber) : [];
                            foldingModel.update(foldingRanges, selectionLineNumbers);
                            if (scrollState) {
                                scrollState.restore(this.editor);
                            }
                            // update debounce info
                            const newValue = this.updateDebounceInfo.update(foldingModel.textModel, sw.elapsed());
                            if (this.updateScheduler) {
                                this.updateScheduler.defaultDelay = newValue;
                            }
                        }
                        return foldingModel;
                    });
                }).then(undefined, (err) => {
                    (0, errors_1.onUnexpectedError)(err);
                    return null;
                });
            }
        }
        onHiddenRangesChanges(hiddenRanges) {
            if (this.hiddenRangeModel && hiddenRanges.length && !this._restoringViewState) {
                let selections = this.editor.getSelections();
                if (selections) {
                    if (this.hiddenRangeModel.adjustSelections(selections)) {
                        this.editor.setSelections(selections);
                    }
                }
            }
            this.editor.setHiddenAreas(hiddenRanges);
        }
        onCursorPositionChanged() {
            if (this.hiddenRangeModel && this.hiddenRangeModel.hasRanges()) {
                this.cursorChangedScheduler.schedule();
            }
        }
        revealCursor() {
            const foldingModel = this.getFoldingModel();
            if (!foldingModel) {
                return;
            }
            foldingModel.then(foldingModel => {
                if (foldingModel) {
                    let selections = this.editor.getSelections();
                    if (selections && selections.length > 0) {
                        let toToggle = [];
                        for (let selection of selections) {
                            let lineNumber = selection.selectionStartLineNumber;
                            if (this.hiddenRangeModel && this.hiddenRangeModel.isHidden(lineNumber)) {
                                toToggle.push(...foldingModel.getAllRegionsAtLine(lineNumber, r => r.isCollapsed && lineNumber > r.startLineNumber));
                            }
                        }
                        if (toToggle.length) {
                            foldingModel.toggleCollapseState(toToggle);
                            this.reveal(selections[0].getPosition());
                        }
                    }
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = null;
            if (!this.hiddenRangeModel || !e.target || !e.target.range) {
                return;
            }
            if (!e.event.leftButton && !e.event.middleButton) {
                return;
            }
            const range = e.target.range;
            let iconClicked = false;
            switch (e.target.type) {
                case 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */: {
                    const data = e.target.detail;
                    const offsetLeftInGutter = e.target.element.offsetLeft;
                    const gutterOffsetX = data.offsetX - offsetLeftInGutter;
                    // const gutterOffsetX = data.offsetX - data.glyphMarginWidth - data.lineNumbersWidth - data.glyphMarginLeft;
                    // TODO@joao TODO@alex TODO@martin this is such that we don't collide with dirty diff
                    if (gutterOffsetX < 5) { // the whitespace between the border and the real folding icon border is 5px
                        return;
                    }
                    iconClicked = true;
                    break;
                }
                case 7 /* MouseTargetType.CONTENT_EMPTY */: {
                    if (this._unfoldOnClickAfterEndOfLine && this.hiddenRangeModel.hasRanges()) {
                        const data = e.target.detail;
                        if (!data.isAfterLines) {
                            break;
                        }
                    }
                    return;
                }
                case 6 /* MouseTargetType.CONTENT_TEXT */: {
                    if (this.hiddenRangeModel.hasRanges()) {
                        let model = this.editor.getModel();
                        if (model && range.startColumn === model.getLineMaxColumn(range.startLineNumber)) {
                            break;
                        }
                    }
                    return;
                }
                default:
                    return;
            }
            this.mouseDownInfo = { lineNumber: range.startLineNumber, iconClicked };
        }
        onEditorMouseUp(e) {
            const foldingModel = this.foldingModel;
            if (!foldingModel || !this.mouseDownInfo || !e.target) {
                return;
            }
            let lineNumber = this.mouseDownInfo.lineNumber;
            let iconClicked = this.mouseDownInfo.iconClicked;
            let range = e.target.range;
            if (!range || range.startLineNumber !== lineNumber) {
                return;
            }
            if (iconClicked) {
                if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                    return;
                }
            }
            else {
                let model = this.editor.getModel();
                if (!model || range.startColumn !== model.getLineMaxColumn(lineNumber)) {
                    return;
                }
            }
            let region = foldingModel.getRegionAtLine(lineNumber);
            if (region && region.startLineNumber === lineNumber) {
                let isCollapsed = region.isCollapsed;
                if (iconClicked || isCollapsed) {
                    let surrounding = e.event.altKey;
                    let toToggle = [];
                    if (surrounding) {
                        let filter = (otherRegion) => !otherRegion.containedBy(region) && !region.containedBy(otherRegion);
                        let toMaybeToggle = foldingModel.getRegionsInside(null, filter);
                        for (const r of toMaybeToggle) {
                            if (r.isCollapsed) {
                                toToggle.push(r);
                            }
                        }
                        // if any surrounding regions are folded, unfold those. Otherwise, fold all surrounding
                        if (toToggle.length === 0) {
                            toToggle = toMaybeToggle;
                        }
                    }
                    else {
                        let recursive = e.event.middleButton || e.event.shiftKey;
                        if (recursive) {
                            for (const r of foldingModel.getRegionsInside(region)) {
                                if (r.isCollapsed === isCollapsed) {
                                    toToggle.push(r);
                                }
                            }
                        }
                        // when recursive, first only collapse all children. If all are already folded or there are no children, also fold parent.
                        if (isCollapsed || !recursive || toToggle.length === 0) {
                            toToggle.push(region);
                        }
                    }
                    foldingModel.toggleCollapseState(toToggle);
                    this.reveal({ lineNumber, column: 1 });
                }
            }
        }
        reveal(position) {
            this.editor.revealPositionInCenterIfOutsideViewport(position, 0 /* ScrollType.Smooth */);
        }
    };
    FoldingController.ID = 'editor.contrib.folding';
    FoldingController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], FoldingController);
    exports.FoldingController = FoldingController;
    class FoldingAction extends editorExtensions_1.EditorAction {
        runEditorCommand(accessor, editor, args) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const foldingController = FoldingController.get(editor);
            if (!foldingController) {
                return;
            }
            const foldingModelPromise = foldingController.getFoldingModel();
            if (foldingModelPromise) {
                this.reportTelemetry(accessor, editor);
                return foldingModelPromise.then(foldingModel => {
                    if (foldingModel) {
                        this.invoke(foldingController, foldingModel, editor, args, languageConfigurationService);
                        const selection = editor.getSelection();
                        if (selection) {
                            foldingController.reveal(selection.getStartPosition());
                        }
                    }
                });
            }
        }
        getSelectedLines(editor) {
            let selections = editor.getSelections();
            return selections ? selections.map(s => s.startLineNumber) : [];
        }
        getLineNumbers(args, editor) {
            if (args && args.selectionLines) {
                return args.selectionLines.map(l => l + 1); // to 0-bases line numbers
            }
            return this.getSelectedLines(editor);
        }
        run(_accessor, _editor) {
        }
    }
    function foldingArgumentsConstraint(args) {
        if (!types.isUndefined(args)) {
            if (!types.isObject(args)) {
                return false;
            }
            const foldingArgs = args;
            if (!types.isUndefined(foldingArgs.levels) && !types.isNumber(foldingArgs.levels)) {
                return false;
            }
            if (!types.isUndefined(foldingArgs.direction) && !types.isString(foldingArgs.direction)) {
                return false;
            }
            if (!types.isUndefined(foldingArgs.selectionLines) && (!types.isArray(foldingArgs.selectionLines) || !foldingArgs.selectionLines.every(types.isNumber))) {
                return false;
            }
        }
        return true;
    }
    class UnfoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfold',
                label: nls.localize('unfoldAction.label', "Unfold"),
                alias: 'Unfold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.BracketRight */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 89 /* KeyCode.BracketRight */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                description: {
                    description: 'Unfold the content in the editor',
                    args: [
                        {
                            name: 'Unfold editor argument',
                            description: `Property-value pairs that can be passed through this argument:
						* 'levels': Number of levels to unfold. If not set, defaults to 1.
						* 'direction': If 'up', unfold given number of levels up otherwise unfolds down.
						* 'selectionLines': Array of the start lines (0-based) of the editor selections to apply the unfold action to. If not set, the active selection(s) will be used.
						`,
                            constraint: foldingArgumentsConstraint,
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'levels': {
                                        'type': 'number',
                                        'default': 1
                                    },
                                    'direction': {
                                        'type': 'string',
                                        'enum': ['up', 'down'],
                                        'default': 'down'
                                    },
                                    'selectionLines': {
                                        'type': 'array',
                                        'items': {
                                            'type': 'number'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args) {
            let levels = args && args.levels || 1;
            let lineNumbers = this.getLineNumbers(args, editor);
            if (args && args.direction === 'up') {
                (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, false, levels, lineNumbers);
            }
            else {
                (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, levels, lineNumbers);
            }
        }
    }
    class UnFoldRecursivelyAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldRecursively',
                label: nls.localize('unFoldRecursivelyAction.label', "Unfold Recursively"),
                alias: 'Unfold Recursively',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.BracketRight */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, _args) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false, Number.MAX_VALUE, this.getSelectedLines(editor));
        }
    }
    class FoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.fold',
                label: nls.localize('foldAction.label', "Fold"),
                alias: 'Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 87 /* KeyCode.BracketLeft */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 87 /* KeyCode.BracketLeft */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                description: {
                    description: 'Fold the content in the editor',
                    args: [
                        {
                            name: 'Fold editor argument',
                            description: `Property-value pairs that can be passed through this argument:
							* 'levels': Number of levels to fold.
							* 'direction': If 'up', folds given number of levels up otherwise folds down.
							* 'selectionLines': Array of the start lines (0-based) of the editor selections to apply the fold action to. If not set, the active selection(s) will be used.
							If no levels or direction is set, folds the region at the locations or if already collapsed, the first uncollapsed parent instead.
						`,
                            constraint: foldingArgumentsConstraint,
                            schema: {
                                'type': 'object',
                                'properties': {
                                    'levels': {
                                        'type': 'number',
                                    },
                                    'direction': {
                                        'type': 'string',
                                        'enum': ['up', 'down'],
                                    },
                                    'selectionLines': {
                                        'type': 'array',
                                        'items': {
                                            'type': 'number'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args) {
            let lineNumbers = this.getLineNumbers(args, editor);
            const levels = args && args.levels;
            const direction = args && args.direction;
            if (typeof levels !== 'number' && typeof direction !== 'string') {
                // fold the region at the location or if already collapsed, the first uncollapsed parent instead.
                (0, foldingModel_1.setCollapseStateUp)(foldingModel, true, lineNumbers);
            }
            else {
                if (direction === 'up') {
                    (0, foldingModel_1.setCollapseStateLevelsUp)(foldingModel, true, levels || 1, lineNumbers);
                }
                else {
                    (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, levels || 1, lineNumbers);
                }
            }
        }
    }
    class ToggleFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.toggleFold',
                label: nls.localize('toggleFoldAction.label', "Toggle Fold"),
                alias: 'Toggle Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            let selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.toggleCollapseState)(foldingModel, 1, selectedLines);
        }
    }
    class FoldRecursivelyAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldRecursively',
                label: nls.localize('foldRecursivelyAction.label', "Fold Recursively"),
                alias: 'Fold Recursively',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 87 /* KeyCode.BracketLeft */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            let selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true, Number.MAX_VALUE, selectedLines);
        }
    }
    class FoldAllBlockCommentsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllBlockComments',
                label: nls.localize('foldAllBlockComments.label', "Fold All Block Comments"),
                alias: 'Fold All Block Comments',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Slash */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Comment.value, true);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const comments = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).comments;
                if (comments && comments.blockCommentStartToken) {
                    let regExp = new RegExp('^\\s*' + (0, strings_1.escapeRegExpCharacters)(comments.blockCommentStartToken));
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, true);
                }
            }
        }
    }
    class FoldAllRegionsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllMarkerRegions',
                label: nls.localize('foldAllMarkerRegions.label', "Fold All Regions"),
                alias: 'Fold All Regions',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 29 /* KeyCode.Digit8 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Region.value, true);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const foldingRules = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).foldingRules;
                if (foldingRules && foldingRules.markers && foldingRules.markers.start) {
                    let regExp = new RegExp(foldingRules.markers.start);
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, true);
                }
            }
        }
    }
    class UnfoldAllRegionsAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAllMarkerRegions',
                label: nls.localize('unfoldAllMarkerRegions.label', "Unfold All Regions"),
                alias: 'Unfold All Regions',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor, args, languageConfigurationService) {
            if (foldingModel.regions.hasTypes()) {
                (0, foldingModel_1.setCollapseStateForType)(foldingModel, languages_1.FoldingRangeKind.Region.value, false);
            }
            else {
                const editorModel = editor.getModel();
                if (!editorModel) {
                    return;
                }
                const foldingRules = languageConfigurationService.getLanguageConfiguration(editorModel.getLanguageId()).foldingRules;
                if (foldingRules && foldingRules.markers && foldingRules.markers.start) {
                    let regExp = new RegExp(foldingRules.markers.start);
                    (0, foldingModel_1.setCollapseStateForMatchingLines)(foldingModel, regExp, false);
                }
            }
        }
    }
    class FoldAllRegionsExceptAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAllExcept',
                label: nls.localize('foldAllExcept.label', "Fold All Regions Except Selected"),
                alias: 'Fold All Regions Except Selected',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 83 /* KeyCode.Minus */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            let selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateForRest)(foldingModel, true, selectedLines);
        }
    }
    class UnfoldAllRegionsExceptAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAllExcept',
                label: nls.localize('unfoldAllExcept.label', "Unfold All Regions Except Selected"),
                alias: 'Unfold All Regions Except Selected',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 81 /* KeyCode.Equal */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            let selectedLines = this.getSelectedLines(editor);
            (0, foldingModel_1.setCollapseStateForRest)(foldingModel, false, selectedLines);
        }
    }
    class FoldAllAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.foldAll',
                label: nls.localize('foldAllAction.label', "Fold All"),
                alias: 'Fold All',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 21 /* KeyCode.Digit0 */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, _editor) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, true);
        }
    }
    class UnfoldAllAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.unfoldAll',
                label: nls.localize('unfoldAllAction.label', "Unfold All"),
                alias: 'Unfold All',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 40 /* KeyCode.KeyJ */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, _editor) {
            (0, foldingModel_1.setCollapseStateLevelsDown)(foldingModel, false);
        }
    }
    class FoldLevelAction extends FoldingAction {
        getFoldingLevel() {
            return parseInt(this.id.substr(FoldLevelAction.ID_PREFIX.length));
        }
        invoke(_foldingController, foldingModel, editor) {
            (0, foldingModel_1.setCollapseStateAtLevel)(foldingModel, this.getFoldingLevel(), true, this.getSelectedLines(editor));
        }
    }
    FoldLevelAction.ID_PREFIX = 'editor.foldLevel';
    FoldLevelAction.ID = (level) => FoldLevelAction.ID_PREFIX + level;
    /** Action to go to the parent fold of current line */
    class GotoParentFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoParentFold',
                label: nls.localize('gotoParentFold.label', "Go to Parent Fold"),
                alias: 'Go to Parent Fold',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            let selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                let startLineNumber = (0, foldingModel_1.getParentFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    /** Action to go to the previous fold of current line */
    class GotoPreviousFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoPreviousFold',
                label: nls.localize('gotoPreviousFold.label', "Go to Previous Folding Range"),
                alias: 'Go to Previous Folding Range',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            let selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                let startLineNumber = (0, foldingModel_1.getPreviousFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    /** Action to go to the next fold of current line */
    class GotoNextFoldAction extends FoldingAction {
        constructor() {
            super({
                id: 'editor.gotoNextFold',
                label: nls.localize('gotoNextFold.label', "Go to Next Folding Range"),
                alias: 'Go to Next Folding Range',
                precondition: CONTEXT_FOLDING_ENABLED,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        invoke(_foldingController, foldingModel, editor) {
            let selectedLines = this.getSelectedLines(editor);
            if (selectedLines.length > 0) {
                let startLineNumber = (0, foldingModel_1.getNextFoldLine)(selectedLines[0], foldingModel);
                if (startLineNumber !== null) {
                    editor.setSelection({
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    });
                }
            }
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(FoldingController.ID, FoldingController);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAction);
    (0, editorExtensions_1.registerEditorAction)(UnFoldRecursivelyAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAction);
    (0, editorExtensions_1.registerEditorAction)(FoldRecursivelyAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllBlockCommentsAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllRegionsAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllRegionsAction);
    (0, editorExtensions_1.registerEditorAction)(FoldAllRegionsExceptAction);
    (0, editorExtensions_1.registerEditorAction)(UnfoldAllRegionsExceptAction);
    (0, editorExtensions_1.registerEditorAction)(ToggleFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoParentFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoPreviousFoldAction);
    (0, editorExtensions_1.registerEditorAction)(GotoNextFoldAction);
    for (let i = 1; i <= 7; i++) {
        (0, editorExtensions_1.registerInstantiatedEditorAction)(new FoldLevelAction({
            id: FoldLevelAction.ID(i),
            label: nls.localize('foldLevelAction.label', "Fold Level {0}", i),
            alias: `Fold Level ${i}`,
            precondition: CONTEXT_FOLDING_ENABLED,
            kbOpts: {
                kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | (21 /* KeyCode.Digit0 */ + i)),
                weight: 100 /* KeybindingWeight.EditorContrib */
            }
        }));
    }
    exports.foldBackgroundBackground = (0, colorRegistry_1.registerColor)('editor.foldBackground', { light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorSelectionBackground, 0.3), dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorSelectionBackground, 0.3), hcDark: null, hcLight: null }, nls.localize('foldBackgroundBackground', "Background color behind folded ranges. The color must not be opaque so as not to hide underlying decorations."), true);
    exports.editorFoldForeground = (0, colorRegistry_1.registerColor)('editorGutter.foldingControlForeground', { dark: colorRegistry_1.iconForeground, light: colorRegistry_1.iconForeground, hcDark: colorRegistry_1.iconForeground, hcLight: colorRegistry_1.iconForeground }, nls.localize('editorGutter.foldingControlForeground', 'Color of the folding control in the editor gutter.'));
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const foldBackground = theme.getColor(exports.foldBackgroundBackground);
        if (foldBackground) {
            collector.addRule(`.monaco-editor .folded-background { background-color: ${foldBackground}; }`);
        }
        const editorFoldColor = theme.getColor(exports.editorFoldForeground);
        if (editorFoldColor) {
            collector.addRule(`
		.monaco-editor .cldr${themeService_1.ThemeIcon.asCSSSelector(foldingDecorations_1.foldingExpandedIcon)},
		.monaco-editor .cldr${themeService_1.ThemeIcon.asCSSSelector(foldingDecorations_1.foldingCollapsedIcon)} {
			color: ${editorFoldColor} !important;
		}
		`);
        }
    });
});
//# sourceMappingURL=folding.js.map