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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/contrib/quickAccess/browser/gotoSymbolQuickAccess", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/actions/common/actions", "vs/base/common/fuzzyScorer", "vs/base/common/filters", "vs/base/common/errors", "vs/workbench/services/outline/browser/outline", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/editor/common/services/languageFeatures"], function (require, exports, nls_1, quickInput_1, editorService_1, platform_1, quickAccess_1, gotoSymbolQuickAccess_1, configuration_1, lifecycle_1, async_1, cancellation_1, actions_1, fuzzyScorer_1, filters_1, errors_1, outline_1, editorBrowser_1, editorGroupsService_1, outlineModel_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GotoSymbolQuickAccessProvider = void 0;
    let GotoSymbolQuickAccessProvider = class GotoSymbolQuickAccessProvider extends gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider {
        constructor(editorService, editorGroupService, configurationService, languageFeaturesService, outlineService, outlineModelService) {
            super(languageFeaturesService, outlineModelService, {
                openSideBySideDirection: () => this.configuration.openSideBySideDirection
            });
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.outlineService = outlineService;
            this.onDidActiveTextEditorControlChange = this.editorService.onDidActiveEditorChange;
        }
        //#region DocumentSymbols (text editor required)
        get configuration() {
            var _a;
            const editorConfig = (_a = this.configurationService.getValue().workbench) === null || _a === void 0 ? void 0 : _a.editor;
            return {
                openEditorPinned: !(editorConfig === null || editorConfig === void 0 ? void 0 : editorConfig.enablePreviewFromQuickOpen) || !(editorConfig === null || editorConfig === void 0 ? void 0 : editorConfig.enablePreview),
                openSideBySideDirection: editorConfig === null || editorConfig === void 0 ? void 0 : editorConfig.openSideBySideDirection
            };
        }
        get activeTextEditorControl() {
            var _a;
            // TODO: this distinction should go away by adopting `IOutlineService`
            // for all editors (either text based ones or not). Currently text based
            // editors are not yet using the new outline service infrastructure but the
            // "classical" document symbols approach.
            if ((0, editorBrowser_1.isCompositeEditor)((_a = this.editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl())) {
                return undefined;
            }
            return this.editorService.activeTextEditorControl;
        }
        gotoLocation(context, options) {
            var _a;
            // Check for sideBySide use
            if ((options.keyMods.alt || (this.configuration.openEditorPinned && options.keyMods.ctrlCmd) || options.forceSideBySide) && this.editorService.activeEditor) {
                (_a = context.restoreViewState) === null || _a === void 0 ? void 0 : _a.call(context); // since we open to the side, restore view state in this editor
                const editorOptions = {
                    selection: options.range,
                    pinned: options.keyMods.ctrlCmd || this.configuration.openEditorPinned,
                    preserveFocus: options.preserveFocus
                };
                this.editorGroupService.sideGroup.openEditor(this.editorService.activeEditor, editorOptions);
            }
            // Otherwise let parent handle it
            else {
                super.gotoLocation(context, options);
            }
        }
        async getSymbolPicks(model, filter, options, disposables, token) {
            // If the registry does not know the model, we wait for as long as
            // the registry knows it. This helps in cases where a language
            // registry was not activated yet for providing any symbols.
            // To not wait forever, we eventually timeout though.
            const result = await Promise.race([
                this.waitForLanguageSymbolRegistry(model, disposables),
                (0, async_1.timeout)(GotoSymbolQuickAccessProvider.SYMBOL_PICKS_TIMEOUT)
            ]);
            if (!result || token.isCancellationRequested) {
                return [];
            }
            return this.doGetSymbolPicks(this.getDocumentSymbols(model, token), (0, fuzzyScorer_1.prepareQuery)(filter), options, token);
        }
        addDecorations(editor, range) {
            super.addDecorations(editor, range);
        }
        clearDecorations(editor) {
            super.clearDecorations(editor);
        }
        //#endregion
        provideWithoutTextEditor(picker) {
            if (this.canPickWithOutlineService()) {
                return this.doGetOutlinePicks(picker);
            }
            return super.provideWithoutTextEditor(picker);
        }
        canPickWithOutlineService() {
            return this.editorService.activeEditorPane ? this.outlineService.canCreateOutline(this.editorService.activeEditorPane) : false;
        }
        doGetOutlinePicks(picker) {
            const pane = this.editorService.activeEditorPane;
            if (!pane) {
                return lifecycle_1.Disposable.None;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            picker.busy = true;
            this.outlineService.createOutline(pane, 4 /* OutlineTarget.QuickPick */, cts.token).then(outline => {
                if (!outline) {
                    return;
                }
                if (cts.token.isCancellationRequested) {
                    outline.dispose();
                    return;
                }
                disposables.add(outline);
                const viewState = outline.captureViewState();
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    if (picker.selectedItems.length === 0) {
                        viewState.dispose();
                    }
                }));
                const entries = outline.config.quickPickDataSource.getQuickPickElements();
                const items = entries.map((entry, idx) => {
                    return {
                        kind: 0 /* SymbolKind.File */,
                        index: idx,
                        score: 0,
                        label: entry.label,
                        description: entry.description,
                        ariaLabel: entry.ariaLabel,
                        iconClasses: entry.iconClasses
                    };
                });
                disposables.add(picker.onDidAccept(() => {
                    picker.hide();
                    const [entry] = picker.selectedItems;
                    if (entry && entries[entry.index]) {
                        outline.reveal(entries[entry.index].element, {}, false);
                    }
                }));
                const updatePickerItems = () => {
                    const filteredItems = items.filter(item => {
                        if (picker.value === '@') {
                            // default, no filtering, scoring...
                            item.score = 0;
                            item.highlights = undefined;
                            return true;
                        }
                        const score = (0, filters_1.fuzzyScore)(picker.value, picker.value.toLowerCase(), 1 /*@-character*/, item.label, item.label.toLowerCase(), 0, { firstMatchCanBeWeak: true, boostFullMatch: true });
                        if (!score) {
                            return false;
                        }
                        item.score = score[1];
                        item.highlights = { label: (0, filters_1.createMatches)(score) };
                        return true;
                    });
                    if (filteredItems.length === 0) {
                        const label = (0, nls_1.localize)('empty', 'No matching entries');
                        picker.items = [{ label, index: -1, kind: 14 /* SymbolKind.String */ }];
                        picker.ariaLabel = label;
                    }
                    else {
                        picker.items = filteredItems;
                    }
                };
                updatePickerItems();
                disposables.add(picker.onDidChangeValue(updatePickerItems));
                const previewDisposable = new lifecycle_1.MutableDisposable();
                disposables.add(previewDisposable);
                disposables.add(picker.onDidChangeActive(() => {
                    const [entry] = picker.activeItems;
                    if (entry && entries[entry.index]) {
                        previewDisposable.value = outline.preview(entries[entry.index].element);
                    }
                    else {
                        previewDisposable.clear();
                    }
                }));
            }).catch(err => {
                (0, errors_1.onUnexpectedError)(err);
                picker.hide();
            }).finally(() => {
                picker.busy = false;
            });
            return disposables;
        }
    };
    //#endregion
    //#region public methods to use this picker from other pickers
    GotoSymbolQuickAccessProvider.SYMBOL_PICKS_TIMEOUT = 8000;
    GotoSymbolQuickAccessProvider = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, outline_1.IOutlineService),
        __param(5, outlineModel_1.IOutlineModelService)
    ], GotoSymbolQuickAccessProvider);
    exports.GotoSymbolQuickAccessProvider = GotoSymbolQuickAccessProvider;
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: GotoSymbolQuickAccessProvider,
        prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX,
        contextKey: 'inFileSymbolsPicker',
        placeholder: (0, nls_1.localize)('gotoSymbolQuickAccessPlaceholder', "Type the name of a symbol to go to."),
        helpEntries: [
            { description: (0, nls_1.localize)('gotoSymbolQuickAccess', "Go to Symbol in Editor"), prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX, needsEditor: true },
            { description: (0, nls_1.localize)('gotoSymbolByCategoryQuickAccess', "Go to Symbol in Editor by Category"), prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX_BY_CATEGORY, needsEditor: true }
        ]
    });
    (0, actions_1.registerAction2)(class GotoSymbolAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.gotoSymbol',
                title: {
                    value: (0, nls_1.localize)('gotoSymbol', "Go to Symbol in Editor..."),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miGotoSymbolInEditor', comment: ['&& denotes a mnemonic'] }, "Go to &&Symbol in Editor..."),
                    original: 'Go to Symbol in Editor...'
                },
                f1: true,
                keybinding: {
                    when: undefined,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 45 /* KeyCode.KeyO */
                },
                menu: {
                    id: actions_1.MenuId.MenubarGoMenu,
                    group: '4_symbol_nav',
                    order: 1
                }
            });
        }
        run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(GotoSymbolQuickAccessProvider.PREFIX);
        }
    });
});
//# sourceMappingURL=gotoSymbolQuickAccess.js.map