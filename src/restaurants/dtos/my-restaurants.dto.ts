import { Field, ObjectType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@ObjectType()
export class MyRestaurantsOutput extends CoreOutput {
  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];
}
