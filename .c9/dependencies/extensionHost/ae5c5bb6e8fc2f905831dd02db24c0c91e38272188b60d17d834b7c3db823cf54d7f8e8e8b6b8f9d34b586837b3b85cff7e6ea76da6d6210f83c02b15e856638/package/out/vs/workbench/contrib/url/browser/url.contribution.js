/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/platform/url/common/url", "vs/workbench/common/contributions", "vs/workbench/contrib/url/browser/externalUriResolver", "vs/workbench/contrib/url/browser/trustedDomains", "vs/workbench/contrib/url/browser/trustedDomainsFileSystemProvider", "vs/workbench/contrib/url/browser/trustedDomainsValidator", "vs/workbench/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration"], function (require, exports, uri_1, nls_1, actions_1, commands_1, quickInput_1, platform_1, url_1, contributions_1, externalUriResolver_1, trustedDomains_1, trustedDomainsFileSystemProvider_1, trustedDomainsValidator_1, actions_2, configurationRegistry_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OpenUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.url.openUrl',
                title: { value: (0, nls_1.localize)('openUrl', "Open URL"), original: 'Open URL' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const urlService = accessor.get(url_1.IURLService);
            return quickInputService.input({ prompt: (0, nls_1.localize)('urlToOpen', "URL to open") }).then(input => {
                if (input) {
                    const uri = uri_1.URI.parse(input);
                    urlService.open(uri, { originalUrl: input });
                }
            });
        }
    }
    (0, actions_1.registerAction2)(OpenUrlAction);
    /**
     * Trusted Domains Contribution
     */
    commands_1.CommandsRegistry.registerCommand(trustedDomains_1.manageTrustedDomainSettingsCommand);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: trustedDomains_1.manageTrustedDomainSettingsCommand.id,
            title: {
                value: trustedDomains_1.manageTrustedDomainSettingsCommand.description.description,
                original: 'Manage Trusted Domains'
            }
        }
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(trustedDomainsValidator_1.OpenerValidatorContributions, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(trustedDomainsFileSystemProvider_1.TrustedDomainsFileSystemProvider, 2 /* LifecyclePhase.Ready */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(externalUriResolver_1.ExternalUriResolverContribution, 2 /* LifecyclePhase.Ready */);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration(Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
            'workbench.trustedDomains.promptInTrustedWorkspace': {
                scope: 1 /* ConfigurationScope.APPLICATION */,
                type: 'boolean',
                default: false,
                description: (0, nls_1.localize)('workbench.trustedDomains.promptInTrustedWorkspace', "When enabled, trusted domain prompts will appear when opening links in trusted workspaces.")
            }
        } }));
});
//# sourceMappingURL=url.contribution.js.map