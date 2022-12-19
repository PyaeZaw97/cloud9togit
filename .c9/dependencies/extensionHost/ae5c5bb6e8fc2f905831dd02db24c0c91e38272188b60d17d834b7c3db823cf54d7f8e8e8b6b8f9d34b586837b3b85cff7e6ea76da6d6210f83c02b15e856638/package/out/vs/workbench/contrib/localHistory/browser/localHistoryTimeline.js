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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/timeline/common/timeline", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/base/common/uri", "vs/workbench/services/path/common/pathService", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/files/common/files", "vs/workbench/contrib/localHistory/browser/localHistoryFileSystemProvider", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/editor", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/localHistory/browser/localHistoryCommands", "vs/base/common/htmlContent", "vs/workbench/contrib/localHistory/browser/localHistory", "vs/base/common/network", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/virtualWorkspace"], function (require, exports, nls_1, event_1, lifecycle_1, timeline_1, workingCopyHistory_1, uri_1, pathService_1, editorCommands_1, files_1, localHistoryFileSystemProvider_1, environmentService_1, editor_1, configuration_1, localHistoryCommands_1, htmlContent_1, localHistory_1, network_1, workspace_1, virtualWorkspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalHistoryTimeline = void 0;
    let LocalHistoryTimeline = class LocalHistoryTimeline extends lifecycle_1.Disposable {
        constructor(timelineService, workingCopyHistoryService, pathService, fileService, environmentService, configurationService, contextService) {
            super();
            this.timelineService = timelineService;
            this.workingCopyHistoryService = workingCopyHistoryService;
            this.pathService = pathService;
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.id = LocalHistoryTimeline.ID;
            this.label = (0, nls_1.localize)('localHistory', "Local History");
            this.scheme = '*'; // we try to show local history for all schemes if possible
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.timelineProviderDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.registerComponents();
            this.registerListeners();
        }
        registerComponents() {
            // Timeline (if enabled)
            this.updateTimelineRegistration();
            // File Service Provider
            this._register(this.fileService.registerProvider(localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA, new localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider(this.fileService)));
        }
        updateTimelineRegistration() {
            if (this.configurationService.getValue(LocalHistoryTimeline.LOCAL_HISTORY_ENABLED_SETTINGS_KEY)) {
                this.timelineProviderDisposable.value = this.timelineService.registerTimelineProvider(this);
            }
            else {
                this.timelineProviderDisposable.clear();
            }
        }
        registerListeners() {
            // History changes
            this._register(this.workingCopyHistoryService.onDidAddEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidChangeEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidReplaceEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidRemoveEntry(e => this.onDidChangeWorkingCopyHistoryEntry(e.entry)));
            this._register(this.workingCopyHistoryService.onDidRemoveEntries(() => this.onDidChangeWorkingCopyHistoryEntry(undefined /* all entries */)));
            this._register(this.workingCopyHistoryService.onDidMoveEntries(() => this.onDidChangeWorkingCopyHistoryEntry(undefined /* all entries */)));
            // Configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(LocalHistoryTimeline.LOCAL_HISTORY_ENABLED_SETTINGS_KEY)) {
                    this.updateTimelineRegistration();
                }
            }));
        }
        onDidChangeWorkingCopyHistoryEntry(entry) {
            // Re-emit as timeline change event
            this._onDidChange.fire({
                id: LocalHistoryTimeline.ID,
                uri: entry === null || entry === void 0 ? void 0 : entry.workingCopy.resource,
                reset: true // there is no other way to indicate that items might have been replaced/removed
            });
        }
        async provideTimeline(uri, options, token) {
            var _a;
            const items = [];
            // Try to convert the provided `uri` into a form that is likely
            // for the provider to find entries for so that we can ensure
            // the timeline is always providing local history entries
            let resource = undefined;
            if (uri.scheme === localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA) {
                // `vscode-local-history`: convert back to the associated resource
                resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(uri).associatedResource;
            }
            else if (uri.scheme === this.pathService.defaultUriScheme || uri.scheme === network_1.Schemas.vscodeUserData) {
                // default-scheme / settings: keep as is
                resource = uri;
            }
            else if (this.fileService.hasProvider(uri)) {
                // anything that is backed by a file system provider:
                // try best to convert the URI back into a form that is
                // likely to match the workspace URIs. That means:
                // - change to the default URI scheme
                // - change to the remote authority or virtual workspace authority
                // - preserve the path
                resource = uri_1.URI.from({
                    scheme: this.pathService.defaultUriScheme,
                    authority: (_a = this.environmentService.remoteAuthority) !== null && _a !== void 0 ? _a : (0, virtualWorkspace_1.getVirtualWorkspaceAuthority)(this.contextService.getWorkspace()),
                    path: uri.path
                });
            }
            if (resource) {
                // Retrieve from working copy history
                const entries = await this.workingCopyHistoryService.getEntries(resource, token);
                // Convert to timeline items
                for (const entry of entries) {
                    items.push(this.toTimelineItem(entry));
                }
            }
            return {
                source: LocalHistoryTimeline.ID,
                items
            };
        }
        toTimelineItem(entry) {
            return {
                handle: entry.id,
                label: editor_1.SaveSourceRegistry.getSourceLabel(entry.source),
                tooltip: new htmlContent_1.MarkdownString(`$(history) ${localHistory_1.LOCAL_HISTORY_DATE_FORMATTER.value.format(entry.timestamp)}\n\n${editor_1.SaveSourceRegistry.getSourceLabel(entry.source)}`, { supportThemeIcons: true }),
                source: LocalHistoryTimeline.ID,
                timestamp: entry.timestamp,
                themeIcon: localHistory_1.LOCAL_HISTORY_ICON_ENTRY,
                contextValue: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_VALUE,
                command: {
                    id: editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID,
                    title: localHistoryCommands_1.COMPARE_WITH_FILE_LABEL.value,
                    arguments: (0, localHistoryCommands_1.toDiffEditorArguments)(entry, entry.workingCopy.resource)
                }
            };
        }
    };
    LocalHistoryTimeline.ID = 'timeline.localHistory';
    LocalHistoryTimeline.LOCAL_HISTORY_ENABLED_SETTINGS_KEY = 'workbench.localHistory.enabled';
    LocalHistoryTimeline = __decorate([
        __param(0, timeline_1.ITimelineService),
        __param(1, workingCopyHistory_1.IWorkingCopyHistoryService),
        __param(2, pathService_1.IPathService),
        __param(3, files_1.IFileService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, workspace_1.IWorkspaceContextService)
    ], LocalHistoryTimeline);
    exports.LocalHistoryTimeline = LocalHistoryTimeline;
});
//# sourceMappingURL=localHistoryTimeline.js.map