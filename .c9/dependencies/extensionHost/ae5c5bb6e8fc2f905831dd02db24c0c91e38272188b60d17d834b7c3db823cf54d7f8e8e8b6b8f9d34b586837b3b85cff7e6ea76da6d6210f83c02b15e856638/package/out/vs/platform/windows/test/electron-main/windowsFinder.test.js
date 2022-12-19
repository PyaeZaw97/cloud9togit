/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/node/testUtils", "vs/platform/windows/electron-main/windowsFinder", "vs/platform/workspaces/common/workspaces"], function (require, exports, assert, event_1, path_1, resources_1, uri_1, testUtils_1, windowsFinder_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WindowsFinder', () => {
        const fixturesFolder = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures');
        const testWorkspace = {
            id: Date.now().toString(),
            configPath: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'workspaces.json'))
        };
        const testWorkspaceFolders = (0, workspaces_1.toWorkspaceFolders)([{ path: (0, path_1.join)(fixturesFolder, 'vscode_workspace_1_folder') }, { path: (0, path_1.join)(fixturesFolder, 'vscode_workspace_2_folder') }], testWorkspace.configPath, resources_1.extUriBiasedIgnorePathCase);
        const localWorkspaceResolver = (workspace) => { return workspace === testWorkspace ? { id: testWorkspace.id, configPath: workspace.configPath, folders: testWorkspaceFolders } : undefined; };
        function createTestCodeWindow(options) {
            return new class {
                constructor() {
                    this.onWillLoad = event_1.Event.None;
                    this.onDidSignalReady = event_1.Event.None;
                    this.onDidClose = event_1.Event.None;
                    this.onDidDestroy = event_1.Event.None;
                    this.whenClosedOrLoaded = Promise.resolve();
                    this.id = -1;
                    this.win = null;
                    this.openedWorkspace = options.openedFolderUri ? { id: '', uri: options.openedFolderUri } : options.openedWorkspace;
                    this.isExtensionDevelopmentHost = false;
                    this.isExtensionTestHost = false;
                    this.lastFocusTime = options.lastFocusTime;
                    this.isFullScreen = false;
                    this.isReady = true;
                    this.hasHiddenTitleBarStyle = false;
                }
                ready() { throw new Error('Method not implemented.'); }
                setReady() { throw new Error('Method not implemented.'); }
                addTabbedWindow(window) { throw new Error('Method not implemented.'); }
                load(config, options) { throw new Error('Method not implemented.'); }
                reload(cli) { throw new Error('Method not implemented.'); }
                focus(options) { throw new Error('Method not implemented.'); }
                close() { throw new Error('Method not implemented.'); }
                getBounds() { throw new Error('Method not implemented.'); }
                send(channel, ...args) { throw new Error('Method not implemented.'); }
                sendWhenReady(channel, token, ...args) { throw new Error('Method not implemented.'); }
                toggleFullScreen() { throw new Error('Method not implemented.'); }
                isMinimized() { throw new Error('Method not implemented.'); }
                setRepresentedFilename(name) { throw new Error('Method not implemented.'); }
                getRepresentedFilename() { throw new Error('Method not implemented.'); }
                setDocumentEdited(edited) { throw new Error('Method not implemented.'); }
                isDocumentEdited() { throw new Error('Method not implemented.'); }
                handleTitleDoubleClick() { throw new Error('Method not implemented.'); }
                updateTouchBar(items) { throw new Error('Method not implemented.'); }
                serializeWindowState() { throw new Error('Method not implemented'); }
                dispose() { }
            };
        }
        const vscodeFolderWindow = createTestCodeWindow({ lastFocusTime: 1, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_folder')) });
        const lastActiveWindow = createTestCodeWindow({ lastFocusTime: 3, openedFolderUri: undefined });
        const noVscodeFolderWindow = createTestCodeWindow({ lastFocusTime: 2, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder')) });
        const windows = [
            vscodeFolderWindow,
            lastActiveWindow,
            noVscodeFolderWindow,
        ];
        test('New window without folder when no windows exist', () => {
            assert.strictEqual((0, windowsFinder_1.findWindowOnFile)([], uri_1.URI.file('nonexisting'), localWorkspaceResolver), undefined);
            assert.strictEqual((0, windowsFinder_1.findWindowOnFile)([], uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder', 'file.txt')), localWorkspaceResolver), undefined);
        });
        test('Existing window with folder', () => {
            assert.strictEqual((0, windowsFinder_1.findWindowOnFile)(windows, uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder', 'file.txt')), localWorkspaceResolver), noVscodeFolderWindow);
            assert.strictEqual((0, windowsFinder_1.findWindowOnFile)(windows, uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_folder', 'file.txt')), localWorkspaceResolver), vscodeFolderWindow);
            const window = createTestCodeWindow({ lastFocusTime: 1, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_folder', 'nested_folder')) });
            assert.strictEqual((0, windowsFinder_1.findWindowOnFile)([window], uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_folder', 'nested_folder', 'subfolder', 'file.txt')), localWorkspaceResolver), window);
        });
        test('More specific existing window wins', () => {
            const window = createTestCodeWindow({ lastFocusTime: 2, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder')) });
            const nestedFolderWindow = createTestCodeWindow({ lastFocusTime: 1, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder', 'nested_folder')) });
            assert.strictEqual((0, windowsFinder_1.findWindowOnFile)([window, nestedFolderWindow], uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder', 'nested_folder', 'subfolder', 'file.txt')), localWorkspaceResolver), nestedFolderWindow);
        });
        test('Workspace folder wins', () => {
            const window = createTestCodeWindow({ lastFocusTime: 1, openedWorkspace: testWorkspace });
            assert.strictEqual((0, windowsFinder_1.findWindowOnFile)([window], uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_workspace_2_folder', 'nested_vscode_folder', 'subfolder', 'file.txt')), localWorkspaceResolver), window);
        });
    });
});
//# sourceMappingURL=windowsFinder.test.js.map