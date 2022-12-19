var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/product/common/productService"], function (require, exports, assert, buffer_1, lifecycle_1, resources_1, uri_1, environment_1, extensionsScannerService_1, extensions_1, files_1, fileService_1, inMemoryFilesystemProvider_1, instantiationServiceMock_1, log_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let translations = Object.create(null);
    const ROOT = uri_1.URI.file('/ROOT');
    let ExtensionsScannerService = class ExtensionsScannerService extends extensionsScannerService_1.AbstractExtensionsScannerService {
        constructor(fileService, logService, nativeEnvironmentService, productService) {
            super(uri_1.URI.file(nativeEnvironmentService.builtinExtensionsPath), uri_1.URI.file(nativeEnvironmentService.extensionsPath), (0, resources_1.joinPath)(nativeEnvironmentService.userHome, '.vscode-oss-dev', 'extensions', 'control.json'), (0, resources_1.joinPath)(ROOT, extensions_1.MANIFEST_CACHE_FOLDER), fileService, logService, nativeEnvironmentService, productService);
        }
        async getTranslations(language) {
            return translations;
        }
    };
    ExtensionsScannerService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, log_1.ILogService),
        __param(2, environment_1.INativeEnvironmentService),
        __param(3, productService_1.IProductService)
    ], ExtensionsScannerService);
    suite('NativeExtensionsScanerService Test', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        setup(async () => {
            translations = {};
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            instantiationService.stub(log_1.ILogService, logService);
            instantiationService.stub(files_1.IFileService, fileService);
            const systemExtensionsLocation = (0, resources_1.joinPath)(ROOT, 'system');
            const userExtensionsLocation = (0, resources_1.joinPath)(ROOT, 'extensions');
            instantiationService.stub(environment_1.INativeEnvironmentService, {
                userHome: ROOT,
                builtinExtensionsPath: systemExtensionsLocation.fsPath,
                extensionsPath: userExtensionsLocation.fsPath,
            });
            instantiationService.stub(productService_1.IProductService, { version: '1.66.0' });
            await fileService.createFolder(systemExtensionsLocation);
            await fileService.createFolder(userExtensionsLocation);
        });
        teardown(() => disposables.clear());
        test('scan system extension', async () => {
            const manifest = anExtensionManifest({ 'name': 'name', 'publisher': 'pub' });
            const extensionLocation = await aSystemExtension(manifest);
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanSystemExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].location.toString(), extensionLocation.toString());
            assert.deepStrictEqual(actual[0].isBuiltin, true);
            assert.deepStrictEqual(actual[0].type, 0 /* ExtensionType.System */);
            assert.deepStrictEqual(actual[0].isValid, true);
            assert.deepStrictEqual(actual[0].validations, []);
            assert.deepStrictEqual(actual[0].metadata, undefined);
            assert.deepStrictEqual(actual[0].targetPlatform, "undefined" /* TargetPlatform.UNDEFINED */);
            assert.deepStrictEqual(actual[0].manifest, manifest);
        });
        test('scan user extension', async () => {
            const manifest = anExtensionManifest({ 'name': 'name', 'publisher': 'pub', __metadata: { id: 'uuid' } });
            const extensionLocation = await aUserExtension(manifest);
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name', uuid: 'uuid' });
            assert.deepStrictEqual(actual[0].location.toString(), extensionLocation.toString());
            assert.deepStrictEqual(actual[0].isBuiltin, false);
            assert.deepStrictEqual(actual[0].type, 1 /* ExtensionType.User */);
            assert.deepStrictEqual(actual[0].isValid, true);
            assert.deepStrictEqual(actual[0].validations, []);
            assert.deepStrictEqual(actual[0].metadata, { id: 'uuid' });
            assert.deepStrictEqual(actual[0].targetPlatform, "undefined" /* TargetPlatform.UNDEFINED */);
            delete manifest.__metadata;
            assert.deepStrictEqual(actual[0].manifest, manifest);
        });
        test('scan existing extension', async () => {
            const manifest = anExtensionManifest({ 'name': 'name', 'publisher': 'pub' });
            const extensionLocation = await aUserExtension(manifest);
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanExistingExtension(extensionLocation, 1 /* ExtensionType.User */, {});
            assert.notEqual(actual, null);
            assert.deepStrictEqual(actual.identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual.location.toString(), extensionLocation.toString());
            assert.deepStrictEqual(actual.isBuiltin, false);
            assert.deepStrictEqual(actual.type, 1 /* ExtensionType.User */);
            assert.deepStrictEqual(actual.isValid, true);
            assert.deepStrictEqual(actual.validations, []);
            assert.deepStrictEqual(actual.metadata, undefined);
            assert.deepStrictEqual(actual.targetPlatform, "undefined" /* TargetPlatform.UNDEFINED */);
            assert.deepStrictEqual(actual.manifest, manifest);
        });
        test('scan single extension', async () => {
            const manifest = anExtensionManifest({ 'name': 'name', 'publisher': 'pub' });
            const extensionLocation = await aUserExtension(manifest);
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanOneOrMultipleExtensions(extensionLocation, 1 /* ExtensionType.User */, {});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].location.toString(), extensionLocation.toString());
            assert.deepStrictEqual(actual[0].isBuiltin, false);
            assert.deepStrictEqual(actual[0].type, 1 /* ExtensionType.User */);
            assert.deepStrictEqual(actual[0].isValid, true);
            assert.deepStrictEqual(actual[0].validations, []);
            assert.deepStrictEqual(actual[0].metadata, undefined);
            assert.deepStrictEqual(actual[0].targetPlatform, "undefined" /* TargetPlatform.UNDEFINED */);
            assert.deepStrictEqual(actual[0].manifest, manifest);
        });
        test('scan multiple extensions', async () => {
            const extensionLocation = await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub' }));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanOneOrMultipleExtensions((0, resources_1.dirname)(extensionLocation), 1 /* ExtensionType.User */, {});
            assert.deepStrictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[1].identifier, { id: 'pub.name2' });
        });
        test('scan user extension with different versions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.1' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.2' }));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.version, '1.0.2');
        });
        test('scan user extension include all versions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.1' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.2' }));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({ includeAllVersions: true });
            assert.deepStrictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.version, '1.0.1');
            assert.deepStrictEqual(actual[1].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[1].manifest.version, '1.0.2');
        });
        test('scan user extension with different versions and higher version is not compatible', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.1' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.2', engines: { vscode: '^1.67.0' } }));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.version, '1.0.1');
        });
        test('scan exclude invalid extensions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub', engines: { vscode: '^1.67.0' } }));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
        });
        test('scan exclude uninstalled extensions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(uri_1.URI.file(instantiationService.get(environment_1.INativeEnvironmentService).extensionsPath), '.obsolete'), buffer_1.VSBuffer.fromString(JSON.stringify({ 'pub.name2-1.0.0': true })));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
        });
        test('scan include uninstalled extensions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(uri_1.URI.file(instantiationService.get(environment_1.INativeEnvironmentService).extensionsPath), '.obsolete'), buffer_1.VSBuffer.fromString(JSON.stringify({ 'pub.name2-1.0.0': true })));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({ includeUninstalled: true });
            assert.deepStrictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[1].identifier, { id: 'pub.name2' });
        });
        test('scan include invalid extensions', async () => {
            await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }));
            await aUserExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub', engines: { vscode: '^1.67.0' } }));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({ includeInvalid: true });
            assert.deepStrictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[1].identifier, { id: 'pub.name2' });
        });
        test('scan system extensions include additional builtin extensions', async () => {
            instantiationService.stub(productService_1.IProductService, {
                version: '1.66.0',
                builtInExtensions: [
                    { name: 'pub.name2', version: '', repo: '', metadata: undefined },
                    { name: 'pub.name', version: '', repo: '', metadata: undefined }
                ]
            });
            await anExtension(anExtensionManifest({ 'name': 'name2', 'publisher': 'pub' }), (0, resources_1.joinPath)(ROOT, 'additional'));
            const extensionLocation = await anExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub' }), (0, resources_1.joinPath)(ROOT, 'additional'));
            await aSystemExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', version: '1.0.1' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(instantiationService.get(environment_1.INativeEnvironmentService).userHome, '.vscode-oss-dev', 'extensions', 'control.json'), buffer_1.VSBuffer.fromString(JSON.stringify({ 'pub.name2': 'disabled', 'pub.name': extensionLocation.fsPath })));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanSystemExtensions({ checkControlFile: true });
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.version, '1.0.0');
        });
        test('scan extension with default nls replacements', async () => {
            const extensionLocation = await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', displayName: '%displayName%' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), buffer_1.VSBuffer.fromString(JSON.stringify({ displayName: 'Hello World' })));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            const actual = await testObject.scanUserExtensions({});
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.displayName, 'Hello World');
        });
        test('scan extension with en nls replacements', async () => {
            const extensionLocation = await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', displayName: '%displayName%' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), buffer_1.VSBuffer.fromString(JSON.stringify({ displayName: 'Hello World' })));
            const nlsLocation = (0, resources_1.joinPath)(extensionLocation, 'package.en.json');
            await instantiationService.get(files_1.IFileService).writeFile(nlsLocation, buffer_1.VSBuffer.fromString(JSON.stringify({ contents: { package: { displayName: 'Hello World EN' } } })));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            translations = { 'pub.name': nlsLocation.fsPath };
            const actual = await testObject.scanUserExtensions({ language: 'en' });
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.displayName, 'Hello World EN');
        });
        test('scan extension falls back to default nls replacements', async () => {
            const extensionLocation = await aUserExtension(anExtensionManifest({ 'name': 'name', 'publisher': 'pub', displayName: '%displayName%' }));
            await instantiationService.get(files_1.IFileService).writeFile((0, resources_1.joinPath)(extensionLocation, 'package.nls.json'), buffer_1.VSBuffer.fromString(JSON.stringify({ displayName: 'Hello World' })));
            const nlsLocation = (0, resources_1.joinPath)(extensionLocation, 'package.en.json');
            await instantiationService.get(files_1.IFileService).writeFile(nlsLocation, buffer_1.VSBuffer.fromString(JSON.stringify({ contents: { package: { displayName: 'Hello World EN' } } })));
            const testObject = instantiationService.createInstance(ExtensionsScannerService);
            translations = { 'pub.name2': nlsLocation.fsPath };
            const actual = await testObject.scanUserExtensions({ language: 'en' });
            assert.deepStrictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].identifier, { id: 'pub.name' });
            assert.deepStrictEqual(actual[0].manifest.displayName, 'Hello World');
        });
        async function aUserExtension(manifest) {
            const environmentService = instantiationService.get(environment_1.INativeEnvironmentService);
            return anExtension(manifest, uri_1.URI.file(environmentService.extensionsPath));
        }
        async function aSystemExtension(manifest) {
            const environmentService = instantiationService.get(environment_1.INativeEnvironmentService);
            return anExtension(manifest, uri_1.URI.file(environmentService.builtinExtensionsPath));
        }
        async function anExtension(manifest, root) {
            var _a, _b;
            const fileService = instantiationService.get(files_1.IFileService);
            const extensionLocation = (0, resources_1.joinPath)(root, `${manifest.publisher}.${manifest.name}-${manifest.version}-${(_b = (_a = manifest.__metadata) === null || _a === void 0 ? void 0 : _a.targetPlatform) !== null && _b !== void 0 ? _b : "undefined" /* TargetPlatform.UNDEFINED */}`);
            await fileService.writeFile((0, resources_1.joinPath)(extensionLocation, 'package.json'), buffer_1.VSBuffer.fromString(JSON.stringify(manifest)));
            return extensionLocation;
        }
        function anExtensionManifest(manifest) {
            return Object.assign({ engines: { vscode: '^1.66.0' }, version: '1.0.0', main: 'main.js', activationEvents: ['*'] }, manifest);
        }
    });
});
//# sourceMappingURL=extensionsScannerService.test.js.map