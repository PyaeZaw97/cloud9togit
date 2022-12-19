/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/resources"], function (require, exports, network_1, platform_1, process_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * @deprecated You MUST use `IProductService` if possible.
     */
    let product;
    // Native sandbox environment
    if (typeof platform_1.globals.vscode !== 'undefined' && typeof platform_1.globals.vscode.context !== 'undefined') {
        const configuration = platform_1.globals.vscode.context.configuration();
        if (configuration) {
            product = configuration.product;
        }
        else {
            throw new Error('Sandbox: unable to resolve product configuration from preload script.');
        }
    }
    // Native node.js environment
    else if (typeof (require === null || require === void 0 ? void 0 : require.__$__nodeRequire) === 'function') {
        // Obtain values from product.json and package.json
        const rootPath = (0, resources_1.dirname)(network_1.FileAccess.asFileUri('', require));
        product = require.__$__nodeRequire((0, resources_1.joinPath)(rootPath, 'product.json').fsPath);
        const pkg = require.__$__nodeRequire((0, resources_1.joinPath)(rootPath, 'package.json').fsPath);
        // Running out of sources
        if (process_1.env['VSCODE_DEV']) {
            Object.assign(product, {
                nameShort: `${product.nameShort} Dev`,
                nameLong: `${product.nameLong} Dev`,
                dataFolderName: `${product.dataFolderName}-dev`,
                serverDataFolderName: product.serverDataFolderName ? `${product.serverDataFolderName}-dev` : undefined
            });
        }
        Object.assign(product, {
            version: pkg.version
        });
    }
    // Web environment or unknown
    else {
        // Built time configuration (do NOT modify)
        product = { /*BUILD->INSERT_PRODUCT_CONFIGURATION*/};
        // Running out of sources
        if (Object.keys(product).length === 0) {
            Object.assign(product, {
                version: '1.66.0-dev',
                nameShort: 'Code - OSS Dev',
                nameLong: 'Code - OSS Dev',
                applicationName: 'code-oss',
                dataFolderName: '.vscode-oss',
                urlProtocol: 'code-oss',
                reportIssueUrl: 'https://github.com/microsoft/vscode/issues/new',
                licenseName: 'MIT',
                licenseUrl: 'https://github.com/microsoft/vscode/blob/main/LICENSE.txt'
            });
        }
    }
    /**
     * @deprecated You MUST use `IProductService` if possible.
     */
    exports.default = product;
});
//# sourceMappingURL=product.js.map