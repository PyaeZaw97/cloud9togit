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
define(["require", "exports", "vs/base/common/event", "vs/platform/log/common/log", "./timeline", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey"], function (require, exports, event_1, log_1, timeline_1, views_1, configuration_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimelineService = exports.TimelineHasProviderContext = void 0;
    exports.TimelineHasProviderContext = new contextkey_1.RawContextKey('timelineHasProvider', false);
    let TimelineService = class TimelineService {
        constructor(logService, viewsService, configurationService, contextKeyService) {
            this.logService = logService;
            this.viewsService = viewsService;
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this._onDidChangeProviders = new event_1.Emitter();
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._onDidChangeTimeline = new event_1.Emitter();
            this.onDidChangeTimeline = this._onDidChangeTimeline.event;
            this._onDidChangeUri = new event_1.Emitter();
            this.onDidChangeUri = this._onDidChangeUri.event;
            this.providers = new Map();
            this.providerSubscriptions = new Map();
            this.hasProviderContext = exports.TimelineHasProviderContext.bindTo(this.contextKeyService);
            this.updateHasProviderContext();
        }
        getSources() {
            return [...this.providers.values()].map(p => ({ id: p.id, label: p.label }));
        }
        getTimeline(id, uri, options, tokenSource) {
            this.logService.trace(`TimelineService#getTimeline(${id}): uri=${uri.toString()}`);
            const provider = this.providers.get(id);
            if (provider === undefined) {
                return undefined;
            }
            if (typeof provider.scheme === 'string') {
                if (provider.scheme !== '*' && provider.scheme !== uri.scheme) {
                    return undefined;
                }
            }
            else if (!provider.scheme.includes(uri.scheme)) {
                return undefined;
            }
            return {
                result: provider.provideTimeline(uri, options, tokenSource.token)
                    .then(result => {
                    if (result === undefined) {
                        return undefined;
                    }
                    result.items = result.items.map(item => (Object.assign(Object.assign({}, item), { source: provider.id })));
                    result.items.sort((a, b) => (b.timestamp - a.timestamp) || b.source.localeCompare(a.source, undefined, { numeric: true, sensitivity: 'base' }));
                    return result;
                }),
                options: options,
                source: provider.id,
                tokenSource: tokenSource,
                uri: uri
            };
        }
        registerTimelineProvider(provider) {
            this.logService.trace(`TimelineService#registerTimelineProvider: id=${provider.id}`);
            const id = provider.id;
            const existing = this.providers.get(id);
            if (existing) {
                // For now to deal with https://github.com/microsoft/vscode/issues/89553 allow any overwritting here (still will be blocked in the Extension Host)
                // TODO@eamodio: Ultimately will need to figure out a way to unregister providers when the Extension Host restarts/crashes
                // throw new Error(`Timeline Provider ${id} already exists.`);
                try {
                    existing === null || existing === void 0 ? void 0 : existing.dispose();
                }
                catch (_a) { }
            }
            this.providers.set(id, provider);
            this.updateHasProviderContext();
            if (provider.onDidChange) {
                this.providerSubscriptions.set(id, provider.onDidChange(e => this._onDidChangeTimeline.fire(e)));
            }
            this._onDidChangeProviders.fire({ added: [id] });
            return {
                dispose: () => {
                    this.providers.delete(id);
                    this._onDidChangeProviders.fire({ removed: [id] });
                }
            };
        }
        unregisterTimelineProvider(id) {
            this.logService.trace(`TimelineService#unregisterTimelineProvider: id=${id}`);
            if (!this.providers.has(id)) {
                return;
            }
            this.providers.delete(id);
            this.providerSubscriptions.delete(id);
            this.updateHasProviderContext();
            this._onDidChangeProviders.fire({ removed: [id] });
        }
        setUri(uri) {
            this.viewsService.openView(timeline_1.TimelinePaneId, true);
            this._onDidChangeUri.fire(uri);
        }
        updateHasProviderContext() {
            this.hasProviderContext.set(this.providers.size !== 0);
        }
    };
    TimelineService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, views_1.IViewsService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextkey_1.IContextKeyService)
    ], TimelineService);
    exports.TimelineService = TimelineService;
});
//# sourceMappingURL=timelineService.js.map