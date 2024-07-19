// users.repository.ts
import { Injectable } from '@nestjs/common';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import slugify from 'slugify';

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
    const categoryName = name.trim();
    const categorySlug = slugify(categoryName, { locale: 'vi', lower: true });
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
