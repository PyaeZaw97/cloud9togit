/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/uri", "vs/base/common/uriIpc", "vs/platform/extensionManagement/common/extensionManagement"], function (require, exports, event_1, lifecycle_1, objects_1, uri_1, uriIpc_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionTipsChannel = exports.ExtensionManagementChannelClient = exports.ExtensionManagementChannel = void 0;
    function transformIncomingURI(uri, transformer) {
        return uri_1.URI.revive(transformer ? transformer.transformIncoming(uri) : uri);
    }
    function transformOutgoingURI(uri, transformer) {
        return transformer ? transformer.transformOutgoingURI(uri) : uri;
    }
    function transformIncomingExtension(extension, transformer) {
        transformer = transformer ? transformer : uriIpc_1.DefaultURITransformer;
        const manifest = extension.manifest;
        const transformed = (0, uriIpc_1.transformAndReviveIncomingURIs)(Object.assign(Object.assign({}, extension), { manifest: undefined }), transformer);
        return Object.assign(Object.assign({}, transformed), { manifest });
    }
    function transformOutgoingExtension(extension, transformer) {
        return transformer ? (0, objects_1.cloneAndChange)(extension, value => value instanceof uri_1.URI ? transformer.transformOutgoingURI(value) : undefined) : extension;
    }
    class ExtensionManagementChannel {
        constructor(service, getUriTransformer) {
            this.service = service;
            this.getUriTransformer = getUriTransformer;
            this.onInstallExtension = event_1.Event.buffer(service.onInstallExtension, true);
            this.onDidInstallExtensions = event_1.Event.buffer(service.onDidInstallExtensions, true);
            this.onUninstallExtension = event_1.Event.buffer(service.onUninstallExtension, true);
            this.onDidUninstallExtension = event_1.Event.buffer(service.onDidUninstallExtension, true);
        }
        listen(context, event) {
            const uriTransformer = this.getUriTransformer(context);
            switch (event) {
                case 'onInstallExtension': return this.onInstallExtension;
                case 'onDidInstallExtensions': return event_1.Event.map(this.onDidInstallExtensions, results => results.map(i => (Object.assign(Object.assign({}, i), { local: i.local ? transformOutgoingExtension(i.local, uriTransformer) : i.local }))));
                case 'onUninstallExtension': return this.onUninstallExtension;
                case 'onDidUninstallExtension': return this.onDidUninstallExtension;
            }
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            const uriTransformer = this.getUriTransformer(context);
            switch (command) {
                case 'zip': return this.service.zip(transformIncomingExtension(args[0], uriTransformer)).then(uri => transformOutgoingURI(uri, uriTransformer));
                case 'unzip': return this.service.unzip(transformIncomingURI(args[0], uriTransformer));
                case 'install': return this.service.install(transformIncomingURI(args[0], uriTransformer), args[1]);
                case 'getManifest': return this.service.getManifest(transformIncomingURI(args[0], uriTransformer));
                case 'getTargetPlatform': return this.service.getTargetPlatform();
                case 'canInstall': return this.service.canInstall(args[0]);
                case 'installFromGallery': return this.service.installFromGallery(args[0], args[1]);
                case 'uninstall': return this.service.uninstall(transformIncomingExtension(args[0], uriTransformer), args[1]);
                case 'reinstallFromGallery': return this.service.reinstallFromGallery(transformIncomingExtension(args[0], uriTransformer));
                case 'getInstalled': return this.service.getInstalled(args[0]).then(extensions => extensions.map(e => transformOutgoingExtension(e, uriTransformer)));
                case 'updateMetadata': return this.service.updateMetadata(transformIncomingExtension(args[0], uriTransformer), args[1]).then(e => transformOutgoingExtension(e, uriTransformer));
                case 'updateExtensionScope': return this.service.updateExtensionScope(transformIncomingExtension(args[0], uriTransformer), args[1]).then(e => transformOutgoingExtension(e, uriTransformer));
                case 'getExtensionsControlManifest': return this.service.getExtensionsControlManifest();
            }
            throw new Error('Invalid call');
        }
    }
    exports.ExtensionManagementChannel = ExtensionManagementChannel;
    class ExtensionManagementChannelClient extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this.channel = channel;
            this._onInstallExtension = this._register(new event_1.Emitter());
            this.onInstallExtension = this._onInstallExtension.event;
            this._onDidInstallExtensions = this._register(new event_1.Emitter());
            this.onDidInstallExtensions = this._onDidInstallExtensions.event;
            this._onUninstallExtension = this._register(new event_1.Emitter());
            this.onUninstallExtension = this._onUninstallExtension.event;
            this._onDidUninstallExtension = this._register(new event_1.Emitter());
            this.onDidUninstallExtension = this._onDidUninstallExtension.event;
            this._register(this.channel.listen('onInstallExtension')(e => this._onInstallExtension.fire({ identifier: e.identifier, source: this.isUriComponents(e.source) ? uri_1.URI.revive(e.source) : e.source })));
            this._register(this.channel.listen('onDidInstallExtensions')(results => this._onDidInstallExtensions.fire(results.map(e => (Object.assign(Object.assign({}, e), { local: e.local ? transformIncomingExtension(e.local, null) : e.local, source: this.isUriComponents(e.source) ? uri_1.URI.revive(e.source) : e.source }))))));
            this._register(this.channel.listen('onUninstallExtension')(e => this._onUninstallExtension.fire(e)));
            this._register(this.channel.listen('onDidUninstallExtension')(e => this._onDidUninstallExtension.fire(e)));
        }
        isUriComponents(thing) {
            if (!thing) {
                return false;
            }
            return typeof thing.path === 'string' &&
                typeof thing.scheme === 'string';
        }
        getTargetPlatform() {
            if (!this._targetPlatformPromise) {
                this._targetPlatformPromise = this.channel.call('getTargetPlatform');
            }
            return this._targetPlatformPromise;
        }
        async canInstall(extension) {
            const currentTargetPlatform = await this.getTargetPlatform();
            return extension.allTargetPlatforms.some(targetPlatform => (0, extensionManagement_1.isTargetPlatformCompatible)(targetPlatform, extension.allTargetPlatforms, currentTargetPlatform));
        }
        zip(extension) {
            return Promise.resolve(this.channel.call('zip', [extension]).then(result => uri_1.URI.revive(result)));
        }
        unzip(zipLocation) {
            return Promise.resolve(this.channel.call('unzip', [zipLocation]));
        }
        install(vsix, options) {
            return Promise.resolve(this.channel.call('install', [vsix, options])).then(local => transformIncomingExtension(local, null));
        }
        getManifest(vsix) {
            return Promise.resolve(this.channel.call('getManifest', [vsix]));
        }
        installFromGallery(extension, installOptions) {
            return Promise.resolve(this.channel.call('installFromGallery', [extension, installOptions])).then(local => transformIncomingExtension(local, null));
        }
        uninstall(extension, options) {
            return Promise.resolve(this.channel.call('uninstall', [extension, options]));
        }
        reinstallFromGallery(extension) {
            return Promise.resolve(this.channel.call('reinstallFromGallery', [extension]));
        }
        getInstalled(type = null) {
            return Promise.resolve(this.channel.call('getInstalled', [type]))
                .then(extensions => extensions.map(extension => transformIncomingExtension(extension, null)));
        }
        updateMetadata(local, metadata) {
            return Promise.resolve(this.channel.call('updateMetadata', [local, metadata]))
                .then(extension => transformIncomingExtension(extension, null));
        }
        updateExtensionScope(local, isMachineScoped) {
            return Promise.resolve(this.channel.call('updateExtensionScope', [local, isMachineScoped]))
                .then(extension => transformIncomingExtension(extension, null));
        }
        getExtensionsControlManifest() {
            return Promise.resolve(this.channel.call('getExtensionsControlManifest'));
        }
        registerParticipant() { throw new Error('Not Supported'); }
    }
    exports.ExtensionManagementChannelClient = ExtensionManagementChannelClient;
    class ExtensionTipsChannel {
        constructor(service) {
            this.service = service;
        }
        listen(context, event) {
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            switch (command) {
                case 'getConfigBasedTips': return this.service.getConfigBasedTips(uri_1.URI.revive(args[0]));
                case 'getImportantExecutableBasedTips': return this.service.getImportantExecutableBasedTips();
                case 'getOtherExecutableBasedTips': return this.service.getOtherExecutableBasedTips();
                case 'getAllWorkspacesTips': return this.service.getAllWorkspacesTips();
            }
            throw new Error('Invalid call');
        }
    }
    exports.ExtensionTipsChannel = ExtensionTipsChannel;
});
//# sourceMappingURL=extensionManagementIpc.js.map