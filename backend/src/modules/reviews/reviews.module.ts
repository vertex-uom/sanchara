import { Module } from '@nestjs/common';

// Owns the reviews table. A trigger on it keeps properties.rating_avg and
// review_count current (directory_listing migration), so writes need no extra code.
@Module({})
export class ReviewsModule {}
