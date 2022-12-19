/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/linkedList", "vs/base/common/map", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/platform/commands/common/commands", "vs/platform/editor/common/editor", "vs/platform/opener/common/opener"], function (require, exports, dom, cancellation_1, linkedList_1, map_1, marshalling_1, network_1, resources_1, uri_1, codeEditorService_1, commands_1, editor_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenerService = void 0;
    let CommandOpener = class CommandOpener {
        constructor(_commandService) {
            this._commandService = _commandService;
        }
        async open(target, options) {
            if (!(0, opener_1.matchesScheme)(target, network_1.Schemas.command)) {
                return false;
            }
            if (!(options === null || options === void 0 ? void 0 : options.allowCommands)) {
                // silently ignore commands when command-links are disabled, also
                // surpress other openers by returning TRUE
                return true;
            }
            // run command or bail out if command isn't known
            if (typeof target === 'string') {
                target = uri_1.URI.parse(target);
            }
            // execute as command
            let args = [];
            try {
                args = (0, marshalling_1.parse)(decodeURIComponent(target.query));
            }
            catch (_a) {
                // ignore and retry
                try {
                    args = (0, marshalling_1.parse)(target.query);
                }
                catch (_b) {
                    // ignore error
                }
            }
            if (!Array.isArray(args)) {
                args = [args];
            }
            await this._commandService.executeCommand(target.path, ...args);
            return true;
        }
    };
    CommandOpener = __decorate([
        __param(0, commands_1.ICommandService)
    ], CommandOpener);
    let EditorOpener = class EditorOpener {
        constructor(_editorService) {
            this._editorService = _editorService;
        }
        async open(target, options) {
            if (typeof target === 'string') {
                target = uri_1.URI.parse(target);
            }
            const { selection, uri } = (0, opener_1.extractSelection)(target);
            target = uri;
            if (target.scheme === network_1.Schemas.file) {
                target = (0, resources_1.normalizePath)(target); // workaround for non-normalized paths (https://github.com/microsoft/vscode/issues/12954)
            }
            await this._editorService.openCodeEditor({
                resource: target,
                options: Object.assign({ selection, source: (options === null || options === void 0 ? void 0 : options.fromUserGesture) ? editor_1.EditorOpenSource.USER : editor_1.EditorOpenSource.API }, options === null || options === void 0 ? void 0 : options.editorOptions)
            }, this._editorService.getFocusedCodeEditor(), options === null || options === void 0 ? void 0 : options.openToSide);
            return true;
        }
    };
    EditorOpener = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], EditorOpener);
    let OpenerService = class OpenerService {
        constructor(editorService, commandService) {
            this._openers = new linkedList_1.LinkedList();
            this._validators = new linkedList_1.LinkedList();
            this._resolvers = new linkedList_1.LinkedList();
            this._resolvedUriTargets = new map_1.ResourceMap(uri => uri.with({ path: null, fragment: null, query: null }).toString());
            this._externalOpeners = new linkedList_1.LinkedList();
            // Default external opener is going through window.open()
            this._defaultExternalOpener = {
                openExternal: async (href) => {
                    // ensure to open HTTP/HTTPS links into new windows
                    // to not trigger a navigation. Any other link is
                    // safe to be set as HREF to prevent a blank window
                    // from opening.
                    if ((0, opener_1.matchesSomeScheme)(href, network_1.Schemas.http, network_1.Schemas.https)) {
                        dom.windowOpenNoOpener(href);
                    }
                    else {
                        window.location.href = href;
                    }
                    return true;
                }
            };
            // Default opener: any external, maito, http(s), command, and catch-all-editors
            this._openers.push({
                open: async (target, options) => {
                    if ((options === null || options === void 0 ? void 0 : options.openExternal) || (0, opener_1.matchesSomeScheme)(target, network_1.Schemas.mailto, network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.vsls)) {
                        // open externally
                        await this._doOpenExternal(target, options);
                        return true;
                    }
                    return false;
                }
            });
            this._openers.push(new CommandOpener(commandService));
            this._openers.push(new EditorOpener(editorService));
        }
        registerOpener(opener) {
            const remove = this._openers.unshift(opener);
            return { dispose: remove };
        }
        registerValidator(validator) {
            const remove = this._validators.push(validator);
            return { dispose: remove };
        }
        registerExternalUriResolver(resolver) {
            const remove = this._resolvers.push(resolver);
            return { dispose: remove };
        }
        setDefaultExternalOpener(externalOpener) {
            this._defaultExternalOpener = externalOpener;
        }
        registerExternalOpener(opener) {
            const remove = this._externalOpeners.push(opener);
            return { dispose: remove };
        }
        async open(target, options) {
            var _a;
            // check with contributed validators
            const targetURI = typeof target === 'string' ? uri_1.URI.parse(target) : target;
            // validate against the original URI that this URI resolves to, if one exists
            const validationTarget = (_a = this._resolvedUriTargets.get(targetURI)) !== null && _a !== void 0 ? _a : target;
            for (const validator of this._validators) {
                if (!(await validator.shouldOpen(validationTarget))) {
                    return false;
                }
            }
            // check with contributed openers
            for (const opener of this._openers) {
                const handled = await opener.open(target, options);
                if (handled) {
                    return true;
                }
            }
            return false;
        }
        async resolveExternalUri(resource, options) {
            for (const resolver of this._resolvers) {
                try {
                    const result = await resolver.resolveExternalUri(resource, options);
                    if (result) {
                        if (!this._resolvedUriTargets.has(result.resolved)) {
                            this._resolvedUriTargets.set(result.resolved, resource);
                        }
                        return result;
                    }
                }
                catch (_a) {
                    // noop
                }
            }
            throw new Error('Could not resolve external URI: ' + resource.toString());
        }
        async _doOpenExternal(resource, options) {
            //todo@jrieken IExternalUriResolver should support `uri: URI | string`
            const uri = typeof resource === 'string' ? uri_1.URI.parse(resource) : resource;
            let externalUri;
            try {
                externalUri = (await this.resolveExternalUri(uri, options)).resolved;
            }
            catch (_a) {
                externalUri = uri;
            }
            let href;
            if (typeof resource === 'string' && uri.toString() === externalUri.toString()) {
                // open the url-string AS IS
                href = resource;
            }
            else {
                // open URI using the toString(noEncode)+encodeURI-trick
                href = encodeURI(externalUri.toString(true));
            }
            if (options === null || options === void 0 ? void 0 : options.allowContributedOpeners) {
                const preferredOpenerId = typeof (options === null || options === void 0 ? void 0 : options.allowContributedOpeners) === 'string' ? options === null || options === void 0 ? void 0 : options.allowContributedOpeners : undefined;
                for (const opener of this._externalOpeners) {
                    const didOpen = await opener.openExternal(href, {
                        sourceUri: uri,
                        preferredOpenerId,
                    }, cancellation_1.CancellationToken.None);
                    if (didOpen) {
                        return true;
                    }
                }
            }
            return this._defaultExternalOpener.openExternal(href, { sourceUri: uri }, cancellation_1.CancellationToken.None);
        }
        dispose() {
            this._validators.clear();
        }
    };
    OpenerService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, commands_1.ICommandService)
    ], OpenerService);
    exports.OpenerService = OpenerService;
});
//# sourceMappingURL=openerService.js.map