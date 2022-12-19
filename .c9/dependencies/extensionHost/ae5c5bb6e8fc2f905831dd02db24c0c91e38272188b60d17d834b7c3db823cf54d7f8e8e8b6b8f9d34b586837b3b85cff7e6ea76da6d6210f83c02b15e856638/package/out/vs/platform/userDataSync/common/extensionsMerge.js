/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/semver/semver", "vs/base/common/types"], function (require, exports, objects_1, semver, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    function merge(localExtensions, remoteExtensions, lastSyncExtensions, skippedExtensions, ignoredExtensions) {
        var _a, _b;
        const added = [];
        const removed = [];
        const updated = [];
        if (!remoteExtensions) {
            const remote = localExtensions.filter(({ identifier }) => ignoredExtensions.every(id => id.toLowerCase() !== identifier.id.toLowerCase()));
            return {
                local: {
                    added,
                    removed,
                    updated,
                },
                remote: remote.length > 0 ? {
                    added: remote,
                    updated: [],
                    removed: [],
                    all: remote
                } : null
            };
        }
        localExtensions = localExtensions.map(massageIncomingExtension);
        remoteExtensions = remoteExtensions.map(massageIncomingExtension);
        lastSyncExtensions = lastSyncExtensions ? lastSyncExtensions.map(massageIncomingExtension) : null;
        const uuids = new Map();
        const addUUID = (identifier) => { if (identifier.uuid) {
            uuids.set(identifier.id.toLowerCase(), identifier.uuid);
        } };
        localExtensions.forEach(({ identifier }) => addUUID(identifier));
        remoteExtensions.forEach(({ identifier }) => addUUID(identifier));
        if (lastSyncExtensions) {
            lastSyncExtensions.forEach(({ identifier }) => addUUID(identifier));
        }
        const getKey = (extension) => {
            const uuid = extension.identifier.uuid || uuids.get(extension.identifier.id.toLowerCase());
            return uuid ? `uuid:${uuid}` : `id:${extension.identifier.id.toLowerCase()}`;
        };
        const addExtensionToMap = (map, extension) => {
            map.set(getKey(extension), extension);
            return map;
        };
        const localExtensionsMap = localExtensions.reduce(addExtensionToMap, new Map());
        const remoteExtensionsMap = remoteExtensions.reduce(addExtensionToMap, new Map());
        const newRemoteExtensionsMap = remoteExtensions.reduce((map, extension) => {
            const key = getKey(extension);
            extension = (0, objects_1.deepClone)(extension);
            const localExtension = localExtensionsMap.get(key);
            if (localExtension) {
                if (localExtension.installed) {
                    extension.installed = true;
                }
                if (!extension.version) {
                    extension.version = localExtension.version;
                }
            }
            return addExtensionToMap(map, extension);
        }, new Map());
        const lastSyncExtensionsMap = lastSyncExtensions ? lastSyncExtensions.reduce(addExtensionToMap, new Map()) : null;
        const skippedExtensionsMap = skippedExtensions.reduce(addExtensionToMap, new Map());
        const ignoredExtensionsSet = ignoredExtensions.reduce((set, id) => {
            const uuid = uuids.get(id.toLowerCase());
            return set.add(uuid ? `uuid:${uuid}` : `id:${id.toLowerCase()}`);
        }, new Set());
        const localToRemote = compare(localExtensionsMap, remoteExtensionsMap, ignoredExtensionsSet);
        if (localToRemote.added.size > 0 || localToRemote.removed.size > 0 || localToRemote.updated.size > 0) {
            const baseToLocal = compare(lastSyncExtensionsMap, localExtensionsMap, ignoredExtensionsSet);
            const baseToRemote = compare(lastSyncExtensionsMap, remoteExtensionsMap, ignoredExtensionsSet);
            const merge = (key, updatedInRemote) => {
                const localExtension = localExtensionsMap.get(key);
                if (localExtension) {
                    const remoteExtension = remoteExtensionsMap.get(key);
                    const mergedExtension = updatedInRemote ? remoteExtension : localExtension;
                    return Object.assign(Object.assign({}, mergedExtension), { version: remoteExtension.version && (!localExtension.installed || semver.gt(remoteExtension.version, localExtension.version)) ? remoteExtension.version : localExtension.version, state: mergeExtensionState(localExtension, remoteExtension, lastSyncExtensionsMap === null || lastSyncExtensionsMap === void 0 ? void 0 : lastSyncExtensionsMap.get(key)), preRelease: (0, types_1.isUndefined)(mergedExtension.preRelease) /* from older client*/ ? localExtension.preRelease
                            : (localExtension.installed ? mergedExtension.preRelease : remoteExtension.preRelease) });
                }
                return undefined;
            };
            // Remotely removed extension.
            for (const key of baseToRemote.removed.values()) {
                const e = localExtensionsMap.get(key);
                if (e) {
                    removed.push(e.identifier);
                }
            }
            // Remotely added extension
            for (const key of baseToRemote.added.values()) {
                // Got added in local
                if (baseToLocal.added.has(key)) {
                    // Is different from local to remote
                    if (localToRemote.updated.has(key)) {
                        const mergedExtension = merge(key, true);
                        if (mergedExtension) {
                            updated.push(massageOutgoingExtension(mergedExtension, key));
                            newRemoteExtensionsMap.set(key, mergedExtension);
                        }
                    }
                }
                else {
                    // Add only installed extension to local
                    const remoteExtension = remoteExtensionsMap.get(key);
                    if (remoteExtension.installed) {
                        added.push(massageOutgoingExtension(remoteExtension, key));
                    }
                }
            }
            // Remotely updated extensions
            for (const key of baseToRemote.updated.values()) {
                // Update in local always
                const mergedExtension = merge(key, true);
                if (mergedExtension) {
                    updated.push(massageOutgoingExtension(mergedExtension, key));
                    newRemoteExtensionsMap.set(key, mergedExtension);
                }
            }
            // Locally added extensions
            for (const key of baseToLocal.added.values()) {
                // Not there in remote
                if (!baseToRemote.added.has(key)) {
                    newRemoteExtensionsMap.set(key, localExtensionsMap.get(key));
                }
            }
            // Locally updated extensions
            for (const key of baseToLocal.updated.values()) {
                // If removed in remote
                if (baseToRemote.removed.has(key)) {
                    continue;
                }
                // If not updated in remote
                if (!baseToRemote.updated.has(key)) {
                    const mergedExtension = merge(key, false);
                    if (mergedExtension) {
                        // Retain installed property
                        if ((_a = newRemoteExtensionsMap.get(key)) === null || _a === void 0 ? void 0 : _a.installed) {
                            mergedExtension.installed = true;
                        }
                        newRemoteExtensionsMap.set(key, mergedExtension);
                    }
                }
            }
            // Locally removed extensions
            for (const key of baseToLocal.removed.values()) {
                // If not skipped and not updated in remote
                if (!skippedExtensionsMap.has(key) && !baseToRemote.updated.has(key)) {
                    // Remove only if it is an installed extension
                    if ((_b = lastSyncExtensionsMap === null || lastSyncExtensionsMap === void 0 ? void 0 : lastSyncExtensionsMap.get(key)) === null || _b === void 0 ? void 0 : _b.installed) {
                        newRemoteExtensionsMap.delete(key);
                    }
                }
            }
        }
        const remote = [];
        const remoteChanges = compare(remoteExtensionsMap, newRemoteExtensionsMap, new Set(), { checkInstalledProperty: true, checkVersionProperty: true });
        if (remoteChanges.added.size > 0 || remoteChanges.updated.size > 0 || remoteChanges.removed.size > 0) {
            newRemoteExtensionsMap.forEach((value, key) => remote.push(massageOutgoingExtension(value, key)));
        }
        return {
            local: { added, removed, updated },
            remote: remote.length ? {
                added: [...remoteChanges.added].map(id => newRemoteExtensionsMap.get(id)),
                updated: [...remoteChanges.updated].map(id => newRemoteExtensionsMap.get(id)),
                removed: [...remoteChanges.removed].map(id => remoteExtensionsMap.get(id)),
                all: remote
            } : null
        };
    }
    exports.merge = merge;
    function compare(from, to, ignoredExtensions, { checkInstalledProperty, checkVersionProperty } = { checkInstalledProperty: false, checkVersionProperty: false }) {
        const fromKeys = from ? [...from.keys()].filter(key => !ignoredExtensions.has(key)) : [];
        const toKeys = [...to.keys()].filter(key => !ignoredExtensions.has(key));
        const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const fromExtension = from.get(key);
            const toExtension = to.get(key);
            if (!toExtension
                || fromExtension.disabled !== toExtension.disabled
                || (fromExtension.installed && toExtension.installed && fromExtension.preRelease !== toExtension.preRelease)
                || !isSameExtensionState(fromExtension.state, toExtension.state)
                || (checkVersionProperty && fromExtension.version !== toExtension.version)
                || (checkInstalledProperty && fromExtension.installed !== toExtension.installed)) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
    function mergeExtensionState(localExtension, remoteExtension, lastSyncExtension) {
        const localState = localExtension.state;
        const remoteState = remoteExtension.state;
        const baseState = lastSyncExtension === null || lastSyncExtension === void 0 ? void 0 : lastSyncExtension.state;
        // If remote extension has no version, use local state
        if (!remoteExtension.version) {
            return localState;
        }
        // If local state exists and local extension is latest then use local state
        if (localState && semver.gt(localExtension.version, remoteExtension.version)) {
            return localState;
        }
        // If remote state exists and remote extension is latest, use remote state
        if (remoteState && semver.gt(remoteExtension.version, localExtension.version)) {
            return remoteState;
        }
        /* Remote and local are on same version */
        // If local state is not yet set, use remote state
        if (!localState) {
            return remoteState;
        }
        // If remote state is not yet set, use local state
        if (!remoteState) {
            return localState;
        }
        const mergedState = (0, objects_1.deepClone)(localState);
        const baseToRemote = baseState ? compareExtensionState(baseState, remoteState) : { added: Object.keys(remoteState).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        const baseToLocal = baseState ? compareExtensionState(baseState, localState) : { added: Object.keys(localState).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
        // Added/Updated in remote
        for (const key of [...baseToRemote.added.values(), ...baseToRemote.updated.values()]) {
            mergedState[key] = remoteState[key];
        }
        // Removed in remote
        for (const key of baseToRemote.removed.values()) {
            // Not updated in local
            if (!baseToLocal.updated.has(key)) {
                delete mergedState[key];
            }
        }
        return mergedState;
    }
    function compareExtensionState(from, to) {
        const fromKeys = Object.keys(from);
        const toKeys = Object.keys(to);
        const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
        const updated = new Set();
        for (const key of fromKeys) {
            if (removed.has(key)) {
                continue;
            }
            const value1 = from[key];
            const value2 = to[key];
            if (!(0, objects_1.equals)(value1, value2)) {
                updated.add(key);
            }
        }
        return { added, removed, updated };
    }
    function isSameExtensionState(a = {}, b = {}) {
        const { added, removed, updated } = compareExtensionState(a, b);
        return added.size === 0 && removed.size === 0 && updated.size === 0;
    }
    // massage incoming extension - add optional properties
    function massageIncomingExtension(extension) {
        return Object.assign(Object.assign({}, extension), { disabled: !!extension.disabled, installed: !!extension.installed });
    }
    // massage outgoing extension - remove optional properties
    function massageOutgoingExtension(extension, key) {
        const massagedExtension = {
            identifier: {
                id: extension.identifier.id,
                uuid: key.startsWith('uuid:') ? key.substring('uuid:'.length) : undefined
            },
            preRelease: !!extension.preRelease /* set it always so that to differentiate with older clients */
        };
        if (extension.version) {
            massagedExtension.version = extension.version;
        }
        if (extension.disabled) {
            massagedExtension.disabled = true;
        }
        if (extension.installed) {
            massagedExtension.installed = true;
        }
        if (extension.state) {
            massagedExtension.state = extension.state;
        }
        return massagedExtension;
    }
});
//# sourceMappingURL=extensionsMerge.js.map