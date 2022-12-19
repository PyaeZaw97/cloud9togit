/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "./dirtydiffDecorator", "vs/workbench/contrib/scm/common/scm", "vs/platform/actions/common/actions", "./activity", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/scm/common/scmService", "vs/workbench/common/views", "vs/workbench/contrib/scm/browser/scmViewPaneContainer", "vs/platform/instantiation/common/descriptors", "vs/editor/common/languages/modesRegistry", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/contrib/scm/browser/scmViewPane", "vs/workbench/contrib/scm/browser/scmViewService", "vs/workbench/contrib/scm/browser/scmRepositoriesViewPane", "vs/editor/contrib/suggest/browser/suggest", "vs/workbench/contrib/workspace/common/workspace"], function (require, exports, nls_1, platform_1, contributions_1, dirtydiffDecorator_1, scm_1, actions_1, activity_1, configurationRegistry_1, contextkey_1, commands_1, keybindingsRegistry_1, extensions_1, scmService_1, views_1, scmViewPaneContainer_1, descriptors_1, modesRegistry_1, codicons_1, iconRegistry_1, scmViewPane_1, scmViewService_1, scmRepositoriesViewPane_1, suggest_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: 'scminput',
        extensions: [],
        aliases: [],
        mimetypes: ['text/x-scm-input']
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(dirtydiffDecorator_1.DirtyDiffWorkbenchController, 3 /* LifecyclePhase.Restored */);
    const sourceControlViewIcon = (0, iconRegistry_1.registerIcon)('source-control-view-icon', codicons_1.Codicon.sourceControl, (0, nls_1.localize)('sourceControlViewIcon', 'View icon of the Source Control view.'));
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: scm_1.VIEWLET_ID,
        title: (0, nls_1.localize)('source control', "Source Control"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(scmViewPaneContainer_1.SCMViewPaneContainer),
        storageId: 'workbench.scm.views.state',
        icon: sourceControlViewIcon,
        alwaysUseContainerInfo: true,
        order: 2,
        hideIfEmpty: true,
    }, 0 /* ViewContainerLocation.Sidebar */, { donotRegisterOpenCommand: true });
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViewWelcomeContent(scm_1.VIEW_PANE_ID, {
        content: (0, nls_1.localize)('no open repo', "No source control providers registered."),
        when: 'default'
    });
    viewsRegistry.registerViewWelcomeContent(scm_1.VIEW_PANE_ID, {
        content: (0, nls_1.localize)('no open repo in an untrusted workspace', "None of the registered source control providers work in Restricted Mode."),
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('scm.providerCount', 0), workspace_1.WorkspaceTrustContext.IsEnabled, workspace_1.WorkspaceTrustContext.IsTrusted.toNegated())
    });
    viewsRegistry.registerViewWelcomeContent(scm_1.VIEW_PANE_ID, {
        content: `[${(0, nls_1.localize)('manageWorkspaceTrustAction', "Manage Workspace Trust")}](command:${workspace_1.MANAGE_TRUST_COMMAND_ID})`,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('scm.providerCount', 0), workspace_1.WorkspaceTrustContext.IsEnabled, workspace_1.WorkspaceTrustContext.IsTrusted.toNegated())
    });
    viewsRegistry.registerViews([{
            id: scm_1.VIEW_PANE_ID,
            name: (0, nls_1.localize)('source control', "Source Control"),
            ctorDescriptor: new descriptors_1.SyncDescriptor(scmViewPane_1.SCMViewPane),
            canToggleVisibility: true,
            workspace: true,
            canMoveView: true,
            weight: 80,
            order: -999,
            containerIcon: sourceControlViewIcon,
            openCommandActionDescriptor: {
                id: viewContainer.id,
                mnemonicTitle: (0, nls_1.localize)({ key: 'miViewSCM', comment: ['&& denotes a mnemonic'] }, "Source &&Control"),
                keybindings: {
                    primary: 0,
                    win: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */ },
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */ },
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */ },
                },
                order: 2,
            }
        }], viewContainer);
    viewsRegistry.registerViews([{
            id: scm_1.REPOSITORIES_VIEW_PANE_ID,
            name: (0, nls_1.localize)('source control repositories', "Source Control Repositories"),
            ctorDescriptor: new descriptors_1.SyncDescriptor(scmRepositoriesViewPane_1.SCMRepositoriesViewPane),
            canToggleVisibility: true,
            hideByDefault: true,
            workspace: true,
            canMoveView: true,
            weight: 20,
            order: -1000,
            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('scm.providerCount'), contextkey_1.ContextKeyExpr.notEquals('scm.providerCount', 0)),
            // readonly when = ContextKeyExpr.or(ContextKeyExpr.equals('config.scm.alwaysShowProviders', true), ContextKeyExpr.and(ContextKeyExpr.notEquals('scm.providerCount', 0), ContextKeyExpr.notEquals('scm.providerCount', 1)));
            containerIcon: sourceControlViewIcon
        }], viewContainer);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(activity_1.SCMActiveResourceContextKeyController, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(activity_1.SCMStatusController, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'scm',
        order: 5,
        title: (0, nls_1.localize)('scmConfigurationTitle', "Source Control"),
        type: 'object',
        scope: 4 /* ConfigurationScope.RESOURCE */,
        properties: {
            'scm.diffDecorations': {
                type: 'string',
                enum: ['all', 'gutter', 'overview', 'minimap', 'none'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.diffDecorations.all', "Show the diff decorations in all available locations."),
                    (0, nls_1.localize)('scm.diffDecorations.gutter', "Show the diff decorations only in the editor gutter."),
                    (0, nls_1.localize)('scm.diffDecorations.overviewRuler', "Show the diff decorations only in the overview ruler."),
                    (0, nls_1.localize)('scm.diffDecorations.minimap', "Show the diff decorations only in the minimap."),
                    (0, nls_1.localize)('scm.diffDecorations.none', "Do not show the diff decorations.")
                ],
                default: 'all',
                description: (0, nls_1.localize)('diffDecorations', "Controls diff decorations in the editor.")
            },
            'scm.diffDecorationsGutterWidth': {
                type: 'number',
                enum: [1, 2, 3, 4, 5],
                default: 3,
                description: (0, nls_1.localize)('diffGutterWidth', "Controls the width(px) of diff decorations in gutter (added & modified).")
            },
            'scm.diffDecorationsGutterVisibility': {
                type: 'string',
                enum: ['always', 'hover'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.diffDecorationsGutterVisibility.always', "Show the diff decorator in the gutter at all times."),
                    (0, nls_1.localize)('scm.diffDecorationsGutterVisibility.hover', "Show the diff decorator in the gutter only on hover.")
                ],
                description: (0, nls_1.localize)('scm.diffDecorationsGutterVisibility', "Controls the visibility of the Source Control diff decorator in the gutter."),
                default: 'always'
            },
            'scm.diffDecorationsGutterAction': {
                type: 'string',
                enum: ['diff', 'none'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.diffDecorationsGutterAction.diff', "Show the inline diff peek view on click."),
                    (0, nls_1.localize)('scm.diffDecorationsGutterAction.none', "Do nothing.")
                ],
                description: (0, nls_1.localize)('scm.diffDecorationsGutterAction', "Controls the behavior of Source Control diff gutter decorations."),
                default: 'diff'
            },
            'scm.diffDecorationsGutterPattern': {
                type: 'object',
                description: (0, nls_1.localize)('diffGutterPattern', "Controls whether a pattern is used for the diff decorations in gutter."),
                additionalProperties: false,
                properties: {
                    'added': {
                        type: 'boolean',
                        description: (0, nls_1.localize)('diffGutterPatternAdded', "Use pattern for the diff decorations in gutter for added lines."),
                    },
                    'modified': {
                        type: 'boolean',
                        description: (0, nls_1.localize)('diffGutterPatternModifed', "Use pattern for the diff decorations in gutter for modified lines."),
                    },
                },
                default: {
                    'added': false,
                    'modified': true
                }
            },
            'scm.diffDecorationsIgnoreTrimWhitespace': {
                type: 'string',
                enum: ['true', 'false', 'inherit'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.diffDecorationsIgnoreTrimWhitespace.true', "Ignore leading and trailing whitespace."),
                    (0, nls_1.localize)('scm.diffDecorationsIgnoreTrimWhitespace.false', "Do not ignore leading and trailing whitespace."),
                    (0, nls_1.localize)('scm.diffDecorationsIgnoreTrimWhitespace.inherit', "Inherit from `diffEditor.ignoreTrimWhitespace`.")
                ],
                description: (0, nls_1.localize)('diffDecorationsIgnoreTrimWhitespace', "Controls whether leading and trailing whitespace is ignored in Source Control diff gutter decorations."),
                default: 'false'
            },
            'scm.alwaysShowActions': {
                type: 'boolean',
                description: (0, nls_1.localize)('alwaysShowActions', "Controls whether inline actions are always visible in the Source Control view."),
                default: false
            },
            'scm.countBadge': {
                type: 'string',
                enum: ['all', 'focused', 'off'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.countBadge.all', "Show the sum of all Source Control Provider count badges."),
                    (0, nls_1.localize)('scm.countBadge.focused', "Show the count badge of the focused Source Control Provider."),
                    (0, nls_1.localize)('scm.countBadge.off', "Disable the Source Control count badge.")
                ],
                description: (0, nls_1.localize)('scm.countBadge', "Controls the count badge on the Source Control icon on the Activity Bar."),
                default: 'all'
            },
            'scm.providerCountBadge': {
                type: 'string',
                enum: ['hidden', 'auto', 'visible'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.providerCountBadge.hidden', "Hide Source Control Provider count badges."),
                    (0, nls_1.localize)('scm.providerCountBadge.auto', "Only show count badge for Source Control Provider when non-zero."),
                    (0, nls_1.localize)('scm.providerCountBadge.visible', "Show Source Control Provider count badges.")
                ],
                description: (0, nls_1.localize)('scm.providerCountBadge', "Controls the count badges on Source Control Provider headers. These headers only appear when there is more than one provider."),
                default: 'hidden'
            },
            'scm.defaultViewMode': {
                type: 'string',
                enum: ['tree', 'list'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.defaultViewMode.tree', "Show the repository changes as a tree."),
                    (0, nls_1.localize)('scm.defaultViewMode.list', "Show the repository changes as a list.")
                ],
                description: (0, nls_1.localize)('scm.defaultViewMode', "Controls the default Source Control repository view mode."),
                default: 'list'
            },
            'scm.defaultViewSortKey': {
                type: 'string',
                enum: ['name', 'path', 'status'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.defaultViewSortKey.name', "Sort the repository changes by file name."),
                    (0, nls_1.localize)('scm.defaultViewSortKey.path', "Sort the repository changes by path."),
                    (0, nls_1.localize)('scm.defaultViewSortKey.status', "Sort the repository changes by Source Control status.")
                ],
                description: (0, nls_1.localize)('scm.defaultViewSortKey', "Controls the default Source Control repository changes sort order when viewed as a list."),
                default: 'path'
            },
            'scm.autoReveal': {
                type: 'boolean',
                description: (0, nls_1.localize)('autoReveal', "Controls whether the Source Control view should automatically reveal and select files when opening them."),
                default: true
            },
            'scm.inputFontFamily': {
                type: 'string',
                markdownDescription: (0, nls_1.localize)('inputFontFamily', "Controls the font for the input message. Use `default` for the workbench user interface font family, `editor` for the `#editor.fontFamily#`'s value, or a custom font family."),
                default: 'default'
            },
            'scm.inputFontSize': {
                type: 'number',
                markdownDescription: (0, nls_1.localize)('inputFontSize', "Controls the font size for the input message in pixels."),
                default: 13
            },
            'scm.alwaysShowRepositories': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('alwaysShowRepository', "Controls whether repositories should always be visible in the Source Control view."),
                default: false
            },
            'scm.repositories.sortOrder': {
                type: 'string',
                enum: ['discovery time', 'name', 'path'],
                enumDescriptions: [
                    (0, nls_1.localize)('scm.repositoriesSortOrder.discoveryTime', "Repositories in the Source Control Repositories view are sorted by discovery time. Repositories in the Source Control view are sorted in the order that they were selected."),
                    (0, nls_1.localize)('scm.repositoriesSortOrder.name', "Repositories in the Source Control Repositories and Source Control views are sorted by repository name."),
                    (0, nls_1.localize)('scm.repositoriesSortOrder.path', "Repositories in the Source Control Repositories and Source Control views are sorted by repository path.")
                ],
                description: (0, nls_1.localize)('repositoriesSortOrder', "Controls the sort order of the repositories in the source control repositories view."),
                default: 'discovery time'
            },
            'scm.repositories.visible': {
                type: 'number',
                description: (0, nls_1.localize)('providersVisible', "Controls how many repositories are visible in the Source Control Repositories section. Set to `0` to be able to manually resize the view."),
                default: 10
            },
            'scm.showActionButton': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('showActionButton', "Controls whether an action button can be shown in the Source Control view."),
                default: true
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'scm.acceptInput',
        description: { description: (0, nls_1.localize)('scm accept', "Source Control: Accept Input"), args: [] },
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.has('scmRepository'),
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        handler: accessor => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const context = contextKeyService.getContext(document.activeElement);
            const repository = context.getValue('scmRepository');
            if (!repository || !repository.provider.acceptInputCommand) {
                return Promise.resolve(null);
            }
            const id = repository.provider.acceptInputCommand.id;
            const args = repository.provider.acceptInputCommand.arguments;
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(id, ...(args || []));
        }
    });
    const viewNextCommitCommand = {
        description: { description: (0, nls_1.localize)('scm view next commit', "Source Control: View Next Commit"), args: [] },
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        handler: (accessor) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const context = contextKeyService.getContext(document.activeElement);
            const repository = context.getValue('scmRepository');
            repository === null || repository === void 0 ? void 0 : repository.input.showNextHistoryValue();
        }
    };
    const viewPreviousCommitCommand = {
        description: { description: (0, nls_1.localize)('scm view previous commit', "Source Control: View Previous Commit"), args: [] },
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        handler: (accessor) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const context = contextKeyService.getContext(document.activeElement);
            const repository = context.getValue('scmRepository');
            repository === null || repository === void 0 ? void 0 : repository.input.showPreviousHistoryValue();
        }
    };
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(Object.assign(Object.assign({}, viewNextCommitCommand), { id: 'scm.viewNextCommit', when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('scmRepository'), contextkey_1.ContextKeyExpr.has('scmInputIsInLastPosition'), suggest_1.Context.Visible.toNegated()), primary: 18 /* KeyCode.DownArrow */ }));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(Object.assign(Object.assign({}, viewPreviousCommitCommand), { id: 'scm.viewPreviousCommit', when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('scmRepository'), contextkey_1.ContextKeyExpr.has('scmInputIsInFirstPosition'), suggest_1.Context.Visible.toNegated()), primary: 16 /* KeyCode.UpArrow */ }));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(Object.assign(Object.assign({}, viewNextCommitCommand), { id: 'scm.forceViewNextCommit', when: contextkey_1.ContextKeyExpr.has('scmRepository'), primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */ }));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(Object.assign(Object.assign({}, viewPreviousCommitCommand), { id: 'scm.forceViewPreviousCommit', when: contextkey_1.ContextKeyExpr.has('scmRepository'), primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */ }));
    commands_1.CommandsRegistry.registerCommand('scm.openInTerminal', async (accessor, provider) => {
        if (!provider || !provider.rootUri) {
            return;
        }
        const commandService = accessor.get(commands_1.ICommandService);
        await commandService.executeCommand('openInTerminal', provider.rootUri);
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMSourceControl, {
        group: '100_end',
        command: {
            id: 'scm.openInTerminal',
            title: (0, nls_1.localize)('open in terminal', "Open In Terminal")
        },
        when: contextkey_1.ContextKeyExpr.equals('scmProviderHasRootUri', true)
    });
    (0, extensions_1.registerSingleton)(scm_1.ISCMService, scmService_1.SCMService);
    (0, extensions_1.registerSingleton)(scm_1.ISCMViewService, scmViewService_1.SCMViewService);
});
//# sourceMappingURL=scm.contribution.js.map