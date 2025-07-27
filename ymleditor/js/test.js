function test() {
    let d = new YmlParser();
    let r = d.toJson(data);
    console.log(r);
    window.res = r;
}
window.oncontextmenu = (e)=>{
    e.preventDefault();
    location.reload();
}