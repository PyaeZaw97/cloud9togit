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
define(["require", "exports", "child_process", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/log/common/log"], function (require, exports, child_process_1, async_1, errorMessage_1, event_1, lifecycle_1, network_1, path_1, pfs_1, environment_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsLifecycle = void 0;
    let ExtensionsLifecycle = class ExtensionsLifecycle extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.processesLimiter = new async_1.Limiter(5); // Run max 5 processes in parallel
        }
        async postUninstall(extension) {
            const script = this.parseScript(extension, 'uninstall');
            if (script) {
                this.logService.info(extension.identifier.id, extension.manifest.version, `Running post uninstall script`);
                await this.processesLimiter.queue(() => this.runLifecycleHook(script.script, 'uninstall', script.args, true, extension)
                    .then(() => this.logService.info(extension.identifier.id, extension.manifest.version, `Finished running post uninstall script`), err => this.logService.error(extension.identifier.id, extension.manifest.version, `Failed to run post uninstall script: ${err}`)));
            }
            return pfs_1.Promises.rm(this.getExtensionStoragePath(extension)).then(undefined, e => this.logService.error('Error while removing extension storage path', e));
        }
        parseScript(extension, type) {
            const scriptKey = `vscode:${type}`;
            if (extension.location.scheme === network_1.Schemas.file && extension.manifest && extension.manifest['scripts'] && typeof extension.manifest['scripts'][scriptKey] === 'string') {
                const script = extension.manifest['scripts'][scriptKey].split(' ');
                if (script.length < 2 || script[0] !== 'node' || !script[1]) {
                    this.logService.warn(extension.identifier.id, extension.manifest.version, `${scriptKey} should be a node script`);
                    return null;
                }
                return { script: (0, path_1.join)(extension.location.fsPath, script[1]), args: script.slice(2) || [] };
            }
            return null;
        }
        runLifecycleHook(lifecycleHook, lifecycleType, args, timeout, extension) {
            return new Promise((c, e) => {
                const extensionLifecycleProcess = this.start(lifecycleHook, lifecycleType, args, extension);
                let timeoutHandler;
                const onexit = (error) => {
                    if (timeoutHandler) {
                        clearTimeout(timeoutHandler);
                        timeoutHandler = null;
                    }
                    if (error) {
                        e(error);
                    }
                    else {
                        c(undefined);
                    }
                };
                // on error
                extensionLifecycleProcess.on('error', (err) => {
                    onexit((0, errorMessage_1.toErrorMessage)(err) || 'Unknown');
                });
                // on exit
                extensionLifecycleProcess.on('exit', (code, signal) => {
                    onexit(code ? `post-${lifecycleType} process exited with code ${code}` : undefined);
                });
                if (timeout) {
                    // timeout: kill process after waiting for 5s
                    timeoutHandler = setTimeout(() => {
                        timeoutHandler = null;
                        extensionLifecycleProcess.kill();
                        e('timed out');
                    }, 5000);
                }
            });
        }
        start(uninstallHook, lifecycleType, args, extension) {
            const opts = {
                silent: true,
                execArgv: undefined
            };
            const extensionUninstallProcess = (0, child_process_1.fork)(uninstallHook, [`--type=extension-post-${lifecycleType}`, ...args], opts);
            extensionUninstallProcess.stdout.setEncoding('utf8');
            extensionUninstallProcess.stderr.setEncoding('utf8');
            const onStdout = event_1.Event.fromNodeEventEmitter(extensionUninstallProcess.stdout, 'data');
            const onStderr = event_1.Event.fromNodeEventEmitter(extensionUninstallProcess.stderr, 'data');
            // Log output
            onStdout(data => this.logService.info(extension.identifier.id, extension.manifest.version, `post-${lifecycleType}`, data));
            onStderr(data => this.logService.error(extension.identifier.id, extension.manifest.version, `post-${lifecycleType}`, data));
            const onOutput = event_1.Event.any(event_1.Event.map(onStdout, o => ({ data: `%c${o}`, format: [''] })), event_1.Event.map(onStderr, o => ({ data: `%c${o}`, format: ['color: red'] })));
            // Debounce all output, so we can render it in the Chrome console as a group
            const onDebouncedOutput = event_1.Event.debounce(onOutput, (r, o) => {
                return r
                    ? { data: r.data + o.data, format: [...r.format, ...o.format] }
                    : { data: o.data, format: o.format };
            }, 100);
            // Print out output
            onDebouncedOutput(data => {
                console.group(extension.identifier.id);
                console.log(data.data, ...data.format);
                console.groupEnd();
            });
            return extensionUninstallProcess;
        }
        getExtensionStoragePath(extension) {
            return (0, path_1.join)(this.environmentService.globalStorageHome.fsPath, extension.identifier.id.toLowerCase());
        }
    };
    ExtensionsLifecycle = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, log_1.ILogService)
    ], ExtensionsLifecycle);
    exports.ExtensionsLifecycle = ExtensionsLifecycle;
});
//# sourceMappingURL=extensionLifecycle.js.map