/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/uri", "vs/nls", "vs/platform/theme/common/themeService"], function (require, exports, codicons_1, uri_1, nls_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isUriComponents = exports.terminalIconsEqual = exports.terminalProfileArgsMatch = exports.createProfileSchemaEnums = void 0;
    function createProfileSchemaEnums(detectedProfiles, extensionProfiles) {
        const result = [{
                name: null,
                description: (0, nls_1.localize)('terminalAutomaticProfile', 'Automatically detect the default')
            }];
        result.push(...detectedProfiles.map(e => {
            return {
                name: e.profileName,
                description: createProfileDescription(e)
            };
        }));
        if (extensionProfiles) {
            result.push(...extensionProfiles.map(extensionProfile => {
                return {
                    name: extensionProfile.title,
                    description: createExtensionProfileDescription(extensionProfile)
                };
            }));
        }
        return {
            values: result.map(e => e.name),
            markdownDescriptions: result.map(e => e.description)
        };
    }
    exports.createProfileSchemaEnums = createProfileSchemaEnums;
    function createProfileDescription(profile) {
        let description = `$(${themeService_1.ThemeIcon.isThemeIcon(profile.icon) ? profile.icon.id : profile.icon ? profile.icon : codicons_1.Codicon.terminal.id}) ${profile.profileName}\n- path: ${profile.path}`;
        if (profile.args) {
            if (typeof profile.args === 'string') {
                description += `\n- args: "${profile.args}"`;
            }
            else {
                description += `\n- args: [${profile.args.length === 0 ? '' : `'${profile.args.join(`','`)}'`}]`;
            }
        }
        if (profile.overrideName !== undefined) {
            description += `\n- overrideName: ${profile.overrideName}`;
        }
        if (profile.color) {
            description += `\n- color: ${profile.color}`;
        }
        if (profile.env) {
            description += `\n- env: ${JSON.stringify(profile.env)}`;
        }
        return description;
    }
    function createExtensionProfileDescription(profile) {
        let description = `$(${themeService_1.ThemeIcon.isThemeIcon(profile.icon) ? profile.icon.id : profile.icon ? profile.icon : codicons_1.Codicon.terminal.id}) ${profile.title}\n- extensionIdenfifier: ${profile.extensionIdentifier}`;
        return description;
    }
    function terminalProfileArgsMatch(args1, args2) {
        if (!args1 && !args2) {
            return true;
        }
        else if (typeof args1 === 'string' && typeof args2 === 'string') {
            return args1 === args2;
        }
        else if (Array.isArray(args1) && Array.isArray(args2)) {
            if (args1.length !== args2.length) {
                return false;
            }
            for (let i = 0; i < args1.length; i++) {
                if (args1[i] !== args2[i]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    exports.terminalProfileArgsMatch = terminalProfileArgsMatch;
    function terminalIconsEqual(iconOne, iconTwo) {
        if (!iconOne && !iconTwo) {
            return true;
        }
        else if (!iconOne || !iconTwo) {
            return false;
        }
        if (themeService_1.ThemeIcon.isThemeIcon(iconOne) && themeService_1.ThemeIcon.isThemeIcon(iconTwo)) {
            return iconOne.id === iconTwo.id && iconOne.color === iconTwo.color;
        }
        if (typeof iconOne === 'object' && iconOne && 'light' in iconOne && 'dark' in iconOne
            && typeof iconTwo === 'object' && iconTwo && 'light' in iconTwo && 'dark' in iconTwo) {
            const castedIcon = iconOne;
            const castedIconTwo = iconTwo;
            if ((uri_1.URI.isUri(castedIcon.light) || isUriComponents(castedIcon.light)) && (uri_1.URI.isUri(castedIcon.dark) || isUriComponents(castedIcon.dark))
                && (uri_1.URI.isUri(castedIconTwo.light) || isUriComponents(castedIconTwo.light)) && (uri_1.URI.isUri(castedIconTwo.dark) || isUriComponents(castedIconTwo.dark))) {
                return castedIcon.light.path === castedIconTwo.light.path && castedIcon.dark.path === castedIconTwo.dark.path;
            }
        }
        if ((uri_1.URI.isUri(iconOne) && uri_1.URI.isUri(iconTwo)) || (isUriComponents(iconOne) || isUriComponents(iconTwo))) {
            const castedIcon = iconOne;
            const castedIconTwo = iconTwo;
            return castedIcon.path === castedIconTwo.path && castedIcon.scheme === castedIconTwo.scheme;
        }
        return false;
    }
    exports.terminalIconsEqual = terminalIconsEqual;
    function isUriComponents(thing) {
        if (!thing) {
            return false;
        }
        return typeof thing.path === 'string' &&
            typeof thing.scheme === 'string';
    }
    exports.isUriComponents = isUriComponents;
});
//# sourceMappingURL=terminalProfiles.js.map