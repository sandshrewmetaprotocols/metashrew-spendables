import { Box } from "metashrew-as/assembly/utils/box"
import { input } from "metashrew-as/assembly/indexer/index";
import { parsePrimitive } from "metashrew-as/assembly/utils/utils";
import { Block } from "metashrew-as/assembly/blockdata/block";
import { Input, Output } from "metashrew-as/assembly/blockdata/transaction";
import { Index } from "metashrew-as/assembly/indexer";
import { xxh32 } from "metashrew-as/assembly/utils/xxh32";

import { console } from "metashrew-as/assembly/utils/logging";

export const OUTPUTS_FOR_ADDRESS = String.UTF8.encode("/outputsfor/");
export const OUTPUT_SPENDABLE_BY = String.UTF8.encode("/spendableby/");

export function outputToBytes(hash: Box, vout: u32): ArrayBuffer {
  const result = new ArrayBuffer(hash.len + sizeof<u32>());
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
    const i = load<u32>(changetype<usize>(get(Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(lookup), Box.from(String.UTF8.encode("/length")) ]).toArrayBuffer()))));
    if (i === 0) return;
    i--;
    while (i >= 0) {
      const itemKey = Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(lookup), Box.from(SLASH), Box.from(String.UTF8.encode(i.toString(10))) ]).toArrayBuffer());
      const item = get(itemKey);
      if (item.byteLength > 0) {
        if (xxh32(item) === hash) {
          set(itemKey, new ArrayBuffer(0));
	  break;
	}
      }
    }
  }        
}

export function addToIndex(output: Output): void {
  const spendableKey = Index.keyFor(OUTPUT_SPENDABLE_BY, output);
  const address = output.toAddress();
  if (address) {
    const lengthKey = Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(address), Box.from(String.UTF8.encode("/length")) ]).toArrayBuffer());
    const lengthBytes = get(lengthKey);
    const length = lengthBytes.byteLength === 0 ? 0 : load<u32>(changetype<usize>(lengthBytes));
    set(lengthKey, length + 1);
    const itemKey = Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(address), Box.from(SLASH), Box.from(String.UTF8.encode(length.toString(10))) ]).toArrayBuffer());
    set(itemKey, outputToBytes(output.hash, output.index));
  }
}

export function _start(): void {
  const data = input();
  const box = Box.from(data);
  const height = parsePrimitive<u32>(box);
  const block = new Block(box);
  block.transactions.forEach<Transaction>((v: Transaction) => {
    v.inputs.forEach((input: Input, i: i32, ary: Array<Input>) => {
      removeFromIndex(outputToBytes(input.hash, input.index));
    });
    v.outputs.forEach((v: Output, i: i32, ary: Array<Output>) => {
      addToIndex(v);
    })
  })
}

export function getunspent(): ArrayBuffer {
  const address = input();
  const result = new Array<RLPItem>(0);
  const length = load<u32>(changetype<usize>(get(Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(lookup), Box.from(String.UTF8.encode("/length")) ]).toArrayBuffer()))));
  for (let i = 0; i < length; i++) {
    const itemKey = Index.keyFor(OUTPUTS_FOR_ADDRESS, Box.concat([ Box.from(lookup), Box.from(SLASH), Box.from(String.UTF8.encode(i.toString(10))) ]).toArrayBuffer());
    const item = get(itemKey);
    if (item.byteLength > 0) {
       result.push(RLPItem.fromArrayBuffer(item));
    }
  }
  return toRLP(RLPItem.fromList(result));
} 
