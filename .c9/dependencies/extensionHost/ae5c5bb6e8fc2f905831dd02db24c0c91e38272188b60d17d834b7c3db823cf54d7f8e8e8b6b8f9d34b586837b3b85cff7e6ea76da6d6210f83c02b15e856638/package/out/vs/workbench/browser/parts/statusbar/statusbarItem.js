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
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/theme/common/themeService", "vs/editor/common/editorCommon", "vs/base/browser/dom", "vs/platform/notification/common/notification", "vs/base/common/types", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/iconLabel/iconLabels", "vs/platform/theme/common/iconRegistry", "vs/base/browser/ui/iconLabel/iconLabelHover", "vs/base/common/htmlContent", "vs/base/browser/touch"], function (require, exports, errorMessage_1, lifecycle_1, simpleIconLabel_1, commands_1, telemetry_1, statusbar_1, themeService_1, editorCommon_1, dom_1, notification_1, types_1, keyboardEvent_1, iconLabels_1, iconRegistry_1, iconLabelHover_1, htmlContent_1, touch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusbarEntryItem = void 0;
    let StatusbarEntryItem = class StatusbarEntryItem extends lifecycle_1.Disposable {
        constructor(container, entry, hoverDelegate, commandService, notificationService, telemetryService, themeService) {
            super();
            this.container = container;
            this.hoverDelegate = hoverDelegate;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.themeService = themeService;
            this.entry = undefined;
            this.foregroundListener = this._register(new lifecycle_1.MutableDisposable());
            this.backgroundListener = this._register(new lifecycle_1.MutableDisposable());
            this.commandMouseListener = this._register(new lifecycle_1.MutableDisposable());
            this.commandTouchListener = this._register(new lifecycle_1.MutableDisposable());
            this.commandKeyboardListener = this._register(new lifecycle_1.MutableDisposable());
            this.hover = undefined;
            // Label Container
            this.labelContainer = document.createElement('a');
            this.labelContainer.tabIndex = -1; // allows screen readers to read title, but still prevents tab focus.
            this.labelContainer.setAttribute('role', 'button');
            this._register(touch_1.Gesture.addTarget(this.labelContainer)); // enable touch
            // Label (with support for progress)
            this.label = new StatusBarCodiconLabel(this.labelContainer);
            // Add to parent
            this.container.appendChild(this.labelContainer);
            this.update(entry);
        }
        get name() {
            return (0, types_1.assertIsDefined)(this.entry).name;
        }
        get hasCommand() {
            var _a;
            return typeof ((_a = this.entry) === null || _a === void 0 ? void 0 : _a.command) !== 'undefined';
        }
        update(entry) {
            // Update: Progress
            this.label.showProgress = !!entry.showProgress;
            // Update: Text
            if (!this.entry || entry.text !== this.entry.text) {
                this.label.text = entry.text;
                if (entry.text) {
                    (0, dom_1.show)(this.labelContainer);
                }
                else {
                    (0, dom_1.hide)(this.labelContainer);
                }
            }
            // Update: ARIA label
            //
            // Set the aria label on both elements so screen readers would read
            // the correct thing without duplication #96210
            if (!this.entry || entry.ariaLabel !== this.entry.ariaLabel) {
                this.container.setAttribute('aria-label', entry.ariaLabel);
                this.labelContainer.setAttribute('aria-label', entry.ariaLabel);
            }
            if (!this.entry || entry.role !== this.entry.role) {
                this.labelContainer.setAttribute('role', entry.role || 'button');
            }
            // Update: Hover
            if (!this.entry || !this.isEqualTooltip(this.entry, entry)) {
                const hoverContents = (0, htmlContent_1.isMarkdownString)(entry.tooltip) ? { markdown: entry.tooltip, markdownNotSupportedFallback: undefined } : entry.tooltip;
                if (this.hover) {
                    this.hover.update(hoverContents);
                }
                else {
                    this.hover = this._register((0, iconLabelHover_1.setupCustomHover)(this.hoverDelegate, this.container, hoverContents));
                }
            }
            // Update: Command
            if (!this.entry || entry.command !== this.entry.command) {
                this.commandMouseListener.clear();
                this.commandTouchListener.clear();
                this.commandKeyboardListener.clear();
                const command = entry.command;
                if (command && (command !== statusbar_1.ShowTooltipCommand || this.hover) /* "Show Hover" is only valid when we have a hover */) {
                    this.commandMouseListener.value = (0, dom_1.addDisposableListener)(this.labelContainer, dom_1.EventType.CLICK, () => this.executeCommand(command));
                    this.commandTouchListener.value = (0, dom_1.addDisposableListener)(this.labelContainer, touch_1.EventType.Tap, () => this.executeCommand(command));
                    this.commandKeyboardListener.value = (0, dom_1.addDisposableListener)(this.labelContainer, dom_1.EventType.KEY_DOWN, e => {
                        const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                        if (event.equals(10 /* KeyCode.Space */) || event.equals(3 /* KeyCode.Enter */)) {
                            this.executeCommand(command);
                        }
                    });
                    this.labelContainer.classList.remove('disabled');
                }
                else {
                    this.labelContainer.classList.add('disabled');
                }
            }
            // Update: Beak
            if (!this.entry || entry.showBeak !== this.entry.showBeak) {
                if (entry.showBeak) {
                    this.container.classList.add('has-beak');
                }
                else {
                    this.container.classList.remove('has-beak');
                }
            }
            // Update: Foreground
            if (!this.entry || entry.color !== this.entry.color) {
                this.applyColor(this.labelContainer, entry.color);
            }
            // Update: Background
            if (!this.entry || entry.backgroundColor !== this.entry.backgroundColor) {
                this.container.classList.toggle('has-background-color', !!entry.backgroundColor);
                this.applyColor(this.container, entry.backgroundColor, true);
            }
            // Remember for next round
            this.entry = entry;
        }
        isEqualTooltip({ tooltip }, { tooltip: otherTooltip }) {
            if (tooltip === undefined) {
                return otherTooltip === undefined;
            }
            if ((0, htmlContent_1.isMarkdownString)(tooltip)) {
                return (0, htmlContent_1.isMarkdownString)(otherTooltip) && (0, htmlContent_1.markdownStringEqual)(tooltip, otherTooltip);
            }
            return tooltip === otherTooltip;
        }
        async executeCommand(command) {
            var _a, _b;
            // Custom command from us: Show tooltip
            if (command === statusbar_1.ShowTooltipCommand) {
                (_a = this.hover) === null || _a === void 0 ? void 0 : _a.show(true /* focus */);
            }
            // Any other command is going through command service
            else {
                const id = typeof command === 'string' ? command : command.id;
                const args = typeof command === 'string' ? [] : (_b = command.arguments) !== null && _b !== void 0 ? _b : [];
                this.telemetryService.publicLog2('workbenchActionExecuted', { id, from: 'status bar' });
                try {
                    await this.commandService.executeCommand(id, ...args);
                }
                catch (error) {
                    this.notificationService.error((0, errorMessage_1.toErrorMessage)(error));
                }
            }
        }
        applyColor(container, color, isBackground) {
            var _a;
            let colorResult = undefined;
            if (isBackground) {
                this.backgroundListener.clear();
            }
            else {
                this.foregroundListener.clear();
            }
            if (color) {
                if ((0, editorCommon_1.isThemeColor)(color)) {
                    colorResult = (_a = this.themeService.getColorTheme().getColor(color.id)) === null || _a === void 0 ? void 0 : _a.toString();
                    const listener = this.themeService.onDidColorThemeChange(theme => {
                        var _a;
                        const colorValue = (_a = theme.getColor(color.id)) === null || _a === void 0 ? void 0 : _a.toString();
                        if (isBackground) {
                            container.style.backgroundColor = colorValue !== null && colorValue !== void 0 ? colorValue : '';
                        }
                        else {
                            container.style.color = colorValue !== null && colorValue !== void 0 ? colorValue : '';
                        }
                    });
                    if (isBackground) {
                        this.backgroundListener.value = listener;
                    }
                    else {
                        this.foregroundListener.value = listener;
                    }
                }
                else {
                    colorResult = color;
                }
            }
            if (isBackground) {
                container.style.backgroundColor = colorResult !== null && colorResult !== void 0 ? colorResult : '';
            }
            else {
                container.style.color = colorResult !== null && colorResult !== void 0 ? colorResult : '';
            }
        }
    };
    StatusbarEntryItem = __decorate([
        __param(3, commands_1.ICommandService),
        __param(4, notification_1.INotificationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, themeService_1.IThemeService)
    ], StatusbarEntryItem);
    exports.StatusbarEntryItem = StatusbarEntryItem;
    class StatusBarCodiconLabel extends simpleIconLabel_1.SimpleIconLabel {
        constructor(container) {
            super(container);
            this.container = container;
            this.progressCodicon = (0, iconLabels_1.renderIcon)(iconRegistry_1.syncing);
            this.currentText = '';
            this.currentShowProgress = false;
        }
        set showProgress(showProgress) {
            if (this.currentShowProgress !== showProgress) {
                this.currentShowProgress = showProgress;
                this.text = this.currentText;
            }
        }
        set text(text) {
            // Progress: insert progress codicon as first element as needed
            // but keep it stable so that the animation does not reset
            if (this.currentShowProgress) {
                // Append as needed
                if (this.container.firstChild !== this.progressCodicon) {
                    this.container.appendChild(this.progressCodicon);
                }
                // Remove others
                for (const node of Array.from(this.container.childNodes)) {
                    if (node !== this.progressCodicon) {
                        node.remove();
                    }
                }
                // If we have text to show, add a space to separate from progress
                let textContent = text !== null && text !== void 0 ? text : '';
                if (textContent) {
                    textContent = ` ${textContent}`;
                }
                // Append new elements
                (0, dom_1.append)(this.container, ...(0, iconLabels_1.renderLabelWithIcons)(textContent));
            }
            // No Progress: no special handling
            else {
                super.text = text;
            }
        }
    }
});
//# sourceMappingURL=statusbarItem.js.map