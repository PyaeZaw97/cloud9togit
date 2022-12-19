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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/editor", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedInput", "vs/workbench/common/contributions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/editor/common/editor", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/platform", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/welcomeGettingStarted/browser/startupPage", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedIcons"], function (require, exports, nls_1, gettingStarted_1, platform_1, editor_1, actions_1, instantiation_1, contextkey_1, editorService_1, editor_2, descriptors_1, gettingStartedService_1, gettingStartedInput_1, contributions_1, configurationRegistry_1, configuration_1, editorGroupsService_1, editor_3, commands_1, quickInput_1, remoteAgentService_1, platform_2, extensionManagement_1, extensions_1, startupPage_1, icons) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacePlatform = exports.icons = void 0;
    exports.icons = icons;
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openWalkthrough',
                title: { value: (0, nls_1.localize)('miGetStarted', "Get Started"), original: 'Get Started' },
                category: (0, nls_1.localize)('help', "Help"),
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '1_welcome',
                    order: 1,
                }
            });
        }
        run(accessor, walkthroughID, toSide) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (walkthroughID) {
                const selectedCategory = typeof walkthroughID === 'string' ? walkthroughID : walkthroughID.category;
                const selectedStep = typeof walkthroughID === 'string' ? undefined : walkthroughID.step;
                // Try first to select the walkthrough on an active welcome page with no selected walkthrough
                for (const group of editorGroupsService.groups) {
                    if (group.activeEditor instanceof gettingStartedInput_1.GettingStartedInput) {
                        if (!group.activeEditor.selectedCategory) {
                            group.activeEditorPane.makeCategoryVisibleWhenAvailable(selectedCategory, selectedStep);
                            return;
                        }
                    }
                }
                // Otherwise, try to find a welcome input somewhere with no selected walkthrough, and open it to this one.
                const result = editorService.findEditors({ typeId: gettingStartedInput_1.GettingStartedInput.ID, editorId: undefined, resource: gettingStartedInput_1.GettingStartedInput.RESOURCE });
                for (const { editor, groupId } of result) {
                    if (editor instanceof gettingStartedInput_1.GettingStartedInput) {
                        if (!editor.selectedCategory) {
                            editor.selectedCategory = selectedCategory;
                            editor.selectedStep = selectedStep;
                            editorService.openEditor(editor, { revealIfOpened: true, override: editor_3.EditorResolution.DISABLED }, groupId);
                            return;
                        }
                    }
                }
                // Otherwise, just make a new one.
                editorService.openEditor(instantiationService.createInstance(gettingStartedInput_1.GettingStartedInput, { selectedCategory: selectedCategory, selectedStep: selectedStep }), {}, toSide ? editorService_1.SIDE_GROUP : undefined);
            }
            else {
                editorService.openEditor(new gettingStartedInput_1.GettingStartedInput({}), {});
            }
        }
    });
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(gettingStartedInput_1.GettingStartedInput.ID, gettingStarted_1.GettingStartedInputSerializer);
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(gettingStarted_1.GettingStartedPage, gettingStarted_1.GettingStartedPage.ID, (0, nls_1.localize)('getStarted', "Get Started")), [
        new descriptors_1.SyncDescriptor(gettingStartedInput_1.GettingStartedInput)
    ]);
    const category = (0, nls_1.localize)('getStarted', "Get Started");
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.goBack',
                title: { value: (0, nls_1.localize)('welcome.goBack', "Go Back"), original: 'Go Back' },
                category,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                    when: gettingStarted_1.inWelcomeContext
                },
                precondition: contextkey_1.ContextKeyExpr.equals('activeEditor', 'gettingStartedPage'),
                f1: true
            });
        }
        run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorPane = editorService.activeEditorPane;
            if (editorPane instanceof gettingStarted_1.GettingStartedPage) {
                editorPane.escape();
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'walkthroughs.selectStep',
        handler: (accessor, stepID) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorPane = editorService.activeEditorPane;
            if (editorPane instanceof gettingStarted_1.GettingStartedPage) {
                editorPane.selectStepLoose(stepID);
            }
            else {
                console.error('Cannot run walkthroughs.selectStep outside of walkthrough context');
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.markStepComplete',
                title: (0, nls_1.localize)('welcome.markStepComplete', "Mark Step Complete"),
                category,
            });
        }
        run(accessor, arg) {
            if (!arg) {
                return;
            }
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            gettingStartedService.progressStep(arg);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.markStepIncomplete',
                title: (0, nls_1.localize)('welcome.markStepInomplete', "Mark Step Incomplete"),
                category,
            });
        }
        run(accessor, arg) {
            if (!arg) {
                return;
            }
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            gettingStartedService.deprogressStep(arg);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'welcome.showAllWalkthroughs',
                title: { value: (0, nls_1.localize)('welcome.showAllWalkthroughs', "Open Walkthrough..."), original: 'Open Walkthrough...' },
                category,
                f1: true,
            });
        }
        getQuickPickItems(contextService, gettingStartedService) {
            const categories = gettingStartedService.getWalkthroughs();
            return categories
                .filter(c => contextService.contextMatchesRules(c.when))
                .map(x => ({
                id: x.id,
                label: x.title,
                detail: x.description,
                description: x.source,
            }));
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            const contextService = accessor.get(contextkey_1.IContextKeyService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const gettingStartedService = accessor.get(gettingStartedService_1.IWalkthroughsService);
            const extensionService = accessor.get(extensions_1.IExtensionService);
            const quickPick = quickInputService.createQuickPick();
            quickPick.canSelectMany = false;
            quickPick.matchOnDescription = true;
            quickPick.matchOnDetail = true;
            quickPick.title = (0, nls_1.localize)('pickWalkthroughs', "Open Walkthrough...");
            quickPick.items = this.getQuickPickItems(contextService, gettingStartedService);
            quickPick.busy = true;
            quickPick.onDidAccept(() => {
                const selection = quickPick.selectedItems[0];
                if (selection) {
                    commandService.executeCommand('workbench.action.openWalkthrough', selection.id);
                }
                quickPick.hide();
            });
            quickPick.onDidHide(() => quickPick.dispose());
            quickPick.show();
            await extensionService.whenInstalledExtensionsRegistered();
            quickPick.busy = false;
            await gettingStartedService.installedExtensionsRegistered;
            quickPick.items = this.getQuickPickItems(contextService, gettingStartedService);
        }
    });
    exports.WorkspacePlatform = new contextkey_1.RawContextKey('workspacePlatform', undefined, (0, nls_1.localize)('workspacePlatform', "The platform of the current workspace, which in remote or serverless contexts may be different from the platform of the UI"));
    let WorkspacePlatformContribution = class WorkspacePlatformContribution {
        constructor(extensionManagementServerService, remoteAgentService, contextService) {
            this.extensionManagementServerService = extensionManagementServerService;
            this.remoteAgentService = remoteAgentService;
            this.contextService = contextService;
            this.remoteAgentService.getEnvironment().then(env => {
                const remoteOS = env === null || env === void 0 ? void 0 : env.os;
                const remotePlatform = remoteOS === 2 /* OS.Macintosh */ ? 'mac'
                    : remoteOS === 1 /* OS.Windows */ ? 'windows'
                        : remoteOS === 3 /* OS.Linux */ ? 'linux'
                            : undefined;
                if (remotePlatform) {
                    exports.WorkspacePlatform.bindTo(this.contextService).set(remotePlatform);
                }
                else if (this.extensionManagementServerService.localExtensionManagementServer) {
                    if (platform_2.isMacintosh) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('mac');
                    }
                    else if (platform_2.isLinux) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('linux');
                    }
                    else if (platform_2.isWindows) {
                        exports.WorkspacePlatform.bindTo(this.contextService).set('windows');
                    }
                }
                else if (this.extensionManagementServerService.webExtensionManagementServer) {
                    exports.WorkspacePlatform.bindTo(this.contextService).set('webworker');
                }
                else {
                    console.error('Error: Unable to detect workspace platform');
                }
            });
        }
    };
    WorkspacePlatformContribution = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementServerService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, contextkey_1.IContextKeyService)
    ], WorkspacePlatformContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WorkspacePlatformContribution, 3 /* LifecyclePhase.Restored */);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration(Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
            'workbench.welcomePage.walkthroughs.openOnInstall': {
                scope: 2 /* ConfigurationScope.MACHINE */,
                type: 'boolean',
                default: true,
                description: (0, nls_1.localize)('workbench.welcomePage.walkthroughs.openOnInstall', "When enabled, an extension's walkthrough will open upon install of the extension.")
            },
            'workbench.welcomePage.experimental.videoTutorials': {
                scope: 2 /* ConfigurationScope.MACHINE */,
                type: 'string',
                enum: [
                    'off',
                    'on',
                    'experimental'
                ],
                tags: ['experimental'],
                default: 'off',
                description: (0, nls_1.localize)('workbench.welcomePage.videoTutorials', "When enabled, the get started page has additional links to video tutorials.")
            },
            'workbench.startupEditor': {
                'scope': 4 /* ConfigurationScope.RESOURCE */,
                'type': 'string',
                'enum': ['none', 'welcomePage', 'readme', 'newUntitledFile', 'welcomePageInEmptyWorkbench'],
                'enumDescriptions': [
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.none' }, "Start without an editor."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePage' }, "Open the Welcome page, with content to aid in getting started with VS Code and extensions."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.readme' }, "Open the README when opening a folder that contains one, fallback to 'welcomePage' otherwise. Note: This is only observed as a global configuration, it will be ignored if set in a workspace or folder configuration."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.newUntitledFile' }, "Open a new untitled file (only applies when opening an empty window)."),
                    (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'workbench.startupEditor.welcomePageInEmptyWorkbench' }, "Open the Welcome page when opening an empty workbench."),
                ],
                'default': 'welcomePage',
                'description': (0, nls_1.localize)('workbench.startupEditor', "Controls which editor is shown at startup, if none are restored from the previous session.")
            },
            'workbench.welcomePage.preferReducedMotion': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'boolean',
                default: false,
                deprecationMessage: (0, nls_1.localize)('deprecationMessage', "Deprecated, use the global `workbench.reduceMotion`."),
                description: (0, nls_1.localize)('workbench.welcomePage.preferReducedMotion', "When enabled, reduce motion in welcome page.")
            }
        } }));
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(startupPage_1.StartupPageContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=gettingStarted.contribution.js.map