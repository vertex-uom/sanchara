import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class OverviewQueryDto {
  // Only count companies with a property in this province. Omit for all.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Choose a province.' })
  @Min(1, { message: 'Choose a province.' })
  @Max(32767, { message: 'Choose a province.' })
  provinceId?: number;
}
