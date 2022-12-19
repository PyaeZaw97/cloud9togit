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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/preferences/browser/preferencesRenderers", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels"], function (require, exports, lifecycle_1, instantiation_1, workspace_1, preferencesRenderers_1, preferences_1, preferencesModels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsEditorContribution = void 0;
    let SettingsEditorContribution = class SettingsEditorContribution extends lifecycle_1.Disposable {
        constructor(editor, instantiationService, preferencesService, workspaceContextService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.preferencesService = preferencesService;
            this.workspaceContextService = workspaceContextService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this._createPreferencesRenderer();
            this._register(this.editor.onDidChangeModel(e => this._createPreferencesRenderer()));
            this._register(this.workspaceContextService.onDidChangeWorkbenchState(() => this._createPreferencesRenderer()));
        }
        async _createPreferencesRenderer() {
            var _a;
            this.disposables.clear();
            this.currentRenderer = undefined;
            const model = this.editor.getModel();
            if (model) {
                const settingsModel = await this.preferencesService.createPreferencesEditorModel(model.uri);
                if (settingsModel instanceof preferencesModels_1.SettingsEditorModel && this.editor.getModel()) {
                    this.disposables.add(settingsModel);
                    switch (settingsModel.configurationTarget) {
                        case 4 /* ConfigurationTarget.WORKSPACE */:
                            this.currentRenderer = this.disposables.add(this.instantiationService.createInstance(preferencesRenderers_1.WorkspaceSettingsRenderer, this.editor, settingsModel));
                            break;
                        default:
                            this.currentRenderer = this.disposables.add(this.instantiationService.createInstance(preferencesRenderers_1.UserSettingsRenderer, this.editor, settingsModel));
                            break;
                    }
                }
                (_a = this.currentRenderer) === null || _a === void 0 ? void 0 : _a.render();
            }
        }
    };
    SettingsEditorContribution.ID = 'editor.contrib.settings';
    SettingsEditorContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, preferences_1.IPreferencesService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], SettingsEditorContribution);
    exports.SettingsEditorContribution = SettingsEditorContribution;
});
//# sourceMappingURL=preferencesEditor.js.map