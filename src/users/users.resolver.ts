import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => Boolean)
  hi() {
    return true;
  }

  @Mutation(() => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      const { ok, error } =
        await this.usersService.createAccount(createAccountInput);

      return { ok, error };
    } catch (error) {
      return { error, ok: false };
    }
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      const { ok, error, token } = await this.usersService.login(loginInput);
      return { ok, error, token };
    } catch (error) {
      return { error, ok: false };
    }
  }

  @Query(() => User)
  me(@Context() context) {
    if (!context.user) {
      return;
    } else {
      return context.user;
    }
  }
}
