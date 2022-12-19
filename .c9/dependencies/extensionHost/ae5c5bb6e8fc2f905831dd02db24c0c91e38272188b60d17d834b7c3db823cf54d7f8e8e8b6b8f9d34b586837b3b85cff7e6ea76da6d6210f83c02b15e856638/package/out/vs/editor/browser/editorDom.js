/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/globalPointerMoveMonitor", "vs/base/browser/mouseEvent", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/theme/common/colorRegistry"], function (require, exports, dom, globalPointerMoveMonitor_1, mouseEvent_1, async_1, lifecycle_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicCssRules = exports.GlobalEditorPointerMoveMonitor = exports.EditorPointerEventFactory = exports.EditorMouseEventFactory = exports.EditorMouseEvent = exports.createCoordinatesRelativeToEditor = exports.createEditorPagePosition = exports.CoordinatesRelativeToEditor = exports.EditorPagePosition = exports.ClientCoordinates = exports.PageCoordinates = void 0;
    /**
     * Coordinates relative to the whole document (e.g. mouse event's pageX and pageY)
     */
    class PageCoordinates {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this._pageCoordinatesBrand = undefined;
        }
        toClientCoordinates() {
            return new ClientCoordinates(this.x - dom.StandardWindow.scrollX, this.y - dom.StandardWindow.scrollY);
        }
    }
    exports.PageCoordinates = PageCoordinates;
    /**
     * Coordinates within the application's client area (i.e. origin is document's scroll position).
     *
     * For example, clicking in the top-left corner of the client area will
     * always result in a mouse event with a client.x value of 0, regardless
     * of whether the page is scrolled horizontally.
     */
    class ClientCoordinates {
        constructor(clientX, clientY) {
            this.clientX = clientX;
            this.clientY = clientY;
            this._clientCoordinatesBrand = undefined;
        }
        toPageCoordinates() {
            return new PageCoordinates(this.clientX + dom.StandardWindow.scrollX, this.clientY + dom.StandardWindow.scrollY);
        }
    }
    exports.ClientCoordinates = ClientCoordinates;
    /**
     * The position of the editor in the page.
     */
    class EditorPagePosition {
        constructor(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this._editorPagePositionBrand = undefined;
        }
    }
    exports.EditorPagePosition = EditorPagePosition;
    /**
     * Coordinates relative to the the (top;left) of the editor that can be used safely with other internal editor metrics.
     * **NOTE**: This position is obtained by taking page coordinates and transforming them relative to the
     * editor's (top;left) position in a way in which scale transformations are taken into account.
     * **NOTE**: These coordinates could be negative if the mouse position is outside the editor.
     */
    class CoordinatesRelativeToEditor {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this._positionRelativeToEditorBrand = undefined;
        }
    }
    exports.CoordinatesRelativeToEditor = CoordinatesRelativeToEditor;
    function createEditorPagePosition(editorViewDomNode) {
        const editorPos = dom.getDomNodePagePosition(editorViewDomNode);
        return new EditorPagePosition(editorPos.left, editorPos.top, editorPos.width, editorPos.height);
    }
    exports.createEditorPagePosition = createEditorPagePosition;
    function createCoordinatesRelativeToEditor(editorViewDomNode, editorPagePosition, pos) {
        // The editor's page position is read from the DOM using getBoundingClientRect().
        //
        // getBoundingClientRect() returns the actual dimensions, while offsetWidth and offsetHeight
        // reflect the unscaled size. We can use this difference to detect a transform:scale()
        // and we will apply the transformation in inverse to get mouse coordinates that make sense inside the editor.
        //
        // This could be expanded to cover rotation as well maybe by walking the DOM up from `editorViewDomNode`
        // and computing the effective transformation matrix using getComputedStyle(element).transform.
        //
        const scaleX = editorPagePosition.width / editorViewDomNode.offsetWidth;
        const scaleY = editorPagePosition.height / editorViewDomNode.offsetHeight;
        // Adjust mouse offsets if editor appears to be scaled via transforms
        const relativeX = (pos.x - editorPagePosition.x) / scaleX;
        const relativeY = (pos.y - editorPagePosition.y) / scaleY;
        return new CoordinatesRelativeToEditor(relativeX, relativeY);
    }
    exports.createCoordinatesRelativeToEditor = createCoordinatesRelativeToEditor;
    class EditorMouseEvent extends mouseEvent_1.StandardMouseEvent {
        constructor(e, isFromPointerCapture, editorViewDomNode) {
            super(e);
            this._editorMouseEventBrand = undefined;
            this.isFromPointerCapture = isFromPointerCapture;
            this.pos = new PageCoordinates(this.posx, this.posy);
            this.editorPos = createEditorPagePosition(editorViewDomNode);
            this.relativePos = createCoordinatesRelativeToEditor(editorViewDomNode, this.editorPos, this.pos);
        }
    }
    exports.EditorMouseEvent = EditorMouseEvent;
    class EditorMouseEventFactory {
        constructor(editorViewDomNode) {
            this._editorViewDomNode = editorViewDomNode;
        }
        _create(e) {
            return new EditorMouseEvent(e, false, this._editorViewDomNode);
        }
        onContextMenu(target, callback) {
            return dom.addDisposableListener(target, 'contextmenu', (e) => {
                callback(this._create(e));
            });
        }
        onMouseUp(target, callback) {
            return dom.addDisposableListener(target, 'mouseup', (e) => {
                callback(this._create(e));
            });
        }
        onMouseDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.MOUSE_DOWN, (e) => {
                callback(this._create(e));
            });
        }
        onPointerDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.POINTER_DOWN, (e) => {
                callback(this._create(e), e.pointerType, e.pointerId);
            });
        }
        onMouseLeave(target, callback) {
            return dom.addDisposableNonBubblingMouseOutListener(target, (e) => {
                callback(this._create(e));
            });
        }
        onMouseMoveThrottled(target, callback, merger, minimumTimeMs) {
            const myMerger = (lastEvent, currentEvent) => {
                return merger(lastEvent, this._create(currentEvent));
            };
            return dom.addDisposableThrottledListener(target, 'mousemove', callback, myMerger, minimumTimeMs);
        }
    }
    exports.EditorMouseEventFactory = EditorMouseEventFactory;
    class EditorPointerEventFactory {
        constructor(editorViewDomNode) {
            this._editorViewDomNode = editorViewDomNode;
        }
        _create(e) {
            return new EditorMouseEvent(e, false, this._editorViewDomNode);
        }
        onPointerUp(target, callback) {
            return dom.addDisposableListener(target, 'pointerup', (e) => {
                callback(this._create(e));
            });
        }
        onPointerDown(target, callback) {
            return dom.addDisposableListener(target, dom.EventType.POINTER_DOWN, (e) => {
                callback(this._create(e), e.pointerId);
            });
        }
        onPointerLeave(target, callback) {
            return dom.addDisposableNonBubblingPointerOutListener(target, (e) => {
                callback(this._create(e));
            });
        }
        onPointerMoveThrottled(target, callback, merger, minimumTimeMs) {
            const myMerger = (lastEvent, currentEvent) => {
                return merger(lastEvent, this._create(currentEvent));
            };
            return dom.addDisposableThrottledListener(target, 'pointermove', callback, myMerger, minimumTimeMs);
        }
    }
    exports.EditorPointerEventFactory = EditorPointerEventFactory;
    class GlobalEditorPointerMoveMonitor extends lifecycle_1.Disposable {
        constructor(editorViewDomNode) {
            super();
            this._editorViewDomNode = editorViewDomNode;
            this._globalPointerMoveMonitor = this._register(new globalPointerMoveMonitor_1.GlobalPointerMoveMonitor());
            this._keydownListener = null;
        }
        startMonitoring(initialElement, pointerId, initialButtons, merger, pointerMoveCallback, onStopCallback) {
            // Add a <<capture>> keydown event listener that will cancel the monitoring
            // if something other than a modifier key is pressed
            this._keydownListener = dom.addStandardDisposableListener(document, 'keydown', (e) => {
                const kb = e.toKeybinding();
                if (kb.isModifierKey()) {
                    // Allow modifier keys
                    return;
                }
                this._globalPointerMoveMonitor.stopMonitoring(true, e.browserEvent);
            }, true);
            const myMerger = (lastEvent, currentEvent) => {
                return merger(lastEvent, new EditorMouseEvent(currentEvent, true, this._editorViewDomNode));
            };
            this._globalPointerMoveMonitor.startMonitoring(initialElement, pointerId, initialButtons, myMerger, pointerMoveCallback, (e) => {
                this._keydownListener.dispose();
                onStopCallback(e);
            });
        }
        stopMonitoring() {
            this._globalPointerMoveMonitor.stopMonitoring(true);
        }
    }
    exports.GlobalEditorPointerMoveMonitor = GlobalEditorPointerMoveMonitor;
    /**
     * A helper to create dynamic css rules, bound to a class name.
     * Rules are reused.
     * Reference counting and delayed garbage collection ensure that no rules leak.
    */
    class DynamicCssRules {
        constructor(_editor) {
            this._editor = _editor;
            this._instanceId = ++DynamicCssRules._idPool;
            this._counter = 0;
            this._rules = new Map();
            // We delay garbage collection so that hanging rules can be reused.
            this._garbageCollectionScheduler = new async_1.RunOnceScheduler(() => this.garbageCollect(), 1000);
        }
        createClassNameRef(options) {
            const rule = this.getOrCreateRule(options);
            rule.increaseRefCount();
            return {
                className: rule.className,
                dispose: () => {
                    rule.decreaseRefCount();
                    this._garbageCollectionScheduler.schedule();
                }
            };
        }
        getOrCreateRule(properties) {
            const key = this.computeUniqueKey(properties);
            let existingRule = this._rules.get(key);
            if (!existingRule) {
                const counter = this._counter++;
                existingRule = new RefCountedCssRule(key, `dyn-rule-${this._instanceId}-${counter}`, dom.isInShadowDOM(this._editor.getContainerDomNode())
                    ? this._editor.getContainerDomNode()
                    : undefined, properties);
                this._rules.set(key, existingRule);
            }
            return existingRule;
        }
        computeUniqueKey(properties) {
            return JSON.stringify(properties);
        }
        garbageCollect() {
            for (const rule of this._rules.values()) {
                if (!rule.hasReferences()) {
                    this._rules.delete(rule.key);
                    rule.dispose();
                }
            }
        }
    }
    exports.DynamicCssRules = DynamicCssRules;
    DynamicCssRules._idPool = 0;
    class RefCountedCssRule {
        constructor(key, className, _containerElement, properties) {
            this.key = key;
            this.className = className;
            this.properties = properties;
            this._referenceCount = 0;
            this._styleElement = dom.createStyleSheet(_containerElement);
            this._styleElement.textContent = this.getCssText(this.className, this.properties);
        }
        getCssText(className, properties) {
            let str = `.${className} {`;
            for (const prop in properties) {
                const value = properties[prop];
                let cssValue;
                if (typeof value === 'object') {
                    cssValue = `var(${(0, colorRegistry_1.asCssVariableName)(value.id)})`;
                }
                else {
                    cssValue = value;
                }
                const cssPropName = camelToDashes(prop);
                str += `\n\t${cssPropName}: ${cssValue};`;
            }
            str += `\n}`;
            return str;
        }
        dispose() {
            this._styleElement.remove();
        }
        increaseRefCount() {
            this._referenceCount++;
        }
        decreaseRefCount() {
            this._referenceCount--;
        }
        hasReferences() {
            return this._referenceCount > 0;
        }
    }
    function camelToDashes(str) {
        return str.replace(/(^[A-Z])/, ([first]) => first.toLowerCase())
            .replace(/([A-Z])/g, ([letter]) => `-${letter.toLowerCase()}`);
    }
});
//# sourceMappingURL=editorDom.js.map