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

/**
 * Prints out a help message to chat.
 */
function help() {
    ChatLib.chat(`
${LOGO_1} §6Instruction Manual:

§3Commands:");
 §b/mm help §8- §7Shows this message...
 §b/mm check §8- §fCreates a checkpoint at current player position (refer to bottom for special arguments).
 §b/mm run §8- §7Runs a line of "code", arguments same as \`/mm check\` but for one time use.
 §b/mm checkpoints §8- §fPrints out all checkpoints.
 §b/mm toggle §8- §7Turns module ON/OFF.
 §b/mm show §8- §fTurns waypoint rendering ON/OFF.
 §b/mm pop §8- §7Deletes the closest checkpoint to player.
 §b/mm reset §8- §fDeletes all checkpoints.

§3Caching:
 §b/mm save [key] §8- §7Saves checkpoints as a preset.
 §b/mm load [key] §8- §fLoads a preset of checkpoints.
 §b/mm delete [key] §8- §7Deletes a preset of checkpoints.
 §b/mm import §8- §fImports a preset of checkpoints from clipboard.
 §b/mm export §8- §7Copies a preset of checkpoints to clipboard.
 §b/mm list §8- §fLists all presets.

§3Checkpoint Guide (§b/mm check [...args§b]§3):
 §8- §bSingle Argument: §7[delay][key][raise]
 §8- §bDelay: §fTimeout until key is pressed.
 §8- §bKey: §7<w, a, s, d>
 §8- §bRaise: §fTimeout until key is raised.
 §8- §7Different arguments must be seperated by spaces.
 §8- §fNote that the [delay] and [raise] are optional.

§3Example checkpoint: §b/mm check 1a s d3
 §8- §7Waits 1 second then presses A.
 §8- §fPresses S.
 §8- §7Presses D then raises after 3 seconds.\n`);
}
if (data.newUser) {
    help();
    data.newUser = false;
}

/**
 * Prints a list of items to chat.
 * 
 * @param {Object} list - The list to be printed.
 * @param {String} name - The name of the list.
 * @param {Number} page - The page number to display.
 */
function printList(list, name, page) {
    if (isNaN(page)) page = 1;

    ChatLib.clearChat(5589);
    const length = Object.keys(list).length;
    const total = Math.ceil(length / 12) || 1;
    page = MathLib.clamp(page, 1, total);

    // Print out header
    const message = new Message("\n&c&m-----------------------------------------------------&r").setChatLineId(5589);
    const header = ChatLib.getCenteredText(`${LOGO_1} ${page > 1 ? "<< " : ""}(Page ${page} of ${total})${page < total ? " >>" : ""}`);
    const whitespace = header.match(/^\s+/)[0];
    
    const lArrow = new TextComponent("&r&e&l<<&r&9")
        .setClickAction("run_command")
        .setClickValue(`/mm ${name} ${page - 1}`)
        .setHoverValue(`§eClick to view page ${page - 1}.`);
    const rArrow = new TextComponent("&r&e&l>>")
        .setClickAction("run_command")
        .setClickValue(`/mm ${name} ${page + 1}`)
        .setHoverValue(`§eClick to view page ${page + 1}.`);
    message.addTextComponent(whitespace);
    
    if (page > 1) message.addTextComponent(lArrow);
    message.addTextComponent(` §6${LOGO_1} §8(§fPage §7${page} §fof §7${total}§8) `);
    if (page < total) message.addTextComponent(rArrow);

    // Loop through variables
    const pageIndex = (page - 1) * 12;
    if (length === 0) message.addTextComponent(`\n` + ChatLib.getCenteredText("  §e404, This list is empty!"));
    else {
        const keys = Object.keys(list);
        const command = name === "checkpoints" ? "remove" : "delete";
        for (let i = pageIndex; i < Math.min(pageIndex + 12, length); i++) {
            let key = keys[i];
            message.addTextComponent("\n §8⁍ ");
            message.addTextComponent(new TextComponent(`§6${key}`)
                .setClickAction("run_command")
                .setClickValue(`/mm ${command} ${key}`)
                .setHoverValue(`§eClick to remove §b${key} §efrom list.`)
            );
            message.addTextComponent(new TextComponent(` §7=> §e${list[key]}`));
        }
    }

    // Footer
    message.addTextComponent("&c&m-----------------------------------------------------&r");
    message.chat();
}

// Commands, very cool!
register("command", (...args) => {
    const command = args.slice(1);
    switch(args[0]) {
        case "help":  // Help message
            help();
            break;
        case "check":  // Create a checkpoint
        case "add":
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
        case "checkpoints":  // Print out all checkpoints
        case "checkpoint":
        case "cp":
            printList(data.checkpoints, "checkpoints", command[1]);
            break;
        case "toggle":  // Toggle module
            data.toggle = !data.toggle;
            if (data.toggle) {
                track.register();
                ChatLib.chat(LOGO_1 + "§aModule is now active!");
            } else {
                track.unregister();
                ChatLib.chat(LOGO_1 + "§cModule is now inactive!");
            }
            break;
        case "render":  // Toggle rendering
        case "show":
            data.render = !data.render;
            if (data.render) {
                render.register();
                ChatLib.chat(LOGO_1 + "§aShowing all checkpoints!");
            } else {
                render.unregister();
                ChatLib.chat(LOGO_1 + "§cHiding all checkpoints!");
            }
            break;
        case "pop":  // Delete closest checkpoint
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
        case "remove":  // Delete a checkpoint
            delete data.checkpoints[args[1]];
            ChatLib.chat(LOGO_1 + "§aSuccessfully removed checkpoint!");
            break;
        case "clear":  // Reset all checkpoints
        case "reset":
            data.checkpoints = {};
            ChatLib.chat(LOGO_1 + "§aSuccessfully reset checkpoints!");
            break;
        case "save":  // Save checkpoints as a preset
            data.presets[args[1]] = data.checkpoints;
            ChatLib.chat(LOGO_1 + "§aSuccessfully saved preset!");
            break;
        case "load":  // Load a preset of checkpoints
            data.checkpoints = data.presets[args[1]];
            ChatLib.chat(LOGO_1 + "§aSuccessfully loaded preset!");
            break;
        case "delete":  // Delete a preset of checkpoints
            delete data.presets[args[1]];
            ChatLib.chat(LOGO_1 + "§aSuccessfully deleted preset!");
            break;
        case "import":  // Import a preset of checkpoints from clipboard
            const Toolkit = Java.type("java.awt.Toolkit");
            const DataFlavor = Java.type("java.awt.datatransfer.DataFlavor");

            try {
                const clipboard = Toolkit.getDefaultToolkit().getSystemClipboard().getData(DataFlavor.stringFlavor);
                data.checkpoints = JSON.parse(FileLib.decodeBase64(clipboard));
                ChatLib.chat(LOGO_1 + "§aSuccessfully imported checkpoints!");
            } catch (error) {
                ChatLib.chat(LOGO_1 + "§cError: Invalid Clipboard Data!");
            }
            break;
        case "export":  // Copy a preset of checkpoints to clipboard
            ChatLib.command(`ct copy ${FileLib.encodeBase64(JSON.stringify(data.checkpoints))}`, true);
            ChatLib.chat(LOGO_1 + "§aSuccessfully copied checkpoints to clipboard!");
            break;
        case "list":  // List all presets
            printList(data.presets, args[1]);
            break;
        default:
            ChatLib.chat(LOGO_1 + `§cError: Invalid Argument: "${args[0]}"!`);
            ChatLib.chat(LOGO_2 + "§cPlease enter as `/mm <help, check, show, pop, reset>`.");
            break;
    }
}).setName("mm", true).setAliases("marioMaker", "mMaker");
