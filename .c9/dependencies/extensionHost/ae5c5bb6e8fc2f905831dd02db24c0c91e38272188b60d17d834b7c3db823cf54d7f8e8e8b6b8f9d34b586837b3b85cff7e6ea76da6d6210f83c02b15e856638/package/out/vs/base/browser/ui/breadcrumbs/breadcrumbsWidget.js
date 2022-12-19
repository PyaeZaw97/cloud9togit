/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/css!./breadcrumbsWidget"], function (require, exports, dom, scrollableElement_1, arrays_1, codicons_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsWidget = exports.BreadcrumbsItem = void 0;
    class BreadcrumbsItem {
        dispose() { }
    }
    exports.BreadcrumbsItem = BreadcrumbsItem;
    class BreadcrumbsWidget {
        constructor(container, horizontalScrollbarSize, separatorIcon) {
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidSelectItem = new event_1.Emitter();
            this._onDidFocusItem = new event_1.Emitter();
            this._onDidChangeFocus = new event_1.Emitter();
            this.onDidSelectItem = this._onDidSelectItem.event;
            this.onDidFocusItem = this._onDidFocusItem.event;
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._items = new Array();
            this._nodes = new Array();
            this._freeNodes = new Array();
            this._enabled = true;
            this._focusedItemIdx = -1;
            this._selectedItemIdx = -1;
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-breadcrumbs';
            this._domNode.tabIndex = 0;
            this._domNode.setAttribute('role', 'list');
            this._scrollable = new scrollableElement_1.DomScrollableElement(this._domNode, {
                vertical: 2 /* ScrollbarVisibility.Hidden */,
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                horizontalScrollbarSize,
                useShadows: false,
                scrollYToX: true
            });
            this._separatorIcon = separatorIcon;
            this._disposables.add(this._scrollable);
            this._disposables.add(dom.addStandardDisposableListener(this._domNode, 'click', e => this._onClick(e)));
            container.appendChild(this._scrollable.getDomNode());
            this._styleElement = dom.createStyleSheet(this._domNode);
            const focusTracker = dom.trackFocus(this._domNode);
            this._disposables.add(focusTracker);
            this._disposables.add(focusTracker.onDidBlur(_ => this._onDidChangeFocus.fire(false)));
            this._disposables.add(focusTracker.onDidFocus(_ => this._onDidChangeFocus.fire(true)));
        }
        setHorizontalScrollbarSize(size) {
            this._scrollable.updateOptions({
                horizontalScrollbarSize: size
            });
        }
        dispose() {
            var _a;
            this._disposables.dispose();
            (_a = this._pendingLayout) === null || _a === void 0 ? void 0 : _a.dispose();
            this._onDidSelectItem.dispose();
            this._onDidFocusItem.dispose();
            this._onDidChangeFocus.dispose();
            this._domNode.remove();
            this._nodes.length = 0;
            this._freeNodes.length = 0;
        }
        layout(dim) {
            var _a;
            if (dim && dom.Dimension.equals(dim, this._dimension)) {
                return;
            }
            (_a = this._pendingLayout) === null || _a === void 0 ? void 0 : _a.dispose();
            if (dim) {
                // only measure
                this._pendingLayout = this._updateDimensions(dim);
            }
            else {
                this._pendingLayout = this._updateScrollbar();
            }
        }
        _updateDimensions(dim) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(dom.modify(() => {
                this._dimension = dim;
                this._domNode.style.width = `${dim.width}px`;
                this._domNode.style.height = `${dim.height}px`;
                disposables.add(this._updateScrollbar());
            }));
            return disposables;
        }
        _updateScrollbar() {
            return dom.measure(() => {
                dom.measure(() => {
                    this._scrollable.setRevealOnScroll(false);
                    this._scrollable.scanDomNode();
                    this._scrollable.setRevealOnScroll(true);
                });
            });
        }
        style(style) {
            let content = '';
            if (style.breadcrumbsBackground) {
                content += `.monaco-breadcrumbs { background-color: ${style.breadcrumbsBackground}}`;
            }
            if (style.breadcrumbsForeground) {
                content += `.monaco-breadcrumbs .monaco-breadcrumb-item { color: ${style.breadcrumbsForeground}}\n`;
            }
            if (style.breadcrumbsFocusForeground) {
                content += `.monaco-breadcrumbs .monaco-breadcrumb-item.focused { color: ${style.breadcrumbsFocusForeground}}\n`;
            }
            if (style.breadcrumbsFocusAndSelectionForeground) {
                content += `.monaco-breadcrumbs .monaco-breadcrumb-item.focused.selected { color: ${style.breadcrumbsFocusAndSelectionForeground}}\n`;
            }
            if (style.breadcrumbsHoverForeground) {
                content += `.monaco-breadcrumbs:not(.disabled	) .monaco-breadcrumb-item:hover:not(.focused):not(.selected) { color: ${style.breadcrumbsHoverForeground}}\n`;
            }
            if (this._styleElement.innerText !== content) {
                this._styleElement.innerText = content;
            }
        }
        setEnabled(value) {
            this._enabled = value;
            this._domNode.classList.toggle('disabled', !this._enabled);
        }
        domFocus() {
            let idx = this._focusedItemIdx >= 0 ? this._focusedItemIdx : this._items.length - 1;
            if (idx >= 0 && idx < this._items.length) {
                this._focus(idx, undefined);
            }
            else {
                this._domNode.focus();
            }
        }
        isDOMFocused() {
            let candidate = document.activeElement;
            while (candidate) {
                if (this._domNode === candidate) {
                    return true;
                }
                candidate = candidate.parentElement;
            }
            return false;
        }
        getFocused() {
            return this._items[this._focusedItemIdx];
        }
        setFocused(item, payload) {
            this._focus(this._items.indexOf(item), payload);
        }
        focusPrev(payload) {
            if (this._focusedItemIdx > 0) {
                this._focus(this._focusedItemIdx - 1, payload);
            }
        }
        focusNext(payload) {
            if (this._focusedItemIdx + 1 < this._nodes.length) {
                this._focus(this._focusedItemIdx + 1, payload);
            }
        }
        _focus(nth, payload) {
            this._focusedItemIdx = -1;
            for (let i = 0; i < this._nodes.length; i++) {
                const node = this._nodes[i];
                if (i !== nth) {
                    node.classList.remove('focused');
                }
                else {
                    this._focusedItemIdx = i;
                    node.classList.add('focused');
                    node.focus();
                }
            }
            this._reveal(this._focusedItemIdx, true);
            this._onDidFocusItem.fire({ type: 'focus', item: this._items[this._focusedItemIdx], node: this._nodes[this._focusedItemIdx], payload });
        }
        reveal(item) {
            let idx = this._items.indexOf(item);
            if (idx >= 0) {
                this._reveal(idx, false);
            }
        }
        _reveal(nth, minimal) {
            const node = this._nodes[nth];
            if (node) {
                const { width } = this._scrollable.getScrollDimensions();
                const { scrollLeft } = this._scrollable.getScrollPosition();
                if (!minimal || node.offsetLeft > scrollLeft + width || node.offsetLeft < scrollLeft) {
                    this._scrollable.setRevealOnScroll(false);
                    this._scrollable.setScrollPosition({ scrollLeft: node.offsetLeft });
                    this._scrollable.setRevealOnScroll(true);
                }
            }
        }
        getSelection() {
            return this._items[this._selectedItemIdx];
        }
        setSelection(item, payload) {
            this._select(this._items.indexOf(item), payload);
        }
        _select(nth, payload) {
            this._selectedItemIdx = -1;
            for (let i = 0; i < this._nodes.length; i++) {
                const node = this._nodes[i];
                if (i !== nth) {
                    node.classList.remove('selected');
                }
                else {
                    this._selectedItemIdx = i;
                    node.classList.add('selected');
                }
            }
            this._onDidSelectItem.fire({ type: 'select', item: this._items[this._selectedItemIdx], node: this._nodes[this._selectedItemIdx], payload });
        }
        getItems() {
            return this._items;
        }
        setItems(items) {
            let prefix;
            let removed = [];
            try {
                prefix = (0, arrays_1.commonPrefixLength)(this._items, items, (a, b) => a.equals(b));
                removed = this._items.splice(prefix, this._items.length - prefix, ...items.slice(prefix));
                this._render(prefix);
                (0, lifecycle_1.dispose)(removed);
                this._focus(-1, undefined);
            }
            catch (e) {
                let newError = new Error(`BreadcrumbsItem#setItems: newItems: ${items.length}, prefix: ${prefix}, removed: ${removed.length}`);
                newError.name = e.name;
                newError.stack = e.stack;
                throw newError;
            }
        }
        _render(start) {
            let didChange = false;
            for (; start < this._items.length && start < this._nodes.length; start++) {
                let item = this._items[start];
                let node = this._nodes[start];
                this._renderItem(item, node);
                didChange = true;
            }
            // case a: more nodes -> remove them
            while (start < this._nodes.length) {
                const free = this._nodes.pop();
                if (free) {
                    this._freeNodes.push(free);
                    free.remove();
                    didChange = true;
                }
            }
            // case b: more items -> render them
            for (; start < this._items.length; start++) {
                let item = this._items[start];
                let node = this._freeNodes.length > 0 ? this._freeNodes.pop() : document.createElement('div');
                if (node) {
                    this._renderItem(item, node);
                    this._domNode.appendChild(node);
                    this._nodes.push(node);
                    didChange = true;
                }
            }
            if (didChange) {
                this.layout(undefined);
            }
        }
        _renderItem(item, container) {
            dom.clearNode(container);
            container.className = '';
            try {
                item.render(container);
            }
            catch (err) {
                container.innerText = '<<RENDER ERROR>>';
                console.error(err);
            }
            container.tabIndex = -1;
            container.setAttribute('role', 'listitem');
            container.classList.add('monaco-breadcrumb-item');
            const iconContainer = dom.$(codicons_1.CSSIcon.asCSSSelector(this._separatorIcon));
            container.appendChild(iconContainer);
        }
        _onClick(event) {
            if (!this._enabled) {
                return;
            }
            for (let el = event.target; el; el = el.parentElement) {
                let idx = this._nodes.indexOf(el);
                if (idx >= 0) {
                    this._focus(idx, event);
                    this._select(idx, event);
                    break;
                }
            }
        }
    }
    exports.BreadcrumbsWidget = BreadcrumbsWidget;
});
//# sourceMappingURL=breadcrumbsWidget.js.map