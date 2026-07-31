import { RuntimeEdge } from "@/types/node";
import { RuntimeNode } from "./RuntimeNode";

export class RuntimeGraph {
    readonly nodes = new Map<string, RuntimeNode>();

    readonly outgoing = new Map<string, RuntimeEdge[]>();
    readonly incoming = new Map<string, RuntimeEdge[]>();

    addNode(node: RuntimeNode) {
        this.nodes.set(node.instance.id, node);
        this.outgoing.set(node.instance.id, []);
        this.incoming.set(node.instance.id, []);
    }

    addEdge(edge: RuntimeEdge) {
        this.outgoing.get(edge.source)?.push(edge);
        this.incoming.get(edge.target)?.push(edge);
    }

    getNode(id: string) {
        return this.nodes.get(id);
    }

    getOutgoing(id: string) {
        return this.outgoing.get(id) ?? [];
    }

    getIncoming(id: string) {
        return this.incoming.get(id) ?? [];
    }
}