import { nodeRegistry, registerNodes } from "./nodeRegistry";

import { apiGatewayNode } from "@/simulation/nodes/apigateway";
import { cacheNode } from "@/simulation/nodes/cache";
import { cdnNode } from "@/simulation/nodes/cdn";
import { clientNode } from "@/simulation/nodes/client";
import { databaseNode } from "@/simulation/nodes/database";
import { externalApiNode } from "@/simulation/nodes/externalapi";
import { loadbalanceNode } from "@/simulation/nodes/loadbalancer";
import { messageQueueNode } from "@/simulation/nodes/messagequeue";
import { monitorNode } from "@/simulation/nodes/monitor";
import { objectStorageNode } from "@/simulation/nodes/objectstorage";
import { serviceNode } from "@/simulation/nodes/service";
import { workerNode } from "@/simulation/nodes/worker";

registerNodes([
    apiGatewayNode,
    cacheNode,
    cdnNode,
    clientNode,
    databaseNode,
    externalApiNode,
    loadbalanceNode,
    messageQueueNode,
    monitorNode,
    objectStorageNode,
    serviceNode,
    workerNode
]);

export { nodeRegistry };