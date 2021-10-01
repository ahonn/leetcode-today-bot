/* eslint-disable @typescript-eslint/no-explicit-any */

import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { request } from 'graphql-request';
import { format } from 'date-fns';

const query = `{
  todayRecord {
    question {
      questionFrontendId
      questionId
      questionTitle
      questionTitleSlug
      translatedTitle
      __typename
    }
    date
    __typename
  }
}`;

enum DIFFICULTY_LEVEL {
  EASY = 1,
  MIDDLE = 2,
  HARD = 3,
}

const DIFFICULTY_LEVEL_LABEL_MAP = {
  [DIFFICULTY_LEVEL.EASY]: '<font color="info">简单</font>',
  [DIFFICULTY_LEVEL.MIDDLE]: '<font color="warning">中等</font>',
  [DIFFICULTY_LEVEL.HARD]: '<font color="comment">困难</font>',
};

axiosRetry(axios, {
  retries: 4,
  shouldResetTimeout: true,
  retryCondition: () => true,
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default async (req: VercelRequest, res: VercelResponse) => {
  const { key } = req.query;
  const { todayRecord } = await request(
    'https://leetcode-cn.com/graphql',
    query,
  );
  const [{ question, date }] = todayRecord;

  const today = format(new Date(), 'yyyy-MM-dd');
  if (date !== today) {
    res.status(200).send('Skip');
    return;
  }

  const problemsRes = await axios.get(
    'https://leetcode-cn.com/api/problems/all/',
    { timeout: 3000 },
  );
  const problems = problemsRes.data.stat_status_pairs;
  const stat = problems.find((problem: any) => {
    return problem.stat.question_id === parseInt(question.questionId, 10);
  });

  const { questionFrontendId, questionTitleSlug, translatedTitle } = question;
  const {
    difficulty,
    stat: { total_submitted, total_acs },
  } = stat;

  const difficultyLevelLabel =
    DIFFICULTY_LEVEL_LABEL_MAP[difficulty.level as DIFFICULTY_LEVEL];
  const acRate = ((total_acs / total_submitted) * 100).toFixed(2) + '%';
  const path = `/problems/${questionTitleSlug}/`;

  let content = '';
  content += `${questionFrontendId}.${translatedTitle}\n`;
  content += `> 难度: ${difficultyLevelLabel}\n`;
  content += `> 通过率: ${acRate}\n`;
  content += `> 链接: [中文](https://leetcode-cn.com${path}) | [英文](https://leetcode.com${path})\n`;

  const data = {
    msgtype: 'markdown',
    markdown: {
      content,
    },
  };

  if (key) {
    axios.post(
      `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  res.status(200).send(data);
};
