import { DreamSerializer } from '@rvoh/dream'
import Review from '@models/Review.js'

export const ReviewSummarySerializer = (review: Review) =>
  DreamSerializer(Review, review)
    .attribute('id')
    .attribute('bookingId')
    .attribute('rating')
    .attribute('body')
    .attribute('createdAt')

export const ReviewVisitorSummarySerializer = (review: Review) =>
  DreamSerializer(Review, review)
    .attribute('id')
    .attribute('rating')
    .attribute('body')
    .attribute('createdAt')

export const ReviewSerializer = (review: Review) =>
  ReviewSummarySerializer(review)
