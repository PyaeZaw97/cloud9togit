/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/instantiation/common/instantiation", "vs/platform/remote/common/remoteHosts"], function (require, exports, strings, instantiation_1, remoteHosts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IBuiltinExtensionsScannerService = exports.isResolverExtension = exports.isAuthenticationProviderExtension = exports.isLanguagePackExtension = exports.ExtensionIdentifier = exports.TargetPlatform = exports.ExtensionType = exports.EXTENSION_CATEGORIES = exports.isIExtensionIdentifier = exports.getWorkspaceSupportTypeMessage = exports.ALL_EXTENSION_KINDS = exports.UNDEFINED_PUBLISHER = exports.BUILTIN_MANIFEST_CACHE_FILE = exports.USER_MANIFEST_CACHE_FILE = exports.MANIFEST_CACHE_FOLDER = void 0;
    exports.MANIFEST_CACHE_FOLDER = 'CachedExtensions';
    exports.USER_MANIFEST_CACHE_FILE = 'user';
    exports.BUILTIN_MANIFEST_CACHE_FILE = 'builtin';
    exports.UNDEFINED_PUBLISHER = 'undefined_publisher';
    exports.ALL_EXTENSION_KINDS = ['ui', 'workspace', 'web'];
    function getWorkspaceSupportTypeMessage(supportType) {
        if (typeof supportType === 'object' && supportType !== null) {
            if (supportType.supported !== true) {
                return supportType.description;
            }
        }
        return undefined;
    }
    exports.getWorkspaceSupportTypeMessage = getWorkspaceSupportTypeMessage;
    function isIExtensionIdentifier(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.id === 'string'
            && (!thing.uuid || typeof thing.uuid === 'string');
    }
    exports.isIExtensionIdentifier = isIExtensionIdentifier;
    exports.EXTENSION_CATEGORIES = [
        'Azure',
        'Data Science',
        'Debuggers',
        'Extension Packs',
        'Education',
        'Formatters',
        'Keymaps',
        'Language Packs',
        'Linters',
        'Machine Learning',
        'Notebooks',
        'Programming Languages',
        'SCM Providers',
        'Snippets',
        'Testing',
        'Themes',
        'Visualization',
        'Other',
    ];
    var ExtensionType;
    (function (ExtensionType) {
        ExtensionType[ExtensionType["System"] = 0] = "System";
        ExtensionType[ExtensionType["User"] = 1] = "User";
    })(ExtensionType = exports.ExtensionType || (exports.ExtensionType = {}));
    var TargetPlatform;
    (function (TargetPlatform) {
        TargetPlatform["WIN32_X64"] = "win32-x64";
        TargetPlatform["WIN32_IA32"] = "win32-ia32";
        TargetPlatform["WIN32_ARM64"] = "win32-arm64";
        TargetPlatform["LINUX_X64"] = "linux-x64";
        TargetPlatform["LINUX_ARM64"] = "linux-arm64";
        TargetPlatform["LINUX_ARMHF"] = "linux-armhf";
        TargetPlatform["ALPINE_X64"] = "alpine-x64";
        TargetPlatform["ALPINE_ARM64"] = "alpine-arm64";
        TargetPlatform["DARWIN_X64"] = "darwin-x64";
        TargetPlatform["DARWIN_ARM64"] = "darwin-arm64";
        TargetPlatform["WEB"] = "web";
        TargetPlatform["UNIVERSAL"] = "universal";
        TargetPlatform["UNKNOWN"] = "unknown";
        TargetPlatform["UNDEFINED"] = "undefined";
    })(TargetPlatform = exports.TargetPlatform || (exports.TargetPlatform = {}));
    /**
     * **!Do not construct directly!**
     *
     * **!Only static methods because it gets serialized!**
     *
     * This represents the "canonical" version for an extension identifier. Extension ids
     * have to be case-insensitive (due to the marketplace), but we must ensure case
     * preservation because the extension API is already public at this time.
     *
     * For example, given an extension with the publisher `"Hello"` and the name `"World"`,
     * its canonical extension identifier is `"Hello.World"`. This extension could be
     * referenced in some other extension's dependencies using the string `"hello.world"`.
     *
     * To make matters more complicated, an extension can optionally have an UUID. When two
     * extensions have the same UUID, they are considered equal even if their identifier is different.
     */
    class ExtensionIdentifier {
        constructor(value) {
            this.value = value;
            this._lower = value.toLowerCase();
        }
        static equals(a, b) {
            if (typeof a === 'undefined' || a === null) {
                return (typeof b === 'undefined' || b === null);
            }
            if (typeof b === 'undefined' || b === null) {
                return false;
            }
            if (typeof a === 'string' || typeof b === 'string') {
                // At least one of the arguments is an extension id in string form,
                // so we have to use the string comparison which ignores case.
                let aValue = (typeof a === 'string' ? a : a.value);
                let bValue = (typeof b === 'string' ? b : b.value);
                return strings.equalsIgnoreCase(aValue, bValue);
            }
            // Now we know both arguments are ExtensionIdentifier
            return (a._lower === b._lower);
        }
        /**
         * Gives the value by which to index (for equality).
         */
        static toKey(id) {
            if (typeof id === 'string') {
                return id.toLowerCase();
            }
            return id._lower;
        }
    }
    exports.ExtensionIdentifier = ExtensionIdentifier;
    function isLanguagePackExtension(manifest) {
        return manifest.contributes && manifest.contributes.localizations ? manifest.contributes.localizations.length > 0 : false;
    }
    exports.isLanguagePackExtension = isLanguagePackExtension;
    function isAuthenticationProviderExtension(manifest) {
        return manifest.contributes && manifest.contributes.authentication ? manifest.contributes.authentication.length > 0 : false;
    }
    exports.isAuthenticationProviderExtension = isAuthenticationProviderExtension;
    function isResolverExtension(manifest, remoteAuthority) {
        var _a;
        if (remoteAuthority) {
            const activationEvent = `onResolveRemoteAuthority:${(0, remoteHosts_1.getRemoteName)(remoteAuthority)}`;
            return ((_a = manifest.activationEvents) === null || _a === void 0 ? void 0 : _a.indexOf(activationEvent)) !== -1;
        }
        return false;
    }
    exports.isResolverExtension = isResolverExtension;
    exports.IBuiltinExtensionsScannerService = (0, instantiation_1.createDecorator)('IBuiltinExtensionsScannerService');
});
//# sourceMappingURL=extensions.js.map