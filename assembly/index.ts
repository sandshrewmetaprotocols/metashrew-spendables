import { Block } from "metashrew-as/assembly/blockdata/block";
import { input, _flush } from "metashrew-as/assembly/indexer/index";
import { Box } from "metashrew-as/assembly/utils/box";
import { parsePrimitive } from "metashrew-as/assembly/utils/utils";
import { SpendablesIndex, bytesToOutput } from "./indexer";
import { console } from "metashrew-as/assembly/utils/logging";

export function _start(): void {
  const data = input();
  const box = Box.from(data);
  const height = parsePrimitive<u32>(box);
  new SpendablesIndex().indexBlock(height, new Block(box));
  _flush();
}
