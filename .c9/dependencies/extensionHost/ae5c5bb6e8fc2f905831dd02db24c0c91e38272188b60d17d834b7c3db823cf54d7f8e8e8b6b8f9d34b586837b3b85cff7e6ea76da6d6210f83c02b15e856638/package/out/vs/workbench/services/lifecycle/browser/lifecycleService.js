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
define(["require", "exports", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/services/lifecycle/common/lifecycleService", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/base/common/cancellation"], function (require, exports, lifecycle_1, log_1, lifecycleService_1, nls_1, extensions_1, dom_1, storage_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserLifecycleService = void 0;
    let BrowserLifecycleService = class BrowserLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        constructor(logService, storageService) {
            super(logService, storageService);
            this.beforeUnloadListener = undefined;
            this.unloadListener = undefined;
            this.ignoreBeforeUnload = false;
            this.didUnload = false;
            this.registerListeners();
        }
        registerListeners() {
            // Listen to `beforeUnload` to support to veto
            this.beforeUnloadListener = (0, dom_1.addDisposableListener)(window, dom_1.EventType.BEFORE_UNLOAD, (e) => this.onBeforeUnload(e));
            // Listen to `pagehide` to support orderly shutdown
            // We explicitly do not listen to `unload` event
            // which would disable certain browser caching.
            // We currently do not handle the `persisted` property
            // (https://github.com/microsoft/vscode/issues/136216)
            this.unloadListener = (0, dom_1.addDisposableListener)(window, dom_1.EventType.PAGE_HIDE, () => this.onUnload());
        }
        onBeforeUnload(event) {
            // Before unload ignored (once)
            if (this.ignoreBeforeUnload) {
                this.logService.info('[lifecycle] onBeforeUnload triggered but ignored once');
                this.ignoreBeforeUnload = false;
            }
            // Before unload with veto support
            else {
                this.logService.info('[lifecycle] onBeforeUnload triggered and handled with veto support');
                this.doShutdown(() => this.vetoBeforeUnload(event));
            }
        }
        vetoBeforeUnload(event) {
            event.preventDefault();
            event.returnValue = (0, nls_1.localize)('lifecycleVeto', "Changes that you made may not be saved. Please check press 'Cancel' and try again.");
        }
        withExpectedShutdown(reason, callback) {
            // Standard shutdown
            if (typeof reason === 'number') {
                this.shutdownReason = reason;
                // Ensure UI state is persisted
                return this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            }
            // Before unload handling ignored for duration of callback
            else {
                this.ignoreBeforeUnload = true;
                try {
                    callback === null || callback === void 0 ? void 0 : callback();
                }
                finally {
                    this.ignoreBeforeUnload = false;
                }
            }
        }
        async shutdown() {
            var _a, _b;
            this.logService.info('[lifecycle] shutdown triggered');
            // An explicit shutdown renders our unload
            // event handlers disabled, so dispose them.
            (_a = this.beforeUnloadListener) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this.unloadListener) === null || _b === void 0 ? void 0 : _b.dispose();
            // Ensure UI state is persisted
            await this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            // Handle shutdown without veto support
            this.doShutdown();
        }
        doShutdown(vetoShutdown) {
            const logService = this.logService;
            // Optimistically trigger a UI state flush
            // without waiting for it. The browser does
            // not guarantee that this is being executed
            // but if a dialog opens, we have a chance
            // to succeed.
            this.storageService.flush(storage_1.WillSaveStateReason.SHUTDOWN);
            let veto = false;
            function handleVeto(vetoResult, id) {
                if (typeof vetoShutdown !== 'function') {
                    return; // veto handling disabled
                }
                if (vetoResult instanceof Promise) {
                    logService.error(`[lifecycle] Long running operations before shutdown are unsupported in the web (id: ${id})`);
                    veto = true; // implicitly vetos since we cannot handle promises in web
                }
                if (vetoResult === true) {
                    logService.info(`[lifecycle]: Unload was prevented (id: ${id})`);
                    veto = true;
                }
            }
            // Before Shutdown
            this._onBeforeShutdown.fire({
                reason: 2 /* ShutdownReason.QUIT */,
                veto(value, id) {
                    handleVeto(value, id);
                },
                finalVeto(valueFn, id) {
                    handleVeto(valueFn(), id); // in browser, trigger instantly because we do not support async anyway
                }
            });
            // Veto: handle if provided
            if (veto && typeof vetoShutdown === 'function') {
                return vetoShutdown();
            }
            // No veto, continue to shutdown
            return this.onUnload();
        }
        onUnload() {
            if (this.didUnload) {
                return; // only once
            }
            this.didUnload = true;
            // Register a late `pageshow` listener specifically on unload
            this._register((0, dom_1.addDisposableListener)(window, dom_1.EventType.PAGE_SHOW, (e) => this.onLoadAfterUnload(e)));
            // First indicate will-shutdown
            const logService = this.logService;
            this._onWillShutdown.fire({
                reason: 2 /* ShutdownReason.QUIT */,
                joiners: () => [],
                token: cancellation_1.CancellationToken.None,
                join(promise, joiner) {
                    logService.error(`[lifecycle] Long running operations during shutdown are unsupported in the web (id: ${joiner.id})`);
                },
                force: () => { },
            });
            // Finally end with did-shutdown
            this._onDidShutdown.fire();
        }
        onLoadAfterUnload(event) {
            // We only really care about page-show events
            // where the browser indicates to us that the
            // page was restored from cache and not freshly
            // loaded.
            const wasRestoredFromCache = event.persisted;
            if (!wasRestoredFromCache) {
                return;
            }
            // At this point, we know that the page was restored from
            // cache even though it was unloaded before,
            // so in order to get back to a functional workbench, we
            // currently can only reload the window
            // Docs: https://web.dev/bfcache/#optimize-your-pages-for-bfcache
            // Refs: https://github.com/microsoft/vscode/issues/136035
            this.withExpectedShutdown({ disableShutdownHandling: true }, () => window.location.reload());
        }
    };
    BrowserLifecycleService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, storage_1.IStorageService)
    ], BrowserLifecycleService);
    exports.BrowserLifecycleService = BrowserLifecycleService;
    (0, extensions_1.registerSingleton)(lifecycle_1.ILifecycleService, BrowserLifecycleService);
});
//# sourceMappingURL=lifecycleService.js.map