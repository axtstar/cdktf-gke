import { Construct } from "constructs"

import { manifest, provider } from '@cdktf/provider-kubernetes/lib'

import { GKEAuth } from 'cdktf-gke-auth'
import { Common } from "./common"
import { GoogleStack } from "./google_stack"
import { ComputeAddress } from '../.gen/providers/google/compute-address'

export class ServiceStack extends GoogleStack {

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const _auth = new GKEAuth(this, "gke-auth", {
            clusterName: Common.get_cluster(),
            location: Common.get_location(),
            projectId: Common.get_project_id(),
        })

        // サービス
        this.create_service(scope = this, id, _auth)
    }

    create_service(
        scope: any,
        id: string,
        auth: GKEAuth
    ): void {

        const kubernetesProvider = new provider.KubernetesProvider(scope, `provider`,
            { ...auth.authCredentials, alias: `provider` })

        // 固定IP指定
        const staticIpName = Common.get_ip_name()
        const globalAddress = new ComputeAddress(this, 'compute_address', {
            name: staticIpName,
            project: Common.get_project_id(),
            region: Common.get_region(),
        })

        // Service設定
        new manifest.Manifest(this, id, {
            provider: kubernetesProvider, // Your Kubernetes provider
            manifest: {
                apiVersion: 'v1',
                kind: 'Service',
                metadata: {
                    name: Common.get_service_name(),
                    namespace: 'default',
                },
                spec: {
                    type: 'LoadBalancer', // Serviceの種類をLoadBalancerに設定
                    loadBalancerIP: globalAddress.address, // バインドしたいIPアドレスを指定
                    ports: [
                        {
                            port: 80,
                            targetPort: 3000,
                            protocol: 'TCP',
                        },
                    ],
                    selector: {
                        app: Common.get_workload_name(),
                    },
                },
            },
        })

    }
}
