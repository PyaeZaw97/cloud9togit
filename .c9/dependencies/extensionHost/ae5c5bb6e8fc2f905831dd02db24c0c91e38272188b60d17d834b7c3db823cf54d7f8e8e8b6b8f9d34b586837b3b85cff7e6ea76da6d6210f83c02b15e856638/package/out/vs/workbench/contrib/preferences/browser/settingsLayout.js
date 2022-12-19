/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.knownTermMappings = exports.knownAcronyms = exports.tocData = exports.commonlyUsedData = void 0;
    exports.commonlyUsedData = {
        id: 'commonlyUsed',
        label: (0, nls_1.localize)('commonlyUsed', "Commonly Used"),
        settings: ['files.autoSave', 'editor.fontSize', 'editor.fontFamily', 'editor.tabSize', 'editor.renderWhitespace', 'editor.cursorStyle', 'editor.multiCursorModifier', 'editor.insertSpaces', 'editor.wordWrap', 'files.exclude', 'files.associations', 'workbench.editor.enablePreview']
    };
    exports.tocData = {
        id: 'root',
        label: 'root',
        children: [
            {
                id: 'editor',
                label: (0, nls_1.localize)('textEditor', "Text Editor"),
                settings: ['editor.*'],
                children: [
                    {
                        id: 'editor/cursor',
                        label: (0, nls_1.localize)('cursor', "Cursor"),
                        settings: ['editor.cursor*']
                    },
                    {
                        id: 'editor/find',
                        label: (0, nls_1.localize)('find', "Find"),
                        settings: ['editor.find.*']
                    },
                    {
                        id: 'editor/font',
                        label: (0, nls_1.localize)('font', "Font"),
                        settings: ['editor.font*']
                    },
                    {
                        id: 'editor/format',
                        label: (0, nls_1.localize)('formatting', "Formatting"),
                        settings: ['editor.format*']
                    },
                    {
                        id: 'editor/diffEditor',
                        label: (0, nls_1.localize)('diffEditor', "Diff Editor"),
                        settings: ['diffEditor.*']
                    },
                    {
                        id: 'editor/minimap',
                        label: (0, nls_1.localize)('minimap', "Minimap"),
                        settings: ['editor.minimap.*']
                    },
                    {
                        id: 'editor/suggestions',
                        label: (0, nls_1.localize)('suggestions', "Suggestions"),
                        settings: ['editor.*suggest*']
                    },
                    {
                        id: 'editor/files',
                        label: (0, nls_1.localize)('files', "Files"),
                        settings: ['files.*']
                    }
                ]
            },
            {
                id: 'workbench',
                label: (0, nls_1.localize)('workbench', "Workbench"),
                settings: ['workbench.*'],
                children: [
                    {
                        id: 'workbench/appearance',
                        label: (0, nls_1.localize)('appearance', "Appearance"),
                        settings: ['workbench.activityBar.*', 'workbench.*color*', 'workbench.fontAliasing', 'workbench.iconTheme', 'workbench.sidebar.location', 'workbench.*.visible', 'workbench.tips.enabled', 'workbench.tree.*', 'workbench.view.*']
                    },
                    {
                        id: 'workbench/breadcrumbs',
                        label: (0, nls_1.localize)('breadcrumbs', "Breadcrumbs"),
                        settings: ['breadcrumbs.*']
                    },
                    {
                        id: 'workbench/editor',
                        label: (0, nls_1.localize)('editorManagement', "Editor Management"),
                        settings: ['workbench.editor.*']
                    },
                    {
                        id: 'workbench/settings',
                        label: (0, nls_1.localize)('settings', "Settings Editor"),
                        settings: ['workbench.settings.*']
                    },
                    {
                        id: 'workbench/zenmode',
                        label: (0, nls_1.localize)('zenMode', "Zen Mode"),
                        settings: ['zenmode.*']
                    },
                    {
                        id: 'workbench/screencastmode',
                        label: (0, nls_1.localize)('screencastMode', "Screencast Mode"),
                        settings: ['screencastMode.*']
                    }
                ]
            },
            {
                id: 'window',
                label: (0, nls_1.localize)('window', "Window"),
                settings: ['window.*'],
                children: [
                    {
                        id: 'window/newWindow',
                        label: (0, nls_1.localize)('newWindow', "New Window"),
                        settings: ['window.*newwindow*']
                    }
                ]
            },
            {
                id: 'features',
                label: (0, nls_1.localize)('features', "Features"),
                children: [
                    {
                        id: 'features/explorer',
                        label: (0, nls_1.localize)('fileExplorer', "Explorer"),
                        settings: ['explorer.*', 'outline.*']
                    },
                    {
                        id: 'features/search',
                        label: (0, nls_1.localize)('search', "Search"),
                        settings: ['search.*']
                    },
                    {
                        id: 'features/debug',
                        label: (0, nls_1.localize)('debug', "Debug"),
                        settings: ['debug.*', 'launch']
                    },
                    {
                        id: 'features/testing',
                        label: (0, nls_1.localize)('testing', "Testing"),
                        settings: ['testing.*']
                    },
                    {
                        id: 'features/scm',
                        label: (0, nls_1.localize)('scm', "Source Control"),
                        settings: ['scm.*']
                    },
                    {
                        id: 'features/extensions',
                        label: (0, nls_1.localize)('extensions', "Extensions"),
                        settings: ['extensions.*']
                    },
                    {
                        id: 'features/terminal',
                        label: (0, nls_1.localize)('terminal', "Terminal"),
                        settings: ['terminal.*']
                    },
                    {
                        id: 'features/task',
                        label: (0, nls_1.localize)('task', "Task"),
                        settings: ['task.*']
                    },
                    {
                        id: 'features/problems',
                        label: (0, nls_1.localize)('problems', "Problems"),
                        settings: ['problems.*']
                    },
                    {
                        id: 'features/output',
                        label: (0, nls_1.localize)('output', "Output"),
                        settings: ['output.*']
                    },
                    {
                        id: 'features/comments',
                        label: (0, nls_1.localize)('comments', "Comments"),
                        settings: ['comments.*']
                    },
                    {
                        id: 'features/remote',
                        label: (0, nls_1.localize)('remote', "Remote"),
                        settings: ['remote.*']
                    },
                    {
                        id: 'features/timeline',
                        label: (0, nls_1.localize)('timeline', "Timeline"),
                        settings: ['timeline.*']
                    },
                    {
                        id: 'features/notebook',
                        label: (0, nls_1.localize)('notebook', 'Notebook'),
                        settings: ['notebook.*', 'interactiveWindow.*']
                    },
                    {
                        id: 'features/audioCues',
                        label: (0, nls_1.localize)('audioCues', 'Audio Cues'),
                        settings: ['audioCues.*']
                    }
                ]
            },
            {
                id: 'application',
                label: (0, nls_1.localize)('application', "Application"),
                children: [
                    {
                        id: 'application/http',
                        label: (0, nls_1.localize)('proxy', "Proxy"),
                        settings: ['http.*']
                    },
                    {
                        id: 'application/keyboard',
                        label: (0, nls_1.localize)('keyboard', "Keyboard"),
                        settings: ['keyboard.*']
                    },
                    {
                        id: 'application/update',
                        label: (0, nls_1.localize)('update', "Update"),
                        settings: ['update.*']
                    },
                    {
                        id: 'application/telemetry',
                        label: (0, nls_1.localize)('telemetry', "Telemetry"),
                        settings: ['telemetry.*']
                    },
                    {
                        id: 'application/settingsSync',
                        label: (0, nls_1.localize)('settingsSync', "Settings Sync"),
                        settings: ['settingsSync.*']
                    }
                ]
            },
            {
                id: 'security',
                label: (0, nls_1.localize)('security', "Security"),
                children: [
                    {
                        id: 'security/workspace',
                        label: (0, nls_1.localize)('workspace', "Workspace"),
                        settings: ['security.workspace.*']
                    }
                ]
            }
        ]
    };
    exports.knownAcronyms = new Set();
    [
        'css',
        'html',
        'scss',
        'less',
        'json',
        'js',
        'ts',
        'ie',
        'id',
        'php',
        'scm',
    ].forEach(str => exports.knownAcronyms.add(str));
    exports.knownTermMappings = new Map();
    exports.knownTermMappings.set('power shell', 'PowerShell');
    exports.knownTermMappings.set('powershell', 'PowerShell');
    exports.knownTermMappings.set('javascript', 'JavaScript');
    exports.knownTermMappings.set('typescript', 'TypeScript');
});
//# sourceMappingURL=settingsLayout.js.map