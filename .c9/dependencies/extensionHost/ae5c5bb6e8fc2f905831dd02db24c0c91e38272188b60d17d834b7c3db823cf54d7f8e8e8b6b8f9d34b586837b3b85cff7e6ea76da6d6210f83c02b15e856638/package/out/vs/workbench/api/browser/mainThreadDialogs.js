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
define(["require", "exports", "vs/base/common/uri", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/collections", "vs/platform/dialogs/common/dialogs"], function (require, exports, uri_1, extHost_protocol_1, extHostCustomers_1, collections_1, dialogs_1) {
    "use strict";
    var MainThreadDialogs_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDialogs = void 0;
    let MainThreadDialogs = MainThreadDialogs_1 = class MainThreadDialogs {
        constructor(context, _fileDialogService) {
            this._fileDialogService = _fileDialogService;
            //
        }
        dispose() {
            //
        }
        async $showOpenDialog(options) {
            const convertedOptions = MainThreadDialogs_1._convertOpenOptions(options);
            if (!convertedOptions.defaultUri) {
                convertedOptions.defaultUri = await this._fileDialogService.defaultFilePath();
            }
            return Promise.resolve(this._fileDialogService.showOpenDialog(convertedOptions));
        }
        async $showSaveDialog(options) {
            const convertedOptions = MainThreadDialogs_1._convertSaveOptions(options);
            if (!convertedOptions.defaultUri) {
                convertedOptions.defaultUri = await this._fileDialogService.defaultFilePath();
            }
            return Promise.resolve(this._fileDialogService.showSaveDialog(convertedOptions));
        }
        static _convertOpenOptions(options) {
            const result = {
                openLabel: (options === null || options === void 0 ? void 0 : options.openLabel) || undefined,
                canSelectFiles: (options === null || options === void 0 ? void 0 : options.canSelectFiles) || (!(options === null || options === void 0 ? void 0 : options.canSelectFiles) && !(options === null || options === void 0 ? void 0 : options.canSelectFolders)),
                canSelectFolders: options === null || options === void 0 ? void 0 : options.canSelectFolders,
                canSelectMany: options === null || options === void 0 ? void 0 : options.canSelectMany,
                defaultUri: (options === null || options === void 0 ? void 0 : options.defaultUri) ? uri_1.URI.revive(options.defaultUri) : undefined,
                title: (options === null || options === void 0 ? void 0 : options.title) || undefined,
                availableFileSystems: []
            };
            if (options === null || options === void 0 ? void 0 : options.filters) {
                result.filters = [];
                (0, collections_1.forEach)(options.filters, entry => result.filters.push({ name: entry.key, extensions: entry.value }));
            }
            return result;
        }
        static _convertSaveOptions(options) {
            const result = {
                defaultUri: (options === null || options === void 0 ? void 0 : options.defaultUri) ? uri_1.URI.revive(options.defaultUri) : undefined,
                saveLabel: (options === null || options === void 0 ? void 0 : options.saveLabel) || undefined,
                title: (options === null || options === void 0 ? void 0 : options.title) || undefined
            };
            if (options === null || options === void 0 ? void 0 : options.filters) {
                result.filters = [];
                (0, collections_1.forEach)(options.filters, entry => result.filters.push({ name: entry.key, extensions: entry.value }));
            }
            return result;
        }
    };
    MainThreadDialogs = MainThreadDialogs_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDialogs),
        __param(1, dialogs_1.IFileDialogService)
    ], MainThreadDialogs);
    exports.MainThreadDialogs = MainThreadDialogs;
});
//# sourceMappingURL=mainThreadDialogs.js.map