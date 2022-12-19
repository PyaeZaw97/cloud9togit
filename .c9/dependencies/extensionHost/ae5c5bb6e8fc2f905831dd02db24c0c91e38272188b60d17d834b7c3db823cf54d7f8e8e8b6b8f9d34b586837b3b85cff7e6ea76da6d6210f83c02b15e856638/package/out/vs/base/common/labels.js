/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/uri"], function (require, exports, arrays_1, extpath_1, network_1, path_1, platform_1, resources_1, strings_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.splitName = exports.unmnemonicLabel = exports.mnemonicButtonLabel = exports.mnemonicMenuLabel = exports.template = exports.shorten = exports.untildify = exports.tildify = exports.normalizeDriveLetter = exports.getBaseLabel = exports.getPathLabel = void 0;
    function getPathLabel(resource, formatting) {
        const { os, tildify: tildifier, relative: relatifier } = formatting;
        // return early with a relative path if we can resolve one
        if (relatifier) {
            const relativePath = getRelativePathLabel(resource, relatifier, os);
            if (typeof relativePath === 'string') {
                return relativePath;
            }
        }
        // otherwise try to resolve a absolute path label and
        // apply target OS standard path separators if target
        // OS differs from actual OS we are running in
        let absolutePath = resource.fsPath;
        if (os === 1 /* OperatingSystem.Windows */ && !platform_1.isWindows) {
            absolutePath = absolutePath.replace(/\//g, '\\');
        }
        else if (os !== 1 /* OperatingSystem.Windows */ && platform_1.isWindows) {
            absolutePath = absolutePath.replace(/\\/g, '/');
        }
        // macOS/Linux: tildify with provided user home directory
        if (os !== 1 /* OperatingSystem.Windows */ && (tildifier === null || tildifier === void 0 ? void 0 : tildifier.userHome)) {
            let userHome = tildifier.userHome.fsPath;
            // This is a bit of a hack, but in order to figure out if the
            // resource is in the user home, we need to make sure to convert it
            // to a user home resource. We cannot assume that the resource is
            // already a user home resource.
            let userHomeCandidate;
            if (resource.scheme !== tildifier.userHome.scheme && resource.path.startsWith(path_1.posix.sep)) {
                userHomeCandidate = tildifier.userHome.with({ path: resource.path }).fsPath;
            }
            else {
                userHomeCandidate = resource.fsPath;
            }
            // In addition, if we are on windows platform, we need to make
            // sure to convert to POSIX path, because `tildify` only works
            // with POSIX paths.
            if (platform_1.isWindows) {
                userHomeCandidate = (0, extpath_1.toSlashes)(userHomeCandidate);
                userHome = (0, extpath_1.toSlashes)(userHome);
            }
            absolutePath = tildify(userHomeCandidate, userHome, os);
        }
        // normalize
        const pathLib = os === 1 /* OperatingSystem.Windows */ ? path_1.win32 : path_1.posix;
        return pathLib.normalize(normalizeDriveLetter(absolutePath, os === 1 /* OperatingSystem.Windows */));
    }
    exports.getPathLabel = getPathLabel;
    function getRelativePathLabel(resource, relativePathProvider, os) {
        var _a;
        const pathLib = os === 1 /* OperatingSystem.Windows */ ? path_1.win32 : path_1.posix;
        const extUriLib = os === 3 /* OperatingSystem.Linux */ ? resources_1.extUri : resources_1.extUriIgnorePathCase;
        const workspace = relativePathProvider.getWorkspace();
        const firstFolder = (0, arrays_1.firstOrDefault)(workspace.folders);
        if (!firstFolder) {
            return undefined;
        }
        // This is a bit of a hack, but in order to figure out the folder
        // the resource belongs to, we need to make sure to convert it
        // to a workspace resource. We cannot assume that the resource is
        // already matching the workspace.
        if (resource.scheme !== firstFolder.uri.scheme && resource.path.startsWith(path_1.posix.sep)) {
            resource = firstFolder.uri.with({ path: resource.path });
        }
        const folder = relativePathProvider.getWorkspaceFolder(resource);
        if (!folder) {
            return undefined;
        }
        let relativePathLabel = undefined;
        if (extUriLib.isEqual(folder.uri, resource)) {
            relativePathLabel = ''; // no label if paths are identical
        }
        else {
            relativePathLabel = (_a = extUriLib.relativePath(folder.uri, resource)) !== null && _a !== void 0 ? _a : '';
        }
        // normalize
        if (relativePathLabel) {
            relativePathLabel = pathLib.normalize(relativePathLabel);
        }
        // always show root basename if there are multiple
        if (workspace.folders.length > 1 && !relativePathProvider.noPrefix) {
            const rootName = folder.name ? folder.name : extUriLib.basenameOrAuthority(folder.uri);
            relativePathLabel = relativePathLabel ? `${rootName} • ${relativePathLabel}` : rootName;
        }
        return relativePathLabel;
    }
    function getBaseLabel(resource) {
        if (!resource) {
            return undefined;
        }
        if (typeof resource === 'string') {
            resource = uri_1.URI.file(resource);
        }
        const base = (0, resources_1.basename)(resource) || (resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path) /* can be empty string if '/' is passed in */;
        // convert c: => C:
        if (platform_1.isWindows && (0, extpath_1.isRootOrDriveLetter)(base)) {
            return normalizeDriveLetter(base);
        }
        return base;
    }
    exports.getBaseLabel = getBaseLabel;
    function normalizeDriveLetter(path, isWindowsOS = platform_1.isWindows) {
        if ((0, extpath_1.hasDriveLetter)(path, isWindowsOS)) {
            return path.charAt(0).toUpperCase() + path.slice(1);
        }
        return path;
    }
    exports.normalizeDriveLetter = normalizeDriveLetter;
    let normalizedUserHomeCached = Object.create(null);
    function tildify(path, userHome, os = platform_1.OS) {
        if (os === 1 /* OperatingSystem.Windows */ || !path || !userHome) {
            return path; // unsupported
        }
        // Keep a normalized user home path as cache to prevent accumulated string creation
        let normalizedUserHome = normalizedUserHomeCached.original === userHome ? normalizedUserHomeCached.normalized : undefined;
        if (!normalizedUserHome) {
            normalizedUserHome = `${(0, strings_1.rtrim)(userHome, path_1.posix.sep)}${path_1.posix.sep}`;
            normalizedUserHomeCached = { original: userHome, normalized: normalizedUserHome };
        }
        // Linux: case sensitive, macOS: case insensitive
        if (os === 3 /* OperatingSystem.Linux */ ? path.startsWith(normalizedUserHome) : (0, strings_1.startsWithIgnoreCase)(path, normalizedUserHome)) {
            path = `~/${path.substr(normalizedUserHome.length)}`;
        }
        return path;
    }
    exports.tildify = tildify;
    function untildify(path, userHome) {
        return path.replace(/^~($|\/|\\)/, `${userHome}$1`);
    }
    exports.untildify = untildify;
    /**
     * Shortens the paths but keeps them easy to distinguish.
     * Replaces not important parts with ellipsis.
     * Every shorten path matches only one original path and vice versa.
     *
     * Algorithm for shortening paths is as follows:
     * 1. For every path in list, find unique substring of that path.
     * 2. Unique substring along with ellipsis is shortened path of that path.
     * 3. To find unique substring of path, consider every segment of length from 1 to path.length of path from end of string
     *    and if present segment is not substring to any other paths then present segment is unique path,
     *    else check if it is not present as suffix of any other path and present segment is suffix of path itself,
     *    if it is true take present segment as unique path.
     * 4. Apply ellipsis to unique segment according to whether segment is present at start/in-between/end of path.
     *
     * Example 1
     * 1. consider 2 paths i.e. ['a\\b\\c\\d', 'a\\f\\b\\c\\d']
     * 2. find unique path of first path,
     * 	a. 'd' is present in path2 and is suffix of path2, hence not unique of present path.
     * 	b. 'c' is present in path2 and 'c' is not suffix of present path, similarly for 'b' and 'a' also.
     * 	c. 'd\\c' is suffix of path2.
     *  d. 'b\\c' is not suffix of present path.
     *  e. 'a\\b' is not present in path2, hence unique path is 'a\\b...'.
     * 3. for path2, 'f' is not present in path1 hence unique is '...\\f\\...'.
     *
     * Example 2
     * 1. consider 2 paths i.e. ['a\\b', 'a\\b\\c'].
     * 	a. Even if 'b' is present in path2, as 'b' is suffix of path1 and is not suffix of path2, unique path will be '...\\b'.
     * 2. for path2, 'c' is not present in path1 hence unique path is '..\\c'.
     */
    const ellipsis = '\u2026';
    const unc = '\\\\';
    const home = '~';
    function shorten(paths, pathSeparator = path_1.sep) {
        const shortenedPaths = new Array(paths.length);
        // for every path
        let match = false;
        for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
            let path = paths[pathIndex];
            if (path === '') {
                shortenedPaths[pathIndex] = `.${pathSeparator}`;
                continue;
            }
            if (!path) {
                shortenedPaths[pathIndex] = path;
                continue;
            }
            match = true;
            // trim for now and concatenate unc path (e.g. \\network) or root path (/etc, ~/etc) later
            let prefix = '';
            if (path.indexOf(unc) === 0) {
                prefix = path.substr(0, path.indexOf(unc) + unc.length);
                path = path.substr(path.indexOf(unc) + unc.length);
            }
            else if (path.indexOf(pathSeparator) === 0) {
                prefix = path.substr(0, path.indexOf(pathSeparator) + pathSeparator.length);
                path = path.substr(path.indexOf(pathSeparator) + pathSeparator.length);
            }
            else if (path.indexOf(home) === 0) {
                prefix = path.substr(0, path.indexOf(home) + home.length);
                path = path.substr(path.indexOf(home) + home.length);
            }
            // pick the first shortest subpath found
            const segments = path.split(pathSeparator);
            for (let subpathLength = 1; match && subpathLength <= segments.length; subpathLength++) {
                for (let start = segments.length - subpathLength; match && start >= 0; start--) {
                    match = false;
                    let subpath = segments.slice(start, start + subpathLength).join(pathSeparator);
                    // that is unique to any other path
                    for (let otherPathIndex = 0; !match && otherPathIndex < paths.length; otherPathIndex++) {
                        // suffix subpath treated specially as we consider no match 'x' and 'x/...'
                        if (otherPathIndex !== pathIndex && paths[otherPathIndex] && paths[otherPathIndex].indexOf(subpath) > -1) {
                            const isSubpathEnding = (start + subpathLength === segments.length);
                            // Adding separator as prefix for subpath, such that 'endsWith(src, trgt)' considers subpath as directory name instead of plain string.
                            // prefix is not added when either subpath is root directory or path[otherPathIndex] does not have multiple directories.
                            const subpathWithSep = (start > 0 && paths[otherPathIndex].indexOf(pathSeparator) > -1) ? pathSeparator + subpath : subpath;
                            const isOtherPathEnding = paths[otherPathIndex].endsWith(subpathWithSep);
                            match = !isSubpathEnding || isOtherPathEnding;
                        }
                    }
                    // found unique subpath
                    if (!match) {
                        let result = '';
                        // preserve disk drive or root prefix
                        if (segments[0].endsWith(':') || prefix !== '') {
                            if (start === 1) {
                                // extend subpath to include disk drive prefix
                                start = 0;
                                subpathLength++;
                                subpath = segments[0] + pathSeparator + subpath;
                            }
                            if (start > 0) {
                                result = segments[0] + pathSeparator;
                            }
                            result = prefix + result;
                        }
                        // add ellipsis at the beginning if needed
                        if (start > 0) {
                            result = result + ellipsis + pathSeparator;
                        }
                        result = result + subpath;
                        // add ellipsis at the end if needed
                        if (start + subpathLength < segments.length) {
                            result = result + pathSeparator + ellipsis;
                        }
                        shortenedPaths[pathIndex] = result;
                    }
                }
            }
            if (match) {
                shortenedPaths[pathIndex] = path; // use full path if no unique subpaths found
            }
        }
        return shortenedPaths;
    }
    exports.shorten = shorten;
    var Type;
    (function (Type) {
        Type[Type["TEXT"] = 0] = "TEXT";
        Type[Type["VARIABLE"] = 1] = "VARIABLE";
        Type[Type["SEPARATOR"] = 2] = "SEPARATOR";
    })(Type || (Type = {}));
    /**
     * Helper to insert values for specific template variables into the string. E.g. "this $(is) a $(template)" can be
     * passed to this function together with an object that maps "is" and "template" to strings to have them replaced.
     * @param value string to which template is applied
     * @param values the values of the templates to use
     */
    function template(template, values = Object.create(null)) {
        const segments = [];
        let inVariable = false;
        let curVal = '';
        for (const char of template) {
            // Beginning of variable
            if (char === '$' || (inVariable && char === '{')) {
                if (curVal) {
                    segments.push({ value: curVal, type: Type.TEXT });
                }
                curVal = '';
                inVariable = true;
            }
            // End of variable
            else if (char === '}' && inVariable) {
                const resolved = values[curVal];
                // Variable
                if (typeof resolved === 'string') {
                    if (resolved.length) {
                        segments.push({ value: resolved, type: Type.VARIABLE });
                    }
                }
                // Separator
                else if (resolved) {
                    const prevSegment = segments[segments.length - 1];
                    if (!prevSegment || prevSegment.type !== Type.SEPARATOR) {
                        segments.push({ value: resolved.label, type: Type.SEPARATOR }); // prevent duplicate separators
                    }
                }
                curVal = '';
                inVariable = false;
            }
            // Text or Variable Name
            else {
                curVal += char;
            }
        }
        // Tail
        if (curVal && !inVariable) {
            segments.push({ value: curVal, type: Type.TEXT });
        }
        return segments.filter((segment, index) => {
            // Only keep separator if we have values to the left and right
            if (segment.type === Type.SEPARATOR) {
                const left = segments[index - 1];
                const right = segments[index + 1];
                return [left, right].every(segment => segment && (segment.type === Type.VARIABLE || segment.type === Type.TEXT) && segment.value.length > 0);
            }
            // accept any TEXT and VARIABLE
            return true;
        }).map(segment => segment.value).join('');
    }
    exports.template = template;
    /**
     * Handles mnemonics for menu items. Depending on OS:
     * - Windows: Supported via & character (replace && with &)
     * -   Linux: Supported via & character (replace && with &)
     * -   macOS: Unsupported (replace && with empty string)
     */
    function mnemonicMenuLabel(label, forceDisableMnemonics) {
        if (platform_1.isMacintosh || forceDisableMnemonics) {
            return label.replace(/\(&&\w\)|&&/g, '').replace(/&/g, platform_1.isMacintosh ? '&' : '&&');
        }
        return label.replace(/&&|&/g, m => m === '&' ? '&&' : '&');
    }
    exports.mnemonicMenuLabel = mnemonicMenuLabel;
    /**
     * Handles mnemonics for buttons. Depending on OS:
     * - Windows: Supported via & character (replace && with & and & with && for escaping)
     * -   Linux: Supported via _ character (replace && with _)
     * -   macOS: Unsupported (replace && with empty string)
     */
    function mnemonicButtonLabel(label, forceDisableMnemonics) {
        if (platform_1.isMacintosh || forceDisableMnemonics) {
            return label.replace(/\(&&\w\)|&&/g, '');
        }
        if (platform_1.isWindows) {
            return label.replace(/&&|&/g, m => m === '&' ? '&&' : '&');
        }
        return label.replace(/&&/g, '_');
    }
    exports.mnemonicButtonLabel = mnemonicButtonLabel;
    function unmnemonicLabel(label) {
        return label.replace(/&/g, '&&');
    }
    exports.unmnemonicLabel = unmnemonicLabel;
    /**
     * Splits a path in name and parent path, supporting both '/' and '\'
     */
    function splitName(fullPath) {
        const p = fullPath.indexOf('/') !== -1 ? path_1.posix : path_1.win32;
        const name = p.basename(fullPath);
        const parentPath = p.dirname(fullPath);
        if (name.length) {
            return { name, parentPath };
        }
        // only the root segment
        return { name: parentPath, parentPath: '' };
    }
    exports.splitName = splitName;
});
//# sourceMappingURL=labels.js.map