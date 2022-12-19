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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/scm/common/scm", "vs/base/common/iterator", "vs/platform/storage/common/storage", "vs/base/common/decorators", "vs/platform/workspace/common/workspace", "vs/base/common/comparers", "vs/base/common/resources", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey"], function (require, exports, lifecycle_1, event_1, scm_1, iterator_1, storage_1, decorators_1, workspace_1, comparers_1, resources_1, arrays_1, configuration_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMViewService = exports.RepositoryContextKeys = void 0;
    function getProviderStorageKey(provider) {
        return `${provider.contextValue}:${provider.label}${provider.rootUri ? `:${provider.rootUri.toString()}` : ''}`;
    }
    function getRepositoryName(workspaceContextService, repository) {
        if (!repository.provider.rootUri) {
            return repository.provider.label;
        }
        const folder = workspaceContextService.getWorkspaceFolder(repository.provider.rootUri);
        return (folder === null || folder === void 0 ? void 0 : folder.uri.toString()) === repository.provider.rootUri.toString() ? folder.name : (0, resources_1.basename)(repository.provider.rootUri);
    }
    exports.RepositoryContextKeys = {
        RepositorySortKey: new contextkey_1.RawContextKey('scmRepositorySortKey', "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */),
    };
    let SCMViewService = class SCMViewService {
        constructor(scmService, contextKeyService, configurationService, storageService, workspaceContextService) {
            var _a, _b;
            this.configurationService = configurationService;
            this.workspaceContextService = workspaceContextService;
            this.didFinishLoading = false;
            this.didSelectRepository = false;
            this.disposables = new lifecycle_1.DisposableStore();
            this._repositories = [];
            this._onDidChangeRepositories = new event_1.Emitter();
            this.onDidChangeRepositories = this._onDidChangeRepositories.event;
            this._onDidSetVisibleRepositories = new event_1.Emitter();
            this.onDidChangeVisibleRepositories = event_1.Event.any(this._onDidSetVisibleRepositories.event, event_1.Event.debounce(this._onDidChangeRepositories.event, (last, e) => {
                if (!last) {
                    return e;
                }
                const added = new Set(last.added);
                const removed = new Set(last.removed);
                for (const repository of e.added) {
                    if (removed.has(repository)) {
                        removed.delete(repository);
                    }
                    else {
                        added.add(repository);
                    }
                }
                for (const repository of e.removed) {
                    if (added.has(repository)) {
                        added.delete(repository);
                    }
                    else {
                        removed.add(repository);
                    }
                }
                return { added, removed };
            }, 0));
            this._onDidFocusRepository = new event_1.Emitter();
            this.onDidFocusRepository = this._onDidFocusRepository.event;
            try {
                this.previousState = JSON.parse(storageService.get('scm:view:visibleRepositories', 1 /* StorageScope.WORKSPACE */, ''));
            }
            catch (_c) {
                // noop
            }
            this._repositoriesSortKey = (_b = (_a = this.previousState) === null || _a === void 0 ? void 0 : _a.sortKey) !== null && _b !== void 0 ? _b : this.getViewSortOrder();
            this._sortKeyContextKey = exports.RepositoryContextKeys.RepositorySortKey.bindTo(contextKeyService);
            this._sortKeyContextKey.set(this._repositoriesSortKey);
            scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
            for (const repository of scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            // storageService.onWillSaveState(this.onWillSaveState, this, this.disposables);
        }
        get repositories() {
            return this._repositories.map(r => r.repository);
        }
        get visibleRepositories() {
            // In order to match the legacy behaviour, when the repositories are sorted by discovery time,
            // the visible repositories are sorted by the selection index instead of the discovery time.
            if (this._repositoriesSortKey === "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */) {
                return this._repositories.filter(r => r.selectionIndex !== -1)
                    .sort((r1, r2) => r1.selectionIndex - r2.selectionIndex)
                    .map(r => r.repository);
            }
            return this._repositories
                .filter(r => r.selectionIndex !== -1)
                .map(r => r.repository);
        }
        set visibleRepositories(visibleRepositories) {
            var _a;
            const set = new Set(visibleRepositories);
            const added = new Set();
            const removed = new Set();
            for (const repositoryView of this._repositories) {
                // Selected -> !Selected
                if (!set.has(repositoryView.repository) && repositoryView.selectionIndex !== -1) {
                    repositoryView.selectionIndex = -1;
                    removed.add(repositoryView.repository);
                }
                // Selected | !Selected -> Selected
                if (set.has(repositoryView.repository)) {
                    if (repositoryView.selectionIndex === -1) {
                        added.add(repositoryView.repository);
                    }
                    repositoryView.selectionIndex = visibleRepositories.indexOf(repositoryView.repository);
                }
            }
            if (added.size === 0 && removed.size === 0) {
                return;
            }
            this._onDidSetVisibleRepositories.fire({ added, removed });
            // Update focus if the focused repository is not visible anymore
            if (this._repositories.find(r => r.focused && r.selectionIndex === -1)) {
                this.focus((_a = this._repositories.find(r => r.selectionIndex !== -1)) === null || _a === void 0 ? void 0 : _a.repository);
            }
        }
        get focusedRepository() {
            var _a;
            return (_a = this._repositories.find(r => r.focused)) === null || _a === void 0 ? void 0 : _a.repository;
        }
        onDidAddRepository(repository) {
            if (!this.didFinishLoading) {
                this.eventuallyFinishLoading();
            }
            const repositoryView = {
                repository, discoveryTime: Date.now(), focused: false, selectionIndex: -1
            };
            let removed = iterator_1.Iterable.empty();
            if (this.previousState) {
                const index = this.previousState.all.indexOf(getProviderStorageKey(repository.provider));
                if (index === -1) {
                    // This repository is not part of the previous state which means that it
                    // was either manually closed in the previous session, or the repository
                    // was added after the previous session.In this case, we should select all
                    // of the repositories.
                    const added = [];
                    this.insertRepositoryView(this._repositories, repositoryView);
                    this._repositories.forEach((repositoryView, index) => {
                        if (repositoryView.selectionIndex === -1) {
                            added.push(repositoryView.repository);
                        }
                        repositoryView.selectionIndex = index;
                    });
                    this._onDidChangeRepositories.fire({ added, removed: iterator_1.Iterable.empty() });
                    this.didSelectRepository = false;
                    return;
                }
                if (this.previousState.visible.indexOf(index) === -1) {
                    // Explicit selection started
                    if (this.didSelectRepository) {
                        this.insertRepositoryView(this._repositories, repositoryView);
                        this._onDidChangeRepositories.fire({ added: iterator_1.Iterable.empty(), removed: iterator_1.Iterable.empty() });
                        return;
                    }
                }
                else {
                    // First visible repository
                    if (!this.didSelectRepository) {
                        removed = [...this.visibleRepositories];
                        this._repositories.forEach(r => {
                            r.focused = false;
                            r.selectionIndex = -1;
                        });
                        this.didSelectRepository = true;
                    }
                }
            }
            const maxSelectionIndex = this.getMaxSelectionIndex();
            this.insertRepositoryView(this._repositories, Object.assign(Object.assign({}, repositoryView), { selectionIndex: maxSelectionIndex + 1 }));
            this._onDidChangeRepositories.fire({ added: [repositoryView.repository], removed });
            if (!this._repositories.find(r => r.focused)) {
                this.focus(repository);
            }
        }
        onDidRemoveRepository(repository) {
            if (!this.didFinishLoading) {
                this.eventuallyFinishLoading();
            }
            const repositoriesIndex = this._repositories.findIndex(r => r.repository === repository);
            if (repositoriesIndex === -1) {
                return;
            }
            let added = iterator_1.Iterable.empty();
            const repositoryView = this._repositories.splice(repositoriesIndex, 1);
            if (this._repositories.length > 0 && this.visibleRepositories.length === 0) {
                this._repositories[0].selectionIndex = 0;
                added = [this._repositories[0].repository];
            }
            this._onDidChangeRepositories.fire({ added, removed: repositoryView.map(r => r.repository) });
            if (repositoryView.length === 1 && repositoryView[0].focused && this.visibleRepositories.length > 0) {
                this.focus(this.visibleRepositories[0]);
            }
        }
        isVisible(repository) {
            var _a;
            return ((_a = this._repositories.find(r => r.repository === repository)) === null || _a === void 0 ? void 0 : _a.selectionIndex) !== -1;
        }
        toggleVisibility(repository, visible) {
            if (typeof visible === 'undefined') {
                visible = !this.isVisible(repository);
            }
            else if (this.isVisible(repository) === visible) {
                return;
            }
            if (visible) {
                this.visibleRepositories = [...this.visibleRepositories, repository];
            }
            else {
                const index = this.visibleRepositories.indexOf(repository);
                if (index > -1) {
                    this.visibleRepositories = [
                        ...this.visibleRepositories.slice(0, index),
                        ...this.visibleRepositories.slice(index + 1)
                    ];
                }
            }
        }
        toggleSortKey(sortKey) {
            this._repositoriesSortKey = sortKey;
            this._sortKeyContextKey.set(this._repositoriesSortKey);
            this._repositories.sort(this.compareRepositories.bind(this));
            this._onDidChangeRepositories.fire({ added: iterator_1.Iterable.empty(), removed: iterator_1.Iterable.empty() });
        }
        focus(repository) {
            if (repository && !this.isVisible(repository)) {
                return;
            }
            this._repositories.forEach(r => r.focused = r.repository === repository);
            if (this._repositories.find(r => r.focused)) {
                this._onDidFocusRepository.fire(repository);
            }
        }
        compareRepositories(op1, op2) {
            // Sort by discovery time
            if (this._repositoriesSortKey === "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */) {
                return op1.discoveryTime - op2.discoveryTime;
            }
            // Sort by path
            if (this._repositoriesSortKey === 'path' && op1.repository.provider.rootUri && op2.repository.provider.rootUri) {
                return (0, comparers_1.comparePaths)(op1.repository.provider.rootUri.fsPath, op2.repository.provider.rootUri.fsPath);
            }
            // Sort by name, path
            const name1 = getRepositoryName(this.workspaceContextService, op1.repository);
            const name2 = getRepositoryName(this.workspaceContextService, op2.repository);
            const nameComparison = (0, comparers_1.compareFileNames)(name1, name2);
            if (nameComparison === 0 && op1.repository.provider.rootUri && op2.repository.provider.rootUri) {
                return (0, comparers_1.comparePaths)(op1.repository.provider.rootUri.fsPath, op2.repository.provider.rootUri.fsPath);
            }
            return nameComparison;
        }
        getMaxSelectionIndex() {
            return this._repositories.length === 0 ? -1 :
                Math.max(...this._repositories.map(r => r.selectionIndex));
        }
        getViewSortOrder() {
            const sortOder = this.configurationService.getValue('scm.repositories.sortOrder');
            switch (sortOder) {
                case 'discovery time':
                    return "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */;
                case 'name':
                    return "name" /* ISCMRepositorySortKey.Name */;
                case 'path':
                    return "path" /* ISCMRepositorySortKey.Path */;
                default:
                    return "discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */;
            }
        }
        insertRepositoryView(repositories, repositoryView) {
            const index = (0, arrays_1.binarySearch)(repositories, repositoryView, this.compareRepositories.bind(this));
            repositories.splice(index < 0 ? ~index : index, 0, repositoryView);
        }
        /*
        private onWillSaveState(): void {
            if (!this.didFinishLoading) { // don't remember state, if the workbench didn't really finish loading
                return;
            }
    
            const all = this.repositories.map(r => getProviderStorageKey(r.provider));
            const visible = this.visibleRepositories.map(r => all.indexOf(getProviderStorageKey(r.provider)));
            const raw = JSON.stringify({ all, sortKey: this._repositoriesSortKey, visible });
    
            this.storageService.store('scm:view:visibleRepositories', raw, StorageScope.WORKSPACE, StorageTarget.MACHINE);
        }
        */
        eventuallyFinishLoading() {
            this.finishLoading();
        }
        finishLoading() {
            if (this.didFinishLoading) {
                return;
            }
            this.didFinishLoading = true;
            this.previousState = undefined;
        }
        dispose() {
            this.disposables.dispose();
            this._onDidChangeRepositories.dispose();
            this._onDidSetVisibleRepositories.dispose();
        }
    };
    __decorate([
        (0, decorators_1.debounce)(5000)
    ], SCMViewService.prototype, "eventuallyFinishLoading", null);
    SCMViewService = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], SCMViewService);
    exports.SCMViewService = SCMViewService;
});
//# sourceMappingURL=scmViewService.js.map