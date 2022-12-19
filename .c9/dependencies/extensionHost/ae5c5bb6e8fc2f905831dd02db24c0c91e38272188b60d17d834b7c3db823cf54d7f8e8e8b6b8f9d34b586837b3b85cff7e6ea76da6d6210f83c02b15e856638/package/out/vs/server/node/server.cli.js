/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "url", "child_process", "http", "vs/base/common/process", "vs/base/common/path", "vs/platform/environment/node/argv", "vs/platform/environment/node/wait", "vs/platform/environment/node/stdin"], function (require, exports, _fs, _url, _cp, _http, process_1, path_1, argv_1, wait_1, stdin_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = void 0;
    const isSupportedForCmd = (optionId) => {
        switch (optionId) {
            case 'user-data-dir':
            case 'extensions-dir':
            case 'export-default-configuration':
            case 'install-source':
            case 'enable-smoke-test-driver':
            case 'extensions-download-dir':
            case 'builtin-extensions-dir':
            case 'telemetry':
                return false;
            default:
                return true;
        }
    };
    const isSupportedForPipe = (optionId) => {
        switch (optionId) {
            case 'version':
            case 'help':
            case 'folder-uri':
            case 'file-uri':
            case 'add':
            case 'diff':
            case 'wait':
            case 'goto':
            case 'reuse-window':
            case 'new-window':
            case 'status':
            case 'install-extension':
            case 'uninstall-extension':
            case 'list-extensions':
            case 'force':
            case 'show-versions':
            case 'category':
            case 'verbose':
            case 'remote':
                return true;
            default:
                return false;
        }
    };
    const cliPipe = process.env['VSCODE_IPC_HOOK_CLI'];
    const cliCommand = process.env['VSCODE_CLIENT_COMMAND'];
    const cliCommandCwd = process.env['VSCODE_CLIENT_COMMAND_CWD'];
    const cliRemoteAuthority = process.env['VSCODE_CLI_AUTHORITY'];
    const cliStdInFilePath = process.env['VSCODE_STDIN_FILE_PATH'];
    function main(desc, args) {
        var _a, _b;
        if (!cliPipe && !cliCommand) {
            console.log('Command is only available in WSL or inside a Visual Studio Code terminal.');
            return;
        }
        // take the local options and remove the ones that don't apply
        const options = Object.assign({}, argv_1.OPTIONS);
        const isSupported = cliCommand ? isSupportedForCmd : isSupportedForPipe;
        for (const optionId in argv_1.OPTIONS) {
            const optId = optionId;
            if (!isSupported(optId)) {
                delete options[optId];
            }
        }
        if (cliPipe) {
            options['openExternal'] = { type: 'boolean' };
        }
        const errorReporter = {
            onMultipleValues: (id, usedValue) => {
                console.error(`Option ${id} can only be defined once. Using value ${usedValue}.`);
            },
            onUnknownOption: (id) => {
                console.error(`Ignoring option ${id}: not supported for ${desc.executableName}.`);
            },
            onDeprecatedOption: (deprecatedOption, message) => {
                console.warn(`Option '${deprecatedOption}' is deprecated: ${message}`);
            }
        };
        const parsedArgs = (0, argv_1.parseArgs)(args, options, errorReporter);
        const mapFileUri = cliRemoteAuthority ? mapFileToRemoteUri : (uri) => uri;
        const verbose = !!parsedArgs['verbose'];
        if (parsedArgs.help) {
            console.log((0, argv_1.buildHelpMessage)(desc.productName, desc.executableName, desc.version, options));
            return;
        }
        if (parsedArgs.version) {
            console.log((0, argv_1.buildVersionMessage)(desc.version, desc.commit));
            return;
        }
        if (cliPipe) {
            if (parsedArgs['openExternal']) {
                openInBrowser(parsedArgs['_'], verbose);
                return;
            }
        }
        let remote = parsedArgs.remote;
        if (remote === 'local' || remote === 'false' || remote === '') {
            remote = null; // null represent a local window
        }
        const folderURIs = (parsedArgs['folder-uri'] || []).map(mapFileUri);
        parsedArgs['folder-uri'] = folderURIs;
        const fileURIs = (parsedArgs['file-uri'] || []).map(mapFileUri);
        parsedArgs['file-uri'] = fileURIs;
        const inputPaths = parsedArgs['_'];
        let hasReadStdinArg = false;
        for (let input of inputPaths) {
            if (input === '-') {
                hasReadStdinArg = true;
            }
            else {
                translatePath(input, mapFileUri, folderURIs, fileURIs);
            }
        }
        parsedArgs['_'] = [];
        if (hasReadStdinArg && fileURIs.length === 0 && folderURIs.length === 0 && (0, stdin_1.hasStdinWithoutTty)()) {
            try {
                let stdinFilePath = cliStdInFilePath;
                if (!stdinFilePath) {
                    stdinFilePath = (0, stdin_1.getStdinFilePath)();
                    (0, stdin_1.readFromStdin)(stdinFilePath, verbose); // throws error if file can not be written
                }
                // Make sure to open tmp file
                translatePath(stdinFilePath, mapFileUri, folderURIs, fileURIs);
                // Enable --wait to get all data and ignore adding this to history
                parsedArgs.wait = true;
                parsedArgs['skip-add-to-recently-opened'] = true;
                console.log(`Reading from stdin via: ${stdinFilePath}`);
            }
            catch (e) {
                console.log(`Failed to create file to read via stdin: ${e.toString()}`);
            }
        }
        if (parsedArgs.extensionDevelopmentPath) {
            parsedArgs.extensionDevelopmentPath = parsedArgs.extensionDevelopmentPath.map(p => mapFileUri(pathToURI(p).href));
        }
        if (parsedArgs.extensionTestsPath) {
            parsedArgs.extensionTestsPath = mapFileUri(pathToURI(parsedArgs['extensionTestsPath']).href);
        }
        const crashReporterDirectory = parsedArgs['crash-reporter-directory'];
        if (crashReporterDirectory !== undefined && !crashReporterDirectory.match(/^([a-zA-Z]:[\\\/])/)) {
            console.log(`The crash reporter directory '${crashReporterDirectory}' must be an absolute Windows path (e.g. c:/crashes)`);
            return;
        }
        if (cliCommand) {
            if (parsedArgs['install-extension'] !== undefined || parsedArgs['uninstall-extension'] !== undefined || parsedArgs['list-extensions']) {
                const cmdLine = [];
                (_a = parsedArgs['install-extension']) === null || _a === void 0 ? void 0 : _a.forEach(id => cmdLine.push('--install-extension', id));
                (_b = parsedArgs['uninstall-extension']) === null || _b === void 0 ? void 0 : _b.forEach(id => cmdLine.push('--uninstall-extension', id));
                ['list-extensions', 'force', 'show-versions', 'category'].forEach(opt => {
                    const value = parsedArgs[opt];
                    if (value !== undefined) {
                        cmdLine.push(`--${opt}=${value}`);
                    }
                });
                const cp = _cp.fork((0, path_1.join)(__dirname, '../../../server-main.js'), cmdLine, { stdio: 'inherit' });
                cp.on('error', err => console.log(err));
                return;
            }
            let newCommandline = [];
            for (let key in parsedArgs) {
                let val = parsedArgs[key];
                if (typeof val === 'boolean') {
                    if (val) {
                        newCommandline.push('--' + key);
                    }
                }
                else if (Array.isArray(val)) {
                    for (let entry of val) {
                        newCommandline.push(`--${key}=${entry.toString()}`);
                    }
                }
                else if (val) {
                    newCommandline.push(`--${key}=${val.toString()}`);
                }
            }
            if (remote !== null) {
                newCommandline.push(`--remote=${remote || cliRemoteAuthority}`);
            }
            const ext = (0, path_1.extname)(cliCommand);
            if (ext === '.bat' || ext === '.cmd') {
                const processCwd = cliCommandCwd || (0, process_1.cwd)();
                if (verbose) {
                    console.log(`Invoking: cmd.exe /C ${cliCommand} ${newCommandline.join(' ')} in ${processCwd}`);
                }
                _cp.spawn('cmd.exe', ['/C', cliCommand, ...newCommandline], {
                    stdio: 'inherit',
                    cwd: processCwd
                });
            }
            else {
                const cliCwd = (0, path_1.dirname)(cliCommand);
                const env = Object.assign(Object.assign({}, process.env), { ELECTRON_RUN_AS_NODE: '1' });
                newCommandline.unshift('--ms-enable-electron-run-as-node');
                newCommandline.unshift('resources/app/out/cli.js');
                if (verbose) {
                    console.log(`Invoking: cd "${cliCwd}" && ELECTRON_RUN_AS_NODE=1 "${cliCommand}" "${newCommandline.join('" "')}"`);
                }
                _cp.spawn(cliCommand, newCommandline, { cwd: cliCwd, env, stdio: ['inherit'] });
            }
        }
        else {
            if (parsedArgs.status) {
                sendToPipe({
                    type: 'status'
                }, verbose).then((res) => {
                    console.log(res);
                }).catch(e => {
                    console.error('Error when requesting status:', e);
                });
                return;
            }
            if (parsedArgs['install-extension'] !== undefined || parsedArgs['uninstall-extension'] !== undefined || parsedArgs['list-extensions']) {
                sendToPipe({
                    type: 'extensionManagement',
                    list: parsedArgs['list-extensions'] ? { showVersions: parsedArgs['show-versions'], category: parsedArgs['category'] } : undefined,
                    install: asExtensionIdOrVSIX(parsedArgs['install-extension']),
                    uninstall: asExtensionIdOrVSIX(parsedArgs['uninstall-extension']),
                    force: parsedArgs['force']
                }, verbose).then((res) => {
                    console.log(res);
                }).catch(e => {
                    console.error('Error when invoking the extension management command:', e);
                });
                return;
            }
            let waitMarkerFilePath = undefined;
            if (parsedArgs['wait']) {
                if (!fileURIs.length) {
                    console.log('At least one file must be provided to wait for.');
                    return;
                }
                waitMarkerFilePath = (0, wait_1.createWaitMarkerFile)(verbose);
            }
            sendToPipe({
                type: 'open',
                fileURIs,
                folderURIs,
                diffMode: parsedArgs.diff,
                addMode: parsedArgs.add,
                gotoLineMode: parsedArgs.goto,
                forceReuseWindow: parsedArgs['reuse-window'],
                forceNewWindow: parsedArgs['new-window'],
                waitMarkerFilePath,
                remoteAuthority: remote
            }, verbose).catch(e => {
                console.error('Error when invoking the open command:', e);
            });
            if (waitMarkerFilePath) {
                waitForFileDeleted(waitMarkerFilePath);
            }
        }
    }
    exports.main = main;
    async function waitForFileDeleted(path) {
        while (_fs.existsSync(path)) {
            await new Promise(res => setTimeout(res, 1000));
        }
    }
    function openInBrowser(args, verbose) {
        let uris = [];
        for (let location of args) {
            try {
                if (/^(http|https|file):\/\//.test(location)) {
                    uris.push(_url.parse(location).href);
                }
                else {
                    uris.push(pathToURI(location).href);
                }
            }
            catch (e) {
                console.log(`Invalid url: ${location}`);
            }
        }
        if (uris.length) {
            sendToPipe({
                type: 'openExternal',
                uris
            }, verbose).catch(e => {
                console.error('Error when invoking the open external command:', e);
            });
        }
    }
    function sendToPipe(args, verbose) {
        if (verbose) {
            console.log(JSON.stringify(args, null, '  '));
        }
        return new Promise((resolve, reject) => {
            const message = JSON.stringify(args);
            if (!cliPipe) {
                console.log('Message ' + message);
                resolve('');
                return;
            }
            const opts = {
                socketPath: cliPipe,
                path: '/',
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'accept': 'application/json'
                }
            };
            const req = _http.request(opts, res => {
                if (res.headers['content-type'] !== 'application/json') {
                    reject('Error in response: Invalid content type: Expected \'application/json\', is: ' + res.headers['content-type']);
                    return;
                }
                const chunks = [];
                res.setEncoding('utf8');
                res.on('data', chunk => {
                    chunks.push(chunk);
                });
                res.on('error', (err) => fatal('Error in response.', err));
                res.on('end', () => {
                    const content = chunks.join('');
                    try {
                        const obj = JSON.parse(content);
                        if (res.statusCode === 200) {
                            resolve(obj);
                        }
                        else {
                            reject(obj);
                        }
                    }
                    catch (e) {
                        reject('Error in response: Unable to parse response as JSON: ' + content);
                    }
                });
            });
            req.on('error', (err) => fatal('Error in request.', err));
            req.write(message);
            req.end();
        });
    }
    function asExtensionIdOrVSIX(inputs) {
        return inputs === null || inputs === void 0 ? void 0 : inputs.map(input => /\.vsix$/i.test(input) ? pathToURI(input).href : input);
    }
    function fatal(message, err) {
        console.error('Unable to connect to VS Code server: ' + message);
        console.error(err);
        process.exit(1);
    }
    const preferredCwd = process.env.PWD || (0, process_1.cwd)(); // prefer process.env.PWD as it does not follow symlinks
    function pathToURI(input) {
        input = input.trim();
        input = (0, path_1.resolve)(preferredCwd, input);
        return _url.pathToFileURL(input);
    }
    function translatePath(input, mapFileUri, folderURIS, fileURIS) {
        let url = pathToURI(input);
        let mappedUri = mapFileUri(url.href);
        try {
            let stat = _fs.lstatSync(_fs.realpathSync(input));
            if (stat.isFile()) {
                fileURIS.push(mappedUri);
            }
            else if (stat.isDirectory()) {
                folderURIS.push(mappedUri);
            }
            else if (input === '/dev/null') {
                // handle /dev/null passed to us by external tools such as `git difftool`
                fileURIS.push(mappedUri);
            }
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                fileURIS.push(mappedUri);
            }
            else {
                console.log(`Problem accessing file ${input}. Ignoring file`, e);
            }
        }
    }
    function mapFileToRemoteUri(uri) {
        return uri.replace(/^file:\/\//, 'vscode-remote://' + cliRemoteAuthority);
    }
    let [, , productName, version, commit, executableName, ...remainingArgs] = process.argv;
    main({ productName, version, commit, executableName }, remainingArgs);
});
//# sourceMappingURL=server.cli.js.map