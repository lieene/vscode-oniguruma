import { Tree as tr, Forest as ft, NamedTree as nt } from "../src";

test("poly tree test", () =>
{
    let t = tr(nt.named("I'am the root"));
    t.push(nt.named('1st node')).add(nt.named('c00')).add(nt.named('c01')).add(nt.named('c02'));
    t.push(nt.named('2nd node'));
    t.add(nt.named('3rd node'));
    t.add(nt.named('4th node'));
    t.root.child(1)!.push(nt.named('C10')).push(nt.named('C100'));
    t.root.child(2)!.add(nt.named('C20')).add(nt.named('C21'));
    console.log(t.info(true));
    let t2 = t.clone(true);
    console.log(t2.info(true));
    let t3 = t.clone(true, n => n.depth <= 1);//.polymorph(n=>named("clone tree"));
    console.log(t3.info(true));
    let t4 = t.clone(true, n => n.depth <= 1, (n, o) => n.poly(nt.named('clone'))).polymorph(nt.named("clone tree"));
    console.log(t4.info(true));
    t4.merg(t3,0);
    t4.merg(t3,1,false);
    t4.merg(t2);
    //t4.merg(t3,0,false);
    console.log(t4.info(true));
    t4.root.child(1)!.remove();
    t4.root.child(5,1)!.remove();
    console.log(t4.info(true));
    console.log(t3.info(true));
    console.log(t2.info(true));
    console.log(t.info(true));
    console.log(t.root.child(1)!.subTreeInfo());

    let t4s=tr.Simplify(t4);
    let f=ft<nt.Named>(nt.named('the forest'));
    f.trees.push(t2,t3,t4);
});