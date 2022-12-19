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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/editor/common/config/fontInfo", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/debugIcons", "vs/editor/common/core/stringBuilder", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/debug/browser/callStackEditorContribution", "vs/workbench/contrib/debug/common/debugModel", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/editorBrowser", "vs/workbench/contrib/debug/common/debugSource", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/common/services/resolverService", "vs/editor/common/core/range", "vs/base/common/uri", "vs/workbench/contrib/debug/common/debugUtils", "vs/base/common/path", "vs/editor/browser/config/domFontInfo"], function (require, exports, browser_1, dom_1, fontInfo_1, nls_1, configuration_1, instantiation_1, listService_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, editorPane_1, debug_1, icons, stringBuilder_1, lifecycle_1, event_1, callStackEditorContribution_1, debugModel_1, contextkey_1, editorService_1, editorBrowser_1, debugSource_1, uriIdentity_1, resolverService_1, range_1, uri_1, debugUtils_1, path_1, domFontInfo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisassemblyViewContribution = exports.DisassemblyView = void 0;
    // Special entry as a placeholer when disassembly is not available
    const disassemblyNotAvailable = {
        allowBreakpoint: false,
        isBreakpointSet: false,
        isBreakpointEnabled: false,
        instruction: {
            address: '-1',
            instruction: (0, nls_1.localize)('instructionNotAvailable', "Disassembly not available.")
        },
        instructionAddress: BigInt(-1)
    };
    let DisassemblyView = class DisassemblyView extends editorPane_1.EditorPane {
        constructor(telemetryService, themeService, storageService, _configurationService, _instantiationService, _debugService) {
            super(debug_1.DISASSEMBLY_VIEW_ID, telemetryService, themeService, storageService);
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this._debugService = _debugService;
            this._instructionBpList = [];
            this._enableSourceCodeRender = true;
            this._loadingLock = false;
            this._disassembledInstructions = undefined;
            this._onDidChangeStackFrame = new event_1.Emitter();
            this._previousDebuggingState = _debugService.state;
            this._fontInfo = fontInfo_1.BareFontInfo.createFromRawSettings(_configurationService.getValue('editor'), browser_1.PixelRatio.value);
            this._register(_configurationService.onDidChangeConfiguration(e => {
                var _a;
                if (e.affectsConfiguration('editor')) {
                    this._fontInfo = fontInfo_1.BareFontInfo.createFromRawSettings(_configurationService.getValue('editor'), browser_1.PixelRatio.value);
                }
                if (e.affectsConfiguration('debug')) {
                    // show/hide source code requires changing height which WorkbenchTable doesn't support dynamic height, thus force a total reload.
                    const newValue = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
                    if (this._enableSourceCodeRender !== newValue) {
                        this._enableSourceCodeRender = newValue;
                        this.reloadDisassembly(undefined);
                    }
                    else {
                        (_a = this._disassembledInstructions) === null || _a === void 0 ? void 0 : _a.rerender();
                    }
                }
            }));
        }
        get fontInfo() { return this._fontInfo; }
        get currentInstructionAddresses() {
            return this._debugService.getModel().getSessions(false).
                map(session => session.getAllThreads()).
                reduce((prev, curr) => prev.concat(curr), []).
                map(thread => thread.getTopStackFrame()).
                map(frame => frame === null || frame === void 0 ? void 0 : frame.instructionPointerReference);
        }
        // Instruction address of the top stack frame of the focused stack
        get focusedCurrentInstructionAddress() {
            var _a, _b;
            return (_b = (_a = this._debugService.getViewModel().focusedStackFrame) === null || _a === void 0 ? void 0 : _a.thread.getTopStackFrame()) === null || _b === void 0 ? void 0 : _b.instructionPointerReference;
        }
        get focusedInstructionAddress() {
            var _a;
            return (_a = this._debugService.getViewModel().focusedStackFrame) === null || _a === void 0 ? void 0 : _a.instructionPointerReference;
        }
        get isSourceCodeRender() { return this._enableSourceCodeRender; }
        get debugSession() {
            return this._debugService.getViewModel().focusedSession;
        }
        get onDidChangeStackFrame() { return this._onDidChangeStackFrame.event; }
        createEditor(parent) {
            this._enableSourceCodeRender = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
            const lineHeight = this.fontInfo.lineHeight;
            const thisOM = this;
            const delegate = new class {
                constructor() {
                    this.headerRowHeight = 0; // No header
                }
                getHeight(row) {
                    var _a;
                    if (thisOM.isSourceCodeRender && ((_a = row.instruction.location) === null || _a === void 0 ? void 0 : _a.path) && row.instruction.line) {
                        // instruction line + source lines
                        if (row.instruction.endLine) {
                            return lineHeight * (row.instruction.endLine - row.instruction.line + 2);
                        }
                        else {
                            // source is only a single line.
                            return lineHeight * 2;
                        }
                    }
                    // just instruction line
                    return lineHeight;
                }
            };
            const instructionRenderer = this._register(this._instantiationService.createInstance(InstructionRenderer, this));
            this._disassembledInstructions = this._register(this._instantiationService.createInstance(listService_1.WorkbenchTable, 'DisassemblyView', parent, delegate, [
                {
                    label: '',
                    tooltip: '',
                    weight: 0,
                    minimumWidth: this.fontInfo.lineHeight,
                    maximumWidth: this.fontInfo.lineHeight,
                    templateId: BreakpointRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('disassemblyTableColumnLabel', "instructions"),
                    tooltip: '',
                    weight: 0.3,
                    templateId: InstructionRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
            ], [
                this._instantiationService.createInstance(BreakpointRenderer, this),
                instructionRenderer,
            ], {
                identityProvider: { getId: (e) => e.instruction.address },
                horizontalScrolling: false,
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground
                },
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                openOnSingleClick: false,
                accessibilityProvider: new AccessibilityProvider(),
                mouseSupport: false
            }));
            this.reloadDisassembly();
            this._register(this._disassembledInstructions.onDidScroll(e => {
                if (this._loadingLock) {
                    return;
                }
                if (e.oldScrollTop > e.scrollTop && e.scrollTop < e.height) {
                    this._loadingLock = true;
                    const topElement = Math.floor(e.scrollTop / this.fontInfo.lineHeight) + DisassemblyView.NUM_INSTRUCTIONS_TO_LOAD;
                    this.scrollUp_LoadDisassembledInstructions(DisassemblyView.NUM_INSTRUCTIONS_TO_LOAD).then((success) => {
                        if (success) {
                            this._disassembledInstructions.reveal(topElement, 0);
                        }
                        this._loadingLock = false;
                    });
                }
                else if (e.oldScrollTop < e.scrollTop && e.scrollTop + e.height > e.scrollHeight - e.height) {
                    this._loadingLock = true;
                    this.scrollDown_LoadDisassembledInstructions(DisassemblyView.NUM_INSTRUCTIONS_TO_LOAD).then(() => { this._loadingLock = false; });
                }
            }));
            this._register(this._debugService.getViewModel().onDidFocusStackFrame((stackFrame) => {
                if (this._disassembledInstructions) {
                    this.goToAddress();
                    this._onDidChangeStackFrame.fire();
                }
            }));
            // refresh breakpoints view
            this._register(this._debugService.getModel().onDidChangeBreakpoints(bpEvent => {
                var _a, _b, _c;
                if (bpEvent && this._disassembledInstructions) {
                    // draw viewable BP
                    let changed = false;
                    (_a = bpEvent.added) === null || _a === void 0 ? void 0 : _a.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromAddress(bp.instructionReference);
                            if (index >= 0) {
                                this._disassembledInstructions.row(index).isBreakpointSet = true;
                                this._disassembledInstructions.row(index).isBreakpointEnabled = bp.enabled;
                                changed = true;
                            }
                        }
                    });
                    (_b = bpEvent.removed) === null || _b === void 0 ? void 0 : _b.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromAddress(bp.instructionReference);
                            if (index >= 0) {
                                this._disassembledInstructions.row(index).isBreakpointSet = false;
                                changed = true;
                            }
                        }
                    });
                    (_c = bpEvent.changed) === null || _c === void 0 ? void 0 : _c.forEach((bp) => {
                        if (bp instanceof debugModel_1.InstructionBreakpoint) {
                            const index = this.getIndexFromAddress(bp.instructionReference);
                            if (index >= 0) {
                                if (this._disassembledInstructions.row(index).isBreakpointEnabled !== bp.enabled) {
                                    this._disassembledInstructions.row(index).isBreakpointEnabled = bp.enabled;
                                    changed = true;
                                }
                            }
                        }
                    });
                    // get an updated list so that items beyond the current range would render when reached.
                    this._instructionBpList = this._debugService.getModel().getInstructionBreakpoints();
                    if (changed) {
                        this._onDidChangeStackFrame.fire();
                    }
                }
            }));
            this._register(this._debugService.onDidChangeState(e => {
                var _a;
                if ((e === 3 /* State.Running */ || e === 2 /* State.Stopped */) &&
                    (this._previousDebuggingState !== 3 /* State.Running */ && this._previousDebuggingState !== 2 /* State.Stopped */)) {
                    // Just started debugging, clear the view
                    (_a = this._disassembledInstructions) === null || _a === void 0 ? void 0 : _a.splice(0, this._disassembledInstructions.length, [disassemblyNotAvailable]);
                    this._enableSourceCodeRender = this._configurationService.getValue('debug').disassemblyView.showSourceCode;
                }
                this._previousDebuggingState = e;
            }));
        }
        layout(dimension) {
            if (this._disassembledInstructions) {
                this._disassembledInstructions.layout(dimension.height);
            }
        }
        /**
         * Go to the address provided. If no address is provided, reveal the address of the currently focused stack frame.
         */
        goToAddress(address, focus) {
            if (!this._disassembledInstructions) {
                return;
            }
            if (!address) {
                address = this.focusedInstructionAddress;
            }
            if (!address) {
                return;
            }
            const index = this.getIndexFromAddress(address);
            if (index >= 0) {
                this._disassembledInstructions.reveal(index);
                if (focus) {
                    this._disassembledInstructions.domFocus();
                    this._disassembledInstructions.setFocus([index]);
                }
            }
            else if (this._debugService.state === 2 /* State.Stopped */) {
                // Address is not provided or not in the table currently, clear the table
                // and reload if we are in the state where we can load disassembly.
                this.reloadDisassembly(address);
            }
        }
        async scrollUp_LoadDisassembledInstructions(instructionCount) {
            var _a;
            if (this._disassembledInstructions && this._disassembledInstructions.length > 0) {
                const address = (_a = this._disassembledInstructions) === null || _a === void 0 ? void 0 : _a.row(0).instruction.address;
                return this.loadDisassembledInstructions(address, -instructionCount, instructionCount);
            }
            return false;
        }
        async scrollDown_LoadDisassembledInstructions(instructionCount) {
            var _a, _b;
            if (this._disassembledInstructions && this._disassembledInstructions.length > 0) {
                const address = (_a = this._disassembledInstructions) === null || _a === void 0 ? void 0 : _a.row(((_b = this._disassembledInstructions) === null || _b === void 0 ? void 0 : _b.length) - 1).instruction.address;
                return this.loadDisassembledInstructions(address, 1, instructionCount);
            }
            return false;
        }
        async loadDisassembledInstructions(address, instructionOffset, instructionCount) {
            var _a, _b, _c;
            // if address is null, then use current stack frame.
            if (!address || address === '-1') {
                address = this.focusedInstructionAddress;
            }
            if (!address) {
                return false;
            }
            // console.log(`DisassemblyView: loadDisassembledInstructions ${address}, ${instructionOffset}, ${instructionCount}`);
            const session = this.debugSession;
            const resultEntries = await (session === null || session === void 0 ? void 0 : session.disassemble(address, 0, instructionOffset, instructionCount));
            if (session && resultEntries && this._disassembledInstructions) {
                const newEntries = [];
                let lastLocation;
                let lastLine;
                for (let i = 0; i < resultEntries.length; i++) {
                    const found = this._instructionBpList.find(p => p.instructionReference === resultEntries[i].address);
                    const instruction = resultEntries[i];
                    // Forward fill the missing location as detailed in the DAP spec.
                    if (instruction.location) {
                        lastLocation = instruction.location;
                        lastLine = undefined;
                    }
                    if (instruction.line) {
                        const currentLine = {
                            startLineNumber: instruction.line,
                            startColumn: (_a = instruction.column) !== null && _a !== void 0 ? _a : 0,
                            endLineNumber: (_b = instruction.endLine) !== null && _b !== void 0 ? _b : instruction.line,
                            endColumn: (_c = instruction.endColumn) !== null && _c !== void 0 ? _c : 0,
                        };
                        // Add location only to the first unique range. This will give the appearance of grouping of instructions.
                        if (!range_1.Range.equalsRange(currentLine, lastLine !== null && lastLine !== void 0 ? lastLine : null)) {
                            lastLine = currentLine;
                            instruction.location = lastLocation;
                        }
                    }
                    newEntries.push({ allowBreakpoint: true, isBreakpointSet: found !== undefined, isBreakpointEnabled: !!(found === null || found === void 0 ? void 0 : found.enabled), instruction: instruction });
                }
                const specialEntriesToRemove = this._disassembledInstructions.length === 1 ? 1 : 0;
                // request is either at the start or end
                if (instructionOffset >= 0) {
                    this._disassembledInstructions.splice(this._disassembledInstructions.length, specialEntriesToRemove, newEntries);
                }
                else {
                    this._disassembledInstructions.splice(0, specialEntriesToRemove, newEntries);
                }
                return true;
            }
            return false;
        }
        getIndexFromAddress(instructionAddress) {
            if (this._disassembledInstructions && this._disassembledInstructions.length > 0) {
                const address = BigInt(instructionAddress);
                if (address) {
                    let startIndex = 0;
                    let endIndex = this._disassembledInstructions.length - 1;
                    const start = this._disassembledInstructions.row(startIndex);
                    const end = this._disassembledInstructions.row(endIndex);
                    this.ensureAddressParsed(start);
                    this.ensureAddressParsed(end);
                    if (start.instructionAddress > address ||
                        end.instructionAddress < address) {
                        return -1;
                    }
                    else if (start.instructionAddress === address) {
                        return startIndex;
                    }
                    else if (end.instructionAddress === address) {
                        return endIndex;
                    }
                    while (endIndex > startIndex) {
                        const midIndex = Math.floor((endIndex - startIndex) / 2) + startIndex;
                        const mid = this._disassembledInstructions.row(midIndex);
                        this.ensureAddressParsed(mid);
                        if (mid.instructionAddress > address) {
                            endIndex = midIndex;
                        }
                        else if (mid.instructionAddress < address) {
                            startIndex = midIndex;
                        }
                        else {
                            return midIndex;
                        }
                    }
                    return startIndex;
                }
            }
            return -1;
        }
        ensureAddressParsed(entry) {
            if (entry.instructionAddress !== undefined) {
                return;
            }
            else {
                entry.instructionAddress = BigInt(entry.instruction.address);
            }
        }
        /**
         * Clears the table and reload instructions near the target address
         */
        reloadDisassembly(targetAddress) {
            if (this._disassembledInstructions) {
                this._loadingLock = true; // stop scrolling during the load.
                this._disassembledInstructions.splice(0, this._disassembledInstructions.length, [disassemblyNotAvailable]);
                this._instructionBpList = this._debugService.getModel().getInstructionBreakpoints();
                this.loadDisassembledInstructions(targetAddress, -DisassemblyView.NUM_INSTRUCTIONS_TO_LOAD * 4, DisassemblyView.NUM_INSTRUCTIONS_TO_LOAD * 8).then(() => {
                    // on load, set the target instruction in the middle of the page.
                    if (this._disassembledInstructions.length > 0) {
                        const targetIndex = Math.floor(this._disassembledInstructions.length / 2);
                        this._disassembledInstructions.reveal(targetIndex, 0.5);
                        // Always focus the target address on reload, or arrow key navigation would look terrible
                        this._disassembledInstructions.domFocus();
                        this._disassembledInstructions.setFocus([targetIndex]);
                    }
                    this._loadingLock = false;
                });
            }
        }
    };
    DisassemblyView.NUM_INSTRUCTIONS_TO_LOAD = 50;
    DisassemblyView = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, debug_1.IDebugService)
    ], DisassemblyView);
    exports.DisassemblyView = DisassemblyView;
    let BreakpointRenderer = class BreakpointRenderer {
        constructor(_disassemblyView, _debugService) {
            this._disassemblyView = _disassemblyView;
            this._debugService = _debugService;
            this.templateId = BreakpointRenderer.TEMPLATE_ID;
            this._breakpointIcon = 'codicon-' + icons.breakpoint.regular.id;
            this._breakpointDisabledIcon = 'codicon-' + icons.breakpoint.disabled.id;
            this._breakpointHintIcon = 'codicon-' + icons.debugBreakpointHint.id;
            this._debugStackframe = 'codicon-' + icons.debugStackframe.id;
            this._debugStackframeFocused = 'codicon-' + icons.debugStackframeFocused.id;
        }
        renderTemplate(container) {
            // align from the bottom so that it lines up with instruction when source code is present.
            container.style.alignSelf = 'flex-end';
            const icon = (0, dom_1.append)(container, (0, dom_1.$)('.disassembly-view'));
            icon.classList.add('codicon');
            icon.style.display = 'flex';
            icon.style.alignItems = 'center';
            icon.style.justifyContent = 'center';
            icon.style.height = this._disassemblyView.fontInfo.lineHeight + 'px';
            const currentElement = { element: undefined };
            const disposables = [
                this._disassemblyView.onDidChangeStackFrame(() => this.rerenderDebugStackframe(icon, currentElement.element)),
                (0, dom_1.addStandardDisposableListener)(container, 'mouseover', () => {
                    var _a;
                    if ((_a = currentElement.element) === null || _a === void 0 ? void 0 : _a.allowBreakpoint) {
                        icon.classList.add(this._breakpointHintIcon);
                    }
                }),
                (0, dom_1.addStandardDisposableListener)(container, 'mouseout', () => {
                    var _a;
                    if ((_a = currentElement.element) === null || _a === void 0 ? void 0 : _a.allowBreakpoint) {
                        icon.classList.remove(this._breakpointHintIcon);
                    }
                }),
                (0, dom_1.addStandardDisposableListener)(container, 'click', () => {
                    var _a;
                    if ((_a = currentElement.element) === null || _a === void 0 ? void 0 : _a.allowBreakpoint) {
                        // click show hint while waiting for BP to resolve.
                        icon.classList.add(this._breakpointHintIcon);
                        if (currentElement.element.isBreakpointSet) {
                            this._debugService.removeInstructionBreakpoints(currentElement.element.instruction.address);
                        }
                        else if (currentElement.element.allowBreakpoint && !currentElement.element.isBreakpointSet) {
                            this._debugService.addInstructionBreakpoint(currentElement.element.instruction.address, 0);
                        }
                    }
                })
            ];
            return { currentElement, icon, disposables };
        }
        renderElement(element, index, templateData, height) {
            templateData.currentElement.element = element;
            this.rerenderDebugStackframe(templateData.icon, element);
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.disposables);
            templateData.disposables = [];
        }
        rerenderDebugStackframe(icon, element) {
            if ((element === null || element === void 0 ? void 0 : element.instruction.address) === this._disassemblyView.focusedCurrentInstructionAddress) {
                icon.classList.add(this._debugStackframe);
            }
            else if ((element === null || element === void 0 ? void 0 : element.instruction.address) === this._disassemblyView.focusedInstructionAddress) {
                icon.classList.add(this._debugStackframeFocused);
            }
            else {
                icon.classList.remove(this._debugStackframe);
                icon.classList.remove(this._debugStackframeFocused);
            }
            icon.classList.remove(this._breakpointHintIcon);
            if (element === null || element === void 0 ? void 0 : element.isBreakpointSet) {
                if (element.isBreakpointEnabled) {
                    icon.classList.add(this._breakpointIcon);
                    icon.classList.remove(this._breakpointDisabledIcon);
                }
                else {
                    icon.classList.remove(this._breakpointIcon);
                    icon.classList.add(this._breakpointDisabledIcon);
                }
            }
            else {
                icon.classList.remove(this._breakpointIcon);
                icon.classList.remove(this._breakpointDisabledIcon);
            }
        }
    };
    BreakpointRenderer.TEMPLATE_ID = 'breakpoint';
    BreakpointRenderer = __decorate([
        __param(1, debug_1.IDebugService)
    ], BreakpointRenderer);
    let InstructionRenderer = class InstructionRenderer extends lifecycle_1.Disposable {
        constructor(_disassemblyView, themeService, editorService, textModelService, uriService) {
            super();
            this._disassemblyView = _disassemblyView;
            this.editorService = editorService;
            this.textModelService = textModelService;
            this.uriService = uriService;
            this.templateId = InstructionRenderer.TEMPLATE_ID;
            this._topStackFrameColor = themeService.getColorTheme().getColor(callStackEditorContribution_1.topStackFrameColor);
            this._focusedStackFrameColor = themeService.getColorTheme().getColor(callStackEditorContribution_1.focusedStackFrameColor);
            this._register(themeService.onDidColorThemeChange(e => {
                this._topStackFrameColor = e.getColor(callStackEditorContribution_1.topStackFrameColor);
                this._focusedStackFrameColor = e.getColor(callStackEditorContribution_1.focusedStackFrameColor);
            }));
        }
        renderTemplate(container) {
            const sourcecode = (0, dom_1.append)(container, (0, dom_1.$)('.sourcecode'));
            const instruction = (0, dom_1.append)(container, (0, dom_1.$)('.instruction'));
            this.applyFontInfo(sourcecode);
            this.applyFontInfo(instruction);
            const currentElement = { element: undefined };
            const cellDisposable = [];
            const disposables = [
                this._disassemblyView.onDidChangeStackFrame(() => this.rerenderBackground(instruction, sourcecode, currentElement.element)),
                (0, dom_1.addStandardDisposableListener)(sourcecode, 'dblclick', () => { var _a; return this.openSourceCode((_a = currentElement.element) === null || _a === void 0 ? void 0 : _a.instruction); }),
            ];
            return { currentElement, instruction, sourcecode, cellDisposable, disposables };
        }
        renderElement(element, index, templateData, height) {
            this.renderElementInner(element, index, templateData, height);
        }
        async renderElementInner(element, index, templateData, height) {
            var _a;
            templateData.currentElement.element = element;
            const instruction = element.instruction;
            templateData.sourcecode.innerText = '';
            const sb = (0, stringBuilder_1.createStringBuilder)(1000);
            if (this._disassemblyView.isSourceCodeRender && ((_a = instruction.location) === null || _a === void 0 ? void 0 : _a.path) && instruction.line) {
                const sourceURI = this.getUriFromSource(instruction);
                if (sourceURI) {
                    let textModel = undefined;
                    const sourceSB = (0, stringBuilder_1.createStringBuilder)(10000);
                    const ref = await this.textModelService.createModelReference(sourceURI);
                    textModel = ref.object.textEditorModel;
                    templateData.cellDisposable.push(ref);
                    // templateData could have moved on during async.  Double check if it is still the same source.
                    if (textModel && templateData.currentElement.element === element) {
                        let lineNumber = instruction.line;
                        while (lineNumber && lineNumber >= 1 && lineNumber <= textModel.getLineCount()) {
                            const lineContent = textModel.getLineContent(lineNumber);
                            sourceSB.appendASCIIString(`  ${lineNumber}: `);
                            sourceSB.appendASCIIString(lineContent + '\n');
                            if (instruction.endLine && lineNumber < instruction.endLine) {
                                lineNumber++;
                                continue;
                            }
                            break;
                        }
                        templateData.sourcecode.innerText = sourceSB.build();
                    }
                }
            }
            let spacesToAppend = 10;
            if (instruction.address !== '-1') {
                sb.appendASCIIString(instruction.address);
                if (instruction.address.length < InstructionRenderer.INSTRUCTION_ADDR_MIN_LENGTH) {
                    spacesToAppend = InstructionRenderer.INSTRUCTION_ADDR_MIN_LENGTH - instruction.address.length;
                }
                for (let i = 0; i < spacesToAppend; i++) {
                    sb.appendASCIIString(' ');
                }
            }
            if (instruction.instructionBytes) {
                sb.appendASCIIString(instruction.instructionBytes);
                spacesToAppend = 10;
                if (instruction.instructionBytes.length < InstructionRenderer.INSTRUCTION_BYTES_MIN_LENGTH) {
                    spacesToAppend = InstructionRenderer.INSTRUCTION_BYTES_MIN_LENGTH - instruction.instructionBytes.length;
                }
                for (let i = 0; i < spacesToAppend; i++) {
                    sb.appendASCIIString(' ');
                }
            }
            sb.appendASCIIString(instruction.instruction);
            templateData.instruction.innerText = sb.build();
            this.rerenderBackground(templateData.instruction, templateData.sourcecode, element);
        }
        disposeElement(element, index, templateData, height) {
            (0, lifecycle_1.dispose)(templateData.cellDisposable);
            templateData.cellDisposable = [];
        }
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.disposables);
            templateData.disposables = [];
        }
        rerenderBackground(instruction, sourceCode, element) {
            var _a, _b;
            if (element && this._disassemblyView.currentInstructionAddresses.includes(element.instruction.address)) {
                instruction.style.background = ((_a = this._topStackFrameColor) === null || _a === void 0 ? void 0 : _a.toString()) || 'transparent';
            }
            else if ((element === null || element === void 0 ? void 0 : element.instruction.address) === this._disassemblyView.focusedInstructionAddress) {
                instruction.style.background = ((_b = this._focusedStackFrameColor) === null || _b === void 0 ? void 0 : _b.toString()) || 'transparent';
            }
            else {
                instruction.style.background = 'transparent';
            }
        }
        openSourceCode(instruction) {
            if (instruction) {
                const sourceURI = this.getUriFromSource(instruction);
                const selection = instruction.endLine ? {
                    startLineNumber: instruction.line,
                    endLineNumber: instruction.endLine,
                    startColumn: instruction.column || 1,
                    endColumn: instruction.endColumn || 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                } : {
                    startLineNumber: instruction.line,
                    endLineNumber: instruction.line,
                    startColumn: instruction.column || 1,
                    endColumn: instruction.endColumn || 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */,
                };
                this.editorService.openEditor({
                    resource: sourceURI,
                    description: (0, nls_1.localize)('editorOpenedFromDisassemblyDescription', "from disassembly"),
                    options: {
                        preserveFocus: false,
                        selection: selection,
                        revealIfOpened: true,
                        selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */,
                        pinned: false,
                    }
                });
            }
        }
        getUriFromSource(instruction) {
            // Try to resolve path before consulting the debugSession.
            const path = instruction.location.path;
            if (path && (0, debugUtils_1.isUri)(path)) { // path looks like a uri
                return this.uriService.asCanonicalUri(uri_1.URI.parse(path));
            }
            // assume a filesystem path
            if (path && (0, path_1.isAbsolute)(path)) {
                return this.uriService.asCanonicalUri(uri_1.URI.file(path));
            }
            return (0, debugSource_1.getUriFromSource)(instruction.location, instruction.location.path, this._disassemblyView.debugSession.getId(), this.uriService);
        }
        applyFontInfo(element) {
            (0, domFontInfo_1.applyFontInfo)(element, this._disassemblyView.fontInfo);
            element.style.whiteSpace = 'pre';
        }
    };
    InstructionRenderer.TEMPLATE_ID = 'instruction';
    InstructionRenderer.INSTRUCTION_ADDR_MIN_LENGTH = 25;
    InstructionRenderer.INSTRUCTION_BYTES_MIN_LENGTH = 30;
    InstructionRenderer = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, editorService_1.IEditorService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], InstructionRenderer);
    class AccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('disassemblyView', "Disassembly View");
        }
        getAriaLabel(element) {
            let label = '';
            const instruction = element.instruction;
            if (instruction.address !== '-1') {
                label += `${(0, nls_1.localize)('instructionAddress', "Address")}: ${instruction.address}`;
            }
            if (instruction.instructionBytes) {
                label += `, ${(0, nls_1.localize)('instructionBytes', "Bytes")}: ${instruction.instructionBytes}`;
            }
            label += `, ${(0, nls_1.localize)(`instructionText`, "Instruction")}: ${instruction.instruction}`;
            return label;
        }
    }
    let DisassemblyViewContribution = class DisassemblyViewContribution {
        constructor(editorService, debugService, contextKeyService) {
            contextKeyService.bufferChangeEvents(() => {
                this._languageSupportsDisassemleRequest = debug_1.CONTEXT_LANGUAGE_SUPPORTS_DISASSEMBLE_REQUEST.bindTo(contextKeyService);
            });
            const onDidActiveEditorChangeListener = () => {
                var _a, _b, _c;
                if (this._onDidChangeModelLanguage) {
                    this._onDidChangeModelLanguage.dispose();
                    this._onDidChangeModelLanguage = undefined;
                }
                const activeTextEditorControl = editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                    const language = (_a = activeTextEditorControl.getModel()) === null || _a === void 0 ? void 0 : _a.getLanguageId();
                    // TODO: instead of using idDebuggerInterestedInLanguage, have a specific ext point for languages
                    // support disassembly
                    (_b = this._languageSupportsDisassemleRequest) === null || _b === void 0 ? void 0 : _b.set(!!language && debugService.getAdapterManager().isDebuggerInterestedInLanguage(language));
                    this._onDidChangeModelLanguage = activeTextEditorControl.onDidChangeModelLanguage(e => {
                        var _a;
                        (_a = this._languageSupportsDisassemleRequest) === null || _a === void 0 ? void 0 : _a.set(debugService.getAdapterManager().isDebuggerInterestedInLanguage(e.newLanguage));
                    });
                }
                else {
                    (_c = this._languageSupportsDisassemleRequest) === null || _c === void 0 ? void 0 : _c.set(false);
                }
            };
            onDidActiveEditorChangeListener();
            this._onDidActiveEditorChangeListener = editorService.onDidActiveEditorChange(onDidActiveEditorChangeListener);
        }
        dispose() {
            var _a;
            this._onDidActiveEditorChangeListener.dispose();
            (_a = this._onDidChangeModelLanguage) === null || _a === void 0 ? void 0 : _a.dispose();
        }
    };
    DisassemblyViewContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, debug_1.IDebugService),
        __param(2, contextkey_1.IContextKeyService)
    ], DisassemblyViewContribution);
    exports.DisassemblyViewContribution = DisassemblyViewContribution;
});
//# sourceMappingURL=disassemblyView.js.map