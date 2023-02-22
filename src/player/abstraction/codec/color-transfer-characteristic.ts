/**
 * Color Transfer Characteristic.
 * These values match the ones defined by ISO/IEC 23091-2_2019 subclause 8.2.
 */
export const enum ColorTransferCharacteristic {
  RESERVED0 = 0,
  BT709 = 1, ///< also ITU-R BT1361
  UNSPECIFIED = 2,
  RESERVED = 3,
  GAMMA22 = 4, ///< also ITU-R BT470M / ITU-R BT1700 625 PAL & SECAM
  GAMMA28 = 5, ///< also ITU-R BT470BG
  SMPTE170M = 6, ///< also ITU-R BT601-6 525 or 625 / ITU-R BT1358 525 or 625 / ITU-R BT1700 NTSC
  SMPTE240M = 7,
  LINEAR = 8, ///< "Linear transfer characteristics"
  LOG = 9, ///< "Logarithmic transfer characteristic (100:1 range)"
  LOG_SQRT = 10, ///< "Logarithmic transfer characteristic (100 * Sqrt(10) : 1 range)"
  IEC61966_2_4 = 11, ///< IEC 61966-2-4
  BT1361_ECG = 12, ///< ITU-R BT1361 Extended Colour Gamut
  IEC61966_2_1 = 13, ///< IEC 61966-2-1 (sRGB or sYCC)
  BT2020_10 = 14, ///< ITU-R BT2020 for 10-bit system
  BT2020_12 = 15, ///< ITU-R BT2020 for 12-bit system
  SMPTE2084 = 16, ///< SMPTE ST 2084 for 10-, 12-, 14- and 16-bit systems
  SMPTEST2084 = SMPTE2084,
  SMPTE428 = 17, ///< SMPTE ST 428-1
  SMPTEST428_1 = SMPTE428,
  ARIB_STD_B67 = 18, ///< ARIB STD-B67, known as "Hybrid log-gamma"
  NB, ///< Not part of ABI
}
