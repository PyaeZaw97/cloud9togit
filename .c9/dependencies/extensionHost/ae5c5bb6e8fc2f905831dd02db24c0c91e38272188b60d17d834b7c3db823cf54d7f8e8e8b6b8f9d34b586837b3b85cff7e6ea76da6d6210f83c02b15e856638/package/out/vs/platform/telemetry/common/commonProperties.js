/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/uri", "vs/base/common/uuid"], function (require, exports, platform_1, process_1, uri_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.verifyMicrosoftInternalDomain = exports.resolveCommonProperties = void 0;
    function getPlatformDetail(hostname) {
        if (platform_1.platform === 2 /* Platform.Linux */ && /^penguin(\.|$)/i.test(hostname)) {
            return 'chromebook';
        }
        return undefined;
    }
    async function resolveCommonProperties(fileService, release, hostname, arch, commit, version, machineId, msftInternalDomains, installSourcePath, product) {
        const result = Object.create(null);
        // __GDPR__COMMON__ "common.machineId" : { "endPoint": "MacAddressHash", "classification": "EndUserPseudonymizedInformation", "purpose": "FeatureInsight" }
        result['common.machineId'] = machineId;
        // __GDPR__COMMON__ "sessionID" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['sessionID'] = (0, uuid_1.generateUuid)() + Date.now();
        // __GDPR__COMMON__ "commitHash" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['commitHash'] = commit;
        // __GDPR__COMMON__ "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['version'] = version;
        // __GDPR__COMMON__ "common.platformVersion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.platformVersion'] = (release || '').replace(/^(\d+)(\.\d+)?(\.\d+)?(.*)/, '$1$2$3');
        // __GDPR__COMMON__ "common.platform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.platform'] = (0, platform_1.PlatformToString)(platform_1.platform);
        // __GDPR__COMMON__ "common.nodePlatform" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.nodePlatform'] = process_1.platform;
        // __GDPR__COMMON__ "common.nodeArch" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.nodeArch'] = arch;
        // __GDPR__COMMON__ "common.product" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.product'] = product || 'desktop';
        const msftInternal = verifyMicrosoftInternalDomain(msftInternalDomains || []);
        if (msftInternal) {
            // __GDPR__COMMON__ "common.msftInternal" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            result['common.msftInternal'] = msftInternal;
        }
        // dynamic properties which value differs on each call
        let seq = 0;
        const startTime = Date.now();
        Object.defineProperties(result, {
            // __GDPR__COMMON__ "timestamp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            'timestamp': {
                get: () => new Date(),
                enumerable: true
            },
            // __GDPR__COMMON__ "common.timesincesessionstart" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            'common.timesincesessionstart': {
                get: () => Date.now() - startTime,
                enumerable: true
            },
            // __GDPR__COMMON__ "common.sequence" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            'common.sequence': {
                get: () => seq++,
                enumerable: true
            }
        });
        if (platform_1.isLinuxSnap) {
            // __GDPR__COMMON__ "common.snap" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.snap'] = 'true';
        }
        const platformDetail = getPlatformDetail(hostname);
        if (platformDetail) {
            // __GDPR__COMMON__ "common.platformDetail" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.platformDetail'] = platformDetail;
        }
        try {
            const contents = await fileService.readFile(uri_1.URI.file(installSourcePath));
            // __GDPR__COMMON__ "common.source" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.source'] = contents.value.toString().slice(0, 30);
        }
        catch (error) {
            // ignore error
        }
        return result;
    }
    exports.resolveCommonProperties = resolveCommonProperties;
    function verifyMicrosoftInternalDomain(domainList) {
        const userDnsDomain = process_1.env['USERDNSDOMAIN'];
        if (!userDnsDomain) {
            return false;
        }
        const domain = userDnsDomain.toLowerCase();
        return domainList.some(msftDomain => domain === msftDomain);
    }
    exports.verifyMicrosoftInternalDomain = verifyMicrosoftInternalDomain;
});
//# sourceMappingURL=commonProperties.js.map