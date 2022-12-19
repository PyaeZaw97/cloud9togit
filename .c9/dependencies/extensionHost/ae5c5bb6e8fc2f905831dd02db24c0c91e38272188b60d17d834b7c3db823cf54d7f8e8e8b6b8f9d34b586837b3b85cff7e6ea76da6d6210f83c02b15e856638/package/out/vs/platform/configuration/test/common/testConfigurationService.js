/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/map", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, event_1, map_1, configuration_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestConfigurationService = void 0;
    class TestConfigurationService {
        constructor(configuration) {
            this.onDidChangeConfigurationEmitter = new event_1.Emitter();
            this.onDidChangeConfiguration = this.onDidChangeConfigurationEmitter.event;
            this.configurationByRoot = map_1.TernarySearchTree.forPaths();
            this.overrideIdentifiers = new Map();
            this.configuration = configuration || Object.create(null);
        }
        reloadConfiguration() {
            return Promise.resolve(this.getValue());
        }
        getValue(arg1, arg2) {
            var _a;
            let configuration;
            const overrides = (0, configuration_1.isConfigurationOverrides)(arg1) ? arg1 : (0, configuration_1.isConfigurationOverrides)(arg2) ? arg2 : undefined;
            if (overrides) {
                if (overrides.resource) {
                    configuration = this.configurationByRoot.findSubstr(overrides.resource.fsPath);
                }
            }
            configuration = configuration ? configuration : this.configuration;
            if (arg1 && typeof arg1 === 'string') {
                return (_a = configuration[arg1]) !== null && _a !== void 0 ? _a : (0, configuration_1.getConfigurationValue)(configuration, arg1);
            }
            return configuration;
        }
        updateValue(key, value) {
            return Promise.resolve(undefined);
        }
        setUserConfiguration(key, value, root) {
            if (root) {
                const configForRoot = this.configurationByRoot.get(root.fsPath) || Object.create(null);
                configForRoot[key] = value;
                this.configurationByRoot.set(root.fsPath, configForRoot);
            }
            else {
                this.configuration[key] = value;
            }
            return Promise.resolve(undefined);
        }
        setOverrideIdentifiers(key, identifiers) {
            this.overrideIdentifiers.set(key, identifiers);
        }
        inspect(key, overrides) {
            const config = this.getValue(undefined, overrides);
            return {
                value: (0, configuration_1.getConfigurationValue)(config, key),
                defaultValue: (0, configuration_1.getConfigurationValue)(config, key),
                userValue: (0, configuration_1.getConfigurationValue)(config, key),
                overrideIdentifiers: this.overrideIdentifiers.get(key)
            };
        }
        keys() {
            return {
                default: Object.keys(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties()),
                user: Object.keys(this.configuration),
                workspace: [],
                workspaceFolder: []
            };
        }
        getConfigurationData() {
            return null;
        }
    }
    exports.TestConfigurationService = TestConfigurationService;
});
//# sourceMappingURL=testConfigurationService.js.map