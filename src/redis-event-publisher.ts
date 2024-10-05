import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisPubSubOptions } from 'types';
import { REDIS_EVENT_OPTIONS } from './constant';

@Injectable()
export class RedisEventPublisher {
  private readonly redis: Redis;
  private readonly streamKey: string;

  constructor(
    @Inject(REDIS_EVENT_OPTIONS) private readonly options: RedisPubSubOptions,
  ) {
    this.redis = new Redis(this.options.redisUrl);
    this.streamKey = this.options.streamKey || 'event-queues';
  }

  async emit(event: string, data: any): Promise<string> {
    return this.redis.xadd(
      this.streamKey,
      '*',
      'event',
      event,
      'data',
      JSON.stringify(data),
    );
  }
}
