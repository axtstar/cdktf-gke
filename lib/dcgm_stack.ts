// DCGM エクスポータである DCGM-Exporter をインストール
// DCGM-Exporter は、NVIDIA の GPU のメトリクスを Prometheus にエクスポートするためのエクスポータです。

// Path: lib/cluster-autoscaler.ts

import { Construct } from "constructs"
import { GoogleStack } from "./google_stack"
import { manifest, provider } from "@cdktf/provider-kubernetes"

import { GKEAuth } from 'cdktf-gke-auth'
import { Common } from "./common"

export class DcgmExporterStack extends GoogleStack {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        const _auth = new GKEAuth(this, "gke-auth", {
            clusterName: Common.get_cluster(),
            location: Common.get_location(),
            projectId: Common.get_project_id(),
        })


        const kubernetesProvider = new provider.KubernetesProvider(this, `dcgm-exporter`,
            { ..._auth.authCredentials, alias: `dcgm-exporter` })

        // nvidia-dcgm のインストール
        new manifest.Manifest(this, `daemonset-nvidia-dcgm`, {
            provider: kubernetesProvider, // Your Kubernetes provider
            manifest: {
                apiVersion: 'apps/v1',
                kind: 'DaemonSet',
                metadata: {
                    name: 'nvidia-dcgm',
                    namespace: 'gmp-public',
                    labels: {
                        app: 'nvidia-dcgm'
                    }
                },
                spec: {
                    selector: {
                        matchLabels: {
                            app: 'nvidia-dcgm',
                        },
                    },
                    updateStrategy: {
                        type: 'RollingUpdate',
                    },
                    template: {
                        metadata: {
                            labels: {
                                name: 'nvidia-dcgm',
                                app: 'nvidia-dcgm',
                            },
                        },
                        spec: {
                            affinity: {
                                nodeAffinity: {
                                    requiredDuringSchedulingIgnoredDuringExecution: {
                                        nodeSelectorTerms: [
                                            {
                                                matchExpressions: [
                                                    {
                                                        key: 'cloud.google.com/gke-accelerator',
                                                        operator: 'Exists',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                            tolerations: [{ operator: 'Exists' }],
                            volumes: [
                                {
                                    name: 'nvidia-install-dir-host',
                                    hostPath: { path: '/home/kubernetes/bin/nvidia' }
                                },

                            ],
                            hostNetwork: true,
                            containers: [
                                {
                                    image: 'nvcr.io/nvidia/cloud-native/dcgm:3.3.0-1-ubuntu22.04',
                                    command: ["nv-hostengine", "-n", "-b", "ALL"],
                                    ports: [
                                        {
                                            containerPort: 5555,
                                            protocol: 'TCP'
                                        }
                                    ],
                                    name: 'nvidia-dcgm',
                                    securityContext: {
                                        privileged: true,
                                    },
                                    volumeMounts: [
                                        {
                                            mountPath: '/usr/local/nvidia',
                                            name: 'nvidia-install-dir-host',
                                        },
                                    ],
                                }
                            ]
                        }
                    }
                }
            }
        })

        // DCGM-Exporter のインストール
        new manifest.Manifest(this, `Deployment-dcgm-exporter`, {
            provider: kubernetesProvider, // Your Kubernetes provider
            manifest: {
                apiVersion: 'apps/v1',
                kind: 'DaemonSet',
                metadata: {
                    name: 'nvidia-dcgm-exporter',
                    namespace: 'gmp-public',
                    labels: {
                        'app.kubernetes.io/name': 'nvidia-dcgm-exporter',
                    },
                },
                spec: {
                    selector: {
                        matchLabels: {
                            'app.kubernetes.io/name': 'nvidia-dcgm-exporter',
                        },
                    },
                    updateStrategy: {
                        type: 'RollingUpdate',
                    },
                    template: {
                        metadata: {
                            labels: {
                                'app.kubernetes.io/name': 'nvidia-dcgm-exporter',
                            },
                        },
                        spec: {
                            affinity: {
                                nodeAffinity: {
                                    requiredDuringSchedulingIgnoredDuringExecution: {
                                        nodeSelectorTerms: [{
                                            matchExpressions: [{
                                                key: 'cloud.google.com/gke-accelerator',
                                                operator: 'Exists',
                                            }],
                                        }],
                                    },
                                },
                            },
                            tolerations: [{
                                operator: 'Exists',
                            }],
                            volumes: [
                                {
                                    name: 'nvidia-dcgm-exporter-metrics',
                                    configMap: {
                                        name: 'nvidia-dcgm-exporter-metrics',
                                    },
                                },
                                {
                                    name: 'nvidia-install-dir-host',
                                    hostPath: {
                                        path: '/home/kubernetes/bin/nvidia',
                                    },
                                },
                                {
                                    name: 'pod-resources',
                                    hostPath: {
                                        path: '/var/lib/kubelet/pod-resources',
                                    },
                                },
                            ],
                            containers: [
                                {
                                    name: 'nvidia-dcgm-exporter',
                                    image: 'nvcr.io/nvidia/k8s/dcgm-exporter:3.3.0-3.2.0-ubuntu22.04',
                                    command: ['/bin/bash', '-c'],
                                    args: ['hostname $NODE_NAME; dcgm-exporter --remote-hostengine-info $(NODE_IP):5555 --collectors /etc/dcgm-exporter/counters.csv'],
                                    ports: [{
                                        name: 'metrics',
                                        containerPort: 9400,
                                    }],
                                    securityContext: {
                                        privileged: true,
                                    },
                                    env: [
                                        {
                                            name: 'NODE_NAME',
                                            valueFrom: {
                                                fieldRef: {
                                                    fieldPath: 'spec.nodeName',
                                                },
                                            },
                                        },
                                        {
                                            name: 'DCGM_EXPORTER_KUBERNETES_GPU_ID_TYPE',
                                            value: 'device-name',
                                        },
                                        {
                                            name: 'LD_LIBRARY_PATH',
                                            value: '/usr/local/nvidia/lib64',
                                        },
                                        {
                                            name: 'NODE_IP',
                                            valueFrom: {
                                                fieldRef: {
                                                    fieldPath: 'status.hostIP',
                                                },
                                            },
                                        },
                                        {
                                            name: 'DCGM_EXPORTER_KUBERNETES',
                                            value: 'true',
                                        },
                                        {
                                            name: 'DCGM_EXPORTER_LISTEN',
                                            value: ':9400',
                                        },
                                    ],
                                    volumeMounts: [
                                        {
                                            name: 'nvidia-dcgm-exporter-metrics',
                                            mountPath: '/etc/dcgm-exporter',
                                            readOnly: true,
                                        },
                                        {
                                            name: 'nvidia-install-dir-host',
                                            mountPath: '/usr/local/nvidia',
                                        },
                                        {
                                            name: 'pod-resources',
                                            mountPath: '/var/lib/kubelet/pod-resources',
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            }
        })


        new manifest.Manifest(this, 'nvidia-dcgm-exporter-metrics', {
            provider: kubernetesProvider,
            manifest: {
                apiVersion: 'v1',
                kind: 'ConfigMap',
                metadata: {
                    name: 'nvidia-dcgm-exporter-metrics',
                    namespace: 'gmp-public',
                },
                data: {
                    'counters.csv': `
# Utilization (the sample period varies depending on the product),,
DCGM_FI_DEV_GPU_UTIL, gauge, GPU utilization (in %).
DCGM_FI_DEV_MEM_COPY_UTIL, gauge, Memory utilization (in %).

# Temperature and power usage,,
DCGM_FI_DEV_GPU_TEMP, gauge, Current temperature readings for the device in degrees C.
DCGM_FI_DEV_MEMORY_TEMP, gauge, Memory temperature for the device.
DCGM_FI_DEV_POWER_USAGE, gauge, Power usage for the device in Watts.

# Utilization of IP blocks,,
DCGM_FI_PROF_SM_ACTIVE, gauge, The ratio of cycles an SM has at least 1 warp assigned
DCGM_FI_PROF_SM_OCCUPANCY, gauge, The fraction of resident warps on a multiprocessor
DCGM_FI_PROF_PIPE_TENSOR_ACTIVE, gauge, The ratio of cycles the tensor (HMMA) pipe is active (off the peak sustained elapsed cycles)
DCGM_FI_PROF_PIPE_FP64_ACTIVE, gauge, The fraction of cycles the FP64 (double precision) pipe was active.
DCGM_FI_PROF_PIPE_FP32_ACTIVE, gauge, The fraction of cycles the FP32 (single precision) pipe was active.
DCGM_FI_PROF_PIPE_FP16_ACTIVE, gauge, The fraction of cycles the FP16 (half precision) pipe was active.

# Memory usage,,
DCGM_FI_DEV_FB_FREE, gauge, Framebuffer memory free (in MiB).
DCGM_FI_DEV_FB_USED, gauge, Framebuffer memory used (in MiB).
DCGM_FI_DEV_FB_TOTAL, gauge, Total Frame Buffer of the GPU in MB.

# PCIE,,
DCGM_FI_PROF_PCIE_TX_BYTES, gauge, Total number of bytes transmitted through PCIe TX
DCGM_FI_PROF_PCIE_RX_BYTES, gauge, Total number of bytes received through PCIe RX

# NVLink,,
DCGM_FI_PROF_NVLINK_TX_BYTES, gauge, The number of bytes of active NvLink tx (transmit) data including both header and payload.
DCGM_FI_PROF_NVLINK_RX_BYTES, gauge, The number of bytes of active NvLink rx (read) data including both header and payload.`,
                },
            }
        })

        // PodMonitoring
        new manifest.Manifest(this, 'nvidia-dcgm-exporter-monitoring', {
            provider: kubernetesProvider,
            manifest: {
                apiVersion: 'monitoring.googleapis.com/v1',
                kind: 'PodMonitoring',
                metadata: {
                    name: 'nvidia-dcgm-exporter',
                    namespace: 'gmp-public',
                    labels: {
                        'app.kubernetes.io/name': 'nvidia-dcgm-exporter',
                        'app.kubernetes.io/part-of': 'google-cloud-managed-prometheus',
                    },
                },
                spec: {
                    selector: {
                        matchLabels: {
                            'app.kubernetes.io/name': 'nvidia-dcgm-exporter',
                        },
                    },
                    endpoints: [
                        {
                            port: 'metrics',
                            interval: '30s',
                        },
                    ],
                },
            }
        })

    }
}