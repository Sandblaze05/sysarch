import { SimulationEvent } from "@/types/node";

export class EventQueue {
    private queue: SimulationEvent[] = [];

    push(event: SimulationEvent) {
        // Find the first event with a later tick
        const index = this.queue.findIndex(e => e.tick > event.tick);

        if (index === -1) {
            this.queue.push(event);
        } else {
            this.queue.splice(index, 0, event);
        }
    }

    pop() {
        return this.queue.shift();
    }

    peek() {
        return this.queue[0];
    }

    size() {
        return this.queue.length;
    }

    isEmpty() {
        return this.size() === 0;
    }

    clear() {
        this.queue = [];
    }
}