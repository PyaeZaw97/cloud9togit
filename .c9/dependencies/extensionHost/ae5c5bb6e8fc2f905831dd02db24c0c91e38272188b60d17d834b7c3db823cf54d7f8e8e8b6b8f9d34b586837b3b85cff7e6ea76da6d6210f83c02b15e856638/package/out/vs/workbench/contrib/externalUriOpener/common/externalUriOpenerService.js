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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/languages", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/contrib/url/common/urlGlob", "vs/workbench/services/preferences/common/preferences"], function (require, exports, arrays_1, iterator_1, lifecycle_1, linkedList_1, platform_1, uri_1, languages, nls, configuration_1, instantiation_1, log_1, opener_1, quickInput_1, storage_1, configuration_2, urlGlob_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalUriOpenerService = exports.IExternalUriOpenerService = void 0;
    exports.IExternalUriOpenerService = (0, instantiation_1.createDecorator)('externalUriOpenerService');
    let ExternalUriOpenerService = class ExternalUriOpenerService extends lifecycle_1.Disposable {
        constructor(openerService, storageService, configurationService, logService, preferencesService, quickInputService) {
            super();
            this.configurationService = configurationService;
            this.logService = logService;
            this.preferencesService = preferencesService;
            this.quickInputService = quickInputService;
            this._providers = new linkedList_1.LinkedList();
            this._register(openerService.registerExternalOpener(this));
        }
        registerExternalOpenerProvider(provider) {
            const remove = this._providers.push(provider);
            return { dispose: remove };
        }
        async getOpeners(targetUri, allowOptional, ctx, token) {
            const allOpeners = await this.getAllOpenersForUri(targetUri);
            if (allOpeners.size === 0) {
                return [];
            }
            // First see if we have a preferredOpener
            if (ctx.preferredOpenerId) {
                if (ctx.preferredOpenerId === configuration_2.defaultExternalUriOpenerId) {
                    return [];
                }
                const preferredOpener = allOpeners.get(ctx.preferredOpenerId);
                if (preferredOpener) {
                    // Skip the `canOpen` check here since the opener was specifically requested.
                    return [preferredOpener];
                }
            }
            // Check to see if we have a configured opener
            const configuredOpener = this.getConfiguredOpenerForUri(allOpeners, targetUri);
            if (configuredOpener) {
                // Skip the `canOpen` check here since the opener was specifically requested.
                return configuredOpener === configuration_2.defaultExternalUriOpenerId ? [] : [configuredOpener];
            }
            // Then check to see if there is a valid opener
            const validOpeners = [];
            await Promise.all(Array.from(allOpeners.values()).map(async (opener) => {
                let priority;
                try {
                    priority = await opener.canOpen(ctx.sourceUri, token);
                }
                catch (e) {
                    this.logService.error(e);
                    return;
                }
                switch (priority) {
                    case languages.ExternalUriOpenerPriority.Option:
                    case languages.ExternalUriOpenerPriority.Default:
                    case languages.ExternalUriOpenerPriority.Preferred:
                        validOpeners.push({ opener, priority });
                        break;
                }
            }));
            if (validOpeners.length === 0) {
                return [];
            }
            // See if we have a preferred opener first
            const preferred = (0, arrays_1.firstOrDefault)(validOpeners.filter(x => x.priority === languages.ExternalUriOpenerPriority.Preferred));
            if (preferred) {
                return [preferred.opener];
            }
            // See if we only have optional openers, use the default opener
            if (!allowOptional && validOpeners.every(x => x.priority === languages.ExternalUriOpenerPriority.Option)) {
                return [];
            }
            return validOpeners.map(value => value.opener);
        }
        async openExternal(href, ctx, token) {
            const targetUri = typeof href === 'string' ? uri_1.URI.parse(href) : href;
            const allOpeners = await this.getOpeners(targetUri, false, ctx, token);
            if (allOpeners.length === 0) {
                return false;
            }
            else if (allOpeners.length === 1) {
                return allOpeners[0].openExternalUri(targetUri, ctx, token);
            }
            // Otherwise prompt
            return this.showOpenerPrompt(allOpeners, targetUri, ctx, token);
        }
        async getOpener(targetUri, ctx, token) {
            const allOpeners = await this.getOpeners(targetUri, true, ctx, token);
            if (allOpeners.length >= 1) {
                return allOpeners[0];
            }
            return undefined;
        }
        async getAllOpenersForUri(targetUri) {
            const allOpeners = new Map();
            await Promise.all(iterator_1.Iterable.map(this._providers, async (provider) => {
                var e_1, _a;
                try {
                    for (var _b = __asyncValues(provider.getOpeners(targetUri)), _c; _c = await _b.next(), !_c.done;) {
                        const opener = _c.value;
                        allOpeners.set(opener.id, opener);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }));
            return allOpeners;
        }
        getConfiguredOpenerForUri(openers, targetUri) {
            const config = this.configurationService.getValue(configuration_2.externalUriOpenersSettingId) || {};
            for (const [uriGlob, id] of Object.entries(config)) {
                if ((0, urlGlob_1.testUrlMatchesGlob)(targetUri.toString(), uriGlob)) {
                    if (id === configuration_2.defaultExternalUriOpenerId) {
                        return 'default';
                    }
                    const entry = openers.get(id);
                    if (entry) {
                        return entry;
                    }
                }
            }
            return undefined;
        }
        async showOpenerPrompt(openers, targetUri, ctx, token) {
            const items = openers.map((opener) => {
                return {
                    label: opener.label,
                    opener: opener
                };
            });
            items.push({
                label: platform_1.isWeb
                    ? nls.localize('selectOpenerDefaultLabel.web', 'Open in new browser window')
                    : nls.localize('selectOpenerDefaultLabel', 'Open in default browser'),
                opener: undefined
            }, { type: 'separator' }, {
                label: nls.localize('selectOpenerConfigureTitle', "Configure default opener..."),
                opener: 'configureDefault'
            });
            const picked = await this.quickInputService.pick(items, {
                placeHolder: nls.localize('selectOpenerPlaceHolder', "How would you like to open: {0}", targetUri.toString())
            });
            if (!picked) {
                // Still cancel the default opener here since we prompted the user
                return true;
            }
            if (typeof picked.opener === 'undefined') {
                return false; // Fallback to default opener
            }
            else if (picked.opener === 'configureDefault') {
                await this.preferencesService.openUserSettings({
                    jsonEditor: true,
                    revealSetting: { key: configuration_2.externalUriOpenersSettingId, edit: true }
                });
                return true;
            }
            else {
                return picked.opener.openExternalUri(targetUri, ctx, token);
            }
        }
    };
    ExternalUriOpenerService = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, log_1.ILogService),
        __param(4, preferences_1.IPreferencesService),
        __param(5, quickInput_1.IQuickInputService)
    ], ExternalUriOpenerService);
    exports.ExternalUriOpenerService = ExternalUriOpenerService;
});
//# sourceMappingURL=externalUriOpenerService.js.map