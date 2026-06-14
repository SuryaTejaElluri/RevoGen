import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class Judge0Service {
  private readonly apiKey =
    process.env.RAPIDAPI_KEY;

  private readonly apiHost =
    process.env.RAPIDAPI_HOST;

  private readonly baseUrl =
    'https://judge0-ce.p.rapidapi.com';

  async createSubmission(
    sourceCode: string,
    languageId: number,
    stdin?: string,
  ) {
    const response = await axios.post(
      `${this.baseUrl}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin ?? '',
      },
      {
        headers: {
          'content-type':
            'application/json',
          'X-RapidAPI-Key':
            this.apiKey,
          'X-RapidAPI-Host':
            this.apiHost,
        },
      },
    );

    return response.data;
  }

  async getSubmissionResult(
    token: string,
  ) {
    const response = await axios.get(
      `${this.baseUrl}/submissions/${token}?base64_encoded=true&wait=false`,
      {
        headers: {
          'X-RapidAPI-Key':
            this.apiKey,
          'X-RapidAPI-Host':
            this.apiHost,
        },
      },
    );

    const data = response.data;

return {
  ...data,

  stdout: data.stdout
    ? Buffer.from(
        data.stdout,
        'base64',
      ).toString('utf8')
    : null,

  stderr: data.stderr
    ? Buffer.from(
        data.stderr,
        'base64',
      ).toString('utf8')
    : null,

  compile_output:
    data.compile_output
      ? Buffer.from(
          data.compile_output,
          'base64',
        ).toString('utf8')
      : null,

  message: data.message
    ? Buffer.from(
        data.message,
        'base64',
      ).toString('utf8')
      : null,
};
  }

  async executeCode(
  sourceCode: string,
  languageId: number,
  stdin?: string,
) {
  const submission =
    await this.createSubmission(
      sourceCode,
      languageId,
      stdin,
    );

  await new Promise((resolve) =>
    setTimeout(resolve, 2000),
  );

  return this.getSubmissionResult(
    submission.token,
  );
}
}