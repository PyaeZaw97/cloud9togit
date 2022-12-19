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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/authentication/common/authentication", "../common/extHost.protocol", "vs/platform/dialogs/common/dialogs", "vs/platform/storage/common/storage", "vs/base/common/severity", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/base/common/date", "vs/workbench/services/extensions/common/extensions", "vs/platform/telemetry/common/telemetry"], function (require, exports, lifecycle_1, nls, extHostCustomers_1, authenticationService_1, authentication_1, extHost_protocol_1, dialogs_1, storage_1, severity_1, quickInput_1, notification_1, date_1, extensions_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadAuthentication = exports.MainThreadAuthenticationProvider = void 0;
    class MainThreadAuthenticationProvider extends lifecycle_1.Disposable {
        constructor(_proxy, id, label, supportsMultipleAccounts, notificationService, storageService, quickInputService, dialogService) {
            super();
            this._proxy = _proxy;
            this.id = id;
            this.label = label;
            this.supportsMultipleAccounts = supportsMultipleAccounts;
            this.notificationService = notificationService;
            this.storageService = storageService;
            this.quickInputService = quickInputService;
            this.dialogService = dialogService;
        }
        manageTrustedExtensions(accountName) {
            const allowedExtensions = (0, authenticationService_1.readAllowedExtensions)(this.storageService, this.id, accountName);
            if (!allowedExtensions.length) {
                this.dialogService.show(severity_1.default.Info, nls.localize('noTrustedExtensions', "This account has not been used by any extensions."));
                return;
            }
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.canSelectMany = true;
            quickPick.customButton = true;
            quickPick.customLabel = nls.localize('manageTrustedExtensions.cancel', 'Cancel');
            const usages = (0, authenticationService_1.readAccountUsages)(this.storageService, this.id, accountName);
            const items = allowedExtensions.map(extension => {
                const usage = usages.find(usage => extension.id === usage.extensionId);
                return {
                    label: extension.name,
                    description: usage
                        ? nls.localize({ key: 'accountLastUsedDate', comment: ['The placeholder {0} is a string with time information, such as "3 days ago"'] }, "Last used this account {0}", (0, date_1.fromNow)(usage.lastUsed, true))
                        : nls.localize('notUsed', "Has not used this account"),
                    extension
                };
            });
            quickPick.items = items;
            quickPick.selectedItems = items.filter(item => item.extension.allowed === undefined || item.extension.allowed);
            quickPick.title = nls.localize('manageTrustedExtensions', "Manage Trusted Extensions");
            quickPick.placeholder = nls.localize('manageExtensions', "Choose which extensions can access this account");
            quickPick.onDidAccept(() => {
                const updatedAllowedList = quickPick.items
                    .map(i => i.extension);
                this.storageService.store(`${this.id}-${accountName}`, JSON.stringify(updatedAllowedList), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                quickPick.dispose();
            });
            quickPick.onDidChangeSelection((changed) => {
                quickPick.items.forEach(item => {
                    if (item.extension) {
                        item.extension.allowed = false;
                    }
                });
                changed.forEach((item) => item.extension.allowed = true);
            });
            quickPick.onDidHide(() => {
                quickPick.dispose();
            });
            quickPick.onDidCustom(() => {
                quickPick.hide();
            });
            quickPick.show();
        }
        async removeAccountSessions(accountName, sessions) {
            const accountUsages = (0, authenticationService_1.readAccountUsages)(this.storageService, this.id, accountName);
            const result = await this.dialogService.show(severity_1.default.Info, accountUsages.length
                ? nls.localize('signOutMessage', "The account '{0}' has been used by: \n\n{1}\n\n Sign out from these extensions?", accountName, accountUsages.map(usage => usage.extensionName).join('\n'))
                : nls.localize('signOutMessageSimple', "Sign out of '{0}'?", accountName), [
                nls.localize('signOut', "Sign Out"),
                nls.localize('cancel', "Cancel")
            ], {
                cancelId: 1
            });
            if (result.choice === 0) {
                const removeSessionPromises = sessions.map(session => this.removeSession(session.id));
                await Promise.all(removeSessionPromises);
                (0, authenticationService_1.removeAccountUsage)(this.storageService, this.id, accountName);
                this.storageService.remove(`${this.id}-${accountName}`, 0 /* StorageScope.GLOBAL */);
            }
        }
        async getSessions(scopes) {
            return this._proxy.$getSessions(this.id, scopes);
        }
        createSession(scopes) {
            return this._proxy.$createSession(this.id, scopes);
        }
        async removeSession(sessionId) {
            await this._proxy.$removeSession(this.id, sessionId);
            this.notificationService.info(nls.localize('signedOut', "Successfully signed out."));
        }
    }
    exports.MainThreadAuthenticationProvider = MainThreadAuthenticationProvider;
    let MainThreadAuthentication = class MainThreadAuthentication extends lifecycle_1.Disposable {
        constructor(extHostContext, authenticationService, dialogService, storageService, notificationService, quickInputService, extensionService, telemetryService) {
            super();
            this.authenticationService = authenticationService;
            this.dialogService = dialogService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.quickInputService = quickInputService;
            this.extensionService = extensionService;
            this.telemetryService = telemetryService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostAuthentication);
            this._register(this.authenticationService.onDidChangeSessions(e => {
                this._proxy.$onDidChangeAuthenticationSessions(e.providerId, e.label);
            }));
            this._proxy.$setProviders(this.authenticationService.declaredProviders);
            this._register(this.authenticationService.onDidChangeDeclaredProviders(e => {
                this._proxy.$setProviders(e);
            }));
        }
        async $registerAuthenticationProvider(id, label, supportsMultipleAccounts) {
            const provider = new MainThreadAuthenticationProvider(this._proxy, id, label, supportsMultipleAccounts, this.notificationService, this.storageService, this.quickInputService, this.dialogService);
            this.authenticationService.registerAuthenticationProvider(id, provider);
        }
        $unregisterAuthenticationProvider(id) {
            this.authenticationService.unregisterAuthenticationProvider(id);
        }
        $ensureProvider(id) {
            return this.extensionService.activateByEvent((0, authenticationService_1.getAuthenticationProviderActivationEvent)(id), 1 /* ActivationKind.Immediate */);
        }
        $sendDidChangeSessions(id, event) {
            this.authenticationService.sessionsUpdate(id, event);
        }
        $removeSession(providerId, sessionId) {
            return this.authenticationService.removeSession(providerId, sessionId);
        }
        async loginPrompt(providerName, extensionName, recreatingSession, detail) {
            const message = recreatingSession
                ? nls.localize('confirmRelogin', "The extension '{0}' wants you to sign in again using {1}.", extensionName, providerName)
                : nls.localize('confirmLogin', "The extension '{0}' wants to sign in using {1}.", extensionName, providerName);
            const { choice } = await this.dialogService.show(severity_1.default.Info, message, [nls.localize('allow', "Allow"), nls.localize('cancel', "Cancel")], {
                cancelId: 1,
                detail
            });
            return choice === 0;
        }
        async setTrustedExtensionAndAccountPreference(providerId, accountName, extensionId, extensionName, sessionId) {
            this.authenticationService.updatedAllowedExtension(providerId, accountName, extensionId, extensionName, true);
            this.storageService.store(`${extensionName}-${providerId}`, sessionId, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        async doGetSession(providerId, scopes, extensionId, extensionName, options) {
            const sessions = await this.authenticationService.getSessions(providerId, scopes, true);
            const supportsMultipleAccounts = this.authenticationService.supportsMultipleAccounts(providerId);
            // Error cases
            if (options.forceNewSession && !sessions.length) {
                throw new Error('No existing sessions found.');
            }
            if (options.forceNewSession && options.createIfNone) {
                throw new Error('Invalid combination of options. Please remove one of the following: forceNewSession, createIfNone');
            }
            if (options.forceNewSession && options.silent) {
                throw new Error('Invalid combination of options. Please remove one of the following: forceNewSession, silent');
            }
            if (options.createIfNone && options.silent) {
                throw new Error('Invalid combination of options. Please remove one of the following: createIfNone, silent');
            }
            // Check if the sessions we have are valid
            if (!options.forceNewSession && sessions.length) {
                if (supportsMultipleAccounts) {
                    if (options.clearSessionPreference) {
                        this.storageService.remove(`${extensionName}-${providerId}`, 0 /* StorageScope.GLOBAL */);
                    }
                    else {
                        const existingSessionPreference = this.storageService.get(`${extensionName}-${providerId}`, 0 /* StorageScope.GLOBAL */);
                        if (existingSessionPreference) {
                            const matchingSession = sessions.find(session => session.id === existingSessionPreference);
                            if (matchingSession && this.authenticationService.isAccessAllowed(providerId, matchingSession.account.label, extensionId)) {
                                return matchingSession;
                            }
                        }
                    }
                }
                else if (this.authenticationService.isAccessAllowed(providerId, sessions[0].account.label, extensionId)) {
                    return sessions[0];
                }
            }
            // We may need to prompt because we don't have a valid session
            // modal flows
            if (options.createIfNone || options.forceNewSession) {
                const providerName = this.authenticationService.getLabel(providerId);
                const detail = (typeof options.forceNewSession === 'object') ? options.forceNewSession.detail : undefined;
                const isAllowed = await this.loginPrompt(providerName, extensionName, !!options.forceNewSession, detail);
                if (!isAllowed) {
                    throw new Error('User did not consent to login.');
                }
                const session = (sessions === null || sessions === void 0 ? void 0 : sessions.length) && !options.forceNewSession && supportsMultipleAccounts
                    ? await this.authenticationService.selectSession(providerId, extensionId, extensionName, scopes, sessions)
                    : await this.authenticationService.createSession(providerId, scopes, true);
                await this.setTrustedExtensionAndAccountPreference(providerId, session.account.label, extensionId, extensionName, session.id);
                return session;
            }
            // passive flows (silent or default)
            const validSession = sessions.find(s => this.authenticationService.isAccessAllowed(providerId, s.account.label, extensionId));
            if (!options.silent && !validSession) {
                await this.authenticationService.requestNewSession(providerId, scopes, extensionId, extensionName);
            }
            return validSession;
        }
        async $getSession(providerId, scopes, extensionId, extensionName, options) {
            const session = await this.doGetSession(providerId, scopes, extensionId, extensionName, options);
            if (session) {
                this.telemetryService.publicLog2('authentication.providerUsage', { providerId, extensionId });
                (0, authenticationService_1.addAccountUsage)(this.storageService, providerId, session.account.label, extensionId, extensionName);
            }
            return session;
        }
    };
    MainThreadAuthentication = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadAuthentication),
        __param(1, authentication_1.IAuthenticationService),
        __param(2, dialogs_1.IDialogService),
        __param(3, storage_1.IStorageService),
        __param(4, notification_1.INotificationService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, extensions_1.IExtensionService),
        __param(7, telemetry_1.ITelemetryService)
    ], MainThreadAuthentication);
    exports.MainThreadAuthentication = MainThreadAuthentication;
});
//# sourceMappingURL=mainThreadAuthentication.js.map