
function main() { //WOO!
    var lorem = "lorem";
    console.log("main has been called", lorem, "ends");
}
function triggercoveragetool () {
    console.log("this is never called and coverage tool should catch that");
    return 1;
}
/*call woo*/
main();
var test = 1;

//console.log($, "jq");
//i++;//this will trigger hint errors
