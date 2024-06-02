import PogObject from "../../PogData";


const data = new PogObject("MarioMaker", {
    "newUser": true,
    "checkpoints": {},
    "presets": {},
    "toggle": true,
    "render": true
}, "data.json");
export default data;

register("gameUnload", () => {
    data.save();
});
