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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/dialogs/common/dialogs"], function (require, exports, lifecycle_1, resources_1, editorExtensions_1, codeEditorService_1, nls, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnusualLineTerminatorsDetector = void 0;
    const ignoreUnusualLineTerminators = 'ignoreUnusualLineTerminators';
    function writeIgnoreState(codeEditorService, model, state) {
        codeEditorService.setModelProperty(model.uri, ignoreUnusualLineTerminators, state);
    }
    function readIgnoreState(codeEditorService, model) {
        return codeEditorService.getModelProperty(model.uri, ignoreUnusualLineTerminators);
    }
    let UnusualLineTerminatorsDetector = class UnusualLineTerminatorsDetector extends lifecycle_1.Disposable {
        constructor(_editor, _dialogService, _codeEditorService) {
            super();
            this._editor = _editor;
            this._dialogService = _dialogService;
            this._codeEditorService = _codeEditorService;
            this._config = this._editor.getOption(114 /* EditorOption.unusualLineTerminators */);
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(114 /* EditorOption.unusualLineTerminators */)) {
                    this._config = this._editor.getOption(114 /* EditorOption.unusualLineTerminators */);
                    this._checkForUnusualLineTerminators();
                }
            }));
            this._register(this._editor.onDidChangeModel(() => {
                this._checkForUnusualLineTerminators();
            }));
            this._register(this._editor.onDidChangeModelContent((e) => {
                if (e.isUndoing) {
                    // skip checking in case of undoing
                    return;
                }
                this._checkForUnusualLineTerminators();
            }));
        }
        async _checkForUnusualLineTerminators() {
            if (this._config === 'off') {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            if (!model.mightContainUnusualLineTerminators()) {
                return;
            }
            const ignoreState = readIgnoreState(this._codeEditorService, model);
            if (ignoreState === true) {
                // this model should be ignored
                return;
            }
            if (this._editor.getOption(81 /* EditorOption.readOnly */)) {
                // read only editor => sorry!
                return;
            }
            if (this._config === 'auto') {
                // just do it!
                model.removeUnusualLineTerminators(this._editor.getSelections());
                return;
            }
            const result = await this._dialogService.confirm({
                title: nls.localize('unusualLineTerminators.title', "Unusual Line Terminators"),
                message: nls.localize('unusualLineTerminators.message', "Detected unusual line terminators"),
                detail: nls.localize('unusualLineTerminators.detail', "The file '{0}' contains one or more unusual line terminator characters, like Line Separator (LS) or Paragraph Separator (PS).\n\nIt is recommended to remove them from the file. This can be configured via `editor.unusualLineTerminators`.", (0, resources_1.basename)(model.uri)),
                primaryButton: nls.localize('unusualLineTerminators.fix', "Remove Unusual Line Terminators"),
                secondaryButton: nls.localize('unusualLineTerminators.ignore', "Ignore")
            });
            if (!result.confirmed) {
                // this model should be ignored
                writeIgnoreState(this._codeEditorService, model, true);
                return;
            }
            model.removeUnusualLineTerminators(this._editor.getSelections());
        }
    };
    UnusualLineTerminatorsDetector.ID = 'editor.contrib.unusualLineTerminatorsDetector';
    UnusualLineTerminatorsDetector = __decorate([
        __param(1, dialogs_1.IDialogService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], UnusualLineTerminatorsDetector);
    exports.UnusualLineTerminatorsDetector = UnusualLineTerminatorsDetector;
    (0, editorExtensions_1.registerEditorContribution)(UnusualLineTerminatorsDetector.ID, UnusualLineTerminatorsDetector);
});
//# sourceMappingURL=unusualLineTerminators.js.map