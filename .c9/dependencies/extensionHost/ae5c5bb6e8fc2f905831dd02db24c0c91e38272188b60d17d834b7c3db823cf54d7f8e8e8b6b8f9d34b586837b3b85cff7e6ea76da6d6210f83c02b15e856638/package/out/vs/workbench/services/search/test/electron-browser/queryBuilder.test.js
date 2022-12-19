define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/environment/common/environment", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/workspace/common/workspace", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/workbench/services/search/test/browser/queryBuilder.test", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/services/path/common/pathService", "vs/platform/workspace/test/common/testWorkspace"], function (require, exports, configuration_1, testConfigurationService_1, environment_1, instantiationServiceMock_1, workspace_1, queryBuilder_1, workbenchTestServices_1, queryBuilder_test_1, workbenchTestServices_2, pathService_1, testWorkspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEFAULT_EDITOR_CONFIG = {};
    const DEFAULT_USER_CONFIG = { useRipgrep: true, useIgnoreFiles: true, useGlobalIgnoreFiles: true, useParentIgnoreFiles: true };
    suite('QueryBuilder', () => {
        const ROOT_1 = (0, queryBuilder_test_1.fixPath)('/foo/root1');
        const ROOT_1_URI = (0, queryBuilder_test_1.getUri)(ROOT_1);
        let instantiationService;
        let queryBuilder;
        let mockConfigService;
        let mockContextService;
        let mockWorkspace;
        setup(async () => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            mockConfigService = new testConfigurationService_1.TestConfigurationService();
            mockConfigService.setUserConfiguration('search', DEFAULT_USER_CONFIG);
            mockConfigService.setUserConfiguration('editor', DEFAULT_EDITOR_CONFIG);
            instantiationService.stub(configuration_1.IConfigurationService, mockConfigService);
            mockContextService = new workbenchTestServices_2.TestContextService();
            mockWorkspace = new testWorkspace_1.Workspace('workspace', [(0, workspace_1.toWorkspaceFolder)(ROOT_1_URI)]);
            mockContextService.setWorkspace(mockWorkspace);
            instantiationService.stub(workspace_1.IWorkspaceContextService, mockContextService);
            instantiationService.stub(environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            instantiationService.stub(pathService_1.IPathService, new workbenchTestServices_1.TestNativePathService());
            queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            await new Promise(resolve => setTimeout(resolve, 5)); // Wait for IPathService.userHome to resolve
        });
        suite('parseSearchPaths', () => {
            function testIncludes(includePattern, expectedResult) {
                (0, queryBuilder_test_1.assertEqualSearchPathResults)(queryBuilder.parseSearchPaths(includePattern), expectedResult, includePattern);
            }
            function testIncludesDataItem([includePattern, expectedResult]) {
                testIncludes(includePattern, expectedResult);
            }
            test('includes with tilde', () => {
                const userHome = workbenchTestServices_1.TestEnvironmentService.userHome;
                const cases = [
                    [
                        '~/foo/bar',
                        {
                            searchPaths: [{ searchPath: (0, queryBuilder_test_1.getUri)(userHome.fsPath, '/foo/bar') }]
                        }
                    ],
                    [
                        '~/foo/bar, a',
                        {
                            searchPaths: [{ searchPath: (0, queryBuilder_test_1.getUri)(userHome.fsPath, '/foo/bar') }],
                            pattern: (0, queryBuilder_test_1.patternsToIExpression)(...(0, queryBuilder_test_1.globalGlob)('a'))
                        }
                    ],
                    [
                        (0, queryBuilder_test_1.fixPath)('/foo/~/bar'),
                        {
                            searchPaths: [{ searchPath: (0, queryBuilder_test_1.getUri)('/foo/~/bar') }]
                        }
                    ],
                ];
                cases.forEach(testIncludesDataItem);
            });
        });
    });
});
//# sourceMappingURL=queryBuilder.test.js.map