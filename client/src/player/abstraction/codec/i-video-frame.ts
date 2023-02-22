import type { ChromaLocation } from "./chroma-location";
import type { ColorPrimaries } from "./color-primaries";
import type { ColorRange } from "./color-range";
import type { ColorSpace } from "./color-space";
import type { ColorTransferCharacteristic } from "./color-transfer-characteristic";
import type { IFrame } from "./i-frame";
import type { PictureType } from "./picture-type";
import type { PixelFormat } from "./pixel-format";

export interface IVideoFrame extends IFrame {
  width: number;
  height: number;
  pixelFormat: PixelFormat;
  pixtureType: PictureType;
  sampleAspectRatio: number;
  codecPictureNumber: number;
  displayPictureNumber: number;
  colorRange: ColorRange;
  colorPrimaries: ColorPrimaries;
  colorTransferCharacteristic: ColorTransferCharacteristic;
  colorSpace: ColorSpace;
  chromaLoacation: ChromaLocation;
}
