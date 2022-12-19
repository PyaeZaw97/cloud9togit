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
define(["require", "exports", "vs/base/common/event", "../common/decorations", "vs/base/common/map", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/linkedList", "vs/base/browser/dom", "vs/platform/theme/common/themeService", "vs/base/common/strings", "vs/nls", "vs/base/common/errors", "vs/base/common/cancellation", "vs/platform/instantiation/common/extensions", "vs/base/common/hash", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/arrays", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry"], function (require, exports, event_1, decorations_1, map_1, lifecycle_1, async_1, linkedList_1, dom_1, themeService_1, strings_1, nls_1, errors_1, cancellation_1, extensions_1, hash_1, uriIdentity_1, arrays_1, colorRegistry_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecorationsService = void 0;
    class DecorationRule {
        constructor(themeService, data, key) {
            this.themeService = themeService;
            this._refCounter = 0;
            this.data = data;
            const suffix = (0, hash_1.hash)(key).toString(36);
            this.itemColorClassName = `${DecorationRule._classNamesPrefix}-itemColor-${suffix}`;
            this.itemBadgeClassName = `${DecorationRule._classNamesPrefix}-itemBadge-${suffix}`;
            this.bubbleBadgeClassName = `${DecorationRule._classNamesPrefix}-bubbleBadge-${suffix}`;
            this.iconBadgeClassName = `${DecorationRule._classNamesPrefix}-iconBadge-${suffix}`;
        }
        static keyOf(data) {
            if (Array.isArray(data)) {
                return data.map(DecorationRule.keyOf).join(',');
            }
            else {
                const { color, letter } = data;
                if (themeService_1.ThemeIcon.isThemeIcon(letter)) {
                    return `${color}+${letter.id}`;
                }
                else {
                    return `${color}/${letter}`;
                }
            }
        }
        acquire() {
            this._refCounter += 1;
        }
        release() {
            return --this._refCounter === 0;
        }
        appendCSSRules(element) {
            if (!Array.isArray(this.data)) {
                this._appendForOne(this.data, element);
            }
            else {
                this._appendForMany(this.data, element);
            }
        }
        _appendForOne(data, element) {
            const { color, letter } = data;
            // label
            (0, dom_1.createCSSRule)(`.${this.itemColorClassName}`, `color: ${getColor(color)};`, element);
            if (themeService_1.ThemeIcon.isThemeIcon(letter)) {
                this._createIconCSSRule(letter, color, element);
            }
            else if (letter) {
                (0, dom_1.createCSSRule)(`.${this.itemBadgeClassName}::after`, `content: "${letter}"; color: ${getColor(color)};`, element);
            }
        }
        _appendForMany(data, element) {
            // label
            const { color } = data[0];
            (0, dom_1.createCSSRule)(`.${this.itemColorClassName}`, `color: ${getColor(color)};`, element);
            // badge or icon
            let letters = [];
            let icon;
            for (let d of data) {
                if (themeService_1.ThemeIcon.isThemeIcon(d.letter)) {
                    icon = d.letter;
                    break;
                }
                else if (d.letter) {
                    letters.push(d.letter);
                }
            }
            if (icon) {
                this._createIconCSSRule(icon, color, element);
            }
            else {
                if (letters.length) {
                    (0, dom_1.createCSSRule)(`.${this.itemBadgeClassName}::after`, `content: "${letters.join(', ')}"; color: ${getColor(color)};`, element);
                }
                // bubble badge
                // TODO @misolori update bubble badge to adopt letter: ThemeIcon instead of unicode
                (0, dom_1.createCSSRule)(`.${this.bubbleBadgeClassName}::after`, `content: "\uea71"; color: ${getColor(color)}; font-family: codicon; font-size: 14px; margin-right: 14px; opacity: 0.4;`, element);
            }
        }
        _createIconCSSRule(icon, color, element) {
            var _a, _b;
            const modifier = themeService_1.ThemeIcon.getModifier(icon);
            if (modifier) {
                icon = themeService_1.ThemeIcon.modify(icon, undefined);
            }
            const iconContribution = (0, iconRegistry_1.getIconRegistry)().getIcon(icon.id);
            if (!iconContribution) {
                return;
            }
            const definition = this.themeService.getProductIconTheme().getIcon(iconContribution);
            if (!definition) {
                return;
            }
            (0, dom_1.createCSSRule)(`.${this.iconBadgeClassName}::after`, `content: '${definition.fontCharacter}';
			color: ${getColor(color)};
			font-family: ${(0, dom_1.asCSSPropertyValue)((_b = (_a = definition.font) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 'codicon')};
			font-size: 16px;
			margin-right: 14px;
			font-weight: normal;
			${modifier === 'spin' ? 'animation: codicon-spin 1.5s steps(30) infinite' : ''};
			`, element);
        }
        removeCSSRules(element) {
            (0, dom_1.removeCSSRulesContainingSelector)(this.itemColorClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.itemBadgeClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.bubbleBadgeClassName, element);
            (0, dom_1.removeCSSRulesContainingSelector)(this.iconBadgeClassName, element);
        }
    }
    DecorationRule._classNamesPrefix = 'monaco-decoration';
    class DecorationStyles {
        constructor(_themeService) {
            this._themeService = _themeService;
            this._styleElement = (0, dom_1.createStyleSheet)();
            this._decorationRules = new Map();
            this._dispoables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._dispoables.dispose();
            this._styleElement.remove();
        }
        asDecoration(data, onlyChildren) {
            // sort by weight
            data.sort((a, b) => (b.weight || 0) - (a.weight || 0));
            let key = DecorationRule.keyOf(data);
            let rule = this._decorationRules.get(key);
            if (!rule) {
                // new css rule
                rule = new DecorationRule(this._themeService, data, key);
                this._decorationRules.set(key, rule);
                rule.appendCSSRules(this._styleElement);
            }
            rule.acquire();
            let labelClassName = rule.itemColorClassName;
            let badgeClassName = rule.itemBadgeClassName;
            let iconClassName = rule.iconBadgeClassName;
            let tooltip = (0, arrays_1.distinct)(data.filter(d => !(0, strings_1.isFalsyOrWhitespace)(d.tooltip)).map(d => d.tooltip)).join(' • ');
            let strikethrough = data.some(d => d.strikethrough);
            if (onlyChildren) {
                // show items from its children only
                badgeClassName = rule.bubbleBadgeClassName;
                tooltip = (0, nls_1.localize)('bubbleTitle', "Contains emphasized items");
            }
            return {
                labelClassName,
                badgeClassName,
                iconClassName,
                strikethrough,
                tooltip,
                dispose: () => {
                    if (rule === null || rule === void 0 ? void 0 : rule.release()) {
                        this._decorationRules.delete(key);
                        rule.removeCSSRules(this._styleElement);
                        rule = undefined;
                    }
                }
            };
        }
    }
    class FileDecorationChangeEvent {
        constructor(all) {
            this._data = map_1.TernarySearchTree.forUris(_uri => true); // events ignore all path casings
            this._data.fill(true, (0, arrays_1.asArray)(all));
        }
        affectsResource(uri) {
            var _a;
            return (_a = this._data.get(uri)) !== null && _a !== void 0 ? _a : this._data.findSuperstr(uri) !== undefined;
        }
    }
    class DecorationDataRequest {
        constructor(source, thenable) {
            this.source = source;
            this.thenable = thenable;
        }
    }
    function getColor(color) {
        return color ? `var(${(0, colorRegistry_1.asCssVariableName)(color)})` : 'inherit';
    }
    let DecorationsService = class DecorationsService {
        constructor(uriIdentityService, themeService) {
            this._onDidChangeDecorationsDelayed = new event_1.DebounceEmitter({ merge: all => all.flat() });
            this._onDidChangeDecorations = new event_1.Emitter();
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this._provider = new linkedList_1.LinkedList();
            this._decorationStyles = new DecorationStyles(themeService);
            this._data = map_1.TernarySearchTree.forUris(key => uriIdentityService.extUri.ignorePathCasing(key));
            this._onDidChangeDecorationsDelayed.event(event => { this._onDidChangeDecorations.fire(new FileDecorationChangeEvent(event)); });
        }
        dispose() {
            this._onDidChangeDecorations.dispose();
            this._onDidChangeDecorationsDelayed.dispose();
        }
        registerDecorationsProvider(provider) {
            const rm = this._provider.unshift(provider);
            this._onDidChangeDecorations.fire({
                // everything might have changed
                affectsResource() { return true; }
            });
            // remove everything what came from this provider
            const removeAll = () => {
                const uris = [];
                for (let [uri, map] of this._data) {
                    if (map.delete(provider)) {
                        uris.push(uri);
                    }
                }
                if (uris.length > 0) {
                    this._onDidChangeDecorationsDelayed.fire(uris);
                }
            };
            const listener = provider.onDidChange(uris => {
                if (!uris) {
                    // flush event -> drop all data, can affect everything
                    removeAll();
                }
                else {
                    // selective changes -> drop for resource, fetch again, send event
                    for (const uri of uris) {
                        const map = this._ensureEntry(uri);
                        this._fetchData(map, uri, provider);
                    }
                }
            });
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                listener.dispose();
                removeAll();
            });
        }
        _ensureEntry(uri) {
            let map = this._data.get(uri);
            if (!map) {
                // nothing known about this uri
                map = new Map();
                this._data.set(uri, map);
            }
            return map;
        }
        getDecoration(uri, includeChildren) {
            let all = [];
            let containsChildren = false;
            const map = this._ensureEntry(uri);
            for (const provider of this._provider) {
                let data = map.get(provider);
                if (data === undefined) {
                    // sets data if fetch is sync
                    data = this._fetchData(map, uri, provider);
                }
                if (data && !(data instanceof DecorationDataRequest)) {
                    // having data
                    all.push(data);
                }
            }
            if (includeChildren) {
                // (resolved) children
                const iter = this._data.findSuperstr(uri);
                if (iter) {
                    for (const tuple of iter) {
                        for (const data of tuple[1].values()) {
                            if (data && !(data instanceof DecorationDataRequest)) {
                                if (data.bubble) {
                                    all.push(data);
                                    containsChildren = true;
                                }
                            }
                        }
                    }
                }
            }
            return all.length === 0
                ? undefined
                : this._decorationStyles.asDecoration(all, containsChildren);
        }
        _fetchData(map, uri, provider) {
            // check for pending request and cancel it
            const pendingRequest = map.get(provider);
            if (pendingRequest instanceof DecorationDataRequest) {
                pendingRequest.source.cancel();
                map.delete(provider);
            }
            const source = new cancellation_1.CancellationTokenSource();
            const dataOrThenable = provider.provideDecorations(uri, source.token);
            if (!(0, async_1.isThenable)(dataOrThenable)) {
                // sync -> we have a result now
                return this._keepItem(map, provider, uri, dataOrThenable);
            }
            else {
                // async -> we have a result soon
                const request = new DecorationDataRequest(source, Promise.resolve(dataOrThenable).then(data => {
                    if (map.get(provider) === request) {
                        this._keepItem(map, provider, uri, data);
                    }
                }).catch(err => {
                    if (!(0, errors_1.isCancellationError)(err) && map.get(provider) === request) {
                        map.delete(provider);
                    }
                }));
                map.set(provider, request);
                return null;
            }
        }
        _keepItem(map, provider, uri, data) {
            const deco = data ? data : null;
            const old = map.set(provider, deco);
            if (deco || old) {
                // only fire event when something changed
                this._onDidChangeDecorationsDelayed.fire(uri);
            }
            return deco;
        }
    };
    DecorationsService = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, themeService_1.IThemeService)
    ], DecorationsService);
    exports.DecorationsService = DecorationsService;
    (0, extensions_1.registerSingleton)(decorations_1.IDecorationsService, DecorationsService, true);
});
//# sourceMappingURL=decorationsService.js.map