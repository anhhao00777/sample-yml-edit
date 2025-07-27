class YmlParser extends EventDispatcher {
    constructor() {
        super();
    }

    toYml(data, file){
        if(!data || !data.data) return;
        // let pos = [];
        if(file.indexOf("\r") !== -1) file.replaceAll("\r", "");
        let line = file.split("\n");
        let keys = [];
        let sp = 0
        for (let i = 0; i < line.length; i++) {
            const e = line[i];
            if(e.startsWith("#")) continue;
            let k = e.split(": ")[0];
            if(k == "") continue;
            if(k.indexOf(":")!==-1){
                k = k.split(":")[0];
            }
            let s = this._getSpace(k);
            k = k.slice(s.length);
            if(k == "") continue;
            keys.push(k);
            if (typeof getValue(data.data, keys) !== "object") {
                let v = getValue(data.data, keys);
                if(v !== undefined){
                    line[i] = `${this._getTab(sp)}${k}: ${v}`;
                }
                for (let j = i+1; j < line.length; j++) {
                    const e = line[j];
                    if(e){
                        let space = this._getSpace(e);
                        if (e.slice(space.length).startsWith("#")) continue;
                        if (this._getSpace(e)?.length < sp) {
                            sp -= 2;
                            keys.pop();
                            break;
                        } else if (this._getSpace(e)?.length > sp) {
                            break;
                        }
                        
                    }
                }
                keys.pop();
            } else if (Array.isArray(getValue(data.data, keys))) {
                let t = getValue(data.data, keys);
                for (let j = 0; j < t.length; j++) {
                    const p = t[j];
                    if(!p) break;
                    line[++i] = `${this._getTab(sp+2)}- ${p}`;
                }
                keys.pop();
                // if (this._getSpace(line[i + 1])?.length < sp) sp -= 2;
            } else {
                sp += 2;
                // for (let j = i+1; j < line.length; j++) {
                //     const e = line[j];
                //     if(e){
                //         let space = this._getSpace(e);
                //         if (e.slice(space.length).startsWith("#")) continue;
                //         if (this._getSpace(e)?.length !== sp) {
                //             sp -= 2;
                //             keys.pop();
                //             break;
                //         }
                        
                //     }
                // }
            }


        }
        function getValue(obj, k){
            let t = obj;
            for (let i = 0; i < k.length; i++) {
                const e = k[i];
                t = t[e];
            }
            return t;
        }

        return line.join("\n");
        
    }
    /**
     * 
     * @param {String} data 
     * @returns {Object}
     */
    toJson(data) {
        let obj = {
            data: {},
            name: "",
            comment: {
                _temp: []
            }
        }
        let rawData = data.split("\n");
        this._getData(obj, obj.data, rawData, 0, 0, rawData.length - 1);
        return obj;
    }
    _getData(root, data, raw, space, index, max) {
        for (let i = index; i <= max; i++) {
            try {

                const e = raw[i];
                if (e == "") continue;
                if (e.startsWith("#") || this._findSpace(e, "#")) {
                    root.comment._temp.push(e);
                    continue;
                } else {
                    if (space < this._getSpace(e).length) {
                        continue;
                    }
                    let sp = this._getTab(space);
                    let gr;
                    if (sp) {

                        gr = e.split(": ");
                        gr[0] = gr[0].split(this._getSpace(e))[1];
                    } else {
                        gr = e.split(": ");
                    }
                    if (gr.length == 1) {

                        let key;
                        gr[0].indexOf(":") !== -1 ? key = gr[0].split(":")[0] : gr[0];
                        if (raw[i + 1] == undefined) break;
                        if (this._findSpace(raw[i + 1], "-")) {
                            let valueArray = [];
                            let ind = 1;
                            while (true) {
                                if (raw[i + ind] == undefined) break;
                                if (raw[i + ind].startsWith("#") || this._findSpace(raw[i + ind], "#")) {
                                    root.comment._temp.push(e);
                                    ind++;
                                    continue;
                                }
                                let s = this._getSpace(raw[i + ind]);

                                if (s) {
                                    let v = raw[i + ind].split(s + "- ")[1]
                                    if(v.endsWith("\r")) v = v.slice(0, -1).trim();
                                    valueArray.push(v);

                                } else {
                                    let v = raw[i + ind].split("  - ")[1]
                                    if(v.endsWith("\r")) v = v.slice(0, -1).trim();
                                    valueArray.push(v);

                                }
                                ind++;
                                if (this._getSpace(raw[i + ind]).length < this._getSpace(raw[i + ind - 1]).length) {
                                    root.comment[key] = root.comment._temp.join("\n");
                                    root.comment._temp = [];
                                    data[key] = valueArray;
                                    i += ind;
                                    break;
                                }
                                if (ind > 15) {
                                    root.comment[key] = root.comment._temp.join("\n");
                                    root.comment._temp = [];
                                    data[key] = valueArray;
                                    i += ind;
                                    break;
                                };
                            }
                        } else {
                            if(!key) continue;
                            data[key] = {};
                            let current = i;
                            // if (i == 162) debugger
                            for (let j = i + 1; j < raw.length; j++) {
                                const es = raw[j];

                                if (this._getSpace(es).length < space + 2) {
                                    i = j - 1;
                                    break;
                                }
                                if (j == raw.length - 1) {
                                    i = j;
                                }
                            }
                            if (key == "connection") console.log(this)
                            this.dispatchEvent({ type: "readLine", data: { from: current, to: i, namespace: space, object: data } });
                            // console.log(current + "  " + i + "  sp: " + space)
                            this._getData(root, data[key], raw, space + 2, current + 1, i);

                        }
                    } else {
                        let key = gr[0];
                        if(!key) continue;
                        gr.shift();
                        let value = gr.join(": ");
                        if (!data[key]) data[key] = {};
                        if(value.endsWith("\r")) value = value.slice(0, -1).trim();
                        data[key] = this.returnType(value);
                        root.comment[key] = root.comment._temp.join("\n");
                        root.comment._temp = [];
                        this.dispatchEvent({ type: "value", key, value });
                    }
                }


            } catch (error) {
                let stop = false;
                this.dispatchEvent({ type: "error", error, cancel: () => stop = true });
                if(stop) break;
            }
        }
    }
    returnType(data) {
        let type = this._checkType(data);
        if(type === "array") {
            if(data.startsWith("[") && data.endsWith("]")) {
                data = data.slice(1, -1).trim();
            }
            return new Array(data);
        } else if(type === "object") {
            return {};
        } else if(type === "boolean") {
            return data === "true";
        } else if(type === "number") {
            if(data.includes(".")) {
                return parseFloat(data);
            }
            return parseInt(data);
        } else if(type === "string") {
            return data;
        }
        return data;
    }
    _checkType(v) {
        if (v == "true" || v == "false") {
            return "boolean";
        } else if (v.startsWith('"') && v.endsWith('"')) {
            return "string";
        } else if (v.startsWith("'") && v.endsWith("'")) {
            return "string";
        } else if (v.startsWith("[") && v.endsWith("]")) {
            return "array";
        } else if (v.startsWith("{") && v.endsWith("}")) {
            return "object";
        } else if (!isNaN(v*1)) {
            return "number";
        } else{
            return "string";
        }
    }

    _getTab(n) {
        let str = "";
        for (let i = 0; i < n; i++) {
            str += " ";
        }
        return str;
    }
    _getSpace(n) {
        let str = "";
        if (!n) return "";
        for (let i = 0; i < n.length; i++) {
            if (n[i] == " ") str += " ";
            else return str;
        }
        return str;
    }
    _findSpace(d, char) {
        for (let i = 0; i < d.length; i++) {
            if (d[i] == " ") continue;
            if (d[i] !== " " && d[i] !== char) return false;
            return true;

        }
        return false;
    }
}