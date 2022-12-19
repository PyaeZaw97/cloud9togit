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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/update/common/update"], function (require, exports, async_1, cancellation_1, event_1, configuration_1, environmentMainService_1, lifecycleMainService_1, log_1, productService_1, request_1, update_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractUpdateService = exports.createUpdateURL = void 0;
    function createUpdateURL(platform, quality, productService) {
        return `${productService.updateUrl}/api/update/${platform}/${quality}/${productService.commit}`;
    }
    exports.createUpdateURL = createUpdateURL;
    let AbstractUpdateService = class AbstractUpdateService {
        constructor(lifecycleMainService, configurationService, environmentMainService, requestService, logService, productService) {
            this.lifecycleMainService = lifecycleMainService;
            this.configurationService = configurationService;
            this.environmentMainService = environmentMainService;
            this.requestService = requestService;
            this.logService = logService;
            this.productService = productService;
            this._state = update_1.State.Uninitialized;
            this._onStateChange = new event_1.Emitter();
            this.onStateChange = this._onStateChange.event;
        }
        get state() {
            return this._state;
        }
        setState(state) {
            this.logService.info('update#setState', state.type);
            this._state = state;
            this._onStateChange.fire(state);
        }
        /**
         * This must be called before any other call. This is a performance
         * optimization, to avoid using extra CPU cycles before first window open.
         * https://github.com/microsoft/vscode/issues/89784
         */
        async initialize() {
            if (!this.environmentMainService.isBuilt) {
                return; // updates are never enabled when running out of sources
            }
            if (this.environmentMainService.disableUpdates) {
                this.logService.info('update#ctor - updates are disabled by the environment');
                return;
            }
            if (!this.productService.updateUrl || !this.productService.commit) {
                this.logService.info('update#ctor - updates are disabled as there is no update URL');
                return;
            }
            const updateMode = await this.getUpdateMode();
            const quality = this.getProductQuality(updateMode);
            if (!quality) {
                this.logService.info('update#ctor - updates are disabled by user preference');
                return;
            }
            this.url = this.buildUpdateFeedUrl(quality);
            if (!this.url) {
                this.logService.info('update#ctor - updates are disabled as the update URL is badly formed');
                return;
            }
            this.setState(update_1.State.Idle(this.getUpdateType()));
            if (updateMode === 'manual') {
                this.logService.info('update#ctor - manual checks only; automatic updates are disabled by user preference');
                return;
            }
            if (updateMode === 'start') {
                this.logService.info('update#ctor - startup checks only; automatic updates are disabled by user preference');
                // Check for updates only once after 30 seconds
                setTimeout(() => this.checkForUpdates(false), 30 * 1000);
            }
            else {
                // Start checking for updates after 30 seconds
                this.scheduleCheckForUpdates(30 * 1000).then(undefined, err => this.logService.error(err));
            }
        }
        async getUpdateMode() {
            return (0, configuration_1.getMigratedSettingValue)(this.configurationService, 'update.mode', 'update.channel');
        }
        getProductQuality(updateMode) {
            return updateMode === 'none' ? undefined : this.productService.quality;
        }
        scheduleCheckForUpdates(delay = 60 * 60 * 1000) {
            return (0, async_1.timeout)(delay)
                .then(() => this.checkForUpdates(false))
                .then(() => {
                // Check again after 1 hour
                return this.scheduleCheckForUpdates(60 * 60 * 1000);
            });
        }
        async checkForUpdates(explicit) {
            this.logService.trace('update#checkForUpdates, state = ', this.state.type);
            if (this.state.type !== "idle" /* StateType.Idle */) {
                return;
            }
            this.doCheckForUpdates(explicit);
        }
        async downloadUpdate() {
            this.logService.trace('update#downloadUpdate, state = ', this.state.type);
            if (this.state.type !== "available for download" /* StateType.AvailableForDownload */) {
                return;
            }
            await this.doDownloadUpdate(this.state);
        }
        async doDownloadUpdate(state) {
            // noop
        }
        async applyUpdate() {
            this.logService.trace('update#applyUpdate, state = ', this.state.type);
            if (this.state.type !== "downloaded" /* StateType.Downloaded */) {
                return;
            }
            await this.doApplyUpdate();
        }
        async doApplyUpdate() {
            // noop
        }
        quitAndInstall() {
            this.logService.trace('update#quitAndInstall, state = ', this.state.type);
            if (this.state.type !== "ready" /* StateType.Ready */) {
                return Promise.resolve(undefined);
            }
            this.logService.trace('update#quitAndInstall(): before lifecycle quit()');
            this.lifecycleMainService.quit(true /* will restart */).then(vetod => {
                this.logService.trace(`update#quitAndInstall(): after lifecycle quit() with veto: ${vetod}`);
                if (vetod) {
                    return;
                }
                this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
                this.doQuitAndInstall();
            });
            return Promise.resolve(undefined);
        }
        async isLatestVersion() {
            if (!this.url) {
                return undefined;
            }
            const mode = await this.getUpdateMode();
            if (mode === 'none') {
                return false;
            }
            const context = await this.requestService.request({ url: this.url }, cancellation_1.CancellationToken.None);
            // The update server replies with 204 (No Content) when no
            // update is available - that's all we want to know.
            return context.res.statusCode === 204;
        }
        getUpdateType() {
            return 1 /* UpdateType.Archive */;
        }
        doQuitAndInstall() {
            // noop
        }
    };
    AbstractUpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentMainService_1.IEnvironmentMainService),
        __param(3, request_1.IRequestService),
        __param(4, log_1.ILogService),
        __param(5, productService_1.IProductService)
    ], AbstractUpdateService);
    exports.AbstractUpdateService = AbstractUpdateService;
});
//# sourceMappingURL=abstractUpdateService.js.map