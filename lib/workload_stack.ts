import { Construct } from "constructs"

import { manifest, provider } from '@cdktf/provider-kubernetes/lib'

import { GKEAuth } from 'cdktf-gke-auth'
import { Common } from "./common"
import { GoogleStack } from "./google_stack"

interface WorkloadStackOptions {
    nodeSelector: string
    name: string
    podCount: number
    maxPodCount: number
    networkTag: string
    containerImage: string
    resourceRequest?: {}
    resourceLimit?: {},
    env?: [{}]
}

export class WorkloadStack extends GoogleStack {

    constructor(scope: Construct, id: string, options: WorkloadStackOptions) {
        super(scope, id);

        const _auth = new GKEAuth(this, "gke-auth", {
            clusterName: Common.get_cluster(),
            location: Common.get_location(),
            projectId: Common.get_project_id(),
        })

        // ワークロード
        this.create_workload(scope = this, id, _auth, options)
    }

    create_workload(
        scope: any,
        id: string,
        auth: GKEAuth,
        options: WorkloadStackOptions
    ): void {

        const kubernetesProvider = new provider.KubernetesProvider(scope, `provider`,
            { ...auth.authCredentials, alias: `provider` })

        // ワークロード
        new manifest.Manifest(scope, id, {
            fieldManager: {
                forceConflicts: true,
            },
            provider: kubernetesProvider, // Your Kubernetes provider
            manifest: {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                metadata: {
                    name: options.name,
                    namespace: 'default',
                    labels: {
                        app: options.name,
                        networkTag: options.networkTag,
                    }
                },
                spec: {
                    replicas: options.podCount,
                    selector: {
                        matchLabels: {
                            app: options.name,
                        },
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: options.name,
                            },
                        },
                        spec: {
                            containers: [
                                {
                                    name: options.name,
                                    image: options.containerImage,
                                    imagePullPolicy: 'IfNotPresent',
                                    resources: {
                                        ...options.resourceRequest,
                                        ...options.resourceLimit,
                                    },
                                    env: options.env,
                                },
                            ],
                            nodeSelector: {
                                "cloud.google.com/gke-nodepool": options.nodeSelector
                            },
                        },
                    },
                },
            },
        })

        // 水平Pod自動スケーリング（HPA）設定
        new manifest.Manifest(scope, `hpa`, {
            fieldManager: {
                forceConflicts: true,
            },
            provider: kubernetesProvider, // Your Kubernetes provider
            manifest: {
                apiVersion: 'autoscaling/v2',
                kind: 'HorizontalPodAutoscaler',
                metadata: {
                    name: `hpa`,
                    namespace: 'default',
                    labels: {
                        app: options.name
                    }
                },
                spec: {
                    scaleTargetRef: {
                        apiVersion: 'apps/v1',
                        kind: 'Deployment',
                        name: options.name,
                    },
                    minReplicas: 1,
                    maxReplicas: options.maxPodCount,
                    metrics: [
                        {
                            type: 'Resource',
                            resource: {
                                name: 'cpu',
                                target: {
                                    type: 'Utilization',
                                    averageUtilization: 80,
                                },
                            },
                        },
                        {
                            type: 'Resource',
                            resource: {
                                name: 'memory',
                                target: {
                                    type: 'Utilization',
                                    averageUtilization: 80,
                                },
                            },
                        },
                    ],
                },
            },
        })

    }
}
