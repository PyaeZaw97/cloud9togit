/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/mock", "vs/workbench/common/views", "vs/platform/log/common/log", "vs/workbench/api/browser/mainThreadTreeViews", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/platform/notification/test/common/testNotificationService", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/views/browser/viewDescriptorService", "vs/workbench/browser/parts/views/treeView", "vs/base/common/lifecycle"], function (require, exports, assert, mock_1, views_1, log_1, mainThreadTreeViews_1, workbenchTestServices_1, workbenchTestServices_2, testNotificationService_1, platform_1, descriptors_1, viewDescriptorService_1, treeView_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadHostTreeView', function () {
        const testTreeViewId = 'testTreeView';
        const customValue = 'customValue';
        const ViewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
        class MockExtHostTreeViewsShape extends (0, mock_1.mock)() {
            async $getChildren(treeViewId, treeItemHandle) {
                return [{ handle: 'testItem1', collapsibleState: views_1.TreeItemCollapsibleState.Expanded, customProp: customValue }];
            }
            async $hasResolve() {
                return false;
            }
            $setVisible() { }
        }
        let container;
        let mainThreadTreeViews;
        let extHostTreeViewsShape;
        let disposables;
        setup(async () => {
            disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const viewDescriptorService = instantiationService.createInstance(viewDescriptorService_1.ViewDescriptorService);
            instantiationService.stub(views_1.IViewDescriptorService, viewDescriptorService);
            container = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({ id: 'testContainer', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
            const viewDescriptor = {
                id: testTreeViewId,
                ctorDescriptor: null,
                name: 'Test View 1',
                treeView: instantiationService.createInstance(treeView_1.CustomTreeView, 'testTree', 'Test Title'),
            };
            ViewsRegistry.registerViews([viewDescriptor], container);
            const testExtensionService = new workbenchTestServices_2.TestExtensionService();
            extHostTreeViewsShape = new MockExtHostTreeViewsShape();
            mainThreadTreeViews = new mainThreadTreeViews_1.MainThreadTreeViews(new class {
                constructor() {
                    this.remoteAuthority = '';
                    this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
                }
                dispose() { }
                assertRegistered() { }
                set(v) { return null; }
                getProxy() {
                    return extHostTreeViewsShape;
                }
                drain() { return null; }
            }, new workbenchTestServices_1.TestViewsService(), new testNotificationService_1.TestNotificationService(), testExtensionService, new log_1.NullLogService());
            mainThreadTreeViews.$registerTreeViewDataProvider(testTreeViewId, { showCollapseAll: false, canSelectMany: false, dropMimeTypes: [], dragMimeTypes: [], hasHandleDrag: false, hasHandleDrop: false });
            await testExtensionService.whenInstalledExtensionsRegistered();
        });
        teardown(() => {
            ViewsRegistry.deregisterViews(ViewsRegistry.getViews(container), container);
            disposables.dispose();
        });
        test('getChildren keeps custom properties', async () => {
            var _a;
            const treeView = ViewsRegistry.getView(testTreeViewId).treeView;
            const children = await ((_a = treeView.dataProvider) === null || _a === void 0 ? void 0 : _a.getChildren({ handle: 'root', collapsibleState: views_1.TreeItemCollapsibleState.Expanded }));
            assert(children.length === 1, 'Exactly one child should be returned');
            assert(children[0].customProp === customValue, 'Tree Items should keep custom properties');
        });
    });
});
//# sourceMappingURL=mainThreadTreeViews.test.js.map