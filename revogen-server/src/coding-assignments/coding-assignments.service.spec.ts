import { Test, TestingModule } from '@nestjs/testing';
import { CodingAssignmentsService } from './coding-assignments.service';

describe('CodingAssignmentsService', () => {
  let service: CodingAssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodingAssignmentsService],
    }).compile();

    service = module.get<CodingAssignmentsService>(CodingAssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
