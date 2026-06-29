import { IsString, IsNotEmpty } from 'class-validator';

export class PurchasePreviewDto {
  @IsString()
  @IsNotEmpty()
  packId: string;
}
