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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/markdownRenderer", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/strings", "vs/base/common/uuid", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/editorColorRegistry", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/services/model", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/testing/browser/explorerProjections/testItemContextOverlay", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/theme", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/testingDecorations", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testingUri", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService"], function (require, exports, dom, markdownRenderer_1, actions_1, arrays_1, async_1, event_1, htmlContent_1, lifecycle_1, map_1, strings_1, uuid_1, codeEditorService_1, editorColorRegistry_1, range_1, model_1, model_2, nls_1, menuEntryActionViewItem_1, actions_2, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, themeService_1, uriIdentity_1, debug_1, testItemContextOverlay_1, icons_1, theme_1, configuration_2, constants_1, testingDecorations_1, testingPeekOpener_1, testingStates_1, testingUri_1, testProfileService_1, testResult_1, testResultService_1, testService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingDecorations = exports.TestingDecorationService = void 0;
    const MAX_INLINE_MESSAGE_LENGTH = 128;
    function isOriginalInDiffEditor(codeEditorService, codeEditor) {
        const diffEditors = codeEditorService.listDiffEditors();
        for (const diffEditor of diffEditors) {
            if (diffEditor.getOriginalEditor() === codeEditor) {
                return true;
            }
        }
        return false;
    }
    let TestingDecorationService = class TestingDecorationService extends lifecycle_1.Disposable {
        constructor(codeEditorService, configurationService, testService, results, instantiationService, modelService) {
            super();
            this.configurationService = configurationService;
            this.testService = testService;
            this.results = results;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.generation = 0;
            this.changeEmitter = new event_1.Emitter();
            this.decorationCache = new map_1.ResourceMap();
            /**
             * List of messages that should be hidden because an editor changed their
             * underlying ranges. I think this is good enough, because:
             *  - Message decorations are never shown across reloads; this does not
             *    need to persist
             *  - Message instances are stable for any completed test results for
             *    the duration of the session.
             */
            this.invalidatedMessages = new WeakSet();
            /** @inheritdoc */
            this.onDidChange = this.changeEmitter.event;
            codeEditorService.registerDecorationType('test-message-decoration', TestMessageDecoration.decorationId, {}, undefined);
            modelService.onModelRemoved(e => this.decorationCache.delete(e.uri));
            const debounceInvalidate = this._register(new async_1.RunOnceScheduler(() => this.invalidate(), 100));
            // If ranges were updated in the document, mark that we should explicitly
            // sync decorations to the published lines, since we assume that everything
            // is up to date. This prevents issues, as in #138632, #138835, #138922.
            this._register(this.testService.onWillProcessDiff(diff => {
                var _a, _b;
                for (const entry of diff) {
                    let uri;
                    if (entry.op === 0 /* TestDiffOpType.Add */ || entry.op === 1 /* TestDiffOpType.Update */) {
                        uri = (_a = entry.item.item) === null || _a === void 0 ? void 0 : _a.uri;
                    }
                    else if (entry.op === 2 /* TestDiffOpType.Remove */) {
                        uri = (_b = this.testService.collection.getNodeById(entry.itemId)) === null || _b === void 0 ? void 0 : _b.item.uri;
                    }
                    const rec = uri && this.decorationCache.get(uri);
                    if (rec) {
                        rec.testRangesUpdated = true;
                    }
                }
                if (!debounceInvalidate.isScheduled()) {
                    debounceInvalidate.schedule();
                }
            }));
            this._register(event_1.Event.any(this.results.onResultsChanged, this.results.onTestChanged, this.testService.excluded.onTestExclusionsChanged, this.testService.showInlineOutput.onDidChange, event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration("testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */)))(() => {
                if (!debounceInvalidate.isScheduled()) {
                    debounceInvalidate.schedule();
                }
            }));
        }
        /** @inheritdoc */
        invalidateResultMessage(message) {
            this.invalidatedMessages.add(message);
            this.invalidate();
        }
        /** @inheritdoc */
        syncDecorations(resource) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return new testingDecorations_1.TestDecorations();
            }
            const cached = this.decorationCache.get(resource);
            if (cached && cached.generation === this.generation && !cached.testRangesUpdated) {
                return cached.value;
            }
            return this.applyDecorations(model);
        }
        /** @inheritdoc */
        getDecoratedRangeForTest(resource, testId) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return undefined;
            }
            const decoration = this.syncDecorations(resource).value.find(v => v instanceof RunTestDecoration && v.isForTest(testId));
            if (!decoration) {
                return undefined;
            }
            return model.getDecorationRange(decoration.id) || undefined;
        }
        invalidate() {
            this.generation++;
            this.changeEmitter.fire();
        }
        /**
         * Applies the current set of test decorations to the given text model.
         */
        applyDecorations(model) {
            var _a;
            const gutterEnabled = (0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.gutterEnabled" /* TestingConfigKeys.GutterEnabled */);
            const uriStr = model.uri.toString();
            const cached = this.decorationCache.get(model.uri);
            const testRangesUpdated = cached === null || cached === void 0 ? void 0 : cached.testRangesUpdated;
            const lastDecorations = (_a = cached === null || cached === void 0 ? void 0 : cached.value) !== null && _a !== void 0 ? _a : new testingDecorations_1.TestDecorations();
            const newDecorations = new testingDecorations_1.TestDecorations();
            model.changeDecorations(accessor => {
                var _a, _b, _c, _d;
                const runDecorations = new testingDecorations_1.TestDecorations();
                for (const test of this.testService.collection.all) {
                    if (!test.item.range || ((_a = test.item.uri) === null || _a === void 0 ? void 0 : _a.toString()) !== uriStr) {
                        continue;
                    }
                    const stateLookup = this.results.getStateById(test.item.extId);
                    const line = test.item.range.startLineNumber;
                    runDecorations.push({ line, id: '', test, resultItem: stateLookup === null || stateLookup === void 0 ? void 0 : stateLookup[1] });
                }
                for (const [line, tests] of runDecorations.lines()) {
                    const multi = tests.length > 1;
                    let existing = lastDecorations.findOnLine(line, d => multi ? d instanceof MultiRunTestDecoration : d instanceof RunSingleTestDecoration);
                    // see comment in the constructor for what's going on here
                    if (existing && testRangesUpdated && ((_b = model.getDecorationRange(existing.id)) === null || _b === void 0 ? void 0 : _b.startLineNumber) !== line) {
                        existing = undefined;
                    }
                    if (existing) {
                        if (existing.replaceOptions(tests, gutterEnabled)) {
                            accessor.changeDecorationOptions(existing.id, existing.editorDecoration.options);
                        }
                        newDecorations.push(existing);
                    }
                    else {
                        newDecorations.push(multi
                            ? this.instantiationService.createInstance(MultiRunTestDecoration, tests, gutterEnabled, model)
                            : this.instantiationService.createInstance(RunSingleTestDecoration, tests[0].test, tests[0].resultItem, model, gutterEnabled));
                    }
                }
                const lastResult = this.results.results[0];
                if (this.testService.showInlineOutput.value && lastResult instanceof testResult_1.LiveTestResult) {
                    for (const task of lastResult.tasks) {
                        for (const m of task.otherMessages) {
                            if (!this.invalidatedMessages.has(m) && ((_c = m.location) === null || _c === void 0 ? void 0 : _c.uri.toString()) === uriStr) {
                                const decoration = lastDecorations.findOnLine(m.location.range.startLineNumber, l => l instanceof TestMessageDecoration && l.testMessage === m)
                                    || this.instantiationService.createInstance(TestMessageDecoration, m, undefined, model);
                                newDecorations.push(decoration);
                            }
                        }
                    }
                    const messageLines = new Set();
                    for (const test of lastResult.tests) {
                        for (let taskId = 0; taskId < test.tasks.length; taskId++) {
                            const state = test.tasks[taskId];
                            for (let i = 0; i < state.messages.length; i++) {
                                const m = state.messages[i];
                                if (this.invalidatedMessages.has(m) || ((_d = m.location) === null || _d === void 0 ? void 0 : _d.uri.toString()) !== uriStr) {
                                    continue;
                                }
                                // Only add one message per line number. Overlapping messages
                                // don't appear well, and the peek will show all of them (#134129)
                                const line = m.location.range.startLineNumber;
                                if (messageLines.has(line)) {
                                    continue;
                                }
                                messageLines.add(line);
                                const previous = lastDecorations.findOnLine(line, l => l instanceof TestMessageDecoration && l.testMessage === m);
                                if (previous) {
                                    newDecorations.push(previous);
                                    continue;
                                }
                                const messageUri = (0, testingUri_1.buildTestUri)({
                                    type: 1 /* TestUriType.ResultActualOutput */,
                                    messageIndex: i,
                                    taskIndex: taskId,
                                    resultId: lastResult.id,
                                    testExtId: test.item.extId,
                                });
                                newDecorations.push(this.instantiationService.createInstance(TestMessageDecoration, m, messageUri, model));
                            }
                        }
                    }
                }
                const saveFromRemoval = new Set();
                for (const decoration of newDecorations.value) {
                    if (decoration.id === '') {
                        decoration.id = accessor.addDecoration(decoration.editorDecoration.range, decoration.editorDecoration.options);
                    }
                    else {
                        saveFromRemoval.add(decoration.id);
                    }
                }
                for (const decoration of lastDecorations.value) {
                    if (!saveFromRemoval.has(decoration.id)) {
                        accessor.removeDecoration(decoration.id);
                    }
                }
                this.decorationCache.set(model.uri, {
                    generation: this.generation,
                    testRangesUpdated: false,
                    value: newDecorations,
                });
            });
            return newDecorations;
        }
    };
    TestingDecorationService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, testService_1.ITestService),
        __param(3, testResultService_1.ITestResultService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, model_2.IModelService)
    ], TestingDecorationService);
    exports.TestingDecorationService = TestingDecorationService;
    let TestingDecorations = class TestingDecorations extends lifecycle_1.Disposable {
        constructor(editor, codeEditorService, testService, decorations, uriIdentityService) {
            var _a;
            super();
            this.editor = editor;
            this.codeEditorService = codeEditorService;
            this.testService = testService;
            this.decorations = decorations;
            this.uriIdentityService = uriIdentityService;
            this.expectedWidget = new lifecycle_1.MutableDisposable();
            this.actualWidget = new lifecycle_1.MutableDisposable();
            codeEditorService.registerDecorationType('test-message-decoration', TestMessageDecoration.decorationId, {}, undefined, editor);
            this.attachModel((_a = editor.getModel()) === null || _a === void 0 ? void 0 : _a.uri);
            this._register(decorations.onDidChange(() => {
                if (this.currentUri) {
                    decorations.syncDecorations(this.currentUri);
                }
            }));
            this._register(this.editor.onDidChangeModel(e => this.attachModel(e.newModelUrl || undefined)));
            this._register(this.editor.onMouseDown(e => {
                var _a, _b, _c;
                if (e.target.position && this.currentUri) {
                    const modelDecorations = (_b = (_a = editor.getModel()) === null || _a === void 0 ? void 0 : _a.getDecorationsInRange(range_1.Range.fromPositions(e.target.position))) !== null && _b !== void 0 ? _b : [];
                    for (const { id } of modelDecorations) {
                        const cache = decorations.syncDecorations(this.currentUri);
                        if ((_c = cache.get(id)) === null || _c === void 0 ? void 0 : _c.click(e)) {
                            e.event.stopPropagation();
                            return;
                        }
                    }
                }
            }));
            this._register(this.editor.onDidChangeModelContent(e => {
                const model = editor.getModel();
                if (!this.currentUri || !model) {
                    return;
                }
                const currentDecorations = decorations.syncDecorations(this.currentUri);
                for (const change of e.changes) {
                    const modelDecorations = model.getLinesDecorations(change.range.startLineNumber, change.range.endLineNumber);
                    for (const { id } of modelDecorations) {
                        const decoration = currentDecorations.get(id);
                        if (decoration instanceof TestMessageDecoration) {
                            decorations.invalidateResultMessage(decoration.testMessage);
                        }
                    }
                }
            }));
            const updateFontFamilyVar = () => {
                this.editor.getContainerDomNode().style.setProperty('--testMessageDecorationFontFamily', editor.getOption(43 /* EditorOption.fontFamily */));
                this.editor.getContainerDomNode().style.setProperty('--testMessageDecorationFontSize', `${editor.getOption(46 /* EditorOption.fontSize */)}px`);
            };
            this._register(this.editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(43 /* EditorOption.fontFamily */)) {
                    updateFontFamilyVar();
                }
            }));
            updateFontFamilyVar();
        }
        /**
         * Gets the decorations associated with the given code editor.
         */
        static get(editor) {
            return editor.getContribution("editor.contrib.testingDecorations" /* Testing.DecorationsContributionId */);
        }
        attachModel(uri) {
            var _a;
            switch (uri && ((_a = (0, testingUri_1.parseTestUri)(uri)) === null || _a === void 0 ? void 0 : _a.type)) {
                case 2 /* TestUriType.ResultExpectedOutput */:
                    this.expectedWidget.value = new ExpectedLensContentWidget(this.editor);
                    this.actualWidget.clear();
                    break;
                case 1 /* TestUriType.ResultActualOutput */:
                    this.expectedWidget.clear();
                    this.actualWidget.value = new ActualLensContentWidget(this.editor);
                    break;
                default:
                    this.expectedWidget.clear();
                    this.actualWidget.clear();
            }
            if (isOriginalInDiffEditor(this.codeEditorService, this.editor)) {
                uri = undefined;
            }
            this.currentUri = uri;
            if (!uri) {
                return;
            }
            this.decorations.syncDecorations(uri);
            (async () => {
                var e_1, _a;
                try {
                    for (var _b = __asyncValues((0, testService_1.testsInFile)(this.testService.collection, this.uriIdentityService, uri)), _c; _c = await _b.next(), !_c.done;) {
                        const _test = _c.value;
                        // consume the iterator so that all tests in the file get expanded. Or
                        // at least until the URI changes. If new items are requested, changes
                        // will be trigged in the `onDidProcessDiff` callback.
                        if (this.currentUri !== uri) {
                            break;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            })();
        }
    };
    TestingDecorations = __decorate([
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, testService_1.ITestService),
        __param(3, testingDecorations_1.ITestingDecorationsService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], TestingDecorations);
    exports.TestingDecorations = TestingDecorations;
    const firstLineRange = (originalRange) => ({
        startLineNumber: originalRange.startLineNumber,
        endLineNumber: originalRange.startLineNumber,
        startColumn: 0,
        endColumn: 1,
    });
    const createRunTestDecoration = (tests, states, visible) => {
        var _a, _b;
        const range = (_a = tests[0]) === null || _a === void 0 ? void 0 : _a.item.range;
        if (!range) {
            throw new Error('Test decorations can only be created for tests with a range');
        }
        if (!visible) {
            return { range: firstLineRange(range), options: { isWholeLine: true, description: 'run-test-decoration' } };
        }
        let computedState = 0 /* TestResultState.Unset */;
        let hoverMessageParts = [];
        let testIdWithMessages;
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const resultItem = states[i];
            const state = (_b = resultItem === null || resultItem === void 0 ? void 0 : resultItem.computedState) !== null && _b !== void 0 ? _b : 0 /* TestResultState.Unset */;
            if (hoverMessageParts.length < 10) {
                hoverMessageParts.push((0, constants_1.labelForTestInState)(test.item.label, state));
            }
            computedState = (0, testingStates_1.maxPriority)(computedState, state);
            if (!testIdWithMessages && (resultItem === null || resultItem === void 0 ? void 0 : resultItem.tasks.some(t => t.messages.length))) {
                testIdWithMessages = test.item.extId;
            }
        }
        const hasMultipleTests = tests.length > 1 || tests[0].children.size > 0;
        const icon = computedState === 0 /* TestResultState.Unset */
            ? (hasMultipleTests ? icons_1.testingRunAllIcon : icons_1.testingRunIcon)
            : icons_1.testingStatesToIcons.get(computedState);
        let hoverMessage;
        let glyphMarginClassName = themeService_1.ThemeIcon.asClassName(icon) + ' testing-run-glyph';
        return {
            range: firstLineRange(range),
            options: {
                description: 'run-test-decoration',
                isWholeLine: true,
                get hoverMessage() {
                    if (!hoverMessage) {
                        const building = hoverMessage = new htmlContent_1.MarkdownString('', true).appendText(hoverMessageParts.join(', ') + '.');
                        if (testIdWithMessages) {
                            const args = encodeURIComponent(JSON.stringify([testIdWithMessages]));
                            building.appendMarkdown(`[${(0, nls_1.localize)('peekTestOutout', 'Peek Test Output')}](command:vscode.peekTestError?${args})`);
                        }
                    }
                    return hoverMessage;
                },
                glyphMarginClassName,
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            }
        };
    };
    var LensContentWidgetVars;
    (function (LensContentWidgetVars) {
        LensContentWidgetVars["FontFamily"] = "testingDiffLensFontFamily";
        LensContentWidgetVars["FontFeatures"] = "testingDiffLensFontFeatures";
    })(LensContentWidgetVars || (LensContentWidgetVars = {}));
    class TitleLensContentWidget {
        constructor(editor) {
            this.editor = editor;
            /** @inheritdoc */
            this.allowEditorOverflow = false;
            /** @inheritdoc */
            this.suppressMouseDown = true;
            this._domNode = dom.$('span');
            queueMicrotask(() => {
                this.applyStyling();
                this.editor.addContentWidget(this);
            });
        }
        applyStyling() {
            var _a;
            let fontSize = this.editor.getOption(16 /* EditorOption.codeLensFontSize */);
            let height;
            if (!fontSize || fontSize < 5) {
                fontSize = (this.editor.getOption(46 /* EditorOption.fontSize */) * .9) | 0;
                height = this.editor.getOption(59 /* EditorOption.lineHeight */);
            }
            else {
                height = (fontSize * Math.max(1.3, this.editor.getOption(59 /* EditorOption.lineHeight */) / this.editor.getOption(46 /* EditorOption.fontSize */))) | 0;
            }
            const editorFontInfo = this.editor.getOption(44 /* EditorOption.fontInfo */);
            const node = this._domNode;
            node.classList.add('testing-diff-lens-widget');
            node.textContent = this.getText();
            node.style.lineHeight = `${height}px`;
            node.style.fontSize = `${fontSize}px`;
            node.style.fontFamily = `var(--${"testingDiffLensFontFamily" /* LensContentWidgetVars.FontFamily */})`;
            node.style.fontFeatureSettings = `var(--${"testingDiffLensFontFeatures" /* LensContentWidgetVars.FontFeatures */})`;
            const containerStyle = this.editor.getContainerDomNode().style;
            containerStyle.setProperty("testingDiffLensFontFamily" /* LensContentWidgetVars.FontFamily */, (_a = this.editor.getOption(15 /* EditorOption.codeLensFontFamily */)) !== null && _a !== void 0 ? _a : 'inherit');
            containerStyle.setProperty("testingDiffLensFontFeatures" /* LensContentWidgetVars.FontFeatures */, editorFontInfo.fontFeatureSettings);
            this.editor.changeViewZones(accessor => {
                if (this.viewZoneId) {
                    accessor.removeZone(this.viewZoneId);
                }
                this.viewZoneId = accessor.addZone({
                    afterLineNumber: 0,
                    afterColumn: 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                    domNode: document.createElement('div'),
                    heightInPx: 20,
                });
            });
        }
        /** @inheritdoc */
        getDomNode() {
            return this._domNode;
        }
        /** @inheritdoc */
        dispose() {
            this.editor.changeViewZones(accessor => {
                if (this.viewZoneId) {
                    accessor.removeZone(this.viewZoneId);
                }
            });
            this.editor.removeContentWidget(this);
        }
        /** @inheritdoc */
        getPosition() {
            return {
                position: { column: 0, lineNumber: 0 },
                preference: [1 /* ContentWidgetPositionPreference.ABOVE */],
            };
        }
    }
    class ExpectedLensContentWidget extends TitleLensContentWidget {
        getId() {
            return 'expectedTestingLens';
        }
        getText() {
            return (0, nls_1.localize)('expected.title', 'Expected');
        }
    }
    class ActualLensContentWidget extends TitleLensContentWidget {
        getId() {
            return 'actualTestingLens';
        }
        getText() {
            return (0, nls_1.localize)('actual.title', 'Actual');
        }
    }
    let RunTestDecoration = class RunTestDecoration {
        constructor(tests, visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfileService, contextKeyService, menuService) {
            this.tests = tests;
            this.visible = visible;
            this.model = model;
            this.codeEditorService = codeEditorService;
            this.testService = testService;
            this.contextMenuService = contextMenuService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.testProfileService = testProfileService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            /** @inheritdoc */
            this.id = '';
            this.editorDecoration = createRunTestDecoration(tests.map(t => t.test), tests.map(t => t.resultItem), visible);
            this.editorDecoration.options.glyphMarginHoverMessage = new htmlContent_1.MarkdownString().appendText(this.getGutterLabel());
        }
        get line() {
            return this.editorDecoration.range.startLineNumber;
        }
        /** @inheritdoc */
        click(e) {
            if (e.target.type !== 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */) {
                return false;
            }
            if (e.event.rightButton) {
                this.showContextMenu(e);
                return true;
            }
            switch ((0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */)) {
                case "contextMenu" /* DefaultGutterClickAction.ContextMenu */:
                    this.showContextMenu(e);
                    break;
                case "debug" /* DefaultGutterClickAction.Debug */:
                    this.defaultDebug();
                    break;
                case "run" /* DefaultGutterClickAction.Run */:
                default:
                    this.defaultRun();
                    break;
            }
            return true;
        }
        /**
         * Updates the decoration to match the new set of tests.
         * @returns true if options were changed, false otherwise
         */
        replaceOptions(newTests, visible) {
            if (visible === this.visible
                && (0, arrays_1.equals)(this.tests.map(t => t.test.item.extId), newTests.map(t => t.test.item.extId))
                && this.tests.map(t => { var _a; return (_a = t.resultItem) === null || _a === void 0 ? void 0 : _a.computedState; }) === newTests.map(t => { var _a; return (_a = t.resultItem) === null || _a === void 0 ? void 0 : _a.computedState; })) {
                return false;
            }
            this.tests = newTests;
            this.visible = visible;
            this.editorDecoration.options = createRunTestDecoration(newTests.map(t => t.test), newTests.map(t => t.resultItem), visible).options;
            return true;
        }
        /**
         * Gets whether this decoration serves as the run button for the given test ID.
         */
        isForTest(testId) {
            return this.tests.some(t => t.test.item.extId === testId);
        }
        defaultRun() {
            return this.testService.runTests({
                tests: this.tests.map(({ test }) => test),
                group: 2 /* TestRunProfileBitset.Run */,
            });
        }
        defaultDebug() {
            return this.testService.runTests({
                tests: this.tests.map(({ test }) => test),
                group: 4 /* TestRunProfileBitset.Debug */,
            });
        }
        showContextMenu(e) {
            let actions = this.getContextMenuActions();
            const editor = this.codeEditorService.listCodeEditors().find(e => e.getModel() === this.model);
            if (editor) {
                const contribution = editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID);
                if (contribution) {
                    actions = {
                        dispose: actions.dispose,
                        object: actions_1.Separator.join(actions.object, contribution.getContextMenuActionsAtPosition(this.line, this.model))
                    };
                }
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => ({ x: e.event.posx, y: e.event.posy }),
                getActions: () => actions.object,
                onHide: () => actions.dispose,
            });
        }
        getGutterLabel() {
            switch ((0, configuration_2.getTestingConfiguration)(this.configurationService, "testing.defaultGutterClickAction" /* TestingConfigKeys.DefaultGutterClickAction */)) {
                case "contextMenu" /* DefaultGutterClickAction.ContextMenu */:
                    return (0, nls_1.localize)('testing.gutterMsg.contextMenu', 'Click for test options');
                case "debug" /* DefaultGutterClickAction.Debug */:
                    return (0, nls_1.localize)('testing.gutterMsg.debug', 'Click to debug tests, right click for more options');
                case "run" /* DefaultGutterClickAction.Run */:
                default:
                    return (0, nls_1.localize)('testing.gutterMsg.run', 'Click to run tests, right click for more options');
            }
        }
        /**
         * Gets context menu actions relevant for a singel test.
         */
        getTestContextMenuActions(test, resultItem) {
            const testActions = [];
            const capabilities = this.testProfileService.capabilitiesForTest(test);
            if (capabilities & 2 /* TestRunProfileBitset.Run */) {
                testActions.push(new actions_1.Action('testing.gutter.run', (0, nls_1.localize)('run test', 'Run Test'), undefined, undefined, () => this.testService.runTests({
                    group: 2 /* TestRunProfileBitset.Run */,
                    tests: [test],
                })));
            }
            if (capabilities & 4 /* TestRunProfileBitset.Debug */) {
                testActions.push(new actions_1.Action('testing.gutter.debug', (0, nls_1.localize)('debug test', 'Debug Test'), undefined, undefined, () => this.testService.runTests({
                    group: 4 /* TestRunProfileBitset.Debug */,
                    tests: [test],
                })));
            }
            if (capabilities & 16 /* TestRunProfileBitset.HasNonDefaultProfile */) {
                testActions.push(new actions_1.Action('testing.runUsing', (0, nls_1.localize)('testing.runUsing', 'Execute Using Profile...'), undefined, undefined, async () => {
                    const profile = await this.commandService.executeCommand('vscode.pickTestProfile', { onlyForTest: test });
                    if (!profile) {
                        return;
                    }
                    this.testService.runResolvedTests({
                        targets: [{
                                profileGroup: profile.group,
                                profileId: profile.profileId,
                                controllerId: profile.controllerId,
                                testIds: [test.item.extId]
                            }]
                    });
                }));
            }
            if (resultItem && (0, testingStates_1.isFailedState)(resultItem.computedState)) {
                testActions.push(new actions_1.Action('testing.gutter.peekFailure', (0, nls_1.localize)('peek failure', 'Peek Error'), undefined, undefined, () => this.commandService.executeCommand('vscode.peekTestError', test.item.extId)));
            }
            testActions.push(new actions_1.Action('testing.gutter.reveal', (0, nls_1.localize)('reveal test', 'Reveal in Test Explorer'), undefined, undefined, () => this.commandService.executeCommand('_revealTestInExplorer', test.item.extId)));
            const contributed = this.getContributedTestActions(test, capabilities);
            return { object: actions_1.Separator.join(testActions, contributed.object), dispose: contributed.dispose };
        }
        getContributedTestActions(test, capabilities) {
            const contextOverlay = this.contextKeyService.createOverlay((0, testItemContextOverlay_1.getTestItemContextOverlay)(test, capabilities));
            const menu = this.menuService.createMenu(actions_2.MenuId.TestItemGutter, contextOverlay);
            try {
                const target = [];
                const arg = (0, testService_1.getContextForTestItem)(this.testService.collection, test.item.extId);
                const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true, arg }, target);
                return { object: target, dispose: () => actionsDisposable.dispose };
            }
            finally {
                menu.dispose();
            }
        }
    };
    RunTestDecoration = __decorate([
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, testService_1.ITestService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, commands_1.ICommandService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, testProfileService_1.ITestProfileService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, actions_2.IMenuService)
    ], RunTestDecoration);
    class MultiRunTestDecoration extends RunTestDecoration {
        get testIds() {
            return this.tests.map(t => t.test.item.extId);
        }
        get displayedStates() {
            return this.tests.map(t => { var _a; return (_a = t.resultItem) === null || _a === void 0 ? void 0 : _a.computedState; });
        }
        getContextMenuActions() {
            const allActions = [];
            if (this.tests.some(({ test }) => this.testProfileService.capabilitiesForTest(test) & 2 /* TestRunProfileBitset.Run */)) {
                allActions.push(new actions_1.Action('testing.gutter.runAll', (0, nls_1.localize)('run all test', 'Run All Tests'), undefined, undefined, () => this.defaultRun()));
            }
            if (this.tests.some(({ test }) => this.testProfileService.capabilitiesForTest(test) & 4 /* TestRunProfileBitset.Debug */)) {
                allActions.push(new actions_1.Action('testing.gutter.debugAll', (0, nls_1.localize)('debug all test', 'Debug All Tests'), undefined, undefined, () => this.defaultDebug()));
            }
            const disposable = new lifecycle_1.DisposableStore();
            const testSubmenus = this.tests.map(({ test, resultItem }) => {
                const actions = this.getTestContextMenuActions(test, resultItem);
                disposable.add(actions);
                return new actions_1.SubmenuAction(test.item.extId, test.item.label, actions.object);
            });
            return { object: actions_1.Separator.join(allActions, testSubmenus), dispose: () => disposable.dispose() };
        }
    }
    let RunSingleTestDecoration = class RunSingleTestDecoration extends RunTestDecoration {
        constructor(test, resultItem, model, visible, codeEditorService, testService, commandService, contextMenuService, configurationService, testProfiles, contextKeyService, menuService) {
            super([{ test, resultItem }], visible, model, codeEditorService, testService, contextMenuService, commandService, configurationService, testProfiles, contextKeyService, menuService);
        }
        getContextMenuActions() {
            return this.getTestContextMenuActions(this.tests[0].test, this.tests[0].resultItem);
        }
    };
    RunSingleTestDecoration = __decorate([
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, testService_1.ITestService),
        __param(6, commands_1.ICommandService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, testProfileService_1.ITestProfileService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, actions_2.IMenuService)
    ], RunSingleTestDecoration);
    const lineBreakRe = /\r?\n\s*/g;
    let TestMessageDecoration = class TestMessageDecoration {
        constructor(testMessage, messageUri, textModel, peekOpener, editorService) {
            this.testMessage = testMessage;
            this.messageUri = messageUri;
            this.peekOpener = peekOpener;
            this.id = '';
            this.contentIdClass = `test-message-inline-content-id${(0, uuid_1.generateUuid)()}`;
            this.location = testMessage.location;
            this.line = this.location.range.startLineNumber;
            const severity = testMessage.type;
            const message = typeof testMessage.message === 'string' ? (0, strings_1.removeAnsiEscapeCodes)(testMessage.message) : testMessage.message;
            const options = editorService.resolveDecorationOptions(TestMessageDecoration.decorationId, true);
            options.hoverMessage = typeof message === 'string' ? new htmlContent_1.MarkdownString().appendText(message) : message;
            options.zIndex = 10; // todo: in spite of the z-index, this appears behind gitlens
            options.className = `testing-inline-message-severity-${severity}`;
            options.isWholeLine = true;
            options.stickiness = 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */;
            options.collapseOnReplaceEdit = true;
            let inlineText = (0, markdownRenderer_1.renderStringAsPlaintext)(message).replace(lineBreakRe, ' ');
            if (inlineText.length > MAX_INLINE_MESSAGE_LENGTH) {
                inlineText = inlineText.slice(0, MAX_INLINE_MESSAGE_LENGTH - 1) + '…';
            }
            options.after = {
                content: ' '.repeat(4) + inlineText,
                inlineClassName: `test-message-inline-content test-message-inline-content-s${severity} ${this.contentIdClass} ${messageUri ? 'test-message-inline-content-clickable' : ''}`
            };
            options.showIfCollapsed = true;
            const rulerColor = severity === 0 /* TestMessageType.Error */
                ? editorColorRegistry_1.overviewRulerError
                : editorColorRegistry_1.overviewRulerInfo;
            if (rulerColor) {
                options.overviewRuler = { color: (0, themeService_1.themeColorFromId)(rulerColor), position: model_1.OverviewRulerLane.Right };
            }
            const lineLength = textModel.getLineLength(this.location.range.startLineNumber);
            const column = lineLength ? (lineLength + 1) : this.location.range.endColumn;
            this.editorDecoration = {
                options,
                range: {
                    startLineNumber: this.location.range.startLineNumber,
                    startColumn: column,
                    endColumn: column,
                    endLineNumber: this.location.range.startLineNumber,
                }
            };
        }
        click(e) {
            var _a;
            if (e.event.rightButton) {
                return false;
            }
            if (!this.messageUri) {
                return false;
            }
            if ((_a = e.target.element) === null || _a === void 0 ? void 0 : _a.className.includes(this.contentIdClass)) {
                this.peekOpener.peekUri(this.messageUri);
            }
            return false;
        }
    };
    TestMessageDecoration.inlineClassName = 'test-message-inline-content';
    TestMessageDecoration.decorationId = `testmessage-${(0, uuid_1.generateUuid)()}`;
    TestMessageDecoration = __decorate([
        __param(3, testingPeekOpener_1.ITestingPeekOpener),
        __param(4, codeEditorService_1.ICodeEditorService)
    ], TestMessageDecoration);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const codeLensForeground = theme.getColor(editorColorRegistry_1.editorCodeLensForeground);
        if (codeLensForeground) {
            collector.addRule(`.testing-diff-lens-widget { color: ${codeLensForeground}; }`);
        }
        for (const [severity, { decorationForeground }] of Object.entries(theme_1.testMessageSeverityColors)) {
            collector.addRule(`.test-message-inline-content-s${severity} { color: ${theme.getColor(decorationForeground)} !important }`);
        }
    });
});
//# sourceMappingURL=testingDecorations.js.map