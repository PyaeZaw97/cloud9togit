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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/inlineCompletions/browser/ghostTextController", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/opener/common/opener", "vs/editor/contrib/inlineCompletions/browser/consts"], function (require, exports, dom, htmlContent_1, lifecycle_1, markdownRenderer_1, range_1, language_1, hoverTypes_1, ghostTextController_1, nls, accessibility_1, actions_1, commands_1, contextkey_1, opener_1, consts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionsHoverParticipant = exports.InlineCompletionsHover = void 0;
    class InlineCompletionsHover {
        constructor(owner, range, controller) {
            this.owner = owner;
            this.range = range;
            this.controller = controller;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
        hasMultipleSuggestions() {
            return this.controller.hasMultipleInlineCompletions();
        }
        get commands() {
            var _a, _b, _c;
            return ((_c = (_b = (_a = this.controller.activeModel) === null || _a === void 0 ? void 0 : _a.activeInlineCompletionsModel) === null || _b === void 0 ? void 0 : _b.completionSession.value) === null || _c === void 0 ? void 0 : _c.commands) || [];
        }
    }
    exports.InlineCompletionsHover = InlineCompletionsHover;
    let InlineCompletionsHoverParticipant = class InlineCompletionsHoverParticipant {
        constructor(_editor, _commandService, _menuService, _contextKeyService, _languageService, _openerService, accessibilityService) {
            this._editor = _editor;
            this._commandService = _commandService;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this.accessibilityService = accessibilityService;
            this.hoverOrdinal = 3;
        }
        suggestHoverAnchor(mouseEvent) {
            const controller = ghostTextController_1.GhostTextController.get(this._editor);
            if (!controller) {
                return null;
            }
            const target = mouseEvent.target;
            if (target.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */) {
                // handle the case where the mouse is over the view zone
                const viewZoneData = target.detail;
                if (controller.shouldShowHoverAtViewZone(viewZoneData.viewZoneId)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, range_1.Range.fromPositions(viewZoneData.positionBefore || viewZoneData.position, viewZoneData.positionBefore || viewZoneData.position));
                }
            }
            if (target.type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                // handle the case where the mouse is over the empty portion of a line following ghost text
                if (controller.shouldShowHoverAt(target.range)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, target.range);
                }
            }
            if (target.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                // handle the case where the mouse is directly over ghost text
                const mightBeForeignElement = target.detail.mightBeForeignElement;
                if (mightBeForeignElement && controller.shouldShowHoverAt(target.range)) {
                    return new hoverTypes_1.HoverForeignElementAnchor(1000, this, target.range);
                }
            }
            return null;
        }
        computeSync(anchor, lineDecorations) {
            const controller = ghostTextController_1.GhostTextController.get(this._editor);
            if (controller && controller.shouldShowHoverAt(anchor.range)) {
                return [new InlineCompletionsHover(this, anchor.range, controller)];
            }
            return [];
        }
        renderHoverParts(context, hoverParts) {
            const disposableStore = new lifecycle_1.DisposableStore();
            const part = hoverParts[0];
            if (this.accessibilityService.isScreenReaderOptimized()) {
                this.renderScreenReaderText(context, part, disposableStore);
            }
            // TODO@hediet: deprecate MenuId.InlineCompletionsActions
            const menu = disposableStore.add(this._menuService.createMenu(actions_1.MenuId.InlineCompletionsActions, this._contextKeyService));
            const previousAction = context.statusBar.addAction({
                label: nls.localize('showNextInlineSuggestion', "Next"),
                commandId: ghostTextController_1.ShowNextInlineSuggestionAction.ID,
                run: () => this._commandService.executeCommand(ghostTextController_1.ShowNextInlineSuggestionAction.ID)
            });
            const nextAction = context.statusBar.addAction({
                label: nls.localize('showPreviousInlineSuggestion', "Previous"),
                commandId: ghostTextController_1.ShowPreviousInlineSuggestionAction.ID,
                run: () => this._commandService.executeCommand(ghostTextController_1.ShowPreviousInlineSuggestionAction.ID)
            });
            context.statusBar.addAction({
                label: nls.localize('acceptInlineSuggestion', "Accept"),
                commandId: consts_1.inlineSuggestCommitId,
                run: () => this._commandService.executeCommand(consts_1.inlineSuggestCommitId)
            });
            const actions = [previousAction, nextAction];
            for (const action of actions) {
                action.setEnabled(false);
            }
            part.hasMultipleSuggestions().then(hasMore => {
                for (const action of actions) {
                    action.setEnabled(hasMore);
                }
            });
            for (const command of part.commands) {
                context.statusBar.addAction({
                    label: command.title,
                    commandId: command.id,
                    run: () => this._commandService.executeCommand(command.id, ...(command.arguments || []))
                });
            }
            for (const [_, group] of menu.getActions()) {
                for (const action of group) {
                    if (action instanceof actions_1.MenuItemAction) {
                        context.statusBar.addAction({
                            label: action.label,
                            commandId: action.item.id,
                            run: () => this._commandService.executeCommand(action.item.id)
                        });
                    }
                }
            }
            return disposableStore;
        }
        renderScreenReaderText(context, part, disposableStore) {
            var _a, _b;
            const $ = dom.$;
            const markdownHoverElement = $('div.hover-row.markdown-hover');
            const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents'));
            const renderer = disposableStore.add(new markdownRenderer_1.MarkdownRenderer({ editor: this._editor }, this._languageService, this._openerService));
            const render = (code) => {
                disposableStore.add(renderer.onDidRenderAsync(() => {
                    hoverContentsElement.className = 'hover-contents code-hover-contents';
                    context.onContentsChanged();
                }));
                const inlineSuggestionAvailable = nls.localize('inlineSuggestionFollows', "Suggestion:");
                const renderedContents = disposableStore.add(renderer.render(new htmlContent_1.MarkdownString().appendText(inlineSuggestionAvailable).appendCodeblock('text', code)));
                hoverContentsElement.replaceChildren(renderedContents.element);
            };
            const ghostText = (_b = (_a = part.controller.activeModel) === null || _a === void 0 ? void 0 : _a.inlineCompletionsModel) === null || _b === void 0 ? void 0 : _b.ghostText;
            if (ghostText) {
                const lineText = this._editor.getModel().getLineContent(ghostText.lineNumber);
                render(ghostText.renderForScreenReader(lineText));
            }
            context.fragment.appendChild(markdownHoverElement);
        }
    };
    InlineCompletionsHoverParticipant = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, language_1.ILanguageService),
        __param(5, opener_1.IOpenerService),
        __param(6, accessibility_1.IAccessibilityService)
    ], InlineCompletionsHoverParticipant);
    exports.InlineCompletionsHoverParticipant = InlineCompletionsHoverParticipant;
});
//# sourceMappingURL=ghostTextHoverParticipant.js.map