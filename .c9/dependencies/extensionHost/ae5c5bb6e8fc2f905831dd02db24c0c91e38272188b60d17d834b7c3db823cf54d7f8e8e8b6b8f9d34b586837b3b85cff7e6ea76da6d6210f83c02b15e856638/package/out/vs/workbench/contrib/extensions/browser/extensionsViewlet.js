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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "../common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/workbench/contrib/extensions/browser/extensionsViews", "vs/platform/progress/common/progress", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/severity", "vs/workbench/services/activity/common/activity", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/workbench/common/views", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/base/browser/ui/aria/aria", "vs/platform/registry/common/platform", "vs/platform/label/common/label", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/preferences/common/preferences", "vs/base/common/uri", "vs/workbench/common/theme", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/contextkeys", "vs/platform/commands/common/commands", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/actions/common/actions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/css!./media/extensionsViewlet"], function (require, exports, nls_1, async_1, errors_1, errorMessage_1, lifecycle_1, event_1, actions_1, dom_1, telemetry_1, instantiation_1, extensions_1, extensions_2, extensionsActions_1, extensionManagement_1, extensionManagement_2, extensionsInput_1, extensionsViews_1, progress_1, editorGroupsService_1, severity_1, activity_1, themeService_1, configuration_1, views_1, storage_1, workspace_1, contextkey_1, contextView_1, extensionManagementUtil_1, log_1, notification_1, host_1, layoutService_1, viewPaneContainer_1, extensionQuery_1, suggestEnabledInput_1, aria_1, platform_1, label_1, descriptors_1, preferences_1, uri_1, theme_1, environmentService_1, contextkeys_1, commands_1, extensionsIcons_1, actions_2, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MaliciousExtensionChecker = exports.StatusUpdater = exports.ExtensionsViewPaneContainer = exports.ExtensionsViewletViewsContribution = void 0;
    const SearchMarketplaceExtensionsContext = new contextkey_1.RawContextKey('searchMarketplaceExtensions', false);
    const SearchIntalledExtensionsContext = new contextkey_1.RawContextKey('searchInstalledExtensions', false);
    const SearchOutdatedExtensionsContext = new contextkey_1.RawContextKey('searchOutdatedExtensions', false);
    const SearchEnabledExtensionsContext = new contextkey_1.RawContextKey('searchEnabledExtensions', false);
    const SearchDisabledExtensionsContext = new contextkey_1.RawContextKey('searchDisabledExtensions', false);
    const HasInstalledExtensionsContext = new contextkey_1.RawContextKey('hasInstalledExtensions', true);
    const BuiltInExtensionsContext = new contextkey_1.RawContextKey('builtInExtensions', false);
    const SearchBuiltInExtensionsContext = new contextkey_1.RawContextKey('searchBuiltInExtensions', false);
    const SearchUnsupportedWorkspaceExtensionsContext = new contextkey_1.RawContextKey('searchUnsupportedWorkspaceExtensions', false);
    const RecommendedExtensionsContext = new contextkey_1.RawContextKey('recommendedExtensions', false);
    let ExtensionsViewletViewsContribution = class ExtensionsViewletViewsContribution {
        constructor(extensionManagementServerService, labelService, viewDescriptorService, contextKeyService) {
            this.extensionManagementServerService = extensionManagementServerService;
            this.labelService = labelService;
            this.contextKeyService = contextKeyService;
            this.container = viewDescriptorService.getViewContainerById(extensions_2.VIEWLET_ID);
            this.registerViews();
        }
        registerViews() {
            const viewDescriptors = [];
            /* Default views */
            viewDescriptors.push(...this.createDefaultExtensionsViewDescriptors());
            /* Search views */
            viewDescriptors.push(...this.createSearchExtensionsViewDescriptors());
            /* Recommendations views */
            viewDescriptors.push(...this.createRecommendedExtensionsViewDescriptors());
            /* Built-in extensions views */
            viewDescriptors.push(...this.createBuiltinExtensionsViewDescriptors());
            /* Trust Required extensions views */
            viewDescriptors.push(...this.createUnsupportedWorkspaceExtensionsViewDescriptors());
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews(viewDescriptors, this.container);
        }
        createDefaultExtensionsViewDescriptors() {
            const viewDescriptors = [];
            /*
             * Default installed extensions views - Shows all user installed extensions.
             */
            const servers = [];
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.localExtensionManagementServer);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.remoteExtensionManagementServer);
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.webExtensionManagementServer);
            }
            const getViewName = (viewTitle, server) => {
                return servers.length > 1 ? `${server.label} - ${viewTitle}` : viewTitle;
            };
            let installedWebExtensionsContextChangeEvent = event_1.Event.None;
            if (this.extensionManagementServerService.webExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                const interestingContextKeys = new Set();
                interestingContextKeys.add('hasInstalledWebExtensions');
                installedWebExtensionsContextChangeEvent = event_1.Event.filter(this.contextKeyService.onDidChangeContext, e => e.affectsSome(interestingContextKeys));
            }
            const serverLabelChangeEvent = event_1.Event.any(this.labelService.onDidChangeFormatters, installedWebExtensionsContextChangeEvent);
            for (const server of servers) {
                const getInstalledViewName = () => getViewName((0, nls_1.localize)('installed', "Installed"), server);
                const onDidChangeTitle = event_1.Event.map(serverLabelChangeEvent, () => getInstalledViewName());
                const id = servers.length > 1 ? `workbench.views.extensions.${server.id}.installed` : `workbench.views.extensions.installed`;
                /* Installed extensions view */
                viewDescriptors.push({
                    id,
                    get name() { return getInstalledViewName(); },
                    weight: 100,
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(extensions_2.DefaultViewsContext),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ServerInstalledExtensionsView, [{ server, flexibleHeight: true, onDidChangeTitle }]),
                    /* Installed extensions views shall not be allowed to hidden when there are more than one server */
                    canToggleVisibility: servers.length === 1
                });
                if (server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManagementServerService.localExtensionManagementServer) {
                    (0, actions_2.registerAction2)(class InstallLocalExtensionsInRemoteAction2 extends actions_2.Action2 {
                        constructor() {
                            super({
                                id: 'workbench.extensions.installLocalExtensions',
                                get title() { return (0, nls_1.localize)('select and install local extensions', "Install Local Extensions in '{0}'...", server.label); },
                                category: (0, nls_1.localize)({ key: 'remote', comment: ['Remote as in remote machine'] }, "Remote"),
                                icon: extensionsIcons_1.installLocalInRemoteIcon,
                                f1: true,
                                menu: {
                                    id: actions_2.MenuId.ViewTitle,
                                    when: contextkey_1.ContextKeyExpr.equals('view', id),
                                    group: 'navigation',
                                }
                            });
                        }
                        run(accessor) {
                            return accessor.get(instantiation_1.IInstantiationService).createInstance(extensionsActions_1.InstallLocalExtensionsInRemoteAction).run();
                        }
                    });
                }
            }
            if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                (0, actions_2.registerAction2)(class InstallRemoteExtensionsInLocalAction2 extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.extensions.actions.installLocalExtensionsInRemote',
                            title: { value: (0, nls_1.localize)('install remote in local', "Install Remote Extensions Locally..."), original: 'Install Remote Extensions Locally...' },
                            category: (0, nls_1.localize)({ key: 'remote', comment: ['Remote as in remote machine'] }, "Remote"),
                            f1: true
                        });
                    }
                    run(accessor) {
                        return accessor.get(instantiation_1.IInstantiationService).createInstance(extensionsActions_1.InstallRemoteExtensionsInLocalAction, 'workbench.extensions.actions.installLocalExtensionsInRemote').run();
                    }
                });
            }
            /*
             * Default popular extensions view
             * Separate view for popular extensions required as we need to show popular and recommended sections
             * in the default view when there is no search text, and user has no installed extensions.
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.popular',
                name: (0, nls_1.localize)('popularExtensions', "Popular"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DefaultPopularExtensionsView, [{ hideBadge: true }]),
                when: contextkey_1.ContextKeyExpr.and(extensions_2.DefaultViewsContext, contextkey_1.ContextKeyExpr.not('hasInstalledExtensions')),
                weight: 60,
                order: 2,
                canToggleVisibility: false
            });
            /*
             * Default recommended extensions view
             * When user has installed extensions, this is shown along with the views for enabled & disabled extensions
             * When user has no installed extensions, this is shown along with the view for popular extensions
             */
            viewDescriptors.push({
                id: 'extensions.recommendedList',
                name: (0, nls_1.localize)('recommendedExtensions', "Recommended"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DefaultRecommendedExtensionsView, [{ flexibleHeight: true }]),
                when: contextkey_1.ContextKeyExpr.and(extensions_2.DefaultViewsContext, contextkey_1.ContextKeyExpr.not('config.extensions.showRecommendationsOnlyOnDemand')),
                weight: 40,
                order: 3,
                canToggleVisibility: true
            });
            /* Installed views shall be default in multi server window  */
            if (servers.length === 1) {
                /*
                 * Default enabled extensions view - Shows all user installed enabled extensions.
                 * Hidden by default
                 */
                viewDescriptors.push({
                    id: 'workbench.views.extensions.enabled',
                    name: (0, nls_1.localize)('enabledExtensions', "Enabled"),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.EnabledExtensionsView, [{}]),
                    when: contextkey_1.ContextKeyExpr.and(extensions_2.DefaultViewsContext, contextkey_1.ContextKeyExpr.has('hasInstalledExtensions')),
                    hideByDefault: true,
                    weight: 40,
                    order: 4,
                    canToggleVisibility: true
                });
                /*
                 * Default disabled extensions view - Shows all disabled extensions.
                 * Hidden by default
                 */
                viewDescriptors.push({
                    id: 'workbench.views.extensions.disabled',
                    name: (0, nls_1.localize)('disabledExtensions', "Disabled"),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DisabledExtensionsView, [{}]),
                    when: contextkey_1.ContextKeyExpr.and(extensions_2.DefaultViewsContext, contextkey_1.ContextKeyExpr.has('hasInstalledExtensions')),
                    hideByDefault: true,
                    weight: 10,
                    order: 5,
                    canToggleVisibility: true
                });
            }
            return viewDescriptors;
        }
        createSearchExtensionsViewDescriptors() {
            const viewDescriptors = [];
            /*
             * View used for searching Marketplace
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.marketplace',
                name: (0, nls_1.localize)('marketPlace', "Marketplace"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchMarketplaceExtensions')),
            });
            /*
             * View used for searching all installed extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchInstalled',
                name: (0, nls_1.localize)('installed', "Installed"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchInstalledExtensions')),
            });
            /*
             * View used for searching enabled extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchEnabled',
                name: (0, nls_1.localize)('enabled', "Enabled"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchEnabledExtensions')),
            });
            /*
             * View used for searching disabled extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchDisabled',
                name: (0, nls_1.localize)('disabled', "Disabled"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchDisabledExtensions')),
            });
            /*
             * View used for searching outdated extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchOutdated',
                name: (0, nls_1.localize)('outdated', "Outdated"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchOutdatedExtensions')),
            });
            /*
             * View used for searching builtin extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchBuiltin',
                name: (0, nls_1.localize)('builtin', "Builtin"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchBuiltInExtensions')),
            });
            /*
             * View used for searching workspace unsupported extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchWorkspaceUnsupported',
                name: (0, nls_1.localize)('workspaceUnsupported', "Workspace Unsupported"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchWorkspaceUnsupportedExtensions')),
            });
            return viewDescriptors;
        }
        createRecommendedExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID,
                name: (0, nls_1.localize)('workspaceRecommendedExtensions', "Workspace Recommendations"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.WorkspaceRecommendedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('recommendedExtensions'), contextkeys_1.WorkbenchStateContext.notEqualsTo('empty')),
                order: 1
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.otherRecommendations',
                name: (0, nls_1.localize)('otherRecommendedExtensions', "Other Recommendations"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.RecommendedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.has('recommendedExtensions'),
                order: 2
            });
            return viewDescriptors;
        }
        createBuiltinExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinFeatureExtensions',
                name: (0, nls_1.localize)('builtinFeatureExtensions', "Features"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.BuiltInFeatureExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinThemeExtensions',
                name: (0, nls_1.localize)('builtInThemesExtensions', "Themes"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.BuiltInThemesExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinProgrammingLanguageExtensions',
                name: (0, nls_1.localize)('builtinProgrammingLanguageExtensions', "Programming Languages"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.BuiltInProgrammingLanguageExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            return viewDescriptors;
        }
        createUnsupportedWorkspaceExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: 'workbench.views.extensions.untrustedUnsupportedExtensions',
                name: (0, nls_1.localize)('untrustedUnsupportedExtensions', "Disabled in Restricted Mode"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.UntrustedWorkspaceUnsupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.untrustedPartiallySupportedExtensions',
                name: (0, nls_1.localize)('untrustedPartiallySupportedExtensions', "Limited in Restricted Mode"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.UntrustedWorkspacePartiallySupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.virtualUnsupportedExtensions',
                name: (0, nls_1.localize)('virtualUnsupportedExtensions', "Disabled in Virtual Workspaces"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.VirtualWorkspaceUnsupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.VirtualWorkspaceContext, SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.virtualPartiallySupportedExtensions',
                name: (0, nls_1.localize)('virtualPartiallySupportedExtensions', "Limited in Virtual Workspaces"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.VirtualWorkspacePartiallySupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.VirtualWorkspaceContext, SearchUnsupportedWorkspaceExtensionsContext),
            });
            return viewDescriptors;
        }
    };
    ExtensionsViewletViewsContribution = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, label_1.ILabelService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextkey_1.IContextKeyService)
    ], ExtensionsViewletViewsContribution);
    exports.ExtensionsViewletViewsContribution = ExtensionsViewletViewsContribution;
    let ExtensionsViewPaneContainer = class ExtensionsViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, progressService, instantiationService, editorGroupService, extensionsWorkbenchService, extensionManagementServerService, notificationService, paneCompositeService, themeService, configurationService, storageService, contextService, contextKeyService, contextMenuService, extensionService, viewDescriptorService, preferencesService, commandService) {
            super(extensions_2.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.progressService = progressService;
            this.editorGroupService = editorGroupService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.notificationService = notificationService;
            this.paneCompositeService = paneCompositeService;
            this.contextKeyService = contextKeyService;
            this.preferencesService = preferencesService;
            this.commandService = commandService;
            this.searchDelayer = new async_1.Delayer(500);
            this.defaultViewsContextKey = extensions_2.DefaultViewsContext.bindTo(contextKeyService);
            this.sortByContextKey = extensions_2.ExtensionsSortByContext.bindTo(contextKeyService);
            this.searchMarketplaceExtensionsContextKey = SearchMarketplaceExtensionsContext.bindTo(contextKeyService);
            this.searchInstalledExtensionsContextKey = SearchIntalledExtensionsContext.bindTo(contextKeyService);
            this.searchWorkspaceUnsupportedExtensionsContextKey = SearchUnsupportedWorkspaceExtensionsContext.bindTo(contextKeyService);
            this.searchOutdatedExtensionsContextKey = SearchOutdatedExtensionsContext.bindTo(contextKeyService);
            this.searchEnabledExtensionsContextKey = SearchEnabledExtensionsContext.bindTo(contextKeyService);
            this.searchDisabledExtensionsContextKey = SearchDisabledExtensionsContext.bindTo(contextKeyService);
            this.hasInstalledExtensionsContextKey = HasInstalledExtensionsContext.bindTo(contextKeyService);
            this.builtInExtensionsContextKey = BuiltInExtensionsContext.bindTo(contextKeyService);
            this.searchBuiltInExtensionsContextKey = SearchBuiltInExtensionsContext.bindTo(contextKeyService);
            this.recommendedExtensionsContextKey = RecommendedExtensionsContext.bindTo(contextKeyService);
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(e => { if (e.viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                this.onViewletOpen(e.composite);
            } }, this));
            this.searchViewletState = this.getMemento(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        get searchValue() {
            var _a;
            return (_a = this.searchBox) === null || _a === void 0 ? void 0 : _a.getValue();
        }
        create(parent) {
            var _a;
            parent.classList.add('extensions-viewlet');
            this.root = parent;
            const overlay = (0, dom_1.append)(this.root, (0, dom_1.$)('.overlay'));
            const overlayBackgroundColor = (_a = this.getColor(theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND)) !== null && _a !== void 0 ? _a : '';
            overlay.style.backgroundColor = overlayBackgroundColor;
            (0, dom_1.hide)(overlay);
            const header = (0, dom_1.append)(this.root, (0, dom_1.$)('.header'));
            const placeholder = (0, nls_1.localize)('searchExtensions', "Search Extensions in Marketplace");
            const searchValue = this.searchViewletState['query.value'] ? this.searchViewletState['query.value'] : '';
            this.searchBox = this._register(this.instantiationService.createInstance(suggestEnabledInput_1.SuggestEnabledInput, `${extensions_2.VIEWLET_ID}.searchbox`, header, {
                triggerCharacters: ['@'],
                sortKey: (item) => {
                    if (item.indexOf(':') === -1) {
                        return 'a';
                    }
                    else if (/ext:/.test(item) || /id:/.test(item) || /tag:/.test(item)) {
                        return 'b';
                    }
                    else if (/sort:/.test(item)) {
                        return 'c';
                    }
                    else {
                        return 'd';
                    }
                },
                provideResults: (query) => extensionQuery_1.Query.suggestions(query)
            }, placeholder, 'extensions:searchinput', { placeholderText: placeholder, value: searchValue }));
            this.updateInstalledExtensionsContexts();
            if (this.searchBox.getValue()) {
                this.triggerSearch();
            }
            this._register((0, suggestEnabledInput_1.attachSuggestEnabledInputBoxStyler)(this.searchBox, this.themeService));
            this._register(this.searchBox.onInputDidChange(() => {
                this.sortByContextKey.set(extensionQuery_1.Query.parse(this.searchBox.getValue() || '').sortBy);
                this.triggerSearch();
            }, this));
            this._register(this.searchBox.onShouldFocusResults(() => this.focusListView(), this));
            // Register DragAndDrop support
            this._register(new dom_1.DragAndDropObserver(this.root, {
                onDragEnd: (e) => undefined,
                onDragEnter: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.show)(overlay);
                    }
                },
                onDragLeave: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.hide)(overlay);
                    }
                },
                onDragOver: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                },
                onDrop: async (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.hide)(overlay);
                        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                            let vsixPaths = [];
                            for (let index = 0; index < e.dataTransfer.files.length; index++) {
                                const path = e.dataTransfer.files.item(index).path;
                                if (path.indexOf('.vsix') !== -1) {
                                    vsixPaths.push(uri_1.URI.file(path));
                                }
                            }
                            try {
                                // Attempt to install the extension(s)
                                await this.commandService.executeCommand(extensions_2.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID, vsixPaths);
                            }
                            catch (err) {
                                this.notificationService.error(err);
                            }
                        }
                    }
                }
            }));
            super.create((0, dom_1.append)(this.root, (0, dom_1.$)('.extensions')));
        }
        focus() {
            if (this.searchBox) {
                this.searchBox.focus();
            }
        }
        layout(dimension) {
            if (this.root) {
                this.root.classList.toggle('narrow', dimension.width <= 250);
                this.root.classList.toggle('mini', dimension.width <= 200);
            }
            if (this.searchBox) {
                this.searchBox.layout(new dom_1.Dimension(dimension.width - 34 - /*padding*/ 8, 20));
            }
            super.layout(new dom_1.Dimension(dimension.width, dimension.height - 41));
        }
        getOptimalWidth() {
            return 400;
        }
        search(value) {
            if (this.searchBox && this.searchBox.getValue() !== value) {
                this.searchBox.setValue(value);
            }
        }
        async refresh() {
            await this.updateInstalledExtensionsContexts();
            this.doSearch(true);
            if (this.configurationService.getValue(extensions_2.AutoCheckUpdatesConfigurationKey)) {
                this.extensionsWorkbenchService.checkForUpdates();
            }
        }
        async updateInstalledExtensionsContexts() {
            const result = await this.extensionsWorkbenchService.queryLocal();
            this.hasInstalledExtensionsContextKey.set(result.some(r => !r.isBuiltin));
        }
        triggerSearch() {
            this.searchDelayer.trigger(() => this.doSearch(), this.searchBox && this.searchBox.getValue() ? 500 : 0).then(undefined, err => this.onError(err));
        }
        normalizedQuery() {
            return this.searchBox
                ? this.searchBox.getValue()
                    .replace(/@category/g, 'category')
                    .replace(/@tag:/g, 'tag:')
                    .replace(/@ext:/g, 'ext:')
                    .replace(/@featured/g, 'featured')
                    .replace(/@popular/g, this.extensionManagementServerService.webExtensionManagementServer && !this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer ? '@web' : '@sort:installs')
                : '';
        }
        saveState() {
            const value = this.searchBox ? this.searchBox.getValue() : '';
            if (extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery(value)) {
                this.searchViewletState['query.value'] = value;
            }
            else {
                this.searchViewletState['query.value'] = '';
            }
            super.saveState();
        }
        doSearch(refresh) {
            const value = this.normalizedQuery();
            this.contextKeyService.bufferChangeEvents(() => {
                const isRecommendedExtensionsQuery = extensionsViews_1.ExtensionsListView.isRecommendedExtensionsQuery(value);
                this.searchInstalledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isInstalledExtensionsQuery(value));
                this.searchOutdatedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isOutdatedExtensionsQuery(value));
                this.searchEnabledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isEnabledExtensionsQuery(value));
                this.searchDisabledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isDisabledExtensionsQuery(value));
                this.searchBuiltInExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchBuiltInExtensionsQuery(value));
                this.searchWorkspaceUnsupportedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchWorkspaceUnsupportedExtensionsQuery(value));
                this.builtInExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isBuiltInExtensionsQuery(value));
                this.recommendedExtensionsContextKey.set(isRecommendedExtensionsQuery);
                this.searchMarketplaceExtensionsContextKey.set(!!value && !extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery(value) && !isRecommendedExtensionsQuery);
                this.defaultViewsContextKey.set(!value);
            });
            return this.progress(Promise.all(this.panes.map(view => view.show(this.normalizedQuery(), refresh)
                .then(model => this.alertSearchResult(model.length, view.id))))).then(() => undefined);
        }
        onDidAddViewDescriptors(added) {
            const addedViews = super.onDidAddViewDescriptors(added);
            this.progress(Promise.all(addedViews.map(addedView => addedView.show(this.normalizedQuery())
                .then(model => this.alertSearchResult(model.length, addedView.id)))));
            return addedViews;
        }
        alertSearchResult(count, viewId) {
            const view = this.viewContainerModel.visibleViewDescriptors.find(view => view.id === viewId);
            switch (count) {
                case 0:
                    break;
                case 1:
                    if (view) {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionFoundInSection', "1 extension found in the {0} section.", view.name));
                    }
                    else {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionFound', "1 extension found."));
                    }
                    break;
                default:
                    if (view) {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionsFoundInSection', "{0} extensions found in the {1} section.", count, view.name));
                    }
                    else {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionsFound', "{0} extensions found.", count));
                    }
                    break;
            }
        }
        count() {
            return this.panes.reduce((count, view) => view.count() + count, 0);
        }
        focusListView() {
            if (this.count() > 0) {
                this.panes[0].focus();
            }
        }
        onViewletOpen(viewlet) {
            if (!viewlet || viewlet.getId() === extensions_2.VIEWLET_ID) {
                return;
            }
            if (this.configurationService.getValue(extensions_2.CloseExtensionDetailsOnViewChangeKey)) {
                const promises = this.editorGroupService.groups.map(group => {
                    const editors = group.editors.filter(input => input instanceof extensionsInput_1.ExtensionsInput);
                    return group.closeEditors(editors);
                });
                Promise.all(promises);
            }
        }
        progress(promise) {
            return this.progressService.withProgress({ location: 5 /* ProgressLocation.Extensions */ }, () => promise);
        }
        onError(err) {
            if ((0, errors_1.isCancellationError)(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/ECONNREFUSED/.test(message)) {
                const error = (0, errorMessage_1.createErrorWithActions)((0, nls_1.localize)('suggestProxyError', "Marketplace returned 'ECONNREFUSED'. Please check the 'http.proxy' setting."), [
                    new actions_1.Action('open user settings', (0, nls_1.localize)('open user settings', "Open User Settings"), undefined, true, () => this.preferencesService.openUserSettings())
                ]);
                this.notificationService.error(error);
                return;
            }
            this.notificationService.error(err);
        }
        isSupportedDragElement(e) {
            if (e.dataTransfer) {
                const typesLowerCase = e.dataTransfer.types.map(t => t.toLocaleLowerCase());
                return typesLowerCase.indexOf('files') !== -1;
            }
            return false;
        }
    };
    ExtensionsViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, progress_1.IProgressService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, extensions_2.IExtensionsWorkbenchService),
        __param(6, extensionManagement_2.IExtensionManagementServerService),
        __param(7, notification_1.INotificationService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, themeService_1.IThemeService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, storage_1.IStorageService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, contextkey_1.IContextKeyService),
        __param(14, contextView_1.IContextMenuService),
        __param(15, extensions_1.IExtensionService),
        __param(16, views_1.IViewDescriptorService),
        __param(17, preferences_1.IPreferencesService),
        __param(18, commands_1.ICommandService)
    ], ExtensionsViewPaneContainer);
    exports.ExtensionsViewPaneContainer = ExtensionsViewPaneContainer;
    let StatusUpdater = class StatusUpdater extends lifecycle_1.Disposable {
        constructor(activityService, extensionsWorkbenchService, extensionEnablementService) {
            super();
            this.activityService = activityService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.badgeHandle = this._register(new lifecycle_1.MutableDisposable());
            this._register(extensionsWorkbenchService.onChange(this.onServiceChange, this));
        }
        onServiceChange() {
            this.badgeHandle.clear();
            const outdated = this.extensionsWorkbenchService.outdated.reduce((r, e) => r + (this.extensionEnablementService.isEnabled(e.local) ? 1 : 0), 0);
            if (outdated > 0) {
                const badge = new activity_1.NumberBadge(outdated, n => (0, nls_1.localize)('outdatedExtensions', '{0} Outdated Extensions', n));
                this.badgeHandle.value = this.activityService.showViewContainerActivity(extensions_2.VIEWLET_ID, { badge, clazz: 'extensions-badge count-badge' });
            }
        }
    };
    StatusUpdater = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, extensions_2.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], StatusUpdater);
    exports.StatusUpdater = StatusUpdater;
    let MaliciousExtensionChecker = class MaliciousExtensionChecker {
        constructor(extensionsManagementService, hostService, logService, notificationService, environmentService) {
            this.extensionsManagementService = extensionsManagementService;
            this.hostService = hostService;
            this.logService = logService;
            this.notificationService = notificationService;
            this.environmentService = environmentService;
            if (!this.environmentService.disableExtensions) {
                this.loopCheckForMaliciousExtensions();
            }
        }
        loopCheckForMaliciousExtensions() {
            this.checkForMaliciousExtensions()
                .then(() => (0, async_1.timeout)(1000 * 60 * 5)) // every five minutes
                .then(() => this.loopCheckForMaliciousExtensions());
        }
        checkForMaliciousExtensions() {
            return this.extensionsManagementService.getExtensionsControlManifest().then(report => {
                const maliciousSet = (0, extensionManagementUtil_1.getMaliciousExtensionsSet)(report);
                return this.extensionsManagementService.getInstalled(1 /* ExtensionType.User */).then(installed => {
                    const maliciousExtensions = installed
                        .filter(e => maliciousSet.has(e.identifier.id));
                    if (maliciousExtensions.length) {
                        return async_1.Promises.settled(maliciousExtensions.map(e => this.extensionsManagementService.uninstall(e).then(() => {
                            this.notificationService.prompt(severity_1.default.Warning, (0, nls_1.localize)('malicious warning', "We have uninstalled '{0}' which was reported to be problematic.", e.identifier.id), [{
                                    label: (0, nls_1.localize)('reloadNow', "Reload Now"),
                                    run: () => this.hostService.reload()
                                }], { sticky: true });
                        })));
                    }
                    else {
                        return Promise.resolve(undefined);
                    }
                }).then(() => undefined);
            }, err => this.logService.error(err));
        }
    };
    MaliciousExtensionChecker = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, host_1.IHostService),
        __param(2, log_1.ILogService),
        __param(3, notification_1.INotificationService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService)
    ], MaliciousExtensionChecker);
    exports.MaliciousExtensionChecker = MaliciousExtensionChecker;
});
//# sourceMappingURL=extensionsViewlet.js.map