/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/base/common/buffer", "vs/base/common/types"], function (require, exports, files_1, instantiation_1, buffer_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toBufferOrReadable = exports.stringToSnapshot = exports.snapshotToString = exports.isTextFileEditorModel = exports.EncodingMode = exports.TextFileResolveReason = exports.TextFileEditorModelState = exports.TextFileOperationError = exports.TextFileOperationResult = exports.ITextFileService = void 0;
    exports.ITextFileService = (0, instantiation_1.createDecorator)('textFileService');
    var TextFileOperationResult;
    (function (TextFileOperationResult) {
        TextFileOperationResult[TextFileOperationResult["FILE_IS_BINARY"] = 0] = "FILE_IS_BINARY";
    })(TextFileOperationResult = exports.TextFileOperationResult || (exports.TextFileOperationResult = {}));
    class TextFileOperationError extends files_1.FileOperationError {
        constructor(message, textFileOperationResult, options) {
            super(message, 11 /* FileOperationResult.FILE_OTHER_ERROR */);
            this.textFileOperationResult = textFileOperationResult;
            this.options = options;
        }
        static isTextFileOperationError(obj) {
            return obj instanceof Error && !(0, types_1.isUndefinedOrNull)(obj.textFileOperationResult);
        }
    }
    exports.TextFileOperationError = TextFileOperationError;
    /**
     * States the text file editor model can be in.
     */
    var TextFileEditorModelState;
    (function (TextFileEditorModelState) {
        /**
         * A model is saved.
         */
        TextFileEditorModelState[TextFileEditorModelState["SAVED"] = 0] = "SAVED";
        /**
         * A model is dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["DIRTY"] = 1] = "DIRTY";
        /**
         * A model is currently being saved but this operation has not completed yet.
         */
        TextFileEditorModelState[TextFileEditorModelState["PENDING_SAVE"] = 2] = "PENDING_SAVE";
        /**
         * A model is in conflict mode when changes cannot be saved because the
         * underlying file has changed. Models in conflict mode are always dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["CONFLICT"] = 3] = "CONFLICT";
        /**
         * A model is in orphan state when the underlying file has been deleted.
         */
        TextFileEditorModelState[TextFileEditorModelState["ORPHAN"] = 4] = "ORPHAN";
        /**
         * Any error that happens during a save that is not causing the CONFLICT state.
         * Models in error mode are always dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["ERROR"] = 5] = "ERROR";
    })(TextFileEditorModelState = exports.TextFileEditorModelState || (exports.TextFileEditorModelState = {}));
    var TextFileResolveReason;
    (function (TextFileResolveReason) {
        TextFileResolveReason[TextFileResolveReason["EDITOR"] = 1] = "EDITOR";
        TextFileResolveReason[TextFileResolveReason["REFERENCE"] = 2] = "REFERENCE";
        TextFileResolveReason[TextFileResolveReason["OTHER"] = 3] = "OTHER";
    })(TextFileResolveReason = exports.TextFileResolveReason || (exports.TextFileResolveReason = {}));
    var EncodingMode;
    (function (EncodingMode) {
        /**
         * Instructs the encoding support to encode the object with the provided encoding
         */
        EncodingMode[EncodingMode["Encode"] = 0] = "Encode";
        /**
         * Instructs the encoding support to decode the object with the provided encoding
         */
        EncodingMode[EncodingMode["Decode"] = 1] = "Decode";
    })(EncodingMode = exports.EncodingMode || (exports.EncodingMode = {}));
    function isTextFileEditorModel(model) {
        const candidate = model;
        return (0, types_1.areFunctions)(candidate.setEncoding, candidate.getEncoding, candidate.save, candidate.revert, candidate.isDirty, candidate.getLanguageId);
    }
    exports.isTextFileEditorModel = isTextFileEditorModel;
    function snapshotToString(snapshot) {
        const chunks = [];
        let chunk;
        while (typeof (chunk = snapshot.read()) === 'string') {
            chunks.push(chunk);
        }
        return chunks.join('');
    }
    exports.snapshotToString = snapshotToString;
    function stringToSnapshot(value) {
        let done = false;
        return {
            read() {
                if (!done) {
                    done = true;
                    return value;
                }
                return null;
            }
        };
    }
    exports.stringToSnapshot = stringToSnapshot;
    function toBufferOrReadable(value) {
        if (typeof value === 'undefined') {
            return undefined;
        }
        if (typeof value === 'string') {
            return buffer_1.VSBuffer.fromString(value);
        }
        return {
            read: () => {
                const chunk = value.read();
                if (typeof chunk === 'string') {
                    return buffer_1.VSBuffer.fromString(chunk);
                }
                return null;
            }
        };
    }
    exports.toBufferOrReadable = toBufferOrReadable;
});
//# sourceMappingURL=textfiles.js.map