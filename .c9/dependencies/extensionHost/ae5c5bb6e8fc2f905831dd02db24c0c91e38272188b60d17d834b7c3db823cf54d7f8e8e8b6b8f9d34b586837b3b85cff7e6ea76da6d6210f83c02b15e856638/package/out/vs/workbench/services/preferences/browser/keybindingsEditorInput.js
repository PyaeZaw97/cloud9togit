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
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/editorInput", "vs/workbench/services/preferences/browser/keybindingsEditorModel"], function (require, exports, platform_1, nls, instantiation_1, editorInput_1, keybindingsEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditorInput = void 0;
    let KeybindingsEditorInput = class KeybindingsEditorInput extends editorInput_1.EditorInput {
        constructor(instantiationService) {
            super();
            this.searchOptions = null;
            this.resource = undefined;
            this.keybindingsModel = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, platform_1.OS);
        }
        get typeId() {
            return KeybindingsEditorInput.ID;
        }
        getName() {
            return nls.localize('keybindingsInputName', "Keyboard Shortcuts");
        }
        async resolve() {
            return this.keybindingsModel;
        }
        matches(otherInput) {
            return super.matches(otherInput) || otherInput instanceof KeybindingsEditorInput;
        }
        dispose() {
            this.keybindingsModel.dispose();
            super.dispose();
        }
    };
    KeybindingsEditorInput.ID = 'workbench.input.keybindings';
    KeybindingsEditorInput = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], KeybindingsEditorInput);
    exports.KeybindingsEditorInput = KeybindingsEditorInput;
});
//# sourceMappingURL=keybindingsEditorInput.js.map