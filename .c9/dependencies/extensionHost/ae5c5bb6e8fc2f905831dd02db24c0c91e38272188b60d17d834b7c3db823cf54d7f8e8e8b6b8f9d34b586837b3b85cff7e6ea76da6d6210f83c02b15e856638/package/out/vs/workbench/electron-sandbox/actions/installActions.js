/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/platform/actions/common/actions", "vs/platform/product/common/product", "vs/platform/dialogs/common/dialogs", "vs/platform/native/electron-sandbox/native", "vs/base/common/errorMessage", "vs/platform/product/common/productService"], function (require, exports, nls_1, severity_1, actions_1, product_1, dialogs_1, native_1, errorMessage_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UninstallShellScriptAction = exports.InstallShellScriptAction = void 0;
    const shellCommandCategory = { value: (0, nls_1.localize)('shellCommand', "Shell Command"), original: 'Shell Command' };
    class InstallShellScriptAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.installCommandLine',
                title: {
                    value: (0, nls_1.localize)('install', "Install '{0}' command in PATH", product_1.default.applicationName),
                    original: `Install \'${product_1.default.applicationName}\' command in PATH`
                },
                category: shellCommandCategory,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const productService = accessor.get(productService_1.IProductService);
            try {
                await nativeHostService.installShellCommand();
                dialogService.show(severity_1.default.Info, (0, nls_1.localize)('successIn', "Shell command '{0}' successfully installed in PATH.", productService.applicationName));
            }
            catch (error) {
                dialogService.show(severity_1.default.Error, (0, errorMessage_1.toErrorMessage)(error));
            }
        }
    }
    exports.InstallShellScriptAction = InstallShellScriptAction;
    class UninstallShellScriptAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.uninstallCommandLine',
                title: {
                    value: (0, nls_1.localize)('uninstall', "Uninstall '{0}' command from PATH", product_1.default.applicationName),
                    original: `Uninstall \'${product_1.default.applicationName}\' command from PATH`
                },
                category: shellCommandCategory,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const productService = accessor.get(productService_1.IProductService);
            try {
                await nativeHostService.uninstallShellCommand();
                dialogService.show(severity_1.default.Info, (0, nls_1.localize)('successFrom', "Shell command '{0}' successfully uninstalled from PATH.", productService.applicationName));
            }
            catch (error) {
                dialogService.show(severity_1.default.Error, (0, errorMessage_1.toErrorMessage)(error));
            }
        }
    }
    exports.UninstallShellScriptAction = UninstallShellScriptAction;
});
//# sourceMappingURL=installActions.js.map