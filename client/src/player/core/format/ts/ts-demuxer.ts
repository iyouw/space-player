import type { IDemuxer, IProbeResult } from "@/player/abstraction";
import type { IPacket } from "@/player/abstraction/codec/i-packet";
import type { IProgram } from "@/player/abstraction/format/i-program";
import type { BitBuffer } from "../../buffer/bit-buffer";
import type { Scope } from "../../buffer/scope";
import { OrderMap } from "../../map/order-map";
import { Program } from "../program";
import { Stream } from "../stream";
import { PAT_PID } from "./ts-constant";

export class TSDemuxer implements IDemuxer {
  public static readonly Default = new TSDemuxer();

  public probe(buffer: BitBuffer): IProbeResult {
    if (buffer.accessibleByteLength <= 188 * 3) return { needMoreData: true };
    const pos = buffer.position;
    const data = buffer.data;
    for (let i = 0; i < 188; i++) {
      if (
        data[pos + i] === 0x47 &&
        data[pos + i + 188] === 0x47 &&
        data[pos + i + 188 * 2] === 0x47
      ) {
        buffer.index = (pos + i) << 3;
        return { match: true };
      }
    }
    return { match: false };
  }

  private _programs: OrderMap<IProgram, number>;

  private _videoPacket?: IPacket;
  private _audioPacket?: IPacket;
  private _subtitlePacket?: IPacket;

  public constructor() {
    this._programs = new OrderMap<IProgram, number>();
  }

  public get currentProgram(): IProgram | undefined {
    return this._programs.firstOrDefault();
  }

  public demux(buffer: BitBuffer): void {
    while (buffer.accessibleByteLength >= 188) {
      this.parsePacket(buffer);
    }
  }

  private parsePacket(buffer: BitBuffer): void {
    const scope = buffer.beginScope(188 << 3);
    // skip sync byte(8 bit), transport error(1 bit);
    scope.skip(8 + 1);
    const payloadStart = scope.read(1);
    // skip transport priority(1 bit)
    scope.skip(1);
    const pid = scope.read(13);
    // skip transport scrambling(2 bit)
    scope.skip(2);
    const adaptationField = scope.read(2);
    // skip continuity counter(4 bit)
    scope.skip(4);
    // check  if we have payload
    if (adaptationField & 0x01) {
      if (adaptationField & 0x02) {
        const adaptationFieldLength = scope.read(8);
        scope.skip(adaptationFieldLength << 3);
      }
      // check if pid is pat
      if (pid === PAT_PID) {
        this.parsePAT(scope, payloadStart);
        scope.close();
        return;
      }
      // check if pid is current program
      if (pid === this.currentProgram?.id) {
        this.parsePMT(scope, payloadStart);
        scope.close();
        return;
      }
      // check if pid is current stream
      if (this.currentProgram?.has(pid)) {
        this.parsePES(scope, payloadStart);
      }
    }
    scope.close();
  }

  private parsePAT(scope: Scope, payloadStart: number): void {
    if (this._programs.length) return;
    if (payloadStart) scope.skip(8);
    // read pat table_id(8 bit)
    if (scope.read(8) !== 0x00) return;
    // read section_syntax_indicator(1 bit)
    if (scope.read(1) !== 0x01) return;
    // skip zero && resrve
    scope.skip(1 + 2);
    // read section_length(12 bit), minus crc(32 bit) and begin scope
    const childScope = scope.beginScope((scope.read(12) - 4) << 3);
    // skip transport_stream_id(16 bit), reserve(2 bit), version (5 bit)
    childScope.skip(16 + 2 + 5);
    // read current_next_indicator(1 bit)
    if (childScope.read(1) === 0x00) return;
    // skip section_number(8 bit), last_section_number(8 bit)
    childScope.skip(8 + 8);
    // resolve programs
    while (!childScope.isOutScope()) {
      const programNumber = childScope.read(16);
      // if the slice is not program, then continue
      if (programNumber !== 1) continue;
      // skip reserve
      childScope.skip(3);
      // read program_pid(13 bit)
      const pid = childScope.read(13);
      const program = new Program(pid);
      this._programs.set(pid, program);
    }
    childScope.close();
  }

  private parsePMT(scope: Scope, payloadStart: number): void {
    if (this.currentProgram?.hasStream) return;
    if (payloadStart) scope.skip(8);
    // read pmt table_id(8 bit)
    if (scope.read(8) !== 0x02) return;
    // read section_syntax_indicator(1 bit)
    if (scope.read(1) !== 0x01) return;
    // skip zero(1 bit), reserve(2 bit),
    scope.skip(1 + 2);
    // read section_length(12 bit), minus crc(32 bit) and begin scope
    const childScope = scope.beginScope((scope.read(12) - 4) << 3);
    // read program_number(16 bit)
    if (childScope.read(16) <= 0) return;
    // skip reserve(2 bit), version(5 bit)
    childScope.skip(2 + 5);
    // read current_next_indicator(1 bit)
    if (childScope.read(1) === 0x00) return;
    // skip section_number(8bit), last_section_number(8 bit),
    // reserve(3 bit), pcr_pid(13 bit), reserve(4 bit)
    childScope.skip(8 + 8 + 3 + 13 + 4);
    // read program_info_length(12 bit) and skip
    childScope.skip(childScope.read(12) << 3);
    // loop
    while (!childScope.isOutScope()) {
      // read stream_type(8 bit)
      const streamType = childScope.read(8);
      // skip reserve(3 bit)
      childScope.skip(3);
      // read elementary_pid(13 bit)
      const sid = childScope.read(13);
      // skip reserve(4 bit)
      childScope.skip(4);
      // read elementary_stream_info_length(12 bit) and skip it
      childScope.skip(childScope.read(12) << 3);
      const stream = new Stream(sid, streamType);
      this.currentProgram?.addStream(stream, sid);
    }
    childScope.close();
  }

  private parsePES(scope: Scope, payloadStart: number): void {}
}
