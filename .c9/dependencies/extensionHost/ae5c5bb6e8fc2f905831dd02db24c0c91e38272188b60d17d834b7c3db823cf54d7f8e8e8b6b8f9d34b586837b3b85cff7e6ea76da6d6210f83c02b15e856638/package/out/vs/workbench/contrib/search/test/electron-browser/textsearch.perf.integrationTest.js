/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "minimist", "vs/base/common/event", "vs/base/common/path", "vs/base/common/uri", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/services/languageService", "vs/editor/common/services/textResourceConfiguration", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/workspace/common/workspace", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeaturesService", "vs/base/common/observableValue", "vs/workbench/contrib/search/browser/search.contribution"], function (require, exports, assert, fs, minimist, event_1, path, uri_1, model_1, modelService_1, languageService_1, textResourceConfiguration_1, testLanguageConfigurationService_1, configuration_1, testConfigurationService_1, dialogs_1, testDialogService_1, environment_1, descriptors_1, instantiationService_1, serviceCollection_1, log_1, notification_1, testNotificationService_1, telemetry_1, testThemeService_1, undoRedo_1, undoRedoService_1, workspace_1, testWorkspace_1, queryBuilder_1, searchModel_1, editorGroupsService_1, editorService_1, untitledTextEditorService_1, workbenchTestServices_1, workbenchTestServices_2, workbenchTestServices_3, languageFeatureDebounce_1, languageFeaturesService_1, observableValue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // declare var __dirname: string;
    // Checkout sources to run against:
    // git clone --separate-git-dir=testGit --no-checkout --single-branch https://chromium.googlesource.com/chromium/src testWorkspace
    // cd testWorkspace; git checkout 39a7f93d67f7
    // Run from repository root folder with (test.bat on Windows): ./scripts/test-int-mocha.sh --grep TextSearch.performance --timeout 500000 --testWorkspace <path>
    suite.skip('TextSearch performance (integration)', () => {
        test('Measure', () => {
            if (process.env['VSCODE_PID']) {
                return undefined; // TODO@Rob find out why test fails when run from within VS Code
            }
            const n = 3;
            const argv = minimist(process.argv);
            const testWorkspaceArg = argv['testWorkspace'];
            const testWorkspacePath = testWorkspaceArg ? path.resolve(testWorkspaceArg) : __dirname;
            if (!fs.existsSync(testWorkspacePath)) {
                throw new Error(`--testWorkspace doesn't exist`);
            }
            const telemetryService = new TestTelemetryService();
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            const textResourcePropertiesService = new workbenchTestServices_2.TestTextResourcePropertiesService(configurationService);
            const logService = new log_1.NullLogService();
            const dialogService = new testDialogService_1.TestDialogService();
            const notificationService = new testNotificationService_1.TestNotificationService();
            const undoRedoService = new undoRedoService_1.UndoRedoService(dialogService, notificationService);
            const instantiationService = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([telemetry_1.ITelemetryService, telemetryService], [configuration_1.IConfigurationService, configurationService], [textResourceConfiguration_1.ITextResourcePropertiesService, textResourcePropertiesService], [dialogs_1.IDialogService, dialogService], [notification_1.INotificationService, notificationService], [undoRedo_1.IUndoRedoService, undoRedoService], [
                model_1.IModelService,
                new modelService_1.ModelService(configurationService, textResourcePropertiesService, new testThemeService_1.TestThemeService(), logService, undoRedoService, new languageService_1.LanguageService(), new testLanguageConfigurationService_1.TestLanguageConfigurationService(), new languageFeatureDebounce_1.LanguageFeatureDebounceService(logService), new languageFeaturesService_1.LanguageFeaturesService()),
            ], [
                workspace_1.IWorkspaceContextService,
                new workbenchTestServices_2.TestContextService((0, testWorkspace_1.testWorkspace)(uri_1.URI.file(testWorkspacePath))),
            ], [editorService_1.IEditorService, new workbenchTestServices_1.TestEditorService()], [editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService()], [environment_1.IEnvironmentService, workbenchTestServices_3.TestEnvironmentService], [
                untitledTextEditorService_1.IUntitledTextEditorService,
                new descriptors_1.SyncDescriptor(untitledTextEditorService_1.UntitledTextEditorService),
            ], [log_1.ILogService, logService]));
            const queryOptions = {
                maxResults: 2048
            };
            const searchModel = instantiationService.createInstance(searchModel_1.SearchModel);
            function runSearch() {
                const queryBuilder = instantiationService.createInstance(queryBuilder_1.QueryBuilder);
                const query = queryBuilder.text({ pattern: 'static_library(' }, [uri_1.URI.file(testWorkspacePath)], queryOptions);
                // Wait for the 'searchResultsFinished' event, which is fired after the search() promise is resolved
                const onSearchResultsFinished = event_1.Event.filter(telemetryService.eventLogged, e => e.name === 'searchResultsFinished');
                event_1.Event.once(onSearchResultsFinished)(onComplete);
                function onComplete() {
                    try {
                        const allEvents = telemetryService.events.map(e => JSON.stringify(e)).join('\n');
                        assert.strictEqual(telemetryService.events.length, 3, 'Expected 3 telemetry events, got:\n' + allEvents);
                        const [firstRenderEvent, resultsShownEvent, resultsFinishedEvent] = telemetryService.events;
                        assert.strictEqual(firstRenderEvent.name, 'searchResultsFirstRender');
                        assert.strictEqual(resultsShownEvent.name, 'searchResultsShown');
                        assert.strictEqual(resultsFinishedEvent.name, 'searchResultsFinished');
                        telemetryService.events = [];
                        resolve(resultsFinishedEvent);
                    }
                    catch (e) {
                        // Fail the runSearch() promise
                        error(e);
                    }
                }
                let resolve;
                let error;
                return new Promise((_resolve, _error) => {
                    resolve = _resolve;
                    error = _error;
                    // Don't wait on this promise, we're waiting on the event fired above
                    searchModel.search(query).then(null, _error);
                });
            }
            const finishedEvents = [];
            return runSearch() // Warm-up first
                .then(() => {
                if (testWorkspaceArg) { // Don't measure by default
                    let i = n;
                    return (function iterate() {
                        if (!i--) {
                            return;
                        }
                        return runSearch()
                            .then((resultsFinishedEvent) => {
                            console.log(`Iteration ${n - i}: ${resultsFinishedEvent.data.duration / 1000}s`);
                            finishedEvents.push(resultsFinishedEvent);
                            return iterate();
                        });
                    })().then(() => {
                        const totalTime = finishedEvents.reduce((sum, e) => sum + e.data.duration, 0);
                        console.log(`Avg duration: ${totalTime / n / 1000}s`);
                    });
                }
                return undefined;
            });
        });
    });
    class TestTelemetryService {
        constructor() {
            this.telemetryLevel = (0, observableValue_1.staticObservableValue)(3 /* TelemetryLevel.USAGE */);
            this.sendErrorTelemetry = true;
            this.events = [];
            this.emitter = new event_1.Emitter();
        }
        get eventLogged() {
            return this.emitter.event;
        }
        setEnabled(value) {
        }
        setExperimentProperty(name, value) {
        }
        publicLog(eventName, data) {
            const event = { name: eventName, data: data };
            this.events.push(event);
            this.emitter.fire(event);
            return Promise.resolve();
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        publicLogError(eventName, data) {
            return this.publicLog(eventName, data);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        getTelemetryInfo() {
            return Promise.resolve({
                instanceId: 'someValue.instanceId',
                sessionId: 'someValue.sessionId',
                machineId: 'someValue.machineId',
                firstSessionDate: 'someValue.firstSessionDate'
            });
        }
    }
});
//# sourceMappingURL=textsearch.perf.integrationTest.js.map