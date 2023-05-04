import { defineSchema, defineTable } from 'convex/schema'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
  }).index('by_token', ['tokenIdentifier']),

  submissions: defineTable({
    word: v.string(),
    puzzleId: v.id('puzzles'),
    submitterId: v.id('users'),
  }).index('by_puzzle', ['puzzleId', 'word']),

  puzzles: defineTable({
    letters: v.array(v.string()),
    centerLetter: v.string(),
    answers: v.array(v.string()),
    dateTimestamp: v.string(),
  }).index('by_dateTimestamp', ['dateTimestamp']),
})
