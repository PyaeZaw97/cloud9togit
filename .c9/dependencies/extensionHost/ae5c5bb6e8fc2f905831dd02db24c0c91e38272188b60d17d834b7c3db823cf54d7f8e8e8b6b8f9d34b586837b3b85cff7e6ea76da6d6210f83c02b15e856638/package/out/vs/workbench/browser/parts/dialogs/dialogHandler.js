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
define(["require", "exports", "vs/nls", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log", "vs/base/common/severity", "vs/base/browser/ui/dialog/dialog", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/platform/product/common/productService", "vs/platform/clipboard/common/clipboardService", "vs/base/common/date", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer"], function (require, exports, nls_1, layoutService_1, log_1, severity_1, dialog_1, themeService_1, styler_1, lifecycle_1, dom_1, keybinding_1, productService_1, clipboardService_1, date_1, instantiation_1, markdownRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserDialogHandler = void 0;
    let BrowserDialogHandler = class BrowserDialogHandler {
        constructor(logService, layoutService, themeService, keybindingService, instantiationService, productService, clipboardService) {
            this.logService = logService;
            this.layoutService = layoutService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            this.productService = productService;
            this.clipboardService = clipboardService;
            this.markdownRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
        }
        async confirm(confirmation) {
            this.logService.trace('DialogService#confirm', confirmation.message);
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
            const result = await this.doShow(confirmation.type, confirmation.message, buttons, confirmation.detail, 1, confirmation.checkbox);
            return { confirmed: result.button === 0, checkboxChecked: result.checkboxChecked };
        }
        getDialogType(severity) {
            return (severity === severity_1.default.Info) ? 'question' : (severity === severity_1.default.Error) ? 'error' : (severity === severity_1.default.Warning) ? 'warning' : 'none';
        }
        async show(severity, message, buttons, options) {
            this.logService.trace('DialogService#show', message);
            const result = await this.doShow(this.getDialogType(severity), message, buttons, options === null || options === void 0 ? void 0 : options.detail, options === null || options === void 0 ? void 0 : options.cancelId, options === null || options === void 0 ? void 0 : options.checkbox, undefined, typeof (options === null || options === void 0 ? void 0 : options.custom) === 'object' ? options.custom : undefined);
            return {
                choice: result.button,
                checkboxChecked: result.checkboxChecked
            };
        }
        async doShow(type, message, buttons, detail, cancelId, checkbox, inputs, customOptions) {
            const dialogDisposables = new lifecycle_1.DisposableStore();
            const renderBody = customOptions ? (parent) => {
                var _a;
                parent.classList.add(...(customOptions.classes || []));
                (_a = customOptions.markdownDetails) === null || _a === void 0 ? void 0 : _a.forEach(markdownDetail => {
                    const result = this.markdownRenderer.render(markdownDetail.markdown);
                    parent.appendChild(result.element);
                    result.element.classList.add(...(markdownDetail.classes || []));
                    dialogDisposables.add(result);
                });
            } : undefined;
            const dialog = new dialog_1.Dialog(this.layoutService.container, message, buttons, {
                detail,
                cancelId,
                type,
                keyEventProcessor: (event) => {
                    const resolved = this.keybindingService.softDispatch(event, this.layoutService.container);
                    if (resolved === null || resolved === void 0 ? void 0 : resolved.commandId) {
                        if (BrowserDialogHandler.ALLOWABLE_COMMANDS.indexOf(resolved.commandId) === -1) {
                            dom_1.EventHelper.stop(event, true);
                        }
                    }
                },
                renderBody,
                icon: customOptions === null || customOptions === void 0 ? void 0 : customOptions.icon,
                disableCloseAction: customOptions === null || customOptions === void 0 ? void 0 : customOptions.disableCloseAction,
                buttonDetails: customOptions === null || customOptions === void 0 ? void 0 : customOptions.buttonDetails,
                checkboxLabel: checkbox === null || checkbox === void 0 ? void 0 : checkbox.label,
                checkboxChecked: checkbox === null || checkbox === void 0 ? void 0 : checkbox.checked,
                inputs
            });
            dialogDisposables.add(dialog);
            dialogDisposables.add((0, styler_1.attachDialogStyler)(dialog, this.themeService));
            const result = await dialog.show();
            dialogDisposables.dispose();
            return result;
        }
        async input(severity, message, buttons, inputs, options) {
            this.logService.trace('DialogService#input', message);
            const result = await this.doShow(this.getDialogType(severity), message, buttons, options === null || options === void 0 ? void 0 : options.detail, options === null || options === void 0 ? void 0 : options.cancelId, options === null || options === void 0 ? void 0 : options.checkbox, inputs);
            return {
                choice: result.button,
                checkboxChecked: result.checkboxChecked,
                values: result.values
            };
        }
        async about() {
            const detailString = (useAgo) => {
                return (0, nls_1.localize)('aboutDetail', "Version: {0}\nCommit: {1}\nDate: {2}\nBrowser: {3}", this.productService.version || 'Unknown', this.productService.commit || 'Unknown', this.productService.date ? `${this.productService.date}${useAgo ? ' (' + (0, date_1.fromNow)(new Date(this.productService.date), true) + ')' : ''}` : 'Unknown', navigator.userAgent);
            };
            const detail = detailString(true);
            const detailToCopy = detailString(false);
            const { choice } = await this.show(severity_1.default.Info, this.productService.nameLong, [(0, nls_1.localize)('copy', "Copy"), (0, nls_1.localize)('ok', "OK")], { detail, cancelId: 1 });
            if (choice === 0) {
                this.clipboardService.writeText(detailToCopy);
            }
        }
    };
    BrowserDialogHandler.ALLOWABLE_COMMANDS = [
        'copy',
        'cut',
        'editor.action.selectAll',
        'editor.action.clipboardCopyAction',
        'editor.action.clipboardCutAction',
        'editor.action.clipboardPasteAction'
    ];
    BrowserDialogHandler = __decorate([
        __param(0, log_1.ILogService),
        __param(1, layoutService_1.ILayoutService),
        __param(2, themeService_1.IThemeService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, productService_1.IProductService),
        __param(6, clipboardService_1.IClipboardService)
    ], BrowserDialogHandler);
    exports.BrowserDialogHandler = BrowserDialogHandler;
});
//# sourceMappingURL=dialogHandler.js.map