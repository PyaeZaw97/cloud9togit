/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "vs/workbench/services/textfile/common/encoding", "vs/base/node/terminalEncoding", "vs/base/common/stream", "@vscode/iconv-lite-umd", "vs/base/test/node/testUtils", "vs/base/common/buffer", "vs/base/common/strings"], function (require, exports, assert, fs, encoding, terminalEncoding, streams, iconv, testUtils_1, buffer_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectEncodingByBOM = void 0;
    async function detectEncodingByBOM(file) {
        try {
            const { buffer, bytesRead } = await readExactlyByFile(file, 3);
            return encoding.detectEncodingByBOMFromBuffer(buffer, bytesRead);
        }
        catch (error) {
            return null; // ignore errors (like file not found)
        }
    }
    exports.detectEncodingByBOM = detectEncodingByBOM;
    function readExactlyByFile(file, totalBytes) {
        return new Promise((resolve, reject) => {
            fs.open(file, 'r', null, (err, fd) => {
                if (err) {
                    return reject(err);
                }
                function end(err, resultBuffer, bytesRead) {
                    fs.close(fd, closeError => {
                        if (closeError) {
                            return reject(closeError);
                        }
                        if (err && err.code === 'EISDIR') {
                            return reject(err); // we want to bubble this error up (file is actually a folder)
                        }
                        return resolve({ buffer: resultBuffer ? buffer_1.VSBuffer.wrap(resultBuffer) : null, bytesRead });
                    });
                }
                const buffer = Buffer.allocUnsafe(totalBytes);
                let offset = 0;
                function readChunk() {
                    fs.read(fd, buffer, offset, totalBytes - offset, null, (err, bytesRead) => {
                        if (err) {
                            return end(err, null, 0);
                        }
                        if (bytesRead === 0) {
                            return end(null, buffer, offset);
                        }
                        offset += bytesRead;
                        if (offset === totalBytes) {
                            return end(null, buffer, offset);
                        }
                        return readChunk();
                    });
                }
                readChunk();
            });
        });
    }
    suite('Encoding', () => {
        test('detectBOM does not return error for non existing file', async () => {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/not-exist.css');
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, null);
        });
        test('detectBOM UTF-8', async () => {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_utf8.css');
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, 'utf8bom');
        });
        test('detectBOM UTF-16 LE', async () => {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_utf16le.css');
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, 'utf16le');
        });
        test('detectBOM UTF-16 BE', async () => {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_utf16be.css');
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, 'utf16be');
        });
        test('detectBOM ANSI', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_ansi.css');
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, null);
        });
        test('detectBOM ANSI', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/empty.txt');
            const detectedEncoding = await detectEncodingByBOM(file);
            assert.strictEqual(detectedEncoding, null);
        });
        test('resolve terminal encoding (detect)', async function () {
            const enc = await terminalEncoding.resolveTerminalEncoding();
            assert.ok(enc.length > 0);
        });
        test('resolve terminal encoding (environment)', async function () {
            process.env['VSCODE_CLI_ENCODING'] = 'utf16le';
            const enc = await terminalEncoding.resolveTerminalEncoding();
            assert.ok(await encoding.encodingExists(enc));
            assert.strictEqual(enc, 'utf16le');
        });
        test('detectEncodingFromBuffer (JSON saved as PNG)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some.json.png');
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('detectEncodingFromBuffer (PNG saved as TXT)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some.png.txt');
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, true);
        });
        test('detectEncodingFromBuffer (XML saved as PNG)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some.xml.png');
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('detectEncodingFromBuffer (QWOFF saved as TXT)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some.qwoff.txt');
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, true);
        });
        test('detectEncodingFromBuffer (CSS saved as QWOFF)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some.css.qwoff');
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('detectEncodingFromBuffer (PDF)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some.pdf');
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.seemsBinary, true);
        });
        test('detectEncodingFromBuffer (guess UTF-16 LE from content without BOM)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/utf16_le_nobom.txt');
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.encoding, encoding.UTF16le);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('detectEncodingFromBuffer (guess UTF-16 BE from content without BOM)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/utf16_be_nobom.txt');
            const buffer = await readExactlyByFile(file, 512);
            const mimes = encoding.detectEncodingFromBuffer(buffer);
            assert.strictEqual(mimes.encoding, encoding.UTF16be);
            assert.strictEqual(mimes.seemsBinary, false);
        });
        test('autoGuessEncoding (UTF8)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_file.css');
            const buffer = await readExactlyByFile(file, 512 * 8);
            const mimes = await encoding.detectEncodingFromBuffer(buffer, true);
            assert.strictEqual(mimes.encoding, 'utf8');
        });
        test('autoGuessEncoding (ASCII)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_ansi.css');
            const buffer = await readExactlyByFile(file, 512 * 8);
            const mimes = await encoding.detectEncodingFromBuffer(buffer, true);
            assert.strictEqual(mimes.encoding, null);
        });
        test('autoGuessEncoding (ShiftJIS)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some.shiftjis.txt');
            const buffer = await readExactlyByFile(file, 512 * 8);
            const mimes = await encoding.detectEncodingFromBuffer(buffer, true);
            assert.strictEqual(mimes.encoding, 'shiftjis');
        });
        test('autoGuessEncoding (CP1252)', async function () {
            const file = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some.cp1252.txt');
            const buffer = await readExactlyByFile(file, 512 * 8);
            const mimes = await encoding.detectEncodingFromBuffer(buffer, true);
            assert.strictEqual(mimes.encoding, 'windows1252');
        });
        async function readAndDecodeFromDisk(path, fileEncoding) {
            return new Promise((resolve, reject) => {
                fs.readFile(path, (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(iconv.decode(data, encoding.toNodeEncoding(fileEncoding)));
                    }
                });
            });
        }
        function newTestReadableStream(buffers) {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            buffers
                .map(buffer_1.VSBuffer.wrap)
                .forEach(buffer => {
                setTimeout(() => {
                    stream.write(buffer);
                });
            });
            setTimeout(() => {
                stream.end();
            });
            return stream;
        }
        async function readAllAsString(stream) {
            return streams.consumeStream(stream, strings => strings.join(''));
        }
        test('toDecodeStream - some stream', async function () {
            const source = newTestReadableStream([
                Buffer.from([65, 66, 67]),
                Buffer.from([65, 66, 67]),
                Buffer.from([65, 66, 67]),
            ]);
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            assert.strictEqual(content, 'ABCABCABC');
        });
        test('toDecodeStream - some stream, expect too much data', async function () {
            const source = newTestReadableStream([
                Buffer.from([65, 66, 67]),
                Buffer.from([65, 66, 67]),
                Buffer.from([65, 66, 67]),
            ]);
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 64, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            assert.strictEqual(content, 'ABCABCABC');
        });
        test('toDecodeStream - some stream, no data', async function () {
            const source = (0, buffer_1.newWriteableBufferStream)();
            source.end();
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 512, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            assert.strictEqual(content, '');
        });
        test('toDecodeStream - encoding, utf16be', async function () {
            const path = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_utf16be.css');
            const source = (0, buffer_1.streamToBufferReadableStream)(fs.createReadStream(path));
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 64, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.strictEqual(detected.encoding, 'utf16be');
            assert.strictEqual(detected.seemsBinary, false);
            const expected = await readAndDecodeFromDisk(path, detected.encoding);
            const actual = await readAllAsString(stream);
            assert.strictEqual(actual, expected);
        });
        test('toDecodeStream - empty file', async function () {
            const path = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/empty.txt');
            const source = (0, buffer_1.streamToBufferReadableStream)(fs.createReadStream(path));
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            const expected = await readAndDecodeFromDisk(path, detected.encoding);
            const actual = await readAllAsString(stream);
            assert.strictEqual(actual, expected);
        });
        test('toDecodeStream - decodes buffer entirely', async function () {
            const emojis = Buffer.from('🖥️💻💾');
            const incompleteEmojis = emojis.slice(0, emojis.length - 1);
            const buffers = [];
            for (let i = 0; i < incompleteEmojis.length; i++) {
                buffers.push(incompleteEmojis.slice(i, i + 1));
            }
            const source = newTestReadableStream(buffers);
            const { stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            const expected = new TextDecoder().decode(incompleteEmojis);
            const actual = await readAllAsString(stream);
            assert.strictEqual(actual, expected);
        });
        test('toDecodeStream - some stream (GBK issue #101856)', async function () {
            const path = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_gbk.txt');
            const source = (0, buffer_1.streamToBufferReadableStream)(fs.createReadStream(path));
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: async () => 'gbk' });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            assert.strictEqual(content.length, 65537);
        });
        test('toDecodeStream - some stream (UTF-8 issue #102202)', async function () {
            const path = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/issue_102202.txt');
            const source = (0, buffer_1.streamToBufferReadableStream)(fs.createReadStream(path));
            const { detected, stream } = await encoding.toDecodeStream(source, { acceptTextOnly: true, minBytesRequiredForDetection: 4, guessEncoding: false, overwriteEncoding: async () => 'utf-8' });
            assert.ok(detected);
            assert.ok(stream);
            const content = await readAllAsString(stream);
            const lines = (0, strings_1.splitLines)(content);
            assert.strictEqual(lines[981].toString(), '啊啊啊啊啊啊aaa啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊，啊啊啊啊啊啊啊啊啊啊啊。');
        });
        test('toDecodeStream - binary', async function () {
            const source = () => {
                return newTestReadableStream([
                    Buffer.from([0, 0, 0]),
                    Buffer.from('Hello World'),
                    Buffer.from([0])
                ]);
            };
            // acceptTextOnly: true
            let error = undefined;
            try {
                await encoding.toDecodeStream(source(), { acceptTextOnly: true, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            }
            catch (e) {
                error = e;
            }
            assert.ok(error instanceof encoding.DecodeStreamError);
            assert.strictEqual(error.decodeStreamErrorKind, 1 /* encoding.DecodeStreamErrorKind.STREAM_IS_BINARY */);
            // acceptTextOnly: false
            const { detected, stream } = await encoding.toDecodeStream(source(), { acceptTextOnly: false, guessEncoding: false, overwriteEncoding: async (detected) => detected || encoding.UTF8 });
            assert.ok(detected);
            assert.strictEqual(detected.seemsBinary, true);
            assert.ok(stream);
        });
        test('toEncodeReadable - encoding, utf16be', async function () {
            const path = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/some_utf16be.css');
            const source = await readAndDecodeFromDisk(path, encoding.UTF16be);
            const expected = buffer_1.VSBuffer.wrap(iconv.encode(source, encoding.toNodeEncoding(encoding.UTF16be))).toString();
            const actual = streams.consumeReadable(await encoding.toEncodeReadable(streams.toReadable(source), encoding.UTF16be), buffer_1.VSBuffer.concat).toString();
            assert.strictEqual(actual, expected);
        });
        test('toEncodeReadable - empty readable to utf8', async function () {
            const source = {
                read() {
                    return null;
                }
            };
            const actual = streams.consumeReadable(await encoding.toEncodeReadable(source, encoding.UTF8), buffer_1.VSBuffer.concat).toString();
            assert.strictEqual(actual, '');
        });
        [{
                utfEncoding: encoding.UTF8,
                relatedBom: encoding.UTF8_BOM
            }, {
                utfEncoding: encoding.UTF8_with_bom,
                relatedBom: encoding.UTF8_BOM
            }, {
                utfEncoding: encoding.UTF16be,
                relatedBom: encoding.UTF16be_BOM,
            }, {
                utfEncoding: encoding.UTF16le,
                relatedBom: encoding.UTF16le_BOM
            }].forEach(({ utfEncoding, relatedBom }) => {
            test(`toEncodeReadable - empty readable to ${utfEncoding} with BOM`, async function () {
                const source = {
                    read() {
                        return null;
                    }
                };
                const encodedReadable = encoding.toEncodeReadable(source, utfEncoding, { addBOM: true });
                const expected = buffer_1.VSBuffer.wrap(Buffer.from(relatedBom)).toString();
                const actual = streams.consumeReadable(await encodedReadable, buffer_1.VSBuffer.concat).toString();
                assert.strictEqual(actual, expected);
            });
        });
        test('encodingExists', async function () {
            for (const enc in encoding.SUPPORTED_ENCODINGS) {
                if (enc === encoding.UTF8_with_bom) {
                    continue; // skip over encodings from us
                }
                assert.strictEqual(iconv.encodingExists(enc), true, enc);
            }
        });
    });
});
//# sourceMappingURL=encoding.test.js.map