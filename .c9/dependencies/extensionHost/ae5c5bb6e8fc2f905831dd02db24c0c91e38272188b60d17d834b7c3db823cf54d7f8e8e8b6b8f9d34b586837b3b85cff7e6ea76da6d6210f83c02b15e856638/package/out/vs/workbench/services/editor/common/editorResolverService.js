/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/nls", "vs/workbench/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, glob, network_1, path_1, resources_1, nls_1, configuration_1, configurationRegistry_1, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.globMatchesResource = exports.priorityToRank = exports.ResolvedStatus = exports.RegisteredEditorPriority = exports.editorsAssociationsSettingId = exports.IEditorResolverService = void 0;
    exports.IEditorResolverService = (0, instantiation_1.createDecorator)('editorResolverService');
    exports.editorsAssociationsSettingId = 'workbench.editorAssociations';
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const editorAssociationsConfigurationNode = Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { properties: {
            'workbench.editorAssociations': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('editor.editorAssociations', "Configure glob patterns to editors (e.g. `\"*.hex\": \"hexEditor.hexEdit\"`). These have precedence over the default behavior."),
                additionalProperties: {
                    type: 'string'
                }
            }
        } });
    configurationRegistry.registerConfiguration(editorAssociationsConfigurationNode);
    //#endregion
    //#region EditorResolverService types
    var RegisteredEditorPriority;
    (function (RegisteredEditorPriority) {
        RegisteredEditorPriority["builtin"] = "builtin";
        RegisteredEditorPriority["option"] = "option";
        RegisteredEditorPriority["exclusive"] = "exclusive";
        RegisteredEditorPriority["default"] = "default";
    })(RegisteredEditorPriority = exports.RegisteredEditorPriority || (exports.RegisteredEditorPriority = {}));
    /**
     * If we didn't resolve an editor dictates what to do with the opening state
     * ABORT = Do not continue with opening the editor
     * NONE = Continue as if the resolution has been disabled as the service could not resolve one
     */
    var ResolvedStatus;
    (function (ResolvedStatus) {
        ResolvedStatus[ResolvedStatus["ABORT"] = 1] = "ABORT";
        ResolvedStatus[ResolvedStatus["NONE"] = 2] = "NONE";
    })(ResolvedStatus = exports.ResolvedStatus || (exports.ResolvedStatus = {}));
    //#endregion
    //#region Util functions
    function priorityToRank(priority) {
        switch (priority) {
            case RegisteredEditorPriority.exclusive:
                return 5;
            case RegisteredEditorPriority.default:
                return 4;
            case RegisteredEditorPriority.builtin:
                return 3;
            // Text editor is priority 2
            case RegisteredEditorPriority.option:
            default:
                return 1;
        }
    }
    exports.priorityToRank = priorityToRank;
    function globMatchesResource(globPattern, resource) {
        const excludedSchemes = new Set([
            network_1.Schemas.extension,
            network_1.Schemas.webviewPanel,
            network_1.Schemas.vscodeWorkspaceTrust,
            network_1.Schemas.walkThrough,
            network_1.Schemas.vscodeSettings
        ]);
        // We want to say that the above schemes match no glob patterns
        if (excludedSchemes.has(resource.scheme)) {
            return false;
        }
        const matchOnPath = typeof globPattern === 'string' && globPattern.indexOf(path_1.posix.sep) >= 0;
        const target = matchOnPath ? `${resource.scheme}:${resource.path}` : (0, resources_1.basename)(resource);
        return glob.match(typeof globPattern === 'string' ? globPattern.toLowerCase() : globPattern, target.toLowerCase());
    }
    exports.globMatchesResource = globMatchesResource;
});
//#endregion
//# sourceMappingURL=editorResolverService.js.map