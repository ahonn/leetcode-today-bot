/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from 'axios';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Difficulty, getLeetcodeTodayRecord } from '../leetcode';

const DIFFICULTY_LEVEL_LABEL_MAP: Record<Difficulty, string> = {
  [Difficulty.EASY]: '简单',
  [Difficulty.MEDIUM]: '中等',
  [Difficulty.HARD]: '困难',
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

  const data = {
    msgtype: 'template_card',
    template_card: {
      card_type: 'text_notice',
      source: {
        icon_url: 'https://leetcode.com/static/images/LeetCode_logo_rvs.png',
        desc: '每日 LeetCode',
        desc_color: 0,
      },
      main_title: {
        title: `${frontendId}.${title}\n`,
      },
      horizontal_content_list: [
        {
          keyname: '难度',
          value: `${DIFFICULTY_LEVEL_LABEL_MAP[difficulty] ?? '未知'}`,
        },
        {
          keyname: '通过率',
          value: `${(acRate * 100).toFixed(1)}%`,
        },
      ],
      jump_list: [
        {
          type: 1,
          url: `https://leetcode.com${path}`,
          title: '跳转到 LeetCode',
        },
        {
          type: 1,
          url: `https://leetcode-cn.com${path}`,
          title: '跳转到力扣',
        },
      ],
      card_action: {
        type: 1,
        url: `https://leetcode.com${path}`,
      },
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
