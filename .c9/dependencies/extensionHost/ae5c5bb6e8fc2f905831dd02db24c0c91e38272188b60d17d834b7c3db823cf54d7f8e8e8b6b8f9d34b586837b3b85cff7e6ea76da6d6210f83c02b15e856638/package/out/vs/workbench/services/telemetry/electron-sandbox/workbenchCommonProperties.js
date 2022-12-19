/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, commonProperties_1, telemetry_1, telemetryUtils_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveWorkbenchCommonProperties = void 0;
    async function resolveWorkbenchCommonProperties(storageService, fileService, release, hostname, commit, version, machineId, msftInternalDomains, installSourcePath, remoteAuthority) {
        const result = await (0, commonProperties_1.resolveCommonProperties)(fileService, release, hostname, globals_1.process.arch, commit, version, machineId, msftInternalDomains, installSourcePath);
        const firstSessionDate = storageService.get(telemetry_1.firstSessionDateStorageKey, 0 /* StorageScope.GLOBAL */);
        const lastSessionDate = storageService.get(telemetry_1.lastSessionDateStorageKey, 0 /* StorageScope.GLOBAL */);
        // __GDPR__COMMON__ "common.version.shell" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.version.shell'] = globals_1.process.versions['electron'];
        // __GDPR__COMMON__ "common.version.renderer" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.version.renderer'] = globals_1.process.versions['chrome'];
        // __GDPR__COMMON__ "common.firstSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.firstSessionDate'] = firstSessionDate;
        // __GDPR__COMMON__ "common.lastSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.lastSessionDate'] = lastSessionDate || '';
        // __GDPR__COMMON__ "common.isNewSession" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.isNewSession'] = !lastSessionDate ? '1' : '0';
        // __GDPR__COMMON__ "common.remoteAuthority" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.remoteAuthority'] = (0, telemetryUtils_1.cleanRemoteAuthority)(remoteAuthority);
        return result;
    }
    exports.resolveWorkbenchCommonProperties = resolveWorkbenchCommonProperties;
});
//# sourceMappingURL=workbenchCommonProperties.js.map