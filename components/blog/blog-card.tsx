'use client';

import Link from 'next/link';
import { BlogPost } from '@/lib/types';
import { Calendar, Eye, User } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/blog/${post.slug}`}>
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer hover:bg-white/15">
        {/* Featured Image */}
        <div className="relative h-48 overflow-hidden bg-red-900/30">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
          />
          {/* Category Badge */}
          <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-full text-xs font-bold">
            {post.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 border-t border-border pt-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount} views</span>
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center gap-2 pt-4 border-t border-border">
            <img
              src={post.author.avatar || 'https://via.placeholder.com/32'}
              alt={post.author.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-xs font-semibold text-foreground">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">Author</p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs bg-red-600/20 text-red-300 px-3 py-1 rounded-full font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
