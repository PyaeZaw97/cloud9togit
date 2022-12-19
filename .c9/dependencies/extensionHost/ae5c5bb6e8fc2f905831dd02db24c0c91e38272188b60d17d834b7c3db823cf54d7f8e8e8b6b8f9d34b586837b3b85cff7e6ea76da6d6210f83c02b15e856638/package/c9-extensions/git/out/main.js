"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.getExtensionContext = exports._activate = exports.deactivate = void 0;
// Modifications Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const vscode_1 = require("vscode");
const git_1 = require("./git");
const model_1 = require("./model");
const commands_1 = require("./commands");
const contentProvider_1 = require("./contentProvider");
const fileSystemProvider_1 = require("./fileSystemProvider");
const decorationProvider_1 = require("./decorationProvider");
const askpass_1 = require("./askpass");
const util_1 = require("./util");
const extension_telemetry_1 = require("@vscode/extension-telemetry");
const protocolHandler_1 = require("./protocolHandler");
const extension_1 = require("./api/extension");
const path = require("path");
const fs = require("fs");
const os = require("os");
const timelineProvider_1 = require("./timelineProvider");
const api1_1 = require("./api/api1");
const terminal_1 = require("./terminal");
const deactivateTasks = [];
async function deactivate() {
    for (const task of deactivateTasks) {
        await task();
    }
}
exports.deactivate = deactivate;
async function createModel(context, outputChannel, telemetryReporter, disposables) {
    var _a, _b, _c;
    const pathValue = vscode_1.workspace.getConfiguration('git').get('path');
    let pathHints = Array.isArray(pathValue) ? pathValue : pathValue ? [pathValue] : [];
    const { isTrusted, workspaceFolders = [] } = vscode_1.workspace;
    const excludes = isTrusted ? [] : workspaceFolders.map(f => path.normalize(f.uri.fsPath).replace(/[\r\n]+$/, ''));
    if (!isTrusted && pathHints.length !== 0) {
        // Filter out any non-absolute paths
        pathHints = pathHints.filter(p => path.isAbsolute(p));
    }
    const info = await (0, git_1.findGit)(pathHints, gitPath => {
        outputChannel.appendLine(localize('validating', "{0} Validating found git in: {1}", (0, util_1.logTimestamp)(), gitPath));
        if (excludes.length === 0) {
            return true;
        }
        const normalized = path.normalize(gitPath).replace(/[\r\n]+$/, '');
        const skip = excludes.some(e => normalized.startsWith(e));
        if (skip) {
            outputChannel.appendLine(localize('skipped', "{0} Skipped found git in: {1}", (0, util_1.logTimestamp)(), gitPath));
        }
        return !skip;
    });
    const askpass = await askpass_1.Askpass.create(outputChannel, context.storagePath);
    disposables.push(askpass);
    const environment = askpass.getEnv();
    const terminalEnvironmentManager = new terminal_1.TerminalEnvironmentManager(context, environment);
    disposables.push(terminalEnvironmentManager);
    const git = new git_1.Git({
        gitPath: info.path,
        userAgent: `git/${info.version} (${(_c = (_b = (_a = os).version) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : os.type()} ${os.release()}; ${os.platform()} ${os.arch()}) vscode/${vscode_1.version} (${vscode_1.env.appName})`,
        version: info.version,
        env: environment,
    });
    const model = new model_1.Model(git, askpass, context.globalState, outputChannel, telemetryReporter);
    disposables.push(model);
    const onRepository = () => vscode_1.commands.executeCommand('setContext', 'gitOpenRepositoryCount', `${model.repositories.length}`);
    model.onDidOpenRepository(onRepository, null, disposables);
    model.onDidCloseRepository(onRepository, null, disposables);
    onRepository();
    outputChannel.appendLine(localize('using git', "{0} Using git {1} from {2}", (0, util_1.logTimestamp)(), info.version, info.path));
    const onOutput = (str) => {
        const lines = str.split(/\r?\n/mg);
        while (/^\s*$/.test(lines[lines.length - 1])) {
            lines.pop();
        }
        outputChannel.appendLine(`${(0, util_1.logTimestamp)()} ${lines.join('\n')}`);
    };
    git.onOutput.addListener('log', onOutput);
    disposables.push((0, util_1.toDisposable)(() => git.onOutput.removeListener('log', onOutput)));
    const cc = new commands_1.CommandCenter(git, model, outputChannel, telemetryReporter);
    disposables.push(cc, new contentProvider_1.GitContentProvider(model), new fileSystemProvider_1.GitFileSystemProvider(model), new decorationProvider_1.GitDecorations(model), new protocolHandler_1.GitProtocolHandler(), new timelineProvider_1.GitTimelineProvider(model, cc));
    checkGitVersion(info);
    return model;
}
async function isGitRepository(folder) {
    if (folder.uri.scheme !== 'file') {
        return false;
    }
    const dotGit = path.join(folder.uri.fsPath, '.git');
    try {
        const dotGitStat = await new Promise((c, e) => fs.stat(dotGit, (err, stat) => err ? e(err) : c(stat)));
        return dotGitStat.isDirectory();
    }
    catch (err) {
        return false;
    }
}
async function warnAboutMissingGit() {
    const config = vscode_1.workspace.getConfiguration('git');
    const shouldIgnore = config.get('ignoreMissingGitWarning') === true;
    if (shouldIgnore) {
        return;
    }
    if (!vscode_1.workspace.workspaceFolders) {
        return;
    }
    const areGitRepositories = await Promise.all(vscode_1.workspace.workspaceFolders.map(isGitRepository));
    if (areGitRepositories.every(isGitRepository => !isGitRepository)) {
        return;
    }
    const download = localize('downloadgit', "Download Git");
    const neverShowAgain = localize('neverShowAgain', "Don't Show Again");
    const choice = await vscode_1.window.showWarningMessage(localize('notfound', "Git not found. Install it or configure it using the 'git.path' setting."), download, neverShowAgain);
    if (choice === download) {
        vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://aka.ms/vscode-download-git'));
    }
    else if (choice === neverShowAgain) {
        await config.update('ignoreMissingGitWarning', true, true);
    }
}
async function _activate(context) {
    const disposables = [];
    context.subscriptions.push(new vscode_1.Disposable(() => vscode_1.Disposable.from(...disposables).dispose()));
    const outputChannel = vscode_1.window.createOutputChannel('Git');
    vscode_1.commands.registerCommand('git.showOutput', () => outputChannel.show());
    disposables.push(outputChannel);
    const { name, version, aiKey } = require('../package.json');
    const telemetryReporter = new extension_telemetry_1.default(name, version, aiKey);
    deactivateTasks.push(() => telemetryReporter.dispose());
    const config = vscode_1.workspace.getConfiguration('git', null);
    const enabled = config.get('enabled');
    if (!enabled) {
        const onConfigChange = (0, util_1.filterEvent)(vscode_1.workspace.onDidChangeConfiguration, e => e.affectsConfiguration('git'));
        const onEnabled = (0, util_1.filterEvent)(onConfigChange, () => vscode_1.workspace.getConfiguration('git', null).get('enabled') === true);
        const result = new extension_1.GitExtensionImpl();
        (0, util_1.eventToPromise)(onEnabled).then(async () => result.model = await createModel(context, outputChannel, telemetryReporter, disposables));
        return result;
    }
    try {
        const model = await createModel(context, outputChannel, telemetryReporter, disposables);
        return new extension_1.GitExtensionImpl(model);
    }
    catch (err) {
        if (!/Git installation not found/.test(err.message || '')) {
            throw err;
        }
        console.warn(err.message);
        outputChannel.appendLine(`${(0, util_1.logTimestamp)()} ${err.message}`);
        /* __GDPR__
            "git.missing" : {}
        */
        telemetryReporter.sendTelemetryEvent('git.missing');
        vscode_1.commands.executeCommand('setContext', 'git.missing', true);
        warnAboutMissingGit();
        return new extension_1.GitExtensionImpl();
    }
}
exports._activate = _activate;
let _context;
function getExtensionContext() {
    return _context;
}
exports.getExtensionContext = getExtensionContext;
async function activate(context) {
    _context = context;
    const result = await _activate(context);
    context.subscriptions.push((0, api1_1.registerAPICommands)(result));
    return result;
}
exports.activate = activate;
async function checkGitv1(info) {
    const config = vscode_1.workspace.getConfiguration('git');
    const shouldIgnore = config.get('ignoreLegacyWarning') === true;
    if (shouldIgnore) {
        return;
    }
    if (!/^[01]/.test(info.version)) {
        return;
    }
    const update = localize('updateGit', "Update Git");
    const neverShowAgain = localize('neverShowAgain', "Don't Show Again");
    const choice = await vscode_1.window.showWarningMessage(localize('git20', "You seem to have git {0} installed. Cloud9 works best with git >= 2", info.version), update, neverShowAgain);
    if (choice === update) {
        vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://aka.ms/vscode-download-git'));
    }
    else if (choice === neverShowAgain) {
        await config.update('ignoreLegacyWarning', true, true);
    }
}
async function checkGitWindows(info) {
    if (!/^2\.(25|26)\./.test(info.version)) {
        return;
    }
    const config = vscode_1.workspace.getConfiguration('git');
    const shouldIgnore = config.get('ignoreWindowsGit27Warning') === true;
    if (shouldIgnore) {
        return;
    }
    const update = localize('updateGit', "Update Git");
    const neverShowAgain = localize('neverShowAgain', "Don't Show Again");
    const choice = await vscode_1.window.showWarningMessage(localize('git2526', "There are known issues with the installed Git {0}. Please update to Git >= 2.27 for the git features to work correctly.", info.version), update, neverShowAgain);
    if (choice === update) {
        vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://aka.ms/vscode-download-git'));
    }
    else if (choice === neverShowAgain) {
        await config.update('ignoreWindowsGit27Warning', true, true);
    }
}
async function checkGitVersion(info) {
    await checkGitv1(info);
    if (process.platform === 'win32') {
        await checkGitWindows(info);
    }
}
//# sourceMappingURL=main.js.map