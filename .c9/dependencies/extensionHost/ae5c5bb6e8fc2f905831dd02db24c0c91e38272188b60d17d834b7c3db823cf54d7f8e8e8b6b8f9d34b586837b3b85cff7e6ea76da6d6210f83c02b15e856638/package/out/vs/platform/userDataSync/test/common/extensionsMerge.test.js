/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/userDataSync/common/extensionsMerge"], function (require, exports, assert, extensionsMerge_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionsMerge', () => {
        test('merge returns local extension if remote does not exist', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, null, null, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, localExtensions);
        });
        test('merge returns local extension if remote does not exist with ignored extensions', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, null, null, [], ['a']);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge returns local extension if remote does not exist with ignored extensions (ignore case)', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, null, null, [], ['A']);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge returns local extension if remote does not exist with skipped extensions', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const skippedExtension = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true },
            ];
            const expected = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, null, null, skippedExtension, []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge returns local extension if remote does not exist with skipped and ignored extensions', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const skippedExtension = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, null, null, skippedExtension, ['a']);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when there is no base', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false }, { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when there is no base and with ignored extensions', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], ['a']);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false }, { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when remote is moved forwarded', () => {
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false }, { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, [{ id: 'a', uuid: 'a' }, { id: 'd', uuid: 'd' }]);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.strictEqual(actual.remote, null);
        });
        test('merge local and remote extensions when remote is moved forwarded with disabled extension', () => {
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, disabled: true, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false }, { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, [{ id: 'a', uuid: 'a' }]);
            assert.deepStrictEqual(actual.local.updated, [{ identifier: { id: 'd', uuid: 'd' }, disabled: true, installed: true, version: '1.0.0', preRelease: false }]);
            assert.strictEqual(actual.remote, null);
        });
        test('merge local and remote extensions when remote moved forwarded with ignored extensions', () => {
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], ['a']);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false }, { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, [{ id: 'd', uuid: 'd' }]);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.strictEqual(actual.remote, null);
        });
        test('merge local and remote extensions when remote is moved forwarded with skipped extensions', () => {
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const skippedExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, skippedExtensions, []);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false }, { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, [{ id: 'd', uuid: 'd' }]);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.strictEqual(actual.remote, null);
        });
        test('merge local and remote extensions when remote is moved forwarded with skipped and ignored extensions', () => {
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const skippedExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, skippedExtensions, ['b']);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, [{ id: 'd', uuid: 'd' }]);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.strictEqual(actual.remote, null);
        });
        test('merge local and remote extensions when local is moved forwarded', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when local is moved forwarded with disabled extensions', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, disabled: true, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'a', uuid: 'a' }, disabled: true, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when local is moved forwarded with ignored settings', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], ['b']);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, [
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ]);
        });
        test('merge local and remote extensions when local is moved forwarded with skipped extensions', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const skippedExtensions = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, skippedExtensions, []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when local is moved forwarded with skipped and ignored extensions', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const skippedExtensions = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, skippedExtensions, ['c']);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when both moved forwarded', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, [{ id: 'a', uuid: 'a' }]);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when both moved forwarded with ignored extensions', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], ['a', 'e']);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when both moved forwarded with skipped extensions', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const skippedExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, skippedExtensions, []);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge local and remote extensions when both moved forwarded with skipped and ignoredextensions', () => {
            var _a;
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
                { identifier: { id: 'd', uuid: 'd' }, installed: true },
            ];
            const skippedExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true },
            ];
            const localExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'e', uuid: 'e' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, skippedExtensions, ['e']);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge when remote extension has no uuid and different extension id case', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'A' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'A', uuid: 'a' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'b', uuid: 'b' }, installed: true, version: '1.0.0', preRelease: false },
                { identifier: { id: 'c', uuid: 'c' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'd', uuid: 'd' }, installed: true, version: '1.0.0', preRelease: false }]);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge when remote extension is not an installed extension', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge when remote extension is not an installed extension but is an installed extension locally', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge when an extension is not an installed extension remotely and does not exist locally', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0' },
                { identifier: { id: 'b', uuid: 'b' }, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, remoteExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge when an extension is an installed extension remotely but not locally and updated locally', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, disabled: true, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, disabled: true, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, remoteExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge when an extension is an installed extension remotely but not locally and updated remotely', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, disabled: true, version: '1.0.0' },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, localExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [
                { identifier: { id: 'a', uuid: 'a' }, installed: true, disabled: true, version: '1.0.0', preRelease: false },
            ]);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge not installed extensions', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0' },
            ];
            const remoteExtensions = [
                { identifier: { id: 'b', uuid: 'b' }, version: '1.0.0' },
            ];
            const expected = [
                { identifier: { id: 'b', uuid: 'b' }, version: '1.0.0', preRelease: false },
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, expected);
        });
        test('merge: remote extension with prerelease is added', () => {
            const localExtensions = [];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true }]);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge: local extension with prerelease is added', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const remoteExtensions = [];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true }]);
        });
        test('merge: remote extension with prerelease is added when local extension without prerelease is added', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true }]);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge: remote extension without prerelease is added when local extension with prerelease is added', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, null, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true }]);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true }]);
        });
        test('merge: remote extension is changed to prerelease', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, localExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true }]);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge: remote extension is changed to release', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, localExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: false }]);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge: local extension is changed to prerelease', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, remoteExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true }]);
        });
        test('merge: local extension is changed to release', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: false },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, remoteExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: false }]);
        });
        test('merge: local extension not an installed extension - remote preRelease property is taken precedence when there are no updates', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: false, preRelease: false },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, remoteExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge: local extension not an installed extension - remote preRelease property is taken precedence when there are updates locally', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: false, preRelease: false, disabled: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, remoteExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true, disabled: true }]);
        });
        test('merge: local extension not an installed extension - remote preRelease property is taken precedence when there are updates remotely', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: false, preRelease: false },
            ];
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true, disabled: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: true, preRelease: true, disabled: true }]);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge: local extension not an installed extension - remote version is taken precedence when there are no updates', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: false, preRelease: false },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.1.0', installed: true, preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, remoteExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual(actual.remote, null);
        });
        test('merge: local extension not an installed extension - remote version is taken precedence when there are updates locally', () => {
            var _a;
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: false, preRelease: false, disabled: true },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.1.0', installed: true, preRelease: false },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, remoteExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, []);
            assert.deepStrictEqual((_a = actual.remote) === null || _a === void 0 ? void 0 : _a.all, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.1.0', installed: true, preRelease: false, disabled: true }]);
        });
        test('merge: local extension not an installed extension - remote version property is taken precedence when there are updates remotely', () => {
            const localExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.0.0', installed: false, preRelease: false },
            ];
            const baseExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.1.0', installed: true, preRelease: false },
            ];
            const remoteExtensions = [
                { identifier: { id: 'a', uuid: 'a' }, version: '1.1.0', installed: true, preRelease: false, disabled: true },
            ];
            const actual = (0, extensionsMerge_1.merge)(localExtensions, remoteExtensions, baseExtensions, [], []);
            assert.deepStrictEqual(actual.local.added, []);
            assert.deepStrictEqual(actual.local.removed, []);
            assert.deepStrictEqual(actual.local.updated, [{ identifier: { id: 'a', uuid: 'a' }, version: '1.1.0', installed: true, preRelease: false, disabled: true }]);
            assert.deepStrictEqual(actual.remote, null);
        });
    });
});
//# sourceMappingURL=extensionsMerge.test.js.map