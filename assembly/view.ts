import { input } from "metashrew-as/assembly/indexer/index";
import { Box } from "metashrew-as/assembly/utils/box";
import { parsePrimitive } from "metashrew-as/assembly/utils/utils";
import { spendables } from "./protobuf";
import { OUTPOINTS_FOR_ADDRESS, OUTPOINT_TO_OUTPUT } from "./tables";
import { Index, bytesToOutput } from "./indexer";
import { console } from "metashrew-as/assembly/utils/logging";

export function getunspent(): ArrayBuffer {
  const data = Box.from(input());
  parsePrimitive<u32>(data);
  const address = data.toArrayBuffer();
  const response = new spendables.GetUnspentResponse();
  const outpointPointer = OUTPOINTS_FOR_ADDRESS.select(address);
  const length: i32 = <i32>outpointPointer.length();
  for (let i = 0; i < length; i++) {
    const item = outpointPointer.selectIndex(i).get();
    if (item.byteLength) {
      const output = new spendables.Output();
      response.outputs.push(
        bytesToOutput(OUTPOINT_TO_OUTPUT.select(item).get())
      );
    }
  }
  return response.encode();
}
