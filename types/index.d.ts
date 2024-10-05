import {
  DynamicModule,
  Logger,
  ModuleMetadata,
  OnModuleDestroy,
  OnModuleInit,
  Type,
} from '@nestjs/common';
import { Redis } from 'ioredis';

export interface RedisPubSubOptions {
  redisUrl: string;
  streamKey?: string;
  logger?: Logger;
}

export interface RedisPubSubOptionsFactory {
  createRedisPubSubOptions(): Promise<RedisPubSubOptions> | RedisPubSubOptions;
}

export interface RedisPubSubAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (
    ...args: any[]
  ) => Promise<RedisPubSubOptions> | RedisPubSubOptions;
  inject?: any[];
  useClass?: Type<RedisPubSubOptionsFactory>;
}

export declare class RedisPubSubModule {
  static forRoot(options: RedisPubSubOptions): DynamicModule;
  static forRootAsync(options: RedisPubSubAsyncOptions): DynamicModule;
}

export type EventHandler = (event: string, data: any) => Promise<void>;

export declare class RedisEventPublisher {
  private readonly redis: Redis;
  private readonly streamKey: string;

  constructor(options: RedisPubSubOptions);

  emit(event: string, data: any): Promise<string>;
}

export declare class RedisEventSubscriber
  implements OnModuleInit, OnModuleDestroy
{
  private readonly redis: Redis;
  private readonly streamKey: string;
  private consumerGroup: string;
  private consumerName: string;
  private isSubscribed: boolean;
  private readonly eventHandlers: Map<string, EventHandler[]>;

  constructor(options: RedisPubSubOptions);

  init(serviceName: string): void;

  on(event: string, handler: EventHandler): void;

  onModuleInit(): Promise<void>;

  onModuleDestroy(): Promise<void>;

  private setupConsumerGroup(): Promise<void>;

  private subscribeToEvents(): Promise<void>;

  private parseEventData(fields: string[]): { event: string; data: any };

  private unsubscribeFromEvents(): Promise<void>;

  private processEvent(event: string, data: any): Promise<void>;
}
