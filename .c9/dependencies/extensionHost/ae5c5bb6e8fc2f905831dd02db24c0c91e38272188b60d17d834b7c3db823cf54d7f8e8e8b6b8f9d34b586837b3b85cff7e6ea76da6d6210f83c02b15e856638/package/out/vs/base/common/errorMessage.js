/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/types", "vs/nls"], function (require, exports, arrays, types, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createErrorWithActions = exports.isErrorWithActions = exports.toErrorMessage = void 0;
    function exceptionToErrorMessage(exception, verbose) {
        if (verbose && (exception.stack || exception.stacktrace)) {
            return nls.localize('stackTrace.format', "{0}: {1}", detectSystemErrorMessage(exception), stackToString(exception.stack) || stackToString(exception.stacktrace));
        }
        return detectSystemErrorMessage(exception);
    }
    function stackToString(stack) {
        if (Array.isArray(stack)) {
            return stack.join('\n');
        }
        return stack;
    }
    function detectSystemErrorMessage(exception) {
        // See https://nodejs.org/api/errors.html#errors_class_system_error
        if (typeof exception.code === 'string' && typeof exception.errno === 'number' && typeof exception.syscall === 'string') {
            return nls.localize('nodeExceptionMessage', "A system error occurred ({0})", exception.message);
        }
        return exception.message || nls.localize('error.defaultMessage', "An unknown error occurred. Please consult the log for more details.");
    }
    /**
     * Tries to generate a human readable error message out of the error. If the verbose parameter
     * is set to true, the error message will include stacktrace details if provided.
     *
     * @returns A string containing the error message.
     */
    function toErrorMessage(error = null, verbose = false) {
        if (!error) {
            return nls.localize('error.defaultMessage', "An unknown error occurred. Please consult the log for more details.");
        }
        if (Array.isArray(error)) {
            const errors = arrays.coalesce(error);
            const msg = toErrorMessage(errors[0], verbose);
            if (errors.length > 1) {
                return nls.localize('error.moreErrors', "{0} ({1} errors in total)", msg, errors.length);
            }
            return msg;
        }
        if (types.isString(error)) {
            return error;
        }
        if (error.detail) {
            const detail = error.detail;
            if (detail.error) {
                return exceptionToErrorMessage(detail.error, verbose);
            }
            if (detail.exception) {
                return exceptionToErrorMessage(detail.exception, verbose);
            }
        }
        if (error.stack) {
            return exceptionToErrorMessage(error, verbose);
        }
        if (error.message) {
            return error.message;
        }
        return nls.localize('error.defaultMessage', "An unknown error occurred. Please consult the log for more details.");
    }
    exports.toErrorMessage = toErrorMessage;
    function isErrorWithActions(obj) {
        const candidate = obj;
        return candidate instanceof Error && Array.isArray(candidate.actions);
    }
    exports.isErrorWithActions = isErrorWithActions;
    function createErrorWithActions(messageOrError, actions) {
        let error;
        if (typeof messageOrError === 'string') {
            error = new Error(messageOrError);
        }
        else {
            error = messageOrError;
        }
        error.actions = actions;
        return error;
    }
    exports.createErrorWithActions = createErrorWithActions;
});
//# sourceMappingURL=errorMessage.js.map