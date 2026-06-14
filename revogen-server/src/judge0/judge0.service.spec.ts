import { Test, TestingModule } from '@nestjs/testing';
import { Judge0Service } from './judge0.service';

describe('Judge0Service', () => {
  let service: Judge0Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Judge0Service],
    }).compile();

    service = module.get<Judge0Service>(Judge0Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
