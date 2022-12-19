/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, lifecycle_1, mime_1, uri_1, language_1, notebookCommon_1, notebookRange_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookCommon', () => {
        let disposables;
        let instantiationService;
        let languageService;
        suiteSetup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            languageService = instantiationService.get(language_1.ILanguageService);
        });
        suiteTeardown(() => disposables.dispose());
        test('sortMimeTypes default orders', function () {
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder().sort([
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.latex,
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]), [
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.latex,
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]);
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder().sort([
                'application/json',
                mime_1.Mimes.latex,
                mime_1.Mimes.markdown,
                'application/javascript',
                'text/html',
                mime_1.Mimes.text,
                'image/png',
                'image/jpeg',
                'image/svg+xml'
            ]), [
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.latex,
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]);
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder().sort([
                mime_1.Mimes.markdown,
                'application/json',
                mime_1.Mimes.text,
                'image/jpeg',
                'application/javascript',
                'text/html',
                'image/png',
                'image/svg+xml'
            ]), [
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]);
        });
        test('sortMimeTypes user orders', function () {
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder([
                'image/png',
                mime_1.Mimes.text,
                mime_1.Mimes.markdown,
                'text/html',
                'application/json'
            ]).sort([
                'application/json',
                'application/javascript',
                'text/html',
                'image/svg+xml',
                mime_1.Mimes.markdown,
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]), [
                'image/png',
                mime_1.Mimes.text,
                mime_1.Mimes.markdown,
                'text/html',
                'application/json',
                'application/javascript',
                'image/svg+xml',
                'image/jpeg',
            ]);
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder([
                'application/json',
                'text/html',
                'text/html',
                mime_1.Mimes.markdown,
                'application/json'
            ]).sort([
                mime_1.Mimes.markdown,
                'application/json',
                mime_1.Mimes.text,
                'application/javascript',
                'text/html',
                'image/svg+xml',
                'image/jpeg',
                'image/png'
            ]), [
                'application/json',
                'text/html',
                mime_1.Mimes.markdown,
                'application/javascript',
                'image/svg+xml',
                'image/png',
                'image/jpeg',
                mime_1.Mimes.text
            ]);
        });
        test('prioritizes mimetypes', () => {
            const m = new notebookCommon_1.MimeTypeDisplayOrder([
                mime_1.Mimes.markdown,
                'text/html',
                'application/json'
            ]);
            assert.deepStrictEqual(m.toArray(), [mime_1.Mimes.markdown, 'text/html', 'application/json']);
            // no-op if already in the right order
            m.prioritize('text/html', ['application/json']);
            assert.deepStrictEqual(m.toArray(), [mime_1.Mimes.markdown, 'text/html', 'application/json']);
            // sorts to highest priority
            m.prioritize('text/html', ['application/json', mime_1.Mimes.markdown]);
            assert.deepStrictEqual(m.toArray(), ['text/html', mime_1.Mimes.markdown, 'application/json']);
            // adds in new type
            m.prioritize('text/plain', ['application/json', mime_1.Mimes.markdown]);
            assert.deepStrictEqual(m.toArray(), ['text/plain', 'text/html', mime_1.Mimes.markdown, 'application/json']);
            // moves multiple, preserves order
            m.prioritize(mime_1.Mimes.markdown, ['text/plain', 'application/json', mime_1.Mimes.markdown]);
            assert.deepStrictEqual(m.toArray(), ['text/html', mime_1.Mimes.markdown, 'text/plain', 'application/json']);
            // deletes multiple
            m.prioritize('text/plain', ['text/plain', 'text/html', mime_1.Mimes.markdown]);
            assert.deepStrictEqual(m.toArray(), ['text/plain', 'text/html', mime_1.Mimes.markdown, 'application/json']);
            // handles multiple mimetypes, unknown mimetype
            const m2 = new notebookCommon_1.MimeTypeDisplayOrder(['a', 'b']);
            m2.prioritize('b', ['a', 'b', 'a', 'q']);
            assert.deepStrictEqual(m2.toArray(), ['b', 'a']);
        });
        test('sortMimeTypes glob', function () {
            assert.deepStrictEqual(new notebookCommon_1.MimeTypeDisplayOrder([
                'application/vnd-vega*',
                mime_1.Mimes.markdown,
                'text/html',
                'application/json'
            ]).sort([
                'application/json',
                'application/javascript',
                'text/html',
                'application/vnd-plot.json',
                'application/vnd-vega.json'
            ]), [
                'application/vnd-vega.json',
                'text/html',
                'application/json',
                'application/vnd-plot.json',
                'application/javascript',
            ], 'glob *');
        });
        test('diff cells', function () {
            const cells = [];
            for (let i = 0; i < 5; i++) {
                cells.push(new testNotebookEditor_1.TestCell('notebook', i, `var a = ${i};`, 'javascript', notebookCommon_1.CellKind.Code, [], languageService));
            }
            assert.deepStrictEqual((0, notebookCommon_1.diff)(cells, [], (cell) => {
                return cells.indexOf(cell) > -1;
            }), [
                {
                    start: 0,
                    deleteCount: 5,
                    toInsert: []
                }
            ]);
            assert.deepStrictEqual((0, notebookCommon_1.diff)([], cells, (cell) => {
                return false;
            }), [
                {
                    start: 0,
                    deleteCount: 0,
                    toInsert: cells
                }
            ]);
            const cellA = new testNotebookEditor_1.TestCell('notebook', 6, 'var a = 6;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService);
            const cellB = new testNotebookEditor_1.TestCell('notebook', 7, 'var a = 7;', 'javascript', notebookCommon_1.CellKind.Code, [], languageService);
            const modifiedCells = [
                cells[0],
                cells[1],
                cellA,
                cells[3],
                cellB,
                cells[4]
            ];
            const splices = (0, notebookCommon_1.diff)(cells, modifiedCells, (cell) => {
                return cells.indexOf(cell) > -1;
            });
            assert.deepStrictEqual(splices, [
                {
                    start: 2,
                    deleteCount: 1,
                    toInsert: [cellA]
                },
                {
                    start: 4,
                    deleteCount: 0,
                    toInsert: [cellB]
                }
            ]);
        });
    });
    suite('CellUri', function () {
        test('parse, generate (file-scheme)', function () {
            const nb = uri_1.URI.parse('foo:///bar/følder/file.nb');
            const id = 17;
            const data = notebookCommon_1.CellUri.generate(nb, id);
            const actual = notebookCommon_1.CellUri.parse(data);
            assert.ok(Boolean(actual));
            assert.strictEqual(actual === null || actual === void 0 ? void 0 : actual.handle, id);
            assert.strictEqual(actual === null || actual === void 0 ? void 0 : actual.notebook.toString(), nb.toString());
        });
        test('parse, generate (foo-scheme)', function () {
            const nb = uri_1.URI.parse('foo:///bar/følder/file.nb');
            const id = 17;
            const data = notebookCommon_1.CellUri.generate(nb, id);
            const actual = notebookCommon_1.CellUri.parse(data);
            assert.ok(Boolean(actual));
            assert.strictEqual(actual === null || actual === void 0 ? void 0 : actual.handle, id);
            assert.strictEqual(actual === null || actual === void 0 ? void 0 : actual.notebook.toString(), nb.toString());
        });
    });
    suite('CellRange', function () {
        test('Cell range to index', function () {
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([]), []);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 0 }]), []);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 1 }]), [0]);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 2 }]), [0, 1]);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 2 }, { start: 2, end: 3 }]), [0, 1, 2]);
            assert.deepStrictEqual((0, notebookRange_1.cellRangesToIndexes)([{ start: 0, end: 2 }, { start: 3, end: 4 }]), [0, 1, 3]);
        });
        test('Cell index to range', function () {
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([]), []);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([0]), [{ start: 0, end: 1 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([0, 1]), [{ start: 0, end: 2 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([0, 1, 2]), [{ start: 0, end: 3 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([0, 1, 3]), [{ start: 0, end: 2 }, { start: 3, end: 4 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([1, 0]), [{ start: 0, end: 2 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([1, 2, 0]), [{ start: 0, end: 3 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([3, 1, 0]), [{ start: 0, end: 2 }, { start: 3, end: 4 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([9, 10]), [{ start: 9, end: 11 }]);
            assert.deepStrictEqual((0, notebookRange_1.cellIndexesToRanges)([10, 9]), [{ start: 9, end: 11 }]);
        });
        test('Reduce ranges', function () {
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 0, end: 1 }, { start: 1, end: 2 }]), [{ start: 0, end: 2 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 0, end: 2 }, { start: 1, end: 3 }]), [{ start: 0, end: 3 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 1, end: 3 }, { start: 0, end: 2 }]), [{ start: 0, end: 3 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([{ start: 0, end: 2 }, { start: 4, end: 5 }]), [{ start: 0, end: 2 }, { start: 4, end: 5 }]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([
                { start: 0, end: 1 },
                { start: 1, end: 2 },
                { start: 4, end: 6 }
            ]), [
                { start: 0, end: 2 },
                { start: 4, end: 6 }
            ]);
            assert.deepStrictEqual((0, notebookRange_1.reduceCellRanges)([
                { start: 0, end: 1 },
                { start: 1, end: 3 },
                { start: 3, end: 4 }
            ]), [
                { start: 0, end: 4 }
            ]);
        });
    });
    suite('NotebookWorkingCopyTypeIdentifier', function () {
        test('works', function () {
            const viewType = 'testViewType';
            const type = notebookCommon_1.NotebookWorkingCopyTypeIdentifier.create('testViewType');
            assert.strictEqual(notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse(type), viewType);
            assert.strictEqual(notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse('something'), undefined);
        });
    });
});
//# sourceMappingURL=notebookCommon.test.js.map