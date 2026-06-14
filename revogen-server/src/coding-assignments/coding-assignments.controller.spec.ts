import { Test, TestingModule } from '@nestjs/testing';
import { CodingAssignmentsController } from './coding-assignments.controller';

describe('CodingAssignmentsController', () => {
  let controller: CodingAssignmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CodingAssignmentsController],
    }).compile();

    controller = module.get<CodingAssignmentsController>(CodingAssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
