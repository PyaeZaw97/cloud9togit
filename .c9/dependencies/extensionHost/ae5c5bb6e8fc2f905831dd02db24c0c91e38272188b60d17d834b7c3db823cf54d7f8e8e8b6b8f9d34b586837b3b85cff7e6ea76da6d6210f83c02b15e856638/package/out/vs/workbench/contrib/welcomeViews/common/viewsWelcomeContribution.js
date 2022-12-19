/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "./viewsWelcomeExtensionPoint", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls, lifecycle_1, contextkey_1, viewsWelcomeExtensionPoint_1, platform_1, views_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewsWelcomeContribution = void 0;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    class ViewsWelcomeContribution extends lifecycle_1.Disposable {
        constructor(extensionPoint) {
            super();
            this.viewWelcomeContents = new Map();
            extensionPoint.setHandler((_, { added, removed }) => {
                var _a;
                for (const contribution of removed) {
                    for (const welcome of contribution.value) {
                        const disposable = this.viewWelcomeContents.get(welcome);
                        if (disposable) {
                            disposable.dispose();
                        }
                    }
                }
                const welcomesByViewId = new Map();
                for (const contribution of added) {
                    for (const welcome of contribution.value) {
                        const { group, order } = parseGroupAndOrder(welcome, contribution);
                        const precondition = contextkey_1.ContextKeyExpr.deserialize(welcome.enablement);
                        const id = (_a = viewsWelcomeExtensionPoint_1.ViewIdentifierMap[welcome.view]) !== null && _a !== void 0 ? _a : welcome.view;
                        let viewContentMap = welcomesByViewId.get(id);
                        if (!viewContentMap) {
                            viewContentMap = new Map();
                            welcomesByViewId.set(id, viewContentMap);
                        }
                        viewContentMap.set(welcome, {
                            content: welcome.contents,
                            when: contextkey_1.ContextKeyExpr.deserialize(welcome.when),
                            precondition,
                            group,
                            order
                        });
                    }
                }
                for (const [id, viewContentMap] of welcomesByViewId) {
                    const disposables = viewsRegistry.registerViewWelcomeContent2(id, viewContentMap);
                    for (const [welcome, disposable] of disposables) {
                        this.viewWelcomeContents.set(welcome, disposable);
                    }
                }
            });
        }
    }
    exports.ViewsWelcomeContribution = ViewsWelcomeContribution;
    function parseGroupAndOrder(welcome, contribution) {
        let group;
        let order;
        if (welcome.group) {
            if (!(0, extensions_1.isProposedApiEnabled)(contribution.description, 'contribViewsWelcome')) {
                contribution.collector.warn(nls.localize('ViewsWelcomeExtensionPoint.proposedAPI', "The viewsWelcome contribution in '{0}' requires 'enabledApiProposals: [\"contribViewsWelcome\"]' in order to use the 'group' proposed property.", contribution.description.identifier.value));
                return { group, order };
            }
            const idx = welcome.group.lastIndexOf('@');
            if (idx > 0) {
                group = welcome.group.substr(0, idx);
                order = Number(welcome.group.substr(idx + 1)) || undefined;
            }
            else {
                group = welcome.group;
            }
        }
        return { group, order };
    }
});
//# sourceMappingURL=viewsWelcomeContribution.js.map