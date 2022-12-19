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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/contrib/scm/common/scm", "vs/base/browser/ui/countBadge/countBadge", "vs/platform/contextview/browser/contextView", "vs/platform/commands/common/commands", "vs/platform/theme/common/themeService", "./util", "vs/platform/theme/common/styler", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/workspace/common/workspace", "vs/base/common/resources", "vs/css!./media/scm"], function (require, exports, lifecycle_1, dom_1, scm_1, countBadge_1, contextView_1, commands_1, themeService_1, util_1, styler_1, toolbar_1, workspace_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RepositoryRenderer = void 0;
    let RepositoryRenderer = class RepositoryRenderer {
        constructor(actionViewItemProvider, scmViewService, commandService, contextMenuService, themeService, workspaceContextService) {
            this.actionViewItemProvider = actionViewItemProvider;
            this.scmViewService = scmViewService;
            this.commandService = commandService;
            this.contextMenuService = contextMenuService;
            this.themeService = themeService;
            this.workspaceContextService = workspaceContextService;
        }
        get templateId() { return RepositoryRenderer.TEMPLATE_ID; }
        renderTemplate(container) {
            // hack
            if (container.classList.contains('monaco-tl-contents')) {
                container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            }
            const provider = (0, dom_1.append)(container, (0, dom_1.$)('.scm-provider'));
            const label = (0, dom_1.append)(provider, (0, dom_1.$)('.label'));
            const name = (0, dom_1.append)(label, (0, dom_1.$)('span.name'));
            const description = (0, dom_1.append)(label, (0, dom_1.$)('span.description'));
            const actions = (0, dom_1.append)(provider, (0, dom_1.$)('.actions'));
            const toolBar = new toolbar_1.ToolBar(actions, this.contextMenuService, { actionViewItemProvider: this.actionViewItemProvider });
            const countContainer = (0, dom_1.append)(provider, (0, dom_1.$)('.count'));
            const count = new countBadge_1.CountBadge(countContainer);
            const badgeStyler = (0, styler_1.attachBadgeStyler)(count, this.themeService);
            const visibilityDisposable = toolBar.onDidChangeDropdownVisibility(e => provider.classList.toggle('active', e));
            const disposable = lifecycle_1.Disposable.None;
            const templateDisposable = (0, lifecycle_1.combinedDisposable)(visibilityDisposable, toolBar, badgeStyler);
            return { label, name, description, countContainer, count, toolBar, disposable, templateDisposable };
        }
        renderElement(arg, index, templateData, height) {
            templateData.disposable.dispose();
            const disposables = new lifecycle_1.DisposableStore();
            const repository = (0, util_1.isSCMRepository)(arg) ? arg : arg.element;
            if (repository.provider.rootUri) {
                const folder = this.workspaceContextService.getWorkspaceFolder(repository.provider.rootUri);
                if ((folder === null || folder === void 0 ? void 0 : folder.uri.toString()) === repository.provider.rootUri.toString()) {
                    templateData.name.textContent = folder.name;
                }
                else {
                    templateData.name.textContent = (0, resources_1.basename)(repository.provider.rootUri);
                }
                templateData.label.title = `${repository.provider.label}: ${repository.provider.rootUri.fsPath}`;
                templateData.description.textContent = repository.provider.label;
            }
            else {
                templateData.label.title = repository.provider.label;
                templateData.name.textContent = repository.provider.label;
                templateData.description.textContent = '';
            }
            let statusPrimaryActions = [];
            let menuPrimaryActions = [];
            let menuSecondaryActions = [];
            const updateToolbar = () => {
                templateData.toolBar.setActions([...statusPrimaryActions, ...menuPrimaryActions], menuSecondaryActions);
            };
            const onDidChangeProvider = () => {
                const commands = repository.provider.statusBarCommands || [];
                statusPrimaryActions = commands.map(c => new util_1.StatusBarAction(c, this.commandService));
                updateToolbar();
                const count = repository.provider.count || 0;
                templateData.countContainer.setAttribute('data-count', String(count));
                templateData.count.setCount(count);
            };
            // TODO@joao TODO@lszomoru
            let disposed = false;
            disposables.add((0, lifecycle_1.toDisposable)(() => disposed = true));
            disposables.add(repository.provider.onDidChange(() => {
                if (disposed) {
                    return;
                }
                onDidChangeProvider();
            }));
            onDidChangeProvider();
            const menus = this.scmViewService.menus.getRepositoryMenus(repository.provider);
            disposables.add((0, util_1.connectPrimaryMenu)(menus.titleMenu.menu, (primary, secondary) => {
                menuPrimaryActions = primary;
                menuSecondaryActions = secondary;
                updateToolbar();
            }));
            templateData.toolBar.context = repository.provider;
            templateData.disposable = disposables;
        }
        renderCompressedElements() {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.disposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.disposable.dispose();
            templateData.templateDisposable.dispose();
        }
    };
    RepositoryRenderer.TEMPLATE_ID = 'repository';
    RepositoryRenderer = __decorate([
        __param(1, scm_1.ISCMViewService),
        __param(2, commands_1.ICommandService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, themeService_1.IThemeService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], RepositoryRenderer);
    exports.RepositoryRenderer = RepositoryRenderer;
});
//# sourceMappingURL=scmRepositoryRenderer.js.map