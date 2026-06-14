import { Test, TestingModule } from '@nestjs/testing';
import { CodingSubmissionsController } from './coding-submissions.controller';
import { CodingSubmissionsService } from './coding-submissions.service';

describe('CodingSubmissionsController', () => {
  let controller: CodingSubmissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CodingSubmissionsController],
      providers: [CodingSubmissionsService],
    }).compile();

    controller = module.get<CodingSubmissionsController>(CodingSubmissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
