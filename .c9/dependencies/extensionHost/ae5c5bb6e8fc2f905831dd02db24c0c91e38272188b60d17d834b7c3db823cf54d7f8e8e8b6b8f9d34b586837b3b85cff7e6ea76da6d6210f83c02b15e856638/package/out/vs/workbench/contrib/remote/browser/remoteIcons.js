/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.forwardedPortWithProcessIcon = exports.forwardedPortWithoutProcessIcon = exports.labelPortIcon = exports.copyAddressIcon = exports.openPreviewIcon = exports.openBrowserIcon = exports.stopForwardIcon = exports.forwardPortIcon = exports.privatePortIcon = exports.portIcon = exports.portsViewIcon = exports.remoteExplorerViewIcon = exports.reportIssuesIcon = exports.reviewIssuesIcon = exports.feedbackIcon = exports.documentationIcon = exports.getStartedIcon = void 0;
    exports.getStartedIcon = (0, iconRegistry_1.registerIcon)('remote-explorer-get-started', codicons_1.Codicon.star, nls.localize('getStartedIcon', 'Getting started icon in the remote explorer view.'));
    exports.documentationIcon = (0, iconRegistry_1.registerIcon)('remote-explorer-documentation', codicons_1.Codicon.book, nls.localize('documentationIcon', 'Documentation icon in the remote explorer view.'));
    exports.feedbackIcon = (0, iconRegistry_1.registerIcon)('remote-explorer-feedback', codicons_1.Codicon.twitter, nls.localize('feedbackIcon', 'Feedback icon in the remote explorer view.'));
    exports.reviewIssuesIcon = (0, iconRegistry_1.registerIcon)('remote-explorer-review-issues', codicons_1.Codicon.issues, nls.localize('reviewIssuesIcon', 'Review issue icon in the remote explorer view.'));
    exports.reportIssuesIcon = (0, iconRegistry_1.registerIcon)('remote-explorer-report-issues', codicons_1.Codicon.comment, nls.localize('reportIssuesIcon', 'Report issue icon in the remote explorer view.'));
    exports.remoteExplorerViewIcon = (0, iconRegistry_1.registerIcon)('remote-explorer-view-icon', codicons_1.Codicon.remoteExplorer, nls.localize('remoteExplorerViewIcon', 'View icon of the remote explorer view.'));
    exports.portsViewIcon = (0, iconRegistry_1.registerIcon)('ports-view-icon', codicons_1.Codicon.plug, nls.localize('portsViewIcon', 'View icon of the remote ports view.'));
    exports.portIcon = (0, iconRegistry_1.registerIcon)('ports-view-icon', codicons_1.Codicon.plug, nls.localize('portIcon', 'Icon representing a remote port.'));
    exports.privatePortIcon = (0, iconRegistry_1.registerIcon)('private-ports-view-icon', codicons_1.Codicon.lock, nls.localize('privatePortIcon', 'Icon representing a private remote port.'));
    exports.forwardPortIcon = (0, iconRegistry_1.registerIcon)('ports-forward-icon', codicons_1.Codicon.plus, nls.localize('forwardPortIcon', 'Icon for the forward action.'));
    exports.stopForwardIcon = (0, iconRegistry_1.registerIcon)('ports-stop-forward-icon', codicons_1.Codicon.x, nls.localize('stopForwardIcon', 'Icon for the stop forwarding action.'));
    exports.openBrowserIcon = (0, iconRegistry_1.registerIcon)('ports-open-browser-icon', codicons_1.Codicon.globe, nls.localize('openBrowserIcon', 'Icon for the open browser action.'));
    exports.openPreviewIcon = (0, iconRegistry_1.registerIcon)('ports-open-preview-icon', codicons_1.Codicon.openPreview, nls.localize('openPreviewIcon', 'Icon for the open preview action.'));
    exports.copyAddressIcon = (0, iconRegistry_1.registerIcon)('ports-copy-address-icon', codicons_1.Codicon.clippy, nls.localize('copyAddressIcon', 'Icon for the copy local address action.'));
    exports.labelPortIcon = (0, iconRegistry_1.registerIcon)('ports-label-icon', codicons_1.Codicon.tag, nls.localize('labelPortIcon', 'Icon for the label port action.'));
    exports.forwardedPortWithoutProcessIcon = (0, iconRegistry_1.registerIcon)('ports-forwarded-without-process-icon', codicons_1.Codicon.circleOutline, nls.localize('forwardedPortWithoutProcessIcon', 'Icon for forwarded ports that don\'t have a running process.'));
    exports.forwardedPortWithProcessIcon = (0, iconRegistry_1.registerIcon)('ports-forwarded-with-process-icon', codicons_1.Codicon.circleFilled, nls.localize('forwardedPortWithProcessIcon', 'Icon for forwarded ports that do have a running process.'));
});
//# sourceMappingURL=remoteIcons.js.map