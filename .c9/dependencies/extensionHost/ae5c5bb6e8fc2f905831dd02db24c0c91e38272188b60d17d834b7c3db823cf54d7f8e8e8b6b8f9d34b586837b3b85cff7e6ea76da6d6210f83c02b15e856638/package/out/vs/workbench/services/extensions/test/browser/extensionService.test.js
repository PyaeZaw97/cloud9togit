/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/extensions/browser/extensionService"], function (require, exports, assert, extensionService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('BrowserExtensionService', () => {
        test('pickRunningLocation', () => {
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation([], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation([], false, true, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation([], true, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation([], true, true, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui'], false, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui'], true, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui'], true, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace'], false, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace'], true, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace'], true, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web'], false, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web'], true, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'workspace'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'workspace'], false, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'workspace'], true, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'workspace'], true, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'ui'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'ui'], false, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'ui'], true, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'ui'], true, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'workspace'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'workspace'], false, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'workspace'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'workspace'], true, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'web'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'web'], false, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'web'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'web'], true, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'web'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'web'], false, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'web'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'web'], true, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'ui'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'ui'], false, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'ui'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'ui'], true, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'web', 'workspace'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'web', 'workspace'], false, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'web', 'workspace'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'web', 'workspace'], true, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'workspace', 'web'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'workspace', 'web'], false, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'workspace', 'web'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['ui', 'workspace', 'web'], true, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'ui', 'workspace'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'ui', 'workspace'], false, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'ui', 'workspace'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'ui', 'workspace'], true, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'workspace', 'ui'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'workspace', 'ui'], false, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'workspace', 'ui'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['web', 'workspace', 'ui'], true, true, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'ui', 'web'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'ui', 'web'], false, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'ui', 'web'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'ui', 'web'], true, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'web', 'ui'], false, false, 0 /* ExtensionRunningPreference.None */), null);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'web', 'ui'], false, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'web', 'ui'], true, false, 0 /* ExtensionRunningPreference.None */), 2 /* ExtensionHostKind.LocalWebWorker */);
            assert.deepStrictEqual(extensionService_1.ExtensionService.pickRunningLocation(['workspace', 'web', 'ui'], true, true, 0 /* ExtensionRunningPreference.None */), 3 /* ExtensionHostKind.Remote */);
        });
    });
});
//# sourceMappingURL=extensionService.test.js.map