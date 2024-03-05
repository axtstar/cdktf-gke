import { Construct } from "constructs"

import { manifest, provider } from '@cdktf/provider-kubernetes/lib'

import { GKEAuth } from 'cdktf-gke-auth'
import { Common } from "./common"
import { GoogleStack } from "./google_stack"
import { ComputeAddress } from '../.gen/providers/google/compute-address'

interface ServiceStackOptions {
    name: string,
    bindIp: string,
    workloadName: string,
    targetPort: number
}

export class ServiceStack extends GoogleStack {

    constructor(scope: Construct, id: string, options: ServiceStackOptions) {
        super(scope, id);

        const _auth = new GKEAuth(this, "gke-auth", {
            clusterName: Common.get_cluster(),
            location: Common.get_location(),
            projectId: Common.get_project_id(),
        })

        // サービス
        this.create_service(scope = this, id, _auth, options)
    }

    create_service(
        scope: any,
        id: string,
        auth: GKEAuth,
        options: ServiceStackOptions
    ): void {

        const kubernetesProvider = new provider.KubernetesProvider(scope, `provider`,
            { ...auth.authCredentials, alias: `provider` })

        // 固定IP指定
        let loadBalancerIP = {}
        if (options.bindIp != "") {
            const staticIpName = options.bindIp
            const globalAddress = new ComputeAddress(this, 'compute_address', {
                name: staticIpName,
                project: Common.get_project_id(),
                region: Common.get_region(),
            })
            loadBalancerIP = { loadBalancerIP: globalAddress.address }
        }

        // Service設定
        new manifest.Manifest(this, id, {
            provider: kubernetesProvider, // Your Kubernetes provider
            manifest: {
                apiVersion: 'v1',
                kind: 'Service',
                metadata: {
                    name: options.name,
                    namespace: 'default',
                },
                spec: {
                    type: 'LoadBalancer', // Serviceの種類をLoadBalancerに設定
                    // バインドしたいIPアドレスを指定
                    ...loadBalancerIP,
                    // Serviceのポート設定
                    ports: [
                        {
                            port: 80,
                            targetPort: options.targetPort,
                            protocol: 'TCP',
                        },
                    ],
                    selector: {
                        app: options.workloadName,
                    },
                },
            },
        })

    }
}
