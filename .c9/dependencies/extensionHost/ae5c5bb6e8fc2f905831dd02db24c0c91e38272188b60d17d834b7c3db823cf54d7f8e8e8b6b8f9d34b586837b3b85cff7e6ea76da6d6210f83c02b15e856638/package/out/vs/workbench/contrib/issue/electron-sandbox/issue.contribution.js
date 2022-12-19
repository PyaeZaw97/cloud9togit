/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/product/common/product", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/contrib/issue/electron-sandbox/issueActions", "vs/platform/instantiation/common/extensions", "vs/workbench/services/issue/common/issue", "vs/workbench/services/issue/electron-sandbox/issueService", "vs/platform/commands/common/commands", "vs/platform/issue/electron-sandbox/issue", "vs/workbench/contrib/issue/common/commands"], function (require, exports, nls_1, product_1, actions_1, actions_2, issueActions_1, extensions_1, issue_1, issueService_1, commands_1, issue_2, commands_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    if (!!product_1.default.reportIssueUrl) {
        (0, actions_1.registerAction2)(issueActions_1.ReportPerformanceIssueUsingReporterAction);
        commands_1.CommandsRegistry.registerCommand(commands_2.OpenIssueReporterActionId, function (accessor, args) {
            const data = Array.isArray(args)
                ? { extensionId: args[0] }
                : args || {};
            return accessor.get(issue_1.IWorkbenchIssueService).openReporter(data);
        });
        commands_1.CommandsRegistry.registerCommand({
            id: commands_2.OpenIssueReporterApiCommandId,
            handler: function (accessor, args) {
                const data = Array.isArray(args)
                    ? { extensionId: args[0] }
                    : args || {};
                return accessor.get(issue_1.IWorkbenchIssueService).openReporter(data);
            },
            description: {
                description: 'Open the issue reporter and optionally prefill part of the form.',
                args: [
                    {
                        name: 'options',
                        description: 'Data to use to prefill the issue reporter with.',
                        isOptional: true,
                        schema: {
                            oneOf: [
                                {
                                    type: 'string',
                                    description: 'The extension id to preselect.'
                                },
                                {
                                    type: 'object',
                                    properties: {
                                        extensionId: {
                                            type: 'string'
                                        },
                                        issueTitle: {
                                            type: 'string'
                                        },
                                        issueBody: {
                                            type: 'string'
                                        }
                                    }
                                }
                            ]
                        }
                    },
                ]
            }
        });
        const reportIssue = {
            id: commands_2.OpenIssueReporterActionId,
            title: {
                value: (0, nls_1.localize)({ key: 'reportIssueInEnglish', comment: ['Translate this to "Report Issue in English" in all languages please!'] }, "Report Issue..."),
                original: 'Report Issue...'
            },
            category: actions_2.CATEGORIES.Help
        };
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: reportIssue });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarHelpMenu, {
            group: '3_feedback',
            command: {
                id: commands_2.OpenIssueReporterActionId,
                title: (0, nls_1.localize)({ key: 'miReportIssue', comment: ['&& denotes a mnemonic', 'Translate this to "Report Issue in English" in all languages please!'] }, "Report &&Issue")
            },
            order: 3
        });
    }
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarHelpMenu, {
        group: '5_tools',
        command: {
            id: 'workbench.action.openProcessExplorer',
            title: (0, nls_1.localize)({ key: 'miOpenProcessExplorerer', comment: ['&& denotes a mnemonic'] }, "Open &&Process Explorer")
        },
        order: 2
    });
    (0, actions_1.registerAction2)(issueActions_1.OpenProcessExplorer);
    (0, extensions_1.registerSingleton)(issue_1.IWorkbenchIssueService, issueService_1.WorkbenchIssueService, true);
    commands_1.CommandsRegistry.registerCommand('_issues.getSystemStatus', (accessor) => {
        return accessor.get(issue_2.IIssueService).getSystemStatus();
    });
});
//# sourceMappingURL=issue.contribution.js.map