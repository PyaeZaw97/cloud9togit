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
define(["require", "exports", "vs/base/browser/hash", "vs/base/common/errors", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/contrib/tags/common/workspaceTags", "vs/platform/diagnostics/common/diagnostics", "vs/platform/request/common/request", "vs/base/common/platform", "vs/platform/extensionManagement/common/configRemotes", "vs/platform/native/electron-sandbox/native", "vs/platform/product/common/productService"], function (require, exports, hash_1, errors_1, files_1, telemetry_1, workspace_1, textfiles_1, workspaceTags_1, diagnostics_1, request_1, platform_1, configRemotes_1, native_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTags = exports.getHashedRemotesFromConfig = void 0;
    async function getHashedRemotesFromConfig(text, stripEndingDotGit = false) {
        return Promise.all((0, configRemotes_1.getRemotes)(text, stripEndingDotGit).map(remote => (0, hash_1.sha1Hex)(remote)));
    }
    exports.getHashedRemotesFromConfig = getHashedRemotesFromConfig;
    let WorkspaceTags = class WorkspaceTags {
        constructor(fileService, contextService, telemetryService, requestService, textFileService, workspaceTagsService, diagnosticsService, productService, nativeHostService) {
            this.fileService = fileService;
            this.contextService = contextService;
            this.telemetryService = telemetryService;
            this.requestService = requestService;
            this.textFileService = textFileService;
            this.workspaceTagsService = workspaceTagsService;
            this.diagnosticsService = diagnosticsService;
            this.productService = productService;
            this.nativeHostService = nativeHostService;
            if (this.telemetryService.telemetryLevel.value === 3 /* TelemetryLevel.USAGE */) {
                this.report();
            }
        }
        async report() {
            // Windows-only Edition Event
            this.reportWindowsEdition();
            // Workspace Tags
            this.workspaceTagsService.getTags()
                .then(tags => this.reportWorkspaceTags(tags), error => (0, errors_1.onUnexpectedError)(error));
            // Cloud Stats
            this.reportCloudStats();
            this.reportProxyStats();
            this.getWorkspaceInformation().then(stats => this.diagnosticsService.reportWorkspaceStats(stats));
        }
        async reportWindowsEdition() {
            if (!platform_1.isWindows) {
                return;
            }
            let value = await this.nativeHostService.windowsGetStringRegKey('HKEY_LOCAL_MACHINE', 'SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion', 'EditionID');
            if (value === undefined) {
                value = 'Unknown';
            }
            this.telemetryService.publicLog2('windowsEdition', { edition: value });
        }
        async getWorkspaceInformation() {
            const workspace = this.contextService.getWorkspace();
            const state = this.contextService.getWorkbenchState();
            const telemetryId = await this.workspaceTagsService.getTelemetryWorkspaceId(workspace, state);
            return this.telemetryService.getTelemetryInfo().then(info => {
                return {
                    id: workspace.id,
                    telemetryId,
                    rendererSessionId: info.sessionId,
                    folders: workspace.folders,
                    transient: workspace.transient,
                    configuration: workspace.configuration
                };
            });
        }
        reportWorkspaceTags(tags) {
            /* __GDPR__
                "workspce.tags" : {
                    "${include}": [
                        "${WorkspaceTags}"
                    ]
                }
            */
            this.telemetryService.publicLog('workspce.tags', tags);
        }
        reportRemoteDomains(workspaceUris) {
            Promise.all(workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/.git/config` });
                return this.fileService.exists(uri).then(exists => {
                    if (!exists) {
                        return [];
                    }
                    return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => (0, configRemotes_1.getDomainsOfRemotes)(content.value, configRemotes_1.AllowedSecondLevelDomains), err => [] // ignore missing or binary file
                    );
                });
            })).then(domains => {
                const set = domains.reduce((set, list) => list.reduce((set, item) => set.add(item), set), new Set());
                const list = [];
                set.forEach(item => list.push(item));
                /* __GDPR__
                    "workspace.remotes" : {
                        "domains" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog('workspace.remotes', { domains: list.sort() });
            }, errors_1.onUnexpectedError);
        }
        reportRemotes(workspaceUris) {
            Promise.all(workspaceUris.map(workspaceUri => {
                return this.workspaceTagsService.getHashedRemotesFromUri(workspaceUri, true);
            })).then(() => { }, errors_1.onUnexpectedError);
        }
        /* __GDPR__FRAGMENT__
            "AzureTags" : {
                "node" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        reportAzureNode(workspaceUris, tags) {
            // TODO: should also work for `node_modules` folders several levels down
            const uris = workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                return workspaceUri.with({ path: `${path !== '/' ? path : ''}/node_modules` });
            });
            return this.fileService.resolveAll(uris.map(resource => ({ resource }))).then(results => {
                const names = [].concat(...results.map(result => result.success ? (result.stat.children || []) : [])).map(c => c.name);
                const referencesAzure = WorkspaceTags.searchArray(names, /azure/i);
                if (referencesAzure) {
                    tags['node'] = true;
                }
                return tags;
            }, err => {
                return tags;
            });
        }
        static searchArray(arr, regEx) {
            return arr.some(v => v.search(regEx) > -1) || undefined;
        }
        /* __GDPR__FRAGMENT__
            "AzureTags" : {
                "java" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            }
        */
        reportAzureJava(workspaceUris, tags) {
            return Promise.all(workspaceUris.map(workspaceUri => {
                const path = workspaceUri.path;
                const uri = workspaceUri.with({ path: `${path !== '/' ? path : ''}/pom.xml` });
                return this.fileService.exists(uri).then(exists => {
                    if (!exists) {
                        return false;
                    }
                    return this.textFileService.read(uri, { acceptTextOnly: true }).then(content => !!content.value.match(/azure/i), err => false);
                });
            })).then(javas => {
                if (javas.indexOf(true) !== -1) {
                    tags['java'] = true;
                }
                return tags;
            });
        }
        reportAzure(uris) {
            const tags = Object.create(null);
            this.reportAzureNode(uris, tags).then((tags) => {
                return this.reportAzureJava(uris, tags);
            }).then((tags) => {
                if (Object.keys(tags).length) {
                    /* __GDPR__
                        "workspace.azure" : {
                            "${include}": [
                                "${AzureTags}"
                            ]
                        }
                    */
                    this.telemetryService.publicLog('workspace.azure', tags);
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
        reportCloudStats() {
            const uris = this.contextService.getWorkspace().folders.map(folder => folder.uri);
            if (uris.length && this.fileService) {
                this.reportRemoteDomains(uris);
                this.reportRemotes(uris);
                this.reportAzure(uris);
            }
        }
        reportProxyStats() {
            const downloadUrl = this.productService.downloadUrl;
            if (!downloadUrl) {
                return;
            }
            this.requestService.resolveProxy(downloadUrl)
                .then(proxy => {
                let type = proxy ? String(proxy).trim().split(/\s+/, 1)[0] : 'EMPTY';
                if (['DIRECT', 'PROXY', 'HTTPS', 'SOCKS', 'EMPTY'].indexOf(type) === -1) {
                    type = 'UNKNOWN';
                }
            }).then(undefined, errors_1.onUnexpectedError);
        }
    };
    WorkspaceTags = __decorate([
        __param(0, files_1.IFileService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, request_1.IRequestService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, workspaceTags_1.IWorkspaceTagsService),
        __param(6, diagnostics_1.IDiagnosticsService),
        __param(7, productService_1.IProductService),
        __param(8, native_1.INativeHostService)
    ], WorkspaceTags);
    exports.WorkspaceTags = WorkspaceTags;
});
//# sourceMappingURL=workspaceTags.js.map