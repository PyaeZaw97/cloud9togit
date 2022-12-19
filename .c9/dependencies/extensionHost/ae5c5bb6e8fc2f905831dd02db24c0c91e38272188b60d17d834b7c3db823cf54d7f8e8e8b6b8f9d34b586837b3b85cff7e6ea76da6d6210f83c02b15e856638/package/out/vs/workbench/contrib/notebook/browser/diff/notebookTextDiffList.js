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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/base/common/platform", "vs/workbench/contrib/notebook/browser/diff/diffComponents", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/browser/widget/diffEditorWidget", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/notification/common/notification", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/editor/common/config/fontInfo", "vs/base/browser/browser", "vs/css!./notebookDiff"], function (require, exports, DOM, listWidget_1, lifecycle_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, listService_1, themeService_1, notebookDiffEditorBrowser_1, platform_1, diffComponents_1, codeEditorWidget_1, diffEditorWidget_1, toolbar_1, actions_1, contextView_1, notification_1, cellActionView_1, fontInfo_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookTextDiffList = exports.NotebookMouseController = exports.CellDiffSideBySideRenderer = exports.CellDiffSingleSideRenderer = exports.NotebookCellTextDiffListDelegate = void 0;
    let NotebookCellTextDiffListDelegate = class NotebookCellTextDiffListDelegate {
        constructor(configurationService) {
            this.configurationService = configurationService;
            const editorOptions = this.configurationService.getValue('editor');
            this.lineHeight = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.PixelRatio.value).lineHeight;
        }
        getHeight(element) {
            return element.getHeight(this.lineHeight);
        }
        hasDynamicHeight(element) {
            return false;
        }
        getTemplateId(element) {
            switch (element.type) {
                case 'delete':
                case 'insert':
                    return CellDiffSingleSideRenderer.TEMPLATE_ID;
                case 'modified':
                case 'unchanged':
                    return CellDiffSideBySideRenderer.TEMPLATE_ID;
            }
        }
    };
    NotebookCellTextDiffListDelegate = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], NotebookCellTextDiffListDelegate);
    exports.NotebookCellTextDiffListDelegate = NotebookCellTextDiffListDelegate;
    let CellDiffSingleSideRenderer = class CellDiffSingleSideRenderer {
        constructor(notebookEditor, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return CellDiffSingleSideRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const body = DOM.$('.cell-body');
            DOM.append(container, body);
            const diffEditorContainer = DOM.$('.cell-diff-editor-container');
            DOM.append(body, diffEditorContainer);
            const diagonalFill = DOM.append(body, DOM.$('.diagonal-fill'));
            const sourceContainer = DOM.append(diffEditorContainer, DOM.$('.source-container'));
            const editor = this._buildSourceEditor(sourceContainer);
            const metadataHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-header-container'));
            const metadataInfoContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-info-container'));
            const outputHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.output-header-container'));
            const outputInfoContainer = DOM.append(diffEditorContainer, DOM.$('.output-info-container'));
            const borderContainer = DOM.append(body, DOM.$('.border-container'));
            const leftBorder = DOM.append(borderContainer, DOM.$('.left-border'));
            const rightBorder = DOM.append(borderContainer, DOM.$('.right-border'));
            const topBorder = DOM.append(borderContainer, DOM.$('.top-border'));
            const bottomBorder = DOM.append(borderContainer, DOM.$('.bottom-border'));
            return {
                body,
                container,
                diffEditorContainer,
                diagonalFill,
                sourceEditor: editor,
                metadataHeaderContainer,
                metadataInfoContainer,
                outputHeaderContainer,
                outputInfoContainer,
                leftBorder,
                rightBorder,
                topBorder,
                bottomBorder,
                elementDisposables: new lifecycle_1.DisposableStore()
            };
        }
        _buildSourceEditor(sourceContainer) {
            const editorContainer = DOM.append(sourceContainer, DOM.$('.editor-container'));
            const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, editorContainer, Object.assign(Object.assign({}, diffComponents_1.fixedEditorOptions), { dimension: {
                    width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                    height: 0
                }, automaticLayout: false, overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode() }), {});
            return editor;
        }
        renderElement(element, index, templateData, height) {
            templateData.body.classList.remove('left', 'right', 'full');
            switch (element.type) {
                case 'delete':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.DeletedElement, this.notebookEditor, element, templateData));
                    return;
                case 'insert':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.InsertElement, this.notebookEditor, element, templateData));
                    return;
                default:
                    break;
            }
        }
        disposeTemplate(templateData) {
            templateData.container.innerText = '';
            templateData.sourceEditor.dispose();
        }
        disposeElement(element, index, templateData) {
            templateData.elementDisposables.clear();
        }
    };
    CellDiffSingleSideRenderer.TEMPLATE_ID = 'cell_diff_single';
    CellDiffSingleSideRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], CellDiffSingleSideRenderer);
    exports.CellDiffSingleSideRenderer = CellDiffSingleSideRenderer;
    let CellDiffSideBySideRenderer = class CellDiffSideBySideRenderer {
        constructor(notebookEditor, instantiationService, contextMenuService, keybindingService, menuService, contextKeyService, notificationService) {
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
        }
        get templateId() {
            return CellDiffSideBySideRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const body = DOM.$('.cell-body');
            DOM.append(container, body);
            const diffEditorContainer = DOM.$('.cell-diff-editor-container');
            DOM.append(body, diffEditorContainer);
            const sourceContainer = DOM.append(diffEditorContainer, DOM.$('.source-container'));
            const { editor, editorContainer } = this._buildSourceEditor(sourceContainer);
            const inputToolbarContainer = DOM.append(sourceContainer, DOM.$('.editor-input-toolbar-container'));
            const cellToolbarContainer = DOM.append(inputToolbarContainer, DOM.$('div.property-toolbar'));
            const toolbar = new toolbar_1.ToolBar(cellToolbarContainer, this.contextMenuService, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = new cellActionView_1.CodiconActionViewItem(action, this.keybindingService, this.notificationService, this.contextKeyService);
                        return item;
                    }
                    return undefined;
                }
            });
            const metadataHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-header-container'));
            const metadataInfoContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-info-container'));
            const outputHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.output-header-container'));
            const outputInfoContainer = DOM.append(diffEditorContainer, DOM.$('.output-info-container'));
            const borderContainer = DOM.append(body, DOM.$('.border-container'));
            const leftBorder = DOM.append(borderContainer, DOM.$('.left-border'));
            const rightBorder = DOM.append(borderContainer, DOM.$('.right-border'));
            const topBorder = DOM.append(borderContainer, DOM.$('.top-border'));
            const bottomBorder = DOM.append(borderContainer, DOM.$('.bottom-border'));
            return {
                body,
                container,
                diffEditorContainer,
                sourceEditor: editor,
                editorContainer,
                inputToolbarContainer,
                toolbar,
                metadataHeaderContainer,
                metadataInfoContainer,
                outputHeaderContainer,
                outputInfoContainer,
                leftBorder,
                rightBorder,
                topBorder,
                bottomBorder,
                elementDisposables: new lifecycle_1.DisposableStore()
            };
        }
        _buildSourceEditor(sourceContainer) {
            const editorContainer = DOM.append(sourceContainer, DOM.$('.editor-container'));
            const editor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, editorContainer, Object.assign(Object.assign({}, diffComponents_1.fixedDiffEditorOptions), { padding: {
                    top: 24,
                    bottom: 12
                }, overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(), originalEditable: false, ignoreTrimWhitespace: false, automaticLayout: false, dimension: {
                    height: 0,
                    width: 0
                } }), {
                originalEditor: (0, diffComponents_1.getOptimizedNestedCodeEditorWidgetOptions)(),
                modifiedEditor: (0, diffComponents_1.getOptimizedNestedCodeEditorWidgetOptions)()
            });
            return {
                editor,
                editorContainer
            };
        }
        renderElement(element, index, templateData, height) {
            templateData.body.classList.remove('left', 'right', 'full');
            switch (element.type) {
                case 'unchanged':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.ModifiedElement, this.notebookEditor, element, templateData));
                    return;
                case 'modified':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.ModifiedElement, this.notebookEditor, element, templateData));
                    return;
                default:
                    break;
            }
        }
        disposeTemplate(templateData) {
            var _a;
            templateData.container.innerText = '';
            templateData.sourceEditor.dispose();
            (_a = templateData.toolbar) === null || _a === void 0 ? void 0 : _a.dispose();
        }
        disposeElement(element, index, templateData) {
            templateData.elementDisposables.clear();
        }
    };
    CellDiffSideBySideRenderer.TEMPLATE_ID = 'cell_diff_side_by_side';
    CellDiffSideBySideRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_1.IMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, notification_1.INotificationService)
    ], CellDiffSideBySideRenderer);
    exports.CellDiffSideBySideRenderer = CellDiffSideBySideRenderer;
    class NotebookMouseController extends listWidget_1.MouseController {
        onViewPointer(e) {
            if ((0, listWidget_1.isMonacoEditor)(e.browserEvent.target)) {
                const focus = typeof e.index === 'undefined' ? [] : [e.index];
                this.list.setFocus(focus, e.browserEvent);
            }
            else {
                super.onViewPointer(e);
            }
        }
    }
    exports.NotebookMouseController = NotebookMouseController;
    let NotebookTextDiffList = class NotebookTextDiffList extends listService_1.WorkbenchList {
        constructor(listUser, container, delegate, renderers, contextKeyService, options, listService, themeService, configurationService, keybindingService) {
            super(listUser, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService);
        }
        get rowsContainer() {
            return this.view.containerDomNode;
        }
        createMouseController(options) {
            return new NotebookMouseController(this);
        }
        getAbsoluteTopOfElement(element) {
            const index = this.indexOf(element);
            // if (index === undefined || index < 0 || index >= this.length) {
            // 	this._getViewIndexUpperBound(element);
            // 	throw new ListError(this.listUser, `Invalid index ${index}`);
            // }
            return this.view.elementTop(index);
        }
        getScrollHeight() {
            return this.view.scrollHeight;
        }
        triggerScrollFromMouseWheelEvent(browserEvent) {
            this.view.triggerScrollFromMouseWheelEvent(browserEvent);
        }
        clear() {
            super.splice(0, this.length);
        }
        updateElementHeight2(element, size) {
            const viewIndex = this.indexOf(element);
            const focused = this.getFocus();
            this.view.updateElementHeight(viewIndex, size, focused.length ? focused[0] : null);
        }
        style(styles) {
            const selectorSuffix = this.view.domId;
            if (!this.styleElement) {
                this.styleElement = DOM.createStyleSheet(this.view.domNode);
            }
            const suffix = selectorSuffix && `.${selectorSuffix}`;
            const content = [];
            if (styles.listBackground) {
                if (styles.listBackground.isOpaque()) {
                    content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows { background: ${styles.listBackground}; }`);
                }
                else if (!platform_1.isMacintosh) { // subpixel AA doesn't exist in macOS
                    console.warn(`List with id '${selectorSuffix}' was styled with a non-opaque background color. This will break sub-pixel antialiasing.`);
                }
            }
            if (styles.listFocusBackground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listFocusAndSelectionBackground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected.focused { background-color: ${styles.listFocusAndSelectionBackground}; }
			`);
            }
            if (styles.listFocusAndSelectionForeground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected.focused { color: ${styles.listFocusAndSelectionForeground}; }
			`);
            }
            if (styles.listInactiveFocusBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { background-color:  ${styles.listInactiveFocusBackground}; }`);
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused:hover { background-color:  ${styles.listInactiveFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { background-color:  ${styles.listInactiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected:hover { background-color:  ${styles.listInactiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionForeground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { color: ${styles.listInactiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list${suffix}:not(.drop-target) > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover:not(.selected):not(.focused) { background-color:  ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover:not(.selected):not(.focused) { color:  ${styles.listHoverForeground}; }`);
            }
            if (styles.listSelectionOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { outline: 1px dotted ${styles.listSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listFocusOutline) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
			`);
            }
            if (styles.listInactiveFocusOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { outline: 1px dotted ${styles.listInactiveFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            if (styles.listDropBackground) {
                content.push(`
				.monaco-list${suffix}.drop-target,
				.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows.drop-target,
				.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-row.drop-target { background-color: ${styles.listDropBackground} !important; color: inherit !important; }
			`);
            }
            if (styles.listFilterWidgetBackground) {
                content.push(`.monaco-list-type-filter { background-color: ${styles.listFilterWidgetBackground} }`);
            }
            if (styles.listFilterWidgetOutline) {
                content.push(`.monaco-list-type-filter { border: 1px solid ${styles.listFilterWidgetOutline}; }`);
            }
            if (styles.listFilterWidgetNoMatchesOutline) {
                content.push(`.monaco-list-type-filter.no-matches { border: 1px solid ${styles.listFilterWidgetNoMatchesOutline}; }`);
            }
            if (styles.listMatchesShadow) {
                content.push(`.monaco-list-type-filter { box-shadow: 1px 1px 1px ${styles.listMatchesShadow}; }`);
            }
            const newStyles = content.join('\n');
            if (newStyles !== this.styleElement.textContent) {
                this.styleElement.textContent = newStyles;
            }
        }
    };
    NotebookTextDiffList = __decorate([
        __param(6, listService_1.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService)
    ], NotebookTextDiffList);
    exports.NotebookTextDiffList = NotebookTextDiffList;
});
//# sourceMappingURL=notebookTextDiffList.js.map