/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.preloadsScriptStr = void 0;
    async function webviewPreloads(ctx) {
        var _a;
        const textEncoder = new TextEncoder();
        const textDecoder = new TextDecoder();
        let currentOptions = ctx.options;
        let isWorkspaceTrusted = ctx.isWorkspaceTrusted;
        let lineLimit = ctx.lineLimit;
        const acquireVsCodeApi = globalThis.acquireVsCodeApi;
        const vscode = acquireVsCodeApi();
        delete globalThis.acquireVsCodeApi;
        const tokenizationStyleElement = document.querySelector('style#vscode-tokenization-styles');
        const handleInnerClick = (event) => {
            var _a;
            if (!event || !event.view || !event.view.document) {
                return;
            }
            for (const node of event.composedPath()) {
                if (node instanceof HTMLAnchorElement && node.href) {
                    if (node.href.startsWith('blob:')) {
                        handleBlobUrlClick(node.href, node.download);
                    }
                    else if (node.href.startsWith('data:')) {
                        handleDataUrl(node.href, node.download);
                    }
                    else if (node.hash && node.getAttribute('href') === node.hash) {
                        // Scrolling to location within current doc
                        const targetId = node.hash.substring(1);
                        // Check outer document first
                        let scrollTarget = event.view.document.getElementById(targetId);
                        if (!scrollTarget) {
                            // Fallback to checking preview shadow doms
                            for (const preview of event.view.document.querySelectorAll('.preview')) {
                                scrollTarget = (_a = preview.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById(targetId);
                                if (scrollTarget) {
                                    break;
                                }
                            }
                        }
                        if (scrollTarget) {
                            const scrollTop = scrollTarget.getBoundingClientRect().top + event.view.scrollY;
                            postNotebookMessage('scroll-to-reveal', { scrollTop });
                            return;
                        }
                    }
                    else {
                        const href = node.getAttribute('href');
                        if (href) {
                            postNotebookMessage('clicked-link', { href });
                        }
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }
        };
        const handleDataUrl = async (data, downloadName) => {
            postNotebookMessage('clicked-data-url', {
                data,
                downloadName
            });
        };
        const handleBlobUrlClick = async (url, downloadName) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    handleDataUrl(reader.result, downloadName);
                });
                reader.readAsDataURL(blob);
            }
            catch (e) {
                console.error(e.message);
            }
        };
        document.body.addEventListener('click', handleInnerClick);
        const preservedScriptAttributes = [
            'type', 'src', 'nonce', 'noModule', 'async',
        ];
        // derived from https://github.com/jquery/jquery/blob/d0ce00cdfa680f1f0c38460bc51ea14079ae8b07/src/core/DOMEval.js
        const domEval = (container) => {
            var _a;
            const arr = Array.from(container.getElementsByTagName('script'));
            for (let n = 0; n < arr.length; n++) {
                const node = arr[n];
                const scriptTag = document.createElement('script');
                const trustedScript = (_a = ttPolicy === null || ttPolicy === void 0 ? void 0 : ttPolicy.createScript(node.innerText)) !== null && _a !== void 0 ? _a : node.innerText;
                scriptTag.text = trustedScript;
                for (const key of preservedScriptAttributes) {
                    const val = node[key] || node.getAttribute && node.getAttribute(key);
                    if (val) {
                        scriptTag.setAttribute(key, val);
                    }
                }
                // TODO@connor4312: should script with src not be removed?
                container.appendChild(scriptTag).parentNode.removeChild(scriptTag);
            }
        };
        async function loadScriptSource(url, originalUri = url) {
            const res = await fetch(url);
            const text = await res.text();
            if (!res.ok) {
                throw new Error(`Unexpected ${res.status} requesting ${originalUri}: ${text || res.statusText}`);
            }
            return text;
        }
        function createKernelContext() {
            return {
                onDidReceiveKernelMessage: onDidReceiveKernelMessage.event,
                postKernelMessage: (data) => postNotebookMessage('customKernelMessage', { message: data }),
            };
        }
        const invokeSourceWithGlobals = (functionSrc, globals) => {
            const args = Object.entries(globals);
            return new Function(...args.map(([k]) => k), functionSrc)(...args.map(([, v]) => v));
        };
        const runKernelPreload = async (url, originalUri) => {
            const text = await loadScriptSource(url, originalUri);
            const isModule = /\bexport\b.*\bactivate\b/.test(text);
            try {
                if (isModule) {
                    const module = await __import(url);
                    if (!module.activate) {
                        console.error(`Notebook preload (${url}) looks like a module but does not export an activate function`);
                        return;
                    }
                    return module.activate(createKernelContext());
                }
                else {
                    return invokeSourceWithGlobals(text, Object.assign(Object.assign({}, kernelPreloadGlobals), { scriptUrl: url }));
                }
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        };
        const dimensionUpdater = new class {
            constructor() {
                this.pending = new Map();
            }
            updateHeight(id, height, options) {
                if (!this.pending.size) {
                    setTimeout(() => {
                        this.updateImmediately();
                    }, 0);
                }
                const update = this.pending.get(id);
                if (update && update.isOutput) {
                    this.pending.set(id, {
                        id,
                        height,
                        init: update.init,
                        isOutput: update.isOutput,
                    });
                }
                else {
                    this.pending.set(id, Object.assign({ id,
                        height }, options));
                }
            }
            updateImmediately() {
                if (!this.pending.size) {
                    return;
                }
                postNotebookMessage('dimension', {
                    updates: Array.from(this.pending.values())
                });
                this.pending.clear();
            }
        };
        const resizeObserver = new class {
            constructor() {
                this._observedElements = new WeakMap();
                this._observer = new ResizeObserver(entries => {
                    for (const entry of entries) {
                        if (!document.body.contains(entry.target)) {
                            continue;
                        }
                        const observedElementInfo = this._observedElements.get(entry.target);
                        if (!observedElementInfo) {
                            continue;
                        }
                        if (entry.target.id === observedElementInfo.id && entry.contentRect) {
                            if (observedElementInfo.output) {
                                if (entry.contentRect.height !== 0) {
                                    entry.target.style.padding = `${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodeLeftPadding}px`;
                                }
                                else {
                                    entry.target.style.padding = `0px`;
                                }
                            }
                            const offsetHeight = entry.target.offsetHeight;
                            if (observedElementInfo.lastKnownHeight !== offsetHeight) {
                                observedElementInfo.lastKnownHeight = offsetHeight;
                                dimensionUpdater.updateHeight(observedElementInfo.id, offsetHeight, {
                                    isOutput: observedElementInfo.output
                                });
                            }
                        }
                    }
                });
            }
            observe(container, id, output) {
                if (this._observedElements.has(container)) {
                    return;
                }
                this._observedElements.set(container, { id, output, lastKnownHeight: -1 });
                this._observer.observe(container);
            }
        };
        function scrollWillGoToParent(event) {
            for (let node = event.target; node; node = node.parentNode) {
                if (!(node instanceof Element) || node.id === 'container' || node.classList.contains('cell_container') || node.classList.contains('markup') || node.classList.contains('output_container')) {
                    return false;
                }
                if (event.deltaY < 0 && node.scrollTop > 0) {
                    return true;
                }
                if (event.deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight) {
                    return true;
                }
            }
            return false;
        }
        const handleWheel = (event) => {
            if (event.defaultPrevented || scrollWillGoToParent(event)) {
                return;
            }
            postNotebookMessage('did-scroll-wheel', {
                payload: {
                    deltaMode: event.deltaMode,
                    deltaX: event.deltaX,
                    deltaY: event.deltaY,
                    deltaZ: event.deltaZ,
                    wheelDelta: event.wheelDelta,
                    wheelDeltaX: event.wheelDeltaX,
                    wheelDeltaY: event.wheelDeltaY,
                    detail: event.detail,
                    shiftKey: event.shiftKey,
                    type: event.type
                }
            });
        };
        function focusFirstFocusableInCell(cellId) {
            const cellOutputContainer = document.getElementById(cellId);
            if (cellOutputContainer) {
                const focusableElement = cellOutputContainer.querySelector('[tabindex="0"], [href], button, input, option, select, textarea');
                focusableElement === null || focusableElement === void 0 ? void 0 : focusableElement.focus();
            }
        }
        function createFocusSink(cellId, focusNext) {
            const element = document.createElement('div');
            element.tabIndex = 0;
            element.addEventListener('focus', () => {
                postNotebookMessage('focus-editor', {
                    cellId: cellId,
                    focusNext
                });
            });
            return element;
        }
        function addMouseoverListeners(element, outputId) {
            element.addEventListener('mouseenter', () => {
                postNotebookMessage('mouseenter', {
                    id: outputId,
                });
            });
            element.addEventListener('mouseleave', () => {
                postNotebookMessage('mouseleave', {
                    id: outputId,
                });
            });
        }
        function isAncestor(testChild, testAncestor) {
            while (testChild) {
                if (testChild === testAncestor) {
                    return true;
                }
                testChild = testChild.parentNode;
            }
            return false;
        }
        function _internalHighlightRange(range, tagName = 'mark', attributes = {}) {
            // derived from https://github.com/Treora/dom-highlight-range/blob/master/highlight-range.js
            // Return an array of the text nodes in the range. Split the start and end nodes if required.
            function _textNodesInRange(range) {
                if (!range.startContainer.ownerDocument) {
                    return [];
                }
                // If the start or end node is a text node and only partly in the range, split it.
                if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
                    const startContainer = range.startContainer;
                    const endOffset = range.endOffset; // (this may get lost when the splitting the node)
                    const createdNode = startContainer.splitText(range.startOffset);
                    if (range.endContainer === startContainer) {
                        // If the end was in the same container, it will now be in the newly created node.
                        range.setEnd(createdNode, endOffset - range.startOffset);
                    }
                    range.setStart(createdNode, 0);
                }
                if (range.endContainer.nodeType === Node.TEXT_NODE
                    && range.endOffset < range.endContainer.length) {
                    range.endContainer.splitText(range.endOffset);
                }
                // Collect the text nodes.
                const walker = range.startContainer.ownerDocument.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, node => range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT);
                walker.currentNode = range.startContainer;
                // // Optimise by skipping nodes that are explicitly outside the range.
                // const NodeTypesWithCharacterOffset = [
                //  Node.TEXT_NODE,
                //  Node.PROCESSING_INSTRUCTION_NODE,
                //  Node.COMMENT_NODE,
                // ];
                // if (!NodeTypesWithCharacterOffset.includes(range.startContainer.nodeType)) {
                //   if (range.startOffset < range.startContainer.childNodes.length) {
                //     walker.currentNode = range.startContainer.childNodes[range.startOffset];
                //   } else {
                //     walker.nextSibling(); // TODO verify this is correct.
                //   }
                // }
                const nodes = [];
                if (walker.currentNode.nodeType === Node.TEXT_NODE) {
                    nodes.push(walker.currentNode);
                }
                while (walker.nextNode() && range.comparePoint(walker.currentNode, 0) !== 1) {
                    if (walker.currentNode.nodeType === Node.TEXT_NODE) {
                        nodes.push(walker.currentNode);
                    }
                }
                return nodes;
            }
            // Replace [node] with <tagName ...attributes>[node]</tagName>
            function wrapNodeInHighlight(node, tagName, attributes) {
                const highlightElement = node.ownerDocument.createElement(tagName);
                Object.keys(attributes).forEach(key => {
                    highlightElement.setAttribute(key, attributes[key]);
                });
                const tempRange = node.ownerDocument.createRange();
                tempRange.selectNode(node);
                tempRange.surroundContents(highlightElement);
                return highlightElement;
            }
            if (range.collapsed) {
                return {
                    remove: () => { },
                    update: () => { }
                };
            }
            // First put all nodes in an array (splits start and end nodes if needed)
            const nodes = _textNodesInRange(range);
            // Highlight each node
            const highlightElements = [];
            for (const nodeIdx in nodes) {
                const highlightElement = wrapNodeInHighlight(nodes[nodeIdx], tagName, attributes);
                highlightElements.push(highlightElement);
            }
            // Remove a highlight element created with wrapNodeInHighlight.
            function _removeHighlight(highlightElement) {
                var _a, _b;
                if (highlightElement.childNodes.length === 1) {
                    (_a = highlightElement.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(highlightElement.firstChild, highlightElement);
                }
                else {
                    // If the highlight somehow contains multiple nodes now, move them all.
                    while (highlightElement.firstChild) {
                        (_b = highlightElement.parentNode) === null || _b === void 0 ? void 0 : _b.insertBefore(highlightElement.firstChild, highlightElement);
                    }
                    highlightElement.remove();
                }
            }
            // Return a function that cleans up the highlightElements.
            function _removeHighlights() {
                // Remove each of the created highlightElements.
                for (const highlightIdx in highlightElements) {
                    _removeHighlight(highlightElements[highlightIdx]);
                }
            }
            function _updateHighlight(highlightElement, attributes = {}) {
                Object.keys(attributes).forEach(key => {
                    highlightElement.setAttribute(key, attributes[key]);
                });
            }
            function updateHighlights(attributes) {
                for (const highlightIdx in highlightElements) {
                    _updateHighlight(highlightElements[highlightIdx], attributes);
                }
            }
            return {
                remove: _removeHighlights,
                update: updateHighlights
            };
        }
        function selectRange(_range) {
            const sel = window.getSelection();
            if (sel) {
                try {
                    sel.removeAllRanges();
                    const r = document.createRange();
                    r.setStart(_range.startContainer, _range.startOffset);
                    r.setEnd(_range.endContainer, _range.endOffset);
                    sel.addRange(r);
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
        function highlightRange(range, useCustom, tagName = 'mark', attributes = {}) {
            if (useCustom) {
                const ret = _internalHighlightRange(range, tagName, attributes);
                return {
                    range: range,
                    dispose: ret.remove,
                    update: (color, className) => {
                        if (className === undefined) {
                            ret.update({
                                'style': `background-color: ${color}`
                            });
                        }
                        else {
                            ret.update({
                                'class': className
                            });
                        }
                    }
                };
            }
            else {
                window.document.execCommand('hiliteColor', false, matchColor);
                const cloneRange = window.getSelection().getRangeAt(0).cloneRange();
                const _range = {
                    collapsed: cloneRange.collapsed,
                    commonAncestorContainer: cloneRange.commonAncestorContainer,
                    endContainer: cloneRange.endContainer,
                    endOffset: cloneRange.endOffset,
                    startContainer: cloneRange.startContainer,
                    startOffset: cloneRange.startOffset
                };
                return {
                    range: _range,
                    dispose: () => {
                        var _a;
                        selectRange(_range);
                        try {
                            document.designMode = 'On';
                            document.execCommand('removeFormat', false, undefined);
                            document.designMode = 'Off';
                            (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
                        }
                        catch (e) {
                            console.log(e);
                        }
                    },
                    update: (color, className) => {
                        var _a;
                        selectRange(_range);
                        try {
                            document.designMode = 'On';
                            document.execCommand('removeFormat', false, undefined);
                            window.document.execCommand('hiliteColor', false, color);
                            document.designMode = 'Off';
                            (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                };
            }
        }
        class OutputFocusTracker {
            constructor(element, outputId) {
                this._hasFocus = false;
                this._loosingFocus = false;
                this._element = element;
                this._outputId = outputId;
                this._hasFocus = isAncestor(document.activeElement, element);
                this._loosingFocus = false;
                element.addEventListener('focus', this._onFocus.bind(this), true);
                element.addEventListener('blur', this._onBlur.bind(this), true);
            }
            _onFocus() {
                this._loosingFocus = false;
                if (!this._hasFocus) {
                    this._hasFocus = true;
                    postNotebookMessage('outputFocus', {
                        id: this._outputId,
                    });
                }
            }
            _onBlur() {
                if (this._hasFocus) {
                    this._loosingFocus = true;
                    window.setTimeout(() => {
                        if (this._loosingFocus) {
                            this._loosingFocus = false;
                            this._hasFocus = false;
                            postNotebookMessage('outputBlur', {
                                id: this._outputId,
                            });
                        }
                    }, 0);
                }
            }
            dispose() {
                if (this._element) {
                    this._element.removeEventListener('focus', this._onFocus, true);
                    this._element.removeEventListener('blur', this._onBlur, true);
                }
            }
        }
        const outputFocusTrackers = new Map();
        function addOutputFocusTracker(element, outputId) {
            var _a;
            if (outputFocusTrackers.has(outputId)) {
                (_a = outputFocusTrackers.get(outputId)) === null || _a === void 0 ? void 0 : _a.dispose();
            }
            outputFocusTrackers.set(outputId, new OutputFocusTracker(element, outputId));
        }
        function createEmitter(listenerChange = () => undefined) {
            const listeners = new Set();
            return {
                fire(data) {
                    for (const listener of [...listeners]) {
                        listener.fn.call(listener.thisArg, data);
                    }
                },
                event(fn, thisArg, disposables) {
                    const listenerObj = { fn, thisArg };
                    const disposable = {
                        dispose: () => {
                            listeners.delete(listenerObj);
                            listenerChange(listeners);
                        },
                    };
                    listeners.add(listenerObj);
                    listenerChange(listeners);
                    if (disposables instanceof Array) {
                        disposables.push(disposable);
                    }
                    else if (disposables) {
                        disposables.add(disposable);
                    }
                    return disposable;
                },
            };
        }
        function showPreloadErrors(outputNode, ...errors) {
            outputNode.innerText = `Error loading preloads:`;
            const errList = document.createElement('ul');
            for (const result of errors) {
                console.error(result);
                const item = document.createElement('li');
                item.innerText = result.message;
                errList.appendChild(item);
            }
            outputNode.appendChild(errList);
        }
        function createOutputItem(id, mime, metadata, valueBytes) {
            return Object.freeze({
                id,
                mime,
                metadata,
                data() {
                    return valueBytes;
                },
                text() {
                    return textDecoder.decode(valueBytes);
                },
                json() {
                    return JSON.parse(this.text());
                },
                blob() {
                    return new Blob([valueBytes], { type: this.mime });
                }
            });
        }
        const onDidReceiveKernelMessage = createEmitter();
        const kernelPreloadGlobals = {
            acquireVsCodeApi,
            onDidReceiveKernelMessage: onDidReceiveKernelMessage.event,
            postKernelMessage: (data) => postNotebookMessage('customKernelMessage', { message: data }),
        };
        const ttPolicy = (_a = window.trustedTypes) === null || _a === void 0 ? void 0 : _a.createPolicy('notebookRenderer', {
            createHTML: value => value,
            createScript: value => value,
        });
        window.addEventListener('wheel', handleWheel);
        let _highlighter = null;
        let matchColor = window.getComputedStyle(document.getElementById('_defaultColorPalatte')).color;
        let currentMatchColor = window.getComputedStyle(document.getElementById('_defaultColorPalatte')).backgroundColor;
        class JSHighlighter {
            constructor(matches) {
                this.matches = matches;
                this._findMatchIndex = -1;
                for (let i = matches.length - 1; i >= 0; i--) {
                    const match = matches[i];
                    const ret = highlightRange(match.originalRange, true, 'mark', match.isShadow ? {
                        'style': 'background-color: ' + matchColor + ';',
                    } : {
                        'class': 'find-match'
                    });
                    match.highlightResult = ret;
                }
            }
            highlightCurrentMatch(index) {
                var _a, _b, _c;
                const oldMatch = this.matches[this._findMatchIndex];
                if (oldMatch) {
                    (_a = oldMatch.highlightResult) === null || _a === void 0 ? void 0 : _a.update(matchColor, oldMatch.isShadow ? undefined : 'find-match');
                }
                const match = this.matches[index];
                this._findMatchIndex = index;
                const sel = window.getSelection();
                if (!!match && !!sel && match.highlightResult) {
                    let offset = 0;
                    try {
                        const outputOffset = document.getElementById(match.id).getBoundingClientRect().top;
                        const tempRange = document.createRange();
                        tempRange.selectNode(match.highlightResult.range.startContainer);
                        const rangeOffset = tempRange.getBoundingClientRect().top;
                        tempRange.detach();
                        offset = rangeOffset - outputOffset;
                    }
                    catch (e) {
                    }
                    (_b = match.highlightResult) === null || _b === void 0 ? void 0 : _b.update(currentMatchColor, match.isShadow ? undefined : 'current-find-match');
                    (_c = document.getSelection()) === null || _c === void 0 ? void 0 : _c.removeAllRanges();
                    postNotebookMessage('didFindHighlight', {
                        offset
                    });
                }
            }
            unHighlightCurrentMatch(index) {
                const oldMatch = this.matches[index];
                if (oldMatch && oldMatch.highlightResult) {
                    oldMatch.highlightResult.update(matchColor, oldMatch.isShadow ? undefined : 'find-match');
                }
            }
            dispose() {
                var _a;
                (_a = document.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
                this.matches.forEach(match => {
                    var _a;
                    (_a = match.highlightResult) === null || _a === void 0 ? void 0 : _a.dispose();
                });
            }
        }
        class CSSHighlighter {
            constructor(matches) {
                var _a, _b;
                this.matches = matches;
                this._findMatchIndex = -1;
                this._matchesHighlight = new Highlight();
                this._matchesHighlight.priority = 1;
                this._currentMatchesHighlight = new Highlight();
                this._currentMatchesHighlight.priority = 2;
                for (let i = 0; i < matches.length; i++) {
                    this._matchesHighlight.add(matches[i].originalRange);
                }
                (_a = CSS.highlights) === null || _a === void 0 ? void 0 : _a.set('find-highlight', this._matchesHighlight);
                (_b = CSS.highlights) === null || _b === void 0 ? void 0 : _b.set('current-find-highlight', this._currentMatchesHighlight);
            }
            highlightCurrentMatch(index) {
                this._findMatchIndex = index;
                const match = this.matches[this._findMatchIndex];
                const range = match.originalRange;
                if (match) {
                    let offset = 0;
                    try {
                        const outputOffset = document.getElementById(match.id).getBoundingClientRect().top;
                        const rangeOffset = match.originalRange.getBoundingClientRect().top;
                        offset = rangeOffset - outputOffset;
                        postNotebookMessage('didFindHighlight', {
                            offset
                        });
                    }
                    catch (e) {
                    }
                }
                this._currentMatchesHighlight.clear();
                this._currentMatchesHighlight.add(range);
            }
            unHighlightCurrentMatch(index) {
                this._currentMatchesHighlight.clear();
            }
            dispose() {
                var _a;
                (_a = document.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
                this._currentMatchesHighlight.clear();
                this._matchesHighlight.clear();
            }
        }
        const find = (query, options) => {
            var _a, _b, _c, _d, _e, _f;
            let find = true;
            let matches = [];
            let range = document.createRange();
            range.selectNodeContents(document.getElementById('findStart'));
            let sel = window.getSelection();
            sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
            sel === null || sel === void 0 ? void 0 : sel.addRange(range);
            viewModel.toggleDragDropEnabled(false);
            try {
                document.designMode = 'On';
                while (find && matches.length < 500) {
                    find = window.find(query, /* caseSensitive*/ !!options.caseSensitive, 
                    /* backwards*/ false, 
                    /* wrapAround*/ false, 
                    /* wholeWord */ !!options.wholeWord, 
                    /* searchInFrames*/ true, false);
                    if (find) {
                        const selection = window.getSelection();
                        if (!selection) {
                            console.log('no selection');
                            break;
                        }
                        if (options.includeMarkup && selection.rangeCount > 0 && selection.getRangeAt(0).startContainer.nodeType === 1
                            && selection.getRangeAt(0).startContainer.classList.contains('markup')) {
                            // markdown preview container
                            const preview = (_a = selection.anchorNode) === null || _a === void 0 ? void 0 : _a.firstChild;
                            const root = preview.shadowRoot;
                            const shadowSelection = (root === null || root === void 0 ? void 0 : root.getSelection) ? root === null || root === void 0 ? void 0 : root.getSelection() : null;
                            if (shadowSelection && shadowSelection.anchorNode) {
                                matches.push({
                                    type: 'preview',
                                    id: preview.id,
                                    cellId: preview.id,
                                    container: preview,
                                    isShadow: true,
                                    originalRange: shadowSelection.getRangeAt(0)
                                });
                            }
                        }
                        if (options.includeOutput && selection.rangeCount > 0 && selection.getRangeAt(0).startContainer.nodeType === 1
                            && selection.getRangeAt(0).startContainer.classList.contains('output_container')) {
                            // output container
                            const cellId = selection.getRangeAt(0).startContainer.parentElement.id;
                            const outputNode = (_b = selection.anchorNode) === null || _b === void 0 ? void 0 : _b.firstChild;
                            const root = outputNode.shadowRoot;
                            const shadowSelection = (root === null || root === void 0 ? void 0 : root.getSelection) ? root === null || root === void 0 ? void 0 : root.getSelection() : null;
                            if (shadowSelection && shadowSelection.anchorNode) {
                                matches.push({
                                    type: 'output',
                                    id: outputNode.id,
                                    cellId: cellId,
                                    container: outputNode,
                                    isShadow: true,
                                    originalRange: shadowSelection.getRangeAt(0)
                                });
                            }
                        }
                        const anchorNode = (_c = selection === null || selection === void 0 ? void 0 : selection.anchorNode) === null || _c === void 0 ? void 0 : _c.parentElement;
                        if (anchorNode) {
                            const lastEl = matches.length ? matches[matches.length - 1] : null;
                            if (lastEl && lastEl.container.contains(anchorNode) && options.includeOutput) {
                                matches.push({
                                    type: lastEl.type,
                                    id: lastEl.id,
                                    cellId: lastEl.cellId,
                                    container: lastEl.container,
                                    isShadow: false,
                                    originalRange: window.getSelection().getRangeAt(0)
                                });
                            }
                            else {
                                for (let node = anchorNode; node; node = node.parentElement) {
                                    if (!(node instanceof Element)) {
                                        break;
                                    }
                                    if (node.classList.contains('output') && options.includeOutput) {
                                        // inside output
                                        const cellId = (_e = (_d = node.parentElement) === null || _d === void 0 ? void 0 : _d.parentElement) === null || _e === void 0 ? void 0 : _e.id;
                                        if (cellId) {
                                            matches.push({
                                                type: 'output',
                                                id: node.id,
                                                cellId: cellId,
                                                container: node,
                                                isShadow: false,
                                                originalRange: window.getSelection().getRangeAt(0)
                                            });
                                        }
                                        break;
                                    }
                                    if (node.id === 'container' || node === document.body) {
                                        break;
                                    }
                                }
                            }
                        }
                        else {
                            break;
                        }
                    }
                }
            }
            catch (e) {
                console.log(e);
            }
            if (matches.length && CSS.highlights) {
                _highlighter = new CSSHighlighter(matches);
            }
            else {
                _highlighter = new JSHighlighter(matches);
            }
            (_f = document.getSelection()) === null || _f === void 0 ? void 0 : _f.removeAllRanges();
            viewModel.toggleDragDropEnabled(currentOptions.dragAndDropEnabled);
            postNotebookMessage('didFind', {
                matches: matches.map((match, index) => ({
                    type: match.type,
                    id: match.id,
                    cellId: match.cellId,
                    index
                }))
            });
        };
        window.addEventListener('message', async (rawEvent) => {
            var _a;
            const event = rawEvent;
            switch (event.data.type) {
                case 'initializeMarkup':
                    await Promise.all(event.data.cells.map(info => viewModel.ensureMarkupCell(info)));
                    dimensionUpdater.updateImmediately();
                    postNotebookMessage('initializedMarkup', {});
                    break;
                case 'createMarkupCell':
                    viewModel.ensureMarkupCell(event.data.cell);
                    break;
                case 'showMarkupCell':
                    viewModel.showMarkupCell(event.data.id, event.data.top, event.data.content);
                    break;
                case 'hideMarkupCells':
                    for (const id of event.data.ids) {
                        viewModel.hideMarkupCell(id);
                    }
                    break;
                case 'unhideMarkupCells':
                    for (const id of event.data.ids) {
                        viewModel.unhideMarkupCell(id);
                    }
                    break;
                case 'deleteMarkupCell':
                    for (const id of event.data.ids) {
                        viewModel.deleteMarkupCell(id);
                    }
                    break;
                case 'updateSelectedMarkupCells':
                    viewModel.updateSelectedCells(event.data.selectedCellIds);
                    break;
                case 'html': {
                    const data = event.data;
                    outputRunner.enqueue(data.outputId, (state) => {
                        return viewModel.renderOutputCell(data, state);
                    });
                    break;
                }
                case 'view-scroll':
                    {
                        // const date = new Date();
                        // console.log('----- will scroll ----  ', date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds());
                        event.data.widgets.forEach(widget => {
                            outputRunner.enqueue(widget.outputId, () => {
                                viewModel.updateOutputsScroll([widget]);
                            });
                        });
                        viewModel.updateMarkupScrolls(event.data.markupCells);
                        break;
                    }
                case 'clear':
                    renderers.clearAll();
                    viewModel.clearAll();
                    document.getElementById('container').innerText = '';
                    outputFocusTrackers.forEach(ft => {
                        ft.dispose();
                    });
                    outputFocusTrackers.clear();
                    break;
                case 'clearOutput': {
                    const { cellId, rendererId, outputId } = event.data;
                    outputRunner.cancelOutput(outputId);
                    viewModel.clearOutput(cellId, outputId, rendererId);
                    break;
                }
                case 'hideOutput': {
                    const { cellId, outputId } = event.data;
                    outputRunner.enqueue(outputId, () => {
                        viewModel.hideOutput(cellId);
                    });
                    break;
                }
                case 'showOutput': {
                    const { outputId, cellTop, cellId, content } = event.data;
                    outputRunner.enqueue(outputId, () => {
                        viewModel.showOutput(cellId, outputId, cellTop);
                        if (content) {
                            viewModel.updateAndRerender(cellId, outputId, content);
                        }
                    });
                    break;
                }
                case 'ack-dimension': {
                    for (const { cellId, outputId, height } of event.data.updates) {
                        viewModel.updateOutputHeight(cellId, outputId, height);
                    }
                    break;
                }
                case 'preload': {
                    const resources = event.data.resources;
                    for (const { uri, originalUri } of resources) {
                        kernelPreloads.load(uri, originalUri);
                    }
                    break;
                }
                case 'focus-output':
                    focusFirstFocusableInCell(event.data.cellId);
                    break;
                case 'decorations': {
                    let outputContainer = document.getElementById(event.data.cellId);
                    if (!outputContainer) {
                        viewModel.ensureOutputCell(event.data.cellId, -100000, true);
                        outputContainer = document.getElementById(event.data.cellId);
                    }
                    outputContainer === null || outputContainer === void 0 ? void 0 : outputContainer.classList.add(...event.data.addedClassNames);
                    outputContainer === null || outputContainer === void 0 ? void 0 : outputContainer.classList.remove(...event.data.removedClassNames);
                    break;
                }
                case 'customKernelMessage':
                    onDidReceiveKernelMessage.fire(event.data.message);
                    break;
                case 'customRendererMessage':
                    (_a = renderers.getRenderer(event.data.rendererId)) === null || _a === void 0 ? void 0 : _a.receiveMessage(event.data.message);
                    break;
                case 'notebookStyles': {
                    const documentStyle = document.documentElement.style;
                    for (let i = documentStyle.length - 1; i >= 0; i--) {
                        const property = documentStyle[i];
                        // Don't remove properties that the webview might have added separately
                        if (property && property.startsWith('--notebook-')) {
                            documentStyle.removeProperty(property);
                        }
                    }
                    // Re-add new properties
                    for (const [name, value] of Object.entries(event.data.styles)) {
                        documentStyle.setProperty(`--${name}`, value);
                    }
                    break;
                }
                case 'notebookOptions':
                    currentOptions = event.data.options;
                    viewModel.toggleDragDropEnabled(currentOptions.dragAndDropEnabled);
                    break;
                case 'updateWorkspaceTrust': {
                    isWorkspaceTrusted = event.data.isTrusted;
                    viewModel.rerender();
                    break;
                }
                case 'tokenizedCodeBlock': {
                    const { codeBlockId, html } = event.data;
                    MarkdownCodeBlock.highlightCodeBlock(codeBlockId, html);
                    break;
                }
                case 'tokenizedStylesChanged': {
                    if (tokenizationStyleElement) {
                        tokenizationStyleElement.textContent = event.data.css;
                    }
                    break;
                }
                case 'find': {
                    _highlighter === null || _highlighter === void 0 ? void 0 : _highlighter.dispose();
                    find(event.data.query, event.data.options);
                    break;
                }
                case 'findHighlight': {
                    _highlighter === null || _highlighter === void 0 ? void 0 : _highlighter.highlightCurrentMatch(event.data.index);
                    break;
                }
                case 'findUnHighlight': {
                    _highlighter === null || _highlighter === void 0 ? void 0 : _highlighter.unHighlightCurrentMatch(event.data.index);
                    break;
                }
                case 'findStop': {
                    _highlighter === null || _highlighter === void 0 ? void 0 : _highlighter.dispose();
                    break;
                }
            }
        });
        class Renderer {
            constructor(data, loadExtension) {
                this.data = data;
                this.loadExtension = loadExtension;
                this._onMessageEvent = createEmitter();
            }
            get api() { return this._api; }
            load() {
                if (!this._loadPromise) {
                    this._loadPromise = this._load();
                }
                return this._loadPromise;
            }
            receiveMessage(message) {
                this._onMessageEvent.fire(message);
            }
            createRendererContext() {
                const { id, messaging } = this.data;
                const context = {
                    setState: newState => vscode.setState(Object.assign(Object.assign({}, vscode.getState()), { [id]: newState })),
                    getState: () => {
                        const state = vscode.getState();
                        return typeof state === 'object' && state ? state[id] : undefined;
                    },
                    // TODO: This is async so that we can return a promise to the API in the future.
                    // Currently the API is always resolved before we call `createRendererContext`.
                    getRenderer: async (id) => { var _a; return (_a = renderers.getRenderer(id)) === null || _a === void 0 ? void 0 : _a.api; },
                    workspace: {
                        get isTrusted() { return isWorkspaceTrusted; }
                    },
                    settings: {
                        get lineLimit() { return lineLimit; },
                    }
                };
                if (messaging) {
                    context.onDidReceiveMessage = this._onMessageEvent.event;
                    context.postMessage = message => postNotebookMessage('customRendererMessage', { rendererId: id, message });
                }
                return context;
            }
            /** Inner function cached in the _loadPromise(). */
            async _load() {
                const module = await __import(this.data.entrypoint);
                if (!module) {
                    return;
                }
                const api = await module.activate(this.createRendererContext());
                this._api = api;
                // Squash any errors extends errors. They won't prevent the renderer
                // itself from working, so just log them.
                await Promise.all(ctx.rendererData
                    .filter(d => d.extends === this.data.id)
                    .map(d => this.loadExtension(d.id).catch(console.error)));
                return api;
            }
        }
        const kernelPreloads = new class {
            constructor() {
                this.preloads = new Map();
            }
            /**
             * Returns a promise that resolves when the given preload is activated.
             */
            waitFor(uri) {
                return this.preloads.get(uri) || Promise.resolve(new Error(`Preload not ready: ${uri}`));
            }
            /**
             * Loads a preload.
             * @param uri URI to load from
             * @param originalUri URI to show in an error message if the preload is invalid.
             */
            load(uri, originalUri) {
                const promise = Promise.all([
                    runKernelPreload(uri, originalUri),
                    this.waitForAllCurrent(),
                ]);
                this.preloads.set(uri, promise);
                return promise;
            }
            /**
             * Returns a promise that waits for all currently-registered preloads to
             * activate before resolving.
             */
            waitForAllCurrent() {
                return Promise.all([...this.preloads.values()].map(p => p.catch(err => err)));
            }
        };
        const outputRunner = new class {
            constructor() {
                this.outputs = new Map();
            }
            /**
             * Pushes the action onto the list of actions for the given output ID,
             * ensuring that it's run in-order.
             */
            enqueue(outputId, action) {
                const record = this.outputs.get(outputId);
                if (!record) {
                    this.outputs.set(outputId, { cancelled: false, queue: new Promise(r => r(action({ cancelled: false }))) });
                }
                else {
                    record.queue = record.queue.then(r => !record.cancelled && action(record));
                }
            }
            /**
             * Cancels the rendering of all outputs.
             */
            cancelAll() {
                for (const record of this.outputs.values()) {
                    record.cancelled = true;
                }
                this.outputs.clear();
            }
            /**
             * Cancels any ongoing rendering out an output.
             */
            cancelOutput(outputId) {
                const output = this.outputs.get(outputId);
                if (output) {
                    output.cancelled = true;
                    this.outputs.delete(outputId);
                }
            }
        };
        const renderers = new class {
            constructor() {
                this._renderers = new Map();
                for (const renderer of ctx.rendererData) {
                    this._renderers.set(renderer.id, new Renderer(renderer, async (extensionId) => {
                        const ext = this._renderers.get(extensionId);
                        if (!ext) {
                            throw new Error(`Could not find extending renderer: ${extensionId}`);
                        }
                        await ext.load();
                    }));
                }
            }
            getRenderer(id) {
                return this._renderers.get(id);
            }
            async load(id) {
                const renderer = this._renderers.get(id);
                if (!renderer) {
                    throw new Error('Could not find renderer');
                }
                return renderer.load();
            }
            clearAll() {
                var _a, _b;
                outputRunner.cancelAll();
                for (const renderer of this._renderers.values()) {
                    (_b = (_a = renderer.api) === null || _a === void 0 ? void 0 : _a.disposeOutputItem) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
            }
            clearOutput(rendererId, outputId) {
                var _a, _b, _c;
                outputRunner.cancelOutput(outputId);
                (_c = (_b = (_a = this._renderers.get(rendererId)) === null || _a === void 0 ? void 0 : _a.api) === null || _b === void 0 ? void 0 : _b.disposeOutputItem) === null || _c === void 0 ? void 0 : _c.call(_b, outputId);
            }
            async render(info, element) {
                var _a;
                const renderers = Array.from(this._renderers.values())
                    .filter(renderer => renderer.data.mimeTypes.includes(info.mime) && !renderer.data.extends);
                if (!renderers.length) {
                    const errorContainer = document.createElement('div');
                    const error = document.createElement('div');
                    error.className = 'no-renderer-error';
                    const errorText = (document.documentElement.style.getPropertyValue('--notebook-cell-renderer-not-found-error') || '').replace('$0', info.mime);
                    error.innerText = errorText;
                    const cellText = document.createElement('div');
                    cellText.innerText = info.text();
                    errorContainer.appendChild(error);
                    errorContainer.appendChild(cellText);
                    element.innerText = '';
                    element.appendChild(errorContainer);
                    return;
                }
                // De-prioritize built-in renderers
                renderers.sort((a, b) => +a.data.isBuiltin - +b.data.isBuiltin);
                (_a = (await renderers[0].load())) === null || _a === void 0 ? void 0 : _a.renderOutputItem(info, element);
            }
        }();
        const viewModel = new class ViewModel {
            constructor() {
                this._markupCells = new Map();
                this._outputCells = new Map();
            }
            clearAll() {
                this._markupCells.clear();
                this._outputCells.clear();
            }
            rerender() {
                this.rerenderMarkupCells();
                this.renderOutputCells();
            }
            async createMarkupCell(init, top, visible) {
                const existing = this._markupCells.get(init.cellId);
                if (existing) {
                    console.error(`Trying to create markup that already exists: ${init.cellId}`);
                    return existing;
                }
                const cell = new MarkupCell(init.cellId, init.mime, init.content, top);
                cell.element.style.visibility = visible ? 'visible' : 'hidden';
                this._markupCells.set(init.cellId, cell);
                await cell.ready;
                return cell;
            }
            async ensureMarkupCell(info) {
                let cell = this._markupCells.get(info.cellId);
                if (cell) {
                    cell.element.style.visibility = info.visible ? 'visible' : 'hidden';
                    await cell.updateContentAndRender(info.content);
                }
                else {
                    cell = await this.createMarkupCell(info, info.offset, info.visible);
                }
            }
            deleteMarkupCell(id) {
                const cell = this.getExpectedMarkupCell(id);
                if (cell) {
                    cell.remove();
                    this._markupCells.delete(id);
                }
            }
            async updateMarkupContent(id, newContent) {
                const cell = this.getExpectedMarkupCell(id);
                await (cell === null || cell === void 0 ? void 0 : cell.updateContentAndRender(newContent));
            }
            showMarkupCell(id, top, newContent) {
                const cell = this.getExpectedMarkupCell(id);
                cell === null || cell === void 0 ? void 0 : cell.show(top, newContent);
            }
            hideMarkupCell(id) {
                const cell = this.getExpectedMarkupCell(id);
                cell === null || cell === void 0 ? void 0 : cell.hide();
            }
            unhideMarkupCell(id) {
                const cell = this.getExpectedMarkupCell(id);
                cell === null || cell === void 0 ? void 0 : cell.unhide();
            }
            rerenderMarkupCells() {
                for (const cell of this._markupCells.values()) {
                    cell.rerender();
                }
            }
            getExpectedMarkupCell(id) {
                const cell = this._markupCells.get(id);
                if (!cell) {
                    console.log(`Could not find markup cell '${id}'`);
                    return undefined;
                }
                return cell;
            }
            updateSelectedCells(selectedCellIds) {
                const selectedCellSet = new Set(selectedCellIds);
                for (const cell of this._markupCells.values()) {
                    cell.setSelected(selectedCellSet.has(cell.id));
                }
            }
            toggleDragDropEnabled(dragAndDropEnabled) {
                for (const cell of this._markupCells.values()) {
                    cell.toggleDragDropEnabled(dragAndDropEnabled);
                }
            }
            updateMarkupScrolls(markupCells) {
                for (const { id, top } of markupCells) {
                    const cell = this._markupCells.get(id);
                    if (cell) {
                        cell.element.style.top = `${top}px`;
                    }
                }
            }
            renderOutputCells() {
                for (const outputCell of this._outputCells.values()) {
                    outputCell.rerender();
                }
            }
            async renderOutputCell(data, state) {
                const preloadsAndErrors = await Promise.all([
                    data.rendererId ? renderers.load(data.rendererId) : undefined,
                    ...data.requiredPreloads.map(p => kernelPreloads.waitFor(p.uri)),
                ].map(p => p === null || p === void 0 ? void 0 : p.catch(err => err)));
                if (state.cancelled) {
                    return;
                }
                const cellOutput = this.ensureOutputCell(data.cellId, data.cellTop, false);
                const outputNode = cellOutput.createOutputElement(data.outputId, data.outputOffset, data.left);
                outputNode.render(data.content, preloadsAndErrors);
                // don't hide until after this step so that the height is right
                cellOutput.element.style.visibility = data.initiallyHidden ? 'hidden' : 'visible';
            }
            ensureOutputCell(cellId, cellTop, skipCellTopUpdateIfExist) {
                let cell = this._outputCells.get(cellId);
                const existed = !!cell;
                if (!cell) {
                    cell = new OutputCell(cellId);
                    this._outputCells.set(cellId, cell);
                }
                if (existed && skipCellTopUpdateIfExist) {
                    return cell;
                }
                cell.element.style.top = cellTop + 'px';
                return cell;
            }
            clearOutput(cellId, outputId, rendererId) {
                const cell = this._outputCells.get(cellId);
                cell === null || cell === void 0 ? void 0 : cell.clearOutput(outputId, rendererId);
            }
            showOutput(cellId, outputId, top) {
                const cell = this._outputCells.get(cellId);
                cell === null || cell === void 0 ? void 0 : cell.show(outputId, top);
            }
            updateAndRerender(cellId, outputId, content) {
                const cell = this._outputCells.get(cellId);
                cell === null || cell === void 0 ? void 0 : cell.updateContentAndRerender(outputId, content);
            }
            hideOutput(cellId) {
                const cell = this._outputCells.get(cellId);
                cell === null || cell === void 0 ? void 0 : cell.hide();
            }
            updateOutputHeight(cellId, outputId, height) {
                const cell = this._outputCells.get(cellId);
                cell === null || cell === void 0 ? void 0 : cell.updateOutputHeight(outputId, height);
            }
            updateOutputsScroll(updates) {
                for (const request of updates) {
                    const cell = this._outputCells.get(request.cellId);
                    cell === null || cell === void 0 ? void 0 : cell.updateScroll(request);
                }
            }
        }();
        class MarkdownCodeBlock {
            static highlightCodeBlock(id, html) {
                var _a;
                const el = MarkdownCodeBlock.pendingCodeBlocksToHighlight.get(id);
                if (!el) {
                    return;
                }
                const trustedHtml = (_a = ttPolicy === null || ttPolicy === void 0 ? void 0 : ttPolicy.createHTML(html)) !== null && _a !== void 0 ? _a : html;
                el.innerHTML = trustedHtml;
                if (tokenizationStyleElement) {
                    el.insertAdjacentElement('beforebegin', tokenizationStyleElement.cloneNode(true));
                }
            }
            static requestHighlightCodeBlock(root) {
                const codeBlocks = [];
                let i = 0;
                for (const el of root.querySelectorAll('.vscode-code-block')) {
                    const lang = el.getAttribute('data-vscode-code-block-lang');
                    if (el.textContent && lang) {
                        const id = `${Date.now()}-${i++}`;
                        codeBlocks.push({ value: el.textContent, lang: lang, id });
                        MarkdownCodeBlock.pendingCodeBlocksToHighlight.set(id, el);
                    }
                }
                return codeBlocks;
            }
        }
        MarkdownCodeBlock.pendingCodeBlocksToHighlight = new Map();
        class MarkupCell {
            constructor(id, mime, content, top) {
                this.id = id;
                this._content = { value: content, version: 0 };
                let resolveReady;
                this.ready = new Promise(r => resolveReady = r);
                let cachedData;
                this.outputItem = Object.freeze({
                    id,
                    mime,
                    metadata: undefined,
                    text: () => {
                        return this._content.value;
                    },
                    json: () => {
                        return undefined;
                    },
                    data: () => {
                        if ((cachedData === null || cachedData === void 0 ? void 0 : cachedData.version) === this._content.version) {
                            return cachedData.value;
                        }
                        const data = textEncoder.encode(this._content.value);
                        cachedData = { version: this._content.version, value: data };
                        return data;
                    },
                    blob() {
                        return new Blob([this.data()], { type: this.mime });
                    }
                });
                const root = document.getElementById('container');
                const markupCell = document.createElement('div');
                markupCell.className = 'markup';
                markupCell.style.position = 'absolute';
                markupCell.style.width = '100%';
                this.element = document.createElement('div');
                this.element.id = this.id;
                this.element.classList.add('preview');
                this.element.style.position = 'absolute';
                this.element.style.top = top + 'px';
                this.toggleDragDropEnabled(currentOptions.dragAndDropEnabled);
                markupCell.appendChild(this.element);
                root.appendChild(markupCell);
                this.addEventListeners();
                this.updateContentAndRender(this._content.value).then(() => {
                    resizeObserver.observe(this.element, this.id, false);
                    resolveReady();
                });
            }
            addEventListeners() {
                this.element.addEventListener('dblclick', () => {
                    postNotebookMessage('toggleMarkupPreview', { cellId: this.id });
                });
                this.element.addEventListener('click', e => {
                    postNotebookMessage('clickMarkupCell', {
                        cellId: this.id,
                        altKey: e.altKey,
                        ctrlKey: e.ctrlKey,
                        metaKey: e.metaKey,
                        shiftKey: e.shiftKey,
                    });
                });
                this.element.addEventListener('contextmenu', e => {
                    postNotebookMessage('contextMenuMarkupCell', {
                        cellId: this.id,
                        clientX: e.clientX,
                        clientY: e.clientY,
                    });
                });
                this.element.addEventListener('mouseenter', () => {
                    postNotebookMessage('mouseEnterMarkupCell', { cellId: this.id });
                });
                this.element.addEventListener('mouseleave', () => {
                    postNotebookMessage('mouseLeaveMarkupCell', { cellId: this.id });
                });
                this.element.addEventListener('dragstart', e => {
                    markupCellDragManager.startDrag(e, this.id);
                });
                this.element.addEventListener('drag', e => {
                    markupCellDragManager.updateDrag(e, this.id);
                });
                this.element.addEventListener('dragend', e => {
                    markupCellDragManager.endDrag(e, this.id);
                });
            }
            async updateContentAndRender(newContent) {
                var _a;
                this._content = { value: newContent, version: this._content.version + 1 };
                await renderers.render(this.outputItem, this.element);
                const root = ((_a = this.element.shadowRoot) !== null && _a !== void 0 ? _a : this.element);
                const html = [];
                for (const child of root.children) {
                    switch (child.tagName) {
                        case 'LINK':
                        case 'SCRIPT':
                        case 'STYLE':
                            // not worth sending over since it will be stripped before rendering
                            break;
                        default:
                            html.push(child.outerHTML);
                            break;
                    }
                }
                const codeBlocks = MarkdownCodeBlock.requestHighlightCodeBlock(root);
                postNotebookMessage('renderedMarkup', {
                    cellId: this.id,
                    html: html.join(''),
                    codeBlocks
                });
                dimensionUpdater.updateHeight(this.id, this.element.offsetHeight, {
                    isOutput: false
                });
            }
            show(top, newContent) {
                this.element.style.visibility = 'visible';
                this.element.style.top = `${top}px`;
                if (typeof newContent === 'string') {
                    this.updateContentAndRender(newContent);
                }
                else {
                    this.updateMarkupDimensions();
                }
            }
            hide() {
                this.element.style.visibility = 'hidden';
            }
            unhide() {
                this.element.style.visibility = 'visible';
                this.updateMarkupDimensions();
            }
            rerender() {
                this.updateContentAndRender(this._content.value);
            }
            remove() {
                this.element.remove();
            }
            async updateMarkupDimensions() {
                dimensionUpdater.updateHeight(this.id, this.element.offsetHeight, {
                    isOutput: false
                });
            }
            setSelected(selected) {
                this.element.classList.toggle('selected', selected);
            }
            toggleDragDropEnabled(enabled) {
                if (enabled) {
                    this.element.classList.add('draggable');
                    this.element.setAttribute('draggable', 'true');
                }
                else {
                    this.element.classList.remove('draggable');
                    this.element.removeAttribute('draggable');
                }
            }
        }
        class OutputCell {
            constructor(cellId) {
                this.outputElements = new Map();
                const container = document.getElementById('container');
                const upperWrapperElement = createFocusSink(cellId);
                container.appendChild(upperWrapperElement);
                this.element = document.createElement('div');
                this.element.style.position = 'absolute';
                this.element.id = cellId;
                this.element.classList.add('cell_container');
                container.appendChild(this.element);
                this.element = this.element;
                const lowerWrapperElement = createFocusSink(cellId, true);
                container.appendChild(lowerWrapperElement);
            }
            createOutputElement(outputId, outputOffset, left) {
                let outputContainer = this.outputElements.get(outputId);
                if (!outputContainer) {
                    outputContainer = new OutputContainer(outputId);
                    this.element.appendChild(outputContainer.element);
                    this.outputElements.set(outputId, outputContainer);
                }
                return outputContainer.createOutputElement(outputId, outputOffset, left);
            }
            clearOutput(outputId, rendererId) {
                var _a;
                (_a = this.outputElements.get(outputId)) === null || _a === void 0 ? void 0 : _a.clear(rendererId);
                this.outputElements.delete(outputId);
            }
            show(outputId, top) {
                const outputContainer = this.outputElements.get(outputId);
                if (!outputContainer) {
                    return;
                }
                this.element.style.visibility = 'visible';
                this.element.style.top = `${top}px`;
                dimensionUpdater.updateHeight(outputId, outputContainer.element.offsetHeight, {
                    isOutput: true,
                });
            }
            hide() {
                this.element.style.visibility = 'hidden';
            }
            updateContentAndRerender(outputId, content) {
                var _a;
                (_a = this.outputElements.get(outputId)) === null || _a === void 0 ? void 0 : _a.updateContentAndRender(content);
            }
            rerender() {
                for (const outputElement of this.outputElements.values()) {
                    outputElement.rerender();
                }
            }
            updateOutputHeight(outputId, height) {
                var _a;
                (_a = this.outputElements.get(outputId)) === null || _a === void 0 ? void 0 : _a.updateHeight(height);
            }
            updateScroll(request) {
                var _a;
                this.element.style.top = `${request.cellTop}px`;
                (_a = this.outputElements.get(request.outputId)) === null || _a === void 0 ? void 0 : _a.updateScroll(request.outputOffset);
                if (request.forceDisplay) {
                    this.element.style.visibility = 'visible';
                }
            }
        }
        class OutputContainer {
            constructor(outputId) {
                this.outputId = outputId;
                this.element = document.createElement('div');
                this.element.classList.add('output_container');
                this.element.style.position = 'absolute';
                this.element.style.overflow = 'hidden';
            }
            clear(rendererId) {
                if (rendererId) {
                    renderers.clearOutput(rendererId, this.outputId);
                }
                this.element.remove();
            }
            updateHeight(height) {
                this.element.style.maxHeight = `${height}px`;
                this.element.style.height = `${height}px`;
            }
            updateScroll(outputOffset) {
                this.element.style.top = `${outputOffset}px`;
            }
            createOutputElement(outputId, outputOffset, left) {
                this.element.innerText = '';
                this.element.style.maxHeight = '0px';
                this.element.style.top = `${outputOffset}px`;
                this._outputNode = new OutputElement(outputId, left);
                this.element.appendChild(this._outputNode.element);
                return this._outputNode;
            }
            rerender() {
                var _a;
                (_a = this._outputNode) === null || _a === void 0 ? void 0 : _a.rerender();
            }
            updateContentAndRender(content) {
                var _a;
                (_a = this._outputNode) === null || _a === void 0 ? void 0 : _a.updateAndRerender(content);
            }
        }
        vscode.postMessage({
            __vscode_notebook_message: true,
            type: 'initialized'
        });
        function postNotebookMessage(type, properties) {
            vscode.postMessage(Object.assign({ __vscode_notebook_message: true, type }, properties));
        }
        class OutputElement {
            constructor(outputId, left) {
                this.outputId = outputId;
                this.hasResizeObserver = false;
                this.element = document.createElement('div');
                this.element.id = outputId;
                this.element.classList.add('output');
                this.element.style.position = 'absolute';
                this.element.style.top = `0px`;
                this.element.style.left = left + 'px';
                this.element.style.padding = '0px';
                addMouseoverListeners(this.element, outputId);
                addOutputFocusTracker(this.element, outputId);
            }
            render(content, preloadsAndErrors) {
                var _a, _b;
                this._content = { content, preloadsAndErrors };
                if (content.type === 0 /* RenderOutputType.Html */) {
                    const trustedHtml = (_a = ttPolicy === null || ttPolicy === void 0 ? void 0 : ttPolicy.createHTML(content.htmlContent)) !== null && _a !== void 0 ? _a : content.htmlContent;
                    this.element.innerHTML = trustedHtml;
                    domEval(this.element);
                }
                else if (preloadsAndErrors.some(e => e instanceof Error)) {
                    const errors = preloadsAndErrors.filter((e) => e instanceof Error);
                    showPreloadErrors(this.element, ...errors);
                }
                else {
                    const rendererApi = preloadsAndErrors[0];
                    try {
                        rendererApi.renderOutputItem(createOutputItem(this.outputId, content.mimeType, content.metadata, content.valueBytes), this.element);
                    }
                    catch (e) {
                        showPreloadErrors(this.element, e);
                    }
                }
                if (!this.hasResizeObserver) {
                    this.hasResizeObserver = true;
                    resizeObserver.observe(this.element, this.outputId, true);
                }
                const offsetHeight = this.element.offsetHeight;
                const cps = document.defaultView.getComputedStyle(this.element);
                if (offsetHeight !== 0 && cps.padding === '0px') {
                    // we set padding to zero if the output height is zero (then we can have a zero-height output DOM node)
                    // thus we need to ensure the padding is accounted when updating the init height of the output
                    dimensionUpdater.updateHeight(this.outputId, offsetHeight + ctx.style.outputNodePadding * 2, {
                        isOutput: true,
                        init: true,
                    });
                    this.element.style.padding = `${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodePadding}px ${ctx.style.outputNodeLeftPadding}`;
                }
                else {
                    dimensionUpdater.updateHeight(this.outputId, this.element.offsetHeight, {
                        isOutput: true,
                        init: true,
                    });
                }
                const root = (_b = this.element.shadowRoot) !== null && _b !== void 0 ? _b : this.element;
                const codeBlocks = MarkdownCodeBlock.requestHighlightCodeBlock(root);
                if (codeBlocks.length > 0) {
                    postNotebookMessage('renderedCellOutput', {
                        codeBlocks
                    });
                }
            }
            rerender() {
                if (this._content) {
                    this.render(this._content.content, this._content.preloadsAndErrors);
                }
            }
            updateAndRerender(content) {
                if (this._content) {
                    this._content.content = content;
                    this.render(this._content.content, this._content.preloadsAndErrors);
                }
            }
        }
        const markupCellDragManager = new class MarkupCellDragManager {
            constructor() {
                document.addEventListener('dragover', e => {
                    // Allow dropping dragged markup cells
                    e.preventDefault();
                });
                document.addEventListener('drop', e => {
                    e.preventDefault();
                    const drag = this.currentDrag;
                    if (!drag) {
                        return;
                    }
                    this.currentDrag = undefined;
                    postNotebookMessage('cell-drop', {
                        cellId: drag.cellId,
                        ctrlKey: e.ctrlKey,
                        altKey: e.altKey,
                        dragOffsetY: e.clientY,
                    });
                });
            }
            startDrag(e, cellId) {
                if (!e.dataTransfer) {
                    return;
                }
                if (!currentOptions.dragAndDropEnabled) {
                    return;
                }
                this.currentDrag = { cellId, clientY: e.clientY };
                const overlayZIndex = 9999;
                if (!this.dragOverlay) {
                    this.dragOverlay = document.createElement('div');
                    this.dragOverlay.style.position = 'absolute';
                    this.dragOverlay.style.top = '0';
                    this.dragOverlay.style.left = '0';
                    this.dragOverlay.style.zIndex = `${overlayZIndex}`;
                    this.dragOverlay.style.width = '100%';
                    this.dragOverlay.style.height = '100%';
                    this.dragOverlay.style.background = 'transparent';
                    document.body.appendChild(this.dragOverlay);
                }
                e.target.style.zIndex = `${overlayZIndex + 1}`;
                e.target.classList.add('dragging');
                postNotebookMessage('cell-drag-start', {
                    cellId: cellId,
                    dragOffsetY: e.clientY,
                });
                // Continuously send updates while dragging instead of relying on `updateDrag`.
                // This lets us scroll the list based on drag position.
                const trySendDragUpdate = () => {
                    var _a;
                    if (((_a = this.currentDrag) === null || _a === void 0 ? void 0 : _a.cellId) !== cellId) {
                        return;
                    }
                    postNotebookMessage('cell-drag', {
                        cellId: cellId,
                        dragOffsetY: this.currentDrag.clientY,
                    });
                    requestAnimationFrame(trySendDragUpdate);
                };
                requestAnimationFrame(trySendDragUpdate);
            }
            updateDrag(e, cellId) {
                var _a;
                if (cellId !== ((_a = this.currentDrag) === null || _a === void 0 ? void 0 : _a.cellId)) {
                    this.currentDrag = undefined;
                }
                else {
                    this.currentDrag = { cellId, clientY: e.clientY };
                }
            }
            endDrag(e, cellId) {
                this.currentDrag = undefined;
                e.target.classList.remove('dragging');
                postNotebookMessage('cell-drag-end', {
                    cellId: cellId
                });
                if (this.dragOverlay) {
                    document.body.removeChild(this.dragOverlay);
                    this.dragOverlay = undefined;
                }
                e.target.style.zIndex = '';
            }
        }();
    }
    function preloadsScriptStr(styleValues, options, renderers, isWorkspaceTrusted, lineLimit, nonce) {
        const ctx = {
            style: styleValues,
            options,
            rendererData: renderers,
            isWorkspaceTrusted,
            lineLimit,
            nonce,
        };
        // TS will try compiling `import()` in webviewPreloads, so use a helper function instead
        // of using `import(...)` directly
        return `
		const __import = (x) => import(x);
		(${webviewPreloads})(
			JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(ctx))}"))
		)\n//# sourceURL=notebookWebviewPreloads.js\n`;
    }
    exports.preloadsScriptStr = preloadsScriptStr;
});
//# sourceMappingURL=webviewPreloads.js.map