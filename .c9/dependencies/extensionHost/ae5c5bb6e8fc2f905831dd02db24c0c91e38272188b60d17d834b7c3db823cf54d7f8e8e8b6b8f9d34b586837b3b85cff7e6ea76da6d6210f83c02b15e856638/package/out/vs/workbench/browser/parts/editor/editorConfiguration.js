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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, platform_1, lifecycle_1, configurationRegistry_1, configuration_1, editorResolverService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicEditorResolverConfigurations = void 0;
    let DynamicEditorResolverConfigurations = class DynamicEditorResolverConfigurations extends lifecycle_1.Disposable {
        constructor(editorResolverService, extensionService) {
            super();
            this.editorResolverService = editorResolverService;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            // Editor configurations are getting updated very aggressively
            // (atleast 20 times) while the extensions are getting registered.
            // As such push out the dynamic editor auto lock configuration
            // until after extensions registered.
            (async () => {
                await extensionService.whenInstalledExtensionsRegistered();
                this.updateConfiguration();
                this.registerListeners();
            })();
        }
        registerListeners() {
            // Registered editors
            this._register(this.editorResolverService.onDidChangeEditorRegistrations(() => this.updateConfiguration()));
        }
        updateConfiguration() {
            const lockableEditors = [...this.editorResolverService.getEditors(), ...DynamicEditorResolverConfigurations.AUTO_LOCK_EXTRA_EDITORS];
            const binaryEditorCandidates = this.editorResolverService.getEditors().filter(e => e.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive).map(e => e.id);
            // Build config from registered editors
            const autoLockGroupConfiguration = Object.create(null);
            for (const editor of lockableEditors) {
                autoLockGroupConfiguration[editor.id] = {
                    type: 'boolean',
                    default: DynamicEditorResolverConfigurations.AUTO_LOCK_DEFAULT_ENABLED.has(editor.id),
                    description: editor.label
                };
            }
            // Build default config too
            const defaultAutoLockGroupConfiguration = Object.create(null);
            for (const editor of lockableEditors) {
                defaultAutoLockGroupConfiguration[editor.id] = DynamicEditorResolverConfigurations.AUTO_LOCK_DEFAULT_ENABLED.has(editor.id);
            }
            // Register settng for auto locking groups
            const oldAutoLockConfigurationNode = this.autoLockConfigurationNode;
            this.autoLockConfigurationNode = Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
                    'workbench.editor.autoLockGroups': {
                        type: 'object',
                        description: (0, nls_1.localize)('workbench.editor.autoLockGroups', "If an editor matching one of the listed types is opened as the first in an editor group and more than one group is open, the group is automatically locked. Locked groups will only be used for opening editors when explicitly chosen by user gesture (e.g. drag and drop), but not by default. Consequently the active editor in a locked group is less likely to be replaced accidentally with a different editor."),
                        properties: autoLockGroupConfiguration,
                        default: defaultAutoLockGroupConfiguration,
                        additionalProperties: false
                    }
                } });
            // Registers setting for default binary editors
            const oldDefaultBinaryEditorConfigurationNode = this.defaultBinaryEditorConfigurationNode;
            this.defaultBinaryEditorConfigurationNode = Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
                    'workbench.editor.defaultBinaryEditor': {
                        type: 'string',
                        default: '',
                        // This allows for intellisense autocompletion
                        enum: [...binaryEditorCandidates, ''],
                        description: (0, nls_1.localize)('workbench.editor.defaultBinaryEditor', "The default editor for files detected as binary. If undefined the user will be presented with a picker."),
                    }
                } });
            // Registers setting for editorAssociations
            const oldEditorAssociationsConfigurationNode = this.editorAssociationsConfiguratioNnode;
            this.editorAssociationsConfiguratioNnode = Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
                    'workbench.editorAssociations': {
                        type: 'object',
                        markdownDescription: (0, nls_1.localize)('editor.editorAssociations', "Configure glob patterns to editors (e.g. `\"*.hex\": \"hexEditor.hexEdit\"`). These have precedence over the default behavior."),
                        patternProperties: {
                            '.*': {
                                type: 'string',
                                enum: binaryEditorCandidates,
                            }
                        }
                    }
                } });
            this.configurationRegistry.updateConfigurations({ add: [this.autoLockConfigurationNode], remove: oldAutoLockConfigurationNode ? [oldAutoLockConfigurationNode] : [] });
            this.configurationRegistry.updateConfigurations({ add: [this.defaultBinaryEditorConfigurationNode], remove: oldDefaultBinaryEditorConfigurationNode ? [oldDefaultBinaryEditorConfigurationNode] : [] });
            this.configurationRegistry.updateConfigurations({ add: [this.editorAssociationsConfiguratioNnode], remove: oldEditorAssociationsConfigurationNode ? [oldEditorAssociationsConfigurationNode] : [] });
        }
    };
    DynamicEditorResolverConfigurations.AUTO_LOCK_DEFAULT_ENABLED = new Set(['terminalEditor']);
    DynamicEditorResolverConfigurations.AUTO_LOCK_EXTRA_EDITORS = [
        // Any webview editor is not a registered editor but we
        // still want to support auto-locking for them, so we
        // manually add them here...
        {
            id: 'mainThreadWebview-markdown.preview',
            label: (0, nls_1.localize)('markdownPreview', "Markdown Preview"),
            priority: editorResolverService_1.RegisteredEditorPriority.builtin
        }
    ];
    DynamicEditorResolverConfigurations = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, extensions_1.IExtensionService)
    ], DynamicEditorResolverConfigurations);
    exports.DynamicEditorResolverConfigurations = DynamicEditorResolverConfigurations;
});
//# sourceMappingURL=editorConfiguration.js.map