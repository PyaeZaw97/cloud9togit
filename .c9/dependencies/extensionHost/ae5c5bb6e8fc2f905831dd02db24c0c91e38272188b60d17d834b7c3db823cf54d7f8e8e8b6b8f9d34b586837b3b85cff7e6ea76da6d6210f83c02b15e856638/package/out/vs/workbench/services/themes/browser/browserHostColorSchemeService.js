/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/browser/browser", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/themes/common/hostColorSchemeService"], function (require, exports, event_1, browser_1, extensions_1, lifecycle_1, hostColorSchemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserHostColorSchemeService = void 0;
    class BrowserHostColorSchemeService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidSchemeChangeEvent = this._register(new event_1.Emitter());
            this.registerListeners();
        }
        registerListeners() {
            (0, browser_1.addMatchMediaChangeListener)('(prefers-color-scheme: dark)', () => {
                this._onDidSchemeChangeEvent.fire();
            });
            (0, browser_1.addMatchMediaChangeListener)('(forced-colors: active)', () => {
                this._onDidSchemeChangeEvent.fire();
            });
        }
        get onDidChangeColorScheme() {
            return this._onDidSchemeChangeEvent.event;
        }
        get dark() {
            if (window.matchMedia(`(prefers-color-scheme: light)`).matches) {
                return false;
            }
            else if (window.matchMedia(`(prefers-color-scheme: dark)`).matches) {
                return true;
            }
            return false;
        }
        get highContrast() {
            if (window.matchMedia(`(forced-colors: active)`).matches) {
                return true;
            }
            return false;
        }
    }
    exports.BrowserHostColorSchemeService = BrowserHostColorSchemeService;
    (0, extensions_1.registerSingleton)(hostColorSchemeService_1.IHostColorSchemeService, BrowserHostColorSchemeService, true);
});
//# sourceMappingURL=browserHostColorSchemeService.js.map