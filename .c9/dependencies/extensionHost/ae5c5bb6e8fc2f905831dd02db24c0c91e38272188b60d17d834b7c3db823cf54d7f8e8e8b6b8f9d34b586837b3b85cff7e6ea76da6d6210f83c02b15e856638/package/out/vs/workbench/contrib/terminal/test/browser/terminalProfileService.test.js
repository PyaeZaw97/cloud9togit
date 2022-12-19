/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/terminal/browser/terminalProfileService", "vs/workbench/contrib/terminal/common/terminalExtensionPoints", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/platform", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/configuration/common/configuration", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/environment/common/environmentService", "vs/platform/theme/common/themeService", "vs/base/common/codicons", "assert", "vs/base/common/event", "vs/workbench/contrib/terminal/browser/terminalProfileQuickpick", "vs/platform/theme/test/common/testThemeService", "vs/platform/quickinput/common/quickInput"], function (require, exports, instantiationServiceMock_1, terminal_1, testConfigurationService_1, workbenchTestServices_1, terminalProfileService_1, terminalExtensionPoints_1, terminal_2, platform_1, mockKeybindingService_1, configuration_1, extensions_1, contextkey_1, remoteAgentService_1, environmentService_1, themeService_1, codicons_1, assert_1, event_1, terminalProfileQuickpick_1, testThemeService_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalProfileService extends terminalProfileService_1.TerminalProfileService {
        refreshAvailableProfiles() {
            this.hasRefreshedProfiles = this._refreshAvailableProfilesNow();
        }
        refreshAndAwaitAvailableProfiles() {
            this.refreshAvailableProfiles();
            if (!this.hasRefreshedProfiles) {
                throw new Error('has not refreshed profiles yet');
            }
            return this.hasRefreshedProfiles;
        }
    }
    class MockTerminalProfileService {
        constructor() {
            this.availableProfiles = [];
            this.contributedProfiles = [];
        }
        async getPlatformKey() {
            return 'linux';
        }
        getDefaultProfileName() {
            return this._defaultProfileName;
        }
        setProfiles(profiles, contributed) {
            this.availableProfiles = profiles;
            this.contributedProfiles = contributed;
        }
        setDefaultProfileName(name) {
            this._defaultProfileName = name;
        }
    }
    class MockQuickInputService {
        constructor() {
            this._pick = powershellPick;
        }
        async pick(picks, options, token) {
            Promise.resolve(picks);
            return this._pick;
        }
        setPick(pick) {
            this._pick = pick;
        }
    }
    class TestTerminalProfileQuickpick extends terminalProfileQuickpick_1.TerminalProfileQuickpick {
    }
    class TestTerminalExtensionService extends workbenchTestServices_1.TestExtensionService {
        constructor() {
            super(...arguments);
            this._onDidChangeExtensions = new event_1.Emitter();
        }
    }
    class TestTerminalContributionService {
        constructor() {
            this.terminalProfiles = [];
        }
        setProfiles(profiles) {
            this.terminalProfiles = profiles;
        }
    }
    class TestTerminalInstanceService {
        constructor() {
            this._profiles = new Map();
            this._hasReturnedNone = true;
        }
        getBackend(remoteAuthority) {
            return {
                getProfiles: async () => {
                    if (this._hasReturnedNone) {
                        return this._profiles.get(remoteAuthority !== null && remoteAuthority !== void 0 ? remoteAuthority : '') || [];
                    }
                    else {
                        this._hasReturnedNone = true;
                        return [];
                    }
                }
            };
        }
        setProfiles(remoteAuthority, profiles) {
            this._profiles.set(remoteAuthority !== null && remoteAuthority !== void 0 ? remoteAuthority : '', profiles);
        }
        setReturnNone() {
            this._hasReturnedNone = false;
        }
    }
    class TestRemoteAgentService {
        setEnvironment(os) {
            this._os = os;
        }
        async getEnvironment() {
            return { os: this._os };
        }
    }
    const defaultTerminalConfig = { profiles: { windows: {}, linux: {}, osx: {} } };
    let powershellProfile = {
        profileName: 'PowerShell',
        path: 'C:\\Powershell.exe',
        isDefault: true,
        icon: themeService_1.ThemeIcon.asThemeIcon(codicons_1.Codicon.terminalPowershell)
    };
    let jsdebugProfile = {
        extensionIdentifier: 'ms-vscode.js-debug-nightly',
        icon: 'debug',
        id: 'extension.js-debug.debugTerminal',
        title: 'JavaScript Debug Terminal'
    };
    let powershellPick = { label: 'Powershell', profile: powershellProfile, profileName: powershellProfile.profileName };
    let jsdebugPick = { label: 'Javascript Debug Terminal', profile: jsdebugProfile, profileName: jsdebugProfile.title };
    suite('TerminalProfileService', () => {
        let configurationService;
        let terminalInstanceService;
        let terminalProfileService;
        let remoteAgentService;
        let extensionService;
        let environmentService;
        let instantiationService;
        setup(async () => {
            configurationService = new testConfigurationService_1.TestConfigurationService({ terminal: { integrated: defaultTerminalConfig } });
            remoteAgentService = new TestRemoteAgentService();
            terminalInstanceService = new TestTerminalInstanceService();
            extensionService = new TestTerminalExtensionService();
            environmentService = { remoteAuthority: undefined };
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            let themeService = new testThemeService_1.TestThemeService();
            let terminalContributionService = new TestTerminalContributionService();
            let contextKeyService = new mockKeybindingService_1.MockContextKeyService();
            instantiationService.stub(contextkey_1.IContextKeyService, contextKeyService);
            instantiationService.stub(extensions_1.IExtensionService, extensionService);
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            instantiationService.stub(terminalExtensionPoints_1.ITerminalContributionService, terminalContributionService);
            instantiationService.stub(terminal_2.ITerminalInstanceService, terminalInstanceService);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(themeService_1.IThemeService, themeService);
            terminalProfileService = instantiationService.createInstance(TestTerminalProfileService);
            //reset as these properties are changed in each test
            powershellProfile = {
                profileName: 'PowerShell',
                path: 'C:\\Powershell.exe',
                isDefault: true,
                icon: themeService_1.ThemeIcon.asThemeIcon(codicons_1.Codicon.terminalPowershell)
            };
            jsdebugProfile = {
                extensionIdentifier: 'ms-vscode.js-debug-nightly',
                icon: 'debug',
                id: 'extension.js-debug.debugTerminal',
                title: 'JavaScript Debug Terminal'
            };
            terminalInstanceService.setProfiles(undefined, [powershellProfile]);
            terminalInstanceService.setProfiles('fakeremote', []);
            terminalContributionService.setProfiles([jsdebugProfile]);
            if (platform_1.isWindows) {
                remoteAgentService.setEnvironment(1 /* OperatingSystem.Windows */);
            }
            else if (platform_1.isLinux) {
                remoteAgentService.setEnvironment(3 /* OperatingSystem.Linux */);
            }
            else {
                remoteAgentService.setEnvironment(2 /* OperatingSystem.Macintosh */);
            }
            configurationService.setUserConfiguration('terminal', { integrated: defaultTerminalConfig });
        });
        suite('Contributed Profiles', () => {
            test('should filter out contributed profiles set to null (Linux)', async () => {
                remoteAgentService.setEnvironment(3 /* OperatingSystem.Linux */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            linux: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 1 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should filter out contributed profiles set to null (Windows)', async () => {
                remoteAgentService.setEnvironment(1 /* OperatingSystem.Windows */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            windows: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 1 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should filter out contributed profiles set to null (macOS)', async () => {
                remoteAgentService.setEnvironment(2 /* OperatingSystem.Macintosh */);
                await configurationService.setUserConfiguration('terminal', {
                    integrated: {
                        profiles: {
                            osx: {
                                'JavaScript Debug Terminal': null
                            }
                        }
                    }
                });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true, source: 1 /* ConfigurationTarget.USER */ });
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, []);
            });
            test('should include contributed profiles', async () => {
                await terminalProfileService.refreshAndAwaitAvailableProfiles();
                (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
                (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            });
        });
        test('should get profiles from remoteTerminalService when there is a remote authority', async () => {
            environmentService = { remoteAuthority: 'fakeremote' };
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, environmentService);
            terminalProfileService = instantiationService.createInstance(TestTerminalProfileService);
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, []);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            terminalInstanceService.setProfiles('fakeremote', [powershellProfile]);
            await terminalProfileService.refreshAndAwaitAvailableProfiles();
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        test('should fire onDidChangeAvailableProfiles only when available profiles have changed via user config', async () => {
            powershellProfile.icon = themeService_1.ThemeIcon.asThemeIcon(codicons_1.Codicon.lightBulb);
            let calls = [];
            terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e));
            await configurationService.setUserConfiguration('terminal', {
                integrated: {
                    profiles: {
                        windows: powershellProfile,
                        linux: powershellProfile,
                        osx: powershellProfile
                    }
                }
            });
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
            calls = [];
            await terminalProfileService.refreshAndAwaitAvailableProfiles();
            (0, assert_1.deepStrictEqual)(calls, []);
        });
        test('should fire onDidChangeAvailableProfiles when available or contributed profiles have changed via remote/localTerminalService', async () => {
            powershellProfile.isDefault = false;
            terminalInstanceService.setProfiles(undefined, [powershellProfile]);
            const calls = [];
            terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e));
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        test('should call refreshAvailableProfiles _onDidChangeExtensions', async () => {
            extensionService._onDidChangeExtensions.fire();
            const calls = [];
            terminalProfileService.onDidChangeAvailableProfiles(e => calls.push(e));
            await terminalProfileService.hasRefreshedProfiles;
            (0, assert_1.deepStrictEqual)(calls, [
                [powershellProfile]
            ]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.availableProfiles, [powershellProfile]);
            (0, assert_1.deepStrictEqual)(terminalProfileService.contributedProfiles, [jsdebugProfile]);
        });
        suite('Profiles Quickpick', () => {
            let quickInputService;
            let mockTerminalProfileService;
            let terminalProfileQuickpick;
            setup(async () => {
                quickInputService = new MockQuickInputService();
                mockTerminalProfileService = new MockTerminalProfileService();
                instantiationService.stub(quickInput_1.IQuickInputService, quickInputService);
                instantiationService.stub(terminal_1.ITerminalProfileService, mockTerminalProfileService);
                terminalProfileQuickpick = instantiationService.createInstance(TestTerminalProfileQuickpick);
            });
            test('setDefault', async () => {
                powershellProfile.isDefault = false;
                mockTerminalProfileService.setProfiles([powershellProfile], [jsdebugProfile]);
                mockTerminalProfileService.setDefaultProfileName(jsdebugProfile.title);
                const result = await terminalProfileQuickpick.showAndGetResult('setDefault');
                (0, assert_1.deepStrictEqual)(result, powershellProfile.profileName);
            });
            test('setDefault to contributed', async () => {
                mockTerminalProfileService.setDefaultProfileName(powershellProfile.profileName);
                quickInputService.setPick(jsdebugPick);
                const result = await terminalProfileQuickpick.showAndGetResult('setDefault');
                const expected = {
                    config: {
                        extensionIdentifier: jsdebugProfile.extensionIdentifier,
                        id: jsdebugProfile.id,
                        options: { color: undefined, icon: 'debug' },
                        title: jsdebugProfile.title,
                    },
                    keyMods: undefined
                };
                (0, assert_1.deepStrictEqual)(result, expected);
            });
            test('createInstance', async () => {
                mockTerminalProfileService.setDefaultProfileName(powershellProfile.profileName);
                const pick = Object.assign(Object.assign({}, powershellPick), { keyMods: { alt: true, ctrlCmd: false } });
                quickInputService.setPick(pick);
                const result = await terminalProfileQuickpick.showAndGetResult('createInstance');
                (0, assert_1.deepStrictEqual)(result, { config: powershellProfile, keyMods: { alt: true, ctrlCmd: false } });
            });
            test('createInstance with contributed', async () => {
                const pick = Object.assign(Object.assign({}, jsdebugPick), { keyMods: { alt: true, ctrlCmd: false } });
                quickInputService.setPick(pick);
                const result = await terminalProfileQuickpick.showAndGetResult('createInstance');
                const expected = {
                    config: {
                        extensionIdentifier: jsdebugProfile.extensionIdentifier,
                        id: jsdebugProfile.id,
                        options: { color: undefined, icon: 'debug' },
                        title: jsdebugProfile.title,
                    },
                    keyMods: { alt: true, ctrlCmd: false }
                };
                (0, assert_1.deepStrictEqual)(result, expected);
            });
        });
    });
});
//# sourceMappingURL=terminalProfileService.test.js.map