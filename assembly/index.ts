import { Box } from "metashrew-as/assembly/utils/box"
import { input, get, set, _flush, Index } from "metashrew-as/assembly/indexer/index";
import { parsePrimitive } from "metashrew-as/assembly/utils/utils";
import { Block } from "metashrew-as/assembly/blockdata/block";
import { Transaction, Input, Output } from "metashrew-as/assembly/blockdata/transaction";
import { xxh32 } from "metashrew-as/assembly/utils/xxh32";

import { console } from "metashrew-as/assembly/utils/logging";
import { toRLP, RLPItem } from "metashrew-as/assembly/utils/rlp";

export const OUTPUTS_FOR_ADDRESS = String.UTF8.encode("/outputsfor/");
export const OUTPUT_SPENDABLE_BY = String.UTF8.encode("/spendableby/");

export function outputToBytes(hash: Box, vout: u32): ArrayBuffer {
  const result = new ArrayBuffer(<i32>hash.len + sizeof<u32>());
  memory.copy(changetype<usize>(result), hash.start, hash.len);
  store<u32>(changetype<usize>(result) + <usize>hash.len, vout);
  return result;
}

const SLASH = String.UTF8.encode("/");

export function removeFromIndex(output: ArrayBuffer): void {
  const lookupKey = Index.keyFor(OUTPUT_SPENDABLE_BY, output);
  const lookup = get(Index.keyFor(OUTPUT_SPENDABLE_BY, output));
  set(lookupKey, new ArrayBuffer(0));
  const hash = xxh32(output);
  if (lookup.byteLength > 0) {
    let i = load<u32>(changetype<usize>(get(Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(lookup), Box.from(String.UTF8.encode("/length")) ])))));
    if (i === 0) return;
    i--;
    while (i >= 0) {
      const itemKey = Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(lookup), Box.from(SLASH), Box.from(String.UTF8.encode(i.toString(10))) ]));
      const item = get(itemKey);
      if (item.byteLength > 0) {
        if (xxh32(item) === hash) {
          set(itemKey, new ArrayBuffer(0));
	  break;
	}
      }
      i--
    }
  }        
}

export function addToIndex(output: Output, txid: ArrayBuffer, index: u32): void {
  const spendableKey = Index.keyFor(OUTPUT_SPENDABLE_BY, outputToBytes(Box.from(txid), index));
  const address = output.intoAddress();
  if (address) {
    const lengthKey = Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(address), Box.from(String.UTF8.encode("/length")) ]));
    const lengthBytes = get(lengthKey);
    const length = lengthBytes.byteLength === 0 ? 0 : load<u32>(changetype<usize>(lengthBytes));
    const newLength = new ArrayBuffer(sizeof<u32>());
    store<u32>(changetype<usize>(newLength), length + 1);
    set(lengthKey, newLength);
    const itemKey = Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(address), Box.from(SLASH), Box.from(String.UTF8.encode(length.toString(10))) ]));
    set(itemKey, outputToBytes(Box.from(txid), index));
  }
}

class Entry {
  public output: Output;
  public txid: ArrayBuffer;
  public i: u32;
  constructor(output: Output, txid: ArrayBuffer, i: u32) {
    this.output = output;
    this.txid = txid;
    this.i = i;
  }
}

export function _start(): void {
  const data = input();
  const box = Box.from(data);
  const height = parsePrimitive<u32>(box);
  const block = new Block(box);
  block.transactions.forEach((v: Transaction, i: i32) => {
    v.ins.forEach((input: Input, i: i32, ary: Array<Input>) => {
      removeFromIndex(outputToBytes(input.hash, input.index));
    });
    const txid = v.txid();
    for (let i: i32 = 0; i < v.outs.length; i++) {
      addToIndex(v.outs[i], txid, i);
    }
  })
  _flush();
}

export function getunspent(): ArrayBuffer {
  const address = input();
  const result = new Array<RLPItem>(0);
  const length = load<u32>(changetype<usize>(get(Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(address), Box.from(String.UTF8.encode("/length")) ])))));
  for (let i: u32 = 0; i < length; i++) {
    const itemKey = Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(address), Box.from(SLASH), Box.from(String.UTF8.encode(i.toString(10))) ]));
    const item = get(itemKey);
    if (item.byteLength > 0) {
       result.push(RLPItem.fromArrayBuffer(item));
    }
  }
  return toRLP(RLPItem.fromList(result));
} 
