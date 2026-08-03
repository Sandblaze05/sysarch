import { RoutedEvent } from "@/types/node";

export class EventQueue {
    private queue: RoutedEvent[] = [];

    push(event: RoutedEvent) {
        const index = this.queue.findIndex(e => e.tick > event.tick);
        if (index === -1) {
            this.queue.push(event);
        } else {
            this.queue.splice(index, 0, event);
        }
    }

    pop(): RoutedEvent | undefined {
        return this.queue.shift();
    }

    peek(): RoutedEvent | undefined {
        return this.queue[0];
    }

    size(): number {
        return this.queue.length;
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    clear() {
        this.queue = [];
    }
}
