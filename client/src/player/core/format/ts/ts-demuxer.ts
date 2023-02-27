import type { IDemuxer, IProbeResult, IStream } from "@/player/abstraction";
import type { IPacket } from "@/player/abstraction/codec/i-packet";
import type { IProgram } from "@/player/abstraction/format/i-program";
import type { BitBuffer } from "../../buffer/bit-buffer";
import type { Scope } from "../../buffer/scope";
import { OrderMap } from "../../map/order-map";
import { Program } from "../program";
import { Stream } from "../stream";
import { PAT_PID, STREAM_TYPE_VIDEO_DIRAC } from "./ts-constant";

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

  private _selectedProgram?: IProgram;
  private _selectedVideoStream?: IStream;
  private _selectedAudioStream?: IStream;
  private _selectedSubtitleStream?: IStream;

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
        this.selectProgram();
      }
      // check if pid is current program
      if (pid === this.currentProgram?.id) {
        this.parsePMT(scope, payloadStart);
        scope.close();
        this.selectStream();
      }
      // check if pid is current stream
      if (this._selectedProgram?.has(pid)) {
        this.parsePES(scope, payloadStart, this._selectedProgram.getStream(pid)!);
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
    if (this._selectedProgram?.hasStream) return;
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

  private parsePES(scope: Scope, payloadStart: number, stream: IStream): void {
    // read packet_start_code_prefix(24 bit)
    if (scope.read(24) !== 0x000001) return;
    if (payloadStart) {
      if (stream.packet && stream.packet.data.length > 0) {
        // complete packet
      }
      stream.packet = {
        data: [],
        pts: 0,
        dts: 0,
        duration: 0,
      }
    }
    // read stream_id(8 bit)
    const streamId = scope.read(8);
    const packetLength = scope.read(16);
    // resvered(2 bit) skip pes_scrambling_control(2 bit), pes_priority(1 bit),
    // data_alignment_indicator(1 bit), copyright(1 bit), original_or_copy(1 bit)
    scope.skip(8);
    const ptsDtsFlag = scope.read(2);
    // skip es_cr_flag(1 bit), es_rate_flag(1 bit), dsm_trick_mode_flag(1 bit)
    // additional_copy_into_flag(1 bit), pes_crc_flag(1 bit), pes_extension_flag(1 bit)
    scope.skip(6);
    const headerLength = scope.read(8);
    const payloadBeginIndex = scope.index + headerLength << 3;
    let pts = 0;
    if (ptsDtsFlag & 0x2) {
      // The Presentation Timestamp is encoded as 33(!) bit
      // integer, but has a "marker bit" inserted at weird places
      // in between, making the whole thing 5 bytes in size.
      // You can't make this shit up...
      scope.skip(4);
      const p32_30 = scope.read(3);
      scope.skip(1);
      const p29_15 = scope.read(15);
      scope.skip(1);
      const p14_0 = scope.read(15);
      scope.skip(1);

      // Can't use bit shifts here; we need 33 bits of precision,
      // so we're using JavaScript's double number type. Also
      // divide by the 90khz clock to get the pts in seconds.
      pts = (p32_30 * 1073741824 + p29_15 * 32768 + p14_0) / 90000;
    }
    stream.packet!.pts = pts;
    stream.packet!.data.push();
  }

  private selectProgram(): void {
    if (this._selectedProgram) return;
    this._selectedProgram = this._programs.firstOrDefault();
  }

  private selectStream(): void {
    if (!this._selectedVideoStream) {
      this._selectedVideoStream = this._selectedProgram?.streams.filter((x) => x.type <= STREAM_TYPE_VIDEO_DIRAC)[0];
    }
  }
}
