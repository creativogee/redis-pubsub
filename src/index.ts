import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  RedisPubSubAsyncOptions,
  RedisPubSubOptions,
  RedisPubSubOptionsFactory,
} from '../types';
import { REDIS_EVENT_OPTIONS } from './constant';
import { RedisEventPublisher } from './redis-event-publisher';
import { RedisEventSubscriber } from './redis-event-subscriber';

@Module({})
export class RedisPubSubModule {
  static forRoot(options: RedisPubSubOptions): DynamicModule {
    return {
      module: RedisPubSubModule,
      providers: [
        {
          provide: REDIS_EVENT_OPTIONS,
          useValue: options,
        },
        RedisEventPublisher,
        RedisEventSubscriber,
      ],
      exports: [RedisEventPublisher, RedisEventSubscriber],
    };
  }

  static forRootAsync(options: RedisPubSubAsyncOptions): DynamicModule {
    const providers = this.createAsyncProviders(options);
    return {
      module: RedisPubSubModule,
      imports: options.imports || [],
      providers: [...providers, RedisEventPublisher, RedisEventSubscriber],
      exports: [RedisEventPublisher, RedisEventSubscriber],
    };
  }

  private static createAsyncProviders(
    options: RedisPubSubAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: REDIS_EVENT_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: REDIS_EVENT_OPTIONS,
          useFactory: async (optionsFactory: RedisPubSubOptionsFactory) =>
            await optionsFactory.createRedisPubSubOptions(),
          inject: [options.useClass],
        },
        {
          provide: options.useClass,
          useClass: options.useClass,
        },
      ];
    }

    throw new Error('Invalid async options');
  }
}

export { EventHandler, RedisPubSubOptions } from '../types';
export { RedisEventPublisher } from './redis-event-publisher';
export { RedisEventSubscriber } from './redis-event-subscriber';
