// Imports
import { TwoSidedLinkedList } from "./linkedList";

export class Queue<T> {

    listSize: number = 0;
    maxSize: number | null = null;
    list: TwoSidedLinkedList<T> = new TwoSidedLinkedList(null);

    constructor(maxSize: number | null = null) {
        this.maxSize = maxSize;
    }

    size(): number {
        return this.listSize;
    }

    oldest(): T | null {
        return this.list.getHead();
    }

    queue(x: T): void {
        this.list.addToTail(x);
        this.listSize++;

        if (this.maxSize !== null && this.maxSize < this.listSize) {
            this.dequeue();
        }
    }

    dequeue(): T | null {

        let head = this.list.getHead();
        this.list.deleteHead();
        this.listSize = Math.max(0, this.listSize - 1);
    
        return head;
    }

    isEmpty(): boolean {
        return this.list.isEmpty();
    }
}
