/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/event", "vs/base/common/arrays"], function (require, exports, lifecycle_1, dom_1, scrollableElement_1, event_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GettingStartedIndexList = void 0;
    class GettingStartedIndexList extends lifecycle_1.Disposable {
        constructor(options) {
            super();
            this.options = options;
            this._onDidChangeEntries = new event_1.Emitter();
            this.onDidChangeEntries = this._onDidChangeEntries.event;
            this.isDisposed = false;
            this.contextKeysToWatch = new Set();
            this.contextService = options.contextService;
            this.entries = undefined;
            this.itemCount = 0;
            this.list = (0, dom_1.$)('ul');
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.list, {}));
            this._register(this.onDidChangeEntries(() => this.scrollbar.scanDomNode()));
            this.domElement = (0, dom_1.$)('.index-list.' + options.klass, {}, (0, dom_1.$)('h2', {}, options.title), this.scrollbar.getDomNode());
            this._register(this.contextService.onDidChangeContext(e => {
                if (e.affectsSome(this.contextKeysToWatch)) {
                    this.rerender();
                }
            }));
        }
        getDomElement() {
            return this.domElement;
        }
        layout(size) {
            this.scrollbar.scanDomNode();
        }
        onDidChange(listener) {
            this._register(this.onDidChangeEntries(listener));
        }
        register(d) { if (this.isDisposed) {
            d.dispose();
        }
        else {
            this._register(d);
        } }
        dispose() {
            this.isDisposed = true;
            super.dispose();
        }
        setLimit(limit) {
            this.options.limit = limit;
            this.setEntries(this.entries);
        }
        rerender() {
            this.setEntries(this.entries);
        }
        setEntries(entries) {
            let entryList = entries !== null && entries !== void 0 ? entries : [];
            this.itemCount = 0;
            const ranker = this.options.rankElement;
            if (ranker) {
                entryList = entryList.filter(e => ranker(e) !== null);
                entryList.sort((a, b) => ranker(b) - ranker(a));
            }
            const activeEntries = entryList.filter(e => !e.when || this.contextService.contextMatchesRules(e.when));
            const limitedEntries = activeEntries.slice(0, this.options.limit);
            const toRender = limitedEntries.map(e => e.id);
            if (this.entries === entries && (0, arrays_1.equals)(toRender, this.lastRendered)) {
                return;
            }
            this.entries = entries;
            this.contextKeysToWatch.clear();
            entryList.forEach(e => {
                var _a;
                const keys = (_a = e.when) === null || _a === void 0 ? void 0 : _a.keys();
                if (keys) {
                    keys.forEach(key => this.contextKeysToWatch.add(key));
                }
            });
            this.lastRendered = toRender;
            this.itemCount = limitedEntries.length;
            while (this.list.firstChild) {
                this.list.removeChild(this.list.firstChild);
            }
            this.itemCount = limitedEntries.length;
            for (const entry of limitedEntries) {
                const rendered = this.options.renderElement(entry);
                this.list.appendChild(rendered);
            }
            if (activeEntries.length > limitedEntries.length && this.options.more) {
                this.list.appendChild(this.options.more);
            }
            else if (entries !== undefined && this.itemCount === 0 && this.options.empty) {
                this.list.appendChild(this.options.empty);
            }
            else if (this.options.footer) {
                this.list.appendChild(this.options.footer);
            }
            this._onDidChangeEntries.fire();
        }
    }
    exports.GettingStartedIndexList = GettingStartedIndexList;
});
//# sourceMappingURL=gettingStartedList.js.map