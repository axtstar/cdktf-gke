import { Construct } from "constructs"

import { ContainerNodePool } from '../.gen/providers/google/container-node-pool'
import { Common } from "./common"
import { GoogleStack } from "./google_stack"

interface NodePoolStackOptions {
    poolName: string
    nodeCount: number
    totalMaxNodeCount: number
    totalMinNodeCount: number
    gpuName: string
    machineType: string
    tags: string[]
}

export class NodePoolStack extends GoogleStack {

    constructor(scope: Construct, id: string, options: NodePoolStackOptions) {
        super(scope, id);

        // ノードプール設定
        this.create_nodePool(this, id, options)
    }


    /**
     * ノードプールを構築する
     * @param scope 
     */
    create_nodePool(scope: any, id: string, options: NodePoolStackOptions) {

        // GPUの指定
        let gpu: any = {}
        if (options.gpuName != "") {
            gpu = {
                imageType: "COS_CONTAINERD",
                guestAccelerator: [
                    {
                        count: 1,
                        type: options.gpuName,
                        gpuDriverInstallationConfig: [{ gpuDriverVersion: "LATEST", }],
                        gpuPartitionSize: "",
                        gpuSharingConfig: [],
                    },
                ],
            }
        }

        // ノードプール設定
        new ContainerNodePool(scope, id, {
            project: Common.get_project_id(),
            name: options.poolName,
            location: Common.get_location(),
            cluster: Common.get_cluster(),
            nodeCount: options.nodeCount,
            nodeLocations: [Common.get_location()],
            autoscaling: {
                totalMaxNodeCount: options.totalMaxNodeCount,
                totalMinNodeCount: options.totalMinNodeCount,
            },
            nodeConfig: {
                machineType: options.machineType, // マシンタイプ
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
                tags: options.tags,
                // Add more configurations as needed
            },
            // Add more configurations as needed
        })

    }
}
