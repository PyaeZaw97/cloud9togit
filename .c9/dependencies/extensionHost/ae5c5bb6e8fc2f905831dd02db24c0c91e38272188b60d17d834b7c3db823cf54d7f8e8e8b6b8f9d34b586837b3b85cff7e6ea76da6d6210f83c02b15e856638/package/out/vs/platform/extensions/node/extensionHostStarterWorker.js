/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "child_process", "string_decoder", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/stopwatch"], function (require, exports, child_process_1, string_decoder_1, async_1, errors_1, event_1, lifecycle_1, network_1, objects_1, platform, process_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.create = exports.ExtensionHostStarter = void 0;
    class ExtensionHostProcess extends lifecycle_1.Disposable {
        constructor(id, _host) {
            super();
            this.id = id;
            this._host = _host;
            this._onStdout = this._register(new event_1.Emitter());
            this.onStdout = this._onStdout.event;
            this._onStderr = this._register(new event_1.Emitter());
            this.onStderr = this._onStderr.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._onExit = this._register(new event_1.Emitter());
            this.onExit = this._onExit.event;
            this._process = null;
            this._hasExited = false;
        }
        start(opts) {
            var _a, _b;
            if (platform.isCI) {
                this._host.logInfo(`Calling fork to start extension host...`);
            }
            const sw = stopwatch_1.StopWatch.create(false);
            this._process = (0, child_process_1.fork)(network_1.FileAccess.asFileUri('bootstrap-fork', require).fsPath, ['--type=extensionHost', '--skipWorkspaceStorageLock'], (0, objects_1.mixin)({ cwd: (0, process_1.cwd)() }, opts));
            const forkTime = sw.elapsed();
            const pid = this._process.pid;
            this._host.logInfo(`Starting extension host with pid ${pid} (fork() took ${forkTime} ms).`);
            const stdoutDecoder = new string_decoder_1.StringDecoder('utf-8');
            (_a = this._process.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (chunk) => {
                const strChunk = typeof chunk === 'string' ? chunk : stdoutDecoder.write(chunk);
                this._onStdout.fire(strChunk);
            });
            const stderrDecoder = new string_decoder_1.StringDecoder('utf-8');
            (_b = this._process.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (chunk) => {
                const strChunk = typeof chunk === 'string' ? chunk : stderrDecoder.write(chunk);
                this._onStderr.fire(strChunk);
            });
            this._process.on('message', msg => {
                this._onMessage.fire(msg);
            });
            this._process.on('error', (err) => {
                this._onError.fire({ error: (0, errors_1.transformErrorForSerialization)(err) });
            });
            this._process.on('exit', (code, signal) => {
                this._hasExited = true;
                this._onExit.fire({ pid, code, signal });
            });
            return { pid };
        }
        enableInspectPort() {
            if (!this._process) {
                return false;
            }
            this._host.logInfo(`Enabling inspect port on extension host with pid ${this._process.pid}.`);
            if (typeof process._debugProcess === 'function') {
                // use (undocumented) _debugProcess feature of node
                process._debugProcess(this._process.pid);
                return true;
            }
            else if (!platform.isWindows) {
                // use KILL USR1 on non-windows platforms (fallback)
                this._process.kill('SIGUSR1');
                return true;
            }
            else {
                // not supported...
                return false;
            }
        }
        kill() {
            if (!this._process) {
                return;
            }
            this._host.logInfo(`Killing extension host with pid ${this._process.pid}.`);
            this._process.kill();
        }
        async waitForExit(maxWaitTimeMs) {
            if (!this._process) {
                return;
            }
            const pid = this._process.pid;
            this._host.logInfo(`Waiting for extension host with pid ${pid} to exit.`);
            await Promise.race([event_1.Event.toPromise(this.onExit), (0, async_1.timeout)(maxWaitTimeMs)]);
            if (!this._hasExited) {
                // looks like we timed out
                this._host.logInfo(`Extension host with pid ${pid} did not exit within ${maxWaitTimeMs}ms.`);
                this._process.kill();
            }
        }
    }
    class ExtensionHostStarter {
        constructor(_host) {
            this._host = _host;
            this._extHosts = new Map();
        }
        dispose() {
            // Intentionally not killing the extension host processes
        }
        _getExtHost(id) {
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                throw new Error(`Unknown extension host!`);
            }
            return extHostProcess;
        }
        onDynamicStdout(id) {
            return this._getExtHost(id).onStdout;
        }
        onDynamicStderr(id) {
            return this._getExtHost(id).onStderr;
        }
        onDynamicMessage(id) {
            return this._getExtHost(id).onMessage;
        }
        onDynamicError(id) {
            return this._getExtHost(id).onError;
        }
        onDynamicExit(id) {
            return this._getExtHost(id).onExit;
        }
        async createExtensionHost() {
            const id = String(++ExtensionHostStarter._lastId);
            const extHost = new ExtensionHostProcess(id, this._host);
            this._extHosts.set(id, extHost);
            extHost.onExit(({ pid, code, signal }) => {
                this._host.logInfo(`Extension host with pid ${pid} exited with code: ${code}, signal: ${signal}.`);
                setTimeout(() => {
                    extHost.dispose();
                    this._extHosts.delete(id);
                });
            });
            return { id };
        }
        async start(id, opts) {
            return this._getExtHost(id).start(opts);
        }
        async enableInspectPort(id) {
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                return false;
            }
            return extHostProcess.enableInspectPort();
        }
        async kill(id) {
            const extHostProcess = this._extHosts.get(id);
            if (!extHostProcess) {
                // already gone!
                return;
            }
            extHostProcess.kill();
        }
        async killAllNow() {
            for (const [, extHost] of this._extHosts) {
                extHost.kill();
            }
        }
        async waitForAllExit(maxWaitTimeMs) {
            const exitPromises = [];
            for (const [, extHost] of this._extHosts) {
                exitPromises.push(extHost.waitForExit(maxWaitTimeMs));
            }
            return async_1.Promises.settled(exitPromises).then(() => { });
        }
    }
    exports.ExtensionHostStarter = ExtensionHostStarter;
    ExtensionHostStarter._lastId = 0;
    /**
     * The `create` function needs to be there by convention because
     * we are loaded via the `vs/base/common/worker/simpleWorker` utility.
     */
    function create(host) {
        return new ExtensionHostStarter(host);
    }
    exports.create = create;
});
//# sourceMappingURL=extensionHostStarterWorker.js.map