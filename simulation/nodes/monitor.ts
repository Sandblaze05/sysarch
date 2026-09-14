import { EventType, NodeCategory, NodeDefinition, PortDirection, PortSide } from "@/types/node";
import { Activity } from "lucide-react";

export const monitorNode: NodeDefinition = {
    type: "monitor",

    label: "Monitor",

    category: NodeCategory.MONITORING,

    icon: Activity,

    description: "Central monitoring service for collecting metrics, trace data, system logs, and triggering alerts.",

    inputs: [
        {
            id: "in",
            label: "Metrics",
            side: PortSide.LEFT,
            direction: PortDirection.INPUT,
            accepts: [EventType.METRIC, EventType.ERROR],
        },
    ],

    outputs: [],

    config: [
        {
            key: "scrapingInterval",
            label: "Scraping Interval (s)",
            type: "number",
            defaultValue: 15,
            min: 1,
        },
        {
            key: "retentionDays",
            label: "Retention (Days)",
            type: "number",
            defaultValue: 30,
            min: 1,
        },
        {
            key: "alerting",
            label: "Enable Alerting",
            type: "boolean",
            defaultValue: true,
        },
    ],

    simulate(node, event, context, state) {
        state.metricsIngested = (state.metricsIngested || 0) as number;
        state.alertsFired = (state.alertsFired || 0) as number;
        
        if (event.type === EventType.METRIC) {
            state.metricsIngested = (state.metricsIngested as number) + 1;
            context.metrics.record(node.instance.id, 'metricsIngested', state.metricsIngested as number);
        }
        
        if (event.type === EventType.ERROR) {
            state.metricsIngested = (state.metricsIngested as number) + 1;
            if (node.instance.config.alerting) {
                state.alertsFired = (state.alertsFired as number) + 1;
            }
            context.log(`Alert fired: ${JSON.stringify(event.payload)}`);
            context.metrics.record(node.instance.id, 'alertsFired', state.alertsFired as number);
        }

        context.metrics.record(node.instance.id, 'metricsIngested', state.metricsIngested as number);
        
        return [];
    },

    validate(node) {
        return [];
    },
}
