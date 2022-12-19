/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "http", "https", "tls", "vs/base/common/uri", "vscode-proxy-agent"], function (require, exports, http, https, tls, uri_1, vscode_proxy_agent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.connectProxyResolver = void 0;
    function connectProxyResolver(extHostWorkspace, configProvider, extensionService, extHostLogService, mainThreadTelemetry, initData) {
        const useHostProxy = initData.environment.useHostProxy;
        const doUseHostProxy = typeof useHostProxy === 'boolean' ? useHostProxy : !initData.remote.isRemote;
        const resolveProxy = (0, vscode_proxy_agent_1.createProxyResolver)({
            resolveProxy: url => extHostWorkspace.resolveProxy(url),
            getHttpProxySetting: () => configProvider.getConfiguration('http').get('proxy'),
            log: (level, message, ...args) => {
                switch (level) {
                    case vscode_proxy_agent_1.LogLevel.Trace:
                        extHostLogService.trace(message, ...args);
                        break;
                    case vscode_proxy_agent_1.LogLevel.Debug:
                        extHostLogService.debug(message, ...args);
                        break;
                    case vscode_proxy_agent_1.LogLevel.Info:
                        extHostLogService.info(message, ...args);
                        break;
                    case vscode_proxy_agent_1.LogLevel.Warning:
                        extHostLogService.warn(message, ...args);
                        break;
                    case vscode_proxy_agent_1.LogLevel.Error:
                        extHostLogService.error(message, ...args);
                        break;
                    case vscode_proxy_agent_1.LogLevel.Critical:
                        extHostLogService.critical(message, ...args);
                        break;
                    case vscode_proxy_agent_1.LogLevel.Off: break;
                    default:
                        never(level, message, args);
                        break;
                }
                function never(level, message, ...args) {
                    extHostLogService.error('Unknown log level', level);
                    extHostLogService.error(message, ...args);
                }
            },
            getLogLevel: () => extHostLogService.getLevel(),
            // TODO @chrmarti Remove this from proxy agent
            proxyResolveTelemetry: () => { },
            useHostProxy: doUseHostProxy,
            env: process.env,
        });
        const lookup = createPatchedModules(configProvider, resolveProxy);
        return configureModuleLoading(extensionService, lookup);
    }
    exports.connectProxyResolver = connectProxyResolver;
    function createPatchedModules(configProvider, resolveProxy) {
        const proxySetting = {
            config: configProvider.getConfiguration('http')
                .get('proxySupport') || 'off'
        };
        configProvider.onDidChangeConfiguration(e => {
            proxySetting.config = configProvider.getConfiguration('http')
                .get('proxySupport') || 'off';
        });
        const certSetting = {
            config: !!configProvider.getConfiguration('http')
                .get('systemCertificates')
        };
        configProvider.onDidChangeConfiguration(e => {
            certSetting.config = !!configProvider.getConfiguration('http')
                .get('systemCertificates');
        });
        return {
            http: {
                off: Object.assign({}, http, (0, vscode_proxy_agent_1.createHttpPatch)(http, resolveProxy, { config: 'off' }, certSetting, true)),
                on: Object.assign({}, http, (0, vscode_proxy_agent_1.createHttpPatch)(http, resolveProxy, { config: 'on' }, certSetting, true)),
                override: Object.assign({}, http, (0, vscode_proxy_agent_1.createHttpPatch)(http, resolveProxy, { config: 'override' }, certSetting, true)),
                onRequest: Object.assign({}, http, (0, vscode_proxy_agent_1.createHttpPatch)(http, resolveProxy, proxySetting, certSetting, true)),
                default: Object.assign(http, (0, vscode_proxy_agent_1.createHttpPatch)(http, resolveProxy, proxySetting, certSetting, false)) // run last
            },
            https: {
                off: Object.assign({}, https, (0, vscode_proxy_agent_1.createHttpPatch)(https, resolveProxy, { config: 'off' }, certSetting, true)),
                on: Object.assign({}, https, (0, vscode_proxy_agent_1.createHttpPatch)(https, resolveProxy, { config: 'on' }, certSetting, true)),
                override: Object.assign({}, https, (0, vscode_proxy_agent_1.createHttpPatch)(https, resolveProxy, { config: 'override' }, certSetting, true)),
                onRequest: Object.assign({}, https, (0, vscode_proxy_agent_1.createHttpPatch)(https, resolveProxy, proxySetting, certSetting, true)),
                default: Object.assign(https, (0, vscode_proxy_agent_1.createHttpPatch)(https, resolveProxy, proxySetting, certSetting, false)) // run last
            },
            tls: Object.assign(tls, (0, vscode_proxy_agent_1.createTlsPatch)(tls))
        };
    }
    const modulesCache = new Map();
    function configureModuleLoading(extensionService, lookup) {
        return extensionService.getExtensionPathIndex()
            .then(extensionPaths => {
            const node_module = require.__$__nodeRequire('module');
            const original = node_module._load;
            node_module._load = function load(request, parent, isMain) {
                if (request === 'tls') {
                    return lookup.tls;
                }
                if (request !== 'http' && request !== 'https') {
                    return original.apply(this, arguments);
                }
                const modules = lookup[request];
                const ext = extensionPaths.findSubstr(uri_1.URI.file(parent.filename));
                let cache = modulesCache.get(ext);
                if (!cache) {
                    modulesCache.set(ext, cache = {});
                }
                if (!cache[request]) {
                    let mod = modules.default;
                    cache[request] = Object.assign({}, mod); // Copy to work around #93167.
                }
                return cache[request];
            };
        });
    }
});
//# sourceMappingURL=proxyResolver.js.map