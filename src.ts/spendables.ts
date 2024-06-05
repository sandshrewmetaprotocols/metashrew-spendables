// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "spendables.proto" (package "spendables", syntax proto3)
// tslint:disable
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf message spendables.Output
 */
export interface Output {
    /**
     * @generated from protobuf field: uint64 value = 1;
     */
    value: bigint;
    /**
     * @generated from protobuf field: bytes script = 2;
     */
    script: Uint8Array;
}
/**
 * @generated from protobuf message spendables.GetUnspentResponse
 */
export interface GetUnspentResponse {
    /**
     * @generated from protobuf field: repeated spendables.Output outputs = 1;
     */
    outputs: Output[];
}
// @generated message type with reflection information, may provide speed optimized methods
class Output$Type extends MessageType<Output> {
    constructor() {
        super("spendables.Output", [
            { no: 1, name: "value", kind: "scalar", T: 4 /*ScalarType.UINT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 2, name: "script", kind: "scalar", T: 12 /*ScalarType.BYTES*/ }
        ]);
    }
    create(value?: PartialMessage<Output>): Output {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.value = 0n;
        message.script = new Uint8Array(0);
        if (value !== undefined)
            reflectionMergePartial<Output>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Output): Output {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* uint64 value */ 1:
                    message.value = reader.uint64().toBigInt();
                    break;
                case /* bytes script */ 2:
                    message.script = reader.bytes();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: Output, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* uint64 value = 1; */
        if (message.value !== 0n)
            writer.tag(1, WireType.Varint).uint64(message.value);
        /* bytes script = 2; */
        if (message.script.length)
            writer.tag(2, WireType.LengthDelimited).bytes(message.script);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message spendables.Output
 */
export const Output = new Output$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetUnspentResponse$Type extends MessageType<GetUnspentResponse> {
    constructor() {
        super("spendables.GetUnspentResponse", [
            { no: 1, name: "outputs", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => Output }
        ]);
    }
    create(value?: PartialMessage<GetUnspentResponse>): GetUnspentResponse {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.outputs = [];
        if (value !== undefined)
            reflectionMergePartial<GetUnspentResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: GetUnspentResponse): GetUnspentResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated spendables.Output outputs */ 1:
                    message.outputs.push(Output.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: GetUnspentResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* repeated spendables.Output outputs = 1; */
        for (let i = 0; i < message.outputs.length; i++)
            Output.internalBinaryWrite(message.outputs[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message spendables.GetUnspentResponse
 */
export const GetUnspentResponse = new GetUnspentResponse$Type();