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
define(["require", "exports", "fs", "./extHost.protocol", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/path", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/services/output/common/output", "vs/workbench/api/common/extHostInitDataService", "vs/base/common/date", "vs/base/common/buffer", "vs/base/common/types", "util", "vs/platform/log/node/spdlogLog"], function (require, exports, fs, extHost_protocol_1, uri_1, lifecycle_1, path_1, instantiation_1, extHostRpcService_1, output_1, extHostInitDataService_1, date_1, buffer_1, types_1, util_1, spdlogLog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostOutputService = exports.ExtHostOutputService = exports.ExtHostOutputChannel = void 0;
    class ExtHostOutputChannel extends lifecycle_1.Disposable {
        constructor(id, name, logger, proxy) {
            super();
            this.id = id;
            this.name = name;
            this.logger = logger;
            this.proxy = proxy;
            this.offset = 0;
            this.visible = false;
            this._disposed = false;
        }
        get disposed() { return this._disposed; }
        appendLine(value) {
            this.append(value + '\n');
        }
        append(value) {
            this.write(value);
            if (this.visible) {
                this.proxy.$update(this.id, output_1.OutputChannelUpdateMode.Append);
            }
        }
        clear() {
            const till = this.offset;
            this.proxy.$update(this.id, output_1.OutputChannelUpdateMode.Clear, till);
        }
        replace(value) {
            const till = this.offset;
            this.write(value);
            this.proxy.$update(this.id, output_1.OutputChannelUpdateMode.Replace, till);
        }
        show(columnOrPreserveFocus, preserveFocus) {
            this.proxy.$reveal(this.id, !!(typeof columnOrPreserveFocus === 'boolean' ? columnOrPreserveFocus : preserveFocus));
        }
        hide() {
            this.proxy.$close(this.id);
        }
        write(value) {
            this.offset += buffer_1.VSBuffer.fromString(value).byteLength;
            this.logger.info(value);
        }
        dispose() {
            super.dispose();
            if (!this._disposed) {
                this.proxy.$dispose(this.id);
                this._disposed = true;
            }
        }
    }
    exports.ExtHostOutputChannel = ExtHostOutputChannel;
    let ExtHostOutputService = class ExtHostOutputService {
        constructor(extHostRpc, initData) {
            this.namePool = 1;
            this.channels = new Map();
            this.visibleChannelId = null;
            this.proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadOutputService);
            this.outputsLocation = (0, path_1.join)(initData.logsLocation.fsPath, `output_logging_${(0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '')}`);
        }
        $setVisibleChannel(visibleChannelId) {
            this.visibleChannelId = visibleChannelId;
            for (const [id, channel] of this.channels) {
                channel.visible = id === this.visibleChannelId;
            }
        }
        createOutputChannel(name, languageId, extension) {
            name = name.trim();
            if (!name) {
                throw new Error('illegal argument `name`. must not be falsy');
            }
            if ((0, types_1.isString)(languageId) && !languageId.trim()) {
                throw new Error('illegal argument `languageId`. must not be empty');
            }
            const extHostOutputChannel = this.doCreateOutputChannel(name, languageId, extension);
            extHostOutputChannel.then(channel => {
                this.channels.set(channel.id, channel);
                channel.visible = channel.id === this.visibleChannelId;
            });
            return this.createExtHostOutputChannel(name, extHostOutputChannel);
        }
        async doCreateOutputChannel(name, languageId, extension) {
            await this.createOutputDirectory();
            const fileName = `${this.namePool++}-${name.replace(/[\\/:\*\?"<>\|]/g, '')}`;
            const file = uri_1.URI.file((0, path_1.join)(this.outputsLocation, `${fileName}.log`));
            const logger = new spdlogLog_1.WinstonRotatingLogger(fileName, file.fsPath, 1024 * 1024 * 30, 1);
            const id = await this.proxy.$register(name, false, file, languageId, extension.identifier.value);
            return new ExtHostOutputChannel(id, name, logger, this.proxy);
        }
        async createOutputDirectory() {
            const dirExists = async (path) => {
                try {
                    const fileStat = await (0, util_1.promisify)(fs.stat)(path);
                    return fileStat.isDirectory();
                }
                catch (error) {
                    return false;
                }
            };
            const exists = await dirExists(this.outputsLocation);
            if (!exists) {
                await (0, util_1.promisify)(fs.mkdir)(this.outputsLocation, { recursive: true });
            }
        }
        createExtHostOutputChannel(name, channelPromise) {
            let disposed = false;
            const validate = () => {
                if (disposed) {
                    throw new Error('Channel has been closed');
                }
            };
            return {
                get name() { return name; },
                append(value) {
                    validate();
                    channelPromise.then(channel => channel.append(value));
                },
                appendLine(value) {
                    validate();
                    channelPromise.then(channel => channel.appendLine(value));
                },
                clear() {
                    validate();
                    channelPromise.then(channel => channel.clear());
                },
                replace(value) {
                    validate();
                    channelPromise.then(channel => channel.replace(value));
                },
                show(columnOrPreserveFocus, preserveFocus) {
                    validate();
                    channelPromise.then(channel => channel.show(columnOrPreserveFocus, preserveFocus));
                },
                hide() {
                    validate();
                    channelPromise.then(channel => channel.hide());
                },
                dispose() {
                    disposed = true;
                    channelPromise.then(channel => channel.dispose());
                }
            };
        }
    };
    ExtHostOutputService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostOutputService);
    exports.ExtHostOutputService = ExtHostOutputService;
    exports.IExtHostOutputService = (0, instantiation_1.createDecorator)('IExtHostOutputService');
});
//# sourceMappingURL=extHostOutput.js.map