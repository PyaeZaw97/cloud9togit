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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/contextkey/common/contextkey"], function (require, exports, instantiation_1, lifecycle_1, extensionManagementUtil_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INSTALL_ACTIONS_GROUP = exports.THEME_ACTIONS_GROUP = exports.HasOutdatedExtensionsContext = exports.ExtensionsSortByContext = exports.DefaultViewsContext = exports.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID = exports.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID = exports.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID = exports.TOGGLE_IGNORE_EXTENSION_ACTION_ID = exports.WORKSPACE_RECOMMENDATIONS_VIEW_ID = exports.ExtensionContainers = exports.CloseExtensionDetailsOnViewChangeKey = exports.AutoCheckUpdatesConfigurationKey = exports.AutoUpdateConfigurationKey = exports.ConfigurationKey = exports.ExtensionEditorTab = exports.IExtensionsWorkbenchService = exports.SERVICE_ID = exports.ExtensionState = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.extensions';
    var ExtensionState;
    (function (ExtensionState) {
        ExtensionState[ExtensionState["Installing"] = 0] = "Installing";
        ExtensionState[ExtensionState["Installed"] = 1] = "Installed";
        ExtensionState[ExtensionState["Uninstalling"] = 2] = "Uninstalling";
        ExtensionState[ExtensionState["Uninstalled"] = 3] = "Uninstalled";
    })(ExtensionState = exports.ExtensionState || (exports.ExtensionState = {}));
    exports.SERVICE_ID = 'extensionsWorkbenchService';
    exports.IExtensionsWorkbenchService = (0, instantiation_1.createDecorator)(exports.SERVICE_ID);
    var ExtensionEditorTab;
    (function (ExtensionEditorTab) {
        ExtensionEditorTab["Readme"] = "readme";
        ExtensionEditorTab["Contributions"] = "contributions";
        ExtensionEditorTab["Changelog"] = "changelog";
        ExtensionEditorTab["Dependencies"] = "dependencies";
        ExtensionEditorTab["ExtensionPack"] = "extensionPack";
        ExtensionEditorTab["RuntimeStatus"] = "runtimeStatus";
    })(ExtensionEditorTab = exports.ExtensionEditorTab || (exports.ExtensionEditorTab = {}));
    exports.ConfigurationKey = 'extensions';
    exports.AutoUpdateConfigurationKey = 'extensions.autoUpdate';
    exports.AutoCheckUpdatesConfigurationKey = 'extensions.autoCheckUpdates';
    exports.CloseExtensionDetailsOnViewChangeKey = 'extensions.closeExtensionDetailsOnViewChange';
    let ExtensionContainers = class ExtensionContainers extends lifecycle_1.Disposable {
        constructor(containers, extensionsWorkbenchService) {
            super();
            this.containers = containers;
            this._register(extensionsWorkbenchService.onChange(this.update, this));
        }
        set extension(extension) {
            this.containers.forEach(c => c.extension = extension);
        }
        update(extension) {
            for (const container of this.containers) {
                if (extension && container.extension) {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(container.extension.identifier, extension.identifier)) {
                        if (container.extension.server && extension.server && container.extension.server !== extension.server) {
                            if (container.updateWhenCounterExtensionChanges) {
                                container.update();
                            }
                        }
                        else {
                            container.extension = extension;
                        }
                    }
                }
                else {
                    container.update();
                }
            }
        }
    };
    ExtensionContainers = __decorate([
        __param(1, exports.IExtensionsWorkbenchService)
    ], ExtensionContainers);
    exports.ExtensionContainers = ExtensionContainers;
    exports.WORKSPACE_RECOMMENDATIONS_VIEW_ID = 'workbench.views.extensions.workspaceRecommendations';
    exports.TOGGLE_IGNORE_EXTENSION_ACTION_ID = 'workbench.extensions.action.toggleIgnoreExtension';
    exports.SELECT_INSTALL_VSIX_EXTENSION_COMMAND_ID = 'workbench.extensions.action.installVSIX';
    exports.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID = 'workbench.extensions.command.installFromVSIX';
    exports.LIST_WORKSPACE_UNSUPPORTED_EXTENSIONS_COMMAND_ID = 'workbench.extensions.action.listWorkspaceUnsupportedExtensions';
    // Context Keys
    exports.DefaultViewsContext = new contextkey_1.RawContextKey('defaultExtensionViews', true);
    exports.ExtensionsSortByContext = new contextkey_1.RawContextKey('extensionsSortByValue', '');
    exports.HasOutdatedExtensionsContext = new contextkey_1.RawContextKey('hasOutdatedExtensions', false);
    // Context Menu Groups
    exports.THEME_ACTIONS_GROUP = '_theme_';
    exports.INSTALL_ACTIONS_GROUP = '0_install';
});
//# sourceMappingURL=extensions.js.map