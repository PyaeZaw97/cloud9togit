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
define(["require", "exports", "url", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/shell/node/shellEnv", "vs/platform/log/common/log", "vs/platform/request/node/proxy", "zlib"], function (require, exports, url_1, async_1, buffer_1, errors_1, lifecycle_1, types_1, configuration_1, environment_1, shellEnv_1, log_1, proxy_1, zlib_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestService = void 0;
    /**
     * This service exposes the `request` API, while using the global
     * or configured proxy settings.
     */
    let RequestService = class RequestService extends lifecycle_1.Disposable {
        constructor(configurationService, environmentService, logService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.configure(configurationService.getValue());
            this._register(configurationService.onDidChangeConfiguration(() => this.configure(configurationService.getValue()), this));
        }
        configure(config) {
            this.proxyUrl = config.http && config.http.proxy;
            this.strictSSL = !!(config.http && config.http.proxyStrictSSL);
            this.authorization = config.http && config.http.proxyAuthorization;
        }
        async request(options, token) {
            this.logService.trace('RequestService#request (node) - begin', options.url);
            const { proxyUrl, strictSSL } = this;
            let shellEnv = undefined;
            try {
                shellEnv = await (0, shellEnv_1.getResolvedShellEnv)(this.logService, this.environmentService.args, process.env);
            }
            catch (error) {
                if (!this.shellEnvErrorLogged) {
                    this.shellEnvErrorLogged = true;
                    this.logService.error('RequestService#request (node) resolving shell environment failed', error);
                }
            }
            const env = Object.assign(Object.assign({}, process.env), shellEnv);
            const agent = options.agent ? options.agent : await (0, proxy_1.getProxyAgent)(options.url || '', env, { proxyUrl, strictSSL });
            options.agent = agent;
            options.strictSSL = strictSSL;
            if (this.authorization) {
                options.headers = Object.assign(Object.assign({}, (options.headers || {})), { 'Proxy-Authorization': this.authorization });
            }
            try {
                const res = await this._request(options, token);
                this.logService.trace('RequestService#request (node) - success', options.url);
                return res;
            }
            catch (error) {
                this.logService.trace('RequestService#request (node) - error', options.url, error);
                throw error;
            }
        }
        async getNodeRequest(options) {
            const endpoint = (0, url_1.parse)(options.url);
            const module = endpoint.protocol === 'https:' ? await new Promise((resolve_1, reject_1) => { require(['https'], resolve_1, reject_1); }) : await new Promise((resolve_2, reject_2) => { require(['http'], resolve_2, reject_2); });
            return module.request;
        }
        _request(options, token) {
            return async_1.Promises.withAsyncBody(async (c, e) => {
                let req;
                const endpoint = (0, url_1.parse)(options.url);
                const rawRequest = options.getRawRequest
                    ? options.getRawRequest(options)
                    : await this.getNodeRequest(options);
                const opts = {
                    hostname: endpoint.hostname,
                    port: endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80),
                    protocol: endpoint.protocol,
                    path: endpoint.path,
                    method: options.type || 'GET',
                    headers: options.headers,
                    agent: options.agent,
                    rejectUnauthorized: (0, types_1.isBoolean)(options.strictSSL) ? options.strictSSL : true
                };
                if (options.user && options.password) {
                    opts.auth = options.user + ':' + options.password;
                }
                req = rawRequest(opts, (res) => {
                    const followRedirects = (0, types_1.isNumber)(options.followRedirects) ? options.followRedirects : 3;
                    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && followRedirects > 0 && res.headers['location']) {
                        this._request(Object.assign(Object.assign({}, options), { url: res.headers['location'], followRedirects: followRedirects - 1 }), token).then(c, e);
                    }
                    else {
                        let stream = res;
                        if (res.headers['content-encoding'] === 'gzip') {
                            stream = res.pipe((0, zlib_1.createGunzip)());
                        }
                        c({ res, stream: (0, buffer_1.streamToBufferReadableStream)(stream) });
                    }
                });
                req.on('error', e);
                if (options.timeout) {
                    req.setTimeout(options.timeout);
                }
                if (options.data) {
                    if (typeof options.data === 'string') {
                        req.write(options.data);
                    }
                }
                req.end();
                token.onCancellationRequested(() => {
                    req.abort();
                    e((0, errors_1.canceled)());
                });
            });
        }
        async resolveProxy(url) {
            return undefined; // currently not implemented in node
        }
    };
    RequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, environment_1.INativeEnvironmentService),
        __param(2, log_1.ILogService)
    ], RequestService);
    exports.RequestService = RequestService;
});
//# sourceMappingURL=requestService.js.map