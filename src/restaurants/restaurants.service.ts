import { Injectable } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { AllCategoriesOutput } from './dtos/all-categories-dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { MyRestaurantsOutput } from './dtos/my-restaurants.dto';
import {
  MyRestaurantInput,
  MyRestaurantOutput,
} from './dtos/my-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    // Inject repository của Restaurant entity, lưu với tên là restaurants
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    @InjectRepository(CategoryRepository)
    private readonly categories: CategoryRepository,

    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);

      // Owner
      newRestaurant.owner = owner;

      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );

      newRestaurant.category = category;

      await this.restaurants.save(newRestaurant);

      return {
        ok: true,
        restaurantId: newRestaurant.id,
      };
    } catch (error) {
      return { ok: false, error: 'Could not create restaurant' };
    }
  }

  async editRestaurant(
    user: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: editRestaurantInput.restaurantId },
      });

      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }

      if (user.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't edit restaurant that you don't own",
        };
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save({
        id: editRestaurantInput.restaurantId,
        ...editRestaurantInput,
        ...(category && { category }),
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit restaurant' };
    }
  }

  async deleteRestaurant(
    user: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: deleteRestaurantInput.restaurantId },
      });

      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }

      if (user.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't delete restaurant that you don't own",
        };
      }

      await this.restaurants.delete(deleteRestaurantInput.restaurantId);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete restaurant' };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return { ok: true, categories };
    } catch (error) {
      return { ok: false, error: 'Could not load categories' };
    }
  }

  async countRestaurants(inputCategory: Category) {
    return await this.restaurants.count({
      where: { category: { slug: inputCategory.slug } },
    });
  }

  async findCategoryBySlug(
    categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug: categoryInput.slug },
        relations: { restaurants: true },
      });

      if (!category) {
        return { ok: false, error: 'Category not found' };
      }

      // Pagination for Restaurants of Cateogry
      const restaurants = await this.restaurants.find({
        where: { category: { slug: category.slug } },
        take: 10,
        skip: (categoryInput.page - 1) * 10,
      });

      // Total Pages of Restaurants
      const totalResults = await this.countRestaurants(category);
      const totalPages = Math.ceil(totalResults / 10);

      return { ok: true, category, restaurants, totalResults, totalPages };
    } catch (error) {
      return { ok: false, error: 'Could not load category' };
    }
  }

  async allRestaurants(
    restaurantInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (restaurantInput.page - 1) * 5,
        take: 5,
        order: {
          isPromoted: 'DESC',
        },
        relations: { category: true },
      });

      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 5),
        totalResults,
      };
    } catch (error) {
      return { ok: false, error: 'Could not load restaurants' };
    }
  }

  async findRestaurantById(
    restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantInput.restaurantId },
        relations: { menu: true, category: true },
      });

      if (!restaurant) {
        return { ok: false, error: 'Found no restaurant' };
      }

      return { ok: true, restaurant };
    } catch (error) {
      return { ok: false, error: 'Could not load restaurant' };
    }
  }

  async searchRestaurantByName(
    searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: { name: ILike(`%${searchRestaurantInput.query}%`) },
        take: 10,
        skip: (searchRestaurantInput.page - 1) * 10,
      });

      return {
        ok: true,
        restaurants,
        totalPages: (searchRestaurantInput.page - 1) * 10,
        totalResults,
      };
    } catch (error) {
      return { ok: false, error: 'Could not search for restaurant' };
    }
  }

  async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
    try {
      const rawRestaurants = await this.restaurants.find({
        relations: { category: true },
      });

      const restaurants = rawRestaurants.filter(
        (restaurant) => restaurant.ownerId === Number(owner.id),
      );

      return {
        ok: true,
        restaurants,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not find restaurants.',
      };
    }
  }

  async myRestaurant(
    owner: User,
    { id }: MyRestaurantInput,
  ): Promise<MyRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id },
        relations: { menu: true, orders: true, category: true },
      });

      if (restaurant.ownerId !== Number(owner.id)) {
        return {
          ok: false,
          error: 'Not your restaurant.',
        };
      }

      return { ok: true, restaurant };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not find restaurant.',
      };
    }
  }

  async createDish(
    user: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createDishInput.restaurantId },
      });

      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }

      if (user.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't add dish to restaurant that you don't own",
        };
      }

      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not create dish' };
    }
  }

  async editDish(
    user: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: editDishInput.dishId },
        relations: { restaurant: true },
      });

      if (!dish) {
        return { ok: false, error: 'Dish not found' };
      }

      if (user.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't edit dish of the restaurant that you don't own",
        };
      }

      await this.dishes.save({ id: editDishInput.dishId, ...editDishInput });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not edit dish' };
    }
  }

  async deleteDish(
    user: User,
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: deleteDishInput.dishId },
        relations: { restaurant: true },
      });

      if (!dish) {
        return { ok: false, error: 'Dish not found' };
      }

      if (user.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't delete dish of the restaurant that you don't own",
        };
      }

      await this.dishes.delete(deleteDishInput.dishId);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'Could not delete dish' };
    }
  }
}
