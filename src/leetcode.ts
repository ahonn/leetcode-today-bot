import { request } from 'graphql-request';
import { format } from 'date-fns';

const query = `{
    todayRecord {
      date
      question {
        questionFrontendId
        difficulty
        title
        translatedTitle
        titleSlug
        acRate
      }
    }
}`;

export enum Difficulty {
  EASY = 'easy',
  MIDDLE = 'middle',
  HARD = 'hard',
}

export type TodayRecordQuestion = {
  frontendId: number;
  title: string;
  path: string;
  acRate: number;
  difficulty: Difficulty;
};

export async function getLeetcodeTodayRecord(): Promise<TodayRecordQuestion | null> {
  const { todayRecord } = await request(
    'https://leetcode-cn.com/graphql',
    query,
  );
  const [{ question, date }] = todayRecord;

  const today = format(new Date(), 'yyyy-MM-dd');
  if (date !== today) {
    return null;
  }

  const {
    acRate,
    titleSlug,
    difficulty: _difficulty,
    questionFrontendId: frontendId,
    translatedTitle: title,
  } = question;
  const difficulty = (_difficulty as string).toLowerCase() as Difficulty;
  const path = `/problems/${titleSlug}/`;

  return {
    frontendId,
    title,
    path,
    acRate,
    difficulty,
  };
}
