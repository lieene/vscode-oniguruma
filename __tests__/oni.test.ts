import { OnigScanner as Oni, OniStr as str, OnigScanner } from "../src";
import { Tree } from "poly-tree";

const text = 'some function with T1 T2 and (T3) can return value v1 v2 and v3.\r\nbut not with some other function and so.';
const text2 = `some function some not and some other has some function`;
test("oniguruma tree test", () =>
{
    let oni: Oni = new Oni('(?x)(?<first>some)\\s+(?:(function)|(not)) #sssss');
    let ma = oni.findNextMatchSync(text, 0)!;
    console.log(ma);
    let mala = oni.findAllMatchSync(text);
    console.log(mala);
    let mt = oni.buildMatchTree(text2)!;
    console.log(mt.info(false));
    let os = str(text);
    let mala2 = oni.findAllMatchSync(os);
    console.log(mala2);

    let out = oni.replaceSync(text2, 3, { key: "first", rep: "111" }, { key: 2, rep: "FFF" }, { key: 3, rep: "NNN" });
    console.log(out);
    expect(out).toBe('111 FFF 111 not and some other has some function');

    out = oni.replaceSync(text2, "all", { key: "first", rep: "SSS" }, { key: 2, rep: "FFF" }, { key: 3, rep: "NNN" });
    console.log(out);
    expect(out).toBe('SSS FFF SSS NNN and some other has SSS FFF');
    out = oni.replaceSync(text2, "all", { key: "first", rep: "SSS" }, { key: 0, rep: "[one replace to rule them all]" }, { key: 3, rep: "NNN" });
    expect(out).toBe("[one replace to rule them all] [one replace to rule them all] and some other has [one replace to rule them all]");
    oni.replace(text2, "all", { key: "first", rep: "SSS" }, { key: 0, rep: "[one replace to rule them all]" }, { key: 3, rep: "NNN" }).then(s =>
    { console.log(s); });

    let deepCharSet = new OnigScanner('[a-w&&[^c-g]z]');
    console.log(deepCharSet.buildMatchTree("abchiwxyz[]")!.info(true));//oniguruam supports charset in charset...

    let deepCharSet2 = new OnigScanner('[a-b[c-e]z]');
    console.log(deepCharSet2.buildMatchTree("abcdefyz[]")!.info(true));//oniguruam supports charset in charset...

    let deepCharSet3 = new OnigScanner('(?<realgroup>(s)[(?:xyz)a-b[(?<fakegroup>)c-e]z])');//test put fake group in charset
    console.log(Tree.Nomalize(deepCharSet3.patterns.first!).info(true));
    console.log(deepCharSet3.buildMatchTree("sxs?")!.info(true));

    //Oni.Test();
    //console.log((ma.groupInfo as any as Tree.CTree).info(true));
    //console.log(ma.groupInfo.nodes.join("\r\n"));
    //ma.groupInfo.nodes.forEach(n=>console.log(n.name));
    //ma.groupInfo.nodes.forEach(n=>console.log(n.name));
    //console.log((ma.groupInfo as any as Tree.CTree).info(true));
});