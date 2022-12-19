/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "vs/editor/test/common/testTextModel", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/markers/common/markers", "vs/platform/markers/common/markerService", "vs/workbench/api/common/extHostLanguageFeatures", "vs/workbench/api/browser/mainThreadLanguageFeatures", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/browser/mainThreadCommands", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/editor/common/languages", "vs/editor/contrib/codelens/browser/codelens", "vs/editor/contrib/gotoSymbol/browser/goToSymbol", "vs/editor/contrib/hover/browser/getHover", "vs/editor/contrib/wordHighlighter/browser/wordHighlighter", "vs/editor/contrib/codeAction/browser/codeAction", "vs/workbench/contrib/search/common/search", "vs/editor/contrib/rename/browser/rename", "vs/editor/contrib/parameterHints/browser/provideSignatureHelp", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/format/browser/format", "vs/editor/contrib/links/browser/getLinks", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDiagnostics", "vs/platform/log/common/log", "vs/editor/contrib/colorPicker/browser/color", "vs/base/common/cancellation", "vs/workbench/services/extensions/common/extensions", "vs/editor/contrib/smartSelect/browser/smartSelect", "vs/base/test/common/mock", "vs/base/common/lifecycle", "vs/base/common/types", "vs/workbench/api/common/extHostApiDeprecationService", "vs/platform/progress/common/progress", "vs/workbench/api/common/extHostUriTransformerService", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService"], function (require, exports, assert, instantiationServiceMock_1, errors_1, uri_1, types, testTextModel_1, position_1, range_1, testRPCProtocol_1, markers_1, markerService_1, extHostLanguageFeatures_1, mainThreadLanguageFeatures_1, extHostCommands_1, mainThreadCommands_1, extHostDocuments_1, extHostDocumentsAndEditors_1, languages, codelens_1, goToSymbol_1, getHover_1, wordHighlighter_1, codeAction_1, search_1, rename_1, provideSignatureHelp_1, suggest_1, format_1, getLinks_1, extHost_protocol_1, extHostDiagnostics_1, log_1, color_1, cancellation_1, extensions_1, smartSelect_1, mock_1, lifecycle_1, types_1, extHostApiDeprecationService_1, progress_1, extHostUriTransformerService_1, outlineModel_1, languageFeatures_1, languageFeaturesService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostLanguageFeatures', function () {
        const defaultSelector = { scheme: 'far' };
        let model;
        let extHost;
        let mainThread;
        let disposables = [];
        let rpcProtocol;
        let languageFeaturesService;
        let originalErrorHandler;
        suiteSetup(() => {
            model = (0, testTextModel_1.createTextModel)([
                'This is the first line',
                'This is the second line',
                'This is the third line',
            ].join('\n'), undefined, undefined, uri_1.URI.parse('far://testing/file.a'));
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
            // Use IInstantiationService to get typechecking when instantiating
            let inst;
            {
                let instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                instantiationService.stub(markers_1.IMarkerService, markerService_1.MarkerService);
                instantiationService.set(languageFeatures_1.ILanguageFeaturesService, languageFeaturesService);
                inst = instantiationService;
            }
            originalErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            (0, errors_1.setUnexpectedErrorHandler)(() => { });
            const extHostDocumentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(rpcProtocol, new log_1.NullLogService());
            extHostDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        versionId: model.getVersionId(),
                        languageId: model.getLanguageId(),
                        uri: model.uri,
                        lines: model.getValue().split(model.getEOL()),
                        EOL: model.getEOL(),
                    }]
            });
            const extHostDocuments = new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocuments, extHostDocuments);
            const commands = new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService());
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCommands, commands);
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, inst.createInstance(mainThreadCommands_1.MainThreadCommands, rpcProtocol));
            const diagnostics = new extHostDiagnostics_1.ExtHostDiagnostics(rpcProtocol, new log_1.NullLogService(), new class extends (0, mock_1.mock)() {
            });
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics, diagnostics);
            extHost = new extHostLanguageFeatures_1.ExtHostLanguageFeatures(rpcProtocol, new extHostUriTransformerService_1.URITransformerService(null), extHostDocuments, commands, diagnostics, new log_1.NullLogService(), extHostApiDeprecationService_1.NullApiDeprecationService);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures, extHost);
            mainThread = rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadLanguageFeatures, inst.createInstance(mainThreadLanguageFeatures_1.MainThreadLanguageFeatures, rpcProtocol));
        });
        suiteTeardown(() => {
            (0, errors_1.setUnexpectedErrorHandler)(originalErrorHandler);
            model.dispose();
            mainThread.dispose();
        });
        teardown(() => {
            disposables = (0, lifecycle_1.dispose)(disposables);
            return rpcProtocol.sync();
        });
        // --- outline
        test('DocumentSymbols, register/deregister', async () => {
            assert.strictEqual(languageFeaturesService.documentSymbolProvider.all(model).length, 0);
            let d1 = extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [];
                }
            });
            await rpcProtocol.sync();
            assert.strictEqual(languageFeaturesService.documentSymbolProvider.all(model).length, 1);
            d1.dispose();
            return rpcProtocol.sync();
        });
        test('DocumentSymbols, evil provider', async () => {
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    throw new Error('evil document symbol provider');
                }
            }));
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [new types.SymbolInformation('test', types.SymbolKind.Field, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await outlineModel_1.OutlineModel.create(languageFeaturesService.documentSymbolProvider, model, cancellation_1.CancellationToken.None)).asListOfDocumentSymbols();
            assert.strictEqual(value.length, 1);
        });
        test('DocumentSymbols, data conversion', async () => {
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [new types.SymbolInformation('test', types.SymbolKind.Field, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await outlineModel_1.OutlineModel.create(languageFeaturesService.documentSymbolProvider, model, cancellation_1.CancellationToken.None)).asListOfDocumentSymbols();
            assert.strictEqual(value.length, 1);
            let entry = value[0];
            assert.strictEqual(entry.name, 'test');
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Quick Outline uses a not ideal sorting, #138502', async function () {
            const symbols = [
                { name: 'containers', range: { startLineNumber: 1, startColumn: 1, endLineNumber: 4, endColumn: 26 } },
                { name: 'container 0', range: { startLineNumber: 2, startColumn: 5, endLineNumber: 5, endColumn: 1 } },
                { name: 'name', range: { startLineNumber: 2, startColumn: 5, endLineNumber: 2, endColumn: 16 } },
                { name: 'ports', range: { startLineNumber: 3, startColumn: 5, endLineNumber: 5, endColumn: 1 } },
                { name: 'ports 0', range: { startLineNumber: 4, startColumn: 9, endLineNumber: 4, endColumn: 26 } },
                { name: 'containerPort', range: { startLineNumber: 4, startColumn: 9, endLineNumber: 4, endColumn: 26 } }
            ];
            extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentSymbols: (doc, token) => {
                    return symbols.map(s => {
                        return new types.SymbolInformation(s.name, types.SymbolKind.Object, new types.Range(s.range.startLineNumber - 1, s.range.startColumn - 1, s.range.endLineNumber - 1, s.range.endColumn - 1));
                    });
                }
            });
            await rpcProtocol.sync();
            const value = (await outlineModel_1.OutlineModel.create(languageFeaturesService.documentSymbolProvider, model, cancellation_1.CancellationToken.None)).asListOfDocumentSymbols();
            assert.strictEqual(value.length, 6);
            assert.deepStrictEqual(value.map(s => s.name), ['containers', 'container 0', 'name', 'ports', 'ports 0', 'containerPort']);
        });
        // --- code lens
        test('CodeLens, evil provider', async () => {
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codelens_1.getCodeLensModel)(languageFeaturesService.codeLensProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.lenses.length, 1);
        });
        test('CodeLens, do not resolve a resolved lens', async () => {
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0), { command: 'id', title: 'Title' })];
                }
                resolveCodeLens() {
                    assert.ok(false, 'do not resolve');
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codelens_1.getCodeLensModel)(languageFeaturesService.codeLensProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.lenses.length, 1);
            const [data] = value.lenses;
            const symbol = await Promise.resolve(data.provider.resolveCodeLens(model, data.symbol, cancellation_1.CancellationToken.None));
            assert.strictEqual(symbol.command.id, 'id');
            assert.strictEqual(symbol.command.title, 'Title');
        });
        test('CodeLens, missing command', async () => {
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, codelens_1.getCodeLensModel)(languageFeaturesService.codeLensProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.lenses.length, 1);
            let [data] = value.lenses;
            const symbol = await Promise.resolve(data.provider.resolveCodeLens(model, data.symbol, cancellation_1.CancellationToken.None));
            assert.strictEqual(symbol.command.id, 'missing');
            assert.strictEqual(symbol.command.title, '!!MISSING: command!!');
        });
        // --- definition
        test('Definition, data conversion', async () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, goToSymbol_1.getDefinitionsAtPosition)(languageFeaturesService.definitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            let [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.strictEqual(entry.uri.toString(), model.uri.toString());
        });
        test('Definition, one or many', async () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 1, 1, 1))];
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(model.uri, new types.Range(2, 1, 1, 1));
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getDefinitionsAtPosition)(languageFeaturesService.definitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 2);
        });
        test('Definition, registration order', async () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(uri_1.URI.parse('far://first'), new types.Range(2, 3, 4, 5))];
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(uri_1.URI.parse('far://second'), new types.Range(1, 2, 3, 4));
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getDefinitionsAtPosition)(languageFeaturesService.definitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 2);
            // let [first, second] = value;
            assert.strictEqual(value[0].uri.authority, 'second');
            assert.strictEqual(value[1].uri.authority, 'first');
        });
        test('Definition, evil provider', async () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    throw new Error('evil provider');
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(model.uri, new types.Range(1, 1, 1, 1));
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getDefinitionsAtPosition)(languageFeaturesService.definitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
        });
        // -- declaration
        test('Declaration, data conversion', async () => {
            disposables.push(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDeclaration() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, goToSymbol_1.getDeclarationsAtPosition)(languageFeaturesService.declarationProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            let [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.strictEqual(entry.uri.toString(), model.uri.toString());
        });
        // --- implementation
        test('Implementation, data conversion', async () => {
            disposables.push(extHost.registerImplementationProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideImplementation() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, goToSymbol_1.getImplementationsAtPosition)(languageFeaturesService.implementationProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            let [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.strictEqual(entry.uri.toString(), model.uri.toString());
        });
        // --- type definition
        test('Type Definition, data conversion', async () => {
            disposables.push(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideTypeDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, goToSymbol_1.getTypeDefinitionsAtPosition)(languageFeaturesService.typeDefinitionProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            let [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.strictEqual(entry.uri.toString(), model.uri.toString());
        });
        // --- extra info
        test('HoverProvider, word range at pos', async () => {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello');
                }
            }));
            await rpcProtocol.sync();
            (0, getHover_1.getHoverPromise)(languageFeaturesService.hoverProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None).then(value => {
                assert.strictEqual(value.length, 1);
                let [entry] = value;
                assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
            });
        });
        test('HoverProvider, given range', async () => {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello', new types.Range(3, 0, 8, 7));
                }
            }));
            await rpcProtocol.sync();
            (0, getHover_1.getHoverPromise)(languageFeaturesService.hoverProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None).then(value => {
                assert.strictEqual(value.length, 1);
                let [entry] = value;
                assert.deepStrictEqual(entry.range, { startLineNumber: 4, startColumn: 1, endLineNumber: 9, endColumn: 8 });
            });
        });
        test('HoverProvider, registration order', async () => {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('registered first');
                }
            }));
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('registered second');
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, getHover_1.getHoverPromise)(languageFeaturesService.hoverProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 2);
            let [first, second] = value;
            assert.strictEqual(first.contents[0].value, 'registered second');
            assert.strictEqual(second.contents[0].value, 'registered first');
        });
        test('HoverProvider, evil provider', async () => {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello');
                }
            }));
            await rpcProtocol.sync();
            (0, getHover_1.getHoverPromise)(languageFeaturesService.hoverProvider, model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None).then(value => {
                assert.strictEqual(value.length, 1);
            });
        });
        // --- occurrences
        test('Occurrences, data conversion', async () => {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, wordHighlighter_1.getOccurrencesAtPosition)(languageFeaturesService.documentHighlightProvider, model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
            assert.strictEqual(entry.kind, languages.DocumentHighlightKind.Text);
        });
        test('Occurrences, order 1/2', async () => {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [];
                }
            }));
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, wordHighlighter_1.getOccurrencesAtPosition)(languageFeaturesService.documentHighlightProvider, model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
            assert.strictEqual(entry.kind, languages.DocumentHighlightKind.Text);
        });
        test('Occurrences, order 2/2', async () => {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 2))];
                }
            }));
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, wordHighlighter_1.getOccurrencesAtPosition)(languageFeaturesService.documentHighlightProvider, model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [entry] = value;
            assert.deepStrictEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 3 });
            assert.strictEqual(entry.kind, languages.DocumentHighlightKind.Text);
        });
        test('Occurrences, evil provider', async () => {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, wordHighlighter_1.getOccurrencesAtPosition)(languageFeaturesService.documentHighlightProvider, model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
        });
        // --- references
        test('References, registration order', async () => {
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(uri_1.URI.parse('far://register/first'), new types.Range(0, 0, 0, 0))];
                }
            }));
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(uri_1.URI.parse('far://register/second'), new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, goToSymbol_1.getReferencesAtPosition)(languageFeaturesService.referenceProvider, model, new position_1.Position(1, 2), false, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 2);
            let [first, second] = value;
            assert.strictEqual(first.uri.path, '/second');
            assert.strictEqual(second.uri.path, '/first');
        });
        test('References, data conversion', async () => {
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(model.uri, new types.Position(0, 0))];
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, goToSymbol_1.getReferencesAtPosition)(languageFeaturesService.referenceProvider, model, new position_1.Position(1, 2), false, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            let [item] = value;
            assert.deepStrictEqual(item.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
            assert.strictEqual(item.uri.toString(), model.uri.toString());
        });
        test('References, evil provider', async () => {
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(model.uri, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, goToSymbol_1.getReferencesAtPosition)(languageFeaturesService.referenceProvider, model, new position_1.Position(1, 2), false, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
        });
        // --- quick fix
        test('Quick Fix, command data conversion', async () => {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions() {
                    return [
                        { command: 'test1', title: 'Testing1' },
                        { command: 'test2', title: 'Testing2' }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const { validActions: actions } = await (0, codeAction_1.getCodeActions)(languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), { type: 1 /* languages.CodeActionTriggerType.Invoke */ }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 2);
            const [first, second] = actions;
            assert.strictEqual(first.action.title, 'Testing1');
            assert.strictEqual(first.action.command.id, 'test1');
            assert.strictEqual(second.action.title, 'Testing2');
            assert.strictEqual(second.action.command.id, 'test2');
        });
        test('Quick Fix, code action data conversion', async () => {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions() {
                    return [
                        {
                            title: 'Testing1',
                            command: { title: 'Testing1Command', command: 'test1' },
                            kind: types.CodeActionKind.Empty.append('test.scope')
                        }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const { validActions: actions } = await (0, codeAction_1.getCodeActions)(languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), { type: 1 /* languages.CodeActionTriggerType.Invoke */ }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 1);
            const [first] = actions;
            assert.strictEqual(first.action.title, 'Testing1');
            assert.strictEqual(first.action.command.title, 'Testing1Command');
            assert.strictEqual(first.action.command.id, 'test1');
            assert.strictEqual(first.action.kind, 'test.scope');
        });
        test('Cannot read property \'id\' of undefined, #29469', async () => {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    return [
                        undefined,
                        null,
                        { command: 'test', title: 'Testing' }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const { validActions: actions } = await (0, codeAction_1.getCodeActions)(languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), { type: 1 /* languages.CodeActionTriggerType.Invoke */ }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 1);
        });
        test('Quick Fix, evil provider', async () => {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    return [{ command: 'test', title: 'Testing' }];
                }
            }));
            await rpcProtocol.sync();
            const { validActions: actions } = await (0, codeAction_1.getCodeActions)(languageFeaturesService.codeActionProvider, model, model.getFullModelRange(), { type: 1 /* languages.CodeActionTriggerType.Invoke */ }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 1);
        });
        // --- navigate types
        test('Navigate types, evil provider', async () => {
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('testing', types.SymbolKind.Array, new types.Range(0, 0, 1, 1))];
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, search_1.getWorkspaceSymbols)('');
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.symbol.name, 'testing');
        });
        test('Navigate types, de-duplicate results', async () => {
            const uri = uri_1.URI.from({ scheme: 'foo', path: '/some/path' });
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('ONE', types.SymbolKind.Array, undefined, new types.Location(uri, new types.Range(0, 0, 1, 1)))];
                }
            }));
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('ONE', types.SymbolKind.Array, undefined, new types.Location(uri, new types.Range(0, 0, 1, 1)))]; // get de-duped
                }
            }));
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('ONE', types.SymbolKind.Array, undefined, new types.Location(uri, undefined))]; // NO dedupe because of resolve
                }
                resolveWorkspaceSymbol(a) {
                    return a;
                }
            }));
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('ONE', types.SymbolKind.Struct, undefined, new types.Location(uri, new types.Range(0, 0, 1, 1)))]; // NO dedupe because of kind
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, search_1.getWorkspaceSymbols)('');
            assert.strictEqual(value.length, 3);
        });
        // --- rename
        test('Rename, evil provider 0/2', async () => {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    throw new class Foo {
                    };
                }
            }));
            await rpcProtocol.sync();
            try {
                await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
                throw Error();
            }
            catch (err) {
                // expected
            }
        });
        test('Rename, evil provider 1/2', async () => {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    throw Error('evil');
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            assert.strictEqual(value.rejectReason, 'evil');
        });
        test('Rename, evil provider 2/2', async () => {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideRenameEdits() {
                    throw Error('evil');
                }
            }));
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    let edit = new types.WorkspaceEdit();
                    edit.replace(model.uri, new types.Range(0, 0, 0, 0), 'testing');
                    return edit;
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            assert.strictEqual(value.edits.length, 1);
        });
        test('Rename, ordering', async () => {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideRenameEdits() {
                    let edit = new types.WorkspaceEdit();
                    edit.replace(model.uri, new types.Range(0, 0, 0, 0), 'testing');
                    edit.replace(model.uri, new types.Range(1, 0, 1, 0), 'testing');
                    return edit;
                }
            }));
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    return;
                }
            }));
            await rpcProtocol.sync();
            const value = await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            // least relevant rename provider
            assert.strictEqual(value.edits.length, 2);
        });
        test('Multiple RenameProviders don\'t respect all possible PrepareRename handlers, #98352', async function () {
            let called = [false, false, false, false];
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareRename(document, position) {
                    called[0] = true;
                    let range = document.getWordRangeAtPosition(position);
                    return range;
                }
                provideRenameEdits() {
                    called[1] = true;
                    return undefined;
                }
            }));
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareRename(document, position) {
                    called[2] = true;
                    return Promise.reject('Cannot rename this symbol2.');
                }
                provideRenameEdits() {
                    called[3] = true;
                    return undefined;
                }
            }));
            await rpcProtocol.sync();
            await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            assert.deepStrictEqual(called, [true, true, true, false]);
        });
        test('Multiple RenameProviders don\'t respect all possible PrepareRename handlers, #98352', async function () {
            let called = [false, false, false];
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                prepareRename(document, position) {
                    called[0] = true;
                    let range = document.getWordRangeAtPosition(position);
                    return range;
                }
                provideRenameEdits() {
                    called[1] = true;
                    return undefined;
                }
            }));
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits(document, position, newName) {
                    called[2] = true;
                    return new types.WorkspaceEdit();
                }
            }));
            await rpcProtocol.sync();
            await (0, rename_1.rename)(languageFeaturesService.renameProvider, model, new position_1.Position(1, 1), 'newName');
            // first provider has NO prepare which means it is taken by default
            assert.deepStrictEqual(called, [false, false, true]);
        });
        // --- parameter hints
        test('Parameter Hints, order', async () => {
            disposables.push(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    return undefined;
                }
            }, []));
            disposables.push(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    return {
                        signatures: [],
                        activeParameter: 0,
                        activeSignature: 0
                    };
                }
            }, []));
            await rpcProtocol.sync();
            const value = await (0, provideSignatureHelp_1.provideSignatureHelp)(languageFeaturesService.signatureHelpProvider, model, new position_1.Position(1, 1), { triggerKind: languages.SignatureHelpTriggerKind.Invoke, isRetrigger: false }, cancellation_1.CancellationToken.None);
            assert.ok(value);
        });
        test('Parameter Hints, evil provider', async () => {
            disposables.push(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    throw new Error('evil');
                }
            }, []));
            await rpcProtocol.sync();
            const value = await (0, provideSignatureHelp_1.provideSignatureHelp)(languageFeaturesService.signatureHelpProvider, model, new position_1.Position(1, 1), { triggerKind: languages.SignatureHelpTriggerKind.Invoke, isRetrigger: false }, cancellation_1.CancellationToken.None);
            assert.strictEqual(value, undefined);
        });
        // --- suggestions
        test('Suggest, order 1/3', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing1')];
                }
            }, []));
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing2')];
                }
            }, []));
            await rpcProtocol.sync();
            const { items } = await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */)));
            assert.strictEqual(items.length, 1);
            assert.strictEqual(items[0].completion.insertText, 'testing2');
        });
        test('Suggest, order 2/3', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('weak-selector')]; // weaker selector but result
                }
            }, []));
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return []; // stronger selector but not a good result;
                }
            }, []));
            await rpcProtocol.sync();
            const { items } = await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */)));
            assert.strictEqual(items.length, 1);
            assert.strictEqual(items[0].completion.insertText, 'weak-selector');
        });
        test('Suggest, order 2/3', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('strong-1')];
                }
            }, []));
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('strong-2')];
                }
            }, []));
            await rpcProtocol.sync();
            const { items } = await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */)));
            assert.strictEqual(items.length, 2);
            assert.strictEqual(items[0].completion.insertText, 'strong-1'); // sort by label
            assert.strictEqual(items[1].completion.insertText, 'strong-2');
        });
        test('Suggest, evil provider', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    throw new Error('evil');
                }
            }, []));
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing')];
                }
            }, []));
            await rpcProtocol.sync();
            const { items } = await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */)));
            assert.strictEqual(items[0].container.incomplete, false);
        });
        test('Suggest, CompletionList', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return new types.CompletionList([new types.CompletionItem('hello')], true);
                }
            }, []));
            await rpcProtocol.sync();
            await (0, suggest_1.provideSuggestionItems)(languageFeaturesService.completionProvider, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* languages.CompletionItemKind.Snippet */))).then(model => {
                assert.strictEqual(model.items[0].container.incomplete, true);
            });
        });
        // --- format
        const NullWorkerService = new class extends (0, mock_1.mock)() {
            computeMoreMinimalEdits(resource, edits) {
                return Promise.resolve((0, types_1.withNullAsUndefined)(edits));
            }
        };
        test('Format Doc, data conversion', async () => {
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing'), types.TextEdit.setEndOfLine(types.EndOfLine.LF)];
                }
            }));
            await rpcProtocol.sync();
            let value = (await (0, format_1.getDocumentFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 2);
            let [first, second] = value;
            assert.strictEqual(first.text, 'testing');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
            assert.strictEqual(second.eol, 0 /* EndOfLineSequence.LF */);
            assert.strictEqual(second.text, '');
            assert.deepStrictEqual(second.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Doc, evil provider', async () => {
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    throw new Error('evil');
                }
            }));
            await rpcProtocol.sync();
            return (0, format_1.getDocumentFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None);
        });
        test('Format Doc, order', async () => {
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return undefined;
                }
            }));
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing')];
                }
            }));
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return undefined;
                }
            }));
            await rpcProtocol.sync();
            let value = (await (0, format_1.getDocumentFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            let [first] = value;
            assert.strictEqual(first.text, 'testing');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Range, data conversion', async () => {
            disposables.push(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing')];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, format_1.getDocumentRangeFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.text, 'testing');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Range, + format_doc', async () => {
            disposables.push(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'range')];
                }
            }));
            disposables.push(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(2, 3, 4, 5), 'range2')];
                }
            }));
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 1, 1), 'doc')];
                }
            }));
            await rpcProtocol.sync();
            const value = (await (0, format_1.getDocumentRangeFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.text, 'range2');
            assert.strictEqual(first.range.startLineNumber, 3);
            assert.strictEqual(first.range.startColumn, 4);
            assert.strictEqual(first.range.endLineNumber, 5);
            assert.strictEqual(first.range.endColumn, 6);
        });
        test('Format Range, evil provider', async () => {
            disposables.push(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    throw new Error('evil');
                }
            }));
            await rpcProtocol.sync();
            return (0, format_1.getDocumentRangeFormattingEditsUntilResult)(NullWorkerService, languageFeaturesService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None);
        });
        test('Format on Type, data conversion', async () => {
            disposables.push(extHost.registerOnTypeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideOnTypeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), arguments[2])];
                }
            }, [';']));
            await rpcProtocol.sync();
            const value = (await (0, format_1.getOnTypeFormattingEdits)(NullWorkerService, languageFeaturesService, model, new position_1.Position(1, 1), ';', { insertSpaces: true, tabSize: 2 }, cancellation_1.CancellationToken.None));
            assert.strictEqual(value.length, 1);
            const [first] = value;
            assert.strictEqual(first.text, ';');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Links, data conversion', async () => {
            var _b;
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    const link = new types.DocumentLink(new types.Range(0, 0, 1, 1), uri_1.URI.parse('foo:bar#3'));
                    link.tooltip = 'tooltip';
                    return [link];
                }
            }));
            await rpcProtocol.sync();
            let { links } = await (0, getLinks_1.getLinks)(languageFeaturesService.linkProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(links.length, 1);
            let [first] = links;
            assert.strictEqual((_b = first.url) === null || _b === void 0 ? void 0 : _b.toString(), 'foo:bar#3');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 2 });
            assert.strictEqual(first.tooltip, 'tooltip');
        });
        test('Links, evil provider', async () => {
            var _b;
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    return [new types.DocumentLink(new types.Range(0, 0, 1, 1), uri_1.URI.parse('foo:bar#3'))];
                }
            }));
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    throw new Error();
                }
            }));
            await rpcProtocol.sync();
            let { links } = await (0, getLinks_1.getLinks)(languageFeaturesService.linkProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(links.length, 1);
            let [first] = links;
            assert.strictEqual((_b = first.url) === null || _b === void 0 ? void 0 : _b.toString(), 'foo:bar#3');
            assert.deepStrictEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 2 });
        });
        test('Document colors, data conversion', async () => {
            disposables.push(extHost.registerColorProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentColors() {
                    return [new types.ColorInformation(new types.Range(0, 0, 0, 20), new types.Color(0.1, 0.2, 0.3, 0.4))];
                }
                provideColorPresentations(color, context) {
                    return [];
                }
            }));
            await rpcProtocol.sync();
            let value = await (0, color_1.getColors)(languageFeaturesService.colorProvider, model, cancellation_1.CancellationToken.None);
            assert.strictEqual(value.length, 1);
            let [first] = value;
            assert.deepStrictEqual(first.colorInfo.color, { red: 0.1, green: 0.2, blue: 0.3, alpha: 0.4 });
            assert.deepStrictEqual(first.colorInfo.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 21 });
        });
        // -- selection ranges
        test('Selection Ranges, data conversion', async () => {
            disposables.push(extHost.registerSelectionRangeProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSelectionRanges() {
                    return [
                        new types.SelectionRange(new types.Range(0, 10, 0, 18), new types.SelectionRange(new types.Range(0, 2, 0, 20))),
                    ];
                }
            }));
            await rpcProtocol.sync();
            (0, smartSelect_1.provideSelectionRanges)(languageFeaturesService.selectionRangeProvider, model, [new position_1.Position(1, 17)], { selectLeadingAndTrailingWhitespace: true }, cancellation_1.CancellationToken.None).then(ranges => {
                assert.strictEqual(ranges.length, 1);
                assert.ok(ranges[0].length >= 2);
            });
        });
        test('Selection Ranges, bad data', async () => {
            try {
                let _a = new types.SelectionRange(new types.Range(0, 10, 0, 18), new types.SelectionRange(new types.Range(0, 11, 0, 18)));
                assert.ok(false, String(_a));
            }
            catch (err) {
                assert.ok(true);
            }
        });
    });
});
//# sourceMappingURL=extHostLanguageFeatures.test.js.map