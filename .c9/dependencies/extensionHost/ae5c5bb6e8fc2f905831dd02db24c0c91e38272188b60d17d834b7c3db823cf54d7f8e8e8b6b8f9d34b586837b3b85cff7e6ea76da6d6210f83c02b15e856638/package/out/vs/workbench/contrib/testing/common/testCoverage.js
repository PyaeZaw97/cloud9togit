/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/uri"], function (require, exports, cancellation_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileCoverage = exports.TestCoverage = void 0;
    /**
     * Class that exposese coverage information for a run.
     */
    class TestCoverage {
        constructor(accessor) {
            this.accessor = accessor;
        }
        /**
         * Gets coverage information for all files.
         */
        async getAllFiles(token = cancellation_1.CancellationToken.None) {
            if (!this.fileCoverage) {
                this.fileCoverage = this.accessor.provideFileCoverage(token);
            }
            try {
                return await this.fileCoverage;
            }
            catch (e) {
                this.fileCoverage = undefined;
                throw e;
            }
        }
        /**
         * Gets coverage information for a specific file.
         */
        async getUri(uri, token = cancellation_1.CancellationToken.None) {
            const files = await this.getAllFiles(token);
            return files.find(f => f.uri.toString() === uri.toString());
        }
    }
    exports.TestCoverage = TestCoverage;
    class FileCoverage {
        constructor(coverage, index, accessor) {
            this.index = index;
            this.accessor = accessor;
            this.uri = uri_1.URI.revive(coverage.uri);
            this.statement = coverage.statement;
            this.branch = coverage.branch;
            this.function = coverage.branch;
            this._details = coverage.details;
        }
        /** Gets the total coverage percent based on information provided. */
        get tpc() {
            let numerator = this.statement.covered;
            let denominator = this.statement.total;
            if (this.branch) {
                numerator += this.branch.covered;
                denominator += this.branch.total;
            }
            if (this.function) {
                numerator += this.function.covered;
                denominator += this.function.total;
            }
            return denominator === 0 ? 1 : numerator / denominator;
        }
        /**
         * Gets per-line coverage details.
         */
        async details(token = cancellation_1.CancellationToken.None) {
            if (!this._details) {
                this._details = this.accessor.resolveFileCoverage(this.index, token);
            }
            try {
                return await this._details;
            }
            catch (e) {
                this._details = undefined;
                throw e;
            }
        }
    }
    exports.FileCoverage = FileCoverage;
});
//# sourceMappingURL=testCoverage.js.map