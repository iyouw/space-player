import type { BitReader } from "@/sky-player/stream/bit-reader";
import { DemuxerBase } from "../demuxer-base";
import type { IDemuxer } from "../i-demuxer";
import { Packet } from "../packet";
import { PAT_PID } from "./constants";
import type { MemoryStream } from "@/sky-player/stream/memory-stream";
import { TSProgram } from "./ts-program";
import { Counter } from "@/sky-player/counter/counter";
import { Logging } from "@/sky-player/logging/logging";
import { TSStream } from "./ts-stream";
import type { Stream } from "../stream";

export class TSDemuxer extends DemuxerBase implements IDemuxer {
  private _programs: Array<TSProgram>;
  private _programCounter: Counter;

  private _selectedAudioStream?: Stream;
  private _selectedSubtitleStream?: Stream;
  private _selectedVideoStream?: Stream;

  private _audioPacket?: Packet;
  private _subtitlePacket?: Packet;
  private _videoPacket?: Packet;

  public constructor(stream: MemoryStream, option?: unknown) {
    super(stream, option);
    this._programs = new Array<TSProgram>();
    this._programCounter = new Counter();
  }

  public override demux(): void {
    while (this._stream.has(188)) {
      this.parsePacket();
    }
  }

  public override dispose(): void {
    super.dispose();
    this._programs = new Array<TSProgram>();
    this._programCounter = new Counter();

    this._selectedAudioStream = undefined;
    this._selectedSubtitleStream = undefined;
    this._selectedVideoStream = undefined;

    this._audioPacket = undefined;
    this._subtitlePacket = undefined;
    this._videoPacket = undefined;
  }

  private get isProgramParseCompleted(): boolean {
    return this._programCounter.isMax;
  }

  private get isStreamParseCompleted(): boolean {
    return this._programs.every((x) => x.isCompleted);
  }

  private parsePacket(): void {
    const reader = this._stream.readBit(188 << 3);
    // skip sync byte(8 bit), transport error(1 bit);
    reader.skip(9);
    const payloadStart = reader.read(1);
    // skip transport priority(1 bit)
    reader.skip(1);
    const pid = reader.read(13);
    // skip transport scrambling(2 bit)
    reader.skip(2);
    const adaptationField = reader.read(2);
    // skip continuity counter(4 bit)
    reader.skip(4);
    // check  if we have payload
    if (adaptationField & 0x01) {
      if (adaptationField & 0x02) {
        const adaptationFieldLength = reader.read(8) << 3;
        reader.skip(adaptationFieldLength);
      }

      // check if pid is pat
      if (pid === PAT_PID) {
        this.parsePAT(reader, payloadStart);
      }

      const program = this._programs.find((x) => x.id === pid);
      if (program && !program.isCompleted) {
        this.parsePMT(reader, program, payloadStart);
        if (this.isStreamParseCompleted) this.selectStreams();
      }

      if (pid === this._selectedAudioStream?.id) {
        this.parseAudio(reader, payloadStart);
      }

      if (pid === this._selectedSubtitleStream?.id) {
        this.parseSubtitle(reader, payloadStart);
      }

      if (pid === this._selectedVideoStream?.id) {
        this.parseVideo(reader, payloadStart);
      }
    }
    reader.close();
  }

  private parsePAT(reader: BitReader, payloadStart: number): void {
    if (this.isProgramParseCompleted) return;
    // check is payload start
    if (payloadStart) reader.skip(8);
    // read pat table_id(8 bit)
    if (reader.read(8) !== 0x00) return;
    // read section_syntax_indicator(1 bit)
    if (reader.read(1) !== 0x01) return;
    // skip zero(1 bit) && resrve(2 bit)
    reader.skip(3);
    // read section_length(12 bit)
    const sectionLength = reader.read(12);
    // record how many bits had readed
    if (!this._programCounter.hasMax)
      this._programCounter.setMax((sectionLength - 4) << 3);
    reader.attachCounter(this._programCounter);
    // skip transport_stream_id(16 bit), reserve(2 bit), version (5 bit)
    reader.skip(23);
    // read current_next_indicator(1 bit)
    if (reader.read(1) === 0x00) return;
    // skip section_number(8 bit), last_section_number(8 bit)
    reader.skip(8 + 8);
    // resolve programs
    while (!reader.isEnd && !this.isProgramParseCompleted) {
      const programNumber = reader.read(16);
      // skip reserve
      reader.skip(3);
      // if the slice is not program, then continue
      if (!programNumber) {
        // skip network pid
        reader.skip(13);
        continue;
      }
      // read program_pid(13 bit)
      const pid = reader.read(13);
      const program = new TSProgram(pid, programNumber);
      this._programs.push(program);
    }
  }

  private parsePMT(
    reader: BitReader,
    program: TSProgram,
    payloadStart: number
  ): void {
    if (this.isStreamParseCompleted || program.isCompleted) return;
    // check is payload start
    if (payloadStart) reader.skip(8);
    // read pmt table_id(8 bit)
    if (reader.read(8) !== 0x02) return;
    // read section_syntax_indicator(1 bit)
    if (reader.read(1) !== 0x01) return;
    // skip zero(1 bit), reserve(2 bit),
    reader.skip(3);
    // read section_length(12 bit)
    const sectionLength = reader.read(12);
    // record how many bits had readed
    if (!program.counter.hasMax)
      program.counter.setMax((sectionLength - 4) << 3);
    reader.attachCounter(program.counter);
    // read program_number(16 bit)
    if (reader.read(16) <= 0) return;
    // skip reserve(2 bit), version(5 bit)
    reader.skip(7);
    // read current_next_indicator(1 bit)
    if (reader.read(1) === 0x00) return;
    // skip section_number(8bit), last_section_number(8 bit),
    // reserve(3 bit), pcr_pid(13 bit), reserve(4 bit)
    reader.skip(36);
    // read program_info_length(12 bit) and skip
    // skip program_info_length
    reader.skip(reader.read(12) << 3);
    // loop
    while (!reader.isEnd && !program.isCompleted) {
      // read stream_type(8 bit)
      const streamType = reader.read(8);
      // skip reserve(3 bit)
      reader.skip(3);
      // read elementary_pid(13 bit)
      const pid = reader.read(13);
      // skip reserve(4 bit)
      reader.skip(4);
      // read elementary_stream_info_length(12 bit) and skip it
      reader.skip(reader.read(12) << 3);
      const stream = new TSStream(pid, streamType);
      program.addStream(stream);
    }
  }

  private selectStreams(): void {
    let streams = new Array<Stream>();
    this._programs.forEach((x) => (streams = streams.concat(x.streams)));
    const audioStreams = streams.filter((x) => x.isAudio);
    const subtitleStreams = streams.filter((x) => x.isSubtitle);
    const videoStreams = streams.filter((x) => x.isVideo);
    this._selectedAudioStream = audioStreams[0];
    this._selectedSubtitleStream = subtitleStreams[0];
    this._selectedVideoStream = videoStreams[0];
    Logging.Info(TSDemuxer.name, `select streams`);
  }

  private parseAudio(reader: BitReader, payloadStart: number): void {
    if (payloadStart) {
      if (this._audioPacket) {
        this.onAudioPacketCompleted?.(this._audioPacket);
        this._audioPacket = undefined;
      }
      this._audioPacket = new Packet(this._selectedAudioStream!.codecId);
    }
    this.parsePES(reader, payloadStart, this._audioPacket!);
    if (this._audioPacket?.isCompleted) {
      this.onAudioPacketCompleted?.(this._audioPacket);
      this._audioPacket = undefined;
    }
  }

  private parseSubtitle(reader: BitReader, payloadStart: number): void {
    if (payloadStart) {
      if (this._subtitlePacket) {
        this.onSubtitlePacketCompleted?.(this._subtitlePacket);
        this._subtitlePacket = undefined;
      }
      this._subtitlePacket = new Packet(this._selectedSubtitleStream!.codecId);
    }
    this.parsePES(reader, payloadStart, this._subtitlePacket!);
    if (this._subtitlePacket?.isCompleted) {
      this.onSubtitlePacketCompleted?.(this._subtitlePacket);
      this._subtitlePacket = undefined;
    }
  }

  private parseVideo(reader: BitReader, payloadStart: number): void {
    if (payloadStart) {
      if (this._videoPacket) {
        this.onVideoPacketCompleted?.(this._videoPacket);
        this._videoPacket = undefined;
      }
      this._videoPacket = new Packet(this._selectedVideoStream!.codecId);
    }
    this.parsePES(reader, payloadStart, this._videoPacket!);
    if (this._videoPacket?.isCompleted) {
      this.onVideoPacketCompleted?.(this._videoPacket);
      this._videoPacket = undefined;
    }
  }

  private parsePES(
    reader: BitReader,
    payloadStart: number,
    packet: Packet
  ): void {
    if (payloadStart) {
      const startCode = reader.read(24);
      if (startCode !== 0x01) return;
      // stream id(8 bit)
      reader.skip(8);
      const packetLength = reader.read(16);
      // reserved(2bit), pes_scrambling_control(2 bit), pes_priority(1 bit)
      // data_alignment_indicator(1 bit), copyright(1 bit), original_or_copy(1 bit)
      reader.skip(8);
      const ptsDtsFlag = reader.read(2);
      // ESCR_flag(1 bit), RS_rate_flag(1 bit), DSM_trick_mode_flag(1 bit)
      // additional_copy_info_flag(1 bit), PES_CRC_flag(1 bit), PES_extension_flag(1 bit)
      reader.skip(6);
      const headerLength = reader.read(8);

      const payloadStartIndex = reader.index + (headerLength << 3);
      const payloadLength = packetLength ? packetLength - headerLength - 3 : 0;
      packet.counter.setMax(payloadLength << 3);

      if (ptsDtsFlag & 0x02) {
        // The Presentation Timestamp is encoded as 33(!) bit
        // integer, but has a "marker bit" inserted at weird places
        // in between, making the whole thing 5 bytes in size.
        // You can't make this shit up...
        reader.skip(4);
        const p32_30 = reader.read(3);
        reader.skip(1);
        const p29_15 = reader.read(15);
        reader.skip(1);
        const p14_0 = reader.read(15);
        reader.skip(1);
        // Can't use bit shifts here; we need 33 bits of precision,
        // so we're using JavaScript's double number type. Also
        // divide by the 90khz clock to get the pts in seconds.
        const pts = (p32_30 * 1073741824 + p29_15 * 32768 + p14_0) / 90000;
        packet.pts = pts;
      }
      reader.skipTo(payloadStartIndex);
    }
    reader.attachCounter(packet.counter);
    const buffer = reader.readBuffer();
    packet.addBuffer(buffer);
  }
}
