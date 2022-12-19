/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/product/common/product", "vs/base/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/base/common/keyCodes", "vs/platform/product/common/productService", "vs/workbench/common/actions"], function (require, exports, nls_1, product_1, platform_1, telemetry_1, opener_1, uri_1, actions_1, keyCodes_1, productService_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeybindingsReferenceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: KeybindingsReferenceAction.ID,
                title: {
                    value: (0, nls_1.localize)('keybindingsReference', "Keyboard Shortcuts Reference"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miKeyboardShortcuts', comment: ['&& denotes a mnemonic'] }, "&&Keyboard Shortcuts Reference"),
                    original: 'Keyboard Shortcuts Reference'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: null,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */)
                },
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '2_reference',
                    order: 1
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const url = platform_1.isLinux ? productService.keyboardShortcutsUrlLinux : platform_1.isMacintosh ? productService.keyboardShortcutsUrlMac : productService.keyboardShortcutsUrlWin;
            if (url) {
                openerService.open(uri_1.URI.parse(url));
            }
        }
    }
    KeybindingsReferenceAction.ID = 'workbench.action.keybindingsReference';
    KeybindingsReferenceAction.AVAILABLE = !!(platform_1.isLinux ? product_1.default.keyboardShortcutsUrlLinux : platform_1.isMacintosh ? product_1.default.keyboardShortcutsUrlMac : product_1.default.keyboardShortcutsUrlWin);
    class OpenIntroductoryVideosUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenIntroductoryVideosUrlAction.ID,
                title: {
                    value: (0, nls_1.localize)('openVideoTutorialsUrl', "Video Tutorials"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miVideoTutorials', comment: ['&& denotes a mnemonic'] }, "&&Video Tutorials"),
                    original: 'Video Tutorials'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '2_reference',
                    order: 2
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.introductoryVideosUrl) {
                openerService.open(uri_1.URI.parse(productService.introductoryVideosUrl));
            }
        }
    }
    OpenIntroductoryVideosUrlAction.ID = 'workbench.action.openVideoTutorialsUrl';
    OpenIntroductoryVideosUrlAction.AVAILABLE = !!product_1.default.introductoryVideosUrl;
    class OpenTipsAndTricksUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenTipsAndTricksUrlAction.ID,
                title: {
                    value: (0, nls_1.localize)('openTipsAndTricksUrl', "Tips and Tricks"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miTipsAndTricks', comment: ['&& denotes a mnemonic'] }, "Tips and Tri&&cks"),
                    original: 'Tips and Tricks'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '2_reference',
                    order: 3
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.tipsAndTricksUrl) {
                openerService.open(uri_1.URI.parse(productService.tipsAndTricksUrl));
            }
        }
    }
    OpenTipsAndTricksUrlAction.ID = 'workbench.action.openTipsAndTricksUrl';
    OpenTipsAndTricksUrlAction.AVAILABLE = !!product_1.default.tipsAndTricksUrl;
    class OpenDocumentationUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenDocumentationUrlAction.ID,
                title: {
                    value: (0, nls_1.localize)('openDocumentationUrl', "Documentation"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miDocumentation', comment: ['&& denotes a mnemonic'] }, "&&Documentation"),
                    original: 'Documentation'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '1_welcome',
                    order: 3
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.documentationUrl) {
                openerService.open(uri_1.URI.parse(productService.documentationUrl));
            }
        }
    }
    OpenDocumentationUrlAction.ID = 'workbench.action.openDocumentationUrl';
    OpenDocumentationUrlAction.AVAILABLE = !!product_1.default.documentationUrl;
    class OpenNewsletterSignupUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenNewsletterSignupUrlAction.ID,
                title: { value: (0, nls_1.localize)('newsletterSignup', "Signup for the VS Code Newsletter"), original: 'Signup for the VS Code Newsletter' },
                category: actions_2.CATEGORIES.Help,
                f1: true
            });
        }
        async run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const info = await telemetryService.getTelemetryInfo();
            openerService.open(uri_1.URI.parse(`${productService.newsletterSignupUrl}?machineId=${encodeURIComponent(info.machineId)}`));
        }
    }
    OpenNewsletterSignupUrlAction.ID = 'workbench.action.openNewsletterSignupUrl';
    OpenNewsletterSignupUrlAction.AVAILABLE = !!product_1.default.newsletterSignupUrl;
    class OpenTwitterUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenTwitterUrlAction.ID,
                title: {
                    value: (0, nls_1.localize)('openTwitterUrl', "Join Us on Twitter"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miTwitter', comment: ['&& denotes a mnemonic'] }, "&&Join Us on Twitter"),
                    original: 'Join Us on Twitter'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '3_feedback',
                    order: 1
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.twitterUrl) {
                openerService.open(uri_1.URI.parse(productService.twitterUrl));
            }
        }
    }
    OpenTwitterUrlAction.ID = 'workbench.action.openTwitterUrl';
    OpenTwitterUrlAction.AVAILABLE = !!product_1.default.twitterUrl;
    class OpenRequestFeatureUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenRequestFeatureUrlAction.ID,
                title: {
                    value: (0, nls_1.localize)('openUserVoiceUrl', "Search Feature Requests"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miUserVoice', comment: ['&& denotes a mnemonic'] }, "&&Search Feature Requests"),
                    original: 'Search Feature Requests'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '3_feedback',
                    order: 2
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.requestFeatureUrl) {
                openerService.open(uri_1.URI.parse(productService.requestFeatureUrl));
            }
        }
    }
    OpenRequestFeatureUrlAction.ID = 'workbench.action.openRequestFeatureUrl';
    OpenRequestFeatureUrlAction.AVAILABLE = !!product_1.default.requestFeatureUrl;
    class OpenLicenseUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenLicenseUrlAction.ID,
                title: {
                    value: (0, nls_1.localize)('openLicenseUrl', "View License"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miLicense', comment: ['&& denotes a mnemonic'] }, "View &&License"),
                    original: 'View License'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '4_legal',
                    order: 1
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.licenseUrl) {
                if (platform_1.language) {
                    const queryArgChar = productService.licenseUrl.indexOf('?') > 0 ? '&' : '?';
                    openerService.open(uri_1.URI.parse(`${productService.licenseUrl}${queryArgChar}lang=${platform_1.language}`));
                }
                else {
                    openerService.open(uri_1.URI.parse(productService.licenseUrl));
                }
            }
        }
    }
    OpenLicenseUrlAction.ID = 'workbench.action.openLicenseUrl';
    OpenLicenseUrlAction.AVAILABLE = !!product_1.default.licenseUrl;
    class OpenPrivacyStatementUrlAction extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenPrivacyStatementUrlAction.ID,
                title: {
                    value: (0, nls_1.localize)('openPrivacyStatement', "Privacy Statement"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miPrivacyStatement', comment: ['&& denotes a mnemonic'] }, "Privac&&y Statement"),
                    original: 'Privacy Statement'
                },
                category: actions_2.CATEGORIES.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: '4_legal',
                    order: 2
                }
            });
        }
        run(accessor) {
            const productService = accessor.get(productService_1.IProductService);
            const openerService = accessor.get(opener_1.IOpenerService);
            if (productService.privacyStatementUrl) {
                openerService.open(uri_1.URI.parse(productService.privacyStatementUrl));
            }
        }
    }
    OpenPrivacyStatementUrlAction.ID = 'workbench.action.openPrivacyStatementUrl';
    OpenPrivacyStatementUrlAction.AVAILABE = !!product_1.default.privacyStatementUrl;
    // --- Actions Registration
    if (KeybindingsReferenceAction.AVAILABLE) {
        (0, actions_1.registerAction2)(KeybindingsReferenceAction);
    }
    if (OpenIntroductoryVideosUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenIntroductoryVideosUrlAction);
    }
    if (OpenTipsAndTricksUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenTipsAndTricksUrlAction);
    }
    if (OpenDocumentationUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenDocumentationUrlAction);
    }
    if (OpenNewsletterSignupUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenNewsletterSignupUrlAction);
    }
    if (OpenTwitterUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenTwitterUrlAction);
    }
    if (OpenRequestFeatureUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenRequestFeatureUrlAction);
    }
    if (OpenLicenseUrlAction.AVAILABLE) {
        (0, actions_1.registerAction2)(OpenLicenseUrlAction);
    }
    if (OpenPrivacyStatementUrlAction.AVAILABE) {
        (0, actions_1.registerAction2)(OpenPrivacyStatementUrlAction);
    }
});
//# sourceMappingURL=helpActions.js.map