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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewIconManager", "vs/workbench/services/editor/common/editorService", "./webviewEditorInput"], function (require, exports, async_1, cancellation_1, decorators_1, errors_1, event_1, iterator_1, lifecycle_1, editor_1, instantiation_1, diffEditorInput_1, webview_1, webviewIconManager_1, editorService_1, webviewEditorInput_1) {
    "use strict";
    var _LazilyResolvedWebviewEditorInput_resolved, _LazilyResolvedWebviewEditorInput_resolvePromise;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditorService = exports.LazilyResolvedWebviewEditorInput = exports.IWebviewWorkbenchService = void 0;
    exports.IWebviewWorkbenchService = (0, instantiation_1.createDecorator)('webviewEditorService');
    function canRevive(reviver, webview) {
        return reviver.canResolve(webview);
    }
    let LazilyResolvedWebviewEditorInput = class LazilyResolvedWebviewEditorInput extends webviewEditorInput_1.WebviewInput {
        constructor(id, viewType, name, webview, _webviewWorkbenchService) {
            super(id, viewType, name, webview, _webviewWorkbenchService.iconManager);
            this._webviewWorkbenchService = _webviewWorkbenchService;
            _LazilyResolvedWebviewEditorInput_resolved.set(this, false);
            _LazilyResolvedWebviewEditorInput_resolvePromise.set(this, void 0);
        }
        dispose() {
            var _a;
            super.dispose();
            (_a = __classPrivateFieldGet(this, _LazilyResolvedWebviewEditorInput_resolvePromise, "f")) === null || _a === void 0 ? void 0 : _a.cancel();
            __classPrivateFieldSet(this, _LazilyResolvedWebviewEditorInput_resolvePromise, undefined, "f");
        }
        async resolve() {
            if (!__classPrivateFieldGet(this, _LazilyResolvedWebviewEditorInput_resolved, "f")) {
                __classPrivateFieldSet(this, _LazilyResolvedWebviewEditorInput_resolved, true, "f");
                __classPrivateFieldSet(this, _LazilyResolvedWebviewEditorInput_resolvePromise, this._webviewWorkbenchService.resolveWebview(this), "f");
                try {
                    await __classPrivateFieldGet(this, _LazilyResolvedWebviewEditorInput_resolvePromise, "f");
                }
                catch (e) {
                    if (!(0, errors_1.isCancellationError)(e)) {
                        throw e;
                    }
                }
            }
            return super.resolve();
        }
        transfer(other) {
            if (!super.transfer(other)) {
                return;
            }
            __classPrivateFieldSet(other, _LazilyResolvedWebviewEditorInput_resolved, __classPrivateFieldGet(this, _LazilyResolvedWebviewEditorInput_resolved, "f"), "f");
            return other;
        }
    };
    _LazilyResolvedWebviewEditorInput_resolved = new WeakMap(), _LazilyResolvedWebviewEditorInput_resolvePromise = new WeakMap();
    __decorate([
        decorators_1.memoize
    ], LazilyResolvedWebviewEditorInput.prototype, "resolve", null);
    LazilyResolvedWebviewEditorInput = __decorate([
        __param(4, exports.IWebviewWorkbenchService)
    ], LazilyResolvedWebviewEditorInput);
    exports.LazilyResolvedWebviewEditorInput = LazilyResolvedWebviewEditorInput;
    class RevivalPool {
        constructor() {
            this._awaitingRevival = [];
        }
        add(input, resolve) {
            this._awaitingRevival.push({ input, resolve });
        }
        reviveFor(reviver, cancellation) {
            const toRevive = this._awaitingRevival.filter(({ input }) => canRevive(reviver, input));
            this._awaitingRevival = this._awaitingRevival.filter(({ input }) => !canRevive(reviver, input));
            for (const { input, resolve } of toRevive) {
                reviver.resolveWebview(input, cancellation).then(resolve);
            }
        }
    }
    let WebviewEditorService = class WebviewEditorService extends lifecycle_1.Disposable {
        constructor(_editorService, _instantiationService, _webviewService) {
            super();
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._webviewService = _webviewService;
            this._revivers = new Set();
            this._revivalPool = new RevivalPool();
            this._onDidChangeActiveWebviewEditor = this._register(new event_1.Emitter());
            this.onDidChangeActiveWebviewEditor = this._onDidChangeActiveWebviewEditor.event;
            this._iconManager = this._register(this._instantiationService.createInstance(webviewIconManager_1.WebviewIconManager));
            this._register(_editorService.onDidActiveEditorChange(() => {
                this.updateActiveWebview();
            }));
            // The user may have switched focus between two sides of a diff editor
            this._register(_webviewService.onDidChangeActiveWebview(() => {
                this.updateActiveWebview();
            }));
            this.updateActiveWebview();
        }
        get iconManager() {
            return this._iconManager;
        }
        updateActiveWebview() {
            const activeInput = this._editorService.activeEditor;
            let newActiveWebview;
            if (activeInput instanceof webviewEditorInput_1.WebviewInput) {
                newActiveWebview = activeInput;
            }
            else if (activeInput instanceof diffEditorInput_1.DiffEditorInput) {
                if (activeInput.primary instanceof webviewEditorInput_1.WebviewInput && activeInput.primary.webview === this._webviewService.activeWebview) {
                    newActiveWebview = activeInput.primary;
                }
                else if (activeInput.secondary instanceof webviewEditorInput_1.WebviewInput && activeInput.secondary.webview === this._webviewService.activeWebview) {
                    newActiveWebview = activeInput.secondary;
                }
            }
            if (newActiveWebview !== this._activeWebview) {
                this._activeWebview = newActiveWebview;
                this._onDidChangeActiveWebviewEditor.fire(newActiveWebview);
            }
        }
        createWebview(id, viewType, title, showOptions, webviewOptions, contentOptions, extension) {
            const webview = this._webviewService.createWebviewOverlay(id, webviewOptions, contentOptions, extension);
            const webviewInput = this._instantiationService.createInstance(webviewEditorInput_1.WebviewInput, id, viewType, title, webview, this.iconManager);
            this._editorService.openEditor(webviewInput, {
                pinned: true,
                preserveFocus: showOptions.preserveFocus,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: showOptions.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
            }, showOptions.group);
            return webviewInput;
        }
        revealWebview(webview, group, preserveFocus) {
            const topLevelEditor = this.findTopLevelEditorForWebview(webview);
            this._editorService.openEditor(topLevelEditor, {
                preserveFocus,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
            }, group);
        }
        findTopLevelEditorForWebview(webview) {
            for (const editor of this._editorService.editors) {
                if (editor === webview) {
                    return editor;
                }
                if (editor instanceof diffEditorInput_1.DiffEditorInput) {
                    if (webview === editor.primary || webview === editor.secondary) {
                        return editor;
                    }
                }
            }
            return webview;
        }
        reviveWebview(options) {
            const webview = this._webviewService.createWebviewOverlay(options.id, options.webviewOptions, options.contentOptions, options.extension);
            webview.state = options.state;
            const webviewInput = this._instantiationService.createInstance(LazilyResolvedWebviewEditorInput, options.id, options.viewType, options.title, webview);
            webviewInput.iconPath = options.iconPath;
            if (typeof options.group === 'number') {
                webviewInput.updateGroup(options.group);
            }
            return webviewInput;
        }
        registerResolver(reviver) {
            this._revivers.add(reviver);
            const cts = new cancellation_1.CancellationTokenSource();
            this._revivalPool.reviveFor(reviver, cts.token);
            return (0, lifecycle_1.toDisposable)(() => {
                this._revivers.delete(reviver);
                cts.dispose(true);
            });
        }
        shouldPersist(webview) {
            // Revived webviews may not have an actively registered reviver but we still want to presist them
            // since a reviver should exist when it is actually needed.
            if (webview instanceof LazilyResolvedWebviewEditorInput) {
                return true;
            }
            return iterator_1.Iterable.some(this._revivers.values(), reviver => canRevive(reviver, webview));
        }
        async tryRevive(webview, cancellation) {
            for (const reviver of this._revivers.values()) {
                if (canRevive(reviver, webview)) {
                    await reviver.resolveWebview(webview, cancellation);
                    return true;
                }
            }
            return false;
        }
        resolveWebview(webview) {
            return (0, async_1.createCancelablePromise)(async (cancellation) => {
                const didRevive = await this.tryRevive(webview, cancellation);
                if (!didRevive) {
                    // A reviver may not be registered yet. Put into pool and resolve promise when we can revive
                    let resolve;
                    const promise = new Promise(r => { resolve = r; });
                    this._revivalPool.add(webview, resolve);
                    return promise;
                }
            });
        }
        setIcons(id, iconPath) {
            this._iconManager.setIcons(id, iconPath);
        }
    };
    WebviewEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, webview_1.IWebviewService)
    ], WebviewEditorService);
    exports.WebviewEditorService = WebviewEditorService;
});
//# sourceMappingURL=webviewWorkbenchService.js.map