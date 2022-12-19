define(["require", "exports", "assert", "sinon", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/search/common/searchModel", "vs/base/common/uri", "vs/workbench/services/search/common/search", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/editor/common/core/range", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelService", "vs/editor/common/services/model", "vs/workbench/contrib/search/common/replace", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/files/common/fileService", "vs/platform/log/common/log"], function (require, exports, assert, sinon, instantiationServiceMock_1, searchModel_1, uri_1, search_1, telemetry_1, telemetryUtils_1, range_1, configuration_1, testConfigurationService_1, modelService_1, model_1, replace_1, themeService_1, testThemeService_1, uriIdentity_1, uriIdentityService_1, fileService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const lineOneRange = new search_1.OneLineRange(1, 0, 1);
    suite('SearchResult', () => {
        let instantiationService;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(model_1.IModelService, stubModelService(instantiationService));
            instantiationService.stub(uriIdentity_1.IUriIdentityService, new uriIdentityService_1.UriIdentityService(new fileService_1.FileService(new log_1.NullLogService())));
            instantiationService.stubPromise(replace_1.IReplaceService, {});
            instantiationService.stubPromise(replace_1.IReplaceService, 'replace', null);
        });
        test('Line Match', function () {
            const fileMatch = aFileMatch('folder/file.txt', null);
            const lineMatch = new searchModel_1.Match(fileMatch, ['0 foo bar'], new search_1.OneLineRange(0, 2, 5), new search_1.OneLineRange(1, 0, 5));
            assert.strictEqual(lineMatch.text(), '0 foo bar');
            assert.strictEqual(lineMatch.range().startLineNumber, 2);
            assert.strictEqual(lineMatch.range().endLineNumber, 2);
            assert.strictEqual(lineMatch.range().startColumn, 1);
            assert.strictEqual(lineMatch.range().endColumn, 6);
            assert.strictEqual(lineMatch.id(), 'file:///folder/file.txt>[2,1 -> 2,6]foo');
            assert.strictEqual(lineMatch.fullMatchText(), 'foo');
            assert.strictEqual(lineMatch.fullMatchText(true), '0 foo bar');
        });
        test('Line Match - Remove', function () {
            const fileMatch = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo bar', new search_1.OneLineRange(1, 0, 3)));
            const lineMatch = fileMatch.matches()[0];
            fileMatch.remove(lineMatch);
            assert.strictEqual(fileMatch.matches().length, 0);
        });
        test('File Match', function () {
            let fileMatch = aFileMatch('folder/file.txt');
            assert.strictEqual(fileMatch.matches().length, 0);
            assert.strictEqual(fileMatch.resource.toString(), 'file:///folder/file.txt');
            assert.strictEqual(fileMatch.name(), 'file.txt');
            fileMatch = aFileMatch('file.txt');
            assert.strictEqual(fileMatch.matches().length, 0);
            assert.strictEqual(fileMatch.resource.toString(), 'file:///file.txt');
            assert.strictEqual(fileMatch.name(), 'file.txt');
        });
        test('File Match: Select an existing match', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            testObject.setSelectedMatch(testObject.matches()[0]);
            assert.strictEqual(testObject.matches()[0], testObject.getSelectedMatch());
        });
        test('File Match: Select non existing match', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            const target = testObject.matches()[0];
            testObject.remove(target);
            testObject.setSelectedMatch(target);
            assert.strictEqual(testObject.getSelectedMatch(), null);
        });
        test('File Match: isSelected return true for selected match', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            const target = testObject.matches()[0];
            testObject.setSelectedMatch(target);
            assert.ok(testObject.isMatchSelected(target));
        });
        test('File Match: isSelected return false for un-selected match', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            testObject.setSelectedMatch(testObject.matches()[0]);
            assert.ok(!testObject.isMatchSelected(testObject.matches()[1]));
        });
        test('File Match: unselect', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            testObject.setSelectedMatch(testObject.matches()[0]);
            testObject.setSelectedMatch(null);
            assert.strictEqual(null, testObject.getSelectedMatch());
        });
        test('File Match: unselect when not selected', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            testObject.setSelectedMatch(null);
            assert.strictEqual(null, testObject.getSelectedMatch());
        });
        test('Alle Drei Zusammen', function () {
            const searchResult = instantiationService.createInstance(searchModel_1.SearchResult, null);
            const fileMatch = aFileMatch('far/boo', searchResult);
            const lineMatch = new searchModel_1.Match(fileMatch, ['foo bar'], new search_1.OneLineRange(0, 0, 3), new search_1.OneLineRange(1, 0, 3));
            assert(lineMatch.parent() === fileMatch);
            assert(fileMatch.parent() === searchResult);
        });
        test('Adding a raw match will add a file match with line matches', function () {
            const testObject = aSearchResult();
            const target = [aRawMatch('file://c:/', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11)), new search_1.TextSearchMatch('preview 2', lineOneRange))];
            testObject.add(target);
            assert.strictEqual(3, testObject.count());
            const actual = testObject.matches();
            assert.strictEqual(1, actual.length);
            assert.strictEqual('file://c:/', actual[0].resource.toString());
            const actuaMatches = actual[0].matches();
            assert.strictEqual(3, actuaMatches.length);
            assert.strictEqual('preview 1', actuaMatches[0].text());
            assert.ok(new range_1.Range(2, 2, 2, 5).equalsRange(actuaMatches[0].range()));
            assert.strictEqual('preview 1', actuaMatches[1].text());
            assert.ok(new range_1.Range(2, 5, 2, 12).equalsRange(actuaMatches[1].range()));
            assert.strictEqual('preview 2', actuaMatches[2].text());
            assert.ok(new range_1.Range(2, 1, 2, 2).equalsRange(actuaMatches[2].range()));
        });
        test('Adding multiple raw matches', function () {
            const testObject = aSearchResult();
            const target = [
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11))),
                aRawMatch('file://c:/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ];
            testObject.add(target);
            assert.strictEqual(3, testObject.count());
            const actual = testObject.matches();
            assert.strictEqual(2, actual.length);
            assert.strictEqual('file://c:/1', actual[0].resource.toString());
            let actuaMatches = actual[0].matches();
            assert.strictEqual(2, actuaMatches.length);
            assert.strictEqual('preview 1', actuaMatches[0].text());
            assert.ok(new range_1.Range(2, 2, 2, 5).equalsRange(actuaMatches[0].range()));
            assert.strictEqual('preview 1', actuaMatches[1].text());
            assert.ok(new range_1.Range(2, 5, 2, 12).equalsRange(actuaMatches[1].range()));
            actuaMatches = actual[1].matches();
            assert.strictEqual(1, actuaMatches.length);
            assert.strictEqual('preview 2', actuaMatches[0].text());
            assert.ok(new range_1.Range(2, 1, 2, 2).equalsRange(actuaMatches[0].range()));
        });
        test('Dispose disposes matches', function () {
            const target1 = sinon.spy();
            const target2 = sinon.spy();
            const testObject = aSearchResult();
            testObject.add([
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', lineOneRange)),
                aRawMatch('file://c:/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ]);
            testObject.matches()[0].onDispose(target1);
            testObject.matches()[1].onDispose(target2);
            testObject.dispose();
            assert.ok(testObject.isEmpty());
            assert.ok(target1.calledOnce);
            assert.ok(target2.calledOnce);
        });
        test('remove triggers change event', function () {
            const target = sinon.spy();
            const testObject = aSearchResult();
            testObject.add([
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            const objectToRemove = testObject.matches()[0];
            testObject.onChange(target);
            testObject.remove(objectToRemove);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual([{ elements: [objectToRemove], removed: true }], target.args[0]);
        });
        test('remove array triggers change event', function () {
            const target = sinon.spy();
            const testObject = aSearchResult();
            testObject.add([
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', lineOneRange)),
                aRawMatch('file://c:/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ]);
            const arrayToRemove = testObject.matches();
            testObject.onChange(target);
            testObject.remove(arrayToRemove);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual([{ elements: arrayToRemove, removed: true }], target.args[0]);
        });
        test('remove triggers change event', function () {
            const target = sinon.spy();
            const testObject = aSearchResult();
            testObject.add([
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            const objectToRemove = testObject.matches()[0];
            testObject.onChange(target);
            testObject.remove(objectToRemove);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual([{ elements: [objectToRemove], removed: true }], target.args[0]);
        });
        test('Removing all line matches and adding back will add file back to result', function () {
            const testObject = aSearchResult();
            testObject.add([
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            const target = testObject.matches()[0];
            const matchToRemove = target.matches()[0];
            target.remove(matchToRemove);
            assert.ok(testObject.isEmpty());
            target.add(matchToRemove, true);
            assert.strictEqual(1, testObject.fileCount());
            assert.strictEqual(target, testObject.matches()[0]);
        });
        test('replace should remove the file match', function () {
            const voidPromise = Promise.resolve(null);
            instantiationService.stub(replace_1.IReplaceService, 'replace', voidPromise);
            const testObject = aSearchResult();
            testObject.add([
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            testObject.replace(testObject.matches()[0]);
            return voidPromise.then(() => assert.ok(testObject.isEmpty()));
        });
        test('replace should trigger the change event', function () {
            const target = sinon.spy();
            const voidPromise = Promise.resolve(null);
            instantiationService.stub(replace_1.IReplaceService, 'replace', voidPromise);
            const testObject = aSearchResult();
            testObject.add([
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            testObject.onChange(target);
            const objectToRemove = testObject.matches()[0];
            testObject.replace(objectToRemove);
            return voidPromise.then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual([{ elements: [objectToRemove], removed: true }], target.args[0]);
            });
        });
        test('replaceAll should remove all file matches', function () {
            const voidPromise = Promise.resolve(null);
            instantiationService.stubPromise(replace_1.IReplaceService, 'replace', voidPromise);
            const testObject = aSearchResult();
            testObject.add([
                aRawMatch('file://c:/1', new search_1.TextSearchMatch('preview 1', lineOneRange)),
                aRawMatch('file://c:/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ]);
            testObject.replaceAll(null);
            return voidPromise.then(() => assert.ok(testObject.isEmpty()));
        });
        function aFileMatch(path, searchResult, ...lineMatches) {
            const rawMatch = {
                resource: uri_1.URI.file('/' + path),
                results: lineMatches
            };
            return instantiationService.createInstance(searchModel_1.FileMatch, null, null, null, searchResult, rawMatch);
        }
        function aSearchResult() {
            const searchModel = instantiationService.createInstance(searchModel_1.SearchModel);
            searchModel.searchResult.query = { type: 1, folderQueries: [{ folder: uri_1.URI.parse('file://c:/') }] };
            return searchModel.searchResult;
        }
        function aRawMatch(resource, ...results) {
            return { resource: uri_1.URI.parse(resource), results };
        }
        function stubModelService(instantiationService) {
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            return instantiationService.createInstance(modelService_1.ModelService);
        }
    });
});
//# sourceMappingURL=searchResult.test.js.map