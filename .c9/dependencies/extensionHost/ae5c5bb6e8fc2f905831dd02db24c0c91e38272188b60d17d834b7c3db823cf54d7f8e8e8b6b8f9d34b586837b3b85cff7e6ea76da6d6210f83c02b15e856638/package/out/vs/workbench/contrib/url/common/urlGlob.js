/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testUrlMatchesGlob = void 0;
    const testUrlMatchesGlob = (url, globUrl) => {
        var _a;
        const normalize = (url) => url.replace(/\/+$/, '');
        globUrl = normalize(globUrl);
        url = normalize(url);
        const memo = Array.from({ length: url.length + 1 }).map(() => Array.from({ length: globUrl.length + 1 }).map(() => undefined));
        if (/^[^./:]*:\/\//.test(globUrl)) {
            return doUrlMatch(memo, url, globUrl, 0, 0);
        }
        const scheme = (_a = /^(https?):\/\//.exec(url)) === null || _a === void 0 ? void 0 : _a[1];
        if (scheme) {
            return doUrlMatch(memo, url, `${scheme}://${globUrl}`, 0, 0);
        }
        return false;
    };
    exports.testUrlMatchesGlob = testUrlMatchesGlob;
    const doUrlMatch = (memo, url, globUrl, urlOffset, globUrlOffset) => {
        var _a;
        if (((_a = memo[urlOffset]) === null || _a === void 0 ? void 0 : _a[globUrlOffset]) !== undefined) {
            return memo[urlOffset][globUrlOffset];
        }
        const options = [];
        // Endgame.
        // Fully exact match
        if (urlOffset === url.length) {
            return globUrlOffset === globUrl.length;
        }
        // Some path remaining in url
        if (globUrlOffset === globUrl.length) {
            const remaining = url.slice(urlOffset);
            return remaining[0] === '/';
        }
        if (url[urlOffset] === globUrl[globUrlOffset]) {
            // Exact match.
            options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset + 1));
        }
        if (globUrl[globUrlOffset] + globUrl[globUrlOffset + 1] === '*.') {
            // Any subdomain match. Either consume one thing that's not a / or : and don't advance base or consume nothing and do.
            if (!['/', ':'].includes(url[urlOffset])) {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset));
            }
            options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 2));
        }
        if (globUrl[globUrlOffset] === '*') {
            // Any match. Either consume one thing and don't advance base or consume nothing and do.
            if (urlOffset + 1 === url.length) {
                // If we're at the end of the input url consume one from both.
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset + 1));
            }
            else {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset + 1, globUrlOffset));
            }
            options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 1));
        }
        if (globUrl[globUrlOffset] + globUrl[globUrlOffset + 1] === ':*') {
            // any port match. Consume a port if it exists otherwise nothing. Always comsume the base.
            if (url[urlOffset] === ':') {
                let endPortIndex = urlOffset + 1;
                do {
                    endPortIndex++;
                } while (/[0-9]/.test(url[endPortIndex]));
                options.push(doUrlMatch(memo, url, globUrl, endPortIndex, globUrlOffset + 2));
            }
            else {
                options.push(doUrlMatch(memo, url, globUrl, urlOffset, globUrlOffset + 2));
            }
        }
        return (memo[urlOffset][globUrlOffset] = options.some(a => a === true));
    };
});
//# sourceMappingURL=urlGlob.js.map