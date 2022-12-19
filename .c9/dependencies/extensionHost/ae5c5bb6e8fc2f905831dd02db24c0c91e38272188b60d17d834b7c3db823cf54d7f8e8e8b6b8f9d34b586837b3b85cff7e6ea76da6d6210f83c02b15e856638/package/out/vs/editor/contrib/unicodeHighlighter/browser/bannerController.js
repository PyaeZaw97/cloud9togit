var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/browser/link", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/css!./bannerController"], function (require, exports, dom_1, actionbar_1, actions_1, lifecycle_1, markdownRenderer_1, instantiation_1, link_1, iconRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BannerController = void 0;
    const BANNER_ELEMENT_HEIGHT = 26;
    let BannerController = class BannerController extends lifecycle_1.Disposable {
        constructor(_editor, instantiationService) {
            super();
            this._editor = _editor;
            this.instantiationService = instantiationService;
            this.banner = this._register(this.instantiationService.createInstance(Banner));
        }
        hide() {
            this._editor.setBanner(null, 0);
            this.banner.clear();
        }
        show(item) {
            this.banner.show(Object.assign(Object.assign({}, item), { onClose: () => {
                    this.hide();
                    if (item.onClose) {
                        item.onClose();
                    }
                } }));
            this._editor.setBanner(this.banner.element, BANNER_ELEMENT_HEIGHT);
        }
    };
    BannerController = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], BannerController);
    exports.BannerController = BannerController;
    // TODO@hediet: Investigate if this can be reused by the workspace banner (bannerPart.ts).
    let Banner = class Banner extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.markdownRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
            this.element = (0, dom_1.$)('div.editor-banner');
            this.element.tabIndex = 0;
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
        clear() {
            (0, dom_1.clearNode)(this.element);
        }
        show(item) {
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
            if (item.icon) {
                iconContainer.appendChild((0, dom_1.$)(`div${themeService_1.ThemeIcon.asCSSSelector(item.icon)}`));
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
            this.actionBar.push(this._register(new actions_1.Action('banner.close', 'Close Banner', themeService_1.ThemeIcon.asClassName(iconRegistry_1.widgetClose), true, () => {
                if (typeof item.onClose === 'function') {
                    item.onClose();
                }
            })), { icon: true, label: false });
            this.actionBar.setFocusable(false);
        }
    };
    Banner = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], Banner);
});
//# sourceMappingURL=bannerController.js.map