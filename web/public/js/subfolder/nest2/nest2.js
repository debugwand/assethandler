var f2="f2";
if (f2 === "d") {
    console.log("should never output");
}
console.log("file nested 2 levels, check globbing succeeds");
//console.log("nest2 file", foo);//should not error on production version, will error on dev
