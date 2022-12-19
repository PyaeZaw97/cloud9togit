/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/views/browser/viewDescriptorService", "vs/base/common/types", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle"], function (require, exports, assert, views_1, platform_1, workbenchTestServices_1, descriptors_1, viewDescriptorService_1, types_1, contextKeyService_1, contextkey_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ViewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    const sidebarContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({ id: 'testSidebar', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 0 /* ViewContainerLocation.Sidebar */);
    const panelContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({ id: 'testPanel', title: 'test', ctorDescriptor: new descriptors_1.SyncDescriptor({}) }, 1 /* ViewContainerLocation.Panel */);
    suite('ViewDescriptorService', () => {
        let disposables;
        let viewDescriptorService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            instantiationService.stub(contextkey_1.IContextKeyService, instantiationService.createInstance(contextKeyService_1.ContextKeyService));
            viewDescriptorService = instantiationService.createInstance(viewDescriptorService_1.ViewDescriptorService);
        });
        teardown(() => {
            ViewsRegistry.deregisterViews(ViewsRegistry.getViews(sidebarContainer), sidebarContainer);
            ViewsRegistry.deregisterViews(ViewsRegistry.getViews(panelContainer), panelContainer);
            disposables.dispose();
        });
        test('Empty Containers', function () {
            const sidebarViews = viewDescriptorService.getViewContainerModel(sidebarContainer);
            const panelViews = viewDescriptorService.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.allViewDescriptors.length, 0, 'The sidebar container should have no views yet.');
            assert.strictEqual(panelViews.allViewDescriptors.length, 0, 'The panel container should have no views yet.');
        });
        test('Register/Deregister', () => {
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: 'Test View 1',
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: 'Test View 2',
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: 'Test View 3',
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            let sidebarViews = viewDescriptorService.getViewContainerModel(sidebarContainer);
            let panelViews = viewDescriptorService.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 2, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 1, 'Panel should have 1 view');
            ViewsRegistry.deregisterViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.deregisterViews(viewDescriptors.slice(2), panelContainer);
            sidebarViews = viewDescriptorService.getViewContainerModel(sidebarContainer);
            panelViews = viewDescriptorService.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 0, 'Sidebar should have no views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel should have no views');
        });
        test('move views to existing containers', async function () {
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: 'Test View 1',
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: 'Test View 2',
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: 'Test View 3',
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            viewDescriptorService.moveViewsToContainer(viewDescriptors.slice(2), sidebarContainer);
            viewDescriptorService.moveViewsToContainer(viewDescriptors.slice(0, 2), panelContainer);
            let sidebarViews = viewDescriptorService.getViewContainerModel(sidebarContainer);
            let panelViews = viewDescriptorService.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 2, 'Panel should have 1 view');
            assert.notStrictEqual(sidebarViews.activeViewDescriptors.indexOf(viewDescriptors[2]), -1, `Sidebar should have ${viewDescriptors[2].name}`);
            assert.notStrictEqual(panelViews.activeViewDescriptors.indexOf(viewDescriptors[0]), -1, `Panel should have ${viewDescriptors[0].name}`);
            assert.notStrictEqual(panelViews.activeViewDescriptors.indexOf(viewDescriptors[1]), -1, `Panel should have ${viewDescriptors[1].name}`);
        });
        test('move views to generated containers', async function () {
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: 'Test View 1',
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: 'Test View 2',
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: 'Test View 3',
                    canMoveView: true
                }
            ];
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            viewDescriptorService.moveViewToLocation(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */);
            viewDescriptorService.moveViewToLocation(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */);
            let sidebarViews = viewDescriptorService.getViewContainerModel(sidebarContainer);
            let panelViews = viewDescriptorService.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar container should have 1 view');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel container should have no views');
            const generatedPanel = (0, types_1.assertIsDefined)(viewDescriptorService.getViewContainerByViewId(viewDescriptors[0].id));
            const generatedSidebar = (0, types_1.assertIsDefined)(viewDescriptorService.getViewContainerByViewId(viewDescriptors[2].id));
            assert.strictEqual(viewDescriptorService.getViewContainerLocation(generatedPanel), 1 /* ViewContainerLocation.Panel */, 'Generated Panel should be in located in the panel');
            assert.strictEqual(viewDescriptorService.getViewContainerLocation(generatedSidebar), 0 /* ViewContainerLocation.Sidebar */, 'Generated Sidebar should be in located in the sidebar');
            assert.strictEqual(viewDescriptorService.getViewContainerLocation(generatedPanel), viewDescriptorService.getViewLocationById(viewDescriptors[0].id), 'Panel view location and container location should match');
            assert.strictEqual(viewDescriptorService.getViewContainerLocation(generatedSidebar), viewDescriptorService.getViewLocationById(viewDescriptors[2].id), 'Sidebar view location and container location should match');
            assert.strictEqual(viewDescriptorService.getDefaultContainerById(viewDescriptors[2].id), panelContainer, `${viewDescriptors[2].name} has wrong default container`);
            assert.strictEqual(viewDescriptorService.getDefaultContainerById(viewDescriptors[0].id), sidebarContainer, `${viewDescriptors[0].name} has wrong default container`);
            viewDescriptorService.moveViewToLocation(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */);
            viewDescriptorService.moveViewToLocation(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */);
            sidebarViews = viewDescriptorService.getViewContainerModel(sidebarContainer);
            panelViews = viewDescriptorService.getViewContainerModel(panelContainer);
            assert.strictEqual(sidebarViews.activeViewDescriptors.length, 1, 'Sidebar should have 2 views');
            assert.strictEqual(panelViews.activeViewDescriptors.length, 0, 'Panel should have 1 view');
            assert.strictEqual(viewDescriptorService.getViewLocationById(viewDescriptors[0].id), 0 /* ViewContainerLocation.Sidebar */, 'View should be located in the sidebar');
            assert.strictEqual(viewDescriptorService.getViewLocationById(viewDescriptors[2].id), 1 /* ViewContainerLocation.Panel */, 'View should be located in the panel');
        });
        test('move view events', async function () {
            const viewDescriptors = [
                {
                    id: 'view1',
                    ctorDescriptor: null,
                    name: 'Test View 1',
                    canMoveView: true
                },
                {
                    id: 'view2',
                    ctorDescriptor: null,
                    name: 'Test View 2',
                    canMoveView: true
                },
                {
                    id: 'view3',
                    ctorDescriptor: null,
                    name: 'Test View 3',
                    canMoveView: true
                }
            ];
            let expectedSequence = '';
            let actualSequence = '';
            const disposables = [];
            const containerMoveString = (view, from, to) => {
                return `Moved ${view.id} from ${from.id} to ${to.id}\n`;
            };
            const locationMoveString = (view, from, to) => {
                return `Moved ${view.id} from ${from === 0 /* ViewContainerLocation.Sidebar */ ? 'Sidebar' : 'Panel'} to ${to === 0 /* ViewContainerLocation.Sidebar */ ? 'Sidebar' : 'Panel'}\n`;
            };
            disposables.push(viewDescriptorService.onDidChangeContainer(({ views, from, to }) => {
                views.forEach(view => {
                    actualSequence += containerMoveString(view, from, to);
                });
            }));
            disposables.push(viewDescriptorService.onDidChangeLocation(({ views, from, to }) => {
                views.forEach(view => {
                    actualSequence += locationMoveString(view, from, to);
                });
            }));
            ViewsRegistry.registerViews(viewDescriptors.slice(0, 2), sidebarContainer);
            ViewsRegistry.registerViews(viewDescriptors.slice(2), panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            viewDescriptorService.moveViewToLocation(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[0], sidebarContainer, viewDescriptorService.getViewContainerByViewId(viewDescriptors[0].id));
            expectedSequence += locationMoveString(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            viewDescriptorService.moveViewToLocation(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[2], panelContainer, viewDescriptorService.getViewContainerByViewId(viewDescriptors[2].id));
            expectedSequence += locationMoveString(viewDescriptors[0], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[0], viewDescriptorService.getViewContainerByViewId(viewDescriptors[0].id), sidebarContainer);
            viewDescriptorService.moveViewsToContainer([viewDescriptors[0]], sidebarContainer);
            expectedSequence += locationMoveString(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[2], viewDescriptorService.getViewContainerByViewId(viewDescriptors[2].id), panelContainer);
            viewDescriptorService.moveViewsToContainer([viewDescriptors[2]], panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[0], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[0], sidebarContainer, panelContainer);
            viewDescriptorService.moveViewsToContainer([viewDescriptors[0]], panelContainer);
            expectedSequence += locationMoveString(viewDescriptors[2], 1 /* ViewContainerLocation.Panel */, 0 /* ViewContainerLocation.Sidebar */);
            expectedSequence += containerMoveString(viewDescriptors[2], panelContainer, sidebarContainer);
            viewDescriptorService.moveViewsToContainer([viewDescriptors[2]], sidebarContainer);
            expectedSequence += locationMoveString(viewDescriptors[1], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += locationMoveString(viewDescriptors[2], 0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */);
            expectedSequence += containerMoveString(viewDescriptors[1], sidebarContainer, panelContainer);
            expectedSequence += containerMoveString(viewDescriptors[2], sidebarContainer, panelContainer);
            viewDescriptorService.moveViewsToContainer([viewDescriptors[1], viewDescriptors[2]], panelContainer);
            assert.strictEqual(actualSequence, expectedSequence, 'Event sequence not matching expected sequence');
        });
    });
});
//# sourceMappingURL=viewDescriptorService.test.js.map