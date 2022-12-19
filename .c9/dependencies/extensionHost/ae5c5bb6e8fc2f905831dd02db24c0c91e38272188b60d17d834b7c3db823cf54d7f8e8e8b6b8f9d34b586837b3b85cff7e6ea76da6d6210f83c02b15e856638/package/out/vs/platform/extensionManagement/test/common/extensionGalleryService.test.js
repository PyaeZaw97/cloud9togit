/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/test/common/mock", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/externalServices/common/marketplace", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry"], function (require, exports, assert, lifecycle_1, resources_1, uri_1, uuid_1, mock_1, testConfigurationService_1, extensionGalleryService_1, fileService_1, inMemoryFilesystemProvider_1, log_1, product_1, marketplace_1, storage_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EnvironmentServiceMock extends (0, mock_1.mock)() {
        constructor(serviceMachineIdResource) {
            super();
            this.serviceMachineIdResource = serviceMachineIdResource;
            this.isBuilt = true;
        }
    }
    suite('Extension Gallery Service', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let fileService, environmentService, storageService, productService, configurationService;
        setup(() => {
            const serviceMachineIdResource = (0, resources_1.joinPath)(uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), 'machineid');
            environmentService = new EnvironmentServiceMock(serviceMachineIdResource);
            fileService = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(serviceMachineIdResource.scheme, fileSystemProvider);
            storageService = new storage_1.InMemoryStorageService();
            configurationService = new testConfigurationService_1.TestConfigurationService({ [telemetry_1.TELEMETRY_SETTING_ID]: "all" /* TelemetryConfiguration.ON */ });
            configurationService.updateValue(telemetry_1.TELEMETRY_SETTING_ID, "all" /* TelemetryConfiguration.ON */);
            productService = Object.assign(Object.assign({ _serviceBrand: undefined }, product_1.default), { enableTelemetry: true });
        });
        teardown(() => disposables.clear());
        test('marketplace machine id', async () => {
            const headers = await (0, marketplace_1.resolveMarketplaceHeaders)(product_1.default.version, productService, environmentService, configurationService, fileService, storageService);
            assert.ok((0, uuid_1.isUUID)(headers['X-Market-User-Id']));
            const headers2 = await (0, marketplace_1.resolveMarketplaceHeaders)(product_1.default.version, productService, environmentService, configurationService, fileService, storageService);
            assert.strictEqual(headers['X-Market-User-Id'], headers2['X-Market-User-Id']);
        });
        test('sorting single extension version without target platform', async () => {
            const actual = [aExtensionVersion('1.1.2')];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "darwin-x64" /* TargetPlatform.DARWIN_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with preferred target platform', async () => {
            const actual = [aExtensionVersion('1.1.2', "darwin-x64" /* TargetPlatform.DARWIN_X64 */)];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "darwin-x64" /* TargetPlatform.DARWIN_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with fallback target platform', async () => {
            const actual = [aExtensionVersion('1.1.2', "win32-ia32" /* TargetPlatform.WIN32_IA32 */)];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-x64" /* TargetPlatform.WIN32_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with not compatible target platform', async () => {
            const actual = [aExtensionVersion('1.1.2', "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */)];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-x64" /* TargetPlatform.WIN32_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with multiple target platforms and preferred at first', async () => {
            const actual = [aExtensionVersion('1.1.2', "win32-x64" /* TargetPlatform.WIN32_X64 */), aExtensionVersion('1.1.2', "win32-ia32" /* TargetPlatform.WIN32_IA32 */), aExtensionVersion('1.1.2')];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-x64" /* TargetPlatform.WIN32_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with multiple target platforms and preferred at first with no fallbacks', async () => {
            const actual = [aExtensionVersion('1.1.2', "darwin-x64" /* TargetPlatform.DARWIN_X64 */), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.2', "win32-ia32" /* TargetPlatform.WIN32_IA32 */)];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "darwin-x64" /* TargetPlatform.DARWIN_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with multiple target platforms and preferred at first and fallback at last', async () => {
            const actual = [aExtensionVersion('1.1.2', "win32-x64" /* TargetPlatform.WIN32_X64 */), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.2', "win32-ia32" /* TargetPlatform.WIN32_IA32 */)];
            const expected = [actual[0], actual[2], actual[1]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-x64" /* TargetPlatform.WIN32_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with multiple target platforms and preferred is not first', async () => {
            const actual = [aExtensionVersion('1.1.2', "win32-ia32" /* TargetPlatform.WIN32_IA32 */), aExtensionVersion('1.1.2', "win32-x64" /* TargetPlatform.WIN32_X64 */), aExtensionVersion('1.1.2')];
            const expected = [actual[1], actual[0], actual[2]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-x64" /* TargetPlatform.WIN32_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting single extension version with multiple target platforms and preferred is at the end', async () => {
            const actual = [aExtensionVersion('1.1.2', "win32-ia32" /* TargetPlatform.WIN32_IA32 */), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.2', "win32-x64" /* TargetPlatform.WIN32_X64 */)];
            const expected = [actual[2], actual[0], actual[1]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-x64" /* TargetPlatform.WIN32_X64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting multiple extension versions without target platforms', async () => {
            const actual = [aExtensionVersion('1.2.4'), aExtensionVersion('1.1.3'), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.1')];
            const expected = [...actual];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-arm64" /* TargetPlatform.WIN32_ARM64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting multiple extension versions with target platforms - 1', async () => {
            const actual = [aExtensionVersion('1.2.4', "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */), aExtensionVersion('1.2.4', "win32-arm64" /* TargetPlatform.WIN32_ARM64 */), aExtensionVersion('1.2.4', "linux-arm64" /* TargetPlatform.LINUX_ARM64 */), aExtensionVersion('1.1.3'), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.1')];
            const expected = [actual[1], actual[0], actual[2], actual[3], actual[4], actual[5]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-arm64" /* TargetPlatform.WIN32_ARM64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting multiple extension versions with target platforms - 2', async () => {
            const actual = [aExtensionVersion('1.2.4'), aExtensionVersion('1.2.3', "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */), aExtensionVersion('1.2.3', "win32-arm64" /* TargetPlatform.WIN32_ARM64 */), aExtensionVersion('1.2.3', "linux-arm64" /* TargetPlatform.LINUX_ARM64 */), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.1')];
            const expected = [actual[0], actual[3], actual[1], actual[2], actual[4], actual[5]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "linux-arm64" /* TargetPlatform.LINUX_ARM64 */);
            assert.deepStrictEqual(actual, expected);
        });
        test('sorting multiple extension versions with target platforms - 3', async () => {
            const actual = [aExtensionVersion('1.2.4'), aExtensionVersion('1.1.2'), aExtensionVersion('1.1.1'), aExtensionVersion('1.0.0', "darwin-arm64" /* TargetPlatform.DARWIN_ARM64 */), aExtensionVersion('1.0.0', "win32-ia32" /* TargetPlatform.WIN32_IA32 */), aExtensionVersion('1.0.0', "win32-arm64" /* TargetPlatform.WIN32_ARM64 */)];
            const expected = [actual[0], actual[1], actual[2], actual[5], actual[4], actual[3]];
            (0, extensionGalleryService_1.sortExtensionVersions)(actual, "win32-arm64" /* TargetPlatform.WIN32_ARM64 */);
            assert.deepStrictEqual(actual, expected);
        });
        function aExtensionVersion(version, targetPlatform) {
            return { version, targetPlatform };
        }
    });
});
//# sourceMappingURL=extensionGalleryService.test.js.map