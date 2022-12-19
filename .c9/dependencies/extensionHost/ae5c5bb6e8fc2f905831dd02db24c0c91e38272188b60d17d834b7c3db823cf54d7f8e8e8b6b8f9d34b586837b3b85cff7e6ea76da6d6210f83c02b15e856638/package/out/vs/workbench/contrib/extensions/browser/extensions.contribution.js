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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/common/contributions", "vs/workbench/services/output/common/output", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/workbench/contrib/extensions/browser/extensionEditor", "vs/workbench/contrib/extensions/browser/extensionsViewlet", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensionsUtils", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/browser/editor", "vs/base/common/uri", "vs/workbench/contrib/extensions/browser/extensionsActivationProgress", "vs/base/common/errors", "vs/workbench/contrib/extensions/browser/extensionsDependencyChecker", "vs/base/common/cancellation", "vs/workbench/common/views", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/preferences/common/preferences", "vs/platform/contextkey/common/contextkey", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/extensions/browser/extensionsQuickAccess", "vs/workbench/contrib/extensions/browser/extensionRecommendationsService", "vs/workbench/services/userDataSync/common/userDataSync", "vs/editor/contrib/clipboard/browser/clipboard", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/workbench/common/actions", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService", "vs/workbench/services/extensions/common/extensions", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/workbench/common/contextkeys", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/base/common/network", "vs/workbench/contrib/extensions/browser/abstractRuntimeExtensionsEditor", "vs/workbench/contrib/extensions/browser/extensionEnablementWorkspaceTrustTransitionParticipant", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/extensions/common/extensions", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/base/common/labels", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/base/common/async", "vs/workbench/common/editor", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/workbench/contrib/extensions/browser/extensionsCompletionItemsProvider", "vs/platform/quickinput/common/quickInput", "vs/base/common/event", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/extensions/browser/unsupportedExtensionsMigrationContribution", "vs/base/common/platform", "vs/workbench/contrib/extensions/browser/extensionsCleaner"], function (require, exports, nls_1, platform_1, actions_1, extensions_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, contributions_1, output_1, descriptors_1, extensions_2, extensionsActions_1, extensionsInput_1, extensionEditor_1, extensionsViewlet_1, configurationRegistry_1, jsonContributionRegistry, extensionsFileTemplate_1, commands_1, instantiation_1, extensionsUtils_1, extensionManagementUtil_1, editor_1, uri_1, extensionsActivationProgress_1, errors_1, extensionsDependencyChecker_1, cancellation_1, views_1, clipboardService_1, preferences_1, contextkey_1, quickAccess_1, extensionsQuickAccess_1, extensionRecommendationsService_1, userDataSync_1, clipboard_1, editorService_1, extensionsWorkbenchService_1, actions_2, extensionRecommendations_2, extensionRecommendationNotificationService_1, extensions_3, notification_1, host_1, contextkeys_1, workspaceExtensionsConfig_1, network_1, abstractRuntimeExtensionsEditor_1, extensionEnablementWorkspaceTrustTransitionParticipant_1, extensionsIcons_1, extensions_4, lifecycle_1, types_1, configuration_1, dialogs_1, labels_1, extensionQuery_1, async_1, editor_2, workspaceTrust_1, extensionsCompletionItemsProvider_1, quickInput_1, event_1, panecomposite_1, unsupportedExtensionsMigrationContribution_1, platform_2, extensionsCleaner_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CONTEXT_HAS_WEB_SERVER = exports.CONTEXT_HAS_REMOTE_SERVER = exports.CONTEXT_HAS_LOCAL_SERVER = exports.CONTEXT_HAS_GALLERY = void 0;
    // Singletons
    (0, extensions_1.registerSingleton)(extensions_2.IExtensionsWorkbenchService, extensionsWorkbenchService_1.ExtensionsWorkbenchService);
    (0, extensions_1.registerSingleton)(extensionRecommendations_2.IExtensionRecommendationNotificationService, extensionRecommendationNotificationService_1.ExtensionRecommendationNotificationService);
    (0, extensions_1.registerSingleton)(extensionRecommendations_1.IExtensionRecommendationsService, extensionRecommendationsService_1.ExtensionRecommendationsService);
    platform_1.Registry.as(output_1.Extensions.OutputChannels)
        .registerChannel({ id: extensionManagement_1.ExtensionsChannelId, label: extensionManagement_1.ExtensionsLabel, log: false });
    // Quick Access
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: extensionsQuickAccess_1.ManageExtensionsQuickAccessProvider,
        prefix: extensionsQuickAccess_1.ManageExtensionsQuickAccessProvider.PREFIX,
        placeholder: (0, nls_1.localize)('manageExtensionsQuickAccessPlaceholder', "Press Enter to manage extensions."),
        helpEntries: [{ description: (0, nls_1.localize)('manageExtensionsHelp', "Manage Extensions"), needsEditor: false }]
    });
    // Editor
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(extensionEditor_1.ExtensionEditor, extensionEditor_1.ExtensionEditor.ID, (0, nls_1.localize)('extension', "Extension")), [
        new descriptors_1.SyncDescriptor(extensionsInput_1.ExtensionsInput)
    ]);
    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: extensions_2.VIEWLET_ID,
        title: (0, nls_1.localize)('extensions', "Extensions"),
        openCommandActionDescriptor: {
            id: extensions_2.VIEWLET_ID,
            mnemonicTitle: (0, nls_1.localize)({ key: 'miViewExtensions', comment: ['&& denotes a mnemonic'] }, "E&&xtensions"),
            keybindings: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 54 /* KeyCode.KeyX */ },
            order: 4,
        },
        ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViewlet_1.ExtensionsViewPaneContainer),
        icon: extensionsIcons_1.extensionsViewIcon,
        order: 4,
        rejectAddedViews: true,
        alwaysUseContainerInfo: true,
    }, 0 /* ViewContainerLocation.Sidebar */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'extensions',
        order: 30,
        title: (0, nls_1.localize)('extensionsConfigurationTitle', "Extensions"),
        type: 'object',
        properties: {
            'extensions.autoUpdate': {
                enum: [true, 'onlyEnabledExtensions', false,],
                enumItemLabels: [
                    (0, nls_1.localize)('all', "All Extensions"),
                    (0, nls_1.localize)('enabled', "Only Enabled Extensions"),
                    (0, nls_1.localize)('none', "None"),
                ],
                enumDescriptions: [
                    (0, nls_1.localize)('extensions.autoUpdate.true', 'Download and install updates automatically for all extensions.'),
                    (0, nls_1.localize)('extensions.autoUpdate.enabled', 'Download and install updates automatically only for enabled extensions. Disabled extensions will not be updated automatically.'),
                    (0, nls_1.localize)('extensions.autoUpdate.false', 'Extensions are not automatically updated.'),
                ],
                description: (0, nls_1.localize)('extensions.autoUpdate', "Controls the automatic update behavior of extensions. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.autoCheckUpdates': {
                type: 'boolean',
                description: (0, nls_1.localize)('extensionsCheckUpdates', "When enabled, automatically checks extensions for updates. If an extension has an update, it is marked as outdated in the Extensions view. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.ignoreRecommendations': {
                type: 'boolean',
                description: (0, nls_1.localize)('extensionsIgnoreRecommendations', "When enabled, the notifications for extension recommendations will not be shown."),
                default: false
            },
            'extensions.showRecommendationsOnlyOnDemand': {
                type: 'boolean',
                deprecationMessage: (0, nls_1.localize)('extensionsShowRecommendationsOnlyOnDemand_Deprecated', "This setting is deprecated. Use extensions.ignoreRecommendations setting to control recommendation notifications. Use Extensions view's visibility actions to hide Recommended view by default."),
                default: false,
                tags: ['usesOnlineServices']
            },
            'extensions.closeExtensionDetailsOnViewChange': {
                type: 'boolean',
                description: (0, nls_1.localize)('extensionsCloseExtensionDetailsOnViewChange', "When enabled, editors with extension details will be automatically closed upon navigating away from the Extensions View."),
                default: false
            },
            'extensions.confirmedUriHandlerExtensionIds': {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: (0, nls_1.localize)('handleUriConfirmedExtensions', "When an extension is listed here, a confirmation prompt will not be shown when that extension handles a URI."),
                default: [],
                scope: 1 /* ConfigurationScope.APPLICATION */
            },
            'extensions.webWorker': {
                type: ['boolean', 'string'],
                enum: [true, false, 'auto'],
                enumDescriptions: [
                    (0, nls_1.localize)('extensionsWebWorker.true', "The Web Worker Extension Host will always be launched."),
                    (0, nls_1.localize)('extensionsWebWorker.false', "The Web Worker Extension Host will never be launched."),
                    (0, nls_1.localize)('extensionsWebWorker.auto', "The Web Worker Extension Host will be launched when a web extension needs it."),
                ],
                description: (0, nls_1.localize)('extensionsWebWorker', "Enable web worker extension host."),
                default: 'auto'
            },
            'extensions.supportVirtualWorkspaces': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('extensions.supportVirtualWorkspaces', "Override the virtual workspaces support of an extension."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$': {
                        type: 'boolean',
                        default: false
                    }
                },
                additionalProperties: false,
                default: {},
                defaultSnippets: [{
                        'body': {
                            'pub.name': false
                        }
                    }]
            },
            'extensions.experimental.affinity': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('extensions.affinity', "Configure an extension to execute in a different extension host process."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$': {
                        type: 'integer',
                        default: 1
                    }
                },
                additionalProperties: false,
                default: {},
                defaultSnippets: [{
                        'body': {
                            'pub.name': 1
                        }
                    }]
            },
            [workspaceTrust_1.WORKSPACE_TRUST_EXTENSION_SUPPORT]: {
                type: 'object',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                markdownDescription: (0, nls_1.localize)('extensions.supportUntrustedWorkspaces', "Override the untrusted workspace support of an extension. Extensions using `true` will always be enabled. Extensions using `limited` will always be enabled, and the extension will hide functionality that requires trust. Extensions using `false` will only be enabled only when the workspace is trusted."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$': {
                        type: 'object',
                        properties: {
                            'supported': {
                                type: ['boolean', 'string'],
                                enum: [true, false, 'limited'],
                                enumDescriptions: [
                                    (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.true', "Extension will always be enabled."),
                                    (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.false', "Extension will only be enabled only when the workspace is trusted."),
                                    (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.limited', "Extension will always be enabled, and the extension will hide functionality requiring trust."),
                                ],
                                description: (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.supported', "Defines the untrusted workspace support setting for the extension."),
                            },
                            'version': {
                                type: 'string',
                                description: (0, nls_1.localize)('extensions.supportUntrustedWorkspaces.version', "Defines the version of the extension for which the override should be applied. If not specified, the override will be applied independent of the extension version."),
                            }
                        }
                    }
                }
            }
        }
    });
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(extensionsFileTemplate_1.ExtensionsConfigurationSchemaId, extensionsFileTemplate_1.ExtensionsConfigurationSchema);
    // Register Commands
    commands_1.CommandsRegistry.registerCommand('_extensions.manage', (accessor, extensionId, tab) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        const extension = extensionService.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }));
        if (extension.length === 1) {
            extensionService.open(extension[0], { tab });
        }
    });
    commands_1.CommandsRegistry.registerCommand('extension.open', async (accessor, extensionId, tab) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        const commandService = accessor.get(commands_1.ICommandService);
        const [extension] = await extensionService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None);
        if (extension) {
            return extensionService.open(extension, { tab });
        }
        return commandService.executeCommand('_extensions.manage', extensionId, tab);
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.installExtension',
        description: {
            description: (0, nls_1.localize)('workbench.extensions.installExtension.description', "Install the given extension"),
            args: [
                {
                    name: 'extensionIdOrVSIXUri',
                    description: (0, nls_1.localize)('workbench.extensions.installExtension.arg.decription', "Extension id or VSIX resource uri"),
                    constraint: (value) => typeof value === 'string' || value instanceof uri_1.URI,
                },
                {
                    name: 'options',
                    description: '(optional) Options for installing the extension. Object with the following properties: ' +
                        '`installOnlyNewlyAddedFromExtensionPackVSIX`: When enabled, VS Code installs only newly added extensions from the extension pack VSIX. This option is considered only when installing VSIX. ',
                    isOptional: true,
                    schema: {
                        'type': 'object',
                        'properties': {
                            'installOnlyNewlyAddedFromExtensionPackVSIX': {
                                'type': 'boolean',
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.installOnlyNewlyAddedFromExtensionPackVSIX', "When enabled, VS Code installs only newly added extensions from the extension pack VSIX. This option is considered only while installing a VSIX."),
                                default: false
                            },
                            'installPreReleaseVersion': {
                                'type': 'boolean',
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.installPreReleaseVersion', "When enabled, VS Code installs the pre-release version of the extension if available."),
                                default: false
                            },
                            'donotSync': {
                                'type': 'boolean',
                                'description': (0, nls_1.localize)('workbench.extensions.installExtension.option.donotSync', "When enabled, VS Code do not sync this extension when Settings Sync is on."),
                                default: false
                            }
                        }
                    }
                }
            ]
        },
        handler: async (accessor, arg, options) => {
            const extensionsWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
            try {
                if (typeof arg === 'string') {
                    const [id, version] = (0, extensionManagementUtil_1.getIdAndVersion)(arg);
                    const [extension] = await extensionsWorkbenchService.getExtensions([{ id, preRelease: options === null || options === void 0 ? void 0 : options.installPreReleaseVersion }], cancellation_1.CancellationToken.None);
                    if (extension) {
                        const installOptions = {
                            isMachineScoped: (options === null || options === void 0 ? void 0 : options.donotSync) ? true : undefined,
                            installPreReleaseVersion: options === null || options === void 0 ? void 0 : options.installPreReleaseVersion,
                            installGivenVersion: !!version
                        };
                        if (version) {
                            await extensionsWorkbenchService.installVersion(extension, version, installOptions);
                        }
                        else {
                            await extensionsWorkbenchService.install(extension, installOptions);
                        }
                    }
                    else {
                        throw new Error((0, nls_1.localize)('notFound', "Extension '{0}' not found.", arg));
                    }
                }
                else {
                    const vsix = uri_1.URI.revive(arg);
                    await extensionsWorkbenchService.install(vsix, { installOnlyNewlyAddedFromExtensionPack: options === null || options === void 0 ? void 0 : options.installOnlyNewlyAddedFromExtensionPackVSIX });
                }
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
                throw e;
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.uninstallExtension',
        description: {
            description: (0, nls_1.localize)('workbench.extensions.uninstallExtension.description', "Uninstall the given extension"),
            args: [
                {
                    name: (0, nls_1.localize)('workbench.extensions.uninstallExtension.arg.name', "Id of the extension to uninstall"),
                    schema: {
                        'type': 'string'
                    }
                }
            ]
        },
        handler: async (accessor, id) => {
            if (!id) {
                throw new Error((0, nls_1.localize)('id required', "Extension id required."));
            }
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            const installed = await extensionManagementService.getInstalled();
            const [extensionToUninstall] = installed.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
            if (!extensionToUninstall) {
                throw new Error((0, nls_1.localize)('notInstalled', "Extension '{0}' is not installed. Make sure you use the full extension ID, including the publisher, e.g.: ms-dotnettools.csharp.", id));
            }
            if (extensionToUninstall.isBuiltin) {
                throw new Error((0, nls_1.localize)('builtin', "Extension '{0}' is a Built-in extension and cannot be installed", id));
            }
            try {
                await extensionManagementService.uninstall(extensionToUninstall);
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
                throw e;
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.search',
        description: {
            description: (0, nls_1.localize)('workbench.extensions.search.description', "Search for a specific extension"),
            args: [
                {
                    name: (0, nls_1.localize)('workbench.extensions.search.arg.name', "Query to use in search"),
                    schema: { 'type': 'string' }
                }
            ]
        },
        handler: async (accessor, query = '') => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = await paneCompositeService.openPaneComposite(extensions_2.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
            if (!viewlet) {
                return;
            }
            viewlet.getViewPaneContainer().search(query);
            viewlet.focus();
        }
    });
    function overrideActionForActiveExtensionEditorWebview(command, f) {
        command === null || command === void 0 ? void 0 : command.addImplementation(105, 'extensions-editor', (accessor) => {
            var _a;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = editorService.activeEditorPane;
            if (editor instanceof extensionEditor_1.ExtensionEditor) {
                if ((_a = editor.activeWebview) === null || _a === void 0 ? void 0 : _a.isFocused) {
                    f(editor.activeWebview);
                    return true;
                }
            }
            return false;
        });
    }
    overrideActionForActiveExtensionEditorWebview(clipboard_1.CopyAction, webview => webview.copy());
    overrideActionForActiveExtensionEditorWebview(clipboard_1.CutAction, webview => webview.cut());
    overrideActionForActiveExtensionEditorWebview(clipboard_1.PasteAction, webview => webview.paste());
    // Contexts
    exports.CONTEXT_HAS_GALLERY = new contextkey_1.RawContextKey('hasGallery', false);
    exports.CONTEXT_HAS_LOCAL_SERVER = new contextkey_1.RawContextKey('hasLocalServer', false);
    exports.CONTEXT_HAS_REMOTE_SERVER = new contextkey_1.RawContextKey('hasRemoteServer', false);
    exports.CONTEXT_HAS_WEB_SERVER = new contextkey_1.RawContextKey('hasWebServer', false);
    async function runAction(action) {
        try {
            await action.run();
        }
        finally {
            action.dispose();
        }
    }
    let ExtensionsContributions = class ExtensionsContributions extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, extensionGalleryService, contextKeyService, paneCompositeService, extensionsWorkbenchService, extensionEnablementService, instantiationService, dialogService, commandService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            this.paneCompositeService = paneCompositeService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.instantiationService = instantiationService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            const hasGalleryContext = exports.CONTEXT_HAS_GALLERY.bindTo(contextKeyService);
            if (extensionGalleryService.isEnabled()) {
                hasGalleryContext.set(true);
            }
            const hasLocalServerContext = exports.CONTEXT_HAS_LOCAL_SERVER.bindTo(contextKeyService);
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                hasLocalServerContext.set(true);
            }
            const hasRemoteServerContext = exports.CONTEXT_HAS_REMOTE_SERVER.bindTo(contextKeyService);
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                hasRemoteServerContext.set(true);
            }
            const hasWebServerContext = exports.CONTEXT_HAS_WEB_SERVER.bindTo(contextKeyService);
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                hasWebServerContext.set(true);
            }
            this.registerGlobalActions();
            this.registerContextMenuActions();
            this.registerQuickAccessProvider();
        }
        registerQuickAccessProvider() {
            if (this.extensionManagementServerService.localExtensionManagementServer
                || this.extensionManagementServerService.remoteExtensionManagementServer
                || this.extensionManagementServerService.webExtensionManagementServer) {
                platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
                    ctor: extensionsQuickAccess_1.InstallExtensionQuickAccessProvider,
                    prefix: extensionsQuickAccess_1.InstallExtensionQuickAccessProvider.PREFIX,
                    placeholder: (0, nls_1.localize)('installExtensionQuickAccessPlaceholder', "Type the name of an extension to install or search."),
                    helpEntries: [{ description: (0, nls_1.localize)('installExtensionQuickAccessHelp', "Install or Search Extensions"), needsEditor: false }]
                });
            }
        }
        // Global actions
        registerGlobalActions() {
            this._register(actions_1.MenuRegistry.appendMenuItems([{
                    id: actions_1.MenuId.MenubarPreferencesMenu,
                    item: {
                        command: {
                            id: extensions_2.VIEWLET_ID,
                            title: (0, nls_1.localize)({ key: 'miPreferencesExtensions', comment: ['&& denotes a mnemonic'] }, "&&Extensions")
                        },
                        group: '1_settings',
                        order: 4
                    }
                }, {
                    id: actions_1.MenuId.GlobalActivity,
                    item: {
                        command: {
                            id: extensions_2.VIEWLET_ID,
                            title: (0, nls_1.localize)('showExtensions', "Extensions")
                        },
                        group: '2_configuration',
                        order: 3
                    }
                }]));
            this.registerExtensionAction({
                id: 'workbench.extensions.action.installExtensions',
                title: { value: (0, nls_1.localize)('installExtensions', "Install Extensions"), original: 'Install Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                },
                run: async (accessor) => {
                    accessor.get(views_1.IViewsService).openViewContainer(extensions_2.VIEWLET_ID);
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showRecommendedKeymapExtensions',
                title: { value: (0, nls_1.localize)('showRecommendedKeymapExtensionsShort', "Keymaps"), original: 'Keymaps' },
                category: extensionManagement_1.PreferencesLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: exports.CONTEXT_HAS_GALLERY
                    }, {
                        id: actions_1.MenuId.MenubarPreferencesMenu,
                        group: '2_keybindings',
                        order: 2
                    }, {
                        id: actions_1.MenuId.GlobalActivity,
                        group: '2_keybindings',
                        order: 2
                    }],
                menuTitles: {
                    [actions_1.MenuId.MenubarPreferencesMenu.id]: (0, nls_1.localize)({ key: 'miimportKeyboardShortcutsFrom', comment: ['&& denotes a mnemonic'] }, "&&Migrate Keyboard Shortcuts from..."),
                    [actions_1.MenuId.GlobalActivity.id]: (0, nls_1.localize)('importKeyboardShortcutsFroms', "Migrate Keyboard Shortcuts from...")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@recommended:keymaps '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showLanguageExtensions',
                title: { value: (0, nls_1.localize)('showLanguageExtensionsShort', "Language Extensions"), original: 'Language Extensions' },
                category: extensionManagement_1.PreferencesLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: exports.CONTEXT_HAS_GALLERY
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@recommended:languages '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.checkForUpdates',
                title: { value: (0, nls_1.localize)('checkForUpdates', "Check for Extension Updates"), original: 'Check for Extension Updates' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                        group: '1_updates',
                        order: 1
                    }],
                run: async () => {
                    await this.extensionsWorkbenchService.checkForUpdates();
                    const outdated = this.extensionsWorkbenchService.outdated;
                    if (outdated.length) {
                        return runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@outdated '));
                    }
                    else {
                        return this.dialogService.show(notification_1.Severity.Info, (0, nls_1.localize)('noUpdatesAvailable', "All extensions are up to date."));
                    }
                }
            });
            const autoUpdateExtensionsSubMenu = new actions_1.MenuId('autoUpdateExtensionsSubMenu');
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
                submenu: autoUpdateExtensionsSubMenu,
                title: (0, nls_1.localize)('configure auto updating extensions', "Auto Update Extensions"),
                when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                group: '1_updates',
                order: 5,
            });
            this.registerExtensionAction({
                id: 'configureExtensionsAutoUpdate.all',
                title: (0, nls_1.localize)('configureExtensionsAutoUpdate.all', "All Extensions"),
                toggled: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(`config.${extensions_2.AutoUpdateConfigurationKey}`), contextkey_1.ContextKeyExpr.notEquals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlyEnabledExtensions')),
                menu: [{
                        id: autoUpdateExtensionsSubMenu,
                        order: 1,
                    }],
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, true)
            });
            this.registerExtensionAction({
                id: 'configureExtensionsAutoUpdate.enabled',
                title: (0, nls_1.localize)('configureExtensionsAutoUpdate.enabled', "Only Enabled Extensions"),
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlyEnabledExtensions'),
                menu: [{
                        id: autoUpdateExtensionsSubMenu,
                        order: 2,
                    }],
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, 'onlyEnabledExtensions')
            });
            this.registerExtensionAction({
                id: 'configureExtensionsAutoUpdate.none',
                title: (0, nls_1.localize)('configureExtensionsAutoUpdate.none', "None"),
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, false),
                menu: [{
                        id: autoUpdateExtensionsSubMenu,
                        order: 3,
                    }],
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, false)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.updateAllExtensions',
                title: { value: (0, nls_1.localize)('updateAll', "Update All Extensions"), original: 'Update All Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                precondition: extensions_2.HasOutdatedExtensionsContext,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.has(`config.${extensions_2.AutoUpdateConfigurationKey}`).negate(), contextkey_1.ContextKeyExpr.equals(`config.${extensions_2.AutoUpdateConfigurationKey}`, 'onlyEnabledExtensions'))),
                        group: '1_updates',
                        order: 2
                    }],
                run: () => {
                    return Promise.all(this.extensionsWorkbenchService.outdated.map(async (extension) => {
                        var _a;
                        try {
                            await this.extensionsWorkbenchService.install(extension, ((_a = extension.local) === null || _a === void 0 ? void 0 : _a.preRelease) ? { installPreReleaseVersion: true } : undefined);
                        }
                        catch (err) {
                            runAction(this.instantiationService.createInstance(extensionsActions_1.PromptExtensionInstallFailureAction, extension, extension.latestVersion, 3 /* InstallOperation.Update */, undefined, err));
                        }
                    }));
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.disableAutoUpdate',
                title: { value: (0, nls_1.localize)('disableAutoUpdate', "Disable Auto Update for all extensions"), original: 'Disable Auto Update for all extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                f1: true,
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, false)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.enableAutoUpdate',
                title: { value: (0, nls_1.localize)('enableAutoUpdate', "Enable Auto Update for all extensions"), original: 'Enable Auto Update for all extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                f1: true,
                run: (accessor) => accessor.get(configuration_1.IConfigurationService).updateValue(extensions_2.AutoUpdateConfigurationKey, true)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.enableAll',
                title: { value: (0, nls_1.localize)('enableAll', "Enable All Extensions"), original: 'Enable All Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                        group: '2_enablement',
                        order: 1
                    }],
                run: async () => {
                    const extensionsToEnable = this.extensionsWorkbenchService.local.filter(e => !!e.local && this.extensionEnablementService.canChangeEnablement(e.local) && !this.extensionEnablementService.isEnabled(e.local));
                    if (extensionsToEnable.length) {
                        await this.extensionsWorkbenchService.setEnablement(extensionsToEnable, 8 /* EnablementState.EnabledGlobally */);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.enableAllWorkspace',
                title: { value: (0, nls_1.localize)('enableAllWorkspace', "Enable All Extensions for this Workspace"), original: 'Enable All Extensions for this Workspace' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                },
                run: async () => {
                    const extensionsToEnable = this.extensionsWorkbenchService.local.filter(e => !!e.local && this.extensionEnablementService.canChangeEnablement(e.local) && !this.extensionEnablementService.isEnabled(e.local));
                    if (extensionsToEnable.length) {
                        await this.extensionsWorkbenchService.setEnablement(extensionsToEnable, 9 /* EnablementState.EnabledWorkspace */);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.disableAll',
                title: { value: (0, nls_1.localize)('disableAll', "Disable All Installed Extensions"), original: 'Disable All Installed Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                        group: '2_enablement',
                        order: 2
                    }],
                run: async () => {
                    const extensionsToDisable = this.extensionsWorkbenchService.local.filter(e => !e.isBuiltin && !!e.local && this.extensionEnablementService.isEnabled(e.local) && this.extensionEnablementService.canChangeEnablement(e.local));
                    if (extensionsToDisable.length) {
                        await this.extensionsWorkbenchService.setEnablement(extensionsToDisable, 6 /* EnablementState.DisabledGlobally */);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.disableAllWorkspace',
                title: { value: (0, nls_1.localize)('disableAllWorkspace', "Disable All Installed Extensions for this Workspace"), original: 'Disable All Installed Extensions for this Workspace' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                },
                run: async () => {
                    const extensionsToDisable = this.extensionsWorkbenchService.local.filter(e => !e.isBuiltin && !!e.local && this.extensionEnablementService.isEnabled(e.local) && this.extensionEnablementService.canChangeEnablement(e.local));
                    if (extensionsToDisable.length) {
                        await this.extensionsWorkbenchService.setEnablement(extensionsToDisable, 7 /* EnablementState.DisabledWorkspace */);
                    }
                }
            });
            this.registerExtensionAction({
                id: extensions_2.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID,
                title: { value: (0, nls_1.localize)('InstallFromVSIX', "Install from VSIX..."), original: 'Install from VSIX...' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER)
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID), contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER)),
                        group: '3_install',
                        order: 1
                    }],
                run: async (accessor) => {
                    const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                    const commandService = accessor.get(commands_1.ICommandService);
                    const vsixPaths = await fileDialogService.showOpenDialog({
                        title: (0, nls_1.localize)('installFromVSIX', "Install from VSIX"),
                        filters: [{ name: 'VSIX Extensions', extensions: ['vsix'] }],
                        canSelectFiles: true,
                        canSelectMany: true,
                        openLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'installButton', comment: ['&& denotes a mnemonic'] }, "&&Install"))
                    });
                    if (vsixPaths) {
                        await commandService.executeCommand(extensions_2.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID, vsixPaths);
                    }
                }
            });
            this.registerExtensionAction({
                id: extensions_2.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID,
                title: (0, nls_1.localize)('installVSIX', "Install Extension VSIX"),
                menu: [{
                        id: actions_1.MenuId.ExplorerContext,
                        group: 'extensions',
                        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Extension.isEqualTo('.vsix'), contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER)),
                    }],
                run: async (accessor, resources) => {
                    const extensionService = accessor.get(extensions_3.IExtensionService);
                    const extensionsWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const hostService = accessor.get(host_1.IHostService);
                    const notificationService = accessor.get(notification_1.INotificationService);
                    const extensions = Array.isArray(resources) ? resources : [resources];
                    await async_1.Promises.settled(extensions.map(async (vsix) => await extensionsWorkbenchService.install(vsix)))
                        .then(async (extensions) => {
                        for (const extension of extensions) {
                            const requireReload = !(extension.local && extensionService.canAddExtension((0, extensions_3.toExtensionDescription)(extension.local)));
                            const message = requireReload ? (0, nls_1.localize)('InstallVSIXAction.successReload', "Completed installing {0} extension from VSIX. Please reload Visual Studio Code to enable it.", extension.displayName || extension.name)
                                : (0, nls_1.localize)('InstallVSIXAction.success', "Completed installing {0} extension from VSIX.", extension.displayName || extension.name);
                            const actions = requireReload ? [{
                                    label: (0, nls_1.localize)('InstallVSIXAction.reloadNow', "Reload Now"),
                                    run: () => hostService.reload()
                                }] : [];
                            notificationService.prompt(notification_1.Severity.Info, message, actions);
                        }
                    });
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.installWebExtensionFromLocation',
                title: { value: (0, nls_1.localize)('installWebExtensionFromLocation', "Install Web Extension..."), original: 'Install Web Extension...' },
                category: actions_2.CATEGORIES.Developer,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_WEB_SERVER)
                    }],
                run: async (accessor) => {
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const extensionManagementService = accessor.get(extensionManagement_2.IWorkbenchExtensionManagementService);
                    const disposables = new lifecycle_1.DisposableStore();
                    const quickPick = disposables.add(quickInputService.createQuickPick());
                    quickPick.title = (0, nls_1.localize)('installFromLocation', "Install Web Extension from Location");
                    quickPick.customButton = true;
                    quickPick.customLabel = (0, nls_1.localize)('install button', "Install");
                    quickPick.placeholder = (0, nls_1.localize)('installFromLocationPlaceHolder', "Location of the web extension");
                    quickPick.ignoreFocusOut = true;
                    disposables.add(event_1.Event.any(quickPick.onDidAccept, quickPick.onDidCustom)(() => {
                        quickPick.hide();
                        if (quickPick.value) {
                            extensionManagementService.installWebExtension(uri_1.URI.parse(quickPick.value));
                        }
                    }));
                    disposables.add(quickPick.onDidHide(() => disposables.dispose()));
                    quickPick.show();
                }
            });
            const extensionsFilterSubMenu = new actions_1.MenuId('extensionsFilterSubMenu');
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
                submenu: extensionsFilterSubMenu,
                title: (0, nls_1.localize)('filterExtensions', "Filter Extensions..."),
                when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                group: 'navigation',
                order: 1,
                icon: extensionsIcons_1.filterIcon,
            });
            const showFeaturedExtensionsId = 'extensions.filter.featured';
            this.registerExtensionAction({
                id: showFeaturedExtensionsId,
                title: { value: (0, nls_1.localize)('showFeaturedExtensions', "Show Featured Extensions"), original: 'Show Featured Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: exports.CONTEXT_HAS_GALLERY
                    }, {
                        id: extensionsFilterSubMenu,
                        when: exports.CONTEXT_HAS_GALLERY,
                        group: '1_predefined',
                        order: 1,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('featured filter', "Featured")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@featured '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showPopularExtensions',
                title: { value: (0, nls_1.localize)('showPopularExtensions', "Show Popular Extensions"), original: 'Show Popular Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: exports.CONTEXT_HAS_GALLERY
                    }, {
                        id: extensionsFilterSubMenu,
                        when: exports.CONTEXT_HAS_GALLERY,
                        group: '1_predefined',
                        order: 2,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('most popular filter', "Most Popular")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@popular '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showRecommendedExtensions',
                title: { value: (0, nls_1.localize)('showRecommendedExtensions', "Show Recommended Extensions"), original: 'Show Recommended Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: exports.CONTEXT_HAS_GALLERY
                    }, {
                        id: extensionsFilterSubMenu,
                        when: exports.CONTEXT_HAS_GALLERY,
                        group: '1_predefined',
                        order: 2,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('most popular recommended', "Recommended")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@recommended '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.recentlyPublishedExtensions',
                title: { value: (0, nls_1.localize)('recentlyPublishedExtensions', "Show Recently Published Extensions"), original: 'Show Recently Published Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: exports.CONTEXT_HAS_GALLERY
                    }, {
                        id: extensionsFilterSubMenu,
                        when: exports.CONTEXT_HAS_GALLERY,
                        group: '1_predefined',
                        order: 2,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('recently published filter', "Recently Published")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@sort:publishedDate '))
            });
            const extensionsCategoryFilterSubMenu = new actions_1.MenuId('extensionsCategoryFilterSubMenu');
            actions_1.MenuRegistry.appendMenuItem(extensionsFilterSubMenu, {
                submenu: extensionsCategoryFilterSubMenu,
                title: (0, nls_1.localize)('filter by category', "Category"),
                when: exports.CONTEXT_HAS_GALLERY,
                group: '2_categories',
                order: 1,
            });
            extensions_4.EXTENSION_CATEGORIES.map((category, index) => {
                this.registerExtensionAction({
                    id: `extensions.actions.searchByCategory.${category}`,
                    title: category,
                    menu: [{
                            id: extensionsCategoryFilterSubMenu,
                            when: exports.CONTEXT_HAS_GALLERY,
                            order: index,
                        }],
                    run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, `@category:"${category.toLowerCase()}"`))
                });
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.listBuiltInExtensions',
                title: { value: (0, nls_1.localize)('showBuiltInExtensions', "Show Built-in Extensions"), original: 'Show Built-in Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 1,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('builtin filter', "Built-in")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@builtin '))
            });
            this.registerExtensionAction({
                id: extensions_2.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID,
                title: { value: (0, nls_1.localize)('showWorkspaceUnsupportedExtensions', "Show Extensions Unsupported By Workspace"), original: 'Show Extensions Unsupported By Workspace' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER),
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 6,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER),
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('workspace unsupported filter', "Workspace Unsupported")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@workspaceUnsupported'))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showInstalledExtensions',
                title: { value: (0, nls_1.localize)('showInstalledExtensions', "Show Installed Extensions"), original: 'Show Installed Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 2,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('installed filter', "Installed")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@installed '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showEnabledExtensions',
                title: { value: (0, nls_1.localize)('showEnabledExtensions', "Show Enabled Extensions"), original: 'Show Enabled Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 3,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('enabled filter', "Enabled")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@enabled '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showDisabledExtensions',
                title: { value: (0, nls_1.localize)('showDisabledExtensions', "Show Disabled Extensions"), original: 'Show Disabled Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER)
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 4,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('disabled filter', "Disabled")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@disabled '))
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.listOutdatedExtensions',
                title: { value: (0, nls_1.localize)('showOutdatedExtensions', "Show Outdated Extensions"), original: 'Show Outdated Extensions' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                    }, {
                        id: extensionsFilterSubMenu,
                        group: '3_installed',
                        order: 5,
                    }],
                menuTitles: {
                    [extensionsFilterSubMenu.id]: (0, nls_1.localize)('outdated filter', "Outdated")
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, '@outdated '))
            });
            const extensionsSortSubMenu = new actions_1.MenuId('extensionsSortSubMenu');
            actions_1.MenuRegistry.appendMenuItem(extensionsFilterSubMenu, {
                submenu: extensionsSortSubMenu,
                title: (0, nls_1.localize)('sorty by', "Sort By"),
                when: exports.CONTEXT_HAS_GALLERY,
                group: '4_sort',
                order: 1,
            });
            [
                { id: 'installs', title: (0, nls_1.localize)('sort by installs', "Install Count") },
                { id: 'rating', title: (0, nls_1.localize)('sort by rating', "Rating") },
                { id: 'name', title: (0, nls_1.localize)('sort by name', "Name") },
                { id: 'publishedDate', title: (0, nls_1.localize)('sort by date', "Published Date") },
            ].map(({ id, title }, index) => {
                this.registerExtensionAction({
                    id: `extensions.sort.${id}`,
                    title,
                    precondition: extensions_2.DefaultViewsContext.toNegated(),
                    menu: [{
                            id: extensionsSortSubMenu,
                            when: exports.CONTEXT_HAS_GALLERY,
                            order: index,
                        }],
                    toggled: extensions_2.ExtensionsSortByContext.isEqualTo(id),
                    run: async () => {
                        const viewlet = await this.paneCompositeService.openPaneComposite(extensions_2.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
                        const extensionsViewPaneContainer = viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer();
                        const currentQuery = extensionQuery_1.Query.parse(extensionsViewPaneContainer.searchValue || '');
                        extensionsViewPaneContainer.search(new extensionQuery_1.Query(currentQuery.value, id, currentQuery.groupBy).toString());
                        extensionsViewPaneContainer.focus();
                    }
                });
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.clearExtensionsSearchResults',
                title: { value: (0, nls_1.localize)('clearExtensionsSearchResults', "Clear Extensions Search Results"), original: 'Clear Extensions Search Results' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                icon: extensionsIcons_1.clearSearchResultsIcon,
                f1: true,
                precondition: extensions_2.DefaultViewsContext.toNegated(),
                menu: {
                    id: actions_1.MenuId.ViewContainerTitle,
                    when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                    group: 'navigation',
                    order: 3,
                },
                run: async (accessor) => {
                    const viewPaneContainer = accessor.get(views_1.IViewsService).getActiveViewPaneContainerWithId(extensions_2.VIEWLET_ID);
                    if (viewPaneContainer) {
                        const extensionsViewPaneContainer = viewPaneContainer;
                        extensionsViewPaneContainer.search('');
                        extensionsViewPaneContainer.focus();
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.refreshExtension',
                title: { value: (0, nls_1.localize)('refreshExtension', "Refresh"), original: 'Refresh' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                icon: extensionsIcons_1.refreshIcon,
                f1: true,
                menu: {
                    id: actions_1.MenuId.ViewContainerTitle,
                    when: contextkey_1.ContextKeyExpr.equals('viewContainer', extensions_2.VIEWLET_ID),
                    group: 'navigation',
                    order: 2
                },
                run: async (accessor) => {
                    const viewPaneContainer = accessor.get(views_1.IViewsService).getActiveViewPaneContainerWithId(extensions_2.VIEWLET_ID);
                    if (viewPaneContainer) {
                        await viewPaneContainer.refresh();
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.installWorkspaceRecommendedExtensions',
                title: (0, nls_1.localize)('installWorkspaceRecommendedExtensions', "Install Workspace Recommended Extensions"),
                icon: extensionsIcons_1.installWorkspaceRecommendedIcon,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    when: contextkey_1.ContextKeyExpr.equals('view', extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID),
                    group: 'navigation',
                    order: 1
                },
                run: async (accessor) => {
                    const view = accessor.get(views_1.IViewsService).getActiveViewWithId(extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID);
                    return view.installWorkspaceRecommendations();
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.ID,
                title: extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL,
                icon: extensionsIcons_1.configureRecommendedIcon,
                menu: [{
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'),
                    }, {
                        id: actions_1.MenuId.ViewTitle,
                        when: contextkey_1.ContextKeyExpr.equals('view', extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID),
                        group: 'navigation',
                        order: 2
                    }],
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction, extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.ID, extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL))
            });
            this.registerExtensionAction({
                id: extensionsActions_1.InstallSpecificVersionOfExtensionAction.ID,
                title: { value: extensionsActions_1.InstallSpecificVersionOfExtensionAction.LABEL, original: 'Install Specific Version of Extension...' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER, exports.CONTEXT_HAS_WEB_SERVER))
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.InstallSpecificVersionOfExtensionAction, extensionsActions_1.InstallSpecificVersionOfExtensionAction.ID, extensionsActions_1.InstallSpecificVersionOfExtensionAction.LABEL))
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ReinstallAction.ID,
                title: { value: extensionsActions_1.ReinstallAction.LABEL, original: 'Reinstall Extension...' },
                category: actions_2.CATEGORIES.Developer,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(exports.CONTEXT_HAS_GALLERY, contextkey_1.ContextKeyExpr.or(exports.CONTEXT_HAS_LOCAL_SERVER, exports.CONTEXT_HAS_REMOTE_SERVER))
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.ReinstallAction, extensionsActions_1.ReinstallAction.ID, extensionsActions_1.ReinstallAction.LABEL))
            });
        }
        // Extension Context Menu
        registerContextMenuActions() {
            this.registerExtensionAction({
                id: extensionsActions_1.SetColorThemeAction.ID,
                title: extensionsActions_1.SetColorThemeAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.THEME_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasColorThemes'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.SetColorThemeAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.SetFileIconThemeAction.ID,
                title: extensionsActions_1.SetFileIconThemeAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.THEME_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasFileIconThemes'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.SetFileIconThemeAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.SetProductIconThemeAction.ID,
                title: extensionsActions_1.SetProductIconThemeAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.THEME_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasProductIconThemes'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }));
                    if (extension) {
                        const action = instantiationService.createInstance(extensionsActions_1.SetProductIconThemeAction);
                        action.extension = extension;
                        return action.run();
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showPreReleaseVersion',
                title: { value: (0, nls_1.localize)('show pre-release version', "Show Pre-Release Version"), original: 'Show Pre-Release Version' },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('inExtensionEditor'), contextkey_1.ContextKeyExpr.has('extensionHasPreReleaseVersion'), contextkey_1.ContextKeyExpr.not('showPreReleaseVersion'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = (await extensionWorkbenchService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None))[0];
                    extensionWorkbenchService.open(extension, { showPreReleaseVersion: true });
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.showReleasedVersion',
                title: { value: (0, nls_1.localize)('show released version', "Show Release Version"), original: 'Show Release Version' },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('inExtensionEditor'), contextkey_1.ContextKeyExpr.has('extensionHasPreReleaseVersion'), contextkey_1.ContextKeyExpr.has('extensionHasReleaseVersion'), contextkey_1.ContextKeyExpr.has('showPreReleaseVersion'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'))
                },
                run: async (accessor, extensionId) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = (await extensionWorkbenchService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None))[0];
                    extensionWorkbenchService.open(extension, { showPreReleaseVersion: false });
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.SwitchToPreReleaseVersionAction.ID,
                title: extensionsActions_1.SwitchToPreReleaseVersionAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.not('installedExtensionIsPreReleaseVersion'), contextkey_1.ContextKeyExpr.has('extensionHasPreReleaseVersion'), contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'))
                },
                run: async (accessor, id) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
                    if (extension) {
                        extensionWorkbenchService.open(extension, { showPreReleaseVersion: true });
                        await extensionWorkbenchService.install(extension, { installPreReleaseVersion: true });
                    }
                }
            });
            this.registerExtensionAction({
                id: extensionsActions_1.SwitchToReleasedVersionAction.ID,
                title: extensionsActions_1.SwitchToReleasedVersionAction.TITLE,
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: extensions_2.INSTALL_ACTIONS_GROUP,
                    order: 3,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('installedExtensionIsPreReleaseVersion'), contextkey_1.ContextKeyExpr.has('extensionHasPreReleaseVersion'), contextkey_1.ContextKeyExpr.has('extensionHasReleaseVersion'), contextkey_1.ContextKeyExpr.not('inExtensionEditor'), contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.not('isBuiltinExtension'))
                },
                run: async (accessor, id) => {
                    const extensionWorkbenchService = accessor.get(extensions_2.IExtensionsWorkbenchService);
                    const extension = extensionWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }));
                    if (extension) {
                        extensionWorkbenchService.open(extension, { showPreReleaseVersion: false });
                        await extensionWorkbenchService.install(extension, { installPreReleaseVersion: false });
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.copyExtension',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.copyExtension', "Copy"), original: 'Copy' },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '1_copy'
                },
                run: async (accessor, extensionId) => {
                    const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                    let extension = this.extensionsWorkbenchService.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id: extensionId }))[0]
                        || (await this.extensionsWorkbenchService.getExtensions([{ id: extensionId }], cancellation_1.CancellationToken.None))[0];
                    if (extension) {
                        const name = (0, nls_1.localize)('extensionInfoName', 'Name: {0}', extension.displayName);
                        const id = (0, nls_1.localize)('extensionInfoId', 'Id: {0}', extensionId);
                        const description = (0, nls_1.localize)('extensionInfoDescription', 'Description: {0}', extension.description);
                        const verision = (0, nls_1.localize)('extensionInfoVersion', 'Version: {0}', extension.version);
                        const publisher = (0, nls_1.localize)('extensionInfoPublisher', 'Publisher: {0}', extension.publisherDisplayName);
                        const link = extension.url ? (0, nls_1.localize)('extensionInfoVSMarketplaceLink', 'VS Marketplace Link: {0}', `${extension.url}`) : null;
                        const clipboardStr = `${name}\n${id}\n${description}\n${verision}\n${publisher}${link ? '\n' + link : ''}`;
                        await clipboardService.writeText(clipboardStr);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.copyExtensionId',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.copyExtensionId', "Copy Extension ID"), original: 'Copy Extension ID' },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '1_copy'
                },
                run: async (accessor, id) => accessor.get(clipboardService_1.IClipboardService).writeText(id)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.configure',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.configure', "Extension Settings"), original: 'Extension Settings' },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '2_configure',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('extensionStatus', 'installed'), contextkey_1.ContextKeyExpr.has('extensionHasConfiguration'))
                },
                run: async (accessor, id) => accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: `@ext:${id}` })
            });
            this.registerExtensionAction({
                id: extensions_2.TOGGLE_IGNORE_EXTENSION_ACTION_ID,
                title: { value: (0, nls_1.localize)('workbench.extensions.action.toggleIgnoreExtension', "Sync This Extension"), original: `Sync This Extension` },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '2_configure',
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_ENABLEMENT, contextkey_1.ContextKeyExpr.has('inExtensionEditor').negate())
                },
                run: async (accessor, id) => {
                    const extension = this.extensionsWorkbenchService.local.find(e => (0, extensionManagementUtil_1.areSameExtensions)({ id }, e.identifier));
                    if (extension) {
                        return this.extensionsWorkbenchService.toggleExtensionIgnoredToSync(extension);
                    }
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.ignoreRecommendation',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.ignoreRecommendation', "Ignore Recommendation"), original: `Ignore Recommendation` },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '3_recommendations',
                    when: contextkey_1.ContextKeyExpr.has('isExtensionRecommended'),
                    order: 1
                },
                run: async (accessor, id) => accessor.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService).toggleGlobalIgnoredRecommendation(id, true)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.undoIgnoredRecommendation',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.undoIgnoredRecommendation', "Undo Ignored Recommendation"), original: `Undo Ignored Recommendation` },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '3_recommendations',
                    when: contextkey_1.ContextKeyExpr.has('isUserIgnoredRecommendation'),
                    order: 1
                },
                run: async (accessor, id) => accessor.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService).toggleGlobalIgnoredRecommendation(id, false)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addExtensionToWorkspaceRecommendations',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.addExtensionToWorkspaceRecommendations', "Add to Workspace Recommendations"), original: `Add to Workspace Recommendations` },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '3_recommendations',
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.has('isBuiltinExtension').negate(), contextkey_1.ContextKeyExpr.has('isExtensionWorkspaceRecommended').negate(), contextkey_1.ContextKeyExpr.has('isUserIgnoredRecommendation').negate()),
                    order: 2
                },
                run: (accessor, id) => accessor.get(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService).toggleRecommendation(id)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.removeExtensionFromWorkspaceRecommendations',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.removeExtensionFromWorkspaceRecommendations', "Remove from Workspace Recommendations"), original: `Remove from Workspace Recommendations` },
                menu: {
                    id: actions_1.MenuId.ExtensionContext,
                    group: '3_recommendations',
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.has('isBuiltinExtension').negate(), contextkey_1.ContextKeyExpr.has('isExtensionWorkspaceRecommended')),
                    order: 2
                },
                run: (accessor, id) => accessor.get(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService).toggleRecommendation(id)
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addToWorkspaceRecommendations',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.addToWorkspaceRecommendations', "Add Extension to Workspace Recommendations"), original: `Add Extension to Workspace Recommendations` },
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.extension)),
                },
                async run(accessor) {
                    const editorService = accessor.get(editorService_1.IEditorService);
                    const workspaceExtensionsConfigService = accessor.get(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService);
                    if (!(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput)) {
                        return;
                    }
                    const extensionId = editorService.activeEditor.extension.identifier.id.toLowerCase();
                    const recommendations = await workspaceExtensionsConfigService.getRecommendations();
                    if (recommendations.includes(extensionId)) {
                        return;
                    }
                    await workspaceExtensionsConfigService.toggleRecommendation(extensionId);
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addToWorkspaceFolderRecommendations',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.addToWorkspaceFolderRecommendations', "Add Extension to Workspace Folder Recommendations"), original: `Add Extension to Workspace Folder Recommendations` },
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('folder'), contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.extension)),
                },
                run: () => this.commandService.executeCommand('workbench.extensions.action.addToWorkspaceRecommendations')
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addToWorkspaceIgnoredRecommendations',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.addToWorkspaceIgnoredRecommendations', "Add Extension to Workspace Ignored Recommendations"), original: `Add Extension to Workspace Ignored Recommendations` },
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.extension)),
                },
                async run(accessor) {
                    const editorService = accessor.get(editorService_1.IEditorService);
                    const workspaceExtensionsConfigService = accessor.get(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService);
                    if (!(editorService.activeEditor instanceof extensionsInput_1.ExtensionsInput)) {
                        return;
                    }
                    const extensionId = editorService.activeEditor.extension.identifier.id.toLowerCase();
                    const unwantedRecommendations = await workspaceExtensionsConfigService.getUnwantedRecommendations();
                    if (unwantedRecommendations.includes(extensionId)) {
                        return;
                    }
                    await workspaceExtensionsConfigService.toggleUnwantedRecommendation(extensionId);
                }
            });
            this.registerExtensionAction({
                id: 'workbench.extensions.action.addToWorkspaceFolderIgnoredRecommendations',
                title: { value: (0, nls_1.localize)('workbench.extensions.action.addToWorkspaceFolderIgnoredRecommendations', "Add Extension to Workspace Folder Ignored Recommendations"), original: `Add Extension to Workspace Folder Ignored Recommendations` },
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('folder'), contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.extension)),
                },
                run: () => this.commandService.executeCommand('workbench.extensions.action.addToWorkspaceIgnoredRecommendations')
            });
            this.registerExtensionAction({
                id: extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction.ID,
                title: { value: extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction.LABEL, original: 'Configure Recommended Extensions (Workspace)' },
                category: (0, nls_1.localize)('extensions', "Extensions"),
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'),
                },
                run: () => runAction(this.instantiationService.createInstance(extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction, extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction.ID, extensionsActions_1.ConfigureWorkspaceRecommendedExtensionsAction.LABEL))
            });
        }
        registerExtensionAction(extensionActionOptions) {
            const menus = extensionActionOptions.menu ? (0, types_1.isArray)(extensionActionOptions.menu) ? extensionActionOptions.menu : [extensionActionOptions.menu] : [];
            let menusWithOutTitles = [];
            const menusWithTitles = [];
            if (extensionActionOptions.menuTitles) {
                for (let index = 0; index < menus.length; index++) {
                    const menu = menus[index];
                    const menuTitle = extensionActionOptions.menuTitles[menu.id.id];
                    if (menuTitle) {
                        menusWithTitles.push({ id: menu.id, item: Object.assign(Object.assign({}, menu), { command: { id: extensionActionOptions.id, title: menuTitle } }) });
                    }
                    else {
                        menusWithOutTitles.push(menu);
                    }
                }
            }
            else {
                menusWithOutTitles = menus;
            }
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super(Object.assign(Object.assign({}, extensionActionOptions), { menu: menusWithOutTitles }));
                }
                run(accessor, ...args) {
                    return extensionActionOptions.run(accessor, ...args);
                }
            }));
            if (menusWithTitles.length) {
                disposables.add(actions_1.MenuRegistry.appendMenuItems(menusWithTitles));
            }
            return disposables;
        }
    };
    ExtensionsContributions = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, panecomposite_1.IPaneCompositePartService),
        __param(4, extensions_2.IExtensionsWorkbenchService),
        __param(5, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, commands_1.ICommandService)
    ], ExtensionsContributions);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ExtensionsContributions, 1 /* LifecyclePhase.Starting */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.StatusUpdater, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.MaliciousExtensionChecker, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsUtils_1.KeymapExtensions, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.ExtensionsViewletViewsContribution, 1 /* LifecyclePhase.Starting */);
    workbenchRegistry.registerWorkbenchContribution(extensionsActivationProgress_1.ExtensionActivationProgress, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsDependencyChecker_1.ExtensionDependencyChecker, 4 /* LifecyclePhase.Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionEnablementWorkspaceTrustTransitionParticipant_1.ExtensionEnablementWorkspaceTrustTransitionParticipant, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsCompletionItemsProvider_1.ExtensionsCompletionItemsProvider, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(unsupportedExtensionsMigrationContribution_1.UnsupportedExtensionsMigrationContrib, 4 /* LifecyclePhase.Eventually */);
    if (platform_2.isWeb) {
        workbenchRegistry.registerWorkbenchContribution(extensionsCleaner_1.ExtensionsCleaner, 4 /* LifecyclePhase.Eventually */);
    }
    // Running Extensions
    (0, actions_1.registerAction2)(abstractRuntimeExtensionsEditor_1.ShowRuntimeExtensionsAction);
});
//# sourceMappingURL=extensions.contribution.js.map