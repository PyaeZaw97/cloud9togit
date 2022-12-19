/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/terminal/common/environmentVariableShared", "vs/workbench/contrib/terminal/common/environmentVariable"], function (require, exports, assert_1, environmentVariableShared_1, environmentVariable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EnvironmentVariable - deserializeEnvironmentVariableCollection', () => {
        test('should construct correctly with 3 arguments', () => {
            const c = (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }],
                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
            ]);
            const keys = [...c.keys()];
            (0, assert_1.deepStrictEqual)(keys, ['A', 'B', 'C']);
            (0, assert_1.deepStrictEqual)(c.get('A'), { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace });
            (0, assert_1.deepStrictEqual)(c.get('B'), { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append });
            (0, assert_1.deepStrictEqual)(c.get('C'), { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend });
        });
    });
    suite('EnvironmentVariable - serializeEnvironmentVariableCollection', () => {
        test('should correctly serialize the object', () => {
            const collection = new Map();
            (0, assert_1.deepStrictEqual)((0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(collection), []);
            collection.set('A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace });
            collection.set('B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append });
            collection.set('C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend });
            (0, assert_1.deepStrictEqual)((0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(collection), [
                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }],
                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
            ]);
        });
    });
});
//# sourceMappingURL=environmentVariableShared.test.js.map