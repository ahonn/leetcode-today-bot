/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from 'axios';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Difficulty, getLeetcodeTodayRecord } from './leetcode';

const DIFFICULTY_LEVEL_LABEL_MAP: Record<Difficulty, string> = {
  [Difficulty.EASY]: '<font color="info">简单</font>',
  [Difficulty.MEDIUM]: '<font color="warning">中等</font>',
  [Difficulty.HARD]: '<font color="comment">困难</font>',
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default async (req: VercelRequest, res: VercelResponse) => {
  const { key } = req.query;
  const todayRecord = await getLeetcodeTodayRecord();

  if (todayRecord === null) {
    res.status(502);
    return;
  }

  const { frontendId, title, acRate, difficulty, path } = todayRecord;

  let content = '';
  content += `${frontendId}.${title}\n`;
  content += `> 难度: ${DIFFICULTY_LEVEL_LABEL_MAP[difficulty] ?? '未知'}\n`;
  content += `> 通过率: ${(acRate * 100).toFixed(1)}%\n`;
  content += `> 链接: [中文](https://leetcode-cn.com${path}) | [英文](https://leetcode.com${path})\n`;

  const data = {
    msgtype: 'markdown',
    markdown: {
      content,
    },
  };

  if (key) {
    await axios.post(
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
