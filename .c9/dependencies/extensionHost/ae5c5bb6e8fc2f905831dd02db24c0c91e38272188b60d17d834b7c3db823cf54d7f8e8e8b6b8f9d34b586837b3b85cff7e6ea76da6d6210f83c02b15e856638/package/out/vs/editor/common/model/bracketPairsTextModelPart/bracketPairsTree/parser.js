/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./ast", "./beforeEditPositionMapper", "./smallImmutableSet", "./length", "./concat23Trees", "./nodeReader"], function (require, exports, ast_1, beforeEditPositionMapper_1, smallImmutableSet_1, length_1, concat23Trees_1, nodeReader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseDocument = void 0;
    /**
     * Non incrementally built ASTs are immutable.
    */
    function parseDocument(tokenizer, edits, oldNode, createImmutableLists) {
        const parser = new Parser(tokenizer, edits, oldNode, createImmutableLists);
        return parser.parseDocument();
    }
    exports.parseDocument = parseDocument;
    /**
     * Non incrementally built ASTs are immutable.
    */
    class Parser {
        constructor(tokenizer, edits, oldNode, createImmutableLists) {
            this.tokenizer = tokenizer;
            this.createImmutableLists = createImmutableLists;
            this._itemsConstructed = 0;
            this._itemsFromCache = 0;
            if (oldNode && createImmutableLists) {
                throw new Error('Not supported');
            }
            this.oldNodeReader = oldNode ? new nodeReader_1.NodeReader(oldNode) : undefined;
            this.positionMapper = new beforeEditPositionMapper_1.BeforeEditPositionMapper(edits, tokenizer.length);
        }
        /**
         * Reports how many nodes were constructed in the last parse operation.
        */
        get nodesConstructed() {
            return this._itemsConstructed;
        }
        /**
         * Reports how many nodes were reused in the last parse operation.
        */
        get nodesReused() {
            return this._itemsFromCache;
        }
        parseDocument() {
            this._itemsConstructed = 0;
            this._itemsFromCache = 0;
            let result = this.parseList(smallImmutableSet_1.SmallImmutableSet.getEmpty());
            if (!result) {
                result = ast_1.ListAstNode.getEmpty();
            }
            return result;
        }
        parseList(openedBracketIds) {
            const items = new Array();
            while (true) {
                const token = this.tokenizer.peek();
                if (!token ||
                    (token.kind === 2 /* TokenKind.ClosingBracket */ &&
                        token.bracketIds.intersects(openedBracketIds))) {
                    break;
                }
                const child = this.parseChild(openedBracketIds);
                if (child.kind === 4 /* AstNodeKind.List */ && child.childrenLength === 0) {
                    continue;
                }
                items.push(child);
            }
            // When there is no oldNodeReader, all items are created from scratch and must have the same height.
            const result = this.oldNodeReader ? (0, concat23Trees_1.concat23Trees)(items) : (0, concat23Trees_1.concat23TreesOfSameHeight)(items, this.createImmutableLists);
            return result;
        }
        parseChild(openedBracketIds) {
            if (this.oldNodeReader) {
                const maxCacheableLength = this.positionMapper.getDistanceToNextChange(this.tokenizer.offset);
                if (!(0, length_1.lengthIsZero)(maxCacheableLength)) {
                    const cachedNode = this.oldNodeReader.readLongestNodeAt(this.positionMapper.getOffsetBeforeChange(this.tokenizer.offset), curNode => {
                        if (!(0, length_1.lengthLessThan)(curNode.length, maxCacheableLength)) {
                            // Either the node contains edited text or touches edited text.
                            // In the latter case, brackets might have been extended (`end` -> `ending`), so even touching nodes cannot be reused.
                            return false;
                        }
                        const canBeReused = curNode.canBeReused(openedBracketIds);
                        return canBeReused;
                    });
                    if (cachedNode) {
                        this._itemsFromCache++;
                        this.tokenizer.skip(cachedNode.length);
                        return cachedNode;
                    }
                }
            }
            this._itemsConstructed++;
            const token = this.tokenizer.read();
            switch (token.kind) {
                case 2 /* TokenKind.ClosingBracket */:
                    return new ast_1.InvalidBracketAstNode(token.bracketIds, token.length);
                case 0 /* TokenKind.Text */:
                    return token.astNode;
                case 1 /* TokenKind.OpeningBracket */: {
                    const set = openedBracketIds.merge(token.bracketIds);
                    const child = this.parseList(set);
                    const nextToken = this.tokenizer.peek();
                    if (nextToken &&
                        nextToken.kind === 2 /* TokenKind.ClosingBracket */ &&
                        (nextToken.bracketId === token.bracketId || nextToken.bracketIds.intersects(token.bracketIds))) {
                        this.tokenizer.read();
                        return ast_1.PairAstNode.create(token.astNode, child, nextToken.astNode);
                    }
                    else {
                        return ast_1.PairAstNode.create(token.astNode, child, null);
                    }
                }
                default:
                    throw new Error('unexpected');
            }
        }
    }
});
//# sourceMappingURL=parser.js.map