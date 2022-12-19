/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService"], function (require, exports, configurationRegistry_1, extensions_1, platform_1, configuration_1, externalUriOpenerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(externalUriOpenerService_1.IExternalUriOpenerService, externalUriOpenerService_1.ExternalUriOpenerService);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration(configuration_1.externalUriOpenersConfigurationNode);
});
//# sourceMappingURL=externalUriOpener.contribution.js.map