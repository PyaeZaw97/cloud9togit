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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/commands/common/commands", "vs/workbench/services/integrity/common/integrity", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/product/common/productService", "vs/platform/opener/common/opener", "vs/base/browser/keyboardEvent", "vs/base/common/codicons", "vs/base/common/event", "vs/workbench/services/layout/browser/layoutService", "vs/css!./media/feedback"], function (require, exports, nls_1, lifecycle_1, contextView_1, commands_1, integrity_1, themeService_1, styler_1, colorRegistry_1, dom_1, button_1, telemetry_1, statusbar_1, productService_1, opener_1, keyboardEvent_1, codicons_1, event_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FeedbackWidget = void 0;
    let FeedbackWidget = class FeedbackWidget extends lifecycle_1.Disposable {
        constructor(options, contextViewService, layoutService, commandService, telemetryService, integrityService, themeService, statusbarService, productService, openerService) {
            super();
            this.contextViewService = contextViewService;
            this.layoutService = layoutService;
            this.commandService = commandService;
            this.telemetryService = telemetryService;
            this.integrityService = integrityService;
            this.themeService = themeService;
            this.statusbarService = statusbarService;
            this.openerService = openerService;
            this._onDidChangeVisibility = new event_1.Emitter();
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.feedback = '';
            this.sentiment = 1;
            this.feedbackForm = undefined;
            this.feedbackDescriptionInput = undefined;
            this.smileyInput = undefined;
            this.frownyInput = undefined;
            this.sendButton = undefined;
            this.hideButton = undefined;
            this.remainingCharacterCount = undefined;
            this.isPure = true;
            this.feedbackDelegate = options.feedbackService;
            this.maxFeedbackCharacters = this.feedbackDelegate.getCharacterLimit(this.sentiment);
            if (productService.sendASmile) {
                this.requestFeatureLink = productService.sendASmile.requestFeatureUrl;
            }
            this.integrityService.isPure().then(result => {
                if (!result.isPure) {
                    this.isPure = false;
                }
            });
            // Hide feedback widget whenever notifications appear
            this._register(this.layoutService.onDidChangeNotificationsVisibility(visible => {
                if (visible) {
                    this.hide();
                }
            }));
        }
        getAnchor() {
            const dimension = this.layoutService.dimension;
            return {
                x: dimension.width - 8,
                y: dimension.height - 31
            };
        }
        renderContents(container) {
            const disposables = new lifecycle_1.DisposableStore();
            container.classList.add('monaco-menu-container');
            // Form
            this.feedbackForm = (0, dom_1.append)(container, (0, dom_1.$)('form.feedback-form'));
            this.feedbackForm.setAttribute('action', 'javascript:void(0);');
            // Title
            (0, dom_1.append)(this.feedbackForm, (0, dom_1.$)('h2.title')).textContent = (0, nls_1.localize)("label.sendASmile", "Tweet us your feedback.");
            // Close Button (top right)
            const closeBtn = (0, dom_1.append)(this.feedbackForm, (0, dom_1.$)(`div.cancel${codicons_1.Codicon.close.cssSelector}`));
            closeBtn.tabIndex = 0;
            closeBtn.setAttribute('role', 'button');
            closeBtn.title = (0, nls_1.localize)('close', "Close");
            disposables.add((0, dom_1.addDisposableListener)(container, dom_1.EventType.KEY_DOWN, keyboardEvent => {
                const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(keyboardEvent);
                if (standardKeyboardEvent.keyCode === 9 /* KeyCode.Escape */) {
                    this.hide();
                }
            }));
            disposables.add((0, dom_1.addDisposableListener)(closeBtn, dom_1.EventType.MOUSE_OVER, () => {
                const theme = this.themeService.getColorTheme();
                let darkenFactor;
                switch (theme.type) {
                    case 'light':
                        darkenFactor = 0.1;
                        break;
                    case 'dark':
                        darkenFactor = 0.2;
                        break;
                }
                if (darkenFactor) {
                    const backgroundBaseColor = theme.getColor(colorRegistry_1.editorWidgetBackground);
                    if (backgroundBaseColor) {
                        const backgroundColor = backgroundBaseColor.darken(darkenFactor);
                        if (backgroundColor) {
                            closeBtn.style.backgroundColor = backgroundColor.toString();
                        }
                    }
                }
            }));
            disposables.add((0, dom_1.addDisposableListener)(closeBtn, dom_1.EventType.MOUSE_OUT, () => {
                closeBtn.style.backgroundColor = '';
            }));
            this.invoke(closeBtn, disposables, () => this.hide());
            // Content
            const content = (0, dom_1.append)(this.feedbackForm, (0, dom_1.$)('div.content'));
            // Sentiment Buttons
            const sentimentContainer = (0, dom_1.append)(content, (0, dom_1.$)('div'));
            if (!this.isPure) {
                (0, dom_1.append)(sentimentContainer, (0, dom_1.$)('span')).textContent = (0, nls_1.localize)("patchedVersion1", "Your installation is corrupt.");
                sentimentContainer.appendChild(document.createElement('br'));
                (0, dom_1.append)(sentimentContainer, (0, dom_1.$)('span')).textContent = (0, nls_1.localize)("patchedVersion2", "Please specify this if you submit a bug.");
                sentimentContainer.appendChild(document.createElement('br'));
            }
            (0, dom_1.append)(sentimentContainer, (0, dom_1.$)('span')).textContent = (0, nls_1.localize)("sentiment", "How was your experience?");
            const feedbackSentiment = (0, dom_1.append)(sentimentContainer, (0, dom_1.$)('div.feedback-sentiment'));
            // Sentiment: Smiley
            this.smileyInput = (0, dom_1.append)(feedbackSentiment, (0, dom_1.$)('div.sentiment'));
            this.smileyInput.classList.add('smile');
            this.smileyInput.setAttribute('aria-checked', 'false');
            this.smileyInput.setAttribute('aria-label', (0, nls_1.localize)('smileCaption', "Happy Feedback Sentiment"));
            this.smileyInput.setAttribute('role', 'checkbox');
            this.smileyInput.title = (0, nls_1.localize)('smileCaption', "Happy Feedback Sentiment");
            this.smileyInput.tabIndex = 0;
            this.invoke(this.smileyInput, disposables, () => this.setSentiment(true));
            // Sentiment: Frowny
            this.frownyInput = (0, dom_1.append)(feedbackSentiment, (0, dom_1.$)('div.sentiment'));
            this.frownyInput.classList.add('frown');
            this.frownyInput.setAttribute('aria-checked', 'false');
            this.frownyInput.setAttribute('aria-label', (0, nls_1.localize)('frownCaption', "Sad Feedback Sentiment"));
            this.frownyInput.setAttribute('role', 'checkbox');
            this.frownyInput.title = (0, nls_1.localize)('frownCaption', "Sad Feedback Sentiment");
            this.frownyInput.tabIndex = 0;
            this.invoke(this.frownyInput, disposables, () => this.setSentiment(false));
            if (this.sentiment === 1) {
                this.smileyInput.classList.add('checked');
                this.smileyInput.setAttribute('aria-checked', 'true');
            }
            else {
                this.frownyInput.classList.add('checked');
                this.frownyInput.setAttribute('aria-checked', 'true');
            }
            // Contact Us Box
            const contactUsContainer = (0, dom_1.append)(content, (0, dom_1.$)('div.contactus'));
            (0, dom_1.append)(contactUsContainer, (0, dom_1.$)('span')).textContent = (0, nls_1.localize)("other ways to contact us", "Other ways to contact us");
            const channelsContainer = (0, dom_1.append)(contactUsContainer, (0, dom_1.$)('div.channels'));
            // Contact: Submit a Bug
            const submitBugLinkContainer = (0, dom_1.append)(channelsContainer, (0, dom_1.$)('div'));
            const submitBugLink = (0, dom_1.append)(submitBugLinkContainer, (0, dom_1.$)('a'));
            submitBugLink.setAttribute('target', '_blank');
            submitBugLink.setAttribute('href', '#');
            submitBugLink.textContent = (0, nls_1.localize)("submit a bug", "Submit a bug");
            submitBugLink.tabIndex = 0;
            disposables.add((0, dom_1.addDisposableListener)(submitBugLink, 'click', e => {
                dom_1.EventHelper.stop(e);
                const actionId = 'workbench.action.openIssueReporter';
                this.commandService.executeCommand(actionId);
                this.hide();
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: actionId, from: 'feedback' });
            }));
            // Contact: Request a Feature
            if (!!this.requestFeatureLink) {
                const requestFeatureLinkContainer = (0, dom_1.append)(channelsContainer, (0, dom_1.$)('div'));
                const requestFeatureLink = (0, dom_1.append)(requestFeatureLinkContainer, (0, dom_1.$)('a'));
                requestFeatureLink.setAttribute('target', '_blank');
                requestFeatureLink.setAttribute('href', this.requestFeatureLink);
                requestFeatureLink.textContent = (0, nls_1.localize)("request a missing feature", "Request a missing feature");
                requestFeatureLink.tabIndex = 0;
                disposables.add((0, dom_1.addDisposableListener)(requestFeatureLink, 'click', e => this.hide()));
            }
            // Remaining Characters
            const remainingCharacterCountContainer = (0, dom_1.append)(this.feedbackForm, (0, dom_1.$)('h3'));
            remainingCharacterCountContainer.textContent = (0, nls_1.localize)("tell us why", "Tell us why?");
            this.remainingCharacterCount = (0, dom_1.append)(remainingCharacterCountContainer, (0, dom_1.$)('span.char-counter'));
            this.remainingCharacterCount.textContent = this.getCharCountText(0);
            // Feedback Input Form
            this.feedbackDescriptionInput = (0, dom_1.append)(this.feedbackForm, (0, dom_1.$)('textarea.feedback-description'));
            this.feedbackDescriptionInput.rows = 3;
            this.feedbackDescriptionInput.maxLength = this.maxFeedbackCharacters;
            this.feedbackDescriptionInput.textContent = this.feedback;
            this.feedbackDescriptionInput.required = true;
            this.feedbackDescriptionInput.setAttribute('aria-label', (0, nls_1.localize)("feedbackTextInput", "Tell us your feedback"));
            this.feedbackDescriptionInput.focus();
            disposables.add((0, dom_1.addDisposableListener)(this.feedbackDescriptionInput, 'keyup', () => this.updateCharCountText()));
            // Feedback Input Form Buttons Container
            const buttonsContainer = (0, dom_1.append)(this.feedbackForm, (0, dom_1.$)('div.form-buttons'));
            // Checkbox: Hide Feedback Smiley
            const hideButtonContainer = (0, dom_1.append)(buttonsContainer, (0, dom_1.$)('div.hide-button-container'));
            this.hideButton = (0, dom_1.append)(hideButtonContainer, (0, dom_1.$)('input.hide-button'));
            this.hideButton.type = 'checkbox';
            this.hideButton.checked = true;
            this.hideButton.id = 'hide-button';
            const hideButtonLabel = (0, dom_1.append)(hideButtonContainer, (0, dom_1.$)('label'));
            hideButtonLabel.setAttribute('for', 'hide-button');
            hideButtonLabel.textContent = (0, nls_1.localize)('showFeedback', "Show Feedback Icon in Status Bar");
            // Button: Send Feedback
            this.sendButton = new button_1.Button(buttonsContainer);
            this.sendButton.enabled = false;
            this.sendButton.label = (0, nls_1.localize)('tweet', "Tweet");
            (0, dom_1.prepend)(this.sendButton.element, (0, dom_1.$)(`span${codicons_1.Codicon.twitter.cssSelector}`));
            this.sendButton.element.classList.add('send');
            this.sendButton.element.title = (0, nls_1.localize)('tweetFeedback', "Tweet Feedback");
            disposables.add((0, styler_1.attachButtonStyler)(this.sendButton, this.themeService));
            this.sendButton.onDidClick(() => this.onSubmit());
            disposables.add((0, styler_1.attachStylerCallback)(this.themeService, { widgetShadow: colorRegistry_1.widgetShadow, editorWidgetBackground: colorRegistry_1.editorWidgetBackground, editorWidgetForeground: colorRegistry_1.editorWidgetForeground, inputBackground: colorRegistry_1.inputBackground, inputForeground: colorRegistry_1.inputForeground, inputBorder: colorRegistry_1.inputBorder, editorBackground: colorRegistry_1.editorBackground, contrastBorder: colorRegistry_1.contrastBorder }, colors => {
                if (this.feedbackForm) {
                    this.feedbackForm.style.backgroundColor = colors.editorWidgetBackground ? colors.editorWidgetBackground.toString() : '';
                    this.feedbackForm.style.color = colors.editorWidgetForeground ? colors.editorWidgetForeground.toString() : '';
                    this.feedbackForm.style.boxShadow = colors.widgetShadow ? `0 0 8px 2px ${colors.widgetShadow}` : '';
                }
                if (this.feedbackDescriptionInput) {
                    this.feedbackDescriptionInput.style.backgroundColor = colors.inputBackground ? colors.inputBackground.toString() : '';
                    this.feedbackDescriptionInput.style.color = colors.inputForeground ? colors.inputForeground.toString() : '';
                    this.feedbackDescriptionInput.style.border = `1px solid ${colors.inputBorder || 'transparent'}`;
                }
                contactUsContainer.style.backgroundColor = colors.editorBackground ? colors.editorBackground.toString() : '';
                contactUsContainer.style.border = `1px solid ${colors.contrastBorder || 'transparent'}`;
            }));
            return {
                dispose: () => {
                    this.feedbackForm = undefined;
                    this.feedbackDescriptionInput = undefined;
                    this.smileyInput = undefined;
                    this.frownyInput = undefined;
                    disposables.dispose();
                }
            };
        }
        updateFeedbackDescription() {
            if (this.feedbackDescriptionInput && this.feedbackDescriptionInput.textLength > this.maxFeedbackCharacters) {
                this.feedbackDescriptionInput.value = this.feedbackDescriptionInput.value.substring(0, this.maxFeedbackCharacters);
            }
        }
        getCharCountText(charCount) {
            const remaining = this.maxFeedbackCharacters - charCount;
            const text = (remaining === 1)
                ? (0, nls_1.localize)("character left", "character left")
                : (0, nls_1.localize)("characters left", "characters left");
            return `(${remaining} ${text})`;
        }
        updateCharCountText() {
            if (this.feedbackDescriptionInput && this.remainingCharacterCount && this.sendButton) {
                this.remainingCharacterCount.innerText = this.getCharCountText(this.feedbackDescriptionInput.value.length);
                this.sendButton.enabled = this.feedbackDescriptionInput.value.length > 0;
            }
        }
        setSentiment(smile) {
            if (smile) {
                if (this.smileyInput) {
                    this.smileyInput.classList.add('checked');
                    this.smileyInput.setAttribute('aria-checked', 'true');
                }
                if (this.frownyInput) {
                    this.frownyInput.classList.remove('checked');
                    this.frownyInput.setAttribute('aria-checked', 'false');
                }
            }
            else {
                if (this.frownyInput) {
                    this.frownyInput.classList.add('checked');
                    this.frownyInput.setAttribute('aria-checked', 'true');
                }
                if (this.smileyInput) {
                    this.smileyInput.classList.remove('checked');
                    this.smileyInput.setAttribute('aria-checked', 'false');
                }
            }
            this.sentiment = smile ? 1 : 0;
            this.maxFeedbackCharacters = this.feedbackDelegate.getCharacterLimit(this.sentiment);
            this.updateFeedbackDescription();
            this.updateCharCountText();
            if (this.feedbackDescriptionInput) {
                this.feedbackDescriptionInput.maxLength = this.maxFeedbackCharacters;
            }
        }
        invoke(element, disposables, callback) {
            disposables.add((0, dom_1.addDisposableListener)(element, 'click', callback));
            disposables.add((0, dom_1.addDisposableListener)(element, 'keypress', e => {
                if (e instanceof KeyboardEvent) {
                    const keyboardEvent = e;
                    if (keyboardEvent.keyCode === 13 || keyboardEvent.keyCode === 32) { // Enter or Spacebar
                        callback();
                    }
                }
            }));
            return element;
        }
        show() {
            if (this.visible) {
                return;
            }
            this.visible = true;
            this.contextViewService.showContextView({
                getAnchor: () => this.getAnchor(),
                render: (container) => {
                    return this.renderContents(container);
                },
                onDOMEvent: (e, activeElement) => {
                    this.onEvent(e, activeElement);
                },
                onHide: () => this._onDidChangeVisibility.fire(false)
            });
            this._onDidChangeVisibility.fire(true);
            this.updateCharCountText();
        }
        hide() {
            if (!this.visible) {
                return;
            }
            if (this.feedbackDescriptionInput) {
                this.feedback = this.feedbackDescriptionInput.value;
            }
            if (this.hideButton && !this.hideButton.checked) {
                this.statusbarService.updateEntryVisibility('status.feedback', false);
            }
            this.visible = false;
            this.contextViewService.hideContextView();
        }
        isVisible() {
            return !!this.visible;
        }
        onEvent(e, activeElement) {
            if (e instanceof KeyboardEvent) {
                const keyboardEvent = e;
                if (keyboardEvent.keyCode === 27) { // Escape
                    this.hide();
                }
            }
        }
        onSubmit() {
            if (!this.feedbackForm || !this.feedbackDescriptionInput || (this.feedbackForm.checkValidity && !this.feedbackForm.checkValidity())) {
                return;
            }
            this.feedbackDelegate.submitFeedback({
                feedback: this.feedbackDescriptionInput.value,
                sentiment: this.sentiment
            }, this.openerService);
            this.hide();
        }
    };
    FeedbackWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, commands_1.ICommandService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, integrity_1.IIntegrityService),
        __param(6, themeService_1.IThemeService),
        __param(7, statusbar_1.IStatusbarService),
        __param(8, productService_1.IProductService),
        __param(9, opener_1.IOpenerService)
    ], FeedbackWidget);
    exports.FeedbackWidget = FeedbackWidget;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Sentiment Buttons
        const inputActiveOptionBorderColor = theme.getColor(colorRegistry_1.inputActiveOptionBorder);
        if (inputActiveOptionBorderColor) {
            collector.addRule(`.monaco-workbench .feedback-form .sentiment.checked { border: 1px solid ${inputActiveOptionBorderColor}; }`);
        }
        // Links
        const linkColor = theme.getColor(colorRegistry_1.textLinkForeground) || theme.getColor(colorRegistry_1.contrastBorder);
        if (linkColor) {
            collector.addRule(`.monaco-workbench .feedback-form .content .channels a { color: ${linkColor}; }`);
        }
    });
});
//# sourceMappingURL=feedback.js.map