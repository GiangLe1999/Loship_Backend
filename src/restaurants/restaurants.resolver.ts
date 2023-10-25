import { RestaurantService } from './restaurants.service';
import {
  Resolver,
  Args,
  Mutation,
  Query,
  ResolveField,
  Int,
  Parent,
} from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Role } from 'src/auth/role.decorator';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { Category } from './entities/category.entity';
import { AllCategoriesOutput } from './dtos/all-categories-dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Dish } from './entities/dish.entity';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

// Restaurant Resolver
@Resolver(() => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => CreateRestaurantOutput)
  @Role(['Owner'])
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  @Mutation(() => EditRestaurantOutput)
  @Role(['Owner'])
  async editRestaurant(
    @AuthUser() authUser: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(authUser, editRestaurantInput);
  }

  @Mutation(() => DeleteRestaurantOutput)
  @Role(['Owner'])
  async deleteRestaurant(
    @AuthUser() authUser: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(
      authUser,
      deleteRestaurantInput,
    );
  }

  @Query(() => RestaurantsOutput)
  async restaurants(
    @Args('input') restaurantInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return await this.restaurantService.allRestaurants(restaurantInput);
  }

  @Query(() => RestaurantOutput)
  async restaurant(@Args('input') restaurantInput: RestaurantInput) {
    return await this.restaurantService.findRestaurantById(restaurantInput);
  }

  @Query(() => SearchRestaurantOutput)
  async searchRestaurant(
    @Args('input') searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurantByName(searchRestaurantInput);
  }
}

// Category Resolver
@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ResolveField(() => Int)
  async restaurantCount(@Parent() category: Category): Promise<number> {
    return await this.restaurantService.countRestaurants(category);
  }

  @Query(() => AllCategoriesOutput)
  async allCategories(): Promise<AllCategoriesOutput> {
    return await this.restaurantService.allCategories();
  }

  @Query(() => CategoryOutput)
  async category(
    @Args('input') categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }
}

// Dish Resolver
@Resolver(() => Dish)
export class DishResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => CreateDishOutput)
  @Role(['Owner'])
  async createDish(
    @AuthUser() authUser: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return await this.restaurantService.createDish(authUser, createDishInput);
  }

  @Mutation(() => EditDishOutput)
  @Role(['Owner'])
  async editDish(
    @AuthUser() authUser: User,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return await this.restaurantService.editDish(authUser, editDishInput);
  }

  @Mutation(() => DeleteDishOutput)
  @Role(['Owner'])
  async deleteDish(
    @AuthUser() authUser: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return await this.restaurantService.deleteDish(authUser, deleteDishInput);
  }
}
