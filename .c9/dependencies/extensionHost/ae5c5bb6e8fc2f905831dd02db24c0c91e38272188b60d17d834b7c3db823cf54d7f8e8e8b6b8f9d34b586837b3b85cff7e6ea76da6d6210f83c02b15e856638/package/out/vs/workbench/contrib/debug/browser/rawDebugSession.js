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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/workbench/contrib/debug/common/debugUtils", "vs/platform/debug/common/extensionHostDebug", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/base/common/network"], function (require, exports, nls, event_1, objects, actions_1, errors, errorMessage_1, debugUtils_1, extensionHostDebug_1, uri_1, opener_1, lifecycle_1, notification_1, dialogs_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RawDebugSession = void 0;
    /**
     * Encapsulates the DebugAdapter lifecycle and some idiosyncrasies of the Debug Adapter Protocol.
     */
    let RawDebugSession = class RawDebugSession {
        constructor(debugAdapter, dbgr, sessionId, extensionHostDebugService, openerService, notificationService, dialogSerivce) {
            this.dbgr = dbgr;
            this.sessionId = sessionId;
            this.extensionHostDebugService = extensionHostDebugService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.dialogSerivce = dialogSerivce;
            this.allThreadsContinued = true;
            this._readyForBreakpoints = false;
            // shutdown
            this.debugAdapterStopped = false;
            this.inShutdown = false;
            this.terminated = false;
            this.firedAdapterExitEvent = false;
            // telemetry
            this.startTime = 0;
            this.didReceiveStoppedEvent = false;
            // DAP events
            this._onDidInitialize = new event_1.Emitter();
            this._onDidStop = new event_1.Emitter();
            this._onDidContinued = new event_1.Emitter();
            this._onDidTerminateDebugee = new event_1.Emitter();
            this._onDidExitDebugee = new event_1.Emitter();
            this._onDidThread = new event_1.Emitter();
            this._onDidOutput = new event_1.Emitter();
            this._onDidBreakpoint = new event_1.Emitter();
            this._onDidLoadedSource = new event_1.Emitter();
            this._onDidProgressStart = new event_1.Emitter();
            this._onDidProgressUpdate = new event_1.Emitter();
            this._onDidProgressEnd = new event_1.Emitter();
            this._onDidInvalidated = new event_1.Emitter();
            this._onDidInvalidateMemory = new event_1.Emitter();
            this._onDidCustomEvent = new event_1.Emitter();
            this._onDidEvent = new event_1.Emitter();
            // DA events
            this._onDidExitAdapter = new event_1.Emitter();
            this.toDispose = [];
            this.debugAdapter = debugAdapter;
            this._capabilities = Object.create(null);
            this.toDispose.push(this.debugAdapter.onError(err => {
                this.shutdown(err);
            }));
            this.toDispose.push(this.debugAdapter.onExit(code => {
                if (code !== 0) {
                    this.shutdown(new Error(`exit code: ${code}`));
                }
                else {
                    // normal exit
                    this.shutdown();
                }
            }));
            this.debugAdapter.onEvent(event => {
                switch (event.event) {
                    case 'initialized':
                        this._readyForBreakpoints = true;
                        this._onDidInitialize.fire(event);
                        break;
                    case 'loadedSource':
                        this._onDidLoadedSource.fire(event);
                        break;
                    case 'capabilities':
                        if (event.body) {
                            const capabilities = event.body.capabilities;
                            this.mergeCapabilities(capabilities);
                        }
                        break;
                    case 'stopped':
                        this.didReceiveStoppedEvent = true; // telemetry: remember that debugger stopped successfully
                        this._onDidStop.fire(event);
                        break;
                    case 'continued':
                        this.allThreadsContinued = event.body.allThreadsContinued === false ? false : true;
                        this._onDidContinued.fire(event);
                        break;
                    case 'thread':
                        this._onDidThread.fire(event);
                        break;
                    case 'output':
                        this._onDidOutput.fire(event);
                        break;
                    case 'breakpoint':
                        this._onDidBreakpoint.fire(event);
                        break;
                    case 'terminated':
                        this._onDidTerminateDebugee.fire(event);
                        break;
                    case 'exit':
                        this._onDidExitDebugee.fire(event);
                        break;
                    case 'progressStart':
                        this._onDidProgressStart.fire(event);
                        break;
                    case 'progressUpdate':
                        this._onDidProgressUpdate.fire(event);
                        break;
                    case 'progressEnd':
                        this._onDidProgressEnd.fire(event);
                        break;
                    case 'invalidated':
                        this._onDidInvalidated.fire(event);
                        break;
                    case 'memory':
                        this._onDidInvalidateMemory.fire(event);
                        break;
                    case 'process':
                        break;
                    case 'module':
                        break;
                    default:
                        this._onDidCustomEvent.fire(event);
                        break;
                }
                this._onDidEvent.fire(event);
            });
            this.debugAdapter.onRequest(request => this.dispatchRequest(request, dbgr));
        }
        get onDidExitAdapter() {
            return this._onDidExitAdapter.event;
        }
        get capabilities() {
            return this._capabilities;
        }
        /**
         * DA is ready to accepts setBreakpoint requests.
         * Becomes true after "initialized" events has been received.
         */
        get readyForBreakpoints() {
            return this._readyForBreakpoints;
        }
        //---- DAP events
        get onDidInitialize() {
            return this._onDidInitialize.event;
        }
        get onDidStop() {
            return this._onDidStop.event;
        }
        get onDidContinued() {
            return this._onDidContinued.event;
        }
        get onDidTerminateDebugee() {
            return this._onDidTerminateDebugee.event;
        }
        get onDidExitDebugee() {
            return this._onDidExitDebugee.event;
        }
        get onDidThread() {
            return this._onDidThread.event;
        }
        get onDidOutput() {
            return this._onDidOutput.event;
        }
        get onDidBreakpoint() {
            return this._onDidBreakpoint.event;
        }
        get onDidLoadedSource() {
            return this._onDidLoadedSource.event;
        }
        get onDidCustomEvent() {
            return this._onDidCustomEvent.event;
        }
        get onDidProgressStart() {
            return this._onDidProgressStart.event;
        }
        get onDidProgressUpdate() {
            return this._onDidProgressUpdate.event;
        }
        get onDidProgressEnd() {
            return this._onDidProgressEnd.event;
        }
        get onDidInvalidated() {
            return this._onDidInvalidated.event;
        }
        get onDidInvalidateMemory() {
            return this._onDidInvalidateMemory.event;
        }
        get onDidEvent() {
            return this._onDidEvent.event;
        }
        //---- DebugAdapter lifecycle
        /**
         * Starts the underlying debug adapter and tracks the session time for telemetry.
         */
        async start() {
            if (!this.debugAdapter) {
                return Promise.reject(new Error(nls.localize('noDebugAdapterStart', "No debug adapter, can not start debug session.")));
            }
            await this.debugAdapter.startSession();
            this.startTime = new Date().getTime();
        }
        /**
         * Send client capabilities to the debug adapter and receive DA capabilities in return.
         */
        async initialize(args) {
            const response = await this.send('initialize', args, undefined, undefined, false);
            if (response) {
                this.mergeCapabilities(response.body);
            }
            return response;
        }
        /**
         * Terminate the debuggee and shutdown the adapter
         */
        disconnect(args) {
            const terminateDebuggee = this.capabilities.supportTerminateDebuggee ? args.terminateDebuggee : undefined;
            const suspendDebuggee = this.capabilities.supportTerminateDebuggee && this.capabilities.supportSuspendDebuggee ? args.suspendDebuggee : undefined;
            return this.shutdown(undefined, args.restart, terminateDebuggee, suspendDebuggee);
        }
        //---- DAP requests
        async launchOrAttach(config) {
            const response = await this.send(config.request, config, undefined, undefined, false);
            if (response) {
                this.mergeCapabilities(response.body);
            }
            return response;
        }
        /**
         * Try killing the debuggee softly...
         */
        terminate(restart = false) {
            if (this.capabilities.supportsTerminateRequest) {
                if (!this.terminated) {
                    this.terminated = true;
                    return this.send('terminate', { restart }, undefined, 2000);
                }
                return this.disconnect({ terminateDebuggee: true, restart });
            }
            return Promise.reject(new Error('terminated not supported'));
        }
        restart(args) {
            if (this.capabilities.supportsRestartRequest) {
                return this.send('restart', args);
            }
            return Promise.reject(new Error('restart not supported'));
        }
        async next(args) {
            const response = await this.send('next', args);
            this.fireSimulatedContinuedEvent(args.threadId);
            return response;
        }
        async stepIn(args) {
            const response = await this.send('stepIn', args);
            this.fireSimulatedContinuedEvent(args.threadId);
            return response;
        }
        async stepOut(args) {
            const response = await this.send('stepOut', args);
            this.fireSimulatedContinuedEvent(args.threadId);
            return response;
        }
        async continue(args) {
            const response = await this.send('continue', args);
            if (response && response.body && response.body.allThreadsContinued !== undefined) {
                this.allThreadsContinued = response.body.allThreadsContinued;
            }
            this.fireSimulatedContinuedEvent(args.threadId, this.allThreadsContinued);
            return response;
        }
        pause(args) {
            return this.send('pause', args);
        }
        terminateThreads(args) {
            if (this.capabilities.supportsTerminateThreadsRequest) {
                return this.send('terminateThreads', args);
            }
            return Promise.reject(new Error('terminateThreads not supported'));
        }
        setVariable(args) {
            if (this.capabilities.supportsSetVariable) {
                return this.send('setVariable', args);
            }
            return Promise.reject(new Error('setVariable not supported'));
        }
        setExpression(args) {
            if (this.capabilities.supportsSetExpression) {
                return this.send('setExpression', args);
            }
            return Promise.reject(new Error('setExpression not supported'));
        }
        async restartFrame(args, threadId) {
            if (this.capabilities.supportsRestartFrame) {
                const response = await this.send('restartFrame', args);
                this.fireSimulatedContinuedEvent(threadId);
                return response;
            }
            return Promise.reject(new Error('restartFrame not supported'));
        }
        stepInTargets(args) {
            if (this.capabilities.supportsStepInTargetsRequest) {
                return this.send('stepInTargets', args);
            }
            return Promise.reject(new Error('stepInTargets not supported'));
        }
        completions(args, token) {
            if (this.capabilities.supportsCompletionsRequest) {
                return this.send('completions', args, token);
            }
            return Promise.reject(new Error('completions not supported'));
        }
        setBreakpoints(args) {
            return this.send('setBreakpoints', args);
        }
        setFunctionBreakpoints(args) {
            if (this.capabilities.supportsFunctionBreakpoints) {
                return this.send('setFunctionBreakpoints', args);
            }
            return Promise.reject(new Error('setFunctionBreakpoints not supported'));
        }
        dataBreakpointInfo(args) {
            if (this.capabilities.supportsDataBreakpoints) {
                return this.send('dataBreakpointInfo', args);
            }
            return Promise.reject(new Error('dataBreakpointInfo not supported'));
        }
        setDataBreakpoints(args) {
            if (this.capabilities.supportsDataBreakpoints) {
                return this.send('setDataBreakpoints', args);
            }
            return Promise.reject(new Error('setDataBreakpoints not supported'));
        }
        setExceptionBreakpoints(args) {
            return this.send('setExceptionBreakpoints', args);
        }
        breakpointLocations(args) {
            if (this.capabilities.supportsBreakpointLocationsRequest) {
                return this.send('breakpointLocations', args);
            }
            return Promise.reject(new Error('breakpointLocations is not supported'));
        }
        configurationDone() {
            if (this.capabilities.supportsConfigurationDoneRequest) {
                return this.send('configurationDone', null);
            }
            return Promise.reject(new Error('configurationDone not supported'));
        }
        stackTrace(args, token) {
            return this.send('stackTrace', args, token);
        }
        exceptionInfo(args) {
            if (this.capabilities.supportsExceptionInfoRequest) {
                return this.send('exceptionInfo', args);
            }
            return Promise.reject(new Error('exceptionInfo not supported'));
        }
        scopes(args, token) {
            return this.send('scopes', args, token);
        }
        variables(args, token) {
            return this.send('variables', args, token);
        }
        source(args) {
            return this.send('source', args);
        }
        loadedSources(args) {
            if (this.capabilities.supportsLoadedSourcesRequest) {
                return this.send('loadedSources', args);
            }
            return Promise.reject(new Error('loadedSources not supported'));
        }
        threads() {
            return this.send('threads', null);
        }
        evaluate(args) {
            return this.send('evaluate', args);
        }
        async stepBack(args) {
            if (this.capabilities.supportsStepBack) {
                const response = await this.send('stepBack', args);
                this.fireSimulatedContinuedEvent(args.threadId);
                return response;
            }
            return Promise.reject(new Error('stepBack not supported'));
        }
        async reverseContinue(args) {
            if (this.capabilities.supportsStepBack) {
                const response = await this.send('reverseContinue', args);
                this.fireSimulatedContinuedEvent(args.threadId);
                return response;
            }
            return Promise.reject(new Error('reverseContinue not supported'));
        }
        gotoTargets(args) {
            if (this.capabilities.supportsGotoTargetsRequest) {
                return this.send('gotoTargets', args);
            }
            return Promise.reject(new Error('gotoTargets is not supported'));
        }
        async goto(args) {
            if (this.capabilities.supportsGotoTargetsRequest) {
                const response = await this.send('goto', args);
                this.fireSimulatedContinuedEvent(args.threadId);
                return response;
            }
            return Promise.reject(new Error('goto is not supported'));
        }
        async setInstructionBreakpoints(args) {
            if (this.capabilities.supportsInstructionBreakpoints) {
                return await this.send('setInstructionBreakpoints', args);
            }
            return Promise.reject(new Error('setInstructionBreakpoints is not supported'));
        }
        async disassemble(args) {
            if (this.capabilities.supportsDisassembleRequest) {
                return await this.send('disassemble', args);
            }
            return Promise.reject(new Error('disassemble is not supported'));
        }
        async readMemory(args) {
            if (this.capabilities.supportsReadMemoryRequest) {
                return await this.send('readMemory', args);
            }
            return Promise.reject(new Error('readMemory is not supported'));
        }
        async writeMemory(args) {
            if (this.capabilities.supportsWriteMemoryRequest) {
                return await this.send('writeMemory', args);
            }
            return Promise.reject(new Error('writeMemory is not supported'));
        }
        cancel(args) {
            return this.send('cancel', args);
        }
        custom(request, args) {
            return this.send(request, args);
        }
        //---- private
        async shutdown(error, restart = false, terminateDebuggee = undefined, suspendDebuggee = undefined) {
            if (!this.inShutdown) {
                this.inShutdown = true;
                if (this.debugAdapter) {
                    try {
                        const args = { restart };
                        if (typeof terminateDebuggee === 'boolean') {
                            args.terminateDebuggee = terminateDebuggee;
                        }
                        if (typeof suspendDebuggee === 'boolean') {
                            args.suspendDebuggee = suspendDebuggee;
                        }
                        this.send('disconnect', args, undefined, 2000);
                    }
                    catch (e) {
                        // Catch the potential 'disconnect' error - no need to show it to the user since the adapter is shutting down
                    }
                    finally {
                        this.stopAdapter(error);
                    }
                }
                else {
                    return this.stopAdapter(error);
                }
            }
        }
        async stopAdapter(error) {
            try {
                if (this.debugAdapter) {
                    const da = this.debugAdapter;
                    this.debugAdapter = null;
                    await da.stopSession();
                    this.debugAdapterStopped = true;
                }
            }
            finally {
                this.fireAdapterExitEvent(error);
            }
        }
        fireAdapterExitEvent(error) {
            if (!this.firedAdapterExitEvent) {
                this.firedAdapterExitEvent = true;
                const e = {
                    emittedStopped: this.didReceiveStoppedEvent,
                    sessionLengthInSeconds: (new Date().getTime() - this.startTime) / 1000
                };
                if (error && !this.debugAdapterStopped) {
                    e.error = error;
                }
                this._onDidExitAdapter.fire(e);
            }
        }
        async dispatchRequest(request, dbgr) {
            const response = {
                type: 'response',
                seq: 0,
                command: request.command,
                request_seq: request.seq,
                success: true
            };
            const safeSendResponse = (response) => this.debugAdapter && this.debugAdapter.sendResponse(response);
            switch (request.command) {
                case 'launchVSCode':
                    try {
                        let result = await this.launchVsCode(request.arguments);
                        if (!result.success) {
                            const showResult = await this.dialogSerivce.show(notification_1.Severity.Warning, nls.localize('canNotStart', "The debugger needs to open a new tab or window for the debuggee but the browser prevented this. You must give permission to continue."), [nls.localize('continue', "Continue"), nls.localize('cancel', "Cancel")], { cancelId: 1 });
                            if (showResult.choice === 0) {
                                result = await this.launchVsCode(request.arguments);
                            }
                            else {
                                response.success = false;
                                safeSendResponse(response);
                                await this.shutdown();
                            }
                        }
                        response.body = {
                            rendererDebugPort: result.rendererDebugPort,
                        };
                        safeSendResponse(response);
                    }
                    catch (err) {
                        response.success = false;
                        response.message = err.message;
                        safeSendResponse(response);
                    }
                    break;
                case 'runInTerminal':
                    try {
                        const shellProcessId = await dbgr.runInTerminal(request.arguments, this.sessionId);
                        const resp = response;
                        resp.body = {};
                        if (typeof shellProcessId === 'number') {
                            resp.body.shellProcessId = shellProcessId;
                        }
                        safeSendResponse(resp);
                    }
                    catch (err) {
                        response.success = false;
                        response.message = err.message;
                        safeSendResponse(response);
                    }
                    break;
                default:
                    response.success = false;
                    response.message = `unknown request '${request.command}'`;
                    safeSendResponse(response);
                    break;
            }
        }
        launchVsCode(vscodeArgs) {
            const args = [];
            for (const arg of vscodeArgs.args) {
                const a2 = (arg.prefix || '') + (arg.path || '');
                const match = /^--(.+)=(.+)$/.exec(a2);
                if (match && match.length === 3) {
                    const key = match[1];
                    let value = match[2];
                    if ((key === 'file-uri' || key === 'folder-uri') && !(0, debugUtils_1.isUri)(arg.path)) {
                        value = (0, debugUtils_1.isUri)(value) ? value : uri_1.URI.file(value).toString();
                    }
                    args.push(`--${key}=${value}`);
                }
                else {
                    args.push(a2);
                }
            }
            if (vscodeArgs.env) {
                args.push(`--extensionEnvironment=${JSON.stringify(vscodeArgs.env)}`);
            }
            return this.extensionHostDebugService.openExtensionDevelopmentHostWindow(args, !!vscodeArgs.debugRenderer);
        }
        send(command, args, token, timeout, showErrors = true) {
            return new Promise((completeDispatch, errorDispatch) => {
                if (!this.debugAdapter) {
                    if (this.inShutdown) {
                        // We are in shutdown silently complete
                        completeDispatch(undefined);
                    }
                    else {
                        errorDispatch(new Error(nls.localize('noDebugAdapter', "No debugger available found. Can not send '{0}'.", command)));
                    }
                    return;
                }
                let cancelationListener;
                const requestId = this.debugAdapter.sendRequest(command, args, (response) => {
                    if (cancelationListener) {
                        cancelationListener.dispose();
                    }
                    if (response.success) {
                        completeDispatch(response);
                    }
                    else {
                        errorDispatch(response);
                    }
                }, timeout);
                if (token) {
                    cancelationListener = token.onCancellationRequested(() => {
                        cancelationListener.dispose();
                        if (this.capabilities.supportsCancelRequest) {
                            this.cancel({ requestId });
                        }
                    });
                }
            }).then(undefined, err => Promise.reject(this.handleErrorResponse(err, showErrors)));
        }
        handleErrorResponse(errorResponse, showErrors) {
            var _a;
            if (errorResponse.command === 'canceled' && errorResponse.message === 'canceled') {
                return errors.canceled();
            }
            const error = (_a = errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.body) === null || _a === void 0 ? void 0 : _a.error;
            const errorMessage = (errorResponse === null || errorResponse === void 0 ? void 0 : errorResponse.message) || '';
            const userMessage = error ? (0, debugUtils_1.formatPII)(error.format, false, error.variables) : errorMessage;
            const url = error === null || error === void 0 ? void 0 : error.url;
            if (error && url) {
                const label = error.urlLabel ? error.urlLabel : nls.localize('moreInfo', "More Info");
                const uri = uri_1.URI.parse(url);
                // Use a suffixed id if uri invokes a command, so default 'Open launch.json' command is suppressed on dialog
                const actionId = uri.scheme === network_1.Schemas.command ? 'debug.moreInfo.command' : 'debug.moreInfo';
                return (0, errorMessage_1.createErrorWithActions)(userMessage, [(0, actions_1.toAction)({ id: actionId, label, run: () => this.openerService.open(uri, { allowCommands: true }) })]);
            }
            if (showErrors && error && error.format && error.showUser) {
                this.notificationService.error(userMessage);
            }
            const result = new Error(userMessage);
            result.showUser = error === null || error === void 0 ? void 0 : error.showUser;
            return result;
        }
        mergeCapabilities(capabilities) {
            if (capabilities) {
                this._capabilities = objects.mixin(this._capabilities, capabilities);
            }
        }
        fireSimulatedContinuedEvent(threadId, allThreadsContinued = false) {
            this._onDidContinued.fire({
                type: 'event',
                event: 'continued',
                body: {
                    threadId,
                    allThreadsContinued
                },
                seq: undefined
            });
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    RawDebugSession = __decorate([
        __param(3, extensionHostDebug_1.IExtensionHostDebugService),
        __param(4, opener_1.IOpenerService),
        __param(5, notification_1.INotificationService),
        __param(6, dialogs_1.IDialogService)
    ], RawDebugSession);
    exports.RawDebugSession = RawDebugSession;
});
//# sourceMappingURL=rawDebugSession.js.map