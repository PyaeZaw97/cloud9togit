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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/scm/common/scm", "vs/workbench/services/activity/common/activity", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/iconLabels", "vs/base/common/network"], function (require, exports, nls_1, resources_1, lifecycle_1, event_1, scm_1, activity_1, contextkey_1, statusbar_1, editorService_1, configuration_1, editor_1, uriIdentity_1, iconLabels_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMActiveResourceContextKeyController = exports.SCMStatusController = void 0;
    function getCount(repository) {
        if (typeof repository.provider.count === 'number') {
            return repository.provider.count;
        }
        else {
            return repository.provider.groups.elements.reduce((r, g) => r + g.elements.length, 0);
        }
    }
    let SCMStatusController = class SCMStatusController {
        constructor(scmService, scmViewService, statusbarService, contextKeyService, activityService, editorService, configurationService, uriIdentityService) {
            this.scmService = scmService;
            this.scmViewService = scmViewService;
            this.statusbarService = statusbarService;
            this.contextKeyService = contextKeyService;
            this.activityService = activityService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.uriIdentityService = uriIdentityService;
            this.statusBarDisposable = lifecycle_1.Disposable.None;
            this.focusDisposable = lifecycle_1.Disposable.None;
            this.focusedRepository = undefined;
            this.badgeDisposable = new lifecycle_1.MutableDisposable();
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables = new Set();
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            this.scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
            const onDidChangeSCMCountBadge = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.countBadge'));
            onDidChangeSCMCountBadge(this.renderActivityCount, this, this.disposables);
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            this.scmViewService.onDidFocusRepository(this.focusRepository, this, this.disposables);
            this.focusRepository(this.scmViewService.focusedRepository);
            editorService.onDidActiveEditorChange(this.tryFocusRepositoryBasedOnActiveEditor, this, this.disposables);
            this.renderActivityCount();
        }
        tryFocusRepositoryBasedOnActiveEditor() {
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
            if (!resource) {
                return false;
            }
            let bestRepository = null;
            let bestMatchLength = Number.POSITIVE_INFINITY;
            for (const repository of this.scmService.repositories) {
                const root = repository.provider.rootUri;
                if (!root) {
                    continue;
                }
                const path = this.uriIdentityService.extUri.relativePath(root, resource);
                if (path && !/^\.\./.test(path) && path.length < bestMatchLength) {
                    bestRepository = repository;
                    bestMatchLength = path.length;
                }
            }
            if (!bestRepository) {
                return false;
            }
            this.focusRepository(bestRepository);
            return true;
        }
        onDidAddRepository(repository) {
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            const changeDisposable = onDidChange(() => this.renderActivityCount());
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.repositoryDisposables.delete(disposable);
                this.renderActivityCount();
            });
            const disposable = (0, lifecycle_1.combinedDisposable)(changeDisposable, removeDisposable);
            this.repositoryDisposables.add(disposable);
        }
        onDidRemoveRepository(repository) {
            if (this.focusedRepository !== repository) {
                return;
            }
            this.focusRepository(this.scmService.repositories[0]);
        }
        focusRepository(repository) {
            if (this.focusedRepository === repository) {
                return;
            }
            this.focusDisposable.dispose();
            this.focusedRepository = repository;
            if (repository && repository.provider.onDidChangeStatusBarCommands) {
                this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(() => this.renderStatusBar(repository));
            }
            this.renderStatusBar(repository);
            this.renderActivityCount();
        }
        renderStatusBar(repository) {
            this.statusBarDisposable.dispose();
            if (!repository) {
                return;
            }
            const commands = repository.provider.statusBarCommands || [];
            const label = repository.provider.rootUri
                ? `${(0, resources_1.basename)(repository.provider.rootUri)} (${repository.provider.label})`
                : repository.provider.label;
            const disposables = new lifecycle_1.DisposableStore();
            for (const command of commands) {
                const tooltip = `${label}${command.tooltip ? ` - ${command.tooltip}` : ''}`;
                let ariaLabel = (0, iconLabels_1.stripIcons)(command.title).trim();
                ariaLabel = ariaLabel ? `${ariaLabel}, ${label}` : label;
                disposables.add(this.statusbarService.addEntry({
                    name: (0, nls_1.localize)('status.scm', "Source Control"),
                    text: command.title,
                    ariaLabel: `${ariaLabel}${command.tooltip ? ` - ${command.tooltip}` : ''}`,
                    tooltip,
                    command: command.id ? command : undefined
                }, 'status.scm', 0 /* MainThreadStatusBarAlignment.LEFT */, 10000));
            }
            this.statusBarDisposable = disposables;
        }
        renderActivityCount() {
            const countBadgeType = this.configurationService.getValue('scm.countBadge');
            let count = 0;
            if (countBadgeType === 'all') {
                count = this.scmService.repositories.reduce((r, repository) => r + getCount(repository), 0);
            }
            else if (countBadgeType === 'focused' && this.focusedRepository) {
                count = getCount(this.focusedRepository);
            }
            if (count > 0) {
                const badge = new activity_1.NumberBadge(count, num => (0, nls_1.localize)('scmPendingChangesBadge', '{0} pending changes', num));
                this.badgeDisposable.value = this.activityService.showViewActivity(scm_1.VIEW_PANE_ID, { badge, clazz: 'scm-viewlet-label' });
            }
            else {
                this.badgeDisposable.value = undefined;
            }
        }
        dispose() {
            this.focusDisposable.dispose();
            this.statusBarDisposable.dispose();
            this.badgeDisposable.dispose();
            this.disposables = (0, lifecycle_1.dispose)(this.disposables);
            (0, lifecycle_1.dispose)(this.repositoryDisposables.values());
            this.repositoryDisposables.clear();
        }
    };
    SCMStatusController = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, scm_1.ISCMViewService),
        __param(2, statusbar_1.IStatusbarService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, activity_1.IActivityService),
        __param(5, editorService_1.IEditorService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, uriIdentity_1.IUriIdentityService)
    ], SCMStatusController);
    exports.SCMStatusController = SCMStatusController;
    let SCMActiveResourceContextKeyController = class SCMActiveResourceContextKeyController {
        constructor(contextKeyService, editorService, scmService, uriIdentityService) {
            this.contextKeyService = contextKeyService;
            this.editorService = editorService;
            this.scmService = scmService;
            this.uriIdentityService = uriIdentityService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables = new Set();
            this.activeResourceHasChangesContextKey = contextKeyService.createKey('scmActiveResourceHasChanges', false);
            this.activeResourceRepositoryContextKey = contextKeyService.createKey('scmActiveResourceRepository', undefined);
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            editorService.onDidActiveEditorChange(this.updateContextKey, this, this.disposables);
        }
        onDidAddRepository(repository) {
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            const changeDisposable = onDidChange(() => this.updateContextKey());
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.repositoryDisposables.delete(disposable);
                this.updateContextKey();
            });
            const disposable = (0, lifecycle_1.combinedDisposable)(changeDisposable, removeDisposable);
            this.repositoryDisposables.add(disposable);
        }
        updateContextKey() {
            var _a;
            const activeResource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor);
            if ((activeResource === null || activeResource === void 0 ? void 0 : activeResource.scheme) === network_1.Schemas.file || (activeResource === null || activeResource === void 0 ? void 0 : activeResource.scheme) === network_1.Schemas.vscodeRemote) {
                const activeResourceRepository = this.scmService.repositories
                    .find(r => r.provider.rootUri &&
                    this.uriIdentityService.extUri.isEqualOrParent(activeResource, r.provider.rootUri));
                this.activeResourceRepositoryContextKey.set(activeResourceRepository);
                for (const resourceGroup of (_a = activeResourceRepository === null || activeResourceRepository === void 0 ? void 0 : activeResourceRepository.provider.groups.elements) !== null && _a !== void 0 ? _a : []) {
                    if (resourceGroup.elements
                        .some(scmResource => this.uriIdentityService.extUri.isEqual(activeResource, scmResource.sourceUri))) {
                        this.activeResourceHasChangesContextKey.set(true);
                        return;
                    }
                }
                this.activeResourceHasChangesContextKey.set(false);
            }
            else {
                this.activeResourceHasChangesContextKey.set(false);
                this.activeResourceRepositoryContextKey.set(undefined);
            }
        }
        dispose() {
            this.disposables = (0, lifecycle_1.dispose)(this.disposables);
            (0, lifecycle_1.dispose)(this.repositoryDisposables.values());
            this.repositoryDisposables.clear();
        }
    };
    SCMActiveResourceContextKeyController = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, editorService_1.IEditorService),
        __param(2, scm_1.ISCMService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], SCMActiveResourceContextKeyController);
    exports.SCMActiveResourceContextKeyController = SCMActiveResourceContextKeyController;
});
//# sourceMappingURL=activity.js.map