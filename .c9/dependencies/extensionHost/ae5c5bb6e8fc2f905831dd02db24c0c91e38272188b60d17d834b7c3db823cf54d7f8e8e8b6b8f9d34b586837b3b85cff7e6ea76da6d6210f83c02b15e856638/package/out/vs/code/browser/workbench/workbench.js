/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/cancellation", "vs/base/common/marshalling", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/parts/request/browser/request", "vs/platform/product/common/product", "vs/platform/window/common/window", "vs/workbench/workbench.web.main", "vs/base/common/path", "vs/base/common/strings"], function (require, exports, browser_1, cancellation_1, marshalling_1, event_1, lifecycle_1, network_1, resources_1, uri_1, request_1, product_1, window_1, workbench_web_main_1, path_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LocalStorageCredentialsProvider {
        constructor() {
            let authSessionInfo;
            const authSessionElement = document.getElementById('vscode-workbench-auth-session');
            const authSessionElementAttribute = authSessionElement ? authSessionElement.getAttribute('data-settings') : undefined;
            if (authSessionElementAttribute) {
                try {
                    authSessionInfo = JSON.parse(authSessionElementAttribute);
                }
                catch (error) { /* Invalid session is passed. Ignore. */ }
            }
            if (authSessionInfo) {
                // Settings Sync Entry
                this.setPassword(`${product_1.default.urlProtocol}.login`, 'account', JSON.stringify(authSessionInfo));
                // Auth extension Entry
                this.authService = `${product_1.default.urlProtocol}-${authSessionInfo.providerId}.login`;
                this.setPassword(this.authService, 'account', JSON.stringify(authSessionInfo.scopes.map(scopes => ({
                    id: authSessionInfo.id,
                    scopes,
                    accessToken: authSessionInfo.accessToken
                }))));
            }
        }
        get credentials() {
            if (!this._credentials) {
                try {
                    const serializedCredentials = window.localStorage.getItem(LocalStorageCredentialsProvider.CREDENTIALS_STORAGE_KEY);
                    if (serializedCredentials) {
                        this._credentials = JSON.parse(serializedCredentials);
                    }
                }
                catch (error) {
                    // ignore
                }
                if (!Array.isArray(this._credentials)) {
                    this._credentials = [];
                }
            }
            return this._credentials;
        }
        save() {
            window.localStorage.setItem(LocalStorageCredentialsProvider.CREDENTIALS_STORAGE_KEY, JSON.stringify(this.credentials));
        }
        async getPassword(service, account) {
            return this.doGetPassword(service, account);
        }
        async doGetPassword(service, account) {
            for (const credential of this.credentials) {
                if (credential.service === service) {
                    if (typeof account !== 'string' || account === credential.account) {
                        return credential.password;
                    }
                }
            }
            return null;
        }
        async setPassword(service, account, password) {
            this.doDeletePassword(service, account);
            this.credentials.push({ service, account, password });
            this.save();
            try {
                if (password && service === this.authService) {
                    const value = JSON.parse(password);
                    if (Array.isArray(value) && value.length === 0) {
                        await this.logout(service);
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
        }
        async deletePassword(service, account) {
            const result = await this.doDeletePassword(service, account);
            if (result && service === this.authService) {
                try {
                    await this.logout(service);
                }
                catch (error) {
                    console.log(error);
                }
            }
            return result;
        }
        async doDeletePassword(service, account) {
            let found = false;
            this._credentials = this.credentials.filter(credential => {
                if (credential.service === service && credential.account === account) {
                    found = true;
                    return false;
                }
                return true;
            });
            if (found) {
                this.save();
            }
            return found;
        }
        async findPassword(service) {
            return this.doGetPassword(service);
        }
        async findCredentials(service) {
            return this.credentials
                .filter(credential => credential.service === service)
                .map(({ account, password }) => ({ account, password }));
        }
        async logout(service) {
            const queryValues = new Map();
            queryValues.set('logout', String(true));
            queryValues.set('service', service);
            await (0, request_1.request)({
                url: doCreateUri('/auth/logout', queryValues).toString(true)
            }, cancellation_1.CancellationToken.None);
        }
        async clear() {
            window.localStorage.removeItem(LocalStorageCredentialsProvider.CREDENTIALS_STORAGE_KEY);
        }
    }
    LocalStorageCredentialsProvider.CREDENTIALS_STORAGE_KEY = 'credentials.provider';
    class LocalStorageURLCallbackProvider extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onCallback = this._register(new event_1.Emitter());
            this.onCallback = this._onCallback.event;
            this.pendingCallbacks = new Set();
            this.lastTimeChecked = Date.now();
            this.checkCallbacksTimeout = undefined;
        }
        create(options = {}) {
            const id = ++LocalStorageURLCallbackProvider.REQUEST_ID;
            const queryParams = [`vscode-reqid=${id}`];
            for (const key of LocalStorageURLCallbackProvider.QUERY_KEYS) {
                const value = options[key];
                if (value) {
                    queryParams.push(`vscode-${key}=${encodeURIComponent(value)}`);
                }
            }
            // TODO@joao remove eventually
            // https://github.com/microsoft/vscode-dev/issues/62
            // https://github.com/microsoft/vscode/blob/159479eb5ae451a66b5dac3c12d564f32f454796/extensions/github-authentication/src/githubServer.ts#L50-L50
            if (!(options.authority === 'vscode.github-authentication' && options.path === '/dummy')) {
                const key = `vscode-web.url-callbacks[${id}]`;
                window.localStorage.removeItem(key);
                this.pendingCallbacks.add(id);
                this.startListening();
            }
            return uri_1.URI.parse(window.location.href).with({ path: '/callback', query: queryParams.join('&') });
        }
        startListening() {
            if (this.onDidChangeLocalStorageDisposable) {
                return;
            }
            const fn = () => this.onDidChangeLocalStorage();
            window.addEventListener('storage', fn);
            this.onDidChangeLocalStorageDisposable = { dispose: () => window.removeEventListener('storage', fn) };
        }
        stopListening() {
            var _a;
            (_a = this.onDidChangeLocalStorageDisposable) === null || _a === void 0 ? void 0 : _a.dispose();
            this.onDidChangeLocalStorageDisposable = undefined;
        }
        // this fires every time local storage changes, but we
        // don't want to check more often than once a second
        async onDidChangeLocalStorage() {
            const ellapsed = Date.now() - this.lastTimeChecked;
            if (ellapsed > 1000) {
                this.checkCallbacks();
            }
            else if (this.checkCallbacksTimeout === undefined) {
                this.checkCallbacksTimeout = setTimeout(() => {
                    this.checkCallbacksTimeout = undefined;
                    this.checkCallbacks();
                }, 1000 - ellapsed);
            }
        }
        checkCallbacks() {
            let pendingCallbacks;
            for (const id of this.pendingCallbacks) {
                const key = `vscode-web.url-callbacks[${id}]`;
                const result = window.localStorage.getItem(key);
                if (result !== null) {
                    try {
                        this._onCallback.fire(uri_1.URI.revive(JSON.parse(result)));
                    }
                    catch (error) {
                        console.error(error);
                    }
                    pendingCallbacks = pendingCallbacks !== null && pendingCallbacks !== void 0 ? pendingCallbacks : new Set(this.pendingCallbacks);
                    pendingCallbacks.delete(id);
                    window.localStorage.removeItem(key);
                }
            }
            if (pendingCallbacks) {
                this.pendingCallbacks = pendingCallbacks;
                if (this.pendingCallbacks.size === 0) {
                    this.stopListening();
                }
            }
            this.lastTimeChecked = Date.now();
        }
    }
    LocalStorageURLCallbackProvider.REQUEST_ID = 0;
    LocalStorageURLCallbackProvider.QUERY_KEYS = [
        'scheme',
        'authority',
        'path',
        'query',
        'fragment'
    ];
    class WorkspaceProvider {
        constructor(workspace, payload, config) {
            this.workspace = workspace;
            this.payload = payload;
            this.config = config;
            this.trusted = true;
        }
        static create(config) {
            let foundWorkspace = false;
            let workspace;
            let payload = Object.create(null);
            const query = new URL(document.location.href).searchParams;
            query.forEach((value, key) => {
                switch (key) {
                    // Folder
                    case WorkspaceProvider.QUERY_PARAM_FOLDER:
                        if (config.remoteAuthority && value.startsWith(path_1.posix.sep)) {
                            // when connected to a remote and having a value
                            // that is a path (begins with a `/`), assume this
                            // is a vscode-remote resource as simplified URL.
                            workspace = { folderUri: uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, path: value, authority: config.remoteAuthority }) };
                        }
                        else {
                            workspace = { folderUri: uri_1.URI.parse(value) };
                        }
                        foundWorkspace = true;
                        break;
                    // Workspace
                    case WorkspaceProvider.QUERY_PARAM_WORKSPACE:
                        if (config.remoteAuthority && value.startsWith(path_1.posix.sep)) {
                            // when connected to a remote and having a value
                            // that is a path (begins with a `/`), assume this
                            // is a vscode-remote resource as simplified URL.
                            workspace = { workspaceUri: uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, path: value, authority: config.remoteAuthority }) };
                        }
                        else {
                            workspace = { workspaceUri: uri_1.URI.parse(value) };
                        }
                        foundWorkspace = true;
                        break;
                    // Empty
                    case WorkspaceProvider.QUERY_PARAM_EMPTY_WINDOW:
                        workspace = undefined;
                        foundWorkspace = true;
                        break;
                    // Payload
                    case WorkspaceProvider.QUERY_PARAM_PAYLOAD:
                        try {
                            payload = (0, marshalling_1.parse)(value); // use marshalling#parse() to revive potential URIs
                        }
                        catch (error) {
                            console.error(error); // possible invalid JSON
                        }
                        break;
                }
            });
            // If no workspace is provided through the URL, check for config
            // attribute from server
            if (!foundWorkspace) {
                if (config.folderUri) {
                    workspace = { folderUri: uri_1.URI.revive(config.folderUri) };
                }
                else if (config.workspaceUri) {
                    workspace = { workspaceUri: uri_1.URI.revive(config.workspaceUri) };
                }
            }
            return new WorkspaceProvider(workspace, payload, config);
        }
        async open(workspace, options) {
            if ((options === null || options === void 0 ? void 0 : options.reuse) && !options.payload && this.isSame(this.workspace, workspace)) {
                return true; // return early if workspace and environment is not changing and we are reusing window
            }
            const targetHref = this.createTargetUrl(workspace, options);
            if (targetHref) {
                if (options === null || options === void 0 ? void 0 : options.reuse) {
                    window.location.href = targetHref;
                    return true;
                }
                else {
                    let result;
                    if ((0, browser_1.isStandalone)()) {
                        result = window.open(targetHref, '_blank', 'toolbar=no'); // ensures to open another 'standalone' window!
                    }
                    else {
                        result = window.open(targetHref);
                    }
                    return !!result;
                }
            }
            return false;
        }
        createTargetUrl(workspace, options) {
            // Empty
            let targetHref = undefined;
            if (!workspace) {
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_EMPTY_WINDOW}=true`;
            }
            // Folder
            else if ((0, window_1.isFolderToOpen)(workspace)) {
                let queryParamFolder;
                if (this.config.remoteAuthority && workspace.folderUri.scheme === network_1.Schemas.vscodeRemote) {
                    // when connected to a remote and having a folder
                    // for that remote, only use the path as query
                    // value to form shorter, nicer URLs.
                    // ensure paths are absolute (begin with `/`)
                    // clipboard: ltrim(workspace.folderUri.path, posix.sep)
                    queryParamFolder = `${path_1.posix.sep}${(0, strings_1.ltrim)(workspace.folderUri.path, path_1.posix.sep)}`;
                }
                else {
                    queryParamFolder = encodeURIComponent(workspace.folderUri.toString(true));
                }
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_FOLDER}=${queryParamFolder}`;
            }
            // Workspace
            else if ((0, window_1.isWorkspaceToOpen)(workspace)) {
                let queryParamWorkspace;
                if (this.config.remoteAuthority && workspace.workspaceUri.scheme === network_1.Schemas.vscodeRemote) {
                    // when connected to a remote and having a workspace
                    // for that remote, only use the path as query
                    // value to form shorter, nicer URLs.
                    // ensure paths are absolute (begin with `/`)
                    queryParamWorkspace = `${path_1.posix.sep}${(0, strings_1.ltrim)(workspace.workspaceUri.path, path_1.posix.sep)}`;
                }
                else {
                    queryParamWorkspace = encodeURIComponent(workspace.workspaceUri.toString(true));
                }
                targetHref = `${document.location.origin}${document.location.pathname}?${WorkspaceProvider.QUERY_PARAM_WORKSPACE}=${queryParamWorkspace}`;
            }
            // Append payload if any
            if (options === null || options === void 0 ? void 0 : options.payload) {
                targetHref += `&${WorkspaceProvider.QUERY_PARAM_PAYLOAD}=${encodeURIComponent(JSON.stringify(options.payload))}`;
            }
            return targetHref;
        }
        isSame(workspaceA, workspaceB) {
            if (!workspaceA || !workspaceB) {
                return workspaceA === workspaceB; // both empty
            }
            if ((0, window_1.isFolderToOpen)(workspaceA) && (0, window_1.isFolderToOpen)(workspaceB)) {
                return (0, resources_1.isEqual)(workspaceA.folderUri, workspaceB.folderUri); // same workspace
            }
            if ((0, window_1.isWorkspaceToOpen)(workspaceA) && (0, window_1.isWorkspaceToOpen)(workspaceB)) {
                return (0, resources_1.isEqual)(workspaceA.workspaceUri, workspaceB.workspaceUri); // same workspace
            }
            return false;
        }
        hasRemote() {
            if (this.workspace) {
                if ((0, window_1.isFolderToOpen)(this.workspace)) {
                    return this.workspace.folderUri.scheme === network_1.Schemas.vscodeRemote;
                }
                if ((0, window_1.isWorkspaceToOpen)(this.workspace)) {
                    return this.workspace.workspaceUri.scheme === network_1.Schemas.vscodeRemote;
                }
            }
            return true;
        }
    }
    WorkspaceProvider.QUERY_PARAM_EMPTY_WINDOW = 'ew';
    WorkspaceProvider.QUERY_PARAM_FOLDER = 'folder';
    WorkspaceProvider.QUERY_PARAM_WORKSPACE = 'workspace';
    WorkspaceProvider.QUERY_PARAM_PAYLOAD = 'payload';
    function doCreateUri(path, queryValues) {
        let query = undefined;
        if (queryValues) {
            let index = 0;
            queryValues.forEach((value, key) => {
                if (!query) {
                    query = '';
                }
                const prefix = (index++ === 0) ? '' : '&';
                query += `${prefix}${key}=${encodeURIComponent(value)}`;
            });
        }
        return uri_1.URI.parse(window.location.href).with({ path, query });
    }
    (function () {
        // Find config by checking for DOM
        const configElement = document.getElementById('vscode-workbench-web-configuration');
        const configElementAttribute = configElement ? configElement.getAttribute('data-settings') : undefined;
        if (!configElement || !configElementAttribute) {
            throw new Error('Missing web configuration element');
        }
        const config = JSON.parse(configElementAttribute);
        // Create workbench
        (0, workbench_web_main_1.create)(document.body, Object.assign(Object.assign({}, config), { settingsSyncOptions: config.settingsSyncOptions ? {
                enabled: config.settingsSyncOptions.enabled,
            } : undefined, workspaceProvider: WorkspaceProvider.create(config), urlCallbackProvider: new LocalStorageURLCallbackProvider(), credentialsProvider: config.remoteAuthority ? undefined : new LocalStorageCredentialsProvider() // with a remote, we don't use a local credentials provider
         }));
    })();
});
//# sourceMappingURL=workbench.js.map