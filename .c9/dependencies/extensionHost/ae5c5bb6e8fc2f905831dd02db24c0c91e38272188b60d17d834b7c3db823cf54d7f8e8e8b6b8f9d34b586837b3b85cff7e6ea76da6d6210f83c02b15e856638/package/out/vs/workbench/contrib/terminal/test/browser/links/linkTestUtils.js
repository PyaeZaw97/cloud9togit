/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/common/network"], function (require, exports, assert_1, uri_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveLinkForTest = exports.assertLinkHelper = void 0;
    async function assertLinkHelper(text, expected, detector, expectedType) {
        detector.xterm.reset();
        // Write the text and wait for the parser to finish
        await new Promise(r => detector.xterm.write(text, r));
        // Ensure all links are provided
        const lines = [];
        for (let i = 0; i < detector.xterm.buffer.active.cursorY + 1; i++) {
            lines.push(detector.xterm.buffer.active.getLine(i));
        }
        const actualLinks = (await detector.detect(lines, 0, detector.xterm.buffer.active.cursorY)).map(e => {
            return {
                text: e.text,
                type: expectedType,
                bufferRange: e.bufferRange
            };
        });
        const expectedLinks = expected.map(e => {
            return {
                type: expectedType,
                text: e.text,
                bufferRange: {
                    start: { x: e.range[0][0], y: e.range[0][1] },
                    end: { x: e.range[1][0], y: e.range[1][1] },
                }
            };
        });
        (0, assert_1.deepStrictEqual)(actualLinks, expectedLinks);
    }
    exports.assertLinkHelper = assertLinkHelper;
    async function resolveLinkForTest(link, uri) {
        return {
            link,
            uri: uri_1.URI.from({ scheme: network_1.Schemas.file, path: link }),
            isDirectory: false,
        };
    }
    exports.resolveLinkForTest = resolveLinkForTest;
});
//# sourceMappingURL=linkTestUtils.js.map