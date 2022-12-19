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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/driver/browser/driver", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, browser_1, dom_1, event_1, async_1, event_2, lifecycle_1, network_1, platform_1, severity_1, uri_1, nls_1, dialogs_1, driver_1, label_1, opener_1, productService_1, environmentService_1, layoutService_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWindow = void 0;
    let BrowserWindow = class BrowserWindow extends lifecycle_1.Disposable {
        constructor(openerService, lifecycleService, dialogService, labelService, productService, environmentService, layoutService) {
            super();
            this.openerService = openerService;
            this.lifecycleService = lifecycleService;
            this.dialogService = dialogService;
            this.labelService = labelService;
            this.productService = productService;
            this.environmentService = environmentService;
            this.layoutService = layoutService;
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            // Lifecycle
            this._register(this.lifecycleService.onWillShutdown(() => this.onWillShutdown()));
            // Layout
            const viewport = platform_1.isIOS && window.visualViewport ? window.visualViewport /** Visual viewport */ : window /** Layout viewport */;
            this._register((0, dom_1.addDisposableListener)(viewport, dom_1.EventType.RESIZE, () => {
                this.layoutService.layout();
                // Sometimes the keyboard appearing scrolls the whole workbench out of view, as a workaround scroll back into view #121206
                if (platform_1.isIOS) {
                    window.scrollTo(0, 0);
                }
            }));
            // Prevent the back/forward gestures in macOS
            this._register((0, dom_1.addDisposableListener)(this.layoutService.container, dom_1.EventType.WHEEL, e => e.preventDefault(), { passive: false }));
            // Prevent native context menus in web
            this._register((0, dom_1.addDisposableListener)(this.layoutService.container, dom_1.EventType.CONTEXT_MENU, e => dom_1.EventHelper.stop(e, true)));
            // Prevent default navigation on drop
            this._register((0, dom_1.addDisposableListener)(this.layoutService.container, dom_1.EventType.DROP, e => dom_1.EventHelper.stop(e, true)));
            // Fullscreen (Browser)
            for (const event of [dom_1.EventType.FULLSCREEN_CHANGE, dom_1.EventType.WK_FULLSCREEN_CHANGE]) {
                this._register((0, dom_1.addDisposableListener)(document, event, () => (0, browser_1.setFullscreen)(!!(0, dom_1.detectFullscreen)())));
            }
            // Fullscreen (Native)
            this._register((0, dom_1.addDisposableThrottledListener)(viewport, dom_1.EventType.RESIZE, () => {
                (0, browser_1.setFullscreen)(!!(0, dom_1.detectFullscreen)());
            }, undefined, platform_1.isMacintosh ? 2000 /* adjust for macOS animation */ : 800 /* can be throttled */));
        }
        onWillShutdown() {
            // Try to detect some user interaction with the workbench
            // when shutdown has happened to not show the dialog e.g.
            // when navigation takes a longer time.
            event_2.Event.toPromise(event_2.Event.any(event_2.Event.once(new event_1.DomEmitter(document.body, dom_1.EventType.KEY_DOWN, true).event), event_2.Event.once(new event_1.DomEmitter(document.body, dom_1.EventType.MOUSE_DOWN, true).event))).then(async () => {
                // Delay the dialog in case the user interacted
                // with the page before it transitioned away
                await (0, async_1.timeout)(3000);
                // This should normally not happen, but if for some reason
                // the workbench was shutdown while the page is still there,
                // inform the user that only a reload can bring back a working
                // state.
                const res = await this.dialogService.show(severity_1.default.Error, (0, nls_1.localize)('shutdownError', "An unexpected error occurred that requires a reload of this page."), [
                    (0, nls_1.localize)('reload', "Reload")
                ], {
                    detail: (0, nls_1.localize)('shutdownErrorDetail', "The workbench was unexpectedly disposed while running.")
                });
                if (res.choice === 0) {
                    window.location.reload(); // do not use any services at this point since they are likely not functional at this point
                }
            });
        }
        create() {
            // Handle open calls
            this.setupOpenHandlers();
            // Label formatting
            this.registerLabelFormatters();
            // Smoke Test Driver
            this.setupDriver();
        }
        setupDriver() {
            if (this.environmentService.enableSmokeTestDriver) {
                (0, driver_1.registerWindowDriver)();
            }
        }
        setupOpenHandlers() {
            // We need to ignore the `beforeunload` event while
            // we handle external links to open specifically for
            // the case of application protocols that e.g. invoke
            // vscode itself. We do not want to open these links
            // in a new window because that would leave a blank
            // window to the user, but using `window.location.href`
            // will trigger the `beforeunload`.
            this.openerService.setDefaultExternalOpener({
                openExternal: async (href) => {
                    var _a;
                    let isAllowedOpener = false;
                    if ((_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.openerAllowedExternalUrlPrefixes) {
                        for (const trustedPopupPrefix of this.environmentService.options.openerAllowedExternalUrlPrefixes) {
                            if (href.startsWith(trustedPopupPrefix)) {
                                isAllowedOpener = true;
                                break;
                            }
                        }
                    }
                    // HTTP(s): open in new window and deal with potential popup blockers
                    if ((0, opener_1.matchesScheme)(href, network_1.Schemas.http) || (0, opener_1.matchesScheme)(href, network_1.Schemas.https)) {
                        if (browser_1.isSafari) {
                            const opened = (0, dom_1.windowOpenWithSuccess)(href, !isAllowedOpener);
                            if (!opened) {
                                const showResult = await this.dialogService.show(severity_1.default.Warning, (0, nls_1.localize)('unableToOpenExternal', "The browser interrupted the opening of a new tab or window. Press 'Open' to open it anyway."), [
                                    (0, nls_1.localize)('open', "Open"),
                                    (0, nls_1.localize)('learnMore', "Learn More"),
                                    (0, nls_1.localize)('cancel', "Cancel")
                                ], {
                                    cancelId: 2,
                                    detail: href
                                });
                                if (showResult.choice === 0) {
                                    isAllowedOpener
                                        ? (0, dom_1.windowOpenPopup)(href)
                                        : (0, dom_1.windowOpenNoOpener)(href);
                                }
                                if (showResult.choice === 1) {
                                    await this.openerService.open(uri_1.URI.parse('https://aka.ms/allow-vscode-popup'));
                                }
                            }
                        }
                        else {
                            isAllowedOpener
                                ? (0, dom_1.windowOpenPopup)(href)
                                : (0, dom_1.windowOpenNoOpener)(href);
                        }
                    }
                    // Anything else: set location to trigger protocol handler in the browser
                    // but make sure to signal this as an expected unload and disable unload
                    // handling explicitly to prevent the workbench from going down.
                    else {
                        const invokeProtocolHandler = () => {
                            this.lifecycleService.withExpectedShutdown({ disableShutdownHandling: true }, () => window.location.href = href);
                        };
                        invokeProtocolHandler();
                        // We cannot know whether the protocol handler succeeded.
                        // Display guidance in case it did not, e.g. the app is not installed locally.
                        if ((0, opener_1.matchesScheme)(href, this.productService.urlProtocol)) {
                            const showResult = await this.dialogService.show(severity_1.default.Info, (0, nls_1.localize)('openExternalDialogTitle', "All done. You can close this tab now."), [
                                (0, nls_1.localize)('openExternalDialogButtonRetry', "Try again"),
                                (0, nls_1.localize)('openExternalDialogButtonInstall', "Install {0}", this.productService.nameLong),
                                (0, nls_1.localize)('openExternalDialogButtonContinue', "Continue here")
                            ], {
                                cancelId: 2,
                                detail: (0, nls_1.localize)('openExternalDialogDetail', "We tried opening {0} on your computer.", this.productService.nameLong)
                            });
                            if (showResult.choice === 0) {
                                invokeProtocolHandler();
                            }
                            else if (showResult.choice === 1) {
                                await this.openerService.open(uri_1.URI.parse(`http://aka.ms/vscode-install`));
                            }
                        }
                    }
                    return true;
                }
            });
        }
        registerLabelFormatters() {
            this._register(this.labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeUserData,
                priority: true,
                formatting: {
                    label: '(Settings) ${path}',
                    separator: '/',
                }
            }));
        }
    };
    BrowserWindow = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, dialogs_1.IDialogService),
        __param(3, label_1.ILabelService),
        __param(4, productService_1.IProductService),
        __param(5, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(6, layoutService_1.IWorkbenchLayoutService)
    ], BrowserWindow);
    exports.BrowserWindow = BrowserWindow;
});
//# sourceMappingURL=window.js.map