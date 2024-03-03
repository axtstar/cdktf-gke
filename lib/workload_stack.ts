import { Construct } from "constructs"

import { manifest, provider } from '@cdktf/provider-kubernetes/lib'

import { GKEAuth } from 'cdktf-gke-auth'
import { Common } from "./common"
import { GoogleStack } from "./google_stack"

export class WorkloadStack extends GoogleStack {

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const _auth = new GKEAuth(this, "gke-auth", {
            clusterName: Common.get_cluster(),
            location: Common.get_location(),
            projectId: Common.get_project_id(),
        })

        // ワークロード
        this.create_workload(scope = this, id, _auth)
    }

    create_workload(
        scope: any,
        id: string,
        auth: GKEAuth
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
                    name: Common.get_workload_name(),
                    namespace: 'default',
                    labels: {
                        app: Common.get_workload_name()
                    }
                },
                spec: {
                    replicas: Common.pool_node_count(),
                    selector: {
                        matchLabels: {
                            app: Common.get_workload_name(),
                        },
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: Common.get_workload_name(),
                            },
                        },
                        spec: {
                            containers: [
                                {
                                    name: Common.get_workload_name(),
                                    image: Common.get_container_image(),
                                    imagePullPolicy: 'IfNotPresent',
                                    resources: {
                                        requests: {
                                            "nvidia.com/gpu": 1,
                                            cpu: '1000m',
                                            memory: '6Gi',
                                        },
                                        limits: {
                                            "nvidia.com/gpu": 1,
                                        }
                                    },
                                    env: [
                                        { name: "GPUID", value: "0" }
                                    ]
                                },
                            ],
                            nodeSelector: {
                                "cloud.google.com/gke-nodepool": Common.get_nodepool_name()
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
                        app: Common.get_workload_name()
                    }
                },
                spec: {
                    scaleTargetRef: {
                        apiVersion: 'apps/v1',
                        kind: 'Deployment',
                        name: Common.get_workload_name(),
                    },
                    minReplicas: 1,
                    maxReplicas: Common.pool_total_max_node_count(),
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
                        {
                            // supported values: "ContainerResource", "External", "Object", "Pods", "Resource"
                            type: 'External',
                            external: {
                                metric: {
                                    name: 'prometheus.googleapis.com|DCGM_FI_DEV_GPU_UTIL|gauge',
                                    selector: {
                                        matchLabels: {
                                            "resource.labels.project_id": Common.get_project_id(),
                                            "resource.labels.cluster": Common.get_cluster(),
                                            "resource.labels.exported_namespace": "default",
                                            "metric.labels.exported_container": Common.get_workload_name(),
                                        }
                                    }
                                },
                                target: {
                                    type: 'AverageValue',
                                    averageValue: '80',
                                }
                            },
                        },
                    ],
                },
            },
        })

    }
}
