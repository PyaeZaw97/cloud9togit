/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, event_1, lifecycle_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOptions = exports.OutputInnerContainerTopPadding = exports.getEditorTopPadding = exports.updateEditorTopPadding = exports.EditorTopPaddingChangeEvent = void 0;
    const SCROLLABLE_ELEMENT_PADDING_TOP = 18;
    let EDITOR_TOP_PADDING = 12;
    const editorTopPaddingChangeEmitter = new event_1.Emitter();
    exports.EditorTopPaddingChangeEvent = editorTopPaddingChangeEmitter.event;
    function updateEditorTopPadding(top) {
        EDITOR_TOP_PADDING = top;
        editorTopPaddingChangeEmitter.fire();
    }
    exports.updateEditorTopPadding = updateEditorTopPadding;
    function getEditorTopPadding() {
        return EDITOR_TOP_PADDING;
    }
    exports.getEditorTopPadding = getEditorTopPadding;
    exports.OutputInnerContainerTopPadding = 4;
    const defaultConfigConstants = Object.freeze({
        codeCellLeftMargin: 28,
        cellRunGutter: 32,
        markdownCellTopMargin: 8,
        markdownCellBottomMargin: 8,
        markdownCellLeftMargin: 0,
        markdownCellGutter: 32,
        focusIndicatorLeftMargin: 4
    });
    const compactConfigConstants = Object.freeze({
        codeCellLeftMargin: 8,
        cellRunGutter: 36,
        markdownCellTopMargin: 6,
        markdownCellBottomMargin: 6,
        markdownCellLeftMargin: 8,
        markdownCellGutter: 36,
        focusIndicatorLeftMargin: 4
    });
    class NotebookOptions extends lifecycle_1.Disposable {
        constructor(configurationService, notebookExecutionStateService, overrides) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            super();
            this.configurationService = configurationService;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.overrides = overrides;
            this._onDidChangeOptions = this._register(new event_1.Emitter());
            this.onDidChangeOptions = this._onDidChangeOptions.event;
            const showCellStatusBar = this.configurationService.getValue(notebookCommon_1.NotebookSetting.showCellStatusBar);
            const globalToolbar = (_b = (_a = overrides === null || overrides === void 0 ? void 0 : overrides.globalToolbar) !== null && _a !== void 0 ? _a : this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbar)) !== null && _b !== void 0 ? _b : true;
            const consolidatedOutputButton = (_c = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedOutputButton)) !== null && _c !== void 0 ? _c : true;
            const consolidatedRunButton = (_d = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedRunButton)) !== null && _d !== void 0 ? _d : false;
            const dragAndDropEnabled = (_e = this.configurationService.getValue(notebookCommon_1.NotebookSetting.dragAndDropEnabled)) !== null && _e !== void 0 ? _e : true;
            const cellToolbarLocation = (_f = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation)) !== null && _f !== void 0 ? _f : { 'default': 'right' };
            const cellToolbarInteraction = (_g = overrides === null || overrides === void 0 ? void 0 : overrides.cellToolbarInteraction) !== null && _g !== void 0 ? _g : this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            const compactView = (_h = this.configurationService.getValue(notebookCommon_1.NotebookSetting.compactView)) !== null && _h !== void 0 ? _h : true;
            const focusIndicator = this._computeFocusIndicatorOption();
            const insertToolbarPosition = this._computeInsertToolbarPositionOption();
            const insertToolbarAlignment = this._computeInsertToolbarAlignmentOption();
            const showFoldingControls = this._computeShowFoldingControlsOption();
            // const { bottomToolbarGap, bottomToolbarHeight } = this._computeBottomToolbarDimensions(compactView, insertToolbarPosition, insertToolbarAlignment);
            const fontSize = this.configurationService.getValue('editor.fontSize');
            const outputFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSize);
            const outputFontFamily = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontFamily);
            const markupFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.markupFontSize);
            const editorOptionsCustomizations = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
            const interactiveWindowCollapseCodeCells = this.configurationService.getValue(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            const outputLineHeight = this._computeOutputLineHeight();
            this._layoutConfiguration = Object.assign(Object.assign({}, (compactView ? compactConfigConstants : defaultConfigConstants)), { cellTopMargin: 6, cellBottomMargin: 6, cellRightMargin: 16, cellStatusBarHeight: 22, cellOutputPadding: 8, markdownPreviewPadding: 8, 
                // bottomToolbarHeight: bottomToolbarHeight,
                // bottomToolbarGap: bottomToolbarGap,
                editorToolbarHeight: 0, editorTopPadding: EDITOR_TOP_PADDING, editorBottomPadding: 4, editorBottomPaddingWithoutStatusBar: 12, collapsedIndicatorHeight: 28, showCellStatusBar,
                globalToolbar,
                consolidatedOutputButton,
                consolidatedRunButton,
                dragAndDropEnabled,
                cellToolbarLocation,
                cellToolbarInteraction,
                compactView,
                focusIndicator,
                insertToolbarPosition,
                insertToolbarAlignment,
                showFoldingControls,
                fontSize,
                outputFontSize,
                outputFontFamily,
                outputLineHeight,
                markupFontSize,
                editorOptionsCustomizations, focusIndicatorGap: 3, interactiveWindowCollapseCodeCells, markdownFoldHintHeight: 22 });
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                this._updateConfiguration(e);
            }));
            this._register((0, exports.EditorTopPaddingChangeEvent)(() => {
                const configuration = Object.assign({}, this._layoutConfiguration);
                configuration.editorTopPadding = getEditorTopPadding();
                this._layoutConfiguration = configuration;
                this._onDidChangeOptions.fire({ editorTopPadding: true });
            }));
        }
        _computeOutputLineHeight() {
            const minimumLineHeight = 8;
            let lineHeight = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputLineHeight);
            if (lineHeight < minimumLineHeight) {
                // Values too small to be line heights in pixels are in ems.
                let fontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSize);
                if (fontSize === 0) {
                    fontSize = this.configurationService.getValue('editor.fontSize');
                }
                lineHeight = lineHeight * fontSize;
            }
            // Enforce integer, minimum constraints
            lineHeight = Math.round(lineHeight);
            if (lineHeight < minimumLineHeight) {
                lineHeight = minimumLineHeight;
            }
            return lineHeight;
        }
        _updateConfiguration(e) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const cellStatusBarVisibility = e.affectsConfiguration(notebookCommon_1.NotebookSetting.showCellStatusBar);
            const cellToolbarLocation = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellToolbarLocation);
            const cellToolbarInteraction = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            const compactView = e.affectsConfiguration(notebookCommon_1.NotebookSetting.compactView);
            const focusIndicator = e.affectsConfiguration(notebookCommon_1.NotebookSetting.focusIndicator);
            const insertToolbarPosition = e.affectsConfiguration(notebookCommon_1.NotebookSetting.insertToolbarLocation);
            const insertToolbarAlignment = e.affectsConfiguration(notebookCommon_1.NotebookSetting.experimentalInsertToolbarAlignment);
            const globalToolbar = e.affectsConfiguration(notebookCommon_1.NotebookSetting.globalToolbar);
            const consolidatedOutputButton = e.affectsConfiguration(notebookCommon_1.NotebookSetting.consolidatedOutputButton);
            const consolidatedRunButton = e.affectsConfiguration(notebookCommon_1.NotebookSetting.consolidatedRunButton);
            const showFoldingControls = e.affectsConfiguration(notebookCommon_1.NotebookSetting.showFoldingControls);
            const dragAndDropEnabled = e.affectsConfiguration(notebookCommon_1.NotebookSetting.dragAndDropEnabled);
            const fontSize = e.affectsConfiguration('editor.fontSize');
            const outputFontSize = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputFontSize);
            const markupFontSize = e.affectsConfiguration(notebookCommon_1.NotebookSetting.markupFontSize);
            const fontFamily = e.affectsConfiguration('editor.fontFamily');
            const outputFontFamily = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputFontFamily);
            const editorOptionsCustomizations = e.affectsConfiguration(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
            const interactiveWindowCollapseCodeCells = e.affectsConfiguration(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            const outputLineHeight = e.affectsConfiguration(notebookCommon_1.NotebookSetting.outputLineHeight);
            if (!cellStatusBarVisibility
                && !cellToolbarLocation
                && !cellToolbarInteraction
                && !compactView
                && !focusIndicator
                && !insertToolbarPosition
                && !insertToolbarAlignment
                && !globalToolbar
                && !consolidatedOutputButton
                && !consolidatedRunButton
                && !showFoldingControls
                && !dragAndDropEnabled
                && !fontSize
                && !outputFontSize
                && !markupFontSize
                && !fontFamily
                && !outputFontFamily
                && !editorOptionsCustomizations
                && !interactiveWindowCollapseCodeCells
                && !outputLineHeight) {
                return;
            }
            let configuration = Object.assign({}, this._layoutConfiguration);
            if (cellStatusBarVisibility) {
                configuration.showCellStatusBar = this.configurationService.getValue(notebookCommon_1.NotebookSetting.showCellStatusBar);
            }
            if (cellToolbarLocation) {
                configuration.cellToolbarLocation = (_a = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation)) !== null && _a !== void 0 ? _a : { 'default': 'right' };
            }
            if (cellToolbarInteraction && !((_b = this.overrides) === null || _b === void 0 ? void 0 : _b.cellToolbarInteraction)) {
                configuration.cellToolbarInteraction = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarVisibility);
            }
            if (focusIndicator) {
                configuration.focusIndicator = this._computeFocusIndicatorOption();
            }
            if (compactView) {
                const compactViewValue = (_c = this.configurationService.getValue(notebookCommon_1.NotebookSetting.compactView)) !== null && _c !== void 0 ? _c : true;
                configuration = Object.assign(configuration, Object.assign({}, (compactViewValue ? compactConfigConstants : defaultConfigConstants)));
                configuration.compactView = compactViewValue;
            }
            if (insertToolbarAlignment) {
                configuration.insertToolbarAlignment = this._computeInsertToolbarAlignmentOption();
            }
            if (insertToolbarPosition) {
                configuration.insertToolbarPosition = this._computeInsertToolbarPositionOption();
            }
            if (globalToolbar && ((_d = this.overrides) === null || _d === void 0 ? void 0 : _d.globalToolbar) === undefined) {
                configuration.globalToolbar = (_e = this.configurationService.getValue(notebookCommon_1.NotebookSetting.globalToolbar)) !== null && _e !== void 0 ? _e : true;
            }
            if (consolidatedOutputButton) {
                configuration.consolidatedOutputButton = (_f = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedOutputButton)) !== null && _f !== void 0 ? _f : true;
            }
            if (consolidatedRunButton) {
                configuration.consolidatedRunButton = (_g = this.configurationService.getValue(notebookCommon_1.NotebookSetting.consolidatedRunButton)) !== null && _g !== void 0 ? _g : true;
            }
            if (showFoldingControls) {
                configuration.showFoldingControls = this._computeShowFoldingControlsOption();
            }
            if (dragAndDropEnabled) {
                configuration.dragAndDropEnabled = (_h = this.configurationService.getValue(notebookCommon_1.NotebookSetting.dragAndDropEnabled)) !== null && _h !== void 0 ? _h : true;
            }
            if (fontSize) {
                configuration.fontSize = this.configurationService.getValue('editor.fontSize');
            }
            if (outputFontSize) {
                configuration.outputFontSize = (_j = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontSize)) !== null && _j !== void 0 ? _j : configuration.fontSize;
            }
            if (markupFontSize) {
                configuration.markupFontSize = this.configurationService.getValue(notebookCommon_1.NotebookSetting.markupFontSize);
            }
            if (outputFontFamily) {
                configuration.outputFontFamily = this.configurationService.getValue(notebookCommon_1.NotebookSetting.outputFontFamily);
            }
            if (editorOptionsCustomizations) {
                configuration.editorOptionsCustomizations = this.configurationService.getValue(notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations);
            }
            if (interactiveWindowCollapseCodeCells) {
                configuration.interactiveWindowCollapseCodeCells = this.configurationService.getValue(notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells);
            }
            if (outputLineHeight || fontSize || outputFontSize) {
                configuration.outputLineHeight = this._computeOutputLineHeight();
            }
            this._layoutConfiguration = Object.freeze(configuration);
            // trigger event
            this._onDidChangeOptions.fire({
                cellStatusBarVisibility,
                cellToolbarLocation,
                cellToolbarInteraction,
                compactView,
                focusIndicator,
                insertToolbarPosition,
                insertToolbarAlignment,
                globalToolbar,
                showFoldingControls,
                consolidatedOutputButton,
                consolidatedRunButton,
                dragAndDropEnabled,
                fontSize,
                outputFontSize,
                markupFontSize,
                fontFamily,
                outputFontFamily,
                editorOptionsCustomizations,
                interactiveWindowCollapseCodeCells,
                outputLineHeight
            });
        }
        _computeInsertToolbarPositionOption() {
            var _a;
            return (_a = this.configurationService.getValue(notebookCommon_1.NotebookSetting.insertToolbarLocation)) !== null && _a !== void 0 ? _a : 'both';
        }
        _computeInsertToolbarAlignmentOption() {
            var _a;
            return (_a = this.configurationService.getValue(notebookCommon_1.NotebookSetting.experimentalInsertToolbarAlignment)) !== null && _a !== void 0 ? _a : 'center';
        }
        _computeShowFoldingControlsOption() {
            var _a;
            return (_a = this.configurationService.getValue(notebookCommon_1.NotebookSetting.showFoldingControls)) !== null && _a !== void 0 ? _a : 'mouseover';
        }
        _computeFocusIndicatorOption() {
            var _a;
            return (_a = this.configurationService.getValue(notebookCommon_1.NotebookSetting.focusIndicator)) !== null && _a !== void 0 ? _a : 'gutter';
        }
        getCellCollapseDefault() {
            return this._layoutConfiguration.interactiveWindowCollapseCodeCells === 'never' ?
                {
                    codeCell: {
                        inputCollapsed: false
                    }
                } : {
                codeCell: {
                    inputCollapsed: true
                }
            };
        }
        getLayoutConfiguration() {
            return this._layoutConfiguration;
        }
        computeCollapsedMarkdownCellHeight(viewType) {
            const { bottomToolbarGap } = this.computeBottomToolbarDimensions(viewType);
            return this._layoutConfiguration.markdownCellTopMargin
                + this._layoutConfiguration.collapsedIndicatorHeight
                + bottomToolbarGap
                + this._layoutConfiguration.markdownCellBottomMargin;
        }
        computeBottomToolbarOffset(totalHeight, viewType) {
            const { bottomToolbarGap, bottomToolbarHeight } = this.computeBottomToolbarDimensions(viewType);
            return totalHeight
                - bottomToolbarGap
                - bottomToolbarHeight / 2;
        }
        computeCodeCellEditorWidth(outerWidth) {
            return outerWidth - (this._layoutConfiguration.codeCellLeftMargin
                + this._layoutConfiguration.cellRunGutter
                + this._layoutConfiguration.cellRightMargin);
        }
        computeMarkdownCellEditorWidth(outerWidth) {
            return outerWidth
                - this._layoutConfiguration.markdownCellGutter
                - this._layoutConfiguration.markdownCellLeftMargin
                - this._layoutConfiguration.cellRightMargin;
        }
        computeStatusBarHeight() {
            return this._layoutConfiguration.cellStatusBarHeight;
        }
        _computeBottomToolbarDimensions(compactView, insertToolbarPosition, insertToolbarAlignment, cellToolbar) {
            if (insertToolbarAlignment === 'left' || cellToolbar !== 'hidden') {
                return {
                    bottomToolbarGap: 18,
                    bottomToolbarHeight: 18
                };
            }
            if (insertToolbarPosition === 'betweenCells' || insertToolbarPosition === 'both') {
                return compactView ? {
                    bottomToolbarGap: 12,
                    bottomToolbarHeight: 20
                } : {
                    bottomToolbarGap: 20,
                    bottomToolbarHeight: 20
                };
            }
            else {
                return {
                    bottomToolbarGap: 0,
                    bottomToolbarHeight: 0
                };
            }
        }
        computeBottomToolbarDimensions(viewType) {
            const configuration = this._layoutConfiguration;
            const cellToolbarPosition = this.computeCellToolbarLocation(viewType);
            const { bottomToolbarGap, bottomToolbarHeight } = this._computeBottomToolbarDimensions(configuration.compactView, configuration.insertToolbarPosition, configuration.insertToolbarAlignment, cellToolbarPosition);
            return {
                bottomToolbarGap,
                bottomToolbarHeight
            };
        }
        computeCellToolbarLocation(viewType) {
            var _a;
            const cellToolbarLocation = this._layoutConfiguration.cellToolbarLocation;
            if (typeof cellToolbarLocation === 'string') {
                if (cellToolbarLocation === 'left' || cellToolbarLocation === 'right' || cellToolbarLocation === 'hidden') {
                    return cellToolbarLocation;
                }
            }
            else {
                if (viewType) {
                    const notebookSpecificSetting = (_a = cellToolbarLocation[viewType]) !== null && _a !== void 0 ? _a : cellToolbarLocation['default'];
                    let cellToolbarLocationForCurrentView = 'right';
                    switch (notebookSpecificSetting) {
                        case 'left':
                            cellToolbarLocationForCurrentView = 'left';
                            break;
                        case 'right':
                            cellToolbarLocationForCurrentView = 'right';
                            break;
                        case 'hidden':
                            cellToolbarLocationForCurrentView = 'hidden';
                            break;
                        default:
                            cellToolbarLocationForCurrentView = 'right';
                            break;
                    }
                    return cellToolbarLocationForCurrentView;
                }
            }
            return 'right';
        }
        computeTopInsertToolbarHeight(viewType) {
            if (this._layoutConfiguration.insertToolbarPosition === 'betweenCells' || this._layoutConfiguration.insertToolbarPosition === 'both') {
                return SCROLLABLE_ELEMENT_PADDING_TOP;
            }
            const cellToolbarLocation = this.computeCellToolbarLocation(viewType);
            if (cellToolbarLocation === 'left' || cellToolbarLocation === 'right') {
                return SCROLLABLE_ELEMENT_PADDING_TOP;
            }
            return 0;
        }
        computeEditorPadding(internalMetadata, cellUri) {
            return {
                top: getEditorTopPadding(),
                bottom: this.statusBarIsVisible(internalMetadata, cellUri)
                    ? this._layoutConfiguration.editorBottomPadding
                    : this._layoutConfiguration.editorBottomPaddingWithoutStatusBar
            };
        }
        computeEditorStatusbarHeight(internalMetadata, cellUri) {
            return this.statusBarIsVisible(internalMetadata, cellUri) ? this.computeStatusBarHeight() : 0;
        }
        statusBarIsVisible(internalMetadata, cellUri) {
            const exe = this.notebookExecutionStateService.getCellExecution(cellUri);
            if (this._layoutConfiguration.showCellStatusBar === 'visible') {
                return true;
            }
            else if (this._layoutConfiguration.showCellStatusBar === 'visibleAfterExecute') {
                return typeof internalMetadata.lastRunSuccess === 'boolean' || exe !== undefined;
            }
            else {
                return false;
            }
        }
        computeWebviewOptions() {
            return {
                outputNodePadding: this._layoutConfiguration.cellOutputPadding,
                outputNodeLeftPadding: this._layoutConfiguration.cellOutputPadding,
                previewNodePadding: this._layoutConfiguration.markdownPreviewPadding,
                markdownLeftMargin: this._layoutConfiguration.markdownCellGutter + this._layoutConfiguration.markdownCellLeftMargin,
                leftMargin: this._layoutConfiguration.codeCellLeftMargin,
                rightMargin: this._layoutConfiguration.cellRightMargin,
                runGutter: this._layoutConfiguration.cellRunGutter,
                dragAndDropEnabled: this._layoutConfiguration.dragAndDropEnabled,
                fontSize: this._layoutConfiguration.fontSize,
                outputFontSize: this._layoutConfiguration.outputFontSize,
                outputFontFamily: this._layoutConfiguration.outputFontFamily,
                markupFontSize: this._layoutConfiguration.markupFontSize,
                outputLineHeight: this._layoutConfiguration.outputLineHeight,
            };
        }
        computeDiffWebviewOptions() {
            return {
                outputNodePadding: this._layoutConfiguration.cellOutputPadding,
                outputNodeLeftPadding: 0,
                previewNodePadding: this._layoutConfiguration.markdownPreviewPadding,
                markdownLeftMargin: 0,
                leftMargin: 32,
                rightMargin: 0,
                runGutter: 0,
                dragAndDropEnabled: false,
                fontSize: this._layoutConfiguration.fontSize,
                outputFontSize: this._layoutConfiguration.outputFontSize,
                outputFontFamily: this._layoutConfiguration.outputFontFamily,
                markupFontSize: this._layoutConfiguration.markupFontSize,
                outputLineHeight: this._layoutConfiguration.outputLineHeight,
            };
        }
        computeIndicatorPosition(totalHeight, foldHintHeight, viewType) {
            const { bottomToolbarGap } = this.computeBottomToolbarDimensions(viewType);
            return {
                bottomIndicatorTop: totalHeight - bottomToolbarGap - this._layoutConfiguration.cellBottomMargin - foldHintHeight,
                verticalIndicatorHeight: totalHeight - bottomToolbarGap - foldHintHeight
            };
        }
    }
    exports.NotebookOptions = NotebookOptions;
});
//# sourceMappingURL=notebookOptions.js.map