import { DreamSerializer } from '@rvoh/dream'
import Review from '@models/Review.js'

export const ReviewSummarySerializer = (review: Review) =>
  DreamSerializer(Review, review)
    .attribute('id')
    .attribute('placeId')
    .attribute('bookingId')
    .attribute('rating')
    .attribute('body')

export const ReviewSerializer = (review: Review) => ReviewSummarySerializer(review)
