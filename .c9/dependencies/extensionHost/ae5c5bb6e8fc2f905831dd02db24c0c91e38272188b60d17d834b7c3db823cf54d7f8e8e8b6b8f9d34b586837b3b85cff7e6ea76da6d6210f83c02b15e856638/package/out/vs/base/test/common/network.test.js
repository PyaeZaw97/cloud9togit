/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri"], function (require, exports, assert, network_1, platform_1, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('network', () => {
        (platform_1.isWeb ? test.skip : test)('FileAccess: URI (native)', () => {
            // asCodeUri() & asFileUri(): simple, without authority
            let originalFileUri = uri_1.URI.file('network.test.ts');
            let browserUri = network_1.FileAccess.asBrowserUri(originalFileUri);
            assert.ok(browserUri.authority.length > 0);
            let fileUri = network_1.FileAccess.asFileUri(browserUri);
            assert.strictEqual(fileUri.authority.length, 0);
            assert((0, resources_1.isEqual)(originalFileUri, fileUri));
            // asCodeUri() & asFileUri(): with authority
            originalFileUri = uri_1.URI.file('network.test.ts').with({ authority: 'test-authority' });
            browserUri = network_1.FileAccess.asBrowserUri(originalFileUri);
            assert.strictEqual(browserUri.authority, originalFileUri.authority);
            fileUri = network_1.FileAccess.asFileUri(browserUri);
            assert((0, resources_1.isEqual)(originalFileUri, fileUri));
        });
        (platform_1.isWeb ? test.skip : test)('FileAccess: moduleId (native)', () => {
            const browserUri = network_1.FileAccess.asBrowserUri('vs/base/test/node/network.test', require);
            assert.strictEqual(browserUri.scheme, network_1.Schemas.vscodeFileResource);
            const fileUri = network_1.FileAccess.asFileUri('vs/base/test/node/network.test', require);
            assert.strictEqual(fileUri.scheme, network_1.Schemas.file);
        });
        (platform_1.isWeb ? test.skip : test)('FileAccess: query and fragment is dropped (native)', () => {
            let originalFileUri = uri_1.URI.file('network.test.ts').with({ query: 'foo=bar', fragment: 'something' });
            let browserUri = network_1.FileAccess.asBrowserUri(originalFileUri);
            assert.strictEqual(browserUri.query, '');
            assert.strictEqual(browserUri.fragment, '');
        });
        (platform_1.isWeb ? test.skip : test)('FileAccess: query and fragment is kept if URI is already of same scheme (native)', () => {
            let originalFileUri = uri_1.URI.file('network.test.ts').with({ query: 'foo=bar', fragment: 'something' });
            let browserUri = network_1.FileAccess.asBrowserUri(originalFileUri.with({ scheme: network_1.Schemas.vscodeFileResource }));
            assert.strictEqual(browserUri.query, 'foo=bar');
            assert.strictEqual(browserUri.fragment, 'something');
            let fileUri = network_1.FileAccess.asFileUri(originalFileUri);
            assert.strictEqual(fileUri.query, 'foo=bar');
            assert.strictEqual(fileUri.fragment, 'something');
        });
        (platform_1.isWeb ? test.skip : test)('FileAccess: web', () => {
            const originalHttpsUri = uri_1.URI.file('network.test.ts').with({ scheme: 'https' });
            const browserUri = network_1.FileAccess.asBrowserUri(originalHttpsUri);
            assert.strictEqual(originalHttpsUri.toString(), browserUri.toString());
        });
        test('FileAccess: remote URIs', () => {
            const originalRemoteUri = uri_1.URI.file('network.test.ts').with({ scheme: network_1.Schemas.vscodeRemote });
            const browserUri = network_1.FileAccess.asBrowserUri(originalRemoteUri);
            assert.notStrictEqual(originalRemoteUri.scheme, browserUri.scheme);
        });
    });
});
//# sourceMappingURL=network.test.js.map