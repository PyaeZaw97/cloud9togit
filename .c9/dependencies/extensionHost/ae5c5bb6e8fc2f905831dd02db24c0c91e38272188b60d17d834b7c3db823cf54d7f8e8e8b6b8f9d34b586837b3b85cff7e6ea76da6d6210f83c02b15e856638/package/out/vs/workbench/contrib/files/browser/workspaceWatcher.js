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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/workspace/common/workspace", "vs/base/common/map", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/base/common/path", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/host/browser/host", "vs/workbench/services/files/common/files"], function (require, exports, nls_1, lifecycle_1, uri_1, configuration_1, workspace_1, map_1, notification_1, opener_1, path_1, uriIdentity_1, host_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceWatcher = void 0;
    let WorkspaceWatcher = class WorkspaceWatcher extends lifecycle_1.Disposable {
        constructor(fileService, configurationService, contextService, notificationService, openerService, uriIdentityService, hostService) {
            super();
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.uriIdentityService = uriIdentityService;
            this.hostService = hostService;
            this.watchedWorkspaces = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.registerListeners();
            this.refresh();
        }
        registerListeners() {
            this._register(this.contextService.onDidChangeWorkspaceFolders(e => this.onDidChangeWorkspaceFolders(e)));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.onDidChangeWorkbenchState()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onDidChangeConfiguration(e)));
            this._register(this.fileService.onDidWatchError(error => this.onDidWatchError(error)));
        }
        onDidChangeWorkspaceFolders(e) {
            // Removed workspace: Unwatch
            for (const removed of e.removed) {
                this.unwatchWorkspace(removed);
            }
            // Added workspace: Watch
            for (const added of e.added) {
                this.watchWorkspace(added);
            }
        }
        onDidChangeWorkbenchState() {
            this.refresh();
        }
        onDidChangeConfiguration(e) {
            if (e.affectsConfiguration('files.watcherExclude') || e.affectsConfiguration('files.watcherInclude')) {
                this.refresh();
            }
        }
        onDidWatchError(error) {
            const msg = error.toString();
            // Detect if we run into ENOSPC issues
            if (msg.indexOf('ENOSPC') >= 0) {
                this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('enospcError', "Unable to watch for file changes in this large workspace folder. Please follow the instructions link to resolve this issue."), [{
                        label: (0, nls_1.localize)('learnMore', "Instructions"),
                        run: () => this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=867693'))
                    }], {
                    sticky: true,
                    neverShowAgain: { id: 'ignoreEnospcError', isSecondary: true, scope: notification_1.NeverShowAgainScope.WORKSPACE }
                });
            }
            // Detect when the watcher throws an error unexpectedly
            else if (msg.indexOf('EUNKNOWN') >= 0) {
                this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('eshutdownError', "File changes watcher stopped unexpectedly. A reload of the window may enable the watcher again unless the workspace cannot be watched for file changes."), [{
                        label: (0, nls_1.localize)('reload', "Reload"),
                        run: () => this.hostService.reload()
                    }], {
                    sticky: true,
                    silent: true // reduce potential spam since we don't really know how often this fires
                });
            }
        }
        watchWorkspace(workspace) {
            var _a, _b;
            // Compute the watcher exclude rules from configuration
            const excludes = [];
            const config = this.configurationService.getValue({ resource: workspace.uri });
            if ((_a = config.files) === null || _a === void 0 ? void 0 : _a.watcherExclude) {
                for (const key in config.files.watcherExclude) {
                    if (config.files.watcherExclude[key] === true) {
                        excludes.push(key);
                    }
                }
            }
            const pathsToWatch = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            // Add the workspace as path to watch
            pathsToWatch.set(workspace.uri, workspace.uri);
            // Compute additional includes from configuration
            if ((_b = config.files) === null || _b === void 0 ? void 0 : _b.watcherInclude) {
                for (const includePath of config.files.watcherInclude) {
                    if (!includePath) {
                        continue;
                    }
                    // Absolute: verify a child of the workspace
                    if ((0, path_1.isAbsolute)(includePath)) {
                        const candidate = uri_1.URI.file(includePath).with({ scheme: workspace.uri.scheme });
                        if (this.uriIdentityService.extUri.isEqualOrParent(candidate, workspace.uri)) {
                            pathsToWatch.set(candidate, candidate);
                        }
                    }
                    // Relative: join against workspace folder
                    else {
                        const candidate = workspace.toResource(includePath);
                        pathsToWatch.set(candidate, candidate);
                    }
                }
            }
            // Watch all paths as instructed
            const disposables = new lifecycle_1.DisposableStore();
            for (const [, pathToWatch] of pathsToWatch) {
                disposables.add(this.fileService.watch(pathToWatch, { recursive: true, excludes }));
            }
            this.watchedWorkspaces.set(workspace.uri, disposables);
        }
        unwatchWorkspace(workspace) {
            if (this.watchedWorkspaces.has(workspace.uri)) {
                (0, lifecycle_1.dispose)(this.watchedWorkspaces.get(workspace.uri));
                this.watchedWorkspaces.delete(workspace.uri);
            }
        }
        refresh() {
            // Unwatch all first
            this.unwatchWorkspaces();
            // Watch each workspace folder
            for (const folder of this.contextService.getWorkspace().folders) {
                this.watchWorkspace(folder);
            }
        }
        unwatchWorkspaces() {
            for (const [, disposable] of this.watchedWorkspaces) {
                disposable.dispose();
            }
            this.watchedWorkspaces.clear();
        }
        dispose() {
            super.dispose();
            this.unwatchWorkspaces();
        }
    };
    WorkspaceWatcher = __decorate([
        __param(0, files_1.IWorkbenchFileService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, notification_1.INotificationService),
        __param(4, opener_1.IOpenerService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, host_1.IHostService)
    ], WorkspaceWatcher);
    exports.WorkspaceWatcher = WorkspaceWatcher;
});
//# sourceMappingURL=workspaceWatcher.js.map