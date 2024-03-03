import { Construct } from "constructs"
import { GoogleStack } from "./google_stack"

import { ContainerCluster } from '../.gen/providers/google/container-cluster'
import { Common } from "./common"

export class ClusterStack extends GoogleStack {

    constructor(scope: Construct, id: string) {
        super(scope, id);

        // クラスタ設定

        // モニタリング設定
        let mc: any = {}
        mc = {
            monitoringConfig: {
                // マネージドプロメテウスモニタリング有効化
                managedPrometheus: { enabled: true },
                enableComponents: ["SYSTEM_COMPONENTS", "DAEMONSET", "DEPLOYMENT", "HPA", "POD"],
            }
        }

        // ネットワーク設定
        let network: any = {}
        if (Common.get_network() != "") {
            network = {
                network: Common.get_network(),
                subnetwork: Common.get_subnetwork(),
            }
        }

        // リソースラベルの設定
        // リソースラベルが設定されている場合は、リソースラベルを設定する
        // .envに下記のような形で設定されているものを展開する
        // resource_labels=key=value|key=value|key=value
        let rl = {}
        if (Common.get_resource_labels() != "") {
            const result = Common.get_resource_labels().split("|").reduce((obj: { [key: string]: string }, key) => {
                const target = key.split("=")
                const _key = target[0]
                const _value = target[1]
                obj[_key] = _value
                return obj
            }, {})

            rl = {
                resourceLabels: {
                    ...result
                }
            }
        }

        // クラスタ構築
        new ContainerCluster(this, id, {
            project: Common.get_project_id(),
            name: Common.get_cluster(),
            location: Common.get_location(),
            initialNodeCount: 0,
            enableL4IlbSubsetting: true,
            // デフォルトのノードプールを削除
            removeDefaultNodePool: true,
            // ネットワーク設定を展開
            ...network,
            // モニタリング設定を展開
            ...mc,
            // リソースラベル設定を展開
            ...rl,
            // Add more configurations as needed
        })
    }
}
