/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, event_1, uri_1, instantiation_1, extensions_1, extensionManagementUtil_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullExtensionService = exports.toExtensionDescription = exports.toExtension = exports.ActivationKind = exports.ExtensionHostLogFileName = exports.ExtensionPointContribution = exports.ActivationTimes = exports.checkProposedApiEnabled = exports.isProposedApiEnabled = exports.extensionIdentifiersArrayToSet = exports.ExtensionIdentifierSet = exports.ExtensionHostExtensions = exports.extensionHostKindToString = exports.ExtensionHostKind = exports.MissingExtensionDependency = exports.RemoteRunningLocation = exports.LocalWebWorkerRunningLocation = exports.LocalProcessRunningLocation = exports.IExtensionService = exports.webWorkerExtHostConfig = exports.nullExtensionDescription = void 0;
    exports.nullExtensionDescription = Object.freeze({
        identifier: new extensions_1.ExtensionIdentifier('nullExtensionDescription'),
        name: 'Null Extension Description',
        version: '0.0.0',
        publisher: 'vscode',
        engines: { vscode: '' },
        extensionLocation: uri_1.URI.parse('void:location'),
        isBuiltin: false,
        targetPlatform: "undefined" /* TargetPlatform.UNDEFINED */,
        isUserBuiltin: false,
        isUnderDevelopment: false,
    });
    exports.webWorkerExtHostConfig = 'extensions.webWorker';
    exports.IExtensionService = (0, instantiation_1.createDecorator)('extensionService');
    class LocalProcessRunningLocation {
        constructor(affinity) {
            this.affinity = affinity;
            this.kind = 1 /* ExtensionHostKind.LocalProcess */;
        }
        equals(other) {
            return (this.kind === other.kind && this.affinity === other.affinity);
        }
        asString() {
            if (this.affinity === 0) {
                return 'LocalProcess';
            }
            return `LocalProcess${this.affinity}`;
        }
    }
    exports.LocalProcessRunningLocation = LocalProcessRunningLocation;
    class LocalWebWorkerRunningLocation {
        constructor() {
            this.kind = 2 /* ExtensionHostKind.LocalWebWorker */;
            this.affinity = 0;
        }
        equals(other) {
            return (this.kind === other.kind);
        }
        asString() {
            return 'LocalWebWorker';
        }
    }
    exports.LocalWebWorkerRunningLocation = LocalWebWorkerRunningLocation;
    class RemoteRunningLocation {
        constructor() {
            this.kind = 3 /* ExtensionHostKind.Remote */;
            this.affinity = 0;
        }
        equals(other) {
            return (this.kind === other.kind);
        }
        asString() {
            return 'Remote';
        }
    }
    exports.RemoteRunningLocation = RemoteRunningLocation;
    class MissingExtensionDependency {
        constructor(dependency) {
            this.dependency = dependency;
        }
    }
    exports.MissingExtensionDependency = MissingExtensionDependency;
    var ExtensionHostKind;
    (function (ExtensionHostKind) {
        ExtensionHostKind[ExtensionHostKind["LocalProcess"] = 1] = "LocalProcess";
        ExtensionHostKind[ExtensionHostKind["LocalWebWorker"] = 2] = "LocalWebWorker";
        ExtensionHostKind[ExtensionHostKind["Remote"] = 3] = "Remote";
    })(ExtensionHostKind = exports.ExtensionHostKind || (exports.ExtensionHostKind = {}));
    function extensionHostKindToString(kind) {
        if (kind === null) {
            return 'None';
        }
        switch (kind) {
            case 1 /* ExtensionHostKind.LocalProcess */: return 'LocalProcess';
            case 2 /* ExtensionHostKind.LocalWebWorker */: return 'LocalWebWorker';
            case 3 /* ExtensionHostKind.Remote */: return 'Remote';
        }
    }
    exports.extensionHostKindToString = extensionHostKindToString;
    class ExtensionHostExtensions {
        constructor() {
            this._allExtensions = [];
            this._myExtensions = [];
        }
        toDelta() {
            return {
                toRemove: [],
                toAdd: this._allExtensions,
                myToRemove: [],
                myToAdd: this._myExtensions
            };
        }
        set(allExtensions, myExtensions) {
            const toRemove = [];
            const toAdd = [];
            const myToRemove = [];
            const myToAdd = [];
            const oldExtensionsMap = extensionDescriptionArrayToMap(this._allExtensions);
            const newExtensionsMap = extensionDescriptionArrayToMap(allExtensions);
            const extensionsAreTheSame = (a, b) => {
                return ((a.extensionLocation.toString() === b.extensionLocation.toString())
                    || (a.isBuiltin === b.isBuiltin)
                    || (a.isUserBuiltin === b.isUserBuiltin)
                    || (a.isUnderDevelopment === b.isUnderDevelopment));
            };
            for (const oldExtension of this._allExtensions) {
                const newExtension = newExtensionsMap.get(extensions_1.ExtensionIdentifier.toKey(oldExtension.identifier));
                if (!newExtension) {
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(extensions_1.ExtensionIdentifier.toKey(oldExtension.identifier));
                    continue;
                }
                if (!extensionsAreTheSame(oldExtension, newExtension)) {
                    // The new extension is different than the old one
                    // (e.g. maybe it executes in a different location)
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(extensions_1.ExtensionIdentifier.toKey(oldExtension.identifier));
                    continue;
                }
            }
            for (const newExtension of allExtensions) {
                const oldExtension = oldExtensionsMap.get(extensions_1.ExtensionIdentifier.toKey(newExtension.identifier));
                if (!oldExtension) {
                    toAdd.push(newExtension);
                    continue;
                }
                if (!extensionsAreTheSame(oldExtension, newExtension)) {
                    // The new extension is different than the old one
                    // (e.g. maybe it executes in a different location)
                    toRemove.push(oldExtension.identifier);
                    oldExtensionsMap.delete(extensions_1.ExtensionIdentifier.toKey(oldExtension.identifier));
                    continue;
                }
            }
            const myOldExtensionsSet = extensionIdentifiersArrayToSet(this._myExtensions);
            const myNewExtensionsSet = extensionIdentifiersArrayToSet(myExtensions);
            for (const oldExtensionId of this._myExtensions) {
                if (!myNewExtensionsSet.has(extensions_1.ExtensionIdentifier.toKey(oldExtensionId))) {
                    myToRemove.push(oldExtensionId);
                }
            }
            for (const newExtensionId of myExtensions) {
                if (!myOldExtensionsSet.has(extensions_1.ExtensionIdentifier.toKey(newExtensionId))) {
                    myToAdd.push(newExtensionId);
                }
            }
            const delta = { toRemove, toAdd, myToRemove, myToAdd };
            this.delta(delta);
            return delta;
        }
        delta(extensionsDelta) {
            const { toRemove, toAdd, myToRemove, myToAdd } = extensionsDelta;
            // First handle removals
            const toRemoveSet = extensionIdentifiersArrayToSet(toRemove);
            const myToRemoveSet = extensionIdentifiersArrayToSet(myToRemove);
            for (let i = 0; i < this._allExtensions.length; i++) {
                if (toRemoveSet.has(extensions_1.ExtensionIdentifier.toKey(this._allExtensions[i].identifier))) {
                    this._allExtensions.splice(i, 1);
                    i--;
                }
            }
            for (let i = 0; i < this._myExtensions.length; i++) {
                if (myToRemoveSet.has(extensions_1.ExtensionIdentifier.toKey(this._myExtensions[i]))) {
                    this._myExtensions.splice(i, 1);
                    i--;
                }
            }
            // Then handle additions
            for (const extension of toAdd) {
                this._allExtensions.push(extension);
            }
            for (const extensionId of myToAdd) {
                this._myExtensions.push(extensionId);
            }
        }
        containsExtension(extensionId) {
            for (const myExtensionId of this._myExtensions) {
                if (extensions_1.ExtensionIdentifier.equals(myExtensionId, extensionId)) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.ExtensionHostExtensions = ExtensionHostExtensions;
    class ExtensionIdentifierSet {
        constructor(values) {
            this[_a] = 'ExtensionIdentifierSet';
            this._map = new Map();
            this._toKey = extensions_1.ExtensionIdentifier.toKey;
            if (values) {
                for (const value of values) {
                    this.add(value);
                }
            }
        }
        get size() {
            return this._map.size;
        }
        add(value) {
            this._map.set(this._toKey(value), value);
            return this;
        }
        clear() {
            this._map.clear();
        }
        delete(value) {
            return this._map.delete(this._toKey(value));
        }
        has(value) {
            return this._map.has(this._toKey(value));
        }
        forEach(callbackfn, thisArg) {
            this._map.forEach(value => callbackfn.call(thisArg, value, value, this));
        }
        *entries() {
            for (let [_key, value] of this._map) {
                yield [value, value];
            }
        }
        keys() {
            return this._map.values();
        }
        values() {
            return this._map.values();
        }
        [(_a = Symbol.toStringTag, Symbol.iterator)]() {
            return this._map.values();
        }
    }
    exports.ExtensionIdentifierSet = ExtensionIdentifierSet;
    function extensionIdentifiersArrayToSet(extensionIds) {
        const result = new Set();
        for (const extensionId of extensionIds) {
            result.add(extensions_1.ExtensionIdentifier.toKey(extensionId));
        }
        return result;
    }
    exports.extensionIdentifiersArrayToSet = extensionIdentifiersArrayToSet;
    function extensionDescriptionArrayToMap(extensions) {
        const result = new Map();
        for (const extension of extensions) {
            result.set(extensions_1.ExtensionIdentifier.toKey(extension.identifier), extension);
        }
        return result;
    }
    function isProposedApiEnabled(extension, proposal) {
        if (!extension.enabledApiProposals) {
            return false;
        }
        return extension.enabledApiProposals.includes(proposal);
    }
    exports.isProposedApiEnabled = isProposedApiEnabled;
    function checkProposedApiEnabled(extension, proposal) {
        var _b, _c;
        if (!isProposedApiEnabled(extension, proposal)) {
            throw new Error(`Extension '${extension.identifier.value}' CANNOT use API proposal: ${proposal}.\nIts package.json#enabledApiProposals-property declares: ${(_c = (_b = extension.enabledApiProposals) === null || _b === void 0 ? void 0 : _b.join(', ')) !== null && _c !== void 0 ? _c : '[]'} but NOT ${proposal}.\n The missing proposal MUST be added and you must start in extension development mode or use the following command line switch: --enable-proposed-api ${extension.identifier.value}`);
        }
    }
    exports.checkProposedApiEnabled = checkProposedApiEnabled;
    class ActivationTimes {
        constructor(codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) {
            this.codeLoadingTime = codeLoadingTime;
            this.activateCallTime = activateCallTime;
            this.activateResolvedTime = activateResolvedTime;
            this.activationReason = activationReason;
        }
    }
    exports.ActivationTimes = ActivationTimes;
    class ExtensionPointContribution {
        constructor(description, value) {
            this.description = description;
            this.value = value;
        }
    }
    exports.ExtensionPointContribution = ExtensionPointContribution;
    exports.ExtensionHostLogFileName = 'exthost';
    var ActivationKind;
    (function (ActivationKind) {
        ActivationKind[ActivationKind["Normal"] = 0] = "Normal";
        ActivationKind[ActivationKind["Immediate"] = 1] = "Immediate";
    })(ActivationKind = exports.ActivationKind || (exports.ActivationKind = {}));
    function toExtension(extensionDescription) {
        return {
            type: extensionDescription.isBuiltin ? 0 /* ExtensionType.System */ : 1 /* ExtensionType.User */,
            isBuiltin: extensionDescription.isBuiltin || extensionDescription.isUserBuiltin,
            identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(extensionDescription.publisher, extensionDescription.name), uuid: extensionDescription.uuid },
            manifest: extensionDescription,
            location: extensionDescription.extensionLocation,
            targetPlatform: extensionDescription.targetPlatform,
            validations: [],
            isValid: true
        };
    }
    exports.toExtension = toExtension;
    function toExtensionDescription(extension, isUnderDevelopment) {
        return Object.assign(Object.assign({ identifier: new extensions_1.ExtensionIdentifier((0, extensionManagementUtil_1.getExtensionId)(extension.manifest.publisher, extension.manifest.name)), isBuiltin: extension.type === 0 /* ExtensionType.System */, isUserBuiltin: extension.type === 1 /* ExtensionType.User */ && extension.isBuiltin, isUnderDevelopment: !!isUnderDevelopment, extensionLocation: extension.location }, extension.manifest), { uuid: extension.identifier.uuid, targetPlatform: extension.targetPlatform });
    }
    exports.toExtensionDescription = toExtensionDescription;
    class NullExtensionService {
        constructor() {
            this.onDidRegisterExtensions = event_1.Event.None;
            this.onDidChangeExtensionsStatus = event_1.Event.None;
            this.onDidChangeExtensions = event_1.Event.None;
            this.onWillActivateByEvent = event_1.Event.None;
            this.onDidChangeResponsiveChange = event_1.Event.None;
        }
        activateByEvent(_activationEvent) { return Promise.resolve(undefined); }
        activationEventIsDone(_activationEvent) { return false; }
        whenInstalledExtensionsRegistered() { return Promise.resolve(true); }
        getExtensions() { return Promise.resolve([]); }
        getExtension() { return Promise.resolve(undefined); }
        readExtensionPointContributions(_extPoint) { return Promise.resolve(Object.create(null)); }
        getExtensionsStatus() { return Object.create(null); }
        getInspectPort(_extensionHostId, _tryEnableInspector) { return Promise.resolve(0); }
        getInspectPorts(_extensionHostKind, _tryEnableInspector) { return Promise.resolve([]); }
        stopExtensionHosts() { }
        async restartExtensionHost() { }
        async startExtensionHosts() { }
        async setRemoteEnvironment(_env) { }
        canAddExtension() { return false; }
        canRemoveExtension() { return false; }
        _activateById(_extensionId, _reason) { return Promise.resolve(); }
    }
    exports.NullExtensionService = NullExtensionService;
});
//# sourceMappingURL=extensions.js.map