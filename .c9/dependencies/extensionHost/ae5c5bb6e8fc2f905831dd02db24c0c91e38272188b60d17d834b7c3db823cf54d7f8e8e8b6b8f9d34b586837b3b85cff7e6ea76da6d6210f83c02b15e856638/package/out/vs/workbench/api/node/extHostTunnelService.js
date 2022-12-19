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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostInitDataService", "vs/base/common/uri", "child_process", "vs/base/common/resources", "vs/base/node/pfs", "vs/workbench/api/common/extHostTypes", "vs/base/common/platform", "vs/workbench/api/common/extHostTunnelService", "vs/base/common/event", "vs/platform/tunnel/common/tunnel", "vs/base/common/numbers", "vs/platform/log/common/log"], function (require, exports, extHost_protocol_1, extHostRpcService_1, nls, lifecycle_1, extHostInitDataService_1, uri_1, child_process_1, resources, pfs, types, platform_1, extHostTunnelService_1, event_1, tunnel_1, numbers_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTunnelService = exports.tryFindRootPorts = exports.findPorts = exports.getRootProcesses = exports.loadConnectionTable = exports.parseIpAddress = exports.loadListeningPorts = exports.getSockets = void 0;
    class ExtensionTunnel {
        constructor(remoteAddress, localAddress, _dispose) {
            this.remoteAddress = remoteAddress;
            this.localAddress = localAddress;
            this._dispose = _dispose;
            this._onDispose = new event_1.Emitter();
            this.onDidDispose = this._onDispose.event;
        }
        dispose() {
            this._onDispose.fire();
            return this._dispose();
        }
    }
    function getSockets(stdout) {
        const lines = stdout.trim().split('\n');
        const mapped = [];
        lines.forEach(line => {
            const match = /\/proc\/(\d+)\/fd\/\d+ -> socket:\[(\d+)\]/.exec(line);
            if (match && match.length >= 3) {
                mapped.push({
                    pid: parseInt(match[1], 10),
                    socket: parseInt(match[2], 10)
                });
            }
        });
        const socketMap = mapped.reduce((m, socket) => {
            m[socket.socket] = socket;
            return m;
        }, {});
        return socketMap;
    }
    exports.getSockets = getSockets;
    function loadListeningPorts(...stdouts) {
        const table = [].concat(...stdouts.map(loadConnectionTable));
        return [
            ...new Map(table.filter(row => row.st === '0A')
                .map(row => {
                const address = row.local_address.split(':');
                return {
                    socket: parseInt(row.inode, 10),
                    ip: parseIpAddress(address[0]),
                    port: parseInt(address[1], 16)
                };
            }).map(port => [port.ip + ':' + port.port, port])).values()
        ];
    }
    exports.loadListeningPorts = loadListeningPorts;
    function parseIpAddress(hex) {
        let result = '';
        if (hex.length === 8) {
            for (let i = hex.length - 2; i >= 0; i -= 2) {
                result += parseInt(hex.substr(i, 2), 16);
                if (i !== 0) {
                    result += '.';
                }
            }
        }
        else {
            for (let i = hex.length - 4; i >= 0; i -= 4) {
                result += parseInt(hex.substr(i, 4), 16).toString(16);
                if (i !== 0) {
                    result += ':';
                }
            }
        }
        return result;
    }
    exports.parseIpAddress = parseIpAddress;
    function loadConnectionTable(stdout) {
        const lines = stdout.trim().split('\n');
        const names = lines.shift().trim().split(/\s+/)
            .filter(name => name !== 'rx_queue' && name !== 'tm->when');
        const table = lines.map(line => line.trim().split(/\s+/).reduce((obj, value, i) => {
            obj[names[i] || i] = value;
            return obj;
        }, {}));
        return table;
    }
    exports.loadConnectionTable = loadConnectionTable;
    function knownExcludeCmdline(command) {
        return !!command.match(/.*\.vscode-server-[a-zA-Z]+\/bin.*/)
            || (command.indexOf('out/server-main.js') !== -1)
            || (command.indexOf('_productName=VSCode') !== -1);
    }
    function getRootProcesses(stdout) {
        const lines = stdout.trim().split('\n');
        const mapped = [];
        lines.forEach(line => {
            const match = /^\d+\s+\D+\s+root\s+(\d+)\s+(\d+).+\d+\:\d+\:\d+\s+(.+)$/.exec(line);
            if (match && match.length >= 4) {
                mapped.push({
                    pid: parseInt(match[1], 10),
                    ppid: parseInt(match[2]),
                    cmd: match[3]
                });
            }
        });
        return mapped;
    }
    exports.getRootProcesses = getRootProcesses;
    async function findPorts(connections, socketMap, processes) {
        const processMap = processes.reduce((m, process) => {
            m[process.pid] = process;
            return m;
        }, {});
        const ports = [];
        connections.forEach(({ socket, ip, port }) => {
            var _a;
            const pid = socketMap[socket] ? socketMap[socket].pid : undefined;
            const command = pid ? (_a = processMap[pid]) === null || _a === void 0 ? void 0 : _a.cmd : undefined;
            if (pid && command && !knownExcludeCmdline(command)) {
                ports.push({ host: ip, port, detail: command, pid });
            }
        });
        return ports;
    }
    exports.findPorts = findPorts;
    function tryFindRootPorts(connections, rootProcessesStdout, previousPorts) {
        const ports = new Map();
        const rootProcesses = getRootProcesses(rootProcessesStdout);
        for (const connection of connections) {
            const previousPort = previousPorts.get(connection.port);
            if (previousPort) {
                ports.set(connection.port, previousPort);
                continue;
            }
            const rootProcessMatch = rootProcesses.find((value) => value.cmd.includes(`${connection.port}`));
            if (rootProcessMatch) {
                let bestMatch = rootProcessMatch;
                // There are often several processes that "look" like they could match the port.
                // The one we want is usually the child of the other. Find the most child process.
                let mostChild;
                do {
                    mostChild = rootProcesses.find(value => value.ppid === bestMatch.pid);
                    if (mostChild) {
                        bestMatch = mostChild;
                    }
                } while (mostChild);
                ports.set(connection.port, { host: connection.ip, port: connection.port, pid: bestMatch.pid, detail: bestMatch.cmd, ppid: bestMatch.ppid });
            }
            else {
                ports.set(connection.port, { host: connection.ip, port: connection.port, ppid: Number.MAX_VALUE });
            }
        }
        return ports;
    }
    exports.tryFindRootPorts = tryFindRootPorts;
    let ExtHostTunnelService = class ExtHostTunnelService extends lifecycle_1.Disposable {
        constructor(extHostRpc, initData, logService) {
            super();
            this.logService = logService;
            this._showCandidatePort = () => { return Promise.resolve(true); };
            this._extensionTunnels = new Map();
            this._onDidChangeTunnels = new event_1.Emitter();
            this.onDidChangeTunnels = this._onDidChangeTunnels.event;
            this._candidateFindingEnabled = false;
            this._foundRootPorts = new Map();
            this._providerHandleCounter = 0;
            this._portAttributesProviders = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTunnelService);
            if (platform_1.isLinux && initData.remote.isRemote && initData.remote.authority) {
                this._proxy.$setRemoteTunnelService(process.pid);
            }
        }
        async openTunnel(extension, forward) {
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) ${extension.identifier.value} called openTunnel API for ${forward.remoteAddress.host}:${forward.remoteAddress.port}.`);
            const tunnel = await this._proxy.$openTunnel(forward, extension.displayName);
            if (tunnel) {
                const disposableTunnel = new ExtensionTunnel(tunnel.remoteAddress, tunnel.localAddress, () => {
                    return this._proxy.$closeTunnel(tunnel.remoteAddress);
                });
                this._register(disposableTunnel);
                return disposableTunnel;
            }
            return undefined;
        }
        async getTunnels() {
            return this._proxy.$getTunnels();
        }
        calculateDelay(movingAverage) {
            // Some local testing indicated that the moving average might be between 50-100 ms.
            return Math.max(movingAverage * 20, 2000);
        }
        nextPortAttributesProviderHandle() {
            return this._providerHandleCounter++;
        }
        registerPortsAttributesProvider(portSelector, provider) {
            const providerHandle = this.nextPortAttributesProviderHandle();
            this._portAttributesProviders.set(providerHandle, { selector: portSelector, provider });
            this._proxy.$registerPortsAttributesProvider(portSelector, providerHandle);
            return new types.Disposable(() => {
                this._portAttributesProviders.delete(providerHandle);
                this._proxy.$unregisterPortsAttributesProvider(providerHandle);
            });
        }
        async $providePortAttributes(handles, ports, pid, commandline, cancellationToken) {
            const providedAttributes = [];
            for (const handle of handles) {
                const provider = this._portAttributesProviders.get(handle);
                if (!provider) {
                    return [];
                }
                providedAttributes.push(...(await Promise.all(ports.map(async (port) => {
                    return provider.provider.providePortAttributes(port, pid, commandline, cancellationToken);
                }))));
            }
            const allAttributes = providedAttributes.filter(attribute => !!attribute);
            return (allAttributes.length > 0) ? allAttributes.map(attributes => {
                return {
                    autoForwardAction: attributes.autoForwardAction,
                    port: attributes.port
                };
            }) : [];
        }
        async $registerCandidateFinder(enable) {
            if (enable && this._candidateFindingEnabled) {
                // already enabled
                return;
            }
            this._candidateFindingEnabled = enable;
            // Regularly scan to see if the candidate ports have changed.
            let movingAverage = new numbers_1.MovingAverage();
            let oldPorts = undefined;
            while (this._candidateFindingEnabled) {
                const startTime = new Date().getTime();
                const newPorts = (await this.findCandidatePorts()).filter(candidate => ((0, tunnel_1.isLocalhost)(candidate.host) || (0, tunnel_1.isAllInterfaces)(candidate.host)));
                this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) found candidate ports ${newPorts.map(port => port.port).join(', ')}`);
                const timeTaken = new Date().getTime() - startTime;
                movingAverage.update(timeTaken);
                if (!oldPorts || (JSON.stringify(oldPorts) !== JSON.stringify(newPorts))) {
                    oldPorts = newPorts;
                    await this._proxy.$onFoundNewCandidates(oldPorts);
                }
                await (new Promise(resolve => setTimeout(() => resolve(), this.calculateDelay(movingAverage.value))));
            }
        }
        async setTunnelFactory(provider) {
            var _a, _b, _c, _d, _e;
            // Do not wait for any of the proxy promises here.
            // It will delay startup and there is nothing that needs to be waited for.
            if (provider) {
                if (provider.candidatePortSource !== undefined) {
                    this._proxy.$setCandidatePortSource(provider.candidatePortSource);
                }
                if (provider.showCandidatePort) {
                    this._showCandidatePort = provider.showCandidatePort;
                    this._proxy.$setCandidateFilter();
                }
                if (provider.tunnelFactory) {
                    this._forwardPortProvider = provider.tunnelFactory;
                    let privacyOptions = (_b = (_a = provider.tunnelFeatures) === null || _a === void 0 ? void 0 : _a.privacyOptions) !== null && _b !== void 0 ? _b : [];
                    if (((_c = provider.tunnelFeatures) === null || _c === void 0 ? void 0 : _c.public) && (privacyOptions.length === 0)) {
                        privacyOptions = [
                            {
                                id: 'private',
                                label: nls.localize('tunnelPrivacy.private', "Private"),
                                themeIcon: 'lock'
                            },
                            {
                                id: 'public',
                                label: nls.localize('tunnelPrivacy.public', "Public"),
                                themeIcon: 'eye'
                            }
                        ];
                    }
                    const tunnelFeatures = provider.tunnelFeatures ? {
                        elevation: !!((_d = provider.tunnelFeatures) === null || _d === void 0 ? void 0 : _d.elevation),
                        public: !!((_e = provider.tunnelFeatures) === null || _e === void 0 ? void 0 : _e.public),
                        privacyOptions
                    } : undefined;
                    this._proxy.$setTunnelProvider(tunnelFeatures);
                }
            }
            else {
                this._forwardPortProvider = undefined;
            }
            return (0, lifecycle_1.toDisposable)(() => {
                this._forwardPortProvider = undefined;
            });
        }
        async $closeTunnel(remote, silent) {
            if (this._extensionTunnels.has(remote.host)) {
                const hostMap = this._extensionTunnels.get(remote.host);
                if (hostMap.has(remote.port)) {
                    if (silent) {
                        hostMap.get(remote.port).disposeListener.dispose();
                    }
                    await hostMap.get(remote.port).tunnel.dispose();
                    hostMap.delete(remote.port);
                }
            }
        }
        async $onDidTunnelsChange() {
            this._onDidChangeTunnels.fire();
        }
        async $forwardPort(tunnelOptions, tunnelCreationOptions) {
            if (this._forwardPortProvider) {
                try {
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Getting tunnel from provider.');
                    const providedPort = this._forwardPortProvider(tunnelOptions, tunnelCreationOptions);
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Got tunnel promise from provider.');
                    if (providedPort !== undefined) {
                        const tunnel = await providedPort;
                        this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Successfully awaited tunnel from provider.');
                        if (!this._extensionTunnels.has(tunnelOptions.remoteAddress.host)) {
                            this._extensionTunnels.set(tunnelOptions.remoteAddress.host, new Map());
                        }
                        const disposeListener = this._register(tunnel.onDidDispose(() => {
                            this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Extension fired tunnel\'s onDidDispose.');
                            return this._proxy.$closeTunnel(tunnel.remoteAddress);
                        }));
                        this._extensionTunnels.get(tunnelOptions.remoteAddress.host).set(tunnelOptions.remoteAddress.port, { tunnel, disposeListener });
                        return extHostTunnelService_1.TunnelDtoConverter.fromApiTunnel(tunnel);
                    }
                    else {
                        this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Tunnel is undefined');
                    }
                }
                catch (e) {
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) tunnel provider error');
                }
            }
            return undefined;
        }
        async $applyCandidateFilter(candidates) {
            const filter = await Promise.all(candidates.map(candidate => { var _a; return this._showCandidatePort(candidate.host, candidate.port, (_a = candidate.detail) !== null && _a !== void 0 ? _a : ''); }));
            const result = candidates.filter((candidate, index) => filter[index]);
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) filtered from ${candidates.map(port => port.port).join(', ')} to ${result.map(port => port.port).join(', ')}`);
            return result;
        }
        async findCandidatePorts() {
            let tcp = '';
            let tcp6 = '';
            try {
                tcp = await pfs.Promises.readFile('/proc/net/tcp', 'utf8');
                tcp6 = await pfs.Promises.readFile('/proc/net/tcp6', 'utf8');
            }
            catch (e) {
                // File reading error. No additional handling needed.
            }
            const connections = loadListeningPorts(tcp, tcp6);
            const procSockets = await (new Promise(resolve => {
                (0, child_process_1.exec)('ls -l /proc/[0-9]*/fd/[0-9]* | grep socket:', (error, stdout, stderr) => {
                    resolve(stdout);
                });
            }));
            const socketMap = getSockets(procSockets);
            const procChildren = await pfs.Promises.readdir('/proc');
            const processes = [];
            for (let childName of procChildren) {
                try {
                    const pid = Number(childName);
                    const childUri = resources.joinPath(uri_1.URI.file('/proc'), childName);
                    const childStat = await pfs.Promises.stat(childUri.fsPath);
                    if (childStat.isDirectory() && !isNaN(pid)) {
                        const cwd = await pfs.Promises.readlink(resources.joinPath(childUri, 'cwd').fsPath);
                        const cmd = await pfs.Promises.readFile(resources.joinPath(childUri, 'cmdline').fsPath, 'utf8');
                        processes.push({ pid, cwd, cmd });
                    }
                }
                catch (e) {
                    //
                }
            }
            const unFoundConnections = [];
            const filteredConnections = connections.filter((connection => {
                const foundConnection = socketMap[connection.socket];
                if (!foundConnection) {
                    unFoundConnections.push(connection);
                }
                return foundConnection;
            }));
            const foundPorts = findPorts(filteredConnections, socketMap, processes);
            let heuristicPorts;
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) number of possible root ports ${unFoundConnections.length}`);
            if (unFoundConnections.length > 0) {
                const rootProcesses = await (new Promise(resolve => {
                    (0, child_process_1.exec)('ps -F -A -l | grep root', (error, stdout, stderr) => {
                        resolve(stdout);
                    });
                }));
                this._foundRootPorts = tryFindRootPorts(unFoundConnections, rootProcesses, this._foundRootPorts);
                heuristicPorts = Array.from(this._foundRootPorts.values());
                this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) heuristic ports ${heuristicPorts.join(', ')}`);
            }
            return foundPorts.then(foundCandidates => {
                if (heuristicPorts) {
                    return foundCandidates.concat(heuristicPorts);
                }
                else {
                    return foundCandidates;
                }
            });
        }
    };
    ExtHostTunnelService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, log_1.ILogService)
    ], ExtHostTunnelService);
    exports.ExtHostTunnelService = ExtHostTunnelService;
});
//# sourceMappingURL=extHostTunnelService.js.map