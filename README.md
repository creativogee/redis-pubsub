<h1 align="center">
  @crudmates/redis-pubsub
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@crudmates/redis-pubsub"><img alt="NPM version" src="https://img.shields.io/npm/v/@crudmates/redis-pubsub.svg"></a>
  <a href="https://www.npmjs.com/package/@crudmates/redis-pubsub"><img alt="NPM downloads" src="https://img.shields.io/npm/dw/@crudmates/redis-pubsub.svg"></a>
  <a href="https://www.paypal.com/donate?hosted_button_id=Z9NGDEGSC3LPY" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"></a>
</p>

A Redis-based Pub/Sub module for NestJS applications.

## Description

This package provides a Redis-based Pub/Sub implementation for NestJS applications. It includes both event publishing and subscribing capabilities using Redis streams.

## Installation

```sh
npm install @crudmates/redis-pubsub
```

## Usage

### Import the module

```typescript
import { Module } from '@nestjs/common';
import { RedisPubSubModule } from '@crudmates/redis-pubsub';

@Module({
  imports: [
    RedisPubSubModule.forRoot({
      redisUrl: 'redis://localhost:6379',
      streamKey: 'events',
    }),
  ],
})
export class AppModule {}
```

### Publish an event

```typescript
import { Injectable } from '@nestjs/common';
import { RedisEventPublisher } from '@crudmates/redis-pubsub';

@Injectable()
export class PubsubPublisherService {
  constructor(private readonly publisher: RedisEventPublisher) {}

  async orderCreated() {
    await this.publisher.emit('order.created', { id: 1 });
  }
}
```

### Subscribe to an event

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisEventSubscriber } from '@crudmates/redis-pubsub';

@Injectable()
export class PubsubSubscriberService implements OnModuleInit {
  constructor(private readonly subscriber: RedisEventSubscriber) {}

  onModuleInit() {
    this.subscriber.init('order-service');
    this.subscriber.on('order.created', this.handleOrderCreated.bind(this));
  }

  async handleOrderCreated(event: string, data: any) {
    // Handle the event
  }
}
```

## License

This package is licensed under the [MIT license](LICENSE).
