import PogObject from "../PogData";
import RenderLib from "../RenderLib";


// Persistant Data
let data = new PogObject("MarioMaker", {
    "newUser": true,
    "checkpoints": {},
    "toggle": true,
    "render": true
}, "data.json");

// Player Control Key Variables
const forward = Client.getKeyBindFromDescription("key.forward");
const left = Client.getKeyBindFromDescription("key.left");
const back = Client.getKeyBindFromDescription("key.back");
const right = Client.getKeyBindFromDescription("key.right");
const mouse = Client.getKeyBindFromDescription("key.attack");

// Other variables
const logo = "§8[§3M§6a§cr§2i§6o§cM§2a§6k§3e§2r§8] ";
const logo2 = "§8[§cM§2a§6r§3i§2o§3M§6a§ck§2e§6r§8] ";

// Help command
function help() {
    ChatLib.chat("\n" + logo + "§6Instruction Manual:\n");

    // Commands
    ChatLib.chat("§3Commands:");
    ChatLib.chat(" §b/mm help §8- §7Shows this message...");
    ChatLib.chat(" §b/mm check §8- §fCreates a checkpoint at current player position (refer to bottom for special arguments).");
    ChatLib.chat(" §b/mm run §8- §7Runs a line of \"code\", arguments same as `/mm check` but for one time use.");
    ChatLib.chat(" §b/mm list §8- §fPrints out all checkpoints.");
    ChatLib.chat(" §b/mm toggle §8- §7Turns module ON/OFF.");
    ChatLib.chat(" §b/mm show §8- §fTurns waypoint rendering ON/OFF.");
    ChatLib.chat(" §b/mm pop §8- §7Deletes the closest checkpoint to player.");
    ChatLib.chat(" §b/mm reset §8- §fDeletes all checkpoints.");

    // mm check
    ChatLib.chat("\n§3Checkpoint Guide (§b/mm check [...args§b]§3):");
    ChatLib.chat("§8- §bSingle Argument: §7[delay][key][raise]");
    ChatLib.chat("  §8- §bDelay: §fTimeout until key is pressed.");
    ChatLib.chat("  §8- §bKey: §7<w, a, s, d>");
    ChatLib.chat("  §8- §bRaise: §fTimeout until key is raised.");
    ChatLib.chat("§8- §7Different arguments must be seperated by spaces.");
    ChatLib.chat("§8- §fNote that the [delay] and [raise] are optional.");

    // Example
    ChatLib.chat("\n§3Example checkpoint: §b/mm check 1a s d3");
    ChatLib.chat(" §8- §7Waits 1 second then presses A.");
    ChatLib.chat(" §8- §fPresses S.");
    ChatLib.chat(" §8- §7Presses D then raises after 3 seconds.\n");
}
if (data.newUser) {
    help();
    data.newUser = false;
}

// Checkpoint waypoint rendering
const render = register("renderWorld", () => {
    Object.keys(data.checkpoints).forEach(pos => {
        const [x, y, z] = pos.split(", ").map(a => parseFloat(a));
        RenderLib.drawEspBox(x, y + 1.5, z, 0.5, 0.5, 0.224, 1, 0.078, 1, true);
        RenderLib.drawInnerEspBox(x, y + 1.5, z, 0.5, 0.5, 0.224, 1, 0.078, 0.25, true);
    });
});
if (!data.render) render.unregister();

function setKeys() {
    // Lift keys and set mouse
    if (forward.isKeyDown()) forward.setState(false);
    if (left.isKeyDown()) left.setState(false);
    if (back.isKeyDown()) back.setState(false);
    if (right.isKeyDown()) right.setState(false);
    if (!mouse.isKeyDown()) mouse.setState(true);
}

/**
 * Just runs a line of "code" to control player movement.
 * 
 * @param {String} line - User inputted command line to run.
 */
function runLine(line) {
    // Regex argument
    const action = line.match(/^(\d*)([a-zA-Z]*)(\d*)$/);
    if (!action) return;

    // Set timeout and keys
    const key = action[2] === 'w' ? forward :
        action[2] === 'a' ? left :
        action[2] === 's' ? back :
        action[2] === 'd' ? right : undefined;
    if (key === undefined) return;

    const delay = action[1] !== '' ? action[1] : 0;
    const raise = action[3] !== '' ? action[3] : undefined;
    const offset = Math.random() * 500 + 50;

    // Press and lift key
    setTimeout(() => {
        // Press key
        ChatLib.chat(`${logo}§7Pressing: ${key.getDescription()}...`);
        key.setState(true);

        // Lift key
        if (raise !== undefined) {
            setTimeout(() => {
                key.setState(false);
                ChatLib.chat(`${logo}§7Lifting: ${key.getDescription()}...`);
            }, raise * 1000);
        }
    }, delay * 1000 + offset);
}

// Check for player on checkpoint every 2 seconds
const track = register("step", () => {
    const pos = `${Player.getX().toFixed(2)}, ${Player.getY().toFixed(2)}, ${Player.getZ().toFixed(2)}`;
    if (pos in data.checkpoints) {
        // Press based on user command
        setKeys();
        data.checkpoints[pos].forEach(arg => {
            runLine(arg);
        });
    }
}).setDelay(2);
if (!data.toggle) track.unregister();

// Commands, very cool!
register("command", (...args) => {
    const command = args.slice(1);
    switch(args[0]) {
        case "help":
            help();
            break;
        case "add":
        case "check":
        case "run":
            // Check if valid command
            if (command.length === 0) {
                ChatLib.chat(logo + "§cError: No Arguments Found!`");
                ChatLib.chat(logo2 + "§cPlease refer to `/mm help` for a guide.");
                return;
            }

            // Save command to checkpoints or run it
            if (args[0] !== "run") {
                const pos = `${Player.getX().toFixed(2)}, ${Player.getY().toFixed(2)}, ${Player.getZ().toFixed(2)}`;
                data.checkpoints[pos] = command;
                ChatLib.chat(logo + "§aSuccessfully saved checkpoint!");
            } else {
                setTimeout(() => {
                    setKeys();
                    runLine(command.join(' '));
                }, 250);
            }

            break;
        case "list":
            ChatLib.chat(logo + "§3Checkpoints:");
            Object.keys(data.checkpoints).forEach(pos => {
                ChatLib.chat(`§b${pos} §8=> §7${data.checkpoints[pos].join(' ')}`);
            });
            break;
        case "toggle":
            // Toggles module
            data.toggle = !data.toggle;
            if (data.toggle) {
                track.register();
                ChatLib.chat(logo + "§aModule is now active!");
            } else {
                track.unregister();
                ChatLib.chat(logo + "§cModule is now inactive!");
            }
            break;
        case "render":
        case "show":
            // Toggles waypoint rendering
            data.render = !data.render;
            if (data.render) {
                render.register();
                ChatLib.chat(logo + "§aShowing all checkpoints!");
            } else {
                render.unregister();
                ChatLib.chat(logo + "§cHiding all checkpoints!");
            }
            break;
        case "delete":
        case "pop":
            const x = Player.getX();
            const y = Player.getY();
            const z = Player.getZ();
            let closest = 999;
            let checkpoint = undefined;

            // Find closest checkpoint
            Object.keys(data.checkpoints).forEach(pos => {
                const [a, b, c] = pos.split(", ");
                const distance = Math.hypot(a - x, b - y, z - c);
                if (distance < closest) {
                    closest = distance;
                    checkpoint = pos;
                }
            });

            // Delete checkpoint
            if (checkpoint !== undefined) {
                delete data.checkpoints[checkpoint];
                ChatLib.chat(logo + "§aDeleted closest checkpoint!");
            } else ChatLib.chat(logo + "§cCould not locate a checkpoint...");
            break;
        case "clear":
        case "reset":
            // Reset all checkpoints
            data.checkpoints = {};
            ChatLib.chat(logo + "§aSuccessfully reset checkpoints!");
            break;
        default:
            ChatLib.chat(logo + `§cError: Invalid Argument: "${args[0]}"!`);
            ChatLib.chat(logo2 + "§cPlease enter as `/mm <help, check, show, pop, reset>`.");
            break;
    }
}).setName("mm", true);

// Save data on game exit...
register("gameUnload", () => {
    data.save();
});
