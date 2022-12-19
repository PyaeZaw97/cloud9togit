/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/localizations/common/localizations", "vs/platform/ipc/electron-sandbox/services"], function (require, exports, localizations_1, services_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerSharedProcessRemoteService)(localizations_1.ILocalizationsService, 'localizations', { supportsDelayedInstantiation: true });
});
//# sourceMappingURL=localizationsService.js.map