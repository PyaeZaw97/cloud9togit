/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/languages", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/externalUriOpener/common/externalUriOpenerService"], function (require, exports, assert, cancellation_1, lifecycle_1, uri_1, languages_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, opener_1, quickInput_1, externalUriOpenerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MockQuickInputService {
        constructor(pickIndex) {
            this.pickIndex = pickIndex;
        }
        async pick(picks, options, token) {
            const resolvedPicks = await picks;
            const item = resolvedPicks[this.pickIndex];
            if (item.type === 'separator') {
                return undefined;
            }
            return item;
        }
    }
    suite('ExternalUriOpenerService', () => {
        let instantiationService;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(opener_1.IOpenerService, {
                registerExternalOpener: () => { return lifecycle_1.Disposable.None; }
            });
        });
        test('Should not open if there are no openers', async () => {
            const externalUriOpenerService = instantiationService.createInstance(externalUriOpenerService_1.ExternalUriOpenerService);
            externalUriOpenerService.registerExternalOpenerProvider(new class {
                getOpeners(_targetUri) {
                    return __asyncGenerator(this, arguments, function* getOpeners_1() {
                        // noop
                    });
                }
            });
            const uri = uri_1.URI.parse('http://contoso.com');
            const didOpen = await externalUriOpenerService.openExternal(uri.toString(), { sourceUri: uri }, cancellation_1.CancellationToken.None);
            assert.strictEqual(didOpen, false);
        });
        test('Should prompt if there is at least one enabled opener', async () => {
            instantiationService.stub(quickInput_1.IQuickInputService, new MockQuickInputService(0));
            const externalUriOpenerService = instantiationService.createInstance(externalUriOpenerService_1.ExternalUriOpenerService);
            let openedWithEnabled = false;
            externalUriOpenerService.registerExternalOpenerProvider(new class {
                getOpeners(_targetUri) {
                    return __asyncGenerator(this, arguments, function* getOpeners_2() {
                        yield yield __await({
                            id: 'disabled-id',
                            label: 'disabled',
                            canOpen: async () => languages_1.ExternalUriOpenerPriority.None,
                            openExternalUri: async () => true,
                        });
                        yield yield __await({
                            id: 'enabled-id',
                            label: 'enabled',
                            canOpen: async () => languages_1.ExternalUriOpenerPriority.Default,
                            openExternalUri: async () => {
                                openedWithEnabled = true;
                                return true;
                            }
                        });
                    });
                }
            });
            const uri = uri_1.URI.parse('http://contoso.com');
            const didOpen = await externalUriOpenerService.openExternal(uri.toString(), { sourceUri: uri }, cancellation_1.CancellationToken.None);
            assert.strictEqual(didOpen, true);
            assert.strictEqual(openedWithEnabled, true);
        });
        test('Should automatically pick single preferred opener without prompt', async () => {
            const externalUriOpenerService = instantiationService.createInstance(externalUriOpenerService_1.ExternalUriOpenerService);
            let openedWithPreferred = false;
            externalUriOpenerService.registerExternalOpenerProvider(new class {
                getOpeners(_targetUri) {
                    return __asyncGenerator(this, arguments, function* getOpeners_3() {
                        yield yield __await({
                            id: 'other-id',
                            label: 'other',
                            canOpen: async () => languages_1.ExternalUriOpenerPriority.Default,
                            openExternalUri: async () => {
                                return true;
                            }
                        });
                        yield yield __await({
                            id: 'preferred-id',
                            label: 'preferred',
                            canOpen: async () => languages_1.ExternalUriOpenerPriority.Preferred,
                            openExternalUri: async () => {
                                openedWithPreferred = true;
                                return true;
                            }
                        });
                    });
                }
            });
            const uri = uri_1.URI.parse('http://contoso.com');
            const didOpen = await externalUriOpenerService.openExternal(uri.toString(), { sourceUri: uri }, cancellation_1.CancellationToken.None);
            assert.strictEqual(didOpen, true);
            assert.strictEqual(openedWithPreferred, true);
        });
    });
});
//# sourceMappingURL=externalUriOpenerService.test.js.map