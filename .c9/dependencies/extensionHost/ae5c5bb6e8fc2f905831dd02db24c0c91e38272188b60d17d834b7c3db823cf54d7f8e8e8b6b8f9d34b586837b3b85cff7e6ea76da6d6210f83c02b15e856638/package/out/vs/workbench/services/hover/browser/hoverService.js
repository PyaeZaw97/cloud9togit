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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/hover/browser/hover", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/hover/browser/hoverWidget", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/css!./media/hover"], function (require, exports, extensions_1, themeService_1, colorRegistry_1, hover_1, contextView_1, instantiation_1, hoverWidget_1, lifecycle_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverService = void 0;
    let HoverService = class HoverService {
        constructor(_instantiationService, _contextViewService, contextMenuService) {
            this._instantiationService = _instantiationService;
            this._contextViewService = _contextViewService;
            contextMenuService.onDidShowContextMenu(() => this.hideHover());
        }
        showHover(options, focus) {
            if (this._currentHoverOptions === options) {
                return undefined;
            }
            this._currentHoverOptions = options;
            const hoverDisposables = new lifecycle_1.DisposableStore();
            const hover = this._instantiationService.createInstance(hoverWidget_1.HoverWidget, options);
            hover.onDispose(() => {
                this._currentHoverOptions = undefined;
                hoverDisposables.dispose();
            });
            const provider = this._contextViewService;
            provider.showContextView(new HoverContextViewDelegate(hover, focus));
            hover.onRequestLayout(() => provider.layout());
            if ('targetElements' in options.target) {
                for (const element of options.target.targetElements) {
                    hoverDisposables.add((0, dom_1.addDisposableListener)(element, dom_1.EventType.CLICK, () => this.hideHover()));
                }
            }
            else {
                hoverDisposables.add((0, dom_1.addDisposableListener)(options.target, dom_1.EventType.CLICK, () => this.hideHover()));
            }
            if (options.hideOnKeyDown) {
                const focusedElement = document.activeElement;
                if (focusedElement) {
                    hoverDisposables.add((0, dom_1.addDisposableListener)(focusedElement, dom_1.EventType.KEY_DOWN, () => this.hideHover()));
                }
            }
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver(e => this._intersectionChange(e, hover), { threshold: 0 });
                const firstTargetElement = 'targetElements' in options.target ? options.target.targetElements[0] : options.target;
                observer.observe(firstTargetElement);
                hoverDisposables.add((0, lifecycle_1.toDisposable)(() => observer.disconnect()));
            }
            return hover;
        }
        hideHover() {
            if (!this._currentHoverOptions) {
                return;
            }
            this._currentHoverOptions = undefined;
            this._contextViewService.hideContextView();
        }
        _intersectionChange(entries, hover) {
            const entry = entries[entries.length - 1];
            if (!entry.isIntersecting) {
                hover.dispose();
            }
        }
    };
    HoverService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextView_1.IContextViewService),
        __param(2, contextView_1.IContextMenuService)
    ], HoverService);
    exports.HoverService = HoverService;
    class HoverContextViewDelegate {
        constructor(_hover, _focus = false) {
            this._hover = _hover;
            this._focus = _focus;
        }
        get anchorPosition() {
            return this._hover.anchor;
        }
        render(container) {
            this._hover.render(container);
            if (this._focus) {
                this._hover.focus();
            }
            return this._hover;
        }
        getAnchor() {
            return {
                x: this._hover.x,
                y: this._hover.y
            };
        }
        layout() {
            this._hover.layout();
        }
    }
    (0, extensions_1.registerSingleton)(hover_1.IHoverService, HoverService, true);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const hoverBackground = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (hoverBackground) {
            collector.addRule(`.monaco-workbench .workbench-hover { background-color: ${hoverBackground}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover-pointer:after { background-color: ${hoverBackground}; }`);
        }
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-workbench .workbench-hover { border: 1px solid ${hoverBorder}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover hr { border-bottom: 0px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover-pointer:after { border-right: 1px solid ${hoverBorder}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover-pointer:after { border-bottom: 1px solid ${hoverBorder}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .workbench-hover a { color: ${link}; }`);
        }
        const linkHover = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (linkHover) {
            collector.addRule(`.monaco-workbench .workbench-hover a:hover { color: ${linkHover}; }`);
        }
        const hoverForeground = theme.getColor(colorRegistry_1.editorHoverForeground);
        if (hoverForeground) {
            collector.addRule(`.monaco-workbench .workbench-hover { color: ${hoverForeground}; }`);
        }
        const actionsBackground = theme.getColor(colorRegistry_1.editorHoverStatusBarBackground);
        if (actionsBackground) {
            collector.addRule(`.monaco-workbench .workbench-hover .hover-row .actions { background-color: ${actionsBackground}; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.monaco-workbench .workbench-hover code { background-color: ${codeBackground}; }`);
        }
    });
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
        if (widgetShadowColor) {
            collector.addRule(`.monaco-workbench .workbench-hover { box-shadow: 0 2px 8px ${widgetShadowColor}; }`);
        }
    });
});
//# sourceMappingURL=hoverService.js.map