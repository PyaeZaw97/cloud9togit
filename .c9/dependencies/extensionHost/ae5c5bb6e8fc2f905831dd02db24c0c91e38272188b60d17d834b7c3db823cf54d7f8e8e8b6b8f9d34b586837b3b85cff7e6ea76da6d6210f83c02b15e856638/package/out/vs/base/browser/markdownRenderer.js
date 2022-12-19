/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/dompurify/dompurify", "vs/base/browser/event", "vs/base/browser/formattedTextRenderer", "vs/base/browser/mouseEvent", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/iconLabels", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/marked/marked", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri"], function (require, exports, DOM, dompurify, event_1, formattedTextRenderer_1, mouseEvent_1, iconLabels_1, async_1, cancellation_1, errors_1, event_2, htmlContent_1, iconLabels_2, idGenerator_1, lifecycle_1, marked_1, marshalling_1, network_1, objects_1, resources_1, strings_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderMarkdownAsPlaintext = exports.renderStringAsPlaintext = exports.renderMarkdown = void 0;
    /**
     * Low-level way create a html element from a markdown string.
     *
     * **Note** that for most cases you should be using [`MarkdownRenderer`](./src/vs/editor/contrib/markdownRenderer/browser/markdownRenderer.ts)
     * which comes with support for pretty code block rendering and which uses the default way of handling links.
     */
    function renderMarkdown(markdown, options = {}, markedOptions = {}) {
        var _a;
        const disposables = new lifecycle_1.DisposableStore();
        let isDisposed = false;
        const cts = disposables.add(new cancellation_1.CancellationTokenSource());
        const element = (0, formattedTextRenderer_1.createElement)(options);
        const _uriMassage = function (part) {
            let data;
            try {
                data = (0, marshalling_1.parse)(decodeURIComponent(part));
            }
            catch (e) {
                // ignore
            }
            if (!data) {
                return part;
            }
            data = (0, objects_1.cloneAndChange)(data, value => {
                if (markdown.uris && markdown.uris[value]) {
                    return uri_1.URI.revive(markdown.uris[value]);
                }
                else {
                    return undefined;
                }
            });
            return encodeURIComponent(JSON.stringify(data));
        };
        const _href = function (href, isDomUri) {
            const data = markdown.uris && markdown.uris[href];
            let uri = uri_1.URI.revive(data);
            if (isDomUri) {
                if (href.startsWith(network_1.Schemas.data + ':')) {
                    return href;
                }
                if (!uri) {
                    uri = uri_1.URI.parse(href);
                }
                // this URI will end up as "src"-attribute of a dom node
                // and because of that special rewriting needs to be done
                // so that the URI uses a protocol that's understood by
                // browsers (like http or https)
                return network_1.FileAccess.asBrowserUri(uri).toString(true);
            }
            if (!uri) {
                return href;
            }
            if (uri_1.URI.parse(href).toString() === uri.toString()) {
                return href; // no transformation performed
            }
            if (uri.query) {
                uri = uri.with({ query: _uriMassage(uri.query) });
            }
            return uri.toString();
        };
        // signal to code-block render that the
        // element has been created
        let signalInnerHTML;
        const withInnerHTML = new Promise(c => signalInnerHTML = c);
        const renderer = new marked_1.marked.Renderer();
        renderer.image = (href, title, text) => {
            let dimensions = [];
            let attributes = [];
            if (href) {
                ({ href, dimensions } = (0, htmlContent_1.parseHrefAndDimensions)(href));
                attributes.push(`src="${href}"`);
            }
            if (text) {
                attributes.push(`alt="${text}"`);
            }
            if (title) {
                attributes.push(`title="${title}"`);
            }
            if (dimensions.length) {
                attributes = attributes.concat(dimensions);
            }
            return '<img ' + attributes.join(' ') + '>';
        };
        renderer.link = (href, title, text) => {
            if (typeof href !== 'string') {
                return '';
            }
            // Remove markdown escapes. Workaround for https://github.com/chjj/marked/issues/829
            if (href === text) { // raw link case
                text = (0, htmlContent_1.removeMarkdownEscapes)(text);
            }
            href = _href(href, false);
            if (markdown.baseUri) {
                href = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
            }
            title = typeof title === 'string' ? (0, htmlContent_1.removeMarkdownEscapes)(title) : '';
            href = (0, htmlContent_1.removeMarkdownEscapes)(href);
            if (!href
                || /^data:|javascript:/i.test(href)
                || (/^command:/i.test(href) && !markdown.isTrusted)
                || /^command:(\/\/\/)?_workbench\.downloadResource/i.test(href)) {
                // drop the link
                return text;
            }
            else {
                // HTML Encode href
                href = href.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                return `<a data-href="${href}" title="${title || href}">${text}</a>`;
            }
        };
        renderer.paragraph = (text) => {
            return `<p>${text}</p>`;
        };
        if (options.codeBlockRenderer) {
            renderer.code = (code, lang) => {
                const value = options.codeBlockRenderer(lang !== null && lang !== void 0 ? lang : '', code);
                // when code-block rendering is async we return sync
                // but update the node with the real result later.
                const id = idGenerator_1.defaultGenerator.nextId();
                (0, async_1.raceCancellation)(Promise.all([value, withInnerHTML]), cts.token).then(values => {
                    var _a;
                    if (!isDisposed && values) {
                        const span = element.querySelector(`div[data-code="${id}"]`);
                        if (span) {
                            DOM.reset(span, values[0]);
                        }
                        (_a = options.asyncRenderCallback) === null || _a === void 0 ? void 0 : _a.call(options);
                    }
                }).catch(() => {
                    // ignore
                });
                return `<div class="code" data-code="${id}">${(0, strings_1.escape)(code)}</div>`;
            };
        }
        if (options.actionHandler) {
            const onClick = options.actionHandler.disposables.add(new event_1.DomEmitter(element, 'click'));
            const onAuxClick = options.actionHandler.disposables.add(new event_1.DomEmitter(element, 'auxclick'));
            options.actionHandler.disposables.add(event_2.Event.any(onClick.event, onAuxClick.event)(e => {
                const mouseEvent = new mouseEvent_1.StandardMouseEvent(e);
                if (!mouseEvent.leftButton && !mouseEvent.middleButton) {
                    return;
                }
                let target = mouseEvent.target;
                if (target.tagName !== 'A') {
                    target = target.parentElement;
                    if (!target || target.tagName !== 'A') {
                        return;
                    }
                }
                try {
                    let href = target.dataset['href'];
                    if (href) {
                        if (markdown.baseUri) {
                            href = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
                        }
                        options.actionHandler.callback(href, mouseEvent);
                    }
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                finally {
                    mouseEvent.preventDefault();
                }
            }));
        }
        if (!markdown.supportHtml) {
            // TODO: Can we deprecated this in favor of 'supportHtml'?
            // Use our own sanitizer so that we can let through only spans.
            // Otherwise, we'd be letting all html be rendered.
            // If we want to allow markdown permitted tags, then we can delete sanitizer and sanitize.
            // We always pass the output through dompurify after this so that we don't rely on
            // marked for sanitization.
            markedOptions.sanitizer = (html) => {
                const match = markdown.isTrusted ? html.match(/^(<span[^>]+>)|(<\/\s*span>)$/) : undefined;
                return match ? html : '';
            };
            markedOptions.sanitize = true;
            markedOptions.silent = true;
        }
        markedOptions.renderer = renderer;
        // values that are too long will freeze the UI
        let value = (_a = markdown.value) !== null && _a !== void 0 ? _a : '';
        if (value.length > 100000) {
            value = `${value.substr(0, 100000)}…`;
        }
        // escape theme icons
        if (markdown.supportThemeIcons) {
            value = (0, iconLabels_2.markdownEscapeEscapedIcons)(value);
        }
        let renderedMarkdown = marked_1.marked.parse(value, markedOptions);
        // Rewrite theme icons
        if (markdown.supportThemeIcons) {
            const elements = (0, iconLabels_1.renderLabelWithIcons)(renderedMarkdown);
            renderedMarkdown = elements.map(e => typeof e === 'string' ? e : e.outerHTML).join('');
        }
        const htmlParser = new DOMParser();
        const markdownHtmlDoc = htmlParser.parseFromString(sanitizeRenderedMarkdown(markdown, renderedMarkdown), 'text/html');
        markdownHtmlDoc.body.querySelectorAll('img')
            .forEach(img => {
            const src = img.getAttribute('src'); // Get the raw 'src' attribute value as text, not the resolved 'src'
            if (src) {
                let href = src;
                try {
                    if (markdown.baseUri) { // absolute or relative local path, or file: uri
                        href = resolveWithBaseUri(uri_1.URI.from(markdown.baseUri), href);
                    }
                }
                catch (err) { }
                img.src = _href(href, true);
            }
        });
        element.innerHTML = sanitizeRenderedMarkdown(markdown, markdownHtmlDoc.body.innerHTML);
        // signal that async code blocks can be now be inserted
        signalInnerHTML();
        // signal size changes for image tags
        if (options.asyncRenderCallback) {
            for (const img of element.getElementsByTagName('img')) {
                const listener = disposables.add(DOM.addDisposableListener(img, 'load', () => {
                    listener.dispose();
                    options.asyncRenderCallback();
                }));
            }
        }
        return {
            element,
            dispose: () => {
                isDisposed = true;
                cts.cancel();
                disposables.dispose();
            }
        };
    }
    exports.renderMarkdown = renderMarkdown;
    function resolveWithBaseUri(baseUri, href) {
        const hasScheme = /^\w[\w\d+.-]*:/.test(href);
        if (hasScheme) {
            return href;
        }
        if (baseUri.path.endsWith('/')) {
            return (0, resources_1.resolvePath)(baseUri, href).toString();
        }
        else {
            return (0, resources_1.resolvePath)((0, resources_1.dirname)(baseUri), href).toString();
        }
    }
    function sanitizeRenderedMarkdown(options, renderedMarkdown) {
        const { config, allowedSchemes } = getSanitizerOptions(options);
        dompurify.addHook('uponSanitizeAttribute', (element, e) => {
            if (e.attrName === 'style' || e.attrName === 'class') {
                if (element.tagName === 'SPAN') {
                    if (e.attrName === 'style') {
                        e.keepAttr = /^(color\:#[0-9a-fA-F]+;)?(background-color\:#[0-9a-fA-F]+;)?$/.test(e.attrValue);
                        return;
                    }
                    else if (e.attrName === 'class') {
                        e.keepAttr = /^codicon codicon-[a-z\-]+( codicon-modifier-[a-z\-]+)?$/.test(e.attrValue);
                        return;
                    }
                }
                e.keepAttr = false;
                return;
            }
        });
        const hook = DOM.hookDomPurifyHrefAndSrcSanitizer(allowedSchemes);
        try {
            return dompurify.sanitize(renderedMarkdown, Object.assign(Object.assign({}, config), { RETURN_TRUSTED_TYPE: true }));
        }
        finally {
            dompurify.removeHook('uponSanitizeAttribute');
            hook.dispose();
        }
    }
    function getSanitizerOptions(options) {
        const allowedSchemes = [
            network_1.Schemas.http,
            network_1.Schemas.https,
            network_1.Schemas.mailto,
            network_1.Schemas.data,
            network_1.Schemas.file,
            network_1.Schemas.vscodeFileResource,
            network_1.Schemas.vscodeRemote,
            network_1.Schemas.vscodeRemoteResource,
        ];
        if (options.isTrusted) {
            allowedSchemes.push(network_1.Schemas.command);
        }
        return {
            config: {
                // allowedTags should included everything that markdown renders to.
                // Since we have our own sanitize function for marked, it's possible we missed some tag so let dompurify make sure.
                // HTML tags that can result from markdown are from reading https://spec.commonmark.org/0.29/
                // HTML table tags that can result from markdown are from https://github.github.com/gfm/#tables-extension-
                ALLOWED_TAGS: ['ul', 'li', 'p', 'b', 'i', 'code', 'blockquote', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'em', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'del', 'a', 'strong', 'br', 'img', 'span'],
                ALLOWED_ATTR: ['href', 'data-href', 'target', 'title', 'src', 'alt', 'class', 'style', 'data-code', 'width', 'height', 'align'],
                ALLOW_UNKNOWN_PROTOCOLS: true,
            },
            allowedSchemes
        };
    }
    /**
     * Strips all markdown from `string`, if it's an IMarkdownString. For example
     * `# Header` would be output as `Header`. If it's not, the string is returned.
     */
    function renderStringAsPlaintext(string) {
        return typeof string === 'string' ? string : renderMarkdownAsPlaintext(string);
    }
    exports.renderStringAsPlaintext = renderStringAsPlaintext;
    /**
     * Strips all markdown from `markdown`. For example `# Header` would be output as `Header`.
     */
    function renderMarkdownAsPlaintext(markdown) {
        var _a;
        const renderer = new marked_1.marked.Renderer();
        renderer.code = (code) => {
            return code;
        };
        renderer.blockquote = (quote) => {
            return quote;
        };
        renderer.html = (_html) => {
            return '';
        };
        renderer.heading = (text, _level, _raw) => {
            return text + '\n';
        };
        renderer.hr = () => {
            return '';
        };
        renderer.list = (body, _ordered) => {
            return body;
        };
        renderer.listitem = (text) => {
            return text + '\n';
        };
        renderer.paragraph = (text) => {
            return text + '\n';
        };
        renderer.table = (header, body) => {
            return header + body + '\n';
        };
        renderer.tablerow = (content) => {
            return content;
        };
        renderer.tablecell = (content, _flags) => {
            return content + ' ';
        };
        renderer.strong = (text) => {
            return text;
        };
        renderer.em = (text) => {
            return text;
        };
        renderer.codespan = (code) => {
            return code;
        };
        renderer.br = () => {
            return '\n';
        };
        renderer.del = (text) => {
            return text;
        };
        renderer.image = (_href, _title, _text) => {
            return '';
        };
        renderer.text = (text) => {
            return text;
        };
        renderer.link = (_href, _title, text) => {
            return text;
        };
        // values that are too long will freeze the UI
        let value = (_a = markdown.value) !== null && _a !== void 0 ? _a : '';
        if (value.length > 100000) {
            value = `${value.substr(0, 100000)}…`;
        }
        const unescapeInfo = new Map([
            ['&quot;', '"'],
            ['&nbsp;', ' '],
            ['&amp;', '&'],
            ['&#39;', '\''],
            ['&lt;', '<'],
            ['&gt;', '>'],
        ]);
        const html = marked_1.marked.parse(value, { renderer }).replace(/&(#\d+|[a-zA-Z]+);/g, m => { var _a; return (_a = unescapeInfo.get(m)) !== null && _a !== void 0 ? _a : m; });
        return sanitizeRenderedMarkdown({ isTrusted: false }, html).toString();
    }
    exports.renderMarkdownAsPlaintext = renderMarkdownAsPlaintext;
});
//# sourceMappingURL=markdownRenderer.js.map