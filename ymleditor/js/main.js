const fs = new FileManager();
const container = document.querySelector("#gui-edit");

const gui = new GuiEdit(container, fs);
gui.init();