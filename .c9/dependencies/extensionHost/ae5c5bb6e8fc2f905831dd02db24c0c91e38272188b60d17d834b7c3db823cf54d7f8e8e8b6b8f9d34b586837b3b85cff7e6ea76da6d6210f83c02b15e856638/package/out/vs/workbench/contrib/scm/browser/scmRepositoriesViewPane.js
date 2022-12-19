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
define(["require", "exports", "vs/nls", "vs/workbench/browser/parts/views/viewPane", "vs/base/browser/dom", "vs/workbench/contrib/scm/common/scm", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/workbench/common/views", "vs/workbench/common/theme", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/scm/browser/scmRepositoryRenderer", "vs/workbench/contrib/scm/browser/util", "vs/base/common/iterator", "vs/css!./media/scm"], function (require, exports, nls_1, viewPane_1, dom_1, scm_1, instantiation_1, contextView_1, contextkey_1, keybinding_1, themeService_1, listService_1, configuration_1, views_1, theme_1, opener_1, telemetry_1, scmRepositoryRenderer_1, util_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMRepositoriesViewPane = void 0;
    class ListDelegate {
        getHeight() {
            return 22;
        }
        getTemplateId() {
            return scmRepositoryRenderer_1.RepositoryRenderer.TEMPLATE_ID;
        }
    }
    let SCMRepositoriesViewPane = class SCMRepositoriesViewPane extends viewPane_1.ViewPane {
        constructor(options, scmViewService, keybindingService, contextMenuService, instantiationService, viewDescriptorService, contextKeyService, configurationService, openerService, themeService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.scmViewService = scmViewService;
        }
        renderBody(container) {
            super.renderBody(container);
            const listContainer = (0, dom_1.append)(container, (0, dom_1.$)('.scm-view.scm-repositories-view'));
            const delegate = new ListDelegate();
            const renderer = this.instantiationService.createInstance(scmRepositoryRenderer_1.RepositoryRenderer, (0, util_1.getActionViewItemProvider)(this.instantiationService));
            const identityProvider = { getId: (r) => r.provider.id };
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, `SCM Main`, listContainer, delegate, [renderer], {
                identityProvider,
                horizontalScrolling: false,
                overrideStyles: {
                    listBackground: theme_1.SIDE_BAR_BACKGROUND
                },
                accessibilityProvider: {
                    getAriaLabel(r) {
                        return r.provider.label;
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('scm', "Source Control Repositories");
                    }
                }
            });
            this._register(this.list);
            this._register(this.list.onDidChangeSelection(this.onListSelectionChange, this));
            this._register(this.list.onContextMenu(this.onListContextMenu, this));
            this._register(this.scmViewService.onDidChangeRepositories(this.onDidChangeRepositories, this));
            this._register(this.scmViewService.onDidChangeVisibleRepositories(this.updateListSelection, this));
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                this._register(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('scm.repositories.visible')) {
                        this.updateBodySize();
                    }
                }));
            }
            this.onDidChangeRepositories();
            this.updateListSelection();
        }
        onDidChangeRepositories() {
            this.list.splice(0, this.list.length, this.scmViewService.repositories);
            this.updateBodySize();
        }
        focus() {
            this.list.domFocus();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.list.layout(height, width);
        }
        updateBodySize() {
            if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                return;
            }
            const visibleCount = this.configurationService.getValue('scm.repositories.visible');
            const empty = this.list.length === 0;
            const size = Math.min(this.list.length, visibleCount) * 22;
            this.minimumBodySize = visibleCount === 0 ? 22 : size;
            this.maximumBodySize = visibleCount === 0 ? Number.POSITIVE_INFINITY : empty ? Number.POSITIVE_INFINITY : size;
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const provider = e.element.provider;
            const menus = this.scmViewService.menus.getRepositoryMenus(provider);
            const menu = menus.repositoryMenu;
            const [actions, disposable] = (0, util_1.collectContextMenuActions)(menu);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => provider,
                onHide() {
                    disposable.dispose();
                }
            });
        }
        onListSelectionChange(e) {
            if (e.browserEvent && e.elements.length > 0) {
                const scrollTop = this.list.scrollTop;
                this.scmViewService.visibleRepositories = e.elements;
                this.list.scrollTop = scrollTop;
            }
        }
        updateListSelection() {
            const oldSelection = this.list.getSelection();
            const oldSet = new Set(iterator_1.Iterable.map(oldSelection, i => this.list.element(i)));
            const set = new Set(this.scmViewService.visibleRepositories);
            const added = new Set(iterator_1.Iterable.filter(set, r => !oldSet.has(r)));
            const removed = new Set(iterator_1.Iterable.filter(oldSet, r => !set.has(r)));
            if (added.size === 0 && removed.size === 0) {
                return;
            }
            const selection = oldSelection
                .filter(i => !removed.has(this.list.element(i)));
            for (let i = 0; i < this.list.length; i++) {
                if (added.has(this.list.element(i))) {
                    selection.push(i);
                }
            }
            this.list.setSelection(selection);
            if (selection.length > 0 && selection.indexOf(this.list.getFocus()[0]) === -1) {
                this.list.setAnchor(selection[0]);
                this.list.setFocus([selection[0]]);
            }
        }
    };
    SCMRepositoriesViewPane = __decorate([
        __param(1, scm_1.ISCMViewService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService)
    ], SCMRepositoriesViewPane);
    exports.SCMRepositoriesViewPane = SCMRepositoriesViewPane;
});
//# sourceMappingURL=scmRepositoriesViewPane.js.map