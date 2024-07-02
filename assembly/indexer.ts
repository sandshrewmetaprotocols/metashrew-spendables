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
import { parsePrimitive, primitiveToBuffer } from "metashrew-as/assembly/utils";

export function outputToBytes(
  hash: ArrayBuffer,
  vout: u32,
  log: bool = false,
): ArrayBuffer {
  const res = OutPoint.from(hash, vout).toArrayBuffer();
  return res;
}

export function arrayBufferToArray(data: ArrayBuffer): Array<u8> {
  const result = new Array<u8>(data.byteLength);
  store<usize>(changetype<usize>(result), changetype<usize>(data));
  store<usize>(
    changetype<usize>(result) + sizeof<usize>(),
    changetype<usize>(data),
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

export class Index {
  static indexBlock(height: u32, block: Block): void {
    for (let txIdx = 0; txIdx < block.transactions.length; txIdx++) {
      const tx = block.transactions[txIdx];

      for (let inp = 0; inp < block.transactions[txIdx].ins.length; inp++) {
        const input = tx.ins[inp];
        const output = input.previousOutput().toArrayBuffer();
        const lookup = OUTPOINT_SPENDABLE_BY.select(output);
        lookup.nullify();
      }
      const txid = tx.txid();
      for (let outIdx: i32 = 0; outIdx < tx.outs.length; outIdx++) {
        const output = tx.outs[outIdx];
        const outpoint = outputToBytes(txid, outIdx);
        const address = output.intoAddress();
        OUTPOINT_TO_OUTPUT.select(outpoint).set(output.bytes.toArrayBuffer());
        if (address) {
          OUTPOINTS_FOR_ADDRESS.select(address).append(outpoint);
          OUTPOINT_SPENDABLE_BY.select(outpoint).set(address);
        }
      }
    }
  }

  static findOutpointsForAddress(address: ArrayBuffer): Array<ArrayBuffer> {
    const addressPtr = OUTPOINTS_FOR_ADDRESS.select(address);
    const keys = new Array<ArrayBuffer>(0);

    for (let i: u32 = 0; i < addressPtr.length(); i++) {
      const item = Box.from(addressPtr.selectIndex(i).get()).setLength(36).toArrayBuffer();
      console.log(item.byteLength.toString(10));
      console.log(Box.from(item).toHexString());
      const _address = OUTPOINT_SPENDABLE_BY.select(item).get();
//      console.log(Box.from(_address).toHexString());
      if (
        memory.compare(
          changetype<usize>(address),
          changetype<usize>(_address),
          address.byteLength,
        ) == 0
      ) {
        keys.push(item);
      }
    }

    return keys;
  }
}
