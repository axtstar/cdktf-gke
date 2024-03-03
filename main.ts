import { App } from "cdktf"
import { ClusterStack } from "./lib/cluster_stack"
import { NodePoolStack } from "./lib/nodepool_stack"
import { WorkloadStack } from "./lib/workload_stack"
import { ServiceStack } from "./lib/service_stack"
import { DcgmExporterStack } from "./lib/dcgm_stack"

const app = new App({
    skipValidation: true,
})
new ClusterStack(app, "cluster")
new NodePoolStack(app, "nodepool")
new WorkloadStack(app, "workload")
new ServiceStack(app, "service")
new DcgmExporterStack(app, "dcgm")
app.synth()
