/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "minimist", "vs/base/common/platform", "vs/nls"], function (require, exports, minimist, platform_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildVersionMessage = exports.buildHelpMessage = exports.formatOptions = exports.parseArgs = exports.OPTIONS = void 0;
    /**
     * This code is also used by standalone cli's. Avoid adding any other dependencies.
     */
    const helpCategories = {
        o: (0, nls_1.localize)('optionsUpperCase', "Options"),
        e: (0, nls_1.localize)('extensionsManagement', "Extensions Management"),
        t: (0, nls_1.localize)('troubleshooting', "Troubleshooting")
    };
    exports.OPTIONS = {
        'diff': { type: 'boolean', cat: 'o', alias: 'd', args: ['file', 'file'], description: (0, nls_1.localize)('diff', "Compare two files with each other.") },
        'add': { type: 'boolean', cat: 'o', alias: 'a', args: 'folder', description: (0, nls_1.localize)('add', "Add folder(s) to the last active window.") },
        'goto': { type: 'boolean', cat: 'o', alias: 'g', args: 'file:line[:character]', description: (0, nls_1.localize)('goto', "Open a file at the path on the specified line and character position.") },
        'new-window': { type: 'boolean', cat: 'o', alias: 'n', description: (0, nls_1.localize)('newWindow', "Force to open a new window.") },
        'reuse-window': { type: 'boolean', cat: 'o', alias: 'r', description: (0, nls_1.localize)('reuseWindow', "Force to open a file or folder in an already opened window.") },
        'wait': { type: 'boolean', cat: 'o', alias: 'w', description: (0, nls_1.localize)('wait', "Wait for the files to be closed before returning.") },
        'waitMarkerFilePath': { type: 'string' },
        'locale': { type: 'string', cat: 'o', args: 'locale', description: (0, nls_1.localize)('locale', "The locale to use (e.g. en-US or zh-TW).") },
        'user-data-dir': { type: 'string', cat: 'o', args: 'dir', description: (0, nls_1.localize)('userDataDir', "Specifies the directory that user data is kept in. Can be used to open multiple distinct instances of Code.") },
        'help': { type: 'boolean', cat: 'o', alias: 'h', description: (0, nls_1.localize)('help', "Print usage.") },
        'extensions-dir': { type: 'string', deprecates: ['extensionHomePath'], cat: 'e', args: 'dir', description: (0, nls_1.localize)('extensionHomePath', "Set the root path for extensions.") },
        'extensions-download-dir': { type: 'string' },
        'builtin-extensions-dir': { type: 'string' },
        'list-extensions': { type: 'boolean', cat: 'e', description: (0, nls_1.localize)('listExtensions', "List the installed extensions.") },
        'show-versions': { type: 'boolean', cat: 'e', description: (0, nls_1.localize)('showVersions', "Show versions of installed extensions, when using --list-extensions.") },
        'category': { type: 'string', cat: 'e', description: (0, nls_1.localize)('category', "Filters installed extensions by provided category, when using --list-extensions."), args: 'category' },
        'install-extension': { type: 'string[]', cat: 'e', args: 'ext-id | path', description: (0, nls_1.localize)('installExtension', "Installs or updates an extension. The argument is either an extension id or a path to a VSIX. The identifier of an extension is '${publisher}.${name}'. Use '--force' argument to update to latest version. To install a specific version provide '@${version}'. For example: 'vscode.csharp@1.2.3'.") },
        'pre-release': { type: 'boolean', cat: 'e', description: (0, nls_1.localize)('install prerelease', "Installs the pre-release version of the extension, when using --install-extension") },
        'uninstall-extension': { type: 'string[]', cat: 'e', args: 'ext-id', description: (0, nls_1.localize)('uninstallExtension', "Uninstalls an extension.") },
        'enable-proposed-api': { type: 'string[]', cat: 'e', args: 'ext-id', description: (0, nls_1.localize)('experimentalApis', "Enables proposed API features for extensions. Can receive one or more extension IDs to enable individually.") },
        'version': { type: 'boolean', cat: 't', alias: 'v', description: (0, nls_1.localize)('version', "Print version.") },
        'verbose': { type: 'boolean', cat: 't', description: (0, nls_1.localize)('verbose', "Print verbose output (implies --wait).") },
        'log': { type: 'string', cat: 't', args: 'level', description: (0, nls_1.localize)('log', "Log level to use. Default is 'info'. Allowed values are 'critical', 'error', 'warn', 'info', 'debug', 'trace', 'off'.") },
        'status': { type: 'boolean', alias: 's', cat: 't', description: (0, nls_1.localize)('status', "Print process usage and diagnostics information.") },
        'prof-startup': { type: 'boolean', cat: 't', description: (0, nls_1.localize)('prof-startup', "Run CPU profiler during startup.") },
        'prof-append-timers': { type: 'string' },
        'no-cached-data': { type: 'boolean' },
        'prof-startup-prefix': { type: 'string' },
        'prof-v8-extensions': { type: 'boolean' },
        'disable-extensions': { type: 'boolean', deprecates: ['disableExtensions'], cat: 't', description: (0, nls_1.localize)('disableExtensions', "Disable all installed extensions.") },
        'disable-extension': { type: 'string[]', cat: 't', args: 'ext-id', description: (0, nls_1.localize)('disableExtension', "Disable an extension.") },
        'sync': { type: 'string', cat: 't', description: (0, nls_1.localize)('turn sync', "Turn sync on or off."), args: ['on | off'] },
        'inspect-extensions': { type: 'string', deprecates: ['debugPluginHost'], args: 'port', cat: 't', description: (0, nls_1.localize)('inspect-extensions', "Allow debugging and profiling of extensions. Check the developer tools for the connection URI.") },
        'inspect-brk-extensions': { type: 'string', deprecates: ['debugBrkPluginHost'], args: 'port', cat: 't', description: (0, nls_1.localize)('inspect-brk-extensions', "Allow debugging and profiling of extensions with the extension host being paused after start. Check the developer tools for the connection URI.") },
        'disable-gpu': { type: 'boolean', cat: 't', description: (0, nls_1.localize)('disableGPU', "Disable GPU hardware acceleration.") },
        'ms-enable-electron-run-as-node': { type: 'boolean' },
        'max-memory': { type: 'string', cat: 't', description: (0, nls_1.localize)('maxMemory', "Max memory size for a window (in Mbytes)."), args: 'memory' },
        'telemetry': { type: 'boolean', cat: 't', description: (0, nls_1.localize)('telemetry', "Shows all telemetry events which VS code collects.") },
        'remote': { type: 'string' },
        'folder-uri': { type: 'string[]', cat: 'o', args: 'uri' },
        'file-uri': { type: 'string[]', cat: 'o', args: 'uri' },
        'locate-extension': { type: 'string[]' },
        'extensionDevelopmentPath': { type: 'string[]' },
        'extensionDevelopmentKind': { type: 'string[]' },
        'extensionTestsPath': { type: 'string' },
        'extensionEnvironment': { type: 'string' },
        'debugId': { type: 'string' },
        'debugRenderer': { type: 'boolean' },
        'inspect-ptyhost': { type: 'string' },
        'inspect-brk-ptyhost': { type: 'string' },
        'inspect-search': { type: 'string', deprecates: ['debugSearch'] },
        'inspect-brk-search': { type: 'string', deprecates: ['debugBrkSearch'] },
        'export-default-configuration': { type: 'string' },
        'install-source': { type: 'string' },
        'enable-smoke-test-driver': { type: 'boolean' },
        'logExtensionHostCommunication': { type: 'boolean' },
        'skip-release-notes': { type: 'boolean' },
        'skip-welcome': { type: 'boolean' },
        'disable-telemetry': { type: 'boolean' },
        'disable-updates': { type: 'boolean' },
        'disable-keytar': { type: 'boolean' },
        'disable-workspace-trust': { type: 'boolean' },
        'disable-crash-reporter': { type: 'boolean' },
        'crash-reporter-directory': { type: 'string' },
        'crash-reporter-id': { type: 'string' },
        'skip-add-to-recently-opened': { type: 'boolean' },
        'unity-launch': { type: 'boolean' },
        'open-url': { type: 'boolean' },
        'file-write': { type: 'boolean' },
        'file-chmod': { type: 'boolean' },
        'install-builtin-extension': { type: 'string[]' },
        'force': { type: 'boolean' },
        'do-not-sync': { type: 'boolean' },
        'trace': { type: 'boolean' },
        'trace-category-filter': { type: 'string' },
        'trace-options': { type: 'string' },
        'force-user-env': { type: 'boolean' },
        'force-disable-user-env': { type: 'boolean' },
        'open-devtools': { type: 'boolean' },
        '__sandbox': { type: 'boolean' },
        'logsPath': { type: 'string' },
        // chromium flags
        'no-proxy-server': { type: 'boolean' },
        // Minimist incorrectly parses keys that start with `--no`
        // https://github.com/substack/minimist/blob/aeb3e27dae0412de5c0494e9563a5f10c82cc7a9/index.js#L118-L121
        // If --no-sandbox is passed via cli wrapper it will be treated as --sandbox which is incorrect, we use
        // the alias here to make sure --no-sandbox is always respected.
        // For https://github.com/microsoft/vscode/issues/128279
        'no-sandbox': { type: 'boolean', alias: 'sandbox' },
        'proxy-server': { type: 'string' },
        'proxy-bypass-list': { type: 'string' },
        'proxy-pac-url': { type: 'string' },
        'js-flags': { type: 'string' },
        'inspect': { type: 'string' },
        'inspect-brk': { type: 'string' },
        'nolazy': { type: 'boolean' },
        'force-device-scale-factor': { type: 'string' },
        'force-renderer-accessibility': { type: 'boolean' },
        'ignore-certificate-errors': { type: 'boolean' },
        'allow-insecure-localhost': { type: 'boolean' },
        'log-net-log': { type: 'string' },
        'vmodule': { type: 'string' },
        '_urls': { type: 'string[]' },
        'disable-dev-shm-usage': { type: 'boolean' },
        _: { type: 'string[]' } // main arguments
    };
    const ignoringReporter = {
        onUnknownOption: () => { },
        onMultipleValues: () => { },
        onDeprecatedOption: () => { }
    };
    function parseArgs(args, options, errorReporter = ignoringReporter) {
        const alias = {};
        const string = ['_'];
        const boolean = [];
        for (let optionId in options) {
            const o = options[optionId];
            if (o.alias) {
                alias[optionId] = o.alias;
            }
            if (o.type === 'string' || o.type === 'string[]') {
                string.push(optionId);
                if (o.deprecates) {
                    string.push(...o.deprecates);
                }
            }
            else if (o.type === 'boolean') {
                boolean.push(optionId);
                if (o.deprecates) {
                    boolean.push(...o.deprecates);
                }
            }
        }
        // remove aliases to avoid confusion
        const parsedArgs = minimist(args, { string, boolean, alias });
        const cleanedArgs = {};
        const remainingArgs = parsedArgs;
        // https://github.com/microsoft/vscode/issues/58177, https://github.com/microsoft/vscode/issues/106617
        cleanedArgs._ = parsedArgs._.map(arg => String(arg)).filter(arg => arg.length > 0);
        delete remainingArgs._;
        for (let optionId in options) {
            const o = options[optionId];
            if (o.alias) {
                delete remainingArgs[o.alias];
            }
            let val = remainingArgs[optionId];
            if (o.deprecates) {
                for (const deprecatedId of o.deprecates) {
                    if (remainingArgs.hasOwnProperty(deprecatedId)) {
                        if (!val) {
                            val = remainingArgs[deprecatedId];
                            if (val) {
                                errorReporter.onDeprecatedOption(deprecatedId, o.deprecationMessage || (0, nls_1.localize)('deprecated.useInstead', 'Use {0} instead.', optionId));
                            }
                        }
                        delete remainingArgs[deprecatedId];
                    }
                }
            }
            if (typeof val !== 'undefined') {
                if (o.type === 'string[]') {
                    if (val && !Array.isArray(val)) {
                        val = [val];
                    }
                }
                else if (o.type === 'string') {
                    if (Array.isArray(val)) {
                        val = val.pop(); // take the last
                        errorReporter.onMultipleValues(optionId, val);
                    }
                }
                cleanedArgs[optionId] = val;
                if (o.deprecationMessage) {
                    errorReporter.onDeprecatedOption(optionId, o.deprecationMessage);
                }
            }
            delete remainingArgs[optionId];
        }
        for (let key in remainingArgs) {
            errorReporter.onUnknownOption(key);
        }
        return cleanedArgs;
    }
    exports.parseArgs = parseArgs;
    function formatUsage(optionId, option) {
        let args = '';
        if (option.args) {
            if (Array.isArray(option.args)) {
                args = ` <${option.args.join('> <')}>`;
            }
            else {
                args = ` <${option.args}>`;
            }
        }
        if (option.alias) {
            return `-${option.alias} --${optionId}${args}`;
        }
        return `--${optionId}${args}`;
    }
    // exported only for testing
    function formatOptions(options, columns) {
        let maxLength = 0;
        let usageTexts = [];
        for (const optionId in options) {
            const o = options[optionId];
            const usageText = formatUsage(optionId, o);
            maxLength = Math.max(maxLength, usageText.length);
            usageTexts.push([usageText, o.description]);
        }
        let argLength = maxLength + 2 /*left padding*/ + 1 /*right padding*/;
        if (columns - argLength < 25) {
            // Use a condensed version on narrow terminals
            return usageTexts.reduce((r, ut) => r.concat([`  ${ut[0]}`, `      ${ut[1]}`]), []);
        }
        let descriptionColumns = columns - argLength - 1;
        let result = [];
        for (const ut of usageTexts) {
            let usage = ut[0];
            let wrappedDescription = wrapText(ut[1], descriptionColumns);
            let keyPadding = indent(argLength - usage.length - 2 /*left padding*/);
            result.push('  ' + usage + keyPadding + wrappedDescription[0]);
            for (let i = 1; i < wrappedDescription.length; i++) {
                result.push(indent(argLength) + wrappedDescription[i]);
            }
        }
        return result;
    }
    exports.formatOptions = formatOptions;
    function indent(count) {
        return ' '.repeat(count);
    }
    function wrapText(text, columns) {
        let lines = [];
        while (text.length) {
            let index = text.length < columns ? text.length : text.lastIndexOf(' ', columns);
            let line = text.slice(0, index).trim();
            text = text.slice(index);
            lines.push(line);
        }
        return lines;
    }
    function buildHelpMessage(productName, executableName, version, options, capabilities) {
        const columns = (process.stdout).isTTY && (process.stdout).columns || 80;
        const inputFiles = (capabilities === null || capabilities === void 0 ? void 0 : capabilities.noInputFiles) !== true ? `[${(0, nls_1.localize)('paths', 'paths')}...]` : '';
        const help = [`${productName} ${version}`];
        help.push('');
        help.push(`${(0, nls_1.localize)('usage', "Usage")}: ${executableName} [${(0, nls_1.localize)('options', "options")}]${inputFiles}`);
        help.push('');
        if ((capabilities === null || capabilities === void 0 ? void 0 : capabilities.noPipe) !== true) {
            if (platform_1.isWindows) {
                help.push((0, nls_1.localize)('stdinWindows', "To read output from another program, append '-' (e.g. 'echo Hello World | {0} -')", executableName));
            }
            else {
                help.push((0, nls_1.localize)('stdinUnix', "To read from stdin, append '-' (e.g. 'ps aux | grep code | {0} -')", executableName));
            }
            help.push('');
        }
        const optionsByCategory = {};
        for (const optionId in options) {
            const o = options[optionId];
            if (o.description && o.cat) {
                let optionsByCat = optionsByCategory[o.cat];
                if (!optionsByCat) {
                    optionsByCategory[o.cat] = optionsByCat = {};
                }
                optionsByCat[optionId] = o;
            }
        }
        for (let helpCategoryKey in optionsByCategory) {
            const key = helpCategoryKey;
            let categoryOptions = optionsByCategory[key];
            if (categoryOptions) {
                help.push(helpCategories[key]);
                help.push(...formatOptions(categoryOptions, columns));
                help.push('');
            }
        }
        return help.join('\n');
    }
    exports.buildHelpMessage = buildHelpMessage;
    function buildVersionMessage(version, commit) {
        return `${version || (0, nls_1.localize)('unknownVersion', "Unknown version")}\n${commit || (0, nls_1.localize)('unknownCommit', "Unknown commit")}\n${process.arch}`;
    }
    exports.buildVersionMessage = buildVersionMessage;
});
//# sourceMappingURL=argv.js.map