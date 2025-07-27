class FileManager {
    constructor() {
        this.__data = {};
        this._globalPreventDefault = false;
        this.onDrop = [];
    }
    getFileHandler(type = "blob", save = false) {
        return new Promise(async (resolve, reject) => {
            try {

                let [f] = await window.showOpenFilePicker();
                let b = await f.getFile();
                if (save) {
                    this.setFile(b, b.name || Date.now());
                }
                if (type == "arraybuffer") {
                    resolve(await b.arraybuffer());
                } if (type == "text") {
                    resolve(await b.text());
                } else {
                    resolve(b);
                }
            } catch (error) {
                reject(error);
            }
        })
    }
    setFile(file, name) {
        this.__data[name] = file;
    }
    removeFile(name) {
        if (this.__data[name]) {
            delete this.__data[name];
            return true;
        } else {
            return false;
        }
    }
    /**
     * 
     * @param {HTMLElement} container 
     * @param {String} id 
     * @returns {Boolean}
     */
    setDropFile(container, id){
        if(!container || !id) return false;

        if(!this._globalPreventDefault){
            this._globalPreventDefault = true;
            window.addEventListener("drop", (e)=>{
                e.preventDefault();
            });
        }
        container.addEventListener("drop", (e)=>{
            if(e.dataTransfer){
                this._onDrop(e.dataTransfer.files, id);
            }
        });
    }
    onFileDrop(callback){
        if(typeof callback === "function"){
            this.onDrop.push(callback);
        }
    }
    _onDrop(file, id){
        for (let i = 0; i < this.onDrop.length; i++) {
            const fn = this.onDrop[i];
            fn(file, id);
        }
    }
    downloadFile(f, name) {
        let u = URL.createObjectURL(f);
        let a = document.createElement("a");
        a.setAttribute("download", name);
        a.setAttribute("target", "_blank");
        a.href = u;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(u);
    }
}