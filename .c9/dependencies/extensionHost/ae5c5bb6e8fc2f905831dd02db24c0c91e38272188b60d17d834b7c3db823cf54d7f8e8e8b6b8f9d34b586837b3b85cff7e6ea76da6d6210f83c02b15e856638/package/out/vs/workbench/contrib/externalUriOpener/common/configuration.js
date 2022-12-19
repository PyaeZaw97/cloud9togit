/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/configuration", "vs/nls", "vs/platform/registry/common/platform"], function (require, exports, configurationRegistry_1, configuration_1, nls, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updateContributedOpeners = exports.externalUriOpenersConfigurationNode = exports.externalUriOpenersSettingId = exports.defaultExternalUriOpenerId = void 0;
    exports.defaultExternalUriOpenerId = 'default';
    exports.externalUriOpenersSettingId = 'workbench.externalUriOpeners';
    const externalUriOpenerIdSchemaAddition = {
        type: 'string',
        enum: []
    };
    const exampleUriPatterns = `
- \`https://microsoft.com\`: Matches this specific domain using https
- \`https://microsoft.com:8080\`: Matches this specific domain on this port using https
- \`https://microsoft.com:*\`: Matches this specific domain on any port using https
- \`https://microsoft.com/foo\`: Matches \`https://microsoft.com/foo\` and \`https://microsoft.com/foo/bar\`, but not \`https://microsoft.com/foobar\` or \`https://microsoft.com/bar\`
- \`https://*.microsoft.com\`: Match all domains ending in \`microsoft.com\` using https
- \`microsoft.com\`: Match this specific domain using either http or https
- \`*.microsoft.com\`: Match all domains ending in \`microsoft.com\` using either http or https
- \`http://192.168.0.1\`: Matches this specific IP using http
- \`http://192.168.0.*\`: Matches all IP's with this prefix using http
- \`*\`: Match all domains using either http or https`;
    exports.externalUriOpenersConfigurationNode = Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
            [exports.externalUriOpenersSettingId]: {
                type: 'object',
                markdownDescription: nls.localize('externalUriOpeners', "Configure the opener to use for external URIs (http, https)."),
                defaultSnippets: [{
                        body: {
                            'example.com': '$1'
                        }
                    }],
                additionalProperties: {
                    anyOf: [
                        {
                            type: 'string',
                            markdownDescription: nls.localize('externalUriOpeners.uri', "Map URI pattern to an opener id.\nExample patterns: \n{0}", exampleUriPatterns),
                        },
                        {
                            type: 'string',
                            markdownDescription: nls.localize('externalUriOpeners.uri', "Map URI pattern to an opener id.\nExample patterns: \n{0}", exampleUriPatterns),
                            enum: [exports.defaultExternalUriOpenerId],
                            enumDescriptions: [nls.localize('externalUriOpeners.defaultId', "Open using VS Code's standard opener.")],
                        },
                        externalUriOpenerIdSchemaAddition
                    ]
                }
            }
        } });
    function updateContributedOpeners(enumValues, enumDescriptions) {
        externalUriOpenerIdSchemaAddition.enum = enumValues;
        externalUriOpenerIdSchemaAddition.enumDescriptions = enumDescriptions;
        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
            .notifyConfigurationSchemaUpdated(exports.externalUriOpenersConfigurationNode);
    }
    exports.updateContributedOpeners = updateContributedOpeners;
});
//# sourceMappingURL=configuration.js.map