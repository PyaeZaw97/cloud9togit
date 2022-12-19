/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "fs", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/functional", "vs/base/common/labels", "vs/base/common/network", "vs/base/common/path", "vs/base/common/performance", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/strings", "vs/base/node/pfs", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.net", "vs/code/electron-main/app", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/diagnostics/node/diagnosticsService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argvHelper", "vs/platform/environment/node/wait", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/bufferLog", "vs/platform/log/common/log", "vs/platform/log/node/loggerService", "vs/platform/log/node/spdlogLog", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/protocol/electron-main/protocolMainService", "vs/platform/tunnel/common/tunnel", "vs/platform/tunnel/node/tunnelService", "vs/platform/request/common/request", "vs/platform/request/electron-main/requestMainService", "vs/platform/sign/common/sign", "vs/platform/sign/node/signService", "vs/platform/state/electron-main/state", "vs/platform/state/electron-main/stateMainService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/theme/electron-main/themeMainService", "vs/platform/update/common/update.config.contribution"], function (require, exports, electron_1, fs_1, uri_1, arrays_1, async_1, errorMessage_1, errors_1, extpath_1, functional_1, labels_1, network_1, path_1, performance_1, platform_1, process_1, strings_1, pfs_1, ipc_1, ipc_net_1, app_1, nls_1, configuration_1, configurationService_1, diagnosticsService_1, environmentMainService_1, argvHelper_1, wait_1, files_1, fileService_1, diskFileSystemProvider_1, descriptors_1, instantiationService_1, serviceCollection_1, lifecycleMainService_1, bufferLog_1, log_1, loggerService_1, spdlogLog_1, product_1, productService_1, protocol_1, protocolMainService_1, tunnel_1, tunnelService_1, request_1, requestMainService_1, sign_1, signService_1, state_1, stateMainService_1, telemetryUtils_1, themeMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * The main VS Code entry point.
     *
     * Note: This class can exist more than once for example when VS Code is already
     * running and a second instance is started from the command line. It will always
     * try to communicate with an existing instance to prevent that 2 VS Code instances
     * are running at the same time.
     */
    class CodeMain {
        main() {
            try {
                this.startup();
            }
            catch (error) {
                console.error(error.message);
                electron_1.app.exit(1);
            }
        }
        async startup() {
            // Set the error handler early enough so that we are not getting the
            // default electron error dialog popping up
            (0, errors_1.setUnexpectedErrorHandler)(err => console.error(err));
            // Create services
            const [instantiationService, instanceEnvironment, environmentMainService, configurationService, stateMainService, bufferLogService, productService] = this.createServices();
            try {
                // Init services
                try {
                    await this.initServices(environmentMainService, configurationService, stateMainService);
                }
                catch (error) {
                    // Show a dialog for errors that can be resolved by the user
                    this.handleStartupDataDirError(environmentMainService, productService.nameLong, error);
                    throw error;
                }
                // Startup
                await instantiationService.invokeFunction(async (accessor) => {
                    const logService = accessor.get(log_1.ILogService);
                    const lifecycleMainService = accessor.get(lifecycleMainService_1.ILifecycleMainService);
                    const fileService = accessor.get(files_1.IFileService);
                    // Create the main IPC server by trying to be the server
                    // If this throws an error it means we are not the first
                    // instance of VS Code running and so we would quit.
                    const mainProcessNodeIpcServer = await this.claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, true);
                    // Write a lockfile to indicate an instance is running (https://github.com/microsoft/vscode/issues/127861#issuecomment-877417451)
                    pfs_1.Promises.writeFile(environmentMainService.mainLockfile, String(process.pid)).catch(err => {
                        logService.warn(`Error writing main lockfile: ${err.stack}`);
                    });
                    // Delay creation of spdlog for perf reasons (https://github.com/microsoft/vscode/issues/72906)
                    bufferLogService.logger = new spdlogLog_1.SpdLogLogger('main', (0, path_1.join)(environmentMainService.logsPath, 'main.log'), true, false, bufferLogService.getLevel());
                    // Lifecycle
                    (0, functional_1.once)(lifecycleMainService.onWillShutdown)(evt => {
                        fileService.dispose();
                        configurationService.dispose();
                        evt.join(pfs_1.Promises.unlink(environmentMainService.mainLockfile).catch(() => { }));
                    });
                    return instantiationService.createInstance(app_1.CodeApplication, mainProcessNodeIpcServer, instanceEnvironment).startup();
                });
            }
            catch (error) {
                instantiationService.invokeFunction(this.quit, error);
            }
        }
        createServices() {
            const services = new serviceCollection_1.ServiceCollection();
            // Product
            const productService = Object.assign({ _serviceBrand: undefined }, product_1.default);
            services.set(productService_1.IProductService, productService);
            // Environment
            const environmentMainService = new environmentMainService_1.EnvironmentMainService(this.resolveArgs(), productService);
            const instanceEnvironment = this.patchEnvironment(environmentMainService); // Patch `process.env` with the instance's environment
            services.set(environmentMainService_1.IEnvironmentMainService, environmentMainService);
            // Log: We need to buffer the spdlog logs until we are sure
            // we are the only instance running, otherwise we'll have concurrent
            // log file access on Windows (https://github.com/microsoft/vscode/issues/41218)
            const bufferLogService = new bufferLog_1.BufferLogService();
            const logService = new log_1.MultiplexLogService([new log_1.ConsoleMainLogger((0, log_1.getLogLevel)(environmentMainService)), bufferLogService]);
            process.once('exit', () => logService.dispose());
            services.set(log_1.ILogService, logService);
            // Files
            const fileService = new fileService_1.FileService(logService);
            services.set(files_1.IFileService, fileService);
            const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // Logger
            services.set(log_1.ILoggerService, new loggerService_1.LoggerService(logService, fileService));
            // Configuration
            const configurationService = new configurationService_1.ConfigurationService(environmentMainService.settingsResource, fileService);
            services.set(configuration_1.IConfigurationService, configurationService);
            // Lifecycle
            services.set(lifecycleMainService_1.ILifecycleMainService, new descriptors_1.SyncDescriptor(lifecycleMainService_1.LifecycleMainService));
            // State
            const stateMainService = new stateMainService_1.StateMainService(environmentMainService, logService, fileService);
            services.set(state_1.IStateMainService, stateMainService);
            // Request
            services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestMainService_1.RequestMainService));
            // Themes
            services.set(themeMainService_1.IThemeMainService, new descriptors_1.SyncDescriptor(themeMainService_1.ThemeMainService));
            // Signing
            services.set(sign_1.ISignService, new descriptors_1.SyncDescriptor(signService_1.SignService));
            // Tunnel
            services.set(tunnel_1.ITunnelService, new descriptors_1.SyncDescriptor(tunnelService_1.TunnelService));
            // Protocol
            services.set(protocol_1.IProtocolMainService, new descriptors_1.SyncDescriptor(protocolMainService_1.ProtocolMainService));
            return [new instantiationService_1.InstantiationService(services, true), instanceEnvironment, environmentMainService, configurationService, stateMainService, bufferLogService, productService];
        }
        patchEnvironment(environmentMainService) {
            const instanceEnvironment = {
                VSCODE_IPC_HOOK: environmentMainService.mainIPCHandle
            };
            ['VSCODE_NLS_CONFIG', 'VSCODE_PORTABLE'].forEach(key => {
                const value = process.env[key];
                if (typeof value === 'string') {
                    instanceEnvironment[key] = value;
                }
            });
            Object.assign(process.env, instanceEnvironment);
            return instanceEnvironment;
        }
        initServices(environmentMainService, configurationService, stateMainService) {
            return async_1.Promises.settled([
                // Environment service (paths)
                Promise.all([
                    environmentMainService.extensionsPath,
                    environmentMainService.codeCachePath,
                    environmentMainService.logsPath,
                    environmentMainService.globalStorageHome.fsPath,
                    environmentMainService.workspaceStorageHome.fsPath,
                    environmentMainService.localHistoryHome.fsPath,
                    environmentMainService.backupHome
                ].map(path => path ? pfs_1.Promises.mkdir(path, { recursive: true }) : undefined)),
                // Configuration service
                configurationService.initialize(),
                // State service
                stateMainService.init()
            ]);
        }
        async claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, retry) {
            // Try to setup a server for running. If that succeeds it means
            // we are the first instance to startup. Otherwise it is likely
            // that another instance is already running.
            let mainProcessNodeIpcServer;
            try {
                (0, performance_1.mark)('code/willStartMainServer');
                mainProcessNodeIpcServer = await (0, ipc_net_1.serve)(environmentMainService.mainIPCHandle);
                (0, performance_1.mark)('code/didStartMainServer');
                (0, functional_1.once)(lifecycleMainService.onWillShutdown)(() => mainProcessNodeIpcServer.dispose());
            }
            catch (error) {
                // Handle unexpected errors (the only expected error is EADDRINUSE that
                // indicates a second instance of Code is running)
                if (error.code !== 'EADDRINUSE') {
                    // Show a dialog for errors that can be resolved by the user
                    this.handleStartupDataDirError(environmentMainService, productService.nameLong, error);
                    // Any other runtime error is just printed to the console
                    throw error;
                }
                // there's a running instance, let's connect to it
                let client;
                try {
                    client = await (0, ipc_net_1.connect)(environmentMainService.mainIPCHandle, 'main');
                }
                catch (error) {
                    // Handle unexpected connection errors by showing a dialog to the user
                    if (!retry || platform_1.isWindows || error.code !== 'ECONNREFUSED') {
                        if (error.code === 'EPERM') {
                            this.showStartupWarningDialog((0, nls_1.localize)('secondInstanceAdmin', "A second instance of {0} is already running as administrator.", productService.nameShort), (0, nls_1.localize)('secondInstanceAdminDetail', "Please close the other instance and try again."), productService.nameLong);
                        }
                        throw error;
                    }
                    // it happens on Linux and OS X that the pipe is left behind
                    // let's delete it, since we can't connect to it and then
                    // retry the whole thing
                    try {
                        (0, fs_1.unlinkSync)(environmentMainService.mainIPCHandle);
                    }
                    catch (error) {
                        logService.warn('Could not delete obsolete instance handle', error);
                        throw error;
                    }
                    return this.claimInstance(logService, environmentMainService, lifecycleMainService, instantiationService, productService, false);
                }
                // Tests from CLI require to be the only instance currently
                if (environmentMainService.extensionTestsLocationURI && !environmentMainService.debugExtensionHost.break) {
                    const msg = 'Running extension tests from the command line is currently only supported if no other instance of Code is running.';
                    logService.error(msg);
                    client.dispose();
                    throw new Error(msg);
                }
                // Show a warning dialog after some timeout if it takes long to talk to the other instance
                // Skip this if we are running with --wait where it is expected that we wait for a while.
                // Also skip when gathering diagnostics (--status) which can take a longer time.
                let startupWarningDialogHandle = undefined;
                if (!environmentMainService.args.wait && !environmentMainService.args.status) {
                    startupWarningDialogHandle = setTimeout(() => {
                        this.showStartupWarningDialog((0, nls_1.localize)('secondInstanceNoResponse', "Another instance of {0} is running but not responding", productService.nameShort), (0, nls_1.localize)('secondInstanceNoResponseDetail', "Please close all other instances and try again."), productService.nameLong);
                    }, 10000);
                }
                const otherInstanceLaunchMainService = ipc_1.ProxyChannel.toService(client.getChannel('launch'), { disableMarshalling: true });
                const otherInstanceDiagnosticsMainService = ipc_1.ProxyChannel.toService(client.getChannel('diagnostics'), { disableMarshalling: true });
                // Process Info
                if (environmentMainService.args.status) {
                    return instantiationService.invokeFunction(async () => {
                        const diagnosticsService = new diagnosticsService_1.DiagnosticsService(telemetryUtils_1.NullTelemetryService, productService);
                        const mainProcessInfo = await otherInstanceLaunchMainService.getMainProcessInfo();
                        const remoteDiagnostics = await otherInstanceDiagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true, includeWorkspaceMetadata: true });
                        const diagnostics = await diagnosticsService.getDiagnostics(mainProcessInfo, remoteDiagnostics);
                        console.log(diagnostics);
                        throw new errors_1.ExpectedError();
                    });
                }
                // Windows: allow to set foreground
                if (platform_1.isWindows) {
                    await this.windowsAllowSetForegroundWindow(otherInstanceLaunchMainService, logService);
                }
                // Send environment over...
                logService.trace('Sending env to running instance...');
                await otherInstanceLaunchMainService.start(environmentMainService.args, process.env);
                // Cleanup
                client.dispose();
                // Now that we started, make sure the warning dialog is prevented
                if (startupWarningDialogHandle) {
                    clearTimeout(startupWarningDialogHandle);
                }
                throw new errors_1.ExpectedError('Sent env to running instance. Terminating...');
            }
            // Print --status usage info
            if (environmentMainService.args.status) {
                logService.warn('Warning: The --status argument can only be used if Code is already running. Please run it again after Code has started.');
                throw new errors_1.ExpectedError('Terminating...');
            }
            // Set the VSCODE_PID variable here when we are sure we are the first
            // instance to startup. Otherwise we would wrongly overwrite the PID
            process.env['VSCODE_PID'] = String(process.pid);
            return mainProcessNodeIpcServer;
        }
        handleStartupDataDirError(environmentMainService, title, error) {
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                const directories = (0, arrays_1.coalesce)([environmentMainService.userDataPath, environmentMainService.extensionsPath, ipc_net_1.XDG_RUNTIME_DIR]).map(folder => (0, labels_1.getPathLabel)(uri_1.URI.file(folder), { os: platform_1.OS, tildify: environmentMainService }));
                this.showStartupWarningDialog((0, nls_1.localize)('startupDataDirError', "Unable to write program user data."), (0, nls_1.localize)('startupUserDataAndExtensionsDirErrorDetail', "{0}\n\nPlease make sure the following directories are writeable:\n\n{1}", (0, errorMessage_1.toErrorMessage)(error), directories.join('\n')), title);
            }
        }
        showStartupWarningDialog(message, detail, title) {
            // use sync variant here because we likely exit after this method
            // due to startup issues and otherwise the dialog seems to disappear
            // https://github.com/microsoft/vscode/issues/104493
            electron_1.dialog.showMessageBoxSync({
                title,
                type: 'warning',
                buttons: [(0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'close', comment: ['&& denotes a mnemonic'] }, "&&Close"))],
                message,
                detail,
                defaultId: 0,
                noLink: true
            });
        }
        async windowsAllowSetForegroundWindow(launchMainService, logService) {
            if (platform_1.isWindows) {
                const processId = await launchMainService.getMainProcessId();
                logService.trace('Sending some foreground love to the running instance:', processId);
                try {
                    (await new Promise((resolve_1, reject_1) => { require(['windows-foreground-love'], resolve_1, reject_1); })).allowSetForegroundWindow(processId);
                }
                catch (error) {
                    logService.error(error);
                }
            }
        }
        quit(accessor, reason) {
            const logService = accessor.get(log_1.ILogService);
            const lifecycleMainService = accessor.get(lifecycleMainService_1.ILifecycleMainService);
            let exitCode = 0;
            if (reason) {
                if (reason.isExpected) {
                    if (reason.message) {
                        logService.trace(reason.message);
                    }
                }
                else {
                    exitCode = 1; // signal error to the outside
                    if (reason.stack) {
                        logService.error(reason.stack);
                    }
                    else {
                        logService.error(`Startup error: ${reason.toString()}`);
                    }
                }
            }
            lifecycleMainService.kill(exitCode);
        }
        //#region Command line arguments utilities
        resolveArgs() {
            // Parse arguments
            const args = this.validatePaths((0, argvHelper_1.parseMainProcessArgv)(process.argv));
            // If we are started with --wait create a random temporary file
            // and pass it over to the starting instance. We can use this file
            // to wait for it to be deleted to monitor that the edited file
            // is closed and then exit the waiting process.
            //
            // Note: we are not doing this if the wait marker has been already
            // added as argument. This can happen if Code was started from CLI.
            if (args.wait && !args.waitMarkerFilePath) {
                const waitMarkerFilePath = (0, wait_1.createWaitMarkerFile)(args.verbose);
                if (waitMarkerFilePath) {
                    (0, argvHelper_1.addArg)(process.argv, '--waitMarkerFilePath', waitMarkerFilePath);
                    args.waitMarkerFilePath = waitMarkerFilePath;
                }
            }
            return args;
        }
        validatePaths(args) {
            // Track URLs if they're going to be used
            if (args['open-url']) {
                args._urls = args._;
                args._ = [];
            }
            // Normalize paths and watch out for goto line mode
            if (!args['remote']) {
                const paths = this.doValidatePaths(args._, args.goto);
                args._ = paths;
            }
            return args;
        }
        doValidatePaths(args, gotoLineMode) {
            const currentWorkingDir = (0, process_1.cwd)();
            const result = args.map(arg => {
                let pathCandidate = String(arg);
                let parsedPath = undefined;
                if (gotoLineMode) {
                    parsedPath = (0, extpath_1.parseLineAndColumnAware)(pathCandidate);
                    pathCandidate = parsedPath.path;
                }
                if (pathCandidate) {
                    pathCandidate = this.preparePath(currentWorkingDir, pathCandidate);
                }
                const sanitizedFilePath = (0, extpath_1.sanitizeFilePath)(pathCandidate, currentWorkingDir);
                const filePathBasename = (0, path_1.basename)(sanitizedFilePath);
                if (filePathBasename /* can be empty if code is opened on root */ && !(0, extpath_1.isValidBasename)(filePathBasename)) {
                    return null; // do not allow invalid file names
                }
                if (gotoLineMode && parsedPath) {
                    parsedPath.path = sanitizedFilePath;
                    return this.toPath(parsedPath);
                }
                return sanitizedFilePath;
            });
            const caseInsensitive = platform_1.isWindows || platform_1.isMacintosh;
            const distinctPaths = (0, arrays_1.distinct)(result, path => path && caseInsensitive ? path.toLowerCase() : (path || ''));
            return (0, arrays_1.coalesce)(distinctPaths);
        }
        preparePath(cwd, path) {
            // Trim trailing quotes
            if (platform_1.isWindows) {
                path = (0, strings_1.rtrim)(path, '"'); // https://github.com/microsoft/vscode/issues/1498
            }
            // Trim whitespaces
            path = (0, strings_1.trim)((0, strings_1.trim)(path, ' '), '\t');
            if (platform_1.isWindows) {
                // Resolve the path against cwd if it is relative
                path = (0, path_1.resolve)(cwd, path);
                // Trim trailing '.' chars on Windows to prevent invalid file names
                path = (0, strings_1.rtrim)(path, '.');
            }
            return path;
        }
        toPath(pathWithLineAndCol) {
            const segments = [pathWithLineAndCol.path];
            if (typeof pathWithLineAndCol.line === 'number') {
                segments.push(String(pathWithLineAndCol.line));
            }
            if (typeof pathWithLineAndCol.column === 'number') {
                segments.push(String(pathWithLineAndCol.column));
            }
            return segments.join(':');
        }
    }
    // Main Startup
    const code = new CodeMain();
    code.main();
});
//# sourceMappingURL=main.js.map