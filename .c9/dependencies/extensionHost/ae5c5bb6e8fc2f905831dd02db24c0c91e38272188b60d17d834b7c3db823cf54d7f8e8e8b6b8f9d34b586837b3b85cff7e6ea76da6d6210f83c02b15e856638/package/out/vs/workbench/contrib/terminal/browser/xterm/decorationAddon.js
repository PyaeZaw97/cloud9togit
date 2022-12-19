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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/clipboard/common/clipboardService", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/hover/browser/hover", "vs/base/common/event", "vs/base/common/htmlContent", "vs/nls", "vs/base/common/async", "vs/platform/configuration/common/configuration", "vs/base/common/date", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/terminal/common/terminalColorRegistry"], function (require, exports, lifecycle_1, dom, clipboardService_1, themeService_1, contextView_1, hover_1, event_1, htmlContent_1, nls_1, async_1, configuration_1, date_1, colorRegistry_1, terminalColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationAddon = void 0;
    var DecorationSelector;
    (function (DecorationSelector) {
        DecorationSelector["CommandDecoration"] = "terminal-command-decoration";
        DecorationSelector["ErrorColor"] = "error";
        DecorationSelector["DefaultColor"] = "default";
        DecorationSelector["Codicon"] = "codicon";
        DecorationSelector["XtermDecoration"] = "xterm-decoration";
        DecorationSelector["OverviewRuler"] = "xterm-decoration-overview-ruler";
    })(DecorationSelector || (DecorationSelector = {}));
    var DecorationStyles;
    (function (DecorationStyles) {
        DecorationStyles[DecorationStyles["DefaultDimension"] = 16] = "DefaultDimension";
        DecorationStyles[DecorationStyles["MarginLeft"] = -17] = "MarginLeft";
    })(DecorationStyles || (DecorationStyles = {}));
    let DecorationAddon = class DecorationAddon extends lifecycle_1.Disposable {
        constructor(_capabilities, _clipboardService, _contextMenuService, _hoverService, _configurationService, _themeService) {
            super();
            this._capabilities = _capabilities;
            this._clipboardService = _clipboardService;
            this._contextMenuService = _contextMenuService;
            this._hoverService = _hoverService;
            this._configurationService = _configurationService;
            this._themeService = _themeService;
            this._contextMenuVisible = false;
            this._decorations = new Map();
            this._onDidRequestRunCommand = this._register(new event_1.Emitter());
            this.onDidRequestRunCommand = this._onDidRequestRunCommand.event;
            this._register((0, lifecycle_1.toDisposable)(() => this.clearDecorations(true)));
            this._register(this._contextMenuService.onDidShowContextMenu(() => this._contextMenuVisible = true));
            this._register(this._contextMenuService.onDidHideContextMenu(() => this._contextMenuVisible = false));
            this._hoverDelayer = this._register(new async_1.Delayer(this._configurationService.getValue('workbench.hover.delay')));
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.shellIntegration.decorationIcon" /* TerminalSettingId.ShellIntegrationDecorationIcon */) ||
                    e.affectsConfiguration("terminal.integrated.shellIntegration.decorationIconSuccess" /* TerminalSettingId.ShellIntegrationDecorationIconSuccess */) ||
                    e.affectsConfiguration("terminal.integrated.shellIntegration.decorationIconError" /* TerminalSettingId.ShellIntegrationDecorationIconError */)) {
                    this._refreshStyles();
                }
                else if (e.affectsConfiguration("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */) || e.affectsConfiguration("terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */)) {
                    this.refreshLayouts();
                }
                else if (e.affectsConfiguration('workbench.colorCustomizations')) {
                    this._refreshStyles(true);
                }
            });
            this._themeService.onDidColorThemeChange(() => this._refreshStyles(true));
        }
        refreshLayouts() {
            var _a;
            this._updateLayout((_a = this._placeholderDecoration) === null || _a === void 0 ? void 0 : _a.element);
            for (const decoration of this._decorations) {
                this._updateLayout(decoration[1].decoration.element);
            }
        }
        _refreshStyles(refreshOverviewRulerColors) {
            var _a, _b;
            if (refreshOverviewRulerColors) {
                for (const decoration of this._decorations.values()) {
                    let color = decoration.exitCode === undefined ? defaultColor : decoration.exitCode ? errorColor : successColor;
                    if (color && typeof color !== 'string') {
                        color = color.toString();
                    }
                    else {
                        color = '';
                    }
                    if ((_a = decoration.decoration.options) === null || _a === void 0 ? void 0 : _a.overviewRulerOptions) {
                        decoration.decoration.options.overviewRulerOptions.color = color;
                    }
                    else if (decoration.decoration.options) {
                        decoration.decoration.options.overviewRulerOptions = { color };
                    }
                }
            }
            this._updateClasses((_b = this._placeholderDecoration) === null || _b === void 0 ? void 0 : _b.element);
            for (const decoration of this._decorations.values()) {
                this._updateClasses(decoration.decoration.element, decoration.exitCode);
            }
        }
        clearDecorations(disableDecorations) {
            var _a, _b, _c, _d;
            if (disableDecorations) {
                (_a = this._commandStartedListener) === null || _a === void 0 ? void 0 : _a.dispose();
                (_b = this._commandFinishedListener) === null || _b === void 0 ? void 0 : _b.dispose();
            }
            (_c = this._placeholderDecoration) === null || _c === void 0 ? void 0 : _c.dispose();
            (_d = this._placeholderDecoration) === null || _d === void 0 ? void 0 : _d.marker.dispose();
            for (const value of this._decorations.values()) {
                value.decoration.dispose();
                (0, lifecycle_1.dispose)(value.disposables);
            }
            this._decorations.clear();
        }
        _attachToCommandCapability() {
            if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                this._addCommandFinishedListener();
                this._addCommandStartedListener();
            }
            else {
                this._register(this._capabilities.onDidAddCapability(c => {
                    if (c === 2 /* TerminalCapability.CommandDetection */) {
                        this._addCommandFinishedListener();
                        this._addCommandStartedListener();
                    }
                }));
            }
            this._register(this._capabilities.onDidRemoveCapability(c => {
                var _a, _b;
                if (c === 2 /* TerminalCapability.CommandDetection */) {
                    (_a = this._commandStartedListener) === null || _a === void 0 ? void 0 : _a.dispose();
                    (_b = this._commandFinishedListener) === null || _b === void 0 ? void 0 : _b.dispose();
                }
            }));
        }
        _addCommandStartedListener() {
            var _a;
            if (this._commandStartedListener) {
                return;
            }
            const capability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (!capability) {
                return;
            }
            if ((_a = capability.executingCommandObject) === null || _a === void 0 ? void 0 : _a.marker) {
                this.registerCommandDecoration(capability.executingCommandObject, true);
            }
            this._commandStartedListener = capability.onCommandStarted(command => this.registerCommandDecoration(command, true));
        }
        _addCommandFinishedListener() {
            if (this._commandFinishedListener) {
                return;
            }
            const capability = this._capabilities.get(2 /* TerminalCapability.CommandDetection */);
            if (!capability) {
                return;
            }
            for (const command of capability.commands) {
                this.registerCommandDecoration(command);
            }
            this._commandFinishedListener = capability.onCommandFinished(command => {
                if (command.command.trim().toLowerCase() === 'clear' || command.command.trim().toLowerCase() === 'cls') {
                    this.clearDecorations();
                    return;
                }
                this.registerCommandDecoration(command);
            });
        }
        activate(terminal) {
            this._terminal = terminal;
            this._attachToCommandCapability();
        }
        registerCommandDecoration(command, beforeCommandExecution) {
            var _a;
            if (!this._terminal) {
                return undefined;
            }
            if (!command.marker) {
                throw new Error(`cannot add a decoration for a command ${JSON.stringify(command)} with no marker`);
            }
            (_a = this._placeholderDecoration) === null || _a === void 0 ? void 0 : _a.dispose();
            let color = command.exitCode === undefined ? defaultColor : command.exitCode ? errorColor : successColor;
            if (color && typeof color !== 'string') {
                color = color.toString();
            }
            else {
                color = '';
            }
            const decoration = this._terminal.registerDecoration({
                marker: command.marker,
                overviewRulerOptions: beforeCommandExecution ? undefined : { color, position: command.exitCode ? 'right' : 'left' }
            });
            if (!decoration) {
                return undefined;
            }
            decoration.onRender(element => {
                var _a;
                if (element.classList.contains("xterm-decoration-overview-ruler" /* DecorationSelector.OverviewRuler */)) {
                    return;
                }
                if (beforeCommandExecution && !this._placeholderDecoration) {
                    this._placeholderDecoration = decoration;
                    this._placeholderDecoration.onDispose(() => this._placeholderDecoration = undefined);
                }
                else {
                    decoration.onDispose(() => this._decorations.delete(decoration.marker.id));
                    this._decorations.set(decoration.marker.id, {
                        decoration,
                        disposables: command.exitCode === undefined ? [] : [this._createContextMenu(element, command), ...this._createHover(element, command)],
                        exitCode: command.exitCode
                    });
                }
                if (!element.classList.contains("codicon" /* DecorationSelector.Codicon */) || ((_a = command.marker) === null || _a === void 0 ? void 0 : _a.line) === 0) {
                    // first render or buffer was cleared
                    this._updateLayout(element);
                    this._updateClasses(element, command.exitCode);
                }
            });
            return decoration;
        }
        _updateLayout(element) {
            if (!element) {
                return;
            }
            const fontSize = this._configurationService.inspect("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */).value;
            const defaultFontSize = this._configurationService.inspect("terminal.integrated.fontSize" /* TerminalSettingId.FontSize */).defaultValue;
            const lineHeight = this._configurationService.inspect("terminal.integrated.lineHeight" /* TerminalSettingId.LineHeight */).value;
            if (typeof fontSize === 'number' && typeof defaultFontSize === 'number' && typeof lineHeight === 'number') {
                const scalar = (fontSize / defaultFontSize) <= 1 ? (fontSize / defaultFontSize) : 1;
                // must be inlined to override the inlined styles from xterm
                element.style.width = `${scalar * 16 /* DecorationStyles.DefaultDimension */}px`;
                element.style.height = `${scalar * 16 /* DecorationStyles.DefaultDimension */ * lineHeight}px`;
                element.style.fontSize = `${scalar * 16 /* DecorationStyles.DefaultDimension */}px`;
                element.style.marginLeft = `${scalar * -17 /* DecorationStyles.MarginLeft */}px`;
            }
        }
        _updateClasses(element, exitCode) {
            if (!element) {
                return;
            }
            for (const classes of element.classList) {
                element.classList.remove(classes);
            }
            element.classList.add("terminal-command-decoration" /* DecorationSelector.CommandDecoration */, "codicon" /* DecorationSelector.Codicon */, "xterm-decoration" /* DecorationSelector.XtermDecoration */);
            if (exitCode === undefined) {
                element.classList.add("default" /* DecorationSelector.DefaultColor */);
                element.classList.add(`codicon-${this._configurationService.getValue("terminal.integrated.shellIntegration.decorationIcon" /* TerminalSettingId.ShellIntegrationDecorationIcon */)}`);
            }
            else if (exitCode) {
                element.classList.add("error" /* DecorationSelector.ErrorColor */);
                element.classList.add(`codicon-${this._configurationService.getValue("terminal.integrated.shellIntegration.decorationIconError" /* TerminalSettingId.ShellIntegrationDecorationIconError */)}`);
            }
            else {
                element.classList.add(`codicon-${this._configurationService.getValue("terminal.integrated.shellIntegration.decorationIconSuccess" /* TerminalSettingId.ShellIntegrationDecorationIconSuccess */)}`);
            }
        }
        _createContextMenu(element, command) {
            // When the xterm Decoration gets disposed of, its element gets removed from the dom
            // along with its listeners
            return dom.addDisposableListener(element, dom.EventType.CLICK, async () => {
                this._hideHover();
                const actions = await this._getCommandActions(command);
                this._contextMenuService.showContextMenu({ getAnchor: () => element, getActions: () => actions });
            });
        }
        _createHover(element, command) {
            return [
                dom.addDisposableListener(element, dom.EventType.MOUSE_ENTER, () => {
                    if (this._contextMenuVisible) {
                        return;
                    }
                    this._hoverDelayer.trigger(() => {
                        let hoverContent = `${(0, nls_1.localize)('terminalPromptContextMenu', "Show Command Actions")}...`;
                        hoverContent += '\n\n---\n\n';
                        if (command.exitCode) {
                            if (command.exitCode === -1) {
                                hoverContent += (0, nls_1.localize)('terminalPromptCommandFailed', 'Command executed {0} and failed', (0, date_1.fromNow)(command.timestamp, true));
                            }
                            else {
                                hoverContent += (0, nls_1.localize)('terminalPromptCommandFailedWithExitCode', 'Command executed {0} and failed (Exit Code {1})', (0, date_1.fromNow)(command.timestamp, true), command.exitCode);
                            }
                        }
                        else {
                            hoverContent += (0, nls_1.localize)('terminalPromptCommandSuccess', 'Command executed {0}', (0, date_1.fromNow)(command.timestamp, true));
                        }
                        this._hoverService.showHover({ content: new htmlContent_1.MarkdownString(hoverContent), target: element });
                    });
                }),
                dom.addDisposableListener(element, dom.EventType.MOUSE_LEAVE, () => this._hideHover()),
                dom.addDisposableListener(element, dom.EventType.MOUSE_OUT, () => this._hideHover())
            ];
        }
        _hideHover() {
            this._hoverDelayer.cancel();
            this._hoverService.hideHover();
        }
        async _getCommandActions(command) {
            const actions = [];
            if (command.hasOutput) {
                actions.push({
                    class: 'copy-output', tooltip: 'Copy Output', dispose: () => { }, id: 'terminal.copyOutput', label: (0, nls_1.localize)("terminal.copyOutput", 'Copy Output'), enabled: true,
                    run: () => this._clipboardService.writeText(command.getOutput())
                });
                actions.push({
                    class: 'copy-output', tooltip: 'Copy Output as HTML', dispose: () => { }, id: 'terminal.copyOutputAsHtml', label: (0, nls_1.localize)("terminal.copyOutputAsHtml", 'Copy Output as HTML'), enabled: true,
                    run: () => this._onDidRequestRunCommand.fire({ command, copyAsHtml: true })
                });
            }
            actions.push({
                class: 'rerun-command', tooltip: 'Rerun Command', dispose: () => { }, id: 'terminal.rerunCommand', label: (0, nls_1.localize)("terminal.rerunCommand", 'Rerun Command'), enabled: true,
                run: () => this._onDidRequestRunCommand.fire({ command })
            });
            return actions;
        }
    };
    DecorationAddon = __decorate([
        __param(1, clipboardService_1.IClipboardService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, hover_1.IHoverService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, themeService_1.IThemeService)
    ], DecorationAddon);
    exports.DecorationAddon = DecorationAddon;
    let successColor;
    let errorColor;
    let defaultColor;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        successColor = theme.getColor(terminalColorRegistry_1.TERMINAL_COMMAND_DECORATION_SUCCESS_BACKGROUND_COLOR);
        errorColor = theme.getColor(terminalColorRegistry_1.TERMINAL_COMMAND_DECORATION_ERROR_BACKGROUND_COLOR);
        defaultColor = theme.getColor(terminalColorRegistry_1.TERMINAL_COMMAND_DECORATION_DEFAULT_BACKGROUND_COLOR);
        const hoverBackgroundColor = theme.getColor(colorRegistry_1.toolbarHoverBackground);
        if (successColor) {
            collector.addRule(`.${"terminal-command-decoration" /* DecorationSelector.CommandDecoration */} { color: ${successColor.toString()}; } `);
        }
        if (errorColor) {
            collector.addRule(`.${"terminal-command-decoration" /* DecorationSelector.CommandDecoration */}.${"error" /* DecorationSelector.ErrorColor */} { color: ${errorColor.toString()}; } `);
        }
        if (defaultColor) {
            collector.addRule(`.${"terminal-command-decoration" /* DecorationSelector.CommandDecoration */}.${"default" /* DecorationSelector.DefaultColor */} { color: ${defaultColor.toString()};} `);
        }
        if (hoverBackgroundColor) {
            collector.addRule(`.${"terminal-command-decoration" /* DecorationSelector.CommandDecoration */}:not(.${"default" /* DecorationSelector.DefaultColor */}):hover { background-color: ${hoverBackgroundColor.toString()}; }`);
        }
    });
});
//# sourceMappingURL=decorationAddon.js.map