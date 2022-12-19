/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform"], function (require, exports, buffer_1, nls_1, configurationRegistry_1, instantiation_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updateProxyConfigurationsScope = exports.asJson = exports.asTextOrError = exports.asText = exports.isSuccess = exports.IRequestService = void 0;
    exports.IRequestService = (0, instantiation_1.createDecorator)('requestService');
    function isSuccess(context) {
        return (context.res.statusCode && context.res.statusCode >= 200 && context.res.statusCode < 300) || context.res.statusCode === 1223;
    }
    exports.isSuccess = isSuccess;
    function hasNoContent(context) {
        return context.res.statusCode === 204;
    }
    async function asText(context) {
        if (hasNoContent(context)) {
            return null;
        }
        const buffer = await (0, buffer_1.streamToBuffer)(context.stream);
        return buffer.toString();
    }
    exports.asText = asText;
    async function asTextOrError(context) {
        if (!isSuccess(context)) {
            throw new Error('Server returned ' + context.res.statusCode);
        }
        return asText(context);
    }
    exports.asTextOrError = asTextOrError;
    async function asJson(context) {
        if (!isSuccess(context)) {
            throw new Error('Server returned ' + context.res.statusCode);
        }
        if (hasNoContent(context)) {
            return null;
        }
        const buffer = await (0, buffer_1.streamToBuffer)(context.stream);
        const str = buffer.toString();
        try {
            return JSON.parse(str);
        }
        catch (err) {
            err.message += ':\n' + str;
            throw err;
        }
    }
    exports.asJson = asJson;
    function updateProxyConfigurationsScope(scope) {
        registerProxyConfigurations(scope);
    }
    exports.updateProxyConfigurationsScope = updateProxyConfigurationsScope;
    let proxyConfiguration;
    function registerProxyConfigurations(scope) {
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const oldProxyConfiguration = proxyConfiguration;
        proxyConfiguration = {
            id: 'http',
            order: 15,
            title: (0, nls_1.localize)('httpConfigurationTitle', "HTTP"),
            type: 'object',
            scope,
            properties: {
                'http.proxy': {
                    type: 'string',
                    pattern: '^https?://([^:]*(:[^@]*)?@)?([^:]+|\\[[:0-9a-fA-F]+\\])(:\\d+)?/?$|^$',
                    markdownDescription: (0, nls_1.localize)('proxy', "The proxy setting to use. If not set, will be inherited from the `http_proxy` and `https_proxy` environment variables."),
                    restricted: true
                },
                'http.proxyStrictSSL': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('strictSSL', "Controls whether the proxy server certificate should be verified against the list of supplied CAs."),
                    restricted: true
                },
                'http.proxyAuthorization': {
                    type: ['null', 'string'],
                    default: null,
                    markdownDescription: (0, nls_1.localize)('proxyAuthorization', "The value to send as the `Proxy-Authorization` header for every network request."),
                    restricted: true
                },
                'http.proxySupport': {
                    type: 'string',
                    enum: ['off', 'on', 'fallback', 'override'],
                    enumDescriptions: [
                        (0, nls_1.localize)('proxySupportOff', "Disable proxy support for extensions."),
                        (0, nls_1.localize)('proxySupportOn', "Enable proxy support for extensions."),
                        (0, nls_1.localize)('proxySupportFallback', "Enable proxy support for extensions, fall back to request options, when no proxy found."),
                        (0, nls_1.localize)('proxySupportOverride', "Enable proxy support for extensions, override request options."),
                    ],
                    default: 'override',
                    description: (0, nls_1.localize)('proxySupport', "Use the proxy support for extensions."),
                    restricted: true
                },
                'http.systemCertificates': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('systemCertificates', "Controls whether CA certificates should be loaded from the OS. (On Windows and macOS, a reload of the window is required after turning this off.)"),
                    restricted: true
                }
            }
        };
        configurationRegistry.updateConfigurations({ add: [proxyConfiguration], remove: oldProxyConfiguration ? [oldProxyConfiguration] : [] });
    }
    registerProxyConfigurations(2 /* ConfigurationScope.MACHINE */);
});
//# sourceMappingURL=request.js.map