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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/touch", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/css!./sash"], function (require, exports, dom_1, event_1, touch_1, async_1, decorators_1, event_2, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sash = exports.setGlobalHoverDelay = exports.setGlobalSashSize = exports.SashState = exports.Orientation = exports.OrthogonalEdge = void 0;
    /**
     * Allow the sashes to be visible at runtime.
     * @remark Use for development purposes only.
     */
    let DEBUG = false;
    var OrthogonalEdge;
    (function (OrthogonalEdge) {
        OrthogonalEdge["North"] = "north";
        OrthogonalEdge["South"] = "south";
        OrthogonalEdge["East"] = "east";
        OrthogonalEdge["West"] = "west";
    })(OrthogonalEdge = exports.OrthogonalEdge || (exports.OrthogonalEdge = {}));
    var Orientation;
    (function (Orientation) {
        Orientation[Orientation["VERTICAL"] = 0] = "VERTICAL";
        Orientation[Orientation["HORIZONTAL"] = 1] = "HORIZONTAL";
    })(Orientation = exports.Orientation || (exports.Orientation = {}));
    var SashState;
    (function (SashState) {
        /**
         * Disable any UI interaction.
         */
        SashState[SashState["Disabled"] = 0] = "Disabled";
        /**
         * Allow dragging down or to the right, depending on the sash orientation.
         *
         * Some OSs allow customizing the mouse cursor differently whenever
         * some resizable component can't be any smaller, but can be larger.
         */
        SashState[SashState["AtMinimum"] = 1] = "AtMinimum";
        /**
         * Allow dragging up or to the left, depending on the sash orientation.
         *
         * Some OSs allow customizing the mouse cursor differently whenever
         * some resizable component can't be any larger, but can be smaller.
         */
        SashState[SashState["AtMaximum"] = 2] = "AtMaximum";
        /**
         * Enable dragging.
         */
        SashState[SashState["Enabled"] = 3] = "Enabled";
    })(SashState = exports.SashState || (exports.SashState = {}));
    let globalSize = 4;
    const onDidChangeGlobalSize = new event_2.Emitter();
    function setGlobalSashSize(size) {
        globalSize = size;
        onDidChangeGlobalSize.fire(size);
    }
    exports.setGlobalSashSize = setGlobalSashSize;
    let globalHoverDelay = 300;
    const onDidChangeHoverDelay = new event_2.Emitter();
    function setGlobalHoverDelay(size) {
        globalHoverDelay = size;
        onDidChangeHoverDelay.fire(size);
    }
    exports.setGlobalHoverDelay = setGlobalHoverDelay;
    class MouseEventFactory {
        constructor() {
            this.disposables = new lifecycle_1.DisposableStore();
        }
        get onPointerMove() {
            return this.disposables.add(new event_1.DomEmitter(window, 'mousemove')).event;
        }
        get onPointerUp() {
            return this.disposables.add(new event_1.DomEmitter(window, 'mouseup')).event;
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], MouseEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], MouseEventFactory.prototype, "onPointerUp", null);
    class GestureEventFactory {
        constructor(el) {
            this.el = el;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        get onPointerMove() {
            return this.disposables.add(new event_1.DomEmitter(this.el, touch_1.EventType.Change)).event;
        }
        get onPointerUp() {
            return this.disposables.add(new event_1.DomEmitter(this.el, touch_1.EventType.End)).event;
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], GestureEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], GestureEventFactory.prototype, "onPointerUp", null);
    class OrthogonalPointerEventFactory {
        constructor(factory) {
            this.factory = factory;
        }
        get onPointerMove() {
            return this.factory.onPointerMove;
        }
        get onPointerUp() {
            return this.factory.onPointerUp;
        }
        dispose() {
            // noop
        }
    }
    __decorate([
        decorators_1.memoize
    ], OrthogonalPointerEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], OrthogonalPointerEventFactory.prototype, "onPointerUp", null);
    const PointerEventsDisabledCssClass = 'pointer-events-disabled';
    /**
     * The {@link Sash} is the UI component which allows the user to resize other
     * components. It's usually an invisible horizontal or vertical line which, when
     * hovered, becomes highlighted and can be dragged along the perpendicular dimension
     * to its direction.
     *
     * Features:
     * - Touch event handling
     * - Corner sash support
     * - Hover with different mouse cursor support
     * - Configurable hover size
     * - Linked sash support, for 2x2 corner sashes
     */
    class Sash extends lifecycle_1.Disposable {
        constructor(container, layoutProvider, options) {
            super();
            this.hoverDelay = globalHoverDelay;
            this.hoverDelayer = this._register(new async_1.Delayer(this.hoverDelay));
            this._state = 3 /* SashState.Enabled */;
            this.onDidEnablementChange = this._register(new event_2.Emitter());
            this._onDidStart = this._register(new event_2.Emitter());
            this._onDidChange = this._register(new event_2.Emitter());
            this._onDidReset = this._register(new event_2.Emitter());
            this._onDidEnd = this._register(new event_2.Emitter());
            this.orthogonalStartSashDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalStartDragHandleDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalEndSashDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalEndDragHandleDisposables = this._register(new lifecycle_1.DisposableStore());
            /**
             * An event which fires whenever the user starts dragging this sash.
             */
            this.onDidStart = this._onDidStart.event;
            /**
             * An event which fires whenever the user moves the mouse while
             * dragging this sash.
             */
            this.onDidChange = this._onDidChange.event;
            /**
             * An event which fires whenever the user double clicks this sash.
             */
            this.onDidReset = this._onDidReset.event;
            /**
             * An event which fires whenever the user stops dragging this sash.
             */
            this.onDidEnd = this._onDidEnd.event;
            /**
             * A linked sash will be forwarded the same user interactions and events
             * so it moves exactly the same way as this sash.
             *
             * Useful in 2x2 grids. Not meant for widespread usage.
             */
            this.linkedSash = undefined;
            this.el = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-sash'));
            if (options.orthogonalEdge) {
                this.el.classList.add(`orthogonal-edge-${options.orthogonalEdge}`);
            }
            if (platform_1.isMacintosh) {
                this.el.classList.add('mac');
            }
            const onMouseDown = this._register(new event_1.DomEmitter(this.el, 'mousedown')).event;
            this._register(onMouseDown(e => this.onPointerStart(e, new MouseEventFactory()), this));
            const onMouseDoubleClick = this._register(new event_1.DomEmitter(this.el, 'dblclick')).event;
            this._register(onMouseDoubleClick(this.onPointerDoublePress, this));
            const onMouseEnter = this._register(new event_1.DomEmitter(this.el, 'mouseenter')).event;
            this._register(onMouseEnter(() => Sash.onMouseEnter(this)));
            const onMouseLeave = this._register(new event_1.DomEmitter(this.el, 'mouseleave')).event;
            this._register(onMouseLeave(() => Sash.onMouseLeave(this)));
            this._register(touch_1.Gesture.addTarget(this.el));
            const onTouchStart = event_2.Event.map(this._register(new event_1.DomEmitter(this.el, touch_1.EventType.Start)).event, e => { var _a; return (Object.assign(Object.assign({}, e), { target: (_a = e.initialTarget) !== null && _a !== void 0 ? _a : null })); });
            this._register(onTouchStart(e => this.onPointerStart(e, new GestureEventFactory(this.el)), this));
            const onTap = this._register(new event_1.DomEmitter(this.el, touch_1.EventType.Tap)).event;
            const onDoubleTap = event_2.Event.map(event_2.Event.filter(event_2.Event.debounce(onTap, (res, event) => { var _a; return ({ event, count: ((_a = res === null || res === void 0 ? void 0 : res.count) !== null && _a !== void 0 ? _a : 0) + 1 }); }, 250), ({ count }) => count === 2), ({ event }) => { var _a; return (Object.assign(Object.assign({}, event), { target: (_a = event.initialTarget) !== null && _a !== void 0 ? _a : null })); });
            this._register(onDoubleTap(this.onPointerDoublePress, this));
            if (typeof options.size === 'number') {
                this.size = options.size;
                if (options.orientation === 0 /* Orientation.VERTICAL */) {
                    this.el.style.width = `${this.size}px`;
                }
                else {
                    this.el.style.height = `${this.size}px`;
                }
            }
            else {
                this.size = globalSize;
                this._register(onDidChangeGlobalSize.event(size => {
                    this.size = size;
                    this.layout();
                }));
            }
            this._register(onDidChangeHoverDelay.event(delay => this.hoverDelay = delay));
            this.layoutProvider = layoutProvider;
            this.orthogonalStartSash = options.orthogonalStartSash;
            this.orthogonalEndSash = options.orthogonalEndSash;
            this.orientation = options.orientation || 0 /* Orientation.VERTICAL */;
            if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                this.el.classList.add('horizontal');
                this.el.classList.remove('vertical');
            }
            else {
                this.el.classList.remove('horizontal');
                this.el.classList.add('vertical');
            }
            this.el.classList.toggle('debug', DEBUG);
            this.layout();
        }
        get state() { return this._state; }
        get orthogonalStartSash() { return this._orthogonalStartSash; }
        get orthogonalEndSash() { return this._orthogonalEndSash; }
        /**
         * The state of a sash defines whether it can be interacted with by the user
         * as well as what mouse cursor to use, when hovered.
         */
        set state(state) {
            if (this._state === state) {
                return;
            }
            this.el.classList.toggle('disabled', state === 0 /* SashState.Disabled */);
            this.el.classList.toggle('minimum', state === 1 /* SashState.AtMinimum */);
            this.el.classList.toggle('maximum', state === 2 /* SashState.AtMaximum */);
            this._state = state;
            this.onDidEnablementChange.fire(state);
        }
        /**
         * A reference to another sash, perpendicular to this one, which
         * aligns at the start of this one. A corner sash will be created
         * automatically at that location.
         *
         * The start of a horizontal sash is its left-most position.
         * The start of a vertical sash is its top-most position.
         */
        set orthogonalStartSash(sash) {
            this.orthogonalStartDragHandleDisposables.clear();
            this.orthogonalStartSashDisposables.clear();
            if (sash) {
                const onChange = (state) => {
                    this.orthogonalStartDragHandleDisposables.clear();
                    if (state !== 0 /* SashState.Disabled */) {
                        this._orthogonalStartDragHandle = (0, dom_1.append)(this.el, (0, dom_1.$)('.orthogonal-drag-handle.start'));
                        this.orthogonalStartDragHandleDisposables.add((0, lifecycle_1.toDisposable)(() => this._orthogonalStartDragHandle.remove()));
                        this.orthogonalStartDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalStartDragHandle, 'mouseenter')).event(() => Sash.onMouseEnter(sash), undefined, this.orthogonalStartDragHandleDisposables);
                        this.orthogonalStartDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalStartDragHandle, 'mouseleave')).event(() => Sash.onMouseLeave(sash), undefined, this.orthogonalStartDragHandleDisposables);
                    }
                };
                this.orthogonalStartSashDisposables.add(sash.onDidEnablementChange.event(onChange, this));
                onChange(sash.state);
            }
            this._orthogonalStartSash = sash;
        }
        /**
         * A reference to another sash, perpendicular to this one, which
         * aligns at the end of this one. A corner sash will be created
         * automatically at that location.
         *
         * The end of a horizontal sash is its right-most position.
         * The end of a vertical sash is its bottom-most position.
         */
        set orthogonalEndSash(sash) {
            this.orthogonalEndDragHandleDisposables.clear();
            this.orthogonalEndSashDisposables.clear();
            if (sash) {
                const onChange = (state) => {
                    this.orthogonalEndDragHandleDisposables.clear();
                    if (state !== 0 /* SashState.Disabled */) {
                        this._orthogonalEndDragHandle = (0, dom_1.append)(this.el, (0, dom_1.$)('.orthogonal-drag-handle.end'));
                        this.orthogonalEndDragHandleDisposables.add((0, lifecycle_1.toDisposable)(() => this._orthogonalEndDragHandle.remove()));
                        this.orthogonalEndDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalEndDragHandle, 'mouseenter')).event(() => Sash.onMouseEnter(sash), undefined, this.orthogonalEndDragHandleDisposables);
                        this.orthogonalEndDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalEndDragHandle, 'mouseleave')).event(() => Sash.onMouseLeave(sash), undefined, this.orthogonalEndDragHandleDisposables);
                    }
                };
                this.orthogonalEndSashDisposables.add(sash.onDidEnablementChange.event(onChange, this));
                onChange(sash.state);
            }
            this._orthogonalEndSash = sash;
        }
        onPointerStart(event, pointerEventFactory) {
            dom_1.EventHelper.stop(event);
            let isMultisashResize = false;
            if (!event.__orthogonalSashEvent) {
                const orthogonalSash = this.getOrthogonalSash(event);
                if (orthogonalSash) {
                    isMultisashResize = true;
                    event.__orthogonalSashEvent = true;
                    orthogonalSash.onPointerStart(event, new OrthogonalPointerEventFactory(pointerEventFactory));
                }
            }
            if (this.linkedSash && !event.__linkedSashEvent) {
                event.__linkedSashEvent = true;
                this.linkedSash.onPointerStart(event, new OrthogonalPointerEventFactory(pointerEventFactory));
            }
            if (!this.state) {
                return;
            }
            const iframes = (0, dom_1.getElementsByTagName)('iframe');
            for (const iframe of iframes) {
                iframe.classList.add(PointerEventsDisabledCssClass); // disable mouse events on iframes as long as we drag the sash
            }
            const startX = event.pageX;
            const startY = event.pageY;
            const altKey = event.altKey;
            const startEvent = { startX, currentX: startX, startY, currentY: startY, altKey };
            this.el.classList.add('active');
            this._onDidStart.fire(startEvent);
            // fix https://github.com/microsoft/vscode/issues/21675
            const style = (0, dom_1.createStyleSheet)(this.el);
            const updateStyle = () => {
                let cursor = '';
                if (isMultisashResize) {
                    cursor = 'all-scroll';
                }
                else if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                    if (this.state === 1 /* SashState.AtMinimum */) {
                        cursor = 's-resize';
                    }
                    else if (this.state === 2 /* SashState.AtMaximum */) {
                        cursor = 'n-resize';
                    }
                    else {
                        cursor = platform_1.isMacintosh ? 'row-resize' : 'ns-resize';
                    }
                }
                else {
                    if (this.state === 1 /* SashState.AtMinimum */) {
                        cursor = 'e-resize';
                    }
                    else if (this.state === 2 /* SashState.AtMaximum */) {
                        cursor = 'w-resize';
                    }
                    else {
                        cursor = platform_1.isMacintosh ? 'col-resize' : 'ew-resize';
                    }
                }
                style.textContent = `* { cursor: ${cursor} !important; }`;
            };
            const disposables = new lifecycle_1.DisposableStore();
            updateStyle();
            if (!isMultisashResize) {
                this.onDidEnablementChange.event(updateStyle, null, disposables);
            }
            const onPointerMove = (e) => {
                dom_1.EventHelper.stop(e, false);
                const event = { startX, currentX: e.pageX, startY, currentY: e.pageY, altKey };
                this._onDidChange.fire(event);
            };
            const onPointerUp = (e) => {
                dom_1.EventHelper.stop(e, false);
                this.el.removeChild(style);
                this.el.classList.remove('active');
                this._onDidEnd.fire();
                disposables.dispose();
                for (const iframe of iframes) {
                    iframe.classList.remove(PointerEventsDisabledCssClass);
                }
            };
            pointerEventFactory.onPointerMove(onPointerMove, null, disposables);
            pointerEventFactory.onPointerUp(onPointerUp, null, disposables);
            disposables.add(pointerEventFactory);
        }
        onPointerDoublePress(e) {
            const orthogonalSash = this.getOrthogonalSash(e);
            if (orthogonalSash) {
                orthogonalSash._onDidReset.fire();
            }
            if (this.linkedSash) {
                this.linkedSash._onDidReset.fire();
            }
            this._onDidReset.fire();
        }
        static onMouseEnter(sash, fromLinkedSash = false) {
            if (sash.el.classList.contains('active')) {
                sash.hoverDelayer.cancel();
                sash.el.classList.add('hover');
            }
            else {
                sash.hoverDelayer.trigger(() => sash.el.classList.add('hover'), sash.hoverDelay).then(undefined, () => { });
            }
            if (!fromLinkedSash && sash.linkedSash) {
                Sash.onMouseEnter(sash.linkedSash, true);
            }
        }
        static onMouseLeave(sash, fromLinkedSash = false) {
            sash.hoverDelayer.cancel();
            sash.el.classList.remove('hover');
            if (!fromLinkedSash && sash.linkedSash) {
                Sash.onMouseLeave(sash.linkedSash, true);
            }
        }
        /**
         * Forcefully stop any user interactions with this sash.
         * Useful when hiding a parent component, while the user is still
         * interacting with the sash.
         */
        clearSashHoverState() {
            Sash.onMouseLeave(this);
        }
        /**
         * Layout the sash. The sash will size and position itself
         * based on its provided {@link ISashLayoutProvider layout provider}.
         */
        layout() {
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                const verticalProvider = this.layoutProvider;
                this.el.style.left = verticalProvider.getVerticalSashLeft(this) - (this.size / 2) + 'px';
                if (verticalProvider.getVerticalSashTop) {
                    this.el.style.top = verticalProvider.getVerticalSashTop(this) + 'px';
                }
                if (verticalProvider.getVerticalSashHeight) {
                    this.el.style.height = verticalProvider.getVerticalSashHeight(this) + 'px';
                }
            }
            else {
                const horizontalProvider = this.layoutProvider;
                this.el.style.top = horizontalProvider.getHorizontalSashTop(this) - (this.size / 2) + 'px';
                if (horizontalProvider.getHorizontalSashLeft) {
                    this.el.style.left = horizontalProvider.getHorizontalSashLeft(this) + 'px';
                }
                if (horizontalProvider.getHorizontalSashWidth) {
                    this.el.style.width = horizontalProvider.getHorizontalSashWidth(this) + 'px';
                }
            }
        }
        getOrthogonalSash(e) {
            if (!e.target || !(e.target instanceof HTMLElement)) {
                return undefined;
            }
            if (e.target.classList.contains('orthogonal-drag-handle')) {
                return e.target.classList.contains('start') ? this.orthogonalStartSash : this.orthogonalEndSash;
            }
            return undefined;
        }
        dispose() {
            super.dispose();
            this.el.remove();
        }
    }
    exports.Sash = Sash;
});
//# sourceMappingURL=sash.js.map