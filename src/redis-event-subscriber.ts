import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { EventHandler, RedisPubSubOptions } from 'types';
import { REDIS_EVENT_OPTIONS } from './constant';

@Injectable()
export class RedisEventSubscriber implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly streamKey: string;
  private readonly logger: Logger;
  private consumerGroup: string;
  private consumerName: string;
  private isSubscribed: boolean = false;
  private readonly eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor(
    @Inject(REDIS_EVENT_OPTIONS) private readonly options: RedisPubSubOptions,
  ) {
    this.redis = new Redis(this.options.redisUrl);
    this.streamKey = this.options.streamKey || 'event-queues';
    this.logger = new Logger('RedisPubSub');
  }

  async init(serviceName: string) {
    this.consumerGroup = `${serviceName}-group`;
    this.consumerName = `${serviceName}-${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    await this.setupConsumerGroup();
    await this.subscribeToEvents();
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  async onModuleDestroy() {
    await this.unsubscribeFromEvents();
  }

  private async setupConsumerGroup() {
    try {
      await this.redis.xgroup(
        'CREATE',
        this.streamKey,
        this.consumerGroup,
        '$',
        'MKSTREAM',
      );
    } catch (err) {
      if (err.message.includes('BUSYGROUP')) {
        this.logger.log(`Consumer group ${this.consumerGroup} already exists`);
      } else {
        throw err;
      }
    }
  }

  private async subscribeToEvents() {
    if (this.isSubscribed) return;

    try {
      while (true) {
        const results = await this.redis.xreadgroup(
          'GROUP',
          this.consumerGroup,
          this.consumerName,
          'COUNT',
          10,
          'BLOCK',
          2000,
          'STREAMS',
          this.streamKey,
          '>',
        );

        if (results) {
          for (const [, messages] of results as [
            string,
            [string, string[]][],
          ][]) {
            for (const [id, fields] of messages) {
              const eventData = this.parseEventData(fields);
              await this.processEvent(eventData.event, eventData.data);
              await this.redis.xack(this.streamKey, this.consumerGroup, id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error subscribing to events:', error);
      this.isSubscribed = false;
    }
  }

  private parseEventData(fields: string[]): { event: string; data: any } {
    const eventData: { event: string; data: any } = { event: '', data: {} };
    for (let i = 0; i < fields.length; i += 2) {
      if (fields[i] === 'event') {
        eventData.event = fields[i + 1];
      } else if (fields[i] === 'data') {
        eventData.data = JSON.parse(fields[i + 1]);
      }
    }
    return eventData;
  }

  private async unsubscribeFromEvents() {
    if (this.redis) {
      await this.redis.quit();
    }
    this.isSubscribed = false;
  }

  private async processEvent(event: string, data: any) {
    const handlers = this.eventHandlers.get(event) || [];
    await Promise.all(handlers.map((handler) => handler(event, data)));
  }
}
