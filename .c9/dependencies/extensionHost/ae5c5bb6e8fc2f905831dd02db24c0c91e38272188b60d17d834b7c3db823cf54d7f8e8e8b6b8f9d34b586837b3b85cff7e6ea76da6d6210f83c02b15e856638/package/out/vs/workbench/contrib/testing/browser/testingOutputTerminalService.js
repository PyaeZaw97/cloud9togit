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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/types", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/terminal/common/terminal", "vs/workbench/common/views", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/testResultService"], function (require, exports, async_1, event_1, lifecycle_1, stream_1, types_1, nls_1, instantiation_1, terminal_1, views_1, terminal_2, terminal_3, icons_1, testResultService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingOutputTerminalService = exports.ITestingOutputTerminalService = void 0;
    const friendlyDate = (date) => {
        const d = new Date(date);
        return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    };
    const getTitle = (result) => {
        var _a;
        return result
            ? (0, nls_1.localize)('testOutputTerminalTitleWithDate', 'Test Output at {0}', friendlyDate((_a = result.completedAt) !== null && _a !== void 0 ? _a : Date.now()))
            : genericTitle;
    };
    const genericTitle = (0, nls_1.localize)('testOutputTerminalTitle', 'Test Output');
    exports.ITestingOutputTerminalService = (0, instantiation_1.createDecorator)('ITestingOutputTerminalService');
    let TestingOutputTerminalService = class TestingOutputTerminalService {
        constructor(terminalService, terminalGroupService, terminalEditorService, resultService, viewsService) {
            this.terminalService = terminalService;
            this.terminalGroupService = terminalGroupService;
            this.terminalEditorService = terminalEditorService;
            this.viewsService = viewsService;
            this.outputTerminals = new WeakMap();
            // If a result terminal is currently active and we start a new test run,
            // stream live results there automatically.
            resultService.onResultsChanged(evt => {
                const active = this.terminalService.activeInstance;
                if (!('started' in evt) || !active) {
                    return;
                }
                const pane = this.viewsService.getActiveViewWithId(terminal_3.TERMINAL_VIEW_ID);
                if (!pane) {
                    return;
                }
                const output = this.outputTerminals.get(active);
                if (output && output.ended) {
                    this.showResultsInTerminal(active, output, evt.started);
                }
            });
        }
        /**
         * @inheritdoc
         */
        async open(result) {
            const testOutputPtys = this.terminalService.instances
                .map(t => {
                const output = this.outputTerminals.get(t);
                return output ? [t, output] : undefined;
            })
                .filter(types_1.isDefined);
            // If there's an existing terminal for the attempted reveal, show that instead.
            const existing = testOutputPtys.find(([, o]) => o.resultId === (result === null || result === void 0 ? void 0 : result.id));
            if (existing) {
                this.terminalService.setActiveInstance(existing[0]);
                if (existing[0].target === terminal_1.TerminalLocation.Editor) {
                    this.terminalEditorService.revealActiveEditor();
                }
                else {
                    this.terminalGroupService.showPanel();
                }
                return;
            }
            // Try to reuse ended terminals, otherwise make a new one
            const ended = testOutputPtys.find(([, o]) => o.ended);
            if (ended) {
                ended[1].clear();
                this.showResultsInTerminal(ended[0], ended[1], result);
                return;
            }
            const output = new TestOutputProcess();
            this.showResultsInTerminal(await this.terminalService.createTerminal({
                config: {
                    isFeatureTerminal: true,
                    icon: icons_1.testingViewIcon,
                    customPtyImplementation: () => output,
                    name: getTitle(result),
                }
            }), output, result);
        }
        async showResultsInTerminal(terminal, output, result) {
            this.outputTerminals.set(terminal, output);
            output.resetFor(result === null || result === void 0 ? void 0 : result.id, getTitle(result));
            this.terminalService.setActiveInstance(terminal);
            if (terminal.target === terminal_1.TerminalLocation.Editor) {
                this.terminalEditorService.revealActiveEditor();
            }
            else {
                this.terminalGroupService.showPanel();
            }
            if (!result) {
                // seems like it takes a tick for listeners to be registered
                output.ended = true;
                setTimeout(() => output.pushData((0, nls_1.localize)('testNoRunYet', '\r\nNo tests have been run, yet.\r\n')));
                return;
            }
            const [stream] = await Promise.all([result.getOutput(), output.started]);
            let hadData = false;
            (0, stream_1.listenStream)(stream, {
                onData: d => {
                    hadData = true;
                    output.pushData(d.toString());
                },
                onError: err => output.pushData(`\r\n\r\n${err.stack || err.message}`),
                onEnd: () => {
                    if (!hadData) {
                        output.pushData(`\x1b[2m${(0, nls_1.localize)('runNoOutout', 'The test run did not record any output.')}\x1b[0m`);
                    }
                    const completedAt = result.completedAt ? new Date(result.completedAt) : new Date();
                    const text = (0, nls_1.localize)('runFinished', 'Test run finished at {0}', completedAt.toLocaleString());
                    output.pushData(`\r\n\r\n\x1b[1m> ${text} <\x1b[0m\r\n\r\n`);
                    output.ended = true;
                },
            });
        }
    };
    TestingOutputTerminalService = __decorate([
        __param(0, terminal_2.ITerminalService),
        __param(1, terminal_2.ITerminalGroupService),
        __param(2, terminal_2.ITerminalEditorService),
        __param(3, testResultService_1.ITestResultService),
        __param(4, views_1.IViewsService)
    ], TestingOutputTerminalService);
    exports.TestingOutputTerminalService = TestingOutputTerminalService;
    class TestOutputProcess extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.onDidChangeProperty = event_1.Event.None;
            this.processDataEmitter = this._register(new event_1.Emitter());
            this.titleEmitter = this._register(new event_1.Emitter());
            this.startedDeferred = new async_1.DeferredPromise();
            /** Whether the associated test has ended (indicating the terminal can be reused) */
            this.ended = true;
            /** Promise resolved when the terminal is ready to take data */
            this.started = this.startedDeferred.p;
            //#region implementation
            this.id = 0;
            this.shouldPersist = false;
            this.onProcessData = this.processDataEmitter.event;
            this.onProcessExit = this._register(new event_1.Emitter()).event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this.onProcessTitleChanged = this.titleEmitter.event;
            this.onProcessShellTypeChanged = this._register(new event_1.Emitter()).event;
            //#endregion
        }
        pushData(data) {
            this.processDataEmitter.fire(data);
        }
        clear() {
            this.processDataEmitter.fire('\x1bc');
        }
        resetFor(resultId, title) {
            this.ended = false;
            this.resultId = resultId;
            this.titleEmitter.fire(title);
        }
        start() {
            this.startedDeferred.complete();
            this._onProcessReady.fire({ pid: -1, cwd: '' });
            return Promise.resolve(undefined);
        }
        shutdown() {
            // no-op
        }
        input() {
            // not supported
        }
        processBinary() {
            return Promise.resolve();
        }
        resize() {
            // no-op
        }
        acknowledgeDataEvent() {
            // no-op, flow control not currently implemented
        }
        setUnicodeVersion() {
            // no-op
            return Promise.resolve();
        }
        getInitialCwd() {
            return Promise.resolve('');
        }
        getCwd() {
            return Promise.resolve('');
        }
        getLatency() {
            return Promise.resolve(0);
        }
        refreshProperty(property) {
            throw new Error(`refreshProperty is not suppported in TestOutputProcesses. property: ${property}`);
        }
        updateProperty(property, value) {
            throw new Error(`updateProperty is not suppported in TestOutputProcesses. property: ${property}, value: ${value}`);
        }
    }
});
//# sourceMappingURL=testingOutputTerminalService.js.map