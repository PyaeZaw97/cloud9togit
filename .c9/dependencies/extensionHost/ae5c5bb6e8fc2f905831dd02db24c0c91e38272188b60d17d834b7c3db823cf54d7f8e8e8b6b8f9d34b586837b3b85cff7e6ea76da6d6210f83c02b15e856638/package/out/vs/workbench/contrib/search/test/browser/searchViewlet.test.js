define(["require", "exports", "assert", "vs/base/common/uri", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/services/search/common/search", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/contrib/search/common/searchModel", "vs/base/common/platform", "vs/workbench/test/common/workbenchTestServices", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/common/modes/testLanguageConfigurationService"], function (require, exports, assert, uri_1, model_1, modelService_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, search_1, workspace_1, testWorkspace_1, searchModel_1, platform_1, workbenchTestServices_1, themeService_1, testThemeService_1, fileService_1, log_1, uriIdentity_1, uriIdentityService_1, languageConfigurationRegistry_1, testLanguageConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Search - Viewlet', () => {
        let instantiation;
        setup(() => {
            instantiation = new instantiationServiceMock_1.TestInstantiationService();
            instantiation.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, testLanguageConfigurationService_1.TestLanguageConfigurationService);
            instantiation.stub(model_1.IModelService, stubModelService(instantiation));
            instantiation.set(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService(testWorkspace_1.TestWorkspace));
            instantiation.stub(uriIdentity_1.IUriIdentityService, new uriIdentityService_1.UriIdentityService(new fileService_1.FileService(new log_1.NullLogService())));
        });
        test('Data Source', function () {
            const result = instantiation.createInstance(searchModel_1.SearchResult, null);
            result.query = {
                type: 2 /* QueryType.Text */,
                contentPattern: { pattern: 'foo' },
                folderQueries: [{
                        folder: uri_1.URI.parse('file://c:/')
                    }]
            };
            result.add([{
                    resource: uri_1.URI.parse('file:///c:/foo'),
                    results: [{
                            preview: {
                                text: 'bar',
                                matches: {
                                    startLineNumber: 0,
                                    startColumn: 0,
                                    endLineNumber: 0,
                                    endColumn: 1
                                }
                            },
                            ranges: {
                                startLineNumber: 1,
                                startColumn: 0,
                                endLineNumber: 1,
                                endColumn: 1
                            }
                        }]
                }]);
            const fileMatch = result.matches()[0];
            const lineMatch = fileMatch.matches()[0];
            assert.strictEqual(fileMatch.id(), 'file:///c%3A/foo');
            assert.strictEqual(lineMatch.id(), 'file:///c%3A/foo>[2,1 -> 2,2]b');
        });
        test('Comparer', () => {
            const fileMatch1 = aFileMatch(platform_1.isWindows ? 'C:\\foo' : '/c/foo');
            const fileMatch2 = aFileMatch(platform_1.isWindows ? 'C:\\with\\path' : '/c/with/path');
            const fileMatch3 = aFileMatch(platform_1.isWindows ? 'C:\\with\\path\\foo' : '/c/with/path/foo');
            const lineMatch1 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(0, 1, 1));
            const lineMatch2 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1));
            const lineMatch3 = new searchModel_1.Match(fileMatch1, ['bar'], new search_1.OneLineRange(0, 1, 1), new search_1.OneLineRange(2, 1, 1));
            assert((0, searchModel_1.searchMatchComparer)(fileMatch1, fileMatch2) < 0);
            assert((0, searchModel_1.searchMatchComparer)(fileMatch2, fileMatch1) > 0);
            assert((0, searchModel_1.searchMatchComparer)(fileMatch1, fileMatch1) === 0);
            assert((0, searchModel_1.searchMatchComparer)(fileMatch2, fileMatch3) < 0);
            assert((0, searchModel_1.searchMatchComparer)(lineMatch1, lineMatch2) < 0);
            assert((0, searchModel_1.searchMatchComparer)(lineMatch2, lineMatch1) > 0);
            assert((0, searchModel_1.searchMatchComparer)(lineMatch2, lineMatch3) === 0);
        });
        test('Advanced Comparer', () => {
            const fileMatch1 = aFileMatch(platform_1.isWindows ? 'C:\\with\\path\\foo10' : '/c/with/path/foo10');
            const fileMatch2 = aFileMatch(platform_1.isWindows ? 'C:\\with\\path2\\foo1' : '/c/with/path2/foo1');
            const fileMatch3 = aFileMatch(platform_1.isWindows ? 'C:\\with\\path2\\bar.a' : '/c/with/path2/bar.a');
            const fileMatch4 = aFileMatch(platform_1.isWindows ? 'C:\\with\\path2\\bar.b' : '/c/with/path2/bar.b');
            // By default, path < path2
            assert((0, searchModel_1.searchMatchComparer)(fileMatch1, fileMatch2) < 0);
            // By filenames, foo10 > foo1
            assert((0, searchModel_1.searchMatchComparer)(fileMatch1, fileMatch2, "fileNames" /* SearchSortOrder.FileNames */) > 0);
            // By type, bar.a < bar.b
            assert((0, searchModel_1.searchMatchComparer)(fileMatch3, fileMatch4, "type" /* SearchSortOrder.Type */) < 0);
        });
        function aFileMatch(path, searchResult, ...lineMatches) {
            const rawMatch = {
                resource: uri_1.URI.file(path),
                results: lineMatches
            };
            return instantiation.createInstance(searchModel_1.FileMatch, null, null, null, searchResult, rawMatch);
        }
        function stubModelService(instantiationService) {
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            return instantiationService.createInstance(modelService_1.ModelService);
        }
    });
});
//# sourceMappingURL=searchViewlet.test.js.map