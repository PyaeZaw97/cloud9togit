/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/base/common/platform", "vs/workbench/contrib/terminal/common/environmentVariableCollection", "vs/workbench/contrib/terminal/common/environmentVariableShared"], function (require, exports, assert_1, environmentVariable_1, platform_1, environmentVariableCollection_1, environmentVariableShared_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EnvironmentVariable - MergedEnvironmentVariableCollection', () => {
        suite('ctor', () => {
            test('Should keep entries that come after a Prepend or Append type mutators', () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }],
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }],
                    ['ext3', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }],
                    ['ext4', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }]
                ]));
                (0, assert_1.deepStrictEqual)([...merged.map.entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a4' },
                            { extensionIdentifier: 'ext3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a3' },
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a2' },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a1' }
                        ]]
                ]);
            });
            test('Should remove entries that come after a Replace type mutator', () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }],
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }],
                    ['ext3', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }],
                    ['ext4', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a4', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }]
                ]));
                (0, assert_1.deepStrictEqual)([...merged.map.entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a3' },
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a2' },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a1' }
                        ]]
                ], 'The ext4 entry should be removed as it comes after a Replace');
            });
        });
        suite('applyToProcessEnvironment', () => {
            test('should apply the collection to an environment', async () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }],
                                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }]
                ]));
                const env = {
                    A: 'foo',
                    B: 'bar',
                    C: 'baz'
                };
                await merged.applyToProcessEnvironment(env);
                (0, assert_1.deepStrictEqual)(env, {
                    A: 'a',
                    B: 'barb',
                    C: 'cbaz'
                });
            });
            test('should apply the collection to environment entries with no values', async () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }],
                                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }]
                ]));
                const env = {};
                await merged.applyToProcessEnvironment(env);
                (0, assert_1.deepStrictEqual)(env, {
                    A: 'a',
                    B: 'b',
                    C: 'c'
                });
            });
            test('should apply to variable case insensitively on Windows only', async () => {
                const merged = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['a', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['b', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }],
                                ['c', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }]
                ]));
                const env = {
                    A: 'A',
                    B: 'B',
                    C: 'C'
                };
                await merged.applyToProcessEnvironment(env);
                if (platform_1.isWindows) {
                    (0, assert_1.deepStrictEqual)(env, {
                        A: 'a',
                        B: 'Bb',
                        C: 'cC'
                    });
                }
                else {
                    (0, assert_1.deepStrictEqual)(env, {
                        a: 'a',
                        A: 'A',
                        b: 'b',
                        B: 'B',
                        c: 'c',
                        C: 'C'
                    });
                }
            });
        });
        suite('diff', () => {
            test('should return undefined when collectinos are the same', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2);
                (0, assert_1.strictEqual)(diff, undefined);
            });
            test('should generate added diffs from when the first entry is added', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2);
                (0, assert_1.strictEqual)(diff.changed.size, 0);
                (0, assert_1.strictEqual)(diff.removed.size, 0);
                const entries = [...diff.added.entries()];
                (0, assert_1.deepStrictEqual)(entries, [
                    ['A', [{ extensionIdentifier: 'ext1', value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]]
                ]);
            });
            test('should generate added diffs from the same extension', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2);
                (0, assert_1.strictEqual)(diff.changed.size, 0);
                (0, assert_1.strictEqual)(diff.removed.size, 0);
                const entries = [...diff.added.entries()];
                (0, assert_1.deepStrictEqual)(entries, [
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]]
                ]);
            });
            test('should generate added diffs from a different extension', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }],
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2);
                (0, assert_1.strictEqual)(diff.changed.size, 0);
                (0, assert_1.strictEqual)(diff.removed.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.added.entries()], [
                    ['A', [{ extensionIdentifier: 'ext2', value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]]
                ]);
                const merged3 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }],
                    // This entry should get removed
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }]
                ]));
                const diff2 = merged1.diff(merged3);
                (0, assert_1.strictEqual)(diff2.changed.size, 0);
                (0, assert_1.strictEqual)(diff2.removed.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.added.entries()], [...diff2.added.entries()], 'Swapping the order of the entries in the other collection should yield the same result');
            });
            test('should remove entries in the diff that come after a Replace', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }]
                ]));
                const merged4 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }],
                    // This entry should get removed as it comes after a replace
                    ['ext2', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged4);
                (0, assert_1.strictEqual)(diff, undefined, 'Replace should ignore any entries after it');
            });
            test('should generate removed diffs', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2);
                (0, assert_1.strictEqual)(diff.changed.size, 0);
                (0, assert_1.strictEqual)(diff.added.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.removed.entries()], [
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]]
                ]);
            });
            test('should generate changed diffs', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2);
                (0, assert_1.strictEqual)(diff.added.size, 0);
                (0, assert_1.strictEqual)(diff.removed.size, 0);
                (0, assert_1.deepStrictEqual)([...diff.changed.entries()], [
                    ['A', [{ extensionIdentifier: 'ext1', value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]],
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]]
                ]);
            });
            test('should generate diffs with added, changed and removed', () => {
                const merged1 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]
                            ])
                        }]
                ]));
                const merged2 = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(new Map([
                    ['ext1', {
                            map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)([
                                ['A', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }],
                                ['C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]
                            ])
                        }]
                ]));
                const diff = merged1.diff(merged2);
                (0, assert_1.deepStrictEqual)([...diff.added.entries()], [
                    ['C', [{ extensionIdentifier: 'ext1', value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Append }]],
                ]);
                (0, assert_1.deepStrictEqual)([...diff.removed.entries()], [
                    ['B', [{ extensionIdentifier: 'ext1', value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend }]]
                ]);
                (0, assert_1.deepStrictEqual)([...diff.changed.entries()], [
                    ['A', [{ extensionIdentifier: 'ext1', value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace }]]
                ]);
            });
        });
    });
});
//# sourceMappingURL=environmentVariableCollection.test.js.map