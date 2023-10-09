import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';

@Resolver(() => Restaurant)
export class RestaurantResolver {
  @Query(() => [Restaurant])
  // Type boolean work với cả TypeScript và GraphQL
  // Nếu có type string thì value của argument veganOnly được extract về sẽ được convert sang string
  restaurants(@Args('veganOnly') veganOnly: boolean): Restaurant[] {
    console.log(veganOnly);
    return [];
  }

  @Mutation(() => Boolean)
  createRestaurant(@Args() createRestaurantInput: CreateRestaurantDto) {
    console.log(createRestaurantInput);
    return true;
  }
}
