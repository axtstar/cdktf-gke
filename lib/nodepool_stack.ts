import { Construct } from "constructs"

import { ContainerNodePool } from '../.gen/providers/google/container-node-pool'
import { Common } from "./common"
import { GoogleStack } from "./google_stack"

export class NodePoolStack extends GoogleStack {

    constructor(scope: Construct, id: string) {
        super(scope, id);

        // ノードプール設定
        this.create_nodePool(this, id)
    }


    /**
     * ノードプールを構築する
     * @param scope 
     */
    create_nodePool(scope: any, id: string) {

        // GPUの指定
        let gpu: any = {}
        if (Common.get_gpu_name() != "") {
            gpu = {
                guestAccelerator: [
                    {
                        count: 1,
                        type: Common.get_gpu_name(),
                        gpuDriverInstallationConfig: [{ gpuDriverVersion: "DEFAULT", }],
                        gpuPartitionSize: "",
                        gpuSharingConfig: [],
                    },
                ],
            }
        }

        // ノードプール設定
        new ContainerNodePool(scope, id, {
            project: Common.get_project_id(),
            name: Common.get_nodepool_name(),
            location: Common.get_location(),
            cluster: Common.get_cluster(),
            nodeCount: Common.pool_node_count(),
            nodeLocations: [Common.get_location()],
            autoscaling: {
                totalMaxNodeCount: Common.pool_total_max_node_count(),
                totalMinNodeCount: Common.pool_total_min_node_count(),
            },
            nodeConfig: {
                machineType: Common.get_machine_name(), // マシンタイプ
                // GPU設定展開
                ...gpu,
                oauthScopes: [
                    "https://www.googleapis.com/auth/cloud-platform",
                    "https://www.googleapis.com/auth/compute",
                    "https://www.googleapis.com/auth/devstorage.read_only",
                    "https://www.googleapis.com/auth/logging.write",
                    "https://www.googleapis.com/auth/monitoring",
                    "https://www.googleapis.com/auth/ndev.clouddns.readonly",
                    "https://www.googleapis.com/auth/service.management.readonly",
                    "https://www.googleapis.com/auth/servicecontrol",
                    "https://www.googleapis.com/auth/trace.append",
                ],
                // Add more configurations as needed
            },
            // Add more configurations as needed
        })

    }
}
