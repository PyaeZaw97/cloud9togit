/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/editor/common/core/wordHelper", "vs/base/common/arrays", "vs/base/common/objects", "vs/editor/common/core/textModelDefaults"], function (require, exports, nls, platform, wordHelper_1, arrays, objects, textModelDefaults_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorOptions = exports.EditorOption = exports.editorOptionsRegistry = exports.EDITOR_FONT_DEFAULTS = exports.WrappingIndent = exports.unicodeHighlightConfigKeys = exports.inUntrustedWorkspace = exports.filterValidationDecorations = exports.RenderLineNumbersType = exports.EditorLayoutInfoComputer = exports.RenderMinimap = exports.EditorFontLigatures = exports.cursorStyleToString = exports.TextEditorCursorStyle = exports.TextEditorCursorBlinkingStyle = exports.stringSet = exports.clampedInt = exports.boolean = exports.ApplyUpdateResult = exports.ComputeOptionsMemory = exports.ConfigurationChangedEvent = exports.MINIMAP_GUTTER_WIDTH = exports.EditorAutoIndentStrategy = void 0;
    /**
     * Configuration options for auto indentation in the editor
     */
    var EditorAutoIndentStrategy;
    (function (EditorAutoIndentStrategy) {
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["None"] = 0] = "None";
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["Keep"] = 1] = "Keep";
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["Brackets"] = 2] = "Brackets";
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["Advanced"] = 3] = "Advanced";
        EditorAutoIndentStrategy[EditorAutoIndentStrategy["Full"] = 4] = "Full";
    })(EditorAutoIndentStrategy = exports.EditorAutoIndentStrategy || (exports.EditorAutoIndentStrategy = {}));
    /**
     * @internal
     * The width of the minimap gutter, in pixels.
     */
    exports.MINIMAP_GUTTER_WIDTH = 8;
    //#endregion
    /**
     * An event describing that the configuration of the editor has changed.
     */
    class ConfigurationChangedEvent {
        /**
         * @internal
         */
        constructor(values) {
            this._values = values;
        }
        hasChanged(id) {
            return this._values[id];
        }
    }
    exports.ConfigurationChangedEvent = ConfigurationChangedEvent;
    /**
     * @internal
     */
    class ComputeOptionsMemory {
        constructor() {
            this.stableMinimapLayoutInput = null;
            this.stableFitMaxMinimapScale = 0;
            this.stableFitRemainingWidth = 0;
        }
    }
    exports.ComputeOptionsMemory = ComputeOptionsMemory;
    /**
     * @internal
     */
    class BaseEditorOption {
        constructor(id, name, defaultValue, schema) {
            this.id = id;
            this.name = name;
            this.defaultValue = defaultValue;
            this.schema = schema;
        }
        applyUpdate(value, update) {
            return applyUpdate(value, update);
        }
        compute(env, options, value) {
            return value;
        }
    }
    class ApplyUpdateResult {
        constructor(newValue, didChange) {
            this.newValue = newValue;
            this.didChange = didChange;
        }
    }
    exports.ApplyUpdateResult = ApplyUpdateResult;
    function applyUpdate(value, update) {
        if (typeof value !== 'object' || typeof update !== 'object' || !value || !update) {
            return new ApplyUpdateResult(update, value !== update);
        }
        if (Array.isArray(value) || Array.isArray(update)) {
            const arrayEquals = Array.isArray(value) && Array.isArray(update) && arrays.equals(value, update);
            return new ApplyUpdateResult(update, arrayEquals);
        }
        let didChange = false;
        for (const key in update) {
            if (update.hasOwnProperty(key)) {
                const result = applyUpdate(value[key], update[key]);
                if (result.didChange) {
                    value[key] = result.newValue;
                    didChange = true;
                }
            }
        }
        return new ApplyUpdateResult(value, didChange);
    }
    /**
     * @internal
     */
    class ComputedEditorOption {
        constructor(id) {
            this.schema = undefined;
            this.id = id;
            this.name = '_never_';
            this.defaultValue = undefined;
        }
        applyUpdate(value, update) {
            return applyUpdate(value, update);
        }
        validate(input) {
            return this.defaultValue;
        }
    }
    class SimpleEditorOption {
        constructor(id, name, defaultValue, schema) {
            this.id = id;
            this.name = name;
            this.defaultValue = defaultValue;
            this.schema = schema;
        }
        applyUpdate(value, update) {
            return applyUpdate(value, update);
        }
        validate(input) {
            if (typeof input === 'undefined') {
                return this.defaultValue;
            }
            return input;
        }
        compute(env, options, value) {
            return value;
        }
    }
    /**
     * @internal
     */
    function boolean(value, defaultValue) {
        if (typeof value === 'undefined') {
            return defaultValue;
        }
        if (value === 'false') {
            // treat the string 'false' as false
            return false;
        }
        return Boolean(value);
    }
    exports.boolean = boolean;
    class EditorBooleanOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'boolean';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
        }
        validate(input) {
            return boolean(input, this.defaultValue);
        }
    }
    /**
     * @internal
     */
    function clampedInt(value, defaultValue, minimum, maximum) {
        if (typeof value === 'undefined') {
            return defaultValue;
        }
        let r = parseInt(value, 10);
        if (isNaN(r)) {
            return defaultValue;
        }
        r = Math.max(minimum, r);
        r = Math.min(maximum, r);
        return r | 0;
    }
    exports.clampedInt = clampedInt;
    class EditorIntOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, minimum, maximum, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'integer';
                schema.default = defaultValue;
                schema.minimum = minimum;
                schema.maximum = maximum;
            }
            super(id, name, defaultValue, schema);
            this.minimum = minimum;
            this.maximum = maximum;
        }
        static clampedInt(value, defaultValue, minimum, maximum) {
            return clampedInt(value, defaultValue, minimum, maximum);
        }
        validate(input) {
            return EditorIntOption.clampedInt(input, this.defaultValue, this.minimum, this.maximum);
        }
    }
    class EditorFloatOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, validationFn, schema) {
            if (typeof schema !== 'undefined') {
                schema.type = 'number';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
            this.validationFn = validationFn;
        }
        static clamp(n, min, max) {
            if (n < min) {
                return min;
            }
            if (n > max) {
                return max;
            }
            return n;
        }
        static float(value, defaultValue) {
            if (typeof value === 'number') {
                return value;
            }
            if (typeof value === 'undefined') {
                return defaultValue;
            }
            const r = parseFloat(value);
            return (isNaN(r) ? defaultValue : r);
        }
        validate(input) {
            return this.validationFn(EditorFloatOption.float(input, this.defaultValue));
        }
    }
    class EditorStringOption extends SimpleEditorOption {
        static string(value, defaultValue) {
            if (typeof value !== 'string') {
                return defaultValue;
            }
            return value;
        }
        constructor(id, name, defaultValue, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
        }
        validate(input) {
            return EditorStringOption.string(input, this.defaultValue);
        }
    }
    /**
     * @internal
     */
    function stringSet(value, defaultValue, allowedValues) {
        if (typeof value !== 'string') {
            return defaultValue;
        }
        if (allowedValues.indexOf(value) === -1) {
            return defaultValue;
        }
        return value;
    }
    exports.stringSet = stringSet;
    class EditorStringEnumOption extends SimpleEditorOption {
        constructor(id, name, defaultValue, allowedValues, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.enum = allowedValues;
                schema.default = defaultValue;
            }
            super(id, name, defaultValue, schema);
            this._allowedValues = allowedValues;
        }
        validate(input) {
            return stringSet(input, this.defaultValue, this._allowedValues);
        }
    }
    class EditorEnumOption extends BaseEditorOption {
        constructor(id, name, defaultValue, defaultStringValue, allowedValues, convert, schema = undefined) {
            if (typeof schema !== 'undefined') {
                schema.type = 'string';
                schema.enum = allowedValues;
                schema.default = defaultStringValue;
            }
            super(id, name, defaultValue, schema);
            this._allowedValues = allowedValues;
            this._convert = convert;
        }
        validate(input) {
            if (typeof input !== 'string') {
                return this.defaultValue;
            }
            if (this._allowedValues.indexOf(input) === -1) {
                return this.defaultValue;
            }
            return this._convert(input);
        }
    }
    //#endregion
    //#region autoIndent
    function _autoIndentFromString(autoIndent) {
        switch (autoIndent) {
            case 'none': return 0 /* EditorAutoIndentStrategy.None */;
            case 'keep': return 1 /* EditorAutoIndentStrategy.Keep */;
            case 'brackets': return 2 /* EditorAutoIndentStrategy.Brackets */;
            case 'advanced': return 3 /* EditorAutoIndentStrategy.Advanced */;
            case 'full': return 4 /* EditorAutoIndentStrategy.Full */;
        }
    }
    //#endregion
    //#region accessibilitySupport
    class EditorAccessibilitySupport extends BaseEditorOption {
        constructor() {
            super(2 /* EditorOption.accessibilitySupport */, 'accessibilitySupport', 0 /* AccessibilitySupport.Unknown */, {
                type: 'string',
                enum: ['auto', 'on', 'off'],
                enumDescriptions: [
                    nls.localize('accessibilitySupport.auto', "The editor will use platform APIs to detect when a Screen Reader is attached."),
                    nls.localize('accessibilitySupport.on', "The editor will be permanently optimized for usage with a Screen Reader. Word wrapping will be disabled."),
                    nls.localize('accessibilitySupport.off', "The editor will never be optimized for usage with a Screen Reader."),
                ],
                default: 'auto',
                description: nls.localize('accessibilitySupport', "Controls whether the editor should run in a mode where it is optimized for screen readers. Setting to on will disable word wrapping.")
            });
        }
        validate(input) {
            switch (input) {
                case 'auto': return 0 /* AccessibilitySupport.Unknown */;
                case 'off': return 1 /* AccessibilitySupport.Disabled */;
                case 'on': return 2 /* AccessibilitySupport.Enabled */;
            }
            return this.defaultValue;
        }
        compute(env, options, value) {
            if (value === 0 /* AccessibilitySupport.Unknown */) {
                // The editor reads the `accessibilitySupport` from the environment
                return env.accessibilitySupport;
            }
            return value;
        }
    }
    class EditorComments extends BaseEditorOption {
        constructor() {
            const defaults = {
                insertSpace: true,
                ignoreEmptyLines: true,
            };
            super(19 /* EditorOption.comments */, 'comments', defaults, {
                'editor.comments.insertSpace': {
                    type: 'boolean',
                    default: defaults.insertSpace,
                    description: nls.localize('comments.insertSpace', "Controls whether a space character is inserted when commenting.")
                },
                'editor.comments.ignoreEmptyLines': {
                    type: 'boolean',
                    default: defaults.ignoreEmptyLines,
                    description: nls.localize('comments.ignoreEmptyLines', 'Controls if empty lines should be ignored with toggle, add or remove actions for line comments.')
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                insertSpace: boolean(input.insertSpace, this.defaultValue.insertSpace),
                ignoreEmptyLines: boolean(input.ignoreEmptyLines, this.defaultValue.ignoreEmptyLines),
            };
        }
    }
    //#endregion
    //#region cursorBlinking
    /**
     * The kind of animation in which the editor's cursor should be rendered.
     */
    var TextEditorCursorBlinkingStyle;
    (function (TextEditorCursorBlinkingStyle) {
        /**
         * Hidden
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Hidden"] = 0] = "Hidden";
        /**
         * Blinking
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Blink"] = 1] = "Blink";
        /**
         * Blinking with smooth fading
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Smooth"] = 2] = "Smooth";
        /**
         * Blinking with prolonged filled state and smooth fading
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Phase"] = 3] = "Phase";
        /**
         * Expand collapse animation on the y axis
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Expand"] = 4] = "Expand";
        /**
         * No-Blinking
         */
        TextEditorCursorBlinkingStyle[TextEditorCursorBlinkingStyle["Solid"] = 5] = "Solid";
    })(TextEditorCursorBlinkingStyle = exports.TextEditorCursorBlinkingStyle || (exports.TextEditorCursorBlinkingStyle = {}));
    function _cursorBlinkingStyleFromString(cursorBlinkingStyle) {
        switch (cursorBlinkingStyle) {
            case 'blink': return 1 /* TextEditorCursorBlinkingStyle.Blink */;
            case 'smooth': return 2 /* TextEditorCursorBlinkingStyle.Smooth */;
            case 'phase': return 3 /* TextEditorCursorBlinkingStyle.Phase */;
            case 'expand': return 4 /* TextEditorCursorBlinkingStyle.Expand */;
            case 'solid': return 5 /* TextEditorCursorBlinkingStyle.Solid */;
        }
    }
    //#endregion
    //#region cursorStyle
    /**
     * The style in which the editor's cursor should be rendered.
     */
    var TextEditorCursorStyle;
    (function (TextEditorCursorStyle) {
        /**
         * As a vertical line (sitting between two characters).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Line"] = 1] = "Line";
        /**
         * As a block (sitting on top of a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Block"] = 2] = "Block";
        /**
         * As a horizontal line (sitting under a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["Underline"] = 3] = "Underline";
        /**
         * As a thin vertical line (sitting between two characters).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["LineThin"] = 4] = "LineThin";
        /**
         * As an outlined block (sitting on top of a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["BlockOutline"] = 5] = "BlockOutline";
        /**
         * As a thin horizontal line (sitting under a character).
         */
        TextEditorCursorStyle[TextEditorCursorStyle["UnderlineThin"] = 6] = "UnderlineThin";
    })(TextEditorCursorStyle = exports.TextEditorCursorStyle || (exports.TextEditorCursorStyle = {}));
    /**
     * @internal
     */
    function cursorStyleToString(cursorStyle) {
        switch (cursorStyle) {
            case TextEditorCursorStyle.Line: return 'line';
            case TextEditorCursorStyle.Block: return 'block';
            case TextEditorCursorStyle.Underline: return 'underline';
            case TextEditorCursorStyle.LineThin: return 'line-thin';
            case TextEditorCursorStyle.BlockOutline: return 'block-outline';
            case TextEditorCursorStyle.UnderlineThin: return 'underline-thin';
        }
    }
    exports.cursorStyleToString = cursorStyleToString;
    function _cursorStyleFromString(cursorStyle) {
        switch (cursorStyle) {
            case 'line': return TextEditorCursorStyle.Line;
            case 'block': return TextEditorCursorStyle.Block;
            case 'underline': return TextEditorCursorStyle.Underline;
            case 'line-thin': return TextEditorCursorStyle.LineThin;
            case 'block-outline': return TextEditorCursorStyle.BlockOutline;
            case 'underline-thin': return TextEditorCursorStyle.UnderlineThin;
        }
    }
    //#endregion
    //#region editorClassName
    class EditorClassName extends ComputedEditorOption {
        constructor() {
            super(128 /* EditorOption.editorClassName */);
        }
        compute(env, options, _) {
            const classNames = ['monaco-editor'];
            if (options.get(33 /* EditorOption.extraEditorClassName */)) {
                classNames.push(options.get(33 /* EditorOption.extraEditorClassName */));
            }
            if (env.extraEditorClassName) {
                classNames.push(env.extraEditorClassName);
            }
            if (options.get(66 /* EditorOption.mouseStyle */) === 'default') {
                classNames.push('mouse-default');
            }
            else if (options.get(66 /* EditorOption.mouseStyle */) === 'copy') {
                classNames.push('mouse-copy');
            }
            if (options.get(100 /* EditorOption.showUnused */)) {
                classNames.push('showUnused');
            }
            if (options.get(126 /* EditorOption.showDeprecated */)) {
                classNames.push('showDeprecated');
            }
            return classNames.join(' ');
        }
    }
    //#endregion
    //#region emptySelectionClipboard
    class EditorEmptySelectionClipboard extends EditorBooleanOption {
        constructor() {
            super(32 /* EditorOption.emptySelectionClipboard */, 'emptySelectionClipboard', true, { description: nls.localize('emptySelectionClipboard', "Controls whether copying without a selection copies the current line.") });
        }
        compute(env, options, value) {
            return value && env.emptySelectionClipboard;
        }
    }
    class EditorFind extends BaseEditorOption {
        constructor() {
            const defaults = {
                cursorMoveOnType: true,
                seedSearchStringFromSelection: 'always',
                autoFindInSelection: 'never',
                globalFindClipboard: false,
                addExtraSpaceOnTop: true,
                loop: true
            };
            super(35 /* EditorOption.find */, 'find', defaults, {
                'editor.find.cursorMoveOnType': {
                    type: 'boolean',
                    default: defaults.cursorMoveOnType,
                    description: nls.localize('find.cursorMoveOnType', "Controls whether the cursor should jump to find matches while typing.")
                },
                'editor.find.seedSearchStringFromSelection': {
                    type: 'string',
                    enum: ['never', 'always', 'selection'],
                    default: defaults.seedSearchStringFromSelection,
                    enumDescriptions: [
                        nls.localize('editor.find.seedSearchStringFromSelection.never', 'Never seed search string from the editor selection.'),
                        nls.localize('editor.find.seedSearchStringFromSelection.always', 'Always seed search string from the editor selection, including word at cursor position.'),
                        nls.localize('editor.find.seedSearchStringFromSelection.selection', 'Only seed search string from the editor selection.')
                    ],
                    description: nls.localize('find.seedSearchStringFromSelection', "Controls whether the search string in the Find Widget is seeded from the editor selection.")
                },
                'editor.find.autoFindInSelection': {
                    type: 'string',
                    enum: ['never', 'always', 'multiline'],
                    default: defaults.autoFindInSelection,
                    enumDescriptions: [
                        nls.localize('editor.find.autoFindInSelection.never', 'Never turn on Find in Selection automatically (default).'),
                        nls.localize('editor.find.autoFindInSelection.always', 'Always turn on Find in Selection automatically.'),
                        nls.localize('editor.find.autoFindInSelection.multiline', 'Turn on Find in Selection automatically when multiple lines of content are selected.')
                    ],
                    description: nls.localize('find.autoFindInSelection', "Controls the condition for turning on Find in Selection automatically.")
                },
                'editor.find.globalFindClipboard': {
                    type: 'boolean',
                    default: defaults.globalFindClipboard,
                    description: nls.localize('find.globalFindClipboard', "Controls whether the Find Widget should read or modify the shared find clipboard on macOS."),
                    included: platform.isMacintosh
                },
                'editor.find.addExtraSpaceOnTop': {
                    type: 'boolean',
                    default: defaults.addExtraSpaceOnTop,
                    description: nls.localize('find.addExtraSpaceOnTop', "Controls whether the Find Widget should add extra lines on top of the editor. When true, you can scroll beyond the first line when the Find Widget is visible.")
                },
                'editor.find.loop': {
                    type: 'boolean',
                    default: defaults.loop,
                    description: nls.localize('find.loop', "Controls whether the search automatically restarts from the beginning (or the end) when no further matches can be found.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                cursorMoveOnType: boolean(input.cursorMoveOnType, this.defaultValue.cursorMoveOnType),
                seedSearchStringFromSelection: typeof _input.seedSearchStringFromSelection === 'boolean'
                    ? (_input.seedSearchStringFromSelection ? 'always' : 'never')
                    : stringSet(input.seedSearchStringFromSelection, this.defaultValue.seedSearchStringFromSelection, ['never', 'always', 'selection']),
                autoFindInSelection: typeof _input.autoFindInSelection === 'boolean'
                    ? (_input.autoFindInSelection ? 'always' : 'never')
                    : stringSet(input.autoFindInSelection, this.defaultValue.autoFindInSelection, ['never', 'always', 'multiline']),
                globalFindClipboard: boolean(input.globalFindClipboard, this.defaultValue.globalFindClipboard),
                addExtraSpaceOnTop: boolean(input.addExtraSpaceOnTop, this.defaultValue.addExtraSpaceOnTop),
                loop: boolean(input.loop, this.defaultValue.loop),
            };
        }
    }
    //#endregion
    //#region fontLigatures
    /**
     * @internal
     */
    class EditorFontLigatures extends BaseEditorOption {
        constructor() {
            super(45 /* EditorOption.fontLigatures */, 'fontLigatures', EditorFontLigatures.OFF, {
                anyOf: [
                    {
                        type: 'boolean',
                        description: nls.localize('fontLigatures', "Enables/Disables font ligatures ('calt' and 'liga' font features). Change this to a string for fine-grained control of the 'font-feature-settings' CSS property."),
                    },
                    {
                        type: 'string',
                        description: nls.localize('fontFeatureSettings', "Explicit 'font-feature-settings' CSS property. A boolean can be passed instead if one only needs to turn on/off ligatures.")
                    }
                ],
                description: nls.localize('fontLigaturesGeneral', "Configures font ligatures or font features. Can be either a boolean to enable/disable ligatures or a string for the value of the CSS 'font-feature-settings' property."),
                default: false
            });
        }
        validate(input) {
            if (typeof input === 'undefined') {
                return this.defaultValue;
            }
            if (typeof input === 'string') {
                if (input === 'false') {
                    return EditorFontLigatures.OFF;
                }
                if (input === 'true') {
                    return EditorFontLigatures.ON;
                }
                return input;
            }
            if (Boolean(input)) {
                return EditorFontLigatures.ON;
            }
            return EditorFontLigatures.OFF;
        }
    }
    exports.EditorFontLigatures = EditorFontLigatures;
    EditorFontLigatures.OFF = '"liga" off, "calt" off';
    EditorFontLigatures.ON = '"liga" on, "calt" on';
    //#endregion
    //#region fontInfo
    class EditorFontInfo extends ComputedEditorOption {
        constructor() {
            super(44 /* EditorOption.fontInfo */);
        }
        compute(env, options, _) {
            return env.fontInfo;
        }
    }
    //#endregion
    //#region fontSize
    class EditorFontSize extends SimpleEditorOption {
        constructor() {
            super(46 /* EditorOption.fontSize */, 'fontSize', exports.EDITOR_FONT_DEFAULTS.fontSize, {
                type: 'number',
                minimum: 6,
                maximum: 100,
                default: exports.EDITOR_FONT_DEFAULTS.fontSize,
                description: nls.localize('fontSize', "Controls the font size in pixels.")
            });
        }
        validate(input) {
            const r = EditorFloatOption.float(input, this.defaultValue);
            if (r === 0) {
                return exports.EDITOR_FONT_DEFAULTS.fontSize;
            }
            return EditorFloatOption.clamp(r, 6, 100);
        }
        compute(env, options, value) {
            // The final fontSize respects the editor zoom level.
            // So take the result from env.fontInfo
            return env.fontInfo.fontSize;
        }
    }
    //#endregion
    //#region fontWeight
    class EditorFontWeight extends BaseEditorOption {
        constructor() {
            super(47 /* EditorOption.fontWeight */, 'fontWeight', exports.EDITOR_FONT_DEFAULTS.fontWeight, {
                anyOf: [
                    {
                        type: 'number',
                        minimum: EditorFontWeight.MINIMUM_VALUE,
                        maximum: EditorFontWeight.MAXIMUM_VALUE,
                        errorMessage: nls.localize('fontWeightErrorMessage', "Only \"normal\" and \"bold\" keywords or numbers between 1 and 1000 are allowed.")
                    },
                    {
                        type: 'string',
                        pattern: '^(normal|bold|1000|[1-9][0-9]{0,2})$'
                    },
                    {
                        enum: EditorFontWeight.SUGGESTION_VALUES
                    }
                ],
                default: exports.EDITOR_FONT_DEFAULTS.fontWeight,
                description: nls.localize('fontWeight', "Controls the font weight. Accepts \"normal\" and \"bold\" keywords or numbers between 1 and 1000.")
            });
        }
        validate(input) {
            if (input === 'normal' || input === 'bold') {
                return input;
            }
            return String(EditorIntOption.clampedInt(input, exports.EDITOR_FONT_DEFAULTS.fontWeight, EditorFontWeight.MINIMUM_VALUE, EditorFontWeight.MAXIMUM_VALUE));
        }
    }
    EditorFontWeight.SUGGESTION_VALUES = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
    EditorFontWeight.MINIMUM_VALUE = 1;
    EditorFontWeight.MAXIMUM_VALUE = 1000;
    class EditorGoToLocation extends BaseEditorOption {
        constructor() {
            const defaults = {
                multiple: 'peek',
                multipleDefinitions: 'peek',
                multipleTypeDefinitions: 'peek',
                multipleDeclarations: 'peek',
                multipleImplementations: 'peek',
                multipleReferences: 'peek',
                alternativeDefinitionCommand: 'editor.action.goToReferences',
                alternativeTypeDefinitionCommand: 'editor.action.goToReferences',
                alternativeDeclarationCommand: 'editor.action.goToReferences',
                alternativeImplementationCommand: '',
                alternativeReferenceCommand: '',
            };
            const jsonSubset = {
                type: 'string',
                enum: ['peek', 'gotoAndPeek', 'goto'],
                default: defaults.multiple,
                enumDescriptions: [
                    nls.localize('editor.gotoLocation.multiple.peek', 'Show peek view of the results (default)'),
                    nls.localize('editor.gotoLocation.multiple.gotoAndPeek', 'Go to the primary result and show a peek view'),
                    nls.localize('editor.gotoLocation.multiple.goto', 'Go to the primary result and enable peek-less navigation to others')
                ]
            };
            const alternativeCommandOptions = ['', 'editor.action.referenceSearch.trigger', 'editor.action.goToReferences', 'editor.action.peekImplementation', 'editor.action.goToImplementation', 'editor.action.peekTypeDefinition', 'editor.action.goToTypeDefinition', 'editor.action.peekDeclaration', 'editor.action.revealDeclaration', 'editor.action.peekDefinition', 'editor.action.revealDefinitionAside', 'editor.action.revealDefinition'];
            super(51 /* EditorOption.gotoLocation */, 'gotoLocation', defaults, {
                'editor.gotoLocation.multiple': {
                    deprecationMessage: nls.localize('editor.gotoLocation.multiple.deprecated', "This setting is deprecated, please use separate settings like 'editor.editor.gotoLocation.multipleDefinitions' or 'editor.editor.gotoLocation.multipleImplementations' instead."),
                },
                'editor.gotoLocation.multipleDefinitions': Object.assign({ description: nls.localize('editor.editor.gotoLocation.multipleDefinitions', "Controls the behavior the 'Go to Definition'-command when multiple target locations exist.") }, jsonSubset),
                'editor.gotoLocation.multipleTypeDefinitions': Object.assign({ description: nls.localize('editor.editor.gotoLocation.multipleTypeDefinitions', "Controls the behavior the 'Go to Type Definition'-command when multiple target locations exist.") }, jsonSubset),
                'editor.gotoLocation.multipleDeclarations': Object.assign({ description: nls.localize('editor.editor.gotoLocation.multipleDeclarations', "Controls the behavior the 'Go to Declaration'-command when multiple target locations exist.") }, jsonSubset),
                'editor.gotoLocation.multipleImplementations': Object.assign({ description: nls.localize('editor.editor.gotoLocation.multipleImplemenattions', "Controls the behavior the 'Go to Implementations'-command when multiple target locations exist.") }, jsonSubset),
                'editor.gotoLocation.multipleReferences': Object.assign({ description: nls.localize('editor.editor.gotoLocation.multipleReferences', "Controls the behavior the 'Go to References'-command when multiple target locations exist.") }, jsonSubset),
                'editor.gotoLocation.alternativeDefinitionCommand': {
                    type: 'string',
                    default: defaults.alternativeDefinitionCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeDefinitionCommand', "Alternative command id that is being executed when the result of 'Go to Definition' is the current location.")
                },
                'editor.gotoLocation.alternativeTypeDefinitionCommand': {
                    type: 'string',
                    default: defaults.alternativeTypeDefinitionCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeTypeDefinitionCommand', "Alternative command id that is being executed when the result of 'Go to Type Definition' is the current location.")
                },
                'editor.gotoLocation.alternativeDeclarationCommand': {
                    type: 'string',
                    default: defaults.alternativeDeclarationCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeDeclarationCommand', "Alternative command id that is being executed when the result of 'Go to Declaration' is the current location.")
                },
                'editor.gotoLocation.alternativeImplementationCommand': {
                    type: 'string',
                    default: defaults.alternativeImplementationCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeImplementationCommand', "Alternative command id that is being executed when the result of 'Go to Implementation' is the current location.")
                },
                'editor.gotoLocation.alternativeReferenceCommand': {
                    type: 'string',
                    default: defaults.alternativeReferenceCommand,
                    enum: alternativeCommandOptions,
                    description: nls.localize('alternativeReferenceCommand', "Alternative command id that is being executed when the result of 'Go to Reference' is the current location.")
                },
            });
        }
        validate(_input) {
            var _a, _b, _c, _d, _e;
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                multiple: stringSet(input.multiple, this.defaultValue.multiple, ['peek', 'gotoAndPeek', 'goto']),
                multipleDefinitions: (_a = input.multipleDefinitions) !== null && _a !== void 0 ? _a : stringSet(input.multipleDefinitions, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                multipleTypeDefinitions: (_b = input.multipleTypeDefinitions) !== null && _b !== void 0 ? _b : stringSet(input.multipleTypeDefinitions, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                multipleDeclarations: (_c = input.multipleDeclarations) !== null && _c !== void 0 ? _c : stringSet(input.multipleDeclarations, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                multipleImplementations: (_d = input.multipleImplementations) !== null && _d !== void 0 ? _d : stringSet(input.multipleImplementations, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                multipleReferences: (_e = input.multipleReferences) !== null && _e !== void 0 ? _e : stringSet(input.multipleReferences, 'peek', ['peek', 'gotoAndPeek', 'goto']),
                alternativeDefinitionCommand: EditorStringOption.string(input.alternativeDefinitionCommand, this.defaultValue.alternativeDefinitionCommand),
                alternativeTypeDefinitionCommand: EditorStringOption.string(input.alternativeTypeDefinitionCommand, this.defaultValue.alternativeTypeDefinitionCommand),
                alternativeDeclarationCommand: EditorStringOption.string(input.alternativeDeclarationCommand, this.defaultValue.alternativeDeclarationCommand),
                alternativeImplementationCommand: EditorStringOption.string(input.alternativeImplementationCommand, this.defaultValue.alternativeImplementationCommand),
                alternativeReferenceCommand: EditorStringOption.string(input.alternativeReferenceCommand, this.defaultValue.alternativeReferenceCommand),
            };
        }
    }
    class EditorHover extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                delay: 300,
                sticky: true,
                above: true,
            };
            super(53 /* EditorOption.hover */, 'hover', defaults, {
                'editor.hover.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('hover.enabled', "Controls whether the hover is shown.")
                },
                'editor.hover.delay': {
                    type: 'number',
                    default: defaults.delay,
                    minimum: 0,
                    maximum: 10000,
                    description: nls.localize('hover.delay', "Controls the delay in milliseconds after which the hover is shown.")
                },
                'editor.hover.sticky': {
                    type: 'boolean',
                    default: defaults.sticky,
                    description: nls.localize('hover.sticky', "Controls whether the hover should remain visible when mouse is moved over it.")
                },
                'editor.hover.above': {
                    type: 'boolean',
                    default: defaults.above,
                    description: nls.localize('hover.above', "Prefer showing hovers above the line, if there's space.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                delay: EditorIntOption.clampedInt(input.delay, this.defaultValue.delay, 0, 10000),
                sticky: boolean(input.sticky, this.defaultValue.sticky),
                above: boolean(input.above, this.defaultValue.above),
            };
        }
    }
    var RenderMinimap;
    (function (RenderMinimap) {
        RenderMinimap[RenderMinimap["None"] = 0] = "None";
        RenderMinimap[RenderMinimap["Text"] = 1] = "Text";
        RenderMinimap[RenderMinimap["Blocks"] = 2] = "Blocks";
    })(RenderMinimap = exports.RenderMinimap || (exports.RenderMinimap = {}));
    /**
     * @internal
     */
    class EditorLayoutInfoComputer extends ComputedEditorOption {
        constructor() {
            super(131 /* EditorOption.layoutInfo */);
        }
        compute(env, options, _) {
            return EditorLayoutInfoComputer.computeLayout(options, {
                memory: env.memory,
                outerWidth: env.outerWidth,
                outerHeight: env.outerHeight,
                isDominatedByLongLines: env.isDominatedByLongLines,
                lineHeight: env.fontInfo.lineHeight,
                viewLineCount: env.viewLineCount,
                lineNumbersDigitCount: env.lineNumbersDigitCount,
                typicalHalfwidthCharacterWidth: env.fontInfo.typicalHalfwidthCharacterWidth,
                maxDigitWidth: env.fontInfo.maxDigitWidth,
                pixelRatio: env.pixelRatio
            });
        }
        static computeContainedMinimapLineCount(input) {
            const typicalViewportLineCount = input.height / input.lineHeight;
            const extraLinesBeyondLastLine = input.scrollBeyondLastLine ? (typicalViewportLineCount - 1) : 0;
            const desiredRatio = (input.viewLineCount + extraLinesBeyondLastLine) / (input.pixelRatio * input.height);
            const minimapLineCount = Math.floor(input.viewLineCount / desiredRatio);
            return { typicalViewportLineCount, extraLinesBeyondLastLine, desiredRatio, minimapLineCount };
        }
        static _computeMinimapLayout(input, memory) {
            const outerWidth = input.outerWidth;
            const outerHeight = input.outerHeight;
            const pixelRatio = input.pixelRatio;
            if (!input.minimap.enabled) {
                return {
                    renderMinimap: 0 /* RenderMinimap.None */,
                    minimapLeft: 0,
                    minimapWidth: 0,
                    minimapHeightIsEditorHeight: false,
                    minimapIsSampling: false,
                    minimapScale: 1,
                    minimapLineHeight: 1,
                    minimapCanvasInnerWidth: 0,
                    minimapCanvasInnerHeight: Math.floor(pixelRatio * outerHeight),
                    minimapCanvasOuterWidth: 0,
                    minimapCanvasOuterHeight: outerHeight,
                };
            }
            // Can use memory if only the `viewLineCount` and `remainingWidth` have changed
            const stableMinimapLayoutInput = memory.stableMinimapLayoutInput;
            const couldUseMemory = (stableMinimapLayoutInput
                // && input.outerWidth === lastMinimapLayoutInput.outerWidth !!! INTENTIONAL OMITTED
                && input.outerHeight === stableMinimapLayoutInput.outerHeight
                && input.lineHeight === stableMinimapLayoutInput.lineHeight
                && input.typicalHalfwidthCharacterWidth === stableMinimapLayoutInput.typicalHalfwidthCharacterWidth
                && input.pixelRatio === stableMinimapLayoutInput.pixelRatio
                && input.scrollBeyondLastLine === stableMinimapLayoutInput.scrollBeyondLastLine
                && input.minimap.enabled === stableMinimapLayoutInput.minimap.enabled
                && input.minimap.side === stableMinimapLayoutInput.minimap.side
                && input.minimap.size === stableMinimapLayoutInput.minimap.size
                && input.minimap.showSlider === stableMinimapLayoutInput.minimap.showSlider
                && input.minimap.renderCharacters === stableMinimapLayoutInput.minimap.renderCharacters
                && input.minimap.maxColumn === stableMinimapLayoutInput.minimap.maxColumn
                && input.minimap.scale === stableMinimapLayoutInput.minimap.scale
                && input.verticalScrollbarWidth === stableMinimapLayoutInput.verticalScrollbarWidth
                // && input.viewLineCount === lastMinimapLayoutInput.viewLineCount !!! INTENTIONAL OMITTED
                // && input.remainingWidth === lastMinimapLayoutInput.remainingWidth !!! INTENTIONAL OMITTED
                && input.isViewportWrapping === stableMinimapLayoutInput.isViewportWrapping);
            const lineHeight = input.lineHeight;
            const typicalHalfwidthCharacterWidth = input.typicalHalfwidthCharacterWidth;
            const scrollBeyondLastLine = input.scrollBeyondLastLine;
            const minimapRenderCharacters = input.minimap.renderCharacters;
            let minimapScale = (pixelRatio >= 2 ? Math.round(input.minimap.scale * 2) : input.minimap.scale);
            const minimapMaxColumn = input.minimap.maxColumn;
            const minimapSize = input.minimap.size;
            const minimapSide = input.minimap.side;
            const verticalScrollbarWidth = input.verticalScrollbarWidth;
            const viewLineCount = input.viewLineCount;
            const remainingWidth = input.remainingWidth;
            const isViewportWrapping = input.isViewportWrapping;
            const baseCharHeight = minimapRenderCharacters ? 2 : 3;
            let minimapCanvasInnerHeight = Math.floor(pixelRatio * outerHeight);
            const minimapCanvasOuterHeight = minimapCanvasInnerHeight / pixelRatio;
            let minimapHeightIsEditorHeight = false;
            let minimapIsSampling = false;
            let minimapLineHeight = baseCharHeight * minimapScale;
            let minimapCharWidth = minimapScale / pixelRatio;
            let minimapWidthMultiplier = 1;
            if (minimapSize === 'fill' || minimapSize === 'fit') {
                const { typicalViewportLineCount, extraLinesBeyondLastLine, desiredRatio, minimapLineCount } = EditorLayoutInfoComputer.computeContainedMinimapLineCount({
                    viewLineCount: viewLineCount,
                    scrollBeyondLastLine: scrollBeyondLastLine,
                    height: outerHeight,
                    lineHeight: lineHeight,
                    pixelRatio: pixelRatio
                });
                // ratio is intentionally not part of the layout to avoid the layout changing all the time
                // when doing sampling
                const ratio = viewLineCount / minimapLineCount;
                if (ratio > 1) {
                    minimapHeightIsEditorHeight = true;
                    minimapIsSampling = true;
                    minimapScale = 1;
                    minimapLineHeight = 1;
                    minimapCharWidth = minimapScale / pixelRatio;
                }
                else {
                    let fitBecomesFill = false;
                    let maxMinimapScale = minimapScale + 1;
                    if (minimapSize === 'fit') {
                        const effectiveMinimapHeight = Math.ceil((viewLineCount + extraLinesBeyondLastLine) * minimapLineHeight);
                        if (isViewportWrapping && couldUseMemory && remainingWidth <= memory.stableFitRemainingWidth) {
                            // There is a loop when using `fit` and viewport wrapping:
                            // - view line count impacts minimap layout
                            // - minimap layout impacts viewport width
                            // - viewport width impacts view line count
                            // To break the loop, once we go to a smaller minimap scale, we try to stick with it.
                            fitBecomesFill = true;
                            maxMinimapScale = memory.stableFitMaxMinimapScale;
                        }
                        else {
                            fitBecomesFill = (effectiveMinimapHeight > minimapCanvasInnerHeight);
                        }
                    }
                    if (minimapSize === 'fill' || fitBecomesFill) {
                        minimapHeightIsEditorHeight = true;
                        const configuredMinimapScale = minimapScale;
                        minimapLineHeight = Math.min(lineHeight * pixelRatio, Math.max(1, Math.floor(1 / desiredRatio)));
                        if (isViewportWrapping && couldUseMemory && remainingWidth <= memory.stableFitRemainingWidth) {
                            // There is a loop when using `fill` and viewport wrapping:
                            // - view line count impacts minimap layout
                            // - minimap layout impacts viewport width
                            // - viewport width impacts view line count
                            // To break the loop, once we go to a smaller minimap scale, we try to stick with it.
                            maxMinimapScale = memory.stableFitMaxMinimapScale;
                        }
                        minimapScale = Math.min(maxMinimapScale, Math.max(1, Math.floor(minimapLineHeight / baseCharHeight)));
                        if (minimapScale > configuredMinimapScale) {
                            minimapWidthMultiplier = Math.min(2, minimapScale / configuredMinimapScale);
                        }
                        minimapCharWidth = minimapScale / pixelRatio / minimapWidthMultiplier;
                        minimapCanvasInnerHeight = Math.ceil((Math.max(typicalViewportLineCount, viewLineCount + extraLinesBeyondLastLine)) * minimapLineHeight);
                        if (isViewportWrapping) {
                            // remember for next time
                            memory.stableMinimapLayoutInput = input;
                            memory.stableFitRemainingWidth = remainingWidth;
                            memory.stableFitMaxMinimapScale = minimapScale;
                        }
                        else {
                            memory.stableMinimapLayoutInput = null;
                            memory.stableFitRemainingWidth = 0;
                        }
                    }
                }
            }
            // Given:
            // (leaving 2px for the cursor to have space after the last character)
            // viewportColumn = (contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth
            // minimapWidth = viewportColumn * minimapCharWidth
            // contentWidth = remainingWidth - minimapWidth
            // What are good values for contentWidth and minimapWidth ?
            // minimapWidth = ((contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth) * minimapCharWidth
            // typicalHalfwidthCharacterWidth * minimapWidth = (contentWidth - verticalScrollbarWidth - 2) * minimapCharWidth
            // typicalHalfwidthCharacterWidth * minimapWidth = (remainingWidth - minimapWidth - verticalScrollbarWidth - 2) * minimapCharWidth
            // (typicalHalfwidthCharacterWidth + minimapCharWidth) * minimapWidth = (remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth
            // minimapWidth = ((remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth) / (typicalHalfwidthCharacterWidth + minimapCharWidth)
            const minimapMaxWidth = Math.floor(minimapMaxColumn * minimapCharWidth);
            const minimapWidth = Math.min(minimapMaxWidth, Math.max(0, Math.floor(((remainingWidth - verticalScrollbarWidth - 2) * minimapCharWidth) / (typicalHalfwidthCharacterWidth + minimapCharWidth))) + exports.MINIMAP_GUTTER_WIDTH);
            let minimapCanvasInnerWidth = Math.floor(pixelRatio * minimapWidth);
            const minimapCanvasOuterWidth = minimapCanvasInnerWidth / pixelRatio;
            minimapCanvasInnerWidth = Math.floor(minimapCanvasInnerWidth * minimapWidthMultiplier);
            const renderMinimap = (minimapRenderCharacters ? 1 /* RenderMinimap.Text */ : 2 /* RenderMinimap.Blocks */);
            const minimapLeft = (minimapSide === 'left' ? 0 : (outerWidth - minimapWidth - verticalScrollbarWidth));
            return {
                renderMinimap,
                minimapLeft,
                minimapWidth,
                minimapHeightIsEditorHeight,
                minimapIsSampling,
                minimapScale,
                minimapLineHeight,
                minimapCanvasInnerWidth,
                minimapCanvasInnerHeight,
                minimapCanvasOuterWidth,
                minimapCanvasOuterHeight,
            };
        }
        static computeLayout(options, env) {
            const outerWidth = env.outerWidth | 0;
            const outerHeight = env.outerHeight | 0;
            const lineHeight = env.lineHeight | 0;
            const lineNumbersDigitCount = env.lineNumbersDigitCount | 0;
            const typicalHalfwidthCharacterWidth = env.typicalHalfwidthCharacterWidth;
            const maxDigitWidth = env.maxDigitWidth;
            const pixelRatio = env.pixelRatio;
            const viewLineCount = env.viewLineCount;
            const wordWrapOverride2 = options.get(123 /* EditorOption.wordWrapOverride2 */);
            const wordWrapOverride1 = (wordWrapOverride2 === 'inherit' ? options.get(122 /* EditorOption.wordWrapOverride1 */) : wordWrapOverride2);
            const wordWrap = (wordWrapOverride1 === 'inherit' ? options.get(118 /* EditorOption.wordWrap */) : wordWrapOverride1);
            const wordWrapColumn = options.get(121 /* EditorOption.wordWrapColumn */);
            const accessibilitySupport = options.get(2 /* EditorOption.accessibilitySupport */);
            const isDominatedByLongLines = env.isDominatedByLongLines;
            const showGlyphMargin = options.get(50 /* EditorOption.glyphMargin */);
            const showLineNumbers = (options.get(60 /* EditorOption.lineNumbers */).renderType !== 0 /* RenderLineNumbersType.Off */);
            const lineNumbersMinChars = options.get(61 /* EditorOption.lineNumbersMinChars */);
            const scrollBeyondLastLine = options.get(94 /* EditorOption.scrollBeyondLastLine */);
            const minimap = options.get(65 /* EditorOption.minimap */);
            const scrollbar = options.get(92 /* EditorOption.scrollbar */);
            const verticalScrollbarWidth = scrollbar.verticalScrollbarSize;
            const verticalScrollbarHasArrows = scrollbar.verticalHasArrows;
            const scrollbarArrowSize = scrollbar.arrowSize;
            const horizontalScrollbarHeight = scrollbar.horizontalScrollbarSize;
            const rawLineDecorationsWidth = options.get(58 /* EditorOption.lineDecorationsWidth */);
            const folding = options.get(37 /* EditorOption.folding */);
            let lineDecorationsWidth;
            if (typeof rawLineDecorationsWidth === 'string' && /^\d+(\.\d+)?ch$/.test(rawLineDecorationsWidth)) {
                const multiple = parseFloat(rawLineDecorationsWidth.substr(0, rawLineDecorationsWidth.length - 2));
                lineDecorationsWidth = EditorIntOption.clampedInt(multiple * typicalHalfwidthCharacterWidth, 0, 0, 1000);
            }
            else {
                lineDecorationsWidth = EditorIntOption.clampedInt(rawLineDecorationsWidth, 0, 0, 1000);
            }
            if (folding) {
                lineDecorationsWidth += 16;
            }
            let lineNumbersWidth = 0;
            if (showLineNumbers) {
                const digitCount = Math.max(lineNumbersDigitCount, lineNumbersMinChars);
                lineNumbersWidth = Math.round(digitCount * maxDigitWidth);
            }
            let glyphMarginWidth = 0;
            if (showGlyphMargin) {
                glyphMarginWidth = lineHeight;
            }
            let glyphMarginLeft = 0;
            let lineNumbersLeft = glyphMarginLeft + glyphMarginWidth;
            let decorationsLeft = lineNumbersLeft + lineNumbersWidth;
            let contentLeft = decorationsLeft + lineDecorationsWidth;
            const remainingWidth = outerWidth - glyphMarginWidth - lineNumbersWidth - lineDecorationsWidth;
            let isWordWrapMinified = false;
            let isViewportWrapping = false;
            let wrappingColumn = -1;
            if (accessibilitySupport !== 2 /* AccessibilitySupport.Enabled */) {
                // See https://github.com/microsoft/vscode/issues/27766
                // Never enable wrapping when a screen reader is attached
                // because arrow down etc. will not move the cursor in the way
                // a screen reader expects.
                if (wordWrapOverride1 === 'inherit' && isDominatedByLongLines) {
                    // Force viewport width wrapping if model is dominated by long lines
                    isWordWrapMinified = true;
                    isViewportWrapping = true;
                }
                else if (wordWrap === 'on' || wordWrap === 'bounded') {
                    isViewportWrapping = true;
                }
                else if (wordWrap === 'wordWrapColumn') {
                    wrappingColumn = wordWrapColumn;
                }
            }
            const minimapLayout = EditorLayoutInfoComputer._computeMinimapLayout({
                outerWidth: outerWidth,
                outerHeight: outerHeight,
                lineHeight: lineHeight,
                typicalHalfwidthCharacterWidth: typicalHalfwidthCharacterWidth,
                pixelRatio: pixelRatio,
                scrollBeyondLastLine: scrollBeyondLastLine,
                minimap: minimap,
                verticalScrollbarWidth: verticalScrollbarWidth,
                viewLineCount: viewLineCount,
                remainingWidth: remainingWidth,
                isViewportWrapping: isViewportWrapping,
            }, env.memory || new ComputeOptionsMemory());
            if (minimapLayout.renderMinimap !== 0 /* RenderMinimap.None */ && minimapLayout.minimapLeft === 0) {
                // the minimap is rendered to the left, so move everything to the right
                glyphMarginLeft += minimapLayout.minimapWidth;
                lineNumbersLeft += minimapLayout.minimapWidth;
                decorationsLeft += minimapLayout.minimapWidth;
                contentLeft += minimapLayout.minimapWidth;
            }
            const contentWidth = remainingWidth - minimapLayout.minimapWidth;
            // (leaving 2px for the cursor to have space after the last character)
            const viewportColumn = Math.max(1, Math.floor((contentWidth - verticalScrollbarWidth - 2) / typicalHalfwidthCharacterWidth));
            const verticalArrowSize = (verticalScrollbarHasArrows ? scrollbarArrowSize : 0);
            if (isViewportWrapping) {
                // compute the actual wrappingColumn
                wrappingColumn = Math.max(1, viewportColumn);
                if (wordWrap === 'bounded') {
                    wrappingColumn = Math.min(wrappingColumn, wordWrapColumn);
                }
            }
            return {
                width: outerWidth,
                height: outerHeight,
                glyphMarginLeft: glyphMarginLeft,
                glyphMarginWidth: glyphMarginWidth,
                lineNumbersLeft: lineNumbersLeft,
                lineNumbersWidth: lineNumbersWidth,
                decorationsLeft: decorationsLeft,
                decorationsWidth: lineDecorationsWidth,
                contentLeft: contentLeft,
                contentWidth: contentWidth,
                minimap: minimapLayout,
                viewportColumn: viewportColumn,
                isWordWrapMinified: isWordWrapMinified,
                isViewportWrapping: isViewportWrapping,
                wrappingColumn: wrappingColumn,
                verticalScrollbarWidth: verticalScrollbarWidth,
                horizontalScrollbarHeight: horizontalScrollbarHeight,
                overviewRuler: {
                    top: verticalArrowSize,
                    width: verticalScrollbarWidth,
                    height: (outerHeight - 2 * verticalArrowSize),
                    right: 0
                }
            };
        }
    }
    exports.EditorLayoutInfoComputer = EditorLayoutInfoComputer;
    class EditorLightbulb extends BaseEditorOption {
        constructor() {
            const defaults = { enabled: true };
            super(57 /* EditorOption.lightbulb */, 'lightbulb', defaults, {
                'editor.lightbulb.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('codeActions', "Enables the code action lightbulb in the editor.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled)
            };
        }
    }
    class EditorInlayHints extends BaseEditorOption {
        constructor() {
            const defaults = { enabled: 'on', fontSize: 0, fontFamily: '', displayStyle: 'compact' };
            super(127 /* EditorOption.inlayHints */, 'inlayHints', defaults, {
                'editor.inlayHints.enabled': {
                    type: 'string',
                    default: defaults.enabled,
                    description: nls.localize('inlayHints.enable', "Enables the inlay hints in the editor."),
                    enum: ['on', 'onUnlessPressed', 'offUnlessPressed', 'off'],
                    markdownEnumDescriptions: [
                        nls.localize('editor.inlayHints.on', "Inlay hints are enabled"),
                        nls.localize('editor.inlayHints.onUnlessPressed', "Inlay hints are showing by default and hide when holding `Ctrl+Alt`"),
                        nls.localize('editor.inlayHints.offUnlessPressed', "Inlay hints are hidden by default and show when holding `Ctrl+Alt`"),
                        nls.localize('editor.inlayHints.off', "Inlay hints are disabled"),
                    ],
                },
                'editor.inlayHints.fontSize': {
                    type: 'number',
                    default: defaults.fontSize,
                    markdownDescription: nls.localize('inlayHints.fontSize', "Controls font size of inlay hints in the editor. As default the `#editor.fontSize#` is used when the configured value is less than `5` or greater than the editor font size.")
                },
                'editor.inlayHints.fontFamily': {
                    type: 'string',
                    default: defaults.fontFamily,
                    markdownDescription: nls.localize('inlayHints.fontFamily', "Controls font family of inlay hints in the editor. When set to empty, the `#editor.fontFamily#` is used.")
                },
                // 'editor.inlayHints.displayStyle': {
                // 	type: 'string',
                // 	enum: ['standard', 'compact'],
                // 	enumDescriptions: [
                // 		nls.localize('inlayHints.displayStyle.standard', "Renders inlay hints with the default style."),
                // 		nls.localize('inlayHints.displayStyle.compact', "Renders inlay hints without any padding, and removes the rounded borders."),
                // 	],
                // 	default: defaults.displayStyle,
                // 	description: nls.localize('inlayHints.displayStyle', "Controls the display style of inlay hints.")
                // }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            if (typeof input.enabled === 'boolean') {
                input.enabled = input.enabled ? 'on' : 'off';
            }
            return {
                enabled: stringSet(input.enabled, this.defaultValue.enabled, ['on', 'off', 'offUnlessPressed', 'onUnlessPressed']),
                fontSize: EditorIntOption.clampedInt(input.fontSize, this.defaultValue.fontSize, 0, 100),
                fontFamily: EditorStringOption.string(input.fontFamily, this.defaultValue.fontFamily),
                displayStyle: stringSet(input.displayStyle, this.defaultValue.displayStyle, ['standard', 'compact'])
            };
        }
    }
    //#endregion
    //#region lineHeight
    class EditorLineHeight extends EditorFloatOption {
        constructor() {
            super(59 /* EditorOption.lineHeight */, 'lineHeight', exports.EDITOR_FONT_DEFAULTS.lineHeight, x => EditorFloatOption.clamp(x, 0, 150), { markdownDescription: nls.localize('lineHeight', "Controls the line height. \n - Use 0 to automatically compute the line height from the font size.\n - Values between 0 and 8 will be used as a multiplier with the font size.\n - Values greater than or equal to 8 will be used as effective values.") });
        }
        compute(env, options, value) {
            // The lineHeight is computed from the fontSize if it is 0.
            // Moreover, the final lineHeight respects the editor zoom level.
            // So take the result from env.fontInfo
            return env.fontInfo.lineHeight;
        }
    }
    class EditorMinimap extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                size: 'proportional',
                side: 'right',
                showSlider: 'mouseover',
                renderCharacters: true,
                maxColumn: 120,
                scale: 1,
            };
            super(65 /* EditorOption.minimap */, 'minimap', defaults, {
                'editor.minimap.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('minimap.enabled', "Controls whether the minimap is shown.")
                },
                'editor.minimap.size': {
                    type: 'string',
                    enum: ['proportional', 'fill', 'fit'],
                    enumDescriptions: [
                        nls.localize('minimap.size.proportional', "The minimap has the same size as the editor contents (and might scroll)."),
                        nls.localize('minimap.size.fill', "The minimap will stretch or shrink as necessary to fill the height of the editor (no scrolling)."),
                        nls.localize('minimap.size.fit', "The minimap will shrink as necessary to never be larger than the editor (no scrolling)."),
                    ],
                    default: defaults.size,
                    description: nls.localize('minimap.size', "Controls the size of the minimap.")
                },
                'editor.minimap.side': {
                    type: 'string',
                    enum: ['left', 'right'],
                    default: defaults.side,
                    description: nls.localize('minimap.side', "Controls the side where to render the minimap.")
                },
                'editor.minimap.showSlider': {
                    type: 'string',
                    enum: ['always', 'mouseover'],
                    default: defaults.showSlider,
                    description: nls.localize('minimap.showSlider', "Controls when the minimap slider is shown.")
                },
                'editor.minimap.scale': {
                    type: 'number',
                    default: defaults.scale,
                    minimum: 1,
                    maximum: 3,
                    enum: [1, 2, 3],
                    description: nls.localize('minimap.scale', "Scale of content drawn in the minimap: 1, 2 or 3.")
                },
                'editor.minimap.renderCharacters': {
                    type: 'boolean',
                    default: defaults.renderCharacters,
                    description: nls.localize('minimap.renderCharacters', "Render the actual characters on a line as opposed to color blocks.")
                },
                'editor.minimap.maxColumn': {
                    type: 'number',
                    default: defaults.maxColumn,
                    description: nls.localize('minimap.maxColumn', "Limit the width of the minimap to render at most a certain number of columns.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                size: stringSet(input.size, this.defaultValue.size, ['proportional', 'fill', 'fit']),
                side: stringSet(input.side, this.defaultValue.side, ['right', 'left']),
                showSlider: stringSet(input.showSlider, this.defaultValue.showSlider, ['always', 'mouseover']),
                renderCharacters: boolean(input.renderCharacters, this.defaultValue.renderCharacters),
                scale: EditorIntOption.clampedInt(input.scale, 1, 1, 3),
                maxColumn: EditorIntOption.clampedInt(input.maxColumn, this.defaultValue.maxColumn, 1, 10000),
            };
        }
    }
    //#endregion
    //#region multiCursorModifier
    function _multiCursorModifierFromString(multiCursorModifier) {
        if (multiCursorModifier === 'ctrlCmd') {
            return (platform.isMacintosh ? 'metaKey' : 'ctrlKey');
        }
        return 'altKey';
    }
    class EditorPadding extends BaseEditorOption {
        constructor() {
            super(75 /* EditorOption.padding */, 'padding', { top: 0, bottom: 0 }, {
                'editor.padding.top': {
                    type: 'number',
                    default: 0,
                    minimum: 0,
                    maximum: 1000,
                    description: nls.localize('padding.top', "Controls the amount of space between the top edge of the editor and the first line.")
                },
                'editor.padding.bottom': {
                    type: 'number',
                    default: 0,
                    minimum: 0,
                    maximum: 1000,
                    description: nls.localize('padding.bottom', "Controls the amount of space between the bottom edge of the editor and the last line.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                top: EditorIntOption.clampedInt(input.top, 0, 0, 1000),
                bottom: EditorIntOption.clampedInt(input.bottom, 0, 0, 1000)
            };
        }
    }
    class EditorParameterHints extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                cycle: false
            };
            super(76 /* EditorOption.parameterHints */, 'parameterHints', defaults, {
                'editor.parameterHints.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('parameterHints.enabled', "Enables a pop-up that shows parameter documentation and type information as you type.")
                },
                'editor.parameterHints.cycle': {
                    type: 'boolean',
                    default: defaults.cycle,
                    description: nls.localize('parameterHints.cycle', "Controls whether the parameter hints menu cycles or closes when reaching the end of the list.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                cycle: boolean(input.cycle, this.defaultValue.cycle)
            };
        }
    }
    //#endregion
    //#region pixelRatio
    class EditorPixelRatio extends ComputedEditorOption {
        constructor() {
            super(129 /* EditorOption.pixelRatio */);
        }
        compute(env, options, _) {
            return env.pixelRatio;
        }
    }
    class EditorQuickSuggestions extends BaseEditorOption {
        constructor() {
            const defaults = {
                other: 'on',
                comments: 'off',
                strings: 'off'
            };
            const types = [
                { type: 'boolean' },
                {
                    type: 'string',
                    enum: ['on', 'inline', 'off'],
                    enumDescriptions: [nls.localize('on', "Quick suggestions show inside the suggest widget"), nls.localize('inline', "Quick suggestions show as ghost text"), nls.localize('off', "Quick suggestions are disabled")]
                }
            ];
            super(79 /* EditorOption.quickSuggestions */, 'quickSuggestions', defaults, {
                anyOf: [{
                        type: 'boolean',
                    }, {
                        type: 'object',
                        properties: {
                            strings: {
                                anyOf: types,
                                default: defaults.strings,
                                description: nls.localize('quickSuggestions.strings', "Enable quick suggestions inside strings.")
                            },
                            comments: {
                                anyOf: types,
                                default: defaults.comments,
                                description: nls.localize('quickSuggestions.comments', "Enable quick suggestions inside comments.")
                            },
                            other: {
                                anyOf: types,
                                default: defaults.other,
                                description: nls.localize('quickSuggestions.other', "Enable quick suggestions outside of strings and comments.")
                            },
                        }
                    }],
                default: defaults,
                markdownDescription: nls.localize('quickSuggestions', "Controls whether suggestions should automatically show up while typing.")
            });
            this.defaultValue = defaults;
        }
        validate(input) {
            if (typeof input === 'boolean') {
                // boolean -> all on/off
                const value = input ? 'on' : 'off';
                return { comments: value, strings: value, other: value };
            }
            if (!input || typeof input !== 'object') {
                // invalid object
                return this.defaultValue;
            }
            const { other, comments, strings } = input;
            const allowedValues = ['on', 'inline', 'off'];
            let validatedOther;
            let validatedComments;
            let validatedStrings;
            if (typeof other === 'boolean') {
                validatedOther = other ? 'on' : 'off';
            }
            else {
                validatedOther = stringSet(other, this.defaultValue.other, allowedValues);
            }
            if (typeof comments === 'boolean') {
                validatedComments = comments ? 'on' : 'off';
            }
            else {
                validatedComments = stringSet(comments, this.defaultValue.comments, allowedValues);
            }
            if (typeof strings === 'boolean') {
                validatedStrings = strings ? 'on' : 'off';
            }
            else {
                validatedStrings = stringSet(strings, this.defaultValue.strings, allowedValues);
            }
            return {
                other: validatedOther,
                comments: validatedComments,
                strings: validatedStrings
            };
        }
    }
    var RenderLineNumbersType;
    (function (RenderLineNumbersType) {
        RenderLineNumbersType[RenderLineNumbersType["Off"] = 0] = "Off";
        RenderLineNumbersType[RenderLineNumbersType["On"] = 1] = "On";
        RenderLineNumbersType[RenderLineNumbersType["Relative"] = 2] = "Relative";
        RenderLineNumbersType[RenderLineNumbersType["Interval"] = 3] = "Interval";
        RenderLineNumbersType[RenderLineNumbersType["Custom"] = 4] = "Custom";
    })(RenderLineNumbersType = exports.RenderLineNumbersType || (exports.RenderLineNumbersType = {}));
    class EditorRenderLineNumbersOption extends BaseEditorOption {
        constructor() {
            super(60 /* EditorOption.lineNumbers */, 'lineNumbers', { renderType: 1 /* RenderLineNumbersType.On */, renderFn: null }, {
                type: 'string',
                enum: ['off', 'on', 'relative', 'interval'],
                enumDescriptions: [
                    nls.localize('lineNumbers.off', "Line numbers are not rendered."),
                    nls.localize('lineNumbers.on', "Line numbers are rendered as absolute number."),
                    nls.localize('lineNumbers.relative', "Line numbers are rendered as distance in lines to cursor position."),
                    nls.localize('lineNumbers.interval', "Line numbers are rendered every 10 lines.")
                ],
                default: 'on',
                description: nls.localize('lineNumbers', "Controls the display of line numbers.")
            });
        }
        validate(lineNumbers) {
            let renderType = this.defaultValue.renderType;
            let renderFn = this.defaultValue.renderFn;
            if (typeof lineNumbers !== 'undefined') {
                if (typeof lineNumbers === 'function') {
                    renderType = 4 /* RenderLineNumbersType.Custom */;
                    renderFn = lineNumbers;
                }
                else if (lineNumbers === 'interval') {
                    renderType = 3 /* RenderLineNumbersType.Interval */;
                }
                else if (lineNumbers === 'relative') {
                    renderType = 2 /* RenderLineNumbersType.Relative */;
                }
                else if (lineNumbers === 'on') {
                    renderType = 1 /* RenderLineNumbersType.On */;
                }
                else {
                    renderType = 0 /* RenderLineNumbersType.Off */;
                }
            }
            return {
                renderType,
                renderFn
            };
        }
    }
    //#endregion
    //#region renderValidationDecorations
    /**
     * @internal
     */
    function filterValidationDecorations(options) {
        const renderValidationDecorations = options.get(87 /* EditorOption.renderValidationDecorations */);
        if (renderValidationDecorations === 'editable') {
            return options.get(81 /* EditorOption.readOnly */);
        }
        return renderValidationDecorations === 'on' ? false : true;
    }
    exports.filterValidationDecorations = filterValidationDecorations;
    class EditorRulers extends BaseEditorOption {
        constructor() {
            const defaults = [];
            const columnSchema = { type: 'number', description: nls.localize('rulers.size', "Number of monospace characters at which this editor ruler will render.") };
            super(91 /* EditorOption.rulers */, 'rulers', defaults, {
                type: 'array',
                items: {
                    anyOf: [
                        columnSchema,
                        {
                            type: [
                                'object'
                            ],
                            properties: {
                                column: columnSchema,
                                color: {
                                    type: 'string',
                                    description: nls.localize('rulers.color', "Color of this editor ruler."),
                                    format: 'color-hex'
                                }
                            }
                        }
                    ]
                },
                default: defaults,
                description: nls.localize('rulers', "Render vertical rulers after a certain number of monospace characters. Use multiple values for multiple rulers. No rulers are drawn if array is empty.")
            });
        }
        validate(input) {
            if (Array.isArray(input)) {
                const rulers = [];
                for (let _element of input) {
                    if (typeof _element === 'number') {
                        rulers.push({
                            column: EditorIntOption.clampedInt(_element, 0, 0, 10000),
                            color: null
                        });
                    }
                    else if (_element && typeof _element === 'object') {
                        const element = _element;
                        rulers.push({
                            column: EditorIntOption.clampedInt(element.column, 0, 0, 10000),
                            color: element.color
                        });
                    }
                }
                rulers.sort((a, b) => a.column - b.column);
                return rulers;
            }
            return this.defaultValue;
        }
    }
    function _scrollbarVisibilityFromString(visibility, defaultValue) {
        if (typeof visibility !== 'string') {
            return defaultValue;
        }
        switch (visibility) {
            case 'hidden': return 2 /* ScrollbarVisibility.Hidden */;
            case 'visible': return 3 /* ScrollbarVisibility.Visible */;
            default: return 1 /* ScrollbarVisibility.Auto */;
        }
    }
    class EditorScrollbar extends BaseEditorOption {
        constructor() {
            const defaults = {
                vertical: 1 /* ScrollbarVisibility.Auto */,
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                arrowSize: 11,
                useShadows: true,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                horizontalScrollbarSize: 12,
                horizontalSliderSize: 12,
                verticalScrollbarSize: 14,
                verticalSliderSize: 14,
                handleMouseWheel: true,
                alwaysConsumeMouseWheel: true,
                scrollByPage: false
            };
            super(92 /* EditorOption.scrollbar */, 'scrollbar', defaults, {
                'editor.scrollbar.vertical': {
                    type: 'string',
                    enum: ['auto', 'visible', 'hidden'],
                    enumDescriptions: [
                        nls.localize('scrollbar.vertical.auto', "The vertical scrollbar will be visible only when necessary."),
                        nls.localize('scrollbar.vertical.visible', "The vertical scrollbar will always be visible."),
                        nls.localize('scrollbar.vertical.fit', "The vertical scrollbar will always be hidden."),
                    ],
                    default: 'auto',
                    description: nls.localize('scrollbar.vertical', "Controls the visibility of the vertical scrollbar.")
                },
                'editor.scrollbar.horizontal': {
                    type: 'string',
                    enum: ['auto', 'visible', 'hidden'],
                    enumDescriptions: [
                        nls.localize('scrollbar.horizontal.auto', "The horizontal scrollbar will be visible only when necessary."),
                        nls.localize('scrollbar.horizontal.visible', "The horizontal scrollbar will always be visible."),
                        nls.localize('scrollbar.horizontal.fit', "The horizontal scrollbar will always be hidden."),
                    ],
                    default: 'auto',
                    description: nls.localize('scrollbar.horizontal', "Controls the visibility of the horizontal scrollbar.")
                },
                'editor.scrollbar.verticalScrollbarSize': {
                    type: 'number',
                    default: defaults.verticalScrollbarSize,
                    description: nls.localize('scrollbar.verticalScrollbarSize', "The width of the vertical scrollbar.")
                },
                'editor.scrollbar.horizontalScrollbarSize': {
                    type: 'number',
                    default: defaults.horizontalScrollbarSize,
                    description: nls.localize('scrollbar.horizontalScrollbarSize', "The height of the horizontal scrollbar.")
                },
                'editor.scrollbar.scrollByPage': {
                    type: 'boolean',
                    default: defaults.scrollByPage,
                    description: nls.localize('scrollbar.scrollByPage', "Controls whether clicks scroll by page or jump to click position.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            const horizontalScrollbarSize = EditorIntOption.clampedInt(input.horizontalScrollbarSize, this.defaultValue.horizontalScrollbarSize, 0, 1000);
            const verticalScrollbarSize = EditorIntOption.clampedInt(input.verticalScrollbarSize, this.defaultValue.verticalScrollbarSize, 0, 1000);
            return {
                arrowSize: EditorIntOption.clampedInt(input.arrowSize, this.defaultValue.arrowSize, 0, 1000),
                vertical: _scrollbarVisibilityFromString(input.vertical, this.defaultValue.vertical),
                horizontal: _scrollbarVisibilityFromString(input.horizontal, this.defaultValue.horizontal),
                useShadows: boolean(input.useShadows, this.defaultValue.useShadows),
                verticalHasArrows: boolean(input.verticalHasArrows, this.defaultValue.verticalHasArrows),
                horizontalHasArrows: boolean(input.horizontalHasArrows, this.defaultValue.horizontalHasArrows),
                handleMouseWheel: boolean(input.handleMouseWheel, this.defaultValue.handleMouseWheel),
                alwaysConsumeMouseWheel: boolean(input.alwaysConsumeMouseWheel, this.defaultValue.alwaysConsumeMouseWheel),
                horizontalScrollbarSize: horizontalScrollbarSize,
                horizontalSliderSize: EditorIntOption.clampedInt(input.horizontalSliderSize, horizontalScrollbarSize, 0, 1000),
                verticalScrollbarSize: verticalScrollbarSize,
                verticalSliderSize: EditorIntOption.clampedInt(input.verticalSliderSize, verticalScrollbarSize, 0, 1000),
                scrollByPage: boolean(input.scrollByPage, this.defaultValue.scrollByPage),
            };
        }
    }
    /**
     * @internal
    */
    exports.inUntrustedWorkspace = 'inUntrustedWorkspace';
    /**
     * @internal
     */
    exports.unicodeHighlightConfigKeys = {
        allowedCharacters: 'editor.unicodeHighlight.allowedCharacters',
        invisibleCharacters: 'editor.unicodeHighlight.invisibleCharacters',
        nonBasicASCII: 'editor.unicodeHighlight.nonBasicASCII',
        ambiguousCharacters: 'editor.unicodeHighlight.ambiguousCharacters',
        includeComments: 'editor.unicodeHighlight.includeComments',
        includeStrings: 'editor.unicodeHighlight.includeStrings',
        allowedLocales: 'editor.unicodeHighlight.allowedLocales',
    };
    class UnicodeHighlight extends BaseEditorOption {
        constructor() {
            const defaults = {
                nonBasicASCII: exports.inUntrustedWorkspace,
                invisibleCharacters: true,
                ambiguousCharacters: true,
                includeComments: exports.inUntrustedWorkspace,
                includeStrings: true,
                allowedCharacters: {},
                allowedLocales: { _os: true, _vscode: true },
            };
            super(113 /* EditorOption.unicodeHighlighting */, 'unicodeHighlight', defaults, {
                [exports.unicodeHighlightConfigKeys.nonBasicASCII]: {
                    restricted: true,
                    type: ['boolean', 'string'],
                    enum: [true, false, exports.inUntrustedWorkspace],
                    default: defaults.nonBasicASCII,
                    description: nls.localize('unicodeHighlight.nonBasicASCII', "Controls whether all non-basic ASCII characters are highlighted. Only characters between U+0020 and U+007E, tab, line-feed and carriage-return are considered basic ASCII.")
                },
                [exports.unicodeHighlightConfigKeys.invisibleCharacters]: {
                    restricted: true,
                    type: 'boolean',
                    default: defaults.invisibleCharacters,
                    description: nls.localize('unicodeHighlight.invisibleCharacters', "Controls whether characters that just reserve space or have no width at all are highlighted.")
                },
                [exports.unicodeHighlightConfigKeys.ambiguousCharacters]: {
                    restricted: true,
                    type: 'boolean',
                    default: defaults.ambiguousCharacters,
                    description: nls.localize('unicodeHighlight.ambiguousCharacters', "Controls whether characters are highlighted that can be confused with basic ASCII characters, except those that are common in the current user locale.")
                },
                [exports.unicodeHighlightConfigKeys.includeComments]: {
                    restricted: true,
                    type: ['boolean', 'string'],
                    enum: [true, false, exports.inUntrustedWorkspace],
                    default: defaults.includeComments,
                    description: nls.localize('unicodeHighlight.includeComments', "Controls whether characters in comments should also be subject to unicode highlighting.")
                },
                [exports.unicodeHighlightConfigKeys.includeStrings]: {
                    restricted: true,
                    type: ['boolean', 'string'],
                    enum: [true, false, exports.inUntrustedWorkspace],
                    default: defaults.includeStrings,
                    description: nls.localize('unicodeHighlight.includeStrings', "Controls whether characters in strings should also be subject to unicode highlighting.")
                },
                [exports.unicodeHighlightConfigKeys.allowedCharacters]: {
                    restricted: true,
                    type: 'object',
                    default: defaults.allowedCharacters,
                    description: nls.localize('unicodeHighlight.allowedCharacters', "Defines allowed characters that are not being highlighted."),
                    additionalProperties: {
                        type: 'boolean'
                    }
                },
                [exports.unicodeHighlightConfigKeys.allowedLocales]: {
                    restricted: true,
                    type: 'object',
                    additionalProperties: {
                        type: 'boolean'
                    },
                    default: defaults.allowedLocales,
                    description: nls.localize('unicodeHighlight.allowedLocales', "Unicode characters that are common in allowed locales are not being highlighted.")
                },
            });
        }
        applyUpdate(value, update) {
            let didChange = false;
            if (update.allowedCharacters) {
                // Treat allowedCharacters atomically
                if (!objects.equals(value.allowedCharacters, update.allowedCharacters)) {
                    value = Object.assign(Object.assign({}, value), { allowedCharacters: update.allowedCharacters });
                    didChange = true;
                }
            }
            if (update.allowedLocales) {
                // Treat allowedLocales atomically
                if (!objects.equals(value.allowedLocales, update.allowedLocales)) {
                    value = Object.assign(Object.assign({}, value), { allowedLocales: update.allowedLocales });
                    didChange = true;
                }
            }
            const result = super.applyUpdate(value, update);
            if (didChange) {
                return new ApplyUpdateResult(result.newValue, true);
            }
            return result;
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                nonBasicASCII: primitiveSet(input.nonBasicASCII, exports.inUntrustedWorkspace, [true, false, exports.inUntrustedWorkspace]),
                invisibleCharacters: boolean(input.invisibleCharacters, this.defaultValue.invisibleCharacters),
                ambiguousCharacters: boolean(input.ambiguousCharacters, this.defaultValue.ambiguousCharacters),
                includeComments: primitiveSet(input.includeComments, exports.inUntrustedWorkspace, [true, false, exports.inUntrustedWorkspace]),
                includeStrings: primitiveSet(input.includeStrings, exports.inUntrustedWorkspace, [true, false, exports.inUntrustedWorkspace]),
                allowedCharacters: this.validateBooleanMap(_input.allowedCharacters, this.defaultValue.allowedCharacters),
                allowedLocales: this.validateBooleanMap(_input.allowedLocales, this.defaultValue.allowedLocales),
            };
        }
        validateBooleanMap(map, defaultValue) {
            if ((typeof map !== 'object') || !map) {
                return defaultValue;
            }
            const result = {};
            for (const [key, value] of Object.entries(map)) {
                if (value === true) {
                    result[key] = true;
                }
            }
            return result;
        }
    }
    /**
     * Configuration options for inline suggestions
     */
    class InlineEditorSuggest extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: true,
                mode: 'subwordSmart'
            };
            super(55 /* EditorOption.inlineSuggest */, 'inlineSuggest', defaults, {
                'editor.inlineSuggest.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    description: nls.localize('inlineSuggest.enabled', "Controls whether to automatically show inline suggestions in the editor.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                mode: stringSet(input.mode, this.defaultValue.mode, ['prefix', 'subword', 'subwordSmart']),
            };
        }
    }
    /**
     * Configuration options for inline suggestions
     */
    class BracketPairColorization extends BaseEditorOption {
        constructor() {
            const defaults = {
                enabled: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions.enabled,
                independentColorPoolPerBracketType: textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions.independentColorPoolPerBracketType,
            };
            super(12 /* EditorOption.bracketPairColorization */, 'bracketPairColorization', defaults, {
                'editor.bracketPairColorization.enabled': {
                    type: 'boolean',
                    default: defaults.enabled,
                    markdownDescription: nls.localize('bracketPairColorization.enabled', "Controls whether bracket pair colorization is enabled or not. Use `#workbench.colorCustomizations#` to override the bracket highlight colors.")
                },
                'editor.bracketPairColorization.independentColorPoolPerBracketType': {
                    type: 'boolean',
                    default: defaults.independentColorPoolPerBracketType,
                    description: nls.localize('bracketPairColorization.independentColorPoolPerBracketType', "Controls whether each bracket type has its own independent color pool.")
                },
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                enabled: boolean(input.enabled, this.defaultValue.enabled),
                independentColorPoolPerBracketType: boolean(input.independentColorPoolPerBracketType, this.defaultValue.independentColorPoolPerBracketType),
            };
        }
    }
    /**
     * Configuration options for inline suggestions
     */
    class GuideOptions extends BaseEditorOption {
        constructor() {
            const defaults = {
                bracketPairs: false,
                bracketPairsHorizontal: 'active',
                highlightActiveBracketPair: true,
                indentation: true,
                highlightActiveIndentation: true
            };
            super(13 /* EditorOption.guides */, 'guides', defaults, {
                'editor.guides.bracketPairs': {
                    type: ['boolean', 'string'],
                    enum: [true, 'active', false],
                    enumDescriptions: [
                        nls.localize('editor.guides.bracketPairs.true', "Enables bracket pair guides."),
                        nls.localize('editor.guides.bracketPairs.active', "Enables bracket pair guides only for the active bracket pair."),
                        nls.localize('editor.guides.bracketPairs.false', "Disables bracket pair guides."),
                    ],
                    default: defaults.bracketPairs,
                    description: nls.localize('editor.guides.bracketPairs', "Controls whether bracket pair guides are enabled or not.")
                },
                'editor.guides.bracketPairsHorizontal': {
                    type: ['boolean', 'string'],
                    enum: [true, 'active', false],
                    enumDescriptions: [
                        nls.localize('editor.guides.bracketPairsHorizontal.true', "Enables horizontal guides as addition to vertical bracket pair guides."),
                        nls.localize('editor.guides.bracketPairsHorizontal.active', "Enables horizontal guides only for the active bracket pair."),
                        nls.localize('editor.guides.bracketPairsHorizontal.false', "Disables horizontal bracket pair guides."),
                    ],
                    default: defaults.bracketPairsHorizontal,
                    description: nls.localize('editor.guides.bracketPairsHorizontal', "Controls whether horizontal bracket pair guides are enabled or not.")
                },
                'editor.guides.highlightActiveBracketPair': {
                    type: 'boolean',
                    default: defaults.highlightActiveBracketPair,
                    description: nls.localize('editor.guides.highlightActiveBracketPair', "Controls whether the editor should highlight the active bracket pair.")
                },
                'editor.guides.indentation': {
                    type: 'boolean',
                    default: defaults.indentation,
                    description: nls.localize('editor.guides.indentation', "Controls whether the editor should render indent guides.")
                },
                'editor.guides.highlightActiveIndentation': {
                    type: ['boolean', 'string'],
                    enum: [true, 'always', false],
                    enumDescriptions: [
                        nls.localize('editor.guides.highlightActiveIndentation.true', "Highlights the active indent guide."),
                        nls.localize('editor.guides.highlightActiveIndentation.always', "Highlights the active indent guide even if bracket guides are highlighted."),
                        nls.localize('editor.guides.highlightActiveIndentation.false', "Do not highlight the active indent guide."),
                    ],
                    default: defaults.highlightActiveIndentation,
                    description: nls.localize('editor.guides.highlightActiveIndentation', "Controls whether the editor should highlight the active indent guide.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                bracketPairs: primitiveSet(input.bracketPairs, this.defaultValue.bracketPairs, [true, false, 'active']),
                bracketPairsHorizontal: primitiveSet(input.bracketPairsHorizontal, this.defaultValue.bracketPairsHorizontal, [true, false, 'active']),
                highlightActiveBracketPair: boolean(input.highlightActiveBracketPair, this.defaultValue.highlightActiveBracketPair),
                indentation: boolean(input.indentation, this.defaultValue.indentation),
                highlightActiveIndentation: primitiveSet(input.highlightActiveIndentation, this.defaultValue.highlightActiveIndentation, [true, false, 'always']),
            };
        }
    }
    function primitiveSet(value, defaultValue, allowedValues) {
        const idx = allowedValues.indexOf(value);
        if (idx === -1) {
            return defaultValue;
        }
        return allowedValues[idx];
    }
    class EditorSuggest extends BaseEditorOption {
        constructor() {
            const defaults = {
                insertMode: 'insert',
                filterGraceful: true,
                snippetsPreventQuickSuggestions: true,
                localityBonus: false,
                shareSuggestSelections: false,
                showIcons: true,
                showStatusBar: false,
                preview: false,
                previewMode: 'subwordSmart',
                showInlineDetails: true,
                showMethods: true,
                showFunctions: true,
                showConstructors: true,
                showDeprecated: true,
                showFields: true,
                showVariables: true,
                showClasses: true,
                showStructs: true,
                showInterfaces: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showKeywords: true,
                showWords: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showSnippets: true,
                showUsers: true,
                showIssues: true,
            };
            super(106 /* EditorOption.suggest */, 'suggest', defaults, {
                'editor.suggest.insertMode': {
                    type: 'string',
                    enum: ['insert', 'replace'],
                    enumDescriptions: [
                        nls.localize('suggest.insertMode.insert', "Insert suggestion without overwriting text right of the cursor."),
                        nls.localize('suggest.insertMode.replace', "Insert suggestion and overwrite text right of the cursor."),
                    ],
                    default: defaults.insertMode,
                    description: nls.localize('suggest.insertMode', "Controls whether words are overwritten when accepting completions. Note that this depends on extensions opting into this feature.")
                },
                'editor.suggest.filterGraceful': {
                    type: 'boolean',
                    default: defaults.filterGraceful,
                    description: nls.localize('suggest.filterGraceful', "Controls whether filtering and sorting suggestions accounts for small typos.")
                },
                'editor.suggest.localityBonus': {
                    type: 'boolean',
                    default: defaults.localityBonus,
                    description: nls.localize('suggest.localityBonus', "Controls whether sorting favors words that appear close to the cursor.")
                },
                'editor.suggest.shareSuggestSelections': {
                    type: 'boolean',
                    default: defaults.shareSuggestSelections,
                    markdownDescription: nls.localize('suggest.shareSuggestSelections', "Controls whether remembered suggestion selections are shared between multiple workspaces and windows (needs `#editor.suggestSelection#`).")
                },
                'editor.suggest.snippetsPreventQuickSuggestions': {
                    type: 'boolean',
                    default: defaults.snippetsPreventQuickSuggestions,
                    description: nls.localize('suggest.snippetsPreventQuickSuggestions', "Controls whether an active snippet prevents quick suggestions.")
                },
                'editor.suggest.showIcons': {
                    type: 'boolean',
                    default: defaults.showIcons,
                    description: nls.localize('suggest.showIcons', "Controls whether to show or hide icons in suggestions.")
                },
                'editor.suggest.showStatusBar': {
                    type: 'boolean',
                    default: defaults.showStatusBar,
                    description: nls.localize('suggest.showStatusBar', "Controls the visibility of the status bar at the bottom of the suggest widget.")
                },
                'editor.suggest.preview': {
                    type: 'boolean',
                    default: defaults.preview,
                    description: nls.localize('suggest.preview', "Controls whether to preview the suggestion outcome in the editor.")
                },
                'editor.suggest.showInlineDetails': {
                    type: 'boolean',
                    default: defaults.showInlineDetails,
                    description: nls.localize('suggest.showInlineDetails', "Controls whether suggest details show inline with the label or only in the details widget")
                },
                'editor.suggest.maxVisibleSuggestions': {
                    type: 'number',
                    deprecationMessage: nls.localize('suggest.maxVisibleSuggestions.dep', "This setting is deprecated. The suggest widget can now be resized."),
                },
                'editor.suggest.filteredTypes': {
                    type: 'object',
                    deprecationMessage: nls.localize('deprecated', "This setting is deprecated, please use separate settings like 'editor.suggest.showKeywords' or 'editor.suggest.showSnippets' instead.")
                },
                'editor.suggest.showMethods': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showMethods', "When enabled IntelliSense shows `method`-suggestions.")
                },
                'editor.suggest.showFunctions': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showFunctions', "When enabled IntelliSense shows `function`-suggestions.")
                },
                'editor.suggest.showConstructors': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showConstructors', "When enabled IntelliSense shows `constructor`-suggestions.")
                },
                'editor.suggest.showDeprecated': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showDeprecated', "When enabled IntelliSense shows `deprecated`-suggestions.")
                },
                'editor.suggest.showFields': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showFields', "When enabled IntelliSense shows `field`-suggestions.")
                },
                'editor.suggest.showVariables': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showVariables', "When enabled IntelliSense shows `variable`-suggestions.")
                },
                'editor.suggest.showClasses': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showClasss', "When enabled IntelliSense shows `class`-suggestions.")
                },
                'editor.suggest.showStructs': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showStructs', "When enabled IntelliSense shows `struct`-suggestions.")
                },
                'editor.suggest.showInterfaces': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showInterfaces', "When enabled IntelliSense shows `interface`-suggestions.")
                },
                'editor.suggest.showModules': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showModules', "When enabled IntelliSense shows `module`-suggestions.")
                },
                'editor.suggest.showProperties': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showPropertys', "When enabled IntelliSense shows `property`-suggestions.")
                },
                'editor.suggest.showEvents': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showEvents', "When enabled IntelliSense shows `event`-suggestions.")
                },
                'editor.suggest.showOperators': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showOperators', "When enabled IntelliSense shows `operator`-suggestions.")
                },
                'editor.suggest.showUnits': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showUnits', "When enabled IntelliSense shows `unit`-suggestions.")
                },
                'editor.suggest.showValues': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showValues', "When enabled IntelliSense shows `value`-suggestions.")
                },
                'editor.suggest.showConstants': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showConstants', "When enabled IntelliSense shows `constant`-suggestions.")
                },
                'editor.suggest.showEnums': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showEnums', "When enabled IntelliSense shows `enum`-suggestions.")
                },
                'editor.suggest.showEnumMembers': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showEnumMembers', "When enabled IntelliSense shows `enumMember`-suggestions.")
                },
                'editor.suggest.showKeywords': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showKeywords', "When enabled IntelliSense shows `keyword`-suggestions.")
                },
                'editor.suggest.showWords': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showTexts', "When enabled IntelliSense shows `text`-suggestions.")
                },
                'editor.suggest.showColors': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showColors', "When enabled IntelliSense shows `color`-suggestions.")
                },
                'editor.suggest.showFiles': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showFiles', "When enabled IntelliSense shows `file`-suggestions.")
                },
                'editor.suggest.showReferences': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showReferences', "When enabled IntelliSense shows `reference`-suggestions.")
                },
                'editor.suggest.showCustomcolors': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showCustomcolors', "When enabled IntelliSense shows `customcolor`-suggestions.")
                },
                'editor.suggest.showFolders': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showFolders', "When enabled IntelliSense shows `folder`-suggestions.")
                },
                'editor.suggest.showTypeParameters': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showTypeParameters', "When enabled IntelliSense shows `typeParameter`-suggestions.")
                },
                'editor.suggest.showSnippets': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showSnippets', "When enabled IntelliSense shows `snippet`-suggestions.")
                },
                'editor.suggest.showUsers': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showUsers', "When enabled IntelliSense shows `user`-suggestions.")
                },
                'editor.suggest.showIssues': {
                    type: 'boolean',
                    default: true,
                    markdownDescription: nls.localize('editor.suggest.showIssues', "When enabled IntelliSense shows `issues`-suggestions.")
                }
            });
        }
        validate(_input) {
            if (!_input || typeof _input !== 'object') {
                return this.defaultValue;
            }
            const input = _input;
            return {
                insertMode: stringSet(input.insertMode, this.defaultValue.insertMode, ['insert', 'replace']),
                filterGraceful: boolean(input.filterGraceful, this.defaultValue.filterGraceful),
                snippetsPreventQuickSuggestions: boolean(input.snippetsPreventQuickSuggestions, this.defaultValue.filterGraceful),
                localityBonus: boolean(input.localityBonus, this.defaultValue.localityBonus),
                shareSuggestSelections: boolean(input.shareSuggestSelections, this.defaultValue.shareSuggestSelections),
                showIcons: boolean(input.showIcons, this.defaultValue.showIcons),
                showStatusBar: boolean(input.showStatusBar, this.defaultValue.showStatusBar),
                preview: boolean(input.preview, this.defaultValue.preview),
                previewMode: stringSet(input.previewMode, this.defaultValue.previewMode, ['prefix', 'subword', 'subwordSmart']),
                showInlineDetails: boolean(input.showInlineDetails, this.defaultValue.showInlineDetails),
                showMethods: boolean(input.showMethods, this.defaultValue.showMethods),
                showFunctions: boolean(input.showFunctions, this.defaultValue.showFunctions),
                showConstructors: boolean(input.showConstructors, this.defaultValue.showConstructors),
                showDeprecated: boolean(input.showDeprecated, this.defaultValue.showDeprecated),
                showFields: boolean(input.showFields, this.defaultValue.showFields),
                showVariables: boolean(input.showVariables, this.defaultValue.showVariables),
                showClasses: boolean(input.showClasses, this.defaultValue.showClasses),
                showStructs: boolean(input.showStructs, this.defaultValue.showStructs),
                showInterfaces: boolean(input.showInterfaces, this.defaultValue.showInterfaces),
                showModules: boolean(input.showModules, this.defaultValue.showModules),
                showProperties: boolean(input.showProperties, this.defaultValue.showProperties),
                showEvents: boolean(input.showEvents, this.defaultValue.showEvents),
                showOperators: boolean(input.showOperators, this.defaultValue.showOperators),
                showUnits: boolean(input.showUnits, this.defaultValue.showUnits),
                showValues: boolean(input.showValues, this.defaultValue.showValues),
                showConstants: boolean(input.showConstants, this.defaultValue.showConstants),
                showEnums: boolean(input.showEnums, this.defaultValue.showEnums),
                showEnumMembers: boolean(input.showEnumMembers, this.defaultValue.showEnumMembers),
                showKeywords: boolean(input.showKeywords, this.defaultValue.showKeywords),
                showWords: boolean(input.showWords, this.defaultValue.showWords),
                showColors: boolean(input.showColors, this.defaultValue.showColors),
                showFiles: boolean(input.showFiles, this.defaultValue.showFiles),
                showReferences: boolean(input.showReferences, this.defaultValue.showReferences),
                showFolders: boolean(input.showFolders, this.defaultValue.showFolders),
                showTypeParameters: boolean(input.showTypeParameters, this.defaultValue.showTypeParameters),
                showSnippets: boolean(input.showSnippets, this.defaultValue.showSnippets),
                showUsers: boolean(input.showUsers, this.defaultValue.showUsers),
                showIssues: boolean(input.showIssues, this.defaultValue.showIssues),
            };
        }
    }
    class SmartSelect extends BaseEditorOption {
        constructor() {
            super(102 /* EditorOption.smartSelect */, 'smartSelect', {
                selectLeadingAndTrailingWhitespace: true
            }, {
                'editor.smartSelect.selectLeadingAndTrailingWhitespace': {
                    description: nls.localize('selectLeadingAndTrailingWhitespace', "Whether leading and trailing whitespace should always be selected."),
                    default: true,
                    type: 'boolean'
                }
            });
        }
        validate(input) {
            if (!input || typeof input !== 'object') {
                return this.defaultValue;
            }
            return {
                selectLeadingAndTrailingWhitespace: boolean(input.selectLeadingAndTrailingWhitespace, this.defaultValue.selectLeadingAndTrailingWhitespace)
            };
        }
    }
    //#endregion
    //#region tabFocusMode
    class EditorTabFocusMode extends ComputedEditorOption {
        constructor() {
            super(130 /* EditorOption.tabFocusMode */);
        }
        compute(env, options, _) {
            const readOnly = options.get(81 /* EditorOption.readOnly */);
            return (readOnly ? true : env.tabFocusMode);
        }
    }
    //#endregion
    //#region wrappingIndent
    /**
     * Describes how to indent wrapped lines.
     */
    var WrappingIndent;
    (function (WrappingIndent) {
        /**
         * No indentation => wrapped lines begin at column 1.
         */
        WrappingIndent[WrappingIndent["None"] = 0] = "None";
        /**
         * Same => wrapped lines get the same indentation as the parent.
         */
        WrappingIndent[WrappingIndent["Same"] = 1] = "Same";
        /**
         * Indent => wrapped lines get +1 indentation toward the parent.
         */
        WrappingIndent[WrappingIndent["Indent"] = 2] = "Indent";
        /**
         * DeepIndent => wrapped lines get +2 indentation toward the parent.
         */
        WrappingIndent[WrappingIndent["DeepIndent"] = 3] = "DeepIndent";
    })(WrappingIndent = exports.WrappingIndent || (exports.WrappingIndent = {}));
    function _wrappingIndentFromString(wrappingIndent) {
        switch (wrappingIndent) {
            case 'none': return 0 /* WrappingIndent.None */;
            case 'same': return 1 /* WrappingIndent.Same */;
            case 'indent': return 2 /* WrappingIndent.Indent */;
            case 'deepIndent': return 3 /* WrappingIndent.DeepIndent */;
        }
    }
    class EditorWrappingInfoComputer extends ComputedEditorOption {
        constructor() {
            super(132 /* EditorOption.wrappingInfo */);
        }
        compute(env, options, _) {
            const layoutInfo = options.get(131 /* EditorOption.layoutInfo */);
            return {
                isDominatedByLongLines: env.isDominatedByLongLines,
                isWordWrapMinified: layoutInfo.isWordWrapMinified,
                isViewportWrapping: layoutInfo.isViewportWrapping,
                wrappingColumn: layoutInfo.wrappingColumn,
            };
        }
    }
    //#endregion
    const DEFAULT_WINDOWS_FONT_FAMILY = 'Consolas, \'Courier New\', monospace';
    const DEFAULT_MAC_FONT_FAMILY = 'Menlo, Monaco, \'Courier New\', monospace';
    const DEFAULT_LINUX_FONT_FAMILY = '\'Droid Sans Mono\', \'monospace\', monospace';
    /**
     * @internal
     */
    exports.EDITOR_FONT_DEFAULTS = {
        fontFamily: (platform.isMacintosh ? DEFAULT_MAC_FONT_FAMILY : (platform.isLinux ? DEFAULT_LINUX_FONT_FAMILY : DEFAULT_WINDOWS_FONT_FAMILY)),
        fontWeight: 'normal',
        fontSize: (platform.isMacintosh ? 12 : 14),
        lineHeight: 0,
        letterSpacing: 0,
    };
    /**
     * @internal
     */
    exports.editorOptionsRegistry = [];
    function register(option) {
        exports.editorOptionsRegistry[option.id] = option;
        return option;
    }
    var EditorOption;
    (function (EditorOption) {
        EditorOption[EditorOption["acceptSuggestionOnCommitCharacter"] = 0] = "acceptSuggestionOnCommitCharacter";
        EditorOption[EditorOption["acceptSuggestionOnEnter"] = 1] = "acceptSuggestionOnEnter";
        EditorOption[EditorOption["accessibilitySupport"] = 2] = "accessibilitySupport";
        EditorOption[EditorOption["accessibilityPageSize"] = 3] = "accessibilityPageSize";
        EditorOption[EditorOption["ariaLabel"] = 4] = "ariaLabel";
        EditorOption[EditorOption["autoClosingBrackets"] = 5] = "autoClosingBrackets";
        EditorOption[EditorOption["autoClosingDelete"] = 6] = "autoClosingDelete";
        EditorOption[EditorOption["autoClosingOvertype"] = 7] = "autoClosingOvertype";
        EditorOption[EditorOption["autoClosingQuotes"] = 8] = "autoClosingQuotes";
        EditorOption[EditorOption["autoIndent"] = 9] = "autoIndent";
        EditorOption[EditorOption["automaticLayout"] = 10] = "automaticLayout";
        EditorOption[EditorOption["autoSurround"] = 11] = "autoSurround";
        EditorOption[EditorOption["bracketPairColorization"] = 12] = "bracketPairColorization";
        EditorOption[EditorOption["guides"] = 13] = "guides";
        EditorOption[EditorOption["codeLens"] = 14] = "codeLens";
        EditorOption[EditorOption["codeLensFontFamily"] = 15] = "codeLensFontFamily";
        EditorOption[EditorOption["codeLensFontSize"] = 16] = "codeLensFontSize";
        EditorOption[EditorOption["colorDecorators"] = 17] = "colorDecorators";
        EditorOption[EditorOption["columnSelection"] = 18] = "columnSelection";
        EditorOption[EditorOption["comments"] = 19] = "comments";
        EditorOption[EditorOption["contextmenu"] = 20] = "contextmenu";
        EditorOption[EditorOption["copyWithSyntaxHighlighting"] = 21] = "copyWithSyntaxHighlighting";
        EditorOption[EditorOption["cursorBlinking"] = 22] = "cursorBlinking";
        EditorOption[EditorOption["cursorSmoothCaretAnimation"] = 23] = "cursorSmoothCaretAnimation";
        EditorOption[EditorOption["cursorStyle"] = 24] = "cursorStyle";
        EditorOption[EditorOption["cursorSurroundingLines"] = 25] = "cursorSurroundingLines";
        EditorOption[EditorOption["cursorSurroundingLinesStyle"] = 26] = "cursorSurroundingLinesStyle";
        EditorOption[EditorOption["cursorWidth"] = 27] = "cursorWidth";
        EditorOption[EditorOption["disableLayerHinting"] = 28] = "disableLayerHinting";
        EditorOption[EditorOption["disableMonospaceOptimizations"] = 29] = "disableMonospaceOptimizations";
        EditorOption[EditorOption["domReadOnly"] = 30] = "domReadOnly";
        EditorOption[EditorOption["dragAndDrop"] = 31] = "dragAndDrop";
        EditorOption[EditorOption["emptySelectionClipboard"] = 32] = "emptySelectionClipboard";
        EditorOption[EditorOption["extraEditorClassName"] = 33] = "extraEditorClassName";
        EditorOption[EditorOption["fastScrollSensitivity"] = 34] = "fastScrollSensitivity";
        EditorOption[EditorOption["find"] = 35] = "find";
        EditorOption[EditorOption["fixedOverflowWidgets"] = 36] = "fixedOverflowWidgets";
        EditorOption[EditorOption["folding"] = 37] = "folding";
        EditorOption[EditorOption["foldingStrategy"] = 38] = "foldingStrategy";
        EditorOption[EditorOption["foldingHighlight"] = 39] = "foldingHighlight";
        EditorOption[EditorOption["foldingImportsByDefault"] = 40] = "foldingImportsByDefault";
        EditorOption[EditorOption["foldingMaximumRegions"] = 41] = "foldingMaximumRegions";
        EditorOption[EditorOption["unfoldOnClickAfterEndOfLine"] = 42] = "unfoldOnClickAfterEndOfLine";
        EditorOption[EditorOption["fontFamily"] = 43] = "fontFamily";
        EditorOption[EditorOption["fontInfo"] = 44] = "fontInfo";
        EditorOption[EditorOption["fontLigatures"] = 45] = "fontLigatures";
        EditorOption[EditorOption["fontSize"] = 46] = "fontSize";
        EditorOption[EditorOption["fontWeight"] = 47] = "fontWeight";
        EditorOption[EditorOption["formatOnPaste"] = 48] = "formatOnPaste";
        EditorOption[EditorOption["formatOnType"] = 49] = "formatOnType";
        EditorOption[EditorOption["glyphMargin"] = 50] = "glyphMargin";
        EditorOption[EditorOption["gotoLocation"] = 51] = "gotoLocation";
        EditorOption[EditorOption["hideCursorInOverviewRuler"] = 52] = "hideCursorInOverviewRuler";
        EditorOption[EditorOption["hover"] = 53] = "hover";
        EditorOption[EditorOption["inDiffEditor"] = 54] = "inDiffEditor";
        EditorOption[EditorOption["inlineSuggest"] = 55] = "inlineSuggest";
        EditorOption[EditorOption["letterSpacing"] = 56] = "letterSpacing";
        EditorOption[EditorOption["lightbulb"] = 57] = "lightbulb";
        EditorOption[EditorOption["lineDecorationsWidth"] = 58] = "lineDecorationsWidth";
        EditorOption[EditorOption["lineHeight"] = 59] = "lineHeight";
        EditorOption[EditorOption["lineNumbers"] = 60] = "lineNumbers";
        EditorOption[EditorOption["lineNumbersMinChars"] = 61] = "lineNumbersMinChars";
        EditorOption[EditorOption["linkedEditing"] = 62] = "linkedEditing";
        EditorOption[EditorOption["links"] = 63] = "links";
        EditorOption[EditorOption["matchBrackets"] = 64] = "matchBrackets";
        EditorOption[EditorOption["minimap"] = 65] = "minimap";
        EditorOption[EditorOption["mouseStyle"] = 66] = "mouseStyle";
        EditorOption[EditorOption["mouseWheelScrollSensitivity"] = 67] = "mouseWheelScrollSensitivity";
        EditorOption[EditorOption["mouseWheelZoom"] = 68] = "mouseWheelZoom";
        EditorOption[EditorOption["multiCursorMergeOverlapping"] = 69] = "multiCursorMergeOverlapping";
        EditorOption[EditorOption["multiCursorModifier"] = 70] = "multiCursorModifier";
        EditorOption[EditorOption["multiCursorPaste"] = 71] = "multiCursorPaste";
        EditorOption[EditorOption["occurrencesHighlight"] = 72] = "occurrencesHighlight";
        EditorOption[EditorOption["overviewRulerBorder"] = 73] = "overviewRulerBorder";
        EditorOption[EditorOption["overviewRulerLanes"] = 74] = "overviewRulerLanes";
        EditorOption[EditorOption["padding"] = 75] = "padding";
        EditorOption[EditorOption["parameterHints"] = 76] = "parameterHints";
        EditorOption[EditorOption["peekWidgetDefaultFocus"] = 77] = "peekWidgetDefaultFocus";
        EditorOption[EditorOption["definitionLinkOpensInPeek"] = 78] = "definitionLinkOpensInPeek";
        EditorOption[EditorOption["quickSuggestions"] = 79] = "quickSuggestions";
        EditorOption[EditorOption["quickSuggestionsDelay"] = 80] = "quickSuggestionsDelay";
        EditorOption[EditorOption["readOnly"] = 81] = "readOnly";
        EditorOption[EditorOption["renameOnType"] = 82] = "renameOnType";
        EditorOption[EditorOption["renderControlCharacters"] = 83] = "renderControlCharacters";
        EditorOption[EditorOption["renderFinalNewline"] = 84] = "renderFinalNewline";
        EditorOption[EditorOption["renderLineHighlight"] = 85] = "renderLineHighlight";
        EditorOption[EditorOption["renderLineHighlightOnlyWhenFocus"] = 86] = "renderLineHighlightOnlyWhenFocus";
        EditorOption[EditorOption["renderValidationDecorations"] = 87] = "renderValidationDecorations";
        EditorOption[EditorOption["renderWhitespace"] = 88] = "renderWhitespace";
        EditorOption[EditorOption["revealHorizontalRightPadding"] = 89] = "revealHorizontalRightPadding";
        EditorOption[EditorOption["roundedSelection"] = 90] = "roundedSelection";
        EditorOption[EditorOption["rulers"] = 91] = "rulers";
        EditorOption[EditorOption["scrollbar"] = 92] = "scrollbar";
        EditorOption[EditorOption["scrollBeyondLastColumn"] = 93] = "scrollBeyondLastColumn";
        EditorOption[EditorOption["scrollBeyondLastLine"] = 94] = "scrollBeyondLastLine";
        EditorOption[EditorOption["scrollPredominantAxis"] = 95] = "scrollPredominantAxis";
        EditorOption[EditorOption["selectionClipboard"] = 96] = "selectionClipboard";
        EditorOption[EditorOption["selectionHighlight"] = 97] = "selectionHighlight";
        EditorOption[EditorOption["selectOnLineNumbers"] = 98] = "selectOnLineNumbers";
        EditorOption[EditorOption["showFoldingControls"] = 99] = "showFoldingControls";
        EditorOption[EditorOption["showUnused"] = 100] = "showUnused";
        EditorOption[EditorOption["snippetSuggestions"] = 101] = "snippetSuggestions";
        EditorOption[EditorOption["smartSelect"] = 102] = "smartSelect";
        EditorOption[EditorOption["smoothScrolling"] = 103] = "smoothScrolling";
        EditorOption[EditorOption["stickyTabStops"] = 104] = "stickyTabStops";
        EditorOption[EditorOption["stopRenderingLineAfter"] = 105] = "stopRenderingLineAfter";
        EditorOption[EditorOption["suggest"] = 106] = "suggest";
        EditorOption[EditorOption["suggestFontSize"] = 107] = "suggestFontSize";
        EditorOption[EditorOption["suggestLineHeight"] = 108] = "suggestLineHeight";
        EditorOption[EditorOption["suggestOnTriggerCharacters"] = 109] = "suggestOnTriggerCharacters";
        EditorOption[EditorOption["suggestSelection"] = 110] = "suggestSelection";
        EditorOption[EditorOption["tabCompletion"] = 111] = "tabCompletion";
        EditorOption[EditorOption["tabIndex"] = 112] = "tabIndex";
        EditorOption[EditorOption["unicodeHighlighting"] = 113] = "unicodeHighlighting";
        EditorOption[EditorOption["unusualLineTerminators"] = 114] = "unusualLineTerminators";
        EditorOption[EditorOption["useShadowDOM"] = 115] = "useShadowDOM";
        EditorOption[EditorOption["useTabStops"] = 116] = "useTabStops";
        EditorOption[EditorOption["wordSeparators"] = 117] = "wordSeparators";
        EditorOption[EditorOption["wordWrap"] = 118] = "wordWrap";
        EditorOption[EditorOption["wordWrapBreakAfterCharacters"] = 119] = "wordWrapBreakAfterCharacters";
        EditorOption[EditorOption["wordWrapBreakBeforeCharacters"] = 120] = "wordWrapBreakBeforeCharacters";
        EditorOption[EditorOption["wordWrapColumn"] = 121] = "wordWrapColumn";
        EditorOption[EditorOption["wordWrapOverride1"] = 122] = "wordWrapOverride1";
        EditorOption[EditorOption["wordWrapOverride2"] = 123] = "wordWrapOverride2";
        EditorOption[EditorOption["wrappingIndent"] = 124] = "wrappingIndent";
        EditorOption[EditorOption["wrappingStrategy"] = 125] = "wrappingStrategy";
        EditorOption[EditorOption["showDeprecated"] = 126] = "showDeprecated";
        EditorOption[EditorOption["inlayHints"] = 127] = "inlayHints";
        // Leave these at the end (because they have dependencies!)
        EditorOption[EditorOption["editorClassName"] = 128] = "editorClassName";
        EditorOption[EditorOption["pixelRatio"] = 129] = "pixelRatio";
        EditorOption[EditorOption["tabFocusMode"] = 130] = "tabFocusMode";
        EditorOption[EditorOption["layoutInfo"] = 131] = "layoutInfo";
        EditorOption[EditorOption["wrappingInfo"] = 132] = "wrappingInfo";
    })(EditorOption = exports.EditorOption || (exports.EditorOption = {}));
    exports.EditorOptions = {
        acceptSuggestionOnCommitCharacter: register(new EditorBooleanOption(0 /* EditorOption.acceptSuggestionOnCommitCharacter */, 'acceptSuggestionOnCommitCharacter', true, { markdownDescription: nls.localize('acceptSuggestionOnCommitCharacter', "Controls whether suggestions should be accepted on commit characters. For example, in JavaScript, the semi-colon (`;`) can be a commit character that accepts a suggestion and types that character.") })),
        acceptSuggestionOnEnter: register(new EditorStringEnumOption(1 /* EditorOption.acceptSuggestionOnEnter */, 'acceptSuggestionOnEnter', 'on', ['on', 'smart', 'off'], {
            markdownEnumDescriptions: [
                '',
                nls.localize('acceptSuggestionOnEnterSmart', "Only accept a suggestion with `Enter` when it makes a textual change."),
                ''
            ],
            markdownDescription: nls.localize('acceptSuggestionOnEnter', "Controls whether suggestions should be accepted on `Enter`, in addition to `Tab`. Helps to avoid ambiguity between inserting new lines or accepting suggestions.")
        })),
        accessibilitySupport: register(new EditorAccessibilitySupport()),
        accessibilityPageSize: register(new EditorIntOption(3 /* EditorOption.accessibilityPageSize */, 'accessibilityPageSize', 10, 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, {
            description: nls.localize('accessibilityPageSize', "Controls the number of lines in the editor that can be read out by a screen reader at once. When we detect a screen reader we automatically set the default to be 500. Warning: this has a performance implication for numbers larger than the default.")
        })),
        ariaLabel: register(new EditorStringOption(4 /* EditorOption.ariaLabel */, 'ariaLabel', nls.localize('editorViewAccessibleLabel', "Editor content"))),
        autoClosingBrackets: register(new EditorStringEnumOption(5 /* EditorOption.autoClosingBrackets */, 'autoClosingBrackets', 'languageDefined', ['always', 'languageDefined', 'beforeWhitespace', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingBrackets.languageDefined', "Use language configurations to determine when to autoclose brackets."),
                nls.localize('editor.autoClosingBrackets.beforeWhitespace', "Autoclose brackets only when the cursor is to the left of whitespace."),
                '',
            ],
            description: nls.localize('autoClosingBrackets', "Controls whether the editor should automatically close brackets after the user adds an opening bracket.")
        })),
        autoClosingDelete: register(new EditorStringEnumOption(6 /* EditorOption.autoClosingDelete */, 'autoClosingDelete', 'auto', ['always', 'auto', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingDelete.auto', "Remove adjacent closing quotes or brackets only if they were automatically inserted."),
                '',
            ],
            description: nls.localize('autoClosingDelete', "Controls whether the editor should remove adjacent closing quotes or brackets when deleting.")
        })),
        autoClosingOvertype: register(new EditorStringEnumOption(7 /* EditorOption.autoClosingOvertype */, 'autoClosingOvertype', 'auto', ['always', 'auto', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingOvertype.auto', "Type over closing quotes or brackets only if they were automatically inserted."),
                '',
            ],
            description: nls.localize('autoClosingOvertype', "Controls whether the editor should type over closing quotes or brackets.")
        })),
        autoClosingQuotes: register(new EditorStringEnumOption(8 /* EditorOption.autoClosingQuotes */, 'autoClosingQuotes', 'languageDefined', ['always', 'languageDefined', 'beforeWhitespace', 'never'], {
            enumDescriptions: [
                '',
                nls.localize('editor.autoClosingQuotes.languageDefined', "Use language configurations to determine when to autoclose quotes."),
                nls.localize('editor.autoClosingQuotes.beforeWhitespace', "Autoclose quotes only when the cursor is to the left of whitespace."),
                '',
            ],
            description: nls.localize('autoClosingQuotes', "Controls whether the editor should automatically close quotes after the user adds an opening quote.")
        })),
        autoIndent: register(new EditorEnumOption(9 /* EditorOption.autoIndent */, 'autoIndent', 4 /* EditorAutoIndentStrategy.Full */, 'full', ['none', 'keep', 'brackets', 'advanced', 'full'], _autoIndentFromString, {
            enumDescriptions: [
                nls.localize('editor.autoIndent.none', "The editor will not insert indentation automatically."),
                nls.localize('editor.autoIndent.keep', "The editor will keep the current line's indentation."),
                nls.localize('editor.autoIndent.brackets', "The editor will keep the current line's indentation and honor language defined brackets."),
                nls.localize('editor.autoIndent.advanced', "The editor will keep the current line's indentation, honor language defined brackets and invoke special onEnterRules defined by languages."),
                nls.localize('editor.autoIndent.full', "The editor will keep the current line's indentation, honor language defined brackets, invoke special onEnterRules defined by languages, and honor indentationRules defined by languages."),
            ],
            description: nls.localize('autoIndent', "Controls whether the editor should automatically adjust the indentation when users type, paste, move or indent lines.")
        })),
        automaticLayout: register(new EditorBooleanOption(10 /* EditorOption.automaticLayout */, 'automaticLayout', false)),
        autoSurround: register(new EditorStringEnumOption(11 /* EditorOption.autoSurround */, 'autoSurround', 'languageDefined', ['languageDefined', 'quotes', 'brackets', 'never'], {
            enumDescriptions: [
                nls.localize('editor.autoSurround.languageDefined', "Use language configurations to determine when to automatically surround selections."),
                nls.localize('editor.autoSurround.quotes', "Surround with quotes but not brackets."),
                nls.localize('editor.autoSurround.brackets', "Surround with brackets but not quotes."),
                ''
            ],
            description: nls.localize('autoSurround', "Controls whether the editor should automatically surround selections when typing quotes or brackets.")
        })),
        bracketPairColorization: register(new BracketPairColorization()),
        bracketPairGuides: register(new GuideOptions()),
        stickyTabStops: register(new EditorBooleanOption(104 /* EditorOption.stickyTabStops */, 'stickyTabStops', false, { description: nls.localize('stickyTabStops', "Emulate selection behavior of tab characters when using spaces for indentation. Selection will stick to tab stops.") })),
        codeLens: register(new EditorBooleanOption(14 /* EditorOption.codeLens */, 'codeLens', true, { description: nls.localize('codeLens', "Controls whether the editor shows CodeLens.") })),
        codeLensFontFamily: register(new EditorStringOption(15 /* EditorOption.codeLensFontFamily */, 'codeLensFontFamily', '', { description: nls.localize('codeLensFontFamily', "Controls the font family for CodeLens.") })),
        codeLensFontSize: register(new EditorIntOption(16 /* EditorOption.codeLensFontSize */, 'codeLensFontSize', 0, 0, 100, {
            type: 'number',
            default: 0,
            minimum: 0,
            maximum: 100,
            markdownDescription: nls.localize('codeLensFontSize', "Controls the font size in pixels for CodeLens. When set to `0`, 90% of `#editor.fontSize#` is used.")
        })),
        colorDecorators: register(new EditorBooleanOption(17 /* EditorOption.colorDecorators */, 'colorDecorators', true, { description: nls.localize('colorDecorators', "Controls whether the editor should render the inline color decorators and color picker.") })),
        columnSelection: register(new EditorBooleanOption(18 /* EditorOption.columnSelection */, 'columnSelection', false, { description: nls.localize('columnSelection', "Enable that the selection with the mouse and keys is doing column selection.") })),
        comments: register(new EditorComments()),
        contextmenu: register(new EditorBooleanOption(20 /* EditorOption.contextmenu */, 'contextmenu', true)),
        copyWithSyntaxHighlighting: register(new EditorBooleanOption(21 /* EditorOption.copyWithSyntaxHighlighting */, 'copyWithSyntaxHighlighting', true, { description: nls.localize('copyWithSyntaxHighlighting', "Controls whether syntax highlighting should be copied into the clipboard.") })),
        cursorBlinking: register(new EditorEnumOption(22 /* EditorOption.cursorBlinking */, 'cursorBlinking', 1 /* TextEditorCursorBlinkingStyle.Blink */, 'blink', ['blink', 'smooth', 'phase', 'expand', 'solid'], _cursorBlinkingStyleFromString, { description: nls.localize('cursorBlinking', "Control the cursor animation style.") })),
        cursorSmoothCaretAnimation: register(new EditorBooleanOption(23 /* EditorOption.cursorSmoothCaretAnimation */, 'cursorSmoothCaretAnimation', false, { description: nls.localize('cursorSmoothCaretAnimation', "Controls whether the smooth caret animation should be enabled.") })),
        cursorStyle: register(new EditorEnumOption(24 /* EditorOption.cursorStyle */, 'cursorStyle', TextEditorCursorStyle.Line, 'line', ['line', 'block', 'underline', 'line-thin', 'block-outline', 'underline-thin'], _cursorStyleFromString, { description: nls.localize('cursorStyle', "Controls the cursor style.") })),
        cursorSurroundingLines: register(new EditorIntOption(25 /* EditorOption.cursorSurroundingLines */, 'cursorSurroundingLines', 0, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('cursorSurroundingLines', "Controls the minimal number of visible leading and trailing lines surrounding the cursor. Known as 'scrollOff' or 'scrollOffset' in some other editors.") })),
        cursorSurroundingLinesStyle: register(new EditorStringEnumOption(26 /* EditorOption.cursorSurroundingLinesStyle */, 'cursorSurroundingLinesStyle', 'default', ['default', 'all'], {
            enumDescriptions: [
                nls.localize('cursorSurroundingLinesStyle.default', "`cursorSurroundingLines` is enforced only when triggered via the keyboard or API."),
                nls.localize('cursorSurroundingLinesStyle.all', "`cursorSurroundingLines` is enforced always.")
            ],
            description: nls.localize('cursorSurroundingLinesStyle', "Controls when `cursorSurroundingLines` should be enforced.")
        })),
        cursorWidth: register(new EditorIntOption(27 /* EditorOption.cursorWidth */, 'cursorWidth', 0, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, { markdownDescription: nls.localize('cursorWidth', "Controls the width of the cursor when `#editor.cursorStyle#` is set to `line`.") })),
        disableLayerHinting: register(new EditorBooleanOption(28 /* EditorOption.disableLayerHinting */, 'disableLayerHinting', false)),
        disableMonospaceOptimizations: register(new EditorBooleanOption(29 /* EditorOption.disableMonospaceOptimizations */, 'disableMonospaceOptimizations', false)),
        domReadOnly: register(new EditorBooleanOption(30 /* EditorOption.domReadOnly */, 'domReadOnly', false)),
        dragAndDrop: register(new EditorBooleanOption(31 /* EditorOption.dragAndDrop */, 'dragAndDrop', true, { description: nls.localize('dragAndDrop', "Controls whether the editor should allow moving selections via drag and drop.") })),
        emptySelectionClipboard: register(new EditorEmptySelectionClipboard()),
        extraEditorClassName: register(new EditorStringOption(33 /* EditorOption.extraEditorClassName */, 'extraEditorClassName', '')),
        fastScrollSensitivity: register(new EditorFloatOption(34 /* EditorOption.fastScrollSensitivity */, 'fastScrollSensitivity', 5, x => (x <= 0 ? 5 : x), { markdownDescription: nls.localize('fastScrollSensitivity', "Scrolling speed multiplier when pressing `Alt`.") })),
        find: register(new EditorFind()),
        fixedOverflowWidgets: register(new EditorBooleanOption(36 /* EditorOption.fixedOverflowWidgets */, 'fixedOverflowWidgets', false)),
        folding: register(new EditorBooleanOption(37 /* EditorOption.folding */, 'folding', true, { description: nls.localize('folding', "Controls whether the editor has code folding enabled.") })),
        foldingStrategy: register(new EditorStringEnumOption(38 /* EditorOption.foldingStrategy */, 'foldingStrategy', 'auto', ['auto', 'indentation'], {
            enumDescriptions: [
                nls.localize('foldingStrategy.auto', "Use a language-specific folding strategy if available, else the indentation-based one."),
                nls.localize('foldingStrategy.indentation', "Use the indentation-based folding strategy."),
            ],
            description: nls.localize('foldingStrategy', "Controls the strategy for computing folding ranges.")
        })),
        foldingHighlight: register(new EditorBooleanOption(39 /* EditorOption.foldingHighlight */, 'foldingHighlight', true, { description: nls.localize('foldingHighlight', "Controls whether the editor should highlight folded ranges.") })),
        foldingImportsByDefault: register(new EditorBooleanOption(40 /* EditorOption.foldingImportsByDefault */, 'foldingImportsByDefault', false, { description: nls.localize('foldingImportsByDefault', "Controls whether the editor automatically collapses import ranges.") })),
        foldingMaximumRegions: register(new EditorIntOption(41 /* EditorOption.foldingMaximumRegions */, 'foldingMaximumRegions', 5000, 10, 65000, // limit must be less than foldingRanges MAX_FOLDING_REGIONS
        { description: nls.localize('foldingMaximumRegions', "The maximum number of foldable regions. Increasing this value may result in the editor becoming less responsive when the current source has a large number of foldable regions.") })),
        unfoldOnClickAfterEndOfLine: register(new EditorBooleanOption(42 /* EditorOption.unfoldOnClickAfterEndOfLine */, 'unfoldOnClickAfterEndOfLine', false, { description: nls.localize('unfoldOnClickAfterEndOfLine', "Controls whether clicking on the empty content after a folded line will unfold the line.") })),
        fontFamily: register(new EditorStringOption(43 /* EditorOption.fontFamily */, 'fontFamily', exports.EDITOR_FONT_DEFAULTS.fontFamily, { description: nls.localize('fontFamily', "Controls the font family.") })),
        fontInfo: register(new EditorFontInfo()),
        fontLigatures2: register(new EditorFontLigatures()),
        fontSize: register(new EditorFontSize()),
        fontWeight: register(new EditorFontWeight()),
        formatOnPaste: register(new EditorBooleanOption(48 /* EditorOption.formatOnPaste */, 'formatOnPaste', false, { description: nls.localize('formatOnPaste', "Controls whether the editor should automatically format the pasted content. A formatter must be available and the formatter should be able to format a range in a document.") })),
        formatOnType: register(new EditorBooleanOption(49 /* EditorOption.formatOnType */, 'formatOnType', false, { description: nls.localize('formatOnType', "Controls whether the editor should automatically format the line after typing.") })),
        glyphMargin: register(new EditorBooleanOption(50 /* EditorOption.glyphMargin */, 'glyphMargin', true, { description: nls.localize('glyphMargin', "Controls whether the editor should render the vertical glyph margin. Glyph margin is mostly used for debugging.") })),
        gotoLocation: register(new EditorGoToLocation()),
        hideCursorInOverviewRuler: register(new EditorBooleanOption(52 /* EditorOption.hideCursorInOverviewRuler */, 'hideCursorInOverviewRuler', false, { description: nls.localize('hideCursorInOverviewRuler', "Controls whether the cursor should be hidden in the overview ruler.") })),
        hover: register(new EditorHover()),
        inDiffEditor: register(new EditorBooleanOption(54 /* EditorOption.inDiffEditor */, 'inDiffEditor', false)),
        letterSpacing: register(new EditorFloatOption(56 /* EditorOption.letterSpacing */, 'letterSpacing', exports.EDITOR_FONT_DEFAULTS.letterSpacing, x => EditorFloatOption.clamp(x, -5, 20), { description: nls.localize('letterSpacing', "Controls the letter spacing in pixels.") })),
        lightbulb: register(new EditorLightbulb()),
        lineDecorationsWidth: register(new SimpleEditorOption(58 /* EditorOption.lineDecorationsWidth */, 'lineDecorationsWidth', 10)),
        lineHeight: register(new EditorLineHeight()),
        lineNumbers: register(new EditorRenderLineNumbersOption()),
        lineNumbersMinChars: register(new EditorIntOption(61 /* EditorOption.lineNumbersMinChars */, 'lineNumbersMinChars', 5, 1, 300)),
        linkedEditing: register(new EditorBooleanOption(62 /* EditorOption.linkedEditing */, 'linkedEditing', false, { description: nls.localize('linkedEditing', "Controls whether the editor has linked editing enabled. Depending on the language, related symbols, e.g. HTML tags, are updated while editing.") })),
        links: register(new EditorBooleanOption(63 /* EditorOption.links */, 'links', true, { description: nls.localize('links', "Controls whether the editor should detect links and make them clickable.") })),
        matchBrackets: register(new EditorStringEnumOption(64 /* EditorOption.matchBrackets */, 'matchBrackets', 'always', ['always', 'near', 'never'], { description: nls.localize('matchBrackets', "Highlight matching brackets.") })),
        minimap: register(new EditorMinimap()),
        mouseStyle: register(new EditorStringEnumOption(66 /* EditorOption.mouseStyle */, 'mouseStyle', 'text', ['text', 'default', 'copy'])),
        mouseWheelScrollSensitivity: register(new EditorFloatOption(67 /* EditorOption.mouseWheelScrollSensitivity */, 'mouseWheelScrollSensitivity', 1, x => (x === 0 ? 1 : x), { markdownDescription: nls.localize('mouseWheelScrollSensitivity', "A multiplier to be used on the `deltaX` and `deltaY` of mouse wheel scroll events.") })),
        mouseWheelZoom: register(new EditorBooleanOption(68 /* EditorOption.mouseWheelZoom */, 'mouseWheelZoom', false, { markdownDescription: nls.localize('mouseWheelZoom', "Zoom the font of the editor when using mouse wheel and holding `Ctrl`.") })),
        multiCursorMergeOverlapping: register(new EditorBooleanOption(69 /* EditorOption.multiCursorMergeOverlapping */, 'multiCursorMergeOverlapping', true, { description: nls.localize('multiCursorMergeOverlapping', "Merge multiple cursors when they are overlapping.") })),
        multiCursorModifier: register(new EditorEnumOption(70 /* EditorOption.multiCursorModifier */, 'multiCursorModifier', 'altKey', 'alt', ['ctrlCmd', 'alt'], _multiCursorModifierFromString, {
            markdownEnumDescriptions: [
                nls.localize('multiCursorModifier.ctrlCmd', "Maps to `Control` on Windows and Linux and to `Command` on macOS."),
                nls.localize('multiCursorModifier.alt', "Maps to `Alt` on Windows and Linux and to `Option` on macOS.")
            ],
            markdownDescription: nls.localize({
                key: 'multiCursorModifier',
                comment: [
                    '- `ctrlCmd` refers to a value the setting can take and should not be localized.',
                    '- `Control` and `Command` refer to the modifier keys Ctrl or Cmd on the keyboard and can be localized.'
                ]
            }, "The modifier to be used to add multiple cursors with the mouse. The Go to Definition and Open Link mouse gestures will adapt such that they do not conflict with the multicursor modifier. [Read more](https://code.visualstudio.com/docs/editor/codebasics#_multicursor-modifier).")
        })),
        multiCursorPaste: register(new EditorStringEnumOption(71 /* EditorOption.multiCursorPaste */, 'multiCursorPaste', 'spread', ['spread', 'full'], {
            markdownEnumDescriptions: [
                nls.localize('multiCursorPaste.spread', "Each cursor pastes a single line of the text."),
                nls.localize('multiCursorPaste.full', "Each cursor pastes the full text.")
            ],
            markdownDescription: nls.localize('multiCursorPaste', "Controls pasting when the line count of the pasted text matches the cursor count.")
        })),
        occurrencesHighlight: register(new EditorBooleanOption(72 /* EditorOption.occurrencesHighlight */, 'occurrencesHighlight', true, { description: nls.localize('occurrencesHighlight', "Controls whether the editor should highlight semantic symbol occurrences.") })),
        overviewRulerBorder: register(new EditorBooleanOption(73 /* EditorOption.overviewRulerBorder */, 'overviewRulerBorder', true, { description: nls.localize('overviewRulerBorder', "Controls whether a border should be drawn around the overview ruler.") })),
        overviewRulerLanes: register(new EditorIntOption(74 /* EditorOption.overviewRulerLanes */, 'overviewRulerLanes', 3, 0, 3)),
        padding: register(new EditorPadding()),
        parameterHints: register(new EditorParameterHints()),
        peekWidgetDefaultFocus: register(new EditorStringEnumOption(77 /* EditorOption.peekWidgetDefaultFocus */, 'peekWidgetDefaultFocus', 'tree', ['tree', 'editor'], {
            enumDescriptions: [
                nls.localize('peekWidgetDefaultFocus.tree', "Focus the tree when opening peek"),
                nls.localize('peekWidgetDefaultFocus.editor', "Focus the editor when opening peek")
            ],
            description: nls.localize('peekWidgetDefaultFocus', "Controls whether to focus the inline editor or the tree in the peek widget.")
        })),
        definitionLinkOpensInPeek: register(new EditorBooleanOption(78 /* EditorOption.definitionLinkOpensInPeek */, 'definitionLinkOpensInPeek', false, { description: nls.localize('definitionLinkOpensInPeek', "Controls whether the Go to Definition mouse gesture always opens the peek widget.") })),
        quickSuggestions: register(new EditorQuickSuggestions()),
        quickSuggestionsDelay: register(new EditorIntOption(80 /* EditorOption.quickSuggestionsDelay */, 'quickSuggestionsDelay', 10, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('quickSuggestionsDelay', "Controls the delay in milliseconds after which quick suggestions will show up.") })),
        readOnly: register(new EditorBooleanOption(81 /* EditorOption.readOnly */, 'readOnly', false)),
        renameOnType: register(new EditorBooleanOption(82 /* EditorOption.renameOnType */, 'renameOnType', false, { description: nls.localize('renameOnType', "Controls whether the editor auto renames on type."), markdownDeprecationMessage: nls.localize('renameOnTypeDeprecate', "Deprecated, use `editor.linkedEditing` instead.") })),
        renderControlCharacters: register(new EditorBooleanOption(83 /* EditorOption.renderControlCharacters */, 'renderControlCharacters', true, { description: nls.localize('renderControlCharacters', "Controls whether the editor should render control characters."), restricted: true })),
        renderFinalNewline: register(new EditorBooleanOption(84 /* EditorOption.renderFinalNewline */, 'renderFinalNewline', true, { description: nls.localize('renderFinalNewline', "Render last line number when the file ends with a newline.") })),
        renderLineHighlight: register(new EditorStringEnumOption(85 /* EditorOption.renderLineHighlight */, 'renderLineHighlight', 'line', ['none', 'gutter', 'line', 'all'], {
            enumDescriptions: [
                '',
                '',
                '',
                nls.localize('renderLineHighlight.all', "Highlights both the gutter and the current line."),
            ],
            description: nls.localize('renderLineHighlight', "Controls how the editor should render the current line highlight.")
        })),
        renderLineHighlightOnlyWhenFocus: register(new EditorBooleanOption(86 /* EditorOption.renderLineHighlightOnlyWhenFocus */, 'renderLineHighlightOnlyWhenFocus', false, { description: nls.localize('renderLineHighlightOnlyWhenFocus', "Controls if the editor should render the current line highlight only when the editor is focused.") })),
        renderValidationDecorations: register(new EditorStringEnumOption(87 /* EditorOption.renderValidationDecorations */, 'renderValidationDecorations', 'editable', ['editable', 'on', 'off'])),
        renderWhitespace: register(new EditorStringEnumOption(88 /* EditorOption.renderWhitespace */, 'renderWhitespace', 'selection', ['none', 'boundary', 'selection', 'trailing', 'all'], {
            enumDescriptions: [
                '',
                nls.localize('renderWhitespace.boundary', "Render whitespace characters except for single spaces between words."),
                nls.localize('renderWhitespace.selection', "Render whitespace characters only on selected text."),
                nls.localize('renderWhitespace.trailing', "Render only trailing whitespace characters."),
                ''
            ],
            description: nls.localize('renderWhitespace', "Controls how the editor should render whitespace characters.")
        })),
        revealHorizontalRightPadding: register(new EditorIntOption(89 /* EditorOption.revealHorizontalRightPadding */, 'revealHorizontalRightPadding', 30, 0, 1000)),
        roundedSelection: register(new EditorBooleanOption(90 /* EditorOption.roundedSelection */, 'roundedSelection', true, { description: nls.localize('roundedSelection', "Controls whether selections should have rounded corners.") })),
        rulers: register(new EditorRulers()),
        scrollbar: register(new EditorScrollbar()),
        scrollBeyondLastColumn: register(new EditorIntOption(93 /* EditorOption.scrollBeyondLastColumn */, 'scrollBeyondLastColumn', 5, 0, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, { description: nls.localize('scrollBeyondLastColumn', "Controls the number of extra characters beyond which the editor will scroll horizontally.") })),
        scrollBeyondLastLine: register(new EditorBooleanOption(94 /* EditorOption.scrollBeyondLastLine */, 'scrollBeyondLastLine', true, { description: nls.localize('scrollBeyondLastLine', "Controls whether the editor will scroll beyond the last line.") })),
        scrollPredominantAxis: register(new EditorBooleanOption(95 /* EditorOption.scrollPredominantAxis */, 'scrollPredominantAxis', true, { description: nls.localize('scrollPredominantAxis', "Scroll only along the predominant axis when scrolling both vertically and horizontally at the same time. Prevents horizontal drift when scrolling vertically on a trackpad.") })),
        selectionClipboard: register(new EditorBooleanOption(96 /* EditorOption.selectionClipboard */, 'selectionClipboard', true, {
            description: nls.localize('selectionClipboard', "Controls whether the Linux primary clipboard should be supported."),
            included: platform.isLinux
        })),
        selectionHighlight: register(new EditorBooleanOption(97 /* EditorOption.selectionHighlight */, 'selectionHighlight', true, { description: nls.localize('selectionHighlight', "Controls whether the editor should highlight matches similar to the selection.") })),
        selectOnLineNumbers: register(new EditorBooleanOption(98 /* EditorOption.selectOnLineNumbers */, 'selectOnLineNumbers', true)),
        showFoldingControls: register(new EditorStringEnumOption(99 /* EditorOption.showFoldingControls */, 'showFoldingControls', 'mouseover', ['always', 'mouseover'], {
            enumDescriptions: [
                nls.localize('showFoldingControls.always', "Always show the folding controls."),
                nls.localize('showFoldingControls.mouseover', "Only show the folding controls when the mouse is over the gutter."),
            ],
            description: nls.localize('showFoldingControls', "Controls when the folding controls on the gutter are shown.")
        })),
        showUnused: register(new EditorBooleanOption(100 /* EditorOption.showUnused */, 'showUnused', true, { description: nls.localize('showUnused', "Controls fading out of unused code.") })),
        showDeprecated: register(new EditorBooleanOption(126 /* EditorOption.showDeprecated */, 'showDeprecated', true, { description: nls.localize('showDeprecated', "Controls strikethrough deprecated variables.") })),
        inlayHints: register(new EditorInlayHints()),
        snippetSuggestions: register(new EditorStringEnumOption(101 /* EditorOption.snippetSuggestions */, 'snippetSuggestions', 'inline', ['top', 'bottom', 'inline', 'none'], {
            enumDescriptions: [
                nls.localize('snippetSuggestions.top', "Show snippet suggestions on top of other suggestions."),
                nls.localize('snippetSuggestions.bottom', "Show snippet suggestions below other suggestions."),
                nls.localize('snippetSuggestions.inline', "Show snippets suggestions with other suggestions."),
                nls.localize('snippetSuggestions.none', "Do not show snippet suggestions."),
            ],
            description: nls.localize('snippetSuggestions', "Controls whether snippets are shown with other suggestions and how they are sorted.")
        })),
        smartSelect: register(new SmartSelect()),
        smoothScrolling: register(new EditorBooleanOption(103 /* EditorOption.smoothScrolling */, 'smoothScrolling', false, { description: nls.localize('smoothScrolling', "Controls whether the editor will scroll using an animation.") })),
        stopRenderingLineAfter: register(new EditorIntOption(105 /* EditorOption.stopRenderingLineAfter */, 'stopRenderingLineAfter', 10000, -1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */)),
        suggest: register(new EditorSuggest()),
        inlineSuggest: register(new InlineEditorSuggest()),
        suggestFontSize: register(new EditorIntOption(107 /* EditorOption.suggestFontSize */, 'suggestFontSize', 0, 0, 1000, { markdownDescription: nls.localize('suggestFontSize', "Font size for the suggest widget. When set to `0`, the value of `#editor.fontSize#` is used.") })),
        suggestLineHeight: register(new EditorIntOption(108 /* EditorOption.suggestLineHeight */, 'suggestLineHeight', 0, 0, 1000, { markdownDescription: nls.localize('suggestLineHeight', "Line height for the suggest widget. When set to `0`, the value of `#editor.lineHeight#` is used. The minimum value is 8.") })),
        suggestOnTriggerCharacters: register(new EditorBooleanOption(109 /* EditorOption.suggestOnTriggerCharacters */, 'suggestOnTriggerCharacters', true, { description: nls.localize('suggestOnTriggerCharacters', "Controls whether suggestions should automatically show up when typing trigger characters.") })),
        suggestSelection: register(new EditorStringEnumOption(110 /* EditorOption.suggestSelection */, 'suggestSelection', 'first', ['first', 'recentlyUsed', 'recentlyUsedByPrefix'], {
            markdownEnumDescriptions: [
                nls.localize('suggestSelection.first', "Always select the first suggestion."),
                nls.localize('suggestSelection.recentlyUsed', "Select recent suggestions unless further typing selects one, e.g. `console.| -> console.log` because `log` has been completed recently."),
                nls.localize('suggestSelection.recentlyUsedByPrefix', "Select suggestions based on previous prefixes that have completed those suggestions, e.g. `co -> console` and `con -> const`."),
            ],
            description: nls.localize('suggestSelection', "Controls how suggestions are pre-selected when showing the suggest list.")
        })),
        tabCompletion: register(new EditorStringEnumOption(111 /* EditorOption.tabCompletion */, 'tabCompletion', 'off', ['on', 'off', 'onlySnippets'], {
            enumDescriptions: [
                nls.localize('tabCompletion.on', "Tab complete will insert the best matching suggestion when pressing tab."),
                nls.localize('tabCompletion.off', "Disable tab completions."),
                nls.localize('tabCompletion.onlySnippets', "Tab complete snippets when their prefix match. Works best when 'quickSuggestions' aren't enabled."),
            ],
            description: nls.localize('tabCompletion', "Enables tab completions.")
        })),
        tabIndex: register(new EditorIntOption(112 /* EditorOption.tabIndex */, 'tabIndex', 0, -1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */)),
        unicodeHighlight: register(new UnicodeHighlight()),
        unusualLineTerminators: register(new EditorStringEnumOption(114 /* EditorOption.unusualLineTerminators */, 'unusualLineTerminators', 'prompt', ['auto', 'off', 'prompt'], {
            enumDescriptions: [
                nls.localize('unusualLineTerminators.auto', "Unusual line terminators are automatically removed."),
                nls.localize('unusualLineTerminators.off', "Unusual line terminators are ignored."),
                nls.localize('unusualLineTerminators.prompt', "Unusual line terminators prompt to be removed."),
            ],
            description: nls.localize('unusualLineTerminators', "Remove unusual line terminators that might cause problems.")
        })),
        useShadowDOM: register(new EditorBooleanOption(115 /* EditorOption.useShadowDOM */, 'useShadowDOM', true)),
        useTabStops: register(new EditorBooleanOption(116 /* EditorOption.useTabStops */, 'useTabStops', true, { description: nls.localize('useTabStops', "Inserting and deleting whitespace follows tab stops.") })),
        wordSeparators: register(new EditorStringOption(117 /* EditorOption.wordSeparators */, 'wordSeparators', wordHelper_1.USUAL_WORD_SEPARATORS, { description: nls.localize('wordSeparators', "Characters that will be used as word separators when doing word related navigations or operations.") })),
        wordWrap: register(new EditorStringEnumOption(118 /* EditorOption.wordWrap */, 'wordWrap', 'off', ['off', 'on', 'wordWrapColumn', 'bounded'], {
            markdownEnumDescriptions: [
                nls.localize('wordWrap.off', "Lines will never wrap."),
                nls.localize('wordWrap.on', "Lines will wrap at the viewport width."),
                nls.localize({
                    key: 'wordWrap.wordWrapColumn',
                    comment: [
                        '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                    ]
                }, "Lines will wrap at `#editor.wordWrapColumn#`."),
                nls.localize({
                    key: 'wordWrap.bounded',
                    comment: [
                        '- viewport means the edge of the visible window size.',
                        '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                    ]
                }, "Lines will wrap at the minimum of viewport and `#editor.wordWrapColumn#`."),
            ],
            description: nls.localize({
                key: 'wordWrap',
                comment: [
                    '- \'off\', \'on\', \'wordWrapColumn\' and \'bounded\' refer to values the setting can take and should not be localized.',
                    '- `editor.wordWrapColumn` refers to a different setting and should not be localized.'
                ]
            }, "Controls how lines should wrap.")
        })),
        wordWrapBreakAfterCharacters: register(new EditorStringOption(119 /* EditorOption.wordWrapBreakAfterCharacters */, 'wordWrapBreakAfterCharacters', 
        // allow-any-unicode-next-line
        ' \t})]?|/&.,;¢°′″‰℃、。｡､￠，．：；？！％・･ゝゞヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻ｧｨｩｪｫｬｭｮｯｰ”〉》」』】〕）］｝｣')),
        wordWrapBreakBeforeCharacters: register(new EditorStringOption(120 /* EditorOption.wordWrapBreakBeforeCharacters */, 'wordWrapBreakBeforeCharacters', 
        // allow-any-unicode-next-line
        '([{‘“〈《「『【〔（［｛｢£¥＄￡￥+＋')),
        wordWrapColumn: register(new EditorIntOption(121 /* EditorOption.wordWrapColumn */, 'wordWrapColumn', 80, 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, {
            markdownDescription: nls.localize({
                key: 'wordWrapColumn',
                comment: [
                    '- `editor.wordWrap` refers to a different setting and should not be localized.',
                    '- \'wordWrapColumn\' and \'bounded\' refer to values the different setting can take and should not be localized.'
                ]
            }, "Controls the wrapping column of the editor when `#editor.wordWrap#` is `wordWrapColumn` or `bounded`.")
        })),
        wordWrapOverride1: register(new EditorStringEnumOption(122 /* EditorOption.wordWrapOverride1 */, 'wordWrapOverride1', 'inherit', ['off', 'on', 'inherit'])),
        wordWrapOverride2: register(new EditorStringEnumOption(123 /* EditorOption.wordWrapOverride2 */, 'wordWrapOverride2', 'inherit', ['off', 'on', 'inherit'])),
        wrappingIndent: register(new EditorEnumOption(124 /* EditorOption.wrappingIndent */, 'wrappingIndent', 1 /* WrappingIndent.Same */, 'same', ['none', 'same', 'indent', 'deepIndent'], _wrappingIndentFromString, {
            enumDescriptions: [
                nls.localize('wrappingIndent.none', "No indentation. Wrapped lines begin at column 1."),
                nls.localize('wrappingIndent.same', "Wrapped lines get the same indentation as the parent."),
                nls.localize('wrappingIndent.indent', "Wrapped lines get +1 indentation toward the parent."),
                nls.localize('wrappingIndent.deepIndent', "Wrapped lines get +2 indentation toward the parent."),
            ],
            description: nls.localize('wrappingIndent', "Controls the indentation of wrapped lines."),
        })),
        wrappingStrategy: register(new EditorStringEnumOption(125 /* EditorOption.wrappingStrategy */, 'wrappingStrategy', 'simple', ['simple', 'advanced'], {
            enumDescriptions: [
                nls.localize('wrappingStrategy.simple', "Assumes that all characters are of the same width. This is a fast algorithm that works correctly for monospace fonts and certain scripts (like Latin characters) where glyphs are of equal width."),
                nls.localize('wrappingStrategy.advanced', "Delegates wrapping points computation to the browser. This is a slow algorithm, that might cause freezes for large files, but it works correctly in all cases.")
            ],
            description: nls.localize('wrappingStrategy', "Controls the algorithm that computes wrapping points.")
        })),
        // Leave these at the end (because they have dependencies!)
        editorClassName: register(new EditorClassName()),
        pixelRatio: register(new EditorPixelRatio()),
        tabFocusMode: register(new EditorTabFocusMode()),
        layoutInfo: register(new EditorLayoutInfoComputer()),
        wrappingInfo: register(new EditorWrappingInfoComputer())
    };
});
//# sourceMappingURL=editorOptions.js.map