const { readXoredValue, makeXoredValue } = require('./scripts/util/byte-utils');
const { reqNative } = require('./scripts/util/req-native');

let autoType;
let callback;

const messageHandlers = {
    start() {},

    argon2(password, salt, options) {
        const argon2 = reqNative('argon2');

        password = readXoredValue(password);
        salt = readXoredValue(salt);

        return new Promise((resolve, reject) => {
            try {
                argon2.hash(password, salt, options, (err, res) => {
                    password.fill(0);
                    salt.fill(0);

                    if (err) {
                        reject(err);
                    } else {
                        resolve(makeXoredValue(res));
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    },

    kbdGetActiveWindow(options) {
        return getAutoType().activeWindow(options);
    },

    kbdGetActivePid() {
        return getAutoType().activePid();
    },

    kbdShowWindow(win) {
        return getAutoType().showWindow(win);
    },

    kbdText(str) {
        return getAutoType().text(str);
    },

    kbdTextAsKeys(str, mods) {
        return kbdTextAsKeys(str, mods);
    },

    kbdKeyPress(code, modifiers) {
        return getAutoType().keyPress(kbdKeyCode(code), kbdModifier(modifiers));
    },

    kbdShortcut(code) {
        return getAutoType().shortcut(kbdKeyCode(code));
    },

    kbdKeyMoveWithModifier(down, modifiers) {
        return getAutoType().keyMoveWithModifier(down, kbdModifier(modifiers));
    },

    kbdKeyPressWithCharacter(character, code, modifiers) {
        const typer = getAutoType();
        typer.keyMoveWithCharacter(true, character, code, kbdModifier(modifiers));
        typer.keyMoveWithCharacter(false, character, code, kbdModifier(modifiers));
    },

    kbdEnsureModifierNotPressed() {
        return getAutoType().ensureModifierNotPressed();
    }
};

function getAutoType() {
    if (!autoType) {
        const keyboardAutoType = reqNative('keyboard-auto-type');
        autoType = new keyboardAutoType.AutoType();
        autoType.setCheckPressedModifiers(false);
    }
    return autoType;
}

function kbdKeyCode(code) {
    const { KeyCode } = reqNative('keyboard-auto-type');
    const kbdCode = KeyCode[code];
    if (!kbdCode) {
        throw new Error(`Bad code: ${code}`);
    }
    return kbdCode;
}

function kbdModifier(modifiers) {
    const { Modifier } = reqNative('keyboard-auto-type');
    let modifier = Modifier.None;
    if (modifiers) {
        for (const mod of modifiers) {
            if (!Modifier[mod]) {
                throw new Error(`Bad modifier: ${mod}`);
            }
            modifier |= Modifier[mod];
        }
    }
    return modifier;
}

function kbdTextAsKeys(str, modifiers) {
    const modifier = kbdModifier(modifiers);
    let ix = 0;
    const typer = getAutoType();
    const tx = typer.beginBatchTextEntry();
    try {
        for (const kc of typer.osKeyCodesForChars(str)) {
            const char = str[ix++];
            let effectiveModifier = modifier;
            if (kc?.modifier) {
                typer.keyMoveWithModifier(true, kc.modifier);
                effectiveModifier |= kc.modifier;
            }
            if (kc) {
                typer.keyMoveWithCharacter(true, null, kc.code, effectiveModifier);
                typer.keyMoveWithCharacter(false, null, kc.code, effectiveModifier);
            } else {
                typer.keyMoveWithCharacter(true, char, null, effectiveModifier);
                typer.keyMoveWithCharacter(false, char, null, effectiveModifier);
            }
            if (kc?.modifier) {
                typer.keyMoveWithModifier(false, kc.modifier);
            }
        }
    } finally {
        tx.done();
    }
}

function handleMessage({ callId, cmd, args }) {
    Promise.resolve()
        .then(() => {
            const handler = messageHandlers[cmd];
            if (handler) {
                return handler(...args);
            } else {
                throw new Error(`Handler not found: ${cmd}`);
            }
        })
        .then((result) => {
            callback('result', { callId, result });
        })
        .catch((error) => {
            error = errorToTransport(error);
            callback('result', { callId, error });
        });
}

function errorToTransport(error) {
    const obj = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
    };
    for (const [key, val] of Object.entries(error)) {
        obj[key] = val;
    }
    return obj;
}

function startInOwnProcess() {
    callback = (cmd, ...args) => {
        try {
            process.send({ cmd, args });
        } catch {}
    };

    process.on('message', handleMessage);

    process.on('disconnect', () => {
        process.exit(0);
    });
}

function startInMain(channel) {
    channel.on('send', handleMessage);
    callback = (cmd, ...args) => {
        channel.emit('message', { cmd, args });
    };
}

module.exports = { startInOwnProcess, startInMain };
