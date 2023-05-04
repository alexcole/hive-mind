import { maybeCreateCurrentUser } from './users'
import { Id } from './_generated/dataModel'
import {
  action,
  DatabaseReader,
  internalMutation,
  mutation,
  query,
} from './_generated/server'

const gameDataRegex = new RegExp('window.gameData = ([^<]*)<')

type PuzzleJSON = {
  today: {
    answers: string[]
    centerLetter: string
    validLetters: string[]
  }
}

export const fetchTodaysPuzzle = action(async ({ runMutation }) => {
  const response = await fetch('https://www.nytimes.com/puzzles/spelling-bee')
  const html = await response.text()
  const json = html.match(gameDataRegex)![1]
  const results: PuzzleJSON = JSON.parse(json)

  await runMutation('puzzles:insert', {
    letters: results.today.validLetters.map((letter) => letter.toUpperCase()),
    centerLetter: results.today.centerLetter.toUpperCase(),
    answers: results.today.answers.map((answer) => answer.toUpperCase()),
  })
})

export const setup = mutation(async (ctx) => {
  const { db, scheduler } = ctx
  await maybeCreateCurrentUser(ctx)

  if ((await getTodaysPuzzle(db)) === null) {
    scheduler.runAfter(0, 'puzzles:fetchTodaysPuzzle')
  }
})

function todayTimestamp() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'short',
  })
}

async function getTodaysPuzzle(db: DatabaseReader) {
  return await db
    .query('puzzles')
    .withIndex('by_dateTimestamp', (q) =>
      q.eq('dateTimestamp', todayTimestamp())
    )
    .first()
}

export const insert = internalMutation(
  async (
    { db },
    {
      letters,
      centerLetter,
      answers,
    }: {
      letters: string[]
      centerLetter: string
      answers: string[]
    }
  ) => {
    await db.insert('puzzles', {
      letters,
      centerLetter,
      answers,
      dateTimestamp: todayTimestamp(),
    })
  }
)

export const get = query(async ({ db }) => {
  return getTodaysPuzzle(db)
})
