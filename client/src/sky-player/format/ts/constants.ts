export const TS_FEC_PACKET_SIZE = 204;
export const TS_DVHS_PACKET_SIZE = 192;
export const TS_PACKET_SIZE = 188;
export const TS_MAX_PACKET_SIZE = 204;

export const NB_PID_MAX = 8192;
export const USUAL_SECTION_SIZE = 1024; /* except EIT which is limited to 4096 */
export const MAX_SECTION_SIZE = 4096;

/* pids */
export const PAT_PID = 0x0000; /* Program Association Table */
export const CAT_PID = 0x0001; /* Conditional Access Table */
export const TSDT_PID = 0x0002; /* Transport Stream Description Table */
export const IPMP_PID = 0x0003;
/* PID from 0x0004 to 0x000F are reserved */
export const NIT_PID = 0x0010; /* Network Information Table */
export const SDT_PID = 0x0011; /* Service Description Table */
export const BAT_PID = 0x0011; /* Bouquet Association Table */
export const EIT_PID = 0x0012; /* Event Information Table */
export const RST_PID = 0x0013; /* Running Status Table */
export const TDT_PID = 0x0014; /* Time and Date Table */
export const TOT_PID = 0x0014;
export const NET_SYNC_PID = 0x0015;
export const RNT_PID = 0x0016; /* RAR Notification Table */
/* PID from 0x0017 to 0x001B are reserved for future use */
/* PID value 0x001C allocated to link-local inband signalling shall not be
 * used on any broadcast signals. It shall only be used between devices in a
 * controlled environment. */
export const LINK_LOCAL_PID = 0x001c;
export const MEASUREMENT_PID = 0x001d;
export const DIT_PID = 0x001e; /* Discontinuity Information Table */
export const SIT_PID = 0x001f; /* Selection Information Table */
/* PID from 0x0020 to 0x1FFA may be assigned as needed to PMT, elementary
 * streams and other data tables */
export const FIRST_OTHER_PID = 0x0020;
export const LAST_OTHER_PID = 0x1ffa;
/* PID 0x1FFB is used by DigiCipher 2/ATSC MGT metadata */
/* PID from 0x1FFC to 0x1FFE may be assigned as needed to PMT, elementary
 * streams and other data tables */
export const NULL_PID = 0x1fff; /* Null packet (used for fixed bandwidth padding) */

/* m2ts pids */
export const M2TS_PMT_PID = 0x0100;
export const M2TS_PCR_PID = 0x1001;
export const M2TS_VIDEO_PID = 0x1011;
export const M2TS_AUDIO_START_PID = 0x1100;
export const M2TS_PGSSUB_START_PID = 0x1200;
export const M2TS_TEXTSUB_PID = 0x1800;
export const M2TS_SECONDARY_AUDIO_START_PID = 0x1a00;
export const M2TS_SECONDARY_VIDEO_START_PID = 0x1b00;

/* table ids */
export const PAT_TID = 0x00; /* Program Association section */
export const CAT_TID = 0x01; /* Conditional Access section */
export const PMT_TID = 0x02; /* Program Map section */
export const TSDT_TID = 0x03; /* Transport Stream Description section */
/* TID from 0x04 to 0x3F are reserved */
export const M4OD_TID = 0x05;
export const NIT_TID = 0x40; /* Network Information section - actual network */
export const ONIT_TID = 0x41; /* Network Information section - other network */
export const SDT_TID = 0x42; /* Service Description section - actual TS */
/* TID from 0x43 to 0x45 are reserved for future use */
export const OSDT_TID = 0x46; /* Service Descrition section - other TS */
/* TID from 0x47 to 0x49 are reserved for future use */
export const BAT_TID = 0x4a; /* Bouquet Association section */
export const UNT_TID = 0x4b; /* Update Notification Table section */
export const DFI_TID = 0x4c; /* Downloadable Font Info section */
/* TID 0x4D is reserved for future use */
export const EIT_TID = 0x4e; /* Event Information section - actual TS */
export const OEIT_TID = 0x4f; /* Event Information section - other TS */
export const EITS_START_TID = 0x50; /* Event Information section schedule - actual TS */
export const EITS_END_TID = 0x5f; /* Event Information section schedule - actual TS */
export const OEITS_START_TID = 0x60; /* Event Information section schedule - other TS */
export const OEITS_END_TID = 0x6f; /* Event Information section schedule - other TS */
export const TDT_TID = 0x70; /* Time Date section */
export const RST_TID = 0x71; /* Running Status section */
export const ST_TID = 0x72; /* Stuffing section */
export const TOT_TID = 0x73; /* Time Offset section */
export const AIT_TID = 0x74; /* Application Inforamtion section */
export const CT_TID = 0x75; /* Container section */
export const RCT_TID = 0x76; /* Related Content section */
export const CIT_TID = 0x77; /* Content Identifier section */
export const MPE_FEC_TID = 0x78; /* MPE-FEC section */
export const RPNT_TID = 0x79; /* Resolution Provider Notification section */
export const MPE_IFEC_TID = 0x7a; /* MPE-IFEC section */
export const PROTMT_TID = 0x7b; /* Protection Message section */
/* TID from 0x7C to 0x7D are reserved for future use */
export const DIT_TID = 0x7e; /* Discontinuity Information section */
export const SIT_TID = 0x7f; /* Selection Information section */
/* TID from 0x80 to 0xFE are user defined */
/* TID 0xFF is reserved */

export const STREAM_TYPE_VIDEO_MPEG1 = 0x01;
export const STREAM_TYPE_VIDEO_MPEG2 = 0x02;
export const STREAM_TYPE_AUDIO_MPEG1 = 0x03;
export const STREAM_TYPE_AUDIO_MPEG2 = 0x04;
export const STREAM_TYPE_PRIVATE_SECTION = 0x05;
export const STREAM_TYPE_PRIVATE_DATA = 0x06;
export const STREAM_TYPE_AUDIO_AAC = 0x0f;
export const STREAM_TYPE_AUDIO_AAC_LATM = 0x11;
export const STREAM_TYPE_VIDEO_MPEG4 = 0x10;
export const STREAM_TYPE_METADATA = 0x15;
export const STREAM_TYPE_VIDEO_H264 = 0x1b;
export const STREAM_TYPE_VIDEO_HEVC = 0x24;
export const STREAM_TYPE_VIDEO_CAVS = 0x42;
export const STREAM_TYPE_VIDEO_AVS2 = 0xd2;
export const STREAM_TYPE_VIDEO_AVS3 = 0xd4;
export const STREAM_TYPE_VIDEO_VC1 = 0xea;
export const STREAM_TYPE_VIDEO_DIRAC = 0xd1;

export const STREAM_TYPE_AUDIO_AC3 = 0x81;
export const STREAM_TYPE_AUDIO_DTS = 0x82;
export const STREAM_TYPE_AUDIO_TRUEHD = 0x83;
export const STREAM_TYPE_AUDIO_EAC3 = 0x87;

/* ISO/IEC 13818-1 Table 2-22 */
export const STREAM_ID_PROGRAM_STREAM_MAP = 0xbc;
export const STREAM_ID_PRIVATE_STREAM_1 = 0xbd;
export const STREAM_ID_PADDING_STREAM = 0xbe;
export const STREAM_ID_PRIVATE_STREAM_2 = 0xbf;
export const STREAM_ID_AUDIO_STREAM_0 = 0xc0;
export const STREAM_ID_VIDEO_STREAM_0 = 0xe0;
export const STREAM_ID_ECM_STREAM = 0xf0;
export const STREAM_ID_EMM_STREAM = 0xf1;
export const STREAM_ID_DSMCC_STREAM = 0xf2;
export const STREAM_ID_TYPE_E_STREAM = 0xf8;
export const STREAM_ID_METADATA_STREAM = 0xfc;
export const STREAM_ID_EXTENDED_STREAM_ID = 0xfd;
export const STREAM_ID_PROGRAM_STREAM_DIRECTORY = 0xff;

/* ISO/IEC 13818-1 Table 2-45 */
export const VIDEO_STREAM_DESCRIPTOR = 0x02;
export const REGISTRATION_DESCRIPTOR = 0x05;
export const ISO_639_LANGUAGE_DESCRIPTOR = 0x0a;
export const IOD_DESCRIPTOR = 0x1d;
export const SL_DESCRIPTOR = 0x1e;
export const FMC_DESCRIPTOR = 0x1f;
export const METADATA_DESCRIPTOR = 0x26;
export const METADATA_STD_DESCRIPTOR = 0x27;

export const VIDEO_TYPES = [
  STREAM_TYPE_VIDEO_MPEG1,
  STREAM_TYPE_VIDEO_MPEG2,
  STREAM_TYPE_VIDEO_H264,
  STREAM_TYPE_VIDEO_HEVC,
  STREAM_TYPE_VIDEO_CAVS,
  STREAM_TYPE_VIDEO_AVS2,
  STREAM_TYPE_VIDEO_AVS3,
  STREAM_TYPE_VIDEO_VC1,
  STREAM_TYPE_VIDEO_DIRAC,
];

export const AUDIO_TYPES = [
  STREAM_TYPE_AUDIO_MPEG1,
  STREAM_TYPE_AUDIO_MPEG2,
  STREAM_TYPE_AUDIO_AAC,
  STREAM_TYPE_AUDIO_AAC_LATM,
  STREAM_TYPE_AUDIO_AC3,
  STREAM_TYPE_AUDIO_DTS,
  STREAM_TYPE_AUDIO_TRUEHD,
  STREAM_TYPE_AUDIO_EAC3,
];
