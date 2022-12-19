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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/base/common/types", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/objects", "./extHost.protocol", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/base/common/marshalling", "vs/editor/common/core/range", "vs/editor/common/core/position", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTestItem", "vs/base/common/buffer", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/base/common/errorMessage"], function (require, exports, types_1, extHostTypes, extHostTypeConverter, objects_1, extHost_protocol_1, arrays_1, log_1, marshalling_1, range_1, position_1, uri_1, lifecycle_1, instantiation_1, extHostRpcService_1, extHostTestItem_1, buffer_1, proxyIdentifier_1, errorMessage_1) {
    "use strict";
    var _ExtHostCommands_proxy, _ExtHostCommands_telemetry;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApiCommand = exports.ApiCommandResult = exports.ApiCommandArgument = exports.CommandsConverter = exports.IExtHostCommands = exports.ExtHostCommands = void 0;
    let ExtHostCommands = class ExtHostCommands {
        constructor(extHostRpc, logService) {
            _ExtHostCommands_proxy.set(this, void 0);
            this._commands = new Map();
            this._apiCommands = new Map();
            _ExtHostCommands_telemetry.set(this, void 0);
            __classPrivateFieldSet(this, _ExtHostCommands_proxy, extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadCommands), "f");
            this._logService = logService;
            __classPrivateFieldSet(this, _ExtHostCommands_telemetry, extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry), "f");
            this.converter = new CommandsConverter(this, id => {
                // API commands that have no return type (void) can be
                // converted to their internal command and don't need
                // any indirection commands
                const candidate = this._apiCommands.get(id);
                return (candidate === null || candidate === void 0 ? void 0 : candidate.result) === ApiCommandResult.Void
                    ? candidate : undefined;
            }, logService);
            this._argumentProcessors = [
                {
                    processArgument(a) {
                        // URI, Regex
                        return (0, marshalling_1.revive)(a);
                    }
                },
                {
                    processArgument(arg) {
                        return (0, objects_1.cloneAndChange)(arg, function (obj) {
                            // Reverse of https://github.com/microsoft/vscode/blob/1f28c5fc681f4c01226460b6d1c7e91b8acb4a5b/src/vs/workbench/api/node/extHostCommands.ts#L112-L127
                            if (range_1.Range.isIRange(obj)) {
                                return extHostTypeConverter.Range.to(obj);
                            }
                            if (position_1.Position.isIPosition(obj)) {
                                return extHostTypeConverter.Position.to(obj);
                            }
                            if (range_1.Range.isIRange(obj.range) && uri_1.URI.isUri(obj.uri)) {
                                return extHostTypeConverter.location.to(obj);
                            }
                            if (obj instanceof buffer_1.VSBuffer) {
                                return obj.buffer.buffer;
                            }
                            if (!Array.isArray(obj)) {
                                return obj;
                            }
                        });
                    }
                }
            ];
        }
        registerArgumentProcessor(processor) {
            this._argumentProcessors.push(processor);
        }
        registerApiCommand(apiCommand) {
            const registration = this.registerCommand(false, apiCommand.id, async (...apiArgs) => {
                const internalArgs = apiCommand.args.map((arg, i) => {
                    if (!arg.validate(apiArgs[i])) {
                        throw new Error(`Invalid argument '${arg.name}' when running '${apiCommand.id}', received: ${apiArgs[i]}`);
                    }
                    return arg.convert(apiArgs[i]);
                });
                const internalResult = await this.executeCommand(apiCommand.internalId, ...internalArgs);
                return apiCommand.result.convert(internalResult, apiArgs, this.converter);
            }, undefined, {
                description: apiCommand.description,
                args: apiCommand.args,
                returns: apiCommand.result.description
            });
            this._apiCommands.set(apiCommand.id, apiCommand);
            return new extHostTypes.Disposable(() => {
                registration.dispose();
                this._apiCommands.delete(apiCommand.id);
            });
        }
        registerCommand(global, id, callback, thisArg, description, extension) {
            this._logService.trace('ExtHostCommands#registerCommand', id);
            if (!id.trim().length) {
                throw new Error('invalid id');
            }
            if (this._commands.has(id)) {
                throw new Error(`command '${id}' already exists`);
            }
            this._commands.set(id, { callback, thisArg, description, extension });
            if (global) {
                __classPrivateFieldGet(this, _ExtHostCommands_proxy, "f").$registerCommand(id);
            }
            return new extHostTypes.Disposable(() => {
                if (this._commands.delete(id)) {
                    if (global) {
                        __classPrivateFieldGet(this, _ExtHostCommands_proxy, "f").$unregisterCommand(id);
                    }
                }
            });
        }
        executeCommand(id, ...args) {
            this._logService.trace('ExtHostCommands#executeCommand', id);
            return this._doExecuteCommand(id, args, true);
        }
        async _doExecuteCommand(id, args, retry) {
            if (this._commands.has(id)) {
                // we stay inside the extension host and support
                // to pass any kind of parameters around
                return this._executeContributedCommand(id, args, false);
            }
            else {
                // automagically convert some argument types
                let hasBuffers = false;
                const toArgs = (0, objects_1.cloneAndChange)(args, function (value) {
                    if (value instanceof extHostTypes.Position) {
                        return extHostTypeConverter.Position.from(value);
                    }
                    else if (value instanceof extHostTypes.Range) {
                        return extHostTypeConverter.Range.from(value);
                    }
                    else if (value instanceof extHostTypes.Location) {
                        return extHostTypeConverter.location.from(value);
                    }
                    else if (extHostTypes.NotebookRange.isNotebookRange(value)) {
                        return extHostTypeConverter.NotebookRange.from(value);
                    }
                    else if (value instanceof ArrayBuffer) {
                        hasBuffers = true;
                        return buffer_1.VSBuffer.wrap(new Uint8Array(value));
                    }
                    else if (value instanceof Uint8Array) {
                        hasBuffers = true;
                        return buffer_1.VSBuffer.wrap(value);
                    }
                    else if (value instanceof buffer_1.VSBuffer) {
                        hasBuffers = true;
                        return value;
                    }
                    if (!Array.isArray(value)) {
                        return value;
                    }
                });
                try {
                    const result = await __classPrivateFieldGet(this, _ExtHostCommands_proxy, "f").$executeCommand(id, hasBuffers ? new proxyIdentifier_1.SerializableObjectWithBuffers(toArgs) : toArgs, retry);
                    return (0, marshalling_1.revive)(result);
                }
                catch (e) {
                    // Rerun the command when it wasn't known, had arguments, and when retry
                    // is enabled. We do this because the command might be registered inside
                    // the extension host now and can therfore accept the arguments as-is.
                    if (e instanceof Error && e.message === '$executeCommand:retry') {
                        return this._doExecuteCommand(id, args, false);
                    }
                    else {
                        throw e;
                    }
                }
            }
        }
        async _executeContributedCommand(id, args, annotateError) {
            var _a;
            const command = this._commands.get(id);
            if (!command) {
                throw new Error('Unknown command');
            }
            this._reportTelemetry(command, id);
            let { callback, thisArg, description } = command;
            if (description) {
                for (let i = 0; i < description.args.length; i++) {
                    try {
                        (0, types_1.validateConstraint)(args[i], description.args[i].constraint);
                    }
                    catch (err) {
                        throw new Error(`Running the contributed command: '${id}' failed. Illegal argument '${description.args[i].name}' - ${description.args[i].description}`);
                    }
                }
            }
            try {
                return await callback.apply(thisArg, args);
            }
            catch (err) {
                // The indirection-command from the converter can fail when invoking the actual
                // command and in that case it is better to blame the correct command
                if (id === this.converter.delegatingCommandId) {
                    const actual = this.converter.getActualCommand(...args);
                    if (actual) {
                        id = actual.command;
                    }
                }
                this._logService.error(err, id, (_a = command.extension) === null || _a === void 0 ? void 0 : _a.identifier);
                if (!annotateError) {
                    throw err;
                }
                throw new class CommandError extends Error {
                    constructor() {
                        var _a, _b, _c;
                        super((0, errorMessage_1.toErrorMessage)(err));
                        this.id = id;
                        this.source = (_b = (_a = command.extension) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : (_c = command.extension) === null || _c === void 0 ? void 0 : _c.name;
                    }
                };
            }
        }
        _reportTelemetry(command, id) {
            if (!command.extension || command.extension.isBuiltin) {
                return;
            }
            __classPrivateFieldGet(this, _ExtHostCommands_telemetry, "f").$publicLog2('Extension:ActionExecuted', {
                extensionId: command.extension.identifier.value,
                id: id,
            });
        }
        $executeContributedCommand(id, ...args) {
            this._logService.trace('ExtHostCommands#$executeContributedCommand', id);
            if (!this._commands.has(id)) {
                return Promise.reject(new Error(`Contributed command '${id}' does not exist.`));
            }
            else {
                args = args.map(arg => this._argumentProcessors.reduce((r, p) => p.processArgument(r), arg));
                return this._executeContributedCommand(id, args, true);
            }
        }
        getCommands(filterUnderscoreCommands = false) {
            this._logService.trace('ExtHostCommands#getCommands', filterUnderscoreCommands);
            return __classPrivateFieldGet(this, _ExtHostCommands_proxy, "f").$getCommands().then(result => {
                if (filterUnderscoreCommands) {
                    result = result.filter(command => command[0] !== '_');
                }
                return result;
            });
        }
        $getContributedCommandHandlerDescriptions() {
            const result = Object.create(null);
            for (let [id, command] of this._commands) {
                let { description } = command;
                if (description) {
                    result[id] = description;
                }
            }
            return Promise.resolve(result);
        }
    };
    _ExtHostCommands_proxy = new WeakMap(), _ExtHostCommands_telemetry = new WeakMap();
    ExtHostCommands = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostCommands);
    exports.ExtHostCommands = ExtHostCommands;
    exports.IExtHostCommands = (0, instantiation_1.createDecorator)('IExtHostCommands');
    class CommandsConverter {
        // --- conversion between internal and api commands
        constructor(_commands, _lookupApiCommand, _logService) {
            this._commands = _commands;
            this._lookupApiCommand = _lookupApiCommand;
            this._logService = _logService;
            this.delegatingCommandId = `_vscode_delegate_cmd_${Date.now().toString(36)}`;
            this._cache = new Map();
            this._cachIdPool = 0;
            this._commands.registerCommand(true, this.delegatingCommandId, this._executeConvertedCommand, this);
        }
        toInternal(command, disposables) {
            if (!command) {
                return undefined;
            }
            const result = {
                $ident: undefined,
                id: command.command,
                title: command.title,
                tooltip: command.tooltip
            };
            if (!command.command) {
                // falsy command id -> return converted command but don't attempt any
                // argument or API-command dance since this command won't run anyways
                return result;
            }
            const apiCommand = this._lookupApiCommand(command.command);
            if (apiCommand) {
                // API command with return-value can be converted inplace
                result.id = apiCommand.internalId;
                result.arguments = apiCommand.args.map((arg, i) => arg.convert(command.arguments && command.arguments[i]));
            }
            else if ((0, arrays_1.isNonEmptyArray)(command.arguments)) {
                // we have a contributed command with arguments. that
                // means we don't want to send the arguments around
                const id = ++this._cachIdPool;
                this._cache.set(id, command);
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    this._cache.delete(id);
                    this._logService.trace('CommandsConverter#DISPOSE', id);
                }));
                result.$ident = id;
                result.id = this.delegatingCommandId;
                result.arguments = [id];
                this._logService.trace('CommandsConverter#CREATE', command.command, id);
            }
            return result;
        }
        fromInternal(command) {
            if (typeof command.$ident === 'number') {
                return this._cache.get(command.$ident);
            }
            else {
                return {
                    command: command.id,
                    title: command.title,
                    arguments: command.arguments
                };
            }
        }
        getActualCommand(...args) {
            return this._cache.get(args[0]);
        }
        _executeConvertedCommand(...args) {
            const actualCmd = this.getActualCommand(...args);
            this._logService.trace('CommandsConverter#EXECUTE', args[0], actualCmd ? actualCmd.command : 'MISSING');
            if (!actualCmd) {
                return Promise.reject('actual command NOT FOUND');
            }
            return this._commands.executeCommand(actualCmd.command, ...(actualCmd.arguments || []));
        }
    }
    exports.CommandsConverter = CommandsConverter;
    class ApiCommandArgument {
        constructor(name, description, validate, convert) {
            this.name = name;
            this.description = description;
            this.validate = validate;
            this.convert = convert;
        }
        optional() {
            return new ApiCommandArgument(this.name, `(optional) ${this.description}`, value => value === undefined || value === null || this.validate(value), value => value === undefined ? undefined : value === null ? null : this.convert(value));
        }
        with(name, description) {
            return new ApiCommandArgument(name !== null && name !== void 0 ? name : this.name, description !== null && description !== void 0 ? description : this.description, this.validate, this.convert);
        }
    }
    exports.ApiCommandArgument = ApiCommandArgument;
    ApiCommandArgument.Uri = new ApiCommandArgument('uri', 'Uri of a text document', v => uri_1.URI.isUri(v), v => v);
    ApiCommandArgument.Position = new ApiCommandArgument('position', 'A position in a text document', v => extHostTypes.Position.isPosition(v), extHostTypeConverter.Position.from);
    ApiCommandArgument.Range = new ApiCommandArgument('range', 'A range in a text document', v => extHostTypes.Range.isRange(v), extHostTypeConverter.Range.from);
    ApiCommandArgument.Selection = new ApiCommandArgument('selection', 'A selection in a text document', v => extHostTypes.Selection.isSelection(v), extHostTypeConverter.Selection.from);
    ApiCommandArgument.Number = new ApiCommandArgument('number', '', v => typeof v === 'number', v => v);
    ApiCommandArgument.String = new ApiCommandArgument('string', '', v => typeof v === 'string', v => v);
    ApiCommandArgument.CallHierarchyItem = new ApiCommandArgument('item', 'A call hierarchy item', v => v instanceof extHostTypes.CallHierarchyItem, extHostTypeConverter.CallHierarchyItem.from);
    ApiCommandArgument.TypeHierarchyItem = new ApiCommandArgument('item', 'A type hierarchy item', v => v instanceof extHostTypes.TypeHierarchyItem, extHostTypeConverter.TypeHierarchyItem.from);
    ApiCommandArgument.TestItem = new ApiCommandArgument('testItem', 'A VS Code TestItem', v => v instanceof extHostTestItem_1.TestItemImpl, extHostTypeConverter.TestItem.from);
    class ApiCommandResult {
        constructor(description, convert) {
            this.description = description;
            this.convert = convert;
        }
    }
    exports.ApiCommandResult = ApiCommandResult;
    ApiCommandResult.Void = new ApiCommandResult('no result', v => v);
    class ApiCommand {
        constructor(id, internalId, description, args, result) {
            this.id = id;
            this.internalId = internalId;
            this.description = description;
            this.args = args;
            this.result = result;
        }
    }
    exports.ApiCommand = ApiCommand;
});
//# sourceMappingURL=extHostCommands.js.map