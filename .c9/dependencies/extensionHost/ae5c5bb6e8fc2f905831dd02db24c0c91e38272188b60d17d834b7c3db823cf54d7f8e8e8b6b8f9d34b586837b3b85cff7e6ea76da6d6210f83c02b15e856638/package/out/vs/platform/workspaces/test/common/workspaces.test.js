/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/workspace/common/workspace"], function (require, exports, assert, uri_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workspaces', () => {
        test('reviveIdentifier', () => {
            let serializedWorkspaceIdentifier = { id: 'id', configPath: uri_1.URI.file('foo').toJSON() };
            assert.strictEqual((0, workspace_1.isWorkspaceIdentifier)((0, workspace_1.reviveIdentifier)(serializedWorkspaceIdentifier)), true);
            let serializedSingleFolderWorkspaceIdentifier = { id: 'id', uri: uri_1.URI.file('foo').toJSON() };
            assert.strictEqual((0, workspace_1.isSingleFolderWorkspaceIdentifier)((0, workspace_1.reviveIdentifier)(serializedSingleFolderWorkspaceIdentifier)), true);
            let serializedEmptyWorkspaceIdentifier = { id: 'id' };
            assert.strictEqual((0, workspace_1.reviveIdentifier)(serializedEmptyWorkspaceIdentifier).id, serializedEmptyWorkspaceIdentifier.id);
            assert.strictEqual((0, workspace_1.isWorkspaceIdentifier)(serializedEmptyWorkspaceIdentifier), false);
            assert.strictEqual((0, workspace_1.isSingleFolderWorkspaceIdentifier)(serializedEmptyWorkspaceIdentifier), false);
            assert.strictEqual((0, workspace_1.reviveIdentifier)(undefined), undefined);
        });
        test('hasWorkspaceFileExtension', () => {
            assert.strictEqual((0, workspace_1.hasWorkspaceFileExtension)('something'), false);
            assert.strictEqual((0, workspace_1.hasWorkspaceFileExtension)('something.code-workspace'), true);
        });
        test('toWorkspaceIdentifier', () => {
            let identifier = (0, workspace_1.toWorkspaceIdentifier)({ id: 'id', folders: [] });
            assert.ok(!identifier);
            assert.ok(!(0, workspace_1.isSingleFolderWorkspaceIdentifier)(identifier));
            assert.ok(!(0, workspace_1.isWorkspaceIdentifier)(identifier));
            identifier = (0, workspace_1.toWorkspaceIdentifier)({ id: 'id', folders: [{ index: 0, name: 'test', toResource: () => uri_1.URI.file('test'), uri: uri_1.URI.file('test') }] });
            assert.ok(identifier);
            assert.ok((0, workspace_1.isSingleFolderWorkspaceIdentifier)(identifier));
            assert.ok(!(0, workspace_1.isWorkspaceIdentifier)(identifier));
            identifier = (0, workspace_1.toWorkspaceIdentifier)({ id: 'id', configuration: uri_1.URI.file('test.code-workspace'), folders: [] });
            assert.ok(identifier);
            assert.ok(!(0, workspace_1.isSingleFolderWorkspaceIdentifier)(identifier));
            assert.ok((0, workspace_1.isWorkspaceIdentifier)(identifier));
        });
    });
});
//# sourceMappingURL=workspaces.test.js.map