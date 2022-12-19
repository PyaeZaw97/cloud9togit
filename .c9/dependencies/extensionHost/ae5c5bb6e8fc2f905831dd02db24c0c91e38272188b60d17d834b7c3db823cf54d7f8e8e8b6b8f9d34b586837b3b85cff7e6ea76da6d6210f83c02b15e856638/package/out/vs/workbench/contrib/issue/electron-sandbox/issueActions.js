/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/services/issue/common/issue"], function (require, exports, nls_1, actions_1, actions_2, issue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReportPerformanceIssueUsingReporterAction = exports.OpenProcessExplorer = void 0;
    class OpenProcessExplorer extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenProcessExplorer.ID,
                title: { value: (0, nls_1.localize)('openProcessExplorer', "Open Process Explorer"), original: 'Open Process Explorer' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const issueService = accessor.get(issue_1.IWorkbenchIssueService);
            return issueService.openProcessExplorer();
        }
    }
    exports.OpenProcessExplorer = OpenProcessExplorer;
    OpenProcessExplorer.ID = 'workbench.action.openProcessExplorer';
    class ReportPerformanceIssueUsingReporterAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ReportPerformanceIssueUsingReporterAction.ID,
                title: { value: (0, nls_1.localize)({ key: 'reportPerformanceIssue', comment: [`Here, 'issue' means problem or bug`] }, "Report Performance Issue..."), original: 'Report Performance Issue' },
                category: actions_2.CATEGORIES.Help,
                f1: true
            });
        }
        async run(accessor) {
            const issueService = accessor.get(issue_1.IWorkbenchIssueService);
            return issueService.openReporter({ issueType: 1 /* IssueType.PerformanceIssue */ });
        }
    }
    exports.ReportPerformanceIssueUsingReporterAction = ReportPerformanceIssueUsingReporterAction;
    ReportPerformanceIssueUsingReporterAction.ID = 'workbench.action.reportPerformanceIssueUsingReporter';
});
//# sourceMappingURL=issueActions.js.map