// users.repository.ts
import { Injectable } from '@nestjs/common';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CategoryRepository extends Repository<Category> {
  constructor(
    @InjectRepository(Category)
    readonly categories: Repository<Category>,
  ) {
    super(categories.target, categories.manager, categories.queryRunner);
  }

  async getOrCreate(name: string): Promise<Category> {
    // Category
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, '-');
    // Find existed category
    let category = await this.categories.findOne({
      where: { slug: categorySlug },
    });
    // Create new category if the input category does not exist
    if (!category) {
      category = await this.categories.save(
        this.categories.create({ slug: categorySlug, name: categoryName }),
      );
    }
    return category;
  }
}
