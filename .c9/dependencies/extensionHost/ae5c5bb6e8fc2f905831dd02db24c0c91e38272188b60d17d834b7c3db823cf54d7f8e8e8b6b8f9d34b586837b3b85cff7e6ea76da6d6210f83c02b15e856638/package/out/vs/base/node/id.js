/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/errors", "vs/base/common/map", "vs/base/common/uuid", "vs/base/node/macAddress"], function (require, exports, os_1, errors, map_1, uuid, macAddress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getMachineId = exports.virtualMachineHint = void 0;
    // http://www.techrepublic.com/blog/data-center/mac-address-scorecard-for-common-virtual-machine-platforms/
    // VMware ESX 3, Server, Workstation, Player	00-50-56, 00-0C-29, 00-05-69
    // Microsoft Hyper-V, Virtual Server, Virtual PC	00-03-FF
    // Parallels Desktop, Workstation, Server, Virtuozzo	00-1C-42
    // Virtual Iron 4	00-0F-4B
    // Red Hat Xen	00-16-3E
    // Oracle VM	00-16-3E
    // XenSource	00-16-3E
    // Novell Xen	00-16-3E
    // Sun xVM VirtualBox	08-00-27
    exports.virtualMachineHint = new class {
        _isVirtualMachineMacAddress(mac) {
            if (!this._virtualMachineOUIs) {
                this._virtualMachineOUIs = map_1.TernarySearchTree.forStrings();
                // dash-separated
                this._virtualMachineOUIs.set('00-50-56', true);
                this._virtualMachineOUIs.set('00-0C-29', true);
                this._virtualMachineOUIs.set('00-05-69', true);
                this._virtualMachineOUIs.set('00-03-FF', true);
                this._virtualMachineOUIs.set('00-1C-42', true);
                this._virtualMachineOUIs.set('00-16-3E', true);
                this._virtualMachineOUIs.set('08-00-27', true);
                // colon-separated
                this._virtualMachineOUIs.set('00:50:56', true);
                this._virtualMachineOUIs.set('00:0C:29', true);
                this._virtualMachineOUIs.set('00:05:69', true);
                this._virtualMachineOUIs.set('00:03:FF', true);
                this._virtualMachineOUIs.set('00:1C:42', true);
                this._virtualMachineOUIs.set('00:16:3E', true);
                this._virtualMachineOUIs.set('08:00:27', true);
            }
            return !!this._virtualMachineOUIs.findSubstr(mac);
        }
        value() {
            if (this._value === undefined) {
                let vmOui = 0;
                let interfaceCount = 0;
                const interfaces = (0, os_1.networkInterfaces)();
                for (let name in interfaces) {
                    const networkInterface = interfaces[name];
                    if (networkInterface) {
                        for (const { mac, internal } of networkInterface) {
                            if (!internal) {
                                interfaceCount += 1;
                                if (this._isVirtualMachineMacAddress(mac.toUpperCase())) {
                                    vmOui += 1;
                                }
                            }
                        }
                    }
                }
                this._value = interfaceCount > 0
                    ? vmOui / interfaceCount
                    : 0;
            }
            return this._value;
        }
    };
    let machineId;
    async function getMachineId() {
        if (!machineId) {
            machineId = (async () => {
                const id = await getMacMachineId();
                return id || uuid.generateUuid(); // fallback, generate a UUID
            })();
        }
        return machineId;
    }
    exports.getMachineId = getMachineId;
    async function getMacMachineId() {
        try {
            const crypto = await new Promise((resolve_1, reject_1) => { require(['crypto'], resolve_1, reject_1); });
            const macAddress = (0, macAddress_1.getMac)();
            return crypto.createHash('sha256').update(macAddress, 'utf8').digest('hex');
        }
        catch (err) {
            errors.onUnexpectedError(err);
            return undefined;
        }
    }
});
//# sourceMappingURL=id.js.map