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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/label/common/label", "vs/base/common/platform", "vs/base/common/network", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/workbench/services/output/common/output", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/platform/configuration/common/configurationRegistry", "vs/platform/files/common/files", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/telemetry/common/telemetry", "vs/platform/remote/common/remoteHosts"], function (require, exports, contributions_1, platform_1, label_1, platform_2, network_1, remoteAgentService_1, log_1, logIpc_1, output_1, nls_1, resources_1, lifecycle_1, configurationRegistry_1, files_1, dialogs_1, environmentService_1, workspace_1, arrays_1, actions_1, actions_2, remoteAgentConnection_1, telemetry_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelContribution = void 0;
    let LabelContribution = class LabelContribution {
        constructor(labelService, remoteAgentService) {
            this.labelService = labelService;
            this.remoteAgentService = remoteAgentService;
            this.registerFormatters();
        }
        registerFormatters() {
            this.remoteAgentService.getEnvironment().then(remoteEnvironment => {
                const os = (remoteEnvironment === null || remoteEnvironment === void 0 ? void 0 : remoteEnvironment.os) || platform_2.OS;
                const formatting = {
                    label: '${path}',
                    separator: os === 1 /* OperatingSystem.Windows */ ? '\\' : '/',
                    tildify: os !== 1 /* OperatingSystem.Windows */,
                    normalizeDriveLetter: os === 1 /* OperatingSystem.Windows */,
                    workspaceSuffix: platform_2.isWeb ? undefined : network_1.Schemas.vscodeRemote
                };
                this.labelService.registerFormatter({
                    scheme: network_1.Schemas.vscodeRemote,
                    formatting
                });
                if (remoteEnvironment) {
                    this.labelService.registerFormatter({
                        scheme: network_1.Schemas.vscodeUserData,
                        formatting
                    });
                }
            });
        }
    };
    LabelContribution = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, remoteAgentService_1.IRemoteAgentService)
    ], LabelContribution);
    exports.LabelContribution = LabelContribution;
    let RemoteChannelsContribution = class RemoteChannelsContribution extends lifecycle_1.Disposable {
        constructor(logService, remoteAgentService) {
            super();
            const updateRemoteLogLevel = () => {
                const connection = remoteAgentService.getConnection();
                if (!connection) {
                    return;
                }
                connection.withChannel('logger', (channel) => logIpc_1.LogLevelChannelClient.setLevel(channel, logService.getLevel()));
            };
            updateRemoteLogLevel();
            this._register(logService.onDidChangeLogLevel(updateRemoteLogLevel));
        }
    };
    RemoteChannelsContribution = __decorate([
        __param(0, log_1.ILogService),
        __param(1, remoteAgentService_1.IRemoteAgentService)
    ], RemoteChannelsContribution);
    let RemoteLogOutputChannels = class RemoteLogOutputChannels {
        constructor(remoteAgentService) {
            remoteAgentService.getEnvironment().then(remoteEnv => {
                if (remoteEnv) {
                    const outputChannelRegistry = platform_1.Registry.as(output_1.Extensions.OutputChannels);
                    outputChannelRegistry.registerChannel({ id: 'remoteExtensionLog', label: (0, nls_1.localize)('remoteExtensionLog', "Remote Server"), file: (0, resources_1.joinPath)(remoteEnv.logsPath, `${remoteAgentService_1.RemoteExtensionLogFileName}.log`), log: true });
                }
            });
        }
    };
    RemoteLogOutputChannels = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService)
    ], RemoteLogOutputChannels);
    let RemoteInvalidWorkspaceDetector = class RemoteInvalidWorkspaceDetector extends lifecycle_1.Disposable {
        constructor(fileService, dialogService, environmentService, contextService, fileDialogService, remoteAgentService) {
            super();
            this.fileService = fileService;
            this.dialogService = dialogService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.fileDialogService = fileDialogService;
            // When connected to a remote workspace, we currently cannot
            // validate that the workspace exists before actually opening
            // it. As such, we need to check on that after startup and guide
            // the user to a valid workspace.
            // (see https://github.com/microsoft/vscode/issues/133872)
            if (this.environmentService.remoteAuthority) {
                remoteAgentService.getEnvironment().then(remoteEnv => {
                    if (remoteEnv) {
                        // we use the presence of `remoteEnv` to figure out
                        // if we got a healthy remote connection
                        // (see https://github.com/microsoft/vscode/issues/135331)
                        this.validateRemoteWorkspace();
                    }
                });
            }
        }
        async validateRemoteWorkspace() {
            var _a, _b;
            const workspace = this.contextService.getWorkspace();
            const workspaceUriToStat = (_a = workspace.configuration) !== null && _a !== void 0 ? _a : (_b = (0, arrays_1.firstOrDefault)(workspace.folders)) === null || _b === void 0 ? void 0 : _b.uri;
            if (!workspaceUriToStat) {
                return; // only when in workspace
            }
            const exists = await this.fileService.exists(workspaceUriToStat);
            if (exists) {
                return; // all good!
            }
            const res = await this.dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('invalidWorkspaceMessage', "Workspace does not exist"),
                detail: (0, nls_1.localize)('invalidWorkspaceDetail', "The workspace does not exist. Please select another workspace to open."),
                primaryButton: (0, nls_1.localize)('invalidWorkspacePrimary', "&&Open Workspace..."),
                secondaryButton: (0, nls_1.localize)('invalidWorkspaceCancel', "&&Cancel")
            });
            if (res.confirmed) {
                // Pick Workspace
                if (workspace.configuration) {
                    return this.fileDialogService.pickWorkspaceAndOpen({});
                }
                // Pick Folder
                return this.fileDialogService.pickFolderAndOpen({});
            }
        }
    };
    RemoteInvalidWorkspaceDetector = __decorate([
        __param(0, files_1.IFileService),
        __param(1, dialogs_1.IDialogService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, remoteAgentService_1.IRemoteAgentService)
    ], RemoteInvalidWorkspaceDetector);
    let InitialRemoteConnectionHealthContribution = class InitialRemoteConnectionHealthContribution {
        constructor(_remoteAgentService, _environmentService, _telemetryService) {
            this._remoteAgentService = _remoteAgentService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            if (this._environmentService.remoteAuthority) {
                this._checkInitialRemoteConnectionHealth();
            }
        }
        async _checkInitialRemoteConnectionHealth() {
            try {
                await this._remoteAgentService.getRawEnvironment();
                this._telemetryService.publicLog2('remoteConnectionSuccess', {
                    web: platform_2.isWeb,
                    remoteName: (0, remoteHosts_1.getRemoteName)(this._environmentService.remoteAuthority)
                });
            }
            catch (err) {
                this._telemetryService.publicLog2('remoteConnectionFailure', {
                    web: platform_2.isWeb,
                    remoteName: (0, remoteHosts_1.getRemoteName)(this._environmentService.remoteAuthority),
                    message: err ? err.message : ''
                });
            }
        }
    };
    InitialRemoteConnectionHealthContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, telemetry_1.ITelemetryService)
    ], InitialRemoteConnectionHealthContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(LabelContribution, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteChannelsContribution, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteInvalidWorkspaceDetector, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteLogOutputChannels, 3 /* LifecyclePhase.Restored */);
    workbenchContributionsRegistry.registerWorkbenchContribution(InitialRemoteConnectionHealthContribution, 2 /* LifecyclePhase.Ready */);
    const enableDiagnostics = true;
    if (enableDiagnostics) {
        class TriggerReconnectAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.triggerReconnect',
                    title: { value: (0, nls_1.localize)('triggerReconnect', "Connection: Trigger Reconnect"), original: 'Connection: Trigger Reconnect' },
                    category: actions_2.CATEGORIES.Developer,
                    f1: true,
                });
            }
            async run(accessor) {
                remoteAgentConnection_1.PersistentConnection.debugTriggerReconnection();
            }
        }
        class PauseSocketWriting extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.pauseSocketWriting',
                    title: { value: (0, nls_1.localize)('pauseSocketWriting', "Connection: Pause socket writing"), original: 'Connection: Pause socket writing' },
                    category: actions_2.CATEGORIES.Developer,
                    f1: true,
                });
            }
            async run(accessor) {
                remoteAgentConnection_1.PersistentConnection.debugPauseSocketWriting();
            }
        }
        (0, actions_1.registerAction2)(TriggerReconnectAction);
        (0, actions_1.registerAction2)(PauseSocketWriting);
    }
    const extensionKindSchema = {
        type: 'string',
        enum: [
            'ui',
            'workspace'
        ],
        enumDescriptions: [
            (0, nls_1.localize)('ui', "UI extension kind. In a remote window, such extensions are enabled only when available on the local machine."),
            (0, nls_1.localize)('workspace', "Workspace extension kind. In a remote window, such extensions are enabled only when available on the remote.")
        ],
    };
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'remote',
        title: (0, nls_1.localize)('remote', "Remote"),
        type: 'object',
        properties: {
            'remote.extensionKind': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('remote.extensionKind', "Override the kind of an extension. `ui` extensions are installed and run on the local machine while `workspace` extensions are run on the remote. By overriding an extension's default kind using this setting, you specify if that extension should be installed and enabled locally or remotely."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$': {
                        oneOf: [{ type: 'array', items: extensionKindSchema }, extensionKindSchema],
                        default: ['ui'],
                    },
                },
                default: {
                    'pub.name': ['ui']
                }
            },
            'remote.restoreForwardedPorts': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('remote.restoreForwardedPorts', "Restores the ports you forwarded in a workspace."),
                default: true
            },
            'remote.autoForwardPorts': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('remote.autoForwardPorts', "When enabled, new running processes are detected and ports that they listen on are automatically forwarded. Disabling this setting will not prevent all ports from being forwarded. Even when disabled, extensions will still be able to cause ports to be forwarded, and opening some URLs will still cause ports to forwarded."),
                default: true
            },
            'remote.autoForwardPortsSource': {
                type: 'string',
                markdownDescription: (0, nls_1.localize)('remote.autoForwardPortsSource', "Sets the source from which ports are automatically forwarded when `remote.autoForwardPorts` is true. On Windows and Mac remotes, the `process` option has no effect and `output` will be used. Requires a reload to take effect."),
                enum: ['process', 'output'],
                enumDescriptions: [
                    (0, nls_1.localize)('remote.autoForwardPortsSource.process', "Ports will be automatically forwarded when discovered by watching for processes that are started and include a port."),
                    (0, nls_1.localize)('remote.autoForwardPortsSource.output', "Ports will be automatically forwarded when discovered by reading terminal and debug output. Not all processes that use ports will print to the integrated terminal or debug console, so some ports will be missed. Ports forwarded based on output will not be \"un-forwarded\" until reload or until the port is closed by the user in the Ports view.")
                ],
                default: 'process'
            },
            // Consider making changes to extensions\configuration-editing\schemas\devContainer.schema.src.json
            // and extensions\configuration-editing\schemas\attachContainer.schema.json
            // to keep in sync with devcontainer.json schema.
            'remote.portsAttributes': {
                type: 'object',
                patternProperties: {
                    '(^\\d+(-\\d+)?$)|(.+)': {
                        type: 'object',
                        description: (0, nls_1.localize)('remote.portsAttributes.port', "A port, range of ports (ex. \"40000-55000\"), host and port (ex. \"db:1234\"), or regular expression (ex. \".+\\\\/server.js\").  For a port number or range, the attributes will apply to that port number or range of port numbers. Attributes which use a regular expression will apply to ports whose associated process command line matches the expression."),
                        properties: {
                            'onAutoForward': {
                                type: 'string',
                                enum: ['notify', 'openBrowser', 'openBrowserOnce', 'openPreview', 'silent', 'ignore'],
                                enumDescriptions: [
                                    (0, nls_1.localize)('remote.portsAttributes.notify', "Shows a notification when a port is automatically forwarded."),
                                    (0, nls_1.localize)('remote.portsAttributes.openBrowser', "Opens the browser when the port is automatically forwarded. Depending on your settings, this could open an embedded browser."),
                                    (0, nls_1.localize)('remote.portsAttributes.openBrowserOnce', "Opens the browser when the port is automatically forwarded, but only the first time the port is forward during a session. Depending on your settings, this could open an embedded browser."),
                                    (0, nls_1.localize)('remote.portsAttributes.openPreview', "Opens a preview in the same window when the port is automatically forwarded."),
                                    (0, nls_1.localize)('remote.portsAttributes.silent', "Shows no notification and takes no action when this port is automatically forwarded."),
                                    (0, nls_1.localize)('remote.portsAttributes.ignore', "This port will not be automatically forwarded.")
                                ],
                                description: (0, nls_1.localize)('remote.portsAttributes.onForward', "Defines the action that occurs when the port is discovered for automatic forwarding"),
                                default: 'notify'
                            },
                            'elevateIfNeeded': {
                                type: 'boolean',
                                description: (0, nls_1.localize)('remote.portsAttributes.elevateIfNeeded', "Automatically prompt for elevation (if needed) when this port is forwarded. Elevate is required if the local port is a privileged port."),
                                default: false
                            },
                            'label': {
                                type: 'string',
                                description: (0, nls_1.localize)('remote.portsAttributes.label', "Label that will be shown in the UI for this port."),
                                default: (0, nls_1.localize)('remote.portsAttributes.labelDefault', "Application")
                            },
                            'requireLocalPort': {
                                type: 'boolean',
                                markdownDescription: (0, nls_1.localize)('remote.portsAttributes.requireLocalPort', "When true, a modal dialog will show if the chosen local port isn't used for forwarding."),
                                default: false
                            },
                            'protocol': {
                                type: 'string',
                                enum: ['http', 'https'],
                                description: (0, nls_1.localize)('remote.portsAttributes.protocol', "The protocol to use when forwarding this port.")
                            }
                        },
                        default: {
                            'label': (0, nls_1.localize)('remote.portsAttributes.labelDefault', "Application"),
                            'onAutoForward': 'notify'
                        }
                    }
                },
                markdownDescription: (0, nls_1.localize)('remote.portsAttributes', "Set properties that are applied when a specific port number is forwarded. For example:\n\n```\n\"3000\": {\n  \"label\": \"Application\"\n},\n\"40000-55000\": {\n  \"onAutoForward\": \"ignore\"\n},\n\".+\\\\/server.js\": {\n \"onAutoForward\": \"openPreview\"\n}\n```"),
                defaultSnippets: [{ body: { '${1:3000}': { label: '${2:Application}', onAutoForward: 'openPreview' } } }],
                errorMessage: (0, nls_1.localize)('remote.portsAttributes.patternError', "Must be a port number, range of port numbers, or regular expression."),
                additionalProperties: false,
                default: {
                    '443': {
                        'protocol': 'https'
                    },
                    '8443': {
                        'protocol': 'https'
                    }
                }
            },
            'remote.otherPortsAttributes': {
                type: 'object',
                properties: {
                    'onAutoForward': {
                        type: 'string',
                        enum: ['notify', 'openBrowser', 'openPreview', 'silent', 'ignore'],
                        enumDescriptions: [
                            (0, nls_1.localize)('remote.portsAttributes.notify', "Shows a notification when a port is automatically forwarded."),
                            (0, nls_1.localize)('remote.portsAttributes.openBrowser', "Opens the browser when the port is automatically forwarded. Depending on your settings, this could open an embedded browser."),
                            (0, nls_1.localize)('remote.portsAttributes.openPreview', "Opens a preview in the same window when the port is automatically forwarded."),
                            (0, nls_1.localize)('remote.portsAttributes.silent', "Shows no notification and takes no action when this port is automatically forwarded."),
                            (0, nls_1.localize)('remote.portsAttributes.ignore', "This port will not be automatically forwarded.")
                        ],
                        description: (0, nls_1.localize)('remote.portsAttributes.onForward', "Defines the action that occurs when the port is discovered for automatic forwarding"),
                        default: 'notify'
                    },
                    'elevateIfNeeded': {
                        type: 'boolean',
                        description: (0, nls_1.localize)('remote.portsAttributes.elevateIfNeeded', "Automatically prompt for elevation (if needed) when this port is forwarded. Elevate is required if the local port is a privileged port."),
                        default: false
                    },
                    'label': {
                        type: 'string',
                        description: (0, nls_1.localize)('remote.portsAttributes.label', "Label that will be shown in the UI for this port."),
                        default: (0, nls_1.localize)('remote.portsAttributes.labelDefault', "Application")
                    },
                    'requireLocalPort': {
                        type: 'boolean',
                        markdownDescription: (0, nls_1.localize)('remote.portsAttributes.requireLocalPort', "When true, a modal dialog will show if the chosen local port isn't used for forwarding."),
                        default: false
                    },
                    'protocol': {
                        type: 'string',
                        enum: ['http', 'https'],
                        description: (0, nls_1.localize)('remote.portsAttributes.protocol', "The protocol to use when forwarding this port.")
                    }
                },
                defaultSnippets: [{ body: { onAutoForward: 'ignore' } }],
                markdownDescription: (0, nls_1.localize)('remote.portsAttributes.defaults', "Set default properties that are applied to all ports that don't get properties from the setting `remote.portsAttributes`. For example:\n\n```\n{\n  \"onAutoForward\": \"ignore\"\n}\n```"),
                additionalProperties: false
            },
            'remote.localPortHost': {
                type: 'string',
                enum: ['localhost', 'allInterfaces'],
                default: 'localhost',
                description: (0, nls_1.localize)('remote.localPortHost', "Specifies the local host name that will be used for port forwarding.")
            }
        }
    });
});
//# sourceMappingURL=remote.contribution.js.map