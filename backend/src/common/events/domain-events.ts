import { Injectable } from '@nestjs/common';

// Every in-process domain event and its payload. Each module adds its own
// events with declaration merging, next to the code that raises them:
//
//   declare module '../../common/events/domain-events.js' {
//     interface DomainEventMap { 'announcement.published': AnnouncementPublished }
//   }
export interface DomainEventMap {}

export type DomainEventName = keyof DomainEventMap;
export type DomainEventListener<K extends DomainEventName> = (payload: DomainEventMap[K]) => void | Promise<void>;

// In-process domain events (docs/backend-architecture.md): a module raises an
// event instead of calling the modules that react to it. Listeners run one
// after another and are awaited, so a listener that throws makes `emit` throw
// and the raiser can retry; listeners must therefore be idempotent.
@Injectable()
export class DomainEvents {
  private readonly listeners = new Map<DomainEventName, DomainEventListener<DomainEventName>[]>();

  // Register in a provider's onModuleInit; returns a function that unregisters.
  on<K extends DomainEventName>(name: K, listener: DomainEventListener<K>): () => void {
    const list = this.listeners.get(name) ?? [];
    list.push(listener as DomainEventListener<DomainEventName>);
    this.listeners.set(name, list);
    return () => this.listeners.set(name, (this.listeners.get(name) ?? []).filter((item) => item !== listener));
  }

  async emit<K extends DomainEventName>(name: K, payload: DomainEventMap[K]): Promise<void> {
    for (const listener of this.listeners.get(name) ?? []) await listener(payload);
  }
}
