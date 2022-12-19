/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/terminal/common/terminalProfiles"], function (require, exports, codicons_1, nls_1, configurationRegistry_1, platform_1, terminalProfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerTerminalDefaultProfileConfiguration = exports.registerTerminalPlatformConfiguration = void 0;
    const terminalProfileBaseProperties = {
        args: {
            description: (0, nls_1.localize)('terminalProfile.args', 'An optional set of arguments to run the shell executable with.'),
            type: 'array',
            items: {
                type: 'string'
            }
        },
        overrideName: {
            description: (0, nls_1.localize)('terminalProfile.overrideName', 'Controls whether or not the profile name overrides the auto detected one.'),
            type: 'boolean'
        },
        icon: {
            description: (0, nls_1.localize)('terminalProfile.icon', 'A codicon ID to associate with this terminal.'),
            type: 'string',
            enum: Array.from(codicons_1.Codicon.getAll(), icon => icon.id),
            markdownEnumDescriptions: Array.from(codicons_1.Codicon.getAll(), icon => `$(${icon.id})`),
        },
        color: {
            description: (0, nls_1.localize)('terminalProfile.color', 'A theme color ID to associate with this terminal.'),
            type: ['string', 'null'],
            enum: [
                'terminal.ansiBlack',
                'terminal.ansiRed',
                'terminal.ansiGreen',
                'terminal.ansiYellow',
                'terminal.ansiBlue',
                'terminal.ansiMagenta',
                'terminal.ansiCyan',
                'terminal.ansiWhite'
            ],
            default: null
        },
        env: {
            markdownDescription: (0, nls_1.localize)('terminalProfile.env', "An object with environment variables that will be added to the terminal profile process. Set to `null` to delete environment variables from the base environment."),
            type: 'object',
            additionalProperties: {
                type: ['string', 'null']
            },
            default: {}
        }
    };
    const terminalProfileSchema = {
        type: 'object',
        required: ['path'],
        properties: Object.assign({ path: {
                description: (0, nls_1.localize)('terminalProfile.path', 'A single path to a shell executable or an array of paths that will be used as fallbacks when one fails.'),
                type: ['string', 'array'],
                items: {
                    type: 'string'
                }
            } }, terminalProfileBaseProperties)
    };
    const terminalAutomationProfileSchema = {
        type: 'object',
        required: ['path'],
        properties: Object.assign({ path: {
                description: (0, nls_1.localize)('terminalAutomationProfile.path', 'A single path to a shell executable.'),
                type: ['string'],
                items: {
                    type: 'string'
                }
            } }, terminalProfileBaseProperties)
    };
    const shellDeprecationMessageLinux = (0, nls_1.localize)('terminal.integrated.shell.linux.deprecation', "This is deprecated, the new recommended way to configure your default shell is by creating a terminal profile in {0} and setting its profile name as the default in {1}. This will currently take priority over the new profiles settings but that will change in the future.", '`#terminal.integrated.profiles.linux#`', '`#terminal.integrated.defaultProfile.linux#`');
    const shellDeprecationMessageOsx = (0, nls_1.localize)('terminal.integrated.shell.osx.deprecation', "This is deprecated, the new recommended way to configure your default shell is by creating a terminal profile in {0} and setting its profile name as the default in {1}. This will currently take priority over the new profiles settings but that will change in the future.", '`#terminal.integrated.profiles.osx#`', '`#terminal.integrated.defaultProfile.osx#`');
    const shellDeprecationMessageWindows = (0, nls_1.localize)('terminal.integrated.shell.windows.deprecation', "This is deprecated, the new recommended way to configure your default shell is by creating a terminal profile in {0} and setting its profile name as the default in {1}. This will currently take priority over the new profiles settings but that will change in the future.", '`#terminal.integrated.profiles.windows#`', '`#terminal.integrated.defaultProfile.windows#`');
    const automationShellDeprecationMessageLinux = (0, nls_1.localize)('terminal.integrated.automationShell.linux.deprecation', "This is deprecated, the new recommended way to configure your automation shell is by creating a terminal automation profile with {0}. This will currently take priority over the new automation profile settings but that will change in the future.", '`#terminal.integrated.automationProfile.linux#`');
    const automationShellDeprecationMessageOsx = (0, nls_1.localize)('terminal.integrated.automationShell.osx.deprecation', "This is deprecated, the new recommended way to configure your automation shell is by creating a terminal automation profile with {0}. This will currently take priority over the new automation profile settings but that will change in the future.", '`#terminal.integrated.automationProfile.osx#`');
    const automationShellDeprecationMessageWindows = (0, nls_1.localize)('terminal.integrated.automationShell.windows.deprecation', "This is deprecated, the new recommended way to configure your automation shell is by creating a terminal automation profile with {0}. This will currently take priority over the new automation profile settings but that will change in the future.", '`#terminal.integrated.automationProfile.windows#`');
    const terminalPlatformConfiguration = {
        id: 'terminal',
        order: 100,
        title: (0, nls_1.localize)('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
        type: 'object',
        properties: {
            ["terminal.integrated.automationShell.linux" /* TerminalSettingId.AutomationShellLinux */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)({
                    key: 'terminal.integrated.automationShell.linux',
                    comment: ['{0} and {1} are the `shell` and `shellArgs` settings keys']
                }, "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.linux`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null,
                markdownDeprecationMessage: automationShellDeprecationMessageLinux
            },
            ["terminal.integrated.automationShell.osx" /* TerminalSettingId.AutomationShellMacOs */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)({
                    key: 'terminal.integrated.automationShell.osx',
                    comment: ['{0} and {1} are the `shell` and `shellArgs` settings keys']
                }, "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.osx`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null,
                markdownDeprecationMessage: automationShellDeprecationMessageOsx
            },
            ["terminal.integrated.automationShell.windows" /* TerminalSettingId.AutomationShellWindows */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)({
                    key: 'terminal.integrated.automationShell.windows',
                    comment: ['{0} and {1} are the `shell` and `shellArgs` settings keys']
                }, "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.windows`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null,
                markdownDeprecationMessage: automationShellDeprecationMessageWindows
            },
            ["terminal.integrated.automationProfile.linux" /* TerminalSettingId.AutomationProfileLinux */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.automationProfile.linux', "The terminal profile to use on Linux for automation-related terminal usage like tasks and debug. This setting will currently be ignored if {0} is set.", '`#terminal.integrated.automationShell.linux#`'),
                type: ['object', 'null'],
                default: null,
                'anyOf': [
                    { type: 'null' },
                    terminalAutomationProfileSchema
                ],
                defaultSnippets: [
                    {
                        body: {
                            path: '${1}',
                            icon: '${2}'
                        }
                    }
                ]
            },
            ["terminal.integrated.automationProfile.osx" /* TerminalSettingId.AutomationProfileMacOs */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.automationProfile.osx', "The terminal profile to use on macOS for automation-related terminal usage like tasks and debug. This setting will currently be ignored if {0} is set.", '`#terminal.integrated.automationShell.osx#`'),
                type: ['object', 'null'],
                default: null,
                'anyOf': [
                    { type: 'null' },
                    terminalAutomationProfileSchema
                ],
                defaultSnippets: [
                    {
                        body: {
                            path: '${1}',
                            icon: '${2}'
                        }
                    }
                ]
            },
            ["terminal.integrated.automationProfile.windows" /* TerminalSettingId.AutomationProfileWindows */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.automationProfile.windows', "The terminal profile to use for automation-related terminal usage like tasks and debug. This setting will currently be ignored if {0} is set.", '`#terminal.integrated.automationShell.windows#`'),
                type: ['object', 'null'],
                default: null,
                'anyOf': [
                    { type: 'null' },
                    terminalAutomationProfileSchema
                ],
                defaultSnippets: [
                    {
                        body: {
                            path: '${1}',
                            icon: '${2}'
                        }
                    }
                ]
            },
            ["terminal.integrated.shell.linux" /* TerminalSettingId.ShellLinux */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shell.linux', "The path of the shell that the terminal uses on Linux. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_terminal-profiles)."),
                type: ['string', 'null'],
                default: null,
                markdownDeprecationMessage: shellDeprecationMessageLinux
            },
            ["terminal.integrated.shell.osx" /* TerminalSettingId.ShellMacOs */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shell.osx', "The path of the shell that the terminal uses on macOS. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_terminal-profiles)."),
                type: ['string', 'null'],
                default: null,
                markdownDeprecationMessage: shellDeprecationMessageOsx
            },
            ["terminal.integrated.shell.windows" /* TerminalSettingId.ShellWindows */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shell.windows', "The path of the shell that the terminal uses on Windows. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_terminal-profiles)."),
                type: ['string', 'null'],
                default: null,
                markdownDeprecationMessage: shellDeprecationMessageWindows
            },
            ["terminal.integrated.shellArgs.linux" /* TerminalSettingId.ShellArgsLinux */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellArgs.linux', "The command line arguments to use when on the Linux terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_terminal-profiles)."),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: [],
                markdownDeprecationMessage: shellDeprecationMessageLinux
            },
            ["terminal.integrated.shellArgs.osx" /* TerminalSettingId.ShellArgsMacOs */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellArgs.osx', "The command line arguments to use when on the macOS terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_terminal-profiles)."),
                type: 'array',
                items: {
                    type: 'string'
                },
                // Unlike on Linux, ~/.profile is not sourced when logging into a macOS session. This
                // is the reason terminals on macOS typically run login shells by default which set up
                // the environment. See http://unix.stackexchange.com/a/119675/115410
                default: ['-l'],
                markdownDeprecationMessage: shellDeprecationMessageOsx
            },
            ["terminal.integrated.shellArgs.windows" /* TerminalSettingId.ShellArgsWindows */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.shellArgs.windows', "The command line arguments to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_terminal-profiles)."),
                'anyOf': [
                    {
                        type: 'array',
                        items: {
                            type: 'string',
                            markdownDescription: (0, nls_1.localize)('terminal.integrated.shellArgs.windows', "The command line arguments to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_terminal-profiles).")
                        },
                    },
                    {
                        type: 'string',
                        markdownDescription: (0, nls_1.localize)('terminal.integrated.shellArgs.windows.string', "The command line arguments in [command-line format](https://msdn.microsoft.com/en-au/08dfcab2-eb6e-49a4-80eb-87d4076c98c6) to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_terminal-profiles).")
                    }
                ],
                default: [],
                markdownDeprecationMessage: shellDeprecationMessageWindows
            },
            ["terminal.integrated.profiles.windows" /* TerminalSettingId.ProfilesWindows */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)({
                    key: 'terminal.integrated.profiles.windows',
                    comment: ['{0}, {1}, and {2} are the `source`, `path` and optional `args` settings keys']
                }, "The Windows profiles to present when creating a new terminal via the terminal dropdown. Use the {0} property to automatically detect the shell's location. Or set the {1} property manually with an optional {2}.\n\nSet an existing profile to {3} to hide the profile from the list, for example: {4}.", '`source`', '`path`', '`args`', '`null`', '`"Ubuntu-20.04 (WSL)": null`'),
                type: 'object',
                default: {
                    'PowerShell': {
                        source: 'PowerShell',
                        icon: 'terminal-powershell'
                    },
                    'Command Prompt': {
                        path: [
                            '${env:windir}\\Sysnative\\cmd.exe',
                            '${env:windir}\\System32\\cmd.exe'
                        ],
                        args: [],
                        icon: 'terminal-cmd'
                    },
                    'Git Bash': {
                        source: 'Git Bash'
                    }
                },
                additionalProperties: {
                    'anyOf': [
                        {
                            type: 'object',
                            required: ['source'],
                            properties: Object.assign({ source: {
                                    description: (0, nls_1.localize)('terminalProfile.windowsSource', 'A profile source that will auto detect the paths to the shell.'),
                                    enum: ['PowerShell', 'Git Bash']
                                } }, terminalProfileBaseProperties)
                        },
                        {
                            type: 'object',
                            required: ['extensionIdentifier', 'id', 'title'],
                            properties: Object.assign({ extensionIdentifier: {
                                    description: (0, nls_1.localize)('terminalProfile.windowsExtensionIdentifier', 'The extension that contributed this profile.'),
                                    type: 'string'
                                }, id: {
                                    description: (0, nls_1.localize)('terminalProfile.windowsExtensionId', 'The id of the extension terminal'),
                                    type: 'string'
                                }, title: {
                                    description: (0, nls_1.localize)('terminalProfile.windowsExtensionTitle', 'The name of the extension terminal'),
                                    type: 'string'
                                } }, terminalProfileBaseProperties)
                        },
                        { type: 'null' },
                        terminalProfileSchema
                    ]
                }
            },
            ["terminal.integrated.profiles.osx" /* TerminalSettingId.ProfilesMacOs */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)({
                    key: 'terminal.integrated.profile.osx',
                    comment: ['{0} and {1} are the `path` and optional `args` settings keys']
                }, "The macOS profiles to present when creating a new terminal via the terminal dropdown. Set the {0} property manually with an optional {1}.\n\nSet an existing profile to {2} to hide the profile from the list, for example: {3}.", '`path`', '`args`', '`null`', '`"bash": null`'),
                type: 'object',
                default: {
                    'bash': {
                        path: 'bash',
                        args: ['-l'],
                        icon: 'terminal-bash'
                    },
                    'zsh': {
                        path: 'zsh',
                        args: ['-l']
                    },
                    'fish': {
                        path: 'fish',
                        args: ['-l']
                    },
                    'tmux': {
                        path: 'tmux',
                        icon: 'terminal-tmux'
                    },
                    'pwsh': {
                        path: 'pwsh',
                        icon: 'terminal-powershell'
                    }
                },
                additionalProperties: {
                    'anyOf': [
                        {
                            type: 'object',
                            required: ['extensionIdentifier', 'id', 'title'],
                            properties: Object.assign({ extensionIdentifier: {
                                    description: (0, nls_1.localize)('terminalProfile.osxExtensionIdentifier', 'The extension that contributed this profile.'),
                                    type: 'string'
                                }, id: {
                                    description: (0, nls_1.localize)('terminalProfile.osxExtensionId', 'The id of the extension terminal'),
                                    type: 'string'
                                }, title: {
                                    description: (0, nls_1.localize)('terminalProfile.osxExtensionTitle', 'The name of the extension terminal'),
                                    type: 'string'
                                } }, terminalProfileBaseProperties)
                        },
                        { type: 'null' },
                        terminalProfileSchema
                    ]
                }
            },
            ["terminal.integrated.profiles.linux" /* TerminalSettingId.ProfilesLinux */]: {
                restricted: true,
                markdownDescription: (0, nls_1.localize)({
                    key: 'terminal.integrated.profile.linux',
                    comment: ['{0} and {1} are the `path` and optional `args` settings keys']
                }, "The Linux profiles to present when creating a new terminal via the terminal dropdown. Set the {0} property manually with an optional {1}.\n\nSet an existing profile to {2} to hide the profile from the list, for example: {3}.", '`path`', '`args`', '`null`', '`"bash": null`'),
                type: 'object',
                default: {
                    'bash': {
                        path: 'bash',
                        icon: 'terminal-bash'
                    },
                    'zsh': {
                        path: 'zsh'
                    },
                    'fish': {
                        path: 'fish'
                    },
                    'tmux': {
                        path: 'tmux',
                        icon: 'terminal-tmux'
                    },
                    'pwsh': {
                        path: 'pwsh',
                        icon: 'terminal-powershell'
                    }
                },
                additionalProperties: {
                    'anyOf': [
                        {
                            type: 'object',
                            required: ['extensionIdentifier', 'id', 'title'],
                            properties: Object.assign({ extensionIdentifier: {
                                    description: (0, nls_1.localize)('terminalProfile.linuxExtensionIdentifier', 'The extension that contributed this profile.'),
                                    type: 'string'
                                }, id: {
                                    description: (0, nls_1.localize)('terminalProfile.linuxExtensionId', 'The id of the extension terminal'),
                                    type: 'string'
                                }, title: {
                                    description: (0, nls_1.localize)('terminalProfile.linuxExtensionTitle', 'The name of the extension terminal'),
                                    type: 'string'
                                } }, terminalProfileBaseProperties)
                        },
                        { type: 'null' },
                        terminalProfileSchema
                    ]
                }
            },
            ["terminal.integrated.useWslProfiles" /* TerminalSettingId.UseWslProfiles */]: {
                description: (0, nls_1.localize)('terminal.integrated.useWslProfiles', 'Controls whether or not WSL distros are shown in the terminal dropdown'),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.inheritEnv" /* TerminalSettingId.InheritEnv */]: {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('terminal.integrated.inheritEnv', "Whether new shells should inherit their environment from VS Code, which may source a login shell to ensure $PATH and other development variables are initialized. This has no effect on Windows."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.persistentSessionScrollback" /* TerminalSettingId.PersistentSessionScrollback */]: {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                markdownDescription: (0, nls_1.localize)('terminal.integrated.persistentSessionScrollback', "Controls the maximum amount of lines that will be restored when reconnecting to a persistent terminal session. Increasing this will restore more lines of scrollback at the cost of more memory and increase the time it takes to connect to terminals on start up. This setting requires a restart to take effect and should be set to a value less than or equal to `#terminal.integrated.scrollback#`."),
                type: 'number',
                default: 100
            },
            ["terminal.integrated.showLinkHover" /* TerminalSettingId.ShowLinkHover */]: {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('terminal.integrated.showLinkHover', "Whether to show hovers for links in the terminal output."),
                type: 'boolean',
                default: true
            },
            ["terminal.integrated.ignoreProcessNames" /* TerminalSettingId.IgnoreProcessNames */]: {
                description: (0, nls_1.localize)('terminal.integrated.confirmIgnoreProcesses', "A set of process names to ignore when using the {0} setting.", '`terminal.integrated.confirmOnKill`'),
                type: 'array',
                items: {
                    type: 'string',
                    uniqueItems: true
                },
                default: [
                    // Popular prompt programs, these should not count as child processes
                    'starship',
                    'oh-my-posh',
                    // Git bash may runs a subprocess of itself (bin\bash.exe -> usr\bin\bash.exe)
                    'bash',
                    'zsh',
                ]
            }
        }
    };
    /**
     * Registers terminal configurations required by shared process and remote server.
     */
    function registerTerminalPlatformConfiguration() {
        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(terminalPlatformConfiguration);
        registerTerminalDefaultProfileConfiguration();
    }
    exports.registerTerminalPlatformConfiguration = registerTerminalPlatformConfiguration;
    let defaultProfilesConfiguration;
    function registerTerminalDefaultProfileConfiguration(detectedProfiles, extensionContributedProfiles) {
        const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        let profileEnum;
        if (detectedProfiles) {
            profileEnum = (0, terminalProfiles_1.createProfileSchemaEnums)(detectedProfiles === null || detectedProfiles === void 0 ? void 0 : detectedProfiles.profiles, extensionContributedProfiles);
        }
        const oldDefaultProfilesConfiguration = defaultProfilesConfiguration;
        defaultProfilesConfiguration = {
            id: 'terminal',
            order: 100,
            title: (0, nls_1.localize)('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
            type: 'object',
            properties: {
                ["terminal.integrated.defaultProfile.linux" /* TerminalSettingId.DefaultProfileLinux */]: {
                    restricted: true,
                    markdownDescription: (0, nls_1.localize)('terminal.integrated.defaultProfile.linux', "The default profile used on Linux. This setting will currently be ignored if either {0} or {1} are set.", '`terminal.integrated.shell.linux`', '`terminal.integrated.shellArgs.linux`'),
                    type: ['string', 'null'],
                    default: null,
                    enum: (detectedProfiles === null || detectedProfiles === void 0 ? void 0 : detectedProfiles.os) === 3 /* OperatingSystem.Linux */ ? profileEnum === null || profileEnum === void 0 ? void 0 : profileEnum.values : undefined,
                    markdownEnumDescriptions: (detectedProfiles === null || detectedProfiles === void 0 ? void 0 : detectedProfiles.os) === 3 /* OperatingSystem.Linux */ ? profileEnum === null || profileEnum === void 0 ? void 0 : profileEnum.markdownDescriptions : undefined
                },
                ["terminal.integrated.defaultProfile.osx" /* TerminalSettingId.DefaultProfileMacOs */]: {
                    restricted: true,
                    markdownDescription: (0, nls_1.localize)('terminal.integrated.defaultProfile.osx', "The default profile used on macOS. This setting will currently be ignored if either {0} or {1} are set.", '`terminal.integrated.shell.osx`', '`terminal.integrated.shellArgs.osx`'),
                    type: ['string', 'null'],
                    default: null,
                    enum: (detectedProfiles === null || detectedProfiles === void 0 ? void 0 : detectedProfiles.os) === 2 /* OperatingSystem.Macintosh */ ? profileEnum === null || profileEnum === void 0 ? void 0 : profileEnum.values : undefined,
                    markdownEnumDescriptions: (detectedProfiles === null || detectedProfiles === void 0 ? void 0 : detectedProfiles.os) === 2 /* OperatingSystem.Macintosh */ ? profileEnum === null || profileEnum === void 0 ? void 0 : profileEnum.markdownDescriptions : undefined
                },
                ["terminal.integrated.defaultProfile.windows" /* TerminalSettingId.DefaultProfileWindows */]: {
                    restricted: true,
                    markdownDescription: (0, nls_1.localize)('terminal.integrated.defaultProfile.windows', "The default profile used on Windows. This setting will currently be ignored if either {0} or {1} are set.", '`terminal.integrated.shell.windows`', '`terminal.integrated.shellArgs.windows`'),
                    type: ['string', 'null'],
                    default: null,
                    enum: (detectedProfiles === null || detectedProfiles === void 0 ? void 0 : detectedProfiles.os) === 1 /* OperatingSystem.Windows */ ? profileEnum === null || profileEnum === void 0 ? void 0 : profileEnum.values : undefined,
                    markdownEnumDescriptions: (detectedProfiles === null || detectedProfiles === void 0 ? void 0 : detectedProfiles.os) === 1 /* OperatingSystem.Windows */ ? profileEnum === null || profileEnum === void 0 ? void 0 : profileEnum.markdownDescriptions : undefined
                },
            }
        };
        registry.updateConfigurations({ add: [defaultProfilesConfiguration], remove: oldDefaultProfilesConfiguration ? [oldDefaultProfilesConfiguration] : [] });
    }
    exports.registerTerminalDefaultProfileConfiguration = registerTerminalDefaultProfileConfiguration;
});
//# sourceMappingURL=terminalPlatformConfiguration.js.map