/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/common/actions", "vs/base/common/event", "vs/css!./dropdown"], function (require, exports, dom_1, keyboardEvent_1, touch_1, actions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropdownMenu = exports.Dropdown = exports.BaseDropdown = void 0;
    class BaseDropdown extends actions_1.ActionRunner {
        constructor(container, options) {
            super();
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._element = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-dropdown'));
            this._label = (0, dom_1.append)(this._element, (0, dom_1.$)('.dropdown-label'));
            let labelRenderer = options.labelRenderer;
            if (!labelRenderer) {
                labelRenderer = (container) => {
                    container.textContent = options.label || '';
                    return null;
                };
            }
            for (const event of [dom_1.EventType.CLICK, dom_1.EventType.MOUSE_DOWN, touch_1.EventType.Tap]) {
                this._register((0, dom_1.addDisposableListener)(this.element, event, e => dom_1.EventHelper.stop(e, true))); // prevent default click behaviour to trigger
            }
            for (const event of [dom_1.EventType.MOUSE_DOWN, touch_1.EventType.Tap]) {
                this._register((0, dom_1.addDisposableListener)(this._label, event, e => {
                    if (e instanceof MouseEvent && e.detail > 1) {
                        return; // prevent multiple clicks to open multiple context menus (https://github.com/microsoft/vscode/issues/41363)
                    }
                    if (this.visible) {
                        this.hide();
                    }
                    else {
                        this.show();
                    }
                }));
            }
            this._register((0, dom_1.addDisposableListener)(this._label, dom_1.EventType.KEY_UP, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    dom_1.EventHelper.stop(e, true); // https://github.com/microsoft/vscode/issues/57997
                    if (this.visible) {
                        this.hide();
                    }
                    else {
                        this.show();
                    }
                }
            }));
            const cleanupFn = labelRenderer(this._label);
            if (cleanupFn) {
                this._register(cleanupFn);
            }
            this._register(touch_1.Gesture.addTarget(this._label));
        }
        get element() {
            return this._element;
        }
        get label() {
            return this._label;
        }
        set tooltip(tooltip) {
            if (this._label) {
                this._label.title = tooltip;
            }
        }
        show() {
            if (!this.visible) {
                this.visible = true;
                this._onDidChangeVisibility.fire(true);
            }
        }
        hide() {
            if (this.visible) {
                this.visible = false;
                this._onDidChangeVisibility.fire(false);
            }
        }
        isVisible() {
            return !!this.visible;
        }
        onEvent(_e, activeElement) {
            this.hide();
        }
        dispose() {
            super.dispose();
            this.hide();
            if (this.boxContainer) {
                this.boxContainer.remove();
                this.boxContainer = undefined;
            }
            if (this.contents) {
                this.contents.remove();
                this.contents = undefined;
            }
            if (this._label) {
                this._label.remove();
                this._label = undefined;
            }
        }
    }
    exports.BaseDropdown = BaseDropdown;
    class Dropdown extends BaseDropdown {
        constructor(container, options) {
            super(container, options);
            this.contextViewProvider = options.contextViewProvider;
        }
        show() {
            super.show();
            this.element.classList.add('active');
            this.contextViewProvider.showContextView({
                getAnchor: () => this.getAnchor(),
                render: (container) => {
                    return this.renderContents(container);
                },
                onDOMEvent: (e, activeElement) => {
                    this.onEvent(e, activeElement);
                },
                onHide: () => this.onHide()
            });
        }
        getAnchor() {
            return this.element;
        }
        onHide() {
            this.element.classList.remove('active');
        }
        hide() {
            super.hide();
            if (this.contextViewProvider) {
                this.contextViewProvider.hideContextView();
            }
        }
        renderContents(container) {
            return null;
        }
    }
    exports.Dropdown = Dropdown;
    class DropdownMenu extends BaseDropdown {
        constructor(container, options) {
            super(container, options);
            this._actions = [];
            this._contextMenuProvider = options.contextMenuProvider;
            this.actions = options.actions || [];
            this.actionProvider = options.actionProvider;
            this.menuClassName = options.menuClassName || '';
            this.menuAsChild = !!options.menuAsChild;
        }
        set menuOptions(options) {
            this._menuOptions = options;
        }
        get menuOptions() {
            return this._menuOptions;
        }
        get actions() {
            if (this.actionProvider) {
                return this.actionProvider.getActions();
            }
            return this._actions;
        }
        set actions(actions) {
            this._actions = actions;
        }
        show() {
            super.show();
            this.element.classList.add('active');
            this._contextMenuProvider.showContextMenu({
                getAnchor: () => this.element,
                getActions: () => this.actions,
                getActionsContext: () => this.menuOptions ? this.menuOptions.context : null,
                getActionViewItem: action => this.menuOptions && this.menuOptions.actionViewItemProvider ? this.menuOptions.actionViewItemProvider(action) : undefined,
                getKeyBinding: action => this.menuOptions && this.menuOptions.getKeyBinding ? this.menuOptions.getKeyBinding(action) : undefined,
                getMenuClassName: () => this.menuClassName,
                onHide: () => this.onHide(),
                actionRunner: this.menuOptions ? this.menuOptions.actionRunner : undefined,
                anchorAlignment: this.menuOptions ? this.menuOptions.anchorAlignment : 0 /* AnchorAlignment.LEFT */,
                domForShadowRoot: this.menuAsChild ? this.element : undefined
            });
        }
        hide() {
            super.hide();
        }
        onHide() {
            this.hide();
            this.element.classList.remove('active');
        }
    }
    exports.DropdownMenu = DropdownMenu;
});
//# sourceMappingURL=dropdown.js.map