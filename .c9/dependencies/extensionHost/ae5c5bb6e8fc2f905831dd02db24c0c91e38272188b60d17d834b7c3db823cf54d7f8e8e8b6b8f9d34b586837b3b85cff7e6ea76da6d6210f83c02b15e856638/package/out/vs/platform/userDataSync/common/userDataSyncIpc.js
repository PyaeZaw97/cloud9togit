/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri"], function (require, exports, lifecycle_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncStoreManagementServiceChannelClient = exports.UserDataSyncStoreManagementServiceChannel = exports.UserDataSyncAccountServiceChannel = exports.UserDataSyncMachinesServiceChannel = exports.UserDataSyncUtilServiceClient = exports.UserDataSycnUtilServiceChannel = exports.UserDataAutoSyncChannel = void 0;
    class UserDataAutoSyncChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onError': return this.service.onError;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'triggerSync': return this.service.triggerSync(args[0], args[1], args[2]);
                case 'turnOn': return this.service.turnOn();
                case 'turnOff': return this.service.turnOff(args[0]);
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataAutoSyncChannel = UserDataAutoSyncChannel;
    class UserDataSycnUtilServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'resolveDefaultIgnoredSettings': return this.service.resolveDefaultIgnoredSettings();
                case 'resolveUserKeybindings': return this.service.resolveUserBindings(args[0]);
                case 'resolveFormattingOptions': return this.service.resolveFormattingOptions(uri_1.URI.revive(args[0]));
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSycnUtilServiceChannel = UserDataSycnUtilServiceChannel;
    class UserDataSyncUtilServiceClient {
        constructor(channel) {
            this.channel = channel;
        }
        async resolveDefaultIgnoredSettings() {
            return this.channel.call('resolveDefaultIgnoredSettings');
        }
        async resolveUserBindings(userbindings) {
            return this.channel.call('resolveUserKeybindings', [userbindings]);
        }
        async resolveFormattingOptions(file) {
            return this.channel.call('resolveFormattingOptions', [file]);
        }
    }
    exports.UserDataSyncUtilServiceClient = UserDataSyncUtilServiceClient;
    class UserDataSyncMachinesServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChange': return this.service.onDidChange;
            }
            throw new Error(`Event not found: ${event}`);
        }
        async call(context, command, args) {
            switch (command) {
                case 'getMachines': return this.service.getMachines();
                case 'addCurrentMachine': return this.service.addCurrentMachine();
                case 'removeCurrentMachine': return this.service.removeCurrentMachine();
                case 'renameMachine': return this.service.renameMachine(args[0], args[1]);
                case 'setEnablements': return this.service.setEnablements(args);
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncMachinesServiceChannel = UserDataSyncMachinesServiceChannel;
    class UserDataSyncAccountServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeAccount': return this.service.onDidChangeAccount;
                case 'onTokenFailed': return this.service.onTokenFailed;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case '_getInitialData': return Promise.resolve(this.service.account);
                case 'updateAccount': return this.service.updateAccount(args);
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncAccountServiceChannel = UserDataSyncAccountServiceChannel;
    class UserDataSyncStoreManagementServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeUserDataSyncStore': return this.service.onDidChangeUserDataSyncStore;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'switch': return this.service.switch(args[0]);
                case 'getPreviousUserDataSyncStore': return this.service.getPreviousUserDataSyncStore();
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncStoreManagementServiceChannel = UserDataSyncStoreManagementServiceChannel;
    class UserDataSyncStoreManagementServiceChannelClient extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this.channel = channel;
            this.onDidChangeUserDataSyncStore = this.channel.listen('onDidChangeUserDataSyncStore');
        }
        async switch(type) {
            return this.channel.call('switch', [type]);
        }
        async getPreviousUserDataSyncStore() {
            const userDataSyncStore = await this.channel.call('getPreviousUserDataSyncStore');
            return this.revive(userDataSyncStore);
        }
        revive(userDataSyncStore) {
            return {
                url: uri_1.URI.revive(userDataSyncStore.url),
                type: userDataSyncStore.type,
                defaultUrl: uri_1.URI.revive(userDataSyncStore.defaultUrl),
                insidersUrl: uri_1.URI.revive(userDataSyncStore.insidersUrl),
                stableUrl: uri_1.URI.revive(userDataSyncStore.stableUrl),
                canSwitch: userDataSyncStore.canSwitch,
                authenticationProviders: userDataSyncStore.authenticationProviders,
            };
        }
    }
    exports.UserDataSyncStoreManagementServiceChannelClient = UserDataSyncStoreManagementServiceChannelClient;
});
//# sourceMappingURL=userDataSyncIpc.js.map