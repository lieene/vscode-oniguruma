// File: oni2.ts                                                                   //
// Project: lieene.CodeFactory                                                     //
// Author: Lieene Guo                                                              //
// MIT License                                                                     //
// Copyright (c) 2019 Lieene@ShadeRealm                                            //
// Created Date: Thu Nov 14 2019                                                   //
// Last Modified: Mon Nov 25 2019                                                  //
// Modified By: Lieene Guo                                                         //

// import '@lieene/ts-utility';
import { Tree, Name } from 'poly-tree';
import * as L from '@lieene/ts-utility';
import { promisify } from 'util';

export interface VscodeLike { env: { appRoot: string }; }

namespace Internal
{
  export interface OniBin
  {
    _findNextMatchSync(string: string, startPosition: number): Match | null;
    _findNextMatch(string: string, startPosition: number, callBack: (error: any, match: Match | null) => void): void;
  }

  interface OniBinCtor { new(patterns: string[]): OniBin; }
  interface OniStrCtor { new(string: string): OniStr; }
  var binCtor: OniBinCtor = L.Uny;
  var binStrCtor: OniStrCtor = L.Uny;

  const pathInVsRoot = '/node_modules.asar.unpacked/oniguruma/build/Release/onig_scanner.node';
  const PathInPackage = `../../node_modules/oniguruma/build/Release/onig_scanner.node`;
  const localPath = `../node_modules/oniguruma/build/Release/onig_scanner.node`;
  /**
   * use vscode built-in oniguruma node binary
   * @param vscode pass vscode object when used as vscode extension
   */
  export function InitFrom(vscode: VscodeLike): void;
  /**
   * use custom oniguruma node binary
   * @param fullpath path to oniguruma node binary
   */
  export function InitFrom(fullpath: string): void;
  /**
   * use custom oniguruma node binary from atom npm package
   * @param defaultPath path of oniguruma node binary as npm package
   */
  export function InitFrom(defaultPath: `../../node_modules/oniguruma/build/Release/onig_scanner.node`): void;
  export function InitFrom(from?: VscodeLike | string): void
  {
    try
    {
      if (L.IsString(from)) 
      {
        let bin = require(from);
        binCtor = bin.OnigScanner;
        binStrCtor = bin.OnigString;
      }
      else if (from)
      {
        let bin = require(from.env.appRoot + pathInVsRoot);
        binCtor = bin.OnigScanner;
        binStrCtor = bin.OnigString;
      }
    }
    catch (e) { GetOni(); }
  }

  export function GetOni(op?: "Scaner"): OniBinCtor;
  export function GetOni(op: "String"): OniStrCtor;
  export function GetOni(op?: "String" | "Scaner"): OniBinCtor | OniStrCtor
  {
    if (binCtor === undefined)
    {
      try
      {
        let bin = require(PathInPackage);
        binCtor = bin.OnigScanner;
        binStrCtor = bin.OnigString;
      }
      catch (e)
      {
        try
        {
          let bin = require(localPath);
          binCtor = bin.OnigScanner;
          binStrCtor = bin.OnigString;
        }
        catch (e) { throw new Error('Oniguruma binary node file not found. try use OnigScanner.InitFrom ahead.'); }
      }
    }
    return op === "String" ? binStrCtor : binCtor;
  }
  export function IsGroupFound(g0: GroupCapture, gn: GroupCapture): boolean
  {
    if (gn === undefined) { return false; }
    if (gn.index === 0) { return true; }
    if (gn.start === 0)
    {
      if (g0.start !== 0) { return false; }
      else { return gn.length > 0 || (g0.length === 0 && gn.length === 0); } //do not allow leading anchor
    }
    else { return true; }
  }

  const patterns = [
    '(?<!\\\\)\\((?!\\?)', //0 index capture group begin
    '(?<!\\\\)\\(\\?<([a-zA-Z_][a-zA-Z0-9_]*)>', //1 named capture group begin
    '(?<!\\\\)\\)', //2 group end
    '(?<!\\\\)\\(\\?\\#(?m:.)*?\\)', //3 comment group
    '(?<!\\\\)\\(\\?[\\-imxWDSPy]+:', //4 option group
    '(?<!\\\\)\\(\\?[\\-imxWDSPy]+\\)', //5 option switch
    '(?<!\\\\)\\(\\?(:|=|!|<=|<!|>|{|~)', //6 none cap
    '(?<!\\\\)\\(\\?(?=\\()', //7 Conditional
  ];
  const patternsExt = [...patterns, '(?<!\\\\)#.*']; //8 lineEndComment

  var ops: Internal.OniBin | undefined = undefined;
  function oniPatterScanner(): Internal.OniBin
  { return ops === undefined ? (ops = new (Internal.GetOni())(patterns)) : ops; }

  let opsx: Internal.OniBin | undefined = undefined;
  function oniPatterScannerExt(): Internal.OniBin
  { return opsx === undefined ? (opsx = new (Internal.GetOni())(patternsExt)) : opsx; }

  let oop: Internal.OniBin | undefined = undefined;
  //https://regex101.com/r/sASjOR/1
  function oniOption(): Internal.OniBin
  { return oop === undefined ? (oop = new (Internal.GetOni())(['\\?(?:[imWDSPy]|(x))*-?(?:[imWDSPy]|(x))*'])) : oop; }

  //const
  let indexCapGroup = 0;
  let namedCapGroup = 1;
  let groupEnd = 2;
  let commentGroup = 3;
  let optionGroup = 4;
  let optionSwitch = 5;
  let noneCap = 6;
  let ConditionalGroup = 7;
  let lineEndComment = 8;

  export function parseSource(source: string): Pattern
  {
    let groupTree: Tree.MorphTreeX<Name, { source: string }> = Tree<Name, { source: string }>({ source: source });
    let groupNode = groupTree.root;
    let cap: boolean = true;
    let ext: boolean = false;
    let capStack: Array<boolean> = [];
    let extStack: Array<boolean> = [];
    let position = 0;
    let match: Match | null = oniPatterScanner()._findNextMatchSync(source, position);
    while (match !== null)
    {
      let captures = match.captureIndices;
      let fullMatch = captures[0];
      let g1 = captures[1];
      let index = match.index;
      position = fullMatch.end;
      switch (index)
      {
        case indexCapGroup:
          cap = true;
          capStack.push(cap);
          groupNode = groupNode.push(Name(undefined));
          break;
        case namedCapGroup:
          cap = true;
          capStack.push(cap);
          groupNode = groupNode.push(Name(source.slice(g1.start, g1.end)));
          break;
        case groupEnd:
          cap = capStack.pop()!;
          if (cap) { groupNode = groupNode.parent!; }
          break;
        case optionSwitch:
        case optionGroup:
          let matchOp = oniOption()._findNextMatchSync(source.slice(fullMatch.start, fullMatch.end), 0);
          if (matchOp !== null)
          {
            let newExt: boolean = ext;
            if (matchOp.captureIndices[1].length === 1) { newExt = true; }
            if (matchOp.captureIndices[2].length === 1) { newExt = false; }
            if (index === optionGroup)
            {
              extStack.push(ext);
              ext = newExt;
              cap = false;
              capStack.push(cap);
            }
            else { ext = newExt; }//index === optionSwitch
          }
          break;
        case noneCap: cap = false; capStack.push(cap); break;
        case ConditionalGroup: cap = false; capStack.push(cap); break;
        case commentGroup:
        case lineEndComment: break;
        default: break;
      }
      if (ext) { match = oniPatterScannerExt()._findNextMatchSync(source, position); }
      else { match = oniPatterScanner()._findNextMatchSync(source, position); }
    }
    return Tree.Simplify(groupTree);
  }
}

export type Callback<T> = (error: Error, match: T) => void;

/**
 * An object representing a range within a search string, corresponding to
 * either a full-string match, or a capturing group within a match.
 */
export interface GroupCapture
{
  /** The index of the capturing group, or 0 for a full-string match */
  index: number;
  /** The position in the search string where the capture begins */
  start: number;
  /** The position in the search string where the capture ends */
  end: number;
  /** The total character length of the capture */
  length: number;

  /** tell if this specific group in matched */
  isMatched: boolean;
  /** The matched string of current group */
  match: string;
  /** name of the matching group if defined*/
  groudName: string | undefined;
}

/**
 * An object representing one successful regex match between a pattern and a
 * search string.
 */
export interface Match
{
  /** The index of the best pattern match */
  index: number;

  /** An array holding all of the captures (full match + capturing groups) */
  captureIndices: GroupCapture[];

  /** scanner used to find this match */
  scanner: OnigScanner;

  /**tree of groups of this scanner*/
  groupInfo: Pattern;
}

export type Pattern = Tree.MorphTreeS<Name, { readonly source: string }>;
export type MatchTree = Tree.MorphTreeX<MatchNodeExt, { source: string }>;
export type MatchNode = Tree.MorphNodeX<MatchNodeExt, { source: string }>;

type MatchNodeExt = { range: L.Range } & Name;
function MatchNodeExt(range: L.Range, name?: string): MatchNodeExt
{
  let x = Object.assign(Name(name), { range: range });
  x.toString = LogMatchString;
  return x;
}

function LogMatchString(this: MatchNode): string
{
  let slice = this.tree.source.slice(this.range.start, this.range.end);
  let rgs = this.range.toString();
  return `${this.name === undefined ? '' : this.name + '|'}${rgs}:${slice}`;
}

/**
 * An object representing one OR MORE regex patterns, which can be used to
 * interrogate strings for matches against any of the supplied patterns.
 */
export class OnigScanner
{
  /**
   * Create a new scanner with the given patterns.
   * @param patterns An array of string patterns.
   */
  constructor(...patterns: string[])
  {
    this.internalOni = new (Internal.GetOni())(patterns);
    this.patterns = [];
    let pushable = this.patterns as Array<Pattern>;
    for (let i = 0, len = patterns.length; i < len; i++)
    { pushable.push(Internal.parseSource(patterns[i])); }
  }

  readonly patterns: ReadonlyArray<Pattern>;
  static InitFrom = Internal.InitFrom;

  /**
   * Find the next match from the beginning of a string
   * @param string The string to search
   * @param startPosition The optional position to start at, defaults to 0
   * @return Promise a match or null if not found
   */
  async findNextMatch(string: string, startPosition: number = 0): Promise<Match | null>
  { return this.filterMatch(string, await promisify<string, number, Match | null>(this.internalOni._findNextMatch)(string, startPosition)); }

  /**
   * Synchronously find the next match from a given position
   * @param string The string to search
   * @param startPosition The optional position to start at, defaults to 0
   * @return An object containing details about the match, or null if no match
   */
  findNextMatchSync(string: string, startPosition?: number): Match | null
  {
    if (startPosition === undefined) { startPosition = 0; }
    return this.filterMatch(string, this.internalOni._findNextMatchSync(string, startPosition));
  }

  async forAllMatch(string: string, onMatch: (m: Match) => void): Promise<void>
  {
    let m, pos = 0;
    while ((m = await this.findNextMatch(string, pos)))
    { onMatch(m); pos = m.captureIndices[0].end; }
  }

  forAllMatchSync(string: string, onMatch: (m: Match) => void): void
  {
    let m, pos = 0;
    while ((m = this.findNextMatchSync(string, pos)))
    { onMatch(m); pos = m.captureIndices[0].end; }
  }

  async findAllMatch(string: string): Promise<Match[]>
  {
    let m, pos = 0;
    let am: Match[] = [];
    while ((m = await this.findNextMatch(string, pos)))
    { am.push(this.filterMatch(string, m)!); pos = m.captureIndices[0].end; }
    return am;
  }

  findAllMatchSync(string: string): Match[]
  {
    let m, pos = 0;
    let am: Match[] = [];
    while ((m = this.findNextMatchSync(string, pos)))
    { am.push(m); pos = m.captureIndices[0].end; }
    return am;
  }

  //BuildMatchTree<T extends object>(builder: (g: Tree.MorphNodeN<Named>, n: Tree.MorphNodeN<T>) => T, ...matches: Match[]): Tree.MorphTreeN<T>;
  buildMatchTree(string: string): MatchTree | null
  {
    let info = { source: string, toString: () => string };
    let mt: MatchTree = Tree<MatchNodeExt, { source: string }>({ source: string });
    mt.root.poly(info);
    mt.source = string;
    let m, pos = 0;
    while ((m = this.findNextMatchSync(string, pos)))
    {
      let gpt: Tree.MorphTreeNX<Name> = this.patterns[m.index] as any;
      let caps = m.captureIndices;
      let sub = gpt.clone(
        true,
        n => caps[n.index].isMatched,
        (n, o) =>
        {
          let c = caps[o.index];
          n.poly(MatchNodeExt(new L.Range(c.start, c.length), o.name));
        },
      );
      mt.merg(sub, false);
      pos = caps[0].end;
    }
    return mt;
  }

  /**
   * Test if this regular expression matches the given string.
   * @param string The string to test against.
   * @return boolean Promise will be true if at least one match was found, or false otherwise.
   */
  async test(string: string): Promise<boolean>
  { return (await promisify<string, number, Match | null>(this.internalOni._findNextMatch)(string, 0)) !== null; }

  /**
   * Synchronously test if this regular expression matches the given string.
   * @param string The string to test against.
   * @return True if there is at least one match, or false otherwise.
   */
  testSync(string: string): boolean
  { return this.internalOni._findNextMatchSync(string, 0) === null; }

  private internalOni: Internal.OniBin;
  private filterMatch(string: string, m: Match | null): Match | null
  {
    if (m !== null)
    {
      m.scanner = this;
      m.groupInfo = this.patterns[m.index];
      let g0 = m.captureIndices[0];
      m.captureIndices.forEach((gn, i) =>
      {
        gn.groudName = m.groupInfo.nodes[i].name;
        gn.isMatched = Internal.IsGroupFound(g0, gn);
        gn.match = string.slice(gn.start, gn.end);
      });
    }
    return m;
  }
}

/**
 * Wrap a string primitive in a new OnigString object
 * @param string The string primitive to be wrapped
 */
export function OniStr(string: string): OniStr
{
  let str = new (Internal.GetOni("String"))(string);
  str.toString = function (this: OniStr): string { return this.content; };
  return str;
}
export interface OniStr
{
  /** The string primitive wrapped by the object */
  readonly content: string;
  toString(): string;
}
