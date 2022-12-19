/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/comparers"], function (require, exports, assert, comparers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const compareLocale = (a, b) => a.localeCompare(b);
    const compareLocaleNumeric = (a, b) => a.localeCompare(b, undefined, { numeric: true });
    suite('Comparers', () => {
        test('compareFileNames', () => {
            //
            // Comparisons with the same results as compareFileNamesDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNames)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileNames)(null, 'abc') < 0, 'null should be come before real values');
            assert((0, comparers_1.compareFileNames)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileNames)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileNames)('z', 'A') > 0, 'z comes after A');
            assert((0, comparers_1.compareFileNames)('Z', 'a') > 0, 'Z comes after a');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileNames)('bbb.aaa', 'aaa.bbb') > 0, 'compares the whole name all at once by locale');
            assert((0, comparers_1.compareFileNames)('aggregate.go', 'aggregate_repo.go') > 0, 'compares the whole name all at once by locale');
            // dotfile comparisons
            assert((0, comparers_1.compareFileNames)('.abc', '.abc') === 0, 'equal dotfile names should be equal');
            assert((0, comparers_1.compareFileNames)('.env.', '.gitattributes') < 0, 'filenames starting with dots and with extensions should still sort properly');
            assert((0, comparers_1.compareFileNames)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileNames)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            assert((0, comparers_1.compareFileNames)('.aaa_env', '.aaa.env') < 0, 'an underscore in a dotfile name will sort before a dot');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileNames)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileNames)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileNames)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileNames)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            assert((0, comparers_1.compareFileNames)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileNames)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileNames)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileNames)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileNames)('abc2.txt', 'abc10.txt') < 0, 'filenames with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileNames)('abc02.txt', 'abc010.txt') < 0, 'filenames with numbers that have leading zeros sort numerically');
            assert((0, comparers_1.compareFileNames)('abc1.10.txt', 'abc1.2.txt') > 0, 'numbers with dots between them are treated as two separate numbers, not one decimal number');
            assert((0, comparers_1.compareFileNames)('a.ext1', 'b.Ext1') < 0, 'if names are different and extensions with numbers are equal except for case, filenames are sorted in name order');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileNames), ['A2.txt', 'a10.txt', 'a20.txt', 'A100.txt'], 'filenames with number and case differences compare numerically');
            //
            // Comparisons with different results than compareFileNamesDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNames)('a', 'A') !== compareLocale('a', 'A'), 'the same letter sorts in unicode order, not by locale');
            assert((0, comparers_1.compareFileNames)('â', 'Â') !== compareLocale('â', 'Â'), 'the same accented letter sorts in unicode order, not by locale');
            assert.notDeepStrictEqual(['artichoke', 'Artichoke', 'art', 'Art'].sort(comparers_1.compareFileNames), ['artichoke', 'Artichoke', 'art', 'Art'].sort(compareLocale), 'words with the same root and different cases do not sort in locale order');
            assert.notDeepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileNames), ['email', 'Email', 'émail', 'Émail'].sort(compareLocale), 'the same base characters with different case or accents do not sort in locale order');
            // numeric comparisons
            assert((0, comparers_1.compareFileNames)('abc02.txt', 'abc002.txt') > 0, 'filenames with equivalent numbers and leading zeros sort in unicode order');
            assert((0, comparers_1.compareFileNames)('abc.txt1', 'abc.txt01') > 0, 'same name plus extensions with equal numbers sort in unicode order');
            assert((0, comparers_1.compareFileNames)('art01', 'Art01') !== 'art01'.localeCompare('Art01', undefined, { numeric: true }), 'a numerically equivalent word of a different case does not compare numerically based on locale');
            assert((0, comparers_1.compareFileNames)('a.ext1', 'a.Ext1') > 0, 'if names are equal and extensions with numbers are equal except for case, filenames are sorted in full filename unicode order');
        });
        test('compareFileExtensions', () => {
            //
            // Comparisons with the same results as compareFileExtensionsDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensions)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileExtensions)(null, 'abc') < 0, 'null should come before real files without extension');
            assert((0, comparers_1.compareFileExtensions)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileExtensions)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileExtensions)('z', 'A') > 0, 'z comes after A');
            assert((0, comparers_1.compareFileExtensions)('Z', 'a') > 0, 'Z comes after a');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensions)('file.ext', 'file.ext') === 0, 'equal full names should be equal');
            assert((0, comparers_1.compareFileExtensions)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileExtensions)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileExtensions)('bbb.aaa', 'aaa.bbb') < 0, 'files should be compared by extensions even if filenames compare differently');
            // dotfile comparisons
            assert((0, comparers_1.compareFileExtensions)('.abc', '.abc') === 0, 'equal dotfiles should be equal');
            assert((0, comparers_1.compareFileExtensions)('.md', '.Gitattributes') > 0, 'dotfiles sort alphabetically regardless of case');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileExtensions)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileExtensions)('.env', 'aaa.env') < 0, 'if equal extensions, filenames should be compared, empty filename should come before others');
            assert((0, comparers_1.compareFileExtensions)('.MD', 'a.md') < 0, 'if extensions differ in case, files sort by extension in unicode order');
            // numeric comparisons
            assert((0, comparers_1.compareFileExtensions)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileExtensions)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileExtensions)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensions)('abc2.txt', 'abc10.txt') < 0, 'filenames with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileExtensions)('abc02.txt', 'abc010.txt') < 0, 'filenames with numbers that have leading zeros sort numerically');
            assert((0, comparers_1.compareFileExtensions)('abc1.10.txt', 'abc1.2.txt') > 0, 'numbers with dots between them are treated as two separate numbers, not one decimal number');
            assert((0, comparers_1.compareFileExtensions)('abc2.txt2', 'abc1.txt10') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensions)('txt.abc1', 'txt.abc1') === 0, 'equal extensions with numbers should be equal');
            assert((0, comparers_1.compareFileExtensions)('txt.abc1', 'txt.abc2') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensions)('txt.abc2', 'txt.abc10') < 0, 'extensions with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileExtensions)('a.ext1', 'b.ext1') < 0, 'if equal extensions with numbers, names should be compared');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileExtensions), ['A2.txt', 'a10.txt', 'a20.txt', 'A100.txt'], 'filenames with number and case differences compare numerically');
            //
            // Comparisons with different results from compareFileExtensionsDefault
            //
            // name-only comparisions
            assert((0, comparers_1.compareFileExtensions)('a', 'A') !== compareLocale('a', 'A'), 'the same letter of different case does not sort by locale');
            assert((0, comparers_1.compareFileExtensions)('â', 'Â') !== compareLocale('â', 'Â'), 'the same accented letter of different case does not sort by locale');
            assert.notDeepStrictEqual(['artichoke', 'Artichoke', 'art', 'Art'].sort(comparers_1.compareFileExtensions), ['artichoke', 'Artichoke', 'art', 'Art'].sort(compareLocale), 'words with the same root and different cases do not sort in locale order');
            assert.notDeepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileExtensions), ['email', 'Email', 'émail', 'Émail'].sort((a, b) => a.localeCompare(b)), 'the same base characters with different case or accents do not sort in locale order');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensions)('a.MD', 'a.md') < 0, 'case differences in extensions sort in unicode order');
            assert((0, comparers_1.compareFileExtensions)('a.md', 'A.md') > 0, 'case differences in names sort in unicode order');
            assert((0, comparers_1.compareFileExtensions)('a.md', 'b.MD') > 0, 'when extensions are the same except for case, the files sort by extension');
            assert((0, comparers_1.compareFileExtensions)('aggregate.go', 'aggregate_repo.go') < 0, 'when extensions are equal, names sort in dictionary order');
            // dotfile comparisons
            assert((0, comparers_1.compareFileExtensions)('.env', '.aaa.env') < 0, 'a dotfile with an extension is treated as a name plus an extension - equal extensions');
            assert((0, comparers_1.compareFileExtensions)('.env', '.env.aaa') > 0, 'a dotfile with an extension is treated as a name plus an extension - unequal extensions');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileExtensions)('.env', 'aaa') > 0, 'filenames without extensions come before dotfiles');
            assert((0, comparers_1.compareFileExtensions)('.md', 'A.MD') > 0, 'a file with an uppercase extension sorts before a dotfile of the same lowercase extension');
            // numeric comparisons
            assert((0, comparers_1.compareFileExtensions)('abc.txt01', 'abc.txt1') < 0, 'extensions with equal numbers sort in unicode order');
            assert((0, comparers_1.compareFileExtensions)('art01', 'Art01') !== compareLocaleNumeric('art01', 'Art01'), 'a numerically equivalent word of a different case does not compare by locale');
            assert((0, comparers_1.compareFileExtensions)('abc02.txt', 'abc002.txt') > 0, 'filenames with equivalent numbers and leading zeros sort in unicode order');
            assert((0, comparers_1.compareFileExtensions)('txt.abc01', 'txt.abc1') < 0, 'extensions with equivalent numbers sort in unicode order');
            assert((0, comparers_1.compareFileExtensions)('a.ext1', 'b.Ext1') > 0, 'if names are different and extensions with numbers are equal except for case, filenames are sorted in extension unicode order');
            assert((0, comparers_1.compareFileExtensions)('a.ext1', 'a.Ext1') > 0, 'if names are equal and extensions with numbers are equal except for case, filenames are sorted in extension unicode order');
        });
        test('compareFileNamesDefault', () => {
            //
            // Comparisons with the same results as compareFileNames
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNamesDefault)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileNamesDefault)(null, 'abc') < 0, 'null should be come before real values');
            assert((0, comparers_1.compareFileNamesDefault)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileNamesDefault)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileNamesDefault)('z', 'A') > 0, 'z comes after A');
            assert((0, comparers_1.compareFileNamesDefault)('Z', 'a') > 0, 'Z comes after a');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileNamesDefault)('file.ext', 'file.ext') === 0, 'equal full names should be equal');
            assert((0, comparers_1.compareFileNamesDefault)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileNamesDefault)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileNamesDefault)('bbb.aaa', 'aaa.bbb') > 0, 'files should be compared by names even if extensions compare differently');
            assert((0, comparers_1.compareFileNamesDefault)('aggregate.go', 'aggregate_repo.go') > 0, 'compares the whole filename in locale order');
            // dotfile comparisons
            assert((0, comparers_1.compareFileNamesDefault)('.abc', '.abc') === 0, 'equal dotfile names should be equal');
            assert((0, comparers_1.compareFileNamesDefault)('.env.', '.gitattributes') < 0, 'filenames starting with dots and with extensions should still sort properly');
            assert((0, comparers_1.compareFileNamesDefault)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileNamesDefault)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            assert((0, comparers_1.compareFileNamesDefault)('.aaa_env', '.aaa.env') < 0, 'an underscore in a dotfile name will sort before a dot');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileNamesDefault)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileNamesDefault)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileNamesDefault)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileNamesDefault)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            assert((0, comparers_1.compareFileNamesDefault)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileNamesDefault)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileNamesDefault)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileNamesDefault)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileNamesDefault)('abc2.txt', 'abc10.txt') < 0, 'filenames with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileNamesDefault)('abc02.txt', 'abc010.txt') < 0, 'filenames with numbers that have leading zeros sort numerically');
            assert((0, comparers_1.compareFileNamesDefault)('abc1.10.txt', 'abc1.2.txt') > 0, 'numbers with dots between them are treated as two separate numbers, not one decimal number');
            assert((0, comparers_1.compareFileNamesDefault)('a.ext1', 'b.Ext1') < 0, 'if names are different and extensions with numbers are equal except for case, filenames are compared by full filename');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileNamesDefault), ['A2.txt', 'a10.txt', 'a20.txt', 'A100.txt'], 'filenames with number and case differences compare numerically');
            //
            // Comparisons with different results than compareFileNames
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNamesDefault)('a', 'A') === compareLocale('a', 'A'), 'the same letter sorts by locale');
            assert((0, comparers_1.compareFileNamesDefault)('â', 'Â') === compareLocale('â', 'Â'), 'the same accented letter sorts by locale');
            assert.deepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileNamesDefault), ['email', 'Email', 'émail', 'Émail'].sort(compareLocale), 'the same base characters with different case or accents sort in locale order');
            // numeric comparisons
            assert((0, comparers_1.compareFileNamesDefault)('abc02.txt', 'abc002.txt') < 0, 'filenames with equivalent numbers and leading zeros sort shortest number first');
            assert((0, comparers_1.compareFileNamesDefault)('abc.txt1', 'abc.txt01') < 0, 'same name plus extensions with equal numbers sort shortest number first');
            assert((0, comparers_1.compareFileNamesDefault)('art01', 'Art01') === compareLocaleNumeric('art01', 'Art01'), 'a numerically equivalent word of a different case compares numerically based on locale');
            assert((0, comparers_1.compareFileNamesDefault)('a.ext1', 'a.Ext1') === compareLocale('ext1', 'Ext1'), 'if names are equal and extensions with numbers are equal except for case, filenames are sorted in extension locale order');
        });
        test('compareFileExtensionsDefault', () => {
            //
            // Comparisons with the same result as compareFileExtensions
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileExtensionsDefault)(null, 'abc') < 0, 'null should come before real files without extensions');
            assert((0, comparers_1.compareFileExtensionsDefault)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileExtensionsDefault)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileExtensionsDefault)('z', 'A') > 0, 'z comes after A');
            assert((0, comparers_1.compareFileExtensionsDefault)('Z', 'a') > 0, 'Z comes after a');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)('file.ext', 'file.ext') === 0, 'equal full filenames should be equal');
            assert((0, comparers_1.compareFileExtensionsDefault)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsDefault)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileExtensionsDefault)('bbb.aaa', 'aaa.bbb') < 0, 'files should be compared by extension first');
            // dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)('.abc', '.abc') === 0, 'equal dotfiles should be equal');
            assert((0, comparers_1.compareFileExtensionsDefault)('.md', '.Gitattributes') > 0, 'dotfiles sort alphabetically regardless of case');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileExtensionsDefault)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileExtensionsDefault)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileExtensionsDefault)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileExtensionsDefault)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsDefault)('abc2.txt', 'abc10.txt') < 0, 'filenames with numbers should be in numerical order');
            assert((0, comparers_1.compareFileExtensionsDefault)('abc02.txt', 'abc010.txt') < 0, 'filenames with numbers that have leading zeros sort numerically');
            assert((0, comparers_1.compareFileExtensionsDefault)('abc1.10.txt', 'abc1.2.txt') > 0, 'numbers with dots between them are treated as two separate numbers, not one decimal number');
            assert((0, comparers_1.compareFileExtensionsDefault)('abc2.txt2', 'abc1.txt10') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsDefault)('txt.abc1', 'txt.abc1') === 0, 'equal extensions with numbers should be equal');
            assert((0, comparers_1.compareFileExtensionsDefault)('txt.abc1', 'txt.abc2') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsDefault)('txt.abc2', 'txt.abc10') < 0, 'extensions with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileExtensionsDefault)('a.ext1', 'b.ext1') < 0, 'if equal extensions with numbers, full filenames should be compared');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileExtensionsDefault), ['A2.txt', 'a10.txt', 'a20.txt', 'A100.txt'], 'filenames with number and case differences compare numerically');
            //
            // Comparisons with different results than compareFileExtensions
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)('a', 'A') === compareLocale('a', 'A'), 'the same letter of different case sorts by locale');
            assert((0, comparers_1.compareFileExtensionsDefault)('â', 'Â') === compareLocale('â', 'Â'), 'the same accented letter of different case sorts by locale');
            assert.deepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileExtensionsDefault), ['email', 'Email', 'émail', 'Émail'].sort((a, b) => a.localeCompare(b)), 'the same base characters with different case or accents sort in locale order');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)('a.MD', 'a.md') === compareLocale('MD', 'md'), 'case differences in extensions sort by locale');
            assert((0, comparers_1.compareFileExtensionsDefault)('a.md', 'A.md') === compareLocale('a', 'A'), 'case differences in names sort by locale');
            assert((0, comparers_1.compareFileExtensionsDefault)('a.md', 'b.MD') < 0, 'when extensions are the same except for case, the files sort by name');
            assert((0, comparers_1.compareFileExtensionsDefault)('aggregate.go', 'aggregate_repo.go') > 0, 'names with the same extension sort in full filename locale order');
            // dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileExtensionsDefault)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileExtensionsDefault)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileExtensionsDefault)('abc.txt01', 'abc.txt1') > 0, 'extensions with equal numbers should be in shortest-first order');
            assert((0, comparers_1.compareFileExtensionsDefault)('art01', 'Art01') === compareLocaleNumeric('art01', 'Art01'), 'a numerically equivalent word of a different case compares numerically based on locale');
            assert((0, comparers_1.compareFileExtensionsDefault)('abc02.txt', 'abc002.txt') < 0, 'filenames with equivalent numbers and leading zeros sort shortest string first');
            assert((0, comparers_1.compareFileExtensionsDefault)('txt.abc01', 'txt.abc1') > 0, 'extensions with equivalent numbers sort shortest extension first');
            assert((0, comparers_1.compareFileExtensionsDefault)('a.ext1', 'b.Ext1') < 0, 'if extensions with numbers are equal except for case, full filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsDefault)('a.ext1', 'a.Ext1') === compareLocale('a.ext1', 'a.Ext1'), 'if extensions with numbers are equal except for case, full filenames are compared in locale order');
        });
        test('compareFileNamesUpper', () => {
            //
            // Comparisons with the same results as compareFileNamesDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNamesUpper)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileNamesUpper)(null, 'abc') < 0, 'null should be come before real values');
            assert((0, comparers_1.compareFileNamesUpper)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileNamesUpper)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileNamesUpper)('z', 'A') > 0, 'z comes after A');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileNamesUpper)('file.ext', 'file.ext') === 0, 'equal full names should be equal');
            assert((0, comparers_1.compareFileNamesUpper)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileNamesUpper)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileNamesUpper)('bbb.aaa', 'aaa.bbb') > 0, 'files should be compared by names even if extensions compare differently');
            assert((0, comparers_1.compareFileNamesUpper)('aggregate.go', 'aggregate_repo.go') > 0, 'compares the full filename in locale order');
            // dotfile comparisons
            assert((0, comparers_1.compareFileNamesUpper)('.abc', '.abc') === 0, 'equal dotfile names should be equal');
            assert((0, comparers_1.compareFileNamesUpper)('.env.', '.gitattributes') < 0, 'filenames starting with dots and with extensions should still sort properly');
            assert((0, comparers_1.compareFileNamesUpper)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileNamesUpper)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            assert((0, comparers_1.compareFileNamesUpper)('.aaa_env', '.aaa.env') < 0, 'an underscore in a dotfile name will sort before a dot');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileNamesUpper)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileNamesUpper)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileNamesUpper)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileNamesUpper)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            assert((0, comparers_1.compareFileNamesUpper)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileNamesUpper)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileNamesUpper)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileNamesUpper)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileNamesUpper)('abc2.txt', 'abc10.txt') < 0, 'filenames with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileNamesUpper)('abc02.txt', 'abc010.txt') < 0, 'filenames with numbers that have leading zeros sort numerically');
            assert((0, comparers_1.compareFileNamesUpper)('abc1.10.txt', 'abc1.2.txt') > 0, 'numbers with dots between them are treated as two separate numbers, not one decimal number');
            assert((0, comparers_1.compareFileNamesUpper)('abc02.txt', 'abc002.txt') < 0, 'filenames with equivalent numbers and leading zeros sort shortest number first');
            assert((0, comparers_1.compareFileNamesUpper)('abc.txt1', 'abc.txt01') < 0, 'same name plus extensions with equal numbers sort shortest number first');
            assert((0, comparers_1.compareFileNamesUpper)('a.ext1', 'b.Ext1') < 0, 'different names with the equal extensions except for case are sorted by full filename');
            assert((0, comparers_1.compareFileNamesUpper)('a.ext1', 'a.Ext1') === compareLocale('a.ext1', 'a.Ext1'), 'same names with equal and extensions except for case are sorted in full filename locale order');
            //
            // Comparisons with different results than compareFileNamesDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNamesUpper)('Z', 'a') < 0, 'Z comes before a');
            assert((0, comparers_1.compareFileNamesUpper)('a', 'A') > 0, 'the same letter sorts uppercase first');
            assert((0, comparers_1.compareFileNamesUpper)('â', 'Â') > 0, 'the same accented letter sorts uppercase first');
            assert.deepStrictEqual(['artichoke', 'Artichoke', 'art', 'Art'].sort(comparers_1.compareFileNamesUpper), ['Art', 'Artichoke', 'art', 'artichoke'], 'names with the same root and different cases sort uppercase first');
            assert.deepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileNamesUpper), ['Email', 'Émail', 'email', 'émail'], 'the same base characters with different case or accents sort uppercase first');
            // numeric comparisons
            assert((0, comparers_1.compareFileNamesUpper)('art01', 'Art01') > 0, 'a numerically equivalent name of a different case compares uppercase first');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileNamesUpper), ['A2.txt', 'A100.txt', 'a10.txt', 'a20.txt'], 'filenames with number and case differences group by case then compare by number');
        });
        test('compareFileExtensionsUpper', () => {
            //
            // Comparisons with the same result as compareFileExtensionsDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensionsUpper)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileExtensionsUpper)(null, 'abc') < 0, 'null should come before real files without extensions');
            assert((0, comparers_1.compareFileExtensionsUpper)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileExtensionsUpper)('z', 'A') > 0, 'z comes after A');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensionsUpper)('file.ext', 'file.ext') === 0, 'equal full filenames should be equal');
            assert((0, comparers_1.compareFileExtensionsUpper)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsUpper)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileExtensionsUpper)('bbb.aaa', 'aaa.bbb') < 0, 'files should be compared by extension first');
            assert((0, comparers_1.compareFileExtensionsUpper)('a.md', 'b.MD') < 0, 'when extensions are the same except for case, the files sort by name');
            assert((0, comparers_1.compareFileExtensionsUpper)('a.MD', 'a.md') === compareLocale('MD', 'md'), 'case differences in extensions sort by locale');
            assert((0, comparers_1.compareFileExtensionsUpper)('aggregate.go', 'aggregate_repo.go') > 0, 'when extensions are equal, compares the full filename');
            // dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsUpper)('.abc', '.abc') === 0, 'equal dotfiles should be equal');
            assert((0, comparers_1.compareFileExtensionsUpper)('.md', '.Gitattributes') > 0, 'dotfiles sort alphabetically regardless of case');
            assert((0, comparers_1.compareFileExtensionsUpper)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileExtensionsUpper)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsUpper)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileExtensionsUpper)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileExtensionsUpper)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            assert((0, comparers_1.compareFileExtensionsUpper)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileExtensionsUpper)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileExtensionsUpper)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc2.txt', 'abc10.txt') < 0, 'filenames with numbers should be in numerical order');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc02.txt', 'abc010.txt') < 0, 'filenames with numbers that have leading zeros sort numerically');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc1.10.txt', 'abc1.2.txt') > 0, 'numbers with dots between them are treated as two separate numbers, not one decimal number');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc2.txt2', 'abc1.txt10') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsUpper)('txt.abc1', 'txt.abc1') === 0, 'equal extensions with numbers should be equal');
            assert((0, comparers_1.compareFileExtensionsUpper)('txt.abc1', 'txt.abc2') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsUpper)('txt.abc2', 'txt.abc10') < 0, 'extensions with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileExtensionsUpper)('a.ext1', 'b.ext1') < 0, 'if equal extensions with numbers, full filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc.txt01', 'abc.txt1') > 0, 'extensions with equal numbers should be in shortest-first order');
            assert((0, comparers_1.compareFileExtensionsUpper)('abc02.txt', 'abc002.txt') < 0, 'filenames with equivalent numbers and leading zeros sort shortest string first');
            assert((0, comparers_1.compareFileExtensionsUpper)('txt.abc01', 'txt.abc1') > 0, 'extensions with equivalent numbers sort shortest extension first');
            assert((0, comparers_1.compareFileExtensionsUpper)('a.ext1', 'b.Ext1') < 0, 'different names and extensions that are equal except for case are sorted in full filename order');
            assert((0, comparers_1.compareFileExtensionsUpper)('a.ext1', 'a.Ext1') === compareLocale('a.ext1', 'b.Ext1'), 'same names and extensions that are equal except for case are sorted in full filename locale order');
            //
            // Comparisons with different results than compareFileExtensionsDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensionsUpper)('Z', 'a') < 0, 'Z comes before a');
            assert((0, comparers_1.compareFileExtensionsUpper)('a', 'A') > 0, 'the same letter sorts uppercase first');
            assert((0, comparers_1.compareFileExtensionsUpper)('â', 'Â') > 0, 'the same accented letter sorts uppercase first');
            assert.deepStrictEqual(['artichoke', 'Artichoke', 'art', 'Art'].sort(comparers_1.compareFileExtensionsUpper), ['Art', 'Artichoke', 'art', 'artichoke'], 'names with the same root and different cases sort uppercase names first');
            assert.deepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileExtensionsUpper), ['Email', 'Émail', 'email', 'émail'], 'the same base characters with different case or accents sort uppercase names first');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensionsUpper)('a.md', 'A.md') > 0, 'case differences in names sort uppercase first');
            assert((0, comparers_1.compareFileExtensionsUpper)('art01', 'Art01') > 0, 'a numerically equivalent word of a different case sorts uppercase first');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileExtensionsUpper), ['A2.txt', 'A100.txt', 'a10.txt', 'a20.txt',], 'filenames with number and case differences group by case then sort by number');
        });
        test('compareFileNamesLower', () => {
            //
            // Comparisons with the same results as compareFileNamesDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNamesLower)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileNamesLower)(null, 'abc') < 0, 'null should be come before real values');
            assert((0, comparers_1.compareFileNamesLower)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileNamesLower)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileNamesLower)('Z', 'a') > 0, 'Z comes after a');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileNamesLower)('file.ext', 'file.ext') === 0, 'equal full names should be equal');
            assert((0, comparers_1.compareFileNamesLower)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileNamesLower)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileNamesLower)('bbb.aaa', 'aaa.bbb') > 0, 'files should be compared by names even if extensions compare differently');
            assert((0, comparers_1.compareFileNamesLower)('aggregate.go', 'aggregate_repo.go') > 0, 'compares full filenames');
            // dotfile comparisons
            assert((0, comparers_1.compareFileNamesLower)('.abc', '.abc') === 0, 'equal dotfile names should be equal');
            assert((0, comparers_1.compareFileNamesLower)('.env.', '.gitattributes') < 0, 'filenames starting with dots and with extensions should still sort properly');
            assert((0, comparers_1.compareFileNamesLower)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileNamesLower)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            assert((0, comparers_1.compareFileNamesLower)('.aaa_env', '.aaa.env') < 0, 'an underscore in a dotfile name will sort before a dot');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileNamesLower)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileNamesLower)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileNamesLower)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileNamesLower)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            assert((0, comparers_1.compareFileNamesLower)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileNamesLower)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileNamesLower)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileNamesLower)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileNamesLower)('abc2.txt', 'abc10.txt') < 0, 'filenames with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileNamesLower)('abc02.txt', 'abc010.txt') < 0, 'filenames with numbers that have leading zeros sort numerically');
            assert((0, comparers_1.compareFileNamesLower)('abc1.10.txt', 'abc1.2.txt') > 0, 'numbers with dots between them are treated as two separate numbers, not one decimal number');
            assert((0, comparers_1.compareFileNamesLower)('abc02.txt', 'abc002.txt') < 0, 'filenames with equivalent numbers and leading zeros sort shortest number first');
            assert((0, comparers_1.compareFileNamesLower)('abc.txt1', 'abc.txt01') < 0, 'same name plus extensions with equal numbers sort shortest number first');
            assert((0, comparers_1.compareFileNamesLower)('a.ext1', 'b.Ext1') < 0, 'different names and extensions that are equal except for case are sorted in full filename order');
            assert((0, comparers_1.compareFileNamesLower)('a.ext1', 'a.Ext1') === compareLocale('a.ext1', 'b.Ext1'), 'same names and extensions that are equal except for case are sorted in full filename locale order');
            //
            // Comparisons with different results than compareFileNamesDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNamesLower)('z', 'A') < 0, 'z comes before A');
            assert((0, comparers_1.compareFileNamesLower)('a', 'A') < 0, 'the same letter sorts lowercase first');
            assert((0, comparers_1.compareFileNamesLower)('â', 'Â') < 0, 'the same accented letter sorts lowercase first');
            assert.deepStrictEqual(['artichoke', 'Artichoke', 'art', 'Art'].sort(comparers_1.compareFileNamesLower), ['art', 'artichoke', 'Art', 'Artichoke'], 'names with the same root and different cases sort lowercase first');
            assert.deepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileNamesLower), ['email', 'émail', 'Email', 'Émail'], 'the same base characters with different case or accents sort lowercase first');
            // numeric comparisons
            assert((0, comparers_1.compareFileNamesLower)('art01', 'Art01') < 0, 'a numerically equivalent name of a different case compares lowercase first');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileNamesLower), ['a10.txt', 'a20.txt', 'A2.txt', 'A100.txt'], 'filenames with number and case differences group by case then compare by number');
        });
        test('compareFileExtensionsLower', () => {
            //
            // Comparisons with the same result as compareFileExtensionsDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensionsLower)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileExtensionsLower)(null, 'abc') < 0, 'null should come before real files without extensions');
            assert((0, comparers_1.compareFileExtensionsLower)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileExtensionsLower)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileExtensionsLower)('Z', 'a') > 0, 'Z comes after a');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensionsLower)('file.ext', 'file.ext') === 0, 'equal full filenames should be equal');
            assert((0, comparers_1.compareFileExtensionsLower)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsLower)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileExtensionsLower)('bbb.aaa', 'aaa.bbb') < 0, 'files should be compared by extension first');
            assert((0, comparers_1.compareFileExtensionsLower)('a.md', 'b.MD') < 0, 'when extensions are the same except for case, the files sort by name');
            assert((0, comparers_1.compareFileExtensionsLower)('a.MD', 'a.md') === compareLocale('MD', 'md'), 'case differences in extensions sort by locale');
            // dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsLower)('.abc', '.abc') === 0, 'equal dotfiles should be equal');
            assert((0, comparers_1.compareFileExtensionsLower)('.md', '.Gitattributes') > 0, 'dotfiles sort alphabetically regardless of case');
            assert((0, comparers_1.compareFileExtensionsLower)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileExtensionsLower)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsLower)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileExtensionsLower)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileExtensionsLower)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            assert((0, comparers_1.compareFileExtensionsLower)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileExtensionsLower)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileExtensionsLower)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileExtensionsLower)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileExtensionsLower)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsLower)('abc2.txt', 'abc10.txt') < 0, 'filenames with numbers should be in numerical order');
            assert((0, comparers_1.compareFileExtensionsLower)('abc02.txt', 'abc010.txt') < 0, 'filenames with numbers that have leading zeros sort numerically');
            assert((0, comparers_1.compareFileExtensionsLower)('abc1.10.txt', 'abc1.2.txt') > 0, 'numbers with dots between them are treated as two separate numbers, not one decimal number');
            assert((0, comparers_1.compareFileExtensionsLower)('abc2.txt2', 'abc1.txt10') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsLower)('txt.abc1', 'txt.abc1') === 0, 'equal extensions with numbers should be equal');
            assert((0, comparers_1.compareFileExtensionsLower)('txt.abc1', 'txt.abc2') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsLower)('txt.abc2', 'txt.abc10') < 0, 'extensions with numbers should be in numerical order even when they are multiple digits long');
            assert((0, comparers_1.compareFileExtensionsLower)('a.ext1', 'b.ext1') < 0, 'if equal extensions with numbers, full filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsLower)('abc.txt01', 'abc.txt1') > 0, 'extensions with equal numbers should be in shortest-first order');
            assert((0, comparers_1.compareFileExtensionsLower)('abc02.txt', 'abc002.txt') < 0, 'filenames with equivalent numbers and leading zeros sort shortest string first');
            assert((0, comparers_1.compareFileExtensionsLower)('txt.abc01', 'txt.abc1') > 0, 'extensions with equivalent numbers sort shortest extension first');
            assert((0, comparers_1.compareFileExtensionsLower)('a.ext1', 'b.Ext1') < 0, 'if extensions with numbers are equal except for case, full filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsLower)('a.ext1', 'a.Ext1') === compareLocale('a.ext1', 'a.Ext1'), 'if extensions with numbers are equal except for case, filenames are sorted in locale order');
            //
            // Comparisons with different results than compareFileExtensionsDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensionsLower)('z', 'A') < 0, 'z comes before A');
            assert((0, comparers_1.compareFileExtensionsLower)('a', 'A') < 0, 'the same letter sorts lowercase first');
            assert((0, comparers_1.compareFileExtensionsLower)('â', 'Â') < 0, 'the same accented letter sorts lowercase first');
            assert.deepStrictEqual(['artichoke', 'Artichoke', 'art', 'Art'].sort(comparers_1.compareFileExtensionsLower), ['art', 'artichoke', 'Art', 'Artichoke'], 'names with the same root and different cases sort lowercase names first');
            assert.deepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileExtensionsLower), ['email', 'émail', 'Email', 'Émail'], 'the same base characters with different case or accents sort lowercase names first');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensionsLower)('a.md', 'A.md') < 0, 'case differences in names sort lowercase first');
            assert((0, comparers_1.compareFileExtensionsLower)('art01', 'Art01') < 0, 'a numerically equivalent word of a different case sorts lowercase first');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileExtensionsLower), ['a10.txt', 'a20.txt', 'A2.txt', 'A100.txt'], 'filenames with number and case differences group by case then sort by number');
            assert((0, comparers_1.compareFileExtensionsLower)('aggregate.go', 'aggregate_repo.go') > 0, 'when extensions are equal, compares full filenames');
        });
        test('compareFileNamesUnicode', () => {
            //
            // Comparisons with the same results as compareFileNamesDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNamesUnicode)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileNamesUnicode)(null, 'abc') < 0, 'null should be come before real values');
            assert((0, comparers_1.compareFileNamesUnicode)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileNamesUnicode)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileNamesUnicode)('z', 'A') > 0, 'z comes after A');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileNamesUnicode)('file.ext', 'file.ext') === 0, 'equal full names should be equal');
            assert((0, comparers_1.compareFileNamesUnicode)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileNamesUnicode)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileNamesUnicode)('bbb.aaa', 'aaa.bbb') > 0, 'files should be compared by names even if extensions compare differently');
            // dotfile comparisons
            assert((0, comparers_1.compareFileNamesUnicode)('.abc', '.abc') === 0, 'equal dotfile names should be equal');
            assert((0, comparers_1.compareFileNamesUnicode)('.env.', '.gitattributes') < 0, 'filenames starting with dots and with extensions should still sort properly');
            assert((0, comparers_1.compareFileNamesUnicode)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileNamesUnicode)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileNamesUnicode)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileNamesUnicode)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileNamesUnicode)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileNamesUnicode)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            assert((0, comparers_1.compareFileNamesUnicode)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileNamesUnicode)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileNamesUnicode)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileNamesUnicode)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileNamesUnicode)('a.ext1', 'b.Ext1') < 0, 'if names are different and extensions with numbers are equal except for case, filenames are sorted by unicode full filename');
            assert((0, comparers_1.compareFileNamesUnicode)('a.ext1', 'a.Ext1') > 0, 'if names are equal and extensions with numbers are equal except for case, filenames are sorted by unicode full filename');
            //
            // Comparisons with different results than compareFileNamesDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileNamesUnicode)('Z', 'a') < 0, 'Z comes before a');
            assert((0, comparers_1.compareFileNamesUnicode)('a', 'A') > 0, 'the same letter sorts uppercase first');
            assert((0, comparers_1.compareFileNamesUnicode)('â', 'Â') > 0, 'the same accented letter sorts uppercase first');
            assert.deepStrictEqual(['artichoke', 'Artichoke', 'art', 'Art'].sort(comparers_1.compareFileNamesUnicode), ['Art', 'Artichoke', 'art', 'artichoke'], 'names with the same root and different cases sort uppercase first');
            assert.deepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileNamesUnicode), ['Email', 'email', 'Émail', 'émail'], 'the same base characters with different case or accents sort in unicode order');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileNamesUnicode)('aggregate.go', 'aggregate_repo.go') < 0, 'compares the whole name in unicode order, but dot comes before underscore');
            // dotfile comparisons
            assert((0, comparers_1.compareFileNamesUnicode)('.aaa_env', '.aaa.env') > 0, 'an underscore in a dotfile name will sort after a dot');
            // numeric comparisons
            assert((0, comparers_1.compareFileNamesUnicode)('abc2.txt', 'abc10.txt') > 0, 'filenames with numbers should be in unicode order even when they are multiple digits long');
            assert((0, comparers_1.compareFileNamesUnicode)('abc02.txt', 'abc010.txt') > 0, 'filenames with numbers that have leading zeros sort in unicode order');
            assert((0, comparers_1.compareFileNamesUnicode)('abc1.10.txt', 'abc1.2.txt') < 0, 'numbers with dots between them are sorted in unicode order');
            assert((0, comparers_1.compareFileNamesUnicode)('abc02.txt', 'abc002.txt') > 0, 'filenames with equivalent numbers and leading zeros sort in unicode order');
            assert((0, comparers_1.compareFileNamesUnicode)('abc.txt1', 'abc.txt01') > 0, 'same name plus extensions with equal numbers sort in unicode order');
            assert((0, comparers_1.compareFileNamesUnicode)('art01', 'Art01') > 0, 'a numerically equivalent name of a different case compares uppercase first');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileNamesUnicode), ['A100.txt', 'A2.txt', 'a10.txt', 'a20.txt'], 'filenames with number and case differences sort in unicode order');
        });
        test('compareFileExtensionsUnicode', () => {
            //
            // Comparisons with the same result as compareFileExtensionsDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensionsUnicode)(null, null) === 0, 'null should be equal');
            assert((0, comparers_1.compareFileExtensionsUnicode)(null, 'abc') < 0, 'null should come before real files without extensions');
            assert((0, comparers_1.compareFileExtensionsUnicode)('', '') === 0, 'empty should be equal');
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc', 'abc') === 0, 'equal names should be equal');
            assert((0, comparers_1.compareFileExtensionsUnicode)('z', 'A') > 0, 'z comes after A');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensionsUnicode)('file.ext', 'file.ext') === 0, 'equal full filenames should be equal');
            assert((0, comparers_1.compareFileExtensionsUnicode)('a.ext', 'b.ext') < 0, 'if equal extensions, filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsUnicode)('file.aaa', 'file.bbb') < 0, 'files with equal names should be compared by extensions');
            assert((0, comparers_1.compareFileExtensionsUnicode)('bbb.aaa', 'aaa.bbb') < 0, 'files should be compared by extension first');
            assert((0, comparers_1.compareFileExtensionsUnicode)('a.md', 'b.MD') < 0, 'when extensions are the same except for case, the files sort by name');
            assert((0, comparers_1.compareFileExtensionsUnicode)('a.MD', 'a.md') < 0, 'case differences in extensions sort in unicode order');
            // dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsUnicode)('.abc', '.abc') === 0, 'equal dotfiles should be equal');
            assert((0, comparers_1.compareFileExtensionsUnicode)('.md', '.Gitattributes') > 0, 'dotfiles sort alphabetically regardless of case');
            assert((0, comparers_1.compareFileExtensionsUnicode)('.env', '.aaa.env') > 0, 'dotfiles sort alphabetically when they contain multiple dots');
            assert((0, comparers_1.compareFileExtensionsUnicode)('.env', '.env.aaa') < 0, 'dotfiles with the same root sort shortest first');
            // dotfile vs non-dotfile comparisons
            assert((0, comparers_1.compareFileExtensionsUnicode)(null, '.abc') < 0, 'null should come before dotfiles');
            assert((0, comparers_1.compareFileExtensionsUnicode)('.env', 'aaa.env') < 0, 'dotfiles come before filenames with extensions');
            assert((0, comparers_1.compareFileExtensionsUnicode)('.MD', 'a.md') < 0, 'dotfiles sort before lowercase files');
            assert((0, comparers_1.compareFileExtensionsUnicode)('.env', 'aaa') < 0, 'dotfiles come before filenames without extensions');
            assert((0, comparers_1.compareFileExtensionsUnicode)('.md', 'A.MD') < 0, 'dotfiles sort before uppercase files');
            // numeric comparisons
            assert((0, comparers_1.compareFileExtensionsUnicode)('1', '1') === 0, 'numerically equal full names should be equal');
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc1.txt', 'abc1.txt') === 0, 'equal filenames with numbers should be equal');
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc1.txt', 'abc2.txt') < 0, 'filenames with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('txt.abc1', 'txt.abc1') === 0, 'equal extensions with numbers should be equal');
            assert((0, comparers_1.compareFileExtensionsUnicode)('txt.abc1', 'txt.abc2') < 0, 'extensions with numbers should be in numerical order, not alphabetical order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('a.ext1', 'b.ext1') < 0, 'if equal extensions with numbers, full filenames should be compared');
            //
            // Comparisons with different results than compareFileExtensionsDefault
            //
            // name-only comparisons
            assert((0, comparers_1.compareFileExtensionsUnicode)('Z', 'a') < 0, 'Z comes before a');
            assert((0, comparers_1.compareFileExtensionsUnicode)('a', 'A') > 0, 'the same letter sorts uppercase first');
            assert((0, comparers_1.compareFileExtensionsUnicode)('â', 'Â') > 0, 'the same accented letter sorts uppercase first');
            assert.deepStrictEqual(['artichoke', 'Artichoke', 'art', 'Art'].sort(comparers_1.compareFileExtensionsUnicode), ['Art', 'Artichoke', 'art', 'artichoke'], 'names with the same root and different cases sort uppercase names first');
            assert.deepStrictEqual(['email', 'Email', 'émail', 'Émail'].sort(comparers_1.compareFileExtensionsUnicode), ['Email', 'email', 'Émail', 'émail'], 'the same base characters with different case or accents sort in unicode order');
            // name plus extension comparisons
            assert((0, comparers_1.compareFileExtensionsUnicode)('a.MD', 'a.md') < 0, 'case differences in extensions sort by uppercase extension first');
            assert((0, comparers_1.compareFileExtensionsUnicode)('a.md', 'A.md') > 0, 'case differences in names sort uppercase first');
            assert((0, comparers_1.compareFileExtensionsUnicode)('art01', 'Art01') > 0, 'a numerically equivalent name of a different case sorts uppercase first');
            assert.deepStrictEqual(['a10.txt', 'A2.txt', 'A100.txt', 'a20.txt'].sort(comparers_1.compareFileExtensionsUnicode), ['A100.txt', 'A2.txt', 'a10.txt', 'a20.txt'], 'filenames with number and case differences sort in unicode order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('aggregate.go', 'aggregate_repo.go') < 0, 'when extensions are equal, compares full filenames in unicode order');
            // numeric comparisons
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc2.txt', 'abc10.txt') > 0, 'filenames with numbers should be in unicode order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc02.txt', 'abc010.txt') > 0, 'filenames with numbers that have leading zeros sort in unicode order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc1.10.txt', 'abc1.2.txt') < 0, 'numbers with dots between them sort in unicode order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc2.txt2', 'abc1.txt10') > 0, 'extensions with numbers should be in unicode order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('txt.abc2', 'txt.abc10') > 0, 'extensions with numbers should be in unicode order even when they are multiple digits long');
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc.txt01', 'abc.txt1') < 0, 'extensions with equal numbers should be in unicode order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('abc02.txt', 'abc002.txt') > 0, 'filenames with equivalent numbers and leading zeros sort in unicode order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('txt.abc01', 'txt.abc1') < 0, 'extensions with equivalent numbers sort in unicode order');
            assert((0, comparers_1.compareFileExtensionsUnicode)('a.ext1', 'b.Ext1') < 0, 'if extensions with numbers are equal except for case, unicode full filenames should be compared');
            assert((0, comparers_1.compareFileExtensionsUnicode)('a.ext1', 'a.Ext1') > 0, 'if extensions with numbers are equal except for case, unicode full filenames should be compared');
        });
    });
});
//# sourceMappingURL=comparers.test.js.map