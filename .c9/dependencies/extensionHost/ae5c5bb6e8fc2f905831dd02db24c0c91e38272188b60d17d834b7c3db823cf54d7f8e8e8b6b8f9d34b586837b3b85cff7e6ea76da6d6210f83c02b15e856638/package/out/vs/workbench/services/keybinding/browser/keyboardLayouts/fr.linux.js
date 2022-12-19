/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/keybinding/browser/keyboardLayouts/_.contribution"], function (require, exports, __contribution_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    __contribution_1.KeyboardLayoutContribution.INSTANCE.registerKeyboardLayout({
        layout: { model: 'pc104', group: 0, layout: 'fr', variant: '', options: '', rules: 'base' },
        secondaryLayouts: [],
        mapping: {
            Sleep: [],
            WakeUp: [],
            KeyA: ['q', 'Q', '@', 'Ω', 0],
            KeyB: ['b', 'B', '”', '’', 0],
            KeyC: ['c', 'C', '¢', '©', 0],
            KeyD: ['d', 'D', 'ð', 'Ð', 0],
            KeyE: ['e', 'E', '€', '¢', 0],
            KeyF: ['f', 'F', 'đ', 'ª', 0],
            KeyG: ['g', 'G', 'ŋ', 'Ŋ', 0],
            KeyH: ['h', 'H', 'ħ', 'Ħ', 0],
            KeyI: ['i', 'I', '→', 'ı', 0],
            KeyJ: ['j', 'J', '̉', '̛', 0],
            KeyK: ['k', 'K', 'ĸ', '&', 0],
            KeyL: ['l', 'L', 'ł', 'Ł', 0],
            KeyM: [',', '?', '́', '̋', 0],
            KeyN: ['n', 'N', 'n', 'N', 0],
            KeyO: ['o', 'O', 'ø', 'Ø', 0],
            KeyP: ['p', 'P', 'þ', 'Þ', 0],
            KeyQ: ['a', 'A', 'æ', 'Æ', 0],
            KeyR: ['r', 'R', '¶', '®', 0],
            KeyS: ['s', 'S', 'ß', '§', 0],
            KeyT: ['t', 'T', 'ŧ', 'Ŧ', 0],
            KeyU: ['u', 'U', '↓', '↑', 0],
            KeyV: ['v', 'V', '“', '‘', 0],
            KeyW: ['z', 'Z', '«', '<', 0],
            KeyX: ['x', 'X', '»', '>', 0],
            KeyY: ['y', 'Y', '←', '¥', 0],
            KeyZ: ['w', 'W', 'ł', 'Ł', 0],
            Digit1: ['&', '1', '¹', '¡', 0],
            Digit2: ['é', '2', '~', '⅛', 0],
            Digit3: ['"', '3', '#', '£', 0],
            Digit4: ['\'', '4', '{', '$', 0],
            Digit5: ['(', '5', '[', '⅜', 0],
            Digit6: ['-', '6', '|', '⅝', 0],
            Digit7: ['è', '7', '`', '⅞', 0],
            Digit8: ['_', '8', '\\', '™', 0],
            Digit9: ['ç', '9', '^', '±', 0],
            Digit0: ['à', '0', '@', '°', 0],
            Enter: ['\r', '\r', '\r', '\r', 0],
            Escape: ['\u001b', '\u001b', '\u001b', '\u001b', 0],
            Backspace: ['\b', '\b', '\b', '\b', 0],
            Tab: ['\t', '', '\t', '', 0],
            Space: [' ', ' ', ' ', ' ', 0],
            Minus: [')', '°', ']', '¿', 0],
            Equal: ['=', '+', '}', '̨', 0],
            BracketLeft: ['̂', '̈', '̈', '̊', 0],
            BracketRight: ['$', '£', '¤', '̄', 0],
            Backslash: ['*', 'µ', '̀', '̆', 0],
            Semicolon: ['m', 'M', 'µ', 'º', 0],
            Quote: ['ù', '%', '̂', '̌', 0],
            Backquote: ['²', '~', '¬', '¬', 0],
            Comma: [';', '.', '─', '×', 0],
            Period: [':', '/', '·', '÷', 0],
            Slash: ['!', '§', '̣', '̇', 0],
            CapsLock: [],
            F1: [],
            F2: [],
            F3: [],
            F4: [],
            F5: [],
            F6: [],
            F7: [],
            F8: [],
            F9: [],
            F10: [],
            F11: [],
            F12: [],
            PrintScreen: ['', '', '', '', 0],
            ScrollLock: [],
            Pause: [],
            Insert: [],
            Home: [],
            PageUp: ['/', '/', '/', '/', 0],
            Delete: [],
            End: [],
            PageDown: [],
            ArrowRight: [],
            ArrowLeft: [],
            ArrowDown: [],
            ArrowUp: [],
            NumLock: [],
            NumpadDivide: [],
            NumpadMultiply: ['*', '*', '*', '*', 0],
            NumpadSubtract: ['-', '-', '-', '-', 0],
            NumpadAdd: ['+', '+', '+', '+', 0],
            NumpadEnter: [],
            Numpad1: ['', '1', '', '1', 0],
            Numpad2: ['', '2', '', '2', 0],
            Numpad3: ['', '3', '', '3', 0],
            Numpad4: ['', '4', '', '4', 0],
            Numpad5: ['', '5', '', '5', 0],
            Numpad6: ['', '6', '', '6', 0],
            Numpad7: ['', '7', '', '7', 0],
            Numpad8: ['', '8', '', '8', 0],
            Numpad9: ['', '9', '', '9', 0],
            Numpad0: ['', '0', '', '0', 0],
            NumpadDecimal: ['', '.', '', '.', 0],
            IntlBackslash: ['<', '>', '|', '¦', 0],
            ContextMenu: [],
            Power: [],
            NumpadEqual: [],
            F13: [],
            F14: [],
            F15: [],
            F16: [],
            F17: [],
            F18: [],
            F19: [],
            F20: [],
            F21: [],
            F22: [],
            F23: [],
            F24: [],
            Open: [],
            Help: [],
            Select: [],
            Again: [],
            Undo: [],
            Cut: [],
            Copy: [],
            Paste: [],
            Find: [],
            AudioVolumeMute: [],
            AudioVolumeUp: [],
            AudioVolumeDown: [],
            NumpadComma: [],
            IntlRo: [],
            KanaMode: [],
            IntlYen: [],
            Convert: [],
            NonConvert: [],
            Lang1: [],
            Lang2: [],
            Lang3: [],
            Lang4: [],
            Lang5: [],
            NumpadParenLeft: [],
            NumpadParenRight: [],
            ControlLeft: [],
            ShiftLeft: [],
            AltLeft: [],
            MetaLeft: [],
            ControlRight: [],
            ShiftRight: [],
            AltRight: ['\r', '\r', '\r', '\r', 0],
            MetaRight: ['.', '.', '.', '.', 0],
            BrightnessUp: [],
            BrightnessDown: [],
            MediaPlay: [],
            MediaRecord: [],
            MediaFastForward: [],
            MediaRewind: [],
            MediaTrackNext: [],
            MediaTrackPrevious: [],
            MediaStop: [],
            Eject: [],
            MediaPlayPause: [],
            MediaSelect: [],
            LaunchMail: [],
            LaunchApp2: [],
            LaunchApp1: [],
            SelectTask: [],
            LaunchScreenSaver: [],
            BrowserSearch: [],
            BrowserHome: [],
            BrowserBack: [],
            BrowserForward: [],
            BrowserStop: [],
            BrowserRefresh: [],
            BrowserFavorites: [],
            MailReply: [],
            MailForward: [],
            MailSend: []
        }
    });
});
//# sourceMappingURL=fr.linux.js.map