import { Box } from "metashrew-as/assembly/utils/box";
import { input, _flush } from "metashrew-as/assembly/indexer/index";
import { Block } from "metashrew-as/assembly/blockdata/block";
import { IndexPointer } from "metashrew-as/assembly/indexer/tables";
import {
  Transaction,
  Input,
  Output,
  OutPoint,
} from "metashrew-as/assembly/blockdata/transaction";
import { sha256 } from "metashrew-as/assembly/utils/sha256";
import {
  OUTPOINTS_FOR_ADDRESS,
  OUTPOINT_SPENDABLE_BY,
  OUTPOINT_TO_OUTPUT,
} from "./tables";
import { console } from "metashrew-as/assembly/utils/logging";
import { spendables } from "./protobuf";
import { encodeHexFromBuffer } from "metashrew-as/assembly/utils/hex";

export function outputToBytes(
  hash: ArrayBuffer,
  vout: u32,
  log: bool = false
): ArrayBuffer {
  const res = OutPoint.from(hash, vout).toArrayBuffer();
  return res;
}

export function arrayBufferToArray(data: ArrayBuffer): Array<u8> {
  const result = new Array<u8>(data.byteLength);
  store<usize>(changetype<usize>(result), changetype<usize>(data));
  store<usize>(
    changetype<usize>(result) + sizeof<usize>(),
    changetype<usize>(data)
  );
  return result;
}

export function bytesToOutput(data: ArrayBuffer): spendables.Output {
  const output = new Output(Box.from(data));
  const result = new spendables.Output();
  result.script = arrayBufferToArray(output.script.toArrayBuffer());
  result.value = output.value;
  return result;
}

export function removeFromIndex(
  output: ArrayBuffer,
  txindex: i32,
  inp: i32
): void {
  const lookup = OUTPOINT_SPENDABLE_BY.select(output);
  __collect();
  const address = lookup.get();
  if (address.byteLength === 0) return;
  const addressPointer = OUTPOINTS_FOR_ADDRESS.select(address);
  let i = <i32>addressPointer.length();
  let itemPointer: IndexPointer, item: ArrayBuffer;
  console.log(changetype<usize>(addressPointer).toString());
  while (i >= 0) {
    itemPointer = addressPointer.selectIndex(i);
    console.log(txindex.toString() + ":" + i.toString() + ":" + inp.toString());
    /*  console.log(changetype<usize>(itemPointer).toString()); */
    item = itemPointer.get();
    __pin(changetype<usize>(itemPointer));
    __pin(changetype<usize>(item));
    if (item.byteLength > 0) {
      if (
        memory.compare(
          changetype<usize>(item),
          changetype<usize>(output),
          item.byteLength
        ) === 0
      ) {
        itemPointer.set(new ArrayBuffer(0));
        __unpin(changetype<usize>(itemPointer));
        __unpin(changetype<usize>(item));
        __collect();
        break;
      }
    }
    __unpin(changetype<usize>(itemPointer));
    __unpin(changetype<usize>(item));
    __collect();
    i--;
  }
}

export function addToIndex(
  output: Output,
  txid: ArrayBuffer,
  index: u32
): void {
  const outpoint = outputToBytes(txid, index);
  const address = output.intoAddress();
  if (address) {
    OUTPOINTS_FOR_ADDRESS.select(address).append(outpoint);
    OUTPOINT_SPENDABLE_BY.select(outpoint).set(address);
  }
}

export function indexTransactionOutputs(tx: Transaction): void {
  const txid = tx.txid();
  for (let i = 0; i < tx.outs.length; i++) {
    OUTPOINT_TO_OUTPUT.select(outputToBytes(txid, i)).set(
      tx.outs[i].bytes.toArrayBuffer()
    );
  }
}

export class Index {
  static indexBlock(height: u32, block: Block): void {
    for (let i = 0; i < block.transactions.length; i++) {
      indexTransactionOutputs(block.transactions[i]);

      for (let inp = 0; inp < block.transactions[i].ins.length; inp++) {
        const input = block.transactions[i].ins[inp];
        removeFromIndex(input.previousOutput().toArrayBuffer(), i, inp);
      }
      const txid = block.transactions[i].txid();
      for (let i: i32 = 0; i < block.transactions[i].outs.length; i++) {
        addToIndex(block.transactions[i].outs[i], txid, i);
      }
    }
  }
}
