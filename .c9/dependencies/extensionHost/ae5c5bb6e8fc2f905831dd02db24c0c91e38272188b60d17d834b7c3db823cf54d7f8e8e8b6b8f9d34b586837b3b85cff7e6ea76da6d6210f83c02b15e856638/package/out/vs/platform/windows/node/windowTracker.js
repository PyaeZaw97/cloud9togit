/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, async_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActiveWindowManager = void 0;
    class ActiveWindowManager extends lifecycle_1.Disposable {
        constructor({ onDidOpenWindow, onDidFocusWindow, getActiveWindowId }) {
            super();
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            // remember last active window id upon events
            const onActiveWindowChange = event_1.Event.latch(event_1.Event.any(onDidOpenWindow, onDidFocusWindow));
            onActiveWindowChange(this.setActiveWindow, this, this.disposables);
            // resolve current active window
            this.firstActiveWindowIdPromise = (0, async_1.createCancelablePromise)(() => getActiveWindowId());
            (async () => {
                try {
                    const windowId = await this.firstActiveWindowIdPromise;
                    this.activeWindowId = (typeof this.activeWindowId === 'number') ? this.activeWindowId : windowId;
                }
                catch (error) {
                    // ignore
                }
                finally {
                    this.firstActiveWindowIdPromise = undefined;
                }
            })();
        }
        setActiveWindow(windowId) {
            if (this.firstActiveWindowIdPromise) {
                this.firstActiveWindowIdPromise.cancel();
                this.firstActiveWindowIdPromise = undefined;
            }
            this.activeWindowId = windowId;
        }
        async getActiveClientId() {
            const id = this.firstActiveWindowIdPromise ? (await this.firstActiveWindowIdPromise) : this.activeWindowId;
            return `window:${id}`;
        }
    }
    exports.ActiveWindowManager = ActiveWindowManager;
});
//# sourceMappingURL=windowTracker.js.map