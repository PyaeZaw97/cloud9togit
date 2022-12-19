/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/filters", "vs/base/common/glob", "vs/base/common/strings", "vs/base/common/resources", "vs/base/common/map"], function (require, exports, filters_1, glob_1, strings, resources_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterOptions = exports.ResourceGlobMatcher = void 0;
    class ResourceGlobMatcher {
        constructor(globalExpression, rootExpressions, uriIdentityService) {
            this.globalExpression = (0, glob_1.parse)(globalExpression);
            this.expressionsByRoot = map_1.TernarySearchTree.forUris(uri => uriIdentityService.extUri.ignorePathCasing(uri));
            for (const expression of rootExpressions) {
                this.expressionsByRoot.set(expression.root, { root: expression.root, expression: (0, glob_1.parse)(expression.expression) });
            }
        }
        matches(resource) {
            const rootExpression = this.expressionsByRoot.findSubstr(resource);
            if (rootExpression) {
                const path = (0, resources_1.relativePath)(rootExpression.root, resource);
                if (path && !!rootExpression.expression(path)) {
                    return true;
                }
            }
            return !!this.globalExpression(resource.path);
        }
    }
    exports.ResourceGlobMatcher = ResourceGlobMatcher;
    class FilterOptions {
        constructor(filter, filesExclude, showWarnings, showErrors, showInfos, uriIdentityService) {
            this.filter = filter;
            this.showWarnings = false;
            this.showErrors = false;
            this.showInfos = false;
            filter = filter.trim();
            this.showWarnings = showWarnings;
            this.showErrors = showErrors;
            this.showInfos = showInfos;
            const filesExcludeByRoot = Array.isArray(filesExclude) ? filesExclude : [];
            const excludesExpression = Array.isArray(filesExclude) ? (0, glob_1.getEmptyExpression)() : filesExclude;
            for (const { expression } of filesExcludeByRoot) {
                for (const pattern of Object.keys(expression)) {
                    if (!pattern.endsWith('/**')) {
                        // Append `/**` to pattern to match a parent folder #103631
                        expression[`${strings.rtrim(pattern, '/')}/**`] = expression[pattern];
                    }
                }
            }
            const negate = filter.startsWith('!');
            this.textFilter = { text: (negate ? strings.ltrim(filter, '!') : filter).trim(), negate };
            const includeExpression = (0, glob_1.getEmptyExpression)();
            if (filter) {
                const filters = (0, glob_1.splitGlobAware)(filter, ',').map(s => s.trim()).filter(s => !!s.length);
                for (const f of filters) {
                    if (f.startsWith('!')) {
                        const filterText = strings.ltrim(f, '!');
                        if (filterText) {
                            this.setPattern(excludesExpression, filterText);
                        }
                    }
                    else {
                        this.setPattern(includeExpression, f);
                    }
                }
            }
            this.excludesMatcher = new ResourceGlobMatcher(excludesExpression, filesExcludeByRoot, uriIdentityService);
            this.includesMatcher = new ResourceGlobMatcher(includeExpression, [], uriIdentityService);
        }
        static EMPTY(uriIdentityService) { return new FilterOptions('', [], false, false, false, uriIdentityService); }
        setPattern(expression, pattern) {
            if (pattern[0] === '.') {
                pattern = '*' + pattern; // convert ".js" to "*.js"
            }
            expression[`**/${pattern}/**`] = true;
            expression[`**/${pattern}`] = true;
        }
    }
    exports.FilterOptions = FilterOptions;
    FilterOptions._filter = filters_1.matchesFuzzy2;
    FilterOptions._messageFilter = filters_1.matchesFuzzy;
});
//# sourceMappingURL=markersFilterOptions.js.map