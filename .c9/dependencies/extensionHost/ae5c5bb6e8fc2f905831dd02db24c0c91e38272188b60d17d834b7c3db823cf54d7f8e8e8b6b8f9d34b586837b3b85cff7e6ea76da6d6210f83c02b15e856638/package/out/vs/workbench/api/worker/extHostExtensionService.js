/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.api.impl", "vs/workbench/api/common/extHostExtensionService", "vs/base/common/uri", "vs/workbench/api/common/extHostRequireInterceptor", "vs/workbench/api/common/extHostTypes", "vs/base/common/async", "vs/workbench/api/common/extHost.protocol"], function (require, exports, extHost_api_impl_1, extHostExtensionService_1, uri_1, extHostRequireInterceptor_1, extHostTypes_1, async_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostExtensionService = void 0;
    class WorkerRequireInterceptor extends extHostRequireInterceptor_1.RequireInterceptor {
        _installInterceptor() { }
        getModule(request, parent) {
            for (let alternativeModuleName of this._alternatives) {
                let alternative = alternativeModuleName(request);
                if (alternative) {
                    request = alternative;
                    break;
                }
            }
            if (this._factories.has(request)) {
                return this._factories.get(request).load(request, parent, () => { throw new Error('CANNOT LOAD MODULE from here.'); });
            }
            return undefined;
        }
    }
    class ExtHostExtensionService extends extHostExtensionService_1.AbstractExtHostExtensionService {
        constructor() {
            super(...arguments);
            this.extensionRuntime = extHostTypes_1.ExtensionRuntime.Webworker;
        }
        async _beforeAlmostReadyToRunExtensions() {
            const mainThreadConsole = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadConsole);
            wrapConsoleMethods(mainThreadConsole, this._initData.environment.isExtensionDevelopmentDebug);
            // initialize API and register actors
            const apiFactory = this._instaService.invokeFunction(extHost_api_impl_1.createApiFactoryAndRegisterActors);
            this._fakeModules = this._instaService.createInstance(WorkerRequireInterceptor, apiFactory, { mine: this._myRegistry, all: this._globalRegistry });
            await this._fakeModules.install();
            performance.mark('code/extHost/didInitAPI');
            await this._waitForDebuggerAttachment();
        }
        _getEntryPoint(extensionDescription) {
            return extensionDescription.browser;
        }
        async _loadCommonJSModule(extensionId, module, activationTimesBuilder) {
            module = module.with({ path: ensureSuffix(module.path, '.js') });
            if (extensionId) {
                performance.mark(`code/extHost/willFetchExtensionCode/${extensionId.value}`);
            }
            // First resolve the extension entry point URI to something we can load using `fetch`
            // This needs to be done on the main thread due to a potential `resourceUriProvider` (workbench api)
            // which is only available in the main thread
            const browserUri = uri_1.URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module));
            const response = await fetch(browserUri.toString(true));
            if (extensionId) {
                performance.mark(`code/extHost/didFetchExtensionCode/${extensionId.value}`);
            }
            if (response.status !== 200) {
                throw new Error(response.statusText);
            }
            // fetch JS sources as text and create a new function around it
            const source = await response.text();
            // Here we append #vscode-extension to serve as a marker, such that source maps
            // can be adjusted for the extra wrapping function.
            const sourceURL = `${module.toString(true)}#vscode-extension`;
            const fullSource = `${source}\n//# sourceURL=${sourceURL}`;
            let initFn;
            try {
                initFn = new Function('module', 'exports', 'require', fullSource);
            }
            catch (err) {
                if (extensionId) {
                    console.error(`Loading code for extension ${extensionId.value} failed: ${err.message}`);
                }
                else {
                    console.error(`Loading code failed: ${err.message}`);
                }
                console.error(`${module.toString(true)}${typeof err.line === 'number' ? ` line ${err.line}` : ''}${typeof err.column === 'number' ? ` column ${err.column}` : ''}`);
                console.error(err);
                throw err;
            }
            // define commonjs globals: `module`, `exports`, and `require`
            const _exports = {};
            const _module = { exports: _exports };
            const _require = (request) => {
                const result = this._fakeModules.getModule(request, module);
                if (result === undefined) {
                    throw new Error(`Cannot load module '${request}'`);
                }
                return result;
            };
            try {
                activationTimesBuilder.codeLoadingStart();
                if (extensionId) {
                    performance.mark(`code/extHost/willLoadExtensionCode/${extensionId.value}`);
                }
                initFn(_module, _exports, _require);
                return (_module.exports !== _exports ? _module.exports : _exports);
            }
            finally {
                if (extensionId) {
                    performance.mark(`code/extHost/didLoadExtensionCode/${extensionId.value}`);
                }
                activationTimesBuilder.codeLoadingStop();
            }
        }
        async $setRemoteEnvironment(_env) {
            return;
        }
        async _waitForDebuggerAttachment(waitTimeout = 5000) {
            // debugger attaches async, waiting for it fixes #106698 and #99222
            if (!this._initData.environment.isExtensionDevelopmentDebug) {
                return;
            }
            const deadline = Date.now() + waitTimeout;
            while (Date.now() < deadline && !('__jsDebugIsReady' in globalThis)) {
                await (0, async_1.timeout)(10);
            }
        }
    }
    exports.ExtHostExtensionService = ExtHostExtensionService;
    function ensureSuffix(path, suffix) {
        return path.endsWith(suffix) ? path : path + suffix;
    }
    // copied from bootstrap-fork.js
    function wrapConsoleMethods(service, callToNative) {
        wrap('info', 'log');
        wrap('log', 'log');
        wrap('warn', 'warn');
        wrap('error', 'error');
        function wrap(method, severity) {
            const original = console[method];
            console[method] = function () {
                service.$logExtensionHostMessage({ type: '__$console', severity, arguments: safeToArray(arguments) });
                if (callToNative) {
                    original.apply(console, arguments);
                }
            };
        }
        const MAX_LENGTH = 100000;
        function safeToArray(args) {
            const seen = [];
            const argsArray = [];
            // Massage some arguments with special treatment
            if (args.length) {
                for (let i = 0; i < args.length; i++) {
                    // Any argument of type 'undefined' needs to be specially treated because
                    // JSON.stringify will simply ignore those. We replace them with the string
                    // 'undefined' which is not 100% right, but good enough to be logged to console
                    if (typeof args[i] === 'undefined') {
                        args[i] = 'undefined';
                    }
                    // Any argument that is an Error will be changed to be just the error stack/message
                    // itself because currently cannot serialize the error over entirely.
                    else if (args[i] instanceof Error) {
                        const errorObj = args[i];
                        if (errorObj.stack) {
                            args[i] = errorObj.stack;
                        }
                        else {
                            args[i] = errorObj.toString();
                        }
                    }
                    argsArray.push(args[i]);
                }
            }
            try {
                const res = JSON.stringify(argsArray, function (key, value) {
                    // Objects get special treatment to prevent circles
                    if (value && typeof value === 'object') {
                        if (seen.indexOf(value) !== -1) {
                            return '[Circular]';
                        }
                        seen.push(value);
                    }
                    return value;
                });
                if (res.length > MAX_LENGTH) {
                    return 'Output omitted for a large object that exceeds the limits';
                }
                return res;
            }
            catch (error) {
                return `Output omitted for an object that cannot be inspected ('${error.toString()}')`;
            }
        }
    }
});
//# sourceMappingURL=extHostExtensionService.js.map