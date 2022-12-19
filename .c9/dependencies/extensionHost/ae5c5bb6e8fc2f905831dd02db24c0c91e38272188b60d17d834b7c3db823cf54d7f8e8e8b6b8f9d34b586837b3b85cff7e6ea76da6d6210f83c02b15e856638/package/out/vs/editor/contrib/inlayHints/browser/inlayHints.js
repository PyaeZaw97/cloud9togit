/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/common/network", "vs/base/common/uri"], function (require, exports, errors_1, lifecycle_1, position_1, range_1, network_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.asCommandLink = exports.InlayHintsFragments = exports.InlayHintItem = exports.InlayHintAnchor = void 0;
    class InlayHintAnchor {
        constructor(range, direction) {
            this.range = range;
            this.direction = direction;
        }
    }
    exports.InlayHintAnchor = InlayHintAnchor;
    class InlayHintItem {
        constructor(hint, anchor, provider) {
            this.hint = hint;
            this.anchor = anchor;
            this.provider = provider;
            this._isResolved = false;
        }
        with(delta) {
            const result = new InlayHintItem(this.hint, delta.anchor, this.provider);
            result._isResolved = this._isResolved;
            result._currentResolve = this._currentResolve;
            return result;
        }
        async resolve(token) {
            if (typeof this.provider.resolveInlayHint !== 'function') {
                return;
            }
            if (this._currentResolve) {
                // wait for an active resolve operation and try again
                // when that's done.
                await this._currentResolve;
                if (token.isCancellationRequested) {
                    return;
                }
                return this.resolve(token);
            }
            if (!this._isResolved) {
                this._currentResolve = this._doResolve(token)
                    .finally(() => this._currentResolve = undefined);
            }
            await this._currentResolve;
        }
        async _doResolve(token) {
            var _a, _b;
            try {
                const newHint = await Promise.resolve(this.provider.resolveInlayHint(this.hint, token));
                this.hint.tooltip = (_a = newHint === null || newHint === void 0 ? void 0 : newHint.tooltip) !== null && _a !== void 0 ? _a : this.hint.tooltip;
                this.hint.label = (_b = newHint === null || newHint === void 0 ? void 0 : newHint.label) !== null && _b !== void 0 ? _b : this.hint.label;
                this._isResolved = true;
            }
            catch (err) {
                (0, errors_1.onUnexpectedExternalError)(err);
                this._isResolved = false;
            }
        }
    }
    exports.InlayHintItem = InlayHintItem;
    class InlayHintsFragments {
        constructor(ranges, data, model) {
            this._disposables = new lifecycle_1.DisposableStore();
            this.ranges = ranges;
            this.provider = new Set();
            const items = [];
            for (const [list, provider] of data) {
                this._disposables.add(list);
                this.provider.add(provider);
                for (const hint of list.hints) {
                    // compute the range to which the item should be attached to
                    let position = model.validatePosition(hint.position);
                    let direction = 'before';
                    const wordRange = InlayHintsFragments._getRangeAtPosition(model, position);
                    let range;
                    if (wordRange.getStartPosition().isBefore(position)) {
                        range = range_1.Range.fromPositions(wordRange.getStartPosition(), position);
                        direction = 'after';
                    }
                    else {
                        range = range_1.Range.fromPositions(position, wordRange.getEndPosition());
                        direction = 'before';
                    }
                    items.push(new InlayHintItem(hint, new InlayHintAnchor(range, direction), provider));
                }
            }
            this.items = items.sort((a, b) => position_1.Position.compare(a.hint.position, b.hint.position));
        }
        static async create(registry, model, ranges, token) {
            const data = [];
            const promises = registry.ordered(model).reverse().map(provider => ranges.map(async (range) => {
                try {
                    const result = await provider.provideInlayHints(model, range, token);
                    if (result === null || result === void 0 ? void 0 : result.hints.length) {
                        data.push([result, provider]);
                    }
                }
                catch (err) {
                    (0, errors_1.onUnexpectedExternalError)(err);
                }
            }));
            await Promise.all(promises.flat());
            if (token.isCancellationRequested || model.isDisposed()) {
                throw new errors_1.CancellationError();
            }
            return new InlayHintsFragments(ranges, data, model);
        }
        dispose() {
            this._disposables.dispose();
        }
        static _getRangeAtPosition(model, position) {
            const line = position.lineNumber;
            const word = model.getWordAtPosition(position);
            if (word) {
                // always prefer the word range
                return new range_1.Range(line, word.startColumn, line, word.endColumn);
            }
            model.tokenization.tokenizeIfCheap(line);
            const tokens = model.tokenization.getLineTokens(line);
            const offset = position.column - 1;
            const idx = tokens.findTokenIndexAtOffset(offset);
            let start = tokens.getStartOffset(idx);
            let end = tokens.getEndOffset(idx);
            if (end - start === 1) {
                // single character token, when at its end try leading/trailing token instead
                if (start === offset && idx > 1) {
                    // leading token
                    start = tokens.getStartOffset(idx - 1);
                    end = tokens.getEndOffset(idx - 1);
                }
                else if (end === offset && idx < tokens.getCount() - 1) {
                    // trailing token
                    start = tokens.getStartOffset(idx + 1);
                    end = tokens.getEndOffset(idx + 1);
                }
            }
            return new range_1.Range(line, start + 1, line, end + 1);
        }
    }
    exports.InlayHintsFragments = InlayHintsFragments;
    function asCommandLink(command) {
        return uri_1.URI.from({
            scheme: network_1.Schemas.command,
            path: command.id,
            query: command.arguments && encodeURIComponent(JSON.stringify(command.arguments))
        }).toString();
    }
    exports.asCommandLink = asCommandLink;
});
//# sourceMappingURL=inlayHints.js.map