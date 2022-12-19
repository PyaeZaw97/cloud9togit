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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentsView", "../common/extHost.protocol", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/common/views", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/nls", "vs/base/common/network"], function (require, exports, event_1, lifecycle_1, uri_1, uuid_1, range_1, platform_1, extHostCustomers_1, commentService_1, commentsView_1, extHost_protocol_1, commentsTreeViewer_1, views_1, descriptors_1, viewPaneContainer_1, codicons_1, iconRegistry_1, nls_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadComments = exports.MainThreadCommentController = exports.MainThreadCommentThread = void 0;
    class MainThreadCommentThread {
        constructor(commentThreadHandle, controllerHandle, extensionId, threadId, resource, _range, _canReply) {
            this.commentThreadHandle = commentThreadHandle;
            this.controllerHandle = controllerHandle;
            this.extensionId = extensionId;
            this.threadId = threadId;
            this.resource = resource;
            this._range = _range;
            this._canReply = _canReply;
            this._onDidChangeInput = new event_1.Emitter();
            this._onDidChangeLabel = new event_1.Emitter();
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            this._onDidChangeComments = new event_1.Emitter();
            this._onDidChangeCanReply = new event_1.Emitter();
            this._onDidChangeRange = new event_1.Emitter();
            this.onDidChangeRange = this._onDidChangeRange.event;
            this._onDidChangeCollasibleState = new event_1.Emitter();
            this.onDidChangeCollasibleState = this._onDidChangeCollasibleState.event;
            this._onDidChangeState = new event_1.Emitter();
            this.onDidChangeState = this._onDidChangeState.event;
            this._isDisposed = false;
        }
        get input() {
            return this._input;
        }
        set input(value) {
            this._input = value;
            this._onDidChangeInput.fire(value);
        }
        get onDidChangeInput() { return this._onDidChangeInput.event; }
        get label() {
            return this._label;
        }
        set label(label) {
            this._label = label;
            this._onDidChangeLabel.fire(this._label);
        }
        get contextValue() {
            return this._contextValue;
        }
        set contextValue(context) {
            this._contextValue = context;
        }
        get comments() {
            return this._comments;
        }
        set comments(newComments) {
            this._comments = newComments;
            this._onDidChangeComments.fire(this._comments);
        }
        get onDidChangeComments() { return this._onDidChangeComments.event; }
        set range(range) {
            this._range = range;
            this._onDidChangeRange.fire(this._range);
        }
        get range() {
            return this._range;
        }
        get onDidChangeCanReply() { return this._onDidChangeCanReply.event; }
        set canReply(state) {
            this._canReply = state;
            this._onDidChangeCanReply.fire(this._canReply);
        }
        get canReply() {
            return this._canReply;
        }
        get collapsibleState() {
            return this._collapsibleState;
        }
        set collapsibleState(newState) {
            this._collapsibleState = newState;
            this._onDidChangeCollasibleState.fire(this._collapsibleState);
        }
        get isDisposed() {
            return this._isDisposed;
        }
        isDocumentCommentThread() {
            return range_1.Range.isIRange(this._range);
        }
        get state() {
            return this._state;
        }
        set state(newState) {
            this._state = newState;
            this._onDidChangeState.fire(this._state);
        }
        batchUpdate(changes) {
            const modified = (value) => Object.prototype.hasOwnProperty.call(changes, value);
            if (modified('range')) {
                this._range = changes.range;
            }
            if (modified('label')) {
                this._label = changes.label;
            }
            if (modified('contextValue')) {
                this._contextValue = changes.contextValue === null ? undefined : changes.contextValue;
            }
            if (modified('comments')) {
                this._comments = changes.comments;
            }
            if (modified('collapseState')) {
                this._collapsibleState = changes.collapseState;
            }
            if (modified('canReply')) {
                this.canReply = changes.canReply;
            }
            if (modified('state')) {
                this.state = changes.state;
            }
        }
        dispose() {
            this._isDisposed = true;
            this._onDidChangeCollasibleState.dispose();
            this._onDidChangeComments.dispose();
            this._onDidChangeInput.dispose();
            this._onDidChangeLabel.dispose();
            this._onDidChangeRange.dispose();
            this._onDidChangeState.dispose();
        }
        toJSON() {
            return {
                $mid: 7 /* MarshalledId.CommentThread */,
                commentControlHandle: this.controllerHandle,
                commentThreadHandle: this.commentThreadHandle,
            };
        }
    }
    exports.MainThreadCommentThread = MainThreadCommentThread;
    class MainThreadCommentController {
        constructor(_proxy, _commentService, _handle, _uniqueId, _id, _label, _features) {
            this._proxy = _proxy;
            this._commentService = _commentService;
            this._handle = _handle;
            this._uniqueId = _uniqueId;
            this._id = _id;
            this._label = _label;
            this._features = _features;
            this._threads = new Map();
        }
        get handle() {
            return this._handle;
        }
        get id() {
            return this._id;
        }
        get contextValue() {
            return this._id;
        }
        get proxy() {
            return this._proxy;
        }
        get label() {
            return this._label;
        }
        get reactions() {
            return this._reactions;
        }
        set reactions(reactions) {
            this._reactions = reactions;
        }
        get options() {
            return this._features.options;
        }
        get features() {
            return this._features;
        }
        updateFeatures(features) {
            this._features = features;
        }
        createCommentThread(extensionId, commentThreadHandle, threadId, resource, range) {
            let thread = new MainThreadCommentThread(commentThreadHandle, this.handle, extensionId, threadId, uri_1.URI.revive(resource).toString(), range, true);
            this._threads.set(commentThreadHandle, thread);
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [thread],
                    removed: [],
                    changed: []
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [thread],
                    removed: [],
                    changed: []
                });
            }
            return thread;
        }
        updateCommentThread(commentThreadHandle, threadId, resource, changes) {
            let thread = this.getKnownThread(commentThreadHandle);
            thread.batchUpdate(changes);
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [],
                    removed: [],
                    changed: [thread]
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [],
                    removed: [],
                    changed: [thread]
                });
            }
        }
        deleteCommentThread(commentThreadHandle) {
            let thread = this.getKnownThread(commentThreadHandle);
            this._threads.delete(commentThreadHandle);
            thread.dispose();
            if (thread.isDocumentCommentThread()) {
                this._commentService.updateComments(this._uniqueId, {
                    added: [],
                    removed: [thread],
                    changed: []
                });
            }
            else {
                this._commentService.updateNotebookComments(this._uniqueId, {
                    added: [],
                    removed: [thread],
                    changed: []
                });
            }
        }
        deleteCommentThreadMain(commentThreadId) {
            this._threads.forEach(thread => {
                if (thread.threadId === commentThreadId) {
                    this._proxy.$deleteCommentThread(this._handle, thread.commentThreadHandle);
                }
            });
        }
        updateInput(input) {
            let thread = this.activeCommentThread;
            if (thread && thread.input) {
                let commentInput = thread.input;
                commentInput.value = input;
                thread.input = commentInput;
            }
        }
        updateCommentingRanges() {
            this._commentService.updateCommentingRanges(this._uniqueId);
        }
        getKnownThread(commentThreadHandle) {
            const thread = this._threads.get(commentThreadHandle);
            if (!thread) {
                throw new Error('unknown thread');
            }
            return thread;
        }
        async getDocumentComments(resource, token) {
            if (resource.scheme === network_1.Schemas.vscodeNotebookCell) {
                return {
                    owner: this._uniqueId,
                    label: this.label,
                    threads: [],
                    commentingRanges: {
                        resource: resource,
                        ranges: []
                    }
                };
            }
            let ret = [];
            for (let thread of [...this._threads.keys()]) {
                const commentThread = this._threads.get(thread);
                if (commentThread.resource === resource.toString()) {
                    ret.push(commentThread);
                }
            }
            let commentingRanges = await this._proxy.$provideCommentingRanges(this.handle, resource, token);
            return {
                owner: this._uniqueId,
                label: this.label,
                threads: ret,
                commentingRanges: {
                    resource: resource,
                    ranges: commentingRanges || []
                }
            };
        }
        async getNotebookComments(resource, token) {
            if (resource.scheme !== network_1.Schemas.vscodeNotebookCell) {
                return {
                    owner: this._uniqueId,
                    label: this.label,
                    threads: []
                };
            }
            let ret = [];
            for (let thread of [...this._threads.keys()]) {
                const commentThread = this._threads.get(thread);
                if (commentThread.resource === resource.toString()) {
                    ret.push(commentThread);
                }
            }
            return {
                owner: this._uniqueId,
                label: this.label,
                threads: ret
            };
        }
        async getCommentingRanges(resource, token) {
            let commentingRanges = await this._proxy.$provideCommentingRanges(this.handle, resource, token);
            return commentingRanges || [];
        }
        async toggleReaction(uri, thread, comment, reaction, token) {
            return this._proxy.$toggleReaction(this._handle, thread.commentThreadHandle, uri, comment, reaction);
        }
        getAllComments() {
            let ret = [];
            for (let thread of [...this._threads.keys()]) {
                ret.push(this._threads.get(thread));
            }
            return ret;
        }
        createCommentThreadTemplate(resource, range) {
            this._proxy.$createCommentThreadTemplate(this.handle, resource, range);
        }
        async updateCommentThreadTemplate(threadHandle, range) {
            await this._proxy.$updateCommentThreadTemplate(this.handle, threadHandle, range);
        }
        toJSON() {
            return {
                $mid: 6 /* MarshalledId.CommentController */,
                handle: this.handle
            };
        }
    }
    exports.MainThreadCommentController = MainThreadCommentController;
    const commentsViewIcon = (0, iconRegistry_1.registerIcon)('comments-view-icon', codicons_1.Codicon.commentDiscussion, (0, nls_1.localize)('commentsViewIcon', 'View icon of the comments view.'));
    let MainThreadComments = class MainThreadComments extends lifecycle_1.Disposable {
        constructor(extHostContext, _commentService, _viewsService, _viewDescriptorService) {
            super();
            this._commentService = _commentService;
            this._viewsService = _viewsService;
            this._viewDescriptorService = _viewDescriptorService;
            this._documentProviders = new Map();
            this._workspaceProviders = new Map();
            this._handlers = new Map();
            this._commentControllers = new Map();
            this._activeCommentThreadDisposables = this._register(new lifecycle_1.DisposableStore());
            this._openViewListener = null;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostComments);
            this._register(this._commentService.onDidChangeActiveCommentThread(async (thread) => {
                let handle = thread.controllerHandle;
                let controller = this._commentControllers.get(handle);
                if (!controller) {
                    return;
                }
                this._activeCommentThreadDisposables.clear();
                this._activeCommentThread = thread;
                controller.activeCommentThread = this._activeCommentThread;
            }));
        }
        $registerCommentController(handle, id, label) {
            const providerId = (0, uuid_1.generateUuid)();
            this._handlers.set(handle, providerId);
            const provider = new MainThreadCommentController(this._proxy, this._commentService, handle, providerId, id, label, {});
            this._commentService.registerCommentController(providerId, provider);
            this._commentControllers.set(handle, provider);
            const commentsPanelAlreadyConstructed = !!this._viewDescriptorService.getViewDescriptorById(commentsTreeViewer_1.COMMENTS_VIEW_ID);
            if (!commentsPanelAlreadyConstructed) {
                this.registerView(commentsPanelAlreadyConstructed);
            }
            this.registerViewListeners(commentsPanelAlreadyConstructed);
            this._commentService.setWorkspaceComments(String(handle), []);
        }
        $unregisterCommentController(handle) {
            const providerId = this._handlers.get(handle);
            this._handlers.delete(handle);
            this._commentControllers.delete(handle);
            if (typeof providerId !== 'string') {
                return;
                // throw new Error('unknown handler');
            }
            else {
                this._commentService.unregisterCommentController(providerId);
            }
        }
        $updateCommentControllerFeatures(handle, features) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            provider.updateFeatures(features);
        }
        $createCommentThread(handle, commentThreadHandle, threadId, resource, range, extensionId) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            return provider.createCommentThread(extensionId.value, commentThreadHandle, threadId, resource, range);
        }
        $updateCommentThread(handle, commentThreadHandle, threadId, resource, changes) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return undefined;
            }
            return provider.updateCommentThread(commentThreadHandle, threadId, resource, changes);
        }
        $deleteCommentThread(handle, commentThreadHandle) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            return provider.deleteCommentThread(commentThreadHandle);
        }
        $updateCommentingRanges(handle) {
            let provider = this._commentControllers.get(handle);
            if (!provider) {
                return;
            }
            provider.updateCommentingRanges();
        }
        registerView(commentsViewAlreadyRegistered) {
            if (!commentsViewAlreadyRegistered) {
                const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                    id: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                    title: commentsTreeViewer_1.COMMENTS_VIEW_TITLE,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [commentsTreeViewer_1.COMMENTS_VIEW_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
                    storageId: commentsTreeViewer_1.COMMENTS_VIEW_TITLE,
                    hideIfEmpty: true,
                    icon: commentsViewIcon,
                    order: 10,
                }, 1 /* ViewContainerLocation.Panel */);
                platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
                        id: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                        name: commentsTreeViewer_1.COMMENTS_VIEW_TITLE,
                        canToggleVisibility: false,
                        ctorDescriptor: new descriptors_1.SyncDescriptor(commentsView_1.CommentsPanel),
                        canMoveView: true,
                        containerIcon: commentsViewIcon,
                        focusCommand: {
                            id: 'workbench.action.focusCommentsPanel'
                        }
                    }], VIEW_CONTAINER);
            }
        }
        setComments() {
            [...this._commentControllers.keys()].forEach(handle => {
                let threads = this._commentControllers.get(handle).getAllComments();
                if (threads.length) {
                    const providerId = this.getHandler(handle);
                    this._commentService.setWorkspaceComments(providerId, threads);
                }
            });
        }
        registerViewOpenedListener() {
            if (!this._openViewListener) {
                this._openViewListener = this._viewsService.onDidChangeViewVisibility(e => {
                    if (e.id === commentsTreeViewer_1.COMMENTS_VIEW_ID && e.visible) {
                        this.setComments();
                        if (this._openViewListener) {
                            this._openViewListener.dispose();
                            this._openViewListener = null;
                        }
                    }
                });
            }
        }
        /**
         * If the comments view has never been opened, the constructor for it has not yet run so it has
         * no listeners for comment threads being set or updated. Listen for the view opening for the
         * first time and send it comments then.
         */
        registerViewListeners(commentsPanelAlreadyConstructed) {
            if (!commentsPanelAlreadyConstructed) {
                this.registerViewOpenedListener();
            }
            this._register(this._viewDescriptorService.onDidChangeContainer(e => {
                if (e.views.find(view => view.id === commentsTreeViewer_1.COMMENTS_VIEW_ID)) {
                    this.setComments();
                    this.registerViewOpenedListener();
                }
            }));
            this._register(this._viewDescriptorService.onDidChangeContainerLocation(e => {
                const commentsContainer = this._viewDescriptorService.getViewContainerByViewId(commentsTreeViewer_1.COMMENTS_VIEW_ID);
                if (e.viewContainer.id === (commentsContainer === null || commentsContainer === void 0 ? void 0 : commentsContainer.id)) {
                    this.setComments();
                    this.registerViewOpenedListener();
                }
            }));
        }
        getHandler(handle) {
            if (!this._handlers.has(handle)) {
                throw new Error('Unknown handler');
            }
            return this._handlers.get(handle);
        }
        dispose() {
            super.dispose();
            this._workspaceProviders.forEach(value => (0, lifecycle_1.dispose)(value));
            this._workspaceProviders.clear();
            this._documentProviders.forEach(value => (0, lifecycle_1.dispose)(value));
            this._documentProviders.clear();
        }
    };
    MainThreadComments = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadComments),
        __param(1, commentService_1.ICommentService),
        __param(2, views_1.IViewsService),
        __param(3, views_1.IViewDescriptorService)
    ], MainThreadComments);
    exports.MainThreadComments = MainThreadComments;
});
//# sourceMappingURL=mainThreadComments.js.map