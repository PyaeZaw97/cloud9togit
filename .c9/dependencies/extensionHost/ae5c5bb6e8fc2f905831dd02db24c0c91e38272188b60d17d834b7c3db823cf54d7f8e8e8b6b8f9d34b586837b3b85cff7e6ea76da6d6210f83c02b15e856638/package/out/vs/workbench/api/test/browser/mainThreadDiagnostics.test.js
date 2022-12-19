/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/markers/common/markerService", "vs/workbench/api/browser/mainThreadDiagnostics", "vs/base/common/uri", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/common/timeTravelScheduler", "vs/base/common/async"], function (require, exports, assert, markerService_1, mainThreadDiagnostics_1, uri_1, workbenchTestServices_1, timeTravelScheduler_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadDiagnostics', function () {
        let markerService;
        setup(function () {
            markerService = new markerService_1.MarkerService();
        });
        test('clear markers on dispose', function () {
            let diag = new mainThreadDiagnostics_1.MainThreadDiagnostics(new class {
                constructor() {
                    this.remoteAuthority = '';
                    this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
                }
                dispose() { }
                assertRegistered() { }
                set(v) { return null; }
                getProxy() {
                    return {
                        $acceptMarkersChange() { }
                    };
                }
                drain() { return null; }
            }, markerService, new class extends (0, workbenchTestServices_1.mock)() {
                asCanonicalUri(uri) { return uri; }
            });
            diag.$changeMany('foo', [[uri_1.URI.file('a'), [{
                            code: '666',
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 1,
                            endColumn: 1,
                            message: 'fffff',
                            severity: 1,
                            source: 'me'
                        }]]]);
            assert.strictEqual(markerService.read().length, 1);
            diag.dispose();
            assert.strictEqual(markerService.read().length, 0);
        });
        test('OnDidChangeDiagnostics triggers twice on same diagnostics #136434', function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const changedData = [];
                let diag = new mainThreadDiagnostics_1.MainThreadDiagnostics(new class {
                    constructor() {
                        this.remoteAuthority = '';
                        this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    dispose() { }
                    assertRegistered() { }
                    set(v) { return null; }
                    getProxy() {
                        return {
                            $acceptMarkersChange(data) {
                                changedData.push(data);
                            }
                        };
                    }
                    drain() { return null; }
                }, markerService, new class extends (0, workbenchTestServices_1.mock)() {
                    asCanonicalUri(uri) { return uri; }
                });
                const markerDataStub = {
                    code: '666',
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1,
                    severity: 1,
                    source: 'me'
                };
                const target = uri_1.URI.file('a');
                diag.$changeMany('foo', [[target, [Object.assign(Object.assign({}, markerDataStub), { message: 'same_owner' })]]]);
                markerService.changeOne('bar', target, [Object.assign(Object.assign({}, markerDataStub), { message: 'forgein_owner' })]);
                // added one marker via the API and one via the ext host. the latter must not
                // trigger an event to the extension host
                await (0, async_1.timeout)(0);
                assert.strictEqual(markerService.read().length, 2);
                assert.strictEqual(changedData.length, 1);
                assert.strictEqual(changedData[0].length, 1);
                assert.strictEqual(changedData[0][0][1][0].message, 'forgein_owner');
            });
        });
        test('onDidChangeDiagnostics different behavior when "extensionKind" ui running on remote workspace #136955', function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const markerData = {
                    code: '666',
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1,
                    severity: 1,
                    source: 'me',
                    message: 'message'
                };
                const target = uri_1.URI.file('a');
                markerService.changeOne('bar', target, [markerData]);
                const changedData = [];
                let diag = new mainThreadDiagnostics_1.MainThreadDiagnostics(new class {
                    constructor() {
                        this.remoteAuthority = '';
                        this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    dispose() { }
                    assertRegistered() { }
                    set(v) { return null; }
                    getProxy() {
                        return {
                            $acceptMarkersChange(data) {
                                changedData.push(data);
                            }
                        };
                    }
                    drain() { return null; }
                }, markerService, new class extends (0, workbenchTestServices_1.mock)() {
                    asCanonicalUri(uri) { return uri; }
                });
                diag.$clear('bar');
                await (0, async_1.timeout)(0);
                assert.strictEqual(markerService.read().length, 0);
                assert.strictEqual(changedData.length, 1);
            });
        });
    });
});
//# sourceMappingURL=mainThreadDiagnostics.test.js.map