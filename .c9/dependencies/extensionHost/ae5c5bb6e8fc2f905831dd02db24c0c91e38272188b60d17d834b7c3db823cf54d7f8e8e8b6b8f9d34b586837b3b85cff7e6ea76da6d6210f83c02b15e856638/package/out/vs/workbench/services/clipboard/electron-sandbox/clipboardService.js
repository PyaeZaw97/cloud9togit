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
define(["require", "exports", "vs/platform/clipboard/common/clipboardService", "vs/base/common/uri", "vs/base/common/platform", "vs/platform/instantiation/common/extensions", "vs/platform/native/electron-sandbox/native", "vs/base/common/buffer"], function (require, exports, clipboardService_1, uri_1, platform_1, extensions_1, native_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeClipboardService = void 0;
    let NativeClipboardService = class NativeClipboardService {
        constructor(nativeHostService) {
            this.nativeHostService = nativeHostService;
        }
        async writeText(text, type) {
            return this.nativeHostService.writeClipboardText(text, type);
        }
        async readText(type) {
            return this.nativeHostService.readClipboardText(type);
        }
        async readFindText() {
            if (platform_1.isMacintosh) {
                return this.nativeHostService.readClipboardFindText();
            }
            return '';
        }
        async writeFindText(text) {
            if (platform_1.isMacintosh) {
                return this.nativeHostService.writeClipboardFindText(text);
            }
        }
        async writeResources(resources) {
            if (resources.length) {
                return this.nativeHostService.writeClipboardBuffer(NativeClipboardService.FILE_FORMAT, this.resourcesToBuffer(resources));
            }
        }
        async readResources() {
            return this.bufferToResources(await this.nativeHostService.readClipboardBuffer(NativeClipboardService.FILE_FORMAT));
        }
        async hasResources() {
            return this.nativeHostService.hasClipboard(NativeClipboardService.FILE_FORMAT);
        }
        resourcesToBuffer(resources) {
            return buffer_1.VSBuffer.fromString(resources.map(r => r.toString()).join('\n')).buffer;
        }
        bufferToResources(buffer) {
            if (!buffer) {
                return [];
            }
            const bufferValue = buffer.toString();
            if (!bufferValue) {
                return [];
            }
            try {
                return bufferValue.split('\n').map(f => uri_1.URI.parse(f));
            }
            catch (error) {
                return []; // do not trust clipboard data
            }
        }
    };
    NativeClipboardService.FILE_FORMAT = 'code/file-list'; // Clipboard format for files
    NativeClipboardService = __decorate([
        __param(0, native_1.INativeHostService)
    ], NativeClipboardService);
    exports.NativeClipboardService = NativeClipboardService;
    (0, extensions_1.registerSingleton)(clipboardService_1.IClipboardService, NativeClipboardService, true);
});
//# sourceMappingURL=clipboardService.js.map