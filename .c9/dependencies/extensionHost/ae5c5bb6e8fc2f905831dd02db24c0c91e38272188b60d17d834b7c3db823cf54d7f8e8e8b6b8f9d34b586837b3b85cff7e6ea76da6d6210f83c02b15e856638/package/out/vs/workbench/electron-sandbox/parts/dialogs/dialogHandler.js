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
define(["require", "exports", "vs/nls", "vs/base/common/date", "vs/base/common/labels", "vs/base/common/platform", "vs/base/common/severity", "vs/platform/clipboard/common/clipboardService", "vs/platform/log/common/log", "vs/platform/native/electron-sandbox/native", "vs/platform/product/common/productService", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, nls_1, date_1, labels_1, platform_1, severity_1, clipboardService_1, log_1, native_1, productService_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeDialogHandler = void 0;
    let NativeDialogHandler = class NativeDialogHandler {
        constructor(logService, nativeHostService, productService, clipboardService) {
            this.logService = logService;
            this.nativeHostService = nativeHostService;
            this.productService = productService;
            this.clipboardService = clipboardService;
        }
        async confirm(confirmation) {
            this.logService.trace('DialogService#confirm', confirmation.message);
            const { options, buttonIndexMap } = this.massageMessageBoxOptions(this.getConfirmOptions(confirmation));
            const result = await this.nativeHostService.showMessageBox(options);
            return {
                confirmed: buttonIndexMap[result.response] === 0 ? true : false,
                checkboxChecked: result.checkboxChecked
            };
        }
        getConfirmOptions(confirmation) {
            const buttons = [];
            if (confirmation.primaryButton) {
                buttons.push(confirmation.primaryButton);
            }
            else {
                buttons.push((0, nls_1.localize)({ key: 'yesButton', comment: ['&& denotes a mnemonic'] }, "&&Yes"));
            }
            if (confirmation.secondaryButton) {
                buttons.push(confirmation.secondaryButton);
            }
            else if (typeof confirmation.secondaryButton === 'undefined') {
                buttons.push((0, nls_1.localize)('cancelButton', "Cancel"));
            }
            const opts = {
                title: confirmation.title,
                message: confirmation.message,
                buttons,
                cancelId: 1
            };
            if (confirmation.detail) {
                opts.detail = confirmation.detail;
            }
            if (confirmation.type) {
                opts.type = confirmation.type;
            }
            if (confirmation.checkbox) {
                opts.checkboxLabel = confirmation.checkbox.label;
                opts.checkboxChecked = confirmation.checkbox.checked;
            }
            return opts;
        }
        async show(severity, message, buttons, dialogOptions) {
            var _a, _b, _c, _d;
            this.logService.trace('DialogService#show', message);
            const { options, buttonIndexMap } = this.massageMessageBoxOptions({
                message,
                buttons,
                type: (severity === severity_1.default.Info) ? 'question' : (severity === severity_1.default.Error) ? 'error' : (severity === severity_1.default.Warning) ? 'warning' : 'none',
                cancelId: dialogOptions ? dialogOptions.cancelId : undefined,
                detail: dialogOptions ? dialogOptions.detail : undefined,
                checkboxLabel: (_b = (_a = dialogOptions === null || dialogOptions === void 0 ? void 0 : dialogOptions.checkbox) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : undefined,
                checkboxChecked: (_d = (_c = dialogOptions === null || dialogOptions === void 0 ? void 0 : dialogOptions.checkbox) === null || _c === void 0 ? void 0 : _c.checked) !== null && _d !== void 0 ? _d : undefined
            });
            const result = await this.nativeHostService.showMessageBox(options);
            return { choice: buttonIndexMap[result.response], checkboxChecked: result.checkboxChecked };
        }
        massageMessageBoxOptions(options) {
            let buttonIndexMap = (options.buttons || []).map((button, index) => index);
            let buttons = (options.buttons || []).map(button => (0, labels_1.mnemonicButtonLabel)(button));
            let cancelId = options.cancelId;
            // Linux: order of buttons is reverse
            // macOS: also reverse, but the OS handles this for us!
            if (platform_1.isLinux) {
                buttons = buttons.reverse();
                buttonIndexMap = buttonIndexMap.reverse();
            }
            // Default Button (always first one)
            options.defaultId = buttonIndexMap[0];
            // Cancel Button
            if (typeof cancelId === 'number') {
                // Ensure the cancelId is the correct one from our mapping
                cancelId = buttonIndexMap[cancelId];
                // macOS/Linux: the cancel button should always be to the left of the primary action
                // if we see more than 2 buttons, move the cancel one to the left of the primary
                if (!platform_1.isWindows && buttons.length > 2 && cancelId !== 1) {
                    const cancelButton = buttons[cancelId];
                    buttons.splice(cancelId, 1);
                    buttons.splice(1, 0, cancelButton);
                    const cancelButtonIndex = buttonIndexMap[cancelId];
                    buttonIndexMap.splice(cancelId, 1);
                    buttonIndexMap.splice(1, 0, cancelButtonIndex);
                    cancelId = 1;
                }
            }
            options.buttons = buttons;
            options.cancelId = cancelId;
            options.noLink = true;
            options.title = options.title || this.productService.nameLong;
            return { options, buttonIndexMap };
        }
        input() {
            throw new Error('Unsupported'); // we have no native API for password dialogs in Electron
        }
        async about() {
            let version = this.productService.version;
            if (this.productService.target) {
                version = `${version} (${this.productService.target} setup)`;
            }
            else if (this.productService.darwinUniversalAssetId) {
                version = `${version} (Universal)`;
            }
            const osProps = await this.nativeHostService.getOSProperties();
            const detailString = (useAgo) => {
                return (0, nls_1.localize)({ key: 'aboutDetail', comment: ['Electron, Chromium, Node.js and V8 are product names that need no translation'] }, "Version: {0}\nCommit: {1}\nDate: {2}\nElectron: {3}\nChromium: {4}\nNode.js: {5}\nV8: {6}\nOS: {7}", version, this.productService.commit || 'Unknown', this.productService.date ? `${this.productService.date}${useAgo ? ' (' + (0, date_1.fromNow)(new Date(this.productService.date), true) + ')' : ''}` : 'Unknown', globals_1.process.versions['electron'], globals_1.process.versions['chrome'], globals_1.process.versions['node'], globals_1.process.versions['v8'], `${osProps.type} ${osProps.arch} ${osProps.release}${platform_1.isLinuxSnap ? ' snap' : ''}`);
            };
            const detail = detailString(true);
            const detailToCopy = detailString(false);
            const ok = (0, nls_1.localize)('okButton', "OK");
            const copy = (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'copy', comment: ['&& denotes a mnemonic'] }, "&&Copy"));
            let buttons;
            if (platform_1.isLinux) {
                buttons = [copy, ok];
            }
            else {
                buttons = [ok, copy];
            }
            const result = await this.nativeHostService.showMessageBox({
                title: this.productService.nameLong,
                type: 'info',
                message: this.productService.nameLong,
                detail: `\n${detail}`,
                buttons,
                noLink: true,
                defaultId: buttons.indexOf(ok),
                cancelId: buttons.indexOf(ok)
            });
            if (buttons[result.response] === copy) {
                this.clipboardService.writeText(detailToCopy);
            }
        }
    };
    NativeDialogHandler = __decorate([
        __param(0, log_1.ILogService),
        __param(1, native_1.INativeHostService),
        __param(2, productService_1.IProductService),
        __param(3, clipboardService_1.IClipboardService)
    ], NativeDialogHandler);
    exports.NativeDialogHandler = NativeDialogHandler;
});
//# sourceMappingURL=dialogHandler.js.map