/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, platform, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionEnvironmentChannelClient = void 0;
    class RemoteExtensionEnvironmentChannelClient {
        static async getEnvironmentData(channel, remoteAuthority) {
            const args = {
                remoteAuthority
            };
            const data = await channel.call('getEnvironmentData', args);
            return {
                pid: data.pid,
                connectionToken: data.connectionToken,
                appRoot: uri_1.URI.revive(data.appRoot),
                settingsPath: uri_1.URI.revive(data.settingsPath),
                logsPath: uri_1.URI.revive(data.logsPath),
                extensionsPath: uri_1.URI.revive(data.extensionsPath),
                extensionHostLogsPath: uri_1.URI.revive(data.extensionHostLogsPath),
                globalStorageHome: uri_1.URI.revive(data.globalStorageHome),
                workspaceStorageHome: uri_1.URI.revive(data.workspaceStorageHome),
                localHistoryHome: uri_1.URI.revive(data.localHistoryHome),
                userHome: uri_1.URI.revive(data.userHome),
                os: data.os,
                arch: data.arch,
                marks: data.marks,
                useHostProxy: data.useHostProxy
            };
        }
        static async getExtensionHostExitInfo(channel, remoteAuthority, reconnectionToken) {
            const args = {
                remoteAuthority,
                reconnectionToken
            };
            return channel.call('getExtensionHostExitInfo', args);
        }
        static async whenExtensionsReady(channel) {
            await channel.call('whenExtensionsReady');
        }
        static async scanExtensions(channel, remoteAuthority, extensionDevelopmentPath, skipExtensions) {
            const args = {
                language: platform.language,
                remoteAuthority,
                extensionDevelopmentPath,
                skipExtensions
            };
            const extensions = await channel.call('scanExtensions', args);
            extensions.forEach(ext => { ext.extensionLocation = uri_1.URI.revive(ext.extensionLocation); });
            return extensions;
        }
        static async scanSingleExtension(channel, remoteAuthority, isBuiltin, extensionLocation) {
            const args = {
                language: platform.language,
                remoteAuthority,
                isBuiltin,
                extensionLocation
            };
            const extension = await channel.call('scanSingleExtension', args);
            if (extension) {
                extension.extensionLocation = uri_1.URI.revive(extension.extensionLocation);
            }
            return extension;
        }
        static getDiagnosticInfo(channel, options) {
            return channel.call('getDiagnosticInfo', options);
        }
        static updateTelemetryLevel(channel, telemetryLevel) {
            return channel.call('updateTelemetryLevel', { telemetryLevel });
        }
        static logTelemetry(channel, eventName, data) {
            return channel.call('logTelemetry', { eventName, data });
        }
        static flushTelemetry(channel) {
            return channel.call('flushTelemetry');
        }
    }
    exports.RemoteExtensionEnvironmentChannelClient = RemoteExtensionEnvironmentChannelClient;
});
//# sourceMappingURL=remoteAgentEnvironmentChannel.js.map