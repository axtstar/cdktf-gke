import { App } from "cdktf"
import { ClusterStack } from "./lib/cluster_stack"
import { NodePoolStack } from "./lib/nodepool_stack"
import { WorkloadStack } from "./lib/workload_stack"
import { ServiceStack } from "./lib/service_stack"
import { DcgmExporterStack } from "./lib/dcgm_stack"
import { Common } from "./lib/common"
import { FirewallStack } from "./lib/firewall_stack"

const app = new App({
    skipValidation: true,
})

new ClusterStack(app, "cluster")

// web app想定（軽め）
new ServiceStack(app, "service", {
    name: "sample-service",
    bindIp: "sample-servie-ip",
    workloadName: "sample-workload",
    targetPort: 8501,
    isInternal: false,
})

new WorkloadStack(app, "workload", {
    name: "sample-workload",
    nodeSelector: "nodepool",
    podCount: 1,
    maxPodCount: 1,
    networkTag: "sample-workload",
    containerImage: Common.get_container_image1(),
    resourceRequest: {
        requests: {
            cpu: '500m',
            memory: '3Gi',
        }
    },
    resourceLimit: {
        limits: {
            cpu: '1300m',
            memory: '6Gi',
        }
    },
    env: [
        { name: "API_URL", value: Common.get_api_url() }
    ]
})

new NodePoolStack(app, "nodepool", {
    poolName: "nodepool",
    nodeCount: 1,
    totalMaxNodeCount: 1,
    totalMinNodeCount: 0,
    gpuName: "",
    machineType: "e2-standard-2",
    tags: ["sample-node1"]
})

// web api想定（重め）
new ServiceStack(app, "service2", {
    name: "sample-service2",
    bindIp: "",
    workloadName: "workload2",
    targetPort: 8000,
    isInternal: true,
})

new WorkloadStack(app, "workload2", {
    name: "workload2",
    nodeSelector: "nodepool2",
    podCount: 1,
    maxPodCount: 1,
    networkTag: "",
    containerImage: Common.get_container_image2(),
    resourceRequest: {
        requests: {
            "nvidia.com/gpu": 1,
            cpu: '1100m',
            memory: '8Gi',
        }
    },
    resourceLimit: {
        limits: {
            "nvidia.com/gpu": 1,
            cpu: '1800m',
            memory: '12Gi',
        }
    }
})

new NodePoolStack(app, "nodepool2", {
    poolName: "nodepool2",
    nodeCount: 1,
    totalMaxNodeCount: 1,
    totalMinNodeCount: 0,
    gpuName: "nvidia-tesla-t4",
    machineType: "n1-highmem-4",
    tags: ["sample-node2"]
})

new DcgmExporterStack(app, "dcgm")

new FirewallStack(app, "deny-firewall", {
    name: "deny-all-sample-node1",
    priority: 1000,
    targetTags: ["sample-node1"],
    allowOrDeny: {
        deny: {
            ports: ["80"],
            protocol: "tcp"
        }
    },
    sourceRanges: ["0.0.0.0/0"]
})

new FirewallStack(app, "allow-firewall", {
    name: "allow-ip-sample-node1",
    priority: 900,
    targetTags: ["sample-node1"],
    allowOrDeny: {
        allow: {
            ports: ["80"],
            protocol: "tcp"
        }
    },
    // アクセスを許可したいIPを環境変数から取得
    sourceRanges: Common.get_enable_ips()
})


app.synth()
