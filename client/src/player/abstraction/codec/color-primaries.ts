/**
 * Chromaticity coordinates of the source primaries.
 * These values match the ones defined by ISO/IEC 23091-2_2019 subclause 8.1 and ITU-T H.273.
 */
export const enum ColorPrimaries {
  RESERVED0 = 0,
  BT709 = 1, ///< also ITU-R BT1361 / IEC 61966-2-4 / SMPTE RP 177 Annex B
  UNSPECIFIED = 2,
  RESERVED = 3,
  BT470M = 4, ///< also FCC Title 47 Code of Federal Regulations 73.682 (a)(20)

  BT470BG = 5, ///< also ITU-R BT601-6 625 / ITU-R BT1358 625 / ITU-R BT1700 625 PAL & SECAM
  SMPTE170M = 6, ///< also ITU-R BT601-6 525 / ITU-R BT1358 525 / ITU-R BT1700 NTSC
  SMPTE240M = 7, ///< identical to above, also called "SMPTE C" even though it uses D65
  FILM = 8, ///< colour filters using Illuminant C
  BT2020 = 9, ///< ITU-R BT2020
  SMPTE428 = 10, ///< SMPTE ST 428-1 (CIE 1931 XYZ)
  SMPTEST428_1 = SMPTE428,
  SMPTE431 = 11, ///< SMPTE ST 431-2 (2011) / DCI P3
  SMPTE432 = 12, ///< SMPTE ST 432-1 (2010) / P3 D65 / Display P3
  EBU3213 = 22, ///< EBU Tech. 3213-E (nothing there) / one of JEDEC P22 group phosphors
  JEDEC_P22 = EBU3213,
  NB, ///< Not part of ABI
}
