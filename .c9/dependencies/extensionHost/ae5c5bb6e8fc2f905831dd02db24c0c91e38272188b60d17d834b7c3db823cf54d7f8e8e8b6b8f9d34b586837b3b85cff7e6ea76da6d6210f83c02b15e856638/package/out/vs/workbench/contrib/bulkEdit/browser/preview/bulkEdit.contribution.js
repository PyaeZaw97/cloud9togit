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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/bulkEdit/browser/preview/bulkEditPane", "vs/workbench/common/views", "vs/workbench/common/contextkeys", "vs/nls", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/bulkEdit/browser/preview/bulkEditPreview", "vs/platform/list/browser/listService", "vs/platform/instantiation/common/descriptors", "vs/platform/actions/common/actions", "vs/workbench/common/editor", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, platform_1, contributions_1, bulkEditService_1, bulkEditPane_1, views_1, contextkeys_1, nls_1, viewPaneContainer_1, contextkey_1, editorGroupsService_1, bulkEditPreview_1, listService_1, descriptors_1, actions_1, editor_1, cancellation_1, dialogs_1, severity_1, codicons_1, iconRegistry_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function getBulkEditPane(viewsService) {
        const view = await viewsService.openView(bulkEditPane_1.BulkEditPane.ID, true);
        if (view instanceof bulkEditPane_1.BulkEditPane) {
            return view;
        }
        return undefined;
    }
    let UXState = class UXState {
        constructor(_paneCompositeService, _editorGroupsService) {
            var _a;
            this._paneCompositeService = _paneCompositeService;
            this._editorGroupsService = _editorGroupsService;
            this._activePanel = (_a = _paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */)) === null || _a === void 0 ? void 0 : _a.getId();
        }
        async restore(panels, editors) {
            // (1) restore previous panel
            if (panels) {
                if (typeof this._activePanel === 'string') {
                    await this._paneCompositeService.openPaneComposite(this._activePanel, 1 /* ViewContainerLocation.Panel */);
                }
                else {
                    this._paneCompositeService.hideActivePaneComposite(1 /* ViewContainerLocation.Panel */);
                }
            }
            // (2) close preview editors
            if (editors) {
                for (let group of this._editorGroupsService.groups) {
                    let previewEditors = [];
                    for (let input of group.editors) {
                        let resource = editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                        if ((resource === null || resource === void 0 ? void 0 : resource.scheme) === bulkEditPreview_1.BulkEditPreviewProvider.Schema) {
                            previewEditors.push(input);
                        }
                    }
                    if (previewEditors.length) {
                        group.closeEditors(previewEditors, { preserveFocus: true });
                    }
                }
            }
        }
    };
    UXState = __decorate([
        __param(0, panecomposite_1.IPaneCompositePartService),
        __param(1, editorGroupsService_1.IEditorGroupsService)
    ], UXState);
    class PreviewSession {
        constructor(uxState, cts = new cancellation_1.CancellationTokenSource()) {
            this.uxState = uxState;
            this.cts = cts;
        }
    }
    let BulkEditPreviewContribution = class BulkEditPreviewContribution {
        constructor(_paneCompositeService, _viewsService, _editorGroupsService, _dialogService, bulkEditService, contextKeyService) {
            this._paneCompositeService = _paneCompositeService;
            this._viewsService = _viewsService;
            this._editorGroupsService = _editorGroupsService;
            this._dialogService = _dialogService;
            bulkEditService.setPreviewHandler(edits => this._previewEdit(edits));
            this._ctxEnabled = BulkEditPreviewContribution.ctxEnabled.bindTo(contextKeyService);
        }
        async _previewEdit(edits) {
            var _a, _b, _c;
            this._ctxEnabled.set(true);
            const uxState = (_b = (_a = this._activeSession) === null || _a === void 0 ? void 0 : _a.uxState) !== null && _b !== void 0 ? _b : new UXState(this._paneCompositeService, this._editorGroupsService);
            const view = await getBulkEditPane(this._viewsService);
            if (!view) {
                this._ctxEnabled.set(false);
                return edits;
            }
            // check for active preview session and let the user decide
            if (view.hasInput()) {
                const choice = await this._dialogService.show(severity_1.default.Info, (0, nls_1.localize)('overlap', "Another refactoring is being previewed."), [(0, nls_1.localize)('cancel', "Cancel"), (0, nls_1.localize)('continue', "Continue")], { detail: (0, nls_1.localize)('detail', "Press 'Continue' to discard the previous refactoring and continue with the current refactoring.") });
                if (choice.choice === 0) {
                    // this refactoring is being cancelled
                    return [];
                }
            }
            // session
            let session;
            if (this._activeSession) {
                await this._activeSession.uxState.restore(false, true);
                this._activeSession.cts.dispose(true);
                session = new PreviewSession(uxState);
            }
            else {
                session = new PreviewSession(uxState);
            }
            this._activeSession = session;
            // the actual work...
            try {
                return (_c = await view.setInput(edits, session.cts.token)) !== null && _c !== void 0 ? _c : [];
            }
            finally {
                // restore UX state
                if (this._activeSession === session) {
                    await this._activeSession.uxState.restore(true, true);
                    this._activeSession.cts.dispose();
                    this._ctxEnabled.set(false);
                    this._activeSession = undefined;
                }
            }
        }
    };
    BulkEditPreviewContribution.ctxEnabled = new contextkey_1.RawContextKey('refactorPreview.enabled', false);
    BulkEditPreviewContribution = __decorate([
        __param(0, panecomposite_1.IPaneCompositePartService),
        __param(1, views_1.IViewsService),
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, dialogs_1.IDialogService),
        __param(4, bulkEditService_1.IBulkEditService),
        __param(5, contextkey_1.IContextKeyService)
    ], BulkEditPreviewContribution);
    // CMD: accept
    (0, actions_1.registerAction2)(class ApplyAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.apply',
                title: { value: (0, nls_1.localize)('apply', "Apply Refactoring"), original: 'Apply Refactoring' },
                category: { value: (0, nls_1.localize)('cat', "Refactor Preview"), original: 'Refactor Preview' },
                icon: codicons_1.Codicon.check,
                precondition: contextkey_1.ContextKeyExpr.and(BulkEditPreviewContribution.ctxEnabled, bulkEditPane_1.BulkEditPane.ctxHasCheckedChanges),
                menu: [{
                        id: actions_1.MenuId.BulkEditContext,
                        order: 1
                    }],
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 10,
                    when: contextkey_1.ContextKeyExpr.and(BulkEditPreviewContribution.ctxEnabled, contextkeys_1.FocusedViewContext.isEqualTo(bulkEditPane_1.BulkEditPane.ID)),
                    primary: 1024 /* KeyMod.Shift */ + 3 /* KeyCode.Enter */,
                }
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.accept();
            }
        }
    });
    // CMD: discard
    (0, actions_1.registerAction2)(class DiscardAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.discard',
                title: { value: (0, nls_1.localize)('Discard', "Discard Refactoring"), original: 'Discard Refactoring' },
                category: { value: (0, nls_1.localize)('cat', "Refactor Preview"), original: 'Refactor Preview' },
                icon: codicons_1.Codicon.clearAll,
                precondition: BulkEditPreviewContribution.ctxEnabled,
                menu: [{
                        id: actions_1.MenuId.BulkEditContext,
                        order: 2
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.discard();
            }
        }
    });
    // CMD: toggle change
    (0, actions_1.registerAction2)(class ToggleAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.toggleCheckedState',
                title: { value: (0, nls_1.localize)('toogleSelection', "Toggle Change"), original: 'Toggle Change' },
                category: { value: (0, nls_1.localize)('cat', "Refactor Preview"), original: 'Refactor Preview' },
                precondition: BulkEditPreviewContribution.ctxEnabled,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: listService_1.WorkbenchListFocusContextKey,
                    primary: 10 /* KeyCode.Space */,
                },
                menu: {
                    id: actions_1.MenuId.BulkEditContext,
                    group: 'navigation'
                }
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.toggleChecked();
            }
        }
    });
    // CMD: toggle category
    (0, actions_1.registerAction2)(class GroupByFile extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.groupByFile',
                title: { value: (0, nls_1.localize)('groupByFile', "Group Changes By File"), original: 'Group Changes By File' },
                category: { value: (0, nls_1.localize)('cat', "Refactor Preview"), original: 'Refactor Preview' },
                icon: codicons_1.Codicon.ungroupByRefType,
                precondition: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, bulkEditPane_1.BulkEditPane.ctxGroupByFile.negate(), BulkEditPreviewContribution.ctxEnabled),
                menu: [{
                        id: actions_1.MenuId.BulkEditTitle,
                        when: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, bulkEditPane_1.BulkEditPane.ctxGroupByFile.negate()),
                        group: 'navigation',
                        order: 3,
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.groupByFile();
            }
        }
    });
    (0, actions_1.registerAction2)(class GroupByType extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.groupByType',
                title: { value: (0, nls_1.localize)('groupByType', "Group Changes By Type"), original: 'Group Changes By Type' },
                category: { value: (0, nls_1.localize)('cat', "Refactor Preview"), original: 'Refactor Preview' },
                icon: codicons_1.Codicon.groupByRefType,
                precondition: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, bulkEditPane_1.BulkEditPane.ctxGroupByFile, BulkEditPreviewContribution.ctxEnabled),
                menu: [{
                        id: actions_1.MenuId.BulkEditTitle,
                        when: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, bulkEditPane_1.BulkEditPane.ctxGroupByFile),
                        group: 'navigation',
                        order: 3
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.groupByType();
            }
        }
    });
    (0, actions_1.registerAction2)(class ToggleGrouping extends actions_1.Action2 {
        constructor() {
            super({
                id: 'refactorPreview.toggleGrouping',
                title: { value: (0, nls_1.localize)('groupByType', "Group Changes By Type"), original: 'Group Changes By Type' },
                category: { value: (0, nls_1.localize)('cat', "Refactor Preview"), original: 'Refactor Preview' },
                icon: codicons_1.Codicon.listTree,
                toggled: bulkEditPane_1.BulkEditPane.ctxGroupByFile.negate(),
                precondition: contextkey_1.ContextKeyExpr.and(bulkEditPane_1.BulkEditPane.ctxHasCategories, BulkEditPreviewContribution.ctxEnabled),
                menu: [{
                        id: actions_1.MenuId.BulkEditContext,
                        order: 3
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const view = await getBulkEditPane(viewsService);
            if (view) {
                view.toggleGrouping();
            }
        }
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(BulkEditPreviewContribution, 2 /* LifecyclePhase.Ready */);
    const refactorPreviewViewIcon = (0, iconRegistry_1.registerIcon)('refactor-preview-view-icon', codicons_1.Codicon.lightbulb, (0, nls_1.localize)('refactorPreviewViewIcon', 'View icon of the refactor preview view.'));
    const container = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: bulkEditPane_1.BulkEditPane.ID,
        title: (0, nls_1.localize)('panel', "Refactor Preview"),
        hideIfEmpty: true,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [bulkEditPane_1.BulkEditPane.ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        icon: refactorPreviewViewIcon,
        storageId: bulkEditPane_1.BulkEditPane.ID
    }, 1 /* ViewContainerLocation.Panel */);
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: bulkEditPane_1.BulkEditPane.ID,
            name: (0, nls_1.localize)('panel', "Refactor Preview"),
            when: BulkEditPreviewContribution.ctxEnabled,
            ctorDescriptor: new descriptors_1.SyncDescriptor(bulkEditPane_1.BulkEditPane),
            containerIcon: refactorPreviewViewIcon,
        }], container);
});
//# sourceMappingURL=bulkEdit.contribution.js.map