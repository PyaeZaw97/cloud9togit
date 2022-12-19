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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/arrays", "vs/platform/product/common/productService", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/workspaces/common/workspaceTrust", "vs/base/common/types", "vs/platform/workspace/common/workspaceTrust", "vs/platform/log/common/log", "vs/base/common/platform"], function (require, exports, configuration_1, extensions_1, extensionsRegistry_1, extensionManagementUtil_1, arrays_1, productService_1, instantiation_1, extensions_2, lifecycle_1, workspaceTrust_1, types_1, workspaceTrust_2, log_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionManifestPropertiesService = exports.IExtensionManifestPropertiesService = void 0;
    exports.IExtensionManifestPropertiesService = (0, instantiation_1.createDecorator)('extensionManifestPropertiesService');
    let ExtensionManifestPropertiesService = class ExtensionManifestPropertiesService extends lifecycle_1.Disposable {
        constructor(productService, configurationService, workspaceTrustEnablementService, logService) {
            super();
            this.productService = productService;
            this.configurationService = configurationService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.logService = logService;
            this._extensionPointExtensionKindsMap = null;
            this._productExtensionKindsMap = null;
            this._configuredExtensionKindsMap = null;
            this._productVirtualWorkspaceSupportMap = null;
            this._configuredVirtualWorkspaceSupportMap = null;
            // Workspace trust request type (settings.json)
            this._configuredExtensionWorkspaceTrustRequestMap = new Map();
            const configuredExtensionWorkspaceTrustRequests = configurationService.inspect(workspaceTrust_1.WORKSPACE_TRUST_EXTENSION_SUPPORT).userValue || {};
            for (const id of Object.keys(configuredExtensionWorkspaceTrustRequests)) {
                this._configuredExtensionWorkspaceTrustRequestMap.set(extensions_1.ExtensionIdentifier.toKey(id), configuredExtensionWorkspaceTrustRequests[id]);
            }
            // Workspace trust request type (products.json)
            this._productExtensionWorkspaceTrustRequestMap = new Map();
            if (productService.extensionUntrustedWorkspaceSupport) {
                for (const id of Object.keys(productService.extensionUntrustedWorkspaceSupport)) {
                    this._productExtensionWorkspaceTrustRequestMap.set(extensions_1.ExtensionIdentifier.toKey(id), productService.extensionUntrustedWorkspaceSupport[id]);
                }
            }
        }
        prefersExecuteOnUI(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'ui');
        }
        prefersExecuteOnWorkspace(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'workspace');
        }
        prefersExecuteOnWeb(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return (extensionKind.length > 0 && extensionKind[0] === 'web');
        }
        canExecuteOnUI(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'ui');
        }
        canExecuteOnWorkspace(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'workspace');
        }
        canExecuteOnWeb(manifest) {
            const extensionKind = this.getExtensionKind(manifest);
            return extensionKind.some(kind => kind === 'web');
        }
        getExtensionKind(manifest) {
            const deducedExtensionKind = this.deduceExtensionKind(manifest);
            const configuredExtensionKind = this.getConfiguredExtensionKind(manifest);
            if (configuredExtensionKind && configuredExtensionKind.length > 0) {
                const result = [];
                for (const extensionKind of configuredExtensionKind) {
                    if (extensionKind !== '-web') {
                        result.push(extensionKind);
                    }
                }
                // If opted out from web without specifying other extension kinds then default to ui, workspace
                if (configuredExtensionKind.includes('-web') && !result.length) {
                    result.push('ui');
                    result.push('workspace');
                }
                // Add web kind if not opted out from web and can run in web
                if (platform_1.isWeb && !configuredExtensionKind.includes('-web') && !configuredExtensionKind.includes('web') && deducedExtensionKind.includes('web')) {
                    result.push('web');
                }
                return result;
            }
            return deducedExtensionKind;
        }
        getUserConfiguredExtensionKind(extensionIdentifier) {
            if (this._configuredExtensionKindsMap === null) {
                const configuredExtensionKindsMap = new Map();
                const configuredExtensionKinds = this.configurationService.getValue('remote.extensionKind') || {};
                for (const id of Object.keys(configuredExtensionKinds)) {
                    configuredExtensionKindsMap.set(extensions_1.ExtensionIdentifier.toKey(id), configuredExtensionKinds[id]);
                }
                this._configuredExtensionKindsMap = configuredExtensionKindsMap;
            }
            const userConfiguredExtensionKind = this._configuredExtensionKindsMap.get(extensions_1.ExtensionIdentifier.toKey(extensionIdentifier.id));
            return userConfiguredExtensionKind ? this.toArray(userConfiguredExtensionKind) : undefined;
        }
        getExtensionUntrustedWorkspaceSupportType(manifest) {
            var _a, _b;
            // Workspace trust feature is disabled, or extension has no entry point
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled() || !manifest.main) {
                return true;
            }
            // Get extension workspace trust requirements from settings.json
            const configuredWorkspaceTrustRequest = this.getConfiguredExtensionWorkspaceTrustRequest(manifest);
            // Get extension workspace trust requirements from product.json
            const productWorkspaceTrustRequest = this.getProductExtensionWorkspaceTrustRequest(manifest);
            // Use settings.json override value if it exists
            if (configuredWorkspaceTrustRequest !== undefined) {
                return configuredWorkspaceTrustRequest;
            }
            // Use product.json override value if it exists
            if ((productWorkspaceTrustRequest === null || productWorkspaceTrustRequest === void 0 ? void 0 : productWorkspaceTrustRequest.override) !== undefined) {
                return productWorkspaceTrustRequest.override;
            }
            // Use extension manifest value if it exists
            if (((_b = (_a = manifest.capabilities) === null || _a === void 0 ? void 0 : _a.untrustedWorkspaces) === null || _b === void 0 ? void 0 : _b.supported) !== undefined) {
                return manifest.capabilities.untrustedWorkspaces.supported;
            }
            // Use product.json default value if it exists
            if ((productWorkspaceTrustRequest === null || productWorkspaceTrustRequest === void 0 ? void 0 : productWorkspaceTrustRequest.default) !== undefined) {
                return productWorkspaceTrustRequest.default;
            }
            return false;
        }
        getExtensionVirtualWorkspaceSupportType(manifest) {
            var _a;
            // check user configured
            const userConfiguredVirtualWorkspaceSupport = this.getConfiguredVirtualWorkspaceSupport(manifest);
            if (userConfiguredVirtualWorkspaceSupport !== undefined) {
                return userConfiguredVirtualWorkspaceSupport;
            }
            const productConfiguredWorkspaceSchemes = this.getProductVirtualWorkspaceSupport(manifest);
            // check override from product
            if ((productConfiguredWorkspaceSchemes === null || productConfiguredWorkspaceSchemes === void 0 ? void 0 : productConfiguredWorkspaceSchemes.override) !== undefined) {
                return productConfiguredWorkspaceSchemes.override;
            }
            // check the manifest
            const virtualWorkspaces = (_a = manifest.capabilities) === null || _a === void 0 ? void 0 : _a.virtualWorkspaces;
            if ((0, types_1.isBoolean)(virtualWorkspaces)) {
                return virtualWorkspaces;
            }
            else if (virtualWorkspaces) {
                const supported = virtualWorkspaces.supported;
                if ((0, types_1.isBoolean)(supported) || supported === 'limited') {
                    return supported;
                }
            }
            // check default from product
            if ((productConfiguredWorkspaceSchemes === null || productConfiguredWorkspaceSchemes === void 0 ? void 0 : productConfiguredWorkspaceSchemes.default) !== undefined) {
                return productConfiguredWorkspaceSchemes.default;
            }
            // Default - supports virtual workspace
            return true;
        }
        deduceExtensionKind(manifest) {
            // Not an UI extension if it has main
            if (manifest.main) {
                if (manifest.browser) {
                    return platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
                }
                return ['workspace'];
            }
            if (manifest.browser) {
                return ['web'];
            }
            let result = [...extensions_1.ALL_EXTENSION_KINDS];
            if ((0, arrays_1.isNonEmptyArray)(manifest.extensionPack) || (0, arrays_1.isNonEmptyArray)(manifest.extensionDependencies)) {
                // Extension pack defaults to [workspace, web] in web and only [workspace] in desktop
                result = platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
            }
            if (manifest.contributes) {
                for (const contribution of Object.keys(manifest.contributes)) {
                    const supportedExtensionKinds = this.getSupportedExtensionKindsForExtensionPoint(contribution);
                    if (supportedExtensionKinds.length) {
                        result = result.filter(extensionKind => supportedExtensionKinds.includes(extensionKind));
                    }
                }
            }
            if (!result.length) {
                this.logService.warn('Cannot deduce extensionKind for extension', (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name));
            }
            return result;
        }
        getSupportedExtensionKindsForExtensionPoint(extensionPoint) {
            if (this._extensionPointExtensionKindsMap === null) {
                const extensionPointExtensionKindsMap = new Map();
                extensionsRegistry_1.ExtensionsRegistry.getExtensionPoints().forEach(e => extensionPointExtensionKindsMap.set(e.name, e.defaultExtensionKind || [] /* supports all */));
                this._extensionPointExtensionKindsMap = extensionPointExtensionKindsMap;
            }
            let extensionPointExtensionKind = this._extensionPointExtensionKindsMap.get(extensionPoint);
            if (extensionPointExtensionKind) {
                return extensionPointExtensionKind;
            }
            extensionPointExtensionKind = this.productService.extensionPointExtensionKind ? this.productService.extensionPointExtensionKind[extensionPoint] : undefined;
            if (extensionPointExtensionKind) {
                return extensionPointExtensionKind;
            }
            /* Unknown extension point */
            return platform_1.isWeb ? ['workspace', 'web'] : ['workspace'];
        }
        getConfiguredExtensionKind(manifest) {
            const extensionIdentifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) };
            // check in config
            let result = this.getUserConfiguredExtensionKind(extensionIdentifier);
            if (typeof result !== 'undefined') {
                return this.toArray(result);
            }
            // check product.json
            result = this.getProductExtensionKind(manifest);
            if (typeof result !== 'undefined') {
                return result;
            }
            // check the manifest itself
            result = manifest.extensionKind;
            if (typeof result !== 'undefined') {
                result = this.toArray(result);
                return result.filter(r => ['ui', 'workspace'].includes(r));
            }
            return null;
        }
        getProductExtensionKind(manifest) {
            if (this._productExtensionKindsMap === null) {
                const productExtensionKindsMap = new Map();
                if (this.productService.extensionKind) {
                    for (const id of Object.keys(this.productService.extensionKind)) {
                        productExtensionKindsMap.set(extensions_1.ExtensionIdentifier.toKey(id), this.productService.extensionKind[id]);
                    }
                }
                this._productExtensionKindsMap = productExtensionKindsMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productExtensionKindsMap.get(extensions_1.ExtensionIdentifier.toKey(extensionId));
        }
        getProductVirtualWorkspaceSupport(manifest) {
            if (this._productVirtualWorkspaceSupportMap === null) {
                const productWorkspaceSchemesMap = new Map();
                if (this.productService.extensionVirtualWorkspacesSupport) {
                    for (const id of Object.keys(this.productService.extensionVirtualWorkspacesSupport)) {
                        productWorkspaceSchemesMap.set(extensions_1.ExtensionIdentifier.toKey(id), this.productService.extensionVirtualWorkspacesSupport[id]);
                    }
                }
                this._productVirtualWorkspaceSupportMap = productWorkspaceSchemesMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productVirtualWorkspaceSupportMap.get(extensions_1.ExtensionIdentifier.toKey(extensionId));
        }
        getConfiguredVirtualWorkspaceSupport(manifest) {
            if (this._configuredVirtualWorkspaceSupportMap === null) {
                const configuredWorkspaceSchemesMap = new Map();
                const configuredWorkspaceSchemes = this.configurationService.getValue('extensions.supportVirtualWorkspaces') || {};
                for (const id of Object.keys(configuredWorkspaceSchemes)) {
                    if (configuredWorkspaceSchemes[id] !== undefined) {
                        configuredWorkspaceSchemesMap.set(extensions_1.ExtensionIdentifier.toKey(id), configuredWorkspaceSchemes[id]);
                    }
                }
                this._configuredVirtualWorkspaceSupportMap = configuredWorkspaceSchemesMap;
            }
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._configuredVirtualWorkspaceSupportMap.get(extensions_1.ExtensionIdentifier.toKey(extensionId));
        }
        getConfiguredExtensionWorkspaceTrustRequest(manifest) {
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            const extensionWorkspaceTrustRequest = this._configuredExtensionWorkspaceTrustRequestMap.get(extensions_1.ExtensionIdentifier.toKey(extensionId));
            if (extensionWorkspaceTrustRequest && (extensionWorkspaceTrustRequest.version === undefined || extensionWorkspaceTrustRequest.version === manifest.version)) {
                return extensionWorkspaceTrustRequest.supported;
            }
            return undefined;
        }
        getProductExtensionWorkspaceTrustRequest(manifest) {
            const extensionId = (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name);
            return this._productExtensionWorkspaceTrustRequestMap.get(extensions_1.ExtensionIdentifier.toKey(extensionId));
        }
        toArray(extensionKind) {
            if (Array.isArray(extensionKind)) {
                return extensionKind;
            }
            return extensionKind === 'ui' ? ['ui', 'workspace'] : [extensionKind];
        }
    };
    ExtensionManifestPropertiesService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspaceTrust_2.IWorkspaceTrustEnablementService),
        __param(3, log_1.ILogService)
    ], ExtensionManifestPropertiesService);
    exports.ExtensionManifestPropertiesService = ExtensionManifestPropertiesService;
    (0, extensions_2.registerSingleton)(exports.IExtensionManifestPropertiesService, ExtensionManifestPropertiesService);
});
//# sourceMappingURL=extensionManifestPropertiesService.js.map