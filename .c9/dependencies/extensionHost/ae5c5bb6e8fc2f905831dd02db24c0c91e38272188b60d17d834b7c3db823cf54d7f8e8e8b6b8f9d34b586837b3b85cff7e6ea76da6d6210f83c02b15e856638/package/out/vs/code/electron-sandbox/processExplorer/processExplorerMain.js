/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/tree/dataTree", "vs/base/common/async", "vs/base/parts/contextmenu/electron-sandbox/contextmenu", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/diagnostics/common/diagnostics", "vs/platform/files/common/files", "vs/platform/ipc/electron-sandbox/mainProcessService", "vs/platform/native/electron-sandbox/nativeHostService", "vs/platform/theme/browser/iconsStyleSheet", "vs/platform/window/electron-sandbox/window", "vs/css!./media/processExplorer", "vs/base/browser/ui/codicons/codiconStyles"], function (require, exports, nls_1, dom_1, dataTree_1, async_1, contextmenu_1, globals_1, diagnostics_1, files_1, mainProcessService_1, nativeHostService_1, iconsStyleSheet_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.startup = void 0;
    const DEBUG_FLAGS_PATTERN = /\s--(inspect|debug)(-brk|port)?=(\d+)?/;
    const DEBUG_PORT_PATTERN = /\s--(inspect|debug)-port=(\d+)/;
    class ProcessListDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (isProcessItem(element)) {
                return 'process';
            }
            if (isMachineProcessInformation(element)) {
                return 'machine';
            }
            if ((0, diagnostics_1.isRemoteDiagnosticError)(element)) {
                return 'error';
            }
            if (isProcessInformation(element)) {
                return 'header';
            }
            return '';
        }
    }
    class ProcessTreeDataSource {
        hasChildren(element) {
            var _a;
            if ((0, diagnostics_1.isRemoteDiagnosticError)(element)) {
                return false;
            }
            if (isProcessItem(element)) {
                return !!((_a = element.children) === null || _a === void 0 ? void 0 : _a.length);
            }
            else {
                return true;
            }
        }
        getChildren(element) {
            if (isProcessItem(element)) {
                return element.children ? element.children : [];
            }
            if ((0, diagnostics_1.isRemoteDiagnosticError)(element)) {
                return [];
            }
            if (isProcessInformation(element)) {
                // If there are multiple process roots, return these, otherwise go directly to the root process
                if (element.processRoots.length > 1) {
                    return element.processRoots;
                }
                else {
                    return [element.processRoots[0].rootProcess];
                }
            }
            if (isMachineProcessInformation(element)) {
                return [element.rootProcess];
            }
            return [element.processes];
        }
    }
    class ProcessHeaderTreeRenderer {
        constructor() {
            this.templateId = 'header';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const row = (0, dom_1.append)(container, (0, dom_1.$)('.row'));
            data.name = (0, dom_1.append)(row, (0, dom_1.$)('.nameLabel'));
            data.CPU = (0, dom_1.append)(row, (0, dom_1.$)('.cpu'));
            data.memory = (0, dom_1.append)(row, (0, dom_1.$)('.memory'));
            data.PID = (0, dom_1.append)(row, (0, dom_1.$)('.pid'));
            return data;
        }
        renderElement(node, index, templateData, height) {
            templateData.name.textContent = (0, nls_1.localize)('name', "Process Name");
            templateData.CPU.textContent = (0, nls_1.localize)('cpu', "CPU (%)");
            templateData.PID.textContent = (0, nls_1.localize)('pid', "PID");
            templateData.memory.textContent = (0, nls_1.localize)('memory', "Memory (MB)");
        }
        disposeTemplate(templateData) {
            // Nothing to do
        }
    }
    class MachineRenderer {
        constructor() {
            this.templateId = 'machine';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const row = (0, dom_1.append)(container, (0, dom_1.$)('.row'));
            data.name = (0, dom_1.append)(row, (0, dom_1.$)('.nameLabel'));
            return data;
        }
        renderElement(node, index, templateData, height) {
            templateData.name.textContent = node.element.name;
        }
        disposeTemplate(templateData) {
            // Nothing to do
        }
    }
    class ErrorRenderer {
        constructor() {
            this.templateId = 'error';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const row = (0, dom_1.append)(container, (0, dom_1.$)('.row'));
            data.name = (0, dom_1.append)(row, (0, dom_1.$)('.nameLabel'));
            return data;
        }
        renderElement(node, index, templateData, height) {
            templateData.name.textContent = node.element.errorMessage;
        }
        disposeTemplate(templateData) {
            // Nothing to do
        }
    }
    class ProcessRenderer {
        constructor(platform, totalMem, mapPidToWindowTitle) {
            this.platform = platform;
            this.totalMem = totalMem;
            this.mapPidToWindowTitle = mapPidToWindowTitle;
            this.templateId = 'process';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const row = (0, dom_1.append)(container, (0, dom_1.$)('.row'));
            data.name = (0, dom_1.append)(row, (0, dom_1.$)('.nameLabel'));
            data.CPU = (0, dom_1.append)(row, (0, dom_1.$)('.cpu'));
            data.memory = (0, dom_1.append)(row, (0, dom_1.$)('.memory'));
            data.PID = (0, dom_1.append)(row, (0, dom_1.$)('.pid'));
            return data;
        }
        renderElement(node, index, templateData, height) {
            const { element } = node;
            let name = element.name;
            if (name === 'window') {
                const windowTitle = this.mapPidToWindowTitle.get(element.pid);
                name = windowTitle !== undefined ? `${name} (${this.mapPidToWindowTitle.get(element.pid)})` : name;
            }
            const pid = element.pid.toFixed(0);
            templateData.name.textContent = name;
            templateData.name.title = element.cmd;
            templateData.CPU.textContent = element.load.toFixed(0);
            templateData.PID.textContent = pid;
            templateData.PID.parentElement.id = `pid-${pid}`;
            const memory = this.platform === 'win32' ? element.mem : (this.totalMem * (element.mem / 100));
            templateData.memory.textContent = (memory / files_1.ByteSize.MB).toFixed(0);
        }
        disposeTemplate(templateData) {
            // Nothing to do
        }
    }
    function isMachineProcessInformation(item) {
        return !!item.name && !!item.rootProcess;
    }
    function isProcessInformation(item) {
        return !!item.processRoots;
    }
    function isProcessItem(item) {
        return !!item.pid;
    }
    class ProcessExplorer {
        constructor(windowId, data) {
            this.data = data;
            this.mapPidToWindowTitle = new Map();
            const mainProcessService = new mainProcessService_1.ElectronIPCMainProcessService(windowId);
            this.nativeHostService = new nativeHostService_1.NativeHostService(windowId, mainProcessService);
            this.applyStyles(data.styles);
            this.setEventHandlers(data);
            // Map window process pids to titles, annotate process names with this when rendering to distinguish between them
            globals_1.ipcRenderer.on('vscode:windowsInfoResponse', (event, windows) => {
                this.mapPidToWindowTitle = new Map();
                windows.forEach(window => this.mapPidToWindowTitle.set(window.pid, window.title));
            });
            globals_1.ipcRenderer.on('vscode:listProcessesResponse', async (event, processRoots) => {
                processRoots.forEach((info, index) => {
                    if (isProcessItem(info.rootProcess)) {
                        info.rootProcess.name = index === 0 ? `${this.data.applicationName} main` : 'remote agent';
                    }
                });
                if (!this.tree) {
                    await this.createProcessTree(processRoots);
                }
                else {
                    this.tree.setInput({ processes: { processRoots } });
                }
                this.requestProcessList(0);
            });
            this.lastRequestTime = Date.now();
            globals_1.ipcRenderer.send('vscode:windowsInfoRequest');
            globals_1.ipcRenderer.send('vscode:listProcesses');
        }
        setEventHandlers(data) {
            document.onkeydown = (e) => {
                const cmdOrCtrlKey = data.platform === 'darwin' ? e.metaKey : e.ctrlKey;
                // Cmd/Ctrl + w closes issue window
                if (cmdOrCtrlKey && e.keyCode === 87) {
                    e.stopPropagation();
                    e.preventDefault();
                    globals_1.ipcRenderer.send('vscode:closeProcessExplorer');
                }
                // Cmd/Ctrl + zooms in
                if (cmdOrCtrlKey && e.keyCode === 187) {
                    (0, window_1.zoomIn)();
                }
                // Cmd/Ctrl - zooms out
                if (cmdOrCtrlKey && e.keyCode === 189) {
                    (0, window_1.zoomOut)();
                }
            };
        }
        async createProcessTree(processRoots) {
            const container = document.getElementById('process-list');
            if (!container) {
                return;
            }
            const { totalmem } = await this.nativeHostService.getOSStatistics();
            const renderers = [
                new ProcessRenderer(this.data.platform, totalmem, this.mapPidToWindowTitle),
                new ProcessHeaderTreeRenderer(),
                new MachineRenderer(),
                new ErrorRenderer()
            ];
            this.tree = new dataTree_1.DataTree('processExplorer', container, new ProcessListDelegate(), renderers, new ProcessTreeDataSource(), {
                identityProvider: {
                    getId: (element) => {
                        if (isProcessItem(element)) {
                            return element.pid.toString();
                        }
                        if ((0, diagnostics_1.isRemoteDiagnosticError)(element)) {
                            return element.hostName;
                        }
                        if (isProcessInformation(element)) {
                            return 'processes';
                        }
                        if (isMachineProcessInformation(element)) {
                            return element.name;
                        }
                        return 'header';
                    }
                },
            });
            this.tree.setInput({ processes: { processRoots } });
            this.tree.layout(window.innerHeight, window.innerWidth);
            this.tree.onContextMenu(e => {
                if (isProcessItem(e.element)) {
                    this.showContextMenu(e.element, true);
                }
            });
        }
        isDebuggable(cmd) {
            const matches = DEBUG_FLAGS_PATTERN.exec(cmd);
            return (matches && matches.length >= 2) || cmd.indexOf('node ') >= 0 || cmd.indexOf('node.exe') >= 0;
        }
        attachTo(item) {
            const config = {
                type: 'node',
                request: 'attach',
                name: `process ${item.pid}`
            };
            let matches = DEBUG_FLAGS_PATTERN.exec(item.cmd);
            if (matches && matches.length >= 2) {
                // attach via port
                if (matches.length === 4 && matches[3]) {
                    config.port = parseInt(matches[3]);
                }
                config.protocol = matches[1] === 'debug' ? 'legacy' : 'inspector';
            }
            else {
                // no port -> try to attach via pid (send SIGUSR1)
                config.processId = String(item.pid);
            }
            // a debug-port=n or inspect-port=n overrides the port
            matches = DEBUG_PORT_PATTERN.exec(item.cmd);
            if (matches && matches.length === 3) {
                // override port
                config.port = parseInt(matches[2]);
            }
            globals_1.ipcRenderer.send('vscode:workbenchCommand', { id: 'debug.startFromConfig', from: 'processExplorer', args: [config] });
        }
        applyStyles(styles) {
            const styleElement = (0, dom_1.createStyleSheet)();
            const content = [];
            if (styles.listFocusBackground) {
                content.push(`.monaco-list:focus .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list:focus .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`);
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list:focus .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list:focus .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list:focus .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`);
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list:focus .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list-row:hover:not(.selected):not(.focused) { background-color: ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list-row:hover:not(.selected):not(.focused) { color: ${styles.listHoverForeground}; }`);
            }
            if (styles.listFocusOutline) {
                content.push(`.monaco-list:focus .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) {
                content.push(`.monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            styleElement.textContent = content.join('\n');
            if (styles.color) {
                document.body.style.color = styles.color;
            }
        }
        showContextMenu(item, isLocal) {
            const items = [];
            const pid = Number(item.pid);
            if (isLocal) {
                items.push({
                    label: (0, nls_1.localize)('killProcess', "Kill Process"),
                    click: () => {
                        this.nativeHostService.killProcess(pid, 'SIGTERM');
                    }
                });
                items.push({
                    label: (0, nls_1.localize)('forceKillProcess', "Force Kill Process"),
                    click: () => {
                        this.nativeHostService.killProcess(pid, 'SIGKILL');
                    }
                });
                items.push({
                    type: 'separator'
                });
            }
            items.push({
                label: (0, nls_1.localize)('copy', "Copy"),
                click: () => {
                    var _a, _b;
                    // Collect the selected pids
                    const selectionPids = (_b = (_a = this.tree) === null || _a === void 0 ? void 0 : _a.getSelection()) === null || _b === void 0 ? void 0 : _b.map(e => {
                        if (!e || !('pid' in e)) {
                            return undefined;
                        }
                        return e.pid;
                    }).filter(e => !!e);
                    // If the selection does not contain the right clicked item, copy the right clicked
                    // item only.
                    if (!(selectionPids === null || selectionPids === void 0 ? void 0 : selectionPids.includes(pid))) {
                        selectionPids.length = 0;
                        selectionPids.push(pid);
                    }
                    const rows = selectionPids === null || selectionPids === void 0 ? void 0 : selectionPids.map(e => document.getElementById(`pid-${e}`)).filter(e => !!e);
                    if (rows) {
                        const text = rows.map(e => e.innerText).filter(e => !!e);
                        this.nativeHostService.writeClipboardText(text.join('\n'));
                    }
                }
            });
            items.push({
                label: (0, nls_1.localize)('copyAll', "Copy All"),
                click: () => {
                    const processList = document.getElementById('process-list');
                    if (processList) {
                        this.nativeHostService.writeClipboardText(processList.innerText);
                    }
                }
            });
            if (item && isLocal && this.isDebuggable(item.cmd)) {
                items.push({
                    type: 'separator'
                });
                items.push({
                    label: (0, nls_1.localize)('debug', "Debug"),
                    click: () => {
                        this.attachTo(item);
                    }
                });
            }
            (0, contextmenu_1.popup)(items);
        }
        requestProcessList(totalWaitTime) {
            setTimeout(() => {
                const nextRequestTime = Date.now();
                const waited = totalWaitTime + nextRequestTime - this.lastRequestTime;
                this.lastRequestTime = nextRequestTime;
                // Wait at least a second between requests.
                if (waited > 1000) {
                    globals_1.ipcRenderer.send('vscode:windowsInfoRequest');
                    globals_1.ipcRenderer.send('vscode:listProcesses');
                }
                else {
                    this.requestProcessList(waited);
                }
            }, 200);
        }
    }
    function createCodiconStyleSheet() {
        const codiconStyleSheet = (0, dom_1.createStyleSheet)();
        codiconStyleSheet.id = 'codiconStyles';
        const iconsStyleSheet = (0, iconsStyleSheet_1.getIconsStyleSheet)(undefined);
        function updateAll() {
            codiconStyleSheet.textContent = iconsStyleSheet.getCSS();
        }
        const delayer = new async_1.RunOnceScheduler(updateAll, 0);
        iconsStyleSheet.onDidChange(() => delayer.schedule());
        delayer.schedule();
    }
    function startup(configuration) {
        const platformClass = configuration.data.platform === 'win32' ? 'windows' : configuration.data.platform === 'linux' ? 'linux' : 'mac';
        document.body.classList.add(platformClass); // used by our fonts
        createCodiconStyleSheet();
        (0, window_1.applyZoom)(configuration.data.zoomLevel);
        new ProcessExplorer(configuration.windowId, configuration.data);
    }
    exports.startup = startup;
});
//# sourceMappingURL=processExplorerMain.js.map