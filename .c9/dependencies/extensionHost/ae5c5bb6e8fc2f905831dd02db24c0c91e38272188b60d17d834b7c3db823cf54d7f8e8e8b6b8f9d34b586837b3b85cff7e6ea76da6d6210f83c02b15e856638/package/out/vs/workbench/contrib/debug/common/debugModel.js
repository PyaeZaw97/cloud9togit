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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/nls", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugSource", "vs/workbench/contrib/debug/common/disassemblyViewInput", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, arrays_1, async_1, buffer_1, cancellation_1, event_1, lifecycle_1, objects_1, resources, types_1, uri_1, uuid_1, range_1, nls, uriIdentity_1, debug_1, debugSource_1, disassemblyViewInput_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugModel = exports.Memory = exports.ThreadAndSessionIds = exports.InstructionBreakpoint = exports.ExceptionBreakpoint = exports.DataBreakpoint = exports.FunctionBreakpoint = exports.Breakpoint = exports.BaseBreakpoint = exports.Enablement = exports.MemoryRegion = exports.getUriForDebugMemory = exports.Thread = exports.StackFrame = exports.ErrorScope = exports.Scope = exports.Variable = exports.Expression = exports.ExpressionContainer = void 0;
    class ExpressionContainer {
        constructor(session, threadId, _reference, id, namedVariables = 0, indexedVariables = 0, memoryReference = undefined, startOfVariables = 0, presentationHint = undefined) {
            this.session = session;
            this.threadId = threadId;
            this._reference = _reference;
            this.id = id;
            this.namedVariables = namedVariables;
            this.indexedVariables = indexedVariables;
            this.memoryReference = memoryReference;
            this.startOfVariables = startOfVariables;
            this.presentationHint = presentationHint;
            this.valueChanged = false;
            this._value = '';
        }
        get reference() {
            return this._reference;
        }
        set reference(value) {
            this._reference = value;
            this.children = undefined; // invalidate children cache
        }
        async evaluateLazy() {
            if (typeof this.reference === 'undefined') {
                return;
            }
            const response = await this.session.variables(this.reference, this.threadId, undefined, undefined, undefined);
            if (!response || !response.body || !response.body.variables || response.body.variables.length !== 1) {
                return;
            }
            const dummyVar = response.body.variables[0];
            this.reference = dummyVar.variablesReference;
            this._value = dummyVar.value;
            this.namedVariables = dummyVar.namedVariables;
            this.indexedVariables = dummyVar.indexedVariables;
            this.memoryReference = dummyVar.memoryReference;
            this.presentationHint = dummyVar.presentationHint;
            // Also call overridden method to adopt subclass props
            this.adoptLazyResponse(dummyVar);
        }
        adoptLazyResponse(response) {
        }
        getChildren() {
            if (!this.children) {
                this.children = this.doGetChildren();
            }
            return this.children;
        }
        async doGetChildren() {
            if (!this.hasChildren) {
                return [];
            }
            if (!this.getChildrenInChunks) {
                return this.fetchVariables(undefined, undefined, undefined);
            }
            // Check if object has named variables, fetch them independent from indexed variables #9670
            const children = this.namedVariables ? await this.fetchVariables(undefined, undefined, 'named') : [];
            // Use a dynamic chunk size based on the number of elements #9774
            let chunkSize = ExpressionContainer.BASE_CHUNK_SIZE;
            while (!!this.indexedVariables && this.indexedVariables > chunkSize * ExpressionContainer.BASE_CHUNK_SIZE) {
                chunkSize *= ExpressionContainer.BASE_CHUNK_SIZE;
            }
            if (!!this.indexedVariables && this.indexedVariables > chunkSize) {
                // There are a lot of children, create fake intermediate values that represent chunks #9537
                const numberOfChunks = Math.ceil(this.indexedVariables / chunkSize);
                for (let i = 0; i < numberOfChunks; i++) {
                    const start = (this.startOfVariables || 0) + i * chunkSize;
                    const count = Math.min(chunkSize, this.indexedVariables - i * chunkSize);
                    children.push(new Variable(this.session, this.threadId, this, this.reference, `[${start}..${start + count - 1}]`, '', '', undefined, count, undefined, { kind: 'virtual' }, undefined, undefined, true, start));
                }
                return children;
            }
            const variables = await this.fetchVariables(this.startOfVariables, this.indexedVariables, 'indexed');
            return children.concat(variables);
        }
        getId() {
            return this.id;
        }
        getSession() {
            return this.session;
        }
        get value() {
            return this._value;
        }
        get hasChildren() {
            var _a;
            // only variables with reference > 0 have children.
            return !!this.reference && this.reference > 0 && !((_a = this.presentationHint) === null || _a === void 0 ? void 0 : _a.lazy);
        }
        async fetchVariables(start, count, filter) {
            try {
                const response = await this.session.variables(this.reference || 0, this.threadId, filter, start, count);
                if (!response || !response.body || !response.body.variables) {
                    return [];
                }
                const nameCount = new Map();
                const vars = response.body.variables.filter(v => !!v).map((v) => {
                    if ((0, types_1.isString)(v.value) && (0, types_1.isString)(v.name) && typeof v.variablesReference === 'number') {
                        const count = nameCount.get(v.name) || 0;
                        const idDuplicationIndex = count > 0 ? count.toString() : '';
                        nameCount.set(v.name, count + 1);
                        return new Variable(this.session, this.threadId, this, v.variablesReference, v.name, v.evaluateName, v.value, v.namedVariables, v.indexedVariables, v.memoryReference, v.presentationHint, v.type, v.__vscodeVariableMenuContext, true, 0, idDuplicationIndex);
                    }
                    return new Variable(this.session, this.threadId, this, 0, '', undefined, nls.localize('invalidVariableAttributes', "Invalid variable attributes"), 0, 0, undefined, { kind: 'virtual' }, undefined, undefined, false);
                });
                if (this.session.autoExpandLazyVariables) {
                    await Promise.all(vars.map(v => { var _a; return ((_a = v.presentationHint) === null || _a === void 0 ? void 0 : _a.lazy) && v.evaluateLazy(); }));
                }
                return vars;
            }
            catch (e) {
                return [new Variable(this.session, this.threadId, this, 0, '', undefined, e.message, 0, 0, undefined, { kind: 'virtual' }, undefined, undefined, false)];
            }
        }
        // The adapter explicitly sents the children count of an expression only if there are lots of children which should be chunked.
        get getChildrenInChunks() {
            return !!this.indexedVariables;
        }
        set value(value) {
            this._value = value;
            this.valueChanged = !!ExpressionContainer.allValues.get(this.getId()) &&
                ExpressionContainer.allValues.get(this.getId()) !== Expression.DEFAULT_VALUE && ExpressionContainer.allValues.get(this.getId()) !== value;
            ExpressionContainer.allValues.set(this.getId(), value);
        }
        toString() {
            return this.value;
        }
        async evaluateExpression(expression, session, stackFrame, context, keepLazyVars = false) {
            var _a;
            if (!session || (!stackFrame && context !== 'repl')) {
                this.value = context === 'repl' ? nls.localize('startDebugFirst', "Please start a debug session to evaluate expressions") : Expression.DEFAULT_VALUE;
                this.reference = 0;
                return false;
            }
            this.session = session;
            try {
                const response = await session.evaluate(expression, stackFrame ? stackFrame.frameId : undefined, context);
                if (response && response.body) {
                    this.value = response.body.result || '';
                    this.reference = response.body.variablesReference;
                    this.namedVariables = response.body.namedVariables;
                    this.indexedVariables = response.body.indexedVariables;
                    this.memoryReference = response.body.memoryReference;
                    this.type = response.body.type || this.type;
                    this.presentationHint = response.body.presentationHint;
                    if (!keepLazyVars && ((_a = response.body.presentationHint) === null || _a === void 0 ? void 0 : _a.lazy)) {
                        await this.evaluateLazy();
                    }
                    return true;
                }
                return false;
            }
            catch (e) {
                this.value = e.message || '';
                this.reference = 0;
                return false;
            }
        }
    }
    exports.ExpressionContainer = ExpressionContainer;
    ExpressionContainer.allValues = new Map();
    // Use chunks to support variable paging #9537
    ExpressionContainer.BASE_CHUNK_SIZE = 100;
    function handleSetResponse(expression, response) {
        if (response && response.body) {
            expression.value = response.body.value || '';
            expression.type = response.body.type || expression.type;
            expression.reference = response.body.variablesReference;
            expression.namedVariables = response.body.namedVariables;
            expression.indexedVariables = response.body.indexedVariables;
            // todo @weinand: the set responses contain most properties, but not memory references. Should they?
        }
    }
    class Expression extends ExpressionContainer {
        constructor(name, id = (0, uuid_1.generateUuid)()) {
            super(undefined, undefined, 0, id);
            this.name = name;
            this.available = false;
            // name is not set if the expression is just being added
            // in that case do not set default value to prevent flashing #14499
            if (name) {
                this.value = Expression.DEFAULT_VALUE;
            }
        }
        async evaluate(session, stackFrame, context, keepLazyVars) {
            this.available = await this.evaluateExpression(this.name, session, stackFrame, context, keepLazyVars);
        }
        toString() {
            return `${this.name}\n${this.value}`;
        }
        async setExpression(value, stackFrame) {
            if (!this.session) {
                return;
            }
            const response = await this.session.setExpression(stackFrame.frameId, this.name, value);
            handleSetResponse(this, response);
        }
    }
    exports.Expression = Expression;
    Expression.DEFAULT_VALUE = nls.localize('notAvailable', "not available");
    class Variable extends ExpressionContainer {
        constructor(session, threadId, parent, reference, name, evaluateName, value, namedVariables, indexedVariables, memoryReference, presentationHint, type = undefined, variableMenuContext = undefined, available = true, startOfVariables = 0, idDuplicationIndex = '') {
            super(session, threadId, reference, `variable:${parent.getId()}:${name}:${idDuplicationIndex}`, namedVariables, indexedVariables, memoryReference, startOfVariables, presentationHint);
            this.parent = parent;
            this.name = name;
            this.evaluateName = evaluateName;
            this.variableMenuContext = variableMenuContext;
            this.available = available;
            this.value = value || '';
            this.type = type;
        }
        async setVariable(value, stackFrame) {
            if (!this.session) {
                return;
            }
            try {
                // Send out a setExpression for debug extensions that do not support set variables https://github.com/microsoft/vscode/issues/124679#issuecomment-869844437
                if (this.session.capabilities.supportsSetExpression && !this.session.capabilities.supportsSetVariable && this.evaluateName) {
                    return this.setExpression(value, stackFrame);
                }
                const response = await this.session.setVariable(this.parent.reference, this.name, value);
                handleSetResponse(this, response);
            }
            catch (err) {
                this.errorMessage = err.message;
            }
        }
        async setExpression(value, stackFrame) {
            if (!this.session || !this.evaluateName) {
                return;
            }
            const response = await this.session.setExpression(stackFrame.frameId, this.evaluateName, value);
            handleSetResponse(this, response);
        }
        toString() {
            return this.name ? `${this.name}: ${this.value}` : this.value;
        }
        adoptLazyResponse(response) {
            this.evaluateName = response.evaluateName;
        }
        toDebugProtocolObject() {
            return {
                name: this.name,
                variablesReference: this.reference || 0,
                memoryReference: this.memoryReference,
                value: this.value,
                evaluateName: this.evaluateName
            };
        }
    }
    exports.Variable = Variable;
    class Scope extends ExpressionContainer {
        constructor(stackFrame, index, name, reference, expensive, namedVariables, indexedVariables, range) {
            super(stackFrame.thread.session, stackFrame.thread.threadId, reference, `scope:${name}:${index}`, namedVariables, indexedVariables);
            this.name = name;
            this.expensive = expensive;
            this.range = range;
        }
        toString() {
            return this.name;
        }
        toDebugProtocolObject() {
            return {
                name: this.name,
                variablesReference: this.reference || 0,
                expensive: this.expensive
            };
        }
    }
    exports.Scope = Scope;
    class ErrorScope extends Scope {
        constructor(stackFrame, index, message) {
            super(stackFrame, index, message, 0, false);
        }
        toString() {
            return this.name;
        }
    }
    exports.ErrorScope = ErrorScope;
    class StackFrame {
        constructor(thread, frameId, source, name, presentationHint, range, index, canRestart, instructionPointerReference) {
            this.thread = thread;
            this.frameId = frameId;
            this.source = source;
            this.name = name;
            this.presentationHint = presentationHint;
            this.range = range;
            this.index = index;
            this.canRestart = canRestart;
            this.instructionPointerReference = instructionPointerReference;
        }
        getId() {
            return `stackframe:${this.thread.getId()}:${this.index}:${this.source.name}`;
        }
        getScopes() {
            if (!this.scopes) {
                this.scopes = this.thread.session.scopes(this.frameId, this.thread.threadId).then(response => {
                    if (!response || !response.body || !response.body.scopes) {
                        return [];
                    }
                    const scopeNameIndexes = new Map();
                    return response.body.scopes.map(rs => {
                        const previousIndex = scopeNameIndexes.get(rs.name);
                        const index = typeof previousIndex === 'number' ? previousIndex + 1 : 0;
                        scopeNameIndexes.set(rs.name, index);
                        return new Scope(this, index, rs.name, rs.variablesReference, rs.expensive, rs.namedVariables, rs.indexedVariables, rs.line && rs.column && rs.endLine && rs.endColumn ? new range_1.Range(rs.line, rs.column, rs.endLine, rs.endColumn) : undefined);
                    });
                }, err => [new ErrorScope(this, 0, err.message)]);
            }
            return this.scopes;
        }
        async getMostSpecificScopes(range) {
            const scopes = await this.getScopes();
            const nonExpensiveScopes = scopes.filter(s => !s.expensive);
            const haveRangeInfo = nonExpensiveScopes.some(s => !!s.range);
            if (!haveRangeInfo) {
                return nonExpensiveScopes;
            }
            const scopesContainingRange = nonExpensiveScopes.filter(scope => scope.range && range_1.Range.containsRange(scope.range, range))
                .sort((first, second) => (first.range.endLineNumber - first.range.startLineNumber) - (second.range.endLineNumber - second.range.startLineNumber));
            return scopesContainingRange.length ? scopesContainingRange : nonExpensiveScopes;
        }
        restart() {
            return this.thread.session.restartFrame(this.frameId, this.thread.threadId);
        }
        forgetScopes() {
            this.scopes = undefined;
        }
        toString() {
            const lineNumberToString = typeof this.range.startLineNumber === 'number' ? `:${this.range.startLineNumber}` : '';
            const sourceToString = `${this.source.inMemory ? this.source.name : this.source.uri.fsPath}${lineNumberToString}`;
            return sourceToString === debugSource_1.UNKNOWN_SOURCE_LABEL ? this.name : `${this.name} (${sourceToString})`;
        }
        async openInEditor(editorService, preserveFocus, sideBySide, pinned) {
            var _a;
            const threadStopReason = (_a = this.thread.stoppedDetails) === null || _a === void 0 ? void 0 : _a.reason;
            if (this.instructionPointerReference &&
                (threadStopReason === 'instruction breakpoint' ||
                    (threadStopReason === 'step' && this.thread.lastSteppingGranularity === 'instruction'))) {
                return editorService.openEditor(disassemblyViewInput_1.DisassemblyViewInput.instance, { pinned: true });
            }
            if (this.source.available) {
                return this.source.openInEditor(editorService, this.range, preserveFocus, sideBySide, pinned);
            }
            return undefined;
        }
        equals(other) {
            return (this.name === other.name) && (other.thread === this.thread) && (this.frameId === other.frameId) && (other.source === this.source) && (range_1.Range.equalsRange(this.range, other.range));
        }
    }
    exports.StackFrame = StackFrame;
    class Thread {
        constructor(session, name, threadId) {
            this.session = session;
            this.name = name;
            this.threadId = threadId;
            this.callStackCancellationTokens = [];
            this.reachedEndOfCallStack = false;
            this.callStack = [];
            this.staleCallStack = [];
            this.stopped = false;
        }
        getId() {
            return `thread:${this.session.getId()}:${this.threadId}`;
        }
        clearCallStack() {
            if (this.callStack.length) {
                this.staleCallStack = this.callStack;
            }
            this.callStack = [];
            this.callStackCancellationTokens.forEach(c => c.dispose(true));
            this.callStackCancellationTokens = [];
        }
        getCallStack() {
            return this.callStack;
        }
        getStaleCallStack() {
            return this.staleCallStack;
        }
        getTopStackFrame() {
            const callStack = this.getCallStack();
            // Allow stack frame without source and with instructionReferencePointer as top stack frame when using disassembly view.
            const firstAvailableStackFrame = callStack.find(sf => {
                var _a, _b;
                return !!(sf &&
                    ((((_a = this.stoppedDetails) === null || _a === void 0 ? void 0 : _a.reason) === 'instruction breakpoint' || (((_b = this.stoppedDetails) === null || _b === void 0 ? void 0 : _b.reason) === 'step' && this.lastSteppingGranularity === 'instruction')) && sf.instructionPointerReference) ||
                    (sf.source && sf.source.available && sf.source.presentationHint !== 'deemphasize'));
            });
            return firstAvailableStackFrame || (callStack.length > 0 ? callStack[0] : undefined);
        }
        get stateLabel() {
            if (this.stoppedDetails) {
                return this.stoppedDetails.description ||
                    (this.stoppedDetails.reason ? nls.localize({ key: 'pausedOn', comment: ['indicates reason for program being paused'] }, "Paused on {0}", this.stoppedDetails.reason) : nls.localize('paused', "Paused"));
            }
            return nls.localize({ key: 'running', comment: ['indicates state'] }, "Running");
        }
        /**
         * Queries the debug adapter for the callstack and returns a promise
         * which completes once the call stack has been retrieved.
         * If the thread is not stopped, it returns a promise to an empty array.
         * Only fetches the first stack frame for performance reasons. Calling this method consecutive times
         * gets the remainder of the call stack.
         */
        async fetchCallStack(levels = 20) {
            var _a;
            if (this.stopped) {
                const start = this.callStack.length;
                const callStack = await this.getCallStackImpl(start, levels);
                this.reachedEndOfCallStack = callStack.length < levels;
                if (start < this.callStack.length) {
                    // Set the stack frames for exact position we requested. To make sure no concurrent requests create duplicate stack frames #30660
                    this.callStack.splice(start, this.callStack.length - start);
                }
                this.callStack = this.callStack.concat(callStack || []);
                if (typeof ((_a = this.stoppedDetails) === null || _a === void 0 ? void 0 : _a.totalFrames) === 'number' && this.stoppedDetails.totalFrames === this.callStack.length) {
                    this.reachedEndOfCallStack = true;
                }
            }
        }
        async getCallStackImpl(startFrame, levels) {
            try {
                const tokenSource = new cancellation_1.CancellationTokenSource();
                this.callStackCancellationTokens.push(tokenSource);
                const response = await this.session.stackTrace(this.threadId, startFrame, levels, tokenSource.token);
                if (!response || !response.body || tokenSource.token.isCancellationRequested) {
                    return [];
                }
                if (this.stoppedDetails) {
                    this.stoppedDetails.totalFrames = response.body.totalFrames;
                }
                return response.body.stackFrames.map((rsf, index) => {
                    const source = this.session.getSource(rsf.source);
                    return new StackFrame(this, rsf.id, source, rsf.name, rsf.presentationHint, new range_1.Range(rsf.line, rsf.column, rsf.endLine || rsf.line, rsf.endColumn || rsf.column), startFrame + index, typeof rsf.canRestart === 'boolean' ? rsf.canRestart : true, rsf.instructionPointerReference);
                });
            }
            catch (err) {
                if (this.stoppedDetails) {
                    this.stoppedDetails.framesErrorMessage = err.message;
                }
                return [];
            }
        }
        /**
         * Returns exception info promise if the exception was thrown, otherwise undefined
         */
        get exceptionInfo() {
            if (this.stoppedDetails && this.stoppedDetails.reason === 'exception') {
                if (this.session.capabilities.supportsExceptionInfoRequest) {
                    return this.session.exceptionInfo(this.threadId);
                }
                return Promise.resolve({
                    description: this.stoppedDetails.text,
                    breakMode: null
                });
            }
            return Promise.resolve(undefined);
        }
        next(granularity) {
            return this.session.next(this.threadId, granularity);
        }
        stepIn(granularity) {
            return this.session.stepIn(this.threadId, undefined, granularity);
        }
        stepOut(granularity) {
            return this.session.stepOut(this.threadId, granularity);
        }
        stepBack(granularity) {
            return this.session.stepBack(this.threadId, granularity);
        }
        continue() {
            return this.session.continue(this.threadId);
        }
        pause() {
            return this.session.pause(this.threadId);
        }
        terminate() {
            return this.session.terminateThreads([this.threadId]);
        }
        reverseContinue() {
            return this.session.reverseContinue(this.threadId);
        }
    }
    exports.Thread = Thread;
    /**
     * Gets a URI to a memory in the given session ID.
     */
    const getUriForDebugMemory = (sessionId, memoryReference, range, displayName = 'memory') => {
        return uri_1.URI.from({
            scheme: debug_1.DEBUG_MEMORY_SCHEME,
            authority: sessionId,
            path: '/' + encodeURIComponent(memoryReference) + `/${encodeURIComponent(displayName)}.bin`,
            query: range ? `?range=${range.fromOffset}:${range.toOffset}` : undefined,
        });
    };
    exports.getUriForDebugMemory = getUriForDebugMemory;
    class MemoryRegion extends lifecycle_1.Disposable {
        constructor(memoryReference, session) {
            super();
            this.memoryReference = memoryReference;
            this.session = session;
            this.invalidateEmitter = this._register(new event_1.Emitter());
            /** @inheritdoc */
            this.onDidInvalidate = this.invalidateEmitter.event;
            /** @inheritdoc */
            this.writable = !!this.session.capabilities.supportsWriteMemoryRequest;
            this._register(session.onDidInvalidateMemory(e => {
                if (e.body.memoryReference === memoryReference) {
                    this.invalidate(e.body.offset, e.body.count - e.body.offset);
                }
            }));
        }
        async read(fromOffset, toOffset) {
            var _a;
            const length = toOffset - fromOffset;
            const offset = fromOffset;
            const result = await this.session.readMemory(this.memoryReference, offset, length);
            if (result === undefined || !((_a = result.body) === null || _a === void 0 ? void 0 : _a.data)) {
                return [{ type: 1 /* MemoryRangeType.Unreadable */, offset, length }];
            }
            let data;
            try {
                data = (0, buffer_1.decodeBase64)(result.body.data);
            }
            catch (_b) {
                return [{ type: 2 /* MemoryRangeType.Error */, offset, length, error: 'Invalid base64 data from debug adapter' }];
            }
            const unreadable = result.body.unreadableBytes || 0;
            const dataLength = length - unreadable;
            if (data.byteLength < dataLength) {
                const pad = buffer_1.VSBuffer.alloc(dataLength - data.byteLength);
                pad.buffer.fill(0);
                data = buffer_1.VSBuffer.concat([data, pad], dataLength);
            }
            else if (data.byteLength > dataLength) {
                data = data.slice(0, dataLength);
            }
            if (!unreadable) {
                return [{ type: 0 /* MemoryRangeType.Valid */, offset, length, data }];
            }
            return [
                { type: 0 /* MemoryRangeType.Valid */, offset, length: dataLength, data },
                { type: 1 /* MemoryRangeType.Unreadable */, offset: offset + dataLength, length: unreadable },
            ];
        }
        async write(offset, data) {
            var _a, _b;
            const result = await this.session.writeMemory(this.memoryReference, offset, (0, buffer_1.encodeBase64)(data), true);
            const written = (_b = (_a = result === null || result === void 0 ? void 0 : result.body) === null || _a === void 0 ? void 0 : _a.bytesWritten) !== null && _b !== void 0 ? _b : data.byteLength;
            this.invalidate(offset, offset + written);
            return written;
        }
        dispose() {
            super.dispose();
        }
        invalidate(fromOffset, toOffset) {
            this.invalidateEmitter.fire({ fromOffset, toOffset });
        }
    }
    exports.MemoryRegion = MemoryRegion;
    class Enablement {
        constructor(enabled, id) {
            this.enabled = enabled;
            this.id = id;
        }
        getId() {
            return this.id;
        }
    }
    exports.Enablement = Enablement;
    function toBreakpointSessionData(data, capabilities) {
        return (0, objects_1.mixin)({
            supportsConditionalBreakpoints: !!capabilities.supportsConditionalBreakpoints,
            supportsHitConditionalBreakpoints: !!capabilities.supportsHitConditionalBreakpoints,
            supportsLogPoints: !!capabilities.supportsLogPoints,
            supportsFunctionBreakpoints: !!capabilities.supportsFunctionBreakpoints,
            supportsDataBreakpoints: !!capabilities.supportsDataBreakpoints,
            supportsInstructionBreakpoints: !!capabilities.supportsInstructionBreakpoints
        }, data);
    }
    class BaseBreakpoint extends Enablement {
        constructor(enabled, hitCondition, condition, logMessage, id) {
            super(enabled, id);
            this.hitCondition = hitCondition;
            this.condition = condition;
            this.logMessage = logMessage;
            this.sessionData = new Map();
            if (enabled === undefined) {
                this.enabled = true;
            }
        }
        setSessionData(sessionId, data) {
            if (!data) {
                this.sessionData.delete(sessionId);
            }
            else {
                data.sessionId = sessionId;
                this.sessionData.set(sessionId, data);
            }
            const allData = Array.from(this.sessionData.values());
            const verifiedData = (0, arrays_1.distinct)(allData.filter(d => d.verified), d => `${d.line}:${d.column}`);
            if (verifiedData.length) {
                // In case multiple session verified the breakpoint and they provide different data show the intial data that the user set (corner case)
                this.data = verifiedData.length === 1 ? verifiedData[0] : undefined;
            }
            else {
                // No session verified the breakpoint
                this.data = allData.length ? allData[0] : undefined;
            }
        }
        get message() {
            if (!this.data) {
                return undefined;
            }
            return this.data.message;
        }
        get verified() {
            return this.data ? this.data.verified : true;
        }
        get sessionsThatVerified() {
            const sessionIds = [];
            for (const [sessionId, data] of this.sessionData) {
                if (data.verified) {
                    sessionIds.push(sessionId);
                }
            }
            return sessionIds;
        }
        getIdFromAdapter(sessionId) {
            const data = this.sessionData.get(sessionId);
            return data ? data.id : undefined;
        }
        getDebugProtocolBreakpoint(sessionId) {
            const data = this.sessionData.get(sessionId);
            if (data) {
                const bp = {
                    id: data.id,
                    verified: data.verified,
                    message: data.message,
                    source: data.source,
                    line: data.line,
                    column: data.column,
                    endLine: data.endLine,
                    endColumn: data.endColumn,
                    instructionReference: data.instructionReference,
                    offset: data.offset
                };
                return bp;
            }
            return undefined;
        }
        toJSON() {
            const result = Object.create(null);
            result.enabled = this.enabled;
            result.condition = this.condition;
            result.hitCondition = this.hitCondition;
            result.logMessage = this.logMessage;
            return result;
        }
    }
    exports.BaseBreakpoint = BaseBreakpoint;
    class Breakpoint extends BaseBreakpoint {
        constructor(_uri, _lineNumber, _column, enabled, condition, hitCondition, logMessage, _adapterData, textFileService, uriIdentityService, id = (0, uuid_1.generateUuid)()) {
            super(enabled, hitCondition, condition, logMessage, id);
            this._uri = _uri;
            this._lineNumber = _lineNumber;
            this._column = _column;
            this._adapterData = _adapterData;
            this.textFileService = textFileService;
            this.uriIdentityService = uriIdentityService;
        }
        get lineNumber() {
            return this.verified && this.data && typeof this.data.line === 'number' ? this.data.line : this._lineNumber;
        }
        get verified() {
            if (this.data) {
                return this.data.verified && !this.textFileService.isDirty(this._uri);
            }
            return true;
        }
        get uri() {
            return this.verified && this.data && this.data.source ? (0, debugSource_1.getUriFromSource)(this.data.source, this.data.source.path, this.data.sessionId, this.uriIdentityService) : this._uri;
        }
        get column() {
            return this.verified && this.data && typeof this.data.column === 'number' ? this.data.column : this._column;
        }
        get message() {
            if (this.textFileService.isDirty(this.uri)) {
                return nls.localize('breakpointDirtydHover', "Unverified breakpoint. File is modified, please restart debug session.");
            }
            return super.message;
        }
        get adapterData() {
            return this.data && this.data.source && this.data.source.adapterData ? this.data.source.adapterData : this._adapterData;
        }
        get endLineNumber() {
            return this.verified && this.data ? this.data.endLine : undefined;
        }
        get endColumn() {
            return this.verified && this.data ? this.data.endColumn : undefined;
        }
        get sessionAgnosticData() {
            return {
                lineNumber: this._lineNumber,
                column: this._column
            };
        }
        get supported() {
            if (!this.data) {
                return true;
            }
            if (this.logMessage && !this.data.supportsLogPoints) {
                return false;
            }
            if (this.condition && !this.data.supportsConditionalBreakpoints) {
                return false;
            }
            if (this.hitCondition && !this.data.supportsHitConditionalBreakpoints) {
                return false;
            }
            return true;
        }
        setSessionData(sessionId, data) {
            super.setSessionData(sessionId, data);
            if (!this._adapterData) {
                this._adapterData = this.adapterData;
            }
        }
        toJSON() {
            const result = super.toJSON();
            result.uri = this._uri;
            result.lineNumber = this._lineNumber;
            result.column = this._column;
            result.adapterData = this.adapterData;
            return result;
        }
        toString() {
            return `${resources.basenameOrAuthority(this.uri)} ${this.lineNumber}`;
        }
        update(data) {
            if (!(0, types_1.isUndefinedOrNull)(data.lineNumber)) {
                this._lineNumber = data.lineNumber;
            }
            if (!(0, types_1.isUndefinedOrNull)(data.column)) {
                this._column = data.column;
            }
            if (!(0, types_1.isUndefinedOrNull)(data.condition)) {
                this.condition = data.condition;
            }
            if (!(0, types_1.isUndefinedOrNull)(data.hitCondition)) {
                this.hitCondition = data.hitCondition;
            }
            if (!(0, types_1.isUndefinedOrNull)(data.logMessage)) {
                this.logMessage = data.logMessage;
            }
        }
    }
    exports.Breakpoint = Breakpoint;
    class FunctionBreakpoint extends BaseBreakpoint {
        constructor(name, enabled, hitCondition, condition, logMessage, id = (0, uuid_1.generateUuid)()) {
            super(enabled, hitCondition, condition, logMessage, id);
            this.name = name;
        }
        toJSON() {
            const result = super.toJSON();
            result.name = this.name;
            return result;
        }
        get supported() {
            if (!this.data) {
                return true;
            }
            return this.data.supportsFunctionBreakpoints;
        }
        toString() {
            return this.name;
        }
    }
    exports.FunctionBreakpoint = FunctionBreakpoint;
    class DataBreakpoint extends BaseBreakpoint {
        constructor(description, dataId, canPersist, enabled, hitCondition, condition, logMessage, accessTypes, accessType, id = (0, uuid_1.generateUuid)()) {
            super(enabled, hitCondition, condition, logMessage, id);
            this.description = description;
            this.dataId = dataId;
            this.canPersist = canPersist;
            this.accessTypes = accessTypes;
            this.accessType = accessType;
        }
        toJSON() {
            const result = super.toJSON();
            result.description = this.description;
            result.dataId = this.dataId;
            result.accessTypes = this.accessTypes;
            result.accessType = this.accessType;
            return result;
        }
        get supported() {
            if (!this.data) {
                return true;
            }
            return this.data.supportsDataBreakpoints;
        }
        toString() {
            return this.description;
        }
    }
    exports.DataBreakpoint = DataBreakpoint;
    class ExceptionBreakpoint extends BaseBreakpoint {
        constructor(filter, label, enabled, supportsCondition, condition, description, conditionDescription) {
            super(enabled, undefined, condition, undefined, (0, uuid_1.generateUuid)());
            this.filter = filter;
            this.label = label;
            this.supportsCondition = supportsCondition;
            this.description = description;
            this.conditionDescription = conditionDescription;
        }
        toJSON() {
            const result = Object.create(null);
            result.filter = this.filter;
            result.label = this.label;
            result.enabled = this.enabled;
            result.supportsCondition = this.supportsCondition;
            result.condition = this.condition;
            return result;
        }
        get supported() {
            return true;
        }
        toString() {
            return this.label;
        }
    }
    exports.ExceptionBreakpoint = ExceptionBreakpoint;
    class InstructionBreakpoint extends BaseBreakpoint {
        constructor(instructionReference, offset, canPersist, enabled, hitCondition, condition, logMessage, id = (0, uuid_1.generateUuid)()) {
            super(enabled, hitCondition, condition, logMessage, id);
            this.instructionReference = instructionReference;
            this.offset = offset;
            this.canPersist = canPersist;
        }
        toJSON() {
            const result = super.toJSON();
            result.instructionReference = this.instructionReference;
            result.offset = this.offset;
            return result;
        }
        get supported() {
            if (!this.data) {
                return true;
            }
            return this.data.supportsInstructionBreakpoints;
        }
        toString() {
            return this.instructionReference;
        }
    }
    exports.InstructionBreakpoint = InstructionBreakpoint;
    class ThreadAndSessionIds {
        constructor(sessionId, threadId) {
            this.sessionId = sessionId;
            this.threadId = threadId;
        }
        getId() {
            return `${this.sessionId}:${this.threadId}`;
        }
    }
    exports.ThreadAndSessionIds = ThreadAndSessionIds;
    class Memory {
    }
    exports.Memory = Memory;
    let DebugModel = class DebugModel {
        constructor(debugStorage, textFileService, uriIdentityService) {
            this.textFileService = textFileService;
            this.uriIdentityService = uriIdentityService;
            this.schedulers = new Map();
            this.breakpointsActivated = true;
            this._onDidChangeBreakpoints = new event_1.Emitter();
            this._onDidChangeCallStack = new event_1.Emitter();
            this._onDidChangeWatchExpressions = new event_1.Emitter();
            this.breakpoints = debugStorage.loadBreakpoints();
            this.functionBreakpoints = debugStorage.loadFunctionBreakpoints();
            this.exceptionBreakpoints = debugStorage.loadExceptionBreakpoints();
            this.dataBreakpoints = debugStorage.loadDataBreakpoints();
            this.watchExpressions = debugStorage.loadWatchExpressions();
            this.instructionBreakpoints = [];
            this.sessions = [];
        }
        getId() {
            return 'root';
        }
        getSession(sessionId, includeInactive = false) {
            if (sessionId) {
                return this.getSessions(includeInactive).find(s => s.getId() === sessionId);
            }
            return undefined;
        }
        getSessions(includeInactive = false) {
            // By default do not return inactive sessions.
            // However we are still holding onto inactive sessions due to repl and debug service session revival (eh scenario)
            return this.sessions.filter(s => includeInactive || s.state !== 0 /* State.Inactive */);
        }
        addSession(session) {
            this.sessions = this.sessions.filter(s => {
                if (s.getId() === session.getId()) {
                    // Make sure to de-dupe if a session is re-initialized. In case of EH debugging we are adding a session again after an attach.
                    return false;
                }
                if (s.state === 0 /* State.Inactive */ && s.configuration.name === session.configuration.name) {
                    // Make sure to remove all inactive sessions that are using the same configuration as the new session
                    return false;
                }
                return true;
            });
            let i = 1;
            while (this.sessions.some(s => s.getLabel() === session.getLabel())) {
                session.setName(`${session.configuration.name} ${++i}`);
            }
            let index = -1;
            if (session.parentSession) {
                // Make sure that child sessions are placed after the parent session
                index = (0, arrays_1.lastIndex)(this.sessions, s => s.parentSession === session.parentSession || s === session.parentSession);
            }
            if (index >= 0) {
                this.sessions.splice(index + 1, 0, session);
            }
            else {
                this.sessions.push(session);
            }
            this._onDidChangeCallStack.fire(undefined);
        }
        get onDidChangeBreakpoints() {
            return this._onDidChangeBreakpoints.event;
        }
        get onDidChangeCallStack() {
            return this._onDidChangeCallStack.event;
        }
        get onDidChangeWatchExpressions() {
            return this._onDidChangeWatchExpressions.event;
        }
        rawUpdate(data) {
            const session = this.sessions.find(p => p.getId() === data.sessionId);
            if (session) {
                session.rawUpdate(data);
                this._onDidChangeCallStack.fire(undefined);
            }
        }
        clearThreads(id, removeThreads, reference = undefined) {
            const session = this.sessions.find(p => p.getId() === id);
            this.schedulers.forEach(scheduler => scheduler.dispose());
            this.schedulers.clear();
            if (session) {
                session.clearThreads(removeThreads, reference);
                this._onDidChangeCallStack.fire(undefined);
            }
        }
        fetchCallStack(thread) {
            if (thread.session.capabilities.supportsDelayedStackTraceLoading) {
                // For improved performance load the first stack frame and then load the rest async.
                let topCallStack = Promise.resolve();
                const wholeCallStack = new Promise((c, e) => {
                    topCallStack = thread.fetchCallStack(1).then(() => {
                        if (!this.schedulers.has(thread.getId())) {
                            this.schedulers.set(thread.getId(), new async_1.RunOnceScheduler(() => {
                                thread.fetchCallStack(19).then(() => {
                                    const stale = thread.getStaleCallStack();
                                    const current = thread.getCallStack();
                                    let bottomOfCallStackChanged = stale.length !== current.length;
                                    for (let i = 1; i < stale.length && !bottomOfCallStackChanged; i++) {
                                        bottomOfCallStackChanged = !stale[i].equals(current[i]);
                                    }
                                    if (bottomOfCallStackChanged) {
                                        this._onDidChangeCallStack.fire();
                                    }
                                    c();
                                });
                            }, 420));
                        }
                        this.schedulers.get(thread.getId()).schedule();
                        this._onDidChangeCallStack.fire();
                    });
                });
                return { topCallStack, wholeCallStack };
            }
            const wholeCallStack = thread.fetchCallStack();
            return { wholeCallStack, topCallStack: wholeCallStack };
        }
        getBreakpoints(filter) {
            if (filter) {
                const uriStr = filter.uri ? filter.uri.toString() : undefined;
                return this.breakpoints.filter(bp => {
                    if (uriStr && bp.uri.toString() !== uriStr) {
                        return false;
                    }
                    if (filter.lineNumber && bp.lineNumber !== filter.lineNumber) {
                        return false;
                    }
                    if (filter.column && bp.column !== filter.column) {
                        return false;
                    }
                    if (filter.enabledOnly && (!this.breakpointsActivated || !bp.enabled)) {
                        return false;
                    }
                    return true;
                });
            }
            return this.breakpoints;
        }
        getFunctionBreakpoints() {
            return this.functionBreakpoints;
        }
        getDataBreakpoints() {
            return this.dataBreakpoints;
        }
        getExceptionBreakpoints() {
            return this.exceptionBreakpoints;
        }
        getInstructionBreakpoints() {
            return this.instructionBreakpoints;
        }
        setExceptionBreakpoints(data) {
            if (data) {
                if (this.exceptionBreakpoints.length === data.length && this.exceptionBreakpoints.every((exbp, i) => exbp.filter === data[i].filter && exbp.label === data[i].label && exbp.supportsCondition === data[i].supportsCondition && exbp.conditionDescription === data[i].conditionDescription && exbp.description === data[i].description)) {
                    // No change
                    return;
                }
                this.exceptionBreakpoints = data.map(d => {
                    const ebp = this.exceptionBreakpoints.filter(ebp => ebp.filter === d.filter).pop();
                    return new ExceptionBreakpoint(d.filter, d.label, ebp ? ebp.enabled : !!d.default, !!d.supportsCondition, ebp === null || ebp === void 0 ? void 0 : ebp.condition, d.description, d.conditionDescription);
                });
                this._onDidChangeBreakpoints.fire(undefined);
            }
        }
        setExceptionBreakpointCondition(exceptionBreakpoint, condition) {
            exceptionBreakpoint.condition = condition;
            this._onDidChangeBreakpoints.fire(undefined);
        }
        areBreakpointsActivated() {
            return this.breakpointsActivated;
        }
        setBreakpointsActivated(activated) {
            this.breakpointsActivated = activated;
            this._onDidChangeBreakpoints.fire(undefined);
        }
        addBreakpoints(uri, rawData, fireEvent = true) {
            const newBreakpoints = rawData.map(rawBp => new Breakpoint(uri, rawBp.lineNumber, rawBp.column, rawBp.enabled === false ? false : true, rawBp.condition, rawBp.hitCondition, rawBp.logMessage, undefined, this.textFileService, this.uriIdentityService, rawBp.id));
            this.breakpoints = this.breakpoints.concat(newBreakpoints);
            this.breakpointsActivated = true;
            this.sortAndDeDup();
            if (fireEvent) {
                this._onDidChangeBreakpoints.fire({ added: newBreakpoints, sessionOnly: false });
            }
            return newBreakpoints;
        }
        removeBreakpoints(toRemove) {
            this.breakpoints = this.breakpoints.filter(bp => !toRemove.some(toRemove => toRemove.getId() === bp.getId()));
            this._onDidChangeBreakpoints.fire({ removed: toRemove, sessionOnly: false });
        }
        updateBreakpoints(data) {
            const updated = [];
            this.breakpoints.forEach(bp => {
                const bpData = data.get(bp.getId());
                if (bpData) {
                    bp.update(bpData);
                    updated.push(bp);
                }
            });
            this.sortAndDeDup();
            this._onDidChangeBreakpoints.fire({ changed: updated, sessionOnly: false });
        }
        setBreakpointSessionData(sessionId, capabilites, data) {
            this.breakpoints.forEach(bp => {
                if (!data) {
                    bp.setSessionData(sessionId, undefined);
                }
                else {
                    const bpData = data.get(bp.getId());
                    if (bpData) {
                        bp.setSessionData(sessionId, toBreakpointSessionData(bpData, capabilites));
                    }
                }
            });
            this.functionBreakpoints.forEach(fbp => {
                if (!data) {
                    fbp.setSessionData(sessionId, undefined);
                }
                else {
                    const fbpData = data.get(fbp.getId());
                    if (fbpData) {
                        fbp.setSessionData(sessionId, toBreakpointSessionData(fbpData, capabilites));
                    }
                }
            });
            this.dataBreakpoints.forEach(dbp => {
                if (!data) {
                    dbp.setSessionData(sessionId, undefined);
                }
                else {
                    const dbpData = data.get(dbp.getId());
                    if (dbpData) {
                        dbp.setSessionData(sessionId, toBreakpointSessionData(dbpData, capabilites));
                    }
                }
            });
            this.exceptionBreakpoints.forEach(ebp => {
                if (!data) {
                    ebp.setSessionData(sessionId, undefined);
                }
                else {
                    const ebpData = data.get(ebp.getId());
                    if (ebpData) {
                        ebp.setSessionData(sessionId, toBreakpointSessionData(ebpData, capabilites));
                    }
                }
            });
            this.instructionBreakpoints.forEach(ibp => {
                if (!data) {
                    ibp.setSessionData(sessionId, undefined);
                }
                else {
                    const ibpData = data.get(ibp.getId());
                    if (ibpData) {
                        ibp.setSessionData(sessionId, toBreakpointSessionData(ibpData, capabilites));
                    }
                }
            });
            this._onDidChangeBreakpoints.fire({
                sessionOnly: true
            });
        }
        getDebugProtocolBreakpoint(breakpointId, sessionId) {
            const bp = this.breakpoints.find(bp => bp.getId() === breakpointId);
            if (bp) {
                return bp.getDebugProtocolBreakpoint(sessionId);
            }
            return undefined;
        }
        sortAndDeDup() {
            this.breakpoints = this.breakpoints.sort((first, second) => {
                if (first.uri.toString() !== second.uri.toString()) {
                    return resources.basenameOrAuthority(first.uri).localeCompare(resources.basenameOrAuthority(second.uri));
                }
                if (first.lineNumber === second.lineNumber) {
                    if (first.column && second.column) {
                        return first.column - second.column;
                    }
                    return 1;
                }
                return first.lineNumber - second.lineNumber;
            });
            this.breakpoints = (0, arrays_1.distinct)(this.breakpoints, bp => `${bp.uri.toString()}:${bp.lineNumber}:${bp.column}`);
        }
        setEnablement(element, enable) {
            if (element instanceof Breakpoint || element instanceof FunctionBreakpoint || element instanceof ExceptionBreakpoint || element instanceof DataBreakpoint || element instanceof InstructionBreakpoint) {
                const changed = [];
                if (element.enabled !== enable && (element instanceof Breakpoint || element instanceof FunctionBreakpoint || element instanceof DataBreakpoint || element instanceof InstructionBreakpoint)) {
                    changed.push(element);
                }
                element.enabled = enable;
                if (enable) {
                    this.breakpointsActivated = true;
                }
                this._onDidChangeBreakpoints.fire({ changed: changed, sessionOnly: false });
            }
        }
        enableOrDisableAllBreakpoints(enable) {
            const changed = [];
            this.breakpoints.forEach(bp => {
                if (bp.enabled !== enable) {
                    changed.push(bp);
                }
                bp.enabled = enable;
            });
            this.functionBreakpoints.forEach(fbp => {
                if (fbp.enabled !== enable) {
                    changed.push(fbp);
                }
                fbp.enabled = enable;
            });
            this.dataBreakpoints.forEach(dbp => {
                if (dbp.enabled !== enable) {
                    changed.push(dbp);
                }
                dbp.enabled = enable;
            });
            this.instructionBreakpoints.forEach(ibp => {
                if (ibp.enabled !== enable) {
                    changed.push(ibp);
                }
                ibp.enabled = enable;
            });
            if (enable) {
                this.breakpointsActivated = true;
            }
            this._onDidChangeBreakpoints.fire({ changed: changed, sessionOnly: false });
        }
        addFunctionBreakpoint(functionName, id) {
            const newFunctionBreakpoint = new FunctionBreakpoint(functionName, true, undefined, undefined, undefined, id);
            this.functionBreakpoints.push(newFunctionBreakpoint);
            this._onDidChangeBreakpoints.fire({ added: [newFunctionBreakpoint], sessionOnly: false });
            return newFunctionBreakpoint;
        }
        updateFunctionBreakpoint(id, update) {
            const functionBreakpoint = this.functionBreakpoints.find(fbp => fbp.getId() === id);
            if (functionBreakpoint) {
                if (typeof update.name === 'string') {
                    functionBreakpoint.name = update.name;
                }
                if (typeof update.condition === 'string') {
                    functionBreakpoint.condition = update.condition;
                }
                if (typeof update.hitCondition === 'string') {
                    functionBreakpoint.hitCondition = update.hitCondition;
                }
                this._onDidChangeBreakpoints.fire({ changed: [functionBreakpoint], sessionOnly: false });
            }
        }
        removeFunctionBreakpoints(id) {
            let removed;
            if (id) {
                removed = this.functionBreakpoints.filter(fbp => fbp.getId() === id);
                this.functionBreakpoints = this.functionBreakpoints.filter(fbp => fbp.getId() !== id);
            }
            else {
                removed = this.functionBreakpoints;
                this.functionBreakpoints = [];
            }
            this._onDidChangeBreakpoints.fire({ removed, sessionOnly: false });
        }
        addDataBreakpoint(label, dataId, canPersist, accessTypes, accessType) {
            const newDataBreakpoint = new DataBreakpoint(label, dataId, canPersist, true, undefined, undefined, undefined, accessTypes, accessType);
            this.dataBreakpoints.push(newDataBreakpoint);
            this._onDidChangeBreakpoints.fire({ added: [newDataBreakpoint], sessionOnly: false });
        }
        removeDataBreakpoints(id) {
            let removed;
            if (id) {
                removed = this.dataBreakpoints.filter(fbp => fbp.getId() === id);
                this.dataBreakpoints = this.dataBreakpoints.filter(fbp => fbp.getId() !== id);
            }
            else {
                removed = this.dataBreakpoints;
                this.dataBreakpoints = [];
            }
            this._onDidChangeBreakpoints.fire({ removed, sessionOnly: false });
        }
        addInstructionBreakpoint(address, offset, condition, hitCondition) {
            const newInstructionBreakpoint = new InstructionBreakpoint(address, offset, false, true, hitCondition, condition, undefined);
            this.instructionBreakpoints.push(newInstructionBreakpoint);
            this._onDidChangeBreakpoints.fire({ added: [newInstructionBreakpoint], sessionOnly: true });
        }
        removeInstructionBreakpoints(address) {
            let removed;
            if (address) {
                removed = this.instructionBreakpoints.filter(fbp => fbp.instructionReference === address);
                this.instructionBreakpoints = this.instructionBreakpoints.filter(fbp => fbp.instructionReference !== address);
            }
            else {
                removed = this.instructionBreakpoints;
                this.instructionBreakpoints = [];
            }
            this._onDidChangeBreakpoints.fire({ removed, sessionOnly: false });
        }
        getWatchExpressions() {
            return this.watchExpressions;
        }
        addWatchExpression(name) {
            const we = new Expression(name || '');
            this.watchExpressions.push(we);
            this._onDidChangeWatchExpressions.fire(we);
            return we;
        }
        renameWatchExpression(id, newName) {
            const filtered = this.watchExpressions.filter(we => we.getId() === id);
            if (filtered.length === 1) {
                filtered[0].name = newName;
                this._onDidChangeWatchExpressions.fire(filtered[0]);
            }
        }
        removeWatchExpressions(id = null) {
            this.watchExpressions = id ? this.watchExpressions.filter(we => we.getId() !== id) : [];
            this._onDidChangeWatchExpressions.fire(undefined);
        }
        moveWatchExpression(id, position) {
            const we = this.watchExpressions.find(we => we.getId() === id);
            if (we) {
                this.watchExpressions = this.watchExpressions.filter(we => we.getId() !== id);
                this.watchExpressions = this.watchExpressions.slice(0, position).concat(we, this.watchExpressions.slice(position));
                this._onDidChangeWatchExpressions.fire(undefined);
            }
        }
        sourceIsNotAvailable(uri) {
            this.sessions.forEach(s => {
                const source = s.getSourceForUri(uri);
                if (source) {
                    source.available = false;
                }
            });
            this._onDidChangeCallStack.fire(undefined);
        }
    };
    DebugModel = __decorate([
        __param(1, textfiles_1.ITextFileService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], DebugModel);
    exports.DebugModel = DebugModel;
});
//# sourceMappingURL=debugModel.js.map