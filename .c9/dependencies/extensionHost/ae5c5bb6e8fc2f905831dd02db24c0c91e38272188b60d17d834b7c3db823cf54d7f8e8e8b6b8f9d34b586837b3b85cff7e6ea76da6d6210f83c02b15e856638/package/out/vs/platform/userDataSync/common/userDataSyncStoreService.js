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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, async_1, cancellation_1, errors_1, event_1, lifecycle_1, mime_1, platform_1, resources_1, types_1, uri_1, uuid_1, configuration_1, environment_1, files_1, productService_1, request_1, serviceMachineId_1, storage_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestsSession = exports.UserDataSyncStoreService = exports.UserDataSyncStoreClient = exports.UserDataSyncStoreManagementService = exports.AbstractUserDataSyncStoreManagementService = void 0;
    const SYNC_PREVIOUS_STORE = 'sync.previous.store';
    const DONOT_MAKE_REQUESTS_UNTIL_KEY = 'sync.donot-make-requests-until';
    const USER_SESSION_ID_KEY = 'sync.user-session-id';
    const MACHINE_SESSION_ID_KEY = 'sync.machine-session-id';
    const REQUEST_SESSION_LIMIT = 100;
    const REQUEST_SESSION_INTERVAL = 1000 * 60 * 5; /* 5 minutes */
    let AbstractUserDataSyncStoreManagementService = class AbstractUserDataSyncStoreManagementService extends lifecycle_1.Disposable {
        constructor(productService, configurationService, storageService) {
            super();
            this.productService = productService;
            this.configurationService = configurationService;
            this.storageService = storageService;
            this._onDidChangeUserDataSyncStore = this._register(new event_1.Emitter());
            this.onDidChangeUserDataSyncStore = this._onDidChangeUserDataSyncStore.event;
            this.updateUserDataSyncStore();
            this._register(event_1.Event.filter(storageService.onDidChangeValue, e => { var _a; return e.key === userDataSync_1.SYNC_SERVICE_URL_TYPE && e.scope === 0 /* StorageScope.GLOBAL */ && this.userDataSyncStoreType !== ((_a = this.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.type); })(() => this.updateUserDataSyncStore()));
        }
        get userDataSyncStore() { return this._userDataSyncStore; }
        get userDataSyncStoreType() {
            return this.storageService.get(userDataSync_1.SYNC_SERVICE_URL_TYPE, 0 /* StorageScope.GLOBAL */);
        }
        set userDataSyncStoreType(type) {
            this.storageService.store(userDataSync_1.SYNC_SERVICE_URL_TYPE, type, 0 /* StorageScope.GLOBAL */, platform_1.isWeb ? 0 /* StorageTarget.USER */ : 1 /* StorageTarget.MACHINE */);
        }
        updateUserDataSyncStore() {
            this._userDataSyncStore = this.toUserDataSyncStore(this.productService[userDataSync_1.CONFIGURATION_SYNC_STORE_KEY], this.configurationService.getValue(userDataSync_1.CONFIGURATION_SYNC_STORE_KEY));
            this._onDidChangeUserDataSyncStore.fire();
        }
        toUserDataSyncStore(productStore, configuredStore) {
            // Check for web overrides for backward compatibility while reading previous store
            productStore = platform_1.isWeb && (productStore === null || productStore === void 0 ? void 0 : productStore.web) ? Object.assign(Object.assign({}, productStore), productStore.web) : productStore;
            const value = Object.assign(Object.assign({}, (productStore || {})), (configuredStore || {}));
            if (value
                && (0, types_1.isString)(value.url)
                && (0, types_1.isObject)(value.authenticationProviders)
                && Object.keys(value.authenticationProviders).every(authenticationProviderId => (0, types_1.isArray)(value.authenticationProviders[authenticationProviderId].scopes))) {
                const syncStore = value;
                const canSwitch = !!syncStore.canSwitch && !(configuredStore === null || configuredStore === void 0 ? void 0 : configuredStore.url);
                const defaultType = syncStore.url === syncStore.insidersUrl ? 'insiders' : 'stable';
                const type = (canSwitch ? this.userDataSyncStoreType : undefined) || defaultType;
                const url = (configuredStore === null || configuredStore === void 0 ? void 0 : configuredStore.url) ||
                    (type === 'insiders' ? syncStore.insidersUrl
                        : type === 'stable' ? syncStore.stableUrl
                            : syncStore.url);
                return {
                    url: uri_1.URI.parse(url),
                    type,
                    defaultType,
                    defaultUrl: uri_1.URI.parse(syncStore.url),
                    stableUrl: uri_1.URI.parse(syncStore.stableUrl),
                    insidersUrl: uri_1.URI.parse(syncStore.insidersUrl),
                    canSwitch,
                    authenticationProviders: Object.keys(syncStore.authenticationProviders).reduce((result, id) => {
                        result.push({ id, scopes: syncStore.authenticationProviders[id].scopes });
                        return result;
                    }, [])
                };
            }
            return undefined;
        }
    };
    AbstractUserDataSyncStoreManagementService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService)
    ], AbstractUserDataSyncStoreManagementService);
    exports.AbstractUserDataSyncStoreManagementService = AbstractUserDataSyncStoreManagementService;
    let UserDataSyncStoreManagementService = class UserDataSyncStoreManagementService extends AbstractUserDataSyncStoreManagementService {
        constructor(productService, configurationService, storageService) {
            super(productService, configurationService, storageService);
            const previousConfigurationSyncStore = this.storageService.get(SYNC_PREVIOUS_STORE, 0 /* StorageScope.GLOBAL */);
            if (previousConfigurationSyncStore) {
                this.previousConfigurationSyncStore = JSON.parse(previousConfigurationSyncStore);
            }
            const syncStore = this.productService[userDataSync_1.CONFIGURATION_SYNC_STORE_KEY];
            if (syncStore) {
                this.storageService.store(SYNC_PREVIOUS_STORE, JSON.stringify(syncStore), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(SYNC_PREVIOUS_STORE, 0 /* StorageScope.GLOBAL */);
            }
        }
        async switch(type) {
            if (type !== this.userDataSyncStoreType) {
                this.userDataSyncStoreType = type;
                this.updateUserDataSyncStore();
            }
        }
        async getPreviousUserDataSyncStore() {
            return this.toUserDataSyncStore(this.previousConfigurationSyncStore);
        }
    };
    UserDataSyncStoreManagementService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService)
    ], UserDataSyncStoreManagementService);
    exports.UserDataSyncStoreManagementService = UserDataSyncStoreManagementService;
    let UserDataSyncStoreClient = class UserDataSyncStoreClient extends lifecycle_1.Disposable {
        constructor(userDataSyncStoreUrl, productService, requestService, logService, environmentService, fileService, storageService) {
            super();
            this.requestService = requestService;
            this.logService = logService;
            this.storageService = storageService;
            this._onTokenFailed = this._register(new event_1.Emitter());
            this.onTokenFailed = this._onTokenFailed.event;
            this._onTokenSucceed = this._register(new event_1.Emitter());
            this.onTokenSucceed = this._onTokenSucceed.event;
            this._donotMakeRequestsUntil = undefined;
            this._onDidChangeDonotMakeRequestsUntil = this._register(new event_1.Emitter());
            this.onDidChangeDonotMakeRequestsUntil = this._onDidChangeDonotMakeRequestsUntil.event;
            this.resetDonotMakeRequestsUntilPromise = undefined;
            this.updateUserDataSyncStoreUrl(userDataSyncStoreUrl);
            this.commonHeadersPromise = (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService)
                .then(uuid => {
                const headers = {
                    'X-Client-Name': `${productService.applicationName}${platform_1.isWeb ? '-web' : ''}`,
                    'X-Client-Version': productService.version,
                };
                if (productService.commit) {
                    headers['X-Client-Commit'] = productService.commit;
                }
                return headers;
            });
            /* A requests session that limits requests per sessions */
            this.session = new RequestsSession(REQUEST_SESSION_LIMIT, REQUEST_SESSION_INTERVAL, this.requestService, this.logService);
            this.initDonotMakeRequestsUntil();
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this.resetDonotMakeRequestsUntilPromise) {
                    this.resetDonotMakeRequestsUntilPromise.cancel();
                    this.resetDonotMakeRequestsUntilPromise = undefined;
                }
            }));
        }
        get donotMakeRequestsUntil() { return this._donotMakeRequestsUntil; }
        setAuthToken(token, type) {
            this.authToken = { token, type };
        }
        updateUserDataSyncStoreUrl(userDataSyncStoreUrl) {
            this.userDataSyncStoreUrl = userDataSyncStoreUrl ? (0, resources_1.joinPath)(userDataSyncStoreUrl, 'v1') : undefined;
        }
        initDonotMakeRequestsUntil() {
            const donotMakeRequestsUntil = this.storageService.getNumber(DONOT_MAKE_REQUESTS_UNTIL_KEY, 0 /* StorageScope.GLOBAL */);
            if (donotMakeRequestsUntil && Date.now() < donotMakeRequestsUntil) {
                this.setDonotMakeRequestsUntil(new Date(donotMakeRequestsUntil));
            }
        }
        setDonotMakeRequestsUntil(donotMakeRequestsUntil) {
            var _a;
            if (((_a = this._donotMakeRequestsUntil) === null || _a === void 0 ? void 0 : _a.getTime()) !== (donotMakeRequestsUntil === null || donotMakeRequestsUntil === void 0 ? void 0 : donotMakeRequestsUntil.getTime())) {
                this._donotMakeRequestsUntil = donotMakeRequestsUntil;
                if (this.resetDonotMakeRequestsUntilPromise) {
                    this.resetDonotMakeRequestsUntilPromise.cancel();
                    this.resetDonotMakeRequestsUntilPromise = undefined;
                }
                if (this._donotMakeRequestsUntil) {
                    this.storageService.store(DONOT_MAKE_REQUESTS_UNTIL_KEY, this._donotMakeRequestsUntil.getTime(), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                    this.resetDonotMakeRequestsUntilPromise = (0, async_1.createCancelablePromise)(token => (0, async_1.timeout)(this._donotMakeRequestsUntil.getTime() - Date.now(), token).then(() => this.setDonotMakeRequestsUntil(undefined)));
                    this.resetDonotMakeRequestsUntilPromise.then(null, e => null /* ignore error */);
                }
                else {
                    this.storageService.remove(DONOT_MAKE_REQUESTS_UNTIL_KEY, 0 /* StorageScope.GLOBAL */);
                }
                this._onDidChangeDonotMakeRequestsUntil.fire();
            }
        }
        async getAllRefs(resource) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const uri = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'resource', resource);
            const headers = {};
            const context = await this.request(uri.toString(), { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            const result = await (0, request_1.asJson)(context) || [];
            return result.map(({ url, created }) => ({ ref: (0, resources_1.relativePath)(uri, uri.with({ path: url })), created: created * 1000 /* Server returns in seconds */ }));
        }
        async resolveContent(resource, ref) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'resource', resource, ref).toString();
            const headers = {};
            headers['Cache-Control'] = 'no-cache';
            const context = await this.request(url, { type: 'GET', headers }, [], cancellation_1.CancellationToken.None);
            const content = await (0, request_1.asTextOrError)(context);
            return content;
        }
        async delete(resource) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'resource', resource).toString();
            const headers = {};
            await this.request(url, { type: 'DELETE', headers }, [], cancellation_1.CancellationToken.None);
        }
        async read(resource, oldValue, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'resource', resource, 'latest').toString();
            headers = Object.assign({}, headers);
            // Disable caching as they are cached by synchronisers
            headers['Cache-Control'] = 'no-cache';
            if (oldValue) {
                headers['If-None-Match'] = oldValue.ref;
            }
            const context = await this.request(url, { type: 'GET', headers }, [304], cancellation_1.CancellationToken.None);
            let userData = null;
            if (context.res.statusCode === 304) {
                userData = oldValue;
            }
            if (userData === null) {
                const ref = context.res.headers['etag'];
                if (!ref) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                const content = await (0, request_1.asTextOrError)(context);
                if (!content && context.res.statusCode === 304) {
                    throw new userDataSync_1.UserDataSyncStoreError('Empty response', url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                userData = { ref, content };
            }
            return userData;
        }
        async write(resource, data, ref, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'resource', resource).toString();
            headers = Object.assign({}, headers);
            headers['Content-Type'] = mime_1.Mimes.text;
            if (ref) {
                headers['If-Match'] = ref;
            }
            const context = await this.request(url, { type: 'POST', data, headers }, [], cancellation_1.CancellationToken.None);
            const newRef = context.res.headers['etag'];
            if (!newRef) {
                throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
            }
            return newRef;
        }
        async manifest(oldValue, headers = {}) {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'manifest').toString();
            headers = Object.assign({}, headers);
            headers['Content-Type'] = 'application/json';
            if (oldValue) {
                headers['If-None-Match'] = oldValue.ref;
            }
            const context = await this.request(url, { type: 'GET', headers }, [304], cancellation_1.CancellationToken.None);
            let manifest = null;
            if (context.res.statusCode === 304) {
                manifest = oldValue;
            }
            if (!manifest) {
                const ref = context.res.headers['etag'];
                if (!ref) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', url, "NoRef" /* UserDataSyncErrorCode.NoRef */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                const content = await (0, request_1.asTextOrError)(context);
                if (!content && context.res.statusCode === 304) {
                    throw new userDataSync_1.UserDataSyncStoreError('Empty response', url, "EmptyResponse" /* UserDataSyncErrorCode.EmptyResponse */, context.res.statusCode, context.res.headers[userDataSync_1.HEADER_OPERATION_ID]);
                }
                if (content) {
                    manifest = Object.assign(Object.assign({}, JSON.parse(content)), { ref });
                }
            }
            const currentSessionId = this.storageService.get(USER_SESSION_ID_KEY, 0 /* StorageScope.GLOBAL */);
            if (currentSessionId && manifest && currentSessionId !== manifest.session) {
                // Server session is different from client session so clear cached session.
                this.clearSession();
            }
            if (manifest === null && currentSessionId) {
                // server session is cleared so clear cached session.
                this.clearSession();
            }
            if (manifest) {
                // update session
                this.storageService.store(USER_SESSION_ID_KEY, manifest.session, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
            return manifest;
        }
        async clear() {
            if (!this.userDataSyncStoreUrl) {
                throw new Error('No settings sync store url configured.');
            }
            const url = (0, resources_1.joinPath)(this.userDataSyncStoreUrl, 'resource').toString();
            const headers = { 'Content-Type': mime_1.Mimes.text };
            await this.request(url, { type: 'DELETE', headers }, [], cancellation_1.CancellationToken.None);
            // clear cached session.
            this.clearSession();
        }
        clearSession() {
            this.storageService.remove(USER_SESSION_ID_KEY, 0 /* StorageScope.GLOBAL */);
            this.storageService.remove(MACHINE_SESSION_ID_KEY, 0 /* StorageScope.GLOBAL */);
        }
        async request(url, options, successCodes, token) {
            if (!this.authToken) {
                throw new userDataSync_1.UserDataSyncStoreError('No Auth Token Available', url, "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */, undefined, undefined);
            }
            if (this._donotMakeRequestsUntil && Date.now() < this._donotMakeRequestsUntil.getTime()) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */, undefined, undefined);
            }
            this.setDonotMakeRequestsUntil(undefined);
            const commonHeaders = await this.commonHeadersPromise;
            options.headers = Object.assign(Object.assign(Object.assign({}, (options.headers || {})), commonHeaders), { 'X-Account-Type': this.authToken.type, 'authorization': `Bearer ${this.authToken.token}` });
            // Add session headers
            this.addSessionHeaders(options.headers);
            this.logService.trace('Sending request to server', { url, type: options.type, headers: Object.assign(Object.assign({}, options.headers), { authorization: undefined }) });
            let context;
            try {
                context = await this.session.request(url, options, token);
            }
            catch (e) {
                if (!(e instanceof userDataSync_1.UserDataSyncStoreError)) {
                    let code = "RequestFailed" /* UserDataSyncErrorCode.RequestFailed */;
                    const errorMessage = (0, errors_1.getErrorMessage)(e).toLowerCase();
                    // Request timed out
                    if (errorMessage.includes('xhr timeout')) {
                        code = "RequestTimeout" /* UserDataSyncErrorCode.RequestTimeout */;
                    }
                    // Request protocol not supported
                    else if (errorMessage.includes('protocol') && errorMessage.includes('not supported')) {
                        code = "RequestProtocolNotSupported" /* UserDataSyncErrorCode.RequestProtocolNotSupported */;
                    }
                    // Request path not escaped
                    else if (errorMessage.includes('request path contains unescaped characters')) {
                        code = "RequestPathNotEscaped" /* UserDataSyncErrorCode.RequestPathNotEscaped */;
                    }
                    // Request header not an object
                    else if (errorMessage.includes('headers must be an object')) {
                        code = "RequestHeadersNotObject" /* UserDataSyncErrorCode.RequestHeadersNotObject */;
                    }
                    // Request canceled
                    else if ((0, errors_1.isCancellationError)(e)) {
                        code = "RequestCanceled" /* UserDataSyncErrorCode.RequestCanceled */;
                    }
                    e = new userDataSync_1.UserDataSyncStoreError(`Connection refused for the request '${url}'.`, url, code, undefined, undefined);
                }
                this.logService.info('Request failed', url);
                throw e;
            }
            const operationId = context.res.headers[userDataSync_1.HEADER_OPERATION_ID];
            const requestInfo = { url, status: context.res.statusCode, 'execution-id': options.headers[userDataSync_1.HEADER_EXECUTION_ID], 'operation-id': operationId };
            const isSuccess = (0, request_1.isSuccess)(context) || (context.res.statusCode && successCodes.indexOf(context.res.statusCode) !== -1);
            if (isSuccess) {
                this.logService.trace('Request succeeded', requestInfo);
            }
            else {
                this.logService.info('Request failed', requestInfo);
            }
            if (context.res.statusCode === 401) {
                this.authToken = undefined;
                this._onTokenFailed.fire();
                throw new userDataSync_1.UserDataSyncStoreError(`Request '${url}' failed because of Unauthorized (401).`, url, "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */, context.res.statusCode, operationId);
            }
            this._onTokenSucceed.fire();
            if (context.res.statusCode === 409) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of Conflict (409). There is new data for this resource. Make the request again with latest data.`, url, "Conflict" /* UserDataSyncErrorCode.Conflict */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 410) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because the requested resource is not longer available (410).`, url, "Gone" /* UserDataSyncErrorCode.Gone */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 412) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of Precondition Failed (412). There is new data for this resource. Make the request again with latest data.`, url, "PreconditionFailed" /* UserDataSyncErrorCode.PreconditionFailed */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 413) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too large payload (413).`, url, "TooLarge" /* UserDataSyncErrorCode.TooLarge */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 426) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed with status Upgrade Required (426). Please upgrade the client and try again.`, url, "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */, context.res.statusCode, operationId);
            }
            if (context.res.statusCode === 429) {
                const retryAfter = context.res.headers['retry-after'];
                if (retryAfter) {
                    this.setDonotMakeRequestsUntil(new Date(Date.now() + (parseInt(retryAfter) * 1000)));
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */, context.res.statusCode, operationId);
                }
                else {
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${url}' failed because of too many requests (429).`, url, "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */, context.res.statusCode, operationId);
                }
            }
            if (!isSuccess) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, url, "Unknown" /* UserDataSyncErrorCode.Unknown */, context.res.statusCode, operationId);
            }
            return context;
        }
        addSessionHeaders(headers) {
            let machineSessionId = this.storageService.get(MACHINE_SESSION_ID_KEY, 0 /* StorageScope.GLOBAL */);
            if (machineSessionId === undefined) {
                machineSessionId = (0, uuid_1.generateUuid)();
                this.storageService.store(MACHINE_SESSION_ID_KEY, machineSessionId, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
            headers['X-Machine-Session-Id'] = machineSessionId;
            const userSessionId = this.storageService.get(USER_SESSION_ID_KEY, 0 /* StorageScope.GLOBAL */);
            if (userSessionId !== undefined) {
                headers['X-User-Session-Id'] = userSessionId;
            }
        }
    };
    UserDataSyncStoreClient = __decorate([
        __param(1, productService_1.IProductService),
        __param(2, request_1.IRequestService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, storage_1.IStorageService)
    ], UserDataSyncStoreClient);
    exports.UserDataSyncStoreClient = UserDataSyncStoreClient;
    let UserDataSyncStoreService = class UserDataSyncStoreService extends UserDataSyncStoreClient {
        constructor(userDataSyncStoreManagementService, productService, requestService, logService, environmentService, fileService, storageService) {
            var _a;
            super((_a = userDataSyncStoreManagementService.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.url, productService, requestService, logService, environmentService, fileService, storageService);
            this._register(userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => { var _a; return this.updateUserDataSyncStoreUrl((_a = userDataSyncStoreManagementService.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.url); }));
        }
    };
    UserDataSyncStoreService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(1, productService_1.IProductService),
        __param(2, request_1.IRequestService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, storage_1.IStorageService)
    ], UserDataSyncStoreService);
    exports.UserDataSyncStoreService = UserDataSyncStoreService;
    class RequestsSession {
        constructor(limit, interval, /* in ms */ requestService, logService) {
            this.limit = limit;
            this.interval = interval;
            this.requestService = requestService;
            this.logService = logService;
            this.requests = [];
            this.startTime = undefined;
        }
        request(url, options, token) {
            if (this.isExpired()) {
                this.reset();
            }
            options.url = url;
            if (this.requests.length >= this.limit) {
                this.logService.info('Too many requests', ...this.requests);
                throw new userDataSync_1.UserDataSyncStoreError(`Too many requests. Only ${this.limit} requests allowed in ${this.interval / (1000 * 60)} minutes.`, url, "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */, undefined, undefined);
            }
            this.startTime = this.startTime || new Date();
            this.requests.push(url);
            return this.requestService.request(options, token);
        }
        isExpired() {
            return this.startTime !== undefined && new Date().getTime() - this.startTime.getTime() > this.interval;
        }
        reset() {
            this.requests = [];
            this.startTime = undefined;
        }
    }
    exports.RequestsSession = RequestsSession;
});
//# sourceMappingURL=userDataSyncStoreService.js.map