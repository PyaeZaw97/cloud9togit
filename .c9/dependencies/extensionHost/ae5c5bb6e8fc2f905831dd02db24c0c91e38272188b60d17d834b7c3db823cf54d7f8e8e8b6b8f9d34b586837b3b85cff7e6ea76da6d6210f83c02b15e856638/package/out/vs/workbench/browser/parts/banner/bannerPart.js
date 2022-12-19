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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/codicons", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/workbench/browser/part", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/actions", "vs/platform/opener/browser/link", "vs/base/common/event", "vs/workbench/services/banner/browser/bannerService", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "vs/workbench/common/theme", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/contextkeys", "vs/css!./media/bannerpart"], function (require, exports, nls_1, dom_1, actionbar_1, codicons_1, extensions_1, instantiation_1, storage_1, themeService_1, part_1, layoutService_1, actions_1, link_1, event_1, bannerService_1, markdownRenderer_1, theme_1, actions_2, actions_3, keybindingsRegistry_1, contextkey_1, uri_1, iconRegistry_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BannerPart = void 0;
    // Theme support
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const backgroundColor = theme.getColor(theme_1.BANNER_BACKGROUND);
        if (backgroundColor) {
            collector.addRule(`.monaco-workbench .part.banner { background-color: ${backgroundColor}; }`);
        }
        const foregroundColor = theme.getColor(theme_1.BANNER_FOREGROUND);
        if (foregroundColor) {
            collector.addRule(`
			.monaco-workbench .part.banner,
			.monaco-workbench .part.banner .action-container .codicon,
			.monaco-workbench .part.banner .message-actions-container .monaco-link,
			.monaco-workbench .part.banner .message-container a
			{ color: ${foregroundColor}; }
		`);
        }
        const iconForegroundColor = theme.getColor(theme_1.BANNER_ICON_FOREGROUND);
        if (iconForegroundColor) {
            collector.addRule(`.monaco-workbench .part.banner .icon-container .codicon { color: ${iconForegroundColor} }`);
        }
    });
    // Banner Part
    let BannerPart = class BannerPart extends part_1.Part {
        constructor(themeService, layoutService, storageService, contextKeyService, instantiationService) {
            super("workbench.parts.banner" /* Parts.BANNER_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            // #region IView
            this.height = 26;
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this._onDidChangeSize = this._register(new event_1.Emitter());
            this.visible = false;
            this.focusedActionIndex = -1;
            this.markdownRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
        }
        get minimumHeight() {
            return this.visible ? this.height : 0;
        }
        get maximumHeight() {
            return this.visible ? this.height : 0;
        }
        get onDidChange() { return this._onDidChangeSize.event; }
        createContentArea(parent) {
            this.element = parent;
            this.element.tabIndex = 0;
            // Restore focused action if needed
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.FOCUS, () => {
                if (this.focusedActionIndex !== -1) {
                    this.focusActionLink();
                }
            }));
            // Track focus
            const scopedContextKeyService = this.contextKeyService.createScoped(this.element);
            contextkeys_1.BannerFocused.bindTo(scopedContextKeyService).set(true);
            return this.element;
        }
        close(item) {
            // Hide banner
            this.setVisibility(false);
            // Remove from document
            (0, dom_1.clearNode)(this.element);
            // Remember choice
            if (typeof item.onClose === 'function') {
                item.onClose();
            }
            this.item = undefined;
        }
        focusActionLink() {
            var _a, _b, _c, _d, _e, _f;
            const length = (_c = (_b = (_a = this.item) === null || _a === void 0 ? void 0 : _a.actions) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
            if (this.focusedActionIndex < length) {
                const actionLink = (_d = this.messageActionsContainer) === null || _d === void 0 ? void 0 : _d.children[this.focusedActionIndex];
                if (actionLink instanceof HTMLElement) {
                    (_e = this.actionBar) === null || _e === void 0 ? void 0 : _e.setFocusable(false);
                    actionLink.focus();
                }
            }
            else {
                (_f = this.actionBar) === null || _f === void 0 ? void 0 : _f.focus(0);
            }
        }
        getAriaLabel(item) {
            if (item.ariaLabel) {
                return item.ariaLabel;
            }
            if (typeof item.message === 'string') {
                return item.message;
            }
            return undefined;
        }
        getBannerMessage(message) {
            if (typeof message === 'string') {
                const element = (0, dom_1.$)('span');
                element.innerText = message;
                return element;
            }
            return this.markdownRenderer.render(message).element;
        }
        setVisibility(visible) {
            if (visible !== this.visible) {
                this.visible = visible;
                this.focusedActionIndex = -1;
                this.layoutService.setPartHidden(!visible, "workbench.parts.banner" /* Parts.BANNER_PART */);
                this._onDidChangeSize.fire(undefined);
            }
        }
        focus() {
            this.focusedActionIndex = -1;
            this.element.focus();
        }
        focusNextAction() {
            var _a, _b, _c;
            const length = (_c = (_b = (_a = this.item) === null || _a === void 0 ? void 0 : _a.actions) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
            this.focusedActionIndex = this.focusedActionIndex < length ? this.focusedActionIndex + 1 : 0;
            this.focusActionLink();
        }
        focusPreviousAction() {
            var _a, _b, _c;
            const length = (_c = (_b = (_a = this.item) === null || _a === void 0 ? void 0 : _a.actions) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
            this.focusedActionIndex = this.focusedActionIndex > 0 ? this.focusedActionIndex - 1 : length;
            this.focusActionLink();
        }
        hide(id) {
            var _a;
            if (((_a = this.item) === null || _a === void 0 ? void 0 : _a.id) !== id) {
                return;
            }
            this.setVisibility(false);
        }
        show(item) {
            var _a;
            if (item.id === ((_a = this.item) === null || _a === void 0 ? void 0 : _a.id)) {
                this.setVisibility(true);
                return;
            }
            // Clear previous item
            (0, dom_1.clearNode)(this.element);
            // Banner aria label
            const ariaLabel = this.getAriaLabel(item);
            if (ariaLabel) {
                this.element.setAttribute('aria-label', ariaLabel);
            }
            // Icon
            const iconContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.icon-container'));
            iconContainer.setAttribute('aria-hidden', 'true');
            if (item.icon instanceof codicons_1.Codicon) {
                iconContainer.appendChild((0, dom_1.$)(`div${item.icon.cssSelector}`));
            }
            else {
                iconContainer.classList.add('custom-icon');
                if (uri_1.URI.isUri(item.icon)) {
                    iconContainer.style.backgroundImage = (0, dom_1.asCSSUrl)(item.icon);
                }
            }
            // Message
            const messageContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.message-container'));
            messageContainer.setAttribute('aria-hidden', 'true');
            messageContainer.appendChild(this.getBannerMessage(item.message));
            // Message Actions
            this.messageActionsContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.message-actions-container'));
            if (item.actions) {
                for (const action of item.actions) {
                    this._register(this.instantiationService.createInstance(link_1.Link, this.messageActionsContainer, Object.assign(Object.assign({}, action), { tabIndex: -1 }), {}));
                }
            }
            // Action
            const actionBarContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.action-container'));
            this.actionBar = this._register(new actionbar_1.ActionBar(actionBarContainer));
            const closeAction = this._register(new actions_1.Action('banner.close', 'Close Banner', themeService_1.ThemeIcon.asClassName(iconRegistry_1.widgetClose), true, () => this.close(item)));
            this.actionBar.push(closeAction, { icon: true, label: false });
            this.actionBar.setFocusable(false);
            this.setVisibility(true);
            this.item = item;
        }
        toJSON() {
            return {
                type: "workbench.parts.banner" /* Parts.BANNER_PART */
            };
        }
    };
    BannerPart = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, storage_1.IStorageService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, instantiation_1.IInstantiationService)
    ], BannerPart);
    exports.BannerPart = BannerPart;
    (0, extensions_1.registerSingleton)(bannerService_1.IBannerService, BannerPart);
    // Keybindings
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.banner.focusBanner',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 9 /* KeyCode.Escape */,
        when: contextkeys_1.BannerFocused,
        handler: (accessor) => {
            const bannerService = accessor.get(bannerService_1.IBannerService);
            bannerService.focus();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.banner.focusNextAction',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 17 /* KeyCode.RightArrow */,
        secondary: [18 /* KeyCode.DownArrow */],
        when: contextkeys_1.BannerFocused,
        handler: (accessor) => {
            const bannerService = accessor.get(bannerService_1.IBannerService);
            bannerService.focusNextAction();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.banner.focusPreviousAction',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 15 /* KeyCode.LeftArrow */,
        secondary: [16 /* KeyCode.UpArrow */],
        when: contextkeys_1.BannerFocused,
        handler: (accessor) => {
            const bannerService = accessor.get(bannerService_1.IBannerService);
            bannerService.focusPreviousAction();
        }
    });
    // Actions
    class FocusBannerAction extends actions_2.Action2 {
        constructor() {
            super({
                id: FocusBannerAction.ID,
                title: { value: FocusBannerAction.LABEL, original: 'Focus Banner' },
                category: actions_3.CATEGORIES.View,
                f1: true
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.focusPart("workbench.parts.banner" /* Parts.BANNER_PART */);
        }
    }
    FocusBannerAction.ID = 'workbench.action.focusBanner';
    FocusBannerAction.LABEL = (0, nls_1.localize)('focusBanner', "Focus Banner");
    (0, actions_2.registerAction2)(FocusBannerAction);
});
//# sourceMappingURL=bannerPart.js.map