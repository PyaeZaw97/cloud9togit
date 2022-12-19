/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/json", "vs/base/common/collections", "vs/nls", "vs/base/common/path", "vs/editor/contrib/snippet/browser/snippetParser", "vs/editor/contrib/snippet/browser/snippetVariables", "vs/base/common/strings", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/iterator", "vs/base/common/arrays"], function (require, exports, json_1, collections_1, nls_1, path_1, snippetParser_1, snippetVariables_1, strings_1, async_1, resources_1, types_1, iterator_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetFile = exports.SnippetSource = exports.Snippet = void 0;
    class SnippetBodyInsights {
        constructor(body) {
            // init with defaults
            this.isBogous = false;
            this.isTrivial = false;
            this.usesClipboardVariable = false;
            this.usesSelectionVariable = false;
            this.codeSnippet = body;
            // check snippet...
            const textmateSnippet = new snippetParser_1.SnippetParser().parse(body, false);
            let placeholders = new Map();
            let placeholderMax = 0;
            for (const placeholder of textmateSnippet.placeholders) {
                placeholderMax = Math.max(placeholderMax, placeholder.index);
            }
            // mark snippet as trivial when there is no placeholders or when the only
            // placeholder is the final tabstop and it is at the very end.
            if (textmateSnippet.placeholders.length === 0) {
                this.isTrivial = true;
            }
            else if (placeholderMax === 0) {
                const last = (0, arrays_1.tail)(textmateSnippet.children);
                this.isTrivial = last instanceof snippetParser_1.Placeholder && last.isFinalTabstop;
            }
            let stack = [...textmateSnippet.children];
            while (stack.length > 0) {
                const marker = stack.shift();
                if (marker instanceof snippetParser_1.Variable) {
                    if (marker.children.length === 0 && !snippetVariables_1.KnownSnippetVariableNames[marker.name]) {
                        // a 'variable' without a default value and not being one of our supported
                        // variables is automatically turned into a placeholder. This is to restore
                        // a bug we had before. So `${foo}` becomes `${N:foo}`
                        const index = placeholders.has(marker.name) ? placeholders.get(marker.name) : ++placeholderMax;
                        placeholders.set(marker.name, index);
                        const synthetic = new snippetParser_1.Placeholder(index).appendChild(new snippetParser_1.Text(marker.name));
                        textmateSnippet.replace(marker, [synthetic]);
                        this.isBogous = true;
                    }
                    switch (marker.name) {
                        case 'CLIPBOARD':
                            this.usesClipboardVariable = true;
                            break;
                        case 'SELECTION':
                        case 'TM_SELECTED_TEXT':
                            this.usesSelectionVariable = true;
                            break;
                    }
                }
                else {
                    // recurse
                    stack.push(...marker.children);
                }
            }
            if (this.isBogous) {
                this.codeSnippet = textmateSnippet.toTextmateString();
            }
        }
    }
    class Snippet {
        constructor(scopes, name, prefix, description, body, source, snippetSource, snippetIdentifier, extensionId) {
            this.scopes = scopes;
            this.name = name;
            this.prefix = prefix;
            this.description = description;
            this.body = body;
            this.source = source;
            this.snippetSource = snippetSource;
            this.snippetIdentifier = snippetIdentifier;
            this.extensionId = extensionId;
            this.prefixLow = prefix.toLowerCase();
            this._bodyInsights = new async_1.IdleValue(() => new SnippetBodyInsights(this.body));
        }
        get codeSnippet() {
            return this._bodyInsights.value.codeSnippet;
        }
        get isBogous() {
            return this._bodyInsights.value.isBogous;
        }
        get isTrivial() {
            return this._bodyInsights.value.isTrivial;
        }
        get needsClipboard() {
            return this._bodyInsights.value.usesClipboardVariable;
        }
        get usesSelection() {
            return this._bodyInsights.value.usesSelectionVariable;
        }
        static compare(a, b) {
            if (a.snippetSource < b.snippetSource) {
                return -1;
            }
            else if (a.snippetSource > b.snippetSource) {
                return 1;
            }
            else if (a.source < b.source) {
                return -1;
            }
            else if (a.source > b.source) {
                return 1;
            }
            else if (a.name > b.name) {
                return 1;
            }
            else if (a.name < b.name) {
                return -1;
            }
            else {
                return 0;
            }
        }
    }
    exports.Snippet = Snippet;
    function isJsonSerializedSnippet(thing) {
        return (0, types_1.isObject)(thing) && Boolean(thing.body);
    }
    var SnippetSource;
    (function (SnippetSource) {
        SnippetSource[SnippetSource["User"] = 1] = "User";
        SnippetSource[SnippetSource["Workspace"] = 2] = "Workspace";
        SnippetSource[SnippetSource["Extension"] = 3] = "Extension";
    })(SnippetSource = exports.SnippetSource || (exports.SnippetSource = {}));
    class SnippetFile {
        constructor(source, location, defaultScopes, _extension, _fileService, _extensionResourceLoaderService) {
            this.source = source;
            this.location = location;
            this.defaultScopes = defaultScopes;
            this._extension = _extension;
            this._fileService = _fileService;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this.data = [];
            this.isGlobalSnippets = (0, path_1.extname)(location.path) === '.code-snippets';
            this.isUserSnippets = !this._extension;
        }
        select(selector, bucket) {
            if (this.isGlobalSnippets || !this.isUserSnippets) {
                this._scopeSelect(selector, bucket);
            }
            else {
                this._filepathSelect(selector, bucket);
            }
        }
        _filepathSelect(selector, bucket) {
            // for `fooLang.json` files all snippets are accepted
            if (selector + '.json' === (0, path_1.basename)(this.location.path)) {
                bucket.push(...this.data);
            }
        }
        _scopeSelect(selector, bucket) {
            // for `my.code-snippets` files we need to look at each snippet
            for (const snippet of this.data) {
                const len = snippet.scopes.length;
                if (len === 0) {
                    // always accept
                    bucket.push(snippet);
                }
                else {
                    for (let i = 0; i < len; i++) {
                        // match
                        if (snippet.scopes[i] === selector) {
                            bucket.push(snippet);
                            break; // match only once!
                        }
                    }
                }
            }
            let idx = selector.lastIndexOf('.');
            if (idx >= 0) {
                this._scopeSelect(selector.substring(0, idx), bucket);
            }
        }
        async _load() {
            if (this._extension) {
                return this._extensionResourceLoaderService.readExtensionResource(this.location);
            }
            else {
                const content = await this._fileService.readFile(this.location);
                return content.value.toString();
            }
        }
        load() {
            if (!this._loadPromise) {
                this._loadPromise = Promise.resolve(this._load()).then(content => {
                    const data = (0, json_1.parse)(content);
                    if ((0, json_1.getNodeType)(data) === 'object') {
                        (0, collections_1.forEach)(data, entry => {
                            const { key: name, value: scopeOrTemplate } = entry;
                            if (isJsonSerializedSnippet(scopeOrTemplate)) {
                                this._parseSnippet(name, scopeOrTemplate, this.data);
                            }
                            else {
                                (0, collections_1.forEach)(scopeOrTemplate, entry => {
                                    const { key: name, value: template } = entry;
                                    this._parseSnippet(name, template, this.data);
                                });
                            }
                        });
                    }
                    return this;
                });
            }
            return this._loadPromise;
        }
        reset() {
            this._loadPromise = undefined;
            this.data.length = 0;
        }
        _parseSnippet(name, snippet, bucket) {
            var _a;
            let { prefix, body, description } = snippet;
            if (!prefix) {
                prefix = '';
            }
            if (Array.isArray(body)) {
                body = body.join('\n');
            }
            if (typeof body !== 'string') {
                return;
            }
            if (Array.isArray(description)) {
                description = description.join('\n');
            }
            let scopes;
            if (this.defaultScopes) {
                scopes = this.defaultScopes;
            }
            else if (typeof snippet.scope === 'string') {
                scopes = snippet.scope.split(',').map(s => s.trim()).filter(s => !(0, strings_1.isFalsyOrWhitespace)(s));
            }
            else {
                scopes = [];
            }
            let source;
            if (this._extension) {
                // extension snippet -> show the name of the extension
                source = this._extension.displayName || this._extension.name;
            }
            else if (this.source === 2 /* SnippetSource.Workspace */) {
                // workspace -> only *.code-snippets files
                source = (0, nls_1.localize)('source.workspaceSnippetGlobal', "Workspace Snippet");
            }
            else {
                // user -> global (*.code-snippets) and language snippets
                if (this.isGlobalSnippets) {
                    source = (0, nls_1.localize)('source.userSnippetGlobal', "Global User Snippet");
                }
                else {
                    source = (0, nls_1.localize)('source.userSnippet', "User Snippet");
                }
            }
            for (const _prefix of Array.isArray(prefix) ? prefix : iterator_1.Iterable.single(prefix)) {
                bucket.push(new Snippet(scopes, name, _prefix, description, body, source, this.source, this._extension && `${(0, resources_1.relativePath)(this._extension.extensionLocation, this.location)}/${name}`, (_a = this._extension) === null || _a === void 0 ? void 0 : _a.identifier));
            }
        }
    }
    exports.SnippetFile = SnippetFile;
});
//# sourceMappingURL=snippetsFile.js.map