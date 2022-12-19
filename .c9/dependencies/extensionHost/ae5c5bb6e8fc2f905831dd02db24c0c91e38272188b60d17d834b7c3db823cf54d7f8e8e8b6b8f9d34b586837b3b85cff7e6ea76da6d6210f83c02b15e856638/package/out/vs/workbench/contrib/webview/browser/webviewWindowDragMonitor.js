/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle"], function (require, exports, DOM, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewWindowDragMonitor = void 0;
    /**
     * Allows webviews to monitor when an element in the VS Code editor is being dragged/dropped.
     *
     * This is required since webview end up eating the drag event. VS Code needs to see this
     * event so it can handle editor element drag drop.
     */
    class WebviewWindowDragMonitor extends lifecycle_1.Disposable {
        constructor(getWebview) {
            super();
            this._register(DOM.addDisposableListener(window, DOM.EventType.DRAG_START, () => {
                var _a;
                (_a = getWebview()) === null || _a === void 0 ? void 0 : _a.windowDidDragStart();
            }));
            const onDragEnd = () => {
                var _a;
                (_a = getWebview()) === null || _a === void 0 ? void 0 : _a.windowDidDragEnd();
            };
            this._register(DOM.addDisposableListener(window, DOM.EventType.DRAG_END, onDragEnd));
            this._register(DOM.addDisposableListener(window, DOM.EventType.MOUSE_MOVE, currentEvent => {
                if (currentEvent.buttons === 0) {
                    onDragEnd();
                }
            }));
        }
    }
    exports.WebviewWindowDragMonitor = WebviewWindowDragMonitor;
});
//# sourceMappingURL=webviewWindowDragMonitor.js.map