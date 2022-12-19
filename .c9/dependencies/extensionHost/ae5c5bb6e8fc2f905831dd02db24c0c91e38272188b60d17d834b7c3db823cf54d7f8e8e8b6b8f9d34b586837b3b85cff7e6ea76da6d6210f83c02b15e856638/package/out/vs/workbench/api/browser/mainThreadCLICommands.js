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
define(["require", "exports", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementCLIService", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionManifestPropertiesService"], function (require, exports, network_1, platform_1, types_1, uri_1, nls_1, commands_1, configuration_1, extensionManagement_1, extensionManagementCLIService_1, extensionManagementUtil_1, instantiation_1, serviceCollection_1, label_1, opener_1, productService_1, environmentService_1, extensionManagement_2, extensionManifestPropertiesService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // this class contains the commands that the CLI server is reying on
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.openExternal', function (accessor, uri) {
        const openerService = accessor.get(opener_1.IOpenerService);
        return openerService.open((0, types_1.isString)(uri) ? uri : uri_1.URI.revive(uri), { openExternal: true, allowTunneling: true });
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.windowOpen', function (accessor, toOpen, options) {
        const commandService = accessor.get(commands_1.ICommandService);
        if (!toOpen.length) {
            return commandService.executeCommand('_files.newWindow', options);
        }
        return commandService.executeCommand('_files.windowOpen', toOpen, options);
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.getSystemStatus', function (accessor) {
        const commandService = accessor.get(commands_1.ICommandService);
        return commandService.executeCommand('_issues.getSystemStatus');
    });
    commands_1.CommandsRegistry.registerCommand('_remoteCLI.manageExtensions', async function (accessor, args) {
        var _a;
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const extensionManagementServerService = accessor.get(extensionManagement_2.IExtensionManagementServerService);
        const remoteExtensionManagementService = (_a = extensionManagementServerService.remoteExtensionManagementServer) === null || _a === void 0 ? void 0 : _a.extensionManagementService;
        if (!remoteExtensionManagementService) {
            return;
        }
        const cliService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([extensionManagement_1.IExtensionManagementService, remoteExtensionManagementService])).createInstance(RemoteExtensionCLIManagementService);
        const lines = [];
        const output = { log: lines.push.bind(lines), error: lines.push.bind(lines) };
        if (args.list) {
            await cliService.listExtensions(!!args.list.showVersions, args.list.category, output);
        }
        else {
            const revive = (inputs) => inputs.map(input => (0, types_1.isString)(input) ? input : uri_1.URI.revive(input));
            if (Array.isArray(args.install) && args.install.length) {
                try {
                    await cliService.installExtensions(revive(args.install), [], { isMachineScoped: true }, !!args.force, output);
                }
                catch (e) {
                    lines.push(e.message);
                }
            }
            if (Array.isArray(args.uninstall) && args.uninstall.length) {
                try {
                    await cliService.uninstallExtensions(revive(args.uninstall), !!args.force, output);
                }
                catch (e) {
                    lines.push(e.message);
                }
            }
        }
        return lines.join('\n');
    });
    let RemoteExtensionCLIManagementService = class RemoteExtensionCLIManagementService extends extensionManagementCLIService_1.ExtensionManagementCLIService {
        constructor(extensionManagementService, productService, configurationService, extensionGalleryService, labelService, envService, _extensionManifestPropertiesService) {
            super(extensionManagementService, extensionGalleryService);
            this._extensionManifestPropertiesService = _extensionManifestPropertiesService;
            const remoteAuthority = envService.remoteAuthority;
            this._location = remoteAuthority ? labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAuthority) : undefined;
        }
        get location() {
            return this._location;
        }
        validateExtensionKind(manifest, output) {
            if (!this._extensionManifestPropertiesService.canExecuteOnWorkspace(manifest)
                // Web extensions installed on remote can be run in web worker extension host
                && !(platform_1.isWeb && this._extensionManifestPropertiesService.canExecuteOnWeb(manifest))) {
                output.log((0, nls_1.localize)('cannot be installed', "Cannot install the '{0}' extension because it is declared to not run in this setup.", (0, extensionManagementUtil_1.getExtensionId)(manifest.publisher, manifest.name)));
                return false;
            }
            return true;
        }
    };
    RemoteExtensionCLIManagementService = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, productService_1.IProductService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, label_1.ILabelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteExtensionCLIManagementService);
});
//# sourceMappingURL=mainThreadCLICommands.js.map