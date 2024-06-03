import data from "./data";
import { BACK, FORWARD, LEFT, LOGO_1, MOUSE, RIGHT } from "./constants";


let executing = false;

/**
 * Sets the keys to their default state. 
 */
export function setKeys() {
    // Lift keys and set MOUSE
    if (FORWARD.isKeyDown()) FORWARD.setState(false);
    if (LEFT.isKeyDown()) LEFT.setState(false);
    if (BACK.isKeyDown()) BACK.setState(false);
    if (RIGHT.isKeyDown()) RIGHT.setState(false);
    if (!MOUSE.isKeyDown()) MOUSE.setState(true);
}

/**
 * Just runs a line of "code" to control player movement.
 * 
 * @param {String} line - User inputted command line to run.
 */
export function runLine(line) {
    // Regex argument
    const action = line.match(/^(\d*\.?\d*)([a-zA-Z]*)(\d*\.?\d*)$/);
    if (!action) return;

    // Set timeout and keys
    const key = action[2] === 'w' ? FORWARD :
        action[2] === 'a' ? LEFT :
        action[2] === 's' ? BACK :
        action[2] === 'd' ? RIGHT : undefined;
    if (key === undefined) return;

    const delay = action[1] !== '' ? action[1] : 0;
    const raise = action[3] !== '' ? action[3] : undefined;
    const offset = Math.random() * 500 + 50;

    // Press and lift key
    setTimeout(() => {
        // Press key
        ChatLib.chat(`${LOGO_1}§7Pressing: ${key.getDescription()}...`);
        key.setState(true);

        // Lift key
        if (raise !== undefined) {
            setTimeout(() => {
                key.setState(false);
                ChatLib.chat(`${LOGO_1}§7Lifting: ${key.getDescription()}...`);
            }, raise * 1000);
        }
        executing = false;
    }, delay * 1000 + offset);
}

// Check for player on checkpoint every 2 seconds
export const track = register("step", () => {
    if (executing) return;

    const pos = `${Player.getX().toFixed(2)}, ${Player.getY().toFixed(2)}, ${Player.getZ().toFixed(2)}`;
    if (pos in data.checkpoints) {
        // Press based on user command
        executing = true;
        setKeys();
        data.checkpoints[pos].forEach(arg => {
            runLine(arg);
        });
    }
}).setDelay(2);
if (!data.toggle) track.unregister();
