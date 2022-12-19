define(["require", "exports", "assert", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHost.protocol", "vs/base/common/uri", "vs/base/test/common/mock", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/log/common/log", "vs/base/common/types", "vs/workbench/api/common/extHostBulkEdits"], function (require, exports, assert, extHostTypes, extHost_protocol_1, uri_1, mock_1, extHostDocumentsAndEditors_1, testRPCProtocol_1, log_1, types_1, extHostBulkEdits_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostBulkEdits.applyWorkspaceEdit', () => {
        const resource = uri_1.URI.parse('foo:bar');
        let bulkEdits;
        let workspaceResourceEdits;
        setup(() => {
            workspaceResourceEdits = null;
            let rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadBulkEdits, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(_workspaceResourceEdits) {
                    workspaceResourceEdits = _workspaceResourceEdits;
                    return Promise.resolve(true);
                }
            });
            const documentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), new log_1.NullLogService());
            documentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        languageId: 'foo',
                        uri: resource,
                        versionId: 1337,
                        lines: ['foo'],
                        EOL: '\n',
                    }]
            });
            bulkEdits = new extHostBulkEdits_1.ExtHostBulkEdits(rpcProtocol, documentsAndEditors);
        });
        test('uses version id if document available', async () => {
            let edit = new extHostTypes.WorkspaceEdit();
            edit.replace(resource, new extHostTypes.Range(0, 0, 0, 0), 'hello');
            await bulkEdits.applyWorkspaceEdit(edit);
            assert.strictEqual(workspaceResourceEdits.edits.length, 1);
            const [first] = workspaceResourceEdits.edits;
            (0, types_1.assertType)(first._type === 2 /* WorkspaceEditType.Text */);
            assert.strictEqual(first.modelVersionId, 1337);
        });
        test('does not use version id if document is not available', async () => {
            let edit = new extHostTypes.WorkspaceEdit();
            edit.replace(uri_1.URI.parse('foo:bar2'), new extHostTypes.Range(0, 0, 0, 0), 'hello');
            await bulkEdits.applyWorkspaceEdit(edit);
            assert.strictEqual(workspaceResourceEdits.edits.length, 1);
            const [first] = workspaceResourceEdits.edits;
            (0, types_1.assertType)(first._type === 2 /* WorkspaceEditType.Text */);
            assert.ok(typeof first.modelVersionId === 'undefined');
        });
    });
});
//# sourceMappingURL=extHostBulkEdits.test.js.map