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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/markdownRenderer", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/themeService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, DOM, markdownRenderer_1, toolbar_1, actions_1, lifecycle_1, nls, menuEntryActionViewItem_1, actions_2, contextkey_1, contextView_1, instantiation_1, keybinding_1, opener_1, quickInput_1, themeService_1, extensions_1, notebookBrowser_1, notebookIcons_1, cellPart_1, notebookCommon_1, notebookService_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellOutputContainer = exports.CellOutputElement = void 0;
    // DOM structure
    //
    //  #output
    //  |
    //  |  #output-inner-container
    //  |                        |  #cell-output-toolbar
    //  |                        |  #output-element
    //  |                        |  #output-element
    //  |                        |  #output-element
    //  |  #output-inner-container
    //  |                        |  #cell-output-toolbar
    //  |                        |  #output-element
    //  |  #output-inner-container
    //  |                        |  #cell-output-toolbar
    //  |                        |  #output-element
    let CellOutputElement = class CellOutputElement extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, cellOutputContainer, outputContainer, output, notebookService, quickInputService, contextMenuService, keybindingService, parentContextKeyService, menuService, paneCompositeService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.cellOutputContainer = cellOutputContainer;
            this.outputContainer = outputContainer;
            this.output = output;
            this.notebookService = notebookService;
            this.quickInputService = quickInputService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.paneCompositeService = paneCompositeService;
            this._renderDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._actionsDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._outputHeightTimer = null;
            this.contextKeyService = parentContextKeyService;
            this._register(this.output.model.onDidChangeData(() => {
                this.updateOutputData();
            }));
        }
        detach() {
            var _a, _b;
            if (this.renderedOutputContainer) {
                (_a = this.renderedOutputContainer.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(this.renderedOutputContainer);
            }
            let count = 0;
            if (this.innerContainer) {
                for (let i = 0; i < this.innerContainer.childNodes.length; i++) {
                    if (this.innerContainer.childNodes[i].className === 'rendered-output') {
                        count++;
                    }
                    if (count > 1) {
                        break;
                    }
                }
                if (count === 0) {
                    (_b = this.innerContainer.parentElement) === null || _b === void 0 ? void 0 : _b.removeChild(this.innerContainer);
                }
            }
            this.notebookEditor.removeInset(this.output);
        }
        updateDOMTop(top) {
            if (this.innerContainer) {
                this.innerContainer.style.top = `${top}px`;
            }
        }
        updateOutputData() {
            var _a, _b, _c;
            if (this.notebookEditor.hasModel() &&
                this.innerContainer &&
                this.renderResult &&
                this.renderResult.type === 1 /* RenderOutputType.Extension */) {
                // Output rendered by extension renderer got an update
                const [mimeTypes, pick] = this.output.resolveMimeTypes(this.notebookEditor.textModel, (_a = this.notebookEditor.activeKernel) === null || _a === void 0 ? void 0 : _a.preloadProvides);
                const pickedMimeType = mimeTypes[pick];
                if (pickedMimeType.mimeType === this.renderResult.mimeType && pickedMimeType.rendererId === this.renderResult.renderer.id) {
                    // Same mimetype, same renderer, call the extension renderer to update
                    const index = this.viewCell.outputsViewModels.indexOf(this.output);
                    this.notebookEditor.updateOutput(this.viewCell, this.renderResult, this.viewCell.getOutputOffset(index));
                    return;
                }
            }
            if (!this.innerContainer) {
                // init rendering didn't happen
                const currOutputIndex = this.cellOutputContainer.renderedOutputEntries.findIndex(entry => entry.element === this);
                const previousSibling = currOutputIndex > 0 && !!((_b = this.cellOutputContainer.renderedOutputEntries[currOutputIndex - 1].element.innerContainer) === null || _b === void 0 ? void 0 : _b.parentElement)
                    ? this.cellOutputContainer.renderedOutputEntries[currOutputIndex - 1].element.innerContainer
                    : undefined;
                this.render(previousSibling);
            }
            else {
                // Another mimetype or renderer is picked, we need to clear the current output and re-render
                const nextElement = this.innerContainer.nextElementSibling;
                this._renderDisposableStore.clear();
                const element = this.innerContainer;
                if (element) {
                    (_c = element.parentElement) === null || _c === void 0 ? void 0 : _c.removeChild(element);
                    this.notebookEditor.removeInset(this.output);
                }
                this.render(nextElement);
            }
            this._relayoutCell();
        }
        // insert after previousSibling
        _generateInnerOutputContainer(previousSibling, pickedMimeTypeRenderer) {
            this.innerContainer = DOM.$('.output-inner-container');
            if (previousSibling && previousSibling.nextElementSibling) {
                this.outputContainer.domNode.insertBefore(this.innerContainer, previousSibling.nextElementSibling);
            }
            else {
                this.outputContainer.domNode.appendChild(this.innerContainer);
            }
            this.innerContainer.setAttribute('output-mime-type', pickedMimeTypeRenderer.mimeType);
            return this.innerContainer;
        }
        render(previousSibling) {
            var _a, _b;
            const index = this.viewCell.outputsViewModels.indexOf(this.output);
            if (this.viewCell.isOutputCollapsed || !this.notebookEditor.hasModel()) {
                return undefined;
            }
            const notebookUri = (_a = notebookCommon_1.CellUri.parse(this.viewCell.uri)) === null || _a === void 0 ? void 0 : _a.notebook;
            if (!notebookUri) {
                return undefined;
            }
            const notebookTextModel = this.notebookEditor.textModel;
            const [mimeTypes, pick] = this.output.resolveMimeTypes(notebookTextModel, (_b = this.notebookEditor.activeKernel) === null || _b === void 0 ? void 0 : _b.preloadProvides);
            if (!mimeTypes.find(mimeType => mimeType.isTrusted) || mimeTypes.length === 0) {
                this.viewCell.updateOutputHeight(index, 0, 'CellOutputElement#noMimeType');
                return undefined;
            }
            const pickedMimeTypeRenderer = mimeTypes[pick];
            const innerContainer = this._generateInnerOutputContainer(previousSibling, pickedMimeTypeRenderer);
            this._attachToolbar(innerContainer, notebookTextModel, this.notebookEditor.activeKernel, index, mimeTypes);
            this.renderedOutputContainer = DOM.append(innerContainer, DOM.$('.rendered-output'));
            const renderer = this.notebookService.getRendererInfo(pickedMimeTypeRenderer.rendererId);
            this.renderResult = renderer
                ? { type: 1 /* RenderOutputType.Extension */, renderer, source: this.output, mimeType: pickedMimeTypeRenderer.mimeType }
                : this._renderMissingRenderer(this.output, pickedMimeTypeRenderer.mimeType);
            this.output.pickedMimeType = pickedMimeTypeRenderer;
            if (!this.renderResult) {
                this.viewCell.updateOutputHeight(index, 0, 'CellOutputElement#renderResultUndefined');
                return undefined;
            }
            this.notebookEditor.createOutput(this.viewCell, this.renderResult, this.viewCell.getOutputOffset(index));
            innerContainer.classList.add('background');
            return { initRenderIsSynchronous: false };
        }
        _renderMissingRenderer(viewModel, preferredMimeType) {
            if (!viewModel.model.outputs.length) {
                return this._renderMessage(viewModel, nls.localize('empty', "Cell has no output"));
            }
            if (!preferredMimeType) {
                const mimeTypes = viewModel.model.outputs.map(op => op.mime);
                const mimeTypesMessage = mimeTypes.join(', ');
                return this._renderMessage(viewModel, nls.localize('noRenderer.2', "No renderer could be found for output. It has the following mimetypes: {0}", mimeTypesMessage));
            }
            return this._renderSearchForMimetype(viewModel, preferredMimeType);
        }
        _renderSearchForMimetype(viewModel, mimeType) {
            const query = `@tag:notebookRenderer ${mimeType}`;
            return {
                type: 0 /* RenderOutputType.Html */,
                source: viewModel,
                htmlContent: `<p>No renderer could be found for mimetype "${mimeType}", but one might be available on the Marketplace.</p>
			<a href="command:workbench.extensions.search?%22${query}%22" class="monaco-button monaco-text-button" tabindex="0" role="button" style="padding: 8px; text-decoration: none; color: rgb(255, 255, 255); background-color: rgb(14, 99, 156); max-width: 200px;">Search Marketplace</a>`
            };
        }
        _renderMessage(viewModel, message) {
            return { type: 0 /* RenderOutputType.Html */, source: viewModel, htmlContent: `<p>${message}</p>` };
        }
        async _attachToolbar(outputItemDiv, notebookTextModel, kernel, index, mimeTypes) {
            const hasMultipleMimeTypes = mimeTypes.filter(mimeType => mimeType.isTrusted).length <= 1;
            if (index > 0 && hasMultipleMimeTypes) {
                return;
            }
            if (!this.notebookEditor.hasModel()) {
                return;
            }
            const useConsolidatedButton = this.notebookEditor.notebookOptions.getLayoutConfiguration().consolidatedOutputButton;
            outputItemDiv.style.position = 'relative';
            const mimeTypePicker = DOM.$('.cell-output-toolbar');
            outputItemDiv.appendChild(mimeTypePicker);
            const toolbar = this._renderDisposableStore.add(new toolbar_1.ToolBar(mimeTypePicker, this.contextMenuService, {
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                renderDropdownAsChildElement: false
            }));
            toolbar.context = {
                ui: true,
                cell: this.output.cellViewModel,
                notebookEditor: this.notebookEditor,
                $mid: 12 /* MarshalledId.NotebookCellActionContext */
            };
            // TODO: This could probably be a real registered action, but it has to talk to this output element
            const pickAction = new actions_1.Action('notebook.output.pickMimetype', nls.localize('pickMimeType', "Change Presentation"), themeService_1.ThemeIcon.asClassName(notebookIcons_1.mimetypeIcon), undefined, async (_context) => this._pickActiveMimeTypeRenderer(outputItemDiv, notebookTextModel, kernel, this.output));
            if (index === 0 && useConsolidatedButton) {
                const menu = this._renderDisposableStore.add(this.menuService.createMenu(actions_2.MenuId.NotebookOutputToolbar, this.contextKeyService));
                const updateMenuToolbar = () => {
                    const primary = [];
                    const secondary = [];
                    const result = { primary, secondary };
                    this._actionsDisposable.value = (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, () => false);
                    toolbar.setActions([], [pickAction, ...secondary]);
                };
                updateMenuToolbar();
                this._renderDisposableStore.add(menu.onDidChange(updateMenuToolbar));
            }
            else {
                toolbar.setActions([pickAction]);
            }
        }
        async _pickActiveMimeTypeRenderer(outputItemDiv, notebookTextModel, kernel, viewModel) {
            var _a;
            const [mimeTypes, currIndex] = viewModel.resolveMimeTypes(notebookTextModel, kernel === null || kernel === void 0 ? void 0 : kernel.preloadProvides);
            const items = [];
            const unsupportedItems = [];
            mimeTypes.forEach((mimeType, index) => {
                if (mimeType.isTrusted) {
                    const arr = mimeType.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE ?
                        unsupportedItems :
                        items;
                    arr.push({
                        label: mimeType.mimeType,
                        id: mimeType.mimeType,
                        index: index,
                        picked: index === currIndex,
                        detail: this._generateRendererInfo(mimeType.rendererId),
                        description: index === currIndex ? nls.localize('curruentActiveMimeType', "Currently Active") : undefined
                    });
                }
            });
            if (unsupportedItems.some(m => JUPYTER_RENDERER_MIMETYPES.includes(m.id))) {
                unsupportedItems.push({
                    label: nls.localize('installJupyterPrompt', "Install additional renderers from the marketplace"),
                    id: 'installRenderers',
                    index: mimeTypes.length
                });
            }
            const picker = this.quickInputService.createQuickPick();
            picker.items = [
                ...items,
                { type: 'separator' },
                ...unsupportedItems
            ];
            picker.activeItems = items.filter(item => !!item.picked);
            picker.placeholder = items.length !== mimeTypes.length
                ? nls.localize('promptChooseMimeTypeInSecure.placeHolder', "Select mimetype to render for current output")
                : nls.localize('promptChooseMimeType.placeHolder', "Select mimetype to render for current output");
            const pick = await new Promise(resolve => {
                picker.onDidAccept(() => {
                    resolve(picker.selectedItems.length === 1 ? picker.selectedItems[0] : undefined);
                    picker.dispose();
                });
                picker.show();
            });
            if (pick === undefined || pick.index === currIndex) {
                return;
            }
            if (pick.id === 'installRenderers') {
                this._showJupyterExtension();
                return;
            }
            // user chooses another mimetype
            const nextElement = outputItemDiv.nextElementSibling;
            this._renderDisposableStore.clear();
            const element = this.innerContainer;
            if (element) {
                (_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(element);
                this.notebookEditor.removeInset(viewModel);
            }
            viewModel.pickedMimeType = mimeTypes[pick.index];
            this.viewCell.updateOutputMinHeight(this.viewCell.layoutInfo.outputTotalHeight);
            const { mimeType, rendererId } = mimeTypes[pick.index];
            this.notebookService.updateMimePreferredRenderer(notebookTextModel.viewType, mimeType, rendererId, mimeTypes.map(m => m.mimeType));
            this.render(nextElement);
            this._validateFinalOutputHeight(false);
            this._relayoutCell();
        }
        async _showJupyterExtension() {
            const viewlet = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const view = viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer();
            view === null || view === void 0 ? void 0 : view.search(`@id:${notebookBrowser_1.JUPYTER_EXTENSION_ID}`);
        }
        _generateRendererInfo(renderId) {
            const renderInfo = this.notebookService.getRendererInfo(renderId);
            if (renderInfo) {
                const displayName = renderInfo.displayName !== '' ? renderInfo.displayName : renderInfo.id;
                return `${displayName} (${renderInfo.extensionId.value})`;
            }
            return nls.localize('unavailableRenderInfo', "renderer not available");
        }
        _validateFinalOutputHeight(synchronous) {
            if (this._outputHeightTimer !== null) {
                clearTimeout(this._outputHeightTimer);
            }
            if (synchronous) {
                this.viewCell.unlockOutputHeight();
            }
            else {
                this._outputHeightTimer = setTimeout(() => {
                    this.viewCell.unlockOutputHeight();
                }, 1000);
            }
        }
        _relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
        }
        dispose() {
            if (this._outputHeightTimer) {
                this.viewCell.unlockOutputHeight();
                clearTimeout(this._outputHeightTimer);
            }
            super.dispose();
        }
    };
    CellOutputElement = __decorate([
        __param(5, notebookService_1.INotebookService),
        __param(6, quickInput_1.IQuickInputService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, actions_2.IMenuService),
        __param(11, panecomposite_1.IPaneCompositePartService)
    ], CellOutputElement);
    exports.CellOutputElement = CellOutputElement;
    class OutputEntryViewHandler {
        constructor(model, element) {
            this.model = model;
            this.element = element;
        }
    }
    let CellOutputContainer = class CellOutputContainer extends cellPart_1.CellPart {
        constructor(notebookEditor, viewCell, templateData, options, openerService, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.options = options;
            this.openerService = openerService;
            this.instantiationService = instantiationService;
            this._outputEntries = [];
            this._outputHeightTimer = null;
            this._register(viewCell.onDidChangeOutputs(splice => {
                this._updateOutputs(splice);
            }));
            this._register(viewCell.onDidChangeLayout(() => {
                this.updateInternalLayoutNow(viewCell);
            }));
        }
        get renderedOutputEntries() {
            return this._outputEntries;
        }
        updateInternalLayoutNow(viewCell) {
            this.templateData.outputContainer.setTop(viewCell.layoutInfo.outputContainerOffset);
            this.templateData.outputShowMoreContainer.setTop(viewCell.layoutInfo.outputShowMoreContainerOffset);
            this._outputEntries.forEach(entry => {
                const index = this.viewCell.outputsViewModels.indexOf(entry.model);
                if (index >= 0) {
                    const top = this.viewCell.getOutputOffsetInContainer(index);
                    entry.element.updateDOMTop(top);
                }
            });
        }
        render(editorHeight) {
            if (this.viewCell.outputsViewModels.length > 0) {
                if (this.viewCell.layoutInfo.totalHeight !== 0 && this.viewCell.layoutInfo.editorHeight > editorHeight) {
                    this.viewCell.updateOutputMinHeight(this.viewCell.layoutInfo.outputTotalHeight);
                    this._relayoutCell();
                }
                DOM.show(this.templateData.outputContainer.domNode);
                for (let index = 0; index < Math.min(this.options.limit, this.viewCell.outputsViewModels.length); index++) {
                    const currOutput = this.viewCell.outputsViewModels[index];
                    const entry = this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, currOutput);
                    this._outputEntries.push(new OutputEntryViewHandler(currOutput, entry));
                    entry.render(undefined);
                }
                this.viewCell.editorHeight = editorHeight;
                if (this.viewCell.outputsViewModels.length > this.options.limit) {
                    DOM.show(this.templateData.outputShowMoreContainer.domNode);
                    this.viewCell.updateOutputShowMoreContainerHeight(46);
                }
                this._relayoutCell();
                this._validateFinalOutputHeight(false);
            }
            else {
                // noop
                this.viewCell.editorHeight = editorHeight;
                this._relayoutCell();
                DOM.hide(this.templateData.outputContainer.domNode);
            }
            this.templateData.outputShowMoreContainer.domNode.innerText = '';
            if (this.viewCell.outputsViewModels.length > this.options.limit) {
                this.templateData.outputShowMoreContainer.domNode.appendChild(this._generateShowMoreElement(this.templateData.templateDisposables));
            }
            else {
                DOM.hide(this.templateData.outputShowMoreContainer.domNode);
                this.viewCell.updateOutputShowMoreContainerHeight(0);
            }
        }
        viewUpdateShowOutputs(initRendering) {
            for (let index = 0; index < this._outputEntries.length; index++) {
                const viewHandler = this._outputEntries[index];
                const outputEntry = viewHandler.element;
                if (outputEntry.renderResult) {
                    this.notebookEditor.createOutput(this.viewCell, outputEntry.renderResult, this.viewCell.getOutputOffset(index));
                }
                else {
                    outputEntry.render(undefined);
                }
            }
            this._relayoutCell();
        }
        viewUpdateHideOuputs() {
            for (let index = 0; index < this._outputEntries.length; index++) {
                this.notebookEditor.hideInset(this._outputEntries[index].model);
            }
        }
        _validateFinalOutputHeight(synchronous) {
            if (this._outputHeightTimer !== null) {
                clearTimeout(this._outputHeightTimer);
            }
            if (synchronous) {
                this.viewCell.unlockOutputHeight();
            }
            else {
                this._outputHeightTimer = setTimeout(() => {
                    this.viewCell.unlockOutputHeight();
                }, 1000);
            }
        }
        _updateOutputs(splice) {
            const previousOutputHeight = this.viewCell.layoutInfo.outputTotalHeight;
            // for cell output update, we make sure the cell does not shrink before the new outputs are rendered.
            this.viewCell.updateOutputMinHeight(previousOutputHeight);
            if (this.viewCell.outputsViewModels.length) {
                DOM.show(this.templateData.outputContainer.domNode);
            }
            else {
                DOM.hide(this.templateData.outputContainer.domNode);
            }
            this.viewCell.spliceOutputHeights(splice.start, splice.deleteCount, splice.newOutputs.map(_ => 0));
            this._renderNow(splice);
        }
        _renderNow(splice) {
            var _a, _b;
            if (splice.start >= this.options.limit) {
                // splice items out of limit
                return;
            }
            const firstGroupEntries = this._outputEntries.slice(0, splice.start);
            const deletedEntries = this._outputEntries.slice(splice.start, splice.start + splice.deleteCount);
            const secondGroupEntries = this._outputEntries.slice(splice.start + splice.deleteCount);
            let newlyInserted = this.viewCell.outputsViewModels.slice(splice.start, splice.start + splice.newOutputs.length);
            // [...firstGroup, ...deletedEntries, ...secondGroupEntries]  [...restInModel]
            // [...firstGroup, ...newlyInserted, ...secondGroupEntries, restInModel]
            if (firstGroupEntries.length + newlyInserted.length + secondGroupEntries.length > this.options.limit) {
                // exceeds limit again
                if (firstGroupEntries.length + newlyInserted.length > this.options.limit) {
                    [...deletedEntries, ...secondGroupEntries].forEach(entry => {
                        entry.element.detach();
                        entry.element.dispose();
                    });
                    newlyInserted = newlyInserted.slice(0, this.options.limit - firstGroupEntries.length);
                    const newlyInsertedEntries = newlyInserted.map(insert => {
                        return new OutputEntryViewHandler(insert, this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, insert));
                    });
                    this._outputEntries = [...firstGroupEntries, ...newlyInsertedEntries];
                    // render newly inserted outputs
                    for (let i = firstGroupEntries.length; i < this._outputEntries.length; i++) {
                        this._outputEntries[i].element.render(undefined);
                    }
                }
                else {
                    // part of secondGroupEntries are pushed out of view
                    // now we have to be creative as secondGroupEntries might not use dedicated containers
                    const elementsPushedOutOfView = secondGroupEntries.slice(this.options.limit - firstGroupEntries.length - newlyInserted.length);
                    [...deletedEntries, ...elementsPushedOutOfView].forEach(entry => {
                        entry.element.detach();
                        entry.element.dispose();
                    });
                    // exclusive
                    let reRenderRightBoundary = firstGroupEntries.length + newlyInserted.length;
                    const newlyInsertedEntries = newlyInserted.map(insert => {
                        return new OutputEntryViewHandler(insert, this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, insert));
                    });
                    this._outputEntries = [...firstGroupEntries, ...newlyInsertedEntries, ...secondGroupEntries.slice(0, this.options.limit - firstGroupEntries.length - newlyInserted.length)];
                    for (let i = firstGroupEntries.length; i < reRenderRightBoundary; i++) {
                        const previousSibling = i - 1 >= 0 && this._outputEntries[i - 1] && !!((_a = this._outputEntries[i - 1].element.innerContainer) === null || _a === void 0 ? void 0 : _a.parentElement) ? this._outputEntries[i - 1].element.innerContainer : undefined;
                        this._outputEntries[i].element.render(previousSibling);
                    }
                }
            }
            else {
                // after splice, it doesn't exceed
                deletedEntries.forEach(entry => {
                    entry.element.detach();
                    entry.element.dispose();
                });
                let reRenderRightBoundary = firstGroupEntries.length + newlyInserted.length;
                const newlyInsertedEntries = newlyInserted.map(insert => {
                    return new OutputEntryViewHandler(insert, this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, insert));
                });
                let outputsNewlyAvailable = [];
                if (firstGroupEntries.length + newlyInsertedEntries.length + secondGroupEntries.length < this.viewCell.outputsViewModels.length) {
                    const last = Math.min(this.options.limit, this.viewCell.outputsViewModels.length);
                    outputsNewlyAvailable = this.viewCell.outputsViewModels.slice(firstGroupEntries.length + newlyInsertedEntries.length + secondGroupEntries.length, last).map(output => {
                        return new OutputEntryViewHandler(output, this.instantiationService.createInstance(CellOutputElement, this.notebookEditor, this.viewCell, this, this.templateData.outputContainer, output));
                    });
                }
                this._outputEntries = [...firstGroupEntries, ...newlyInsertedEntries, ...secondGroupEntries, ...outputsNewlyAvailable];
                for (let i = firstGroupEntries.length; i < reRenderRightBoundary; i++) {
                    const previousSibling = i - 1 >= 0 && this._outputEntries[i - 1] && !!((_b = this._outputEntries[i - 1].element.innerContainer) === null || _b === void 0 ? void 0 : _b.parentElement) ? this._outputEntries[i - 1].element.innerContainer : undefined;
                    this._outputEntries[i].element.render(previousSibling);
                }
                for (let i = 0; i < outputsNewlyAvailable.length; i++) {
                    this._outputEntries[firstGroupEntries.length + newlyInserted.length + secondGroupEntries.length + i].element.render(undefined);
                }
            }
            if (this.viewCell.outputsViewModels.length > this.options.limit) {
                DOM.show(this.templateData.outputShowMoreContainer.domNode);
                if (!this.templateData.outputShowMoreContainer.domNode.hasChildNodes()) {
                    this.templateData.outputShowMoreContainer.domNode.appendChild(this._generateShowMoreElement(this.templateData.templateDisposables));
                }
                this.viewCell.updateOutputShowMoreContainerHeight(46);
            }
            else {
                DOM.hide(this.templateData.outputShowMoreContainer.domNode);
            }
            const editorHeight = this.templateData.editor.getContentHeight();
            this.viewCell.editorHeight = editorHeight;
            this._relayoutCell();
            // if it's clearing all outputs, or outputs are all rendered synchronously
            // shrink immediately as the final output height will be zero.
            this._validateFinalOutputHeight(false || this.viewCell.outputsViewModels.length === 0);
        }
        _generateShowMoreElement(disposables) {
            const md = {
                value: `There are more than ${this.options.limit} outputs, [show more (open the raw output data in a text editor) ...](command:workbench.action.openLargeOutput)`,
                isTrusted: true,
                supportThemeIcons: true
            };
            const rendered = (0, markdownRenderer_1.renderMarkdown)(md, {
                actionHandler: {
                    callback: (content) => {
                        if (content === 'command:workbench.action.openLargeOutput') {
                            this.openerService.open(notebookCommon_1.CellUri.generateCellOutputUri(this.notebookEditor.textModel.uri));
                        }
                        return;
                    },
                    disposables
                }
            });
            disposables.add(rendered);
            rendered.element.classList.add('output-show-more');
            return rendered.element;
        }
        _relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
        }
        dispose() {
            this.viewCell.updateOutputMinHeight(0);
            if (this._outputHeightTimer) {
                clearTimeout(this._outputHeightTimer);
            }
            this._outputEntries.forEach(entry => {
                entry.element.dispose();
            });
            super.dispose();
        }
    };
    CellOutputContainer = __decorate([
        __param(4, opener_1.IOpenerService),
        __param(5, instantiation_1.IInstantiationService)
    ], CellOutputContainer);
    exports.CellOutputContainer = CellOutputContainer;
    const JUPYTER_RENDERER_MIMETYPES = [
        'application/geo+json',
        'application/vdom.v1+json',
        'application/vnd.dataresource+json',
        'application/vnd.plotly.v1+json',
        'application/vnd.vega.v2+json',
        'application/vnd.vega.v3+json',
        'application/vnd.vega.v4+json',
        'application/vnd.vega.v5+json',
        'application/vnd.vegalite.v1+json',
        'application/vnd.vegalite.v2+json',
        'application/vnd.vegalite.v3+json',
        'application/vnd.vegalite.v4+json',
        'application/x-nteract-model-debug+json',
        'image/svg+xml',
        'text/latex',
        'text/vnd.plotly.v1+html',
        'application/vnd.jupyter.widget-view+json',
        'application/vnd.code.notebook.error'
    ];
});
//# sourceMappingURL=cellOutput.js.map