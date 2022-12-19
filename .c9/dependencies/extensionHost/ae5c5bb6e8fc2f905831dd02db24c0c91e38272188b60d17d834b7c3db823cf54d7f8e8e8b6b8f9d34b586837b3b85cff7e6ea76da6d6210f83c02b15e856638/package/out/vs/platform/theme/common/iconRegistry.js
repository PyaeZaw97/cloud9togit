/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/event", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/platform/theme/common/themeService"], function (require, exports, async_1, codicons_1, event_1, nls_1, jsonContributionRegistry_1, platform, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.spinningLoading = exports.syncing = exports.gotoNextLocation = exports.gotoPreviousLocation = exports.widgetClose = exports.iconsSchemaId = exports.getIconRegistry = exports.registerIcon = exports.IconContribution = exports.Extensions = void 0;
    // icon registry
    exports.Extensions = {
        IconContribution: 'base.contributions.icons'
    };
    var IconContribution;
    (function (IconContribution) {
        function getDefinition(contribution, registry) {
            let definition = contribution.defaults;
            while (themeService_1.ThemeIcon.isThemeIcon(definition)) {
                const c = iconRegistry.getIcon(definition.id);
                if (!c) {
                    return undefined;
                }
                definition = c.defaults;
            }
            return definition;
        }
        IconContribution.getDefinition = getDefinition;
    })(IconContribution = exports.IconContribution || (exports.IconContribution = {}));
    class IconRegistry {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.iconSchema = {
                definitions: {
                    icons: {
                        type: 'object',
                        properties: {
                            fontId: { type: 'string', description: (0, nls_1.localize)('iconDefinition.fontId', 'The id of the font to use. If not set, the font that is defined first is used.') },
                            fontCharacter: { type: 'string', description: (0, nls_1.localize)('iconDefinition.fontCharacter', 'The font character associated with the icon definition.') }
                        },
                        additionalProperties: false,
                        defaultSnippets: [{ body: { fontCharacter: '\\\\e030' } }]
                    }
                },
                type: 'object',
                properties: {}
            };
            this.iconReferenceSchema = { type: 'string', pattern: `^${codicons_1.CSSIcon.iconNameExpression}$`, enum: [], enumDescriptions: [] };
            this.iconsById = {};
            this.iconFontsById = {};
        }
        registerIcon(id, defaults, description, deprecationMessage) {
            const existing = this.iconsById[id];
            if (existing) {
                if (description && !existing.description) {
                    existing.description = description;
                    this.iconSchema.properties[id].markdownDescription = `${description} $(${id})`;
                    const enumIndex = this.iconReferenceSchema.enum.indexOf(id);
                    if (enumIndex !== -1) {
                        this.iconReferenceSchema.enumDescriptions[enumIndex] = description;
                    }
                    this._onDidChange.fire();
                }
                return existing;
            }
            let iconContribution = { id, description, defaults, deprecationMessage };
            this.iconsById[id] = iconContribution;
            let propertySchema = { $ref: '#/definitions/icons' };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            if (description) {
                propertySchema.markdownDescription = `${description}: $(${id})`;
            }
            this.iconSchema.properties[id] = propertySchema;
            this.iconReferenceSchema.enum.push(id);
            this.iconReferenceSchema.enumDescriptions.push(description || '');
            this._onDidChange.fire();
            return { id };
        }
        deregisterIcon(id) {
            delete this.iconsById[id];
            delete this.iconSchema.properties[id];
            const index = this.iconReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.iconReferenceSchema.enum.splice(index, 1);
                this.iconReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChange.fire();
        }
        getIcons() {
            return Object.keys(this.iconsById).map(id => this.iconsById[id]);
        }
        getIcon(id) {
            return this.iconsById[id];
        }
        getIconSchema() {
            return this.iconSchema;
        }
        getIconReferenceSchema() {
            return this.iconReferenceSchema;
        }
        registerIconFont(id, definition) {
            const existing = this.iconFontsById[id];
            if (existing) {
                return existing;
            }
            this.iconFontsById[id] = definition;
            this._onDidChange.fire();
            return definition;
        }
        deregisterIconFont(id) {
            delete this.iconFontsById[id];
        }
        getIconFont(id) {
            return this.iconFontsById[id];
        }
        toString() {
            const sorter = (i1, i2) => {
                return i1.id.localeCompare(i2.id);
            };
            const classNames = (i) => {
                while (themeService_1.ThemeIcon.isThemeIcon(i.defaults)) {
                    i = this.iconsById[i.defaults.id];
                }
                return `codicon codicon-${i ? i.id : ''}`;
            };
            let reference = [];
            reference.push(`| preview     | identifier                        | default codicon ID                | description`);
            reference.push(`| ----------- | --------------------------------- | --------------------------------- | --------------------------------- |`);
            const contributions = Object.keys(this.iconsById).map(key => this.iconsById[key]);
            for (const i of contributions.filter(i => !!i.description).sort(sorter)) {
                reference.push(`|<i class="${classNames(i)}"></i>|${i.id}|${themeService_1.ThemeIcon.isThemeIcon(i.defaults) ? i.defaults.id : i.id}|${i.description || ''}|`);
            }
            reference.push(`| preview     | identifier                        `);
            reference.push(`| ----------- | --------------------------------- |`);
            for (const i of contributions.filter(i => !themeService_1.ThemeIcon.isThemeIcon(i.defaults)).sort(sorter)) {
                reference.push(`|<i class="${classNames(i)}"></i>|${i.id}|`);
            }
            return reference.join('\n');
        }
    }
    const iconRegistry = new IconRegistry();
    platform.Registry.add(exports.Extensions.IconContribution, iconRegistry);
    function registerIcon(id, defaults, description, deprecationMessage) {
        return iconRegistry.registerIcon(id, defaults, description, deprecationMessage);
    }
    exports.registerIcon = registerIcon;
    function getIconRegistry() {
        return iconRegistry;
    }
    exports.getIconRegistry = getIconRegistry;
    function initialize() {
        for (const icon of codicons_1.Codicon.getAll()) {
            iconRegistry.registerIcon(icon.id, icon.definition, icon.description);
        }
    }
    initialize();
    exports.iconsSchemaId = 'vscode://schemas/icons';
    let schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.iconsSchemaId, iconRegistry.getIconSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.iconsSchemaId), 200);
    iconRegistry.onDidChange(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
    //setTimeout(_ => console.log(iconRegistry.toString()), 5000);
    // common icons
    exports.widgetClose = registerIcon('widget-close', codicons_1.Codicon.close, (0, nls_1.localize)('widgetClose', 'Icon for the close action in widgets.'));
    exports.gotoPreviousLocation = registerIcon('goto-previous-location', codicons_1.Codicon.arrowUp, (0, nls_1.localize)('previousChangeIcon', 'Icon for goto previous editor location.'));
    exports.gotoNextLocation = registerIcon('goto-next-location', codicons_1.Codicon.arrowDown, (0, nls_1.localize)('nextChangeIcon', 'Icon for goto next editor location.'));
    exports.syncing = themeService_1.ThemeIcon.modify(codicons_1.Codicon.sync, 'spin');
    exports.spinningLoading = themeService_1.ThemeIcon.modify(codicons_1.Codicon.loading, 'spin');
});
//# sourceMappingURL=iconRegistry.js.map