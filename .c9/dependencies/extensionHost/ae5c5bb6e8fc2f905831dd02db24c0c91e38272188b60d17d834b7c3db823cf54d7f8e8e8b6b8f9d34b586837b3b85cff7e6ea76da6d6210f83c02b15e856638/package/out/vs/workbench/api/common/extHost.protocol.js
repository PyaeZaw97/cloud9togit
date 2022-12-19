/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/marshalling", "vs/base/common/uri", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, marshalling_1, uri_1, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostContext = exports.MainContext = exports.ExtHostTestingResource = exports.reviveWorkspaceEditDto = exports.WorkspaceEditType = exports.ISuggestResultDtoField = exports.ISuggestDataDtoField = exports.IdObject = exports.CandidatePortSource = exports.NotebookEditorRevealType = exports.CellOutputKind = exports.WebviewMessageArrayBufferViewType = exports.WebviewEditorCapabilities = exports.TabModelOperationKind = exports.TabInputKind = exports.TextEditorRevealType = void 0;
    var TextEditorRevealType;
    (function (TextEditorRevealType) {
        TextEditorRevealType[TextEditorRevealType["Default"] = 0] = "Default";
        TextEditorRevealType[TextEditorRevealType["InCenter"] = 1] = "InCenter";
        TextEditorRevealType[TextEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        TextEditorRevealType[TextEditorRevealType["AtTop"] = 3] = "AtTop";
    })(TextEditorRevealType = exports.TextEditorRevealType || (exports.TextEditorRevealType = {}));
    //#region --- tabs model
    var TabInputKind;
    (function (TabInputKind) {
        TabInputKind[TabInputKind["UnknownInput"] = 0] = "UnknownInput";
        TabInputKind[TabInputKind["TextInput"] = 1] = "TextInput";
        TabInputKind[TabInputKind["TextDiffInput"] = 2] = "TextDiffInput";
        TabInputKind[TabInputKind["NotebookInput"] = 3] = "NotebookInput";
        TabInputKind[TabInputKind["NotebookDiffInput"] = 4] = "NotebookDiffInput";
        TabInputKind[TabInputKind["CustomEditorInput"] = 5] = "CustomEditorInput";
        TabInputKind[TabInputKind["WebviewEditorInput"] = 6] = "WebviewEditorInput";
        TabInputKind[TabInputKind["TerminalEditorInput"] = 7] = "TerminalEditorInput";
    })(TabInputKind = exports.TabInputKind || (exports.TabInputKind = {}));
    var TabModelOperationKind;
    (function (TabModelOperationKind) {
        TabModelOperationKind[TabModelOperationKind["TAB_OPEN"] = 0] = "TAB_OPEN";
        TabModelOperationKind[TabModelOperationKind["TAB_CLOSE"] = 1] = "TAB_CLOSE";
        TabModelOperationKind[TabModelOperationKind["TAB_UPDATE"] = 2] = "TAB_UPDATE";
        TabModelOperationKind[TabModelOperationKind["TAB_MOVE"] = 3] = "TAB_MOVE";
    })(TabModelOperationKind = exports.TabModelOperationKind || (exports.TabModelOperationKind = {}));
    var WebviewEditorCapabilities;
    (function (WebviewEditorCapabilities) {
        WebviewEditorCapabilities[WebviewEditorCapabilities["Editable"] = 0] = "Editable";
        WebviewEditorCapabilities[WebviewEditorCapabilities["SupportsHotExit"] = 1] = "SupportsHotExit";
    })(WebviewEditorCapabilities = exports.WebviewEditorCapabilities || (exports.WebviewEditorCapabilities = {}));
    var WebviewMessageArrayBufferViewType;
    (function (WebviewMessageArrayBufferViewType) {
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Int8Array"] = 1] = "Int8Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Uint8Array"] = 2] = "Uint8Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Uint8ClampedArray"] = 3] = "Uint8ClampedArray";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Int16Array"] = 4] = "Int16Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Uint16Array"] = 5] = "Uint16Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Int32Array"] = 6] = "Int32Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Uint32Array"] = 7] = "Uint32Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Float32Array"] = 8] = "Float32Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["Float64Array"] = 9] = "Float64Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["BigInt64Array"] = 10] = "BigInt64Array";
        WebviewMessageArrayBufferViewType[WebviewMessageArrayBufferViewType["BigUint64Array"] = 11] = "BigUint64Array";
    })(WebviewMessageArrayBufferViewType = exports.WebviewMessageArrayBufferViewType || (exports.WebviewMessageArrayBufferViewType = {}));
    var CellOutputKind;
    (function (CellOutputKind) {
        CellOutputKind[CellOutputKind["Text"] = 1] = "Text";
        CellOutputKind[CellOutputKind["Error"] = 2] = "Error";
        CellOutputKind[CellOutputKind["Rich"] = 3] = "Rich";
    })(CellOutputKind = exports.CellOutputKind || (exports.CellOutputKind = {}));
    var NotebookEditorRevealType;
    (function (NotebookEditorRevealType) {
        NotebookEditorRevealType[NotebookEditorRevealType["Default"] = 0] = "Default";
        NotebookEditorRevealType[NotebookEditorRevealType["InCenter"] = 1] = "InCenter";
        NotebookEditorRevealType[NotebookEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        NotebookEditorRevealType[NotebookEditorRevealType["AtTop"] = 3] = "AtTop";
    })(NotebookEditorRevealType = exports.NotebookEditorRevealType || (exports.NotebookEditorRevealType = {}));
    var CandidatePortSource;
    (function (CandidatePortSource) {
        CandidatePortSource[CandidatePortSource["None"] = 0] = "None";
        CandidatePortSource[CandidatePortSource["Process"] = 1] = "Process";
        CandidatePortSource[CandidatePortSource["Output"] = 2] = "Output";
    })(CandidatePortSource = exports.CandidatePortSource || (exports.CandidatePortSource = {}));
    class IdObject {
        static mixin(object) {
            object._id = IdObject._n++;
            return object;
        }
    }
    exports.IdObject = IdObject;
    IdObject._n = 0;
    var ISuggestDataDtoField;
    (function (ISuggestDataDtoField) {
        ISuggestDataDtoField["label"] = "a";
        ISuggestDataDtoField["kind"] = "b";
        ISuggestDataDtoField["detail"] = "c";
        ISuggestDataDtoField["documentation"] = "d";
        ISuggestDataDtoField["sortText"] = "e";
        ISuggestDataDtoField["filterText"] = "f";
        ISuggestDataDtoField["preselect"] = "g";
        ISuggestDataDtoField["insertText"] = "h";
        ISuggestDataDtoField["insertTextRules"] = "i";
        ISuggestDataDtoField["range"] = "j";
        ISuggestDataDtoField["commitCharacters"] = "k";
        ISuggestDataDtoField["additionalTextEdits"] = "l";
        ISuggestDataDtoField["command"] = "m";
        ISuggestDataDtoField["kindModifier"] = "n";
    })(ISuggestDataDtoField = exports.ISuggestDataDtoField || (exports.ISuggestDataDtoField = {}));
    var ISuggestResultDtoField;
    (function (ISuggestResultDtoField) {
        ISuggestResultDtoField["defaultRanges"] = "a";
        ISuggestResultDtoField["completions"] = "b";
        ISuggestResultDtoField["isIncomplete"] = "c";
        ISuggestResultDtoField["duration"] = "d";
    })(ISuggestResultDtoField = exports.ISuggestResultDtoField || (exports.ISuggestResultDtoField = {}));
    var WorkspaceEditType;
    (function (WorkspaceEditType) {
        WorkspaceEditType[WorkspaceEditType["File"] = 1] = "File";
        WorkspaceEditType[WorkspaceEditType["Text"] = 2] = "Text";
        WorkspaceEditType[WorkspaceEditType["Cell"] = 3] = "Cell";
    })(WorkspaceEditType = exports.WorkspaceEditType || (exports.WorkspaceEditType = {}));
    function reviveWorkspaceEditDto(data) {
        if (data && data.edits) {
            for (const edit of data.edits) {
                if (typeof edit.resource === 'object') {
                    edit.resource = uri_1.URI.revive(edit.resource);
                }
                else {
                    edit.newUri = uri_1.URI.revive(edit.newUri);
                    edit.oldUri = uri_1.URI.revive(edit.oldUri);
                }
                if (edit.metadata && edit.metadata.iconPath) {
                    edit.metadata = (0, marshalling_1.revive)(edit.metadata);
                }
            }
        }
        return data;
    }
    exports.reviveWorkspaceEditDto = reviveWorkspaceEditDto;
    var ExtHostTestingResource;
    (function (ExtHostTestingResource) {
        ExtHostTestingResource[ExtHostTestingResource["Workspace"] = 0] = "Workspace";
        ExtHostTestingResource[ExtHostTestingResource["TextDocument"] = 1] = "TextDocument";
    })(ExtHostTestingResource = exports.ExtHostTestingResource || (exports.ExtHostTestingResource = {}));
    // --- proxy identifiers
    exports.MainContext = {
        MainThreadAuthentication: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadAuthentication'),
        MainThreadBulkEdits: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadBulkEdits'),
        MainThreadClipboard: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadClipboard'),
        MainThreadCommands: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadCommands'),
        MainThreadComments: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadComments'),
        MainThreadConfiguration: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadConfiguration'),
        MainThreadConsole: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadConsole'),
        MainThreadDebugService: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadDebugService'),
        MainThreadDecorations: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadDecorations'),
        MainThreadDiagnostics: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadDiagnostics'),
        MainThreadDialogs: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadDiaglogs'),
        MainThreadDocuments: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadDocuments'),
        MainThreadDocumentContentProviders: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadDocumentContentProviders'),
        MainThreadTextEditors: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTextEditors'),
        MainThreadEditorInsets: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadEditorInsets'),
        MainThreadEditorTabs: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadEditorTabs'),
        MainThreadErrors: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadErrors'),
        MainThreadTreeViews: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTreeViews'),
        MainThreadDownloadService: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadDownloadService'),
        MainThreadKeytar: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadKeytar'),
        MainThreadLanguageFeatures: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadLanguageFeatures'),
        MainThreadLanguages: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadLanguages'),
        MainThreadLogger: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadLogger'),
        MainThreadMessageService: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadMessageService'),
        MainThreadOutputService: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadOutputService'),
        MainThreadProgress: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadProgress'),
        MainThreadQuickOpen: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadQuickOpen'),
        MainThreadStatusBar: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadStatusBar'),
        MainThreadSecretState: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadSecretState'),
        MainThreadStorage: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadStorage'),
        MainThreadTelemetry: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTelemetry'),
        MainThreadTerminalService: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTerminalService'),
        MainThreadWebviews: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadWebviews'),
        MainThreadWebviewPanels: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadWebviewPanels'),
        MainThreadWebviewViews: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadWebviewViews'),
        MainThreadCustomEditors: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadCustomEditors'),
        MainThreadUrls: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadUrls'),
        MainThreadUriOpeners: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadUriOpeners'),
        MainThreadWorkspace: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadWorkspace'),
        MainThreadFileSystem: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadFileSystem'),
        MainThreadExtensionService: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadExtensionService'),
        MainThreadSCM: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadSCM'),
        MainThreadSearch: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadSearch'),
        MainThreadTask: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTask'),
        MainThreadWindow: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadWindow'),
        MainThreadLabelService: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadLabelService'),
        MainThreadNotebook: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadNotebook'),
        MainThreadNotebookDocuments: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadNotebookDocumentsShape'),
        MainThreadNotebookEditors: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadNotebookEditorsShape'),
        MainThreadNotebookKernels: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadNotebookKernels'),
        MainThreadNotebookProxyKernels: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadNotebookProxyKernels'),
        MainThreadNotebookRenderers: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadNotebookRenderers'),
        MainThreadInteractive: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadInteractive'),
        MainThreadTheming: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTheming'),
        MainThreadTunnelService: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTunnelService'),
        MainThreadTimeline: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTimeline'),
        MainThreadTesting: (0, proxyIdentifier_1.createProxyIdentifier)('MainThreadTesting'),
    };
    exports.ExtHostContext = {
        ExtHostCommands: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostCommands'),
        ExtHostConfiguration: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostConfiguration'),
        ExtHostDiagnostics: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostDiagnostics'),
        ExtHostDebugService: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostDebugService'),
        ExtHostDecorations: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostDecorations'),
        ExtHostDocumentsAndEditors: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostDocumentsAndEditors'),
        ExtHostDocuments: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostDocuments'),
        ExtHostDocumentContentProviders: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostDocumentContentProviders'),
        ExtHostDocumentSaveParticipant: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostDocumentSaveParticipant'),
        ExtHostEditors: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostEditors'),
        ExtHostTreeViews: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostTreeViews'),
        ExtHostFileSystem: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostFileSystem'),
        ExtHostFileSystemInfo: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostFileSystemInfo'),
        ExtHostFileSystemEventService: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostFileSystemEventService'),
        ExtHostLanguages: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostLanguages'),
        ExtHostLanguageFeatures: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostLanguageFeatures'),
        ExtHostQuickOpen: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostQuickOpen'),
        ExtHostExtensionService: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostExtensionService'),
        ExtHostLogLevelServiceShape: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostLogLevelServiceShape'),
        ExtHostTerminalService: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostTerminalService'),
        ExtHostSCM: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostSCM'),
        ExtHostSearch: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostSearch'),
        ExtHostTask: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostTask'),
        ExtHostWorkspace: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostWorkspace'),
        ExtHostWindow: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostWindow'),
        ExtHostWebviews: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostWebviews'),
        ExtHostWebviewPanels: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostWebviewPanels'),
        ExtHostCustomEditors: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostCustomEditors'),
        ExtHostWebviewViews: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostWebviewViews'),
        ExtHostEditorInsets: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostEditorInsets'),
        ExtHostEditorTabs: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostEditorTabs'),
        ExtHostProgress: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostProgress'),
        ExtHostComments: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostComments'),
        ExtHostSecretState: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostSecretState'),
        ExtHostStorage: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostStorage'),
        ExtHostUrls: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostUrls'),
        ExtHostUriOpeners: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostUriOpeners'),
        ExtHostOutputService: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostOutputService'),
        ExtHosLabelService: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostLabelService'),
        ExtHostNotebook: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostNotebook'),
        ExtHostNotebookDocuments: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostNotebookDocuments'),
        ExtHostNotebookEditors: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostNotebookEditors'),
        ExtHostNotebookKernels: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostNotebookKernels'),
        ExtHostNotebookProxyKernels: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostNotebookProxyKernels'),
        ExtHostNotebookRenderers: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostNotebookRenderers'),
        ExtHostInteractive: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostInteractive'),
        ExtHostTheming: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostTheming'),
        ExtHostTunnelService: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostTunnelService'),
        ExtHostAuthentication: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostAuthentication'),
        ExtHostTimeline: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostTimeline'),
        ExtHostTesting: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostTesting'),
        ExtHostTelemetry: (0, proxyIdentifier_1.createProxyIdentifier)('ExtHostTelemetry'),
    };
});
//# sourceMappingURL=extHost.protocol.js.map