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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/types", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/workbench/services/activity/common/activity", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, arrays_1, event_1, lifecycle_1, platform_1, strings_1, types_1, nls, actions_1, commands_1, contextkey_1, dialogs_1, extensions_1, notification_1, quickInput_1, storage_1, activity_1, authentication_1, environmentService_1, extensions_2, extensionsRegistry_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationService = exports.readAllowedExtensions = exports.getCurrentAuthenticationSessionInfo = exports.addAccountUsage = exports.removeAccountUsage = exports.readAccountUsages = exports.getAuthenticationProviderActivationEvent = void 0;
    function getAuthenticationProviderActivationEvent(id) { return `onAuthenticationRequest:${id}`; }
    exports.getAuthenticationProviderActivationEvent = getAuthenticationProviderActivationEvent;
    const FIRST_PARTY_ALLOWED_EXTENSIONS = [
        'github.vscode-pull-request-github',
        'vscode.git',
        'github.remotehub',
        'github.remotehub-insiders',
        'github.codespaces',
        'ms-vsliveshare.vsliveshare'
    ];
    function readAccountUsages(storageService, providerId, accountName) {
        const accountKey = `${providerId}-${accountName}-usages`;
        const storedUsages = storageService.get(accountKey, 0 /* StorageScope.GLOBAL */);
        let usages = [];
        if (storedUsages) {
            try {
                usages = JSON.parse(storedUsages);
            }
            catch (e) {
                // ignore
            }
        }
        return usages;
    }
    exports.readAccountUsages = readAccountUsages;
    function removeAccountUsage(storageService, providerId, accountName) {
        const accountKey = `${providerId}-${accountName}-usages`;
        storageService.remove(accountKey, 0 /* StorageScope.GLOBAL */);
    }
    exports.removeAccountUsage = removeAccountUsage;
    function addAccountUsage(storageService, providerId, accountName, extensionId, extensionName) {
        const accountKey = `${providerId}-${accountName}-usages`;
        const usages = readAccountUsages(storageService, providerId, accountName);
        const existingUsageIndex = usages.findIndex(usage => usage.extensionId === extensionId);
        if (existingUsageIndex > -1) {
            usages.splice(existingUsageIndex, 1, {
                extensionId,
                extensionName,
                lastUsed: Date.now()
            });
        }
        else {
            usages.push({
                extensionId,
                extensionName,
                lastUsed: Date.now()
            });
        }
        storageService.store(accountKey, JSON.stringify(usages), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
    }
    exports.addAccountUsage = addAccountUsage;
    async function getCurrentAuthenticationSessionInfo(credentialsService, productService) {
        const authenticationSessionValue = await credentialsService.getPassword(`${productService.urlProtocol}.login`, 'account');
        if (authenticationSessionValue) {
            const authenticationSessionInfo = JSON.parse(authenticationSessionValue);
            if (authenticationSessionInfo
                && (0, types_1.isString)(authenticationSessionInfo.id)
                && (0, types_1.isString)(authenticationSessionInfo.accessToken)
                && (0, types_1.isString)(authenticationSessionInfo.providerId)) {
                return authenticationSessionInfo;
            }
        }
        return undefined;
    }
    exports.getCurrentAuthenticationSessionInfo = getCurrentAuthenticationSessionInfo;
    function readAllowedExtensions(storageService, providerId, accountName) {
        let trustedExtensions = [];
        try {
            const trustedExtensionSrc = storageService.get(`${providerId}-${accountName}`, 0 /* StorageScope.GLOBAL */);
            if (trustedExtensionSrc) {
                trustedExtensions = JSON.parse(trustedExtensionSrc);
            }
        }
        catch (err) { }
        return trustedExtensions;
    }
    exports.readAllowedExtensions = readAllowedExtensions;
    // OAuth2 spec prohibits space in a scope, so use that to join them.
    const SCOPESLIST_SEPARATOR = ' ';
    commands_1.CommandsRegistry.registerCommand('workbench.getCodeExchangeProxyEndpoints', function (accessor, _) {
        var _a;
        const environmentService = accessor.get(environmentService_1.IBrowserWorkbenchEnvironmentService);
        return (_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.codeExchangeProxyEndpoints;
    });
    const authenticationDefinitionSchema = {
        type: 'object',
        additionalProperties: false,
        properties: {
            id: {
                type: 'string',
                description: nls.localize('authentication.id', 'The id of the authentication provider.')
            },
            label: {
                type: 'string',
                description: nls.localize('authentication.label', 'The human readable name of the authentication provider.'),
            }
        }
    };
    const authenticationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'authentication',
        jsonSchema: {
            description: nls.localize({ key: 'authenticationExtensionPoint', comment: [`'Contributes' means adds here`] }, 'Contributes authentication'),
            type: 'array',
            items: authenticationDefinitionSchema
        }
    });
    let AuthenticationService = class AuthenticationService extends lifecycle_1.Disposable {
        constructor(activityService, extensionService, storageService, remoteAgentService, dialogService, quickInputService) {
            super();
            this.activityService = activityService;
            this.extensionService = extensionService;
            this.storageService = storageService;
            this.remoteAgentService = remoteAgentService;
            this.dialogService = dialogService;
            this.quickInputService = quickInputService;
            this._signInRequestItems = new Map();
            this._sessionAccessRequestItems = new Map();
            this._accountBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._authenticationProviders = new Map();
            /**
             * All providers that have been statically declared by extensions. These may not be registered.
             */
            this.declaredProviders = [];
            this._onDidRegisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidRegisterAuthenticationProvider = this._onDidRegisterAuthenticationProvider.event;
            this._onDidUnregisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidUnregisterAuthenticationProvider = this._onDidUnregisterAuthenticationProvider.event;
            this._onDidChangeSessions = this._register(new event_1.Emitter());
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._onDidChangeDeclaredProviders = this._register(new event_1.Emitter());
            this.onDidChangeDeclaredProviders = this._onDidChangeDeclaredProviders.event;
            this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                command: {
                    id: 'noAuthenticationProviders',
                    title: nls.localize('authentication.Placeholder', "No accounts requested yet..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
            });
            authenticationExtPoint.setHandler((extensions, { added, removed }) => {
                added.forEach(point => {
                    for (const provider of point.value) {
                        if ((0, strings_1.isFalsyOrWhitespace)(provider.id)) {
                            point.collector.error(nls.localize('authentication.missingId', 'An authentication contribution must specify an id.'));
                            continue;
                        }
                        if ((0, strings_1.isFalsyOrWhitespace)(provider.label)) {
                            point.collector.error(nls.localize('authentication.missingLabel', 'An authentication contribution must specify a label.'));
                            continue;
                        }
                        if (!this.declaredProviders.some(p => p.id === provider.id)) {
                            this.declaredProviders.push(provider);
                        }
                        else {
                            point.collector.error(nls.localize('authentication.idConflict', "This authentication id '{0}' has already been registered", provider.id));
                        }
                    }
                });
                const removedExtPoints = (0, arrays_1.flatten)(removed.map(r => r.value));
                removedExtPoints.forEach(point => {
                    const index = this.declaredProviders.findIndex(provider => provider.id === point.id);
                    if (index > -1) {
                        this.declaredProviders.splice(index, 1);
                    }
                });
                this._onDidChangeDeclaredProviders.fire(this.declaredProviders);
            });
        }
        getProviderIds() {
            const providerIds = [];
            this._authenticationProviders.forEach(provider => {
                providerIds.push(provider.id);
            });
            return providerIds;
        }
        isAuthenticationProviderRegistered(id) {
            return this._authenticationProviders.has(id);
        }
        registerAuthenticationProvider(id, authenticationProvider) {
            this._authenticationProviders.set(id, authenticationProvider);
            this._onDidRegisterAuthenticationProvider.fire({ id, label: authenticationProvider.label });
            if (this._placeholderMenuItem) {
                this._placeholderMenuItem.dispose();
                this._placeholderMenuItem = undefined;
            }
        }
        unregisterAuthenticationProvider(id) {
            const provider = this._authenticationProviders.get(id);
            if (provider) {
                provider.dispose();
                this._authenticationProviders.delete(id);
                this._onDidUnregisterAuthenticationProvider.fire({ id, label: provider.label });
                const accessRequests = this._sessionAccessRequestItems.get(id) || {};
                Object.keys(accessRequests).forEach(extensionId => {
                    this.removeAccessRequest(id, extensionId);
                });
            }
            if (!this._authenticationProviders.size) {
                this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                    command: {
                        id: 'noAuthenticationProviders',
                        title: nls.localize('loading', "Loading..."),
                        precondition: contextkey_1.ContextKeyExpr.false()
                    },
                });
            }
        }
        async sessionsUpdate(id, event) {
            const provider = this._authenticationProviders.get(id);
            if (provider) {
                this._onDidChangeSessions.fire({ providerId: id, label: provider.label, event: event });
                if (event.added) {
                    await this.updateNewSessionRequests(provider, event.added);
                }
                if (event.removed) {
                    await this.updateAccessRequests(id, event.removed);
                }
                this.updateBadgeCount();
            }
        }
        async updateNewSessionRequests(provider, addedSessions) {
            const existingRequestsForProvider = this._signInRequestItems.get(provider.id);
            if (!existingRequestsForProvider) {
                return;
            }
            Object.keys(existingRequestsForProvider).forEach(requestedScopes => {
                if (addedSessions.some(session => session.scopes.slice().join(SCOPESLIST_SEPARATOR) === requestedScopes)) {
                    const sessionRequest = existingRequestsForProvider[requestedScopes];
                    sessionRequest === null || sessionRequest === void 0 ? void 0 : sessionRequest.disposables.forEach(item => item.dispose());
                    delete existingRequestsForProvider[requestedScopes];
                    if (Object.keys(existingRequestsForProvider).length === 0) {
                        this._signInRequestItems.delete(provider.id);
                    }
                    else {
                        this._signInRequestItems.set(provider.id, existingRequestsForProvider);
                    }
                }
            });
        }
        async updateAccessRequests(providerId, removedSessions) {
            const providerRequests = this._sessionAccessRequestItems.get(providerId);
            if (providerRequests) {
                Object.keys(providerRequests).forEach(extensionId => {
                    removedSessions.forEach(removed => {
                        const indexOfSession = providerRequests[extensionId].possibleSessions.findIndex(session => session.id === removed.id);
                        if (indexOfSession) {
                            providerRequests[extensionId].possibleSessions.splice(indexOfSession, 1);
                        }
                    });
                    if (!providerRequests[extensionId].possibleSessions.length) {
                        this.removeAccessRequest(providerId, extensionId);
                    }
                });
            }
        }
        updateBadgeCount() {
            this._accountBadgeDisposable.clear();
            let numberOfRequests = 0;
            this._signInRequestItems.forEach(providerRequests => {
                Object.keys(providerRequests).forEach(request => {
                    numberOfRequests += providerRequests[request].requestingExtensionIds.length;
                });
            });
            this._sessionAccessRequestItems.forEach(accessRequest => {
                numberOfRequests += Object.keys(accessRequest).length;
            });
            if (numberOfRequests > 0) {
                const badge = new activity_1.NumberBadge(numberOfRequests, () => nls.localize('sign in', "Sign in requested"));
                this._accountBadgeDisposable.value = this.activityService.showAccountsActivity({ badge });
            }
        }
        removeAccessRequest(providerId, extensionId) {
            const providerRequests = this._sessionAccessRequestItems.get(providerId) || {};
            if (providerRequests[extensionId]) {
                (0, lifecycle_1.dispose)(providerRequests[extensionId].disposables);
                delete providerRequests[extensionId];
                this.updateBadgeCount();
            }
        }
        /**
         * Check extension access to an account
         * @param providerId The id of the authentication provider
         * @param accountName The account name that access is checked for
         * @param extensionId The id of the extension requesting access
         * @returns Returns true or false if the user has opted to permanently grant or disallow access, and undefined
         * if they haven't made a choice yet
         */
        isAccessAllowed(providerId, accountName, extensionId) {
            const allowList = readAllowedExtensions(this.storageService, providerId, accountName);
            const extensionData = allowList.find(extension => extension.id === extensionId);
            if (extensionData) {
                // This property didn't exist on this data previously, inclusion in the list at all indicates allowance
                return extensionData.allowed !== undefined
                    ? extensionData.allowed
                    : true;
            }
            const remoteConnection = this.remoteAgentService.getConnection();
            // Right now, this is hardcoded to only happen in Codespaces and on web.
            // TODO: this should be determined by the embedder so that this logic isn't in core.
            const allowedAllowedExtensions = remoteConnection !== null
                ? remoteConnection.remoteAuthority.startsWith('codespaces')
                : platform_1.isWeb;
            if (allowedAllowedExtensions && FIRST_PARTY_ALLOWED_EXTENSIONS.includes(extensionId)) {
                return true;
            }
            return undefined;
        }
        async updatedAllowedExtension(providerId, accountName, extensionId, extensionName, isAllowed) {
            const allowList = readAllowedExtensions(this.storageService, providerId, accountName);
            const index = allowList.findIndex(extension => extension.id === extensionId);
            if (index === -1) {
                allowList.push({ id: extensionId, name: extensionName, allowed: isAllowed });
            }
            else {
                allowList[index].allowed = isAllowed;
            }
            await this.storageService.store(`${providerId}-${accountName}`, JSON.stringify(allowList), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        async showGetSessionPrompt(providerId, accountName, extensionId, extensionName) {
            const providerName = this.getLabel(providerId);
            const { choice } = await this.dialogService.show(notification_1.Severity.Info, nls.localize('confirmAuthenticationAccess', "The extension '{0}' wants to access the {1} account '{2}'.", extensionName, providerName, accountName), [nls.localize('allow', "Allow"), nls.localize('deny', "Deny"), nls.localize('cancel', "Cancel")], {
                cancelId: 2
            });
            const cancelled = choice === 2;
            const allowed = choice === 0;
            if (!cancelled) {
                this.updatedAllowedExtension(providerId, accountName, extensionId, extensionName, allowed);
                this.removeAccessRequest(providerId, extensionId);
            }
            return allowed;
        }
        async selectSession(providerId, extensionId, extensionName, scopes, availableSessions) {
            return new Promise((resolve, reject) => {
                // This function should be used only when there are sessions to disambiguate.
                if (!availableSessions.length) {
                    reject('No available sessions');
                }
                const quickPick = this.quickInputService.createQuickPick();
                quickPick.ignoreFocusOut = true;
                const items = availableSessions.map(session => {
                    return {
                        label: session.account.label,
                        session: session
                    };
                });
                items.push({
                    label: nls.localize('useOtherAccount', "Sign in to another account")
                });
                const providerName = this.getLabel(providerId);
                quickPick.items = items;
                quickPick.title = nls.localize({
                    key: 'selectAccount',
                    comment: ['The placeholder {0} is the name of an extension. {1} is the name of the type of account, such as Microsoft or GitHub.']
                }, "The extension '{0}' wants to access a {1} account", extensionName, providerName);
                quickPick.placeholder = nls.localize('getSessionPlateholder', "Select an account for '{0}' to use or Esc to cancel", extensionName);
                quickPick.onDidAccept(async (_) => {
                    var _a;
                    const session = (_a = quickPick.selectedItems[0].session) !== null && _a !== void 0 ? _a : await this.createSession(providerId, scopes);
                    const accountName = session.account.label;
                    this.updatedAllowedExtension(providerId, accountName, extensionId, extensionName, true);
                    this.removeAccessRequest(providerId, extensionId);
                    this.storageService.store(`${extensionName}-${providerId}`, session.id, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                    quickPick.dispose();
                    resolve(session);
                });
                quickPick.onDidHide(_ => {
                    if (!quickPick.selectedItems[0]) {
                        reject('User did not consent to account access');
                    }
                    quickPick.dispose();
                });
                quickPick.show();
            });
        }
        async completeSessionAccessRequest(providerId, extensionId, extensionName, scopes) {
            const providerRequests = this._sessionAccessRequestItems.get(providerId) || {};
            const existingRequest = providerRequests[extensionId];
            if (!existingRequest) {
                return;
            }
            const possibleSessions = existingRequest.possibleSessions;
            const supportsMultipleAccounts = this.supportsMultipleAccounts(providerId);
            let session;
            if (supportsMultipleAccounts) {
                try {
                    session = await this.selectSession(providerId, extensionId, extensionName, scopes, possibleSessions);
                }
                catch (_) {
                    // ignore cancel
                }
            }
            else {
                const approved = await this.showGetSessionPrompt(providerId, possibleSessions[0].account.label, extensionId, extensionName);
                if (approved) {
                    session = possibleSessions[0];
                }
            }
            if (session) {
                addAccountUsage(this.storageService, providerId, session.account.label, extensionId, extensionName);
                const providerName = this.getLabel(providerId);
                this._onDidChangeSessions.fire({ providerId, label: providerName, event: { added: [], removed: [], changed: [session] } });
            }
        }
        requestSessionAccess(providerId, extensionId, extensionName, scopes, possibleSessions) {
            const providerRequests = this._sessionAccessRequestItems.get(providerId) || {};
            const hasExistingRequest = providerRequests[extensionId];
            if (hasExistingRequest) {
                return;
            }
            const menuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                group: '3_accessRequests',
                command: {
                    id: `${providerId}${extensionId}Access`,
                    title: nls.localize({
                        key: 'accessRequest',
                        comment: [`The placeholder {0} will be replaced with an authentication provider''s label. {1} will be replaced with an extension name. (1) is to indicate that this menu item contributes to a badge count`]
                    }, "Grant access to {0} for {1}... (1)", this.getLabel(providerId), extensionName)
                }
            });
            const accessCommand = commands_1.CommandsRegistry.registerCommand({
                id: `${providerId}${extensionId}Access`,
                handler: async (accessor) => {
                    const authenticationService = accessor.get(authentication_1.IAuthenticationService);
                    authenticationService.completeSessionAccessRequest(providerId, extensionId, extensionName, scopes);
                }
            });
            providerRequests[extensionId] = { possibleSessions, disposables: [menuItem, accessCommand] };
            this._sessionAccessRequestItems.set(providerId, providerRequests);
            this.updateBadgeCount();
        }
        async requestNewSession(providerId, scopes, extensionId, extensionName) {
            let provider = this._authenticationProviders.get(providerId);
            if (!provider) {
                // Activate has already been called for the authentication provider, but it cannot block on registering itself
                // since this is sync and returns a disposable. So, wait for registration event to fire that indicates the
                // provider is now in the map.
                await new Promise((resolve, _) => {
                    this.onDidRegisterAuthenticationProvider(e => {
                        if (e.id === providerId) {
                            provider = this._authenticationProviders.get(providerId);
                            resolve();
                        }
                    });
                });
            }
            if (!provider) {
                return;
            }
            const providerRequests = this._signInRequestItems.get(providerId);
            const scopesList = scopes.join(SCOPESLIST_SEPARATOR);
            const extensionHasExistingRequest = providerRequests
                && providerRequests[scopesList]
                && providerRequests[scopesList].requestingExtensionIds.includes(extensionId);
            if (extensionHasExistingRequest) {
                return;
            }
            // Construct a commandId that won't clash with others generated here, nor likely with an extension's command
            const commandId = `${providerId}:${extensionId}:signIn${Object.keys(providerRequests || []).length}`;
            const menuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                group: '2_signInRequests',
                command: {
                    id: commandId,
                    title: nls.localize({
                        key: 'signInRequest',
                        comment: [`The placeholder {0} will be replaced with an authentication provider's label. {1} will be replaced with an extension name. (1) is to indicate that this menu item contributes to a badge count.`]
                    }, "Sign in with {0} to use {1} (1)", provider.label, extensionName)
                }
            });
            const signInCommand = commands_1.CommandsRegistry.registerCommand({
                id: commandId,
                handler: async (accessor) => {
                    const authenticationService = accessor.get(authentication_1.IAuthenticationService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const session = await authenticationService.createSession(providerId, scopes);
                    // Add extension to allow list since user explicitly signed in on behalf of it
                    this.updatedAllowedExtension(providerId, session.account.label, extensionId, extensionName, true);
                    // And also set it as the preferred account for the extension
                    storageService.store(`${extensionName}-${providerId}`, session.id, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                }
            });
            if (providerRequests) {
                const existingRequest = providerRequests[scopesList] || { disposables: [], requestingExtensionIds: [] };
                providerRequests[scopesList] = {
                    disposables: [...existingRequest.disposables, menuItem, signInCommand],
                    requestingExtensionIds: [...existingRequest.requestingExtensionIds, extensionId]
                };
                this._signInRequestItems.set(providerId, providerRequests);
            }
            else {
                this._signInRequestItems.set(providerId, {
                    [scopesList]: {
                        disposables: [menuItem, signInCommand],
                        requestingExtensionIds: [extensionId]
                    }
                });
            }
            this.updateBadgeCount();
        }
        getLabel(id) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.label;
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        supportsMultipleAccounts(id) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.supportsMultipleAccounts;
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async tryActivateProvider(providerId, activateImmediate) {
            await this.extensionService.activateByEvent(getAuthenticationProviderActivationEvent(providerId), activateImmediate ? 1 /* ActivationKind.Immediate */ : 0 /* ActivationKind.Normal */);
            let provider = this._authenticationProviders.get(providerId);
            if (provider) {
                return provider;
            }
            // When activate has completed, the extension has made the call to `registerAuthenticationProvider`.
            // However, activate cannot block on this, so the renderer may not have gotten the event yet.
            const didRegister = new Promise((resolve, _) => {
                this.onDidRegisterAuthenticationProvider(e => {
                    if (e.id === providerId) {
                        provider = this._authenticationProviders.get(providerId);
                        if (provider) {
                            resolve(provider);
                        }
                        else {
                            throw new Error(`No authentication provider '${providerId}' is currently registered.`);
                        }
                    }
                });
            });
            const didTimeout = new Promise((_, reject) => {
                setTimeout(() => {
                    reject('Timed out waiting for authentication provider to register');
                }, 5000);
            });
            return Promise.race([didRegister, didTimeout]);
        }
        async getSessions(id, scopes, activateImmediate = false) {
            const authProvider = this._authenticationProviders.get(id) || await this.tryActivateProvider(id, activateImmediate);
            if (authProvider) {
                return await authProvider.getSessions(scopes);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async createSession(id, scopes, activateImmediate = false) {
            const authProvider = this._authenticationProviders.get(id) || await this.tryActivateProvider(id, activateImmediate);
            if (authProvider) {
                return await authProvider.createSession(scopes);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async removeSession(id, sessionId) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.removeSession(sessionId);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async manageTrustedExtensionsForAccount(id, accountName) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.manageTrustedExtensions(accountName);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async removeAccountSessions(id, accountName, sessions) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.removeAccountSessions(accountName, sessions);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
    };
    AuthenticationService = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, extensions_2.IExtensionService),
        __param(2, storage_1.IStorageService),
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, dialogs_1.IDialogService),
        __param(5, quickInput_1.IQuickInputService)
    ], AuthenticationService);
    exports.AuthenticationService = AuthenticationService;
    (0, extensions_1.registerSingleton)(authentication_1.IAuthenticationService, AuthenticationService);
});
//# sourceMappingURL=authenticationService.js.map