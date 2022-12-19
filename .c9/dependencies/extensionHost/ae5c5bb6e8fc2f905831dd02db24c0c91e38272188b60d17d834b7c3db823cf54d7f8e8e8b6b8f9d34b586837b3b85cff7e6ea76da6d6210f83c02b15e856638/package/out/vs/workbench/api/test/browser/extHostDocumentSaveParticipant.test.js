define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostDocumentSaveParticipant", "vs/workbench/api/test/common/testRPCProtocol", "vs/base/test/common/mock", "vs/platform/log/common/log", "vs/base/common/async", "vs/workbench/services/extensions/common/extensions"], function (require, exports, assert, uri_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHostTypes_1, extHostDocumentSaveParticipant_1, testRPCProtocol_1, mock_1, log_1, async_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDocumentSaveParticipant', () => {
        let resource = uri_1.URI.parse('foo:bar');
        let mainThreadBulkEdits = new class extends (0, mock_1.mock)() {
        };
        let documents;
        let nullLogService = new log_1.NullLogService();
        setup(() => {
            const documentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), new log_1.NullLogService());
            documentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        languageId: 'foo',
                        uri: resource,
                        versionId: 1,
                        lines: ['foo'],
                        EOL: '\n',
                    }]
            });
            documents = new extHostDocuments_1.ExtHostDocuments((0, testRPCProtocol_1.SingleProxyRPCProtocol)(null), documentsAndEditors);
        });
        test('no listeners, no problem', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => assert.ok(true));
        });
        test('event delivery', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let event;
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.ok(event);
                assert.strictEqual(event.reason, extHostTypes_1.TextDocumentSaveReason.Manual);
                assert.strictEqual(typeof event.waitUntil, 'function');
            });
        });
        test('event delivery, immutable', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let event;
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.ok(event);
                assert.throws(() => { event.document = null; });
            });
        });
        test('event delivery, bad listener', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('💀');
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                const [first] = values;
                assert.strictEqual(first, false);
            });
        });
        test('event delivery, bad listener doesn\'t prevent more events', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('💀');
            });
            let event;
            let sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub1.dispose();
                sub2.dispose();
                assert.ok(event);
            });
        });
        test('event delivery, in subscriber order', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let counter = 0;
            let sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                assert.strictEqual(counter++, 0);
            });
            let sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                assert.strictEqual(counter++, 1);
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub1.dispose();
                sub2.dispose();
            });
        });
        test('event delivery, ignore bad listeners', async () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 5, errors: 1 });
            let callCount = 0;
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                callCount += 1;
                throw new Error('boom');
            });
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            sub.dispose();
            assert.strictEqual(callCount, 2);
        });
        test('event delivery, overall timeout', async function () {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 20, errors: 5 });
            // let callCount = 0;
            let calls = [];
            let sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(1);
            });
            let sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(2);
                event.waitUntil((0, async_1.timeout)(100));
            });
            let sub3 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                calls.push(3);
            });
            const values = await participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */);
            sub1.dispose();
            sub2.dispose();
            sub3.dispose();
            assert.deepStrictEqual(calls, [1, 2]);
            assert.strictEqual(values.length, 2);
        });
        test('event delivery, waitUntil', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil((0, async_1.timeout)(10));
                event.waitUntil((0, async_1.timeout)(10));
                event.waitUntil((0, async_1.timeout)(10));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
            });
        });
        test('event delivery, waitUntil must be called sync', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil(new Promise((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            assert.throws(() => event.waitUntil((0, async_1.timeout)(10)));
                            resolve(undefined);
                        }
                        catch (e) {
                            reject(e);
                        }
                    }, 10);
                }));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
            });
        });
        test('event delivery, waitUntil will timeout', function () {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits, { timeout: 5, errors: 3 });
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (event) {
                event.waitUntil((0, async_1.timeout)(100));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                const [first] = values;
                assert.strictEqual(first, false);
            });
        });
        test('event delivery, waitUntil failure handling', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, mainThreadBulkEdits);
            let sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                e.waitUntil(Promise.reject(new Error('dddd')));
            });
            let event;
            let sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                event = e;
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                assert.ok(event);
                sub1.dispose();
                sub2.dispose();
            });
        });
        test('event delivery, pushEdits sync', () => {
            let dto;
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(_edits) {
                    dto = _edits;
                    return Promise.resolve(true);
                }
            });
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.setEndOfLine(extHostTypes_1.EndOfLine.CRLF)]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.strictEqual(dto.edits.length, 2);
                assert.ok(dto.edits[0].edit);
                assert.ok(dto.edits[1].edit);
            });
        });
        test('event delivery, concurrent change', () => {
            let edits;
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(_edits) {
                    edits = _edits;
                    return Promise.resolve(true);
                }
            });
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // concurrent change from somewhere
                documents.$acceptModelChanged(resource, {
                    changes: [{
                            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
                            rangeOffset: undefined,
                            rangeLength: undefined,
                            text: 'bar'
                        }],
                    eol: undefined,
                    versionId: 2,
                    isRedoing: false,
                    isUndoing: false,
                }, true);
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub.dispose();
                assert.strictEqual(edits, undefined);
                assert.strictEqual(values[0], false);
            });
        });
        test('event delivery, two listeners -> two document states', () => {
            const participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(nullLogService, documents, new class extends (0, mock_1.mock)() {
                $tryApplyWorkspaceEdit(dto) {
                    for (const edit of dto.edits) {
                        const uri = uri_1.URI.revive(edit.resource);
                        const { text, range } = edit.edit;
                        documents.$acceptModelChanged(uri, {
                            changes: [{
                                    range,
                                    text,
                                    rangeOffset: undefined,
                                    rangeLength: undefined,
                                }],
                            eol: undefined,
                            versionId: documents.getDocumentData(uri).version + 1,
                            isRedoing: false,
                            isUndoing: false,
                        }, true);
                        // }
                    }
                    return Promise.resolve(true);
                }
            });
            const document = documents.getDocument(resource);
            let sub1 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // the document state we started with
                assert.strictEqual(document.version, 1);
                assert.strictEqual(document.getText(), 'foo');
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            let sub2 = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                // the document state AFTER the first listener kicked in
                assert.strictEqual(document.version, 2);
                assert.strictEqual(document.getText(), 'barfoo');
                e.waitUntil(Promise.resolve([extHostTypes_1.TextEdit.insert(new extHostTypes_1.Position(0, 0), 'bar')]));
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(values => {
                sub1.dispose();
                sub2.dispose();
                // the document state AFTER eventing is done
                assert.strictEqual(document.version, 3);
                assert.strictEqual(document.getText(), 'barbarfoo');
            });
        });
        test('Log failing listener', function () {
            let didLogSomething = false;
            let participant = new extHostDocumentSaveParticipant_1.ExtHostDocumentSaveParticipant(new class extends log_1.NullLogService {
                error(message, ...args) {
                    didLogSomething = true;
                }
            }, documents, mainThreadBulkEdits);
            let sub = participant.getOnWillSaveTextDocumentEvent(extensions_1.nullExtensionDescription)(function (e) {
                throw new Error('boom');
            });
            return participant.$participateInSave(resource, 1 /* SaveReason.EXPLICIT */).then(() => {
                sub.dispose();
                assert.strictEqual(didLogSomething, true);
            });
        });
    });
});
//# sourceMappingURL=extHostDocumentSaveParticipant.test.js.map