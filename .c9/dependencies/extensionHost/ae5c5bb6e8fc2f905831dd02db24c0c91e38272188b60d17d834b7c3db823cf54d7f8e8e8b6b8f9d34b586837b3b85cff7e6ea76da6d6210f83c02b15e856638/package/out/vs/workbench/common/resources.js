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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/glob", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration"], function (require, exports, uri_1, objects_1, event_1, resources_1, lifecycle_1, glob_1, workspace_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceGlobMatcher = void 0;
    let ResourceGlobMatcher = class ResourceGlobMatcher extends lifecycle_1.Disposable {
        constructor(globFn, shouldUpdate, contextService, configurationService) {
            super();
            this.globFn = globFn;
            this.shouldUpdate = shouldUpdate;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this._onExpressionChange = this._register(new event_1.Emitter());
            this.onExpressionChange = this._onExpressionChange.event;
            this.mapRootToParsedExpression = new Map();
            this.mapRootToExpressionConfig = new Map();
            this.updateExcludes(false);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (this.shouldUpdate(e)) {
                    this.updateExcludes(true);
                }
            }));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => this.updateExcludes(true)));
        }
        updateExcludes(fromEvent) {
            let changed = false;
            // Add excludes per workspaces that got added
            this.contextService.getWorkspace().folders.forEach(folder => {
                const rootExcludes = this.globFn(folder.uri);
                if (!this.mapRootToExpressionConfig.has(folder.uri.toString()) || !(0, objects_1.equals)(this.mapRootToExpressionConfig.get(folder.uri.toString()), rootExcludes)) {
                    changed = true;
                    this.mapRootToParsedExpression.set(folder.uri.toString(), (0, glob_1.parse)(rootExcludes));
                    this.mapRootToExpressionConfig.set(folder.uri.toString(), (0, objects_1.deepClone)(rootExcludes));
                }
            });
            // Remove excludes per workspace no longer present
            this.mapRootToExpressionConfig.forEach((value, root) => {
                if (root === ResourceGlobMatcher.NO_ROOT) {
                    return; // always keep this one
                }
                if (root && !this.contextService.getWorkspaceFolder(uri_1.URI.parse(root))) {
                    this.mapRootToParsedExpression.delete(root);
                    this.mapRootToExpressionConfig.delete(root);
                    changed = true;
                }
            });
            // Always set for resources outside root as well
            const globalExcludes = this.globFn();
            if (!this.mapRootToExpressionConfig.has(ResourceGlobMatcher.NO_ROOT) || !(0, objects_1.equals)(this.mapRootToExpressionConfig.get(ResourceGlobMatcher.NO_ROOT), globalExcludes)) {
                changed = true;
                this.mapRootToParsedExpression.set(ResourceGlobMatcher.NO_ROOT, (0, glob_1.parse)(globalExcludes));
                this.mapRootToExpressionConfig.set(ResourceGlobMatcher.NO_ROOT, (0, objects_1.deepClone)(globalExcludes));
            }
            if (fromEvent && changed) {
                this._onExpressionChange.fire();
            }
        }
        matches(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            let expressionForRoot;
            if (folder && this.mapRootToParsedExpression.has(folder.uri.toString())) {
                expressionForRoot = this.mapRootToParsedExpression.get(folder.uri.toString());
            }
            else {
                expressionForRoot = this.mapRootToParsedExpression.get(ResourceGlobMatcher.NO_ROOT);
            }
            // If the resource if from a workspace, convert its absolute path to a relative
            // path so that glob patterns have a higher probability to match. For example
            // a glob pattern of "src/**" will not match on an absolute path "/folder/src/file.txt"
            // but can match on "src/file.txt"
            let resourcePathToMatch;
            if (folder) {
                resourcePathToMatch = (0, resources_1.relativePath)(folder.uri, resource); // always uses forward slashes
            }
            else {
                resourcePathToMatch = resource.fsPath; // TODO@isidor: support non-file URIs
            }
            return !!expressionForRoot && typeof resourcePathToMatch === 'string' && !!expressionForRoot(resourcePathToMatch);
        }
    };
    ResourceGlobMatcher.NO_ROOT = null;
    ResourceGlobMatcher = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configuration_1.IConfigurationService)
    ], ResourceGlobMatcher);
    exports.ResourceGlobMatcher = ResourceGlobMatcher;
});
//# sourceMappingURL=resources.js.map