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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/registry/common/platform", "vs/platform/theme/common/themeService", "vs/workbench/common/contributions", "vs/workbench/common/theme", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/languageStatus/common/languageStatusService", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/linkedText", "vs/platform/opener/browser/link", "vs/platform/opener/common/opener", "vs/base/common/htmlContent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/platform/storage/common/storage", "vs/base/common/arrays", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/css!./media/languageStatus"], function (require, exports, dom, iconLabels_1, lifecycle_1, severity_1, editorBrowser_1, nls_1, platform_1, themeService_1, contributions_1, theme_1, editorService_1, languageStatusService_1, statusbar_1, linkedText_1, link_1, opener_1, htmlContent_1, actionbar_1, actions_1, codicons_1, storage_1, arrays_1, uri_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LanguageStatusViewModel {
        constructor(combined, dedicated) {
            this.combined = combined;
            this.dedicated = dedicated;
        }
        isEqual(other) {
            return (0, arrays_1.equals)(this.combined, other.combined) && (0, arrays_1.equals)(this.dedicated, other.dedicated);
        }
    }
    let StoredCounter = class StoredCounter {
        constructor(_storageService, _key) {
            this._storageService = _storageService;
            this._key = _key;
        }
        get value() {
            return this._storageService.getNumber(this._key, 0 /* StorageScope.GLOBAL */, 0);
        }
        increment() {
            const n = this.value + 1;
            this._storageService.store(this._key, n, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            return n;
        }
    };
    StoredCounter = __decorate([
        __param(0, storage_1.IStorageService)
    ], StoredCounter);
    let EditorStatusContribution = class EditorStatusContribution {
        constructor(_languageStatusService, _statusBarService, _editorService, _openerService, _storageService) {
            this._languageStatusService = _languageStatusService;
            this._statusBarService = _statusBarService;
            this._editorService = _editorService;
            this._openerService = _openerService;
            this._storageService = _storageService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._dedicated = new Set();
            this._dedicatedEntries = new Map();
            this._renderDisposables = new lifecycle_1.DisposableStore();
            _storageService.onDidChangeValue(this._handleStorageChange, this, this._disposables);
            this._restoreState();
            this._interactionCounter = new StoredCounter(_storageService, 'languageStatus.interactCount');
            _languageStatusService.onDidChange(this._update, this, this._disposables);
            _editorService.onDidActiveEditorChange(this._update, this, this._disposables);
            this._update();
            _statusBarService.onDidChangeEntryVisibility(e => {
                if (!e.visible && this._dedicated.has(e.id)) {
                    this._dedicated.delete(e.id);
                    this._update();
                    this._storeState();
                }
            }, this._disposables);
        }
        dispose() {
            var _a;
            this._disposables.dispose();
            (_a = this._combinedEntry) === null || _a === void 0 ? void 0 : _a.dispose();
            (0, lifecycle_1.dispose)(this._dedicatedEntries.values());
            this._renderDisposables.dispose();
        }
        // --- persisting dedicated items
        _handleStorageChange(e) {
            if (e.key !== EditorStatusContribution._keyDedicatedItems) {
                return;
            }
            this._restoreState();
            this._update();
        }
        _restoreState() {
            const raw = this._storageService.get(EditorStatusContribution._keyDedicatedItems, 0 /* StorageScope.GLOBAL */, '[]');
            try {
                const ids = JSON.parse(raw);
                this._dedicated = new Set(ids);
            }
            catch (_a) {
                this._dedicated.clear();
            }
        }
        _storeState() {
            if (this._dedicated.size === 0) {
                this._storageService.remove(EditorStatusContribution._keyDedicatedItems, 0 /* StorageScope.GLOBAL */);
            }
            else {
                const raw = JSON.stringify(Array.from(this._dedicated.keys()));
                this._storageService.store(EditorStatusContribution._keyDedicatedItems, raw, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            }
        }
        // --- language status model and UI
        _createViewModel(editor) {
            if (!(editor === null || editor === void 0 ? void 0 : editor.hasModel())) {
                return new LanguageStatusViewModel([], []);
            }
            const all = this._languageStatusService.getLanguageStatus(editor.getModel());
            const combined = [];
            const dedicated = [];
            for (let item of all) {
                if (this._dedicated.has(item.id)) {
                    dedicated.push(item);
                }
                combined.push(item);
            }
            return new LanguageStatusViewModel(combined, dedicated);
        }
        _update() {
            var _a, _b;
            const editor = (0, editorBrowser_1.getCodeEditor)(this._editorService.activeTextEditorControl);
            const model = this._createViewModel(editor);
            if ((_a = this._model) === null || _a === void 0 ? void 0 : _a.isEqual(model)) {
                return;
            }
            this._renderDisposables.clear();
            this._model = model;
            // update when editor language changes
            editor === null || editor === void 0 ? void 0 : editor.onDidChangeModelLanguage(this._update, this, this._renderDisposables);
            // combined status bar item is a single item which hover shows
            // each status item
            if (model.combined.length === 0) {
                // nothing
                (_b = this._combinedEntry) === null || _b === void 0 ? void 0 : _b.dispose();
                this._combinedEntry = undefined;
            }
            else {
                const [first] = model.combined;
                const showSeverity = first.severity >= severity_1.default.Warning;
                const text = EditorStatusContribution._severityToComboCodicon(first.severity);
                let isOneBusy = false;
                const ariaLabels = [];
                const element = document.createElement('div');
                for (const status of model.combined) {
                    const isPinned = model.dedicated.includes(status);
                    element.appendChild(this._renderStatus(status, showSeverity, isPinned, this._renderDisposables));
                    ariaLabels.push(this._asAriaLabel(status));
                    isOneBusy = isOneBusy || (!isPinned && status.busy); // unpinned items contribute to the busy-indicator of the composite status item
                }
                const props = {
                    name: (0, nls_1.localize)('langStatus.name', "Editor Language Status"),
                    ariaLabel: (0, nls_1.localize)('langStatus.aria', "Editor Language Status: {0}", ariaLabels.join(', next: ')),
                    tooltip: element,
                    command: statusbar_1.ShowTooltipCommand,
                    text: isOneBusy ? `${text}\u00A0\u00A0$(sync~spin)` : text,
                };
                if (!this._combinedEntry) {
                    this._combinedEntry = this._statusBarService.addEntry(props, EditorStatusContribution._id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 0 /* StatusbarAlignment.LEFT */, compact: true });
                }
                else {
                    this._combinedEntry.update(props);
                }
                // animate the status bar icon whenever language status changes, repeat animation
                // when severity is warning or error, don't show animation when showing progress/busy
                const userHasInteractedWithStatus = this._interactionCounter.value >= 3;
                const node = document.querySelector('.monaco-workbench .statusbar DIV#status\\.languageStatus A>SPAN.codicon');
                const container = document.querySelector('.monaco-workbench .statusbar DIV#status\\.languageStatus');
                if (node instanceof HTMLElement && container) {
                    const _wiggle = 'wiggle';
                    const _flash = 'flash';
                    if (!isOneBusy) {
                        // wiggle icon when severe or "new"
                        node.classList.toggle(_wiggle, showSeverity || !userHasInteractedWithStatus);
                        this._renderDisposables.add(dom.addDisposableListener(node, 'animationend', _e => node.classList.remove(_wiggle)));
                        // flash background when severe
                        container.classList.toggle(_flash, showSeverity);
                        this._renderDisposables.add(dom.addDisposableListener(container, 'animationend', _e => container.classList.remove(_flash)));
                    }
                    else {
                        node.classList.remove(_wiggle);
                        container.classList.remove(_flash);
                    }
                }
                // track when the hover shows (this is automagic and DOM mutation spying is needed...)
                //  use that as signal that the user has interacted/learned language status items work
                if (!userHasInteractedWithStatus) {
                    const hoverTarget = document.querySelector('.monaco-workbench .context-view');
                    if (hoverTarget instanceof HTMLElement) {
                        const observer = new MutationObserver(() => {
                            if (document.contains(element)) {
                                this._interactionCounter.increment();
                                observer.disconnect();
                            }
                        });
                        observer.observe(hoverTarget, { childList: true, subtree: true });
                        this._renderDisposables.add((0, lifecycle_1.toDisposable)(() => observer.disconnect()));
                    }
                }
            }
            // dedicated status bar items are shows as-is in the status bar
            const newDedicatedEntries = new Map();
            for (const status of model.dedicated) {
                const props = EditorStatusContribution._asStatusbarEntry(status);
                let entry = this._dedicatedEntries.get(status.id);
                if (!entry) {
                    entry = this._statusBarService.addEntry(props, status.id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 1 /* StatusbarAlignment.RIGHT */ });
                }
                else {
                    entry.update(props);
                    this._dedicatedEntries.delete(status.id);
                }
                newDedicatedEntries.set(status.id, entry);
            }
            (0, lifecycle_1.dispose)(this._dedicatedEntries.values());
            this._dedicatedEntries = newDedicatedEntries;
        }
        _renderStatus(status, showSeverity, isPinned, store) {
            const parent = document.createElement('div');
            parent.classList.add('hover-language-status');
            const severity = document.createElement('div');
            severity.classList.add('severity', `sev${status.severity}`);
            severity.classList.toggle('show', showSeverity);
            const severityText = EditorStatusContribution._severityToSingleCodicon(status.severity);
            dom.append(severity, ...(0, iconLabels_1.renderLabelWithIcons)(severityText));
            parent.appendChild(severity);
            const element = document.createElement('div');
            element.classList.add('element');
            parent.appendChild(element);
            const left = document.createElement('div');
            left.classList.add('left');
            element.appendChild(left);
            const label = document.createElement('span');
            label.classList.add('label');
            dom.append(label, ...(0, iconLabels_1.renderLabelWithIcons)(status.busy ? `$(sync~spin)\u00A0\u00A0${status.label}` : status.label));
            left.appendChild(label);
            const detail = document.createElement('span');
            detail.classList.add('detail');
            this._renderTextPlus(detail, status.detail, store);
            left.appendChild(detail);
            const right = document.createElement('div');
            right.classList.add('right');
            element.appendChild(right);
            // -- command (if available)
            const { command } = status;
            if (command) {
                store.add(new link_1.Link(right, {
                    label: command.title,
                    title: command.tooltip,
                    href: uri_1.URI.from({
                        scheme: 'command', path: command.id, query: command.arguments && JSON.stringify(command.arguments)
                    }).toString()
                }, undefined, this._openerService));
            }
            // -- pin
            const actionBar = new actionbar_1.ActionBar(right, {});
            store.add(actionBar);
            let action;
            if (!isPinned) {
                action = new actions_1.Action('pin', (0, nls_1.localize)('pin', "Add to Status Bar"), codicons_1.Codicon.pin.classNames, true, () => {
                    this._dedicated.add(status.id);
                    this._statusBarService.updateEntryVisibility(status.id, true);
                    this._update();
                    this._storeState();
                });
            }
            else {
                action = new actions_1.Action('unpin', (0, nls_1.localize)('unpin', "Remove from Status Bar"), codicons_1.Codicon.pinned.classNames, true, () => {
                    this._dedicated.delete(status.id);
                    this._statusBarService.updateEntryVisibility(status.id, false);
                    this._update();
                    this._storeState();
                });
            }
            actionBar.push(action, { icon: true, label: false });
            store.add(action);
            return parent;
        }
        static _severityToComboCodicon(sev) {
            switch (sev) {
                case severity_1.default.Error: return '$(bracket-error)';
                case severity_1.default.Warning: return '$(bracket-dot)';
                default: return '$(bracket)';
            }
        }
        static _severityToSingleCodicon(sev) {
            switch (sev) {
                case severity_1.default.Error: return '$(error)';
                case severity_1.default.Warning: return '$(info)';
                default: return '$(check)';
            }
        }
        _renderTextPlus(target, text, store) {
            for (let node of (0, linkedText_1.parseLinkedText)(text).nodes) {
                if (typeof node === 'string') {
                    const parts = (0, iconLabels_1.renderLabelWithIcons)(node);
                    dom.append(target, ...parts);
                }
                else {
                    store.add(new link_1.Link(target, node, undefined, this._openerService));
                }
            }
        }
        _asAriaLabel(status) {
            if (status.accessibilityInfo) {
                return status.accessibilityInfo.label;
            }
            else if (status.detail) {
                return (0, nls_1.localize)('aria.1', '{0}, {1}', status.label, status.detail);
            }
            else {
                return (0, nls_1.localize)('aria.2', '{0}', status.label);
            }
        }
        // ---
        static _asStatusbarEntry(item) {
            var _a, _b, _c, _d;
            let color;
            let backgroundColor;
            if (item.severity === severity_1.default.Warning) {
                color = (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_WARNING_ITEM_FOREGROUND);
                backgroundColor = (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_WARNING_ITEM_BACKGROUND);
            }
            else if (item.severity === severity_1.default.Error) {
                color = (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_ERROR_ITEM_FOREGROUND);
                backgroundColor = (0, themeService_1.themeColorFromId)(theme_1.STATUS_BAR_ERROR_ITEM_BACKGROUND);
            }
            return {
                name: (0, nls_1.localize)('name.pattern', '{0} (Language Status)', item.name),
                text: item.busy ? `${item.label}\u00A0\u00A0$(sync~spin)` : item.label,
                ariaLabel: (_b = (_a = item.accessibilityInfo) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : item.label,
                role: (_c = item.accessibilityInfo) === null || _c === void 0 ? void 0 : _c.role,
                tooltip: ((_d = item.command) === null || _d === void 0 ? void 0 : _d.tooltip) || new htmlContent_1.MarkdownString(item.detail, { isTrusted: true, supportThemeIcons: true }),
                color,
                backgroundColor,
                command: item.command
            };
        }
    };
    EditorStatusContribution._id = 'status.languageStatus';
    EditorStatusContribution._keyDedicatedItems = 'languageStatus.dedicated';
    EditorStatusContribution = __decorate([
        __param(0, languageStatusService_1.ILanguageStatusService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, editorService_1.IEditorService),
        __param(3, opener_1.IOpenerService),
        __param(4, storage_1.IStorageService)
    ], EditorStatusContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(EditorStatusContribution, 3 /* LifecyclePhase.Restored */);
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.inlayHints.Reset',
                title: (0, nls_1.localize)('reset', 'Reset Language Status Interaction Counter'),
                category: (0, nls_1.localize)('cat', 'View'),
                f1: true
            });
        }
        run(accessor) {
            accessor.get(storage_1.IStorageService).remove('languageStatus.interactCount', 0 /* StorageScope.GLOBAL */);
        }
    });
});
//# sourceMappingURL=languageStatus.contribution.js.map