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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/common/views", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/host/browser/host", "vs/workbench/services/preferences/browser/keybindingsEditorInput", "vs/workbench/services/preferences/common/preferencesEditorInput"], function (require, exports, event_1, lifecycle_1, platform_1, resources_1, userDataSync_1, views_1, extensions_1, editorService_1, environmentService_1, host_1, keybindingsEditorInput_1, preferencesEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncTrigger = void 0;
    let UserDataSyncTrigger = class UserDataSyncTrigger extends lifecycle_1.Disposable {
        constructor(editorService, environmentService, viewsService, userDataAutoSyncService, hostService) {
            super();
            this.environmentService = environmentService;
            const event = event_1.Event.filter(event_1.Event.any(event_1.Event.map(editorService.onDidActiveEditorChange, () => this.getUserDataEditorInputSource(editorService.activeEditor)), event_1.Event.map(event_1.Event.filter(viewsService.onDidChangeViewContainerVisibility, e => e.id === extensions_1.VIEWLET_ID && e.visible), e => e.id)), source => source !== undefined);
            if (platform_1.isWeb) {
                this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.map(hostService.onDidChangeFocus, () => 'windowFocus'), event_1.Event.map(event, source => source)), (last, source) => last ? [...last, source] : [source], 1000)(sources => userDataAutoSyncService.triggerSync(sources, true, false)));
            }
            else {
                this._register(event(source => userDataAutoSyncService.triggerSync([source], true, false)));
            }
        }
        getUserDataEditorInputSource(editorInput) {
            if (!editorInput) {
                return undefined;
            }
            if (editorInput instanceof preferencesEditorInput_1.SettingsEditor2Input) {
                return 'settingsEditor';
            }
            if (editorInput instanceof keybindingsEditorInput_1.KeybindingsEditorInput) {
                return 'keybindingsEditor';
            }
            const resource = editorInput.resource;
            if ((0, resources_1.isEqual)(resource, this.environmentService.settingsResource)) {
                return 'settingsEditor';
            }
            if ((0, resources_1.isEqual)(resource, this.environmentService.keybindingsResource)) {
                return 'keybindingsEditor';
            }
            return undefined;
        }
    };
    UserDataSyncTrigger = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, views_1.IViewsService),
        __param(3, userDataSync_1.IUserDataAutoSyncService),
        __param(4, host_1.IHostService)
    ], UserDataSyncTrigger);
    exports.UserDataSyncTrigger = UserDataSyncTrigger;
});
//# sourceMappingURL=userDataSyncTrigger.js.map