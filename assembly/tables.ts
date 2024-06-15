import { IndexPointer } from "metashrew-as/assembly/indexer/tables";

export const OUTPOINTS_FOR_ADDRESS = IndexPointer.for("/outpoints/byaddress/");
export const OUTPOINT_SPENDABLE_BY = IndexPointer.for("/outpoint/spendableby/");
export const OUTPOINT_TO_OUTPUT = IndexPointer.for("/output/byoutpoint/");
