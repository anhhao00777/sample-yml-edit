class GuiEdit extends YmlParser{
    constructor(container, manager, option = {}){
        if(!container) throw new Error("No Container");
        if(!manager) throw new Error("No FileManager");
        super();
        this.container = container;
        this.option = option;
        this.manager = manager;
        this.data = null;
        this.currentData = "";
        this._res = "js/res/gui.html";
    }
    init(){
        fetch(this._res).then(r=>r.text()).then(t=>this._setup(t));
    }
    _setup(d){
        this.container.innerHTML = d;
        const cont = this.container;
        this.addEventListener("error", (d)=>console.log(d));
        
        this.manager.setDropFile(cont, "input-file");

        this.manager.onFileDrop(async (f, id)=>{
            if(id == "input-file"){
                this.loadFile(await f.text());
            }
        });

        cont.querySelector(".files").addEventListener("click", (e)=>{
            let {target} = e;
            if(target.id == "open-file"){
                let f = this.manager.getFileHandler("text");
                f.then(f => this.loadFile(f));
            } else if(target.id == "save-file"){
                let d = this.toYml(this.data, this.currentData);
                window.aaa = d;
                let f = new Blob([d], {type: "application/yaml;charset=utf-8"});
                this.manager.downloadFile(f, "config.yml");
            }
        });
        this.container.querySelector(".edit-gui").addEventListener("change", (e)=>{
            let {target} = e;
            if(target && target.nodeName == "INPUT"){
                let obj = target.dataset.m.split(".");
                let temp = this.data;
                for (let i = 0; i < obj.length-1; i++) {
                    temp = temp[obj[i]];
                }
                temp[obj[obj.length-1]] = target.type == "text" ? target.value : target.valueAsNumber;
            } else if(target && target.nodeName == "SELECT"){
                let obj = target.dataset.m.split(".");
                let temp = this.data;
                for (let i = 0; i < obj.length-1; i++) {
                    temp = temp[obj[i]];
                }
                temp[obj[obj.length-1]] = target.value == 1;
            }
            if(target){
                if(target.value !== target.dataset.def){
                    target.parentElement.classList.add("changed");
                } else{
                    target.parentElement.classList.remove("changed");
                }
            }
        });
    }
    loadFile(text){
        this.currentData = text;
        this.data = this.toJson(text);
        let html = "";
        const scope = this;
        add(this.data.data, "data", 0);
        function add(obj, m, space) {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const e = obj[key];
                    if(key.length > 2 && scope.data.comment[key]?.length > 1){
                        html += `<h4>${scope.data.comment[key].replaceAll("\n", "<br>")}</h4>`;
                    }
                    if(typeof e == "number" || typeof e == "string"){
                        html+= `
                            <div style="--s: ${space}px;" class="val-bl"><div class="name">${key}</div><input type="${typeof e == "number" ? "number" : "text"}" class="inp int" data-def="${e}" data-m="${m + "." + key}" value="${typeof e == "string" ? e.replaceAll('"', "&quot;") : e}"> </div>
                        `;
                    } else if(typeof e == "boolean"){
                        html+= `
                            <div style="--s: ${space}px;" class="val-bl"><div class="name">${key}</div><select data-def="${e ? "1" : "0"}" class="inp" data-m="${m + "." + key}"><option value="1"${e?"selected" : ""}>True</option><option value="0"${!e?"selected" : ""}>False</option></select> </div>
                        `;
                    } else if (typeof e == "object"){
                        html += `<h3 style="--s: ${space}px;">${key} | | pos: ${(m + "." + key).replaceAll(".", " > ")}</h3>`;
                        add(e, m + "." + key, space + 2);
                    }
                }
            }
        }
        this.container.querySelector(".edit-gui").innerHTML = html;

    }
    findUrl(str) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = str.match(urlRegex);
        return urls ? urls[0] : null;
    }
    
}