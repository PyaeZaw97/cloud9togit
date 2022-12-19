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
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/base/common/async", "vs/base/common/platform", "vs/base/common/json", "vs/base/common/jsonEdit", "vs/base/browser/keyboardEvent", "vs/base/common/cancellation", "vs/base/common/arrays", "vs/base/common/errors", "vs/editor/common/core/wordHelper", "vs/editor/common/core/range", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/commands/common/commands", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/exceptionWidget", "vs/workbench/browser/codeeditor", "vs/editor/common/core/position", "vs/editor/browser/coreCommands", "vs/base/common/decorators", "vs/workbench/contrib/debug/browser/debugHover", "vs/editor/common/model", "vs/base/common/lifecycle", "vs/editor/common/core/editOperation", "vs/base/common/path", "vs/editor/contrib/hover/browser/hover", "vs/workbench/services/host/browser/host", "vs/base/common/event", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/common/debugModel", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/base/browser/event", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeatureDebounce"], function (require, exports, nls, strings, async_1, env, json_1, jsonEdit_1, keyboardEvent_1, cancellation_1, arrays_1, errors_1, wordHelper_1, range_1, instantiation_1, configuration_1, commands_1, debug_1, exceptionWidget_1, codeeditor_1, position_1, coreCommands_1, decorators_1, debugHover_1, model_1, lifecycle_1, editOperation_1, path_1, hover_1, host_1, event_1, uriIdentity_1, contextkey_1, debugModel_1, colorRegistry_1, dom_1, event_2, languageFeatures_1, languageFeatureDebounce_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugEditorContribution = exports.debugInlineBackground = exports.debugInlineForeground = void 0;
    const LAUNCH_JSON_REGEX = /\.vscode\/launch\.json$/;
    const MAX_NUM_INLINE_VALUES = 100; // JS Global scope can have 700+ entries. We want to limit ourselves for perf reasons
    const MAX_INLINE_DECORATOR_LENGTH = 150; // Max string length of each inline decorator when debugging. If exceeded ... is added
    const MAX_TOKENIZATION_LINE_LEN = 500; // If line is too long, then inline values for the line are skipped
    const DEAFULT_INLINE_DEBOUNCE_DELAY = 200;
    exports.debugInlineForeground = (0, colorRegistry_1.registerColor)('editor.inlineValuesForeground', {
        dark: '#ffffff80',
        light: '#00000080',
        hcDark: '#ffffff80',
        hcLight: '#00000080'
    }, nls.localize('editor.inlineValuesForeground', "Color for the debug inline value text."));
    exports.debugInlineBackground = (0, colorRegistry_1.registerColor)('editor.inlineValuesBackground', {
        dark: '#ffc80033',
        light: '#ffc80033',
        hcDark: '#ffc80033',
        hcLight: '#ffc80033'
    }, nls.localize('editor.inlineValuesBackground', "Color for the debug inline value background."));
    class InlineSegment {
        constructor(column, text) {
            this.column = column;
            this.text = text;
        }
    }
    function createInlineValueDecoration(lineNumber, contentText, column = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */) {
        // If decoratorText is too long, trim and add ellipses. This could happen for minified files with everything on a single line
        if (contentText.length > MAX_INLINE_DECORATOR_LENGTH) {
            contentText = contentText.substring(0, MAX_INLINE_DECORATOR_LENGTH) + '...';
        }
        return [
            {
                range: {
                    startLineNumber: lineNumber,
                    endLineNumber: lineNumber,
                    startColumn: column,
                    endColumn: column
                },
                options: {
                    description: 'debug-inline-value-decoration-spacer',
                    after: {
                        content: strings.noBreakWhitespace,
                        cursorStops: model_1.InjectedTextCursorStops.None
                    },
                    showIfCollapsed: true,
                }
            },
            {
                range: {
                    startLineNumber: lineNumber,
                    endLineNumber: lineNumber,
                    startColumn: column,
                    endColumn: column
                },
                options: {
                    description: 'debug-inline-value-decoration',
                    after: {
                        content: replaceWsWithNoBreakWs(contentText),
                        inlineClassName: 'debug-inline-value',
                        inlineClassNameAffectsLetterSpacing: true,
                        cursorStops: model_1.InjectedTextCursorStops.None
                    },
                    showIfCollapsed: true,
                }
            },
        ];
    }
    function replaceWsWithNoBreakWs(str) {
        return str.replace(/[ \t]/g, strings.noBreakWhitespace);
    }
    function createInlineValueDecorationsInsideRange(expressions, range, model, wordToLineNumbersMap) {
        const nameValueMap = new Map();
        for (const expr of expressions) {
            nameValueMap.set(expr.name, expr.value);
            // Limit the size of map. Too large can have a perf impact
            if (nameValueMap.size >= MAX_NUM_INLINE_VALUES) {
                break;
            }
        }
        const lineToNamesMap = new Map();
        // Compute unique set of names on each line
        nameValueMap.forEach((_value, name) => {
            const lineNumbers = wordToLineNumbersMap.get(name);
            if (lineNumbers) {
                for (const lineNumber of lineNumbers) {
                    if (range.containsPosition(new position_1.Position(lineNumber, 0))) {
                        if (!lineToNamesMap.has(lineNumber)) {
                            lineToNamesMap.set(lineNumber, []);
                        }
                        if (lineToNamesMap.get(lineNumber).indexOf(name) === -1) {
                            lineToNamesMap.get(lineNumber).push(name);
                        }
                    }
                }
            }
        });
        const decorations = [];
        // Compute decorators for each line
        lineToNamesMap.forEach((names, line) => {
            const contentText = names.sort((first, second) => {
                const content = model.getLineContent(line);
                return content.indexOf(first) - content.indexOf(second);
            }).map(name => `${name} = ${nameValueMap.get(name)}`).join(', ');
            decorations.push(...createInlineValueDecoration(line, contentText));
        });
        return decorations;
    }
    function getWordToLineNumbersMap(model) {
        const result = new Map();
        if (!model) {
            return result;
        }
        // For every word in every line, map its ranges for fast lookup
        for (let lineNumber = 1, len = model.getLineCount(); lineNumber <= len; ++lineNumber) {
            const lineContent = model.getLineContent(lineNumber);
            // If line is too long then skip the line
            if (lineContent.length > MAX_TOKENIZATION_LINE_LEN) {
                continue;
            }
            model.tokenization.forceTokenization(lineNumber);
            const lineTokens = model.tokenization.getLineTokens(lineNumber);
            for (let tokenIndex = 0, tokenCount = lineTokens.getCount(); tokenIndex < tokenCount; tokenIndex++) {
                const tokenType = lineTokens.getStandardTokenType(tokenIndex);
                // Token is a word and not a comment
                if (tokenType === 0 /* StandardTokenType.Other */) {
                    wordHelper_1.DEFAULT_WORD_REGEXP.lastIndex = 0; // We assume tokens will usually map 1:1 to words if they match
                    const tokenStartOffset = lineTokens.getStartOffset(tokenIndex);
                    const tokenEndOffset = lineTokens.getEndOffset(tokenIndex);
                    const tokenStr = lineContent.substring(tokenStartOffset, tokenEndOffset);
                    const wordMatch = wordHelper_1.DEFAULT_WORD_REGEXP.exec(tokenStr);
                    if (wordMatch) {
                        const word = wordMatch[0];
                        if (!result.has(word)) {
                            result.set(word, []);
                        }
                        result.get(word).push(lineNumber);
                    }
                }
            }
        }
        return result;
    }
    let DebugEditorContribution = class DebugEditorContribution {
        constructor(editor, debugService, instantiationService, commandService, configurationService, hostService, uriIdentityService, contextKeyService, languageFeaturesService, featureDebounceService) {
            this.editor = editor;
            this.debugService = debugService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.hostService = hostService;
            this.uriIdentityService = uriIdentityService;
            this.languageFeaturesService = languageFeaturesService;
            this.hoverRange = null;
            this.mouseDown = false;
            this.altPressed = false;
            this.oldDecorations = [];
            this._wordToLineNumbersMap = undefined;
            this.debounceInfo = featureDebounceService.for(languageFeaturesService.inlineValuesProvider, 'InlineValues', { min: DEAFULT_INLINE_DEBOUNCE_DELAY });
            this.hoverWidget = this.instantiationService.createInstance(debugHover_1.DebugHoverWidget, this.editor);
            this.toDispose = [];
            this.registerListeners();
            this.updateConfigurationWidgetVisibility();
            this.exceptionWidgetVisible = debug_1.CONTEXT_EXCEPTION_WIDGET_VISIBLE.bindTo(contextKeyService);
            this.toggleExceptionWidget();
        }
        registerListeners() {
            this.toDispose.push(this.debugService.getViewModel().onDidFocusStackFrame(e => this.onFocusStackFrame(e.stackFrame)));
            // hover listeners & hover widget
            this.toDispose.push(this.editor.onMouseDown((e) => this.onEditorMouseDown(e)));
            this.toDispose.push(this.editor.onMouseUp(() => this.mouseDown = false));
            this.toDispose.push(this.editor.onMouseMove((e) => this.onEditorMouseMove(e)));
            this.toDispose.push(this.editor.onMouseLeave((e) => {
                const hoverDomNode = this.hoverWidget.getDomNode();
                if (!hoverDomNode) {
                    return;
                }
                const rect = hoverDomNode.getBoundingClientRect();
                // Only hide the hover widget if the editor mouse leave event is outside the hover widget #3528
                if (e.event.posx < rect.left || e.event.posx > rect.right || e.event.posy < rect.top || e.event.posy > rect.bottom) {
                    this.hideHoverWidget();
                }
            }));
            this.toDispose.push(this.editor.onKeyDown((e) => this.onKeyDown(e)));
            this.toDispose.push(this.editor.onDidChangeModelContent(() => {
                this._wordToLineNumbersMap = undefined;
                this.updateInlineValuesScheduler.schedule();
            }));
            this.toDispose.push(this.debugService.getViewModel().onWillUpdateViews(() => this.updateInlineValuesScheduler.schedule()));
            this.toDispose.push(this.debugService.getViewModel().onDidEvaluateLazyExpression(() => this.updateInlineValuesScheduler.schedule()));
            this.toDispose.push(this.editor.onDidChangeModel(async () => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                const model = this.editor.getModel();
                if (model) {
                    this.applyHoverConfiguration(model, stackFrame);
                }
                this.toggleExceptionWidget();
                this.hideHoverWidget();
                this.updateConfigurationWidgetVisibility();
                this._wordToLineNumbersMap = undefined;
                await this.updateInlineValueDecorations(stackFrame);
            }));
            this.toDispose.push(this.editor.onDidScrollChange(() => {
                this.hideHoverWidget();
                // Inline value provider should get called on view port change
                const model = this.editor.getModel();
                if (model && this.languageFeaturesService.inlineValuesProvider.has(model)) {
                    this.updateInlineValuesScheduler.schedule();
                }
            }));
            this.toDispose.push(this.debugService.onDidChangeState((state) => {
                if (state !== 2 /* State.Stopped */) {
                    this.toggleExceptionWidget();
                }
            }));
        }
        get wordToLineNumbersMap() {
            if (!this._wordToLineNumbersMap) {
                this._wordToLineNumbersMap = getWordToLineNumbersMap(this.editor.getModel());
            }
            return this._wordToLineNumbersMap;
        }
        applyHoverConfiguration(model, stackFrame) {
            var _a;
            if (stackFrame && this.uriIdentityService.extUri.isEqual(model.uri, stackFrame.source.uri)) {
                if (this.altListener) {
                    this.altListener.dispose();
                }
                // When the alt key is pressed show regular editor hover and hide the debug hover #84561
                this.altListener = (0, dom_1.addDisposableListener)(document, 'keydown', keydownEvent => {
                    const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(keydownEvent);
                    if (standardKeyboardEvent.keyCode === 6 /* KeyCode.Alt */) {
                        this.altPressed = true;
                        const debugHoverWasVisible = this.hoverWidget.isVisible();
                        this.hoverWidget.hide();
                        this.enableEditorHover();
                        if (debugHoverWasVisible && this.hoverRange) {
                            // If the debug hover was visible immediately show the editor hover for the alt transition to be smooth
                            const hoverController = this.editor.getContribution(hover_1.ModesHoverController.ID);
                            hoverController === null || hoverController === void 0 ? void 0 : hoverController.showContentHover(this.hoverRange, 1 /* HoverStartMode.Immediate */, false);
                        }
                        const onKeyUp = new event_2.DomEmitter(document, 'keyup');
                        const listener = event_1.Event.any(this.hostService.onDidChangeFocus, onKeyUp.event)(keyupEvent => {
                            let standardKeyboardEvent = undefined;
                            if (keyupEvent instanceof KeyboardEvent) {
                                standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(keyupEvent);
                            }
                            if (!standardKeyboardEvent || standardKeyboardEvent.keyCode === 6 /* KeyCode.Alt */) {
                                this.altPressed = false;
                                this.editor.updateOptions({ hover: { enabled: false } });
                                listener.dispose();
                                onKeyUp.dispose();
                            }
                        });
                    }
                });
                this.editor.updateOptions({ hover: { enabled: false } });
            }
            else {
                (_a = this.altListener) === null || _a === void 0 ? void 0 : _a.dispose();
                this.enableEditorHover();
            }
        }
        enableEditorHover() {
            if (this.editor.hasModel()) {
                const model = this.editor.getModel();
                const overrides = {
                    resource: model.uri,
                    overrideIdentifier: model.getLanguageId()
                };
                const defaultConfiguration = this.configurationService.getValue('editor.hover', overrides);
                this.editor.updateOptions({
                    hover: {
                        enabled: defaultConfiguration.enabled,
                        delay: defaultConfiguration.delay,
                        sticky: defaultConfiguration.sticky
                    }
                });
            }
        }
        async showHover(range, focus) {
            const sf = this.debugService.getViewModel().focusedStackFrame;
            const model = this.editor.getModel();
            if (sf && model && this.uriIdentityService.extUri.isEqual(sf.source.uri, model.uri) && !this.altPressed) {
                return this.hoverWidget.showAt(range, focus);
            }
        }
        async onFocusStackFrame(sf) {
            const model = this.editor.getModel();
            if (model) {
                this.applyHoverConfiguration(model, sf);
                if (sf && this.uriIdentityService.extUri.isEqual(sf.source.uri, model.uri)) {
                    await this.toggleExceptionWidget();
                }
                else {
                    this.hideHoverWidget();
                }
            }
            await this.updateInlineValueDecorations(sf);
        }
        get showHoverScheduler() {
            const hoverOption = this.editor.getOption(53 /* EditorOption.hover */);
            const scheduler = new async_1.RunOnceScheduler(() => {
                if (this.hoverRange) {
                    this.showHover(this.hoverRange, false);
                }
            }, hoverOption.delay * 2);
            this.toDispose.push(scheduler);
            return scheduler;
        }
        get hideHoverScheduler() {
            const scheduler = new async_1.RunOnceScheduler(() => {
                if (!this.hoverWidget.isHovered()) {
                    this.hoverWidget.hide();
                }
            }, 0);
            this.toDispose.push(scheduler);
            return scheduler;
        }
        hideHoverWidget() {
            if (!this.hideHoverScheduler.isScheduled() && this.hoverWidget.willBeVisible()) {
                this.hideHoverScheduler.schedule();
            }
            this.showHoverScheduler.cancel();
        }
        // hover business
        onEditorMouseDown(mouseEvent) {
            this.mouseDown = true;
            if (mouseEvent.target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && mouseEvent.target.detail === debugHover_1.DebugHoverWidget.ID) {
                return;
            }
            this.hideHoverWidget();
        }
        onEditorMouseMove(mouseEvent) {
            if (this.debugService.state !== 2 /* State.Stopped */) {
                return;
            }
            const target = mouseEvent.target;
            const stopKey = env.isMacintosh ? 'metaKey' : 'ctrlKey';
            if (target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && target.detail === debugHover_1.DebugHoverWidget.ID && !mouseEvent.event[stopKey]) {
                // mouse moved on top of debug hover widget
                return;
            }
            if (target.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                if (target.range && !target.range.equalsRange(this.hoverRange)) {
                    this.hoverRange = target.range;
                    this.hideHoverScheduler.cancel();
                    this.showHoverScheduler.schedule();
                }
            }
            else if (!this.mouseDown) {
                // Do not hide debug hover when the mouse is pressed because it usually leads to accidental closing #64620
                this.hideHoverWidget();
            }
        }
        onKeyDown(e) {
            const stopKey = env.isMacintosh ? 57 /* KeyCode.Meta */ : 5 /* KeyCode.Ctrl */;
            if (e.keyCode !== stopKey) {
                // do not hide hover when Ctrl/Meta is pressed
                this.hideHoverWidget();
            }
        }
        // end hover business
        // exception widget
        async toggleExceptionWidget() {
            // Toggles exception widget based on the state of the current editor model and debug stack frame
            const model = this.editor.getModel();
            const focusedSf = this.debugService.getViewModel().focusedStackFrame;
            const callStack = focusedSf ? focusedSf.thread.getCallStack() : null;
            if (!model || !focusedSf || !callStack || callStack.length === 0) {
                this.closeExceptionWidget();
                return;
            }
            // First call stack frame that is available is the frame where exception has been thrown
            const exceptionSf = callStack.find(sf => !!(sf && sf.source && sf.source.available && sf.source.presentationHint !== 'deemphasize'));
            if (!exceptionSf || exceptionSf !== focusedSf) {
                this.closeExceptionWidget();
                return;
            }
            const sameUri = this.uriIdentityService.extUri.isEqual(exceptionSf.source.uri, model.uri);
            if (this.exceptionWidget && !sameUri) {
                this.closeExceptionWidget();
            }
            else if (sameUri) {
                const exceptionInfo = await focusedSf.thread.exceptionInfo;
                if (exceptionInfo) {
                    this.showExceptionWidget(exceptionInfo, this.debugService.getViewModel().focusedSession, exceptionSf.range.startLineNumber, exceptionSf.range.startColumn);
                }
            }
        }
        showExceptionWidget(exceptionInfo, debugSession, lineNumber, column) {
            if (this.exceptionWidget) {
                this.exceptionWidget.dispose();
            }
            this.exceptionWidget = this.instantiationService.createInstance(exceptionWidget_1.ExceptionWidget, this.editor, exceptionInfo, debugSession);
            this.exceptionWidget.show({ lineNumber, column }, 0);
            this.exceptionWidget.focus();
            this.editor.revealRangeInCenter({
                startLineNumber: lineNumber,
                startColumn: column,
                endLineNumber: lineNumber,
                endColumn: column,
            });
            this.exceptionWidgetVisible.set(true);
        }
        closeExceptionWidget() {
            if (this.exceptionWidget) {
                const shouldFocusEditor = this.exceptionWidget.hasFocus();
                this.exceptionWidget.dispose();
                this.exceptionWidget = undefined;
                this.exceptionWidgetVisible.set(false);
                if (shouldFocusEditor) {
                    this.editor.focus();
                }
            }
        }
        // configuration widget
        updateConfigurationWidgetVisibility() {
            const model = this.editor.getModel();
            if (this.configurationWidget) {
                this.configurationWidget.dispose();
            }
            if (model && LAUNCH_JSON_REGEX.test(model.uri.toString()) && !this.editor.getOption(81 /* EditorOption.readOnly */)) {
                this.configurationWidget = this.instantiationService.createInstance(codeeditor_1.FloatingClickWidget, this.editor, nls.localize('addConfiguration', "Add Configuration..."), null);
                this.configurationWidget.render();
                this.toDispose.push(this.configurationWidget.onClick(() => this.addLaunchConfiguration()));
            }
        }
        async addLaunchConfiguration() {
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            let configurationsArrayPosition;
            let lastProperty;
            const getConfigurationPosition = () => {
                let depthInArray = 0;
                (0, json_1.visit)(model.getValue(), {
                    onObjectProperty: (property) => {
                        lastProperty = property;
                    },
                    onArrayBegin: (offset) => {
                        if (lastProperty === 'configurations' && depthInArray === 0) {
                            configurationsArrayPosition = model.getPositionAt(offset + 1);
                        }
                        depthInArray++;
                    },
                    onArrayEnd: () => {
                        depthInArray--;
                    }
                });
            };
            getConfigurationPosition();
            if (!configurationsArrayPosition) {
                // "configurations" array doesn't exist. Add it here.
                const { tabSize, insertSpaces } = model.getOptions();
                const eol = model.getEOL();
                const edit = ((0, path_1.basename)(model.uri.fsPath) === 'launch.json') ?
                    (0, jsonEdit_1.setProperty)(model.getValue(), ['configurations'], [], { tabSize, insertSpaces, eol })[0] :
                    (0, jsonEdit_1.setProperty)(model.getValue(), ['launch'], { 'configurations': [] }, { tabSize, insertSpaces, eol })[0];
                const startPosition = model.getPositionAt(edit.offset);
                const lineNumber = startPosition.lineNumber;
                const range = new range_1.Range(lineNumber, startPosition.column, lineNumber, model.getLineMaxColumn(lineNumber));
                model.pushEditOperations(null, [editOperation_1.EditOperation.replace(range, edit.content)], () => null);
                // Go through the file again since we've edited it
                getConfigurationPosition();
            }
            if (!configurationsArrayPosition) {
                return;
            }
            this.editor.focus();
            const insertLine = (position) => {
                // Check if there are more characters on a line after a "configurations": [, if yes enter a newline
                if (model.getLineLastNonWhitespaceColumn(position.lineNumber) > position.column) {
                    this.editor.setPosition(position);
                    coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, this.editor, null);
                }
                this.editor.setPosition(position);
                return this.commandService.executeCommand('editor.action.insertLineAfter');
            };
            await insertLine(configurationsArrayPosition);
            await this.commandService.executeCommand('editor.action.triggerSuggest');
        }
        // Inline Decorations
        get removeInlineValuesScheduler() {
            return new async_1.RunOnceScheduler(() => {
                this.oldDecorations = this.editor.deltaDecorations(this.oldDecorations, []);
            }, 100);
        }
        get updateInlineValuesScheduler() {
            const model = this.editor.getModel();
            return new async_1.RunOnceScheduler(async () => await this.updateInlineValueDecorations(this.debugService.getViewModel().focusedStackFrame), model ? this.debounceInfo.get(model) : DEAFULT_INLINE_DEBOUNCE_DELAY);
        }
        async updateInlineValueDecorations(stackFrame) {
            const var_value_format = '{0} = {1}';
            const separator = ', ';
            const model = this.editor.getModel();
            const inlineValuesSetting = this.configurationService.getValue('debug').inlineValues;
            const inlineValuesTurnedOn = inlineValuesSetting === true || inlineValuesSetting === 'on' || (inlineValuesSetting === 'auto' && model && this.languageFeaturesService.inlineValuesProvider.has(model));
            if (!inlineValuesTurnedOn || !model || !stackFrame || model.uri.toString() !== stackFrame.source.uri.toString()) {
                if (!this.removeInlineValuesScheduler.isScheduled()) {
                    this.removeInlineValuesScheduler.schedule();
                }
                return;
            }
            this.removeInlineValuesScheduler.cancel();
            let allDecorations;
            if (this.languageFeaturesService.inlineValuesProvider.has(model)) {
                const findVariable = async (_key, caseSensitiveLookup) => {
                    const scopes = await stackFrame.getMostSpecificScopes(stackFrame.range);
                    const key = caseSensitiveLookup ? _key : _key.toLowerCase();
                    for (const scope of scopes) {
                        const variables = await scope.getChildren();
                        const found = variables.find(v => caseSensitiveLookup ? (v.name === key) : (v.name.toLowerCase() === key));
                        if (found) {
                            return found.value;
                        }
                    }
                    return undefined;
                };
                const ctx = {
                    frameId: stackFrame.frameId,
                    stoppedLocation: new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn + 1, stackFrame.range.endLineNumber, stackFrame.range.endColumn + 1)
                };
                const token = new cancellation_1.CancellationTokenSource().token;
                const ranges = this.editor.getVisibleRangesPlusViewportAboveBelow();
                const providers = this.languageFeaturesService.inlineValuesProvider.ordered(model).reverse();
                allDecorations = [];
                const lineDecorations = new Map();
                const promises = (0, arrays_1.flatten)(providers.map(provider => ranges.map(range => Promise.resolve(provider.provideInlineValues(model, range, ctx, token)).then(async (result) => {
                    if (result) {
                        for (const iv of result) {
                            let text = undefined;
                            switch (iv.type) {
                                case 'text':
                                    text = iv.text;
                                    break;
                                case 'variable': {
                                    let va = iv.variableName;
                                    if (!va) {
                                        const lineContent = model.getLineContent(iv.range.startLineNumber);
                                        va = lineContent.substring(iv.range.startColumn - 1, iv.range.endColumn - 1);
                                    }
                                    const value = await findVariable(va, iv.caseSensitiveLookup);
                                    if (value) {
                                        text = strings.format(var_value_format, va, value);
                                    }
                                    break;
                                }
                                case 'expression': {
                                    let expr = iv.expression;
                                    if (!expr) {
                                        const lineContent = model.getLineContent(iv.range.startLineNumber);
                                        expr = lineContent.substring(iv.range.startColumn - 1, iv.range.endColumn - 1);
                                    }
                                    if (expr) {
                                        const expression = new debugModel_1.Expression(expr);
                                        await expression.evaluate(stackFrame.thread.session, stackFrame, 'watch', true);
                                        if (expression.available) {
                                            text = strings.format(var_value_format, expr, expression.value);
                                        }
                                    }
                                    break;
                                }
                            }
                            if (text) {
                                const line = iv.range.startLineNumber;
                                let lineSegments = lineDecorations.get(line);
                                if (!lineSegments) {
                                    lineSegments = [];
                                    lineDecorations.set(line, lineSegments);
                                }
                                if (!lineSegments.some(iv => iv.text === text)) { // de-dupe
                                    lineSegments.push(new InlineSegment(iv.range.startColumn, text));
                                }
                            }
                        }
                    }
                }, err => {
                    (0, errors_1.onUnexpectedExternalError)(err);
                }))));
                const startTime = Date.now();
                await Promise.all(promises);
                // update debounce info
                this.updateInlineValuesScheduler.delay = this.debounceInfo.update(model, Date.now() - startTime);
                // sort line segments and concatenate them into a decoration
                lineDecorations.forEach((segments, line) => {
                    if (segments.length > 0) {
                        segments = segments.sort((a, b) => a.column - b.column);
                        const text = segments.map(s => s.text).join(separator);
                        allDecorations.push(...createInlineValueDecoration(line, text));
                    }
                });
            }
            else {
                // old "one-size-fits-all" strategy
                const scopes = await stackFrame.getMostSpecificScopes(stackFrame.range);
                // Get all top level variables in the scope chain
                const decorationsPerScope = await Promise.all(scopes.map(async (scope) => {
                    const variables = await scope.getChildren();
                    let range = new range_1.Range(0, 0, stackFrame.range.startLineNumber, stackFrame.range.startColumn);
                    if (scope.range) {
                        range = range.setStartPosition(scope.range.startLineNumber, scope.range.startColumn);
                    }
                    return createInlineValueDecorationsInsideRange(variables, range, model, this.wordToLineNumbersMap);
                }));
                allDecorations = (0, arrays_1.distinct)(decorationsPerScope.reduce((previous, current) => previous.concat(current), []), 
                // Deduplicate decorations since same variable can appear in multiple scopes, leading to duplicated decorations #129770
                decoration => { var _a; return `${decoration.range.startLineNumber}:${(_a = decoration === null || decoration === void 0 ? void 0 : decoration.options.after) === null || _a === void 0 ? void 0 : _a.content}`; });
            }
            this.oldDecorations = this.editor.deltaDecorations(this.oldDecorations, allDecorations);
        }
        dispose() {
            if (this.hoverWidget) {
                this.hoverWidget.dispose();
            }
            if (this.configurationWidget) {
                this.configurationWidget.dispose();
            }
            this.toDispose = (0, lifecycle_1.dispose)(this.toDispose);
            this.oldDecorations = this.editor.deltaDecorations(this.oldDecorations, []);
        }
    };
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "showHoverScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "hideHoverScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "removeInlineValuesScheduler", null);
    __decorate([
        decorators_1.memoize
    ], DebugEditorContribution.prototype, "updateInlineValuesScheduler", null);
    DebugEditorContribution = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, commands_1.ICommandService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, host_1.IHostService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, languageFeatures_1.ILanguageFeaturesService),
        __param(9, languageFeatureDebounce_1.ILanguageFeatureDebounceService)
    ], DebugEditorContribution);
    exports.DebugEditorContribution = DebugEditorContribution;
});
//# sourceMappingURL=debugEditorContribution.js.map