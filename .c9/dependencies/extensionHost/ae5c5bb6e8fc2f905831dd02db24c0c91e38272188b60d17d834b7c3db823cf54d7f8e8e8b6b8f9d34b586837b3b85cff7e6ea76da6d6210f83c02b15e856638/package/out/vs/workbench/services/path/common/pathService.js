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
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, extpath_1, network_1, path_1, platform_1, resources_1, uri_1, instantiation_1, virtualWorkspace_1, workspace_1, environmentService_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractPathService = exports.IPathService = void 0;
    exports.IPathService = (0, instantiation_1.createDecorator)('pathService');
    let AbstractPathService = class AbstractPathService {
        constructor(localUserHome, remoteAgentService, environmentService, contextService) {
            this.localUserHome = localUserHome;
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            // OS
            this.resolveOS = (async () => {
                const env = await this.remoteAgentService.getEnvironment();
                return (env === null || env === void 0 ? void 0 : env.os) || platform_1.OS;
            })();
            // User Home
            this.resolveUserHome = (async () => {
                const env = await this.remoteAgentService.getEnvironment();
                const userHome = this.maybeUnresolvedUserHome = (env === null || env === void 0 ? void 0 : env.userHome) || localUserHome;
                return userHome;
            })();
        }
        hasValidBasename(resource, arg2, basename) {
            // async version
            if (typeof arg2 === 'string' || typeof arg2 === 'undefined') {
                return this.resolveOS.then(os => this.doHasValidBasename(resource, os, arg2));
            }
            // sync version
            return this.doHasValidBasename(resource, arg2, basename);
        }
        doHasValidBasename(resource, os, name) {
            // Our `isValidBasename` method only works with our
            // standard schemes for files on disk, either locally
            // or remote.
            if (resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.vscodeRemote) {
                return (0, extpath_1.isValidBasename)(name !== null && name !== void 0 ? name : (0, resources_1.basename)(resource), os === 1 /* OperatingSystem.Windows */);
            }
            return true;
        }
        get defaultUriScheme() {
            return AbstractPathService.findDefaultUriScheme(this.environmentService, this.contextService);
        }
        static findDefaultUriScheme(environmentService, contextService) {
            if (environmentService.remoteAuthority) {
                return network_1.Schemas.vscodeRemote;
            }
            const virtualWorkspace = (0, virtualWorkspace_1.getVirtualWorkspaceScheme)(contextService.getWorkspace());
            if (virtualWorkspace) {
                return virtualWorkspace;
            }
            const firstFolder = contextService.getWorkspace().folders[0];
            if (firstFolder) {
                return firstFolder.uri.scheme;
            }
            const configuration = contextService.getWorkspace().configuration;
            if (configuration) {
                return configuration.scheme;
            }
            return network_1.Schemas.file;
        }
        async userHome(options) {
            return (options === null || options === void 0 ? void 0 : options.preferLocal) ? this.localUserHome : this.resolveUserHome;
        }
        get resolvedUserHome() {
            return this.maybeUnresolvedUserHome;
        }
        get path() {
            return this.resolveOS.then(os => {
                return os === 1 /* OperatingSystem.Windows */ ?
                    path_1.win32 :
                    path_1.posix;
            });
        }
        async fileURI(_path) {
            let authority = '';
            // normalize to fwd-slashes on windows,
            // on other systems bwd-slashes are valid
            // filename character, eg /f\oo/ba\r.txt
            const os = await this.resolveOS;
            if (os === 1 /* OperatingSystem.Windows */) {
                _path = _path.replace(/\\/g, '/');
            }
            // check for authority as used in UNC shares
            // or use the path as given
            if (_path[0] === '/' && _path[1] === '/') {
                const idx = _path.indexOf('/', 2);
                if (idx === -1) {
                    authority = _path.substring(2);
                    _path = '/';
                }
                else {
                    authority = _path.substring(2, idx);
                    _path = _path.substring(idx) || '/';
                }
            }
            return uri_1.URI.from({
                scheme: network_1.Schemas.file,
                authority,
                path: _path,
                query: '',
                fragment: ''
            });
        }
    };
    AbstractPathService = __decorate([
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], AbstractPathService);
    exports.AbstractPathService = AbstractPathService;
});
//# sourceMappingURL=pathService.js.map