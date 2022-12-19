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
define(["require", "exports", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/platform/files/common/files", "vs/base/common/buffer", "vs/base/common/uri", "vs/platform/product/common/productService"], function (require, exports, environmentService_1, platform_1, configurationRegistry_1, extensions_1, commands_1, files_1, buffer_1, uri_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultConfigurationExportHelper = void 0;
    let DefaultConfigurationExportHelper = class DefaultConfigurationExportHelper {
        constructor(environmentService, extensionService, commandService, fileService, productService) {
            this.extensionService = extensionService;
            this.commandService = commandService;
            this.fileService = fileService;
            this.productService = productService;
            const exportDefaultConfigurationPath = environmentService.args['export-default-configuration'];
            if (exportDefaultConfigurationPath) {
                this.writeConfigModelAndQuit(uri_1.URI.file(exportDefaultConfigurationPath));
            }
        }
        async writeConfigModelAndQuit(target) {
            try {
                await this.extensionService.whenInstalledExtensionsRegistered();
                await this.writeConfigModel(target);
            }
            finally {
                this.commandService.executeCommand('workbench.action.quit');
            }
        }
        async writeConfigModel(target) {
            const config = this.getConfigModel();
            const resultString = JSON.stringify(config, undefined, '  ');
            await this.fileService.writeFile(target, buffer_1.VSBuffer.fromString(resultString));
        }
        getConfigModel() {
            const configRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            const configurations = configRegistry.getConfigurations().slice();
            const settings = [];
            const processedNames = new Set();
            const processProperty = (name, prop) => {
                if (processedNames.has(name)) {
                    console.warn('Setting is registered twice: ' + name);
                    return;
                }
                processedNames.add(name);
                const propDetails = {
                    name,
                    description: prop.description || prop.markdownDescription || '',
                    default: prop.default,
                    type: prop.type
                };
                if (prop.enum) {
                    propDetails.enum = prop.enum;
                }
                if (prop.enumDescriptions || prop.markdownEnumDescriptions) {
                    propDetails.enumDescriptions = prop.enumDescriptions || prop.markdownEnumDescriptions;
                }
                settings.push(propDetails);
            };
            const processConfig = (config) => {
                if (config.properties) {
                    for (let name in config.properties) {
                        processProperty(name, config.properties[name]);
                    }
                }
                if (config.allOf) {
                    config.allOf.forEach(processConfig);
                }
            };
            configurations.forEach(processConfig);
            const excludedProps = configRegistry.getExcludedConfigurationProperties();
            for (let name in excludedProps) {
                processProperty(name, excludedProps[name]);
            }
            const result = {
                settings: settings.sort((a, b) => a.name.localeCompare(b.name)),
                buildTime: Date.now(),
                commit: this.productService.commit,
                buildNumber: this.productService.settingsSearchBuildId
            };
            return result;
        }
    };
    DefaultConfigurationExportHelper = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, extensions_1.IExtensionService),
        __param(2, commands_1.ICommandService),
        __param(3, files_1.IFileService),
        __param(4, productService_1.IProductService)
    ], DefaultConfigurationExportHelper);
    exports.DefaultConfigurationExportHelper = DefaultConfigurationExportHelper;
});
//# sourceMappingURL=configurationExportHelper.js.map