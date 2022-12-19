/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/processes"], function (require, exports, assert, processes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Processes', () => {
        test('sanitizeProcessEnvironment', () => {
            let env = {
                FOO: 'bar',
                ELECTRON_ENABLE_STACK_DUMPING: 'x',
                ELECTRON_ENABLE_LOGGING: 'x',
                ELECTRON_NO_ASAR: 'x',
                ELECTRON_NO_ATTACH_CONSOLE: 'x',
                ELECTRON_RUN_AS_NODE: 'x',
                VSCODE_CLI: 'x',
                VSCODE_DEV: 'x',
                VSCODE_IPC_HOOK: 'x',
                VSCODE_NLS_CONFIG: 'x',
                VSCODE_PORTABLE: 'x',
                VSCODE_PID: 'x',
                VSCODE_SHELL_LOGIN: '1',
                VSCODE_CODE_CACHE_PATH: 'x',
                VSCODE_NEW_VAR: 'x',
                GDK_PIXBUF_MODULE_FILE: 'x',
                GDK_PIXBUF_MODULEDIR: 'x'
            };
            processes.sanitizeProcessEnvironment(env);
            assert.strictEqual(env['FOO'], 'bar');
            assert.strictEqual(env['VSCODE_SHELL_LOGIN'], '1');
            assert.strictEqual(Object.keys(env).length, 2);
        });
    });
});
//# sourceMappingURL=processes.test.js.map