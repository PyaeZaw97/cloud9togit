/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/nls", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/services/textfile/common/textfiles", "vs/css!./media/searchEditor"], function (require, exports, arrays_1, range_1, nls_1, searchModel_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseSerializedSearchEditor = exports.parseSavedSearchEditor = exports.serializeSearchResultForEditor = exports.extractSearchQueryFromLines = exports.defaultSearchConfig = exports.extractSearchQueryFromModel = exports.serializeSearchConfiguration = void 0;
    // Using \r\n on Windows inserts an extra newline between results.
    const lineDelimiter = '\n';
    const translateRangeLines = (n) => (range) => new range_1.Range(range.startLineNumber + n, range.startColumn, range.endLineNumber + n, range.endColumn);
    const matchToSearchResultFormat = (match, longestLineNumber) => {
        const getLinePrefix = (i) => `${match.range().startLineNumber + i}`;
        const fullMatchLines = match.fullPreviewLines();
        const results = [];
        fullMatchLines
            .forEach((sourceLine, i) => {
            const lineNumber = getLinePrefix(i);
            const paddingStr = ' '.repeat(longestLineNumber - lineNumber.length);
            const prefix = `  ${paddingStr}${lineNumber}: `;
            const prefixOffset = prefix.length;
            // split instead of replace to avoid creating a new string object
            const line = prefix + (sourceLine.split(/\r?\n?$/, 1)[0] || '');
            const rangeOnThisLine = ({ start, end }) => new range_1.Range(1, (start !== null && start !== void 0 ? start : 1) + prefixOffset, 1, (end !== null && end !== void 0 ? end : sourceLine.length + 1) + prefixOffset);
            const matchRange = match.rangeInPreview();
            const matchIsSingleLine = matchRange.startLineNumber === matchRange.endLineNumber;
            let lineRange;
            if (matchIsSingleLine) {
                lineRange = (rangeOnThisLine({ start: matchRange.startColumn, end: matchRange.endColumn }));
            }
            else if (i === 0) {
                lineRange = (rangeOnThisLine({ start: matchRange.startColumn }));
            }
            else if (i === fullMatchLines.length - 1) {
                lineRange = (rangeOnThisLine({ end: matchRange.endColumn }));
            }
            else {
                lineRange = (rangeOnThisLine({}));
            }
            results.push({ lineNumber: lineNumber, line, ranges: [lineRange] });
        });
        return results;
    };
    function fileMatchToSearchResultFormat(fileMatch, labelFormatter) {
        const sortedMatches = fileMatch.matches().sort(searchModel_1.searchMatchComparer);
        const longestLineNumber = sortedMatches[sortedMatches.length - 1].range().endLineNumber.toString().length;
        const uriString = labelFormatter(fileMatch.resource);
        const text = [`${uriString}:`];
        const matchRanges = [];
        const targetLineNumberToOffset = {};
        const context = [];
        fileMatch.context.forEach((line, lineNumber) => context.push({ line, lineNumber }));
        context.sort((a, b) => a.lineNumber - b.lineNumber);
        let lastLine = undefined;
        const seenLines = new Set();
        sortedMatches.forEach(match => {
            matchToSearchResultFormat(match, longestLineNumber).forEach(match => {
                if (!seenLines.has(match.lineNumber)) {
                    while (context.length && context[0].lineNumber < +match.lineNumber) {
                        const { line, lineNumber } = context.shift();
                        if (lastLine !== undefined && lineNumber !== lastLine + 1) {
                            text.push('');
                        }
                        text.push(`  ${' '.repeat(longestLineNumber - `${lineNumber}`.length)}${lineNumber}  ${line}`);
                        lastLine = lineNumber;
                    }
                    targetLineNumberToOffset[match.lineNumber] = text.length;
                    seenLines.add(match.lineNumber);
                    text.push(match.line);
                    lastLine = +match.lineNumber;
                }
                matchRanges.push(...match.ranges.map(translateRangeLines(targetLineNumberToOffset[match.lineNumber])));
            });
        });
        while (context.length) {
            const { line, lineNumber } = context.shift();
            text.push(`  ${lineNumber}  ${line}`);
        }
        return { text, matchRanges };
    }
    const contentPatternToSearchConfiguration = (pattern, includes, excludes, contextLines) => {
        return {
            query: pattern.contentPattern.pattern,
            isRegexp: !!pattern.contentPattern.isRegExp,
            isCaseSensitive: !!pattern.contentPattern.isCaseSensitive,
            matchWholeWord: !!pattern.contentPattern.isWordMatch,
            filesToExclude: excludes, filesToInclude: includes,
            showIncludesExcludes: !!(includes || excludes || (pattern === null || pattern === void 0 ? void 0 : pattern.userDisabledExcludesAndIgnoreFiles)),
            useExcludeSettingsAndIgnoreFiles: ((pattern === null || pattern === void 0 ? void 0 : pattern.userDisabledExcludesAndIgnoreFiles) === undefined ? true : !pattern.userDisabledExcludesAndIgnoreFiles),
            contextLines,
            onlyOpenEditors: !!pattern.onlyOpenEditors,
        };
    };
    const serializeSearchConfiguration = (config) => {
        var _a;
        const removeNullFalseAndUndefined = (a) => a.filter(a => a !== false && a !== null && a !== undefined);
        const escapeNewlines = (str) => str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
        return removeNullFalseAndUndefined([
            `# Query: ${escapeNewlines((_a = config.query) !== null && _a !== void 0 ? _a : '')}`,
            (config.isCaseSensitive || config.matchWholeWord || config.isRegexp || config.useExcludeSettingsAndIgnoreFiles === false)
                && `# Flags: ${(0, arrays_1.coalesce)([
                    config.isCaseSensitive && 'CaseSensitive',
                    config.matchWholeWord && 'WordMatch',
                    config.isRegexp && 'RegExp',
                    config.onlyOpenEditors && 'OpenEditors',
                    (config.useExcludeSettingsAndIgnoreFiles === false) && 'IgnoreExcludeSettings'
                ]).join(' ')}`,
            config.filesToInclude ? `# Including: ${config.filesToInclude}` : undefined,
            config.filesToExclude ? `# Excluding: ${config.filesToExclude}` : undefined,
            config.contextLines ? `# ContextLines: ${config.contextLines}` : undefined,
            ''
        ]).join(lineDelimiter);
    };
    exports.serializeSearchConfiguration = serializeSearchConfiguration;
    const extractSearchQueryFromModel = (model) => (0, exports.extractSearchQueryFromLines)(model.getValueInRange(new range_1.Range(1, 1, 6, 1)).split(lineDelimiter));
    exports.extractSearchQueryFromModel = extractSearchQueryFromModel;
    const defaultSearchConfig = () => ({
        query: '',
        filesToInclude: '',
        filesToExclude: '',
        isRegexp: false,
        isCaseSensitive: false,
        useExcludeSettingsAndIgnoreFiles: true,
        matchWholeWord: false,
        contextLines: 0,
        showIncludesExcludes: false,
        onlyOpenEditors: false,
    });
    exports.defaultSearchConfig = defaultSearchConfig;
    const extractSearchQueryFromLines = (lines) => {
        const query = (0, exports.defaultSearchConfig)();
        const unescapeNewlines = (str) => {
            let out = '';
            for (let i = 0; i < str.length; i++) {
                if (str[i] === '\\') {
                    i++;
                    const escaped = str[i];
                    if (escaped === 'n') {
                        out += '\n';
                    }
                    else if (escaped === '\\') {
                        out += '\\';
                    }
                    else {
                        throw Error((0, nls_1.localize)('invalidQueryStringError', "All backslashes in Query string must be escaped (\\\\)"));
                    }
                }
                else {
                    out += str[i];
                }
            }
            return out;
        };
        const parseYML = /^# ([^:]*): (.*)$/;
        for (const line of lines) {
            const parsed = parseYML.exec(line);
            if (!parsed) {
                continue;
            }
            const [, key, value] = parsed;
            switch (key) {
                case 'Query':
                    query.query = unescapeNewlines(value);
                    break;
                case 'Including':
                    query.filesToInclude = value;
                    break;
                case 'Excluding':
                    query.filesToExclude = value;
                    break;
                case 'ContextLines':
                    query.contextLines = +value;
                    break;
                case 'Flags': {
                    query.isRegexp = value.indexOf('RegExp') !== -1;
                    query.isCaseSensitive = value.indexOf('CaseSensitive') !== -1;
                    query.useExcludeSettingsAndIgnoreFiles = value.indexOf('IgnoreExcludeSettings') === -1;
                    query.matchWholeWord = value.indexOf('WordMatch') !== -1;
                    query.onlyOpenEditors = value.indexOf('OpenEditors') !== -1;
                }
            }
        }
        query.showIncludesExcludes = !!(query.filesToInclude || query.filesToExclude || !query.useExcludeSettingsAndIgnoreFiles);
        return query;
    };
    exports.extractSearchQueryFromLines = extractSearchQueryFromLines;
    const serializeSearchResultForEditor = (searchResult, rawIncludePattern, rawExcludePattern, contextLines, labelFormatter, sortOrder, limitHit) => {
        if (!searchResult.query) {
            throw Error('Internal Error: Expected query, got null');
        }
        const config = contentPatternToSearchConfiguration(searchResult.query, rawIncludePattern, rawExcludePattern, contextLines);
        const filecount = searchResult.fileCount() > 1 ? (0, nls_1.localize)('numFiles', "{0} files", searchResult.fileCount()) : (0, nls_1.localize)('oneFile', "1 file");
        const resultcount = searchResult.count() > 1 ? (0, nls_1.localize)('numResults', "{0} results", searchResult.count()) : (0, nls_1.localize)('oneResult', "1 result");
        const info = [
            searchResult.count()
                ? `${resultcount} - ${filecount}`
                : (0, nls_1.localize)('noResults', "No Results"),
        ];
        if (limitHit) {
            info.push((0, nls_1.localize)('searchMaxResultsWarning', "The result set only contains a subset of all matches. Be more specific in your search to narrow down the results."));
        }
        info.push('');
        const matchComparer = (a, b) => (0, searchModel_1.searchMatchComparer)(a, b, sortOrder);
        const allResults = flattenSearchResultSerializations((0, arrays_1.flatten)(searchResult.folderMatches().sort(matchComparer)
            .map(folderMatch => folderMatch.matches().sort(matchComparer)
            .map(fileMatch => fileMatchToSearchResultFormat(fileMatch, labelFormatter)))));
        return {
            matchRanges: allResults.matchRanges.map(translateRangeLines(info.length)),
            text: info.concat(allResults.text).join(lineDelimiter),
            config
        };
    };
    exports.serializeSearchResultForEditor = serializeSearchResultForEditor;
    const flattenSearchResultSerializations = (serializations) => {
        const text = [];
        const matchRanges = [];
        serializations.forEach(serialized => {
            serialized.matchRanges.map(translateRangeLines(text.length)).forEach(range => matchRanges.push(range));
            serialized.text.forEach(line => text.push(line));
            text.push(''); // new line
        });
        return { text, matchRanges };
    };
    const parseSavedSearchEditor = async (accessor, resource) => {
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const text = (await textFileService.read(resource)).value;
        return (0, exports.parseSerializedSearchEditor)(text);
    };
    exports.parseSavedSearchEditor = parseSavedSearchEditor;
    const parseSerializedSearchEditor = (text) => {
        const headerlines = [];
        const bodylines = [];
        let inHeader = true;
        for (const line of text.split(/\r?\n/g)) {
            if (inHeader) {
                headerlines.push(line);
                if (line === '') {
                    inHeader = false;
                }
            }
            else {
                bodylines.push(line);
            }
        }
        return { config: (0, exports.extractSearchQueryFromLines)(headerlines), text: bodylines.join('\n') };
    };
    exports.parseSerializedSearchEditor = parseSerializedSearchEditor;
});
//# sourceMappingURL=searchEditorSerialization.js.map