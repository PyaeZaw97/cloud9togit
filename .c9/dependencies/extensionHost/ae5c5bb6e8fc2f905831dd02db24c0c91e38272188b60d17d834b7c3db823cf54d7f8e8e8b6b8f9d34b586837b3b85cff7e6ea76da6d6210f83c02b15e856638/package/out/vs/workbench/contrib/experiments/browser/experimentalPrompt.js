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
define(["require", "exports", "vs/platform/notification/common/notification", "vs/workbench/contrib/experiments/common/experimentService", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, notification_1, experimentService_1, extensions_1, lifecycle_1, platform_1, opener_1, uri_1, commands_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExperimentalPrompts = void 0;
    let ExperimentalPrompts = class ExperimentalPrompts extends lifecycle_1.Disposable {
        constructor(experimentService, paneCompositeService, notificationService, openerService, commandService) {
            super();
            this.experimentService = experimentService;
            this.paneCompositeService = paneCompositeService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.commandService = commandService;
            this._register(this.experimentService.onExperimentEnabled(e => {
                if (e.action && e.action.type === experimentService_1.ExperimentActionType.Prompt && e.state === 2 /* ExperimentState.Run */) {
                    this.showExperimentalPrompts(e);
                }
            }, this));
        }
        showExperimentalPrompts(experiment) {
            if (!experiment || !experiment.enabled || !experiment.action || experiment.state !== 2 /* ExperimentState.Run */) {
                return;
            }
            const actionProperties = experiment.action.properties;
            const promptText = ExperimentalPrompts.getLocalizedText(actionProperties.promptText, platform_1.language || '');
            if (!actionProperties || !promptText) {
                return;
            }
            if (!actionProperties.commands) {
                actionProperties.commands = [];
            }
            const choices = actionProperties.commands.map((command) => {
                const commandText = ExperimentalPrompts.getLocalizedText(command.text, platform_1.language || '');
                return {
                    label: commandText,
                    run: () => {
                        if (command.externalLink) {
                            this.openerService.open(uri_1.URI.parse(command.externalLink));
                        }
                        else if (command.curatedExtensionsKey && Array.isArray(command.curatedExtensionsList)) {
                            this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
                                .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
                                .then(viewlet => {
                                if (viewlet) {
                                    viewlet.search('curated:' + command.curatedExtensionsKey);
                                }
                            });
                        }
                        else if (command.codeCommand) {
                            this.commandService.executeCommand(command.codeCommand.id, ...command.codeCommand.arguments);
                        }
                        this.experimentService.markAsCompleted(experiment.id);
                    }
                };
            });
            this.notificationService.prompt(notification_1.Severity.Info, promptText, choices, {
                onCancel: () => {
                    this.experimentService.markAsCompleted(experiment.id);
                }
            });
        }
        static getLocalizedText(text, displayLanguage) {
            if (typeof text === 'string') {
                return text;
            }
            const msgInEnglish = text['en'] || text['en-us'];
            displayLanguage = displayLanguage.toLowerCase();
            if (!text[displayLanguage] && displayLanguage.indexOf('-') === 2) {
                displayLanguage = displayLanguage.substr(0, 2);
            }
            return text[displayLanguage] || msgInEnglish;
        }
    };
    ExperimentalPrompts = __decorate([
        __param(0, experimentService_1.IExperimentService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, notification_1.INotificationService),
        __param(3, opener_1.IOpenerService),
        __param(4, commands_1.ICommandService)
    ], ExperimentalPrompts);
    exports.ExperimentalPrompts = ExperimentalPrompts;
});
//# sourceMappingURL=experimentalPrompt.js.map