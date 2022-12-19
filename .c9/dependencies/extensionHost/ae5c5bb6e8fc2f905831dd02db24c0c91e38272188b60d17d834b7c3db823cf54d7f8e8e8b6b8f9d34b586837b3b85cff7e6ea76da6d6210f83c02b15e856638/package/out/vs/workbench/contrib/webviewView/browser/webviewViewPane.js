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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/memento", "vs/workbench/common/views", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewWindowDragMonitor", "vs/workbench/contrib/webviewView/browser/webviewViewService", "vs/workbench/services/activity/common/activity", "vs/workbench/services/extensions/common/extensions"], function (require, exports, dom_1, cancellation_1, event_1, lifecycle_1, uuid_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, opener_1, progress_1, storage_1, telemetry_1, themeService_1, viewPane_1, memento_1, views_1, webview_1, webviewWindowDragMonitor_1, webviewViewService_1, activity_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewViewPane = void 0;
    const storageKeys = {
        webviewState: 'webviewState',
    };
    let WebviewViewPane = class WebviewViewPane extends viewPane_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, storageService, extensionService, progressService, webviewService, webviewViewService, viewService, activityService) {
            super(Object.assign(Object.assign({}, options), { titleMenuId: actions_1.MenuId.ViewTitle }), keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.extensionService = extensionService;
            this.progressService = progressService;
            this.webviewService = webviewService;
            this.webviewViewService = webviewViewService;
            this.viewService = viewService;
            this.activityService = activityService;
            this._webview = this._register(new lifecycle_1.MutableDisposable());
            this._webviewDisposables = this._register(new lifecycle_1.DisposableStore());
            this._activated = false;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.extensionId = options.fromExtensionId;
            this.defaultTitle = this.title;
            this.memento = new memento_1.Memento(`webviewView.${this.id}`, storageService);
            this.viewState = this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            this._register(this.onDidChangeBodyVisibility(() => this.updateTreeVisibility()));
            this._register(this.webviewViewService.onNewResolverRegistered(e => {
                if (e.viewType === this.id) {
                    // Potentially re-activate if we have a new resolver
                    this.updateTreeVisibility();
                }
            }));
            this.updateTreeVisibility();
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
        focus() {
            var _a;
            super.focus();
            (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.focus();
        }
        renderBody(container) {
            super.renderBody(container);
            this._container = container;
            this._rootContainer = undefined;
            if (!this._resizeObserver) {
                this._resizeObserver = new ResizeObserver(() => {
                    setTimeout(() => {
                        this.layoutWebview();
                    }, 0);
                });
                this._register((0, lifecycle_1.toDisposable)(() => {
                    this._resizeObserver.disconnect();
                }));
                this._resizeObserver.observe(container);
            }
        }
        saveState() {
            if (this._webview.value) {
                this.viewState[storageKeys.webviewState] = this._webview.value.state;
            }
            this.memento.saveMemento();
            super.saveState();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            if (!this._webview.value) {
                return;
            }
            this.layoutWebview();
        }
        updateTreeVisibility() {
            var _a, _b;
            if (this.isBodyVisible()) {
                this.activate();
                (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.claim(this, undefined);
            }
            else {
                (_b = this._webview.value) === null || _b === void 0 ? void 0 : _b.release(this);
            }
        }
        activate() {
            var _a;
            if (this._activated) {
                return;
            }
            this._activated = true;
            const webviewId = (0, uuid_1.generateUuid)();
            const webview = this.webviewService.createWebviewOverlay(webviewId, { purpose: "webviewView" /* WebviewContentPurpose.WebviewView */ }, {}, this.extensionId ? { id: this.extensionId } : undefined);
            webview.state = this.viewState[storageKeys.webviewState];
            this._webview.value = webview;
            if (this._container) {
                (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.layoutWebviewOverElement(this._container);
            }
            this._webviewDisposables.add((0, lifecycle_1.toDisposable)(() => {
                var _a;
                (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.release(this);
            }));
            this._webviewDisposables.add(webview.onDidUpdateState(() => {
                this.viewState[storageKeys.webviewState] = webview.state;
            }));
            // Re-dispatch all drag events back to the drop target to support view drag drop
            for (const event of [dom_1.EventType.DRAG, dom_1.EventType.DRAG_END, dom_1.EventType.DRAG_ENTER, dom_1.EventType.DRAG_LEAVE, dom_1.EventType.DRAG_START]) {
                this._webviewDisposables.add((0, dom_1.addDisposableListener)(this._webview.value.container, event, e => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.dropTargetElement.dispatchEvent(new DragEvent(e.type, e));
                }));
            }
            this._webviewDisposables.add(new webviewWindowDragMonitor_1.WebviewWindowDragMonitor(() => this._webview.value));
            const source = this._webviewDisposables.add(new cancellation_1.CancellationTokenSource());
            this.withProgress(async () => {
                await this.extensionService.activateByEvent(`onView:${this.id}`);
                let self = this;
                const webviewView = {
                    webview,
                    onDidChangeVisibility: this.onDidChangeBodyVisibility,
                    onDispose: this.onDispose,
                    get title() { return self.setTitle; },
                    set title(value) { self.updateTitle(value); },
                    get description() { return self.titleDescription; },
                    set description(value) { self.updateTitleDescription(value); },
                    get badge() { return self.badge; },
                    set badge(badge) { self.updateBadge(badge); },
                    dispose: () => {
                        // Only reset and clear the webview itself. Don't dispose of the view container
                        this._activated = false;
                        this._webview.clear();
                        this._webviewDisposables.clear();
                    },
                    show: (preserveFocus) => {
                        this.viewService.openView(this.id, !preserveFocus);
                    }
                };
                await this.webviewViewService.resolve(this.id, webviewView, source.token);
            });
        }
        updateTitle(value) {
            this.setTitle = value;
            super.updateTitle(typeof value === 'string' ? value : this.defaultTitle);
        }
        updateBadge(badge) {
            var _a, _b;
            if (((_a = this.badge) === null || _a === void 0 ? void 0 : _a.value) === (badge === null || badge === void 0 ? void 0 : badge.value) &&
                ((_b = this.badge) === null || _b === void 0 ? void 0 : _b.tooltip) === (badge === null || badge === void 0 ? void 0 : badge.tooltip)) {
                return;
            }
            if (this.activity) {
                this.activity.dispose();
                this.activity = undefined;
            }
            this.badge = badge;
            if (badge) {
                const activity = {
                    badge: new activity_1.NumberBadge(badge.value, () => badge.tooltip),
                    priority: 150
                };
                this.activityService.showViewActivity(this.id, activity);
            }
        }
        async withProgress(task) {
            return this.progressService.withProgress({ location: this.id, delay: 500 }, task);
        }
        onDidScrollRoot() {
            this.layoutWebview();
        }
        layoutWebview() {
            const webviewEntry = this._webview.value;
            if (!this._container || !webviewEntry) {
                return;
            }
            webviewEntry.layoutWebviewOverElement(this._container);
            if (!this._rootContainer || !this._rootContainer.isConnected) {
                this._rootContainer = this.findRootContainer(this._container);
            }
            if (this._rootContainer) {
                const containerRect = this._container.getBoundingClientRect();
                const rootRect = this._rootContainer.getBoundingClientRect();
                const clipTop = Math.max(rootRect.top - containerRect.top, 0);
                const clipRight = Math.max(containerRect.width - (containerRect.right - rootRect.right), 0);
                const clipBottom = Math.max(containerRect.height - (containerRect.bottom - rootRect.bottom), 0);
                const clipLeft = Math.max(rootRect.left - containerRect.left, 0);
                webviewEntry.container.style.clip = `rect(${clipTop}px, ${clipRight}px, ${clipBottom}px, ${clipLeft}px)`;
            }
        }
        findRootContainer(container) {
            for (let el = container; el; el = el.parentNode) {
                if (el instanceof HTMLElement) {
                    if (el.classList.contains('monaco-scrollable-element')) {
                        return el;
                    }
                }
            }
            return undefined;
        }
    };
    WebviewViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, storage_1.IStorageService),
        __param(11, extensions_1.IExtensionService),
        __param(12, progress_1.IProgressService),
        __param(13, webview_1.IWebviewService),
        __param(14, webviewViewService_1.IWebviewViewService),
        __param(15, views_1.IViewsService),
        __param(16, activity_1.IActivityService)
    ], WebviewViewPane);
    exports.WebviewViewPane = WebviewViewPane;
});
//# sourceMappingURL=webviewViewPane.js.map