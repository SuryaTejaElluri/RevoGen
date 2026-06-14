import { Test, TestingModule } from '@nestjs/testing';
import { CodingSubmissionsService } from './coding-submissions.service';

describe('CodingSubmissionsService', () => {
  let service: CodingSubmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodingSubmissionsService],
    }).compile();

    service = module.get<CodingSubmissionsService>(CodingSubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
