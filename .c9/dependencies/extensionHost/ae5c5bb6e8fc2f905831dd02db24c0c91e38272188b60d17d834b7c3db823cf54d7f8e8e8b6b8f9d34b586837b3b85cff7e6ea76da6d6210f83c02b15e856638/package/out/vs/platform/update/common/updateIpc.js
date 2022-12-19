/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/update/common/update"], function (require, exports, event_1, update_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UpdateChannelClient = exports.UpdateChannel = void 0;
    class UpdateChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onStateChange': return this.service.onStateChange;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'checkForUpdates': return this.service.checkForUpdates(arg);
                case 'downloadUpdate': return this.service.downloadUpdate();
                case 'applyUpdate': return this.service.applyUpdate();
                case 'quitAndInstall': return this.service.quitAndInstall();
                case '_getInitialState': return Promise.resolve(this.service.state);
                case 'isLatestVersion': return this.service.isLatestVersion();
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.UpdateChannel = UpdateChannel;
    class UpdateChannelClient {
        constructor(channel) {
            this.channel = channel;
            this._onStateChange = new event_1.Emitter();
            this.onStateChange = this._onStateChange.event;
            this._state = update_1.State.Uninitialized;
            this.channel.listen('onStateChange')(state => this.state = state);
            this.channel.call('_getInitialState').then(state => this.state = state);
        }
        get state() { return this._state; }
        set state(state) {
            this._state = state;
            this._onStateChange.fire(state);
        }
        checkForUpdates(explicit) {
            return this.channel.call('checkForUpdates', explicit);
        }
        downloadUpdate() {
            return this.channel.call('downloadUpdate');
        }
        applyUpdate() {
            return this.channel.call('applyUpdate');
        }
        quitAndInstall() {
            return this.channel.call('quitAndInstall');
        }
        isLatestVersion() {
            return this.channel.call('isLatestVersion');
        }
    }
    exports.UpdateChannelClient = UpdateChannelClient;
});
//# sourceMappingURL=updateIpc.js.map