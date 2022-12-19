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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, event_1, lifecycle_1, platform_1, strings_1, nls_1, environment_1, files_1, instantiation_1, productService_1, serviceMachineId_1, storage_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncMachinesService = exports.isWebPlatform = exports.IUserDataSyncMachinesService = void 0;
    exports.IUserDataSyncMachinesService = (0, instantiation_1.createDecorator)('IUserDataSyncMachinesService');
    const currentMachineNameKey = 'sync.currentMachineName';
    const Safari = 'Safari';
    const Chrome = 'Chrome';
    const Edge = 'Edge';
    const Firefox = 'Firefox';
    const Android = 'Android';
    function isWebPlatform(platform) {
        switch (platform) {
            case Safari:
            case Chrome:
            case Edge:
            case Firefox:
            case Android:
            case (0, platform_1.PlatformToString)(0 /* Platform.Web */):
                return true;
        }
        return false;
    }
    exports.isWebPlatform = isWebPlatform;
    function getPlatformName() {
        if (platform_1.isSafari) {
            return Safari;
        }
        if (platform_1.isChrome) {
            return Chrome;
        }
        if (platform_1.isEdge) {
            return Edge;
        }
        if (platform_1.isFirefox) {
            return Firefox;
        }
        if (platform_1.isAndroid) {
            return Android;
        }
        return (0, platform_1.PlatformToString)(platform_1.isWeb ? 0 /* Platform.Web */ : platform_1.platform);
    }
    let UserDataSyncMachinesService = class UserDataSyncMachinesService extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, storageService, userDataSyncStoreService, logService, productService) {
            super();
            this.storageService = storageService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.logService = logService;
            this.productService = productService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.userData = null;
            this.currentMachineIdPromise = (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService);
        }
        async getMachines(manifest) {
            const currentMachineId = await this.currentMachineIdPromise;
            const machineData = await this.readMachinesData(manifest);
            return machineData.machines.map(machine => (Object.assign(Object.assign({}, machine), { isCurrent: machine.id === currentMachineId })));
        }
        async addCurrentMachine(manifest) {
            const currentMachineId = await this.currentMachineIdPromise;
            const machineData = await this.readMachinesData(manifest);
            if (!machineData.machines.some(({ id }) => id === currentMachineId)) {
                machineData.machines.push({ id: currentMachineId, name: this.computeCurrentMachineName(machineData.machines), platform: getPlatformName() });
                await this.writeMachinesData(machineData);
            }
        }
        async removeCurrentMachine(manifest) {
            const currentMachineId = await this.currentMachineIdPromise;
            const machineData = await this.readMachinesData(manifest);
            const updatedMachines = machineData.machines.filter(({ id }) => id !== currentMachineId);
            if (updatedMachines.length !== machineData.machines.length) {
                machineData.machines = updatedMachines;
                await this.writeMachinesData(machineData);
            }
        }
        async renameMachine(machineId, name, manifest) {
            const machineData = await this.readMachinesData(manifest);
            const machine = machineData.machines.find(({ id }) => id === machineId);
            if (machine) {
                machine.name = name;
                await this.writeMachinesData(machineData);
                const currentMachineId = await this.currentMachineIdPromise;
                if (machineId === currentMachineId) {
                    this.storageService.store(currentMachineNameKey, name, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                }
            }
        }
        async setEnablements(enablements) {
            const machineData = await this.readMachinesData();
            for (const [machineId, enabled] of enablements) {
                const machine = machineData.machines.find(machine => machine.id === machineId);
                if (machine) {
                    machine.disabled = enabled ? undefined : true;
                }
            }
            await this.writeMachinesData(machineData);
        }
        computeCurrentMachineName(machines) {
            const previousName = this.storageService.get(currentMachineNameKey, 0 /* StorageScope.GLOBAL */);
            if (previousName) {
                return previousName;
            }
            const namePrefix = `${this.productService.embedderIdentifier ? `${this.productService.embedderIdentifier} - ` : ''}${getPlatformName()} (${this.productService.nameShort})`;
            const nameRegEx = new RegExp(`${(0, strings_1.escapeRegExpCharacters)(namePrefix)}\\s#(\\d+)`);
            let nameIndex = 0;
            for (const machine of machines) {
                const matches = nameRegEx.exec(machine.name);
                const index = matches ? parseInt(matches[1]) : 0;
                nameIndex = index > nameIndex ? index : nameIndex;
            }
            return `${namePrefix} #${nameIndex + 1}`;
        }
        async readMachinesData(manifest) {
            this.userData = await this.readUserData(manifest);
            const machinesData = this.parse(this.userData);
            if (machinesData.version !== UserDataSyncMachinesService.VERSION) {
                throw new Error((0, nls_1.localize)('error incompatible', "Cannot read machines data as the current version is incompatible. Please update {0} and try again.", this.productService.nameLong));
            }
            return machinesData;
        }
        async writeMachinesData(machinesData) {
            var _a;
            const content = JSON.stringify(machinesData);
            const ref = await this.userDataSyncStoreService.write(UserDataSyncMachinesService.RESOURCE, content, ((_a = this.userData) === null || _a === void 0 ? void 0 : _a.ref) || null);
            this.userData = { ref, content };
            this._onDidChange.fire();
        }
        async readUserData(manifest) {
            if (this.userData) {
                const latestRef = manifest && manifest.latest ? manifest.latest[UserDataSyncMachinesService.RESOURCE] : undefined;
                // Last time synced resource and latest resource on server are same
                if (this.userData.ref === latestRef) {
                    return this.userData;
                }
                // There is no resource on server and last time it was synced with no resource
                if (latestRef === undefined && this.userData.content === null) {
                    return this.userData;
                }
            }
            return this.userDataSyncStoreService.read(UserDataSyncMachinesService.RESOURCE, this.userData);
        }
        parse(userData) {
            if (userData.content !== null) {
                try {
                    return JSON.parse(userData.content);
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            return {
                version: UserDataSyncMachinesService.VERSION,
                machines: []
            };
        }
    };
    UserDataSyncMachinesService.VERSION = 1;
    UserDataSyncMachinesService.RESOURCE = 'machines';
    UserDataSyncMachinesService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, storage_1.IStorageService),
        __param(3, userDataSync_1.IUserDataSyncStoreService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, productService_1.IProductService)
    ], UserDataSyncMachinesService);
    exports.UserDataSyncMachinesService = UserDataSyncMachinesService;
});
//# sourceMappingURL=userDataSyncMachines.js.map