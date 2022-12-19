/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullDiagnosticsService = exports.isRemoteDiagnosticError = exports.IDiagnosticsService = exports.ID = void 0;
    exports.ID = 'diagnosticsService';
    exports.IDiagnosticsService = (0, instantiation_1.createDecorator)(exports.ID);
    function isRemoteDiagnosticError(x) {
        return !!x.hostName && !!x.errorMessage;
    }
    exports.isRemoteDiagnosticError = isRemoteDiagnosticError;
    class NullDiagnosticsService {
        async getPerformanceInfo(mainProcessInfo, remoteInfo) {
            return {};
        }
        async getSystemInfo(mainProcessInfo, remoteInfo) {
            return {
                processArgs: 'nullProcessArgs',
                gpuStatus: 'nullGpuStatus',
                screenReader: 'nullScreenReader',
                remoteData: [],
                os: 'nullOs',
                memory: 'nullMemory',
                vmHint: 'nullVmHint',
            };
        }
        async getDiagnostics(mainProcessInfo, remoteInfo) {
            return '';
        }
        async getWorkspaceFileExtensions(workspace) {
            return { extensions: [] };
        }
        async reportWorkspaceStats(workspace) { }
    }
    exports.NullDiagnosticsService = NullDiagnosticsService;
});
//# sourceMappingURL=diagnostics.js.map