//-----------------------------------------------------------------------------------
// File: index.ts                                                                  //
// Project: lieene.CodeFactory                                                     //
// Created Date: Wed Oct 30 2019                                                   //
// Author: Lieene Guo                                                              //
// -----                                                                           //
// Last Modified: Tue Nov 12 2019                                                  //
// Modified By: Lieene Guo                                                         //
// -----                                                                           //
// MIT License                                                                     //
//                                                                                 //
// Copyright (c) 2019 Lieene@ShadeRealm                                            //
//                                                                                 //
// Permission is hereby granted, free of charge, to any person obtaining a copy of //
// this software and associated documentation files (the "Software"), to deal in   //
// the Software without restriction, including without limitation the rights to    //
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies   //
// of the Software, and to permit persons to whom the Software is furnished to do  //
// so, subject to the following conditions:                                        //
//                                                                                 //
// The above copyright notice and this permission notice shall be included in all  //
// copies or substantial portions of the Software.                                 //
//                                                                                 //
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR      //
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,        //
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE     //
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER          //
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,   //
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE   //
// SOFTWARE.                                                                       //
//                                                                                 //
// -----                                                                           //
// HISTORY:                                                                        //
// Date      	By	Comments                                                       //
// ----------	---	----------------------------------------------------------     //
//-----------------------------------------------------------------------------------
import '@lieene/ts-utility';
import * as L from '@lieene/ts-utility';

namespace core {
  export class CNode {
    // implements INode<CNode, CRoot>//, INodeEdit<CNode, CRoot>
    constructor(tree: CTree | undefined, index: number, peerIndex: number, parentID: number | undefined) {
      this.tree = tree!;
      this.index = index;
      this.peerIndex = peerIndex;
      this.parentID = parentID;
      this.nodeInfo = func.nodeInfo.bind(this);
    }
    toString = func.detailInfo;
    tree: CTree;
    //#region INodeIdx --------------------------------------------------------------------------
    index: number;
    peerIndex: number;
    parentID: number | undefined;
    childrenID: number[] = [];
    get subTreeRange(): L.Range {
      return L.StartEnd(this.index, func.subTreeEnd.call(this));
    }
    //#endregion --------------------------------------------------------------------------------

    //#region INodeAccess -----------------------------------------------------------------------

    //#region INodeSimple -----------------------------------------------------------------------
    get parent(): CNode | undefined {
      return this.parentID === undefined ? undefined : this.tree.nodes[this.parentID];
    }
    get children(): CNode[] {
      return this.childrenID.map(id => this.tree.nodes[id]);
    }
    get deepChildren(): CNode[] {
      let range = this.subTreeRange;
      return this.tree.nodes.slice(range.start + 1, range.end);
    }
    get childCount(): number {
      return this.childrenID.length;
    }
    child = func.child;
    //poly = func.poly;
    //morph = func.morph;
    //#endregion --------------------------------------------------------------------------------
    get isRoot(): boolean {
      return this.parentID === undefined;
    }
    get isBranch(): boolean {
      return this.childrenID.length > 0;
    }
    get isLeaf(): boolean {
      return this.childrenID.length === 0;
    }

    get depth(): number {
      let depth = 0,
        p = this.parent;
      while (p !== undefined) {
        depth++;
        p = p.parent;
      }
      return depth;
    }
    isChildOf: (node: CNode) => boolean = func.isChildOf;
    findChild = func.findChild;

    call<TFunc extends (...args: any) => any>(func: TFunc, args: Parameters<TFunc>): ReturnType<TFunc> {
      return func.call(this, ...args);
    }

    [Symbol.iterator] = func.NodeTriversGen;
    forAcending = func.forAcending;
    forDecending = func.forDecending;

    subTreeInfo = func.treeInfo;
    nodeInfo: (detail?: boolean) => string;

    //#endregion --------------------------------------------------------------------------------

    //#region INodeEdit -------------------------------------------------------------------------
    //#region INodeEdit -------------------------------------------------------------------------
    push = func.push;
    add = func.add;

    clone = func.clone;
    merg = func.merg;
    remove = func.remove;
    //#endregion --------------------------------------------------------------------------------

    //#region INodeMorphing ---------------------------------------------------------------------
    poly = func.poly;
    morph = func.morph;
    polySub = func.polySub;
    morphSub = func.morphSub;
    //#endregion --------------------------------------------------------------------------------
  }

  export class CTree {
    // extends CNode implements IRoot<CNode, CRoot>
    constructor(empty: boolean = false) {
      if (!empty) {
        this.nodes.push(new CNode(this, 0, 0, undefined));
      }
      this.info = func.treeInfo.bind(this);
    }

    nodes: CNode[] = [];
    toString(): string {
      return this.info(true);
    }

    //#region ITreeAccess -----------------------------------------------------------------------
    //#region ITreeSimple -----------------------------------------------------------------------
    get root(): CNode {
      return this.nodes[0];
    }
    get tail(): CNode {
      return this.nodes.last!;
    }
    get nodeCount(): number {
      return this.nodes.length;
    }
    // poly = func.poly;
    // morph = func.morph;
    // polymorph = func.polymorph;
    //#endregion --------------------------------------------------------------------------------
    findNode = func.findNode;
    info: (detail?: boolean) => string;
    //#endregion --------------------------------------------------------------------------------

    //#region ITreeEdit -------------------------------------------------------------------------
    push = func.push;
    add = func.add;
    clone = func.clone;
    merg = func.merg;
    //#endregion --------------------------------------------------------------------------------

    //#region ITreeMorphing ---------------------------------------------------------------------
    poly = func.poly;
    morph = func.morph;
    polymorph = func.polymorph;
    //#endregion --------------------------------------------------------------------------------
  }

  export class CForest {
    trees: Array<CTree> = [];
    call<TFunc extends (...args: any) => any>(func: TFunc, args: Parameters<TFunc>): ReturnType<TFunc> {
      return func.call(this, ...args);
    }

    polymorph<N extends object>(): Typing.IForest<Typing.MorphTreeN<N>>;
    polymorph<N extends object, T extends object>(): Typing.IForest<Typing.MorphTree<N, T>>;
    polymorph<N extends object, T extends object, F extends object>(): L.Extend<Typing.IForest<Typing.MorphTree<N, T>>, F>;
    polymorph<F extends object>(...forestExt: F[]): L.Extend<Typing.IForest<Typing.Tree>, F>;
    polymorph<T extends object, F extends object>(treeExt: (node: CTree) => T, ...forestExt: F[]): L.Extend<Typing.IForest<Typing.MorphTreeT<T>>, F>;
    polymorph<N extends object, T extends object, F extends object>(nodeExt: (node: CNode) => N, treeExt: (node: CTree) => T, ...forestExt: F[]): L.Extend<Typing.IForest<Typing.MorphTree<N, T>>, F>;
    polymorph(...ext: any[]): any {
      let [first, second, ...rest] = ext;
      if (L.IsFunction(first)) {
        if (L.IsFunction(second)) {
          this.trees.forEach(t => {
            let tx = second(t) as object;
            t.polymorph(first, tx);
          });
          ext = rest;
        } else {
          this.trees.forEach(t => t.polymorph(first));
          ext = [second, rest];
        }
      }
      ext.forEach(x => L.assign(this, x, L.AssignFilter.exclude));
      return this;
    }
  }
}

namespace func {
  import INode2Tree = Typing.INode2Tree;
  import ITree2Node = Typing.ITree2Node;
  import MorphNodeX = Typing.MorphNodeX;
  import MorphNodeNX = Typing.MorphNodeNX;
  import MorphNodeTX = Typing.MorphNodeTX;

  import MorphTreeX = Typing.MorphTreeX;
  import MorphTreeNX = Typing.MorphTreeNX;
  import MorphTreeTX = Typing.MorphTreeTX;

  import Node = Typing.Node;
  import Tree = Typing.Tree;
  import Forest = Typing.Forest;
  import Tree0 = Typing.Tree0;
  import Node0 = Typing.Node0;

  import CNode = core.CNode;
  import CTree = core.CTree;

  export function IsForest<TNode extends Node0, TTree extends Tree0, TForest extends Forest>(node: TNode | TTree | TForest): node is TForest {
    return (node as TForest).trees !== undefined;
  }
  export function IsTree<TNode extends Node0, TTree extends Tree0, TForest extends Forest>(node: TNode | TTree | TForest): node is TTree {
    return (node as TTree).nodes !== undefined;
  }
  export function IsNode<TNode extends Node0, TTree extends Tree0, TForest extends Forest>(node: TNode | TTree | TForest): node is TNode {
    return (node as TNode).tree !== undefined;
  }

  /**
   * fix all ref index before action: insert (after node at pos) or remove (subtree at pos)
   * @returns for insert return insert point, for remove return remove count
   * @param tree tree to fix
   * @param pos pos of remove or insert
   * @param shift when insert poasing postive number as amount of nodes to insert, form remove leave this undefine
   * @param aschild used for insert after node at pos. ture:as first child of node. false:as next peer of node
   */
  export function fixIndexBeforeInsertOrRemove(curNode: CNode, shift?: number, aschild?: boolean): number | undefined {
    let tree = curNode.tree;
    let nodes = tree.nodes;
    let nodeCount = nodes.length;
    let pos = curNode.index;
    let isInsert: boolean;
    let asPeer: boolean = true;
    if (shift !== undefined) {
      //insert
      if (shift <= 0) {
        return;
      } //inserting nothing
      isInsert = true;
      if (aschild !== undefined) {
        asPeer = !aschild;
      }

      if (pos >= nodeCount - 1) {
        //inert at end of nodes
        let p: CNode | undefined;
        if (asPeer) {
          p = curNode.parent;
        } else {
          p = curNode;
        }
        if (p !== undefined) {
          p.childrenID.push(nodeCount);
        }
        return;
      }
    } //remove
    else {
      if (pos >= nodeCount - 1) {
        //remove last
        let p = curNode.parent;
        if (p !== undefined) {
          p.childrenID.pop();
        }
        return;
      } //insert at last or remove nothing no need to fix index
      let removeEndPt = subTreeEnd.call(curNode);
      if (removeEndPt === nodeCount) {
        //remove all node to the end
        forAcending.call(curNode, p => {
          p.childrenID = p.childrenID.filter(c => c < pos);
        });
        return;
      }
      shift = pos - removeEndPt;
      isInsert = false;
    }

    if (isInsert) {
      //insert
      if (asPeer) {
        //insert as peer
        //find right insert position
        pos = subTreeEnd.call(curNode);
        let curParent = curNode.parent;
        if (curParent !== undefined) {
          let childrenID = curParent.childrenID;
          let len = childrenID.length;
          for (let i = curNode.peerIndex + 1; i < len; i++) {
            nodes[childrenID[i]].peerIndex++; //fix peer's peerIndex;
            childrenID[i] += shift;
          }
          childrenID.insert(curNode.peerIndex + 1, pos);

          forAcending.call(curParent, (p, c) => {
            //fix childIDs for from parent of parent up to root
            let childrenID = p.childrenID;
            let len = childrenID.length;
            for (let i = c.peerIndex + 1; i < len; i++) {
              childrenID[i] += shift!;
            }
          });
        }
      } //insert as first child
      else {
        //find right insert position
        pos += 1;
        let childrenID = curNode.childrenID;
        for (let i = 0, len = childrenID.length; i < len; i++) {
          nodes[childrenID[i]].peerIndex++;
          childrenID[i] += shift;
        } //fix peer's peerIndex;
        childrenID.unshift(pos);
        //childID will be fix in the following process dont do it here!!!!

        forAcending.call(curNode, (p, c) => {
          //fix childIDs from parent up to root
          let childrenID = p.childrenID;
          let len = childrenID.length;
          for (let i = c.peerIndex + 1; i < len; i++) {
            childrenID[i] += shift!;
          }
        });
      }
    } //remove
    else {
      let curParent = curNode.parent;
      if (curParent !== undefined) {
        //fix peer's peerIndex;
        let childrenID = curParent.childrenID;
        childrenID.splice(curNode.peerIndex, 1);
        let len = childrenID.length;
        for (let i = curNode.peerIndex; i < len; i++) {
          nodes[childrenID[i]].peerIndex--;
          childrenID[i] += shift;
        }

        forAcending.call(curParent, (p, c) => {
          //fix childIDs for from parent of parent up to root
          let childrenID = p.childrenID;
          let len = childrenID.length;
          for (let i = c.peerIndex + 1; i < len; i++) {
            childrenID[i] += shift!;
          }
        });
      }
    }

    for (let i = isInsert ? pos : pos - shift; i < nodeCount; i++) {
      //fix parent id and childid for nodes after end of edit range
      let fixNode = nodes[i];
      fixNode.index += shift;
      let pid = fixNode.parentID!;
      if (pid > pos) {
        fixNode.parentID = pid + shift;
      }
      let childrenID = fixNode.childrenID;
      let len = childrenID.length;
      for (let i = 0; i < len; i++) {
        childrenID[i] += shift;
      }
    }
    return isInsert ? pos : -shift; //for insert return insert point, for remove return remove count
  }

  /**
   * go up tree untill root applying action, return 'break' in action to stop the process
   * @param this current node
   * @param action callback on parent up to root,returning 'break' will stop the process
   */
  export function forAcending(this: CNode, action: (parent: CNode, child: CNode) => void | ('break' | undefined)): void {
    let parent = this.parent;
    if (parent !== undefined && action(parent, this) !== 'break') {
      forAcending.call(parent, action);
    }
  }

  /**
   * go down tree untill deepest child applying action,
   * visit all child or by picker on each level
   * @param this current node
   * @param action callback on child go down to tip
   * @param picker optional picker returns numbers choose child by peer id
   */
  export function forDecending(this: CNode, action: (child: CNode, parent: CNode) => void, picker?: (parent: CNode) => number[]): void {
    let nodes = this.tree.nodes;
    let childrenID = this.childrenID;
    if (picker !== undefined) {
      childrenID = picker(this).map(peer => this.childrenID[peer]);
    }
    childrenID.forEach(id => {
      if (id !== undefined) {
        let c = nodes[id];
        action(c, this);
        forDecending.call(c, action, picker);
      }
    });
  }

  /**
   * get id of acending next peer, which is next peer=> if not peer of parent=> and so on.
   * if this node has no next acending peer(this and parent up to root are all last peer) undefined is returned
   * @param this current node
   */
  export function acendingNextPeerID(this: CNode): number | undefined {
    var subEnd: number | undefined = undefined;
    forAcending.call(this, (p, c) => {
      subEnd = p.childrenID[c.peerIndex + 1];
      if (subEnd !== undefined) {
        return 'break';
      }
    });
    return subEnd;
  }

  export function subTreeEnd(this: CNode): number {
    let subEnd = acendingNextPeerID.call(this);
    return subEnd === undefined ? this.tree.nodes.length : subEnd;
  }

  //export function subTreeRange(this: CNode): L.Range { return L.StartEnd(this.index, subTreeEnd.call(this)); }

  export function findChild<T extends object>(this: CNode, matcher: (node: CNode) => boolean, deep: boolean | undefined = true): Array<CNode & T> {
    let childs = (deep ? this.deepChildren : this.children) as Array<CNode & T>;
    return childs.filter(v => matcher(v), this);
  }

  export function findNode<T extends object>(this: CTree, matcher: (node: CNode) => boolean): Array<CNode & T> {
    return this.nodes.filter(v => matcher(v), this) as Array<CNode & T>;
  }

  //export function nodeCount(this: RawTree): number { return this.nodes.length; }

  export function isChildOf(this: CNode, n: CNode): boolean {
    let p = this.parent;
    while (p !== undefined) {
      if (n === p) {
        return true;
      }
      p = p.parent;
    }
    return false;
  }

  export function child(this: CNode, ...i: (number | 'last')[]): CNode | undefined {
    let ids = this.childrenID;
    let nodes = this.tree.nodes;
    let [curI, ...restI] = i;
    let curNd: CNode;
    if (L.IsNumber(curI)) {
      if (curI < 0 || curI >= ids.length) {
        return undefined;
      } else {
        curNd = nodes[ids[curI]];
      }
    } else {
      if (ids.length <= 0) {
        return undefined;
      } else {
        curNd = nodes[ids.last!];
      }
    }
    return restI.length <= 0 ? curNd : child.call(curNd, ...restI);
  }

  export function polyAny(this: CNode | CTree, ...ext: any[]): any {
    //if (ext.length <= 1) { return this; }
    ext.forEach(e => {
      e = L.IsFunction(e) ? e(this) : e;
      L.assign(this, e, L.AssignFilter.exclude);
      let s = e.toString;
      if (s !== undefined) {
        pushExtraLog.call(this, s);
      }
    });
    return this;
  }

  export function poly<T extends object>(this: CTree, ...ext: T[]): L.Extend<CTree, T>;

  export function poly<T extends object>(this: CNode, ...ext: T[]): L.Extend<CNode, T>;
  export function poly<T extends object>(this: CNode, ext: (node: CNode) => T): L.Extend<CNode, T>;
  export function poly(this: CNode | CTree, ...ext: any[]): any {
    return polyAny.call(this, ...ext);
  }

  export function morph<T extends object>(this: CTree, ...ext: T[]): MorphTreeTX<T>;

  export function morph<T extends object>(this: CNode, ...ext: T[]): MorphNodeNX<T>;
  export function morph<T extends object>(this: CNode, ext: (node: CNode) => T): MorphNodeNX<T>;
  export function morph(this: CNode | CTree, ...ext: any[]): any {
    return polyAny.call(this, ...ext);
  }

  export function ctor(parent: CNode): CNode {
    return new core.CNode(parent.tree, parent.tree.nodes.length, parent.childrenID.length, parent.index);
  }

  export function attach(child: CNode, parent: CNode): void {
    let nodes = parent.tree.nodes;
    let insertPt: number | undefined = undefined;
    if (parent.childCount === 0) {
      insertPt = fixIndexBeforeInsertOrRemove(parent, 1, true);
    } else {
      insertPt = fixIndexBeforeInsertOrRemove(nodes[parent.childrenID.last!], 1, false);
    }
    if (insertPt === undefined) {
      nodes.push(child);
    } else {
      nodes.insert(insertPt, child);
      child.index = insertPt;
    }
  }

  export function Strip<T extends object>(node: CNode, ext: ((node: CNode) => T) | T): T;
  export function Strip<T extends object>(node: CTree, ext: ((node: CTree) => T) | T): T;
  export function Strip<T extends object>(node: CNode | CTree, ext: ((node: CNode | CTree) => T) | T): T {
    return L.NotFunction<T>(ext) ? ext : ext(node);
  }

  // export interface Router<TD, TB, TU>
  // { down: TD; back: TB; up: TU | undefined; }

  export function push(this: CNode | CTree): CNode; //& Router<CNode, CNode, CNode>;
  export function push<T extends object>(this: CNode | CTree, ...ext: T[]): L.Extend<CNode, T>; //& Router<L.Extend<CNode,T>, CNode, CNode>;
  export function push<T extends object>(this: CNode | CTree, ext: (node: CNode) => T): L.Extend<CNode, T>; //& Router<L.Extend<CNode,T>, CNode, CNode>;
  export function push<T extends object>(this: CNode | CTree, morph: 'morph', ...ext: T[]): MorphNodeNX<T>; //& Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;
  export function push<T extends object>(this: CNode | CTree, morph: 'morph', ext: (node: CNode) => T): MorphNodeNX<T>; //& Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;
  export function push(this: CNode | CTree, ...ext: any[]): any {
    let parent: CNode;
    let first = ext[0];
    if (first === 'morph') {
      ext.shift();
    }
    if (IsTree(this)) {
      parent = this.root;
    } else {
      parent = this;
    }
    let node = ctor(parent);
    attach(node, parent);
    if (ext.length > 0) {
      polyAny.call(node, ...ext);
    }
    return node;
    //return L.assign(node, { dive: node, back: this, up: parent.parent }, L.AssignFilter.override);
  }
  export function add(this: CNode): CNode; //& Router<CNode, CNode, CNode>;
  export function add(this: CTree): CTree; //& Router<CNode, CTree, CNode>;
  export function add<T extends object>(this: CNode, ...ext: T[]): L.Extend<CNode, T>; //& Router<L.Extend<CNode,T>, CNode, CNode>;
  export function add<T extends object>(this: CTree, ...ext: T[]): CTree; //& Router<L.Extend<CNode,T>, CTree, CNode>;
  export function add<T extends object>(this: CNode, ext: (node: CNode) => T): L.Extend<CNode, T>; //& Router<L.Extend<CNode,T>, CNode, CNode>;
  export function add<T extends object>(this: CTree, ext: (node: CNode) => T): CTree; //& Router<L.Extend<CNode,T>, CTree, CNode>;
  export function add<T extends object>(this: CNode, morph: 'morph', ...ext: T[]): MorphNodeNX<T>; //& Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;
  export function add<T extends object>(this: CTree, morph: 'morph', ...ext: T[]): CTree; //& Router<MorphNodeX<T>, CTree, MorphNodeX<T>>;
  export function add<T extends object>(this: CNode, morph: 'morph', ext: (node: CNode) => T): MorphNodeNX<T>; //& Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;
  export function add<T extends object>(this: CTree, morph: 'morph', ext: (node: CNode) => T): CTree; //& Router<MorphNodeX<T>, CTree, MorphNodeX<T>>;
  export function add(this: CNode | CTree, ...ext: any[]): any {
    let parent: CNode;
    let first = ext[0];
    if (first === 'morph') {
      ext.shift();
    }
    if (IsTree(this)) {
      parent = this.root;
    } else {
      parent = this;
    }
    let node = ctor(parent);
    attach(node, parent);
    if (ext.length > 0) {
      polyAny.call(node, ...ext);
    }
    return this;
    //return L.assign(node, { dive: node, back: this, up: parent.parent }, L.AssignFilter.override);
  }

  export function polySub<T extends object>(this: CNode, ...ext: T[]): L.Extend<CNode, T>;
  export function polySub<T extends object>(this: CNode, ext: (node: CNode) => T): L.Extend<CNode, T>;
  export function polySub(this: CNode, ...ext: any[]): any {
    let nodes = this.tree.nodes;
    let range = this.subTreeRange;
    for (let i = range.start; i < range.end; i++) {
      nodes[i].poly(ext);
    }
    return this;
  }

  export function morphSub<T extends object>(this: CNode, ...ext: T[]): MorphNodeNX<T>;
  export function morphSub<T extends object>(this: CNode, ext: (node: CNode) => T): MorphNodeNX<T>;
  export function morphSub(this: CNode, ...ext: any[]): any {
    return this.polySub(...ext);
  }

  // polymorph<N extends object>(nodeExt: (node: TNode) => N): TTree & MorphTreeN<N>;
  // polymorph<T extends object>(...ext: T[]): TTree & MorphTreeN<T>;
  // polymorph<N extends object, T extends object>(nodeExt: (node: TNode) => N, ...ext: T[]): TTree & MorphTree<N, T>;

  export function polymorph<N extends object>(this: CTree, nodeExt: (node: CNode) => N): CTree & MorphTreeNX<N>;
  export function polymorph<T extends object>(this: CTree, ...ext: T[]): CTree & MorphTreeTX<T>;
  export function polymorph<N extends object, T extends object>(this: CTree, nodeExt: (node: CNode) => N, ...ext: T[]): MorphTreeX<N, T>;
  export function polymorph(this: CTree, ...ext: any[]): any {
    let nodes = this.nodes;
    let [firstExt, ...treeExt] = ext;
    if (L.IsFunction(firstExt)) {
      polyAny.call(this, treeExt);
      for (let i = 1, len = nodes.length; i < len; i++) {
        nodes[i].poly(firstExt(nodes[i]));
      }
      return this;
    } else {
      polyAny.call(this, ...ext);
    }
    return this;
  }

  export function* NodeTriversGen(this: CNode | CTree): IterableIterator<CNode> {
    let [nodes, i, end] = IsTree(this) ? [this.nodes, 0, this.nodes.length] : [this.tree.nodes, this.index, subTreeEnd.call(this)];
    for (; i < end; i++) {
      yield nodes[i];
    }
  }

  function refExtLog(this: CNode | CTree): IExtraLog {
    return ((IsTree(this) ? this.info : this.nodeInfo) as unknown) as IExtraLog;
  }

  function pushExtraLog(this: CNode | CTree, ...extralogs: Array<() => string>) {
    let extraLog = refExtLog.call(this);
    if (extraLog.extraLogs === undefined) {
      extraLog.extraLogs = extralogs;
    } else {
      extraLog.extraLogs.push(...extralogs);
    }
  }

  function CopyExtraLog(from: CNode | CTree, to: CNode | CTree): void {
    let extraLog = refExtLog.call(from);
    if (extraLog.extraLogs !== undefined) {
      refExtLog.call(to).extraLogs = extraLog.extraLogs.map(n => n);
    }
  }

  export function extraLogStr(this: CTree | CNode): string {
    let log = '';
    let extraLog = refExtLog.call(this).extraLogs;
    if (extraLog !== undefined) {
      log += ':';
      for (let i = 0, len = extraLog.length; i < len; i++) {
        log += extraLog[i].call(this);
      }
    }
    return log;
  }

  export function simpleInfo(this: CNode): string {
    return `${this.isRoot ? 'R' : 'N'}.${this.index}`;
  }

  export function detailInfo(this: CNode): string {
    let out: string;
    if (this.isRoot) {
      out = `N${this.index}[R${this.parentID === undefined ? '' : '!!!' + this.parentID}.${this.peerIndex}]`;
    } else {
      out = `N${this.index}[${this.parentID === undefined ? '!!!' : 'N' + this.parentID}.${this.peerIndex}]`;
    }
    let childCount = this.childrenID.length;
    return childCount <= 0 ? out : out + `[C(#${childCount}):${this.childrenID.join(',')}]`;
  }

  interface IExtraLog {
    extraLogs: Array<() => string>;
  }

  export function nodeInfo(this: CNode, detail: boolean = true): string {
    return (detail ? detailInfo.call(this) : simpleInfo.call(this)) + extraLogStr.call(this);
  }

  export function treeInfo(this: CTree | CNode, detail: boolean = true, indent: string = '', lastChildID?: number): string {
    let [cur, out] = IsTree(this) ? [this.root, `Tree[#N:${this.nodeCount}]:${extraLogStr.call(this)}\r\n`] : [this, ''];
    if (cur === undefined) {
      return out + '[Empty]';
    }
    if (lastChildID !== undefined) {
      out += '\r\n';
      if (cur.peerIndex === lastChildID) {
        out += indent + String.fromCharCode(9492, 9472);
        indent += '  ';
      } else {
        out += indent + String.fromCharCode(9500, 9472);
        indent += String.fromCharCode(9474) + ' ';
      }
    }
    out += cur.nodeInfo(detail);
    lastChildID = cur.childrenID.length - 1;
    if (lastChildID >= 0) {
      out = cur.children.reduce<string>((s, n) => {
        if (n === undefined) {
          s += '[Error:Undefinded Child]';
        } else {
          s += treeInfo.call(n, detail, indent, lastChildID);
        }
        return s;
      }, out);
    }
    return out;
  }

  export function remove(this: CNode): CNode[] {
    let nodes = this.tree.nodes;
    let start = this.index;
    let removeCount = fixIndexBeforeInsertOrRemove(this);
    return removeCount === undefined ? [] : nodes.splice(start, removeCount);
  }

  export function merg(this: CTree | CNode, sub: CNode): CNode;
  export function merg(this: CTree | CNode, sub: CNode, peerIdx?: number): CNode;
  export function merg(this: CTree | CNode, sub: CTree, cloneSub?: boolean): CNode;
  export function merg(this: CTree | CNode, sub: CTree, peerIdx?: number, cloneSub?: boolean): CNode;
  export function merg(this: CTree | CNode, sub: CTree | CNode, tartPeerIdx: number | undefined | boolean = undefined, cloneSub: boolean = true): CNode {
    let [srcSubRoot, srcSubNodes, srcSubTree] = IsTree(sub) ? [sub.root, sub.nodes, sub] : [sub, sub.tree.nodes, sub.tree];
    let subIsNode = !srcSubRoot.isRoot;
    let subTreeCount = srcSubRoot.subTreeRange.length;

    let [tarParent, tarTree, tarNodes] = IsTree(this) ? [this.root, this, this.nodes] : [this, this.tree, this.tree.nodes];
    let tarPeerCount = tarParent.childCount;
    if (tartPeerIdx === undefined) {
      tartPeerIdx = tarPeerCount;
    } else if (L.IsBoolean(tartPeerIdx)) {
      cloneSub = tartPeerIdx;
      tartPeerIdx = tarPeerCount;
    } else {
      tartPeerIdx = Math.min(tarPeerCount, tartPeerIdx);
    }
    let tartinsertPt: number | undefined;
    if (tartPeerIdx === 0) {
      tartinsertPt = fixIndexBeforeInsertOrRemove(tarParent, subTreeCount, true);
    } else {
      let peer = tarNodes[tarParent.childrenID[tartPeerIdx - 1]];
      tartinsertPt = fixIndexBeforeInsertOrRemove(peer, subTreeCount, false);
    }

    let tarSubRtIndex: number;
    if (tartinsertPt === undefined) {
      tarSubRtIndex = tarNodes.length;
    } else {
      tarSubRtIndex = tartinsertPt;
    }
    let src2tarOffet = tarSubRtIndex - srcSubRoot.index;
    let newSub: CNode;
    let newSubNodes: CNode[];
    cloneSub = cloneSub || subIsNode;
    if (cloneSub) {
      newSub = new core.CNode(tarTree, tarSubRtIndex, tartPeerIdx, tarParent.index);
      newSubNodes = [newSub];
      for (let i = 1; i < subTreeCount; i++) {
        let sn = srcSubNodes[i];
        let nsn = new core.CNode(tarTree, i + tarSubRtIndex, sn.peerIndex, sn.parentID! + src2tarOffet);
        L.assign(nsn, sn, L.AssignFilter.exclude);
        CopyExtraLog(sn, nsn);
        newSubNodes.push(nsn);
      }
      for (let i = 0; i < subTreeCount; i++) {
        newSubNodes[i].childrenID = srcSubNodes[i].childrenID.map(i => i + src2tarOffet);
      }
    } else {
      newSub = srcSubRoot;
      newSubNodes = srcSubNodes;

      newSub.tree = tarTree;
      newSub.index = tarSubRtIndex;
      newSub.peerIndex = tartPeerIdx;
      newSub.parentID = tarParent.index;
      for (let i = 1; i < subTreeCount; i++) {
        let newNode = srcSubNodes[i];
        newNode.tree = tarTree;
        newNode.index = i + tarSubRtIndex;
        newNode.parentID = newNode.parentID! + src2tarOffet;
      }
      for (let i = 0; i < subTreeCount; i++) {
        newSubNodes[i].childrenID = newSubNodes[i].childrenID.map(i => i + src2tarOffet);
      }
      srcSubTree.nodes = [];
    }
    if (tartinsertPt === undefined) {
      tarNodes.push(...newSubNodes);
    } else {
      tarNodes.insert(tartinsertPt, ...newSubNodes);
    }
    newSub.peerIndex = tartPeerIdx;
    return newSub;
  }

  const nodeBaseProps: Array<PropertyKey> = ['index', 'tree', 'peerIndex', 'parentID', 'childrenID'];
  const NodeBaseProps = L.asLiterals(['index', 'tree', 'peerIndex', 'parentID', 'childrenID']);
  type NodeBaseProps = L.MapLiteralArray<typeof NodeBaseProps, any>;

  export function RemapNodeID(remap: number[], ...oldIndexs: readonly number[]): number[] {
    return oldIndexs.reduce<number[]>((p, n) => {
      let newId = remap.indexOf(n);
      if (newId >= 0) {
        p.push(newId);
      }
      return p;
    }, []);
  }

  export function clone(this: CNode | CTree, cleanTree: boolean = false, picker?: (oldNode: CNode) => boolean, remix?: (newNode: CNode, oldNode: CNode) => void): CTree {
    let [srctree, srcCur, srcNodes] = IsTree(this) ? [this, this.root, this.nodes] : [this.tree, this, this.tree.nodes];
    //let srcIsRoot = srcCur.isRoot;
    let newTree: CTree = new core.CTree(true);
    if (!cleanTree) {
      L.assign(newTree, srctree, L.AssignFilter.exclude);
      CopyExtraLog(srctree, newTree);
    }
    let newNodes: core.CNode[] = (newTree.nodes = []);

    let { start: offset, end, length } = srcCur.subTreeRange;
    let indexMap: number[] = [];
    for (let pos = offset; pos < end; ) {
      let srcNode = srcNodes[pos];
      let picked = picker === undefined ? true : picker(srcNode);
      if (picked) {
        indexMap.push(pos - offset); //map from [sequncial-offeted-index](final index) to [jumped-offeted-index](corrupted by jump)
        let parentInex = srcNode.parentID === undefined ? undefined : srcNode.parentID - offset;
        let newNode = new core.CNode(newTree, newNodes.length, srcNode.peerIndex, parentInex);
        if (!cleanTree) {
          L.assign(newNode, srcNode, L.AssignFilter.exclude);
          CopyExtraLog(srcNode, newNode);
        }
        newNode.childrenID = srcNode.childrenID.map(c => c - offset);
        newNode.tree = newTree;
        newNodes.push(newNode);
        pos++;
      } else {
        pos = srcNode.subTreeRange.end;
      } //jump over branch, removed node's deepchild is also removed
    }
    length = newNodes.length;
    if (length === 0) {
      return newTree;
    }
    let newRoot = newNodes[0];
    newRoot.parentID = undefined;
    newRoot.peerIndex = 0;
    if (picker !== undefined) {
      newRoot.childrenID = RemapNodeID(indexMap, ...newRoot.childrenID);
      for (let i = 1, len = length; i < len; i++) {
        let newNode = newNodes[i];
        newNode.childrenID = RemapNodeID(indexMap, ...newNode.childrenID);
        if (newNode.parentID !== undefined) {
          newNode.parentID = RemapNodeID(indexMap, newNode.parentID)[0];
        }
        let newP = newNode.parent;
        newNode.peerIndex = newP === undefined ? 0 : newP.childrenID.indexOf(newNode.index);
        if (newNode.peerIndex < 0) {
          throw new Error('Node is missing!!!');
        }
      }
    }

    if (remix !== undefined) {
      let nodeData: NodeBaseProps = L.Any;
      for (let i = 0; i < length; i++) {
        let newNode = newNodes[i];
        L.pickAssign(nodeData, newNode, nodeBaseProps, L.AssignFilter.extract);
        remix(newNode, srcNodes[indexMap[i + offset]]);
        L.assign(newNode, nodeData, L.AssignFilter.override);
      }
    }
    return newTree;
  }
}

namespace Typing {
  import CNode = core.CNode;
  import CTree = core.CTree;
  import CForest = core.CForest;
  //---------------------------------------------------------------------------------------------------------------------------------
  export interface INode2Tree<TTree> {
    readonly tree: TTree;
  }
  export interface ITree2Node<TNode> {
    readonly nodes: readonly TNode[];
    readonly nodeCount: number;
  }
  export interface Node0 extends INode2Tree<Tree0> {}
  export interface Tree0 extends ITree2Node<Node0> {}
  //---------------------------------------------------------------------------------------------------------------------------------

  export interface INodeIdx {
    readonly index: number;
    readonly peerIndex: number;
    readonly parentID: number | undefined;
    readonly childrenID: readonly number[];
    readonly subTreeRange: L.Range;
  }
  //---------------------------------------------------------------------------------------------------------------------------------
  export interface INodeSimple<TNode extends INodeSimple<TNode, TTree>, TTree extends ITreeSimple<TNode, TTree>> {
    readonly parent: TNode | undefined;
    readonly children: readonly TNode[];
    readonly deepChildren: readonly TNode[];
    readonly childCount: number;
    child(...i: (number | 'last')[]): TNode | undefined;
  }
  export interface ITreeSimple<TNode extends INodeSimple<TNode, TTree>, TTree extends ITreeSimple<TNode, TTree>> {
    readonly root: TNode;
    readonly tail: TNode;
    readonly nodeCount: number;
  }
  //---------------------------------------------------------------------------------------------------------------------------------
  export interface INodeAccess<TNode extends INodeAccess<TNode, TTree>, TTree extends ITreeAccess<TNode, TTree>> extends INodeSimple<TNode, TTree> {
    readonly isRoot: boolean;
    readonly isBranch: boolean;
    readonly isLeaf: boolean;

    readonly depth: number;
    isChildOf(node: TNode): boolean;
    findChild(matcher: (node: TNode) => boolean, deep?: boolean | undefined): Array<TNode>;
    findChild<T extends object>(matcher: (node: TNode) => boolean, deep?: boolean | undefined): Array<TNode & T>;

    call<TFunc extends (...args: any) => any>(func: TFunc, args: Parameters<TFunc>): ReturnType<TFunc>;

    [Symbol.iterator](): IterableIterator<TNode>;
    forAcending(this: TNode, action: (parent: TNode, child: TNode) => void | ('break' | undefined)): void;
    forDecending(this: TNode, action: (child: TNode, parent: TNode) => void, picker?: (parent: TNode) => number[]): void;

    subTreeInfo(detail?: boolean): string;
    nodeInfo(detail?: boolean): string;
  }

  export interface ITreeAccess<TNode extends INodeAccess<TNode, TTree>, TTree extends ITreeAccess<TNode, TTree>> extends ITreeSimple<TNode, TTree> {
    findNode(matcher: (node: TNode) => boolean): Array<TNode>;
    findNode<T extends object>(matcher: (node: TNode) => boolean): Array<TNode & T>;
    info(detail?: boolean): string;
  }
  //---------------------------------------------------------------------------------------------------------------------------------

  export interface INodeEditing<TNode extends INodeEditing<TNode, TTree>, TTree extends ITreeEditing<TNode, TTree>> {
    push(): TNode; //& func.Router<TNode, TNode, TNode>;
    push<T extends object>(...ext: T[]): TNode & L.MergO<T>; //& func.Router<L.Extend<TNode,T>, TNode, TNode>;
    push<T extends object>(ext: (node: TNode) => T): TNode & L.MergO<T>; //& func.Router<L.Extend<TNode,T>, TNode, TNode>;
    push<T extends object>(morph: 'morph', ...ext: T[]): MorphNodeNX<T>; //& func.Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;
    push<T extends object>(morph: 'morph', ext: (node: TNode) => T): MorphNodeNX<T>; //& func.Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;

    add(): TNode; //& func.Router<TNode, TNode, TNode>;
    add<T extends object>(...ext: T[]): TNode; //& func.Router<L.Extend<TNode,T>, TNode, TNode>;
    add<T extends object>(ext: (node: TNode) => T): TNode; //& func.Router<L.Extend<TNode,T>, TNode, TNode>;
    add<T extends object>(morph: 'morph', ...ext: T[]): MorphNodeNX<T>; //& func.Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;
    add<T extends object>(morph: 'morph', ext: (node: TNode) => T): MorphNodeNX<T>; //& func.Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;

    clone(cleanTree?: true, picker?: (oldNode: TNode) => boolean, remix?: (newNode: NodeX, oldNode: TNode) => void): TTree;
    clone(cleanTree?: false, picker?: (oldNode: TNode) => boolean, remix?: (newNode: TNode, oldNode: TNode) => void): TTree;

    merg<TSub extends Node0>(sub: TSub): TNode;
    merg<TSub extends Node0>(sub: TSub, peerIdx?: number): TNode;
    merg<TSub extends Tree0>(sub: TSub, cloneSub?: boolean): TNode;
    merg<TSub extends Tree0>(sub: TSub, peerIdx?: number, cloneSub?: boolean): TNode;

    remove(this: TNode): TNode[];
  }

  export interface ITreeEditing<TNode extends INodeEditing<TNode, TTree>, TTree extends ITreeEditing<TNode, TTree>> {
    // extends ITree<TNode, TTree>
    push(): TNode; //& func.Router<TNode, TTree, TNode>;
    push<T extends object>(...ext: T[]): TNode & L.MergO<T>; //& func.Router<L.Extend<TNode,T>, TTree, TNode>;
    push<T extends object>(ext: (node: TNode) => T): TNode & L.MergO<T>; //& func.Router<L.Extend<TNode,T>, TTree, TNode>;
    push<T extends object>(morph: 'morph', ...ext: T[]): MorphNodeNX<T>; //& func.Router<MorphNodeX<T>, TTree, MorphNodeX<T>>;
    push<T extends object>(morph: 'morph', ext: (node: TNode) => T): MorphNodeNX<T>; //& func.Router<MorphNodeX<T>, TTree, MorphNodeX<T>>;

    add(): TTree; //& func.Router<TNode, TNode, TNode>;
    add<T extends object>(...ext: T[]): TTree; //& func.Router<L.Extend<TNode,T>, TNode, TNode>;
    add<T extends object>(ext: (node: TNode) => T): TTree; //& func.Router<L.Extend<TNode,T>, TNode, TNode>;
    add<T extends object>(morph: 'morph', ...ext: T[]): MorphTreeNX<T>; //& func.Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;
    add<T extends object>(morph: 'morph', ext: (node: TNode) => T): MorphTreeNX<T>; //& func.Router<MorphNodeX<T>, MorphNodeX<T>, MorphNodeX<T>>;

    clone(cleanTree?: true, picker?: (oldNode: TNode) => boolean, remix?: (newNode: NodeX, oldNode: TNode) => void): TTree;
    clone(cleanTree?: false, picker?: (oldNode: TNode) => boolean, remix?: (newNode: TNode, oldNode: TNode) => void): TTree;

    merg<TSub extends Node0>(sub: TSub): TNode;
    merg<TSub extends Node0>(sub: TSub, peerIdx?: number): TNode;
    merg<TSub extends Tree0>(sub: TSub, cloneSub?: boolean): TNode;
    merg<TSub extends Tree0>(sub: TSub, peerIdx?: number, cloneSub?: boolean): TNode;
  }

  //---------------------------------------------------------------------------------------------------------------------------------

  export interface IRawNode<TNode extends IRawNode<TNode, TTree>, TTree extends IRawTree<TNode, TTree>> extends INode2Tree<TTree>, INodeIdx {}
  export interface IRawTree<TNode extends IRawNode<TNode, TTree>, TTree extends IRawTree<TNode, TTree>> extends ITree2Node<TNode> {}

  export interface ISimpleNode<TNode extends ISimpleNode<TNode, TTree>, TTree extends ISimpleTree<TNode, TTree>> extends INodeSimple<TNode, TTree>, INode2Tree<TTree> {
    poly<N extends object>(): TNode & L.MergO<N>; // L.Extend<TNode, N>;
    morph<N extends object>(): SimpleMorphNodeN<N & TNode>;
  }

  export interface ISimpleTree<TNode extends ISimpleNode<TNode, TTree>, TTree extends ISimpleTree<TNode, TTree>> extends ITreeSimple<TNode, TTree>, ITree2Node<TNode> {
    poly<T extends object>(): TTree & L.MergO<T>;
    morph<T extends object>(): SimpleMorphTreeT<T>;
    polymorph<N extends object, T extends object>(): SimpleMorphTree<N, T>;
  }

  export interface INode<TNode extends INode<TNode, TTree>, TTree extends ITree<TNode, TTree>> extends INodeAccess<TNode, TTree>, INode2Tree<TTree>, INodeIdx {
    poly<N extends object>(): TNode & L.MergO<N>;
    morph<N extends object>(): TNode & MorphNodeN<N>;
  }
  export interface ITree<TNode extends INode<TNode, TTree>, TTree extends ITree<TNode, TTree>> extends ITreeAccess<TNode, TTree>, ITree2Node<TNode> {
    poly<T extends object>(): TTree & L.MergO<T>;
    morph<T extends object>(): MorphTreeT<T>;
    polymorph<N extends object, T extends object>(): MorphTree<N, T>;
  }

  export interface IEditNode<TNode extends IEditNode<TNode, TTree>, TTree extends IEditTree<TNode, TTree>> extends INodeEditing<TNode, TTree>, INodeAccess<TNode, TTree>, INode2Tree<TTree>, INodeIdx {
    poly<N extends object>(...ext: N[]): TNode & L.MergO<N>;
    poly<N extends object>(ext: (node: TNode) => N): TNode & L.MergO<N>;

    morph<N extends object>(...ext: N[]): MorphNodeNX<N>;
    morph<N extends object>(ext: (node: TNode) => N): MorphNodeNX<N>;

    polySub<N extends object>(...ext: N[]): TNode & L.MergO<N>;
    polySub<N extends object>(ext: (node: TNode) => N): TNode & L.MergO<N>;

    morphSub<N extends object>(...ext: N[]): MorphNodeNX<N>;
    morphSub<N extends object>(ext: (node: TNode) => N): MorphNodeNX<N>;
  }

  export interface IEditTree<TNode extends IEditNode<TNode, TTree>, TTree extends IEditTree<TNode, TTree>> extends ITreeEditing<TNode, TTree>, ITreeAccess<TNode, TTree>, ITree2Node<TNode> {
    poly<T extends object>(...ext: T[]): TTree & L.MergO<T>;
    morph<T extends object>(...ext: T[]): MorphTreeTX<T>;

    polymorph<N extends object>(nodeExt: (node: TNode) => N): MorphTreeNX<N>;
    polymorph<N extends object>(...ext: N[]): MorphTreeNX<N>;
    polymorph<N extends object, T extends object>(nodeExt?: (node: TNode) => N, ...ext: T[]): MorphTreeX<N, T>;
  }

  export interface ISimplePolyNode<N extends object, T extends object, TNode extends ISimplePolyNode<N, T, TNode, TTree>, TTree extends ISimplePolyTree<N, T, TNode, TTree>>
    extends ISimpleNode<L.Extend<TNode, N>, L.Extend<TTree, T>> {}
  export interface ISimplePolyTree<N extends object, T extends object, TNode extends ISimplePolyNode<N, T, TNode, TTree>, TTree extends ISimplePolyTree<N, T, TNode, TTree>>
    extends ISimpleTree<L.Extend<TNode, N>, L.Extend<TTree, T>> {}

  export interface IPolyNode<N extends object, T extends object, TNode extends IPolyNode<N, T, TNode, TTree>, TTree extends IPolyTree<N, T, TNode, TTree>>
    extends INode<L.Extend<TNode, N>, L.Extend<TTree, T>> {}
  export interface IPolyTree<N extends object, T extends object, TNode extends IPolyNode<N, T, TNode, TTree>, TTree extends IPolyTree<N, T, TNode, TTree>>
    extends ITree<L.Extend<TNode, N>, L.Extend<TTree, T>> {}

  export interface IPolyNodeX<N extends object, T extends object, TNode extends IPolyNodeX<N, T, TNode, TTree>, TTree extends IPolyTreeX<N, T, TNode, TTree>>
    extends IEditNode<L.Extend<TNode, N>, L.Extend<TTree, T>> {}
  export interface IPolyTreeX<N extends object, T extends object, TNode extends IPolyNodeX<N, T, TNode, TTree>, TTree extends IPolyTreeX<N, T, TNode, TTree>>
    extends IEditTree<L.Extend<TNode, N>, L.Extend<TTree, T>> {}

  export interface RawNode extends IRawNode<RawNode, RawTree> {}
  export interface RawTree extends IRawTree<RawNode, RawTree> {}

  export interface SimpleNode extends ISimpleNode<SimpleNode, SimpleTree> {}
  export interface SimpleTree extends ISimpleTree<SimpleNode, SimpleTree> {}

  export interface Node extends INode<Node, Tree> {}
  export interface Tree extends ITree<Node, Tree> {}

  export interface NodeX extends IEditNode<NodeX, TreeX> {}
  export interface TreeX extends IEditTree<NodeX, TreeX> {}

  export interface SimplePolyNode<N extends object, T extends object> extends ISimplePolyNode<N, T, SimplePolyNode<N, T>, SimplePolyTree<N, T>> {}
  export interface SimplePolyTree<N extends object, T extends object> extends ISimplePolyTree<N, T, SimplePolyNode<N, T>, SimplePolyTree<N, T>> {}

  export interface PolyNode<N extends object, T extends object> extends IPolyNode<N, T, PolyNode<N, T>, PolyTree<N, T>> {}
  export interface PolyTree<N extends object, T extends object> extends IPolyTree<N, T, PolyNode<N, T>, PolyTree<N, T>> {}

  export interface PolyNodeX<N extends object, T extends object> extends IPolyNodeX<N, T, PolyNodeX<N, T>, PolyTreeX<N, T>> {}
  export interface PolyTreeX<N extends object, T extends object> extends IPolyTreeX<N, T, PolyNodeX<N, T>, PolyTreeX<N, T>> {}

  export type SimpleMorphNode<N extends object, T extends object> = SimplePolyNode<N, T> & L.MergO<N>;
  export type SimpleMorphNodeN<N extends object> = SimplePolyNode<N, object> & L.MergO<N>;
  export type SimpleMorphNodeT<T extends object> = SimplePolyNode<object, T>;

  export type SimpleMorphTree<N extends object, T extends object> = SimplePolyTree<N, T> & L.MergO<T>;
  export type SimpleMorphTreeT<T extends object> = SimplePolyTree<object, T> & L.MergO<T>;
  export type SimpleMorphTreeN<N extends object> = SimplePolyTree<N, object>;

  export type MorphNode<N extends object, T extends object> = PolyNode<N, T> & L.MergO<N>;
  export type MorphNodeN<N extends object> = PolyNode<N, object> & L.MergO<N>;
  export type MorphNodeT<T extends object> = PolyNode<object, T>;

  export type MorphTree<N extends object, T extends object> = PolyTree<N, T> & L.MergO<T>;
  export type MorphTreeT<T extends object> = PolyTree<object, T> & L.MergO<T>;
  export type MorphTreeN<N extends object> = PolyTree<N, object>;

  export type MorphNodeX<N extends object, T extends object> = PolyNodeX<N, T> & L.MergO<T>;
  export type MorphNodeNX<N extends object> = PolyNodeX<N, object> & L.MergO<N>;
  export type MorphNodeTX<T extends object> = PolyNodeX<object, T>;

  export type MorphTreeX<N extends object, T extends object> = PolyTreeX<N, T> & L.MergO<T>;
  export type MorphTreeTX<T extends object> = PolyTreeX<object, T> & L.MergO<T>;
  export type MorphTreeNX<N extends object> = PolyTreeX<N, object>;

  //export type SimplifyNode<X extends Node0>=L.ExtendOver<SimpleNode, X, X extends Node0? >;

  export function Simplify<N extends Node>(node: N): L.ExtendOver<SimpleNode, N, Node>;
  export function Simplify<N extends NodeX>(node: N): L.ExtendOver<SimpleNode, N, NodeX>;
  export function Simplify<N extends Tree>(node: N): L.ExtendOver<SimpleTree, N, Tree>;
  export function Simplify<N extends TreeX>(node: N): L.ExtendOver<SimpleTree, N, TreeX>;
  export function Simplify<N extends Tree | TreeX | Node | NodeX>(node: N): any {
    return node;
  }

  export function Nomalize<N extends SimpleNode>(node: N): L.ExtendOver<Node, N, SimpleNode>;
  export function Nomalize<N extends NodeX>(node: N): L.ExtendOver<Node, N, NodeX>;
  export function Nomalize<N extends SimpleTree>(node: N): L.ExtendOver<Tree, N, SimpleTree>;
  export function Nomalize<N extends TreeX>(node: N): L.ExtendOver<Tree, N, TreeX>;
  export function Nomalize<N extends SimpleTree | TreeX | SimpleTree | NodeX>(node: N): any {
    return node;
  }

  export function Edit<N extends SimpleNode>(node: N): L.ExtendOver<NodeX, N, SimpleNode>;
  export function Edit<N extends Node>(node: N): L.ExtendOver<NodeX, N, Node>;
  export function Edit<N extends SimpleTree>(node: N): L.ExtendOver<TreeX, N, SimpleTree>;
  export function Edit<N extends Tree>(node: N): L.ExtendOver<TreeX, N, Tree>;
  export function Edit<N extends Tree | SimpleTree | Node | SimpleNode>(node: N): any {
    return node;
  }

  export interface IForest<TTree extends Tree0> {
    trees: Array<TTree>;
    call<TFunc extends (...args: any) => any>(func: TFunc, args: Parameters<TFunc>): ReturnType<TFunc>;

    polymorph<N extends object>(): IForest<MorphTreeN<N>>;
    polymorph<N extends object, T extends object>(): IForest<MorphTree<N, T>>;
    polymorph<N extends object, T extends object, F extends object>(): L.Extend<IForest<MorphTree<N, T>>, F>;

    polymorph<F extends object>(...forestExt: F[]): L.Extend<IForest<Tree>, F>;
    polymorph<T extends object, F extends object>(treeExt: (node: CTree) => T, ...forestExt: F[]): L.Extend<IForest<MorphTreeT<T>>, F>;
    polymorph<N extends object, T extends object, F extends object>(nodeExt: (node: CNode) => N, treeExt: (node: CTree) => T, ...forestExt: F[]): L.Extend<IForest<MorphTree<N, T>>, F>;
  }

  export type Forest = IForest<TreeX>;
  export type ForestF<F extends object> = L.Extend<IForest<TreeX>, F>;
  export type ForestT<TTree extends Tree0> = IForest<TTree>;
  export type ForestTF<TTree extends Tree0, F extends object> = L.Extend<IForest<TTree>, F>;
  export type ForestNT<N extends object, T extends object> = IForest<MorphTree<N, T>>;
  export type ForestNTF<N extends object, T extends object, F extends object> = L.Extend<IForest<MorphTree<N, T>>, F>;
  export type ForestN<N extends object> = IForest<MorphTreeN<N>>;
  export type ForestNF<N extends object, F extends object> = L.Extend<IForest<MorphTreeN<N>>, F>;

  // let x: SimpleNode = L.Uny;
  // let pyz=x.poly<{y:number}>().poly<{z:number}>();
  // let myz=x.morph<{y:number}>().morph<{z:number}>();myz.tree.
}

namespace Extra {
  import CNode = core.CNode;
  import CTree = core.CTree;
  import CForest = core.CForest;
  import SimpleNode = Typing.SimpleNode;
  import MorphNodeN = Typing.MorphNodeN;

  export function nameString(this: Named): string {
    return this.name === undefined ? '[n/a]' : this.name;
  }

  export interface Named {
    name: string | undefined;
    findByName(key: string | undefined): Array<MorphNodeN<Named>>;
    toString(): string;
  }

  export function findByName(this: CNode | CTree | CForest, name: string | undefined): Array<MorphNodeN<Named>> {
    if (func.IsNode(this)) {
      return this.findChild(n => n.poly<Named>().name === name, true);
    } else if (func.IsTree(this)) {
      return this.findNode(n => n.poly<Named>().name === name);
    } else {
      let ret: Array<CNode> = [];
      let trees = this.trees;
      for (let i = 0, len = trees.length; i < len; i++) {
        ret.push(...trees[i].findNode(n => n.poly<Named>().name === name));
      }
      return ret as any;
    }
  }
}

export function Tree(): Typing.TreeX;
export function Tree<N extends object>(...nodeExt: N[]): Typing.MorphTreeNX<N>;
export function Tree(...ext: any[]): Typing.TreeX {
  let t = new core.CTree(false);
  if (ext.length > 0) {
    t.root.morph(...ext);
  }
  return t;
}
export namespace Tree {
  export type CNode = core.CNode;
  export type CTree = core.CTree;

  export import IsNode = func.IsNode;
  export import IsTree = func.IsTree;
  export import IsForest = func.IsForest;

  export import Edit = Typing.Edit;
  export import Simplify = Typing.Simplify;
  export import Nomalize = Typing.Nomalize;

  export import SimpleNode = Typing.SimpleNode;
  export import SimpleTree = Typing.SimpleTree;

  export import Node = Typing.Node;
  export import Tree = Typing.Tree;

  export import NodeX = Typing.NodeX;
  export import TreeX = Typing.TreeX;

  export import SimpleMorphNode = Typing.SimpleMorphNode;
  export import SimpleMorphNodeN = Typing.SimpleMorphNodeN;
  export import SimpleMorphNodeT = Typing.SimpleMorphNodeT;

  export import SimpleMorphTree = Typing.SimpleMorphTree;
  export import SimpleMorphTreeT = Typing.SimpleMorphTreeT;
  export import SimpleMorphTreeN = Typing.SimpleMorphTreeN;

  export import MorphNode = Typing.MorphNode;
  export import MorphNodeN = Typing.MorphNodeN;
  export import MorphNodeT = Typing.MorphNodeT;

  export import MorphTree = Typing.MorphTree;
  export import MorphTreeT = Typing.MorphTreeT;
  export import MorphTreeN = Typing.MorphTreeN;

  export import MorphNodeX = Typing.MorphNodeX;
  export import MorphNodeNX = Typing.MorphNodeNX;
  export import MorphNodeTX = Typing.MorphNodeTX;

  export import MorphTreeX = Typing.MorphTreeX;
  export import MorphTreeTX = Typing.MorphTreeTX;
  export import MorphTreeNX = Typing.MorphTreeNX;
}

export function Forest(): Typing.Forest;
export function Forest<N extends object, T extends object>(): Typing.IForest<Typing.MorphTree<N, T>>;
export function Forest<N extends object, T extends object, F extends object>(): L.Extend<Typing.IForest<Typing.MorphTree<N, T>>, F>;
export function Forest<N extends object, F extends object>(...fExt: F[]): Typing.ForestNF<N, F>;
export function Forest<F extends object>(...fExt: F[]): Typing.ForestF<F>;
export function Forest<F extends object>(...fExt: F[]): any {
  let f = new core.CForest();
  fExt.forEach(x => L.assign(f, x, L.AssignFilter.exclude));
  return f as any;
}

export namespace Forest {
  //export import CForest = core.CForest;
  export import Forest = Typing.Forest;
  export import ForestF = Typing.ForestF;
  export import ForestT = Typing.ForestT;
  export import ForestTF = Typing.ForestTF;
  export import ForestNT = Typing.ForestNT;
  export import ForestNTF = Typing.ForestNTF;
  export import ForestN = Typing.ForestN;
  export import ForestNF = Typing.ForestNF;

  export import IsNode = func.IsNode;
  export import IsTree = func.IsTree;
  export import IsForest = func.IsForest;
}

export function NamedTree(rootName?: string, treeName?: string): Typing.MorphTreeNX<NamedTree.Named> {
  let t = Tree(NamedTree.named(rootName));
  if (treeName !== undefined) {
    t.morph(NamedTree.named(treeName));
  }
  return t as any;
}

export namespace NamedTree {
  export type SimpleNamedTree = Typing.SimpleMorphTreeN<Extra.Named>;
  export type NamedTree = Typing.MorphTreeN<Extra.Named>;
  export type NamedTreeX = Typing.MorphTreeNX<Extra.Named>;

  export type SimpleNamedNode = Typing.SimpleMorphNodeN<Extra.Named>;
  export type NamedNode = Typing.MorphNodeN<Extra.Named>;
  export type NamedNodeX = Typing.MorphNodeNX<Extra.Named>;

  export import Named = Extra.Named;
  export function named(name: string | undefined): Extra.Named {
    return { name, findByName: Extra.findByName, toString: Extra.nameString };
  }
}
