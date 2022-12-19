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
define(["require", "exports", "child_process", "fs", "os", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/pfs", "vs/nls", "vs/platform/log/common/log", "vs/platform/terminal/node/childProcessMonitor", "vs/platform/terminal/node/terminalEnvironment", "vs/platform/terminal/node/windowsShellHelper"], function (require, exports, child_process_1, fs_1, os_1, async_1, event_1, lifecycle_1, network_1, path, platform_1, uri_1, pfs_1, nls_1, log_1, childProcessMonitor_1, terminalEnvironment_1, windowsShellHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProcess = void 0;
    var ShutdownConstants;
    (function (ShutdownConstants) {
        /**
         * The amount of ms that must pass between data events after exit is queued before the actual
         * kill call is triggered. This data flush mechanism works around an [issue in node-pty][1]
         * where not all data is flushed which causes problems for task problem matchers. Additionally
         * on Windows under conpty, killing a process while data is being output will cause the [conhost
         * flush to hang the pty host][2] because [conhost should be hosted on another thread][3].
         *
         * [1]: https://github.com/Tyriar/node-pty/issues/72
         * [2]: https://github.com/microsoft/vscode/issues/71966
         * [3]: https://github.com/microsoft/node-pty/pull/415
         */
        ShutdownConstants[ShutdownConstants["DataFlushTimeout"] = 250] = "DataFlushTimeout";
        /**
         * The maximum ms to allow after dispose is called because forcefully killing the process.
         */
        ShutdownConstants[ShutdownConstants["MaximumShutdownTime"] = 5000] = "MaximumShutdownTime";
    })(ShutdownConstants || (ShutdownConstants = {}));
    var Constants;
    (function (Constants) {
        /**
         * The minimum duration between kill and spawn calls on Windows/conpty as a mitigation for a
         * hang issue. See:
         * - https://github.com/microsoft/vscode/issues/71966
         * - https://github.com/microsoft/vscode/issues/117956
         * - https://github.com/microsoft/vscode/issues/121336
         */
        Constants[Constants["KillSpawnThrottleInterval"] = 250] = "KillSpawnThrottleInterval";
        /**
         * The amount of time to wait when a call is throttles beyond the exact amount, this is used to
         * try prevent early timeouts causing a kill/spawn call to happen at double the regular
         * interval.
         */
        Constants[Constants["KillSpawnSpacingDuration"] = 50] = "KillSpawnSpacingDuration";
        /**
         * Writing large amounts of data can be corrupted for some reason, after looking into this is
         * appears to be a race condition around writing to the FD which may be based on how powerful
         * the hardware is. The workaround for this is to space out when large amounts of data is being
         * written to the terminal. See https://github.com/microsoft/vscode/issues/38137
         */
        Constants[Constants["WriteMaxChunkSize"] = 50] = "WriteMaxChunkSize";
        /**
         * How long to wait between chunk writes.
         */
        Constants[Constants["WriteInterval"] = 5] = "WriteInterval";
    })(Constants || (Constants = {}));
    const posixShellTypeMap = new Map([
        ['bash', "bash" /* PosixShellType.Bash */],
        ['csh', "csh" /* PosixShellType.Csh */],
        ['fish', "fish" /* PosixShellType.Fish */],
        ['ksh', "ksh" /* PosixShellType.Ksh */],
        ['sh', "sh" /* PosixShellType.Sh */],
        ['pwsh', "pwsh" /* PosixShellType.PowerShell */],
        ['zsh', "zsh" /* PosixShellType.Zsh */]
    ]);
    let TerminalProcess = class TerminalProcess extends lifecycle_1.Disposable {
        constructor(shellLaunchConfig, cwd, cols, rows, env, 
        /**
         * environment used for `findExecutable`
         */
        _executableEnv, _options, _logService) {
            var _a;
            super();
            this.shellLaunchConfig = shellLaunchConfig;
            this._executableEnv = _executableEnv;
            this._options = _options;
            this._logService = _logService;
            this.id = 0;
            this.shouldPersist = false;
            this._properties = {
                cwd: '',
                initialCwd: '',
                fixedDimensions: { cols: undefined, rows: undefined },
                title: '',
                shellType: undefined,
                hasChildProcesses: true,
                resolvedShellLaunchConfig: {},
                overrideDimensions: undefined
            };
            this._currentTitle = '';
            this._isDisposed = false;
            this._titleInterval = null;
            this._writeQueue = [];
            this._isPtyPaused = false;
            this._unacknowledgedCharCount = 0;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            let name;
            if (platform_1.isWindows) {
                name = path.basename(this.shellLaunchConfig.executable || '');
            }
            else {
                // Using 'xterm-256color' here helps ensure that the majority of Linux distributions will use a
                // color prompt as defined in the default ~/.bashrc file.
                name = 'xterm-256color';
            }
            this._initialCwd = cwd;
            this._properties["initialCwd" /* ProcessPropertyType.InitialCwd */] = this._initialCwd;
            this._properties["cwd" /* ProcessPropertyType.Cwd */] = this._initialCwd;
            const useConpty = this._options.windowsEnableConpty && process.platform === 'win32' && (0, terminalEnvironment_1.getWindowsBuildNumber)() >= 18309;
            this._ptyOptions = {
                name,
                cwd,
                // TODO: When node-pty is updated this cast can be removed
                env: env,
                cols,
                rows,
                useConpty,
                // This option will force conpty to not redraw the whole viewport on launch
                conptyInheritCursor: useConpty && !!shellLaunchConfig.initialText
            };
            // Delay resizes to avoid conpty not respecting very early resize calls
            if (platform_1.isWindows) {
                if (useConpty && cols === 0 && rows === 0 && ((_a = this.shellLaunchConfig.executable) === null || _a === void 0 ? void 0 : _a.endsWith('Git\\bin\\bash.exe'))) {
                    this._delayedResizer = new DelayedResizer();
                    this._register(this._delayedResizer.onTrigger(dimensions => {
                        var _a;
                        (_a = this._delayedResizer) === null || _a === void 0 ? void 0 : _a.dispose();
                        this._delayedResizer = undefined;
                        if (dimensions.cols && dimensions.rows) {
                            this.resize(dimensions.cols, dimensions.rows);
                        }
                    }));
                }
                // WindowsShellHelper is used to fetch the process title and shell type
                this.onProcessReady(e => {
                    this._windowsShellHelper = this._register(new windowsShellHelper_1.WindowsShellHelper(e.pid));
                    this._register(this._windowsShellHelper.onShellTypeChanged(e => this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: e })));
                    this._register(this._windowsShellHelper.onShellNameChanged(e => this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: e })));
                });
            }
        }
        get exitMessage() { return this._exitMessage; }
        get currentTitle() { var _a; return ((_a = this._windowsShellHelper) === null || _a === void 0 ? void 0 : _a.shellTitle) || this._currentTitle; }
        get shellType() { var _a; return platform_1.isWindows ? (_a = this._windowsShellHelper) === null || _a === void 0 ? void 0 : _a.shellType : posixShellTypeMap.get(this._currentTitle); }
        async start() {
            var _a;
            var _b;
            const results = await Promise.all([this._validateCwd(), this._validateExecutable()]);
            const firstError = results.find(r => r !== undefined);
            if (firstError) {
                return firstError;
            }
            let injection;
            if (this._options.shellIntegration.enabled) {
                injection = (0, terminalEnvironment_1.getShellIntegrationInjection)(this.shellLaunchConfig, this._options.shellIntegration, this._logService);
                if (injection) {
                    if (injection.envMixin) {
                        for (const [key, value] of Object.entries(injection.envMixin)) {
                            (_b = this._ptyOptions).env || (_b.env = {});
                            this._ptyOptions.env[key] = value;
                        }
                    }
                    if (injection.filesToCopy) {
                        for (const f of injection.filesToCopy) {
                            await fs_1.promises.mkdir(path.dirname(f.dest), { recursive: true });
                            await fs_1.promises.copyFile(f.source, f.dest);
                        }
                    }
                }
            }
            // Handle zsh shell integration - Set $ZDOTDIR to a temp dir and create $ZDOTDIR/.zshrc
            if (((_a = this.shellLaunchConfig.env) === null || _a === void 0 ? void 0 : _a['_ZDOTDIR']) === '1') {
                const zdotdir = path.join((0, os_1.tmpdir)(), 'vscode-zsh');
                await fs_1.promises.mkdir(zdotdir, { recursive: true });
                const source = path.join(path.dirname(network_1.FileAccess.asFileUri('', require).fsPath), 'out/vs/workbench/contrib/terminal/browser/media/shellIntegration.zsh');
                await fs_1.promises.copyFile(source, path.join(zdotdir, '.zshrc'));
                this._ptyOptions.env = this._ptyOptions.env || {};
                this._ptyOptions.env['ZDOTDIR'] = zdotdir;
                delete this._ptyOptions.env['_ZDOTDIR'];
            }
            try {
                await this.setupPtyProcess(this.shellLaunchConfig, this._ptyOptions, injection);
                return undefined;
            }
            catch (err) {
                this._logService.trace('IPty#spawn native exception', err);
                return { message: `A native exception occurred during launch (${err.message})` };
            }
        }
        async _validateCwd() {
            try {
                const result = await pfs_1.Promises.stat(this._initialCwd);
                if (!result.isDirectory()) {
                    return { message: (0, nls_1.localize)('launchFail.cwdNotDirectory', "Starting directory (cwd) \"{0}\" is not a directory", this._initialCwd.toString()) };
                }
            }
            catch (err) {
                if ((err === null || err === void 0 ? void 0 : err.code) === 'ENOENT') {
                    return { message: (0, nls_1.localize)('launchFail.cwdDoesNotExist', "Starting directory (cwd) \"{0}\" does not exist", this._initialCwd.toString()) };
                }
            }
            this._onDidChangeProperty.fire({ type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: this._initialCwd });
            return undefined;
        }
        async _validateExecutable() {
            const slc = this.shellLaunchConfig;
            if (!slc.executable) {
                throw new Error('IShellLaunchConfig.executable not set');
            }
            try {
                const result = await pfs_1.Promises.stat(slc.executable);
                if (!result.isFile() && !result.isSymbolicLink()) {
                    return { message: (0, nls_1.localize)('launchFail.executableIsNotFileOrSymlink', "Path to shell executable \"{0}\" is not a file or a symlink", slc.executable) };
                }
            }
            catch (err) {
                if ((err === null || err === void 0 ? void 0 : err.code) === 'ENOENT') {
                    // The executable isn't an absolute path, try find it on the PATH or CWD
                    let cwd = slc.cwd instanceof uri_1.URI ? slc.cwd.path : slc.cwd;
                    const envPaths = (slc.env && slc.env.PATH) ? slc.env.PATH.split(path.delimiter) : undefined;
                    const executable = await (0, terminalEnvironment_1.findExecutable)(slc.executable, cwd, envPaths, this._executableEnv);
                    if (!executable) {
                        return { message: (0, nls_1.localize)('launchFail.executableDoesNotExist', "Path to shell executable \"{0}\" does not exist", slc.executable) };
                    }
                    // Set the executable explicitly here so that node-pty doesn't need to search the
                    // $PATH too.
                    slc.executable = executable;
                }
            }
            return undefined;
        }
        async setupPtyProcess(shellLaunchConfig, options, shellIntegrationInjection) {
            const args = (shellIntegrationInjection === null || shellIntegrationInjection === void 0 ? void 0 : shellIntegrationInjection.newArgs) || shellLaunchConfig.args || [];
            await this._throttleKillSpawn();
            this._logService.trace('IPty#spawn', shellLaunchConfig.executable, args, options);
            const ptyProcess = (await new Promise((resolve_1, reject_1) => { require(['node-pty'], resolve_1, reject_1); })).spawn(shellLaunchConfig.executable, args, options);
            this._ptyProcess = ptyProcess;
            this._childProcessMonitor = this._register(new childProcessMonitor_1.ChildProcessMonitor(ptyProcess.pid, this._logService));
            this._childProcessMonitor.onDidChangeHasChildProcesses(value => this._onDidChangeProperty.fire({ type: "hasChildProcesses" /* ProcessPropertyType.HasChildProcesses */, value }));
            this._processStartupComplete = new Promise(c => {
                this.onProcessReady(() => c());
            });
            ptyProcess.onData(data => {
                var _a, _b;
                // Handle flow control
                this._unacknowledgedCharCount += data.length;
                if (!this._isPtyPaused && this._unacknowledgedCharCount > 100000 /* FlowControlConstants.HighWatermarkChars */) {
                    this._logService.trace(`Flow control: Pause (${this._unacknowledgedCharCount} > ${100000 /* FlowControlConstants.HighWatermarkChars */})`);
                    this._isPtyPaused = true;
                    ptyProcess.pause();
                }
                // Refire the data event
                this._onProcessData.fire(data);
                if (this._closeTimeout) {
                    this._queueProcessExit();
                }
                (_a = this._windowsShellHelper) === null || _a === void 0 ? void 0 : _a.checkShell();
                (_b = this._childProcessMonitor) === null || _b === void 0 ? void 0 : _b.handleOutput();
            });
            ptyProcess.onExit(e => {
                this._exitCode = e.exitCode;
                this._queueProcessExit();
            });
            this._sendProcessId(ptyProcess.pid);
            this._setupTitlePolling(ptyProcess);
        }
        dispose() {
            this._isDisposed = true;
            if (this._titleInterval) {
                clearInterval(this._titleInterval);
            }
            this._titleInterval = null;
            super.dispose();
        }
        _setupTitlePolling(ptyProcess) {
            // Send initial timeout async to give event listeners a chance to init
            setTimeout(() => this._sendProcessTitle(ptyProcess));
            // Setup polling for non-Windows, for Windows `process` doesn't change
            if (!platform_1.isWindows) {
                this._titleInterval = setInterval(() => {
                    if (this._currentTitle !== ptyProcess.process) {
                        this._sendProcessTitle(ptyProcess);
                    }
                }, 200);
            }
        }
        // Allow any trailing data events to be sent before the exit event is sent.
        // See https://github.com/Tyriar/node-pty/issues/72
        _queueProcessExit() {
            if (this._closeTimeout) {
                clearTimeout(this._closeTimeout);
            }
            this._closeTimeout = setTimeout(() => {
                this._closeTimeout = undefined;
                this._kill();
            }, 250 /* ShutdownConstants.DataFlushTimeout */);
        }
        async _kill() {
            // Wait to kill to process until the start up code has run. This prevents us from firing a process exit before a
            // process start.
            await this._processStartupComplete;
            if (this._isDisposed) {
                return;
            }
            // Attempt to kill the pty, it may have already been killed at this
            // point but we want to make sure
            try {
                if (this._ptyProcess) {
                    await this._throttleKillSpawn();
                    this._logService.trace('IPty#kill');
                    this._ptyProcess.kill();
                }
            }
            catch (ex) {
                // Swallow, the pty has already been killed
            }
            this._onProcessExit.fire(this._exitCode || 0);
            this.dispose();
        }
        async _throttleKillSpawn() {
            // Only throttle on Windows/conpty
            if (!platform_1.isWindows || !('useConpty' in this._ptyOptions) || !this._ptyOptions.useConpty) {
                return;
            }
            // Use a loop to ensure multiple calls in a single interval space out
            while (Date.now() - TerminalProcess._lastKillOrStart < 250 /* Constants.KillSpawnThrottleInterval */) {
                this._logService.trace('Throttling kill/spawn call');
                await (0, async_1.timeout)(250 /* Constants.KillSpawnThrottleInterval */ - (Date.now() - TerminalProcess._lastKillOrStart) + 50 /* Constants.KillSpawnSpacingDuration */);
            }
            TerminalProcess._lastKillOrStart = Date.now();
        }
        _sendProcessId(pid) {
            this._onProcessReady.fire({ pid, cwd: this._initialCwd, requiresWindowsMode: platform_1.isWindows && (0, terminalEnvironment_1.getWindowsBuildNumber)() < 21376 });
        }
        _sendProcessTitle(ptyProcess) {
            if (this._isDisposed) {
                return;
            }
            this._currentTitle = ptyProcess.process;
            this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: this._currentTitle });
            this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: posixShellTypeMap.get(this.currentTitle) });
        }
        shutdown(immediate) {
            // don't force immediate disposal of the terminal processes on Windows as an additional
            // mitigation for https://github.com/microsoft/vscode/issues/71966 which causes the pty host
            // to become unresponsive, disconnecting all terminals across all windows.
            if (immediate && !platform_1.isWindows) {
                this._kill();
            }
            else {
                if (!this._closeTimeout && !this._isDisposed) {
                    this._queueProcessExit();
                    // Allow a maximum amount of time for the process to exit, otherwise force kill it
                    setTimeout(() => {
                        if (this._closeTimeout && !this._isDisposed) {
                            this._closeTimeout = undefined;
                            this._kill();
                        }
                    }, 5000 /* ShutdownConstants.MaximumShutdownTime */);
                }
            }
        }
        input(data, isBinary) {
            if (this._isDisposed || !this._ptyProcess) {
                return;
            }
            for (let i = 0; i <= Math.floor(data.length / 50 /* Constants.WriteMaxChunkSize */); i++) {
                const obj = {
                    isBinary: isBinary || false,
                    data: data.substr(i * 50 /* Constants.WriteMaxChunkSize */, 50 /* Constants.WriteMaxChunkSize */)
                };
                this._writeQueue.push(obj);
            }
            this._startWrite();
        }
        async processBinary(data) {
            this.input(data, true);
        }
        async refreshProperty(type) {
            switch (type) {
                case "cwd" /* ProcessPropertyType.Cwd */: {
                    const newCwd = await this.getCwd();
                    if (newCwd !== this._properties.cwd) {
                        this._properties.cwd = newCwd;
                        this._onDidChangeProperty.fire({ type: "cwd" /* ProcessPropertyType.Cwd */, value: this._properties.cwd });
                    }
                    return newCwd;
                }
                case "initialCwd" /* ProcessPropertyType.InitialCwd */: {
                    const initialCwd = await this.getInitialCwd();
                    if (initialCwd !== this._properties.initialCwd) {
                        this._properties.initialCwd = initialCwd;
                        this._onDidChangeProperty.fire({ type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: this._properties.initialCwd });
                    }
                    return initialCwd;
                }
                case "title" /* ProcessPropertyType.Title */:
                    return this.currentTitle;
                default:
                    return this.shellType;
            }
        }
        async updateProperty(type, value) {
            if (type === "fixedDimensions" /* ProcessPropertyType.FixedDimensions */) {
                this._properties.fixedDimensions = value;
            }
        }
        _startWrite() {
            // Don't write if it's already queued of is there is nothing to write
            if (this._writeTimeout !== undefined || this._writeQueue.length === 0) {
                return;
            }
            this._doWrite();
            // Don't queue more writes if the queue is empty
            if (this._writeQueue.length === 0) {
                this._writeTimeout = undefined;
                return;
            }
            // Queue the next write
            this._writeTimeout = setTimeout(() => {
                this._writeTimeout = undefined;
                this._startWrite();
            }, 5 /* Constants.WriteInterval */);
        }
        _doWrite() {
            var _a;
            const object = this._writeQueue.shift();
            if (object.isBinary) {
                this._ptyProcess.write(Buffer.from(object.data, 'binary'));
            }
            else {
                this._ptyProcess.write(object.data);
            }
            (_a = this._childProcessMonitor) === null || _a === void 0 ? void 0 : _a.handleInput();
        }
        resize(cols, rows) {
            if (this._isDisposed) {
                return;
            }
            if (typeof cols !== 'number' || typeof rows !== 'number' || isNaN(cols) || isNaN(rows)) {
                return;
            }
            // Ensure that cols and rows are always >= 1, this prevents a native
            // exception in winpty.
            if (this._ptyProcess) {
                cols = Math.max(cols, 1);
                rows = Math.max(rows, 1);
                // Delay resize if needed
                if (this._delayedResizer) {
                    this._delayedResizer.cols = cols;
                    this._delayedResizer.rows = rows;
                    return;
                }
                this._logService.trace('IPty#resize', cols, rows);
                try {
                    this._ptyProcess.resize(cols, rows);
                }
                catch (e) {
                    // Swallow error if the pty has already exited
                    this._logService.trace('IPty#resize exception ' + e.message);
                    if (this._exitCode !== undefined &&
                        e.message !== 'ioctl(2) failed, EBADF' &&
                        e.message !== 'Cannot resize a pty that has already exited') {
                        throw e;
                    }
                }
            }
        }
        acknowledgeDataEvent(charCount) {
            var _a;
            // Prevent lower than 0 to heal from errors
            this._unacknowledgedCharCount = Math.max(this._unacknowledgedCharCount - charCount, 0);
            this._logService.trace(`Flow control: Ack ${charCount} chars (unacknowledged: ${this._unacknowledgedCharCount})`);
            if (this._isPtyPaused && this._unacknowledgedCharCount < 5000 /* FlowControlConstants.LowWatermarkChars */) {
                this._logService.trace(`Flow control: Resume (${this._unacknowledgedCharCount} < ${5000 /* FlowControlConstants.LowWatermarkChars */})`);
                (_a = this._ptyProcess) === null || _a === void 0 ? void 0 : _a.resume();
                this._isPtyPaused = false;
            }
        }
        clearUnacknowledgedChars() {
            var _a;
            this._unacknowledgedCharCount = 0;
            this._logService.trace(`Flow control: Cleared all unacknowledged chars, forcing resume`);
            if (this._isPtyPaused) {
                (_a = this._ptyProcess) === null || _a === void 0 ? void 0 : _a.resume();
                this._isPtyPaused = false;
            }
        }
        async setUnicodeVersion(version) {
            // No-op
        }
        getInitialCwd() {
            return Promise.resolve(this._initialCwd);
        }
        async getCwd() {
            if (platform_1.isMacintosh) {
                // From Big Sur (darwin v20) there is a spawn blocking thread issue on Electron,
                // this is fixed in VS Code's internal Electron.
                // https://github.com/Microsoft/vscode/issues/105446
                return new Promise(resolve => {
                    if (!this._ptyProcess) {
                        resolve(this._initialCwd);
                        return;
                    }
                    this._logService.trace('IPty#pid');
                    (0, child_process_1.exec)('lsof -OPln -p ' + this._ptyProcess.pid + ' | grep cwd', (error, stdout, stderr) => {
                        if (!error && stdout !== '') {
                            resolve(stdout.substring(stdout.indexOf('/'), stdout.length - 1));
                        }
                        else {
                            this._logService.error('lsof did not run successfully, it may not be on the $PATH?', error, stdout, stderr);
                            resolve(this._initialCwd);
                        }
                    });
                });
            }
            if (platform_1.isLinux) {
                if (!this._ptyProcess) {
                    return this._initialCwd;
                }
                this._logService.trace('IPty#pid');
                try {
                    return await pfs_1.Promises.readlink(`/proc/${this._ptyProcess.pid}/cwd`);
                }
                catch (error) {
                    return this._initialCwd;
                }
            }
            return this._initialCwd;
        }
        getLatency() {
            return Promise.resolve(0);
        }
    };
    TerminalProcess._lastKillOrStart = 0;
    TerminalProcess = __decorate([
        __param(7, log_1.ILogService)
    ], TerminalProcess);
    exports.TerminalProcess = TerminalProcess;
    /**
     * Tracks the latest resize event to be trigger at a later point.
     */
    class DelayedResizer extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onTrigger = this._register(new event_1.Emitter());
            this._timeout = setTimeout(() => {
                this._onTrigger.fire({ rows: this.rows, cols: this.cols });
            }, 1000);
            this._register({
                dispose: () => {
                    clearTimeout(this._timeout);
                }
            });
        }
        get onTrigger() { return this._onTrigger.event; }
        dispose() {
            super.dispose();
            clearTimeout(this._timeout);
        }
    }
});
//# sourceMappingURL=terminalProcess.js.map