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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, event_1, keyboardEvent_1, touch_1, event_2, lifecycle_1, opener_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Link = void 0;
    let Link = class Link extends lifecycle_1.Disposable {
        constructor(container, _link, options = {}, openerService) {
            var _a;
            super();
            this._link = _link;
            this._enabled = true;
            this.el = (0, dom_1.append)(container, (0, dom_1.$)('a.monaco-link', {
                tabIndex: (_a = _link.tabIndex) !== null && _a !== void 0 ? _a : 0,
                href: _link.href,
                title: _link.title
            }, _link.label));
            this.el.setAttribute('role', 'button');
            const onClickEmitter = this._register(new event_1.DomEmitter(this.el, 'click'));
            const onKeyPress = this._register(new event_1.DomEmitter(this.el, 'keypress'));
            const onEnterPress = event_2.Event.chain(onKeyPress.event)
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(e => e.keyCode === 3 /* KeyCode.Enter */)
                .event;
            const onTap = this._register(new event_1.DomEmitter(this.el, touch_1.EventType.Tap)).event;
            this._register(touch_1.Gesture.addTarget(this.el));
            const onOpen = event_2.Event.any(onClickEmitter.event, onEnterPress, onTap);
            this._register(onOpen(e => {
                if (!this.enabled) {
                    return;
                }
                dom_1.EventHelper.stop(e, true);
                if (options === null || options === void 0 ? void 0 : options.opener) {
                    options.opener(this._link.href);
                }
                else {
                    openerService.open(this._link.href, { allowCommands: true });
                }
            }));
            this.enabled = true;
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            if (enabled) {
                this.el.setAttribute('aria-disabled', 'false');
                this.el.tabIndex = 0;
                this.el.style.pointerEvents = 'auto';
                this.el.style.opacity = '1';
                this.el.style.cursor = 'pointer';
                this._enabled = false;
            }
            else {
                this.el.setAttribute('aria-disabled', 'true');
                this.el.tabIndex = -1;
                this.el.style.pointerEvents = 'none';
                this.el.style.opacity = '0.4';
                this.el.style.cursor = 'default';
                this._enabled = true;
            }
            this._enabled = enabled;
        }
        set link(link) {
            if (typeof link.label === 'string') {
                this.el.textContent = link.label;
            }
            else {
                (0, dom_1.clearNode)(this.el);
                this.el.appendChild(link.label);
            }
            this.el.href = link.href;
            if (typeof link.tabIndex !== 'undefined') {
                this.el.tabIndex = link.tabIndex;
            }
            if (typeof link.title !== 'undefined') {
                this.el.title = link.title;
            }
            this._link = link;
        }
    };
    Link = __decorate([
        __param(3, opener_1.IOpenerService)
    ], Link);
    exports.Link = Link;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const textLinkForegroundColor = theme.getColor(colorRegistry_1.textLinkForeground);
        if (textLinkForegroundColor) {
            collector.addRule(`.monaco-link { color: ${textLinkForegroundColor}; }`);
        }
        const textLinkActiveForegroundColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (textLinkActiveForegroundColor) {
            collector.addRule(`.monaco-link:hover { color: ${textLinkActiveForegroundColor}; }`);
        }
    });
});
//# sourceMappingURL=link.js.map