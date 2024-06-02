import RenderLib from "../RenderLib";
import data from "./src/data";
import { LOGO_1, LOGO_2 } from "./src/constants";
import { runLine, setKeys } from "./src/movement";


// Checkpoint waypoint rendering
const render = register("renderWorld", () => {
    Object.keys(data.checkpoints).forEach(pos => {
        const [x, y, z] = pos.split(", ").map(a => parseFloat(a));
        RenderLib.drawEspBox(x, y + 1.5, z, 0.5, 0.5, 0.224, 1, 0.078, 1, true);
        RenderLib.drawInnerEspBox(x, y + 1.5, z, 0.5, 0.5, 0.224, 1, 0.078, 0.25, true);
    });
});
if (!data.render) render.unregister();

// Help command
function help() {
    ChatLib.chat("\n" + LOGO_1 + "§6Instruction Manual:\n");

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
                ChatLib.chat(LOGO_1 + "§cError: No Arguments Found!`");
                ChatLib.chat(LOGO_2 + "§cPlease refer to `/mm help` for a guide.");
                return;
            }

            // Save command to checkpoints or run it
            if (args[0] !== "run") {
                const pos = `${Player.getX().toFixed(2)}, ${Player.getY().toFixed(2)}, ${Player.getZ().toFixed(2)}`;
                data.checkpoints[pos] = command;
                ChatLib.chat(LOGO_1 + "§aSuccessfully saved checkpoint!");
            } else {
                setTimeout(() => {
                    setKeys();
                    runLine(command.join(' '));
                }, 250);
            }

            break;
        case "list":
            ChatLib.chat(LOGO_1 + "§3Checkpoints:");
            Object.keys(data.checkpoints).forEach(pos => {
                ChatLib.chat(`§b${pos} §8=> §7${data.checkpoints[pos].join(' ')}`);
            });
            break;
        case "toggle":
            // Toggles module
            data.toggle = !data.toggle;
            if (data.toggle) {
                track.register();
                ChatLib.chat(LOGO_1 + "§aModule is now active!");
            } else {
                track.unregister();
                ChatLib.chat(LOGO_1 + "§cModule is now inactive!");
            }
            break;
        case "render":
        case "show":
            // Toggles waypoint rendering
            data.render = !data.render;
            if (data.render) {
                render.register();
                ChatLib.chat(LOGO_1 + "§aShowing all checkpoints!");
            } else {
                render.unregister();
                ChatLib.chat(LOGO_1 + "§cHiding all checkpoints!");
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
                ChatLib.chat(LOGO_1 + "§aDeleted closest checkpoint!");
            } else ChatLib.chat(LOGO_1 + "§cCould not locate a checkpoint...");
            break;
        case "clear":
        case "reset":
            // Reset all checkpoints
            data.checkpoints = {};
            ChatLib.chat(LOGO_1 + "§aSuccessfully reset checkpoints!");
            break;
        default:
            ChatLib.chat(LOGO_1 + `§cError: Invalid Argument: "${args[0]}"!`);
            ChatLib.chat(LOGO_2 + "§cPlease enter as `/mm <help, check, show, pop, reset>`.");
            break;
    }
}).setName("mm", true).setAliases("marioMaker", "mMaker");
