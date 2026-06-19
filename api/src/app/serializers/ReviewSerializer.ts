import { DreamSerializer } from '@rvoh/dream'
import Review from '@models/Review.js'

export const ReviewSummarySerializer = (review: Review) =>
  DreamSerializer(Review, review)
    .attribute('id')

export const ReviewSerializer = (review: Review) =>
  ReviewSummarySerializer(review)
    .attribute('rating')
    .attribute('body')
