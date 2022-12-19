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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/inlayHints/browser/inlayHints", "vs/editor/contrib/inlayHints/browser/inlayHintsController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/browser/link", "vs/workbench/contrib/audioCues/browser/audioCueService"], function (require, exports, dom, cancellation_1, lifecycle_1, editorExtensions_1, editorContextKeys_1, inlayHints_1, inlayHintsController_1, nls_1, actions_1, contextkey_1, instantiation_1, link_1, audioCueService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsAccessibility = void 0;
    let InlayHintsAccessibility = class InlayHintsAccessibility {
        constructor(_editor, contextKeyService, _audioCueService, _instaService) {
            this._editor = _editor;
            this._audioCueService = _audioCueService;
            this._instaService = _instaService;
            this._sessionDispoosables = new lifecycle_1.DisposableStore();
            this._ariaElement = document.createElement('span');
            this._ariaElement.style.position = 'fixed';
            this._ariaElement.className = 'inlayhint-accessibility-element';
            this._ariaElement.tabIndex = 0;
            this._ariaElement.setAttribute('aria-description', (0, nls_1.localize)('description', "Code with Inlay Hint Information"));
            this._ctxIsReading = InlayHintsAccessibility.IsReading.bindTo(contextKeyService);
        }
        static get(editor) {
            var _a;
            return (_a = editor.getContribution(InlayHintsAccessibility.ID)) !== null && _a !== void 0 ? _a : undefined;
        }
        dispose() {
            this._sessionDispoosables.dispose();
            this._ctxIsReading.reset();
            this._ariaElement.remove();
        }
        _reset() {
            dom.clearNode(this._ariaElement);
            this._sessionDispoosables.clear();
            this._ctxIsReading.reset();
        }
        async _read(line, hints) {
            var _a;
            this._sessionDispoosables.clear();
            if (!this._ariaElement.isConnected) {
                (_a = this._editor.getDomNode()) === null || _a === void 0 ? void 0 : _a.appendChild(this._ariaElement);
            }
            if (!this._editor.hasModel() || !this._ariaElement.isConnected) {
                this._ctxIsReading.set(false);
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            this._sessionDispoosables.add(cts);
            for (let hint of hints) {
                await hint.resolve(cts.token);
            }
            if (cts.token.isCancellationRequested) {
                return;
            }
            const model = this._editor.getModel();
            // const text = this._editor.getModel().getLineContent(line);
            const newChildren = [];
            let start = 0;
            let tooLongToRead = false;
            for (const item of hints) {
                // text
                const part = model.getValueInRange({ startLineNumber: line, startColumn: start + 1, endLineNumber: line, endColumn: item.hint.position.column });
                if (part.length > 0) {
                    newChildren.push(part);
                    start = item.hint.position.column - 1;
                }
                // check length
                if (start > 750) {
                    newChildren.push('…');
                    tooLongToRead = true;
                    break;
                }
                // hint
                const em = document.createElement('em');
                const { label } = item.hint;
                if (typeof label === 'string') {
                    em.innerText = label;
                }
                else {
                    for (let part of label) {
                        if (part.command) {
                            const link = this._instaService.createInstance(link_1.Link, em, { href: (0, inlayHints_1.asCommandLink)(part.command), label: part.label, title: part.command.title }, undefined);
                            this._sessionDispoosables.add(link);
                        }
                        else {
                            em.innerText += part.label;
                        }
                    }
                }
                newChildren.push(em);
            }
            // trailing text
            if (!tooLongToRead) {
                newChildren.push(model.getValueInRange({ startLineNumber: line, startColumn: start + 1, endLineNumber: line, endColumn: Number.MAX_SAFE_INTEGER }));
            }
            dom.reset(this._ariaElement, ...newChildren);
            this._ariaElement.focus();
            this._ctxIsReading.set(true);
            // reset on blur
            this._sessionDispoosables.add(dom.addDisposableListener(this._ariaElement, 'focusout', () => {
                this._reset();
            }));
        }
        startInlayHintsReading() {
            var _a;
            if (!this._editor.hasModel()) {
                return;
            }
            const line = this._editor.getPosition().lineNumber;
            const hints = (_a = inlayHintsController_1.InlayHintsController.get(this._editor)) === null || _a === void 0 ? void 0 : _a.getInlayHintsForLine(line);
            if (!hints || hints.length === 0) {
                this._audioCueService.playAudioCue(audioCueService_1.AudioCue.noInlayHints);
            }
            else {
                this._read(line, hints);
            }
        }
        stopInlayHintsReading() {
            this._reset();
            this._editor.focus();
        }
    };
    InlayHintsAccessibility.IsReading = new contextkey_1.RawContextKey('isReadingLineWithInlayHints', false, { type: 'boolean', description: (0, nls_1.localize)('isReadingLineWithInlayHints', "Whether the current line and its inlay hints are currently focused") });
    InlayHintsAccessibility.ID = 'editor.contrib.InlayHintsAccessibility';
    InlayHintsAccessibility = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, audioCueService_1.IAudioCueService),
        __param(3, instantiation_1.IInstantiationService)
    ], InlayHintsAccessibility);
    exports.InlayHintsAccessibility = InlayHintsAccessibility;
    (0, actions_1.registerAction2)(class StartReadHints extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlayHints.startReadingLineWithHint',
                title: (0, nls_1.localize)('read.title', 'Read Line With Inline Hints'),
                precondition: editorContextKeys_1.EditorContextKeys.hasInlayHintsProvider,
                f1: true
            });
        }
        runEditorCommand(_accessor, editor) {
            const ctrl = InlayHintsAccessibility.get(editor);
            if (ctrl) {
                ctrl.startInlayHintsReading();
            }
        }
    });
    (0, actions_1.registerAction2)(class StopReadHints extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlayHints.stopReadingLineWithHint',
                title: (0, nls_1.localize)('stop.title', 'Stop Inlay Hints Reading'),
                precondition: InlayHintsAccessibility.IsReading,
                f1: true,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            const ctrl = InlayHintsAccessibility.get(editor);
            if (ctrl) {
                ctrl.stopInlayHintsReading();
            }
        }
    });
    (0, editorExtensions_1.registerEditorContribution)(InlayHintsAccessibility.ID, InlayHintsAccessibility);
});
//# sourceMappingURL=inlayHintsAccessibilty.js.map