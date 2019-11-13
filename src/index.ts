// File: index.ts                                                                  //
// Project: lieene.vscode-oniguruma                                                //
// Created Date: Tue Nov 12 2019                                                   //
// Author: Lieene Guo                                                              //
// MIT License                                                                     //
// Copyright (c) 2019 Lieene@ShadeRealm                                            //

import '@lieene/ts-utility';
import * as L from '@lieene/ts-utility';
import { Tree, NamedTree as nt } from "poly-tree";
import { promisify } from 'util';

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

export type Pattern = Tree.SimpleMorphTree<nt.Named, { readonly source: string }>;

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

  /**
   * Find the next match from the beginning of a string
   * @param string The string to search
   * @param startPosition The optional position to start at, defaults to 0
   * @return Promise a match or null if not found
   */
  async findNextMatch(string: string, startPosition: number = 0): Promise<Match | null>
  {
    let m = await promisify(this.internalOni._findNextMatch)(string, startPosition);
    return this.filterMatch(string, m);
  }

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

  /**
 * Test if this regular expression matches the given string.
 * @param string The string to test against.
 * @return boolean Promise will be true if at least one match was found, or false otherwise.
 */
  async test(string: string, callback: Callback<boolean>): Promise<boolean>
  { return (await promisify(this.internalOni._findNextMatch)(string, 0)) !== null; }

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

namespace Internal
{
  export interface OniBin
  {
    _findNextMatchSync(string: string, startPosition: number): Match | null;
    _findNextMatch(string: string, startPosition: number, callBack: (error: any, match: Match | null) => void): void;
  }
  interface OniBinCtor { new(patterns: string[]): OniBin; }

  var binCtor: OniBinCtor = L.Uny;
  export function GetOni(): OniBinCtor
  {
    if (binCtor === undefined)
    {
      try
      {
        let vsc = require("vscode");
        binCtor = require((vsc.env.appRoot as string) + '/node_modules.asar.unpacked/oniguruma/build/Release/onig_scanner.node').OnigScanner;
      }
      catch (e) 
      {
        try { binCtor = require('../../../oniuruma/build/Release/onig_scanner.node').OnigScanner; }
        catch (e)
        {
          binCtor = require('../node_modules/oniguruma/build/Release/onig_scanner.node').OnigScanner;
        }
      }
    }
    return binCtor;
  }
  export function IsGroupFound(g0: GroupCapture, gn: GroupCapture): boolean
  {
    if (gn === undefined) { return false; }
    if (gn.index === 0) { return true; }
    if (gn.start === 0)
    {
      if (g0.start !== 0) { return false; }
      else { return gn.length > 0 || (g0.length === 0 && gn.length === 0); }//do not allow leading anchor
    }
    else { return true; }
  }



  const patterns = [
    "(?<!\\\\)\\((?!\\?)",                         //0 index capture group begin
    "(?<!\\\\)\\(\\?<([a-zA-Z_][a-zA-Z0-9_]*)>",   //1 named capture group begin
    "(?<!\\\\)\\)",                                //2 group end
    "(?<!\\\\)\\(\\?\\#(?m:.)*?\\)",               //3 comment group
    "(?<!\\\\)\\(\\?[\\-imxWDSPy]+:",              //4 option group
    "(?<!\\\\)\\(\\?[\\-imxWDSPy]+\\)",            //5 option switch
    "(?<!\\\\)\\(\\?(:|=|!|<=|<!|>|{|~)",	       //6 none cap
    "(?<!\\\\)\\(\\?(?=\\()",					   //7 Conditional
  ];
  const patternsExt = [...patterns, "(?<!\\\\)#.*"]; //8 lineEndComment

  var ops: Internal.OniBin | undefined = undefined;
  function oniPatterScanner(): Internal.OniBin { return ops === undefined ? ops = new (Internal.GetOni())(patterns) : ops; }

  let opsx: Internal.OniBin | undefined = undefined;
  function oniPatterScannerExt(): Internal.OniBin
  { return opsx === undefined ? opsx = new (Internal.GetOni())(patternsExt) : opsx; }

  let oop: Internal.OniBin | undefined = undefined;
  //https://regex101.com/r/sASjOR/1
  function oniOption(): Internal.OniBin
  { return oop === undefined ? oop = new (Internal.GetOni())(["\\?(?:[imWDSPy]|(x))*-?(?:[imWDSPy]|(x))*"]) : oop; }

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
    let groupTree: Tree.MorphTreeX<nt.Named, { source: string }> = Tree<nt.Named>().morph({ source }) as any;
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
          groupNode = groupNode.push(nt.named(undefined));
          break;
        case namedCapGroup:
          cap = true;
          capStack.push(cap);
          groupNode = groupNode.push(nt.named(source.slice(g1.start, g1.end)));
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
            else if (index === optionSwitch)
            { ext = newExt; }
          }
          break;
        case noneCap:
          cap = false;
          capStack.push(cap);
          break;
        case ConditionalGroup:
          cap = false;
          capStack.push(cap);
          break;
        case commentGroup:
        case lineEndComment:
          break;
        default:
          break;
      }
      if (ext) { match = oniPatterScannerExt()._findNextMatchSync(source, position); }
      else { match = oniPatterScanner()._findNextMatchSync(source, position); }
    }
    return groupTree as any;
  }
}