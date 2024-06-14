import { Box } from "metashrew-as/assembly/utils/box";
import { input, _flush } from "metashrew-as/assembly/indexer/index";
import { FixedBST } from "metashrew-as/assembly/indexer/bst"
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
  output: ArrayBuffer
): void {
  const lookup = OUTPOINT_SPENDABLE_BY.select(output);
  const address = lookup.get();
  if (address.byteLength === 0) return;
  const table = FixedBST.at(OUTPOINTS_FOR_ADDRESS.select(address), 0x24);
  table.unmarkPath(output);
  table.nullify(output);
}

export function addToIndex(
  output: Output,
  txid: ArrayBuffer,
  index: u32
): void {
  const outpoint = outputToBytes(txid, index);
  const address = output.intoAddress();
  if (address) {
    FixedBST.at(OUTPOINTS_FOR_ADDRESS.select(address), 0x24).set(outpoint, new ArrayBuffer(0x01));
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
        removeFromIndex(input.previousOutput().toArrayBuffer());
      }
      const txid = block.transactions[i].txid();
      for (let i: i32 = 0; i < block.transactions[i].outs.length; i++) {
        addToIndex(block.transactions[i].outs[i], txid, i);
      }
    }
  }
}
