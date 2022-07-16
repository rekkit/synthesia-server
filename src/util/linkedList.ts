

class LinkedListNode<T> {

    x: T | null;
    next: LinkedListNode<T> | null;

    constructor(x: T | null, next: LinkedListNode<T> | null) {
        this.x = x;
        this.next = next;
    }
}

export class TwoSidedLinkedList<T> {

    head: LinkedListNode<T> | null;
    tail: LinkedListNode<T> | null;

    constructor(head: LinkedListNode<T> | null) {
        this.head = head;
        this.tail = this.head;
    }

    addToTail(x: T) {

        if (this.head === null) {
            this.head = new LinkedListNode(x, null);
            this.tail = this.head;
            return;
        }

        if (this.head === this.tail) {
            this.tail = new LinkedListNode(x, null);
            this.head.next = this.tail;
            return;
        }

        // General case
        // No way this.tail is null but TS doesn't understand this
        if (this.tail === null) return;

        let oldTail = this.tail;
        this.tail = new LinkedListNode(x, null);
        oldTail.next = this.tail;
    }

    getHead(): T | null {

        if (this.head === null) return null;

        return this.head.x;
    }

    getTail(): T | null {
        if (this.tail === null) return null;

        return this.tail.x;
    }

    deleteHead(): void {

        if (this.head === null) return;

        if (this.head === this.tail) {
            this.head = null;
            this.tail = null;
            return;
        }

        this.head = this.head.next;
    }

    isEmpty(): boolean {
        return this.head === null;
    }
}
