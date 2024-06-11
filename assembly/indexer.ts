import { Box } from "metashrew-as/assembly/utils/box"
import { input, _flush } from "metashrew-as/assembly/indexer/index";
import { Block } from "metashrew-as/assembly/blockdata/block";
import { Transaction, Input, Output } from "metashrew-as/assembly/blockdata/transaction";
import { sha256 } from "metashrew-as/assembly/utils/sha256";
import {
  OUTPOINTS_FOR_ADDRESS,
  OUTPOINT_SPENDABLE_BY,
  OUTPOINT_TO_OUTPUT
} from "./tables";
import { spendables } from "./protobuf";

export function outputToBytes(hash: Box, vout: u32): ArrayBuffer {
  const result = new ArrayBuffer(<i32>hash.len + sizeof<u32>());
  memory.copy(changetype<usize>(result), hash.start, hash.len);
  store<u32>(changetype<usize>(result) + <usize>hash.len, vout);
  return result;
}

export function arrayBufferToArray(data: ArrayBuffer): Array<u8> {
  const result = new Array<u8>(data.byteLength);
  store<usize>(changetype<usize>(result), changetype<usize>(data));
  store<usize>(changetype<usize>(result) + sizeof<usize>(), changetype<usize>(data));
  return result;
}

export function bytesToOutput(data: ArrayBuffer): spendables.Output {
  const output = new Output(Box.from(data));
  const result = new spendables.Output();
  result.script = arrayBufferToArray(output.script.toArrayBuffer());
  result.value = output.value;
  return result;
}

export function removeFromIndex(output: ArrayBuffer): void {
  const lookup = OUTPOINT_SPENDABLE_BY.select(output);
  const address = lookup.get();
  if (address.byteLength === 0) return;
  const hash = sha256(output);
  const addressPointer = OUTPOINTS_FOR_ADDRESS.select(address);
  let i = addressPointer.length();
  while (i >= <u32>0) {
    const itemPointer = addressPointer.selectIndex(i);
    const item = itemPointer.get();
    if (item.byteLength > 0) {
      if (memory.compare(changetype<usize>(item), changetype<usize>(hash), item.byteLength) === 0) {
        itemPointer.set(new ArrayBuffer(0));
	break;
      }
    }
    i--
  }        
}

export function addToIndex(output: Output, txid: ArrayBuffer, index: u32): void {
  const outpoint = outputToBytes(Box.from(txid), index);
  const address = output.intoAddress();
  if (address) {
    OUTPOINTS_FOR_ADDRESS.select(address).append(outpoint);
    OUTPOINT_SPENDABLE_BY.select(outpoint).set(address);
  }
}

export function indexTransactionOutputs(tx: Transaction): void {
  const txid = tx.txid();
  for (let i = 0; i < tx.outs.length; i++) {
    OUTPOINT_TO_OUTPUT.select(outputToBytes(Box.from(txid), i)).set(tx.outs[i].bytes.toArrayBuffer());
  }
}

export class Index {
  static indexBlock(height: u32, block: Block): void {
    block.transactions.forEach((v: Transaction, i: i32) => {
      indexTransactionOutputs(v);
      v.ins.forEach((input: Input, i: i32, ary: Array<Input>) => {
        removeFromIndex(outputToBytes(input.hash, input.index));
      });
      const txid = v.txid();
      for (let i: i32 = 0; i < v.outs.length; i++) {
        addToIndex(v.outs[i], txid, i);
      }
    })
  }
}

