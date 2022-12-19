/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, nls_1, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.walkthroughsExtensionPoint = void 0;
    const titleTranslated = (0, nls_1.localize)('title', "Title");
    exports.walkthroughsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'walkthroughs',
        jsonSchema: {
            description: (0, nls_1.localize)('walkthroughs', "Contribute walkthroughs to help users getting started with your extension."),
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'title', 'description', 'steps'],
                defaultSnippets: [{ body: { 'id': '$1', 'title': '$2', 'description': '$3', 'steps': [] } }],
                properties: {
                    id: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.id', "Unique identifier for this walkthrough."),
                    },
                    title: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.title', "Title of walkthrough.")
                    },
                    description: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.description', "Description of walkthrough.")
                    },
                    featuredFor: {
                        type: 'array',
                        description: (0, nls_1.localize)('walkthroughs.featuredFor', "Walkthroughs that match one of these glob patterns appear as 'featured' in workspaces with the specified files. For example, a walkthrough for TypeScript projects might specify `tsconfig.json` here."),
                        items: {
                            type: 'string'
                        },
                    },
                    when: {
                        type: 'string',
                        description: (0, nls_1.localize)('walkthroughs.when', "Context key expression to control the visibility of this walkthrough.")
                    },
                    steps: {
                        type: 'array',
                        description: (0, nls_1.localize)('walkthroughs.steps', "Steps to complete as part of this walkthrough."),
                        items: {
                            type: 'object',
                            required: ['id', 'title', 'media'],
                            defaultSnippets: [{
                                    body: {
                                        'id': '$1', 'title': '$2', 'description': '$3',
                                        'completionEvents': ['$5'],
                                        'media': {},
                                    }
                                }],
                            properties: {
                                id: {
                                    type: 'string',
                                    description: (0, nls_1.localize)('walkthroughs.steps.id', "Unique identifier for this step. This is used to keep track of which steps have been completed."),
                                },
                                title: {
                                    type: 'string',
                                    description: (0, nls_1.localize)('walkthroughs.steps.title', "Title of step.")
                                },
                                description: {
                                    type: 'string',
                                    description: (0, nls_1.localize)('walkthroughs.steps.description.interpolated', "Description of step. Supports ``preformatted``, __italic__, and **bold** text. Use markdown-style links for commands or external links: {0}, {1}, or {2}. Links on their own line will be rendered as buttons.", `[${titleTranslated}](command:myext.command)`, `[${titleTranslated}](command:toSide:myext.command)`, `[${titleTranslated}](https://aka.ms)`)
                                },
                                button: {
                                    deprecationMessage: (0, nls_1.localize)('walkthroughs.steps.button.deprecated.interpolated', "Deprecated. Use markdown links in the description instead, i.e. {0}, {1}, or {2}", `[${titleTranslated}](command:myext.command)`, `[${titleTranslated}](command:toSide:myext.command)`, `[${titleTranslated}](https://aka.ms)`),
                                },
                                media: {
                                    type: 'object',
                                    description: (0, nls_1.localize)('walkthroughs.steps.media', "Media to show alongside this step, either an image or markdown content."),
                                    oneOf: [
                                        {
                                            required: ['image', 'altText'],
                                            additionalProperties: false,
                                            properties: {
                                                path: {
                                                    deprecationMessage: (0, nls_1.localize)('pathDeprecated', "Deprecated. Please use `image` or `markdown` instead")
                                                },
                                                image: {
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.string', "Path to an image - or object consisting of paths to light, dark, and hc images - relative to extension directory. Depending on context, the image will be displayed from 400px to 800px wide, with similar bounds on height. To support HIDPI displays, the image will be rendered at 1.5x scaling, for example a 900 physical pixels wide image will be displayed as 600 logical pixels wide."),
                                                    oneOf: [
                                                        {
                                                            type: 'string',
                                                        },
                                                        {
                                                            type: 'object',
                                                            required: ['dark', 'light', 'hc', 'hcLight'],
                                                            properties: {
                                                                dark: {
                                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.dark.string', "Path to the image for dark themes, relative to extension directory."),
                                                                    type: 'string',
                                                                },
                                                                light: {
                                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.light.string', "Path to the image for light themes, relative to extension directory."),
                                                                    type: 'string',
                                                                },
                                                                hc: {
                                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.hc.string', "Path to the image for hc themes, relative to extension directory."),
                                                                    type: 'string',
                                                                },
                                                                hcLight: {
                                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.hcLight.string', "Path to the image for hc light themes, relative to extension directory."),
                                                                    type: 'string',
                                                                }
                                                            }
                                                        }
                                                    ]
                                                },
                                                altText: {
                                                    type: 'string',
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.altText', "Alternate text to display when the image cannot be loaded or in screen readers.")
                                                }
                                            }
                                        },
                                        {
                                            required: ['svg', 'altText'],
                                            additionalProperties: false,
                                            properties: {
                                                svg: {
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.image.path.svg', "Path to an svg, color tokens are supported in variables to support theming to match the workbench."),
                                                    type: 'string',
                                                },
                                                altText: {
                                                    type: 'string',
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.altText', "Alternate text to display when the image cannot be loaded or in screen readers.")
                                                },
                                            }
                                        },
                                        {
                                            required: ['markdown'],
                                            additionalProperties: false,
                                            properties: {
                                                path: {
                                                    deprecationMessage: (0, nls_1.localize)('pathDeprecated', "Deprecated. Please use `image` or `markdown` instead")
                                                },
                                                markdown: {
                                                    description: (0, nls_1.localize)('walkthroughs.steps.media.markdown.path', "Path to the markdown document, relative to extension directory."),
                                                    type: 'string',
                                                }
                                            }
                                        }
                                    ]
                                },
                                completionEvents: {
                                    description: (0, nls_1.localize)('walkthroughs.steps.completionEvents', "Events that should trigger this step to become checked off. If empty or not defined, the step will check off when any of the step's buttons or links are clicked; if the step has no buttons or links it will check on when it is selected."),
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        defaultSnippets: [
                                            {
                                                label: 'onCommand',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onCommand', 'Check off step when a given command is executed anywhere in VS Code.'),
                                                body: 'onCommand:${1:commandId}'
                                            },
                                            {
                                                label: 'onLink',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onLink', 'Check off step when a given link is opened via a walkthrough step.'),
                                                body: 'onLink:${2:linkId}'
                                            },
                                            {
                                                label: 'onView',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onView', 'Check off step when a given view is opened'),
                                                body: 'onView:${2:viewId}'
                                            },
                                            {
                                                label: 'onSettingChanged',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onSettingChanged', 'Check off step when a given setting is changed'),
                                                body: 'onSettingChanged:${2:settingName}'
                                            },
                                            {
                                                label: 'onContext',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.onContext', 'Check off step when a context key expression is true.'),
                                                body: 'onContext:${2:key}'
                                            },
                                            {
                                                label: 'onExtensionInstalled',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.extensionInstalled', 'Check off step when an extension with the given id is installed. If the extension is already installed, the step will start off checked.'),
                                                body: 'onExtensionInstalled:${3:extensionId}'
                                            },
                                            {
                                                label: 'onStepSelected',
                                                description: (0, nls_1.localize)('walkthroughs.steps.completionEvents.stepSelected', 'Check off step as soon as it is selected.'),
                                                body: 'onStepSelected'
                                            },
                                        ]
                                    }
                                },
                                doneOn: {
                                    description: (0, nls_1.localize)('walkthroughs.steps.doneOn', "Signal to mark step as complete."),
                                    deprecationMessage: (0, nls_1.localize)('walkthroughs.steps.doneOn.deprecation', "doneOn is deprecated. By default steps will be checked off when their buttons are clicked, to configure further use completionEvents"),
                                    type: 'object',
                                    required: ['command'],
                                    defaultSnippets: [{ 'body': { command: '$1' } }],
                                    properties: {
                                        'command': {
                                            description: (0, nls_1.localize)('walkthroughs.steps.oneOn.command', "Mark step done when the specified command is executed."),
                                            type: 'string'
                                        }
                                    },
                                },
                                when: {
                                    type: 'string',
                                    description: (0, nls_1.localize)('walkthroughs.steps.when', "Context key expression to control the visibility of this step.")
                                }
                            }
                        }
                    }
                }
            }
        }
    });
});
//# sourceMappingURL=gettingStartedExtensionPoint.js.map