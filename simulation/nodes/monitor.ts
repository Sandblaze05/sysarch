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

    simulate(node, event, context) {
        return [];
    },

    validate(node) {
        return [];
    },
}