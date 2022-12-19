/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElementSizeObserver = void 0;
    class ElementSizeObserver extends lifecycle_1.Disposable {
        constructor(referenceDomElement, dimension) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._referenceDomElement = referenceDomElement;
            this._width = -1;
            this._height = -1;
            this._resizeObserver = null;
            this.measureReferenceDomElement(false, dimension);
        }
        dispose() {
            this.stopObserving();
            super.dispose();
        }
        getWidth() {
            return this._width;
        }
        getHeight() {
            return this._height;
        }
        startObserving() {
            if (!this._resizeObserver && this._referenceDomElement) {
                this._resizeObserver = new ResizeObserver((entries) => {
                    if (entries && entries[0] && entries[0].contentRect) {
                        this.observe({ width: entries[0].contentRect.width, height: entries[0].contentRect.height });
                    }
                    else {
                        this.observe();
                    }
                });
                this._resizeObserver.observe(this._referenceDomElement);
            }
        }
        stopObserving() {
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
        }
        observe(dimension) {
            this.measureReferenceDomElement(true, dimension);
        }
        measureReferenceDomElement(emitEvent, dimension) {
            let observedWidth = 0;
            let observedHeight = 0;
            if (dimension) {
                observedWidth = dimension.width;
                observedHeight = dimension.height;
            }
            else if (this._referenceDomElement) {
                observedWidth = this._referenceDomElement.clientWidth;
                observedHeight = this._referenceDomElement.clientHeight;
            }
            observedWidth = Math.max(5, observedWidth);
            observedHeight = Math.max(5, observedHeight);
            if (this._width !== observedWidth || this._height !== observedHeight) {
                this._width = observedWidth;
                this._height = observedHeight;
                if (emitEvent) {
                    this._onDidChange.fire();
                }
            }
        }
    }
    exports.ElementSizeObserver = ElementSizeObserver;
});
//# sourceMappingURL=elementSizeObserver.js.map