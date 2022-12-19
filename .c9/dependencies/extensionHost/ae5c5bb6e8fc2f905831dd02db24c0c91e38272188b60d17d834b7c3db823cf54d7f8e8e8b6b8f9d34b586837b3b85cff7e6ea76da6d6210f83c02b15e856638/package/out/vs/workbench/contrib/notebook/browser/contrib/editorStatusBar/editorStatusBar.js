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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/strings", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/platform/theme/common/themeService", "vs/workbench/common/contributions", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/contrib/navigation/arrow", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/statusbar/browser/statusbar", "vs/editor/common/services/languageFeatures"], function (require, exports, arrays_1, lifecycle_1, network_1, strings_1, nls, actions_1, contextkey_1, extensions_1, instantiation_1, label_1, log_1, quickInput_1, platform_1, themeService_1, contributions_1, extensions_2, arrow_1, coreActions_1, notebookContextKeys_1, notebookBrowser_1, notebookIcons_1, notebookCommon_1, notebookKernelService_1, editorService_1, panecomposite_1, statusbar_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActiveCellStatus = exports.KernelStatus = void 0;
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: coreActions_1.SELECT_KERNEL_ID,
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                title: { value: nls.localize('notebookActions.selectKernel', "Select Notebook Kernel"), original: 'Select Notebook Kernel' },
                // precondition: NOTEBOOK_IS_ACTIVE_EDITOR,
                icon: notebookIcons_1.selectKernelIcon,
                f1: true,
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.notEqualsTo(0), notebookContextKeys_1.NOTEBOOK_MISSING_KERNEL_EXTENSION), contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: -10
                    }, {
                        id: actions_1.MenuId.NotebookToolbar,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.notEqualsTo(0), notebookContextKeys_1.NOTEBOOK_MISSING_KERNEL_EXTENSION), contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'status',
                        order: -10
                    }, {
                        id: actions_1.MenuId.InteractiveToolbar,
                        when: notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.notEqualsTo(0),
                        group: 'status',
                        order: -10
                    }],
                description: {
                    description: nls.localize('notebookActions.selectKernel.args', "Notebook Kernel Args"),
                    args: [
                        {
                            name: 'kernelInfo',
                            description: 'The kernel info',
                            schema: {
                                'type': 'object',
                                'required': ['id', 'extension'],
                                'properties': {
                                    'id': {
                                        'type': 'string'
                                    },
                                    'extension': {
                                        'type': 'string'
                                    },
                                    'notebookEditorId': {
                                        'type': 'string'
                                    }
                                }
                            }
                        }
                    ]
                },
            });
        }
        async run(accessor, context) {
            const notebookKernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const labelService = accessor.get(label_1.ILabelService);
            const logService = accessor.get(log_1.ILogService);
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            let editor;
            if (context !== undefined && 'notebookEditorId' in context) {
                const editorId = context.notebookEditorId;
                const matchingEditor = editorService.visibleEditorPanes.find((editorPane) => {
                    const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorPane);
                    return (notebookEditor === null || notebookEditor === void 0 ? void 0 : notebookEditor.getId()) === editorId;
                });
                editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(matchingEditor);
            }
            else if (context !== undefined && 'notebookEditor' in context) {
                editor = context === null || context === void 0 ? void 0 : context.notebookEditor;
            }
            else {
                editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            }
            if (!editor || !editor.hasModel()) {
                return false;
            }
            let controllerId = context && 'id' in context ? context.id : undefined;
            let extensionId = context && 'extension' in context ? context.extension : undefined;
            if (controllerId && (typeof controllerId !== 'string' || typeof extensionId !== 'string')) {
                // validate context: id & extension MUST be strings
                controllerId = undefined;
                extensionId = undefined;
            }
            const notebook = editor.textModel;
            const { selected, all, suggestions } = notebookKernelService.getMatchingKernel(notebook);
            if (selected && controllerId && selected.id === controllerId && extensions_1.ExtensionIdentifier.equals(selected.extension, extensionId)) {
                // current kernel is wanted kernel -> done
                return true;
            }
            let newKernel;
            if (controllerId) {
                const wantedId = `${extensionId}/${controllerId}`;
                for (const candidate of all) {
                    if (candidate.id === wantedId) {
                        newKernel = candidate;
                        break;
                    }
                }
                if (!newKernel) {
                    logService.warn(`wanted kernel DOES NOT EXIST, wanted: ${wantedId}, all: ${all.map(k => k.id)}`);
                    return false;
                }
            }
            if (!newKernel) {
                const configButton = {
                    iconClass: themeService_1.ThemeIcon.asClassName(notebookIcons_1.configureKernelIcon),
                    tooltip: nls.localize('notebook.promptKernel.setDefaultTooltip', "Set as default for '{0}' notebooks", editor.textModel.viewType)
                };
                function toQuickPick(kernel) {
                    const res = {
                        kernel,
                        picked: kernel.id === (selected === null || selected === void 0 ? void 0 : selected.id),
                        label: kernel.label,
                        description: kernel.description,
                        detail: kernel.detail,
                        buttons: [configButton]
                    };
                    if (kernel.id === (selected === null || selected === void 0 ? void 0 : selected.id)) {
                        if (!res.description) {
                            res.description = nls.localize('current1', "Currently Selected");
                        }
                        else {
                            res.description = nls.localize('current2', "{0} - Currently Selected", res.description);
                        }
                    }
                    return res;
                }
                const quickPickItems = [];
                if (all.length) {
                    // Always display suggested kernels on the top.
                    if (suggestions.length) {
                        quickPickItems.push({
                            type: 'separator',
                            label: nls.localize('suggestedKernels', "Suggested")
                        });
                        quickPickItems.push(...suggestions.map(toQuickPick));
                    }
                    // Next display all of the kernels grouped by categories or extensions.
                    // If we don't have a kind, always display those at the bottom.
                    const picks = all.filter(item => !suggestions.includes(item)).map(toQuickPick);
                    const kernelsPerCategory = (0, arrays_1.groupBy)(picks, (a, b) => (0, strings_1.compareIgnoreCase)(a.kernel.kind || 'z', b.kernel.kind || 'z'));
                    kernelsPerCategory.forEach(items => {
                        quickPickItems.push({
                            type: 'separator',
                            label: items[0].kernel.kind || nls.localize('otherKernelKinds', "Other")
                        });
                        quickPickItems.push(...items);
                    });
                }
                if (!all.find(item => item.type === 0 /* NotebookKernelType.Resolved */)) {
                    // there is no resolved kernel, show the install from marketplace
                    quickPickItems.push({
                        id: 'install',
                        label: nls.localize('installKernels', "Install kernels from the marketplace"),
                    });
                }
                const pick = await quickInputService.pick(quickPickItems, {
                    placeHolder: selected
                        ? nls.localize('prompt.placeholder.change', "Change kernel for '{0}'", labelService.getUriLabel(notebook.uri, { relative: true }))
                        : nls.localize('prompt.placeholder.select', "Select kernel for '{0}'", labelService.getUriLabel(notebook.uri, { relative: true })),
                    onDidTriggerItemButton: (context) => {
                        if ('kernel' in context.item) {
                            notebookKernelService.selectKernelForNotebookType(context.item.kernel, notebook.viewType);
                        }
                    }
                });
                if (pick) {
                    if (pick.id === 'install') {
                        await this._showKernelExtension(paneCompositeService, notebook.viewType);
                    }
                    else if ('kernel' in pick) {
                        newKernel = pick.kernel;
                    }
                }
            }
            if (newKernel) {
                notebookKernelService.selectKernelForNotebook(newKernel, notebook);
                return true;
            }
            return false;
        }
        async _showKernelExtension(paneCompositePartService, viewType) {
            const viewlet = await paneCompositePartService.openPaneComposite(extensions_2.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            const view = viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer();
            const extId = notebookBrowser_1.KERNEL_EXTENSIONS.get(viewType);
            if (extId) {
                view === null || view === void 0 ? void 0 : view.search(`@id:${extId}`);
            }
            else {
                const pascalCased = viewType.split(/[^a-z0-9]/ig).map(strings_1.uppercaseFirstLetter).join('');
                view === null || view === void 0 ? void 0 : view.search(`@tag:notebookKernel${pascalCased}`);
            }
        }
    });
    let ImplictKernelSelector = class ImplictKernelSelector {
        constructor(notebook, suggested, notebookKernelService, languageFeaturesService, logService) {
            const disposables = new lifecycle_1.DisposableStore();
            this.dispose = disposables.dispose.bind(disposables);
            const selectKernel = () => {
                disposables.clear();
                notebookKernelService.selectKernelForNotebook(suggested, notebook);
            };
            // IMPLICITLY select a suggested kernel when the notebook has been changed
            // e.g change cell source, move cells, etc
            disposables.add(notebook.onDidChangeContent(e => {
                for (const event of e.rawEvents) {
                    switch (event.kind) {
                        case notebookCommon_1.NotebookCellsChangeType.ChangeCellContent:
                        case notebookCommon_1.NotebookCellsChangeType.ModelChange:
                        case notebookCommon_1.NotebookCellsChangeType.Move:
                        case notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage:
                            logService.trace('IMPLICIT kernel selection because of change event', event.kind);
                            selectKernel();
                            break;
                    }
                }
            }));
            // IMPLICITLY select a suggested kernel when users start to hover. This should
            // be a strong enough hint that the user wants to interact with the notebook. Maybe
            // add more triggers like goto-providers or completion-providers
            disposables.add(languageFeaturesService.hoverProvider.register({ scheme: network_1.Schemas.vscodeNotebookCell, pattern: notebook.uri.path }, {
                provideHover() {
                    logService.trace('IMPLICIT kernel selection because of hover');
                    selectKernel();
                    return undefined;
                }
            }));
        }
    };
    ImplictKernelSelector = __decorate([
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, log_1.ILogService)
    ], ImplictKernelSelector);
    let KernelStatus = class KernelStatus extends lifecycle_1.Disposable {
        constructor(_editorService, _statusbarService, _notebookKernelService, _instantiationService) {
            super();
            this._editorService = _editorService;
            this._statusbarService = _statusbarService;
            this._notebookKernelService = _notebookKernelService;
            this._instantiationService = _instantiationService;
            this._editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this._kernelInfoElement = this._register(new lifecycle_1.DisposableStore());
            this._register(this._editorService.onDidActiveEditorChange(() => this._updateStatusbar()));
        }
        _updateStatusbar() {
            this._editorDisposables.clear();
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (!activeEditor) {
                // not a notebook -> clean-up, done
                this._kernelInfoElement.clear();
                return;
            }
            const updateStatus = () => {
                if (activeEditor.notebookOptions.getLayoutConfiguration().globalToolbar) {
                    // kernel info rendered in the notebook toolbar already
                    this._kernelInfoElement.clear();
                    return;
                }
                const notebook = activeEditor.textModel;
                if (notebook) {
                    this._showKernelStatus(notebook);
                }
                else {
                    this._kernelInfoElement.clear();
                }
            };
            this._editorDisposables.add(this._notebookKernelService.onDidAddKernel(updateStatus));
            this._editorDisposables.add(this._notebookKernelService.onDidChangeSelectedNotebooks(updateStatus));
            this._editorDisposables.add(this._notebookKernelService.onDidChangeNotebookAffinity(updateStatus));
            this._editorDisposables.add(activeEditor.onDidChangeModel(updateStatus));
            this._editorDisposables.add(activeEditor.notebookOptions.onDidChangeOptions(updateStatus));
            updateStatus();
        }
        _showKernelStatus(notebook) {
            var _a, _b;
            this._kernelInfoElement.clear();
            const { selected, suggestions, all } = this._notebookKernelService.getMatchingKernel(notebook);
            const suggested = (suggestions.length === 1 && all.length === 1) ? suggestions[0] : undefined;
            let isSuggested = false;
            if (all.length === 0) {
                // no kernel -> no status
                return;
            }
            else if (selected || suggested) {
                // selected or single kernel
                let kernel = selected;
                if (!kernel) {
                    // proceed with suggested kernel - show UI and install handler that selects the kernel
                    // when non trivial interactions with the notebook happen.
                    kernel = suggested;
                    isSuggested = true;
                    this._kernelInfoElement.add(this._instantiationService.createInstance(ImplictKernelSelector, notebook, kernel));
                }
                const tooltip = (_b = (_a = kernel.description) !== null && _a !== void 0 ? _a : kernel.detail) !== null && _b !== void 0 ? _b : kernel.label;
                this._kernelInfoElement.add(this._statusbarService.addEntry({
                    name: nls.localize('notebook.info', "Notebook Kernel Info"),
                    text: `$(notebook-kernel-select) ${kernel.label}`,
                    ariaLabel: kernel.label,
                    tooltip: isSuggested ? nls.localize('tooltop', "{0} (suggestion)", tooltip) : tooltip,
                    command: coreActions_1.SELECT_KERNEL_ID,
                }, coreActions_1.SELECT_KERNEL_ID, 1 /* StatusbarAlignment.RIGHT */, 10));
                this._kernelInfoElement.add(kernel.onDidChange(() => this._showKernelStatus(notebook)));
            }
            else {
                // multiple kernels -> show selection hint
                this._kernelInfoElement.add(this._statusbarService.addEntry({
                    name: nls.localize('notebook.select', "Notebook Kernel Selection"),
                    text: nls.localize('kernel.select.label', "Select Kernel"),
                    ariaLabel: nls.localize('kernel.select.label', "Select Kernel"),
                    command: coreActions_1.SELECT_KERNEL_ID,
                    backgroundColor: { id: 'statusBarItem.prominentBackground' }
                }, coreActions_1.SELECT_KERNEL_ID, 1 /* StatusbarAlignment.RIGHT */, 10));
            }
        }
    };
    KernelStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, notebookKernelService_1.INotebookKernelService),
        __param(3, instantiation_1.IInstantiationService)
    ], KernelStatus);
    exports.KernelStatus = KernelStatus;
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(KernelStatus, 3 /* LifecyclePhase.Restored */);
    let ActiveCellStatus = class ActiveCellStatus extends lifecycle_1.Disposable {
        constructor(_editorService, _statusbarService) {
            super();
            this._editorService = _editorService;
            this._statusbarService = _statusbarService;
            this._itemDisposables = this._register(new lifecycle_1.DisposableStore());
            this._accessor = this._register(new lifecycle_1.MutableDisposable());
            this._register(this._editorService.onDidActiveEditorChange(() => this._update()));
        }
        _update() {
            this._itemDisposables.clear();
            const activeEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            if (activeEditor) {
                this._itemDisposables.add(activeEditor.onDidChangeSelection(() => this._show(activeEditor)));
                this._itemDisposables.add(activeEditor.onDidChangeActiveCell(() => this._show(activeEditor)));
                this._show(activeEditor);
            }
            else {
                this._accessor.clear();
            }
        }
        _show(editor) {
            if (!editor.hasModel()) {
                this._accessor.clear();
                return;
            }
            const newText = this._getSelectionsText(editor);
            if (!newText) {
                this._accessor.clear();
                return;
            }
            const entry = {
                name: nls.localize('notebook.activeCellStatusName', "Notebook Editor Selections"),
                text: newText,
                ariaLabel: newText,
                command: arrow_1.CENTER_ACTIVE_CELL
            };
            if (!this._accessor.value) {
                this._accessor.value = this._statusbarService.addEntry(entry, 'notebook.activeCellStatus', 1 /* StatusbarAlignment.RIGHT */, 100);
            }
            else {
                this._accessor.value.update(entry);
            }
        }
        _getSelectionsText(editor) {
            if (!editor.hasModel()) {
                return undefined;
            }
            const activeCell = editor.getActiveCell();
            if (!activeCell) {
                return undefined;
            }
            const idxFocused = editor.getCellIndex(activeCell) + 1;
            const numSelected = editor.getSelections().reduce((prev, range) => prev + (range.end - range.start), 0);
            const totalCells = editor.getLength();
            return numSelected > 1 ?
                nls.localize('notebook.multiActiveCellIndicator', "Cell {0} ({1} selected)", idxFocused, numSelected) :
                nls.localize('notebook.singleActiveCellIndicator', "Cell {0} of {1}", idxFocused, totalCells);
        }
    };
    ActiveCellStatus = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, statusbar_1.IStatusbarService)
    ], ActiveCellStatus);
    exports.ActiveCellStatus = ActiveCellStatus;
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ActiveCellStatus, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=editorStatusBar.js.map