var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "os", "vs/base/common/iterator", "vs/base/common/async", "vs/base/common/json", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/id", "vs/base/node/pfs", "vs/base/node/ps", "vs/platform/diagnostics/common/diagnostics", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry"], function (require, exports, osLib, iterator_1, async_1, json_1, network_1, path_1, platform_1, uri_1, id_1, pfs_1, ps_1, diagnostics_1, files_1, productService_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagnosticsService = exports.collectLaunchConfigs = exports.getMachineInfo = exports.collectWorkspaceStats = void 0;
    const worksapceStatsCache = new Map();
    async function collectWorkspaceStats(folder, filter) {
        const cacheKey = `${folder}::${filter.join(':')}`;
        const cached = worksapceStatsCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const configFilePatterns = [
            { tag: 'grunt.js', filePattern: /^gruntfile\.js$/i },
            { tag: 'gulp.js', filePattern: /^gulpfile\.js$/i },
            { tag: 'tsconfig.json', filePattern: /^tsconfig\.json$/i },
            { tag: 'package.json', filePattern: /^package\.json$/i },
            { tag: 'jsconfig.json', filePattern: /^jsconfig\.json$/i },
            { tag: 'tslint.json', filePattern: /^tslint\.json$/i },
            { tag: 'eslint.json', filePattern: /^eslint\.json$/i },
            { tag: 'tasks.json', filePattern: /^tasks\.json$/i },
            { tag: 'launch.json', filePattern: /^launch\.json$/i },
            { tag: 'settings.json', filePattern: /^settings\.json$/i },
            { tag: 'webpack.config.js', filePattern: /^webpack\.config\.js$/i },
            { tag: 'project.json', filePattern: /^project\.json$/i },
            { tag: 'makefile', filePattern: /^makefile$/i },
            { tag: 'sln', filePattern: /^.+\.sln$/i },
            { tag: 'csproj', filePattern: /^.+\.csproj$/i },
            { tag: 'cmake', filePattern: /^.+\.cmake$/i },
            { tag: 'github-actions', filePattern: /^.+\.ya?ml$/i, relativePathPattern: /^\.github(?:\/|\\)workflows$/i },
            { tag: 'devcontainer.json', filePattern: /^devcontainer\.json$/i },
            { tag: 'dockerfile', filePattern: /^(dockerfile|docker\-compose\.ya?ml)$/i }
        ];
        const fileTypes = new Map();
        const configFiles = new Map();
        const MAX_FILES = 20000;
        function collect(root, dir, filter, token) {
            const relativePath = dir.substring(root.length + 1);
            return async_1.Promises.withAsyncBody(async (resolve) => {
                var _a, _b, _c;
                let files;
                try {
                    files = await pfs_1.Promises.readdir(dir, { withFileTypes: true });
                }
                catch (error) {
                    // Ignore folders that can't be read
                    resolve();
                    return;
                }
                if (token.count >= MAX_FILES) {
                    token.count += files.length;
                    token.maxReached = true;
                    resolve();
                    return;
                }
                let pending = files.length;
                if (pending === 0) {
                    resolve();
                    return;
                }
                let filesToRead = files;
                if (token.count + files.length > MAX_FILES) {
                    token.maxReached = true;
                    pending = MAX_FILES - token.count;
                    filesToRead = files.slice(0, pending);
                }
                token.count += files.length;
                for (const file of filesToRead) {
                    if (file.isDirectory()) {
                        if (!filter.includes(file.name)) {
                            await collect(root, (0, path_1.join)(dir, file.name), filter, token);
                        }
                        if (--pending === 0) {
                            resolve();
                            return;
                        }
                    }
                    else {
                        const index = file.name.lastIndexOf('.');
                        if (index >= 0) {
                            const fileType = file.name.substring(index + 1);
                            if (fileType) {
                                fileTypes.set(fileType, ((_a = fileTypes.get(fileType)) !== null && _a !== void 0 ? _a : 0) + 1);
                            }
                        }
                        for (const configFile of configFilePatterns) {
                            if (((_b = configFile.relativePathPattern) === null || _b === void 0 ? void 0 : _b.test(relativePath)) !== false && configFile.filePattern.test(file.name)) {
                                configFiles.set(configFile.tag, ((_c = configFiles.get(configFile.tag)) !== null && _c !== void 0 ? _c : 0) + 1);
                            }
                        }
                        if (--pending === 0) {
                            resolve();
                            return;
                        }
                    }
                }
            });
        }
        const statsPromise = async_1.Promises.withAsyncBody(async (resolve) => {
            const token = { count: 0, maxReached: false };
            await collect(folder, folder, filter, token);
            const launchConfigs = await collectLaunchConfigs(folder);
            resolve({
                configFiles: asSortedItems(configFiles),
                fileTypes: asSortedItems(fileTypes),
                fileCount: token.count,
                maxFilesReached: token.maxReached,
                launchConfigFiles: launchConfigs
            });
        });
        worksapceStatsCache.set(cacheKey, statsPromise);
        return statsPromise;
    }
    exports.collectWorkspaceStats = collectWorkspaceStats;
    function asSortedItems(items) {
        return [
            ...iterator_1.Iterable.map(items.entries(), ([name, count]) => ({ name: name, count: count }))
        ].sort((a, b) => b.count - a.count);
    }
    function getMachineInfo() {
        const machineInfo = {
            os: `${osLib.type()} ${osLib.arch()} ${osLib.release()}`,
            memory: `${(osLib.totalmem() / files_1.ByteSize.GB).toFixed(2)}GB (${(osLib.freemem() / files_1.ByteSize.GB).toFixed(2)}GB free)`,
            vmHint: `${Math.round((id_1.virtualMachineHint.value() * 100))}%`,
        };
        const cpus = osLib.cpus();
        if (cpus && cpus.length > 0) {
            machineInfo.cpus = `${cpus[0].model} (${cpus.length} x ${cpus[0].speed})`;
        }
        return machineInfo;
    }
    exports.getMachineInfo = getMachineInfo;
    async function collectLaunchConfigs(folder) {
        try {
            const launchConfigs = new Map();
            const launchConfig = (0, path_1.join)(folder, '.vscode', 'launch.json');
            const contents = await pfs_1.Promises.readFile(launchConfig);
            const errors = [];
            const json = (0, json_1.parse)(contents.toString(), errors);
            if (errors.length) {
                console.log(`Unable to parse ${launchConfig}`);
                return [];
            }
            if ((0, json_1.getNodeType)(json) === 'object' && json['configurations']) {
                for (const each of json['configurations']) {
                    const type = each['type'];
                    if (type) {
                        if (launchConfigs.has(type)) {
                            launchConfigs.set(type, launchConfigs.get(type) + 1);
                        }
                        else {
                            launchConfigs.set(type, 1);
                        }
                    }
                }
            }
            return asSortedItems(launchConfigs);
        }
        catch (error) {
            return [];
        }
    }
    exports.collectLaunchConfigs = collectLaunchConfigs;
    let DiagnosticsService = class DiagnosticsService {
        constructor(telemetryService, productService) {
            this.telemetryService = telemetryService;
            this.productService = productService;
        }
        formatMachineInfo(info) {
            const output = [];
            output.push(`OS Version:       ${info.os}`);
            output.push(`CPUs:             ${info.cpus}`);
            output.push(`Memory (System):  ${info.memory}`);
            output.push(`VM:               ${info.vmHint}`);
            return output.join('\n');
        }
        formatEnvironment(info) {
            const output = [];
            output.push(`Version:          ${this.productService.nameShort} ${this.productService.version} (${this.productService.commit || 'Commit unknown'}, ${this.productService.date || 'Date unknown'})`);
            output.push(`OS Version:       ${osLib.type()} ${osLib.arch()} ${osLib.release()}`);
            const cpus = osLib.cpus();
            if (cpus && cpus.length > 0) {
                output.push(`CPUs:             ${cpus[0].model} (${cpus.length} x ${cpus[0].speed})`);
            }
            output.push(`Memory (System):  ${(osLib.totalmem() / files_1.ByteSize.GB).toFixed(2)}GB (${(osLib.freemem() / files_1.ByteSize.GB).toFixed(2)}GB free)`);
            if (!platform_1.isWindows) {
                output.push(`Load (avg):       ${osLib.loadavg().map(l => Math.round(l)).join(', ')}`); // only provided on Linux/macOS
            }
            output.push(`VM:               ${Math.round((id_1.virtualMachineHint.value() * 100))}%`);
            output.push(`Screen Reader:    ${info.screenReader ? 'yes' : 'no'}`);
            output.push(`Process Argv:     ${info.mainArguments.join(' ')}`);
            output.push(`GPU Status:       ${this.expandGPUFeatures(info.gpuFeatureStatus)}`);
            return output.join('\n');
        }
        async getPerformanceInfo(info, remoteData) {
            return Promise.all([(0, ps_1.listProcesses)(info.mainPID), this.formatWorkspaceMetadata(info)]).then(async (result) => {
                let [rootProcess, workspaceInfo] = result;
                let processInfo = this.formatProcessList(info, rootProcess);
                remoteData.forEach(diagnostics => {
                    if ((0, diagnostics_1.isRemoteDiagnosticError)(diagnostics)) {
                        processInfo += `\n${diagnostics.errorMessage}`;
                        workspaceInfo += `\n${diagnostics.errorMessage}`;
                    }
                    else {
                        processInfo += `\n\nRemote: ${diagnostics.hostName}`;
                        if (diagnostics.processes) {
                            processInfo += `\n${this.formatProcessList(info, diagnostics.processes)}`;
                        }
                        if (diagnostics.workspaceMetadata) {
                            workspaceInfo += `\n|  Remote: ${diagnostics.hostName}`;
                            for (const folder of Object.keys(diagnostics.workspaceMetadata)) {
                                const metadata = diagnostics.workspaceMetadata[folder];
                                let countMessage = `${metadata.fileCount} files`;
                                if (metadata.maxFilesReached) {
                                    countMessage = `more than ${countMessage}`;
                                }
                                workspaceInfo += `|    Folder (${folder}): ${countMessage}`;
                                workspaceInfo += this.formatWorkspaceStats(metadata);
                            }
                        }
                    }
                });
                return {
                    processInfo,
                    workspaceInfo
                };
            });
        }
        async getSystemInfo(info, remoteData) {
            const { memory, vmHint, os, cpus } = getMachineInfo();
            const systemInfo = {
                os,
                memory,
                cpus,
                vmHint,
                processArgs: `${info.mainArguments.join(' ')}`,
                gpuStatus: info.gpuFeatureStatus,
                screenReader: `${info.screenReader ? 'yes' : 'no'}`,
                remoteData
            };
            if (!platform_1.isWindows) {
                systemInfo.load = `${osLib.loadavg().map(l => Math.round(l)).join(', ')}`;
            }
            if (platform_1.isLinux) {
                systemInfo.linuxEnv = {
                    desktopSession: process.env['DESKTOP_SESSION'],
                    xdgSessionDesktop: process.env['XDG_SESSION_DESKTOP'],
                    xdgCurrentDesktop: process.env['XDG_CURRENT_DESKTOP'],
                    xdgSessionType: process.env['XDG_SESSION_TYPE']
                };
            }
            return Promise.resolve(systemInfo);
        }
        async getDiagnostics(info, remoteDiagnostics) {
            const output = [];
            return (0, ps_1.listProcesses)(info.mainPID).then(async (rootProcess) => {
                // Environment Info
                output.push('');
                output.push(this.formatEnvironment(info));
                // Process List
                output.push('');
                output.push(this.formatProcessList(info, rootProcess));
                // Workspace Stats
                if (info.windows.some(window => window.folderURIs && window.folderURIs.length > 0 && !window.remoteAuthority)) {
                    output.push('');
                    output.push('Workspace Stats: ');
                    output.push(await this.formatWorkspaceMetadata(info));
                }
                remoteDiagnostics.forEach(diagnostics => {
                    if ((0, diagnostics_1.isRemoteDiagnosticError)(diagnostics)) {
                        output.push(`\n${diagnostics.errorMessage}`);
                    }
                    else {
                        output.push('\n\n');
                        output.push(`Remote:           ${diagnostics.hostName}`);
                        output.push(this.formatMachineInfo(diagnostics.machineInfo));
                        if (diagnostics.processes) {
                            output.push(this.formatProcessList(info, diagnostics.processes));
                        }
                        if (diagnostics.workspaceMetadata) {
                            for (const folder of Object.keys(diagnostics.workspaceMetadata)) {
                                const metadata = diagnostics.workspaceMetadata[folder];
                                let countMessage = `${metadata.fileCount} files`;
                                if (metadata.maxFilesReached) {
                                    countMessage = `more than ${countMessage}`;
                                }
                                output.push(`Folder (${folder}): ${countMessage}`);
                                output.push(this.formatWorkspaceStats(metadata));
                            }
                        }
                    }
                });
                output.push('');
                output.push('');
                return output.join('\n');
            });
        }
        formatWorkspaceStats(workspaceStats) {
            const output = [];
            const lineLength = 60;
            let col = 0;
            const appendAndWrap = (name, count) => {
                const item = ` ${name}(${count})`;
                if (col + item.length > lineLength) {
                    output.push(line);
                    line = '|                 ';
                    col = line.length;
                }
                else {
                    col += item.length;
                }
                line += item;
            };
            // File Types
            let line = '|      File types:';
            const maxShown = 10;
            let max = workspaceStats.fileTypes.length > maxShown ? maxShown : workspaceStats.fileTypes.length;
            for (let i = 0; i < max; i++) {
                const item = workspaceStats.fileTypes[i];
                appendAndWrap(item.name, item.count);
            }
            output.push(line);
            // Conf Files
            if (workspaceStats.configFiles.length >= 0) {
                line = '|      Conf files:';
                col = 0;
                workspaceStats.configFiles.forEach((item) => {
                    appendAndWrap(item.name, item.count);
                });
                output.push(line);
            }
            if (workspaceStats.launchConfigFiles.length > 0) {
                let line = '|      Launch Configs:';
                workspaceStats.launchConfigFiles.forEach(each => {
                    const item = each.count > 1 ? ` ${each.name}(${each.count})` : ` ${each.name}`;
                    line += item;
                });
                output.push(line);
            }
            return output.join('\n');
        }
        expandGPUFeatures(gpuFeatures) {
            const longestFeatureName = Math.max(...Object.keys(gpuFeatures).map(feature => feature.length));
            // Make columns aligned by adding spaces after feature name
            return Object.keys(gpuFeatures).map(feature => `${feature}:  ${' '.repeat(longestFeatureName - feature.length)}  ${gpuFeatures[feature]}`).join('\n                  ');
        }
        formatWorkspaceMetadata(info) {
            const output = [];
            const workspaceStatPromises = [];
            info.windows.forEach(window => {
                if (window.folderURIs.length === 0 || !!window.remoteAuthority) {
                    return;
                }
                output.push(`|  Window (${window.title})`);
                window.folderURIs.forEach(uriComponents => {
                    const folderUri = uri_1.URI.revive(uriComponents);
                    if (folderUri.scheme === network_1.Schemas.file) {
                        const folder = folderUri.fsPath;
                        workspaceStatPromises.push(collectWorkspaceStats(folder, ['node_modules', '.git']).then(stats => {
                            let countMessage = `${stats.fileCount} files`;
                            if (stats.maxFilesReached) {
                                countMessage = `more than ${countMessage}`;
                            }
                            output.push(`|    Folder (${(0, path_1.basename)(folder)}): ${countMessage}`);
                            output.push(this.formatWorkspaceStats(stats));
                        }).catch(error => {
                            output.push(`|      Error: Unable to collect workspace stats for folder ${folder} (${error.toString()})`);
                        }));
                    }
                    else {
                        output.push(`|    Folder (${folderUri.toString()}): Workspace stats not available.`);
                    }
                });
            });
            return Promise.all(workspaceStatPromises)
                .then(_ => output.join('\n'))
                .catch(e => `Unable to collect workspace stats: ${e}`);
        }
        formatProcessList(info, rootProcess) {
            const mapPidToWindowTitle = new Map();
            info.windows.forEach(window => mapPidToWindowTitle.set(window.pid, window.title));
            const output = [];
            output.push('CPU %\tMem MB\t   PID\tProcess');
            if (rootProcess) {
                this.formatProcessItem(info.mainPID, mapPidToWindowTitle, output, rootProcess, 0);
            }
            return output.join('\n');
        }
        formatProcessItem(mainPid, mapPidToWindowTitle, output, item, indent) {
            const isRoot = (indent === 0);
            // Format name with indent
            let name;
            if (isRoot) {
                name = item.pid === mainPid ? `${this.productService.applicationName} main` : 'remote agent';
            }
            else {
                name = `${'  '.repeat(indent)} ${item.name}`;
                if (item.name === 'window') {
                    name = `${name} (${mapPidToWindowTitle.get(item.pid)})`;
                }
            }
            const memory = process.platform === 'win32' ? item.mem : (osLib.totalmem() * (item.mem / 100));
            output.push(`${item.load.toFixed(0).padStart(5, ' ')}\t${(memory / files_1.ByteSize.MB).toFixed(0).padStart(6, ' ')}\t${item.pid.toFixed(0).padStart(6, ' ')}\t${name}`);
            // Recurse into children if any
            if (Array.isArray(item.children)) {
                item.children.forEach(child => this.formatProcessItem(mainPid, mapPidToWindowTitle, output, child, indent + 1));
            }
        }
        async getWorkspaceFileExtensions(workspace) {
            const items = new Set();
            for (const { uri } of workspace.folders) {
                const folderUri = uri_1.URI.revive(uri);
                if (folderUri.scheme !== network_1.Schemas.file) {
                    continue;
                }
                const folder = folderUri.fsPath;
                try {
                    const stats = await collectWorkspaceStats(folder, ['node_modules', '.git']);
                    stats.fileTypes.forEach(item => items.add(item.name));
                }
                catch (_a) { }
            }
            return { extensions: [...items] };
        }
        async reportWorkspaceStats(workspace) {
            for (const { uri } of workspace.folders) {
                const folderUri = uri_1.URI.revive(uri);
                if (folderUri.scheme !== network_1.Schemas.file) {
                    continue;
                }
                const folder = folderUri.fsPath;
                try {
                    const stats = await collectWorkspaceStats(folder, ['node_modules', '.git']);
                    this.telemetryService.publicLog2('workspace.stats', {
                        'workspace.id': workspace.telemetryId,
                        rendererSessionId: workspace.rendererSessionId
                    });
                    stats.fileTypes.forEach(e => {
                        this.telemetryService.publicLog2('workspace.stats.file', {
                            rendererSessionId: workspace.rendererSessionId,
                            type: e.name,
                            count: e.count
                        });
                    });
                    stats.launchConfigFiles.forEach(e => {
                        this.telemetryService.publicLog2('workspace.stats.launchConfigFile', {
                            rendererSessionId: workspace.rendererSessionId,
                            type: e.name,
                            count: e.count
                        });
                    });
                    stats.configFiles.forEach(e => {
                        this.telemetryService.publicLog2('workspace.stats.configFiles', {
                            rendererSessionId: workspace.rendererSessionId,
                            type: e.name,
                            count: e.count
                        });
                    });
                }
                catch (_a) {
                    // Report nothing if collecting metadata fails.
                }
            }
        }
    };
    DiagnosticsService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, productService_1.IProductService)
    ], DiagnosticsService);
    exports.DiagnosticsService = DiagnosticsService;
});
//# sourceMappingURL=diagnosticsService.js.map