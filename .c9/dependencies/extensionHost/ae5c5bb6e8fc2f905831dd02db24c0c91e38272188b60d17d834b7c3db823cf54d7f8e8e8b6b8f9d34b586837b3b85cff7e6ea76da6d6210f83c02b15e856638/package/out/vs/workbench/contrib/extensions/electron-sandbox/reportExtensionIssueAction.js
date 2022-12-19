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
define(["require", "exports", "vs/nls", "vs/platform/product/common/productService", "vs/base/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/native/electron-sandbox/native", "vs/platform/opener/common/opener", "vs/base/common/uri"], function (require, exports, nls, productService_1, actions_1, clipboardService_1, native_1, opener_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReportExtensionIssueAction = void 0;
    const builtinExtensionIssueUrl = 'https://github.com/microsoft/vscode';
    let ReportExtensionIssueAction = class ReportExtensionIssueAction extends actions_1.Action {
        constructor(extension, openerService, clipboardService, productService, nativeHostService) {
            super(ReportExtensionIssueAction._id, ReportExtensionIssueAction._label, 'extension-action report-issue');
            this.extension = extension;
            this.openerService = openerService;
            this.clipboardService = clipboardService;
            this.productService = productService;
            this.nativeHostService = nativeHostService;
            this.enabled = extension.description.isBuiltin || (!!extension.description.repository && !!extension.description.repository.url);
        }
        async run() {
            if (!this._url) {
                this._url = await this._generateNewIssueUrl(this.extension);
            }
            this.openerService.open(uri_1.URI.parse(this._url));
        }
        async _generateNewIssueUrl(extension) {
            let baseUrl = extension.marketplaceInfo && extension.marketplaceInfo.type === 1 /* ExtensionType.User */ && extension.description.repository ? extension.description.repository.url : undefined;
            if (!baseUrl && extension.description.isBuiltin) {
                baseUrl = builtinExtensionIssueUrl;
            }
            if (!!baseUrl) {
                baseUrl = `${baseUrl.indexOf('.git') !== -1 ? baseUrl.substr(0, baseUrl.length - 4) : baseUrl}/issues/new/`;
            }
            else {
                baseUrl = this.productService.reportIssueUrl;
            }
            let reason = 'Bug';
            let title = 'Extension issue';
            let message = ':warning: We have written the needed data into your clipboard. Please paste! :warning:';
            this.clipboardService.writeText('```json \n' + JSON.stringify(extension.status, null, '\t') + '\n```');
            const os = await this.nativeHostService.getOSProperties();
            const osVersion = `${os.type} ${os.arch} ${os.release}`;
            const queryStringPrefix = baseUrl.indexOf('?') === -1 ? '?' : '&';
            const body = encodeURIComponent(`- Issue Type: \`${reason}\`
- Extension Name: \`${extension.description.name}\`
- Extension Version: \`${extension.description.version}\`
- OS Version: \`${osVersion}\`
- VS Code version: \`${this.productService.version}\`\n\n${message}`);
            return `${baseUrl}${queryStringPrefix}body=${body}&title=${encodeURIComponent(title)}`;
        }
    };
    ReportExtensionIssueAction._id = 'workbench.extensions.action.reportExtensionIssue';
    ReportExtensionIssueAction._label = nls.localize('reportExtensionIssue', "Report Issue");
    ReportExtensionIssueAction = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, clipboardService_1.IClipboardService),
        __param(3, productService_1.IProductService),
        __param(4, native_1.INativeHostService)
    ], ReportExtensionIssueAction);
    exports.ReportExtensionIssueAction = ReportExtensionIssueAction;
});
//# sourceMappingURL=reportExtensionIssueAction.js.map