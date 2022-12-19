"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitProtocolHandler = void 0;
const vscode_1 = require("vscode");
const util_1 = require("./util");
const querystring = require("querystring");
const schemes = new Set(['file', 'git', 'http', 'https', 'ssh']);
class GitProtocolHandler {
    constructor() {
        this.disposables = [];
        this.disposables.push(vscode_1.window.registerUriHandler(this));
    }
    handleUri(uri) {
        switch (uri.path) {
            case '/clone': this.clone(uri);
        }
    }
    clone(uri) {
        const data = querystring.parse(uri.query);
        if (!data.url) {
            console.warn('Failed to open URI:', uri);
            return;
        }
        if (Array.isArray(data.url) && data.url.length === 0) {
            console.warn('Failed to open URI:', uri);
            return;
        }
        let cloneUri;
        try {
            cloneUri = vscode_1.Uri.parse(Array.isArray(data.url) ? data.url[0] : data.url, true);
            if (!schemes.has(cloneUri.scheme.toLowerCase())) {
                throw new Error('Unsupported scheme.');
            }
        }
        catch (ex) {
            console.warn('Invalid URI:', uri);
            return;
        }
        vscode_1.commands.executeCommand('git.clone', cloneUri.toString(true));
    }
    dispose() {
        this.disposables = (0, util_1.dispose)(this.disposables);
    }
}
exports.GitProtocolHandler = GitProtocolHandler;
//# sourceMappingURL=protocolHandler.js.map