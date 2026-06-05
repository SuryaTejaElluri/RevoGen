import axios from 'axios';
import * as mammoth from 'mammoth';
import { Injectable } from '@nestjs/common';
import { SKILLS } from './skills';
import { ATS_SKILLS } from './ats-skills';

@Injectable()
export class AnalysisService {
  extractSkills(text: string) {
    const foundSkills = SKILLS.filter(skill =>
      text.toLowerCase().includes(skill.toLowerCase()),
    );

    return [...new Set(foundSkills)];
  }

  async extractTextFromDocx(url: string) {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const result = await mammoth.extractRawText({
      buffer: Buffer.from(response.data),
    });

    return result.value;
  }

  calculateATS(skills: string[]) {
  const matchedSkills =
    ATS_SKILLS.filter(skill =>
      skills.includes(skill),
    );

  const missingSkills =
    ATS_SKILLS.filter(
      skill => !skills.includes(skill),
    );

  const atsScore = Math.round(
    (matchedSkills.length /
      ATS_SKILLS.length) *
      100,
  );

  return {
    atsScore,
    matchedSkills,
    missingSkills,
  };
}
}