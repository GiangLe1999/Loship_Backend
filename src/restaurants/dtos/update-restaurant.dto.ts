import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './create-restaurant.dto';

@InputType()
export class UpdateRestaurantDtoInputType extends PartialType(
  CreateRestaurantDto,
) {}

@InputType()
export class UpdateRestaurantDto {
  @Field(() => Number)
  id: number;

  @Field(() => UpdateRestaurantDtoInputType)
  data: UpdateRestaurantDtoInputType;
}
