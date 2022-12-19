/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle"], function (require, exports, dom, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalPointerMoveMonitor = exports.standardPointerMoveMerger = void 0;
    function standardPointerMoveMerger(lastEvent, currentEvent) {
        currentEvent.preventDefault();
        return {
            leftButton: (currentEvent.button === 0),
            buttons: currentEvent.buttons,
            pageX: currentEvent.pageX,
            pageY: currentEvent.pageY
        };
    }
    exports.standardPointerMoveMerger = standardPointerMoveMerger;
    class GlobalPointerMoveMonitor {
        constructor() {
            this._hooks = new lifecycle_1.DisposableStore();
            this._pointerMoveEventMerger = null;
            this._pointerMoveCallback = null;
            this._onStopCallback = null;
        }
        dispose() {
            this.stopMonitoring(false);
            this._hooks.dispose();
        }
        stopMonitoring(invokeStopCallback, browserEvent) {
            if (!this.isMonitoring()) {
                // Not monitoring
                return;
            }
            // Unhook
            this._hooks.clear();
            this._pointerMoveEventMerger = null;
            this._pointerMoveCallback = null;
            const onStopCallback = this._onStopCallback;
            this._onStopCallback = null;
            if (invokeStopCallback && onStopCallback) {
                onStopCallback(browserEvent);
            }
        }
        isMonitoring() {
            return !!this._pointerMoveEventMerger;
        }
        startMonitoring(initialElement, pointerId, initialButtons, pointerMoveEventMerger, pointerMoveCallback, onStopCallback) {
            if (this.isMonitoring()) {
                this.stopMonitoring(false);
            }
            this._pointerMoveEventMerger = pointerMoveEventMerger;
            this._pointerMoveCallback = pointerMoveCallback;
            this._onStopCallback = onStopCallback;
            let eventSource = initialElement;
            try {
                initialElement.setPointerCapture(pointerId);
                this._hooks.add((0, lifecycle_1.toDisposable)(() => {
                    initialElement.releasePointerCapture(pointerId);
                }));
            }
            catch (err) {
                // See https://github.com/microsoft/vscode/issues/144584
                // See https://github.com/microsoft/vscode/issues/146947
                // `setPointerCapture` sometimes fails when being invoked
                // from a `mousedown` listener on macOS and Windows
                // and it always fails on Linux with the exception:
                //     DOMException: Failed to execute 'setPointerCapture' on 'Element':
                //     No active pointer with the given id is found.
                // In case of failure, we bind the listeners on the window
                eventSource = window;
            }
            this._hooks.add(dom.addDisposableThrottledListener(eventSource, dom.EventType.POINTER_MOVE, (data) => {
                if (data.buttons !== initialButtons) {
                    // Buttons state has changed in the meantime
                    this.stopMonitoring(true);
                    return;
                }
                this._pointerMoveCallback(data);
            }, (lastEvent, currentEvent) => this._pointerMoveEventMerger(lastEvent, currentEvent)));
            this._hooks.add(dom.addDisposableListener(eventSource, dom.EventType.POINTER_UP, (e) => this.stopMonitoring(true)));
        }
    }
    exports.GlobalPointerMoveMonitor = GlobalPointerMoveMonitor;
});
//# sourceMappingURL=globalPointerMoveMonitor.js.map