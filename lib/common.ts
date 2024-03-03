import 'dotenv/config'

export class Common {
    // =====汎用設定=====

    /**
     * 環境名を取得する
     * @returns
     */
    static get_env() {
        return process.env.env!
    }

    /**
     * GCPのプロジェクトIDを取得する
     */
    static get_project_id() {
        return process.env.project_id!
    }

    /**
     * GCPのロケーションを取得する
     */
    static get_location() {
        return process.env.location!
    }

    /**
     * GCPのリージョンを取得する
     */
    static get_region() {
        return process.env.region!
    }

    /**
     * GCPのネットワークを取得する
     */
    static get_network() {
        return process.env.network || ""
    }

    /**
     * GCPのサブネットワークを取得する
     */
    static get_subnetwork() {
        return process.env.subnetwork || ""
    }

    /**
     * GCPのリソースラベルを取得する
     */
    static get_resource_labels() {
        return process.env.resource_labels || ""
    }

    // =====クラスタ構築=====

    /**
     * クラスタ名を取得する
     */
    static get_cluster() {
        return process.env.cluster!
    }


    // =====ノードプール設定=====

    static get_nodepool_name() {
        return process.env.nodepool_name!
    }

    /**
     * nodepoolで使用するマシンタイプを取得する
     * @returns 
     */
    static get_machine_name() {
        return process.env.machine_name!
    }

    /**
     * nodepoolで使用するGPUタイプを取得する
     * @returns 
     */
    static get_gpu_name() {
        return process.env.gpu_name || ""
    }

    /**
     * terraformの状態を保存するバケット名を取得する
     * @returns 
     */
    static get_bucket_name() {
        return process.env.bucket_name!
    }

    /**
     * terraformの状態を保存するGCSへのプレフィックスを取得する
     * @returns 
     */
    static get_backend_prefix() {
        return process.env.backend_prefix!
    }

    /**
     * nodepoolの起動ノード数を取得する
     * @returns 
     */
    static pool_node_count(): number {
        return Number(process.env.pool_node_count) || 0
    }

    /**
     * オートスケール時の最大ノード数を取得する
     * @returns 
     */
    static pool_total_max_node_count(): number {
        return Number(process.env.pool_total_max_node_count) || 0
    }

    /**
     * オートスケール時の最小ノード数を取得する
     * @returns 
     */
    static pool_total_min_node_count(): number {
        return Number(process.env.pool_total_min_node_count) || 0
    }

    // =====サービス設定=====
    static get_service_name(): string {
        return process.env.service_name!
    }

    static get_ip_name(): string {
        return process.env.ip_name!
    }

    // =====ワークロード設定=====

    static get_workload_name(): string {
        return process.env.workload_name!
    }

    /**
     * コンテナイメージを取得する
     * @returns 
     */
    static get_container_image(): string {
        return process.env.container_image!
    }

}