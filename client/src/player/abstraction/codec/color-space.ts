/**
 * YUV colorspace type.
 * These values match the ones defined by ISO/IEC 23091-2_2019 subclause 8.3.
 */
export const enum ColorSpace {
  RGB = 0, ///< order of coefficients is actually GBR, also IEC 61966-2-1 (sRGB), YZX and ST 428-1
  BT709 = 1, ///< also ITU-R BT1361 / IEC 61966-2-4 xvYCC709 / derived in SMPTE RP 177 Annex B
  UNSPECIFIED = 2,
  RESERVED = 3, ///< reserved for future use by ITU-T and ISO/IEC just like 15-255 are
  FCC = 4, ///< FCC Title 47 Code of Federal Regulations 73.682 (a)(20)
  BT470BG = 5, ///< also ITU-R BT601-6 625 / ITU-R BT1358 625 / ITU-R BT1700 625 PAL & SECAM / IEC 61966-2-4 xvYCC601
  SMPTE170M = 6, ///< also ITU-R BT601-6 525 / ITU-R BT1358 525 / ITU-R BT1700 NTSC / functionally identical to above
  SMPTE240M = 7, ///< derived from 170M primaries and D65 white point, 170M is derived from BT470 System M's primaries
  YCGCO = 8, ///< used by Dirac / VC-2 and H.264 FRext, see ITU-T SG16
  YCOCG = YCGCO,
  BT2020_NCL = 9, ///< ITU-R BT2020 non-constant luminance system
  BT2020_CL = 10, ///< ITU-R BT2020 constant luminance system
  SMPTE2085 = 11, ///< SMPTE 2085, Y'D'zD'x
  CHROMA_DERIVED_NCL = 12, ///< Chromaticity-derived non-constant luminance system
  CHROMA_DERIVED_CL = 13, ///< Chromaticity-derived constant luminance system
  ICTCP = 14, ///< ITU-R BT.2100-0, ICtCp
  NB, ///< Not part of ABI
}
