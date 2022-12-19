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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/environment/common/environmentService", "vs/base/common/types", "vs/platform/workspace/common/workspace", "vs/base/common/hash", "vs/platform/log/common/log", "vs/base/common/cancellation", "vs/base/common/arrays", "vs/base/common/severity", "vs/platform/dialogs/common/dialogs", "vs/base/common/uri", "vs/base/common/objects"], function (require, exports, nls, event_1, instantiation_1, extensions_1, storage_1, tunnel_1, lifecycle_1, configuration_1, remoteAuthorityResolver_1, environmentService_1, types_1, workspace_1, hash_1, log_1, cancellation_1, arrays_1, severity_1, dialogs_1, uri_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelModel = exports.PortsAttributes = exports.OnPortForward = exports.mapHasAddressLocalhostOrAllInterfaces = exports.mapHasAddress = exports.parseAddress = exports.makeAddress = exports.AutoTunnelSource = exports.UserTunnelSource = exports.TunnelSource = exports.TunnelEditId = exports.TunnelType = exports.PORT_AUTO_SOURCE_SETTING_OUTPUT = exports.PORT_AUTO_SOURCE_SETTING_PROCESS = exports.PORT_AUTO_SOURCE_SETTING = exports.PORT_AUTO_FORWARD_SETTING = exports.TUNNEL_VIEW_CONTAINER_ID = exports.TUNNEL_VIEW_ID = exports.REMOTE_EXPLORER_TYPE_KEY = exports.IRemoteExplorerService = void 0;
    exports.IRemoteExplorerService = (0, instantiation_1.createDecorator)('remoteExplorerService');
    exports.REMOTE_EXPLORER_TYPE_KEY = 'remote.explorerType';
    const TUNNELS_TO_RESTORE = 'remote.tunnels.toRestore';
    exports.TUNNEL_VIEW_ID = '~remote.forwardedPorts';
    exports.TUNNEL_VIEW_CONTAINER_ID = '~remote.forwardedPortsContainer';
    exports.PORT_AUTO_FORWARD_SETTING = 'remote.autoForwardPorts';
    exports.PORT_AUTO_SOURCE_SETTING = 'remote.autoForwardPortsSource';
    exports.PORT_AUTO_SOURCE_SETTING_PROCESS = 'process';
    exports.PORT_AUTO_SOURCE_SETTING_OUTPUT = 'output';
    var TunnelType;
    (function (TunnelType) {
        TunnelType["Candidate"] = "Candidate";
        TunnelType["Detected"] = "Detected";
        TunnelType["Forwarded"] = "Forwarded";
        TunnelType["Add"] = "Add";
    })(TunnelType = exports.TunnelType || (exports.TunnelType = {}));
    var TunnelEditId;
    (function (TunnelEditId) {
        TunnelEditId[TunnelEditId["None"] = 0] = "None";
        TunnelEditId[TunnelEditId["New"] = 1] = "New";
        TunnelEditId[TunnelEditId["Label"] = 2] = "Label";
        TunnelEditId[TunnelEditId["LocalPort"] = 3] = "LocalPort";
    })(TunnelEditId = exports.TunnelEditId || (exports.TunnelEditId = {}));
    var TunnelSource;
    (function (TunnelSource) {
        TunnelSource[TunnelSource["User"] = 0] = "User";
        TunnelSource[TunnelSource["Auto"] = 1] = "Auto";
        TunnelSource[TunnelSource["Extension"] = 2] = "Extension";
    })(TunnelSource = exports.TunnelSource || (exports.TunnelSource = {}));
    exports.UserTunnelSource = {
        source: TunnelSource.User,
        description: nls.localize('tunnel.source.user', "User Forwarded")
    };
    exports.AutoTunnelSource = {
        source: TunnelSource.Auto,
        description: nls.localize('tunnel.source.auto', "Auto Forwarded")
    };
    function makeAddress(host, port) {
        return host + ':' + port;
    }
    exports.makeAddress = makeAddress;
    function parseAddress(address) {
        var _a;
        const matches = address.match(/^([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*:)?([0-9]+)$/);
        if (!matches) {
            return undefined;
        }
        return { host: ((_a = matches[1]) === null || _a === void 0 ? void 0 : _a.substring(0, matches[1].length - 1)) || 'localhost', port: Number(matches[2]) };
    }
    exports.parseAddress = parseAddress;
    function mapHasAddress(map, host, port) {
        const initialAddress = map.get(makeAddress(host, port));
        if (initialAddress) {
            return initialAddress;
        }
        if ((0, tunnel_1.isLocalhost)(host)) {
            // Do localhost checks
            for (const testHost of tunnel_1.LOCALHOST_ADDRESSES) {
                const testAddress = makeAddress(testHost, port);
                if (map.has(testAddress)) {
                    return map.get(testAddress);
                }
            }
        }
        else if ((0, tunnel_1.isAllInterfaces)(host)) {
            // Do all interfaces checks
            for (const testHost of tunnel_1.ALL_INTERFACES_ADDRESSES) {
                const testAddress = makeAddress(testHost, port);
                if (map.has(testAddress)) {
                    return map.get(testAddress);
                }
            }
        }
        return undefined;
    }
    exports.mapHasAddress = mapHasAddress;
    function mapHasAddressLocalhostOrAllInterfaces(map, host, port) {
        const originalAddress = mapHasAddress(map, host, port);
        if (originalAddress) {
            return originalAddress;
        }
        const otherHost = (0, tunnel_1.isAllInterfaces)(host) ? 'localhost' : ((0, tunnel_1.isLocalhost)(host) ? '0.0.0.0' : undefined);
        if (otherHost) {
            return mapHasAddress(map, otherHost, port);
        }
        return undefined;
    }
    exports.mapHasAddressLocalhostOrAllInterfaces = mapHasAddressLocalhostOrAllInterfaces;
    var OnPortForward;
    (function (OnPortForward) {
        OnPortForward["Notify"] = "notify";
        OnPortForward["OpenBrowser"] = "openBrowser";
        OnPortForward["OpenBrowserOnce"] = "openBrowserOnce";
        OnPortForward["OpenPreview"] = "openPreview";
        OnPortForward["Silent"] = "silent";
        OnPortForward["Ignore"] = "ignore";
    })(OnPortForward = exports.OnPortForward || (exports.OnPortForward = {}));
    class PortsAttributes extends lifecycle_1.Disposable {
        constructor(configurationService) {
            super();
            this.configurationService = configurationService;
            this.portsAttributes = [];
            this._onDidChangeAttributes = new event_1.Emitter();
            this.onDidChangeAttributes = this._onDidChangeAttributes.event;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(PortsAttributes.SETTING) || e.affectsConfiguration(PortsAttributes.DEFAULTS)) {
                    this.updateAttributes();
                }
            }));
            this.updateAttributes();
        }
        updateAttributes() {
            this.portsAttributes = this.readSetting();
            this._onDidChangeAttributes.fire();
        }
        getAttributes(port, host, commandLine) {
            var _a, _b, _c, _d, _e;
            let index = this.findNextIndex(port, host, commandLine, this.portsAttributes, 0);
            const attributes = {
                label: undefined,
                onAutoForward: undefined,
                elevateIfNeeded: undefined,
                requireLocalPort: undefined,
                protocol: undefined
            };
            while (index >= 0) {
                const found = this.portsAttributes[index];
                if (found.key === port) {
                    attributes.onAutoForward = (_a = found.onAutoForward) !== null && _a !== void 0 ? _a : attributes.onAutoForward;
                    attributes.elevateIfNeeded = (found.elevateIfNeeded !== undefined) ? found.elevateIfNeeded : attributes.elevateIfNeeded;
                    attributes.label = (_b = found.label) !== null && _b !== void 0 ? _b : attributes.label;
                    attributes.requireLocalPort = found.requireLocalPort;
                    attributes.protocol = found.protocol;
                }
                else {
                    // It's a range or regex, which means that if the attribute is already set, we keep it
                    attributes.onAutoForward = (_c = attributes.onAutoForward) !== null && _c !== void 0 ? _c : found.onAutoForward;
                    attributes.elevateIfNeeded = (attributes.elevateIfNeeded !== undefined) ? attributes.elevateIfNeeded : found.elevateIfNeeded;
                    attributes.label = (_d = attributes.label) !== null && _d !== void 0 ? _d : found.label;
                    attributes.requireLocalPort = (attributes.requireLocalPort !== undefined) ? attributes.requireLocalPort : undefined;
                    attributes.protocol = (_e = attributes.protocol) !== null && _e !== void 0 ? _e : found.protocol;
                }
                index = this.findNextIndex(port, host, commandLine, this.portsAttributes, index + 1);
            }
            if (attributes.onAutoForward !== undefined || attributes.elevateIfNeeded !== undefined
                || attributes.label !== undefined || attributes.requireLocalPort !== undefined
                || attributes.protocol !== undefined) {
                return attributes;
            }
            // If we find no matches, then use the other port attributes.
            return this.getOtherAttributes();
        }
        hasStartEnd(value) {
            return (value.start !== undefined) && (value.end !== undefined);
        }
        hasHostAndPort(value) {
            return (value.host !== undefined) && (value.port !== undefined)
                && (0, types_1.isString)(value.host) && (0, types_1.isNumber)(value.port);
        }
        findNextIndex(port, host, commandLine, attributes, fromIndex) {
            if (fromIndex >= attributes.length) {
                return -1;
            }
            const shouldUseHost = !(0, tunnel_1.isLocalhost)(host) && !(0, tunnel_1.isAllInterfaces)(host);
            const sliced = attributes.slice(fromIndex);
            const foundIndex = sliced.findIndex((value) => {
                if ((0, types_1.isNumber)(value.key)) {
                    return shouldUseHost ? false : value.key === port;
                }
                else if (this.hasStartEnd(value.key)) {
                    return shouldUseHost ? false : (port >= value.key.start && port <= value.key.end);
                }
                else if (this.hasHostAndPort(value.key)) {
                    return (port === value.key.port) && (host === value.key.host);
                }
                else {
                    return commandLine ? value.key.test(commandLine) : false;
                }
            });
            return foundIndex >= 0 ? foundIndex + fromIndex : -1;
        }
        readSetting() {
            const settingValue = this.configurationService.getValue(PortsAttributes.SETTING);
            if (!settingValue || !(0, types_1.isObject)(settingValue)) {
                return [];
            }
            const attributes = [];
            for (let attributesKey in settingValue) {
                if (attributesKey === undefined) {
                    continue;
                }
                const setting = settingValue[attributesKey];
                let key = undefined;
                if (Number(attributesKey)) {
                    key = Number(attributesKey);
                }
                else if ((0, types_1.isString)(attributesKey)) {
                    if (PortsAttributes.RANGE.test(attributesKey)) {
                        const match = attributesKey.match(PortsAttributes.RANGE);
                        key = { start: Number(match[1]), end: Number(match[2]) };
                    }
                    else if (PortsAttributes.HOST_AND_PORT.test(attributesKey)) {
                        const match = attributesKey.match(PortsAttributes.HOST_AND_PORT);
                        key = { host: match[1], port: Number(match[2]) };
                    }
                    else {
                        let regTest = undefined;
                        try {
                            regTest = RegExp(attributesKey);
                        }
                        catch (e) {
                            // The user entered an invalid regular expression.
                        }
                        if (regTest) {
                            key = regTest;
                        }
                    }
                }
                if (!key) {
                    continue;
                }
                attributes.push({
                    key: key,
                    elevateIfNeeded: setting.elevateIfNeeded,
                    onAutoForward: setting.onAutoForward,
                    label: setting.label,
                    requireLocalPort: setting.requireLocalPort,
                    protocol: setting.protocol
                });
            }
            const defaults = this.configurationService.getValue(PortsAttributes.DEFAULTS);
            if (defaults) {
                this.defaultPortAttributes = {
                    elevateIfNeeded: defaults.elevateIfNeeded,
                    label: defaults.label,
                    onAutoForward: defaults.onAutoForward,
                    requireLocalPort: defaults.requireLocalPort,
                    protocol: defaults.protocol
                };
            }
            return this.sortAttributes(attributes);
        }
        sortAttributes(attributes) {
            function getVal(item, thisRef) {
                if ((0, types_1.isNumber)(item.key)) {
                    return item.key;
                }
                else if (thisRef.hasStartEnd(item.key)) {
                    return item.key.start;
                }
                else if (thisRef.hasHostAndPort(item.key)) {
                    return item.key.port;
                }
                else {
                    return Number.MAX_VALUE;
                }
            }
            return attributes.sort((a, b) => {
                return getVal(a, this) - getVal(b, this);
            });
        }
        getOtherAttributes() {
            return this.defaultPortAttributes;
        }
        static providedActionToAction(providedAction) {
            switch (providedAction) {
                case tunnel_1.ProvidedOnAutoForward.Notify: return OnPortForward.Notify;
                case tunnel_1.ProvidedOnAutoForward.OpenBrowser: return OnPortForward.OpenBrowser;
                case tunnel_1.ProvidedOnAutoForward.OpenBrowserOnce: return OnPortForward.OpenBrowserOnce;
                case tunnel_1.ProvidedOnAutoForward.OpenPreview: return OnPortForward.OpenPreview;
                case tunnel_1.ProvidedOnAutoForward.Silent: return OnPortForward.Silent;
                case tunnel_1.ProvidedOnAutoForward.Ignore: return OnPortForward.Ignore;
                default: return undefined;
            }
        }
        async addAttributes(port, attributes, target) {
            let settingValue = this.configurationService.inspect(PortsAttributes.SETTING);
            const remoteValue = settingValue.userRemoteValue;
            let newRemoteValue;
            if (!remoteValue || !(0, types_1.isObject)(remoteValue)) {
                newRemoteValue = {};
            }
            else {
                newRemoteValue = (0, objects_1.deepClone)(remoteValue);
            }
            if (!newRemoteValue[`${port}`]) {
                newRemoteValue[`${port}`] = {};
            }
            for (const attribute in attributes) {
                newRemoteValue[`${port}`][attribute] = attributes[attribute];
            }
            return this.configurationService.updateValue(PortsAttributes.SETTING, newRemoteValue, target);
        }
    }
    exports.PortsAttributes = PortsAttributes;
    PortsAttributes.SETTING = 'remote.portsAttributes';
    PortsAttributes.DEFAULTS = 'remote.otherPortsAttributes';
    PortsAttributes.RANGE = /^(\d+)\-(\d+)$/;
    PortsAttributes.HOST_AND_PORT = /^([a-z0-9\-]+):(\d{1,5})$/;
    const MISMATCH_LOCAL_PORT_COOLDOWN = 10 * 1000; // 10 seconds
    let TunnelModel = class TunnelModel extends lifecycle_1.Disposable {
        constructor(tunnelService, storageService, configurationService, environmentService, remoteAuthorityResolverService, workspaceContextService, logService, dialogService) {
            super();
            this.tunnelService = tunnelService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.workspaceContextService = workspaceContextService;
            this.logService = logService;
            this.dialogService = dialogService;
            this.inProgress = new Map();
            this._onForwardPort = new event_1.Emitter();
            this.onForwardPort = this._onForwardPort.event;
            this._onClosePort = new event_1.Emitter();
            this.onClosePort = this._onClosePort.event;
            this._onPortName = new event_1.Emitter();
            this.onPortName = this._onPortName.event;
            this._onCandidatesChanged = new event_1.Emitter();
            // onCandidateChanged returns the removed candidates
            this.onCandidatesChanged = this._onCandidatesChanged.event;
            this._onEnvironmentTunnelsSet = new event_1.Emitter();
            this.onEnvironmentTunnelsSet = this._onEnvironmentTunnelsSet.event;
            this._environmentTunnelsSet = false;
            this.portAttributesProviders = [];
            this.mismatchCooldown = new Date();
            this.configPortsAttributes = new PortsAttributes(configurationService);
            this.tunnelRestoreValue = this.getTunnelRestoreValue();
            this._register(this.configPortsAttributes.onDidChangeAttributes(this.updateAttributes, this));
            this.forwarded = new Map();
            this.remoteTunnels = new Map();
            this.tunnelService.tunnels.then(async (tunnels) => {
                var _a, _b, _c;
                const attributes = await this.getAttributes(tunnels.map(tunnel => {
                    return { port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost };
                }));
                for (const tunnel of tunnels) {
                    if (tunnel.localAddress) {
                        const key = makeAddress(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                        const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces((_a = this._candidates) !== null && _a !== void 0 ? _a : new Map(), tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                        this.forwarded.set(key, {
                            remotePort: tunnel.tunnelRemotePort,
                            remoteHost: tunnel.tunnelRemoteHost,
                            localAddress: tunnel.localAddress,
                            protocol: (_c = (_b = attributes === null || attributes === void 0 ? void 0 : attributes.get(tunnel.tunnelRemotePort)) === null || _b === void 0 ? void 0 : _b.protocol) !== null && _c !== void 0 ? _c : tunnel_1.TunnelProtocol.Http,
                            localUri: await this.makeLocalUri(tunnel.localAddress, attributes === null || attributes === void 0 ? void 0 : attributes.get(tunnel.tunnelRemotePort)),
                            localPort: tunnel.tunnelLocalPort,
                            runningProcess: matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.detail,
                            hasRunningProcess: !!matchingCandidate,
                            pid: matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.pid,
                            privacy: tunnel.privacy,
                            source: exports.UserTunnelSource,
                        });
                        this.remoteTunnels.set(key, tunnel);
                    }
                }
            });
            this.detected = new Map();
            this._register(this.tunnelService.onTunnelOpened(async (tunnel) => {
                var _a, _b, _c;
                const key = makeAddress(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                if (!mapHasAddressLocalhostOrAllInterfaces(this.forwarded, tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort)
                    && !mapHasAddressLocalhostOrAllInterfaces(this.inProgress, tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort)
                    && tunnel.localAddress) {
                    const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces((_a = this._candidates) !== null && _a !== void 0 ? _a : new Map(), tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                    const attributes = (_b = (await this.getAttributes([{ port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost }]))) === null || _b === void 0 ? void 0 : _b.get(tunnel.tunnelRemotePort);
                    this.forwarded.set(key, {
                        remoteHost: tunnel.tunnelRemoteHost,
                        remotePort: tunnel.tunnelRemotePort,
                        localAddress: tunnel.localAddress,
                        protocol: (_c = attributes === null || attributes === void 0 ? void 0 : attributes.protocol) !== null && _c !== void 0 ? _c : tunnel_1.TunnelProtocol.Http,
                        localUri: await this.makeLocalUri(tunnel.localAddress, attributes),
                        localPort: tunnel.tunnelLocalPort,
                        closeable: true,
                        runningProcess: matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.detail,
                        hasRunningProcess: !!matchingCandidate,
                        pid: matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.pid,
                        privacy: tunnel.privacy,
                        source: exports.UserTunnelSource,
                    });
                }
                await this.storeForwarded();
                this.remoteTunnels.set(key, tunnel);
                this._onForwardPort.fire(this.forwarded.get(key));
            }));
            this._register(this.tunnelService.onTunnelClosed(address => {
                return this.onTunnelClosed(address);
            }));
        }
        async onTunnelClosed(address) {
            const key = makeAddress(address.host, address.port);
            if (this.forwarded.has(key)) {
                this.forwarded.delete(key);
                await this.storeForwarded();
                this._onClosePort.fire(address);
            }
        }
        makeLocalUri(localAddress, attributes) {
            var _a;
            if (localAddress.startsWith('http')) {
                return uri_1.URI.parse(localAddress);
            }
            const protocol = (_a = attributes === null || attributes === void 0 ? void 0 : attributes.protocol) !== null && _a !== void 0 ? _a : 'http';
            return uri_1.URI.parse(`${protocol}://${localAddress}`);
        }
        async getStorageKey() {
            const workspace = this.workspaceContextService.getWorkspace();
            const workspaceHash = workspace.configuration ? (0, hash_1.hash)(workspace.configuration.path) : (workspace.folders.length > 0 ? (0, hash_1.hash)(workspace.folders[0].uri.path) : undefined);
            return `${TUNNELS_TO_RESTORE}.${this.environmentService.remoteAuthority}.${workspaceHash}`;
        }
        async getTunnelRestoreValue() {
            const deprecatedValue = this.storageService.get(TUNNELS_TO_RESTORE, 1 /* StorageScope.WORKSPACE */);
            if (deprecatedValue) {
                this.storageService.remove(TUNNELS_TO_RESTORE, 1 /* StorageScope.WORKSPACE */);
                await this.storeForwarded();
                return deprecatedValue;
            }
            return this.storageService.get(await this.getStorageKey(), 0 /* StorageScope.GLOBAL */);
        }
        async restoreForwarded() {
            var _a;
            if (this.configurationService.getValue('remote.restoreForwardedPorts')) {
                const tunnelRestoreValue = await this.tunnelRestoreValue;
                if (tunnelRestoreValue && (tunnelRestoreValue !== this.knownPortsRestoreValue)) {
                    const tunnels = (_a = JSON.parse(tunnelRestoreValue)) !== null && _a !== void 0 ? _a : [];
                    this.logService.trace(`ForwardedPorts: (TunnelModel) restoring ports ${tunnels.map(tunnel => tunnel.remotePort).join(', ')}`);
                    for (let tunnel of tunnels) {
                        if (!mapHasAddressLocalhostOrAllInterfaces(this.detected, tunnel.remoteHost, tunnel.remotePort)) {
                            await this.forward({
                                remote: { host: tunnel.remoteHost, port: tunnel.remotePort },
                                local: tunnel.localPort,
                                name: tunnel.name,
                                privacy: tunnel.privacy,
                                elevateIfNeeded: true
                            });
                        }
                    }
                }
            }
            if (!this.restoreListener) {
                // It's possible that at restore time the value hasn't synced.
                const key = await this.getStorageKey();
                this.restoreListener = this._register(this.storageService.onDidChangeValue(async (e) => {
                    if (e.key === key) {
                        this.tunnelRestoreValue = Promise.resolve(this.storageService.get(await this.getStorageKey(), 0 /* StorageScope.GLOBAL */));
                        await this.restoreForwarded();
                    }
                }));
            }
        }
        async storeForwarded() {
            if (this.configurationService.getValue('remote.restoreForwardedPorts')) {
                const valueToStore = JSON.stringify(Array.from(this.forwarded.values()).filter(value => value.source.source === TunnelSource.User));
                if (valueToStore !== this.knownPortsRestoreValue) {
                    this.knownPortsRestoreValue = valueToStore;
                    this.storageService.store(await this.getStorageKey(), this.knownPortsRestoreValue, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                }
            }
        }
        async showPortMismatchModalIfNeeded(tunnel, expectedLocal, attributes) {
            if (!tunnel.tunnelLocalPort || !(attributes === null || attributes === void 0 ? void 0 : attributes.requireLocalPort)) {
                return;
            }
            if (tunnel.tunnelLocalPort === expectedLocal) {
                return;
            }
            const newCooldown = new Date();
            if ((this.mismatchCooldown.getTime() + MISMATCH_LOCAL_PORT_COOLDOWN) > newCooldown.getTime()) {
                return;
            }
            this.mismatchCooldown = newCooldown;
            const mismatchString = nls.localize('remote.localPortMismatch.single', "Local port {0} could not be used for forwarding to remote port {1}.\n\nThis usually happens when there is already another process using local port {0}.\n\nPort number {2} has been used instead.", expectedLocal, tunnel.tunnelRemotePort, tunnel.tunnelLocalPort);
            return this.dialogService.show(severity_1.default.Info, mismatchString);
        }
        async forward(tunnelProperties, attributes) {
            var _a, _b, _c, _d, _e, _f;
            const existingTunnel = mapHasAddressLocalhostOrAllInterfaces(this.forwarded, tunnelProperties.remote.host, tunnelProperties.remote.port);
            attributes = attributes !== null && attributes !== void 0 ? attributes : ((attributes !== null)
                ? (_a = (await this.getAttributes([tunnelProperties.remote]))) === null || _a === void 0 ? void 0 : _a.get(tunnelProperties.remote.port)
                : undefined);
            const localPort = (tunnelProperties.local !== undefined) ? tunnelProperties.local : tunnelProperties.remote.port;
            if (!existingTunnel) {
                const authority = this.environmentService.remoteAuthority;
                const addressProvider = authority ? {
                    getAddress: async () => { return (await this.remoteAuthorityResolverService.resolveAuthority(authority)).authority; }
                } : undefined;
                const key = makeAddress(tunnelProperties.remote.host, tunnelProperties.remote.port);
                this.inProgress.set(key, true);
                const tunnel = await this.tunnelService.openTunnel(addressProvider, tunnelProperties.remote.host, tunnelProperties.remote.port, localPort, (!tunnelProperties.elevateIfNeeded) ? attributes === null || attributes === void 0 ? void 0 : attributes.elevateIfNeeded : tunnelProperties.elevateIfNeeded, tunnelProperties.privacy, attributes === null || attributes === void 0 ? void 0 : attributes.protocol);
                if (tunnel && tunnel.localAddress) {
                    const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces((_b = this._candidates) !== null && _b !== void 0 ? _b : new Map(), tunnelProperties.remote.host, tunnelProperties.remote.port);
                    const protocol = (tunnel.protocol ?
                        ((tunnel.protocol === tunnel_1.TunnelProtocol.Https) ? tunnel_1.TunnelProtocol.Https : tunnel_1.TunnelProtocol.Http)
                        : ((_c = attributes === null || attributes === void 0 ? void 0 : attributes.protocol) !== null && _c !== void 0 ? _c : tunnel_1.TunnelProtocol.Http));
                    const newForward = {
                        remoteHost: tunnel.tunnelRemoteHost,
                        remotePort: tunnel.tunnelRemotePort,
                        localPort: tunnel.tunnelLocalPort,
                        name: (_d = attributes === null || attributes === void 0 ? void 0 : attributes.label) !== null && _d !== void 0 ? _d : tunnelProperties.name,
                        closeable: true,
                        localAddress: tunnel.localAddress,
                        protocol,
                        localUri: await this.makeLocalUri(tunnel.localAddress, attributes),
                        runningProcess: matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.detail,
                        hasRunningProcess: !!matchingCandidate,
                        pid: matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.pid,
                        source: (_e = tunnelProperties.source) !== null && _e !== void 0 ? _e : exports.UserTunnelSource,
                        privacy: tunnel.privacy,
                    };
                    this.forwarded.set(key, newForward);
                    this.remoteTunnels.set(key, tunnel);
                    this.inProgress.delete(key);
                    await this.storeForwarded();
                    await this.showPortMismatchModalIfNeeded(tunnel, localPort, attributes);
                    this._onForwardPort.fire(newForward);
                    return tunnel;
                }
            }
            else {
                const newName = (_f = attributes === null || attributes === void 0 ? void 0 : attributes.label) !== null && _f !== void 0 ? _f : tunnelProperties.name;
                if (newName !== existingTunnel.name) {
                    existingTunnel.name = newName;
                    this._onForwardPort.fire();
                }
                if (((attributes === null || attributes === void 0 ? void 0 : attributes.protocol) || (existingTunnel.protocol !== tunnel_1.TunnelProtocol.Http)) && ((attributes === null || attributes === void 0 ? void 0 : attributes.protocol) !== existingTunnel.protocol)) {
                    await this.close(existingTunnel.remoteHost, existingTunnel.remotePort);
                    tunnelProperties.source = existingTunnel.source;
                    await this.forward(tunnelProperties, attributes);
                }
                return mapHasAddressLocalhostOrAllInterfaces(this.remoteTunnels, tunnelProperties.remote.host, tunnelProperties.remote.port);
            }
        }
        async name(host, port, name) {
            const existingForwarded = mapHasAddressLocalhostOrAllInterfaces(this.forwarded, host, port);
            const key = makeAddress(host, port);
            if (existingForwarded) {
                existingForwarded.name = name;
                await this.storeForwarded();
                this._onPortName.fire({ host, port });
                return;
            }
            else if (this.detected.has(key)) {
                this.detected.get(key).name = name;
                this._onPortName.fire({ host, port });
            }
        }
        async close(host, port) {
            await this.tunnelService.closeTunnel(host, port);
            return this.onTunnelClosed({ host, port });
        }
        address(host, port) {
            var _a;
            const key = makeAddress(host, port);
            return (_a = (this.forwarded.get(key) || this.detected.get(key))) === null || _a === void 0 ? void 0 : _a.localAddress;
        }
        get environmentTunnelsSet() {
            return this._environmentTunnelsSet;
        }
        addEnvironmentTunnels(tunnels) {
            var _a;
            if (tunnels) {
                for (const tunnel of tunnels) {
                    const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces((_a = this._candidates) !== null && _a !== void 0 ? _a : new Map(), tunnel.remoteAddress.host, tunnel.remoteAddress.port);
                    const localAddress = typeof tunnel.localAddress === 'string' ? tunnel.localAddress : makeAddress(tunnel.localAddress.host, tunnel.localAddress.port);
                    this.detected.set(makeAddress(tunnel.remoteAddress.host, tunnel.remoteAddress.port), {
                        remoteHost: tunnel.remoteAddress.host,
                        remotePort: tunnel.remoteAddress.port,
                        localAddress: localAddress,
                        protocol: tunnel_1.TunnelProtocol.Http,
                        localUri: this.makeLocalUri(localAddress),
                        closeable: false,
                        runningProcess: matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.detail,
                        hasRunningProcess: !!matchingCandidate,
                        pid: matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.pid,
                        privacy: tunnel_1.TunnelPrivacyId.ConstantPrivate,
                        source: {
                            source: TunnelSource.Extension,
                            description: nls.localize('tunnel.staticallyForwarded', "Statically Forwarded")
                        }
                    });
                }
            }
            this._environmentTunnelsSet = true;
            this._onEnvironmentTunnelsSet.fire();
            this._onForwardPort.fire();
        }
        setCandidateFilter(filter) {
            this._candidateFilter = filter;
        }
        async setCandidates(candidates) {
            let processedCandidates = candidates;
            if (this._candidateFilter) {
                // When an extension provides a filter, we do the filtering on the extension host before the candidates are set here.
                // However, when the filter doesn't come from an extension we filter here.
                processedCandidates = await this._candidateFilter(candidates);
            }
            const removedCandidates = this.updateInResponseToCandidates(processedCandidates);
            this.logService.trace(`ForwardedPorts: (TunnelModel) removed candidates ${Array.from(removedCandidates.values()).map(candidate => candidate.port).join(', ')}`);
            this._onCandidatesChanged.fire(removedCandidates);
        }
        // Returns removed candidates
        updateInResponseToCandidates(candidates) {
            var _a;
            const removedCandidates = (_a = this._candidates) !== null && _a !== void 0 ? _a : new Map();
            const candidatesMap = new Map();
            this._candidates = candidatesMap;
            candidates.forEach(value => {
                const addressKey = makeAddress(value.host, value.port);
                candidatesMap.set(addressKey, {
                    host: value.host,
                    port: value.port,
                    detail: value.detail,
                    pid: value.pid
                });
                if (removedCandidates.has(addressKey)) {
                    removedCandidates.delete(addressKey);
                }
                const forwardedValue = mapHasAddressLocalhostOrAllInterfaces(this.forwarded, value.host, value.port);
                if (forwardedValue) {
                    forwardedValue.runningProcess = value.detail;
                    forwardedValue.hasRunningProcess = true;
                    forwardedValue.pid = value.pid;
                }
            });
            removedCandidates.forEach((_value, key) => {
                const parsedAddress = parseAddress(key);
                if (!parsedAddress) {
                    return;
                }
                const forwardedValue = mapHasAddressLocalhostOrAllInterfaces(this.forwarded, parsedAddress.host, parsedAddress.port);
                if (forwardedValue) {
                    forwardedValue.runningProcess = undefined;
                    forwardedValue.hasRunningProcess = false;
                    forwardedValue.pid = undefined;
                }
                const detectedValue = mapHasAddressLocalhostOrAllInterfaces(this.detected, parsedAddress.host, parsedAddress.port);
                if (detectedValue) {
                    detectedValue.runningProcess = undefined;
                    detectedValue.hasRunningProcess = false;
                    detectedValue.pid = undefined;
                }
            });
            return removedCandidates;
        }
        get candidates() {
            return this._candidates ? Array.from(this._candidates.values()) : [];
        }
        get candidatesOrUndefined() {
            return this._candidates ? this.candidates : undefined;
        }
        async updateAttributes() {
            // If the label changes in the attributes, we should update it.
            const tunnels = Array.from(this.forwarded.values());
            const allAttributes = await this.getAttributes(tunnels.map(tunnel => {
                return { port: tunnel.remotePort, host: tunnel.remoteHost };
            }), false);
            if (!allAttributes) {
                return;
            }
            for (const forwarded of tunnels) {
                const attributes = allAttributes.get(forwarded.remotePort);
                if (((attributes === null || attributes === void 0 ? void 0 : attributes.protocol) || (forwarded.protocol !== tunnel_1.TunnelProtocol.Http)) && ((attributes === null || attributes === void 0 ? void 0 : attributes.protocol) !== forwarded.protocol)) {
                    await this.forward({
                        remote: { host: forwarded.remoteHost, port: forwarded.remotePort },
                        local: forwarded.localPort,
                        name: forwarded.name,
                        source: forwarded.source
                    }, attributes);
                }
                if (!attributes) {
                    continue;
                }
                if (attributes.label && attributes.label !== forwarded.name) {
                    await this.name(forwarded.remoteHost, forwarded.remotePort, attributes.label);
                }
            }
        }
        async getAttributes(forwardedPorts, checkProviders = true) {
            const matchingCandidates = new Map();
            const pidToPortsMapping = new Map();
            forwardedPorts.forEach(forwardedPort => {
                var _a, _b;
                const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces((_a = this._candidates) !== null && _a !== void 0 ? _a : new Map(), tunnel_1.LOCALHOST_ADDRESSES[0], forwardedPort.port);
                if (matchingCandidate) {
                    matchingCandidates.set(forwardedPort.port, matchingCandidate);
                    if (!pidToPortsMapping.has(matchingCandidate.pid)) {
                        pidToPortsMapping.set(matchingCandidate.pid, []);
                    }
                    (_b = pidToPortsMapping.get(matchingCandidate.pid)) === null || _b === void 0 ? void 0 : _b.push(forwardedPort.port);
                }
            });
            const configAttributes = new Map();
            forwardedPorts.forEach(forwardedPort => {
                var _a;
                const attributes = this.configPortsAttributes.getAttributes(forwardedPort.port, forwardedPort.host, (_a = matchingCandidates.get(forwardedPort.port)) === null || _a === void 0 ? void 0 : _a.detail);
                if (attributes) {
                    configAttributes.set(forwardedPort.port, attributes);
                }
            });
            if ((this.portAttributesProviders.length === 0) || !checkProviders) {
                return (configAttributes.size > 0) ? configAttributes : undefined;
            }
            // Group calls to provide attributes by pid.
            const allProviderResults = await Promise.all((0, arrays_1.flatten)(this.portAttributesProviders.map(provider => {
                return Array.from(pidToPortsMapping.entries()).map(entry => {
                    const portGroup = entry[1];
                    const matchingCandidate = matchingCandidates.get(portGroup[0]);
                    return provider.providePortAttributes(portGroup, matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.pid, matchingCandidate === null || matchingCandidate === void 0 ? void 0 : matchingCandidate.detail, new cancellation_1.CancellationTokenSource().token);
                });
            })));
            const providedAttributes = new Map();
            allProviderResults.forEach(attributes => attributes.forEach(attribute => {
                if (attribute) {
                    providedAttributes.set(attribute.port, attribute);
                }
            }));
            if (!configAttributes && !providedAttributes) {
                return undefined;
            }
            // Merge. The config wins.
            const mergedAttributes = new Map();
            forwardedPorts.forEach(forwardedPorts => {
                var _a;
                const config = configAttributes.get(forwardedPorts.port);
                const provider = providedAttributes.get(forwardedPorts.port);
                mergedAttributes.set(forwardedPorts.port, {
                    elevateIfNeeded: config === null || config === void 0 ? void 0 : config.elevateIfNeeded,
                    label: config === null || config === void 0 ? void 0 : config.label,
                    onAutoForward: (_a = config === null || config === void 0 ? void 0 : config.onAutoForward) !== null && _a !== void 0 ? _a : PortsAttributes.providedActionToAction(provider === null || provider === void 0 ? void 0 : provider.autoForwardAction),
                    requireLocalPort: config === null || config === void 0 ? void 0 : config.requireLocalPort,
                    protocol: config === null || config === void 0 ? void 0 : config.protocol
                });
            });
            return mergedAttributes;
        }
        addAttributesProvider(provider) {
            this.portAttributesProviders.push(provider);
        }
    };
    TunnelModel = __decorate([
        __param(0, tunnel_1.ITunnelService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, log_1.ILogService),
        __param(7, dialogs_1.IDialogService)
    ], TunnelModel);
    exports.TunnelModel = TunnelModel;
    let RemoteExplorerService = class RemoteExplorerService {
        constructor(storageService, tunnelService, configurationService, environmentService, remoteAuthorityResolverService, workspaceContextService, logService, dialogService) {
            this.storageService = storageService;
            this.tunnelService = tunnelService;
            this._targetType = [];
            this._onDidChangeTargetType = new event_1.Emitter();
            this.onDidChangeTargetType = this._onDidChangeTargetType.event;
            this._onDidChangeEditable = new event_1.Emitter();
            this.onDidChangeEditable = this._onDidChangeEditable.event;
            this._onEnabledPortsFeatures = new event_1.Emitter();
            this.onEnabledPortsFeatures = this._onEnabledPortsFeatures.event;
            this._portsFeaturesEnabled = false;
            this.namedProcesses = new Map();
            this._tunnelModel = new TunnelModel(tunnelService, storageService, configurationService, environmentService, remoteAuthorityResolverService, workspaceContextService, logService, dialogService);
        }
        set targetType(name) {
            // Can just compare the first element of the array since there are no target overlaps
            const current = this._targetType.length > 0 ? this._targetType[0] : '';
            const newName = name.length > 0 ? name[0] : '';
            if (current !== newName) {
                this._targetType = name;
                this.storageService.store(exports.REMOTE_EXPLORER_TYPE_KEY, this._targetType.toString(), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
                this.storageService.store(exports.REMOTE_EXPLORER_TYPE_KEY, this._targetType.toString(), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                this._onDidChangeTargetType.fire(this._targetType);
            }
        }
        get targetType() {
            return this._targetType;
        }
        get tunnelModel() {
            return this._tunnelModel;
        }
        forward(tunnelProperties, attributes) {
            return this.tunnelModel.forward(tunnelProperties, attributes);
        }
        close(remote) {
            return this.tunnelModel.close(remote.host, remote.port);
        }
        setTunnelInformation(tunnelInformation) {
            if (tunnelInformation === null || tunnelInformation === void 0 ? void 0 : tunnelInformation.features) {
                this.tunnelService.setTunnelFeatures(tunnelInformation.features);
            }
            this.tunnelModel.addEnvironmentTunnels(tunnelInformation === null || tunnelInformation === void 0 ? void 0 : tunnelInformation.environmentTunnels);
        }
        setEditable(tunnelItem, editId, data) {
            if (!data) {
                this._editable = undefined;
            }
            else {
                this._editable = { tunnelItem, data, editId };
            }
            this._onDidChangeEditable.fire(tunnelItem ? { tunnel: tunnelItem, editId } : undefined);
        }
        getEditableData(tunnelItem, editId) {
            var _a;
            return (this._editable &&
                ((!tunnelItem && (tunnelItem === this._editable.tunnelItem)) ||
                    (tunnelItem && (((_a = this._editable.tunnelItem) === null || _a === void 0 ? void 0 : _a.remotePort) === tunnelItem.remotePort) && (this._editable.tunnelItem.remoteHost === tunnelItem.remoteHost)
                        && (this._editable.editId === editId)))) ?
                this._editable.data : undefined;
        }
        setCandidateFilter(filter) {
            if (!filter) {
                return {
                    dispose: () => { }
                };
            }
            this.tunnelModel.setCandidateFilter(filter);
            return {
                dispose: () => {
                    this.tunnelModel.setCandidateFilter(undefined);
                }
            };
        }
        onFoundNewCandidates(candidates) {
            this.tunnelModel.setCandidates(candidates);
        }
        restore() {
            return this.tunnelModel.restoreForwarded();
        }
        enablePortsFeatures() {
            this._portsFeaturesEnabled = true;
            this._onEnabledPortsFeatures.fire();
        }
        get portsFeaturesEnabled() {
            return this._portsFeaturesEnabled;
        }
    };
    RemoteExplorerService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, tunnel_1.ITunnelService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, log_1.ILogService),
        __param(7, dialogs_1.IDialogService)
    ], RemoteExplorerService);
    (0, extensions_1.registerSingleton)(exports.IRemoteExplorerService, RemoteExplorerService, true);
});
//# sourceMappingURL=remoteExplorerService.js.map