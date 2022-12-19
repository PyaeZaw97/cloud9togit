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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/assignment/common/assignmentService", "vs/workbench/common/contributions"], function (require, exports, lifecycle_1, platform_1, nls_1, actions_1, configuration_1, notebookCommon_1, assignmentService_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookProfileContribution = exports.NotebookProfileType = void 0;
    var NotebookProfileType;
    (function (NotebookProfileType) {
        NotebookProfileType["default"] = "default";
        NotebookProfileType["jupyter"] = "jupyter";
        NotebookProfileType["colab"] = "colab";
    })(NotebookProfileType = exports.NotebookProfileType || (exports.NotebookProfileType = {}));
    const profiles = {
        [NotebookProfileType.default]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'gutter',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'both',
            [notebookCommon_1.NotebookSetting.globalToolbar]: true,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'right' },
            [notebookCommon_1.NotebookSetting.compactView]: true,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'visible',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: true,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: false
        },
        [NotebookProfileType.jupyter]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'gutter',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'notebookToolbar',
            [notebookCommon_1.NotebookSetting.globalToolbar]: true,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'left' },
            [notebookCommon_1.NotebookSetting.compactView]: true,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'visible',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: false,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: true
        },
        [NotebookProfileType.colab]: {
            [notebookCommon_1.NotebookSetting.focusIndicator]: 'border',
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: 'betweenCells',
            [notebookCommon_1.NotebookSetting.globalToolbar]: false,
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: { default: 'right' },
            [notebookCommon_1.NotebookSetting.compactView]: false,
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: 'hidden',
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: true,
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: false
        }
    };
    async function applyProfile(configService, profile) {
        const promises = [];
        for (const settingKey in profile) {
            promises.push(configService.updateValue(settingKey, profile[settingKey]));
        }
        await Promise.all(promises);
    }
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.setProfile',
                title: (0, nls_1.localize)('setProfileTitle', "Set Profile")
            });
        }
        async run(accessor, args) {
            if (!isSetProfileArgs(args)) {
                return;
            }
            const configService = accessor.get(configuration_1.IConfigurationService);
            return applyProfile(configService, profiles[args.profile]);
        }
    });
    function isSetProfileArgs(args) {
        const setProfileArgs = args;
        return setProfileArgs.profile === NotebookProfileType.colab ||
            setProfileArgs.profile === NotebookProfileType.default ||
            setProfileArgs.profile === NotebookProfileType.jupyter;
    }
    let NotebookProfileContribution = class NotebookProfileContribution extends lifecycle_1.Disposable {
        constructor(configService, experimentService) {
            super();
            this.experimentService = experimentService;
            if (this.experimentService) {
                this.experimentService.getTreatment('notebookprofile').then(treatment => {
                    var _a;
                    if (treatment === undefined) {
                        return;
                    }
                    else {
                        // check if settings are already modified
                        const focusIndicator = configService.getValue(notebookCommon_1.NotebookSetting.focusIndicator);
                        const insertToolbarPosition = configService.getValue(notebookCommon_1.NotebookSetting.insertToolbarLocation);
                        const globalToolbar = configService.getValue(notebookCommon_1.NotebookSetting.globalToolbar);
                        // const cellToolbarLocation = configService.getValue(NotebookSetting.cellToolbarLocation);
                        const compactView = configService.getValue(notebookCommon_1.NotebookSetting.compactView);
                        const showCellStatusBar = configService.getValue(notebookCommon_1.NotebookSetting.showCellStatusBar);
                        const consolidatedRunButton = configService.getValue(notebookCommon_1.NotebookSetting.consolidatedRunButton);
                        if (focusIndicator === 'border'
                            && insertToolbarPosition === 'both'
                            && globalToolbar === false
                            // && cellToolbarLocation === undefined
                            && compactView === true
                            && showCellStatusBar === 'visible'
                            && consolidatedRunButton === true) {
                            applyProfile(configService, (_a = profiles[treatment]) !== null && _a !== void 0 ? _a : profiles[NotebookProfileType.default]);
                        }
                    }
                });
            }
        }
    };
    NotebookProfileContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, assignmentService_1.IWorkbenchAssignmentService)
    ], NotebookProfileContribution);
    exports.NotebookProfileContribution = NotebookProfileContribution;
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookProfileContribution, 2 /* LifecyclePhase.Ready */);
});
//# sourceMappingURL=notebookProfile.js.map