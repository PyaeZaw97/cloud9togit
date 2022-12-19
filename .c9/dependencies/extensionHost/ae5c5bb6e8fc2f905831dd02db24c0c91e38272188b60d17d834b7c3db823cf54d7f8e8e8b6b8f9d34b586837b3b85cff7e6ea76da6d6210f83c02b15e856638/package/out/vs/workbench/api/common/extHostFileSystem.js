/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "./extHost.protocol", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/editor/common/languages/linkComputer", "vs/base/common/strings", "vs/base/common/buffer", "vs/workbench/services/extensions/common/extensions"], function (require, exports, uri_1, extHost_protocol_1, lifecycle_1, extHostTypes_1, typeConverter, linkComputer_1, strings_1, buffer_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostFileSystem = void 0;
    class FsLinkProvider {
        constructor() {
            this._schemes = [];
        }
        add(scheme) {
            this._stateMachine = undefined;
            this._schemes.push(scheme);
        }
        delete(scheme) {
            const idx = this._schemes.indexOf(scheme);
            if (idx >= 0) {
                this._schemes.splice(idx, 1);
                this._stateMachine = undefined;
            }
        }
        _initStateMachine() {
            if (!this._stateMachine) {
                // sort and compute common prefix with previous scheme
                // then build state transitions based on the data
                const schemes = this._schemes.sort();
                const edges = [];
                let prevScheme;
                let prevState;
                let lastState = 14 /* State.LastKnownState */;
                let nextState = 14 /* State.LastKnownState */;
                for (const scheme of schemes) {
                    // skip the common prefix of the prev scheme
                    // and continue with its last state
                    let pos = !prevScheme ? 0 : (0, strings_1.commonPrefixLength)(prevScheme, scheme);
                    if (pos === 0) {
                        prevState = 1 /* State.Start */;
                    }
                    else {
                        prevState = nextState;
                    }
                    for (; pos < scheme.length; pos++) {
                        // keep creating new (next) states until the
                        // end (and the BeforeColon-state) is reached
                        if (pos + 1 === scheme.length) {
                            // Save the last state here, because we need to continue for the next scheme
                            lastState = nextState;
                            nextState = 9 /* State.BeforeColon */;
                        }
                        else {
                            nextState += 1;
                        }
                        edges.push([prevState, scheme.toUpperCase().charCodeAt(pos), nextState]);
                        edges.push([prevState, scheme.toLowerCase().charCodeAt(pos), nextState]);
                        prevState = nextState;
                    }
                    prevScheme = scheme;
                    // Restore the last state
                    nextState = lastState;
                }
                // all link must match this pattern `<scheme>:/<more>`
                edges.push([9 /* State.BeforeColon */, 58 /* CharCode.Colon */, 10 /* State.AfterColon */]);
                edges.push([10 /* State.AfterColon */, 47 /* CharCode.Slash */, 12 /* State.End */]);
                this._stateMachine = new linkComputer_1.StateMachine(edges);
            }
        }
        provideDocumentLinks(document) {
            this._initStateMachine();
            const result = [];
            const links = linkComputer_1.LinkComputer.computeLinks({
                getLineContent(lineNumber) {
                    return document.lineAt(lineNumber - 1).text;
                },
                getLineCount() {
                    return document.lineCount;
                }
            }, this._stateMachine);
            for (const link of links) {
                const docLink = typeConverter.DocumentLink.to(link);
                if (docLink.target) {
                    result.push(docLink);
                }
            }
            return result;
        }
    }
    class ExtHostFileSystem {
        constructor(mainContext, _extHostLanguageFeatures) {
            this._extHostLanguageFeatures = _extHostLanguageFeatures;
            this._linkProvider = new FsLinkProvider();
            this._fsProvider = new Map();
            this._registeredSchemes = new Set();
            this._watches = new Map();
            this._handlePool = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadFileSystem);
        }
        dispose() {
            var _a;
            (_a = this._linkProviderRegistration) === null || _a === void 0 ? void 0 : _a.dispose();
        }
        registerFileSystemProvider(extension, scheme, provider, options = {}) {
            if (this._registeredSchemes.has(scheme)) {
                throw new Error(`a provider for the scheme '${scheme}' is already registered`);
            }
            //
            if (!this._linkProviderRegistration) {
                this._linkProviderRegistration = this._extHostLanguageFeatures.registerDocumentLinkProvider(extension, '*', this._linkProvider);
            }
            const handle = this._handlePool++;
            this._linkProvider.add(scheme);
            this._registeredSchemes.add(scheme);
            this._fsProvider.set(handle, provider);
            let capabilities = 2 /* files.FileSystemProviderCapabilities.FileReadWrite */;
            if (options.isCaseSensitive) {
                capabilities += 1024 /* files.FileSystemProviderCapabilities.PathCaseSensitive */;
            }
            if (options.isReadonly) {
                capabilities += 2048 /* files.FileSystemProviderCapabilities.Readonly */;
            }
            if (typeof provider.copy === 'function') {
                capabilities += 8 /* files.FileSystemProviderCapabilities.FileFolderCopy */;
            }
            if (typeof provider.open === 'function' && typeof provider.close === 'function'
                && typeof provider.read === 'function' && typeof provider.write === 'function') {
                (0, extensions_1.checkProposedApiEnabled)(extension, 'fsChunks');
                capabilities += 4 /* files.FileSystemProviderCapabilities.FileOpenReadWriteClose */;
            }
            this._proxy.$registerFileSystemProvider(handle, scheme, capabilities).catch(err => {
                console.error(`FAILED to register filesystem provider of ${extension.identifier.value}-extension for the scheme ${scheme}`);
                console.error(err);
            });
            const subscription = provider.onDidChangeFile(event => {
                const mapped = [];
                for (const e of event) {
                    let { uri: resource, type } = e;
                    if (resource.scheme !== scheme) {
                        // dropping events for wrong scheme
                        continue;
                    }
                    let newType;
                    switch (type) {
                        case extHostTypes_1.FileChangeType.Changed:
                            newType = 0 /* files.FileChangeType.UPDATED */;
                            break;
                        case extHostTypes_1.FileChangeType.Created:
                            newType = 1 /* files.FileChangeType.ADDED */;
                            break;
                        case extHostTypes_1.FileChangeType.Deleted:
                            newType = 2 /* files.FileChangeType.DELETED */;
                            break;
                        default:
                            throw new Error('Unknown FileChangeType');
                    }
                    mapped.push({ resource, type: newType });
                }
                this._proxy.$onFileSystemChange(handle, mapped);
            });
            return (0, lifecycle_1.toDisposable)(() => {
                subscription.dispose();
                this._linkProvider.delete(scheme);
                this._registeredSchemes.delete(scheme);
                this._fsProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        static _asIStat(stat) {
            const { type, ctime, mtime, size, permissions } = stat;
            return { type, ctime, mtime, size, permissions };
        }
        $stat(handle, resource) {
            return Promise.resolve(this._getFsProvider(handle).stat(uri_1.URI.revive(resource))).then(stat => ExtHostFileSystem._asIStat(stat));
        }
        $readdir(handle, resource) {
            return Promise.resolve(this._getFsProvider(handle).readDirectory(uri_1.URI.revive(resource)));
        }
        $readFile(handle, resource) {
            return Promise.resolve(this._getFsProvider(handle).readFile(uri_1.URI.revive(resource))).then(data => buffer_1.VSBuffer.wrap(data));
        }
        $writeFile(handle, resource, content, opts) {
            return Promise.resolve(this._getFsProvider(handle).writeFile(uri_1.URI.revive(resource), content.buffer, opts));
        }
        $delete(handle, resource, opts) {
            return Promise.resolve(this._getFsProvider(handle).delete(uri_1.URI.revive(resource), opts));
        }
        $rename(handle, oldUri, newUri, opts) {
            return Promise.resolve(this._getFsProvider(handle).rename(uri_1.URI.revive(oldUri), uri_1.URI.revive(newUri), opts));
        }
        $copy(handle, oldUri, newUri, opts) {
            const provider = this._getFsProvider(handle);
            if (!provider.copy) {
                throw new Error('FileSystemProvider does not implement "copy"');
            }
            return Promise.resolve(provider.copy(uri_1.URI.revive(oldUri), uri_1.URI.revive(newUri), opts));
        }
        $mkdir(handle, resource) {
            return Promise.resolve(this._getFsProvider(handle).createDirectory(uri_1.URI.revive(resource)));
        }
        $watch(handle, session, resource, opts) {
            const subscription = this._getFsProvider(handle).watch(uri_1.URI.revive(resource), opts);
            this._watches.set(session, subscription);
        }
        $unwatch(_handle, session) {
            const subscription = this._watches.get(session);
            if (subscription) {
                subscription.dispose();
                this._watches.delete(session);
            }
        }
        $open(handle, resource, opts) {
            const provider = this._getFsProvider(handle);
            if (!provider.open) {
                throw new Error('FileSystemProvider does not implement "open"');
            }
            return Promise.resolve(provider.open(uri_1.URI.revive(resource), opts));
        }
        $close(handle, fd) {
            const provider = this._getFsProvider(handle);
            if (!provider.close) {
                throw new Error('FileSystemProvider does not implement "close"');
            }
            return Promise.resolve(provider.close(fd));
        }
        $read(handle, fd, pos, length) {
            const provider = this._getFsProvider(handle);
            if (!provider.read) {
                throw new Error('FileSystemProvider does not implement "read"');
            }
            const data = buffer_1.VSBuffer.alloc(length);
            return Promise.resolve(provider.read(fd, pos, data.buffer, 0, length)).then(read => {
                return data.slice(0, read); // don't send zeros
            });
        }
        $write(handle, fd, pos, data) {
            const provider = this._getFsProvider(handle);
            if (!provider.write) {
                throw new Error('FileSystemProvider does not implement "write"');
            }
            return Promise.resolve(provider.write(fd, pos, data.buffer, 0, data.byteLength));
        }
        _getFsProvider(handle) {
            const provider = this._fsProvider.get(handle);
            if (!provider) {
                const err = new Error();
                err.name = 'ENOPRO';
                err.message = `no provider`;
                throw err;
            }
            return provider;
        }
    }
    exports.ExtHostFileSystem = ExtHostFileSystem;
});
//# sourceMappingURL=extHostFileSystem.js.map