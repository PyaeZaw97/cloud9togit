/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/credentials/common/credentials", "vs/platform/ipc/electron-sandbox/services"], function (require, exports, credentials_1, services_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerMainProcessRemoteService)(credentials_1.ICredentialsService, 'credentials', { supportsDelayedInstantiation: true });
});
//# sourceMappingURL=credentialsService.js.map