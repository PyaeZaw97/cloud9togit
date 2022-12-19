/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, platform_1, nls_1, configurationRegistry_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const configurationRegistry = platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'update',
        order: 15,
        title: (0, nls_1.localize)('updateConfigurationTitle', "Update"),
        type: 'object',
        properties: {
            'update.mode': {
                type: 'string',
                enum: ['none', 'manual', 'start', 'default'],
                default: 'default',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('updateMode', "Configure whether you receive automatic updates. Requires a restart after change. The updates are fetched from a Microsoft online service."),
                tags: ['usesOnlineServices'],
                enumDescriptions: [
                    (0, nls_1.localize)('none', "Disable updates."),
                    (0, nls_1.localize)('manual', "Disable automatic background update checks. Updates will be available if you manually check for updates."),
                    (0, nls_1.localize)('start', "Check for updates only on startup. Disable automatic background update checks."),
                    (0, nls_1.localize)('default', "Enable automatic update checks. Code will check for updates automatically and periodically.")
                ]
            },
            'update.channel': {
                type: 'string',
                default: 'default',
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('updateMode', "Configure whether you receive automatic updates. Requires a restart after change. The updates are fetched from a Microsoft online service."),
                deprecationMessage: (0, nls_1.localize)('deprecated', "This setting is deprecated, please use '{0}' instead.", 'update.mode')
            },
            'update.enableWindowsBackgroundUpdates': {
                type: 'boolean',
                default: true,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                title: (0, nls_1.localize)('enableWindowsBackgroundUpdatesTitle', "Enable Background Updates on Windows"),
                description: (0, nls_1.localize)('enableWindowsBackgroundUpdates', "Enable to download and install new VS Code versions in the background on Windows."),
                included: platform_1.isWindows && !platform_1.isWeb
            },
            'update.showReleaseNotes': {
                type: 'boolean',
                default: true,
                scope: 1 /* ConfigurationScope.APPLICATION */,
                description: (0, nls_1.localize)('showReleaseNotes', "Show Release Notes after an update. The Release Notes are fetched from a Microsoft online service."),
                tags: ['usesOnlineServices']
            }
        }
    });
});
//# sourceMappingURL=update.config.contribution.js.map