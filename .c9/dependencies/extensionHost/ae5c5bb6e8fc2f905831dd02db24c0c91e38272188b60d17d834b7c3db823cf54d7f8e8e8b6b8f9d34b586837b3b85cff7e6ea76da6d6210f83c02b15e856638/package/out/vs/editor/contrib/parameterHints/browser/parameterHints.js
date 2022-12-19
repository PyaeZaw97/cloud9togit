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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/contrib/parameterHints/browser/provideSignatureHelp", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "./parameterHintsWidget"], function (require, exports, lifecycle_1, editorExtensions_1, editorContextKeys_1, languages, provideSignatureHelp_1, nls, contextkey_1, instantiation_1, parameterHintsWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TriggerParameterHintsAction = void 0;
    let ParameterHintsController = class ParameterHintsController extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.widget = this._register(instantiationService.createInstance(parameterHintsWidget_1.ParameterHintsWidget, this.editor));
        }
        static get(editor) {
            return editor.getContribution(ParameterHintsController.ID);
        }
        cancel() {
            this.widget.cancel();
        }
        previous() {
            this.widget.previous();
        }
        next() {
            this.widget.next();
        }
        trigger(context) {
            this.widget.trigger(context);
        }
    };
    ParameterHintsController.ID = 'editor.controller.parameterHints';
    ParameterHintsController = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ParameterHintsController);
    class TriggerParameterHintsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.triggerParameterHints',
                label: nls.localize('parameterHints.trigger.label', "Trigger Parameter Hints"),
                alias: 'Trigger Parameter Hints',
                precondition: editorContextKeys_1.EditorContextKeys.hasSignatureHelpProvider,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 10 /* KeyCode.Space */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = ParameterHintsController.get(editor);
            if (controller) {
                controller.trigger({
                    triggerKind: languages.SignatureHelpTriggerKind.Invoke
                });
            }
        }
    }
    exports.TriggerParameterHintsAction = TriggerParameterHintsAction;
    (0, editorExtensions_1.registerEditorContribution)(ParameterHintsController.ID, ParameterHintsController);
    (0, editorExtensions_1.registerEditorAction)(TriggerParameterHintsAction);
    const weight = 100 /* KeybindingWeight.EditorContrib */ + 75;
    const ParameterHintsCommand = editorExtensions_1.EditorCommand.bindToContribution(ParameterHintsController.get);
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'closeParameterHints',
        precondition: provideSignatureHelp_1.Context.Visible,
        handler: x => x.cancel(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'showPrevParameterHint',
        precondition: contextkey_1.ContextKeyExpr.and(provideSignatureHelp_1.Context.Visible, provideSignatureHelp_1.Context.MultipleSignatures),
        handler: x => x.previous(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 16 /* KeyCode.UpArrow */,
            secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
            mac: { primary: 16 /* KeyCode.UpArrow */, secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */, 256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */] }
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new ParameterHintsCommand({
        id: 'showNextParameterHint',
        precondition: contextkey_1.ContextKeyExpr.and(provideSignatureHelp_1.Context.Visible, provideSignatureHelp_1.Context.MultipleSignatures),
        handler: x => x.next(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 18 /* KeyCode.DownArrow */,
            secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
            mac: { primary: 18 /* KeyCode.DownArrow */, secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */, 256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */] }
        }
    }));
});
//# sourceMappingURL=parameterHints.js.map