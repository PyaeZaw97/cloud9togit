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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/markdownRenderer", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/ui/splitview/splitview", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/strings", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/services/resolverService", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/labels", "vs/workbench/common/actions", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/testing/browser/explorerProjections/display", "vs/workbench/contrib/testing/browser/explorerProjections/testItemContextOverlay", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testingOutputTerminalService", "vs/workbench/contrib/testing/browser/theme", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/observableValue", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testingUri", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/services/editor/common/editorService"], function (require, exports, dom, markdownRenderer_1, actionbar_1, aria_1, scrollableElement_1, splitview_1, actions_1, async_1, codicons_1, color_1, event_1, iterator_1, lazy_1, lifecycle_1, numbers_1, strings_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, embeddedCodeEditorWidget_1, range_1, editorContextKeys_1, resolverService_1, markdownRenderer_2, peekView_1, nls_1, menuEntryActionViewItem_1, actions_2, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, listService_1, storage_1, colorRegistry_1, themeService_1, labels_1, actions_3, editorModel_1, display_1, testItemContextOverlay_1, icons, testingOutputTerminalService_1, theme_1, configuration_2, observableValue_1, storedValue_1, testExplorerFilterState_1, testingContextKeys_1, testingStates_1, testingUri_1, testProfileService_1, testResult_1, testResultService_1, testService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleTestingPeekHistory = exports.OpenMessageInEditorAction = exports.GoToPreviousMessageAction = exports.GoToNextMessageAction = exports.TestCaseElement = exports.TestResultElement = exports.CloseTestPeek = exports.TestingOutputPeekController = exports.TestingPeekOpener = void 0;
    class TestDto {
        constructor(resultId, test, taskIndex, messageIndex) {
            var _a;
            this.resultId = resultId;
            this.taskIndex = taskIndex;
            this.messageIndex = messageIndex;
            this.test = test.item;
            this.messages = test.tasks[taskIndex].messages;
            this.messageIndex = messageIndex;
            const parts = { messageIndex, resultId, taskIndex, testExtId: test.item.extId };
            this.expectedUri = (0, testingUri_1.buildTestUri)(Object.assign(Object.assign({}, parts), { type: 2 /* TestUriType.ResultExpectedOutput */ }));
            this.actualUri = (0, testingUri_1.buildTestUri)(Object.assign(Object.assign({}, parts), { type: 1 /* TestUriType.ResultActualOutput */ }));
            this.messageUri = (0, testingUri_1.buildTestUri)(Object.assign(Object.assign({}, parts), { type: 0 /* TestUriType.ResultMessage */ }));
            const message = this.messages[this.messageIndex];
            this.revealLocation = (_a = message.location) !== null && _a !== void 0 ? _a : (test.item.uri && test.item.range ? { uri: test.item.uri, range: range_1.Range.lift(test.item.range) } : undefined);
        }
        get isDiffable() {
            const message = this.messages[this.messageIndex];
            return message.type === 0 /* TestMessageType.Error */ && isDiffable(message);
        }
    }
    /** Iterates through every message in every result */
    function* allMessages(results) {
        for (const result of results) {
            for (const test of result.tests) {
                for (let taskIndex = 0; taskIndex < test.tasks.length; taskIndex++) {
                    for (let messageIndex = 0; messageIndex < test.tasks[taskIndex].messages.length; messageIndex++) {
                        yield { result, test, taskIndex, messageIndex };
                    }
                }
            }
        }
    }
    let TestingPeekOpener = class TestingPeekOpener extends lifecycle_1.Disposable {
        constructor(configuration, editorService, codeEditorService, testResults, testService) {
            super();
            this.configuration = configuration;
            this.editorService = editorService;
            this.codeEditorService = codeEditorService;
            this.testResults = testResults;
            this.testService = testService;
            this._register(testResults.onTestChanged(this.openPeekOnFailure, this));
        }
        /** @inheritdoc */
        async open() {
            var _a, _b;
            let uri;
            const active = this.editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(active) && ((_a = active.getModel()) === null || _a === void 0 ? void 0 : _a.uri)) {
                const modelUri = (_b = active.getModel()) === null || _b === void 0 ? void 0 : _b.uri;
                if (modelUri) {
                    uri = await this.getFileCandidateMessage(modelUri, active.getPosition());
                }
            }
            if (!uri) {
                uri = this.lastUri;
            }
            if (!uri) {
                uri = this.getAnyCandidateMessage();
            }
            if (!uri) {
                return false;
            }
            return this.showPeekFromUri(uri);
        }
        /** @inheritdoc */
        tryPeekFirstError(result, test, options) {
            const candidate = this.getFailedCandidateMessage(test);
            if (!candidate) {
                return false;
            }
            const message = candidate.message;
            this.showPeekFromUri({
                type: 0 /* TestUriType.ResultMessage */,
                documentUri: message.location.uri,
                taskIndex: candidate.taskId,
                messageIndex: candidate.index,
                resultId: result.id,
                testExtId: test.item.extId,
            }, Object.assign({ selection: message.location.range }, options));
            return true;
        }
        /** @inheritdoc */
        peekUri(uri, options) {
            var _a;
            const parsed = (0, testingUri_1.parseTestUri)(uri);
            const result = parsed && this.testResults.getResult(parsed.resultId);
            if (!parsed || !result) {
                return false;
            }
            const message = (_a = result.getStateById(parsed.testExtId)) === null || _a === void 0 ? void 0 : _a.tasks[parsed.taskIndex].messages[parsed.messageIndex];
            if (!(message === null || message === void 0 ? void 0 : message.location)) {
                return false;
            }
            this.showPeekFromUri({
                type: 0 /* TestUriType.ResultMessage */,
                documentUri: message.location.uri,
                taskIndex: parsed.taskIndex,
                messageIndex: parsed.messageIndex,
                resultId: result.id,
                testExtId: parsed.testExtId,
            }, Object.assign({ selection: message.location.range }, options));
            return true;
        }
        /** @inheritdoc */
        closeAllPeeks() {
            var _a;
            for (const editor of this.codeEditorService.listCodeEditors()) {
                (_a = TestingOutputPeekController.get(editor)) === null || _a === void 0 ? void 0 : _a.removePeek();
            }
        }
        /** @inheritdoc */
        async showPeekFromUri(uri, options) {
            var _a;
            const pane = await this.editorService.openEditor({
                resource: uri.documentUri,
                options: Object.assign({ revealIfOpened: true }, options)
            });
            const control = pane === null || pane === void 0 ? void 0 : pane.getControl();
            if (!(0, editorBrowser_1.isCodeEditor)(control)) {
                return false;
            }
            this.lastUri = uri;
            (_a = TestingOutputPeekController.get(control)) === null || _a === void 0 ? void 0 : _a.show((0, testingUri_1.buildTestUri)(this.lastUri));
            return true;
        }
        /**
         * Opens the peek view on a test failure, based on user preferences.
         */
        openPeekOnFailure(evt) {
            if (evt.reason !== 1 /* TestResultItemChangeReason.OwnStateChange */) {
                return;
            }
            const candidate = this.getFailedCandidateMessage(evt.item);
            if (!candidate) {
                return;
            }
            if (evt.result.request.isAutoRun && !(0, configuration_2.getTestingConfiguration)(this.configuration, "testing.automaticallyOpenPeekViewDuringAutoRun" /* TestingConfigKeys.AutoOpenPeekViewDuringAutoRun */)) {
                return;
            }
            const editors = this.codeEditorService.listCodeEditors();
            const cfg = (0, configuration_2.getTestingConfiguration)(this.configuration, "testing.automaticallyOpenPeekView" /* TestingConfigKeys.AutoOpenPeekView */);
            // don't show the peek if the user asked to only auto-open peeks for visible tests,
            // and this test is not in any of the editors' models.
            switch (cfg) {
                case "failureInVisibleDocument" /* AutoOpenPeekViewWhen.FailureVisible */: {
                    const editorUris = new Set(editors.map(e => { var _a; return (_a = e.getModel()) === null || _a === void 0 ? void 0 : _a.uri.toString(); }));
                    if (!iterator_1.Iterable.some((0, testResult_1.resultItemParents)(evt.result, evt.item), i => i.item.uri && editorUris.has(i.item.uri.toString()))) {
                        return;
                    }
                    break; //continue
                }
                case "failureAnywhere" /* AutoOpenPeekViewWhen.FailureAnywhere */:
                    break; //continue
                default:
                    return; // never show
            }
            const controllers = editors.map(TestingOutputPeekController.get);
            if (controllers.some(c => c === null || c === void 0 ? void 0 : c.isVisible)) {
                return;
            }
            this.tryPeekFirstError(evt.result, evt.item);
        }
        /**
         * Gets the message closest to the given position from a test in the file.
         */
        async getFileCandidateMessage(uri, position) {
            let best;
            let bestDistance = Infinity;
            // Get all tests for the document. In those, find one that has a test
            // message closest to the cursor position.
            const demandedUriStr = uri.toString();
            for (const test of this.testService.collection.all) {
                const result = this.testResults.getStateById(test.item.extId);
                if (!result) {
                    continue;
                }
                mapFindTestMessage(result[1], (_task, message, messageIndex, taskIndex) => {
                    if (!message.location || message.location.uri.toString() !== demandedUriStr) {
                        return;
                    }
                    const distance = position ? Math.abs(position.lineNumber - message.location.range.startLineNumber) : 0;
                    if (!best || distance <= bestDistance) {
                        bestDistance = distance;
                        best = {
                            type: 0 /* TestUriType.ResultMessage */,
                            testExtId: result[1].item.extId,
                            resultId: result[0].id,
                            taskIndex,
                            messageIndex,
                            documentUri: uri,
                        };
                    }
                });
            }
            return best;
        }
        /**
         * Gets any possible still-relevant message from the results.
         */
        getAnyCandidateMessage() {
            const seen = new Set();
            for (const result of this.testResults.results) {
                for (const test of result.tests) {
                    if (seen.has(test.item.extId)) {
                        continue;
                    }
                    seen.add(test.item.extId);
                    const found = mapFindTestMessage(test, (task, message, messageIndex, taskIndex) => (message.location && {
                        type: 0 /* TestUriType.ResultMessage */,
                        testExtId: test.item.extId,
                        resultId: result.id,
                        taskIndex,
                        messageIndex,
                        documentUri: message.location.uri,
                    }));
                    if (found) {
                        return found;
                    }
                }
            }
            return undefined;
        }
        /**
         * Gets the first failed message that can be displayed from the result.
         */
        getFailedCandidateMessage(test) {
            let best;
            mapFindTestMessage(test, (task, message, messageIndex, taskId) => {
                if (!(0, testingStates_1.isFailedState)(task.state) || !message.location) {
                    return;
                }
                if (best && message.type !== 0 /* TestMessageType.Error */) {
                    return;
                }
                best = { taskId, index: messageIndex, message };
            });
            return best;
        }
    };
    TestingPeekOpener = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, testResultService_1.ITestResultService),
        __param(4, testService_1.ITestService)
    ], TestingPeekOpener);
    exports.TestingPeekOpener = TestingPeekOpener;
    const mapFindTestMessage = (test, fn) => {
        for (let taskIndex = 0; taskIndex < test.tasks.length; taskIndex++) {
            const task = test.tasks[taskIndex];
            for (let messageIndex = 0; messageIndex < task.messages.length; messageIndex++) {
                const r = fn(task, task.messages[messageIndex], messageIndex, taskIndex);
                if (r !== undefined) {
                    return r;
                }
            }
        }
        return undefined;
    };
    /**
     * Adds output/message peek functionality to code editors.
     */
    let TestingOutputPeekController = class TestingOutputPeekController extends lifecycle_1.Disposable {
        constructor(editor, editorService, codeEditorService, instantiationService, testResults, storageService, contextKeyService, commandService) {
            super();
            this.editor = editor;
            this.editorService = editorService;
            this.codeEditorService = codeEditorService;
            this.instantiationService = instantiationService;
            this.testResults = testResults;
            this.storageService = storageService;
            this.commandService = commandService;
            /**
             * Currently-shown peek view.
             */
            this.peek = this._register(new lifecycle_1.MutableDisposable());
            /**
             * Whether the history part of the peek view should be visible.
             */
            this.historyVisible = observableValue_1.MutableObservableValue.stored(new storedValue_1.StoredValue({
                key: 'testHistoryVisibleInPeek',
                scope: 0 /* StorageScope.GLOBAL */,
                target: 0 /* StorageTarget.USER */,
            }, this.storageService), true);
            this.visible = testingContextKeys_1.TestingContextKeys.isPeekVisible.bindTo(contextKeyService);
            this._register(editor.onDidChangeModel(() => this.peek.clear()));
            this._register(testResults.onResultsChanged(this.closePeekOnCertainResultEvents, this));
            this._register(testResults.onTestChanged(this.closePeekOnTestChange, this));
        }
        /**
         * Gets the controller associated with the given code editor.
         */
        static get(editor) {
            return editor.getContribution("editor.contrib.testingOutputPeek" /* Testing.OutputPeekContributionId */);
        }
        /**
         * Gets whether a peek is currently shown in the associated editor.
         */
        get isVisible() {
            return this.peek.value;
        }
        /**
         * Toggles peek visibility for the URI.
         */
        toggle(uri) {
            var _a;
            if (((_a = this.currentPeekUri) === null || _a === void 0 ? void 0 : _a.toString()) === uri.toString()) {
                this.peek.clear();
            }
            else {
                this.show(uri);
            }
        }
        openCurrentInEditor() {
            var _a;
            const current = (_a = this.peek.value) === null || _a === void 0 ? void 0 : _a.current;
            if (!current) {
                return;
            }
            const options = { pinned: false, revealIfOpened: true };
            const message = current.messages[current.messageIndex];
            if (current.isDiffable) {
                this.editorService.openEditor({
                    original: { resource: current.expectedUri },
                    modified: { resource: current.actualUri },
                    options,
                });
            }
            else if (typeof message.message === 'string') {
                this.editorService.openEditor({ resource: current.messageUri, options });
            }
            else {
                this.commandService.executeCommand('markdown.showPreview', current.messageUri);
            }
        }
        /**
         * Shows a peek for the message in the editor.
         */
        async show(uri) {
            const dto = this.retrieveTest(uri);
            if (!dto) {
                return;
            }
            const message = dto.messages[dto.messageIndex];
            if (!this.peek.value) {
                this.peek.value = this.instantiationService.createInstance(TestingOutputPeek, this.editor, this.historyVisible);
                this.peek.value.onDidClose(() => {
                    this.visible.set(false);
                    this.currentPeekUri = undefined;
                    this.peek.value = undefined;
                });
                this.visible.set(true);
                this.peek.value.create();
            }
            (0, aria_1.alert)((0, markdownRenderer_1.renderStringAsPlaintext)(message.message));
            this.peek.value.setModel(dto);
            this.currentPeekUri = uri;
        }
        async openAndShow(uri) {
            var _a, _b, _c;
            const dto = this.retrieveTest(uri);
            if (!dto) {
                return;
            }
            if (!dto.revealLocation || dto.revealLocation.uri.toString() === ((_a = this.editor.getModel()) === null || _a === void 0 ? void 0 : _a.uri.toString())) {
                return this.show(uri);
            }
            const otherEditor = await this.codeEditorService.openCodeEditor({
                resource: dto.revealLocation.uri,
                options: { pinned: false, revealIfOpened: true }
            }, this.editor);
            if (otherEditor) {
                (_b = TestingOutputPeekController.get(otherEditor)) === null || _b === void 0 ? void 0 : _b.removePeek();
                return (_c = TestingOutputPeekController.get(otherEditor)) === null || _c === void 0 ? void 0 : _c.show(uri);
            }
        }
        /**
         * Disposes the peek view, if any.
         */
        removePeek() {
            this.peek.clear();
        }
        /**
         * Shows the next message in the peek, if possible.
         */
        next() {
            var _a;
            const dto = (_a = this.peek.value) === null || _a === void 0 ? void 0 : _a.current;
            if (!dto) {
                return;
            }
            let found = false;
            for (const { messageIndex, taskIndex, result, test } of allMessages(this.testResults.results)) {
                if (found) {
                    this.openAndShow((0, testingUri_1.buildTestUri)({
                        type: 0 /* TestUriType.ResultMessage */,
                        messageIndex,
                        taskIndex,
                        resultId: result.id,
                        testExtId: test.item.extId
                    }));
                    return;
                }
                else if (dto.test.extId === test.item.extId && dto.messageIndex === messageIndex && dto.taskIndex === taskIndex && dto.resultId === result.id) {
                    found = true;
                }
            }
        }
        /**
         * Shows the previous message in the peek, if possible.
         */
        previous() {
            var _a;
            const dto = (_a = this.peek.value) === null || _a === void 0 ? void 0 : _a.current;
            if (!dto) {
                return;
            }
            let previous;
            for (const m of allMessages(this.testResults.results)) {
                if (dto.test.extId === m.test.item.extId && dto.messageIndex === m.messageIndex && dto.taskIndex === m.taskIndex && dto.resultId === m.result.id) {
                    if (!previous) {
                        return;
                    }
                    this.openAndShow((0, testingUri_1.buildTestUri)({
                        type: 0 /* TestUriType.ResultMessage */,
                        messageIndex: previous.messageIndex,
                        taskIndex: previous.taskIndex,
                        resultId: previous.result.id,
                        testExtId: previous.test.item.extId
                    }));
                    return;
                }
                previous = m;
            }
        }
        /**
         * Removes the peek view if it's being displayed on the given test ID.
         */
        removeIfPeekingForTest(testId) {
            var _a, _b;
            if (((_b = (_a = this.peek.value) === null || _a === void 0 ? void 0 : _a.current) === null || _b === void 0 ? void 0 : _b.test.extId) === testId) {
                this.peek.clear();
            }
        }
        /**
         * If the test we're currently showing has its state change to something
         * else, then clear the peek.
         */
        closePeekOnTestChange(evt) {
            if (evt.reason !== 1 /* TestResultItemChangeReason.OwnStateChange */ || evt.previousState === evt.item.ownComputedState) {
                return;
            }
            this.removeIfPeekingForTest(evt.item.item.extId);
        }
        closePeekOnCertainResultEvents(evt) {
            if ('started' in evt) {
                this.peek.clear(); // close peek when runs start
            }
            if ('removed' in evt && this.testResults.results.length === 0) {
                this.peek.clear(); // close the peek if results are cleared
            }
        }
        retrieveTest(uri) {
            var _a;
            const parts = (0, testingUri_1.parseTestUri)(uri);
            if (!parts) {
                return undefined;
            }
            const { resultId, testExtId, taskIndex, messageIndex } = parts;
            const test = (_a = this.testResults.getResult(parts.resultId)) === null || _a === void 0 ? void 0 : _a.getStateById(testExtId);
            if (!test || !test.tasks[parts.taskIndex]) {
                return;
            }
            return new TestDto(resultId, test, taskIndex, messageIndex);
        }
    };
    TestingOutputPeekController = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, testResultService_1.ITestResultService),
        __param(5, storage_1.IStorageService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, commands_1.ICommandService)
    ], TestingOutputPeekController);
    exports.TestingOutputPeekController = TestingOutputPeekController;
    let TestingOutputPeek = class TestingOutputPeek extends peekView_1.PeekViewWidget {
        constructor(editor, historyVisible, themeService, peekViewService, contextKeyService, menuService, instantiationService, modelService) {
            super(editor, { showFrame: true, frameWidth: 1, showArrow: true, isResizeable: true, isAccessible: true, className: 'test-output-peek' }, instantiationService);
            this.historyVisible = historyVisible;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.modelService = modelService;
            this.visibilityChange = this._disposables.add(new event_1.Emitter());
            this.didReveal = this._disposables.add(new event_1.Emitter());
            testingContextKeys_1.TestingContextKeys.isInPeek.bindTo(contextKeyService);
            this._disposables.add(themeService.onDidColorThemeChange(this.applyTheme, this));
            this._disposables.add(this.onDidClose(() => this.visibilityChange.fire(false)));
            this.applyTheme(themeService.getColorTheme());
            peekViewService.addExclusiveWidget(editor, this);
        }
        applyTheme(theme) {
            const borderColor = theme.getColor(theme_1.testingPeekBorder) || color_1.Color.transparent;
            const headerBg = theme.getColor(theme_1.testingPeekHeaderBackground) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: headerBg,
                primaryHeadingColor: theme.getColor(peekView_1.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView_1.peekViewTitleInfoForeground)
            });
        }
        _fillHead(container) {
            super._fillHead(container);
            const actions = [];
            const menu = this.menuService.createMenu(actions_2.MenuId.TestPeekTitle, this.contextKeyService);
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, undefined, actions);
            this._actionbarWidget.push(actions, { label: false, icon: true, index: 0 });
            menu.dispose();
        }
        _fillBody(containerElement) {
            const initialSpitWidth = TestingOutputPeek.lastSplitWidth;
            this.splitView = new splitview_1.SplitView(containerElement, { orientation: 1 /* Orientation.HORIZONTAL */ });
            const messageContainer = dom.append(containerElement, dom.$('.test-output-peek-message-container'));
            this.contentProviders = [
                this._disposables.add(this.instantiationService.createInstance(DiffContentProvider, this.editor, messageContainer)),
                this._disposables.add(this.instantiationService.createInstance(MarkdownTestMessagePeek, messageContainer)),
                this._disposables.add(this.instantiationService.createInstance(PlainTextMessagePeek, this.editor, messageContainer)),
            ];
            const treeContainer = dom.append(containerElement, dom.$('.test-output-peek-tree'));
            const tree = this._disposables.add(this.instantiationService.createInstance(OutputPeekTree, this.editor, treeContainer, this.visibilityChange.event, this.didReveal.event));
            this.splitView.addView({
                onDidChange: event_1.Event.None,
                element: messageContainer,
                minimumSize: 200,
                maximumSize: Number.MAX_VALUE,
                layout: width => {
                    TestingOutputPeek.lastSplitWidth = width;
                    if (this.dimension) {
                        for (const provider of this.contentProviders) {
                            provider.layout({ height: this.dimension.height, width });
                        }
                    }
                },
            }, splitview_1.Sizing.Distribute);
            this.splitView.addView({
                onDidChange: event_1.Event.None,
                element: treeContainer,
                minimumSize: 100,
                maximumSize: Number.MAX_VALUE,
                layout: width => {
                    if (this.dimension) {
                        tree.layout(this.dimension.height, width);
                    }
                },
            }, splitview_1.Sizing.Distribute);
            const historyViewIndex = 1;
            this.splitView.setViewVisible(historyViewIndex, this.historyVisible.value);
            this._disposables.add(this.historyVisible.onDidChange(visible => {
                this.splitView.setViewVisible(historyViewIndex, visible);
            }));
            if (initialSpitWidth) {
                queueMicrotask(() => this.splitView.resizeView(0, initialSpitWidth));
            }
        }
        /**
         * Updates the test to be shown.
         */
        setModel(dto) {
            const message = dto.messages[dto.messageIndex];
            const previous = this.current;
            if (!dto.revealLocation && !previous) {
                return Promise.resolve();
            }
            this.current = dto;
            if (!dto.revealLocation) {
                return this.showInPlace(dto);
            }
            this.show(dto.revealLocation.range, TestingOutputPeek.lastHeightInLines || hintMessagePeekHeight(message));
            this.editor.revealPositionNearTop(dto.revealLocation.range.getStartPosition(), 0 /* ScrollType.Smooth */);
            this.editor.focus();
            return this.showInPlace(dto);
        }
        /**
         * Shows a message in-place without showing or changing the peek location.
         * This is mostly used if peeking a message without a location.
         */
        async showInPlace(dto) {
            const message = dto.messages[dto.messageIndex];
            this.setTitle(firstLine((0, markdownRenderer_1.renderStringAsPlaintext)(message.message)), dto.test.label);
            this.didReveal.fire(dto);
            this.visibilityChange.fire(true);
            await Promise.all(this.contentProviders.map(p => p.update(dto, message)));
        }
        _relayout(newHeightInLines) {
            super._relayout(newHeightInLines);
            TestingOutputPeek.lastHeightInLines = newHeightInLines;
        }
        /** @override */
        _doLayoutBody(height, width) {
            super._doLayoutBody(height, width);
            this.dimension = new dom.Dimension(width, height);
            this.splitView.layout(width);
        }
        /** @override */
        _onWidth(width) {
            super._onWidth(width);
            if (this.dimension) {
                this.dimension = new dom.Dimension(width, this.dimension.height);
            }
            this.splitView.layout(width);
        }
    };
    TestingOutputPeek = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, peekView_1.IPeekViewService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, actions_2.IMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, resolverService_1.ITextModelService)
    ], TestingOutputPeek);
    const commonEditorOptions = {
        scrollBeyondLastLine: false,
        links: true,
        scrollbar: {
            verticalScrollbarSize: 14,
            horizontal: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            alwaysConsumeMouseWheel: false
        },
        fixedOverflowWidgets: true,
        readOnly: true,
        minimap: {
            enabled: false
        },
        wordWrap: 'on',
    };
    const diffEditorOptions = Object.assign(Object.assign({}, commonEditorOptions), { enableSplitViewResizing: true, isInEmbeddedEditor: true, renderOverviewRuler: false, ignoreTrimWhitespace: false, renderSideBySide: true, originalAriaLabel: (0, nls_1.localize)('testingOutputExpected', 'Expected result'), modifiedAriaLabel: (0, nls_1.localize)('testingOutputActual', 'Actual result') });
    const isDiffable = (message) => message.type === 0 /* TestMessageType.Error */ && message.actual !== undefined && message.expected !== undefined;
    let DiffContentProvider = class DiffContentProvider extends lifecycle_1.Disposable {
        constructor(editor, container, instantiationService, modelService) {
            super();
            this.editor = editor;
            this.container = container;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.widget = this._register(new lifecycle_1.MutableDisposable());
            this.model = this._register(new lifecycle_1.MutableDisposable());
        }
        async update({ expectedUri, actualUri }, message) {
            if (!isDiffable(message)) {
                return this.clear();
            }
            const [original, modified] = await Promise.all([
                this.modelService.createModelReference(expectedUri),
                this.modelService.createModelReference(actualUri),
            ]);
            const model = this.model.value = new SimpleDiffEditorModel(original, modified);
            if (!this.widget.value) {
                this.widget.value = this.instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedDiffEditorWidget, this.container, diffEditorOptions, this.editor);
                if (this.dimension) {
                    this.widget.value.layout(this.dimension);
                }
            }
            this.widget.value.setModel(model);
            this.widget.value.updateOptions(this.getOptions(isMultiline(message.expected) || isMultiline(message.actual)));
        }
        clear() {
            this.model.clear();
            this.widget.clear();
        }
        layout(dimensions) {
            var _a;
            this.dimension = dimensions;
            (_a = this.widget.value) === null || _a === void 0 ? void 0 : _a.layout(dimensions);
        }
        getOptions(isMultiline) {
            return isMultiline
                ? Object.assign(Object.assign({}, diffEditorOptions), { lineNumbers: 'on' }) : Object.assign(Object.assign({}, diffEditorOptions), { lineNumbers: 'off' });
        }
    };
    DiffContentProvider = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, resolverService_1.ITextModelService)
    ], DiffContentProvider);
    class ScrollableMarkdownMessage extends lifecycle_1.Disposable {
        constructor(container, markdown, message) {
            super();
            const rendered = this._register(markdown.render(message, {}));
            rendered.element.style.height = '100%';
            rendered.element.style.userSelect = 'text';
            container.appendChild(rendered.element);
            this.scrollable = this._register(new scrollableElement_1.DomScrollableElement(rendered.element, {
                className: 'preview-text',
            }));
            container.appendChild(this.scrollable.getDomNode());
            this._register((0, lifecycle_1.toDisposable)(() => {
                container.removeChild(this.scrollable.getDomNode());
            }));
            this.scrollable.scanDomNode();
        }
        layout(height, width) {
            this.scrollable.setScrollDimensions({ width, height });
        }
    }
    let MarkdownTestMessagePeek = class MarkdownTestMessagePeek extends lifecycle_1.Disposable {
        constructor(container, instantiationService) {
            super();
            this.container = container;
            this.instantiationService = instantiationService;
            this.markdown = new lazy_1.Lazy(() => this._register(this.instantiationService.createInstance(markdownRenderer_2.MarkdownRenderer, {})));
            this.textPreview = this._register(new lifecycle_1.MutableDisposable());
        }
        update(_dto, message) {
            if (isDiffable(message) || typeof message.message === 'string') {
                return this.textPreview.clear();
            }
            this.textPreview.value = new ScrollableMarkdownMessage(this.container, this.markdown.getValue(), message.message);
        }
        layout(dimension) {
            var _a;
            (_a = this.textPreview.value) === null || _a === void 0 ? void 0 : _a.layout(dimension.height, dimension.width);
        }
    };
    MarkdownTestMessagePeek = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], MarkdownTestMessagePeek);
    let PlainTextMessagePeek = class PlainTextMessagePeek extends lifecycle_1.Disposable {
        constructor(editor, container, instantiationService, modelService) {
            super();
            this.editor = editor;
            this.container = container;
            this.instantiationService = instantiationService;
            this.modelService = modelService;
            this.widget = this._register(new lifecycle_1.MutableDisposable());
            this.model = this._register(new lifecycle_1.MutableDisposable());
        }
        async update({ messageUri }, message) {
            if (isDiffable(message) || typeof message.message !== 'string') {
                return this.clear();
            }
            const modelRef = this.model.value = await this.modelService.createModelReference(messageUri);
            if (!this.widget.value) {
                this.widget.value = this.instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget, this.container, commonEditorOptions, this.editor);
                if (this.dimension) {
                    this.widget.value.layout(this.dimension);
                }
            }
            this.widget.value.setModel(modelRef.object.textEditorModel);
            this.widget.value.updateOptions(this.getOptions(isMultiline(message.message)));
        }
        clear() {
            this.model.clear();
            this.widget.clear();
        }
        layout(dimensions) {
            var _a;
            this.dimension = dimensions;
            (_a = this.widget.value) === null || _a === void 0 ? void 0 : _a.layout(dimensions);
        }
        getOptions(isMultiline) {
            return isMultiline
                ? Object.assign(Object.assign({}, diffEditorOptions), { lineNumbers: 'on' }) : Object.assign(Object.assign({}, diffEditorOptions), { lineNumbers: 'off' });
        }
    };
    PlainTextMessagePeek = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, resolverService_1.ITextModelService)
    ], PlainTextMessagePeek);
    const hintMessagePeekHeight = (msg) => isDiffable(msg)
        ? Math.max(hintPeekStrHeight(msg.actual), hintPeekStrHeight(msg.expected))
        : hintPeekStrHeight(typeof msg.message === 'string' ? msg.message : msg.message.value);
    const firstLine = (str) => {
        const index = str.indexOf('\n');
        return index === -1 ? str : str.slice(0, index);
    };
    const isMultiline = (str) => !!str && str.includes('\n');
    const hintPeekStrHeight = (str) => (0, numbers_1.clamp)(str ? Math.max((0, strings_1.count)(str, '\n'), Math.ceil(str.length / 80)) + 3 : 0, 14, 24);
    class SimpleDiffEditorModel extends editorModel_1.EditorModel {
        constructor(_original, _modified) {
            super();
            this._original = _original;
            this._modified = _modified;
            this.original = this._original.object.textEditorModel;
            this.modified = this._modified.object.textEditorModel;
        }
        dispose() {
            super.dispose();
            this._original.dispose();
            this._modified.dispose();
        }
    }
    function getOuterEditorFromDiffEditor(accessor) {
        const diffEditors = accessor.get(codeEditorService_1.ICodeEditorService).listDiffEditors();
        for (const diffEditor of diffEditors) {
            if (diffEditor.hasTextFocus() && diffEditor instanceof embeddedCodeEditorWidget_1.EmbeddedDiffEditorWidget) {
                return diffEditor.getParentEditor();
            }
        }
        return (0, peekView_1.getOuterEditor)(accessor);
    }
    class CloseTestPeek extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.closeTestPeek',
                title: (0, nls_1.localize)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(testingContextKeys_1.TestingContextKeys.isInPeek, testingContextKeys_1.TestingContextKeys.isPeekVisible), contextkey_1.ContextKeyExpr.not('config.editor.stablePeek')),
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 101,
                    primary: 9 /* KeyCode.Escape */
                }
            });
        }
        runEditorCommand(accessor, editor) {
            var _a;
            const parent = getOuterEditorFromDiffEditor(accessor);
            (_a = TestingOutputPeekController.get(parent !== null && parent !== void 0 ? parent : editor)) === null || _a === void 0 ? void 0 : _a.removePeek();
        }
    }
    exports.CloseTestPeek = CloseTestPeek;
    class TestResultElement {
        constructor(value) {
            this.value = value;
            this.type = 'result';
            this.context = this.value.id;
            this.id = this.value.id;
            this.label = this.value.name;
        }
        get icon() {
            return icons.testingStatesToIcons.get(this.value.completedAt === undefined
                ? 2 /* TestResultState.Running */
                : (0, testResult_1.maxCountPriority)(this.value.counts));
        }
    }
    exports.TestResultElement = TestResultElement;
    class TestCaseElement {
        constructor(results, test) {
            this.results = results;
            this.test = test;
            this.type = 'test';
            this.context = this.test.item.extId;
            this.id = `${this.results.id}/${this.test.item.extId}`;
            this.label = this.test.item.label;
            for (const parent of (0, testResult_1.resultItemParents)(results, test)) {
                if (parent !== test) {
                    this.description = this.description
                        ? parent.item.label + display_1.flatTestItemDelimiter + this.description
                        : parent.item.label;
                }
            }
        }
        get icon() {
            return icons.testingStatesToIcons.get(this.test.computedState);
        }
    }
    exports.TestCaseElement = TestCaseElement;
    class TestTaskElement {
        constructor(results, test, index) {
            var _a;
            this.test = test;
            this.type = 'task';
            this.icon = undefined;
            this.id = `${results.id}/${test.item.extId}/${index}`;
            this.task = results.tasks[index];
            this.context = String(index);
            this.label = (_a = this.task.name) !== null && _a !== void 0 ? _a : (0, nls_1.localize)('testUnnamedTask', 'Unnamed Task');
        }
    }
    class TestMessageElement {
        constructor(result, test, taskIndex, messageIndex) {
            this.result = result;
            this.test = test;
            this.taskIndex = taskIndex;
            this.messageIndex = messageIndex;
            this.type = 'message';
            const { message, location } = test.tasks[taskIndex].messages[messageIndex];
            this.location = location;
            this.uri = this.context = (0, testingUri_1.buildTestUri)({
                type: 0 /* TestUriType.ResultMessage */,
                messageIndex,
                resultId: result.id,
                taskIndex,
                testExtId: test.item.extId
            });
            this.id = this.uri.toString();
            const asPlaintext = (0, markdownRenderer_1.renderStringAsPlaintext)(message);
            const lines = (0, strings_1.count)(asPlaintext.trimRight(), '\n');
            this.label = firstLine(asPlaintext);
            if (lines > 0) {
                this.description = lines > 1
                    ? (0, nls_1.localize)('messageMoreLinesN', '+ {0} more lines', lines)
                    : (0, nls_1.localize)('messageMoreLines1', '+ 1 more line');
            }
        }
    }
    let OutputPeekTree = class OutputPeekTree extends lifecycle_1.Disposable {
        constructor(editor, container, onDidChangeVisibility, onDidReveal, peekController, contextMenuService, results, instantiationService, explorerFilter) {
            super();
            this.contextMenuService = contextMenuService;
            this.disposed = false;
            this.treeActions = instantiationService.createInstance(TreeActionsProvider);
            const labels = instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility });
            const diffIdentityProvider = {
                getId(e) {
                    return e.id;
                }
            };
            this.tree = this._register(instantiationService.createInstance(listService_1.WorkbenchCompressibleObjectTree, 'Test Output Peek', container, {
                getHeight: () => 22,
                getTemplateId: () => TestRunElementRenderer.ID,
            }, [instantiationService.createInstance(TestRunElementRenderer, labels, this.treeActions)], {
                compressionEnabled: true,
                hideTwistiesOfChildlessElements: true,
                identityProvider: diffIdentityProvider,
                accessibilityProvider: {
                    getAriaLabel(element) {
                        return element.ariaLabel || element.label;
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('testingPeekLabel', 'Test Result Messages');
                    }
                }
            }));
            const creationCache = new WeakMap();
            const cachedCreate = (ref, factory) => {
                const existing = creationCache.get(ref);
                if (existing) {
                    return existing;
                }
                const fresh = factory();
                creationCache.set(ref, fresh);
                return fresh;
            };
            const getTaskChildren = (result, test, taskId) => {
                return iterator_1.Iterable.map(test.tasks[0].messages, (m, messageIndex) => ({
                    element: cachedCreate(m, () => new TestMessageElement(result, test, taskId, messageIndex)),
                    incompressible: true,
                }));
            };
            const getTestChildren = (result, test) => {
                const tasks = iterator_1.Iterable.filter(test.tasks, task => task.messages.length > 0);
                return iterator_1.Iterable.map(tasks, (t, taskId) => ({
                    element: cachedCreate(t, () => new TestTaskElement(result, test, taskId)),
                    incompressible: false,
                    children: getTaskChildren(result, test, taskId),
                }));
            };
            const getResultChildren = (result) => {
                const tests = iterator_1.Iterable.filter(result.tests, test => test.tasks.some(t => t.messages.length > 0));
                return iterator_1.Iterable.map(tests, test => ({
                    element: cachedCreate(test, () => new TestCaseElement(result, test)),
                    incompressible: true,
                    children: getTestChildren(result, test),
                }));
            };
            const getRootChildren = () => results.results.map(result => {
                const element = cachedCreate(result, () => new TestResultElement(result));
                return {
                    element,
                    incompressible: true,
                    collapsed: this.tree.hasElement(element) ? this.tree.isCollapsed(element) : true,
                    children: getResultChildren(result)
                };
            });
            // Queued result updates to prevent spamming CPU when lots of tests are
            // completing and messaging quickly (#142514)
            const resultsToUpdate = new Set();
            const resultUpdateScheduler = this._register(new async_1.RunOnceScheduler(() => {
                for (const result of resultsToUpdate) {
                    const resultNode = creationCache.get(result);
                    if (resultNode && this.tree.hasElement(resultNode)) {
                        this.tree.setChildren(resultNode, getResultChildren(result), { diffIdentityProvider });
                    }
                }
                resultsToUpdate.clear();
            }, 300));
            this._register(results.onTestChanged(e => {
                const itemNode = creationCache.get(e.item);
                if (itemNode && this.tree.hasElement(itemNode)) { // update to existing test message/state
                    this.tree.setChildren(itemNode, getTestChildren(e.result, e.item));
                    return;
                }
                const resultNode = creationCache.get(e.result);
                if (resultNode && this.tree.hasElement(resultNode)) { // new test, update result children
                    if (!resultUpdateScheduler.isScheduled) {
                        resultsToUpdate.add(e.result);
                        resultUpdateScheduler.schedule();
                    }
                    return;
                }
                // should be unreachable?
                this.tree.setChildren(null, getRootChildren(), { diffIdentityProvider });
            }));
            this._register(results.onResultsChanged(e => {
                // little hack here: a result change can cause the peek to be disposed,
                // but this listener will still be queued. Doing stuff with the tree
                // will cause errors.
                if (this.disposed) {
                    return;
                }
                if ('completed' in e) {
                    const resultNode = creationCache.get(e.completed);
                    if (resultNode && this.tree.hasElement(resultNode)) {
                        this.tree.setChildren(resultNode, getResultChildren(e.completed));
                        return;
                    }
                }
                this.tree.setChildren(null, getRootChildren(), { diffIdentityProvider });
            }));
            this._register(onDidReveal(dto => {
                const messageNode = creationCache.get(dto.messages[dto.messageIndex]);
                if (!messageNode || !this.tree.hasElement(messageNode)) {
                    return;
                }
                const parents = [];
                for (let parent = this.tree.getParentElement(messageNode); parent; parent = this.tree.getParentElement(parent)) {
                    parents.unshift(parent);
                }
                for (const parent of parents) {
                    this.tree.expand(parent);
                }
                if (this.tree.getRelativeTop(messageNode) === null) {
                    this.tree.reveal(messageNode, 0.5);
                }
                this.tree.setFocus([messageNode]);
                this.tree.setSelection([messageNode]);
            }));
            this._register(this.tree.onDidOpen(async (e) => {
                var _a;
                if (!(e.element instanceof TestMessageElement)) {
                    return;
                }
                const dto = new TestDto(e.element.result.id, e.element.test, e.element.taskIndex, e.element.messageIndex);
                if (!dto.revealLocation) {
                    peekController.showInPlace(dto);
                }
                else {
                    (_a = TestingOutputPeekController.get(editor)) === null || _a === void 0 ? void 0 : _a.openAndShow(dto.messageUri);
                }
            }));
            this._register(this.tree.onDidChangeSelection(evt => {
                for (const element of evt.elements) {
                    if (element && 'test' in element) {
                        explorerFilter.reveal.value = element.test.item.extId;
                        break;
                    }
                }
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this.tree.setChildren(null, getRootChildren());
        }
        layout(height, width) {
            this.tree.layout(height, width);
        }
        onContextMenu(evt) {
            if (!evt.element) {
                return;
            }
            const actions = this.treeActions.provideActionBar(evt.element);
            this.contextMenuService.showContextMenu({
                getAnchor: () => evt.anchor,
                getActions: () => actions.value.secondary.length
                    ? [...actions.value.primary, new actions_1.Separator(), ...actions.value.secondary]
                    : actions.value.primary,
                getActionsContext: () => { var _a; return (_a = evt.element) === null || _a === void 0 ? void 0 : _a.context; },
                onHide: () => actions.dispose(),
            });
        }
        dispose() {
            super.dispose();
            this.disposed = true;
        }
    };
    OutputPeekTree = __decorate([
        __param(5, contextView_1.IContextMenuService),
        __param(6, testResultService_1.ITestResultService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, testExplorerFilterState_1.ITestExplorerFilterState)
    ], OutputPeekTree);
    let TestRunElementRenderer = class TestRunElementRenderer {
        constructor(labels, treeActions, instantiationService) {
            this.labels = labels;
            this.treeActions = treeActions;
            this.instantiationService = instantiationService;
            this.templateId = TestRunElementRenderer.ID;
        }
        /** @inheritdoc */
        renderCompressedElements(node, _index, templateData) {
            const chain = node.element.elements;
            const lastElement = chain[chain.length - 1];
            if (lastElement instanceof TestTaskElement && chain.length >= 2) {
                this.doRender(chain[chain.length - 2], templateData);
            }
            else {
                this.doRender(lastElement, templateData);
            }
        }
        /** @inheritdoc */
        renderTemplate(container) {
            const templateDisposable = new lifecycle_1.DisposableStore();
            const wrapper = dom.append(container, dom.$('.test-peek-item'));
            const icon = dom.append(wrapper, dom.$('.state'));
            const name = dom.append(wrapper, dom.$('.name'));
            const label = this.labels.create(name, { supportHighlights: true });
            templateDisposable.add(label);
            const actionBar = new actionbar_1.ActionBar(wrapper, {
                actionViewItemProvider: action => action instanceof actions_2.MenuItemAction
                    ? this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, undefined)
                    : undefined
            });
            templateDisposable.add(actionBar);
            return {
                icon,
                label,
                actionBar,
                elementDisposable: new lifecycle_1.DisposableStore(),
                templateDisposable,
            };
        }
        /** @inheritdoc */
        renderElement(element, _index, templateData) {
            this.doRender(element.element, templateData);
        }
        /** @inheritdoc */
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
        doRender(element, templateData) {
            templateData.elementDisposable.clear();
            templateData.label.setLabel(element.label, element.description);
            const icon = element.icon;
            templateData.icon.className = `computed-state ${icon ? themeService_1.ThemeIcon.asClassName(icon) : ''}`;
            const actions = this.treeActions.provideActionBar(element);
            templateData.elementDisposable.add(actions);
            templateData.actionBar.clear();
            templateData.actionBar.context = element;
            templateData.actionBar.push(actions.value.primary, { icon: true, label: false });
        }
    };
    TestRunElementRenderer.ID = 'testRunElementRenderer';
    TestRunElementRenderer = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], TestRunElementRenderer);
    let TreeActionsProvider = class TreeActionsProvider {
        constructor(contextKeyService, testTerminalService, menuService, commandService, testProfileService) {
            this.contextKeyService = contextKeyService;
            this.testTerminalService = testTerminalService;
            this.menuService = menuService;
            this.commandService = commandService;
            this.testProfileService = testProfileService;
        }
        provideActionBar(element) {
            const test = element instanceof TestCaseElement ? element.test : undefined;
            const capabilities = test ? this.testProfileService.capabilitiesForTest(test) : 0;
            const contextOverlay = this.contextKeyService.createOverlay([
                ['peek', "editor.contrib.testingOutputPeek" /* Testing.OutputPeekContributionId */],
                [testingContextKeys_1.TestingContextKeys.peekItemType.key, element.type],
                ...(0, testItemContextOverlay_1.getTestItemContextOverlay)(test, capabilities),
            ]);
            const menu = this.menuService.createMenu(actions_2.MenuId.TestPeekElement, contextOverlay);
            try {
                const primary = [];
                const secondary = [];
                if (element instanceof TestResultElement) {
                    primary.push(new actions_1.Action('testing.outputPeek.showResultOutput', (0, nls_1.localize)('testing.showResultOutput', "Show Result Output"), codicons_1.Codicon.terminal.classNames, undefined, () => this.testTerminalService.open(element.value)));
                    primary.push(new actions_1.Action('testing.outputPeek.reRunLastRun', (0, nls_1.localize)('testing.reRunLastRun', "Rerun Test Run"), themeService_1.ThemeIcon.asClassName(icons.testingRunIcon), undefined, () => this.commandService.executeCommand('testing.reRunLastRun', element.value.id)));
                    if (capabilities & 4 /* TestRunProfileBitset.Debug */) {
                        primary.push(new actions_1.Action('testing.outputPeek.debugLastRun', (0, nls_1.localize)('testing.debugLastRun', "Debug Test Run"), themeService_1.ThemeIcon.asClassName(icons.testingDebugIcon), undefined, () => this.commandService.executeCommand('testing.debugLastRun', element.value.id)));
                    }
                }
                if (element instanceof TestCaseElement || element instanceof TestTaskElement) {
                    const extId = element.test.item.extId;
                    primary.push(new actions_1.Action('testing.outputPeek.goToFile', (0, nls_1.localize)('testing.goToFile', "Go to File"), codicons_1.Codicon.goToFile.classNames, undefined, () => this.commandService.executeCommand('vscode.revealTest', extId)));
                    secondary.push(new actions_1.Action('testing.outputPeek.revealInExplorer', (0, nls_1.localize)('testing.revealInExplorer', "Reveal in Test Explorer"), codicons_1.Codicon.listTree.classNames, undefined, () => this.commandService.executeCommand('_revealTestInExplorer', extId)));
                    if (capabilities & 2 /* TestRunProfileBitset.Run */) {
                        primary.push(new actions_1.Action('testing.outputPeek.runTest', (0, nls_1.localize)('run test', 'Run Test'), themeService_1.ThemeIcon.asClassName(icons.testingRunIcon), undefined, () => this.commandService.executeCommand('vscode.runTestsById', 2 /* TestRunProfileBitset.Run */, extId)));
                    }
                    if (capabilities & 4 /* TestRunProfileBitset.Debug */) {
                        primary.push(new actions_1.Action('testing.outputPeek.debugTest', (0, nls_1.localize)('debug test', 'Debug Test'), themeService_1.ThemeIcon.asClassName(icons.testingDebugIcon), undefined, () => this.commandService.executeCommand('vscode.runTestsById', 4 /* TestRunProfileBitset.Debug */, extId)));
                    }
                }
                const result = { primary, secondary };
                const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, {
                    shouldForwardArgs: true,
                }, result, 'inline');
                return { value: result, dispose: () => actionsDisposable.dispose };
            }
            finally {
                menu.dispose();
            }
        }
    };
    TreeActionsProvider = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, testingOutputTerminalService_1.ITestingOutputTerminalService),
        __param(2, actions_2.IMenuService),
        __param(3, commands_1.ICommandService),
        __param(4, testProfileService_1.ITestProfileService)
    ], TreeActionsProvider);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const resultsBackground = theme.getColor(peekView_1.peekViewResultsBackground);
        if (resultsBackground) {
            collector.addRule(`.monaco-editor .test-output-peek .test-output-peek-tree { background-color: ${resultsBackground}; }`);
        }
        const resultsMatchForeground = theme.getColor(peekView_1.peekViewResultsMatchForeground);
        if (resultsMatchForeground) {
            collector.addRule(`.monaco-editor .test-output-peek .test-output-peek-tree { color: ${resultsMatchForeground}; }`);
        }
        const resultsSelectedBackground = theme.getColor(peekView_1.peekViewResultsSelectionBackground);
        if (resultsSelectedBackground) {
            collector.addRule(`.monaco-editor .test-output-peek .test-output-peek-tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { background-color: ${resultsSelectedBackground}; }`);
        }
        const resultsSelectedForeground = theme.getColor(peekView_1.peekViewResultsSelectionForeground);
        if (resultsSelectedForeground) {
            collector.addRule(`.monaco-editor .test-output-peek .test-output-peek-tree .monaco-list:focus .monaco-list-rows > .monaco-list-row.selected:not(.highlighted) { color: ${resultsSelectedForeground} !important; }`);
        }
        const textLinkForegroundColor = theme.getColor(colorRegistry_1.textLinkForeground);
        if (textLinkForegroundColor) {
            collector.addRule(`.monaco-editor .test-output-peek .test-output-peek-message-container a { color: ${textLinkForegroundColor}; }`);
        }
        const textLinkActiveForegroundColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (textLinkActiveForegroundColor) {
            collector.addRule(`.monaco-editor .test-output-peek .test-output-peek-message-container a :hover { color: ${textLinkActiveForegroundColor}; }`);
        }
    });
    const navWhen = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, testingContextKeys_1.TestingContextKeys.isPeekVisible);
    /**
     * Gets the editor where the peek may be shown, bubbling upwards if the given
     * editor is embedded (i.e. inside a peek already).
     */
    const getPeekedEditor = (accessor, editor) => {
        var _a;
        if ((_a = TestingOutputPeekController.get(editor)) === null || _a === void 0 ? void 0 : _a.isVisible) {
            return editor;
        }
        if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
            return editor.getParentEditor();
        }
        const outer = getOuterEditorFromDiffEditor(accessor);
        if (outer) {
            return outer;
        }
        return editor;
    };
    class GoToNextMessageAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: GoToNextMessageAction.ID,
                f1: true,
                title: (0, nls_1.localize)('testing.goToNextMessage', "Go to Next Test Failure"),
                icon: codicons_1.Codicon.arrowDown,
                category: actions_3.CATEGORIES.Test,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 66 /* KeyCode.F8 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    when: navWhen,
                },
                menu: [{
                        id: actions_2.MenuId.TestPeekTitle,
                        group: 'navigation',
                        order: 2,
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: navWhen
                    }],
            });
        }
        runEditorCommand(accessor, editor) {
            var _a;
            (_a = TestingOutputPeekController.get(getPeekedEditor(accessor, editor))) === null || _a === void 0 ? void 0 : _a.next();
        }
    }
    exports.GoToNextMessageAction = GoToNextMessageAction;
    GoToNextMessageAction.ID = 'testing.goToNextMessage';
    class GoToPreviousMessageAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: GoToPreviousMessageAction.ID,
                f1: true,
                title: (0, nls_1.localize)('testing.goToPreviousMessage', "Go to Previous Test Failure"),
                icon: codicons_1.Codicon.arrowUp,
                category: actions_3.CATEGORIES.Test,
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 66 /* KeyCode.F8 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    when: navWhen
                },
                menu: [{
                        id: actions_2.MenuId.TestPeekTitle,
                        group: 'navigation',
                        order: 1,
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: navWhen
                    }],
            });
        }
        runEditorCommand(accessor, editor) {
            var _a;
            (_a = TestingOutputPeekController.get(getPeekedEditor(accessor, editor))) === null || _a === void 0 ? void 0 : _a.previous();
        }
    }
    exports.GoToPreviousMessageAction = GoToPreviousMessageAction;
    GoToPreviousMessageAction.ID = 'testing.goToPreviousMessage';
    class OpenMessageInEditorAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: OpenMessageInEditorAction.ID,
                f1: false,
                title: (0, nls_1.localize)('testing.openMessageInEditor', "Open in Editor"),
                icon: codicons_1.Codicon.linkExternal,
                category: actions_3.CATEGORIES.Test,
                menu: [{ id: actions_2.MenuId.TestPeekTitle }],
            });
        }
        runEditorCommand(accessor, editor) {
            var _a;
            (_a = TestingOutputPeekController.get(getPeekedEditor(accessor, editor))) === null || _a === void 0 ? void 0 : _a.openCurrentInEditor();
        }
    }
    exports.OpenMessageInEditorAction = OpenMessageInEditorAction;
    OpenMessageInEditorAction.ID = 'testing.openMessageInEditor';
    class ToggleTestingPeekHistory extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: ToggleTestingPeekHistory.ID,
                f1: true,
                title: (0, nls_1.localize)('testing.toggleTestingPeekHistory', "Toggle Test History in Peek"),
                icon: codicons_1.Codicon.history,
                category: actions_3.CATEGORIES.Test,
                menu: [{
                        id: actions_2.MenuId.TestPeekTitle,
                        group: 'navigation',
                        order: 3,
                    }],
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 38 /* KeyCode.KeyH */,
                    when: testingContextKeys_1.TestingContextKeys.isPeekVisible.isEqualTo(true),
                },
            });
        }
        runEditorCommand(accessor, editor) {
            const ctrl = TestingOutputPeekController.get(getPeekedEditor(accessor, editor));
            if (ctrl) {
                ctrl.historyVisible.value = !ctrl.historyVisible.value;
            }
        }
    }
    exports.ToggleTestingPeekHistory = ToggleTestingPeekHistory;
    ToggleTestingPeekHistory.ID = 'testing.toggleTestingPeekHistory';
});
//# sourceMappingURL=testingOutputPeek.js.map