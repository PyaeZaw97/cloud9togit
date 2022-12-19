/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInstanceFromResource = exports.getTerminalResourcesFromDragEvent = exports.getTerminalUri = exports.parseTerminalUri = void 0;
    function parseTerminalUri(resource) {
        const [, workspaceId, instanceId] = resource.path.split('/');
        if (!workspaceId || !Number.parseInt(instanceId)) {
            throw new Error(`Could not parse terminal uri for resource ${resource}`);
        }
        return { workspaceId, instanceId: Number.parseInt(instanceId) };
    }
    exports.parseTerminalUri = parseTerminalUri;
    function getTerminalUri(workspaceId, instanceId, title) {
        return uri_1.URI.from({
            scheme: network_1.Schemas.vscodeTerminal,
            path: `/${workspaceId}/${instanceId}`,
            fragment: title || undefined,
        });
    }
    exports.getTerminalUri = getTerminalUri;
    function getTerminalResourcesFromDragEvent(event) {
        var _a;
        const resources = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("Terminals" /* TerminalDataTransfers.Terminals */);
        if (resources) {
            const json = JSON.parse(resources);
            const result = [];
            for (const entry of json) {
                result.push(uri_1.URI.parse(entry));
            }
            return result.length === 0 ? undefined : result;
        }
        return undefined;
    }
    exports.getTerminalResourcesFromDragEvent = getTerminalResourcesFromDragEvent;
    function getInstanceFromResource(instances, resource) {
        if (resource) {
            for (const instance of instances) {
                // Note that the URI's workspace and instance id might not originally be from this window
                // Don't bother checking the scheme and assume instances only contains terminals
                if (instance.resource.path === resource.path) {
                    return instance;
                }
            }
        }
        return undefined;
    }
    exports.getInstanceFromResource = getInstanceFromResource;
});
//# sourceMappingURL=terminalUri.js.map