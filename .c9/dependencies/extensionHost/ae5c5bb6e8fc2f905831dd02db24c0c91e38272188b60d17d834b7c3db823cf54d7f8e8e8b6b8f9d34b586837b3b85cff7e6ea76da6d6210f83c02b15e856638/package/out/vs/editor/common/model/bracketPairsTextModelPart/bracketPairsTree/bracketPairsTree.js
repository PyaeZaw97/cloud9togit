/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/textModelBracketPairs", "./beforeEditPositionMapper", "./brackets", "./length", "./parser", "./smallImmutableSet", "./tokenizer"], function (require, exports, event_1, lifecycle_1, range_1, textModelBracketPairs_1, beforeEditPositionMapper_1, brackets_1, length_1, parser_1, smallImmutableSet_1, tokenizer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairsTree = void 0;
    class BracketPairsTree extends lifecycle_1.Disposable {
        constructor(textModel, getLanguageConfiguration) {
            super();
            this.textModel = textModel;
            this.getLanguageConfiguration = getLanguageConfiguration;
            this.didChangeEmitter = new event_1.Emitter();
            this.denseKeyProvider = new smallImmutableSet_1.DenseKeyProvider();
            this.brackets = new brackets_1.LanguageAgnosticBracketTokens(this.denseKeyProvider, this.getLanguageConfiguration);
            this.onDidChange = this.didChangeEmitter.event;
            if (textModel.tokenization.backgroundTokenizationState === 0 /* BackgroundTokenizationState.Uninitialized */) {
                // There are no token information yet
                const brackets = this.brackets.getSingleLanguageBracketTokens(this.textModel.getLanguageId());
                const tokenizer = new tokenizer_1.FastTokenizer(this.textModel.getValue(), brackets);
                this.initialAstWithoutTokens = (0, parser_1.parseDocument)(tokenizer, [], undefined, true);
                this.astWithTokens = this.initialAstWithoutTokens;
            }
            else if (textModel.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
                // Skip the initial ast, as there is no flickering.
                // Directly create the tree with token information.
                this.initialAstWithoutTokens = undefined;
                this.astWithTokens = this.parseDocumentFromTextBuffer([], undefined, false);
            }
            else if (textModel.tokenization.backgroundTokenizationState === 1 /* BackgroundTokenizationState.InProgress */) {
                this.initialAstWithoutTokens = this.parseDocumentFromTextBuffer([], undefined, true);
                this.astWithTokens = this.initialAstWithoutTokens;
            }
        }
        didLanguageChange(languageId) {
            return this.brackets.didLanguageChange(languageId);
        }
        //#region TextModel events
        handleDidChangeBackgroundTokenizationState() {
            if (this.textModel.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
                const wasUndefined = this.initialAstWithoutTokens === undefined;
                // Clear the initial tree as we can use the tree with token information now.
                this.initialAstWithoutTokens = undefined;
                if (!wasUndefined) {
                    this.didChangeEmitter.fire();
                }
            }
        }
        handleDidChangeTokens({ ranges }) {
            const edits = ranges.map(r => new beforeEditPositionMapper_1.TextEditInfo((0, length_1.toLength)(r.fromLineNumber - 1, 0), (0, length_1.toLength)(r.toLineNumber, 0), (0, length_1.toLength)(r.toLineNumber - r.fromLineNumber + 1, 0)));
            this.astWithTokens = this.parseDocumentFromTextBuffer(edits, this.astWithTokens, false);
            if (!this.initialAstWithoutTokens) {
                this.didChangeEmitter.fire();
            }
        }
        handleContentChanged(change) {
            const edits = change.changes.map(c => {
                const range = range_1.Range.lift(c.range);
                return new beforeEditPositionMapper_1.TextEditInfo((0, length_1.positionToLength)(range.getStartPosition()), (0, length_1.positionToLength)(range.getEndPosition()), (0, length_1.lengthOfString)(c.text));
            }).reverse();
            this.astWithTokens = this.parseDocumentFromTextBuffer(edits, this.astWithTokens, false);
            if (this.initialAstWithoutTokens) {
                this.initialAstWithoutTokens = this.parseDocumentFromTextBuffer(edits, this.initialAstWithoutTokens, false);
            }
        }
        //#endregion
        /**
         * @pure (only if isPure = true)
        */
        parseDocumentFromTextBuffer(edits, previousAst, immutable) {
            // Is much faster if `isPure = false`.
            const isPure = false;
            const previousAstClone = isPure ? previousAst === null || previousAst === void 0 ? void 0 : previousAst.deepClone() : previousAst;
            const tokenizer = new tokenizer_1.TextBufferTokenizer(this.textModel, this.brackets);
            const result = (0, parser_1.parseDocument)(tokenizer, edits, previousAstClone, immutable);
            return result;
        }
        getBracketsInRange(range) {
            const startOffset = (0, length_1.toLength)(range.startLineNumber - 1, range.startColumn - 1);
            const endOffset = (0, length_1.toLength)(range.endLineNumber - 1, range.endColumn - 1);
            const result = new Array();
            const node = this.initialAstWithoutTokens || this.astWithTokens;
            collectBrackets(node, length_1.lengthZero, node.length, startOffset, endOffset, result, 0, new Map());
            return result;
        }
        getBracketPairsInRange(range, includeMinIndentation) {
            const result = new Array();
            const startLength = (0, length_1.positionToLength)(range.getStartPosition());
            const endLength = (0, length_1.positionToLength)(range.getEndPosition());
            const node = this.initialAstWithoutTokens || this.astWithTokens;
            const context = new CollectBracketPairsContext(result, includeMinIndentation, this.textModel);
            collectBracketPairs(node, length_1.lengthZero, node.length, startLength, endLength, context, 0, new Map());
            return result;
        }
        getFirstBracketAfter(position) {
            const node = this.initialAstWithoutTokens || this.astWithTokens;
            return getFirstBracketAfter(node, length_1.lengthZero, node.length, (0, length_1.positionToLength)(position));
        }
        getFirstBracketBefore(position) {
            const node = this.initialAstWithoutTokens || this.astWithTokens;
            return getFirstBracketBefore(node, length_1.lengthZero, node.length, (0, length_1.positionToLength)(position));
        }
    }
    exports.BracketPairsTree = BracketPairsTree;
    function getFirstBracketBefore(node, nodeOffsetStart, nodeOffsetEnd, position) {
        if (node.kind === 4 /* AstNodeKind.List */ || node.kind === 2 /* AstNodeKind.Pair */) {
            const lengths = [];
            for (const child of node.children) {
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                lengths.push({ nodeOffsetStart, nodeOffsetEnd });
                nodeOffsetStart = nodeOffsetEnd;
            }
            for (let i = lengths.length - 1; i >= 0; i--) {
                const { nodeOffsetStart, nodeOffsetEnd } = lengths[i];
                if ((0, length_1.lengthLessThan)(nodeOffsetStart, position)) {
                    const result = getFirstBracketBefore(node.children[i], nodeOffsetStart, nodeOffsetEnd, position);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        }
        else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
            return null;
        }
        else if (node.kind === 1 /* AstNodeKind.Bracket */) {
            const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
            return {
                bracketInfo: node.bracketInfo,
                range
            };
        }
        return null;
    }
    function getFirstBracketAfter(node, nodeOffsetStart, nodeOffsetEnd, position) {
        if (node.kind === 4 /* AstNodeKind.List */ || node.kind === 2 /* AstNodeKind.Pair */) {
            for (const child of node.children) {
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThan)(position, nodeOffsetEnd)) {
                    const result = getFirstBracketAfter(child, nodeOffsetStart, nodeOffsetEnd, position);
                    if (result) {
                        return result;
                    }
                }
                nodeOffsetStart = nodeOffsetEnd;
            }
            return null;
        }
        else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
            return null;
        }
        else if (node.kind === 1 /* AstNodeKind.Bracket */) {
            const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
            return {
                bracketInfo: node.bracketInfo,
                range
            };
        }
        return null;
    }
    function collectBrackets(node, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, result, level, levelPerBracketType) {
        if (node.kind === 4 /* AstNodeKind.List */) {
            for (const child of node.children) {
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                    (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                    collectBrackets(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, result, level, levelPerBracketType);
                }
                nodeOffsetStart = nodeOffsetEnd;
            }
        }
        else if (node.kind === 2 /* AstNodeKind.Pair */) {
            let levelPerBracket = 0;
            if (levelPerBracketType) {
                let existing = levelPerBracketType.get(node.openingBracket.text);
                if (existing === undefined) {
                    existing = 0;
                }
                levelPerBracket = existing;
                existing++;
                levelPerBracketType.set(node.openingBracket.text, existing);
            }
            // Don't use node.children here to improve performance
            {
                const child = node.openingBracket;
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                    (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                    const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
                    result.push(new textModelBracketPairs_1.BracketInfo(range, level, levelPerBracket, !node.closingBracket));
                }
                nodeOffsetStart = nodeOffsetEnd;
            }
            if (node.child) {
                const child = node.child;
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                    (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                    collectBrackets(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, result, level + 1, levelPerBracketType);
                }
                nodeOffsetStart = nodeOffsetEnd;
            }
            if (node.closingBracket) {
                const child = node.closingBracket;
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                    (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                    const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
                    result.push(new textModelBracketPairs_1.BracketInfo(range, level, levelPerBracket, false));
                }
                nodeOffsetStart = nodeOffsetEnd;
            }
            if (levelPerBracketType) {
                levelPerBracketType.set(node.openingBracket.text, levelPerBracket);
            }
        }
        else if (node.kind === 3 /* AstNodeKind.UnexpectedClosingBracket */) {
            const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
            result.push(new textModelBracketPairs_1.BracketInfo(range, level - 1, 0, true));
        }
        else if (node.kind === 1 /* AstNodeKind.Bracket */) {
            const range = (0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd);
            result.push(new textModelBracketPairs_1.BracketInfo(range, level - 1, 0, false));
        }
    }
    class CollectBracketPairsContext {
        constructor(result, includeMinIndentation, textModel) {
            this.result = result;
            this.includeMinIndentation = includeMinIndentation;
            this.textModel = textModel;
        }
    }
    function collectBracketPairs(node, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, context, level, levelPerBracketType) {
        var _a;
        if (node.kind === 2 /* AstNodeKind.Pair */) {
            let levelPerBracket = 0;
            if (levelPerBracketType) {
                let existing = levelPerBracketType.get(node.openingBracket.text);
                if (existing === undefined) {
                    existing = 0;
                }
                levelPerBracket = existing;
                existing++;
                levelPerBracketType.set(node.openingBracket.text, existing);
            }
            const openingBracketEnd = (0, length_1.lengthAdd)(nodeOffsetStart, node.openingBracket.length);
            let minIndentation = -1;
            if (context.includeMinIndentation) {
                minIndentation = node.computeMinIndentation(nodeOffsetStart, context.textModel);
            }
            context.result.push(new textModelBracketPairs_1.BracketPairWithMinIndentationInfo((0, length_1.lengthsToRange)(nodeOffsetStart, nodeOffsetEnd), (0, length_1.lengthsToRange)(nodeOffsetStart, openingBracketEnd), node.closingBracket
                ? (0, length_1.lengthsToRange)((0, length_1.lengthAdd)(openingBracketEnd, ((_a = node.child) === null || _a === void 0 ? void 0 : _a.length) || length_1.lengthZero), nodeOffsetEnd)
                : undefined, level, levelPerBracket, node, minIndentation));
            nodeOffsetStart = openingBracketEnd;
            if (node.child) {
                const child = node.child;
                nodeOffsetEnd = (0, length_1.lengthAdd)(nodeOffsetStart, child.length);
                if ((0, length_1.lengthLessThanEqual)(nodeOffsetStart, endOffset) &&
                    (0, length_1.lengthGreaterThanEqual)(nodeOffsetEnd, startOffset)) {
                    collectBracketPairs(child, nodeOffsetStart, nodeOffsetEnd, startOffset, endOffset, context, level + 1, levelPerBracketType);
                }
            }
            if (levelPerBracketType) {
                levelPerBracketType.set(node.openingBracket.text, levelPerBracket);
            }
        }
        else {
            let curOffset = nodeOffsetStart;
            for (const child of node.children) {
                const childOffset = curOffset;
                curOffset = (0, length_1.lengthAdd)(curOffset, child.length);
                if ((0, length_1.lengthLessThanEqual)(childOffset, endOffset) &&
                    (0, length_1.lengthLessThanEqual)(startOffset, curOffset)) {
                    collectBracketPairs(child, childOffset, curOffset, startOffset, endOffset, context, level, levelPerBracketType);
                }
            }
        }
    }
});
//# sourceMappingURL=bracketPairsTree.js.map