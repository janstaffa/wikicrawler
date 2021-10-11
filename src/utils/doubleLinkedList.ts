class ListNode {
  value: any = null;
  previous: ListNode | null = null;
  next: ListNode | null = null;
  constructor(value: any, previous: ListNode | null, next: ListNode | null) {
    this.value = value;
    this.previous = previous;
    this.next = next;
  }
}

export class DoubleLinkedList {
  nodes: ListNode[] = [];
  addNode = (value: any) => {
    const lastNode = this.nodes[this.nodes.length - 1];
    const node = new ListNode(value, lastNode, null);
    this.nodes[this.nodes.length - 1].next = node;
    this.nodes.push(node);
    return node;
  };
}
