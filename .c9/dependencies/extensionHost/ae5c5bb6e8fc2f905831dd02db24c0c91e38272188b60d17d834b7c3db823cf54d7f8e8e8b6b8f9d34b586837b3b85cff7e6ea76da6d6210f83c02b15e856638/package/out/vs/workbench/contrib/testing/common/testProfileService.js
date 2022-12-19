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
define(["require", "exports", "vs/base/common/event", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingContextKeys"], function (require, exports, event_1, types_1, contextkey_1, instantiation_1, storage_1, storedValue_1, testTypes_1, testId_1, testingContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestProfileService = exports.capabilityContextKeys = exports.canUseProfileWithTest = exports.ITestProfileService = void 0;
    exports.ITestProfileService = (0, instantiation_1.createDecorator)('testProfileService');
    /**
     * Gets whether the given profile can be used to run the test.
     */
    const canUseProfileWithTest = (profile, test) => profile.controllerId === test.controllerId && (testId_1.TestId.isRoot(test.item.extId) || !profile.tag || test.item.tags.includes(profile.tag));
    exports.canUseProfileWithTest = canUseProfileWithTest;
    const sorter = (a, b) => {
        if (a.isDefault !== b.isDefault) {
            return a.isDefault ? -1 : 1;
        }
        return a.label.localeCompare(b.label);
    };
    /**
     * Given a capabilities bitset, returns a map of context keys representing
     * them.
     */
    const capabilityContextKeys = (capabilities) => [
        [testingContextKeys_1.TestingContextKeys.hasRunnableTests.key, (capabilities & 2 /* TestRunProfileBitset.Run */) !== 0],
        [testingContextKeys_1.TestingContextKeys.hasDebuggableTests.key, (capabilities & 4 /* TestRunProfileBitset.Debug */) !== 0],
        [testingContextKeys_1.TestingContextKeys.hasCoverableTests.key, (capabilities & 8 /* TestRunProfileBitset.Coverage */) !== 0],
    ];
    exports.capabilityContextKeys = capabilityContextKeys;
    let TestProfileService = class TestProfileService {
        constructor(contextKeyService, storageService) {
            this.changeEmitter = new event_1.Emitter();
            this.controllerProfiles = new Map();
            /** @inheritdoc */
            this.onDidChange = this.changeEmitter.event;
            this.preferredDefaults = new storedValue_1.StoredValue({
                key: 'testingPreferredProfiles',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 0 /* StorageTarget.USER */,
            }, storageService);
            this.capabilitiesContexts = {
                [2 /* TestRunProfileBitset.Run */]: testingContextKeys_1.TestingContextKeys.hasRunnableTests.bindTo(contextKeyService),
                [4 /* TestRunProfileBitset.Debug */]: testingContextKeys_1.TestingContextKeys.hasDebuggableTests.bindTo(contextKeyService),
                [8 /* TestRunProfileBitset.Coverage */]: testingContextKeys_1.TestingContextKeys.hasCoverableTests.bindTo(contextKeyService),
                [16 /* TestRunProfileBitset.HasNonDefaultProfile */]: testingContextKeys_1.TestingContextKeys.hasNonDefaultProfile.bindTo(contextKeyService),
                [32 /* TestRunProfileBitset.HasConfigurable */]: testingContextKeys_1.TestingContextKeys.hasConfigurableProfile.bindTo(contextKeyService),
            };
            this.refreshContextKeys();
        }
        /** @inheritdoc */
        addProfile(controller, profile) {
            let record = this.controllerProfiles.get(profile.controllerId);
            if (record) {
                record.profiles.push(profile);
                record.profiles.sort(sorter);
            }
            else {
                record = {
                    profiles: [profile],
                    controller,
                };
                this.controllerProfiles.set(profile.controllerId, record);
            }
            this.refreshContextKeys();
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        updateProfile(controllerId, profileId, update) {
            const ctrl = this.controllerProfiles.get(controllerId);
            if (!ctrl) {
                return;
            }
            const profile = ctrl.profiles.find(c => c.controllerId === controllerId && c.profileId === profileId);
            if (!profile) {
                return;
            }
            Object.assign(profile, update);
            ctrl.profiles.sort(sorter);
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        configure(controllerId, profileId) {
            var _a;
            (_a = this.controllerProfiles.get(controllerId)) === null || _a === void 0 ? void 0 : _a.controller.configureRunProfile(profileId);
        }
        /** @inheritdoc */
        removeProfile(controllerId, profileId) {
            const ctrl = this.controllerProfiles.get(controllerId);
            if (!ctrl) {
                return;
            }
            if (!profileId) {
                this.controllerProfiles.delete(controllerId);
                this.changeEmitter.fire();
                return;
            }
            const index = ctrl.profiles.findIndex(c => c.profileId === profileId);
            if (index === -1) {
                return;
            }
            ctrl.profiles.splice(index, 1);
            this.refreshContextKeys();
            this.changeEmitter.fire();
        }
        /** @inheritdoc */
        capabilitiesForTest(test) {
            const ctrl = this.controllerProfiles.get(test.controllerId);
            if (!ctrl) {
                return 0;
            }
            let capabilities = 0;
            for (const profile of ctrl.profiles) {
                if (!profile.tag || test.item.tags.includes(profile.tag)) {
                    capabilities |= capabilities & profile.group ? 16 /* TestRunProfileBitset.HasNonDefaultProfile */ : profile.group;
                }
            }
            return capabilities;
        }
        /** @inheritdoc */
        all() {
            return this.controllerProfiles.values();
        }
        /** @inheritdoc */
        getControllerProfiles(profileId) {
            var _a, _b;
            return (_b = (_a = this.controllerProfiles.get(profileId)) === null || _a === void 0 ? void 0 : _a.profiles) !== null && _b !== void 0 ? _b : [];
        }
        /** @inheritdoc */
        getGroupDefaultProfiles(group) {
            var _a;
            const preferred = this.preferredDefaults.get();
            if (!preferred) {
                return this.getBaseDefaults(group);
            }
            const profiles = (_a = preferred[group]) === null || _a === void 0 ? void 0 : _a.map(p => {
                var _a;
                return (_a = this.controllerProfiles.get(p.controllerId)) === null || _a === void 0 ? void 0 : _a.profiles.find(c => c.profileId === p.profileId && c.group === group);
            }).filter(types_1.isDefined);
            return (profiles === null || profiles === void 0 ? void 0 : profiles.length) ? profiles : this.getBaseDefaults(group);
        }
        /** @inheritdoc */
        setGroupDefaultProfiles(group, profiles) {
            this.preferredDefaults.store(Object.assign(Object.assign({}, this.preferredDefaults.get()), { [group]: profiles.map(c => ({ profileId: c.profileId, controllerId: c.controllerId })) }));
            this.changeEmitter.fire();
        }
        getBaseDefaults(group) {
            const defaults = [];
            for (const { profiles } of this.controllerProfiles.values()) {
                const profile = profiles.find(c => c.group === group);
                if (profile) {
                    defaults.push(profile);
                }
            }
            return defaults;
        }
        refreshContextKeys() {
            let allCapabilities = 0;
            for (const { profiles } of this.controllerProfiles.values()) {
                for (const profile of profiles) {
                    allCapabilities |= allCapabilities & profile.group ? 16 /* TestRunProfileBitset.HasNonDefaultProfile */ : profile.group;
                }
            }
            for (const group of testTypes_1.testRunProfileBitsetList) {
                this.capabilitiesContexts[group].set((allCapabilities & group) !== 0);
            }
        }
    };
    TestProfileService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, storage_1.IStorageService)
    ], TestProfileService);
    exports.TestProfileService = TestProfileService;
});
//# sourceMappingURL=testProfileService.js.map