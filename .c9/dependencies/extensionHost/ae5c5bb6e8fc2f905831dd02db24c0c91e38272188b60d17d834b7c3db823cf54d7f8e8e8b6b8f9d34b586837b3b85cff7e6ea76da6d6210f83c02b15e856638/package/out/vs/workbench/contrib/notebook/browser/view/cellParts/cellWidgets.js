/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle"], function (require, exports, DOM, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getResizesObserver = exports.BrowserResizeObserver = exports.ClickTargetType = void 0;
    var ClickTargetType;
    (function (ClickTargetType) {
        ClickTargetType[ClickTargetType["Container"] = 0] = "Container";
        ClickTargetType[ClickTargetType["ContributedTextItem"] = 1] = "ContributedTextItem";
        ClickTargetType[ClickTargetType["ContributedCommandItem"] = 2] = "ContributedCommandItem";
    })(ClickTargetType = exports.ClickTargetType || (exports.ClickTargetType = {}));
    class BrowserResizeObserver extends lifecycle_1.Disposable {
        constructor(referenceDomElement, dimension, changeCallback) {
            super();
            this.referenceDomElement = referenceDomElement;
            this.width = -1;
            this.height = -1;
            this.observer = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.target === referenceDomElement && entry.contentRect) {
                        if (this.width !== entry.contentRect.width || this.height !== entry.contentRect.height) {
                            this.width = entry.contentRect.width;
                            this.height = entry.contentRect.height;
                            DOM.scheduleAtNextAnimationFrame(() => {
                                changeCallback();
                            });
                        }
                    }
                }
            });
        }
        getWidth() {
            return this.width;
        }
        getHeight() {
            return this.height;
        }
        startObserving() {
            this.observer.observe(this.referenceDomElement);
        }
        stopObserving() {
            this.observer.unobserve(this.referenceDomElement);
        }
        dispose() {
            this.observer.disconnect();
            super.dispose();
        }
    }
    exports.BrowserResizeObserver = BrowserResizeObserver;
    function getResizesObserver(referenceDomElement, dimension, changeCallback) {
        return new BrowserResizeObserver(referenceDomElement, dimension, changeCallback);
    }
    exports.getResizesObserver = getResizesObserver;
});
//# sourceMappingURL=cellWidgets.js.map