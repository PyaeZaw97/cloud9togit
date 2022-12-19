/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/common/async", "vs/base/common/event", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/url/common/url", "vs/platform/url/common/urlService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/experiments/common/experimentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, sinon, async_1, event_1, platform_1, uri_1, configuration_1, testConfigurationService_1, extensionManagement_1, extensionManagementUtil_1, extensionManagementService_1, instantiationServiceMock_1, productService_1, storage_1, telemetry_1, telemetryUtils_1, uriIdentity_1, uriIdentityService_1, url_1, urlService_1, workspaceTrust_1, experimentService_1, extensionManagement_2, extensionEnablementService_test_1, extensions_1, lifecycle_1, testWorkspaceTrustService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestExperimentService = void 0;
    let experimentData = {
        experiments: []
    };
    const local = aLocalExtension('installedExtension1', { version: '1.0.0' });
    function aLocalExtension(name = 'someext', manifest = {}, properties = {}) {
        manifest = Object.assign({ name, publisher: 'pub', version: '1.0.0' }, manifest);
        properties = Object.assign({
            type: 1 /* ExtensionType.User */,
            location: uri_1.URI.file(`pub.${name}`),
            identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name), uuid: undefined },
            metadata: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name), publisherId: manifest.publisher, publisherDisplayName: 'somename' }
        }, properties);
        return Object.create(Object.assign({ manifest }, properties));
    }
    class TestExperimentService extends experimentService_1.ExperimentService {
        getExperiments() {
            return Promise.resolve(experimentData.experiments);
        }
    }
    exports.TestExperimentService = TestExperimentService;
    suite('Experiment Service', () => {
        let instantiationService;
        let testConfigurationService;
        let testObject;
        let activationEvent;
        let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
        suiteSetup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            installEvent = new event_1.Emitter();
            didInstallEvent = new event_1.Emitter();
            uninstallEvent = new event_1.Emitter();
            didUninstallEvent = new event_1.Emitter();
            activationEvent = new event_1.Emitter();
            instantiationService.stub(extensions_1.IExtensionService, workbenchTestServices_2.TestExtensionService);
            instantiationService.stub(extensions_1.IExtensionService, 'onWillActivateByEvent', activationEvent.event);
            instantiationService.stub(uriIdentity_1.IUriIdentityService, uriIdentityService_1.UriIdentityService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, extensionManagementService_1.ExtensionManagementService);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onInstallExtension', installEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidInstallExtensions', didInstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onUninstallExtension', uninstallEvent.event);
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, 'onDidUninstallExtension', didUninstallEvent.event);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(url_1.IURLService, urlService_1.NativeURLService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            testConfigurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            instantiationService.stub(lifecycle_1.ILifecycleService, new workbenchTestServices_1.TestLifecycleService());
            instantiationService.stub(storage_1.IStorageService, { get: (a, b, c) => c, getBoolean: (a, b, c) => c, store: () => { }, remove: () => { } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, new testWorkspaceTrustService_1.TestWorkspaceTrustManagementService());
            setup(() => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(storage_1.IStorageService, { get: (a, b, c) => c, getBoolean: (a, b, c) => c, store: () => { }, remove: () => { } });
            });
            teardown(() => {
                if (testObject) {
                    testObject.dispose();
                }
            });
        });
        test('Simple Experiment Test', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1'
                    },
                    {
                        id: 'experiment2',
                        enabled: false
                    },
                    {
                        id: 'experiment3',
                        enabled: true
                    },
                    {
                        id: 'experiment4',
                        enabled: true,
                        condition: {}
                    },
                    {
                        id: 'experiment5',
                        enabled: true,
                        condition: {
                            insidersOnly: true
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            const tests = [];
            tests.push(testObject.getExperimentById('experiment1'));
            tests.push(testObject.getExperimentById('experiment2'));
            tests.push(testObject.getExperimentById('experiment3'));
            tests.push(testObject.getExperimentById('experiment4'));
            tests.push(testObject.getExperimentById('experiment5'));
            return Promise.all(tests).then(results => {
                assert.strictEqual(results[0].id, 'experiment1');
                assert.strictEqual(results[0].enabled, false);
                assert.strictEqual(results[0].state, 1 /* ExperimentState.NoRun */);
                assert.strictEqual(results[1].id, 'experiment2');
                assert.strictEqual(results[1].enabled, false);
                assert.strictEqual(results[1].state, 1 /* ExperimentState.NoRun */);
                assert.strictEqual(results[2].id, 'experiment3');
                assert.strictEqual(results[2].enabled, true);
                assert.strictEqual(results[2].state, 2 /* ExperimentState.Run */);
                assert.strictEqual(results[3].id, 'experiment4');
                assert.strictEqual(results[3].enabled, true);
                assert.strictEqual(results[3].state, 2 /* ExperimentState.Run */);
                assert.strictEqual(results[4].id, 'experiment5');
                assert.strictEqual(results[4].enabled, true);
                assert.strictEqual(results[4].state, 2 /* ExperimentState.Run */);
            });
        });
        test('filters out experiments with newer schema versions', async () => {
            var _a, _b;
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        // no version == 0
                    },
                    {
                        id: 'experiment2',
                        schemaVersion: experimentService_1.currentSchemaVersion,
                    },
                    {
                        id: 'experiment3',
                        schemaVersion: experimentService_1.currentSchemaVersion + 1,
                    },
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            const actual = await Promise.all([
                testObject.getExperimentById('experiment1'),
                testObject.getExperimentById('experiment2'),
                testObject.getExperimentById('experiment3'),
            ]);
            assert.strictEqual((_a = actual[0]) === null || _a === void 0 ? void 0 : _a.id, 'experiment1');
            assert.strictEqual((_b = actual[1]) === null || _b === void 0 ? void 0 : _b.id, 'experiment2');
            assert.strictEqual(actual[2], undefined);
        });
        test('Insiders only experiment shouldnt be enabled in stable', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            insidersOnly: true
                        }
                    }
                ]
            };
            instantiationService.stub(productService_1.IProductService, { quality: 'stable' });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
            });
        });
        test('NewUsers experiment shouldnt be enabled for old users', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            newUser: true
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    return a === telemetry_1.lastSessionDateStorageKey ? 'some-date' : undefined;
                },
                getBoolean: (a, b, c) => c, store: () => { }, remove: () => { }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
            });
        });
        test('OldUsers experiment shouldnt be enabled for new users', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            newUser: false
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
            });
        });
        test('Experiment without NewUser condition should be enabled for old users', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {}
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    return a === telemetry_1.lastSessionDateStorageKey ? 'some-date' : undefined;
                },
                getBoolean: (a, b, c) => c, store: () => { }, remove: () => { }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
            });
        });
        test('Experiment without NewUser condition should be enabled for new users', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {}
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
            });
        });
        test('Experiment with OS should be enabled on current OS', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            os: [platform_1.OS],
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
            });
        });
        test('Experiment with OS should be disabled on other OS', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            os: [platform_1.OS - 1],
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
            });
        });
        test('Activation event experiment with not enough events should be evaluating', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            activationEvent: {
                                event: 'my:event',
                                minEvents: 5,
                            }
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, 'get', (a, b, c) => {
                return a === 'experimentEventRecord-my-event'
                    ? JSON.stringify({ count: [2], mostRecentBucket: Date.now() })
                    : undefined;
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 0 /* ExperimentState.Evaluating */);
            });
        });
        test('Activation event works with enough events', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            activationEvent: {
                                event: 'my:event',
                                minEvents: 5,
                            }
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, 'get', (a, b, c) => {
                return a === 'experimentEventRecord-my-event'
                    ? JSON.stringify({ count: [10], mostRecentBucket: Date.now() })
                    : undefined;
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
            });
        });
        test('Activation event allows multiple', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            activationEvent: {
                                event: ['other:event', 'my:event'],
                                minEvents: 5,
                            }
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, 'get', (a, b, c) => {
                return a === 'experimentEventRecord-my-event'
                    ? JSON.stringify({ count: [10], mostRecentBucket: Date.now() })
                    : undefined;
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
            });
        });
        test('Activation event does not work with old data', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            activationEvent: {
                                event: 'my:event',
                                minEvents: 5,
                            }
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, 'get', (a, b, c) => {
                return a === 'experimentEventRecord-my-event'
                    ? JSON.stringify({ count: [10], mostRecentBucket: Date.now() - (1000 * 60 * 60 * 24 * 10) })
                    : undefined;
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 0 /* ExperimentState.Evaluating */);
            });
        });
        test('Parses activation records correctly', () => {
            const timers = sinon.useFakeTimers(); // so Date.now() is stable
            const oneDay = 1000 * 60 * 60 * 24;
            teardown(() => timers.restore());
            let rec = (0, experimentService_1.getCurrentActivationRecord)();
            // good default:
            assert.deepStrictEqual(rec, {
                count: [0, 0, 0, 0, 0, 0, 0],
                mostRecentBucket: Date.now(),
            });
            rec.count[0] = 1;
            timers.tick(1);
            rec = (0, experimentService_1.getCurrentActivationRecord)(rec);
            // does not advance unnecessarily
            assert.deepStrictEqual((0, experimentService_1.getCurrentActivationRecord)(rec), {
                count: [1, 0, 0, 0, 0, 0, 0],
                mostRecentBucket: Date.now() - 1,
            });
            // advances time
            timers.tick(oneDay * 3);
            rec = (0, experimentService_1.getCurrentActivationRecord)(rec);
            assert.deepStrictEqual((0, experimentService_1.getCurrentActivationRecord)(rec), {
                count: [0, 0, 0, 1, 0, 0, 0],
                mostRecentBucket: Date.now() - 1,
            });
            // rotates off time
            timers.tick(oneDay * 4);
            rec.count[0] = 2;
            rec = (0, experimentService_1.getCurrentActivationRecord)(rec);
            assert.deepStrictEqual((0, experimentService_1.getCurrentActivationRecord)(rec), {
                count: [0, 0, 0, 0, 2, 0, 0],
                mostRecentBucket: Date.now() - 1,
            });
        });
        test('Activation event updates', async () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            activationEvent: {
                                event: 'my:event',
                                minEvents: 2,
                            }
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, 'get', (a, b, c) => {
                return a === 'experimentEventRecord-my-event'
                    ? JSON.stringify({ count: [10, 0, 0, 0, 0, 0, 0], mostRecentBucket: Date.now() - (1000 * 60 * 60 * 24 * 2) })
                    : undefined;
            });
            let didGetCall = false;
            instantiationService.stub(storage_1.IStorageService, 'store', (key, value, scope) => {
                if (key.includes('experimentEventRecord')) {
                    didGetCall = true;
                    assert.strictEqual(key, 'experimentEventRecord-my-event');
                    assert.deepStrictEqual(JSON.parse(value).count, [1, 0, 10, 0, 0, 0, 0]);
                    assert.strictEqual(scope, 0 /* StorageScope.GLOBAL */);
                }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            await testObject.getExperimentById('experiment1');
            activationEvent.fire({ event: 'not our event', activation: Promise.resolve() });
            activationEvent.fire({ event: 'my:event', activation: Promise.resolve() });
            assert(didGetCall);
        });
        test('Activation events run experiments in realtime', async () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            activationEvent: {
                                event: 'my:event',
                                minEvents: 2,
                            }
                        }
                    }
                ]
            };
            let calls = 0;
            instantiationService.stub(storage_1.IStorageService, 'get', (a, b, c) => {
                return a === 'experimentEventRecord-my-event'
                    ? JSON.stringify({ count: [++calls, 0, 0, 0, 0, 0, 0], mostRecentBucket: Date.now() })
                    : undefined;
            });
            const enabledListener = sinon.stub();
            testObject = instantiationService.createInstance(TestExperimentService);
            testObject.onExperimentEnabled(enabledListener);
            assert.strictEqual((await testObject.getExperimentById('experiment1')).state, 0 /* ExperimentState.Evaluating */);
            assert.strictEqual((await testObject.getExperimentById('experiment1')).state, 0 /* ExperimentState.Evaluating */);
            assert.strictEqual(enabledListener.callCount, 0);
            activationEvent.fire({ event: 'my:event', activation: Promise.resolve() });
            await (0, async_1.timeout)(1);
            assert.strictEqual(enabledListener.callCount, 1);
            assert.strictEqual((await testObject.getExperimentById('experiment1')).state, 2 /* ExperimentState.Run */);
        });
        test('Experiment not matching user setting should be disabled', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            userSetting: { neat: true }
                        }
                    }
                ]
            };
            instantiationService.stub(configuration_1.IConfigurationService, 'getValue', (key) => key === 'neat' ? false : undefined);
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
            });
        });
        test('Experiment matching user setting should be enabled', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            userSetting: { neat: true }
                        }
                    }
                ]
            };
            instantiationService.stub(configuration_1.IConfigurationService, 'getValue', (key) => key === 'neat' ? true : undefined);
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
            });
        });
        test('Experiment with no matching display language should be disabled', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            displayLanguage: 'somethingthat-nooneknows'
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
            });
        });
        test('Experiment with condition type InstalledExtensions is enabled when one of the expected extensions is installed', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                inlcudes: ['pub.installedExtension1', 'uninstalled-extention-id']
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
            });
        });
        test('Experiment with condition type InstalledExtensions is disabled when none of the expected extensions is installed', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                includes: ['uninstalled-extention-id1', 'uninstalled-extention-id2']
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
            });
        });
        test('Experiment with condition type InstalledExtensions is disabled when one of the exlcuded extensions is installed', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                excludes: ['pub.installedExtension1', 'uninstalled-extention-id2']
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
            });
        });
        test('Experiment that is marked as complete should be disabled regardless of the conditions', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                includes: ['pub.installedExtension1', 'uninstalled-extention-id2']
                            }
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => a === 'experiments.experiment1' ? JSON.stringify({ state: 3 /* ExperimentState.Complete */ }) : c,
                store: () => { }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 3 /* ExperimentState.Complete */);
            });
        });
        test('Experiment with evaluate only once should read enablement from storage service', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        condition: {
                            installedExtensions: {
                                excludes: ['pub.installedExtension1', 'uninstalled-extention-id2']
                            },
                            evaluateOnlyOnce: true
                        }
                    }
                ]
            };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => a === 'experiments.experiment1' ? JSON.stringify({ enabled: true, state: 2 /* ExperimentState.Run */ }) : c,
                store: () => { }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
            });
        });
        test('Curated list should be available if experiment is enabled.', () => {
            const promptText = 'Hello there! Can you see this?';
            const curatedExtensionsKey = 'AzureDeploy';
            const curatedExtensionsList = ['uninstalled-extention-id1', 'uninstalled-extention-id2'];
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: true,
                        action: {
                            type: 'Prompt',
                            properties: {
                                promptText,
                                commands: [
                                    {
                                        text: 'Search Marketplace',
                                        dontShowAgain: true,
                                        curatedExtensionsKey,
                                        curatedExtensionsList
                                    },
                                    {
                                        text: 'No'
                                    }
                                ]
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, true);
                assert.strictEqual(result.state, 2 /* ExperimentState.Run */);
                return testObject.getCuratedExtensionsList(curatedExtensionsKey).then(curatedList => {
                    assert.strictEqual(curatedList, curatedExtensionsList);
                });
            });
        });
        test('Curated list shouldnt be available if experiment is disabled.', () => {
            const promptText = 'Hello there! Can you see this?';
            const curatedExtensionsKey = 'AzureDeploy';
            const curatedExtensionsList = ['uninstalled-extention-id1', 'uninstalled-extention-id2'];
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: false,
                        action: {
                            type: 'Prompt',
                            properties: {
                                promptText,
                                commands: [
                                    {
                                        text: 'Search Marketplace',
                                        dontShowAgain: true,
                                        curatedExtensionsKey,
                                        curatedExtensionsList
                                    },
                                    {
                                        text: 'No'
                                    }
                                ]
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                var _a;
                assert.strictEqual(result.enabled, false);
                assert.strictEqual((_a = result.action) === null || _a === void 0 ? void 0 : _a.type, 'Prompt');
                assert.strictEqual(result.state, 1 /* ExperimentState.NoRun */);
                return testObject.getCuratedExtensionsList(curatedExtensionsKey).then(curatedList => {
                    assert.strictEqual(curatedList.length, 0);
                });
            });
        });
        test('Maps action2 to action.', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: false,
                        action2: {
                            type: 'Prompt',
                            properties: {
                                promptText: 'Hello world',
                                commands: []
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentById('experiment1').then(result => {
                var _a;
                assert.strictEqual((_a = result.action) === null || _a === void 0 ? void 0 : _a.type, 'Prompt');
            });
        });
        test('Experiment that is disabled or deleted should be removed from storage', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment1',
                        enabled: false
                    },
                    {
                        id: 'experiment3',
                        enabled: true
                    }
                ]
            };
            let storageDataExperiment1 = { enabled: false };
            let storageDataExperiment2 = { enabled: false };
            let storageDataAllExperiments = ['experiment1', 'experiment2', 'experiment3'];
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            return JSON.stringify(storageDataExperiment1);
                        case 'experiments.experiment2':
                            return JSON.stringify(storageDataExperiment2);
                        case 'allExperiments':
                            return JSON.stringify(storageDataAllExperiments);
                        default:
                            break;
                    }
                    return c;
                },
                store: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            storageDataExperiment1 = JSON.parse(b);
                            break;
                        case 'experiments.experiment2':
                            storageDataExperiment2 = JSON.parse(b);
                            break;
                        case 'allExperiments':
                            storageDataAllExperiments = JSON.parse(b);
                            break;
                        default:
                            break;
                    }
                },
                remove: (a) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            storageDataExperiment1 = null;
                            break;
                        case 'experiments.experiment2':
                            storageDataExperiment2 = null;
                            break;
                        case 'allExperiments':
                            storageDataAllExperiments = null;
                            break;
                        default:
                            break;
                    }
                }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            const disabledExperiment = testObject.getExperimentById('experiment1').then(result => {
                assert.strictEqual(result.enabled, false);
                assert.strictEqual(!!storageDataExperiment1, false);
            });
            const deletedExperiment = testObject.getExperimentById('experiment2').then(result => {
                assert.strictEqual(!!result, false);
                assert.strictEqual(!!storageDataExperiment2, false);
            });
            return Promise.all([disabledExperiment, deletedExperiment]).then(() => {
                assert.strictEqual(storageDataAllExperiments.length, 1);
                assert.strictEqual(storageDataAllExperiments[0], 'experiment3');
            });
        });
        test('Offline mode', () => {
            experimentData = {
                experiments: null
            };
            let storageDataExperiment1 = { enabled: true, state: 2 /* ExperimentState.Run */ };
            let storageDataExperiment2 = { enabled: true, state: 1 /* ExperimentState.NoRun */ };
            let storageDataExperiment3 = { enabled: true, state: 0 /* ExperimentState.Evaluating */ };
            let storageDataExperiment4 = { enabled: true, state: 3 /* ExperimentState.Complete */ };
            let storageDataAllExperiments = ['experiment1', 'experiment2', 'experiment3', 'experiment4'];
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            return JSON.stringify(storageDataExperiment1);
                        case 'experiments.experiment2':
                            return JSON.stringify(storageDataExperiment2);
                        case 'experiments.experiment3':
                            return JSON.stringify(storageDataExperiment3);
                        case 'experiments.experiment4':
                            return JSON.stringify(storageDataExperiment4);
                        case 'allExperiments':
                            return JSON.stringify(storageDataAllExperiments);
                        default:
                            break;
                    }
                    return c;
                },
                store: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment1':
                            storageDataExperiment1 = JSON.parse(b + '');
                            break;
                        case 'experiments.experiment2':
                            storageDataExperiment2 = JSON.parse(b + '');
                            break;
                        case 'experiments.experiment3':
                            storageDataExperiment3 = JSON.parse(b + '');
                            break;
                        case 'experiments.experiment4':
                            storageDataExperiment4 = JSON.parse(b + '');
                            break;
                        case 'allExperiments':
                            storageDataAllExperiments = JSON.parse(b + '');
                            break;
                        default:
                            break;
                    }
                },
                remove: a => {
                    switch (a) {
                        case 'experiments.experiment1':
                            storageDataExperiment1 = null;
                            break;
                        case 'experiments.experiment2':
                            storageDataExperiment2 = null;
                            break;
                        case 'experiments.experiment3':
                            storageDataExperiment3 = null;
                            break;
                        case 'experiments.experiment4':
                            storageDataExperiment4 = null;
                            break;
                        case 'allExperiments':
                            storageDataAllExperiments = null;
                            break;
                        default:
                            break;
                    }
                }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            const tests = [];
            tests.push(testObject.getExperimentById('experiment1'));
            tests.push(testObject.getExperimentById('experiment2'));
            tests.push(testObject.getExperimentById('experiment3'));
            tests.push(testObject.getExperimentById('experiment4'));
            return Promise.all(tests).then(results => {
                assert.strictEqual(results[0].id, 'experiment1');
                assert.strictEqual(results[0].enabled, true);
                assert.strictEqual(results[0].state, 2 /* ExperimentState.Run */);
                assert.strictEqual(results[1].id, 'experiment2');
                assert.strictEqual(results[1].enabled, true);
                assert.strictEqual(results[1].state, 1 /* ExperimentState.NoRun */);
                assert.strictEqual(results[2].id, 'experiment3');
                assert.strictEqual(results[2].enabled, true);
                assert.strictEqual(results[2].state, 0 /* ExperimentState.Evaluating */);
                assert.strictEqual(results[3].id, 'experiment4');
                assert.strictEqual(results[3].enabled, true);
                assert.strictEqual(results[3].state, 3 /* ExperimentState.Complete */);
            });
        });
        test('getExperimentByType', () => {
            const customProperties = {
                some: 'random-value'
            };
            experimentData = {
                experiments: [
                    {
                        id: 'simple-experiment',
                        enabled: true
                    },
                    {
                        id: 'custom-experiment',
                        enabled: true,
                        action: {
                            type: 'Custom',
                            properties: customProperties
                        }
                    },
                    {
                        id: 'custom-experiment-no-properties',
                        enabled: true,
                        action: {
                            type: 'Custom'
                        }
                    },
                    {
                        id: 'prompt-with-no-commands',
                        enabled: true,
                        action: {
                            type: 'Prompt',
                            properties: {
                                promptText: 'someText'
                            }
                        }
                    },
                    {
                        id: 'prompt-with-commands',
                        enabled: true,
                        action: {
                            type: 'Prompt',
                            properties: {
                                promptText: 'someText',
                                commands: [
                                    {
                                        text: 'Hello'
                                    }
                                ]
                            }
                        }
                    }
                ]
            };
            testObject = instantiationService.createInstance(TestExperimentService);
            const custom = testObject.getExperimentsByType(experimentService_1.ExperimentActionType.Custom).then(result => {
                assert.strictEqual(result.length, 3);
                assert.strictEqual(result[0].id, 'simple-experiment');
                assert.strictEqual(result[1].id, 'custom-experiment');
                assert.strictEqual(result[1].action.properties, customProperties);
                assert.strictEqual(result[2].id, 'custom-experiment-no-properties');
                assert.strictEqual(!!result[2].action.properties, true);
            });
            const prompt = testObject.getExperimentsByType(experimentService_1.ExperimentActionType.Prompt).then(result => {
                assert.strictEqual(result.length, 2);
                assert.strictEqual(result[0].id, 'prompt-with-no-commands');
                assert.strictEqual(result[1].id, 'prompt-with-commands');
            });
            return Promise.all([custom, prompt]);
        });
        test('experimentsPreviouslyRun includes, excludes check', () => {
            experimentData = {
                experiments: [
                    {
                        id: 'experiment3',
                        enabled: true,
                        condition: {
                            experimentsPreviouslyRun: {
                                includes: ['experiment1'],
                                excludes: ['experiment2']
                            }
                        }
                    },
                    {
                        id: 'experiment4',
                        enabled: true,
                        condition: {
                            experimentsPreviouslyRun: {
                                includes: ['experiment1'],
                                excludes: ['experiment200']
                            }
                        }
                    }
                ]
            };
            let storageDataExperiment3 = { enabled: true, state: 0 /* ExperimentState.Evaluating */ };
            let storageDataExperiment4 = { enabled: true, state: 0 /* ExperimentState.Evaluating */ };
            instantiationService.stub(storage_1.IStorageService, {
                get: (a, b, c) => {
                    switch (a) {
                        case 'currentOrPreviouslyRunExperiments':
                            return JSON.stringify(['experiment1', 'experiment2']);
                        default:
                            break;
                    }
                    return c;
                },
                store: (a, b, c) => {
                    switch (a) {
                        case 'experiments.experiment3':
                            storageDataExperiment3 = JSON.parse(b + '');
                            break;
                        case 'experiments.experiment4':
                            storageDataExperiment4 = JSON.parse(b + '');
                            break;
                        default:
                            break;
                    }
                }
            });
            testObject = instantiationService.createInstance(TestExperimentService);
            return testObject.getExperimentsByType(experimentService_1.ExperimentActionType.Custom).then(result => {
                assert.strictEqual(result.length, 2);
                assert.strictEqual(result[0].id, 'experiment3');
                assert.strictEqual(result[0].state, 1 /* ExperimentState.NoRun */);
                assert.strictEqual(result[1].id, 'experiment4');
                assert.strictEqual(result[1].state, 2 /* ExperimentState.Run */);
                assert.strictEqual(storageDataExperiment3.state, 1 /* ExperimentState.NoRun */);
                assert.strictEqual(storageDataExperiment4.state, 2 /* ExperimentState.Run */);
                return Promise.resolve(null);
            });
        });
        // test('Experiment with condition type FileEdit should increment editcount as appropriate', () => {
        // });
        // test('Experiment with condition type WorkspaceEdit should increment editcount as appropriate', () => {
        // });
    });
});
//# sourceMappingURL=experimentService.test.js.map