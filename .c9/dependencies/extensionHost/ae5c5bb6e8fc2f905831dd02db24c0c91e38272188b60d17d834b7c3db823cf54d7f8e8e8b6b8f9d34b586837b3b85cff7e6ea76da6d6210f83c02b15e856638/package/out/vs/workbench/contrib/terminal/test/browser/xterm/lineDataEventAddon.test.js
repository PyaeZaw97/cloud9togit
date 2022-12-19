/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "xterm", "vs/workbench/contrib/terminal/browser/xterm/lineDataEventAddon", "assert", "vs/base/common/async"], function (require, exports, xterm_1, lineDataEventAddon_1, assert_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function writeP(terminal, data) {
        return new Promise((resolve, reject) => {
            const failTimeout = (0, async_1.timeout)(2000);
            failTimeout.then(() => reject('Writing to xterm is taking longer than 2 seconds'));
            terminal.write(data, () => {
                failTimeout.cancel();
                resolve();
            });
        });
    }
    suite('LineDataEventAddon', () => {
        let xterm;
        let lineDataEventAddon;
        suite('onLineData', () => {
            let events;
            setup(() => {
                xterm = new xterm_1.Terminal({
                    cols: 4
                });
                lineDataEventAddon = new lineDataEventAddon_1.LineDataEventAddon();
                xterm.loadAddon(lineDataEventAddon);
                events = [];
                lineDataEventAddon.onLineData(e => events.push(e));
            });
            test('should fire when a non-wrapped line ends with a line feed', async () => {
                await writeP(xterm, 'foo');
                (0, assert_1.deepStrictEqual)(events, []);
                await writeP(xterm, '\n\r');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
                await writeP(xterm, 'bar');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
                await writeP(xterm, '\n');
                (0, assert_1.deepStrictEqual)(events, ['foo', 'bar']);
            });
            test('should not fire soft wrapped lines', async () => {
                await writeP(xterm, 'foo.');
                (0, assert_1.deepStrictEqual)(events, []);
                await writeP(xterm, 'bar.');
                (0, assert_1.deepStrictEqual)(events, []);
                await writeP(xterm, 'baz.');
                (0, assert_1.deepStrictEqual)(events, []);
            });
            test('should fire when a wrapped line ends with a line feed', async () => {
                await writeP(xterm, 'foo.bar.baz.');
                (0, assert_1.deepStrictEqual)(events, []);
                await writeP(xterm, '\n\r');
                (0, assert_1.deepStrictEqual)(events, ['foo.bar.baz.']);
            });
            test('should not fire on cursor move when the backing process is not on Windows', async () => {
                await writeP(xterm, 'foo.\x1b[H');
                (0, assert_1.deepStrictEqual)(events, []);
            });
            test('should fire on cursor move when the backing process is on Windows', async () => {
                lineDataEventAddon.setOperatingSystem(1 /* OperatingSystem.Windows */);
                await writeP(xterm, 'foo\x1b[H');
                (0, assert_1.deepStrictEqual)(events, ['foo']);
            });
        });
    });
});
//# sourceMappingURL=lineDataEventAddon.test.js.map