import { OnigScanner as Oni } from "../src";
import { Tree } from "poly-tree";

const text = 'some function with T1 T2 and (T3) can return value v1 v2 and v3.\r\nbut not with some other function and so.';
test("oniguruma tree test", () =>
{
    let oni: Oni = new Oni('(?x)(?<first>some)\\s+(?:(function)|(not)) #sssss');
    let ma = oni.findNextMatchSync(text, 0)!;
    //console.log(ma);
    let mala = oni.findAllMatchSync(text);
    //console.log(mala);
    let mt = oni.buildMatchTree(`some function some not and some other has some function`);
    console.log(mt.info(true));

    //Oni.Test();
    //console.log((ma.groupInfo as any as Tree.CTree).info(true));
    //console.log(ma.groupInfo.nodes.join("\r\n"));
    //ma.groupInfo.nodes.forEach(n=>console.log(n.name));
    //ma.groupInfo.nodes.forEach(n=>console.log(n.name));
    //console.log((ma.groupInfo as any as Tree.CTree).info(true));
});