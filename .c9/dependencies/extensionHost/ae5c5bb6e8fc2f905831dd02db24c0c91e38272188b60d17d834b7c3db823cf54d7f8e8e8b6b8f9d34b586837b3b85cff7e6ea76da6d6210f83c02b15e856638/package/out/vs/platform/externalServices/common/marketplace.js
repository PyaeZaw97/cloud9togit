/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, serviceMachineId_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveMarketplaceHeaders = void 0;
    async function resolveMarketplaceHeaders(version, productService, environmentService, configurationService, fileService, storageService) {
        const headers = {
            'X-Market-Client-Id': `VSCode ${version}`,
            'User-Agent': `VSCode ${version} (${productService.nameShort})`
        };
        const uuid = await (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService);
        if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService) && (0, telemetryUtils_1.getTelemetryLevel)(configurationService) === 3 /* TelemetryLevel.USAGE */) {
            headers['X-Market-User-Id'] = uuid;
        }
        return headers;
    }
    exports.resolveMarketplaceHeaders = resolveMarketplaceHeaders;
});
//# sourceMappingURL=marketplace.js.map