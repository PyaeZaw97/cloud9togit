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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
define(["require", "exports", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/network", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/contrib/externalUriOpener/common/contributedOpeners", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService", "vs/workbench/services/extensions/common/extensions", "../../services/extensions/common/extHostCustomers"], function (require, exports, actions_1, errors_1, lifecycle_1, network_1, nls_1, notification_1, opener_1, storage_1, extHost_protocol_1, configuration_1, contributedOpeners_1, externalUriOpenerService_1, extensions_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadUriOpeners = void 0;
    let MainThreadUriOpeners = class MainThreadUriOpeners extends lifecycle_1.Disposable {
        constructor(context, storageService, externalUriOpenerService, extensionService, openerService, notificationService) {
            super();
            this.extensionService = extensionService;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this._registeredOpeners = new Map();
            this.proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostUriOpeners);
            this._register(externalUriOpenerService.registerExternalOpenerProvider(this));
            this._contributedExternalUriOpenersStore = this._register(new contributedOpeners_1.ContributedExternalUriOpenersStore(storageService, extensionService));
        }
        getOpeners(targetUri) {
            return __asyncGenerator(this, arguments, function* getOpeners_1() {
                // Currently we only allow openers for http and https urls
                if (targetUri.scheme !== network_1.Schemas.http && targetUri.scheme !== network_1.Schemas.https) {
                    return yield __await(void 0);
                }
                yield __await(this.extensionService.activateByEvent(`onOpenExternalUri:${targetUri.scheme}`));
                for (const [id, openerMetadata] of this._registeredOpeners) {
                    if (openerMetadata.schemes.has(targetUri.scheme)) {
                        yield yield __await(this.createOpener(id, openerMetadata));
                    }
                }
            });
        }
        createOpener(id, metadata) {
            return {
                id: id,
                label: metadata.label,
                canOpen: (uri, token) => {
                    return this.proxy.$canOpenUri(id, uri, token);
                },
                openExternalUri: async (uri, ctx, token) => {
                    try {
                        await this.proxy.$openUri(id, { resolvedUri: uri, sourceUri: ctx.sourceUri }, token);
                    }
                    catch (e) {
                        if (!(0, errors_1.isCancellationError)(e)) {
                            const openDefaultAction = new actions_1.Action('default', (0, nls_1.localize)('openerFailedUseDefault', "Open using default opener"), undefined, undefined, async () => {
                                await this.openerService.open(uri, {
                                    allowTunneling: false,
                                    allowContributedOpeners: configuration_1.defaultExternalUriOpenerId,
                                });
                            });
                            openDefaultAction.tooltip = uri.toString();
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: (0, nls_1.localize)({
                                    key: 'openerFailedMessage',
                                    comment: ['{0} is the id of the opener. {1} is the url being opened.'],
                                }, 'Could not open uri with \'{0}\': {1}', id, e.toString()),
                                actions: {
                                    primary: [
                                        openDefaultAction
                                    ]
                                }
                            });
                        }
                    }
                    return true;
                },
            };
        }
        async $registerUriOpener(id, schemes, extensionId, label) {
            if (this._registeredOpeners.has(id)) {
                throw new Error(`Opener with id '${id}' already registered`);
            }
            this._registeredOpeners.set(id, {
                schemes: new Set(schemes),
                label,
                extensionId,
            });
            this._contributedExternalUriOpenersStore.didRegisterOpener(id, extensionId.value);
        }
        async $unregisterUriOpener(id) {
            this._registeredOpeners.delete(id);
            this._contributedExternalUriOpenersStore.delete(id);
        }
        dispose() {
            super.dispose();
            this._registeredOpeners.clear();
        }
    };
    MainThreadUriOpeners = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadUriOpeners),
        __param(1, storage_1.IStorageService),
        __param(2, externalUriOpenerService_1.IExternalUriOpenerService),
        __param(3, extensions_1.IExtensionService),
        __param(4, opener_1.IOpenerService),
        __param(5, notification_1.INotificationService)
    ], MainThreadUriOpeners);
    exports.MainThreadUriOpeners = MainThreadUriOpeners;
});
//# sourceMappingURL=mainThreadUriOpeners.js.map