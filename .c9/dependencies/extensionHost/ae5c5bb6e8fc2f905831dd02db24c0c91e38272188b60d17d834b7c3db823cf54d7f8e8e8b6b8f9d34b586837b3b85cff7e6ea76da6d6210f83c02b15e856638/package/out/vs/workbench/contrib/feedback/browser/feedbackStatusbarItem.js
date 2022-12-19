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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/feedback/browser/feedback", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/workbench/services/statusbar/browser/statusbar", "vs/nls", "vs/platform/commands/common/commands", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/base/common/platform"], function (require, exports, lifecycle_1, feedback_1, instantiation_1, productService_1, statusbar_1, nls_1, commands_1, uri_1, actions_1, actions_2, notificationsCommands_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FeedbackStatusbarConribution = void 0;
    class TwitterFeedbackService {
        combineHashTagsAsString() {
            return TwitterFeedbackService.HASHTAGS.join(',');
        }
        submitFeedback(feedback, openerService) {
            const queryString = `?${feedback.sentiment === 1 ? `hashtags=${this.combineHashTagsAsString()}&` : ''}ref_src=twsrc%5Etfw&related=twitterapi%2Ctwitter&text=${encodeURIComponent(feedback.feedback)}&tw_p=tweetbutton&via=${TwitterFeedbackService.VIA_NAME}`;
            const url = TwitterFeedbackService.TWITTER_URL + queryString;
            openerService.open(uri_1.URI.parse(url));
        }
        getCharacterLimit(sentiment) {
            let length = 0;
            if (sentiment === 1) {
                TwitterFeedbackService.HASHTAGS.forEach(element => {
                    length += element.length + 2;
                });
            }
            if (TwitterFeedbackService.VIA_NAME) {
                length += ` via @${TwitterFeedbackService.VIA_NAME}`.length;
            }
            return 280 - length;
        }
    }
    TwitterFeedbackService.TWITTER_URL = 'https://twitter.com/intent/tweet';
    TwitterFeedbackService.VIA_NAME = 'code';
    TwitterFeedbackService.HASHTAGS = ['HappyCoding'];
    let FeedbackStatusbarConribution = class FeedbackStatusbarConribution extends lifecycle_1.Disposable {
        constructor(statusbarService, productService, instantiationService, commandService) {
            super();
            this.statusbarService = statusbarService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            if (productService.sendASmile && !platform_1.isIOS) {
                this.createFeedbackStatusEntry();
            }
        }
        createFeedbackStatusEntry() {
            // Status entry
            this.entry = this._register(this.statusbarService.addEntry(this.getStatusEntry(), 'status.feedback', 1 /* StatusbarAlignment.RIGHT */, -100 /* towards the end of the right hand side */));
            // Command to toggle
            commands_1.CommandsRegistry.registerCommand(FeedbackStatusbarConribution.TOGGLE_FEEDBACK_COMMAND, () => this.toggleFeedback());
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
                command: {
                    id: FeedbackStatusbarConribution.TOGGLE_FEEDBACK_COMMAND,
                    category: actions_2.CATEGORIES.Help,
                    title: (0, nls_1.localize)('status.feedback', "Tweet Feedback")
                }
            });
        }
        toggleFeedback() {
            if (!this.widget) {
                this.widget = this._register(this.instantiationService.createInstance(feedback_1.FeedbackWidget, {
                    feedbackService: this.instantiationService.createInstance(TwitterFeedbackService)
                }));
                this._register(this.widget.onDidChangeVisibility(visible => this.entry.update(this.getStatusEntry(visible))));
            }
            if (this.widget) {
                if (!this.widget.isVisible()) {
                    this.commandService.executeCommand(notificationsCommands_1.HIDE_NOTIFICATION_TOAST);
                    this.commandService.executeCommand(notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER);
                    this.widget.show();
                }
                else {
                    this.widget.hide();
                }
            }
        }
        getStatusEntry(showBeak) {
            return {
                name: (0, nls_1.localize)('status.feedback.name', "Feedback"),
                text: '$(feedback)',
                ariaLabel: (0, nls_1.localize)('status.feedback', "Tweet Feedback"),
                tooltip: (0, nls_1.localize)('status.feedback', "Tweet Feedback"),
                command: FeedbackStatusbarConribution.TOGGLE_FEEDBACK_COMMAND,
                showBeak
            };
        }
    };
    FeedbackStatusbarConribution.TOGGLE_FEEDBACK_COMMAND = 'help.tweetFeedback';
    FeedbackStatusbarConribution = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, productService_1.IProductService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, commands_1.ICommandService)
    ], FeedbackStatusbarConribution);
    exports.FeedbackStatusbarConribution = FeedbackStatusbarConribution;
});
//# sourceMappingURL=feedbackStatusbarItem.js.map