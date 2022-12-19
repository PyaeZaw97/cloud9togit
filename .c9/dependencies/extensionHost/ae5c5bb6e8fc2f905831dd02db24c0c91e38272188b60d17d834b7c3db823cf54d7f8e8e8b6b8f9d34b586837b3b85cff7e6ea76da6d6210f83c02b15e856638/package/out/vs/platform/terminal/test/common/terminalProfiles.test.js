/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/codicons", "vs/platform/terminal/common/terminalProfiles"], function (require, exports, assert_1, codicons_1, terminalProfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('terminalProfiles', () => {
        suite('createProfileSchemaEnums', () => {
            test('should return an empty array when there are no profiles', () => {
                (0, assert_1.deepStrictEqual)((0, terminalProfiles_1.createProfileSchemaEnums)([]), {
                    values: [
                        null
                    ],
                    markdownDescriptions: [
                        'Automatically detect the default'
                    ]
                });
            });
            test('should return a single entry when there is one profile', () => {
                const profile = {
                    profileName: 'name',
                    path: 'path',
                    isDefault: true
                };
                (0, assert_1.deepStrictEqual)((0, terminalProfiles_1.createProfileSchemaEnums)([profile]), {
                    values: [
                        null,
                        'name'
                    ],
                    markdownDescriptions: [
                        'Automatically detect the default',
                        '$(terminal) name\n- path: path'
                    ]
                });
            });
            test('should show all profile information', () => {
                const profile = {
                    profileName: 'name',
                    path: 'path',
                    isDefault: true,
                    args: ['a', 'b'],
                    color: 'terminal.ansiRed',
                    env: {
                        c: 'd',
                        e: 'f'
                    },
                    icon: codicons_1.Codicon.zap,
                    overrideName: true
                };
                (0, assert_1.deepStrictEqual)((0, terminalProfiles_1.createProfileSchemaEnums)([profile]), {
                    values: [
                        null,
                        'name'
                    ],
                    markdownDescriptions: [
                        'Automatically detect the default',
                        `$(zap) name\n- path: path\n- args: ['a','b']\n- overrideName: true\n- color: terminal.ansiRed\n- env: {\"c\":\"d\",\"e\":\"f\"}`
                    ]
                });
            });
            test('should return a multiple entries when there are multiple profiles', () => {
                const profile1 = {
                    profileName: 'name',
                    path: 'path',
                    isDefault: true
                };
                const profile2 = {
                    profileName: 'foo',
                    path: 'bar',
                    isDefault: false
                };
                (0, assert_1.deepStrictEqual)((0, terminalProfiles_1.createProfileSchemaEnums)([profile1, profile2]), {
                    values: [
                        null,
                        'name',
                        'foo'
                    ],
                    markdownDescriptions: [
                        'Automatically detect the default',
                        '$(terminal) name\n- path: path',
                        '$(terminal) foo\n- path: bar'
                    ]
                });
            });
        });
    });
});
//# sourceMappingURL=terminalProfiles.test.js.map