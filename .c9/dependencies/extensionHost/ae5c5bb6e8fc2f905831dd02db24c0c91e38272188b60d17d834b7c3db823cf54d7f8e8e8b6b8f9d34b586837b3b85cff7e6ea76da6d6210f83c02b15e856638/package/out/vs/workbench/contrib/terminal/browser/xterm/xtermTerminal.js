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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/base/browser/browser", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/xterm/commandNavigationAddon", "vs/nls", "vs/platform/theme/common/themeService", "vs/workbench/common/views", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/platform/terminal/common/xterm/shellIntegrationAddon", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/xterm/decorationAddon", "vs/base/common/event"], function (require, exports, configuration_1, lifecycle_1, terminal_1, terminal_2, browser_1, log_1, storage_1, notification_1, commandNavigationAddon_1, nls_1, themeService_1, views_1, colorRegistry_1, theme_1, terminalColorRegistry_1, shellIntegrationAddon_1, instantiation_1, decorationAddon_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.XtermTerminal = void 0;
    // How long in milliseconds should an average frame take to render for a notification to appear
    // which suggests the fallback DOM-based renderer
    const SLOW_CANVAS_RENDER_THRESHOLD = 50;
    const NUMBER_OF_FRAMES_TO_MEASURE = 20;
    let SearchAddon;
    let Unicode11Addon;
    let WebglAddon;
    let SerializeAddon;
    /**
     * Wraps the xterm object with additional functionality. Interaction with the backing process is out
     * of the scope of this class.
     */
    let XtermTerminal = class XtermTerminal extends lifecycle_1.DisposableStore {
        /**
         * @param xtermCtor The xterm.js constructor, this is passed in so it can be fetched lazily
         * outside of this class such that {@link raw} is not nullable.
         */
        constructor(xtermCtor, _configHelper, cols, rows, location, _capabilities, _configurationService, _instantiationService, _logService, _notificationService, _storageService, _themeService, _viewDescriptorService) {
            super();
            this._configHelper = _configHelper;
            this._capabilities = _capabilities;
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._notificationService = _notificationService;
            this._storageService = _storageService;
            this._themeService = _themeService;
            this._viewDescriptorService = _viewDescriptorService;
            this._onDidRequestRunCommand = new event_1.Emitter();
            this.onDidRequestRunCommand = this._onDidRequestRunCommand.event;
            this._onDidChangeFindResults = new event_1.Emitter();
            this.onDidChangeFindResults = this._onDidChangeFindResults.event;
            this.target = location;
            const font = this._configHelper.getFont(undefined, true);
            const config = this._configHelper.config;
            const editorOptions = this._configurationService.getValue('editor');
            this.raw = this.add(new xtermCtor({
                cols,
                rows,
                altClickMovesCursor: config.altClickMovesCursor && editorOptions.multiCursorModifier === 'alt',
                scrollback: config.scrollback,
                theme: this._getXtermTheme(),
                drawBoldTextInBrightColors: config.drawBoldTextInBrightColors,
                fontFamily: font.fontFamily,
                fontWeight: config.fontWeight,
                fontWeightBold: config.fontWeightBold,
                fontSize: font.fontSize,
                letterSpacing: font.letterSpacing,
                lineHeight: font.lineHeight,
                minimumContrastRatio: config.minimumContrastRatio,
                cursorBlink: config.cursorBlinking,
                cursorStyle: config.cursorStyle === 'line' ? 'bar' : config.cursorStyle,
                cursorWidth: config.cursorWidth,
                bellStyle: 'none',
                macOptionIsMeta: config.macOptionIsMeta,
                macOptionClickForcesSelection: config.macOptionClickForcesSelection,
                rightClickSelectsWord: config.rightClickBehavior === 'selectWord',
                fastScrollModifier: 'alt',
                fastScrollSensitivity: config.fastScrollSensitivity,
                scrollSensitivity: config.mouseWheelScrollSensitivity,
                rendererType: this._getBuiltInXtermRenderer(config.gpuAcceleration, XtermTerminal._suggestedRendererType),
                wordSeparator: config.wordSeparators,
                overviewRulerWidth: 10
            }));
            this._core = this.raw._core;
            this.add(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */)) {
                    XtermTerminal._suggestedRendererType = undefined;
                }
                if (e.affectsConfiguration('terminal.integrated') || e.affectsConfiguration('editor.fastScrollSensitivity') || e.affectsConfiguration('editor.mouseWheelScrollSensitivity') || e.affectsConfiguration('editor.multiCursorModifier')) {
                    this.updateConfig();
                }
                if (e.affectsConfiguration("terminal.integrated.unicodeVersion" /* TerminalSettingId.UnicodeVersion */)) {
                    this._updateUnicodeVersion();
                }
                if (e.affectsConfiguration("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */) ||
                    e.affectsConfiguration("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */)) {
                    this._updateDecorationAddon();
                }
            }));
            this.add(this._themeService.onDidColorThemeChange(theme => this._updateTheme(theme)));
            this.add(this._viewDescriptorService.onDidChangeLocation(({ views }) => {
                var _a;
                if (views.some(v => v.id === terminal_2.TERMINAL_VIEW_ID)) {
                    this._updateTheme();
                    (_a = this._decorationAddon) === null || _a === void 0 ? void 0 : _a.refreshLayouts();
                }
            }));
            // Load addons
            this._updateUnicodeVersion();
            this._commandNavigationAddon = this._instantiationService.createInstance(commandNavigationAddon_1.CommandNavigationAddon, _capabilities);
            this.raw.loadAddon(this._commandNavigationAddon);
            this._shellIntegrationAddon = this._instantiationService.createInstance(shellIntegrationAddon_1.ShellIntegrationAddon);
            this.raw.loadAddon(this._shellIntegrationAddon);
            this._updateDecorationAddon();
        }
        get findResult() { return this._lastFindResult; }
        get commandTracker() { return this._commandNavigationAddon; }
        get shellIntegration() { return this._shellIntegrationAddon; }
        set target(location) {
            this._target = location;
        }
        get target() { return this._target; }
        _createDecorationAddon() {
            this._decorationAddon = this._instantiationService.createInstance(decorationAddon_1.DecorationAddon, this._capabilities);
            this._decorationAddon.onDidRequestRunCommand(e => this._onDidRequestRunCommand.fire(e));
            this.raw.loadAddon(this._decorationAddon);
        }
        async getSelectionAsHtml(command) {
            var _a, _b;
            if (!this._serializeAddon) {
                const Addon = await this._getSerializeAddonConstructor();
                this._serializeAddon = new Addon();
                this.raw.loadAddon(this._serializeAddon);
            }
            if (command) {
                const length = (_a = command.getOutput()) === null || _a === void 0 ? void 0 : _a.length;
                const row = (_b = command.marker) === null || _b === void 0 ? void 0 : _b.line;
                if (!length || !row) {
                    throw new Error(`No row ${row} or output length ${length} for command ${command}`);
                }
                await this.raw.select(0, row + 1, length - Math.floor(length / this.raw.cols));
            }
            const result = this._serializeAddon.serializeAsHTML({ onlySelection: true });
            if (command) {
                this.raw.clearSelection();
            }
            return result;
        }
        attachToElement(container) {
            // Update the theme when attaching as the terminal location could have changed
            this._updateTheme();
            if (!this._container) {
                this.raw.open(container);
            }
            this._container = container;
            if (this._shouldLoadWebgl()) {
                this._enableWebglRenderer();
            }
            // Screen must be created at this point as xterm.open is called
            return this._container.querySelector('.xterm-screen');
        }
        updateConfig() {
            const config = this._configHelper.config;
            this.raw.options.altClickMovesCursor = config.altClickMovesCursor;
            this._setCursorBlink(config.cursorBlinking);
            this._setCursorStyle(config.cursorStyle);
            this._setCursorWidth(config.cursorWidth);
            this.raw.options.scrollback = config.scrollback;
            this.raw.options.drawBoldTextInBrightColors = config.drawBoldTextInBrightColors;
            this.raw.options.minimumContrastRatio = config.minimumContrastRatio;
            this.raw.options.fastScrollSensitivity = config.fastScrollSensitivity;
            this.raw.options.scrollSensitivity = config.mouseWheelScrollSensitivity;
            this.raw.options.macOptionIsMeta = config.macOptionIsMeta;
            const editorOptions = this._configurationService.getValue('editor');
            this.raw.options.altClickMovesCursor = config.altClickMovesCursor && editorOptions.multiCursorModifier === 'alt';
            this.raw.options.macOptionClickForcesSelection = config.macOptionClickForcesSelection;
            this.raw.options.rightClickSelectsWord = config.rightClickBehavior === 'selectWord';
            this.raw.options.wordSeparator = config.wordSeparators;
            this.raw.options.customGlyphs = config.customGlyphs;
            if (this._shouldLoadWebgl()) {
                this._enableWebglRenderer();
            }
            else {
                this._disposeOfWebglRenderer();
                this.raw.options.rendererType = this._getBuiltInXtermRenderer(config.gpuAcceleration, XtermTerminal._suggestedRendererType);
            }
        }
        _shouldLoadWebgl() {
            return !browser_1.isSafari && (this._configHelper.config.gpuAcceleration === 'auto' && XtermTerminal._suggestedRendererType === undefined) || this._configHelper.config.gpuAcceleration === 'on';
        }
        forceRedraw() {
            var _a;
            (_a = this._webglAddon) === null || _a === void 0 ? void 0 : _a.clearTextureAtlas();
            this.raw.clearTextureAtlas();
        }
        clearDecorations() {
            var _a;
            (_a = this._decorationAddon) === null || _a === void 0 ? void 0 : _a.clearDecorations(true);
        }
        forceRefresh() {
            var _a;
            (_a = this._core.viewport) === null || _a === void 0 ? void 0 : _a._innerRefresh();
        }
        forceUnpause() {
            var _a;
            // HACK: Force the renderer to unpause by simulating an IntersectionObserver event.
            // This is to fix an issue where dragging the windpow to the top of the screen to
            // maximize on Windows/Linux would fire an event saying that the terminal was not
            // visible.
            if (this.raw.getOption('rendererType') === 'canvas') {
                (_a = this._core._renderService) === null || _a === void 0 ? void 0 : _a._onIntersectionChange({ intersectionRatio: 1 });
                // HACK: Force a refresh of the screen to ensure links are refresh corrected.
                // This can probably be removed when the above hack is fixed in Chromium.
                this.raw.refresh(0, this.raw.rows - 1);
            }
        }
        async findNext(term, searchOptions) {
            this._updateFindColors(searchOptions);
            return (await this._getSearchAddon()).findNext(term, searchOptions);
        }
        async findPrevious(term, searchOptions) {
            this._updateFindColors(searchOptions);
            return (await this._getSearchAddon()).findPrevious(term, searchOptions);
        }
        _updateFindColors(searchOptions) {
            const theme = this._themeService.getColorTheme();
            // Theme color names align with monaco/vscode whereas xterm.js has some different naming.
            // The mapping is as follows:
            // - findMatch -> activeMatch
            // - findMatchHighlight -> match
            const findMatchBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_BACKGROUND_COLOR);
            const findMatchBorder = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_BORDER_COLOR);
            const findMatchOverviewRuler = theme.getColor(terminalColorRegistry_1.TERMINAL_OVERVIEW_RULER_CURSOR_FOREGROUND_COLOR);
            const findMatchHighlightBackground = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_HIGHLIGHT_BACKGROUND_COLOR);
            const findMatchHighlightBorder = theme.getColor(terminalColorRegistry_1.TERMINAL_FIND_MATCH_HIGHLIGHT_BORDER_COLOR);
            const findMatchHighlightOverviewRuler = theme.getColor(terminalColorRegistry_1.TERMINAL_OVERVIEW_RULER_FIND_MATCH_FOREGROUND_COLOR);
            searchOptions.decorations = {
                activeMatchBackground: (findMatchBackground === null || findMatchBackground === void 0 ? void 0 : findMatchBackground.toString()) || 'transparent',
                activeMatchBorder: (findMatchBorder === null || findMatchBorder === void 0 ? void 0 : findMatchBorder.toString()) || 'transparent',
                activeMatchColorOverviewRuler: (findMatchOverviewRuler === null || findMatchOverviewRuler === void 0 ? void 0 : findMatchOverviewRuler.toString()) || 'transparent',
                matchBackground: (findMatchHighlightBackground === null || findMatchHighlightBackground === void 0 ? void 0 : findMatchHighlightBackground.toString()) || 'transparent',
                matchBorder: (findMatchHighlightBorder === null || findMatchHighlightBorder === void 0 ? void 0 : findMatchHighlightBorder.toString()) || 'transparent',
                matchOverviewRuler: (findMatchHighlightOverviewRuler === null || findMatchHighlightOverviewRuler === void 0 ? void 0 : findMatchHighlightOverviewRuler.toString()) || 'transparent'
            };
        }
        async _getSearchAddon() {
            if (this._searchAddon) {
                return this._searchAddon;
            }
            const AddonCtor = await this._getSearchAddonConstructor();
            this._searchAddon = new AddonCtor();
            this.raw.loadAddon(this._searchAddon);
            this._searchAddon.onDidChangeResults((results) => {
                this._lastFindResult = results;
                this._onDidChangeFindResults.fire(results);
            });
            return this._searchAddon;
        }
        clearSearchDecorations() {
            var _a;
            (_a = this._searchAddon) === null || _a === void 0 ? void 0 : _a.clearDecorations();
        }
        getFont() {
            return this._configHelper.getFont(this._core);
        }
        getLongestViewportWrappedLineLength() {
            let maxLineLength = 0;
            for (let i = this.raw.buffer.active.length - 1; i >= this.raw.buffer.active.viewportY; i--) {
                const lineInfo = this._getWrappedLineCount(i, this.raw.buffer.active);
                maxLineLength = Math.max(maxLineLength, ((lineInfo.lineCount * this.raw.cols) - lineInfo.endSpaces) || 0);
                i = lineInfo.currentIndex;
            }
            return maxLineLength;
        }
        _getWrappedLineCount(index, buffer) {
            var _a;
            let line = buffer.getLine(index);
            if (!line) {
                throw new Error('Could not get line');
            }
            let currentIndex = index;
            let endSpaces = 0;
            // line.length may exceed cols as it doesn't necessarily trim the backing array on resize
            for (let i = Math.min(line.length, this.raw.cols) - 1; i >= 0; i--) {
                if (line && !((_a = line === null || line === void 0 ? void 0 : line.getCell(i)) === null || _a === void 0 ? void 0 : _a.getChars())) {
                    endSpaces++;
                }
                else {
                    break;
                }
            }
            while ((line === null || line === void 0 ? void 0 : line.isWrapped) && currentIndex > 0) {
                currentIndex--;
                line = buffer.getLine(currentIndex);
            }
            return { lineCount: index - currentIndex + 1, currentIndex, endSpaces };
        }
        scrollDownLine() {
            this.raw.scrollLines(1);
        }
        scrollDownPage() {
            this.raw.scrollPages(1);
        }
        scrollToBottom() {
            this.raw.scrollToBottom();
        }
        scrollUpLine() {
            this.raw.scrollLines(-1);
        }
        scrollUpPage() {
            this.raw.scrollPages(-1);
        }
        scrollToTop() {
            this.raw.scrollToTop();
        }
        clearBuffer() {
            var _a;
            this.raw.clear();
            // hack so that the next placeholder shows
            (_a = this._decorationAddon) === null || _a === void 0 ? void 0 : _a.registerCommandDecoration({ marker: this.raw.registerMarker(0), hasOutput: false, timestamp: Date.now(), getOutput: () => { return undefined; }, command: '' }, true);
        }
        _setCursorBlink(blink) {
            if (this.raw.options.cursorBlink !== blink) {
                this.raw.options.cursorBlink = blink;
                this.raw.refresh(0, this.raw.rows - 1);
            }
        }
        _setCursorStyle(style) {
            if (this.raw.options.cursorStyle !== style) {
                // 'line' is used instead of bar in VS Code to be consistent with editor.cursorStyle
                this.raw.options.cursorStyle = (style === 'line') ? 'bar' : style;
            }
        }
        _setCursorWidth(width) {
            if (this.raw.options.cursorWidth !== width) {
                this.raw.options.cursorWidth = width;
            }
        }
        _getBuiltInXtermRenderer(gpuAcceleration, suggestedRendererType) {
            let rendererType = 'canvas';
            if (gpuAcceleration === 'off' || (gpuAcceleration === 'auto' && suggestedRendererType === 'dom')) {
                rendererType = 'dom';
            }
            return rendererType;
        }
        async _enableWebglRenderer() {
            if (!this.raw.element || this._webglAddon) {
                return;
            }
            const Addon = await this._getWebglAddonConstructor();
            this._webglAddon = new Addon();
            try {
                this.raw.loadAddon(this._webglAddon);
                this._logService.trace('Webgl was loaded');
                this._webglAddon.onContextLoss(() => {
                    this._logService.info(`Webgl lost context, disposing of webgl renderer`);
                    this._disposeOfWebglRenderer();
                    this.raw.options.rendererType = 'dom';
                });
                // Uncomment to add the texture atlas to the DOM
                // setTimeout(() => {
                // 	if (this._webglAddon?.textureAtlas) {
                // 		document.body.appendChild(this._webglAddon?.textureAtlas);
                // 	}
                // }, 5000);
            }
            catch (e) {
                this._logService.warn(`Webgl could not be loaded. Falling back to the canvas renderer type.`, e);
                const neverMeasureRenderTime = this._storageService.getBoolean("terminal.integrated.neverMeasureRenderTime" /* TerminalStorageKeys.NeverMeasureRenderTime */, 0 /* StorageScope.GLOBAL */, false);
                // if it's already set to dom, no need to measure render time
                if (!neverMeasureRenderTime && this._configHelper.config.gpuAcceleration !== 'off') {
                    this._measureRenderTime();
                }
                this.raw.options.rendererType = 'canvas';
                XtermTerminal._suggestedRendererType = 'canvas';
                this._disposeOfWebglRenderer();
            }
        }
        async _getSearchAddonConstructor() {
            if (!SearchAddon) {
                SearchAddon = (await new Promise((resolve_1, reject_1) => { require(['xterm-addon-search'], resolve_1, reject_1); })).SearchAddon;
            }
            return SearchAddon;
        }
        async _getUnicode11Constructor() {
            if (!Unicode11Addon) {
                Unicode11Addon = (await new Promise((resolve_2, reject_2) => { require(['xterm-addon-unicode11'], resolve_2, reject_2); })).Unicode11Addon;
            }
            return Unicode11Addon;
        }
        async _getWebglAddonConstructor() {
            if (!WebglAddon) {
                WebglAddon = (await new Promise((resolve_3, reject_3) => { require(['xterm-addon-webgl'], resolve_3, reject_3); })).WebglAddon;
            }
            return WebglAddon;
        }
        async _getSerializeAddonConstructor() {
            if (!SerializeAddon) {
                SerializeAddon = (await new Promise((resolve_4, reject_4) => { require(['xterm-addon-serialize'], resolve_4, reject_4); })).SerializeAddon;
            }
            return SerializeAddon;
        }
        _disposeOfWebglRenderer() {
            var _a;
            try {
                (_a = this._webglAddon) === null || _a === void 0 ? void 0 : _a.dispose();
            }
            catch (_b) {
                // ignore
            }
            this._webglAddon = undefined;
        }
        async _measureRenderTime() {
            var _a;
            const frameTimes = [];
            if (!((_a = this._core._renderService) === null || _a === void 0 ? void 0 : _a._renderer._renderLayers)) {
                return;
            }
            const textRenderLayer = this._core._renderService._renderer._renderLayers[0];
            const originalOnGridChanged = textRenderLayer === null || textRenderLayer === void 0 ? void 0 : textRenderLayer.onGridChanged;
            const evaluateCanvasRenderer = () => {
                // Discard first frame time as it's normal to take longer
                frameTimes.shift();
                const medianTime = frameTimes.sort((a, b) => a - b)[Math.floor(frameTimes.length / 2)];
                if (medianTime > SLOW_CANVAS_RENDER_THRESHOLD) {
                    if (this._configHelper.config.gpuAcceleration === 'auto') {
                        XtermTerminal._suggestedRendererType = 'dom';
                        this.updateConfig();
                    }
                    else {
                        const promptChoices = [
                            {
                                label: (0, nls_1.localize)('yes', "Yes"),
                                run: () => this._configurationService.updateValue("terminal.integrated.gpuAcceleration" /* TerminalSettingId.GpuAcceleration */, 'off', 1 /* ConfigurationTarget.USER */)
                            },
                            {
                                label: (0, nls_1.localize)('no', "No"),
                                run: () => { }
                            },
                            {
                                label: (0, nls_1.localize)('dontShowAgain', "Don't Show Again"),
                                isSecondary: true,
                                run: () => this._storageService.store("terminal.integrated.neverMeasureRenderTime" /* TerminalStorageKeys.NeverMeasureRenderTime */, true, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */)
                            }
                        ];
                        this._notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('terminal.slowRendering', 'Terminal GPU acceleration appears to be slow on your computer. Would you like to switch to disable it which may improve performance? [Read more about terminal settings](https://code.visualstudio.com/docs/editor/integrated-terminal#_changing-how-the-terminal-is-rendered).'), promptChoices);
                    }
                }
            };
            textRenderLayer.onGridChanged = (terminal, firstRow, lastRow) => {
                const startTime = performance.now();
                originalOnGridChanged.call(textRenderLayer, terminal, firstRow, lastRow);
                frameTimes.push(performance.now() - startTime);
                if (frameTimes.length === NUMBER_OF_FRAMES_TO_MEASURE) {
                    evaluateCanvasRenderer();
                    // Restore original function
                    textRenderLayer.onGridChanged = originalOnGridChanged;
                }
            };
        }
        _getXtermTheme(theme) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            if (!theme) {
                theme = this._themeService.getColorTheme();
            }
            const location = this._viewDescriptorService.getViewLocationById(terminal_2.TERMINAL_VIEW_ID);
            const foregroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_FOREGROUND_COLOR);
            let backgroundColor;
            if (this.target === terminal_1.TerminalLocation.Editor) {
                backgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || theme.getColor(colorRegistry_1.editorBackground);
            }
            else {
                backgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || (location === 1 /* ViewContainerLocation.Panel */ ? theme.getColor(theme_1.PANEL_BACKGROUND) : theme.getColor(theme_1.SIDE_BAR_BACKGROUND));
            }
            const cursorColor = theme.getColor(terminalColorRegistry_1.TERMINAL_CURSOR_FOREGROUND_COLOR) || foregroundColor;
            const cursorAccentColor = theme.getColor(terminalColorRegistry_1.TERMINAL_CURSOR_BACKGROUND_COLOR) || backgroundColor;
            const selectionColor = theme.getColor(terminalColorRegistry_1.TERMINAL_SELECTION_BACKGROUND_COLOR);
            return {
                background: backgroundColor ? backgroundColor.toString() : undefined,
                foreground: foregroundColor ? foregroundColor.toString() : undefined,
                cursor: cursorColor ? cursorColor.toString() : undefined,
                cursorAccent: cursorAccentColor ? cursorAccentColor.toString() : undefined,
                selection: selectionColor ? selectionColor.toString() : undefined,
                black: (_a = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[0])) === null || _a === void 0 ? void 0 : _a.toString(),
                red: (_b = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[1])) === null || _b === void 0 ? void 0 : _b.toString(),
                green: (_c = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[2])) === null || _c === void 0 ? void 0 : _c.toString(),
                yellow: (_d = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[3])) === null || _d === void 0 ? void 0 : _d.toString(),
                blue: (_e = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[4])) === null || _e === void 0 ? void 0 : _e.toString(),
                magenta: (_f = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[5])) === null || _f === void 0 ? void 0 : _f.toString(),
                cyan: (_g = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[6])) === null || _g === void 0 ? void 0 : _g.toString(),
                white: (_h = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[7])) === null || _h === void 0 ? void 0 : _h.toString(),
                brightBlack: (_j = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[8])) === null || _j === void 0 ? void 0 : _j.toString(),
                brightRed: (_k = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[9])) === null || _k === void 0 ? void 0 : _k.toString(),
                brightGreen: (_l = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[10])) === null || _l === void 0 ? void 0 : _l.toString(),
                brightYellow: (_m = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[11])) === null || _m === void 0 ? void 0 : _m.toString(),
                brightBlue: (_o = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[12])) === null || _o === void 0 ? void 0 : _o.toString(),
                brightMagenta: (_p = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[13])) === null || _p === void 0 ? void 0 : _p.toString(),
                brightCyan: (_q = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[14])) === null || _q === void 0 ? void 0 : _q.toString(),
                brightWhite: (_r = theme.getColor(terminalColorRegistry_1.ansiColorIdentifiers[15])) === null || _r === void 0 ? void 0 : _r.toString()
            };
        }
        _updateTheme(theme) {
            this.raw.setOption('theme', this._getXtermTheme(theme));
        }
        async _updateUnicodeVersion() {
            if (!this._unicode11Addon && this._configHelper.config.unicodeVersion === '11') {
                const Addon = await this._getUnicode11Constructor();
                this._unicode11Addon = new Addon();
                this.raw.loadAddon(this._unicode11Addon);
            }
            if (this.raw.unicode.activeVersion !== this._configHelper.config.unicodeVersion) {
                this.raw.unicode.activeVersion = this._configHelper.config.unicodeVersion;
            }
        }
        _updateDecorationAddon() {
            var _a;
            if (((_a = this._configHelper.config.shellIntegration) === null || _a === void 0 ? void 0 : _a.enabled) && this._configHelper.config.shellIntegration.decorationsEnabled) {
                if (!this._decorationAddon) {
                    this._createDecorationAddon();
                }
                return;
            }
            if (this._decorationAddon) {
                this._decorationAddon.dispose();
                this._decorationAddon = undefined;
            }
        }
    };
    XtermTerminal._suggestedRendererType = undefined;
    XtermTerminal = __decorate([
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, log_1.ILogService),
        __param(9, notification_1.INotificationService),
        __param(10, storage_1.IStorageService),
        __param(11, themeService_1.IThemeService),
        __param(12, views_1.IViewDescriptorService)
    ], XtermTerminal);
    exports.XtermTerminal = XtermTerminal;
});
//# sourceMappingURL=xtermTerminal.js.map