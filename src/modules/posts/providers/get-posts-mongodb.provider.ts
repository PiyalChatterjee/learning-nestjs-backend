import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post as PostMongo } from '../post.schema';
import { Post as PostEntity } from '../post.entity';
import { Tag } from '../../tags/tag.entity';
import { User } from '../../users/user.entity';
import { MetaOption } from '../../meta-options/meta-option.entity';

/**
 * MongoDB-specific provider for querying posts with full population of related data.
 * Fetches posts from MongoDB and populates author, tags, and metaValue details from SQL database.
 */
@Injectable()
export class GetPostsMongodbProvider {
  constructor(
    @InjectModel(PostMongo.name)
    private readonly postModel: Model<PostMongo>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MetaOption)
    private readonly metaOptionRepository: Repository<MetaOption>,
  ) {}

  /**
   * Retrieves all posts from MongoDB with populated details from SQL database.
   * @returns Array of posts with full author, tags, and metaValue details
   */
  public async getAllPostsWithPopulation() {
    // fetch all posts from MongoDB
    const posts = await this.postModel.find().lean();

    // populate each post with data from SQL database
    const populatedPosts = await Promise.all(
      posts.map((post) => this.populatePostDetails(post)),
    );

    return populatedPosts;
  }

  /**
   * Retrieves a single post by ID from MongoDB with populated details.
   * @param postId - MongoDB post ID
   * @returns Post with full author, tags, and metaValue details
   */
  public async getPostByIdWithPopulation(postId: string) {
    const post = await this.postModel.findById(postId).lean();

    if (!post) {
      return null;
    }

    return this.populatePostDetails(post);
  }

  /**
   * Populates author, tags, and metaValue details for a single post from SQL database.
   * @param post - MongoDB post document
   * @returns Post with populated related data
   */
  private async populatePostDetails(post: any) {
    // fetch author details
    const author = await this.userRepository.findOne({
      where: { id: post.author },
    });

    // fetch tag details
    let tags = [];
    if (post.tags && post.tags.length > 0) {
      tags = await this.tagRepository.find({
        where: { id: In(post.tags) },
      });
    }

    // fetch metaValue details
    let metaValue = null;
    if (post.metaValue) {
      metaValue = await this.metaOptionRepository.findOne({
        where: { id: post.metaValue },
      });
    }

    // return post with populated details
    return {
      id: post.sqlId,
      title: post.title,
      slug: post.slug,
      content: post.content ?? null,
      postType: post.postType,
      status: post.status,
      postSchema: post.postSchema ?? null,
      featuredImageUrl: post.featuredImageUrl ?? null,
      publishOn: post.publishOn ?? null,
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        tagSchema: tag.schema,
        featureImageUrl: tag.featureImageUrl,
        createDate: tag.createdAt,
        updateDate: tag.updatedAt,
        deleteDate: null,
      })),
      metaValue: metaValue
        ? JSON.parse(metaValue.metaValue as string)
        : null,
      author: author
        ? {
            name: `${author.firstName}${author.lastName ? ' ' + author.lastName : ''}`,
            email: author.email,
          }
        : null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }
}
